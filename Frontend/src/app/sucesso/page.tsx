"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/ace/TopBar";
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
  Activity 
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

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const resGeral = await fetch("http://127.0.0.1:8000/api/instagram/dashboard/geral", {
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (resGeral.ok) setDadosGeral(await resGeral.json());

        const resPost = await fetch("http://127.0.0.1:8000/api/instagram/dashboard/post/recente", {
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (resPost.ok) setDadosPost(await resPost.json());
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard do Meta", err);
      }
    }
    carregarDashboard();
  }, []);

  const totalFollowers = useCounter(dadosGeral?.followers || 0);
  const totalImpressions = useCounter(dadosGeral?.impressions || 0);
  const totalReachGeral = useCounter(dadosGeral?.reach || 0);
  const totalProfileViews = useCounter(dadosGeral?.profileViews || 0);

  const postLikes = useCounter(dadosPost?.likes || 0);
  const postCommentsCount = useCounter(dadosPost?.commentsCount || 0);
  const postReach = useCounter(dadosPost?.reach || 0);

  // Proteção contra divisão por zero e propriedades undefined no engajamento
  const taxaEngajamento = useMemo(() => {
    if (!dadosPost || !dadosPost.reach || dadosPost.reach === 0) return 0;
    const likes = dadosPost.likes || 0;
    const comments = dadosPost.commentsCount || 0;
    const interacoes = likes + comments;
    return Math.min(100, Math.round((interacoes / dadosPost.reach) * 100));
  }, [dadosPost]);

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
            Painel de resultados <span className="text-gradient-brand">Live Analytics</span>
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Monitoramento de performance automatizado via Meta v25.0 Graph Engine.
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
              Métricas do Post Recente
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
              {/* CARDS DO POST CRIADO */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Metric icon={<Heart size={20} className="text-red-500 fill-red-500" />} label="Curtidas Disponíveis" value={postLikes.toString()} sub="Engajamento ativo na publicação" delay={0} />
                <Metric icon={<BarChart3 size={20} className="text-brand" />} label="Alcance Dedicado" value={postReach.toLocaleString("pt-BR")} sub="Pessoas que receberam o post no feed" delay={100} />
                <Metric icon={<MessageSquare size={20} className="text-brand" />} label="Comentários Totais" value={postCommentsCount.toString()} sub="Interações discursivas catalogadas" delay={200} pulse />
              </div>

              {/* DASHBOARD LAYOUT MIX */}
              <div className="md:grid-cols-3 gap-6">
                {/* Central Informativa de Comentários */}
                <div className="md:col-span-2 rounded-3xl border border-border/60 bg-card p-6 shadow-card flex flex-col justify-between animate-float-up" style={{ animationDelay: '300ms' }}>
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
          <button 
            onClick={() => setShare(true)} 
            className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-6 py-4 text-sm font-bold transition duration-300 hover:bg-card hover:scale-[1.02]"
          >
            <Sparkles size={16} className="text-brand" /> Exportar Snapshot de Dados
          </button>
        </div>
      </main>

      {/* Modal de Compartilhamento */}
      {share && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-card animate-float-up">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
                  <Sparkles size={11} /> Compartilhar
                </div>
                <h3 className="mt-3 text-xl font-bold">Relatório Executivo</h3>
                <p className="mt-1 text-sm text-muted-foreground">Disparar snapshots analíticos da campanha.</p>
              </div>
              <button 
                onClick={() => setShare(false)} 
                className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {["Slack Workspace", "E-mail Executivo", "Copiar Link"].map((c) => (
                <button 
                  key={c} 
                  onClick={() => setShare(false)} 
                  className="rounded-2xl border border-border/60 bg-background/40 p-4 text-xs font-bold hover:bg-secondary/60 hover:border-brand/40 transition text-center"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </TopBar>
  );
}