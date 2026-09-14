"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AceLogo } from "./AceLogo";
import { Bell, Menu, Search, X, Calendar, Wand2, Zap, Camera, BarChart3, ChevronLeft, ChevronRight, LogOut, User as UserIcon, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useGeneration } from "@/app/generation-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STEPS = [
  { to: "/radar", label: "Radar", icon: Calendar },
  { to: "/gerador", label: "Estúdio de Criação", icon: Wand2 },
  { to: "/aprovar", label: "Automação", icon: Zap },
  { to: "/sucesso", label: "Resultados", icon: BarChart3 },
] as const;

interface AppShellProps {
  children: React.ReactNode;
}

export function TopBar({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, profile, logout } = useAuth();
  const { isGenerating, showSuccessToast, dismissToast } = useGeneration();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background w-full max-w-full overflow-x-hidden">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-300 ease-in-out lg:flex ${isCollapsed ? "w-20 px-3 py-6" : "w-64 p-6"}`}>
        {/* Brand Logo & Collapse Toggle */}
        <div className={`flex items-center pb-6 border-b border-border/40 ${isCollapsed ? "flex-col gap-4 justify-center" : "justify-between"}`}>
          <Link href="/radar" className="flex items-center gap-2">
            <AceLogo size="sm" onlyRocket={isCollapsed} />
            {!isCollapsed && <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground">Studio</span>}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="grid h-8 w-8 place-items-center rounded-xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-card/40 transition-all active:scale-95"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Steps */}
        <nav className="flex flex-col gap-2 mt-8 flex-1">
          {STEPS.map((s) => {
            const active = pathname === s.to;
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                href={s.to}
                title={isCollapsed ? s.label : undefined}
                className={`flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                  active
                    ? "bg-gradient-brand text-white shadow-card glow-brand"
                    : "text-muted-foreground hover:bg-card/40 hover:text-foreground"
                }`}
              >
                <Icon size={18} className={`${active ? "text-white" : "text-muted-foreground"} ${s.to === "/gerador" && isGenerating ? "animate-spin" : ""}`} />
                {!isCollapsed && <span>{s.label}</span>}
                {s.to === "/gerador" && isGenerating && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions & User Profile */}
        <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-border/40">
          {/* Notifications */}
          {/* <button 
            title={isCollapsed ? "Notificações" : undefined}
            className={`flex items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold text-muted-foreground hover:bg-card/40 hover:text-foreground transition-all ${isCollapsed ? "justify-center px-0" : "px-4"}`}
          >
            <div className="relative">
              <Bell size={18} />
              {isCollapsed && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-gradient-brand animate-pulse" />}
            </div>
            {!isCollapsed && (
              <>
                <span>Notificações</span>
                <span className="ml-auto h-2 w-2 rounded-full bg-gradient-brand animate-pulse" />
              </>
            )}
          </button> */}

          {/* User Profile Info */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`flex items-center gap-3 w-full rounded-2xl border border-border/80 bg-card/40 text-left transition-all hover:bg-card/80 active:scale-[0.98] cursor-pointer outline-none ${isCollapsed ? "justify-center p-2" : "p-3"}`}
                  title={isCollapsed ? `${profile?.company_name || user.email}` : undefined}
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Logo da empresa" 
                      className="h-9 w-9 shrink-0 rounded-full object-cover border border-border/60"
                    />
                  ) : (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-white uppercase">
                      {(profile?.company_name || user.email || "M")[0]}
                    </div>
                  )}
                  {!isCollapsed && (
                    <div className="text-xs leading-tight truncate flex-1">
                      <div className="font-semibold text-foreground truncate">{profile?.company_name || "Minha Empresa"}</div>
                      <div className="text-muted-foreground truncate text-[10px]">{user.email}</div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/60 bg-card/90 backdrop-blur-md">
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Minha Empresa</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem asChild className="rounded-xl focus:bg-secondary/60 focus:text-foreground cursor-pointer">
                  <Link href="/perfil" className="flex items-center gap-2 py-2 w-full">
                    <UserIcon size={14} />
                    <span>Configurações do Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {profile?.role === "Administrador" && (
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-secondary/60 focus:text-foreground cursor-pointer">
                    <Link href="/admin" className="flex items-center gap-2 py-2 w-full">
                      <ShieldCheck size={14} />
                      <span>Gestão & Convites (Admin)</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem 
                  onClick={logout} 
                  className="rounded-xl focus:bg-red-500/10 focus:text-red-500 text-red-500 font-semibold cursor-pointer flex items-center gap-2 py-2"
                >
                  <LogOut size={14} />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={`p-2 ${isCollapsed ? "text-center" : ""}`}>
              <Link href="/login" className="text-xs font-bold text-brand hover:underline">
                Fazer Login
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* HEADER FOR MOBILE & TABLET */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-16 items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-4">
          <Link href="/radar" className="shrink-0">
            <AceLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border/80 text-muted-foreground hover:text-foreground">
              <Bell size={16} />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-gradient-brand" />
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer outline-none">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Logo" 
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white uppercase">
                        {(profile?.company_name || user.email || "M")[0]}
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/60 bg-card/90 backdrop-blur-md">
                  <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{profile?.company_name || "Minha Empresa"}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-secondary/60 cursor-pointer">
                    <Link href="/perfil" className="flex items-center gap-2 py-2 w-full">
                      <UserIcon size={14} />
                      <span>Configurações do Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === "Administrador" && (
                    <DropdownMenuItem asChild className="rounded-xl focus:bg-secondary/60 cursor-pointer">
                      <Link href="/admin" className="flex items-center gap-2 py-2 w-full">
                        <ShieldCheck size={14} />
                        <span>Gestão & Convites (Admin)</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="rounded-xl focus:bg-red-500/10 focus:text-red-500 text-red-500 font-semibold cursor-pointer flex items-center gap-2 py-2"
                  >
                    <LogOut size={14} />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="text-xs font-bold text-brand hover:underline">
                Login
              </Link>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-border/80 text-muted-foreground hover:text-foreground"
              aria-label="Abrir menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {open && (
          <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
            <nav className="mx-auto flex flex-col gap-1 px-4 py-3">
              {STEPS.map((s) => {
                const active = pathname === s.to;
                const Icon = s.icon;
                return (
                  <Link
                    key={s.to}
                    href={s.to}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gradient-brand text-white glow-brand"
                        : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                    }`}
                  >
                    <Icon size={16} className={`${active ? "text-white" : "text-muted-foreground"} ${s.to === "/gerador" && isGenerating ? "animate-spin" : ""}`} />
                    <span>{s.label}</span>
                    {s.to === "/gerador" && isGenerating && (
                      <span className="ml-auto flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out pb-20 lg:pb-0 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {children}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border/80 bg-background/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {STEPS.map((s) => {
          const active = pathname === s.to;
          const Icon = s.icon;
          return (
            <Link
              key={s.to}
              href={s.to}
              className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
                active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`${active ? "text-primary stroke-[2.5]" : "text-muted-foreground"} ${
                    s.to === "/gerador" && isGenerating ? "animate-spin text-primary" : ""
                  }`}
                />
                {s.to === "/gerador" && isGenerating && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-tight ${active ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                {s.label === "Estúdio de Criação" ? "Estúdio" : s.label}
              </span>
              {active && (
                <span className="h-0.5 w-4 rounded-full bg-gradient-brand" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* FLOATING SUCCESS NOTIFICATION TOAST */}
      {showSuccessToast && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-card/95 p-3.5 shadow-2xl backdrop-blur-xl animate-float-up max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="flex flex-col pr-1 min-w-0">
            <div className="text-xs font-bold text-foreground truncate">Campanha com IA Concluída!</div>
            <div className="text-[11px] text-muted-foreground truncate">O novo criativo está pronto.</div>
          </div>
          <button
            onClick={() => {
              dismissToast();
              router.push("/gerador");
            }}
            className="shrink-0 rounded-xl bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-card hover:scale-105 transition active:scale-95 cursor-pointer"
          >
            Ver
          </button>
          <button
            onClick={dismissToast}
            className="text-muted-foreground hover:text-foreground p-1 transition cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
