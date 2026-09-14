"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { 
  fetchCampaigns, 
  fetchScheduledCampaigns, 
  cancelScheduledCampaign, 
  CampaignDb 
} from "@/lib/opportunities-api";
import { getApiBaseUrl } from "@/lib/references-api";
import { 
  ArrowLeft,
  ArrowRight, 
  Eye, 
  LucideRocket, 
  Sparkles, 
  X, 
  Heart, 
  MessageSquare, 
  BarChart3, 
  Users, 
  UserCheck, 
  TrendingUp, 
  History,
  Loader2,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarClock,
  Trash2,
  Zap,
  Shield,
  RotateCcw
} from "lucide-react";

function useCounter(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number;
    let raf = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round((target || 0) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function formatCampaignOptionDate(dStr: string): string {
  if (!dStr) return "";
  if (dStr.includes("-")) {
    const [y, m, d] = dStr.split("-");
    return `${d}/${m}/${y}`;
  }
  return dStr;
}

function formatScheduledDateTime(isoStr?: string | null): string {
  if (!isoStr) return "Data não informada";
  try {
    const d = new Date(isoStr);
    return (
      d.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " (Horário de Brasília)"
    );
  } catch {
    return isoStr;
  }
}

function Metric({ icon, label, value, sub, delay, pulse, highlight }: any) {
  return (
    <div className={`animate-float-up rounded-3xl p-[1.5px] ${highlight ? "bg-gradient-brand animate-gradient-shift" : "bg-border"}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="rounded-3xl bg-card p-6 h-full flex flex-col justify-between">
        <div>
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
          <div className="mt-1 text-4xl font-extrabold tabular-nums text-foreground">{value}</div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground border-t border-border/30 pt-2">{sub}</div>
      </div>
    </div>
  );
}

export default function DashboardSucessoPage() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<"geral" | "post" | "agendados">("geral");
  const [dadosGeral, setDadosGeral] = useState<any>({ followers: 0, impressions: 0, reach: 0, profileViews: 0, username: "carregando" });
  const [dadosPost, setDadosPost] = useState<any>({ likes: 0, commentsCount: 0, reach: 0, comentarios: [] });
  const [share, setShare] = useState(false);
  const [isAgendado, setIsAgendado] = useState(false);
  const [modoAgendado, setModoAgendado] = useState<string | null>(null);

  // Fila de Agendamentos
  const [scheduledList, setScheduledList] = useState<CampaignDb[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("agendado") === "true") {
        setIsAgendado(true);
        setModoAgendado(params.get("modo"));
        setAbaAtiva("agendados");
      }
    }
  }, []);

  // Histórico de campanhas salvas no banco
  const [campaignsHistory, setCampaignsHistory] = useState<CampaignDb[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const API_BASE = getApiBaseUrl();

  const fetchPostMetrics = async (mediaId: string) => {
    setLoadingPost(true);
    try {
      const { getAuthHeaders } = await import("@/lib/opportunities-api");
      const authHeaders = await getAuthHeaders();

      const res = await fetch(`${API_BASE}/api/instagram/dashboard/post/${mediaId}`, {
        cache: "no-store",
        headers: { ...authHeaders, 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        setDadosPost(await res.json());
      }
    } catch (err) {
      console.error("Erro ao buscar métricas de post específico", err);
    } finally {
      setLoadingPost(false);
    }
  };

  const fetchRecentPost = async () => {
    setLoadingPost(true);
    try {
      const { getAuthHeaders } = await import("@/lib/opportunities-api");
      const authHeaders = await getAuthHeaders();

      const resPost = await fetch(`${API_BASE}/api/instagram/dashboard/post/recente`, {
        cache: "no-store",
        headers: { ...authHeaders, 'Cache-Control': 'no-cache' }
      });
      if (resPost.ok) setDadosPost(await resPost.json());
    } catch (err) {
      console.error("Erro ao buscar post recente", err);
    } finally {
      setLoadingPost(false);
    }
  };

  const carregarAgendados = async () => {
    setLoadingScheduled(true);
    try {
      const data = await fetchScheduledCampaigns();
      setScheduledList(data || []);
    } catch (err) {
      console.error("Erro ao buscar agendados:", err);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const handleCancelScheduled = async (id: number, title?: string) => {
    const confirmMsg = `Tem certeza que deseja cancelar o agendamento da publicação "${title || 'Campanha'}"?`;
    if (!window.confirm(confirmMsg)) return;

    setCancelingId(id);
    try {
      await cancelScheduledCampaign(id);
      setScheduledList((prev) => prev.filter((item) => item.id !== id));
      setStatusNotice(`Agendamento da publicação "${title || 'Campanha'}" cancelado com sucesso.`);
      setTimeout(() => setStatusNotice(null), 5000);
    } catch (err: any) {
      alert(`Erro ao cancelar agendamento: ${err.message || "Tente novamente mais tarde."}`);
    } finally {
      setCancelingId(null);
    }
  };

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const { getAuthHeaders } = await import("@/lib/opportunities-api");
        const authHeaders = await getAuthHeaders();

        setLoadingScheduled(true);

        // Dispara todas as requisições em paralelo para carregar o dashboard instantaneamente
        const [resGeralResult, dbCampaignsResult, scheduledResult] = await Promise.allSettled([
          fetch(`${API_BASE}/api/instagram/dashboard/geral`, {
            cache: "no-store",
            headers: { ...authHeaders, 'Cache-Control': 'no-cache' }
          }).then(async (res) => (res.ok ? await res.json() : null)),
          fetchCampaigns().catch(() => []),
          fetchScheduledCampaigns().catch(() => []),
        ]);

        if (resGeralResult.status === "fulfilled" && resGeralResult.value) {
          setDadosGeral(resGeralResult.value);
        }

        const dbCampaigns = (dbCampaignsResult.status === "fulfilled" && dbCampaignsResult.value) ? dbCampaignsResult.value : [];
        setCampaignsHistory(dbCampaigns || []);

        if (scheduledResult.status === "fulfilled" && scheduledResult.value) {
          setScheduledList(scheduledResult.value);
        }
        setLoadingScheduled(false);

        // Seleção Padrão (Auto-seleciona a campanha mais recente gravada)
        if (dbCampaigns && dbCampaigns.length > 0) {
          const firstWithMedia = dbCampaigns.find((c) => c.id_PostInstagram) || dbCampaigns[0];
          setSelectedCampaignId(firstWithMedia.id);
          if (firstWithMedia.id_PostInstagram) {
            fetchPostMetrics(String(firstWithMedia.id_PostInstagram));
          } else {
            fetchRecentPost();
          }
        } else {
          fetchRecentPost();
        }
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard do Meta", err);
        setLoadingScheduled(false);
        fetchRecentPost();
      }
    }
    carregarDashboard();
  }, []);

  const handleSelectCampaign = (cId: number) => {
    setSelectedCampaignId(cId);
    const camp = campaignsHistory.find((c) => c.id === cId);
    if (camp && camp.id_PostInstagram) {
      fetchPostMetrics(String(camp.id_PostInstagram));
    } else {
      fetchRecentPost();
    }
  };

  const totalFollowers = useCounter(dadosGeral?.followers || 0);
  const totalImpressions = useCounter(dadosGeral?.impressions || 0);
  const totalReachGeral = useCounter(dadosGeral?.reach || 0);
  const totalProfileViews = useCounter(dadosGeral?.profileViews || 0);

  const postLikes = useCounter(dadosPost?.likes || 0);
  const postCommentsCount = useCounter(dadosPost?.commentsCount || 0);
  const postReach = useCounter(dadosPost?.reach || 0);

  // Valores calculados com segurança para as barras do gráfico
  const percentPerfil = useMemo(() => {
    const imp = dadosGeral?.impressions || 0;
    const views = dadosGeral?.profileViews || 0;
    if (imp === 0) return "0%";
    return `${Math.min(100, (views / imp) * 100)}%`;
  }, [dadosGeral]);

  const percentReach = useMemo(() => {
    const imp = dadosGeral?.impressions || 0;
    const rch = dadosGeral?.reach || 0;
    if (imp === 0) return "0%";
    return `${Math.min(100, (rch / imp) * 100)}%`;
  }, [dadosGeral]);

  return (
    <TopBar>
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push("/radar")} 
            className="group inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-2.5 text-xs font-bold text-muted-foreground transition duration-200 hover:border-border hover:bg-card hover:text-foreground shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
            Voltar ao Radar
          </button>
        </div>

        {/* Header Principal */}
        <div className="text-center space-y-3">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand animate-gradient-shift shadow-card">
            <LucideRocket className="text-white" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Painel de <span className="text-gradient-brand">resultados</span>
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Monitoramento de performance e gestão de publicações
          </p>

          {isAgendado && (
            <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 flex items-center justify-center gap-3 animate-float-up shadow-sm mt-4">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <div className="text-xs sm:text-sm font-medium text-left">
                <strong>Publicação agendada com sucesso!</strong>
                <div className="text-xs text-emerald-400/80 mt-0.5">
                  {modoAgendado === "manual" 
                    ? "No horário programado, você receberá um alerta por e-mail para autorizar o disparo." 
                    : "O sistema processará e publicará a mídia no feed do Instagram automaticamente no horário programado."}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seleção de Abas */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-secondary/40 p-1 border border-border/60 backdrop-blur-md">
            <button 
              onClick={() => setAbaAtiva("geral")} 
              className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all duration-300 ${abaAtiva === "geral" ? "bg-card text-foreground shadow-md scale-105" : "text-muted-foreground hover:text-foreground"}`}
            >
              Visão Macro da Conta
            </button>
            <button 
              onClick={() => setAbaAtiva("post")} 
              className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all duration-300 ${abaAtiva === "post" ? "bg-card text-foreground shadow-md scale-105" : "text-muted-foreground hover:text-foreground"}`}
            >
              Métricas do Post
            </button>
            <button 
              onClick={() => {
                setAbaAtiva("agendados");
                carregarAgendados();
              }} 
              className={`rounded-full px-6 py-2.5 text-xs font-bold transition-all duration-300 flex items-center gap-2 ${abaAtiva === "agendados" ? "bg-card text-foreground shadow-md scale-105" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>Fila de Agendamentos</span>
              {scheduledList.length > 0 && (
                <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-[10px] font-extrabold leading-none">
                  {scheduledList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bloco de Conteúdo */}
        <div className="transition-all duration-500">
          {abaAtiva === "geral" ? (
            <div className="space-y-8">
              {/* GRID COM 4 CARDS MACRO */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Metric icon={<Eye size={20} className="text-brand" />} label="Visualizações da Conta" value={totalImpressions.toLocaleString("pt-BR")} sub="Impressões de mídia acumuladas hoje" delay={0} />
                <Metric icon={<BarChart3 size={20} className="text-brand" />} label="Alcance Geral" value={totalReachGeral.toLocaleString("pt-BR")} sub="Contas únicas alcançadas" delay={100} pulse />
                <Metric icon={<UserCheck size={20} className="text-brand" />} label="Visitas ao Perfil" value={totalProfileViews.toLocaleString("pt-BR")} sub="Cliques para explorar seu @perfil" delay={200} />
                <Metric icon={<Users size={20} className="text-white" />} label="Total de Seguidores" value={totalFollowers.toLocaleString("pt-BR")} sub={`Conectado a: @${dadosGeral?.username || "perfil"}`} delay={300} highlight />
              </div>

              {/* SEÇÃO ADICIONAL: GRÁFICO COMPARATIVO */}
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card animate-float-up" style={{ animationDelay: "400ms" }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <TrendingUp size={16} /> Distribuição de Tráfego Diário
                    </h3>
                    <p className="text-xs text-muted-foreground">Proporção volumétrica das ações capturadas na Meta.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span>Visualizações Globais</span>
                      <span className="text-muted-foreground font-bold">{dadosGeral?.impressions || 0}</span>
                    </div>
                    <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-brand rounded-full transition-all duration-1000" style={{ width: (dadosGeral?.impressions || 0) > 0 ? "100%" : "0%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span>Visitas ao Perfil do Projeto</span>
                      <span className="text-muted-foreground font-bold">{dadosGeral?.profileViews || 0}</span>
                    </div>
                    <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all duration-1000" style={{ width: percentPerfil }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span>Contas Únicas Convertidas (Alcance)</span>
                      <span className="text-muted-foreground font-bold">{dadosGeral?.reach || 0}</span>
                    </div>
                    <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: percentReach }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : abaAtiva === "post" ? (
            <div className="space-y-8">
              {/* SELETOR DE HISTÓRICO DE CAMPANHAS */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand-soft">
                    <History size={20} className="text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Histórico de Publicações</div>
                    <div className="text-xs text-muted-foreground">Selecione uma campanha anterior para consultar seu histórico de métricas.</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {loadingPost && <Loader2 size={16} className="animate-spin text-primary" />}
                  <select
                    value={selectedCampaignId || ""}
                    onChange={(e) => handleSelectCampaign(Number(e.target.value))}
                    className="rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-xs font-bold focus:border-primary focus:outline-none shadow-sm cursor-pointer w-full sm:w-auto sm:min-w-[280px] max-w-full"
                  >
                    {campaignsHistory.length === 0 ? (
                      <option value="">Publicação Mais Recente</option>
                    ) : (
                      campaignsHistory.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} — {formatCampaignOptionDate(c.date)}{c.status === "SCHEDULED" ? " ⏳ [Agendado]" : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* CARDS DO POST SELECIONADO */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Metric icon={<Heart size={20} className="text-red-500 fill-red-500" />} label="Curtidas Disponíveis" value={postLikes.toString()} sub="Engajamento ativo na publicação" delay={0} />
                <Metric icon={<BarChart3 size={20} className="text-brand" />} label="Alcance Dedicado" value={postReach.toLocaleString("pt-BR")} sub="Pessoas alcançadas pela publicação" delay={100} />
                <Metric icon={<MessageSquare size={20} className="text-brand" />} label="Comentários Totais" value={postCommentsCount.toString()} sub="Interações discursivas catalogadas" delay={200} pulse />
              </div>

              {/* CAIXA DE COMENTÁRIOS DO FEED */}
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card flex flex-col justify-between animate-float-up" style={{ animationDelay: '300ms' }}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                    <MessageSquare size={14} /> Histórico de Comentários do Feed
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {dadosPost && Array.isArray(dadosPost.comentarios) && dadosPost.comentarios.length > 0 ? (
                      dadosPost.comentarios.map((txt: string, i: number) => {
                        const ehResposta = txt.startsWith("   ↳");
                        return (
                          <div 
                            key={i} 
                            className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm transition-all ${
                              ehResposta 
                                ? "border-border/20 bg-background/30 text-muted-foreground ml-6 text-xs italic" 
                                : "border-border/40 bg-background/60 text-foreground font-medium"
                            }`}
                          >
                            {txt}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground italic px-4 py-3">
                        Nenhum comentário associado a esta publicação ainda.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notificação temporária de cancelamento */}
              {statusNotice && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 flex items-center justify-between gap-3 animate-float-up shadow-sm">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span>{statusNotice}</span>
                  </div>
                  <button onClick={() => setStatusNotice(null)} className="text-emerald-400 hover:text-emerald-200">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Cabeçalho da Fila de Agendamentos */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand-soft">
                    <CalendarClock size={20} className="text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fila de Publicações Agendadas</div>
                    <div className="text-xs text-muted-foreground">Campanhas programadas para publicação automática ou notificação manual.</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={carregarAgendados}
                    disabled={loadingScheduled}
                    className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:text-foreground hover:bg-card shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw size={14} className={loadingScheduled ? "animate-spin text-primary" : ""} />
                    Atualizar Fila
                  </button>
                </div>
              </div>

              {/* Conteúdo da Fila */}
              {loadingScheduled && scheduledList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-card p-12 text-center shadow-card">
                  <Loader2 size={32} className="animate-spin text-primary mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">Carregando fila de agendamentos...</p>
                </div>
              ) : scheduledList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-card p-12 text-center shadow-card animate-float-up">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary/50 text-muted-foreground mb-4">
                    <Calendar size={32} className="opacity-60" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Nenhuma publicação agendada</h3>
                  <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground">
                    Você não possui postagens na fila no momento. Crie e agende novas campanhas no Estúdio de Criação para que sejam publicadas automaticamente.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => router.push("/radar")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-3 text-xs font-bold text-white shadow-card transition hover:scale-[1.02]"
                    >
                      <Sparkles size={14} /> Explorar Oportunidades no Radar
                    </button>
                    <button
                      onClick={() => router.push("/gerador")}
                      className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-5 py-3 text-xs font-bold text-muted-foreground transition hover:text-foreground hover:bg-card"
                    >
                      Ir ao Estúdio de Criação
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scheduledList.map((item) => {
                    const isAutonomous = item.publish_mode === "AUTONOMOUS";
                    const isProcessing = item.status === "PROCESSING";

                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-card flex flex-col justify-between transition hover:border-border duration-200 animate-float-up"
                      >
                        {/* Imagem / Thumbnail */}
                        <div className="relative aspect-video w-full bg-secondary/30 overflow-hidden border-b border-border/40">
                          {item.description && (item.description.startsWith("data:image") || item.description.startsWith("http")) ? (
                            <img
                              src={item.description}
                              alt={item.title || "Publicação Agendada"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/60">
                              <Sparkles size={28} />
                              <span className="text-[11px] font-medium">Prévia não disponível</span>
                            </div>
                          )}

                          {/* Badges sobre a imagem */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md border shadow-sm ${
                              isAutonomous 
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" 
                                : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                            }`}>
                              {isAutonomous ? <Zap size={10} className="shrink-0" /> : <Shield size={10} className="shrink-0" />}
                              {isAutonomous ? "Automática" : "Manual"}
                            </span>

                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md border shadow-sm ${
                              isProcessing
                                ? "bg-purple-950/80 text-purple-300 border-purple-500/40"
                                : "bg-sky-950/80 text-sky-300 border-sky-500/40"
                            }`}>
                              {isProcessing ? (
                                <><Loader2 size={10} className="animate-spin shrink-0" /> Disparando</>
                              ) : (
                                <><Clock size={10} className="shrink-0" /> Agendado</>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Detalhes do Card */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">
                              {item.title || "Campanha Agendada"}
                            </h4>

                            <div className="flex items-center gap-1.5 text-xs text-brand font-semibold">
                              <Clock size={12} className="shrink-0" />
                              <span>{formatScheduledDateTime(item.scheduled_at)}</span>
                            </div>

                            {item.campaign && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-background/40 rounded-xl p-2.5 border border-border/40">
                                {item.campaign}
                              </p>
                            )}
                          </div>

                          {/* Rodapé do Card com Ação de Cancelamento */}
                          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              ID: #{item.id}
                            </span>

                            <button
                              onClick={() => handleCancelScheduled(item.id, item.title)}
                              disabled={cancelingId === item.id || isProcessing}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {cancelingId === item.id ? (
                                <><Loader2 size={12} className="animate-spin" /> Cancelando...</>
                              ) : (
                                <><Trash2 size={12} /> Cancelar</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </main>
      
    </TopBar>
  );
}