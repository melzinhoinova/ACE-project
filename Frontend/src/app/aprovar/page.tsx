"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { getApiBaseUrl } from "@/lib/references-api";
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, Camera, Clock, CheckCircle2, Loader2, MessageCircle, Shield, Users, Zap } from "lucide-react";

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

  const [holiday, setHoliday] = useState<any>({ nome: "Campanha", data: "" });
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [fidelityScore, setFidelityScore] = useState<number | null>(null);
  const [approved, setApproved] = useState<boolean>(false);

  useEffect(() => {
    const storedHoliday = sessionStorage.getItem("ace.selectedHoliday");
    if (storedHoliday) {
      try { setHoliday(JSON.parse(storedHoliday)); } catch { /* ... */ }
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
  }, []);

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    try {
      // Extrai data e hora atual no fuso oficial de Brasília (America/Sao_Paulo / UTC-3)
      const nowStr = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
      const [currDate, currTime] = nowStr.split(" ");
      setScheduleDate(currDate);
      setScheduleTime(currTime ? currTime.slice(0, 5) : "09:00");
    } catch {
      const now = new Date();
      setScheduleDate(now.toISOString().split("T")[0]);
      setScheduleTime("09:00");
    }
  }, []);

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

      const oppId = typeof holiday.id === "number" ? holiday.id : (holiday.rawId ? Number(holiday.rawId) : 1);

      // Se a data/hora for futura, envia para a rota de agendamento
      if (isScheduledFuture) {
        const targetIso = `${scheduleDate}T${scheduleTime}:00-03:00`;
        const scheduledUtcIso = new Date(targetIso).toISOString();

        await scheduleCampaign({
          title: holiday.id === "dia-a-dia" ? "Publicação do Dia a Dia" : (holiday.nome ? `Campanha ${holiday.nome}` : "Campanha Instagram"),
          caption,
          imageUrl,
          scheduled_at: scheduledUtcIso,
          publish_mode: autonomous ? "AUTONOMOUS" : "MANUAL",
          opportunity: String(oppId),
          original_image_url: originalImageUrl || undefined,
          fidelity_score: fidelityScore !== null && !isNaN(fidelityScore!) ? fidelityScore : undefined,
        });

        console.log("Campanha agendada com sucesso no horário de Brasília!");
        router.push(`/sucesso?agendado=true&modo=${autonomous ? "autorizado" : "manual"}`);
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
            title: holiday.id === "dia-a-dia" ? "Publicação do Dia a Dia" : (holiday.nome ? `Campanha ${holiday.nome}` : "Campanha Instagram"),
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

        router.push("/sucesso");
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
              <span><strong>A campanha ainda não foi gerada completamente.</strong> Por favor, gere a imagem e a legenda da campanha no Estúdio de Criação antes de publicar no Instagram.</span>
            </div>
            <Link href="/gerador" className="rounded-xl bg-gradient-brand px-4 py-2 text-xs font-bold text-white shadow-card hover:scale-[1.02] transition w-full sm:w-auto text-center">
              Ir para o Estúdio
            </Link>
          </div>
        )}

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 lg:col-span-3 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumo da campanha</div>
            <div className="mt-4 space-y-3">
              <SummaryRow 
                icon={<Calendar size={16} />} 
                label={holiday.id === "dia-a-dia" ? "Tipo de Conteúdo" : "Data Comemorativa"} 
                value={holiday.id === "dia-a-dia" ? "Publicação do Dia a Dia (Feed Casual)" : `${holiday.nome || "Oportunidade"} — ${holiday.data || ""}`} 
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

                <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {autonomous ? "Agendado para" : "Publicar manualmente em"}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      <Clock size={10} /> Brasília (UTC-3)
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
                    <input 
                      type="date" 
                      min="2024-01-01"
                      max="2035-12-31"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="flex-1 min-w-[130px] rounded-lg border border-border/60 bg-card px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium" 
                    />
                    <span className="text-muted-foreground text-xs">às</span>
                    <input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-24 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium" 
                    />
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
