"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
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

  const [holiday, setHoliday] = useState<any>(DEFAULT_HOLIDAY);
  const [variantIndex, setVariantIndex] = useState<number>(0);
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

    const storedVariant = sessionStorage.getItem("ace.variant");
    if (storedVariant) setVariantIndex(Number(storedVariant));

    const storedImg = sessionStorage.getItem("ace.uploadedImage");
    if (storedImg) setUploaded(storedImg);

    const storedGenImg = sessionStorage.getItem("ace.generatedImage");
    if (storedGenImg) setGeneratedImage(storedGenImg);

    const storedGenCopy = sessionStorage.getItem("ace.generatedCopy");
    if (storedGenCopy) setGeneratedCopy(storedGenCopy);

    const storedOriginalUrl = sessionStorage.getItem("ace.originalImageUrl");
    if (storedOriginalUrl) setOriginalImageUrl(storedOriginalUrl);

    const storedFidelityScore = sessionStorage.getItem("ace.fidelityScore");
    if (storedFidelityScore) setFidelityScore(Number(storedFidelityScore));

    const storedApproved = sessionStorage.getItem("ace.approved");
    if (storedApproved) setApproved(storedApproved === "true");
  }, []);
  
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

  const activate = async () => {
    setLoading(true);

    const caption = generatedCopy || activeVariant?.copy || "Nova campanha gerada!";
    const base64Image = generatedImage || uploaded;
    
    let imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"; 

    try {
      if (base64Image) {
        if (base64Image.startsWith("http")) {
          imageUrl = base64Image;
          console.log("Imagem já está hospedada no Cloudinary:", imageUrl);
        } else {
          console.log("Iniciando upload da imagem via Cloudinary (backend)...");

          const uploadResponse = await fetch("http://127.0.0.1:8000/api/upload-imagem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
      }

      const response = await fetch("http://127.0.0.1:8000/api/instagram/postar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          caption
        }),
      });

      if (response.ok) {
        const postData = await response.json().catch(() => ({}));
        const rawPostId = postData.post_id ? String(postData.post_id) : undefined;
        const oppId = typeof holiday.id === "number" ? holiday.id : (holiday.rawId ? Number(holiday.rawId) : 1);

        // Salvar a campanha no Supabase
        try {
          const { saveCampaign } = await import("@/lib/opportunities-api");
          await saveCampaign({
            title: holiday.nome ? `Campanha ${holiday.nome}` : "Campanha Instagram",
            campaign: caption,
            description: `Imagem Cloudinary: ${imageUrl}`,
            date: new Date().toISOString().split("T")[0],
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
      alert(`Erro no processo: ${error.message || "Verifique a conexão com o Python"}`);
      setLoading(false);
    }
  };

  return (
    <TopBar>
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
              <SummaryRow icon={<MessageCircle size={16} />} label="Canal 2" value="WhatsApp — Message personalizada" />
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
    </TopBar>
  );
}
