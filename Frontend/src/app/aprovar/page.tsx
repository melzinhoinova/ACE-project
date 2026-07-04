"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { generateCampaignVariants, DEFAULT_HOLIDAY } from "@/lib/ace-mock";
import { ArrowLeft, ArrowRight, Calendar, Camera, Loader2, MessageCircle, Shield, Tag, Users, Zap } from "lucide-react";

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand-soft text-foreground">{icon}</div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export default function AprovarPage() {
  const router = useRouter();
  const [autonomous, setAutonomous] = useState(true);
  const [loading, setLoading] = useState(false);

  const [holiday] = useState<any>(() => {
    if (typeof window === "undefined") return DEFAULT_HOLIDAY;
    const stored = sessionStorage.getItem("ace.selectedHoliday");
    if (stored) { try { return JSON.parse(stored); } catch { /* empty */ } }
    return DEFAULT_HOLIDAY;
  });

  const [variantIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const stored = sessionStorage.getItem("ace.variant");
    return stored ? Number(stored) : 0;
  });

  const activeVariant = useMemo(() => {
    const generated = generateCampaignVariants(holiday);
    return generated[variantIndex] || generated[0];
  }, [holiday, variantIndex]);

  const preHolidayDate = useMemo(() => {
    try {
      const [d, m, y] = holiday.data.split("/").map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() - 2);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return holiday.data; }
  }, [holiday.data]);

  const activate = () => {
    setLoading(true);
    setTimeout(() => router.push("/feed"), 1100);
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
          Etapa 3 de 4 · Aprovação
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-center">
          Confirme e ative a <span className="text-gradient-brand">Publicação Automática</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          A IA fará tudo por você, mas você está sempre no controle. Revise o resumo e dispare a campanha.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-border/60 bg-card p-6 lg:col-span-3 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumo da campanha</div>
            <div className="mt-4 space-y-3">
              <SummaryRow icon={<Calendar size={16} />} label="Data" value={`${holiday.nome} — ${holiday.data}`} />
              <SummaryRow icon={<Users size={16} />} label="Alcance estimado" value={`${holiday.audience?.toLocaleString("pt-BR")} contatos`} />
              <SummaryRow icon={<Camera size={16} />} label="Canal 1" value="Instagram — Post + Stories" />
              <SummaryRow icon={<MessageCircle size={16} />} label="Canal 2" value="WhatsApp — Mensagem personalizada" />
              <SummaryRow icon={<Tag size={16} />} label="Desconto" value={`${activeVariant.discount} · Cupom ${activeVariant.coupon}`} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className={`rounded-3xl p-[1.5px] transition ${autonomous ? "bg-gradient-brand animate-gradient-shift" : "bg-border"}`}>
              <div className="rounded-3xl bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <Shield size={12} /> Modo de publicação
                    </div>
                    <div className="mt-2 text-xl font-bold">{autonomous ? "Publicação Autorizada" : "Publicação Manual"}</div>
                  </div>
                  <button
                    onClick={() => setAutonomous((v) => !v)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${autonomous ? "bg-gradient-brand" : "bg-secondary"}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${autonomous ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {autonomous ? "Agendado para" : "Publicar manualmente em"}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <input type="text" defaultValue={preHolidayDate} className="w-32 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <span className="text-muted-foreground">às</span>
                    <input type="text" defaultValue="09:00" className="w-24 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button onClick={activate} disabled={loading} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-4 text-sm font-bold text-white shadow-card transition hover:scale-[1.01] disabled:opacity-70">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Ativando...</> : <><Zap size={16} /> Publicar Campanha <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></>}
              </button>
              <Link href="/gerador" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-5 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                <ArrowLeft size={14} /> Editar campanha
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
