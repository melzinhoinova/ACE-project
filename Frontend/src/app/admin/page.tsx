"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/ace/TopBar";
import { useAuth } from "@/app/auth-context";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { 
  Building2, 
  Check, 
  Copy, 
  Crown, 
  Link as LinkIcon, 
  Loader2, 
  Mail, 
  Pencil, 
  Plus, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles, 
  Trash2, 
  UserCheck, 
  UserPlus, 
  Users, 
  X,
  UserX,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

type Convite = {
  id: string;
  email: string;
  companyName: string;
  role: string;
  createdAt: string;
  status: "Pendente" | "Aceito";
  inviteUrl: string;
};

type ActiveUser = {
  id: string;
  email: string;
  company_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string | null;
};

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"convites" | "usuarios">("convites");

  // Form states
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("Brand Manager");
  const [loading, setLoading] = useState(false);
  const [successInvite, setSuccessInvite] = useState<Convite | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successActionMsg, setSuccessActionMsg] = useState<string | null>(null);

  // Active Users state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Modal de edição de convite
  const [editingConvite, setEditingConvite] = useState<Convite | null>(null);

  // Lista local de convites emitidos
  const [convites, setConvites] = useState<Convite[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ace.convites");
      if (stored) {
        try { return JSON.parse(stored); } catch { /* ignore */ }
      }
    }
    return [];
  });

  const fetchActiveUsers = async () => {
    setLoadingUsers(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiBase}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setActiveUsers(data);
      } else {
        // Fallback direto via Supabase caso a API backend esteja offline
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, company_name, avatar_url, role, created_at");
        
        if (profiles) {
          setActiveUsers(profiles.map((p) => ({
            id: p.id,
            email: "Supabase User",
            company_name: p.company_name || "Sem Nome",
            role: p.role || "Brand Manager",
            avatar_url: p.avatar_url,
            created_at: p.created_at,
          })));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar usuários ativos:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Sincroniza convites e busca usuários ativos
  useEffect(() => {
    async function syncWithSupabase() {
      try {
        const { data: profiles } = await supabase.from("profiles").select("company_name, email");
        const registeredCompanies = (profiles || [])
          .map((p) => p.company_name?.toLowerCase().trim())
          .filter(Boolean);
        const registeredEmails = (profiles || [])
          .map((p) => p.email?.toLowerCase().trim())
          .filter(Boolean);

        const { data: remoteInvites } = await supabase.from("invitations").select("*");

        const acceptedRemoteEmails = (remoteInvites || [])
          .filter((r: any) => r.status === "Aceito")
          .map((r: any) => r.email?.toLowerCase().trim())
          .filter(Boolean);

        const acceptedRemoteCompanies = (remoteInvites || [])
          .filter((r: any) => r.status === "Aceito")
          .map((r: any) => (r.company_name || r.companyName)?.toLowerCase().trim())
          .filter(Boolean);

        setConvites((prev) => {
          let updated = false;
          let currentList = prev;

          if (remoteInvites && remoteInvites.length > 0) {
            const mappedRemote: Convite[] = remoteInvites.map((r: any) => ({
              id: r.id || `inv-${r.email}`,
              email: r.email,
              companyName: r.company_name || r.companyName,
              role: r.role || "Brand Manager",
              createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"),
              status: r.status === "Aceito" ? "Aceito" : "Pendente",
              inviteUrl: r.invite_url || `${typeof window !== "undefined" ? window.location.origin : ""}/login?invite=${r.id}&email=${encodeURIComponent(r.email)}`,
            }));

            const existingIds = new Set(prev.map((c) => c.id));
            const newFromRemote = mappedRemote.filter((r) => !existingIds.has(r.id));
            if (newFromRemote.length > 0) {
              currentList = [...newFromRemote, ...prev];
              updated = true;
            }
          }

          const newList = currentList.map((item) => {
            const emailKey = item.email.toLowerCase().trim();
            const companyKey = item.companyName.toLowerCase().trim();

            const isRegisteredByCompany = registeredCompanies.includes(companyKey) || acceptedRemoteCompanies.includes(companyKey);
            const isRegisteredByEmail = registeredEmails.includes(emailKey) || acceptedRemoteEmails.includes(emailKey);
            
            if ((isRegisteredByCompany || isRegisteredByEmail) && item.status !== "Aceito") {
              updated = true;
              return { ...item, status: "Aceito" as const };
            }
            return item;
          });

          if (updated && typeof window !== "undefined") {
            localStorage.setItem("ace.convites", JSON.stringify(newList));
          }
          return updated ? newList : prev;
        });

      } catch (err) {
        console.error("Erro ao sincronizar perfis/convites do Supabase:", err);
      }
    }

    syncWithSupabase();
    fetchActiveUsers();
  }, []);

  const saveConvites = (items: Convite[]) => {
    setConvites(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("ace.convites", JSON.stringify(items));
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !companyName) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessInvite(null);

    try {
      const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const origin = typeof window !== "undefined" ? window.location.origin : "https://ace-project-tan.vercel.app";
      const inviteUrl = `${origin}/login?invite=${token}&email=${encodeURIComponent(email)}&company=${encodeURIComponent(companyName)}`;

      const novoConvite: Convite = {
        id: token,
        email,
        companyName,
        role,
        createdAt: new Date().toLocaleDateString("pt-BR"),
        status: "Pendente",
        inviteUrl,
      };

      // 1. Salva na tabela 'invitations' do Supabase
      try {
        await supabase.from("invitations").upsert({
          id: novoConvite.id,
          email: novoConvite.email,
          company_name: novoConvite.companyName,
          role: novoConvite.role,
          status: "Pendente",
          invite_url: inviteUrl,
        });
      } catch (dbErr) {
        console.warn("Aviso: Não foi possível salvar na tabela 'invitations' do Supabase:", dbErr);
      }

      // 2. Dispara e-mail de convite via Backend API (FastAPI)
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        await fetch(`${apiBase}/api/invite-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: novoConvite.email,
            company_name: novoConvite.companyName,
            role: novoConvite.role,
            invite_url: inviteUrl,
          }),
        });
      } catch (emailErr) {
        console.warn("Aviso: Falha ao chamar a API de e-mail do backend:", emailErr);
      }

      const atualizados = [novoConvite, ...convites];
      saveConvites(atualizados);
      setSuccessInvite(novoConvite);

      // Limpa formulário
      setEmail("");
      setCompanyName("");
    } catch (err: any) {
      console.error("Erro ao gerar convite:", err);
      setErrorMsg(err.message || "Não foi possível enviar o convite.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleDeleteConvite = async (conviteId: string, company: string) => {
    if (!confirm(`Deseja realmente revogar/excluir o convite de "${company}"? O link deixará de funcionar imediatamente.`)) return;

    try {
      const targetConvite = convites.find((c) => c.id === conviteId);
      if (targetConvite) {
        await supabase.from("invitations").delete().or(`id.eq.${conviteId},email.eq.${targetConvite.email}`);
      } else {
        await supabase.from("invitations").delete().eq("id", conviteId);
      }
    } catch (err) {
      console.warn("Aviso: Falha ao excluir convite no Supabase:", err);
    }

    const atualizados = convites.filter((c) => c.id !== conviteId);
    saveConvites(atualizados);
    if (successInvite?.id === conviteId) setSuccessInvite(null);
  };

  const handleDeleteUserAccount = async (targetUser: ActiveUser) => {
    const promptConfirm = confirm(
      `ATENÇÃO: Deseja realmente excluir permanentemente a conta de "${targetUser.company_name}" (${targetUser.email})?\n\nEsta ação excluirá o usuário do Supabase Auth e revogará seu acesso imediatamente.`
    );
    if (!promptConfirm) return;

    setDeletingUserId(targetUser.id);
    setSuccessActionMsg(null);
    setErrorMsg(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiBase}/api/admin/users/${targetUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Falha ao excluir usuário no backend.");
      }

      setSuccessActionMsg(`Usuário "${targetUser.company_name}" excluído com sucesso do Supabase Auth e perfis.`);
      // Atualiza listas
      await fetchActiveUsers();
      // Remove da lista de convites locais se houver
      const novosConvites = convites.filter((c) => c.email.toLowerCase() !== targetUser.email.toLowerCase());
      saveConvites(novosConvites);

    } catch (err: any) {
      console.error("Erro ao deletar usuário:", err);
      setErrorMsg(err.message || "Erro ao excluir conta de usuário.");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvite) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "https://ace-project-tan.vercel.app";
    const newUrl = `${origin}/login?invite=${editingConvite.id}&email=${encodeURIComponent(editingConvite.email)}&company=${encodeURIComponent(editingConvite.companyName)}`;

    const updatedConvite: Convite = {
      ...editingConvite,
      inviteUrl: newUrl,
    };

    try {
      await supabase.from("invitations").upsert({
        id: updatedConvite.id,
        email: updatedConvite.email,
        company_name: updatedConvite.companyName,
        role: updatedConvite.role,
        status: updatedConvite.status,
        invite_url: newUrl,
      });
    } catch (err) {
      console.warn("Aviso: Falha ao atualizar convite no Supabase:", err);
    }

    const atualizados = convites.map((c) => (c.id === editingConvite.id ? updatedConvite : c));
    saveConvites(atualizados);
    setEditingConvite(null);
  };

  // GUARDA DE ROTA: Bloqueio de Acesso para não-administradores
  if (!authLoading && profile && profile.role !== "Administrador") {
    return (
      <TopBar>
        <main className="mx-auto max-w-xl px-6 py-28 text-center space-y-5 animate-fade-in">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Acesso Restrito a Administradores</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você está conectado como <strong className="text-foreground">{profile.company_name || user?.email}</strong> com o papel de <span className="text-primary font-semibold">{profile.role || "Brand Manager"}</span>. Apenas administradores podem gerenciar convites e usuários da plataforma.
            </p>
          </div>
          <div className="pt-4">
            <Link
              href="/radar"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-6 py-3 text-sm font-bold text-white shadow-card transition hover:scale-[1.02]"
            >
              Voltar ao Radar
            </Link>
          </div>
        </main>
      </TopBar>
    );
  }

  return (
    <TopBar>
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header Principal */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck size={14} /> Módulo Restrito · Painel Administrativo
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Gestão de <span className="text-gradient-brand">Acessos & Usuários</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie os convites de onboarding e administre as contas ativas na plataforma privada B2B.
            </p>
          </div>

          {/* Seletor de Abas */}
          <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/60 p-1.5 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("convites")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "convites"
                  ? "bg-gradient-brand text-white shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus size={15} /> Convites B2B ({convites.length})
            </button>
            <button
              onClick={() => setActiveTab("usuarios")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "usuarios"
                  ? "bg-gradient-brand text-white shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={15} /> Usuários Ativos ({activeUsers.length})
            </button>
          </div>
        </div>

        {/* Mensagens de Feedback Global */}
        {successActionMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-success/10 border border-success/30 text-xs font-semibold text-success flex items-center justify-between gap-2 animate-float-up">
            <div className="flex items-center gap-2">
              <Check size={16} /> {successActionMsg}
            </div>
            <button onClick={() => setSuccessActionMsg(null)} className="text-success hover:opacity-75">
              <X size={14} />
            </button>
          </div>
        )}

        {activeTab === "convites" ? (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Card do Formulário de Convite */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card">
                <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand text-white shadow-sm">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">Convidar Nova Marca</h2>
                    <p className="text-xs text-muted-foreground">Envie um link de ativação exclusivo</p>
                  </div>
                </div>

                <form onSubmit={handleSendInvite} className="mt-6 space-y-4">
                  {errorMsg && (
                    <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Nome da Empresa / Marca *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                        <Building2 size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Cervejaria Artesanal Alpha"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm font-medium focus:border-primary focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      E-mail do Responsável *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="gestor@marca.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm font-medium focus:border-primary focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Nível de Acesso (Papel)
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background/50 text-sm font-medium focus:border-primary focus:outline-none transition"
                    >
                      <option value="Brand Manager">Gestor de Marca (Brand Manager)</option>
                      <option value="Agência Partner">Agência Partner</option>
                      <option value="Administrador">Administrador da Plataforma</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-3 text-sm font-bold text-white shadow-card transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={16} /> Gerar e Emitir Convite
                      </>
                    )}
                  </button>
                </form>

                {/* Feedback de Convite Gerado com Sucesso */}
                {successInvite && (
                  <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-4 text-xs space-y-3 animate-float-up">
                    <div className="flex items-center gap-2 font-bold text-success text-sm">
                      <UserCheck size={18} /> Convite Gerado com Sucesso!
                    </div>
                    <p className="text-muted-foreground">
                      O link exclusivo para <span className="font-semibold text-foreground">{successInvite.companyName}</span> criar sua conta foi gerado:
                    </p>
                    <div className="flex items-center gap-2 bg-background/80 p-2.5 rounded-xl border border-border">
                      <input
                        type="text"
                        readOnly
                        value={successInvite.inviteUrl}
                        className="bg-transparent text-[11px] font-mono text-muted-foreground flex-1 outline-none truncate"
                      />
                      <button
                        onClick={() => handleCopyLink(successInvite.id, successInvite.inviteUrl)}
                        className="shrink-0 inline-flex items-center gap-1 bg-gradient-brand text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:scale-[1.03]"
                      >
                        {copiedId === successInvite.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === successInvite.id ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Convites */}
            <div className="lg:col-span-7 space-y-6">
              {/* Métricas Rápidas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/60 bg-card p-4 text-center">
                  <div className="text-2xl font-extrabold text-brand">{convites.length}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Total Emitidos</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 text-center">
                  <div className="text-2xl font-extrabold text-success">
                    {convites.filter((c) => c.status === "Aceito").length}
                  </div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Aceitos</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 text-center">
                  <div className="text-2xl font-extrabold text-amber-500">
                    {convites.filter((c) => c.status === "Pendente").length}
                  </div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Pendentes</div>
                </div>
              </div>

              {/* Tabela de Convites com Edição e Exclusão */}
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <Users size={18} className="text-brand" /> Registro de Convites B2B
                  </div>
                  <span className="text-xs text-muted-foreground">{convites.length} convites</span>
                </div>

                <div className="mt-4 space-y-3">
                  {convites.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                      Nenhum convite emitido ainda.
                    </div>
                  ) : (
                    convites.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/40 bg-background/30 hover:bg-background/60 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand font-bold uppercase text-xs">
                            {c.companyName[0]}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-sm text-foreground truncate">{c.companyName}</div>
                            <div className="text-xs text-muted-foreground truncate">{c.email} · <span className="text-muted-foreground/80">{c.role}</span></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              c.status === "Aceito"
                                ? "bg-success/10 border-success/30 text-success"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            }`}
                          >
                            {c.status === "Aceito" ? <Check size={10} /> : null}
                            {c.status}
                          </span>

                          <button
                            onClick={() => handleCopyLink(c.id, c.inviteUrl)}
                            title="Copiar Link de Convite"
                            className="p-2 rounded-xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-card transition"
                          >
                            {copiedId === c.id ? <Check size={14} className="text-success" /> : <LinkIcon size={14} />}
                          </button>

                          <button
                            onClick={() => setEditingConvite(c)}
                            title="Editar Convite"
                            className="p-2 rounded-xl border border-border/80 text-muted-foreground hover:text-primary hover:bg-card transition"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteConvite(c.id, c.companyName)}
                            title="Revogar / Excluir Convite"
                            className="p-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ABA: USUÁRIOS ATIVOS */
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Users size={18} className="text-brand" /> Contas & Usuários Ativos no Supabase
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Lista de contas com acesso habilitado à plataforma. Ao excluir um usuário aqui, seu login é revogado no Supabase Auth e o perfil é excluído.
                  </p>
                </div>
                <button
                  onClick={fetchActiveUsers}
                  disabled={loadingUsers}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition"
                >
                  <RefreshCw size={13} className={loadingUsers ? "animate-spin" : ""} /> Atualizar
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {loadingUsers ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <span>Carregando usuários do sistema...</span>
                  </div>
                ) : activeUsers.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                    Nenhum usuário ativo registrado no momento.
                  </div>
                ) : (
                  activeUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border/40 bg-background/30 hover:bg-background/60 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.company_name} className="h-10 w-10 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white font-bold uppercase text-sm">
                            {u.company_name[0]}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span>{u.company_name}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary/30 bg-primary/10 text-primary">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDeleteUserAccount(u)}
                          disabled={deletingUserId === u.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-500 transition hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {deletingUserId === u.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          Excluir Usuário
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Convite */}
        {editingConvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-3xl border border-border/80 bg-background/95 card-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Pencil size={16} className="text-brand" /> Editar Convite
                </h3>
                <button
                  onClick={() => setEditingConvite(null)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Nome da Empresa / Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={editingConvite.companyName}
                    onChange={(e) => setEditingConvite({ ...editingConvite, companyName: e.target.value })}
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    E-mail do Responsável
                  </label>
                  <input
                    type="email"
                    required
                    value={editingConvite.email}
                    onChange={(e) => setEditingConvite({ ...editingConvite, email: e.target.value })}
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Nível de Acesso (Papel)
                  </label>
                  <select
                    value={editingConvite.role}
                    onChange={(e) => setEditingConvite({ ...editingConvite, role: e.target.value })}
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Brand Manager">Gestor de Marca</option>
                    <option value="Agência Partner">Agência / Parceiro</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Status do Convite
                  </label>
                  <select
                    value={editingConvite.status}
                    onChange={(e) => setEditingConvite({ ...editingConvite, status: e.target.value as "Pendente" | "Aceito" })}
                    className="w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Aceito">Aceito / Ativo</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingConvite(null)}
                    className="rounded-xl border border-border/80 px-4 py-2 text-xs font-medium hover:bg-card"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-brand px-5 py-2 text-xs font-semibold text-white glow-brand hover:scale-[1.02]"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </TopBar>
  );
}
