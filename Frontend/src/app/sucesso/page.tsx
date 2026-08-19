"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { fetchCampaigns, CampaignDb } from "@/lib/opportunities-api";
import { 
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
  Loader2
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
  const [abaAtiva, setAbaAtiva] = useState<"geral" | "post">("geral");
  const [dadosGeral, setDadosGeral] = useState<any>({ followers: 0, impressions: 0, reach: 0, profileViews: 0, username: "carregando" });
  const [dadosPost, setDadosPost] = useState<any>({ likes: 0, commentsCount: 0, reach: 0, comentarios: [] });
  const [share, setShare] = useState(false);

  // Histórico de campanhas salvas no banco
  const [campaignsHistory, setCampaignsHistory] = useState<CampaignDb[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const fetchPostMetrics = async (mediaId: string) => {
    setLoadingPost(true);
    try {
      const res = await fetch(`${API_BASE}/api/instagram/dashboard/post/${mediaId}`, {
        cache: "no-store",
        headers: { 'Cache-Control': 'no-cache' }
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
      const resPost = await fetch(`${API_BASE}/api/instagram/dashboard/post/recente`, {
        cache: "no-store",
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (resPost.ok) setDadosPost(await resPost.json());
    } catch (err) {
      console.error("Erro ao buscar post recente", err);
    } finally {
      setLoadingPost(false);
    }
  };

  useEffect(() => {
    async function carregarDashboard() {
      try {
        // 1. Carrega dados gerais da conta
        const resGeral = await fetch(`${API_BASE}/api/instagram/dashboard/geral`, {
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (resGeral.ok) setDadosGeral(await resGeral.json());

        // 2. Carrega lista de campanhas salvas
        const dbCampaigns = await fetchCampaigns().catch(() => []);
        setCampaignsHistory(dbCampaigns || []);

        // 3. Seleção Padrão (Auto-seleciona a campanha mais recente gravada)
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
        
        {/* Header Principal */}
        <div className="text-center space-y-3">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand animate-gradient-shift shadow-card">
            <LucideRocket className="text-white" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Painel de <span className="text-gradient-brand">resultados</span>
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Monitoramento de performance
          </p>
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
          ) : (
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
                          {c.title} — {formatCampaignOptionDate(c.date)}
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
          )}
        </div>

        {/* Botões de Ação Inferiores */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={() => router.push("/radar")} 
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-6 py-4 text-sm font-bold text-white shadow-card transition duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Voltar ao Radar <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </main>
      
    </TopBar>
  );
}