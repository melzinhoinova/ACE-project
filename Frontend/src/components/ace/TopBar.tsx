"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AceLogo } from "./AceLogo";
import { Bell, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { ACE_USER } from "@/lib/ace-mock";

const STEPS = [
  { to: "/radar", label: "Radar" },
  { to: "/gerador", label: "Estúdio de Criação" },
  { to: "/aprovar", label: "Automação" },
  { to: "/feed", label: "Feed" },
  { to: "/sucesso", label: "Resultados" },
] as const;

export function TopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/radar" className="shrink-0">
          <AceLogo size="sm" />
        </Link>
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-card/40 p-1">
          {STEPS.map((s) => {
            const active = pathname === s.to;
            return (
              <Link
                key={s.to}
                href={s.to}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gradient-brand text-white shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden sm:grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground">
            <Search size={16} />
          </button>
          <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground">
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gradient-brand" />
          </button>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-card/40 py-1 pl-1 pr-3">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white">
              {ACE_USER.firstName[0]}
            </div>
            <div className="text-xs leading-tight">
              <div className="font-semibold">{ACE_USER.firstName}</div>
              <div className="text-muted-foreground">{ACE_USER.company}</div>
            </div>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
            aria-label="Abrir menu"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {STEPS.map((s) => {
              const active = pathname === s.to;
              return (
                <Link
                  key={s.to}
                  href={s.to}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-gradient-brand text-white"
                      : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
