"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { getApiBaseUrl } from "@/lib/references-api";
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, Camera, Clock, CheckCircle2, Loader2, MessageCircle, Shield, Users, Zap, Repeat, Sparkles } from "lucide-react";

type RecurrenceOption = "none" | "1_week" | "every_monday" | "4_weeks";

interface RecurrenceScheduleItem {
  dateStr: string;
  timeStr: string;
  label: string;
}

function getRecurrenceDates(
  baseDate: string,
  baseTime: string,
  option: RecurrenceOption
): RecurrenceScheduleItem[] {
  if (option === "none" || !baseDate) return [];

  const [y, m, d] = baseDate.split("-").map(Number);
  const results: RecurrenceScheduleItem[] = [];

  if (option === "1_week") {
    const nextD = new Date(y, m - 1, d + 7);
    const yyyy = nextD.getFullYear();
    const mm = String(nextD.getMonth() + 1).padStart(2, "0");
    const dd = String(nextD.getDate()).padStart(2, "0");
    results.push({
      dateStr: `${yyyy}-${mm}-${dd}`,
      timeStr: baseTime || "09:00",
      label: "Repetição após 1 semana (+7 dias)",
    });
  } else if (option === "every_monday") {
    const currD = new Date(y, m - 1, d);
    const dayOfWeek = currD.getDay(); // 0 = Dom, 1 = Seg, ...
    const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;
    const nextMonday = new Date(y, m - 1, d + daysUntilMonday);
    const yyyy = nextMonday.getFullYear();
    const mm = String(nextMonday.getMonth() + 1).padStart(2, "0");
    const dd = String(nextMonday.getDate()).padStart(2, "0");
    results.push({
      dateStr: `${yyyy}-${mm}-${dd}`,
      timeStr: baseTime || "09:00",
      label: "Próxima segunda-feira (início de semana)",
    });
  } else if (option === "4_weeks") {
    for (let week = 1; week <= 4; week++) {
      const nextD = new Date(y, m - 1, d + week * 7);
      const yyyy = nextD.getFullYear();
      const mm = String(nextD.getMonth() + 1).padStart(2, "0");
      const dd = String(nextD.getDate()).padStart(2, "0");
      results.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        timeStr: baseTime || "09:00",
        label: `Semana ${week} (+${week * 7} dias)`,
      });
    }
  }

  return results;
}

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
  const [recurrenceOption, setRecurrenceOption] = useState<RecurrenceOption>("none");

  const [holiday, setHoliday] = useState<any>({ nome: "Campanha", data: "" });
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [fidelityScore, setFidelityScore] = useState<number | null>(null);
  const [approved, setApproved] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedHoliday = sessionStorage.getItem("ace.selectedHoliday");
      if (storedHoliday) {
        try {
          const parsed = JSON.parse(storedHoliday);
          if (parsed && typeof parsed === "object") {
            setHoliday(parsed);
          }
        } catch { /* empty */ }
      }

      const img = sessionStorage.getItem("ace.generatedImage");
      const upl = sessionStorage.getItem("ace.uploaded");
      const copy = sessionStorage.getItem("ace.generatedCopy");
      const orig = sessionStorage.getItem("ace.originalImageUrl");
      const score = sessionStorage.getItem("ace.fidelityScore");
      const apprv = sessionStorage.getItem("ace.approved");

      if (img) setGeneratedImage(img);
      if (upl) setUploaded(upl);
      if (copy) setGeneratedCopy(copy);
      if (orig) setOriginalImageUrl(orig);
      if (score) setFidelityScore(parseFloat(score));
      if (apprv) setApproved(apprv === "true");
    } catch (err) {
      console.warn("Aviso ao ler sessionStorage em aprovar:", err);
    }
  }, []);

  const [scheduleDate, setScheduleDate] = useState(() => {
    try {
      const nowStr = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
      return nowStr.split(" ")[0] || new Date().toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  });
  const [scheduleTime, setScheduleTime] = useState(() => {
    try {
      const nowStr = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
      const t = nowStr.split(" ")[1];
      return t ? t.slice(0, 5) : "09:00";
    } catch {
      return "09:00";
    }
  });

  const isScheduledFuture = useMemo(() => {
    if (!scheduleDate || !scheduleTime) return false;
    try {
      const targetIso = `${scheduleDate}T${scheduleTime}:00-03:00`;
      const targetTime = new Date(targetIso).getTime();
      return targetTime > Date.now();
    } catch {
      return false;
    }
  }, [scheduleDate, scheduleTime]);

  const recurrenceDates = useMemo(() => {
    return getRecurrenceDates(scheduleDate, scheduleTime, recurrenceOption);
  }, [scheduleDate, scheduleTime, recurrenceOption]);

  const activate = async () => {
    const base64Image = generatedImage || uploaded;
    if (!base64Image) {
      alert("Nenhuma imagem gerada foi encontrada. Por favor, volte ao Estúdio de Criação e gere a arte da campanha antes de publicar.");
      return;
    }
    if (!generatedCopy) {
      alert("Nenhuma legenda foi gerada para esta campanha. Por favor, volte ao Estúdio de Criação e gere a legenda com IA antes de publicar.");
      return;
    }

    if (scheduleDate) {
      const year = parseInt(scheduleDate.split("-")[0], 10);
      if (isNaN(year) || year < 2024 || year > 2035) {
        alert("Por favor, selecione uma data de agendamento entre os anos de 2024 e 2035.");
        return;
      }
    }

    setLoading(true);

    const caption = generatedCopy;
    let imageUrl = "";

    const API_BASE = getApiBaseUrl();

    try {
      const { getAuthHeaders, scheduleCampaign, saveCampaign } = await import("@/lib/opportunities-api");
      const authHeaders = await getAuthHeaders();

      if (base64Image.startsWith("http")) {
        imageUrl = base64Image;
        console.log("Imagem já está hospedada no Cloudinary:", imageUrl);
      } else {
        console.log("Iniciando upload da imagem via Cloudinary (backend)...");

        const uploadResponse = await fetch(`${API_BASE}/api/upload-imagem`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ image_base64: base64Image }),
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.url) {
          imageUrl = uploadData.url;
          console.log("Imagem hospedada com sucesso no Cloudinary:", imageUrl);
        } else {
          throw new Error("Falha ao hospedar a imagem no Cloudinary. " + JSON.stringify(uploadData));
        }
      }

      const safeHoliday = holiday || { nome: "Campanha", data: "" };
      const oppId = typeof safeHoliday?.id === "number" ? safeHoliday.id : (safeHoliday?.rawId ? Number(safeHoliday.rawId) : 1);

      // Se a data/hora for futura, envia para a rota de agendamento
      if (isScheduledFuture) {
        const targetIso = `${scheduleDate}T${scheduleTime}:00-03:00`;
        const scheduledUtcIso = new Date(targetIso).toISOString();

        await scheduleCampaign({
          title: safeHoliday?.id === "dia-a-dia" ? "Publicação do Dia a Dia" : (safeHoliday?.nome ? `Campanha ${safeHoliday.nome}` : "Campanha Instagram"),
          caption,
          imageUrl,
          scheduled_at: scheduledUtcIso,
          publish_mode: autonomous ? "AUTONOMOUS" : "MANUAL",
          opportunity: String(oppId),
          original_image_url: originalImageUrl || undefined,
          fidelity_score: fidelityScore !== null && !isNaN(fidelityScore!) ? fidelityScore : undefined,
        });

        // Agenda as repetições programadas
        for (const rec of recurrenceDates) {
          const recTargetIso = `${rec.dateStr}T${rec.timeStr}:00-03:00`;
          const recScheduledUtcIso = new Date(recTargetIso).toISOString();
          await scheduleCampaign({
            title: safeHoliday?.id === "dia-a-dia"
              ? `Publicação do Dia a Dia (${rec.label})`
              : (safeHoliday?.nome ? `Campanha ${safeHoliday.nome} (${rec.label})` : `Campanha Instagram (${rec.label})`),
            caption,
            imageUrl,
            scheduled_at: recScheduledUtcIso,
            publish_mode: autonomous ? "AUTONOMOUS" : "MANUAL",
            opportunity: String(oppId),
            original_image_url: originalImageUrl || undefined,
            fidelity_score: fidelityScore !== null && !isNaN(fidelityScore!) ? fidelityScore : undefined,
          });
        }

        console.log("Campanha e repetições agendadas com sucesso no horário de Brasília!");
        router.push(`/sucesso?agendado=true&modo=${autonomous ? "autorizado" : "manual"}${recurrenceDates.length > 0 ? `&repeticao=true&total_agendados=${1 + recurrenceDates.length}` : ""}`);
        return;
      }

      // Publicação Imediata
      const response = await fetch(`${API_BASE}/api/instagram/postar`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          imageUrl,
          caption
        }),
      });

      if (response.ok) {
        const postData = await response.json().catch(() => ({}));
        const rawPostId = postData.post_id ? String(postData.post_id) : undefined;

        // Salvar a campanha no Supabase
        try {
          await saveCampaign({
            title: safeHoliday?.id === "dia-a-dia" ? "Publicação do Dia a Dia" : (safeHoliday?.nome ? `Campanha ${safeHoliday.nome}` : "Campanha Instagram"),
            campaign: caption,
            description: `Imagem Cloudinary: ${imageUrl}`,
            date: scheduleDate || new Date().toISOString().split("T")[0],
            opportunity: String(oppId),
            id_PostInstagram: rawPostId || undefined,
            original_image_url: originalImageUrl || undefined,
            fidelity_score: fidelityScore !== null && !isNaN(fidelityScore!) ? fidelityScore : undefined,
            approved: approved,
            generation_attempts: [],
          });
          console.log("Campanha gravada com sucesso no Supabase!");
        } catch (dbErr) {
          console.warn("Aviso ao gravar campanha no Supabase:", dbErr);
        }

        // Se o usuário selecionou repetição/recorrência, agenda os próximos posts automáticos
        if (recurrenceDates.length > 0) {
          for (const rec of recurrenceDates) {
            const recTargetIso = `${rec.dateStr}T${rec.timeStr}:00-03:00`;
            const recScheduledUtcIso = new Date(recTargetIso).toISOString();
            await scheduleCampaign({
              title: safeHoliday?.id === "dia-a-dia"
                ? `Publicação do Dia a Dia (${rec.label})`
                : (safeHoliday?.nome ? `Campanha ${safeHoliday.nome} (${rec.label})` : `Campanha Instagram (${rec.label})`),
              caption,
              imageUrl,
              scheduled_at: recScheduledUtcIso,
              publish_mode: autonomous ? "AUTONOMOUS" : "MANUAL",
              opportunity: String(oppId),
              original_image_url: originalImageUrl || undefined,
              fidelity_score: fidelityScore !== null && !isNaN(fidelityScore!) ? fidelityScore : undefined,
            });
          }
          router.push(`/sucesso?repeticao=true&total_agendados=${recurrenceDates.length}`);
        } else {
          router.push("/sucesso");
        }
      } else {
        const errData = await response.json().catch(() => null);
        const errMsg = errData?.detail?.detalhes?.error?.message
          || errData?.detail?.detalhes?.message
          || errData?.detail
          || "Erro desconhecido ao publicar.";
        alert(`Erro ao publicar no Instagram:\n${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`);
        setLoading(false);
      }
    } catch (error: any) {
      alert(`Erro no processo: ${error.message || "Verifique a conexão com o backend"}`);
      setLoading(false);
    }
  };

  return (
    <TopBar>
      <main className="mx-auto max-w-5xl px-3.5 sm:px-6 py-5 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
            Etapa 3 de 4 · Aprovação
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl text-center">
            Confirme e ative a <span className="text-gradient-brand">Publicação Automática</span>
          </h1>
          <p className="mt-2 max-w-xl text-xs sm:text-sm text-muted-foreground text-center">
            A IA fará tudo por você, mas você está sempre no controle. Revise o resumo e dispare a campanha.
          </p>
        </div>

        {((!generatedImage && !uploaded) || !generatedCopy) && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-300 flex flex-wrap items-center justify-between gap-3 animate-float-up">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
              <span><strong>Nenhuma campanha pronta no momento.</strong> Para ativar a automação e disparo no feed, gere a arte e a legenda no Estúdio de Criação.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link href="/gerador" className="rounded-xl bg-gradient-brand px-4 py-2 text-xs font-bold text-white shadow-card hover:scale-[1.02] transition flex-1 sm:flex-initial text-center">
                Ir para o Estúdio
              </Link>
              <Link href="/sucesso" className="rounded-xl border border-border/80 bg-card/60 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition flex-1 sm:flex-initial text-center">
                Ver Fila de Agendados
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5">
          <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 lg:col-span-3 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Resumo da campanha</div>
            
            {/* Prévia visual da arte gerada */}
            {(generatedImage || uploaded) && (
              <div className="mb-4 flex items-center gap-3.5 rounded-2xl border border-border/60 bg-background/40 p-3 sm:p-3.5">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-black/40 border border-border/50 shadow-sm">
                  <img 
                    src={generatedImage?.startsWith("http") || generatedImage?.startsWith("data:") ? generatedImage : (generatedImage ? `data:image/png;base64,${generatedImage}` : (uploaded || ""))} 
                    alt="Prévia da arte gerada" 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles size={11} /> Arte Criada com IA
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5">
                    {holiday?.nome || "Cachaça Melzinho"}
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                    {generatedCopy || "Legenda personalizada pronta para publicação."}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5 sm:space-y-3">
              <SummaryRow 
                icon={<Calendar size={16} />} 
                label={holiday?.id === "dia-a-dia" ? "Tipo de Conteúdo" : "Data Comemorativa"} 
                value={holiday?.id === "dia-a-dia" ? "Publicação do Dia a Dia (Feed Casual)" : `${holiday?.nome || "Oportunidade"} — ${holiday?.data || ""}`} 
              />
              <SummaryRow icon={<Camera size={16} />} label="Canal de Publicação" value="Instagram — Post no Feed" />
              <SummaryRow icon={<MessageCircle size={16} />} label="Legenda da Campanha" value={generatedCopy ? "Legenda personalizada com IA" : "Aguardando geração"} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className={`rounded-2xl sm:rounded-3xl p-[1.5px] transition ${autonomous ? "bg-gradient-brand animate-gradient-shift" : "bg-border"}`}>
              <div className="rounded-2xl sm:rounded-3xl bg-card p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <Shield size={12} /> Modo de publicação
                    </div>
                    <div className="mt-2 text-lg sm:text-xl font-bold">{autonomous ? "Publicação Autorizada" : "Publicação Manual"}</div>
                  </div>
                  <button
                    onClick={() => setAutonomous((v) => !v)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${autonomous ? "bg-gradient-brand" : "bg-secondary"}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${autonomous ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                <div className="mt-4 sm:mt-5 rounded-2xl border border-border/60 bg-background/40 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {autonomous ? "Agendado para" : "Publicar manualmente em"}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      <Clock size={10} /> Brasília (UTC-3)
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-7 sm:col-span-8">
                      <input 
                        type="date" 
                        min="2024-01-01"
                        max="2035-12-31"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-foreground shadow-sm" 
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-4">
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-card px-2.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-foreground text-center shadow-sm" 
                      />
                    </div>
                  </div>

                  {isScheduledFuture ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 animate-float-up">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Disparo programado para <strong>{scheduleDate.split("-").reverse().join("/")}</strong> às <strong>{scheduleTime}</strong> (Horário de Brasília)</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                      <Zap size={14} className="text-brand shrink-0" />
                      <span>Data/horário atual ou passado: a publicação será <strong>imediata</strong> ao confirmar.</span>
                    </div>
                  )}
                </div>

                {/* Opção de Repetição / Recorrência Automática (Pedido Adriano: Repetir após 1 semana) */}
                <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat size={14} className="text-primary" />
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Repetir publicação
                      </span>
                    </div>
                    {recurrenceOption !== "none" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary animate-fade-in">
                        Ativa
                      </span>
                    )}
                  </div>
                  
                  {/* Seletor de Opções de Recorrência (Grid 2x2 otimizado para celular) */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecurrenceOption("none")}
                      className={`p-2 sm:p-2.5 rounded-xl border text-left transition ${
                        recurrenceOption === "none"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                      }`}
                    >
                      <div className="font-bold text-[11px] sm:text-xs">Não repetir</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-normal mt-0.5 leading-tight">Post único</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecurrenceOption("1_week")}
                      className={`p-2 sm:p-2.5 rounded-xl border text-left transition relative ${
                        recurrenceOption === "1_week"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                      }`}
                    >
                      <div className="font-bold text-[11px] sm:text-xs flex items-center justify-between gap-1">
                        <span className="truncate">Após 1 sem</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">+7d</span>
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-normal mt-0.5 leading-tight">7 dias depois</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecurrenceOption("every_monday")}
                      className={`p-2 sm:p-2.5 rounded-xl border text-left transition ${
                        recurrenceOption === "every_monday"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                      }`}
                    >
                      <div className="font-bold text-[11px] sm:text-xs">Segunda-feira</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-normal mt-0.5 leading-tight">Início de sem.</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecurrenceOption("4_weeks")}
                      className={`p-2 sm:p-2.5 rounded-xl border text-left transition ${
                        recurrenceOption === "4_weeks"
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                      }`}
                    >
                      <div className="font-bold text-[11px] sm:text-xs">Mensal</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground font-normal mt-0.5 leading-tight">4 semanas</div>
                    </button>
                  </div>

                  {/* Detalhes dinâmicos da repetição selecionada */}
                  {recurrenceOption !== "none" && recurrenceDates.length > 0 && (
                    <div className="mt-2.5 rounded-xl border border-primary/30 bg-primary/5 p-2.5 sm:p-3 text-xs text-foreground space-y-1 animate-float-up">
                      <div className="flex items-center gap-1.5 font-bold text-primary text-[10px] sm:text-[11px]">
                        <Repeat size={12} />
                        <span>Agendamentos recorrentes:</span>
                      </div>
                      <ul className="space-y-0.5 text-[10px] sm:text-[11px] text-muted-foreground pl-0.5">
                        {recurrenceDates.map((item, i) => (
                          <li key={i} className="flex items-center justify-between gap-2">
                            <span className="truncate">• {item.label}:</span>
                            <strong className="text-foreground shrink-0">{item.dateStr.split("-").reverse().join("/")} às {item.timeStr}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button 
                onClick={activate} 
                disabled={loading || (!generatedImage && !uploaded) || !generatedCopy} 
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-card transition hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> {isScheduledFuture ? "Agendando..." : "Ativando..."}</>
                ) : isScheduledFuture ? (
                  <><Clock size={16} /> {autonomous ? "Agendar Publicação Automática" : "Agendar Notificação Manual"} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></>
                ) : (
                  <><Zap size={16} /> Publicar Campanha Agora <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></>
                )}
              </button>
              <Link href="/gerador" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-5 py-3 text-xs sm:text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                <ArrowLeft size={14} /> Editar campanha
              </Link>
            </div>
          </div>
        </div>
      </main>
    </TopBar>
  );
}
