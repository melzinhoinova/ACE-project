"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AceLogo } from "@/components/ace/AceLogo";
import { Mail, Loader2, Sparkles } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.45-1.7 4.25-5.5 4.25-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.74 3.6 14.6 2.6 12 2.6 6.96 2.6 2.85 6.7 2.85 11.75s4.11 9.15 9.15 9.15c5.28 0 8.78-3.72 8.78-8.95 0-.6-.07-1.06-.16-1.55H12z"
      />
    </svg>
  );
}

export default function SplashPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "google" | "email">(null);

  const go = (kind: "google" | "email") => {
    setLoading(kind);
    setTimeout(() => router.push("/radar"), 900);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-32 top-10 h-[480px] w-[480px] rounded-full bg-[#7B2FBE]/30 blur-[120px] animate-pulse" />
        <div
          className="absolute right-0 top-1/3 h-[520px] w-[520px] rounded-full bg-[#2F6FBE]/30 blur-[120px] animate-pulse"
          style={{ animationDelay: "1.2s" }}
        />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <div className="animate-float-up">
          <AceLogo size="lg" />
        </div>

        <div
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground animate-float-up"
          style={{ animationDelay: "80ms" }}
        >
          <Sparkles size={12} className="text-gradient-brand" />
          AutoSales Camp Engine
        </div>

        <h1
          className="mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl animate-float-up"
          style={{ animationDelay: "120ms" }}
        >
          Venda mais.
          <br />
          Esforce <span className="text-gradient-brand">menos.</span>
        </h1>
        <p
          className="mt-4 max-w-sm text-base text-muted-foreground animate-float-up"
          style={{ animationDelay: "200ms" }}
        >
          Enquanto a concorrência planeja, o ACE já está no feed gerando resultados
        </p>

        <div
          className="mt-10 flex w-full flex-col gap-3 animate-float-up"
          style={{ animationDelay: "280ms" }}
        >
          <button
            onClick={() => go("google")}
            disabled={loading !== null}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white text-sm font-semibold text-zinc-900 shadow-card transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
          >
            {loading === "google" ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            Entrar com Google
          </button>
          <button
            onClick={() => go("email")}
            disabled={loading !== null}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/40 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card/70 disabled:opacity-70"
          >
            {loading === "email" ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
            Acessar com e-mail
          </button>
        </div>

        <p
          className="mt-10 text-[11px] uppercase tracking-widest text-muted-foreground/70 animate-float-up"
          style={{ animationDelay: "360ms" }}
        >
          v1.0 · Protótipo navegável
        </p>
      </div>
    </main>
  );
}
