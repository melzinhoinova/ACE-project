"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/ace/TopBar";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ArrowRight,
  Box,
  Calendar,
  Camera,
  Check,
  Cpu,
  Film,
  ImagePlus,
  Info,
  Loader2,
  Paintbrush,
  Palette,
  Pencil,
  PenTool,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap,
  Tag,
  Shuffle,
} from "lucide-react";
import { CampaignReference, fetchReferences, getApiBaseUrl } from "@/lib/references-api";
import { useGeneration } from "@/app/generation-context";

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const MAX_PRODUCTS = 6;

function ArtPreview({ 
  holiday,
  uploaded, 
  generated,
  stage
}: { 
  holiday: any;
  uploaded: string | null; 
  generated: string | null; 
  stage: "idle" | "loading" | "ready";
}) {
  const imageSrc = (generated?.startsWith("http") ? generated : (generated ? `data:image/png;base64,${generated}` : null)) || uploaded;
  
  if (stage === "idle" && !imageSrc) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card/40 p-6 flex flex-col items-center justify-center text-center shadow-card">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand-soft text-brand mb-4 shadow-sm animate-float-up">
          <Wand2 size={28} className="text-primary" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary mb-2">
          {holiday?.nome || "Nova Campanha"}
        </div>
        <h4 className="text-base font-bold text-foreground">Aguardando geração com IA</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
          Configure as ideias e o estilo estético ao lado e clique em <strong>Gerar Criativo com IA</strong> para criar a arte e a legenda.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-card bg-gradient-brand">
      {imageSrc ? (
        <img src={imageSrc} alt="Imagem da campanha" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-card/80 backdrop-blur">
          <Loader2 className="animate-spin mb-3 text-white" size={32} />
          <span className="text-sm font-semibold">Gerando arte da campanha...</span>
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      {imageSrc && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />}
      <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur">
        <Sparkles size={11} /> {holiday?.nome || "Campanha Oficial"}
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
  const [regenerating, setRegenerating] = useState(false);
  const [igOn, setIgOn] = useState(true);
  const [uploadedList, setUploadedList] = useState<string[]>([]);
  const [generated, setGenerated] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [isEditingCopy, setIsEditingCopy] = useState(false);
  
  const [detalhes, setDetalhes] = useState("");
  const [estilo, setEstilo] = useState("Fotorrealista");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Referências visuais de estilos
  const [references, setReferences] = useState<CampaignReference[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [textoPromocional, setTextoPromocional] = useState<string>("");

  // Drag-and-drop state
  const [isDraggingOverEmpty, setIsDraggingOverEmpty] = useState(false);
  const [draggingOverIndex, setDraggingOverIndex] = useState<number | null>(null);
  const [isDraggingOverAddSlot, setIsDraggingOverAddSlot] = useState(false);

  const [hasCustomHoliday, setHasCustomHoliday] = useState<boolean>(true);
  const [holiday, setHoliday] = useState<any>(() => {
    if (typeof window === "undefined") return { nome: "Campanha Promocional", data: "" };
    const stored = sessionStorage.getItem("ace.selectedHoliday");
    if (stored) { try { return JSON.parse(stored); } catch { /* empty */ } }
    return { nome: "Campanha Promocional", data: "" };
  });

  const isEveryday = 
    holiday?.id === "dia-a-dia" ||
    holiday?.nome?.toLowerCase().includes("dia a dia") || 
    holiday?.nome?.toLowerCase() === "campanha promocional" || 
    holiday?.nome?.toLowerCase() === "geral";

  const isMountedRef = useRef(true);

  const {
    isGenerating,
    startGeneration,
    cancelGeneration,
    lastResult,
    generationError,
  } = useGeneration();

  const [cancelNotice, setCancelNotice] = useState(false);

  // Sincroniza o estado do gerador com o contexto global
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isGenerating) {
      setStage("loading");
      setRegenerating(true);
    } else {
      setRegenerating(false);
      if (lastResult?.imagem_instagram || sessionStorage.getItem("ace.generatedImage")) {
        setStage("ready");
      }
    }
  }, [isGenerating]);

  // Atualiza imediatamente quando a IA terminar de gerar (mesmo que o usuário tenha ido para o Calendário)
  useEffect(() => {
    if (lastResult) {
      setGenerated(lastResult.imagem_instagram);
      setGeneratedCopy(lastResult.legenda_instagram);
      setStage("ready");
      setRegenerating(false);
    }
  }, [lastResult]);

  // Se houver erro vindo do pipeline
  useEffect(() => {
    if (generationError) {
      alert(`Erro ao gerar campanha:\n${generationError}`);
      setRegenerating(false);
      setStage(generated || lastResult ? "ready" : "idle");
    }
  }, [generationError]);

  const handleCancelGeneration = () => {
    cancelGeneration();
    setCancelNotice(true);
    setTimeout(() => setCancelNotice(false), 5000);
    setStage(generated || lastResult ? "ready" : "idle");
    setRegenerating(false);
  };

  const fetchCampaign = async (customDetalhes?: string, customEstilo?: string, filesToUse?: File[]) => {
    setStage("loading");
    setRegenerating(true);
    try {
      const formData = new FormData();

      formData.append("nicho", "Cachaça Artesanal");
      formData.append(
        "objetivo", 
        isEveryday
          ? "Publicação espontânea de dia a dia e lifestyle para o feed do Instagram, destacando a elegância do produto, o sabor artesanal autêntico da Cachaça Melzinho e momentos de degustação descontraídos."
          : `Campanha promocional com foco em ${holiday?.nome || "data comemorativa"}, destacando os diferenciais do produto e engajamento da marca.`
      );
      if (holiday?.nome && holiday.nome.trim() && !isEveryday) {
        formData.append("evento", holiday.nome.trim());
      }
      if (holiday?.descricao && holiday.descricao.trim() && !isEveryday) {
        formData.append("evento_descricao", holiday.descricao.trim());
      }
      
      const activeDetalhes = customDetalhes !== undefined ? customDetalhes : detalhes;
      const activeEstilo = customEstilo !== undefined ? customEstilo : estilo;
      let activeFiles = filesToUse !== undefined ? filesToUse : filesToUpload;

      // Fallback de segurança: se activeFiles estiver vazio mas uploadedList contiver fotos, restaura para envio
      if ((!activeFiles || activeFiles.length === 0) && uploadedList.length > 0) {
        activeFiles = uploadedList.map((url, idx) =>
          dataURLtoFile(url, `product-${idx + 1}.jpg`)
        );
      }

      if (activeDetalhes) {
        formData.append("detalhes", activeDetalhes);
      }
      if (activeEstilo) {
        formData.append("estilo", activeEstilo);
      }
      if (selectedReferenceId && selectedReferenceId > 0) {
        formData.append("reference_id", String(selectedReferenceId));
      }
      if (textoPromocional && textoPromocional.trim()) {
        formData.append("texto_promocional", textoPromocional.trim());
      }
      if (activeFiles && activeFiles.length > 0) {
        activeFiles.forEach((file) => {
          formData.append("imagens", file);
        });
      }

      await startGeneration(formData, holiday?.nome || "Campanha");
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Geração abortada pelo usuário.");
        setCancelNotice(true);
        setTimeout(() => setCancelNotice(false), 5000);
        setStage(generated || lastResult ? "ready" : "idle");
        setRegenerating(false);
        return;
      }
      console.error("Erro ao gerar campanha:", err);
      setStage(generated || lastResult ? "ready" : "idle");
      setRegenerating(false);
    }
  };

  useEffect(() => {
    const storedHoliday = sessionStorage.getItem("ace.selectedHoliday");
    setHasCustomHoliday(Boolean(storedHoliday));
    if (storedHoliday) {
      try {
        setHoliday(JSON.parse(storedHoliday));
      } catch {
        /* empty */
      }
    }

    // Restaura as imagens enviadas anteriormente sem resetá-las
    const storedUploads = sessionStorage.getItem("ace.uploadedImages");
    if (storedUploads) {
      try {
        const parsed = JSON.parse(storedUploads);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUploadedList(parsed);
          const restoredFiles = parsed.map((url: string, index: number) =>
            dataURLtoFile(url, `restored-product-${index + 1}.jpg`)
          );
          setFilesToUpload(restoredFiles);
        }
      } catch {
        /* empty */
      }
    }

    // Se estiver atualmente gerando no contexto global, entra em modo loading
    if (isGenerating) {
      setStage("loading");
      setRegenerating(true);
    } else {
      const currentGenImg = lastResult?.imagem_instagram || sessionStorage.getItem("ace.generatedImage");
      const currentGenCopy = lastResult?.legenda_instagram || sessionStorage.getItem("ace.generatedCopy");
      if (currentGenImg && currentGenCopy) {
        setGenerated(currentGenImg);
        setGeneratedCopy(currentGenCopy);
        setStage("ready");
      } else {
        setStage("idle");
      }
    }

    fetchReferences(false)
      .then((data) => setReferences(data))
      .catch((err) => console.error("Erro ao carregar referências no gerador:", err));
  }, []);

  const regen = () => {
    setRegenerating(true);
    fetchCampaign(detalhes, estilo, filesToUpload).finally(() => {
      setRegenerating(false);
    });
  };

  // Função auxiliar compartilhada: merge de novos arquivos com os existentes,
  // leitura como base64 e atualização de estado (respeita limite de até MAX_PRODUCTS)
  const handleDroppedFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    let currentFiles = filesToUpload;
    if (currentFiles.length === 0 && uploadedList.length > 0) {
      currentFiles = uploadedList.map((url, idx) =>
        dataURLtoFile(url, `product-${idx + 1}.jpg`)
      );
    }

    if (currentFiles.length + imageFiles.length > MAX_PRODUCTS) {
      alert(`Você pode enviar no máximo ${MAX_PRODUCTS} produtos por campanha.`);
    }

    const combined = [...currentFiles, ...imageFiles].slice(0, MAX_PRODUCTS);

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
  };

  // Substitui uma imagem de referência específica pelo índice
  const handleReplaceAtIndex = (idx: number, file: File) => {
    if (!file.type.startsWith("image/")) return;

    let currentFiles = [...filesToUpload];
    if (currentFiles.length === 0 && uploadedList.length > 0) {
      currentFiles = uploadedList.map((u, i) =>
        dataURLtoFile(u, `product-${i + 1}.jpg`)
      );
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const newFiles = [...currentFiles];
      const newUrls = [...uploadedList];
      newFiles[idx] = file;
      newUrls[idx] = url;
      setFilesToUpload(newFiles);
      setUploadedList(newUrls);
      sessionStorage.setItem("ace.uploadedImages", JSON.stringify(newUrls));
      sessionStorage.setItem("ace.uploadedImage", newUrls[0]);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleDroppedFiles(Array.from(files));
    // Reseta o input para permitir selecionar os mesmos arquivos novamente
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (index: number) => {
    let currentFiles = filesToUpload;
    if (currentFiles.length === 0 && uploadedList.length > 0) {
      currentFiles = uploadedList.map((u, i) =>
        dataURLtoFile(u, `product-${i + 1}.jpg`)
      );
    }
    const newFiles = currentFiles.filter((_, i) => i !== index);
    const newUrls = uploadedList.filter((_, i) => i !== index);
    setFilesToUpload(newFiles);
    setUploadedList(newUrls);
    
    sessionStorage.setItem("ace.uploadedImages", JSON.stringify(newUrls));
    if (newUrls.length > 0) {
      sessionStorage.setItem("ace.uploadedImage", newUrls[0]);
    } else {
      sessionStorage.removeItem("ace.uploadedImage");
      sessionStorage.removeItem("ace.generatedImage");
      sessionStorage.removeItem("ace.originalImageUrl");
      sessionStorage.removeItem("ace.fidelityScore");
      sessionStorage.removeItem("ace.approved");
      setGenerated(null);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const proceed = () => {
    router.push("/aprovar");
  };

  return (
    <TopBar>
      <main className="mx-auto max-w-6xl px-3.5 sm:px-6 py-5 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
              {isEveryday ? (
                <>
                  <Sparkles size={13} className="text-primary" />
                  <span>Modo Dia a Dia · Foco no Produto & Lifestyle</span>
                </>
              ) : (
                <span>Etapa 2 de 4 · Estúdio de Criação</span>
              )}
            </div>
            <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight sm:text-4xl leading-tight">
              {stage === "idle" ? (
                <span className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <Wand2 className="text-primary shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    {isEveryday ? (
                      <>Crie um post casual para o <span className="text-gradient-brand">Feed do Dia a Dia</span></>
                    ) : (
                      <>Crie a campanha para <span className="text-gradient-brand">{holiday.nome}</span></>
                    )}
                  </span>
                </span>
              ) : stage === "loading" ? (
                <span className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <Wand2 className="text-primary animate-pulse shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    {isEveryday ? (
                      <>IA gerando post do dia a dia para <span className="text-gradient-brand">Cachaça Melzinho</span>...</>
                    ) : (
                      <>IA gerando campanha para <span className="text-gradient-brand">{holiday.nome}</span>...</>
                    )}
                  </span>
                </span>
              ) : (
                <span className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <Check className="text-[oklch(0.74_0.18_145)] shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    {isEveryday ? (
                      <>Post pronto para o <span className="text-gradient-brand">Feed do Dia a Dia</span>!</>
                    ) : (
                      <>Campanha pronta para <span className="text-gradient-brand">{holiday.nome}</span>!</>
                    )}
                  </span>
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {stage === "idle"
                ? isEveryday
                  ? "Modo Dia a Dia: Conteúdo espontâneo e lifestyle para valorizar a Cachaça Melzinho no feed, sem depender de datas do calendário."
                  : `Data base: ${holiday.data}. Configure nicho, objetivo e diretrizes para criar sua campanha.`
                : stage === "loading"
                  ? "Analisando estilo de fotografia comercial e gerando criativo com legenda envolvente..."
                  : isEveryday
                    ? "Conteúdo espontâneo gerado com sucesso para o feed da marca."
                    : `Conteúdo estratégico gerado para ${holiday.nome} (${holiday.data}).`}
            </p>

            {isEveryday && (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs text-foreground flex flex-wrap items-center justify-between gap-3 animate-float-up">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-primary flex-shrink-0" />
                  <span>
                    <strong>Publicação Espontânea:</strong> Foco total no produto, degustação, lifestyle e happy hour, sem temas ou adereços de datas comemorativas.
                  </span>
                </div>
                <Link href="/radar" className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition">
                  <Calendar size={13} /> Escolher Data no Calendário
                </Link>
              </div>
            )}

            {!hasCustomHoliday && !isEveryday && (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-foreground flex flex-wrap items-center justify-between gap-3 animate-float-up">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-primary flex-shrink-0" />
                  <span>
                    <strong>Nenhuma oportunidade selecionada no Radar.</strong> Usando modelo padrão: <strong>{holiday.nome}</strong> ({holiday.data}).
                  </span>
                </div>
                <Link href="/radar" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-card hover:scale-[1.02] transition">
                  <Calendar size={14} /> Escolher Data no Radar
                </Link>
              </div>
            )}

            {cancelNotice && (
              <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center gap-2.5 animate-float-up shadow-sm">
                <Info size={16} className="text-amber-400 shrink-0" />
                <span>Geração cancelada pelo usuário. Você pode ajustar nicho, fotos ou estilo e gerar novamente quando quiser.</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Preview */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
              {stage === "idle" ? (
                <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-2xl bg-secondary/30 border border-dashed border-border/80 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                  <div className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-card text-muted-foreground shadow-sm animate-float-up">
                    <Wand2 size={24} className="text-primary/60 sm:hidden" />
                    <Wand2 size={28} className="text-primary/60 hidden sm:block" />
                  </div>
                  <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">Crie sua Campanha</h3>
                  <p className="mt-1 sm:mt-2 text-xs text-muted-foreground max-w-[280px] leading-relaxed">
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
                        Analisando oportunidade e compondo criativo com IA...
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelGeneration}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition active:scale-[0.98] shadow-sm cursor-pointer"
                      >
                        <X size={14} /> Cancelar Geração
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={uploadedList.length > 0 ? "u" : "n"} className={`animate-float-up ${regenerating ? "opacity-50" : ""}`}>
                  <ArtPreview holiday={holiday} uploaded={uploadedList.length > 0 ? uploadedList[0] : null} generated={generated} stage={stage} />
                </div>
              )}
              <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Legenda</div>
                  {(stage === "ready" || generatedCopy) && (
                    <button
                      type="button"
                      onClick={() => setIsEditingCopy((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold text-white shadow-card transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none ${
                        isEditingCopy
                          ? "bg-emerald-600 hover:bg-emerald-500"
                          : "bg-gradient-brand hover:brightness-110"
                      }`}
                      title={isEditingCopy ? "Concluir edição" : "Editar legenda"}
                    >
                      {isEditingCopy ? (
                        <>
                          <Check size={13} className="text-white" />
                          <span>Concluir</span>
                        </>
                      ) : (
                        <>
                          <Pencil size={12} className="text-white" />
                          <span>Editar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="mt-2 text-base leading-relaxed">
                  {stage === "idle" && !generatedCopy ? (
                    <span className="italic text-sm text-muted-foreground">Nenhuma legenda gerada ainda. Configure os parâmetros ao lado e clique em Gerar.</span>
                  ) : stage === "loading" ? (
                    <span className="inline-block h-4 w-3/4 rounded bg-secondary shimmer" />
                  ) : isEditingCopy ? (
                    <div className="mt-1">
                      <textarea
                        value={generatedCopy || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGeneratedCopy(val);
                          sessionStorage.setItem("ace.generatedCopy", val);
                        }}
                        placeholder="Escreva ou edite a legenda da sua publicação..."
                        className="w-full min-h-[110px] rounded-xl border border-primary/50 bg-background/80 p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition resize-y"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-foreground font-normal">
                      {generatedCopy || "Nenhuma legenda gerada."}
                    </p>
                  )}
                </div>
              </div>

              {stage === "ready" && generated && (
                <div className="mt-4 lg:hidden">
                  <button 
                    onClick={proceed} 
                    className="w-full group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-3.5 text-sm font-bold text-white shadow-card transition active:scale-[0.99]"
                  >
                    Aprovar e publicar
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </button>
                </div>
              )}
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
                  placeholder={
                    isEveryday
                      ? "Ex: Foco no happy hour com amigos, cachaça servida gelada no copo com limão, ambiente aconchegante de bar..."
                      : "Ex: Destacar que o produto é 100% orgânico e tem embalagem sustentável..."
                  }
                  className="w-full min-h-[90px] rounded-2xl border border-border/60 bg-background/30 p-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition resize-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Seletor Visual de Referências de Estilo */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Palette size={14} className="text-primary" /> Estilo de Referência Visual
                  </div>
                  <span className="text-[11px] font-medium text-primary">
                    {selectedReferenceId ? "Estilo Selecionado" : "Surpreenda-me (Automático)"}
                  </span>
                </div>

                {/* Filtro de Categorias de Estilo */}
                {references.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
                    {["Todos", ...Array.from(new Set(references.map((r) => r.category).filter(Boolean))) as string[]].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap transition ${
                          selectedCategory.toLowerCase() === cat.toLowerCase()
                            ? "bg-primary text-white shadow-sm"
                            : "bg-background/40 text-muted-foreground hover:text-foreground hover:bg-card border border-border/50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grade de Cards Visuais */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto p-1.5 rounded-2xl border border-border/60 bg-background/20 scrollbar-thin">
                  {/* Card Surpreenda-me / Automático */}
                  <button
                    type="button"
                    onClick={() => setSelectedReferenceId(null)}
                    className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between min-h-[95px] ${
                      selectedReferenceId === null
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                        : "border-border/60 bg-card/60 hover:bg-card hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand text-white shadow-sm">
                        <Shuffle size={14} />
                      </div>
                      {selectedReferenceId === null && (
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-white text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">Surpreenda-me</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        A IA escolhe o melhor estilo
                      </div>
                    </div>
                  </button>

                  {/* Cards de Referências do Supabase */}
                  {references
                    .filter((ref) => selectedCategory === "Todos" || ref.category?.toLowerCase() === selectedCategory.toLowerCase())
                    .map((ref) => {
                    const isSelected = selectedReferenceId === ref.id;
                    return (
                      <button
                        key={ref.id}
                        type="button"
                        onClick={() => setSelectedReferenceId(ref.id)}
                        className={`p-1.5 rounded-xl border text-left transition relative flex flex-col justify-between overflow-hidden group min-h-[95px] ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                            : "border-border/60 bg-card/60 hover:bg-card hover:border-border"
                        }`}
                      >
                        <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden mb-1.5 bg-black/40">
                          <img
                            src={ref.image_url}
                            alt={ref.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                          {ref.category && (
                            <span className="absolute bottom-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm">
                              {ref.category}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-white text-[9px] font-bold shadow">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-xs text-foreground truncate w-full" title={ref.title}>
                          {ref.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selo / Oferta Promocional (Opcional) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Tag size={14} className="text-primary" /> Selo / Oferta Promocional (Opcional)
                  </div>
                  {textoPromocional && (
                    <button
                      type="button"
                      onClick={() => setTextoPromocional("")}
                      className="text-[10px] text-muted-foreground hover:text-red-500 underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={textoPromocional}
                  onChange={(e) => setTextoPromocional(e.target.value)}
                  placeholder="Ex: COMPRE 1 LEVE 2, 50% OFF, EDIÇÃO LIMITADA..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-border/60 bg-background/30 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none transition focus:ring-1 focus:ring-primary font-medium"
                />
                {/* Sugestões Rápidas de Selos */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(() => {
                    const eventName = (holiday?.nome || "").toLowerCase();
                    let suggestions = ["COMPRE 1 LEVE 2", "50% OFF", "FRETE GRÁTIS", "EDIÇÃO LIMITADA", "PROMOÇÃO ESPECIAL"];
                    if (eventName.includes("natal")) {
                      suggestions = ["PRESENTE DE NATAL", "CEIA COM MELZINHO", "EDIÇÃO DE FIM DE ANO", "KIT NATALINO", "FRETE GRÁTIS"];
                    } else if (eventName.includes("ano novo") || eventName.includes("réveillon") || eventName.includes("reveillon")) {
                      suggestions = ["BRINDE DE ANO NOVO", "CELEBRAÇÃO 2025", "EDIÇÃO RÉVEILLON", "KIT DA VIRADA", "COMBO FESTAS"];
                    } else if (eventName.includes("são joão") || eventName.includes("sao joao") || eventName.includes("junina") || eventName.includes("julina")) {
                      suggestions = ["ARRAIÁ DO MELZINHO", "QUENTÃO ESPECIAL", "FESTA JUNINA", "DOSE DUPLA JUNINA", "FRETE GRÁTIS"];
                    } else if (eventName.includes("carnaval")) {
                      suggestions = ["FOLIA COM MELZINHO", "KIT CARNAVAL", "DOSE DE ENERGIA", "COMBO BLOQUINHO", "50% OFF"];
                    } else if (eventName.includes("pais")) {
                      suggestions = ["PRESENTE DO PAIZÃO", "KIT DIA DOS PAIS", "DEGUSTAÇÃO PREMIUM", "EDIÇÃO ESPECIAL PAIS"];
                    } else if (eventName.includes("mães") || eventName.includes("maes")) {
                      suggestions = ["PRESENTE DIA DAS MÃES", "KIT ESPECIAL", "MOMENTO BRINDE", "FRETE GRÁTIS"];
                    } else if (eventName.includes("namorados")) {
                      suggestions = ["BRINDE A DOIS", "KIT NAMORADOS", "NOITE ROMÂNTICA", "PRESENTE PERFEITO"];
                    }
                    return suggestions.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setTextoPromocional(chip)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                          textoPromocional === chip
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
                        }`}
                      >
                        {chip}
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* Upload de Fotos do Produto (com aviso do Master Fallback) */}
              <div className="border-t border-border/40 pt-4">
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <ImagePlus size={14} className="text-primary" /> Fotos do Produto (Opcional, até 6)
                </div>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  Envie fotos dos seus produtos ou deixe vazio para usar automaticamente a garrafa oficial do <strong className="text-foreground">Melzinho</strong> com 100% de fidelidade ao rótulo.
                </p>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                
                {uploadedList.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedList.map((url, idx) => (
                        <div
                          key={idx}
                          className={`relative aspect-square overflow-hidden rounded-xl border group transition-all duration-150 ${
                            draggingOverIndex === idx
                              ? "border-primary border-2 ring-2 ring-primary/30 bg-primary/5"
                              : "border-border/60"
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDraggingOverIndex(idx);
                          }}
                          onDragLeave={(e) => {
                            // Só limpa se saiu realmente do elemento (não para filho)
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDraggingOverIndex(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDraggingOverIndex(null);
                            const file = e.dataTransfer.files[0];
                            if (file) handleReplaceAtIndex(idx, file);
                          }}
                        >
                          {draggingOverIndex === idx && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-primary/10 rounded-xl">
                              <Upload size={18} className="text-primary" />
                            </div>
                          )}
                          <img src={url} alt={`Referência ${idx + 1}`} className="h-full w-full object-cover animate-fade-in" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1.5 bg-black/70 hover:bg-black text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition duration-150"
                            title="Remover imagem"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                      {uploadedList.length < MAX_PRODUCTS && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingOverAddSlot(true);
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setIsDraggingOverAddSlot(false);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingOverAddSlot(false);
                            handleDroppedFiles(Array.from(e.dataTransfer.files));
                          }}
                          className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed transition-all duration-150 ${
                            isDraggingOverAddSlot
                              ? "border-primary border-2 bg-primary/5 ring-2 ring-primary/20"
                              : "border-border/60 bg-background/30 hover:border-primary/60 hover:bg-card"
                          }`}
                        >
                          <Upload size={14} className={isDraggingOverAddSlot ? "text-primary" : "text-muted-foreground"} />
                          <span className={`text-[9px] font-semibold ${
                            isDraggingOverAddSlot ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {isDraggingOverAddSlot ? "Solte aqui" : "Adicionar"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverEmpty(true);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDraggingOverEmpty(false);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverEmpty(false);
                      handleDroppedFiles(Array.from(e.dataTransfer.files));
                    }}
                    className={`group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all duration-150 ${
                      isDraggingOverEmpty
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.01]"
                        : "border-border/60 bg-background/30 hover:border-primary/60 hover:bg-card"
                    }`}
                  >
                    <div className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
                      isDraggingOverEmpty ? "bg-primary/20" : "bg-gradient-brand-soft"
                    }`}>
                      <Upload size={14} className={isDraggingOverEmpty ? "text-primary" : ""} />
                    </div>
                    <div className="text-xs font-semibold">
                      {isDraggingOverEmpty ? "Solte para adicionar" : "Envie imagens do produto (até 6 fotos)"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">PNG ou JPG · para guiar a IA mantendo o original</div>
                  </button>
                )}
              </div>

              <div className="border-t border-border/40 pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={regen}
                  disabled={stage === "loading" || regenerating}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:opacity-75 shadow-card"
                >
                  <Wand2 size={15} className={(stage === "loading" || regenerating) ? "animate-spin" : ""} />
                  {stage === "loading" || regenerating
                    ? "Gerando com IA..."
                    : generated
                      ? "Atualizar Criativo com IA"
                      : "Gerar Criativo com IA"}
                </button>

                {(stage === "loading" || regenerating) && (
                  <button
                    type="button"
                    onClick={handleCancelGeneration}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition active:scale-[0.99] cursor-pointer"
                  >
                    <X size={14} />
                    Cancelar Geração
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Canais selecionados</div>
              <div className="space-y-3">
                <ChannelToggle icon={<Camera size={18} />} label="Instagram" detail="Post no feed " on={igOn} onChange={setIgOn} />
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
