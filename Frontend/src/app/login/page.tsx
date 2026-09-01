"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LucideRocket, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  MailCheck, 
  Eye, 
  EyeOff,
  XCircle,
  LogIn
} from "lucide-react";
import Link from "next/link";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams.get("invite");
  const inviteEmail = searchParams.get("email") || "";
  const inviteCompany = searchParams.get("company") || "";

  const isInviteFlow = Boolean(inviteToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("Brand Manager");
  
  const [inviteStatus, setInviteStatus] = useState<"checking" | "valid" | "invalid">(
    isInviteFlow ? "checking" : "valid"
  );
  const [inviteErrorReason, setInviteErrorReason] = useState<string>("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [emailConfirmationNotice, setEmailConfirmationNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validação do convite diretamente no Supabase ao montar o componente
  useEffect(() => {
    async function validateInvite() {
      if (!isInviteFlow || !inviteToken) {
        setInviteStatus("valid");
        return;
      }

      setInviteStatus("checking");

      try {
        // 1. Tenta buscar pelo token (ID do convite)
        const { data: inviteById, error: errId } = await supabase
          .from("invitations")
          .select("*")
          .eq("id", inviteToken)
          .single();

        let activeInvite = inviteById;

        // 2. Fallback de busca por e-mail caso o ID tenha sido gerado com padrão diferente
        if (!activeInvite && inviteEmail) {
          const { data: inviteByEmail } = await supabase
            .from("invitations")
            .select("*")
            .ilike("email", inviteEmail.trim())
            .single();

          activeInvite = inviteByEmail;
        }

        if (!activeInvite) {
          setInviteStatus("invalid");
          setInviteErrorReason("Este link de convite não foi encontrado ou foi excluído pelo administrador.");
          return;
        }

        if (activeInvite.status === "Aceito") {
          setInviteStatus("invalid");
          setInviteErrorReason("Este convite já foi aceito e ativado anteriormente. Acesse sua conta pelo formulário de login.");
          return;
        }

        // Convite válido e pendente
        setInviteStatus("valid");
        setEmail(activeInvite.email || inviteEmail);
        setCompanyName(activeInvite.company_name || activeInvite.companyName || inviteCompany || "Minha Empresa");
        setRole(activeInvite.role || "Brand Manager");

      } catch (err) {
        console.error("Erro ao validar convite:", err);
        setInviteStatus("invalid");
        setInviteErrorReason("Erro de conexão ao validar o convite no banco de dados.");
      }
    }

    validateInvite();
  }, [inviteToken, isInviteFlow, inviteEmail, inviteCompany]);

  const markConviteAsAceito = async (targetEmail: string, company?: string) => {
    try {
      if (targetEmail) {
        await supabase
          .from("invitations")
          .update({ status: "Aceito" })
          .ilike("email", targetEmail.trim());
      }
      if (company) {
        await supabase
          .from("invitations")
          .update({ status: "Aceito" })
          .ilike("company_name", company.trim());
      }
    } catch (err) {
      console.warn("Aviso: Falha ao atualizar status na tabela 'invitations':", err);
    }
  };

  const handleLoginOrActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setEmailConfirmationNotice(false);
    setLoading(true);

    try {
      if (isInviteFlow) {
        // FLUXO DE ATIVAÇÃO DE CONVITE (CRIAÇÃO DE SENHA E CONTA)
        if (password.length < 6) {
          setErrorMsg("A senha deve conter no mínimo 6 caracteres.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg("As senhas digitadas não coincidem.");
          setLoading(false);
          return;
        }

        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const emailRedirectTo = origin ? `${origin}/login` : undefined;

        // 1. Tenta cadastrar o usuário no Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: {
              company_name: companyName || "Minha Empresa",
              role: role || "Brand Manager",
            },
          },
        });

        // 2. Se a conta já existir no Supabase, conecta com a senha digitada
        if (signUpError) {
          const isAlreadyRegistered = signUpError.message.toLowerCase().includes("already registered") || 
                                      signUpError.message.toLowerCase().includes("already exists");
          
          if (isAlreadyRegistered) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              const msg = signInError.message.toLowerCase();
              if (msg.includes("invalid login credentials")) {
                setErrorMsg("Este e-mail já possui uma conta cadastrada no Supabase, mas a senha digitada não confere. Digite a senha correta da sua conta.");
              } else if (msg.includes("email not confirmed")) {
                setErrorMsg(`O e-mail ${email} ainda não foi confirmado no Supabase. Acesse seu e-mail e clique no link de confirmação.`);
              } else {
                setErrorMsg(signInError.message || "Erro ao conectar conta existente.");
              }
              setLoading(false);
              return;
            } else if (signInData.session) {
              await markConviteAsAceito(email, companyName);
              
              // Atualiza o perfil com o role do convite
              if (signInData.user) {
                try {
                  await supabase.from("profiles").upsert({
                    id: signInData.user.id,
                    company_name: companyName || "Minha Empresa",
                    role: role || "Brand Manager",
                  });
                } catch (err) {
                  console.error("Erro ao atualizar perfil:", err);
                }
              }

              document.cookie = `sb-access-token=${signInData.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
              setSuccessMsg("Conta ativada com sucesso! Redirecionando para o Studio...");
              setTimeout(() => {
                window.location.href = "/radar";
              }, 1000);
              return;
            }
          } else {
            setErrorMsg(signUpError.message || "Erro ao cadastrar conta no Supabase.");
            setLoading(false);
            return;
          }
        }

        // 3. Se a conta foi criada com sessão ativa imediata
        if (signUpData?.session) {
          await markConviteAsAceito(email, companyName);
          document.cookie = `sb-access-token=${signUpData.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          
          if (signUpData.user) {
            try {
              await supabase.from("profiles").upsert({
                id: signUpData.user.id,
                company_name: companyName || "Minha Empresa",
                role: role || "Brand Manager",
              });
            } catch (err) {
              console.error("Erro ao gravar perfil com role:", err);
            }
          }

          setSuccessMsg("Conta criada e ativada com sucesso! Entrando no Studio...");
          setTimeout(() => {
            window.location.href = "/radar";
          }, 1000);
          return;
        }

        // 4. Se a conta foi criada mas exige confirmação por e-mail
        if (signUpData?.user) {
          await markConviteAsAceito(email, companyName);
          
          try {
            await supabase.from("profiles").upsert({
              id: signUpData.user.id,
              company_name: companyName || "Minha Empresa",
              role: role || "Brand Manager",
            });
          } catch (err) {
            console.error("Erro ao salvar perfil pendente:", err);
          }

          const isUnconfirmed = signUpData.user.identities && signUpData.user.identities.length === 0;
          if (isUnconfirmed) {
            setErrorMsg(`O e-mail ${email} já consta no Supabase como pendente ou existente.`);
          } else {
            setEmailConfirmationNotice(true);
          }
        }

      } else {
        // FLUXO NORMAL DE LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("invalid login credentials")) {
            setErrorMsg("E-mail ou senha incorretos.");
          } else if (msg.includes("email not confirmed")) {
            setErrorMsg(`O e-mail ${email} precisa ser confirmado antes de fazer login.`);
          } else {
            setErrorMsg(error.message);
          }
        } else if (data.session) {
          markConviteAsAceito(email);
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          window.location.href = "/radar";
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro ao processar sua solicitação.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 z-10">
      {/* Logotipo/Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand animate-gradient-shift shadow-card">
          <LucideRocket className="text-white" size={22} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          {isInviteFlow ? (
            <span>Ativar <span className="text-gradient-brand">Convite ACE</span></span>
          ) : (
            <span>Entrar no <span className="text-gradient-brand">ACE</span></span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isInviteFlow 
            ? "Defina sua senha de acesso para aceitar o convite da sua empresa."
            : "Acesse a inteligência de marketing para sua marca de bebidas."
          }
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md p-8 shadow-xl">
        {/* Estado 1: Verificando validade do convite */}
        {isInviteFlow && inviteStatus === "checking" && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 size={28} className="animate-spin text-primary" />
            <div className="text-sm font-semibold">Validando convite de ativação...</div>
            <p className="text-xs text-muted-foreground">Aguarde enquanto verificamos os dados no sistema.</p>
          </div>
        )}

        {/* Estado 2: Convite Inválido ou Excluído */}
        {isInviteFlow && inviteStatus === "invalid" && (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
              <XCircle size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">Convite Indisponível</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {inviteErrorReason || "Este link de convite expirou, foi cancelado ou já foi utilizado."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-6 py-3 text-sm font-bold text-white shadow-card transition hover:scale-[1.01]"
              >
                <LogIn size={16} /> Ir para Tela de Login
              </Link>
            </div>
          </div>
        )}

        {/* Estado 3: Convite Válido ou Login Normal */}
        {inviteStatus === "valid" && (
          <>
            {isInviteFlow && (
              <div className="mb-6 p-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-xs font-semibold text-primary flex items-center gap-2">
                <ShieldCheck size={18} className="shrink-0" />
                <div>
                  <div>Convite B2B Validado · {role}</div>
                  <div className="text-muted-foreground font-normal text-[11px]">
                    Marca: <strong className="text-foreground">{companyName || "Sua Empresa"}</strong>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginOrActivate} className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 space-y-1 animate-shake">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle size={14} /> Erro de Autenticação
                  </div>
                  <p className="text-[11px] font-normal leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {emailConfirmationNotice && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 space-y-2 animate-float-up">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <MailCheck size={18} /> Confirmação de E-mail Pendente
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Enviamos um e-mail de confirmação para <strong className="text-foreground">{email}</strong>. Acesse sua caixa de entrada e clique no link para ativar o acesso.
                  </p>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-success/10 border border-success/30 text-xs font-semibold text-success flex items-center gap-2">
                  <UserCheck size={16} /> {successMsg}
                </div>
              )}

              {!emailConfirmationNotice && (
                <>
                  <div className="space-y-4">
                    {/* Empresa (apenas se for fluxo de convite) */}
                    {isInviteFlow && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Empresa / Marca Convidada
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground pointer-events-none">
                            <Building2 size={16} />
                          </span>
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Nome da Marca"
                            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition text-sm font-medium"
                          />
                        </div>
                      </div>
                    )}

                    {/* E-mail Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        E-mail
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground pointer-events-none">
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          required
                          readOnly={isInviteFlow && Boolean(inviteEmail)}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="empresa@exemplo.com"
                          className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition text-sm font-medium ${
                            isInviteFlow && Boolean(inviteEmail) ? "opacity-80 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Senha Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {isInviteFlow ? "Criar Sua Senha" : "Senha"}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground pointer-events-none">
                          <Lock size={16} />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-11 pr-11 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition text-sm font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirmar Senha (apenas se for fluxo de convite) */}
                    {isInviteFlow && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Confirmar Senha
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground pointer-events-none">
                            <Lock size={16} />
                          </span>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-11 pr-11 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition text-sm font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão de Enviar */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isInviteFlow ? (
                      <>
                        Ativar Minha Conta <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                      </>
                    ) : (
                      <>
                        Entrar na Conta <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </>
              )}
            </form>

            {/* Aviso de Plataforma Privada por Convite */}
            <div className="mt-6 pt-5 border-t border-border/30 text-center text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground">Plataforma Privada B2B</span>
              <p>O acesso é restrito a marcas convidadas. Solicite seu convite ao administrador.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12 overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-gradient-brand opacity-15 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] rounded-full bg-brand-soft opacity-20 blur-[80px] pointer-events-none" />

      <Suspense fallback={
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} /> Carregando...
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
