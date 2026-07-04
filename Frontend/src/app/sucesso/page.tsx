"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { DEFAULT_HOLIDAY } from "@/lib/ace-mock";
import { ArrowRight, DollarSign, Eye, LucideRocket, MousePointerClick, Sparkles, X } from "lucide-react";

function useCounter(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function Metric({
  icon, label, value, sub, delay, pulse, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  delay: number;
  pulse?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`animate-float-up rounded-3xl p-[1.5px] ${highlight ? "bg-gradient-brand animate-gradient-shift" : "bg-border"}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="rounded-3xl bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand-soft">{icon}</div>
          {pulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gradient-brand opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-brand" />
            </span>
          )}
        </div>
        <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 text-4xl font-extrabold tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

export default function SucessoPage() {
  const router = useRouter();

  const [holiday] = useState<any>(() => {
    if (typeof window === "undefined") return DEFAULT_HOLIDAY;
    const stored = sessionStorage.getItem("ace.selectedHoliday");
    if (stored) { try { return JSON.parse(stored); } catch { /* empty */ } }
    return DEFAULT_HOLIDAY;
  });

  const ticketVal = useMemo(() => {
    return Number(holiday.ticket?.replace(/\D/g, "")) || 200;
  }, [holiday.ticket]);

  const targetReach = holiday.audience;
  const targetClicks = Math.round(holiday.audience * 0.07);
  const targetConv = Math.round(holiday.audience * 0.018);

  const reach = useCounter(targetReach);
  const clicks = useCounter(targetClicks, 1800);
  const conv = useCounter(targetConv, 2000);

  const estimatedSales = useMemo(() => conv * ticketVal, [conv, ticketVal]);

  const [share, setShare] = useState(false);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand animate-gradient-shift shadow-card">
            <LucideRocket className="text-white" size={32} />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Campanha no <span className="text-gradient-brand">ar!</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground">Sua IA já está trabalhando por você.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Metric icon={<Eye />} label="Alcance" value={reach.toLocaleString("pt-BR")} sub="pessoas impactadas" delay={0} />
          <Metric icon={<MousePointerClick />} label="Cliques" value={clicks.toString()} sub="e subindo..." delay={100} pulse />
          <Metric icon={<DollarSign />} label="Conversões estimadas" value={conv.toString()} sub={`≈ R$ ${estimatedSales.toLocaleString("pt-BR")} em vendas`} delay={200} highlight />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => router.push("/radar")} className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01]">
            Voltar ao Radar <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </button>
          <button onClick={() => setShare(true)} className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-6 py-3.5 text-sm font-semibold transition hover:bg-card">
            <Sparkles size={16} /> Compartilhar resultados
          </button>
        </div>
      </main>

      {share && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-float-up">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest">
                  <Sparkles size={11} /> Compartilhar
                </div>
                <h3 className="mt-3 text-xl font-bold">Resultado da campanha</h3>
                <p className="mt-1 text-sm text-muted-foreground">Envie um snapshot para sua equipe.</p>
              </div>
              <button onClick={() => setShare(false)} className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Slack", "E-mail", "Link"].map((c) => (
                <button key={c} className="rounded-2xl border border-border/60 bg-background/40 p-4 text-sm font-semibold hover:bg-card">{c}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
