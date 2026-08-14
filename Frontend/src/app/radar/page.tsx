"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/ace/TopBar";
import { useAuth } from "@/app/auth-context";
import type { Holiday, Escopo } from "@/lib/holidays";
import {
  fetchOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  Opportunity,
} from "@/lib/opportunities-api";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

type Enriched = {
  id: string; // numeric string or id
  rawId?: number; // numeric id for API CRUD
  nome: string;
  data: string; // dd/mm/yyyy
  isoDate: string; // yyyy-mm-dd
  description?: string;
  tipo: string;
  escopo: Escopo;
  local?: string;
  date: Date;
  score: "high" | "medium" | "low";
  audience: number;
  ticket: string;
  coupon: string;
  channels: string[];
  daysAway: number;
  isCustom?: boolean;
};

const SCOPE_LABEL: Record<Escopo, string> = {
  nacional: "Nacional",
  estadual: "Estadual",
  municipal: "Municipal",
};
const SCOPE_STYLE: Record<Escopo, string> = {
  nacional: "bg-card text-foreground border-border",
  estadual: "bg-[oklch(0.70_0.18_240/0.15)] text-[oklch(0.85_0.14_240)] border-[oklch(0.70_0.18_240/0.35)]",
  municipal: "bg-[oklch(0.74_0.18_145/0.15)] text-[oklch(0.85_0.16_145)] border-[oklch(0.74_0.18_145/0.35)]",
};

const META: Record<string, { score: number; audience: number; ticket: string; coupon: string; channels: string[] }> = {
  "Dia dos Namorados": { score: 94, audience: 1240, ticket: "R$ 387", coupon: "AMOR20", channels: ["Instagram", "WhatsApp"] },
  Natal: { score: 96, audience: 2180, ticket: "R$ 512", coupon: "NATAL25", channels: ["Instagram", "WhatsApp"] },
  "Confraternização Universal": { score: 72, audience: 640, ticket: "R$ 210", coupon: "ANO26", channels: ["Instagram"] },
  Carnaval: { score: 81, audience: 1480, ticket: "R$ 298", coupon: "FOLIA15", channels: ["Instagram", "WhatsApp"] },
  Tiradentes: { score: 58, audience: 420, ticket: "R$ 180", coupon: "TIRA10", channels: ["WhatsApp"] },
  "Dia do Trabalho": { score: 64, audience: 720, ticket: "R$ 240", coupon: "TRAB15", channels: ["Instagram"] },
  "Independência do Brasil": { score: 71, audience: 880, ticket: "R$ 265", coupon: "BR07", channels: ["Instagram", "WhatsApp"] },
  "Nossa Senhora Aparecida": { score: 68, audience: 540, ticket: "R$ 220", coupon: "FE12", channels: ["WhatsApp"] },
  Finados: { score: 35, audience: 180, ticket: "R$ 120", coupon: "", channels: [] },
  "Proclamação da República": { score: 62, audience: 510, ticket: "R$ 230", coupon: "REP15", channels: ["Instagram"] },
  "Sexta-feira Santa": { score: 70, audience: 690, ticket: "R$ 250", coupon: "PASCOA20", channels: ["Instagram", "WhatsApp"] },
  "Corpus Christi": { score: 55, audience: 340, ticket: "R$ 190", coupon: "CC10", channels: ["WhatsApp"] },
};

const TODAY = new Date();

function parseFlexibleDate(str: string): Date {
  if (!str) return new Date();
  if (str.includes("-")) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatBrDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatIsoDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

function daysBetween(a: Date, b: Date) {
  const ms = 1000 * 60 * 60 * 24;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((aa - bb) / ms);
}

function seedFrom(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function numericScoreToString(s: number): "high" | "medium" | "low" {
  if (s >= 80) return "high";
  if (s >= 60) return "medium";
  return "low";
}

function formatScore(s: "high" | "medium" | "low") {
  if (s === "high") return "Alto";
  if (s === "medium") return "Médio";
  return "Baixo";
}

function enrichOpportunity(item: Opportunity | Holiday): Enriched {
  const isApi = "title" in item;
  const title = isApi ? item.title : item.nome;
  const rawDateStr = isApi ? item.date : item.data;
  const dateObj = parseFlexibleDate(rawDateStr);
  const brDateStr = formatBrDate(dateObj);
  const isoDateStr = formatIsoDate(dateObj);
  const escopo = (item.escopo as Escopo) || "nacional";
  const local = item.local || undefined;
  const idStr = String(item.id);
  const description = isApi ? item.description || undefined : undefined;

  const meta = META[title];
  const fallback = (() => {
    const seed = seedFrom(title + brDateStr);
    return {
      score: 55 + (seed % 35),
      audience: 350 + (seed % 900),
      ticket: `R$ ${190 + (seed % 250)}`,
      coupon: `PROMO${(seed % 30) + 5}`,
      channels: ["Instagram"],
    };
  })();
  const m = meta ?? fallback;

  const scoreFromItem = isApi ? (item as Opportunity).score : undefined;
  const scoreVal = scoreFromItem || numericScoreToString(m.score);

  return {
    id: idStr,
    rawId: typeof item.id === "number" ? item.id : undefined,
    nome: title,
    data: brDateStr,
    isoDate: isoDateStr,
    description,
    tipo: isApi ? "custom" : item.tipo,
    escopo,
    local,
    date: dateObj,
    daysAway: daysBetween(dateObj, TODAY),
    score: scoreVal,
    audience: m.audience,
    ticket: m.ticket,
    coupon: m.coupon,
    channels: m.channels,
    isCustom: isApi,
  };
}

function scoreColor(s: "high" | "medium" | "low") {
  if (s === "high") return "text-[oklch(0.78_0.18_155)]";
  if (s === "medium") return "text-[oklch(0.85_0.16_85)]";
  return "text-[oklch(0.70_0.22_25)]";
}
function scoreBg(s: "high" | "medium" | "low") {
  if (s === "high") return "bg-[oklch(0.78_0.18_155/0.15)] border-[oklch(0.78_0.18_155/0.30)]";
  if (s === "medium") return "bg-[oklch(0.85_0.16_85/0.15)] border-[oklch(0.85_0.16_85/0.30)]";
  return "bg-[oklch(0.70_0.22_25/0.15)] border-[oklch(0.70_0.22_25/0.30)]";
}

const MONTH_NAMES = [
  "janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro",
];
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function RadarPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    let text = "Bom dia";
    if (hora >= 12 && hora < 18) {
      text = "Boa tarde";
    } else if (hora >= 18 || hora < 5) {
      text = "Boa noite";
    }
    return profile?.company_name ? `${text}, ${profile.company_name}` : text;
  }, [profile]);
  const [holidays, setHolidays] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Enriched | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formEscopo, setFormEscopo] = useState<Escopo>("nacional");
  const [formLocal, setFormLocal] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca oportunidades reais da API FastAPI conectada ao Supabase
      const dataFromDb = await fetchOpportunities(true);
      if (dataFromDb && dataFromDb.length > 0) {
        setHolidays(dataFromDb.map(enrichOpportunity));
      } else {
        // Se o banco estiver limpo (0 itens), busca feriados padrão para popular inicialmente
        const r = await fetch(`/api/holidays?ano=${TODAY.getFullYear()}`);
        const data = await r.json();
        setHolidays((data.holidays || []).map((h: Holiday) => enrichOpportunity(h)));
      }
    } catch (e: unknown) {
      console.error("Erro ao conectar com Supabase:", e);
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      setError(`Backend FastAPI indisponível em ${apiHost}. Certifique-se de que o servidor está rodando.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upcoming = useMemo(
    () => holidays.filter((h) => h.daysAway >= 0).sort((a, b) => a.daysAway - b.daysAway),
    [holidays],
  );
  const hot = upcoming[0] ?? null;
  const selected = useMemo(
    () => holidays.find((h) => h.id === selectedId) ?? hot,
    [holidays, selectedId, hot],
  );

  const cursorMonth = useMemo(() => {
    const base = hot ? hot.date : TODAY;
    return new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  }, [hot, monthOffset]);

  // Handle open modal for create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormDescription("");
    setFormDate(formatIsoDate(TODAY));
    setFormEscopo("nacional");
    setFormLocal("");
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEditModal = (item: Enriched) => {
    setEditingItem(item);
    setFormTitle(item.nome);
    setFormDescription(item.description || "");
    setFormDate(item.isoDate);
    setFormEscopo(item.escopo);
    setFormLocal(item.local || "");
    setIsModalOpen(true);
  };

  // Handle save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate) return;

    setIsSaving(true);
    try {
      if (editingItem && editingItem.rawId) {
        // Update no Supabase via FastAPI
        await updateOpportunity(editingItem.rawId, {
          title: formTitle,
          description: formDescription || undefined,
          date: formDate,
          escopo: formEscopo,
          local: formLocal || undefined,
        });
      } else {
        // Create no Supabase via FastAPI
        await createOpportunity({
          title: formTitle,
          description: formDescription || undefined,
          date: formDate,
          escopo: formEscopo,
          local: formLocal || undefined,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || "Erro ao salvar oportunidade");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (item: Enriched) => {
    if (!confirm(`Deseja realmente excluir a oportunidade "${item.nome}"?`)) return;

    setIsDeleting(true);
    try {
      if (item.rawId) {
        await deleteOpportunity(item.rawId);
      }
      if (selectedId === item.id) {
        setSelectedId(null);
      }
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || "Erro ao excluir oportunidade");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TopBar>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="animate-float-up">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {saudacao} <span className="inline-block">👋</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Calendário estratégico de oportunidades e datas comemorativas</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-lg glow-brand transition hover:scale-[1.03] active:scale-[0.98]"
            >
              <Plus size={16} /> Nova Oportunidade
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success animate-float-up">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <Zap size={12} />
              {holidays.length} oportunidades carregadas
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-[oklch(0.70_0.22_25/0.30)] bg-[oklch(0.70_0.22_25/0.10)] px-4 py-3 text-sm text-[oklch(0.78_0.18_25)]">
            Aviso de sincronização: {error}.
          </div>
        )}

        {loading ? (
          <div className="mt-10 grid place-items-center rounded-3xl card-surface p-16">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="animate-spin" size={18} /> Carregando oportunidades…
            </div>
          </div>
        ) : selected ? (
          <>
            <FeaturedCard
              selected={selected}
              isHot={selected.id === hot?.id}
              onEdit={() => handleOpenEditModal(selected)}
              onDelete={() => handleDelete(selected)}
              isDeleting={isDeleting}
            />

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CalendarGrid
                  cursorMonth={cursorMonth}
                  holidays={holidays}
                  selectedId={selected.id}
                  hotId={hot?.id ?? null}
                  onSelect={(id) => setSelectedId(id)}
                  onPrev={() => setMonthOffset((n) => n - 1)}
                  onNext={() => setMonthOffset((n) => n + 1)}
                  onToday={() => setMonthOffset(0)}
                />
              </div>
              <UpcomingList
                items={upcoming.slice(0, 10)}
                selectedId={selected.id}
                hotId={hot?.id ?? null}
                onSelect={(id) => setSelectedId(id)}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl card-surface px-6 py-5">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Sparkles size={16} className="text-gradient-brand" />
                A IA já está pronta para gerar arte, legendas e segmentação para{" "}
                <span className="font-semibold text-foreground">{selected.nome}</span>.
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem("ace.selectedHoliday", JSON.stringify(selected));
                  router.push("/gerador");
                }}
                className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-brand px-6 text-sm font-semibold text-white glow-brand transition hover:scale-[1.02] active:scale-[0.99]"
              >
                Gerar campanha agora
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-3xl card-surface p-10 text-center text-muted-foreground">
            Nenhuma oportunidade disponível. <button onClick={handleOpenCreateModal} className="text-primary underline">Cadastrar primeira oportunidade</button>
          </div>
        )}
      </main>

      {/* Modal Modal (Criar / Editar) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-background/95 card-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-lg font-bold">
                {editingItem ? "Editar Oportunidade" : "Nova Oportunidade"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Título da Oportunidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Liquidação de Primavera, Black Friday..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Escopo
                  </label>
                  <select
                    value={formEscopo}
                    onChange={(e) => setFormEscopo(e.target.value as Escopo)}
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="nacional">Nacional</option>
                    <option value="estadual">Estadual</option>
                    <option value="municipal">Municipal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Localidade / UF (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SP, São Paulo/SP"
                    value={formLocal}
                    onChange={(e) => setFormLocal(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhes ou observações sobre a data promocional..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border/80 px-4 py-2 text-xs font-medium hover:bg-card"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2 text-xs font-semibold text-white glow-brand hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : "Salvar Oportunidade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TopBar>
  );
}

function FeaturedCard({
  selected,
  isHot,
  onEdit,
  onDelete,
  isDeleting,
}: {
  selected: Enriched;
  isHot: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="relative mt-8">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-brand opacity-20 blur-3xl" />
      <div className="border-gradient-brand rounded-3xl p-7 sm:p-9 card-surface flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-danger/10 border border-danger/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-danger">
            <Flame size={12} />
            {isHot ? "Oportunidade em alta agora" : "Oportunidade selecionada"}
          </div>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{selected.nome}</h2>
          {selected.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{selected.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon size={14} /> {selected.data}
            <span>·</span>
            <span>
              {selected.daysAway === 0
                ? "hoje"
                : selected.daysAway > 0
                ? `em ${selected.daysAway} dias`
                : `há ${Math.abs(selected.daysAway)} dias`}
            </span>
            <span
              className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${SCOPE_STYLE[selected.escopo]}`}
            >
              {SCOPE_LABEL[selected.escopo]}
              {selected.local ? ` · ${selected.local}` : ""}
            </span>
          </div>
        </div>

        {/* Action Buttons for Edit / Delete */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            title="Editar Oportunidade"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-3 py-2 text-xs font-medium hover:bg-card hover:border-primary transition"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Excluir Oportunidade"
            className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/20 transition disabled:opacity-50"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarGrid({
  cursorMonth, holidays, selectedId, hotId, onSelect, onPrev, onNext, onToday,
}: {
  cursorMonth: Date;
  holidays: Enriched[];
  selectedId: string;
  hotId: string | null;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const year = cursorMonth.getFullYear();
  const month = cursorMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<number, Enriched>();
  holidays
    .filter((h) => h.date.getFullYear() === year && h.date.getMonth() === month)
    .forEach((h) => byDay.set(h.date.getDate(), h));

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isThisMonthToday = TODAY.getFullYear() === year && TODAY.getMonth() === month;

  return (
    <div className="rounded-3xl card-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-semibold capitalize">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="grid h-9 w-9 place-items-center rounded-lg border border-border/80 hover:bg-card/80" aria-label="Mês anterior">
            <ChevronLeft size={16} />
          </button>
          <button onClick={onToday} className="rounded-lg border border-border/80 px-3 py-1.5 text-xs font-medium hover:bg-card/80">
            Hoje
          </button>
          <button onClick={onNext} className="grid h-9 w-9 place-items-center rounded-lg border border-border/80 hover:bg-card/80" aria-label="Próximo mês">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        {WEEK_DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square" />;
          const h = byDay.get(day);
          const isToday = isThisMonthToday && day === TODAY.getDate();
          const isSelected = h && h.id === selectedId;
          const isHot = h && h.id === hotId;
          const base = "aspect-square rounded-lg p-1.5 text-left transition";
          if (!h) {
            return (
              <div key={i} className={`${base} border border-border/40 text-xs text-muted-foreground ${isToday ? "ring-1 ring-border/80" : ""}`}>
                {day}
              </div>
            );
          }
          return (
            <button
              key={i}
              onClick={() => onSelect(h.id)}
              className={`${base} border hover:scale-[1.03] ${scoreBg(h.score)} ${isSelected ? "border-primary bg-card" : ""} ${isToday ? "ring-1 ring-border/80" : ""}`}
              title={h.nome}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-bold">{day}</span>
                {isHot && <Flame size={11} className="text-[oklch(0.78_0.18_25)]" />}
              </div>
              <div className="mt-0.5 truncate text-[9px] font-medium text-foreground/90">{h.nome}</div>
              <div className={`text-[9px] font-bold ${scoreColor(h.score)}`}>{formatScore(h.score)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingList({
  items,
  selectedId,
  hotId,
  onSelect,
  onEdit,
  onDelete,
}: {
  items: Enriched[];
  selectedId: string;
  hotId: string | null;
  onSelect: (id: string) => void;
  onEdit: (item: Enriched) => void;
  onDelete: (item: Enriched) => void;
}) {
  return (
    <div className="rounded-3xl card-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp size={16} className="text-gradient-brand" />
          Próximas oportunidades
        </div>
      </div>
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {items.map((h) => {
          const active = h.id === selectedId;
          const isHot = h.id === hotId;
          return (
            <div
              key={h.id}
              className={`group flex items-center justify-between gap-2 rounded-xl border p-3 text-left transition hover:bg-card/80 ${active ? "border-primary bg-card/60" : "border-border/30"}`}
            >
              <button
                onClick={() => onSelect(h.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {isHot && <Flame size={12} className="text-[oklch(0.78_0.18_25)]" />}
                  {h.nome}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{h.data} · em {h.daysAway}d</span>
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${SCOPE_STYLE[h.escopo]}`}>
                    {SCOPE_LABEL[h.escopo]}
                  </span>
                </div>
              </button>
              
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${scoreColor(h.score)} mr-1`}>{formatScore(h.score)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(h);
                  }}
                  title="Editar"
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(h);
                  }}
                  title="Excluir"
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-danger transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
