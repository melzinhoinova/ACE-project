"use client";

import Link from "next/link";
import { AceLogo } from "@/components/ace/AceLogo";
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col justify-between">
      {/* Elementos Decorativos de Fundo */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-16 top-10 h-[60vw] w-[60vw] max-h-[480px] max-w-[480px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div
          className="absolute right-0 top-1/3 h-[70vw] w-[70vw] max-h-[520px] max-w-[520px] rounded-full bg-brand-soft/15 blur-[120px] animate-pulse"
          style={{ animationDelay: "1.2s" }}
        />
        <div className="absolute bottom-0 left-1/4 h-[50vw] w-[50vw] max-h-[360px] max-w-[360px] rounded-full bg-emerald-500/5 blur-[100px] animate-pulse" />
      </div>

      {/* Header Fino */}
      <header className="relative z-10 mx-auto max-w-6xl w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AceLogo size="sm" />
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition"
          >
            Acessar Conta
          </Link>
          <Link 
            href="/cadastro" 
            className="rounded-2xl border border-border/80 bg-card/40 px-6 py-2.5 text-xs font-bold transition hover:bg-card/85"
          >
            Cadastrar Empresa
          </Link>
        </div>
      </header>

      {/* Seção Principal (Hero) */}
      <div className="relative z-10 mx-auto max-w-4xl w-full px-6 py-12 flex flex-col items-center text-center my-auto space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3.5 py-2 text-xs text-muted-foreground animate-float-up">
          <Sparkles size={12} className="text-gradient-brand animate-pulse" />
          AutoSales Camp Engine
        </div>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl max-w-3xl animate-float-up" style={{ animationDelay: "80ms" }}>
          Potencialize as vendas da sua <span className="text-gradient-brand">marca de bebidas</span>.
        </h1>
        
        <p className="max-w-xl text-base sm:text-lg text-muted-foreground animate-float-up" style={{ animationDelay: "160ms" }}>
          O ACE automatiza o planejamento de campanhas, gera copies e prompts altamente assertivos, e integra tudo ao Instagram Graph Engine de forma simples.
        </p>

        {/* Botões de Ação Centralizados com Padding Aumentado */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center pt-4 animate-float-up" style={{ animationDelay: "240ms" }}>
          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-brand px-8 sm:px-12 py-4 text-sm font-bold text-white shadow-card transition duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-brand-soft/20 text-center"
          >
            Entrar na Plataforma <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-border bg-card/50 px-8 sm:px-12 py-4 text-sm font-bold backdrop-blur transition duration-300 hover:bg-card/80 hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            Criar Conta da Empresa
          </Link>
        </div>

        {/* Mini Seção de Recursos (Cards com Hover Suave) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full pt-12 animate-float-up" style={{ animationDelay: "320ms" }}>
          {[
            { icon: Zap, title: "Automação", desc: "Campanhas geradas e publicadas em minutos." },
            { icon: BarChart3, title: "Analytics", desc: "Monitore curtidas, alcance e visitas de perfil." },
            { icon: ShieldCheck, title: "Integração Meta", desc: "Conexão oficial e segura com sua API." }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="rounded-3xl border border-border/40 bg-card/30 p-6 text-left space-y-3 transition-all duration-300 hover:scale-[1.03] hover:bg-card/65 hover:border-brand/40 shadow-xs cursor-default">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand-soft shadow-inner">
                  <Icon size={18} className="text-brand animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-foreground">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-8 border-t border-border/20 text-[11px] uppercase tracking-widest text-muted-foreground/50">
        ACE v1.0 · Cachaçarias e Destilarias Inteligentes
      </footer>
    </main>
  );
}
