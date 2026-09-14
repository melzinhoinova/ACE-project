"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getApiBaseUrl } from "@/lib/opportunities-api";

export interface GeneratedCampaignResult {
  titulo?: string;
  imagem_instagram: string;
  legenda_instagram: string;
  original_image_url?: string;
  fidelity_score?: number | null;
  approved?: boolean;
  evento?: string | null;
  timestamp: number;
}

export interface GenerationContextType {
  isGenerating: boolean;
  generationStage: "idle" | "loading" | "ready" | "error";
  generatingTitle: string | null;
  lastResult: GeneratedCampaignResult | null;
  generationError: string | null;
  showSuccessToast: boolean;
  dismissToast: () => void;
  startGeneration: (formData: FormData, title?: string) => Promise<GeneratedCampaignResult>;
  cancelGeneration: () => void;
  resetGeneration: () => void;
}

const GenerationContext = createContext<GenerationContextType | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [generatingTitle, setGeneratingTitle] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GeneratedCampaignResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pathname = usePathname();

  // Quando o usuário navega para o gerador, dispensa o toast de aviso pois já está na tela
  useEffect(() => {
    if (pathname === "/gerador" && showSuccessToast) {
      setShowSuccessToast(false);
    }
  }, [pathname, showSuccessToast]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setGenerationStage("idle");
    setGeneratingTitle(null);
  }, []);

  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationStage("idle");
    setGenerationError(null);
  }, []);

  const dismissToast = useCallback(() => {
    setShowSuccessToast(false);
  }, []);

  const startGeneration = useCallback(
    async (formData: FormData, title: string = "Campanha"): Promise<GeneratedCampaignResult> => {
      // Se houver uma requisição em andamento, aborta a anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsGenerating(true);
      setGenerationStage("loading");
      setGeneratingTitle(title);
      setGenerationError(null);
      setShowSuccessToast(false);

      try {
        const { getAuthHeaders } = await import("@/lib/opportunities-api");
        const authHeaders = await getAuthHeaders();
        // Não define Content-Type manual para que o navegador configure o boundary multipart
        delete authHeaders["Content-Type"];

        const API_BASE = getApiBaseUrl();
        const res = await fetch(`${API_BASE}/api/campanha`, {
          method: "POST",
          headers: authHeaders,
          body: formData,
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMsg = errData?.detail || `Erro ${res.status} ao gerar campanha.`;
          throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
        }

        const data = await res.json();

        // Persiste nos storages
        sessionStorage.setItem("ace.generatedImage", data.imagem_instagram || "");
        sessionStorage.setItem("ace.generatedCopy", data.legenda_instagram || "");
        sessionStorage.setItem("ace.originalImageUrl", data.original_image_url || "");
        sessionStorage.setItem(
          "ace.fidelityScore",
          data.fidelity_score !== null && data.fidelity_score !== undefined ? String(data.fidelity_score) : ""
        );
        sessionStorage.setItem(
          "ace.approved",
          data.approved !== null && data.approved !== undefined ? String(data.approved) : ""
        );

        const result: GeneratedCampaignResult = {
          titulo: data.titulo,
          imagem_instagram: data.imagem_instagram,
          legenda_instagram: data.legenda_instagram,
          original_image_url: data.original_image_url,
          fidelity_score: data.fidelity_score,
          approved: data.approved,
          evento: data.evento,
          timestamp: Date.now(),
        };

        setLastResult(result);
        setGenerationStage("ready");
        setIsGenerating(false);

        // Se o usuário estiver navegando em outra página quando terminar, avisa com o Toast
        if (typeof window !== "undefined" && window.location.pathname !== "/gerador") {
          setShowSuccessToast(true);
        }

        return result;
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("[GenerationContext] Geração cancelada pelo usuário.");
          setIsGenerating(false);
          setGenerationStage("idle");
          throw err;
        }

        console.error("[GenerationContext] Erro ao gerar campanha:", err);
        const message = err.message || "Erro inesperado ao gerar campanha.";
        setGenerationError(message);
        setIsGenerating(false);
        setGenerationStage("error");
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    []
  );

  return (
    <GenerationContext.Provider
      value={{
        isGenerating,
        generationStage,
        generatingTitle,
        lastResult,
        generationError,
        showSuccessToast,
        dismissToast,
        startGeneration,
        cancelGeneration,
        resetGeneration,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error("useGeneration must be used within a GenerationProvider");
  }
  return context;
}
