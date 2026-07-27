"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AceLogo } from "./AceLogo";
import { Bell, Menu, Search, X, Calendar, Wand2, Zap, Camera, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ACE_USER } from "@/lib/ace-mock";

const STEPS = [
  { to: "/radar", label: "Radar", icon: Calendar },
  { to: "/gerador", label: "Estúdio de Criação", icon: Wand2 },
  { to: "/aprovar", label: "Automação", icon: Zap },
  { to: "/feed", label: "Feed", icon: Camera },
  { to: "/sucesso", label: "Resultados", icon: BarChart3 },
] as const;

interface AppShellProps {
  children: React.ReactNode;
}

export function TopBar({ children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-300 ease-in-out lg:flex ${isCollapsed ? "w-20 px-3 py-6" : "w-64 p-6"}`}>
        {/* Brand Logo & Collapse Toggle */}
        <div className={`flex items-center pb-6 border-b border-border/40 ${isCollapsed ? "flex-col gap-4 justify-center" : "justify-between"}`}>
          <Link href="/radar" className="flex items-center gap-2">
            <AceLogo size="sm" />
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
                <Icon size={18} className={active ? "text-white" : "text-muted-foreground"} />
                {!isCollapsed && <span>{s.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions & User Profile */}
        <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-border/40">
          {/* Notifications */}
          <button 
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
          </button>

          {/* User Profile Info */}
          <div 
            className={`flex items-center gap-3 rounded-2xl border border-border/80 bg-card/40 transition-all ${isCollapsed ? "justify-center p-2" : "p-3"}`}
            title={isCollapsed ? `${ACE_USER.firstName} (${ACE_USER.company})` : undefined}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-white">
              {ACE_USER.firstName[0]}
            </div>
            {!isCollapsed && (
              <div className="text-xs leading-tight truncate">
                <div className="font-semibold text-foreground truncate">{ACE_USER.firstName}</div>
                <div className="text-muted-foreground truncate">{ACE_USER.company}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* HEADER FOR MOBILE & TABLET */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-16 items-center justify-between gap-6 px-6 py-4">
          <Link href="/radar" className="shrink-0">
            <AceLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border/80 text-muted-foreground hover:text-foreground">
              <Bell size={16} />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-gradient-brand" />
            </button>
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
                    <Icon size={16} className={active ? "text-white" : "text-muted-foreground"} />
                    <span>{s.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {children}
      </div>
    </div>
  );
}
