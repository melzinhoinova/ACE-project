import { supabase } from "@/lib/supabaseClient";

export type CampaignReference = {
  id: number;
  title: string;
  image_url: string;
  category?: string | null;
  prompt_recipe?: string | null;
  is_active: boolean;
};

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local")
    ) {
      return `http://${host === "localhost" ? "127.0.0.1" : host}:8000`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn("Aviso ao obter token de sessão:", err);
  }
  return headers;
}

export async function fetchReferences(all: boolean = false): Promise<CampaignReference[]> {
  const headers = await getAuthHeaders();
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/api/referencias?all=${all}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) {
    throw new Error(`Erro ao buscar referências (${res.status})`);
  }
  return res.json();
}

export async function createReference(formData: FormData): Promise<CampaignReference> {
  const headers = await getAuthHeaders();
  const apiBase = getApiBaseUrl();
  // Não define Content-Type manual para FormData para o browser gerar o boundary correto
  const res = await fetch(`${apiBase}/api/referencias`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erro ao criar referência" }));
    throw new Error(err.detail || `Erro ao criar referência (${res.status})`);
  }
  return res.json();
}

export async function updateReference(
  id: number,
  data: { title?: string; category?: string; prompt_recipe?: string; is_active?: boolean }
): Promise<CampaignReference> {
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/api/referencias/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Erro ao atualizar referência (${res.status})`);
  }
  return res.json();
}

export async function deleteReference(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/api/referencias/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    throw new Error(`Erro ao excluir referência (${res.status})`);
  }
}

export async function syncCuratedReferences(): Promise<{
  message: string;
  details?: {
    total_processados: number;
    novos_criados: number;
    atualizados: number;
    erros: number;
    total_ativos_no_banco: number;
  };
}> {
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/api/admin/sync-references`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ao sincronizar catálogo (${res.status})`);
  }
  return res.json();
}
