"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { generateCampaignVariants, DEFAULT_HOLIDAY } from "@/lib/ace-mock";
import {
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";

function ArtPreview({ variant: v, uploaded }: { variant: any; uploaded: string | null }) {
  if (!v) return null;
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-card" style={{ background: v.art.bg }}>
      {uploaded && <img src={uploaded} alt="Imagem enviada" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      {uploaded && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
      <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur">
        <Sparkles size={11} /> {v.art.tag}
      </div>
      <div className="absolute inset-x-6 bottom-6">
        {!uploaded && <div className="text-[64px] leading-none drop-shadow-lg">{v.art.icon}</div>}
        <div className="mt-3 text-2xl font-extrabold leading-tight text-white drop-shadow-md">{v.headline}</div>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-zinc-900">
          {v.discount} · {v.coupon}
        </div>
      </div>
    </div>
  );
}

function ChannelToggle({
  icon, label, detail, on, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border p-3 transition ${on ? "border-transparent bg-gradient-brand-soft" : "border-border/60 bg-background/30"}`}>
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-card text-foreground">{icon}</div>
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground">{detail}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 rounded-full transition ${on ? "bg-gradient-brand" : "bg-secondary"}`}
        aria-label={`Toggle ${label}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function GeradorPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"loading" | "ready">("loading");
  const [variant, setVariant] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [igOn, setIgOn] = useState(true);
  const [waOn, setWaOn] = useState(true);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [holiday] = useState<any>(() => {
    if (typeof window === "undefined") return DEFAULT_HOLIDAY;
    const stored = sessionStorage.getItem("ace.selectedHoliday");
    if (stored) { try { return JSON.parse(stored); } catch { /* empty */ } }
    return DEFAULT_HOLIDAY;
  });

  const [variants] = useState<any[]>(() => generateCampaignVariants(holiday));

  useEffect(() => {
    const t = setTimeout(() => setStage("ready"), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const img = sessionStorage.getItem("ace.uploadedImage");
    if (img) setUploaded(img);
  }, []);

  const regen = () => {
    setRegenerating(true);
    setTimeout(() => { setVariant((v) => (v + 1) % variants.length); setRegenerating(false); }, 900);
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setUploaded(url);
      sessionStorage.setItem("ace.uploadedImage", url);
    };
    reader.readAsDataURL(f);
  };

  const removeImage = () => {
    setUploaded(null);
    sessionStorage.removeItem("ace.uploadedImage");
    if (fileRef.current) fileRef.current.value = "";
  };

  const proceed = () => {
    sessionStorage.setItem("ace.variant", String(variant));
    router.push("/aprovar");
  };

  const v = variants[variant] || variants[0];

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
              Etapa 2 de 4 · Estúdio de Criação
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {stage === "loading" ? (
                <span className="inline-flex items-center gap-3">
                  <Wand2 className="text-gradient-brand animate-pulse" />
                  IA gerando sua campanha...
                </span>
              ) : (
                <span className="inline-flex items-center gap-3">
                  <Check className="text-[oklch(0.74_0.18_145)]" />
                  Campanha pronta!
                </span>
              )}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{holiday.nome} · {holiday.data}</p>
          </div>
          {stage === "ready" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-3 py-1.5 text-xs font-semibold">
              <Sparkles size={12} /> Gerado por IA em 4 segundos
            </span>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Preview */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
              {stage === "loading" ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary">
                  <div className="shimmer absolute inset-0" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand animate-gradient-shift">
                        <Wand2 className="text-white" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Analisando {holiday.audience?.toLocaleString("pt-BR")} contatos e gerando criativo...
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={`${variant}-${uploaded ? "u" : "n"}`} className={`animate-float-up ${regenerating ? "opacity-50" : ""}`}>
                  <ArtPreview variant={v} uploaded={uploaded} />
                </div>
              )}
              <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Legenda</div>
                <p className="mt-2 text-base leading-relaxed">
                  {stage === "loading" ? <span className="inline-block h-4 w-3/4 rounded bg-secondary shimmer" /> : v.copy}
                </p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Upload */}
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <ImagePlus size={14} /> Sua imagem (Teste para IA)
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />
              {uploaded ? (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-border/60">
                    <img src={uploaded} alt="Pré-visualização" className="h-32 w-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs font-semibold hover:bg-card">
                      <Upload size={12} /> Trocar
                    </button>
                    <button onClick={removeImage} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                      <Trash2 size={12} /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-background/30 px-4 py-6 text-center transition hover:border-primary/60 hover:bg-card">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand-soft">
                    <Upload size={18} />
                  </div>
                  <div className="text-sm font-semibold">Envie uma imagem</div>
                  <div className="text-[11px] text-muted-foreground">JPG ou PNG · será combinada à postagem</div>
                </button>
              )}
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Canais selecionados</div>
              <div className="space-y-3">
                <ChannelToggle icon={<Camera size={18} />} label="Instagram" detail="Post no feed + Stories" on={igOn} onChange={setIgOn} />
                <ChannelToggle icon={<MessageCircle size={18} />} label="WhatsApp" detail="Mensagem personalizada" on={waOn} onChange={setWaOn} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={regen} disabled={stage !== "ready" || regenerating} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-5 py-3 text-sm font-semibold transition hover:bg-card disabled:opacity-50">
                <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
                Gerar nova variante
              </button>
              <button onClick={proceed} disabled={stage !== "ready"} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-3.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] disabled:opacity-50">
                Aprovar e publicar
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
