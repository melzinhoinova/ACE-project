"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { generateCampaignVariants, DEFAULT_HOLIDAY } from "@/lib/ace-mock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ArrowRight,
  Box,
  Camera,
  Check,
  Cpu,
  Film,
  ImagePlus,
  Paintbrush,
  Palette,
  PenTool,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";

function ArtPreview({ 
  variant: v, 
  uploaded, 
  generated 
}: { 
  variant: any; 
  uploaded: string | null; 
  generated: string | null; 
}) {
  if (!v) return null;
  const imageSrc = (generated ? `data:image/png;base64,${generated}` : null) || uploaded;
  
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-card" style={{ background: v.art.bg }}>
      {imageSrc && <img src={imageSrc} alt="Imagem da campanha" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      {imageSrc && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
      <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur">
        <Sparkles size={11} /> {v.art.tag}
      </div>
      <div className="absolute inset-x-6 bottom-6">
        {!imageSrc && <div className="text-[64px] leading-none drop-shadow-lg">{v.art.icon}</div>}
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

const ESTILOS_IA = [
  { id: "Fotorrealista", label: "Fotorrealista", desc: "Foto comercial de estúdio, luz suave", icon: Camera },
  { id: "Minimalista", label: "Minimalista", desc: "Cenário limpo, cores pastéis", icon: Sparkles },
  { id: "Vibrante", label: "Vibrante", desc: "Cores vivas e alto contraste", icon: Zap },
  { id: "Cyberpunk", label: "Cyberpunk", desc: "Neon, fundo escuro futurista", icon: Cpu },
  { id: "CGI 3D", label: "Render 3D / CGI", desc: "Animação 3D moderna e detalhada", icon: Box },
  { id: "Vintage", label: "Vintage / Retrô", desc: "Estilo analógico, grão de filme clássico", icon: Film },
  { id: "Aquarela", label: "Artístico / Aquarela", desc: "Pintura clássica em tela", icon: Paintbrush },
  { id: "Vetor", label: "Design Vetorial / Flat", desc: "Ilustração vetorial bidimensional clean", icon: PenTool }
];

export default function GeradorPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "loading" | "ready">("idle");
  const [variant, setVariant] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [igOn, setIgOn] = useState(true);
  const [uploadedList, setUploadedList] = useState<string[]>([]);
  const [generated, setGenerated] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  
  const [detalhes, setDetalhes] = useState("");
  const [estilo, setEstilo] = useState("Fotorrealista");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [holiday] = useState<any>(() => {
    if (typeof window === "undefined") return DEFAULT_HOLIDAY;
    const stored = sessionStorage.getItem("ace.selectedHoliday");
    if (stored) { try { return JSON.parse(stored); } catch { /* empty */ } }
    return DEFAULT_HOLIDAY;
  });

  const [variants] = useState<any[]>(() => generateCampaignVariants(holiday));

  const fetchCampaign = async (customDetalhes?: string, customEstilo?: string, filesToUse?: File[]) => {
    setStage("loading");
    try {
      const formData = new FormData();
      formData.append("nicho", holiday.nome);
      formData.append(
        "objetivo", 
        `Campanha promocional de ${holiday.nome} com cupom ${holiday.coupon || 'PROMO'} oferecendo desconto especial.`
      );
      
      const activeDetalhes = customDetalhes !== undefined ? customDetalhes : detalhes;
      const activeEstilo = customEstilo !== undefined ? customEstilo : estilo;
      const activeFiles = filesToUse !== undefined ? filesToUse : filesToUpload;

      if (activeDetalhes) {
        formData.append("detalhes", activeDetalhes);
      }
      if (activeEstilo) {
        formData.append("estilo", activeEstilo);
      }
      if (activeFiles && activeFiles.length > 0) {
        activeFiles.forEach((file) => {
          formData.append("imagens", file);
        });
      }

      const res = await fetch("http://127.0.0.1:8000/api/campanha", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.detail || `Erro ${res.status} ao gerar campanha.`;
        throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
      }

      const data = await res.json();
      setGenerated(data.imagem_instagram);
      setGeneratedCopy(data.legenda_instagram);
      
      sessionStorage.setItem("ace.generatedImage", data.imagem_instagram);
      sessionStorage.setItem("ace.generatedCopy", data.legenda_instagram);
      
      setStage("ready");
    } catch (err: any) {
      console.error("Erro ao gerar campanha:", err);
      alert(`Erro ao gerar campanha:\n${err.message || "Verifique o terminal do backend."}`);
      setStage("idle");
    }
  };

  useEffect(() => {
    // Remove as imagens de referência anteriores do cache para evitar que fiquem órfãs ao recarregar a página
    sessionStorage.removeItem("ace.uploadedImages");
    sessionStorage.removeItem("ace.uploadedImage");
    setUploadedList([]);
    setFilesToUpload([]);
    
    const storedGenImg = sessionStorage.getItem("ace.generatedImage");
    const storedGenCopy = sessionStorage.getItem("ace.generatedCopy");
    if (storedGenImg && storedGenCopy) {
      setGenerated(storedGenImg);
      setGeneratedCopy(storedGenCopy);
      setStage("ready");
    } else {
      setStage("idle");
    }
  }, []);

  const regen = () => {
    setRegenerating(true);
    fetchCampaign(detalhes, estilo, filesToUpload).finally(() => {
      setVariant((v) => (v + 1) % variants.length);
      setRegenerating(false);
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    // Acumula com os arquivos já existentes, limitando a 3
    const combined = [...filesToUpload, ...newFiles].slice(0, 3);
    
    // Lê todos os arquivos combinados como base64 para preview
    const readPromises = combined.map((file) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      })
    );

    Promise.all(readPromises).then((urls) => {
      setFilesToUpload(combined);
      setUploadedList(urls);
      sessionStorage.setItem("ace.uploadedImages", JSON.stringify(urls));
      sessionStorage.setItem("ace.uploadedImage", urls[0]);
    });

    // Reseta o input para permitir selecionar os mesmos arquivos novamente
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const newFiles = filesToUpload.filter((_, i) => i !== index);
    const newUrls = uploadedList.filter((_, i) => i !== index);
    setFilesToUpload(newFiles);
    setUploadedList(newUrls);
    
    sessionStorage.setItem("ace.uploadedImages", JSON.stringify(newUrls));
    if (newUrls.length > 0) {
      sessionStorage.setItem("ace.uploadedImage", newUrls[0]);
    } else {
      sessionStorage.removeItem("ace.uploadedImage");
      sessionStorage.removeItem("ace.generatedImage");
      setGenerated(null);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const proceed = () => {
    sessionStorage.setItem("ace.variant", String(variant));
    router.push("/aprovar");
  };

  const v = variants[variant] || variants[0];

  return (
    <TopBar>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
              Etapa 2 de 4 · Estúdio de Criação
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {stage === "idle" ? (
                <span className="inline-flex items-center gap-3">
                  <Wand2 className="text-gradient-brand" />
                  Configure sua campanha
                </span>
              ) : stage === "loading" ? (
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
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Preview */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
              {stage === "idle" ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary/30 border border-dashed border-border/80 flex flex-col items-center justify-center p-6 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-card text-muted-foreground shadow-sm animate-float-up">
                    <Wand2 size={28} className="text-primary/60" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">Crie sua Campanha</h3>
                  <p className="mt-2 text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                    Escreva suas ideias, selecione o estilo visual e clique em <strong>Gerar Criativo com IA</strong> no painel de configuração para começar.
                  </p>
                </div>
              ) : stage === "loading" ? (
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
                <div key={`${variant}-${uploadedList.length > 0 ? "u" : "n"}`} className={`animate-float-up ${regenerating ? "opacity-50" : ""}`}>
                  <ArtPreview variant={v} uploaded={uploadedList.length > 0 ? uploadedList[0] : null} generated={generated} />
                </div>
              )}
              <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Legenda</div>
                <div className="mt-2 text-base leading-relaxed">
                  {stage === "idle" ? (
                    <span className="italic text-sm text-muted-foreground">Nenhuma legenda gerada ainda. Configure os parâmetros ao lado e clique em Gerar.</span>
                  ) : stage === "loading" ? (
                    <span className="inline-block h-4 w-3/4 rounded bg-secondary shimmer" />
                  ) : (
                    generatedCopy || v.copy
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Custom inputs */}
            <div className="rounded-3xl border border-border/60 bg-card p-5 space-y-5 shadow-card">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Sparkles size={14} className="text-primary" /> Ideias da Campanha (Opcional)
                </div>
                <textarea
                  value={detalhes}
                  onChange={(e) => setDetalhes(e.target.value)}
                  placeholder="Ex: Destacar que o produto é 100% orgânico e tem embalagem sustentável..."
                  className="w-full min-h-[90px] rounded-2xl border border-border/60 bg-background/30 p-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition resize-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Palette size={14} className="text-primary" /> Estilo Visual da Imagem
                </div>
                <Select value={estilo} onValueChange={(val) => setEstilo(val)}>
                  <SelectTrigger className="w-full h-12 rounded-2xl border border-border/60 bg-background/30 px-4 focus:ring-1 focus:ring-primary focus:outline-none flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const selectedEst = ESTILOS_IA.find(e => e.id === estilo);
                        if (!selectedEst) return <span className="text-sm text-muted-foreground">Selecione um estilo...</span>;
                        const SelectedIcon = selectedEst.icon;
                        return (
                          <>
                            <div className="grid h-6 w-6 place-items-center rounded-md bg-secondary text-primary">
                              <SelectedIcon size={12} />
                            </div>
                            <span className="text-sm font-semibold text-foreground">{selectedEst.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-card">
                    {ESTILOS_IA.map((est) => {
                      const IconComponent = est.icon;
                      return (
                        <SelectItem
                          key={est.id}
                          value={est.id}
                          className="rounded-xl px-3 py-2 cursor-pointer transition focus:bg-secondary/80 hover:bg-secondary/80"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-primary">
                              <IconComponent size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{est.label}</span>
                              <span className="text-[10px] text-muted-foreground leading-tight">{est.desc}</span>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border/40 pt-4">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <ImagePlus size={14} className="text-primary" /> Imagens de Referência (Opcional, máx. 3)
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                
                {uploadedList.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedList.map((url, idx) => (
                        <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border border-border/60 group">
                          <img src={url} alt={`Referência ${idx + 1}`} className="h-full w-full object-cover animate-fade-in" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition duration-150"
                            title="Remover imagem"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      {uploadedList.length < 3 && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/60 bg-background/30 hover:border-primary/60 hover:bg-card transition"
                        >
                          <Upload size={14} className="text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground font-semibold">Adicionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-background/30 px-4 py-5 text-center transition hover:border-primary/60 hover:bg-card">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-brand-soft">
                      <Upload size={14} />
                    </div>
                    <div className="text-xs font-semibold">Envie imagens do produto (máx. 3)</div>
                    <div className="text-[10px] text-muted-foreground">PNG ou JPG · para guiar a IA mantendo o original</div>
                  </button>
                )}
              </div>

              <div className="border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={regen}
                  disabled={stage === "loading" || regenerating}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-50 shadow-card"
                >
                  <Wand2 size={15} className={(stage === "loading" || regenerating) ? "animate-spin" : ""} />
                  {generated ? "Atualizar Criativo com IA" : "Gerar Criativo com IA"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Canais selecionados</div>
              <div className="space-y-3">
                <ChannelToggle icon={<Camera size={18} />} label="Instagram" detail="Post no feed + Stories" on={igOn} onChange={setIgOn} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={proceed} 
                disabled={stage !== "ready" || !generated} 
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-3.5 text-sm font-semibold text-white shadow-card transition hover:scale-[1.01] disabled:opacity-50"
              >
                Aprovar e publicar
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </TopBar>
  );
}
