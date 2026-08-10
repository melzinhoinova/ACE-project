"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LucideRocket, Mail, Lock, Building2, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName || "Minha Empresa"
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.user) {
        if (data.session) {
          // Salva o cookie de acesso se logado automaticamente
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          setSuccessMsg("Conta criada com sucesso! Redirecionando...");
          setTimeout(() => {
            router.push("/radar");
            router.refresh();
          }, 1500);
        } else {
          setSuccessMsg("Cadastro realizado com sucesso! Verifique seu e-mail para confirmação.");
        }
      }
    } catch (err: any) {
      setErrorMsg("Ocorreu um erro ao tentar realizar o cadastro.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12 overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-gradient-brand opacity-15 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] rounded-full bg-brand-soft opacity-20 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Logotipo/Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand animate-gradient-shift shadow-card">
            <LucideRocket className="text-white" size={22} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Criar Conta no <span className="text-gradient-brand">ACE</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Cadastre sua empresa e comece a automatizar campanhas inteligentes.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md p-8 shadow-xl">
          <form onSubmit={handleRegister} className="space-y-5">
            
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 animate-shake">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-500">
                {successMsg}
              </div>
            )}

            <div className="space-y-4">
              {/* Nome da Empresa Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Nome da Empresa
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
                    placeholder="Cachaçaria Amburana Ltda"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50 shadow-sm"
                  />
                </div>
              </div>

              {/* E-mail Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@cachacaria.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50 shadow-sm"
                  />
                </div>
              </div>

              {/* Senha Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted-foreground pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Criar minha Conta <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Link para Login */}
          <div className="mt-8 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground">
            Já possui uma conta ativa?{" "}
            <Link href="/login" className="font-bold text-brand hover:underline transition">
              Entrar aqui
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
