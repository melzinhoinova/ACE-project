import { supabase } from "@/lib/supabaseClient";

export type Escopo = "nacional" | "estadual" | "municipal";

export type Opportunity = {
  id: number;
  title: string;
  description?: string | null;
  date: string; // ISO date string (YYYY-MM-DD)
  escopo?: Escopo;
  local?: string | null;
  score?: "high" | "medium" | "low";
};

export type OpportunityCreateInput = {
  title: string;
  description?: string;
  date: string;
  escopo?: Escopo;
  local?: string;
};

export type OpportunityUpdateInput = {
  title?: string;
  description?: string;
  date?: string;
  escopo?: Escopo;
  local?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn("Aviso ao recuperar token de sessão para API:", err);
  }
  return headers;
}

export async function fetchOpportunities(all: boolean = true): Promise<Opportunity[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/oportunidades?all=${all}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) {
      throw new Error(`Erro ao buscar oportunidades (${res.status})`);
    }
    const data = await res.json();
    if (data && data.scores && Array.isArray(data.scores)) {
      return data.scores.map((item: any) => ({
        ...item.opportunity,
        score: item.score,
      }));
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Falha ao buscar do backend FastAPI, tentando fallback local...", error);
    throw error;
  }
}

export async function createOpportunity(data: OpportunityCreateInput): Promise<Opportunity> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/oportunidades`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao criar oportunidade");
  }
  return await res.json();
}

export async function updateOpportunity(id: number, data: OpportunityUpdateInput): Promise<Opportunity> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/oportunidades/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao atualizar oportunidade");
  }
  return await res.json();
}

export async function deleteOpportunity(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/oportunidades/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao excluir oportunidade");
  }
}

// --- API DE CAMPANHAS ---

export type CampaignInput = {
  title: string;
  campaign: string;
  description?: string;
  date: string; // YYYY-MM-DD
  opportunity: string;
  id_PostInstagram?: string;
  original_image_url?: string;
  fidelity_score?: number;
  approved?: boolean;
  generation_attempts?: any[];
};

export type CampaignDb = {
  id: number;
  title: string;
  campaign: string;
  description?: string | null;
  date: string;
  opportunity: string;
  id_PostInstagram?: string | null;
  original_image_url?: string | null;
  fidelity_score?: number | null;
  approved?: boolean;
  generation_attempts?: any[] | null;
};

export async function saveCampaign(data: CampaignInput): Promise<CampaignDb> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/campanhas`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao salvar campanha no Supabase");
  }
  return await res.json();
}

export async function fetchCampaigns(opportunity?: string): Promise<CampaignDb[]> {
  const url = opportunity
    ? `${API_BASE_URL}/api/campanhas?opportunity=${opportunity}`
    : `${API_BASE_URL}/api/campanhas`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { cache: "no-store", headers });
  if (!res.ok) {
    throw new Error("Erro ao buscar campanhas do Supabase");
  }
  return await res.json();
}

