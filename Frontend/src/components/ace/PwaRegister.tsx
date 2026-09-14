"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Registra o Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSw = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registrado com sucesso no escopo:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Falha ao registrar Service Worker:", err);
          });
      };

      if (document.readyState === "complete") {
        registerSw();
      } else {
        window.addEventListener("load", registerSw);
      }
    }

    // 2. Escuta o evento beforeinstallprompt para instalação do WebApp
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__pwaInstallPrompt = e;

      // Se o usuário ainda não fechou o banner nesta sessão
      const dismissed = sessionStorage.getItem("ace.pwaDismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Usuário respondeu ao prompt de instalação com: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("ace.pwaDismissed", "true");
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-float-up">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand shadow-sm">
          <img src="/logo_rocket.png" alt="ACE" className="h-6 w-6 object-contain" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground">Instalar Aplicativo ACE</h4>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition p-0.5"
              title="Fechar"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Instale o ACE no seu dispositivo para acesso rápido em tela cheia direto da tela inicial.
          </p>
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white shadow-card hover:scale-[1.02] transition active:scale-[0.98]"
            >
              <Download size={12} /> Instalar WebApp
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-border/60 bg-background/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
