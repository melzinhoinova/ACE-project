"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { generateCampaignVariants, DEFAULT_HOLIDAY } from "@/lib/ace-mock";
import { ArrowRight, Bookmark, Camera, Check, CheckCheck, Heart, MessageCircle, Send } from "lucide-react";

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="rounded-[44px] border-[10px] border-zinc-800 bg-zinc-900 p-2 shadow-card">
        <div className="overflow-hidden rounded-[34px] bg-black">{children}</div>
      </div>
    </div>
  );
}

function InstagramMock({ variant, uploaded }: { variant: any; uploaded: string | null }) {
  if (!variant) return null;
  const v = variant;
  return (
    <div className="bg-black text-white">
      <div className="flex items-center justify-between px-3 py-2 text-[11px]">
        <span className="font-semibold">9:41</span>
        <span>•••</span>
      </div>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="h-7 w-7 rounded-full bg-gradient-brand p-[1.5px]">
          <div className="grid h-full w-full place-items-center rounded-full bg-black text-[10px] font-bold">GN</div>
        </div>
        <div className="flex-1 text-xs">
          <div className="font-semibold">@gruponexusvendas</div>
          <div className="text-[10px] text-white/60">Patrocinado</div>
        </div>
        <span className="text-white/60">•••</span>
      </div>
      <div className="relative aspect-square w-full" style={{ background: v.art.bg }}>
        {uploaded && <img src={uploaded} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
        {uploaded && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
        <div className="absolute left-4 top-4 rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest backdrop-blur">{v.art.tag}</div>
        <div className="absolute inset-x-4 bottom-4">
          {!uploaded && <div className="text-4xl drop-shadow">{v.art.icon}</div>}
          <div className="mt-1 text-lg font-extrabold leading-tight drop-shadow">{v.headline}</div>
          <div className="mt-2 inline-flex rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-zinc-900">{v.discount} · {v.coupon}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-2">
        <Heart size={20} /><MessageCircle size={20} /><Send size={20} /><Bookmark size={20} className="ml-auto" />
      </div>
      <div className="px-3 pb-3 text-xs">
        <div className="font-semibold">2.847 curtidas</div>
        <div className="mt-1 leading-snug"><span className="font-semibold">@gruponexusvendas</span> {v.copy}</div>
        <div className="mt-1 text-[10px] text-white/50">há 2 minutos</div>
      </div>
    </div>
  );
}

function WhatsappMock({ holiday, variant }: { holiday: any; variant: any }) {
  if (!holiday || !variant) return null;
  return (
    <div className="bg-[#0b141a] text-white">
      <div className="flex items-center gap-2 bg-[#1f2c33] px-3 py-2.5">
        <div className="h-8 w-8 rounded-full bg-gradient-brand grid place-items-center text-[10px] font-bold">GN</div>
        <div className="text-xs">
          <div className="font-semibold">Grupo Nexus Vendas</div>
          <div className="text-[10px] text-white/60">online</div>
        </div>
      </div>
      <div className="space-y-2 p-3" style={{ backgroundImage: "radial-gradient(circle at 20% 0%, rgba(123,47,190,0.08), transparent 60%)", minHeight: 340 }}>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#005c4b] p-2.5 text-xs leading-relaxed">
          Olá, Maria! {variant.art.icon} Temos uma oferta especial para você no {holiday.nome}.
          <div className="mt-2 rounded-xl bg-black/30 p-2">
            <div className="text-[10px] uppercase tracking-widest text-white/60">Cupom exclusivo</div>
            <div className="text-base font-bold text-gradient-brand">{variant.coupon}</div>
            <div className="text-[10px] text-white/70">{variant.discount} · válido até {holiday.data}</div>
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-white/70">
            09:01 <CheckCheck size={12} className="text-[#53bdeb]" />
          </div>
        </div>
        <div className="ml-auto max-w-[60%] rounded-2xl rounded-tr-sm bg-[#005c4b] p-2.5 text-xs">
          Quer ver as sugestões mais amadas? 💝
          <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-white/70">
            09:01 <CheckCheck size={12} className="text-[#53bdeb]" />
          </div>
        </div>
        <div className="text-center text-[10px] text-white/40">Enviado para {holiday.audience?.toLocaleString("pt-BR")} contatos</div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${active ? "bg-gradient-brand text-white" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function Stat({ label, value, sub, ok, pulse }: { label: string; value: string; sub: string; ok?: boolean; pulse?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        {ok && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[oklch(0.74_0.18_145)]"><Check size={10} /> OK</span>}
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gradient-brand opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-brand" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"ig" | "wa">("ig");
  const [variantIdx, setVariantIdx] = useState(0);
  const [uploaded, setUploaded] = useState<string | null>(null);

  const [holiday] = useState<any>(() => {
    if (typeof window === "undefined") return DEFAULT_HOLIDAY;
    const stored = sessionStorage.getItem("ace.selectedHoliday");
    if (stored) { try { return JSON.parse(stored); } catch { /* empty */ } }
    return DEFAULT_HOLIDAY;
  });

  const activeVariant = useMemo(() => {
    const generated = generateCampaignVariants(holiday);
    return generated[variantIdx] || generated[0];
  }, [holiday, variantIdx]);

  useEffect(() => {
    const v = sessionStorage.getItem("ace.variant");
    if (v) setVariantIdx(Number(v));
    const img = sessionStorage.getItem("ace.uploadedImage");
    if (img) setUploaded(img);
  }, []);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.74_0.18_145/0.35)] bg-[oklch(0.74_0.18_145/0.1)] px-3 py-1 text-xs font-semibold text-[oklch(0.74_0.18_145)]">
              <Check size={12} /> Campanha ativa
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sua campanha já está <span className="text-gradient-brand">no ar</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Veja como ela aparece em cada canal. Publicado há 2 minutos.</p>
          </div>
          <button onClick={() => router.push("/sucesso")} className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01]">
            Ver resultados <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="mt-8 inline-flex rounded-full border border-border/60 bg-card/40 p-1">
          <TabBtn active={tab === "ig"} onClick={() => setTab("ig")}><Camera size={14} /> Instagram</TabBtn>
          <TabBtn active={tab === "wa"} onClick={() => setTab("wa")}><MessageCircle size={14} /> WhatsApp</TabBtn>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div key={tab} className="animate-float-up">
            <PhoneFrame>
              {tab === "ig" ? <InstagramMock variant={activeVariant} uploaded={uploaded} /> : <WhatsappMock holiday={holiday} variant={activeVariant} />}
            </PhoneFrame>
          </div>
          <div className="space-y-4">
            <Stat label="Status" value={tab === "ig" ? "Publicado" : "Enviado"} sub={tab === "ig" ? "Post + 3 Stories" : `${holiday.audience?.toLocaleString("pt-BR")} destinatários`} ok />
            <Stat label="Engajamento inicial" value={tab === "ig" ? "2.847 curtidas" : "412 leituras"} sub="primeiros 2 minutos" />
            <Stat label="Cliques no cupom" value="87" sub="e subindo em tempo real" pulse />
          </div>
        </div>
      </main>
    </div>
  );
}
