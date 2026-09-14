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

import { getApiBaseUrl } from "@/lib/references-api";
export { getApiBaseUrl };

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    let token = session?.access_token;

    if (!token && typeof document !== "undefined") {
      const match = document.cookie.match(/sb-access-token=([^;]+)/);
      if (match && match[1]) {
        token = match[1];
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Aviso ao recuperar token de sessão para API:", err);
  }
  return headers;
}

export async function fetchOpportunities(all: boolean = true): Promise<Opportunity[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/api/oportunidades?all=${all}`, {
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
  const res = await fetch(`${getApiBaseUrl()}/api/oportunidades`, {
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
  const res = await fetch(`${getApiBaseUrl()}/api/oportunidades/${id}`, {
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
  const res = await fetch(`${getApiBaseUrl()}/api/oportunidades/${id}`, {
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

export type CampaignScheduleInput = {
  title?: string;
  imageUrl: string;
  caption: string;
  scheduled_at: string; // ISO 8601 string
  publish_mode?: "AUTONOMOUS" | "MANUAL";
  opportunity?: string;
  original_image_url?: string;
  fidelity_score?: number;
};

export type CampaignDb = {
  id: number;
  title: string;
  campaign: string;
  description?: string | null;
  date: string;
  opportunity: string;
  id_PostInstagram?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
  publish_mode?: string | null;
  error_log?: string | null;
  original_image_url?: string | null;
  fidelity_score?: number | null;
  approved?: boolean;
  generation_attempts?: any[] | null;
};

export async function saveCampaign(data: CampaignInput): Promise<CampaignDb> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/campanhas`, {
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
    ? `${getApiBaseUrl()}/api/campanhas?opportunity=${opportunity}`
    : `${getApiBaseUrl()}/api/campanhas`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { cache: "no-store", headers });
  if (!res.ok) {
    throw new Error("Erro ao buscar campanhas do Supabase");
  }
  return await res.json();
}

export async function scheduleCampaign(data: CampaignScheduleInput): Promise<CampaignDb> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/instagram/agendar`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao agendar publicação no Instagram");
  }
  return await res.json();
}

export async function fetchScheduledCampaigns(): Promise<CampaignDb[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/instagram/agendados`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) {
    throw new Error("Erro ao buscar publicações agendadas");
  }
  return await res.json();
}

export async function cancelScheduledCampaign(campaignId: number): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/instagram/agendados/${campaignId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao cancelar publicação agendada");
  }
  return await res.json();
}


