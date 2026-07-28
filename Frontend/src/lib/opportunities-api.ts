export type Escopo = "nacional" | "estadual" | "municipal";

export type Opportunity = {
  id: number;
  title: string;
  description?: string | null;
  date: string; // ISO date string (YYYY-MM-DD)
  escopo?: Escopo;
  local?: string | null;
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

export async function fetchOpportunities(all: boolean = true): Promise<Opportunity[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/oportunidades?all=${all}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Erro ao buscar oportunidades (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.warn("Falha ao buscar do backend FastAPI, tentando fallback local...", error);
    throw error;
  }
}

export async function createOpportunity(data: OpportunityCreateInput): Promise<Opportunity> {
  const res = await fetch(`${API_BASE_URL}/api/oportunidades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao criar oportunidade");
  }
  return await res.json();
}

export async function updateOpportunity(id: number, data: OpportunityUpdateInput): Promise<Opportunity> {
  const res = await fetch(`${API_BASE_URL}/api/oportunidades/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao atualizar oportunidade");
  }
  return await res.json();
}

export async function deleteOpportunity(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/oportunidades/${id}`, {
    method: "DELETE",
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
  id_opportunity: number;
  id_PostInstagram?: number;
};

export type CampaignDb = {
  id: number;
  title: string;
  campaign: string;
  description?: string | null;
  date: string;
  id_opportunity: number;
  id_PostInstagram?: number | null;
};

export async function saveCampaign(data: CampaignInput): Promise<CampaignDb> {
  const res = await fetch(`${API_BASE_URL}/api/campanhas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao salvar campanha no Supabase");
  }
  return await res.json();
}

export async function fetchCampaigns(opportunityId?: number): Promise<CampaignDb[]> {
  const url = opportunityId
    ? `${API_BASE_URL}/api/campanhas?opportunity_id=${opportunityId}`
    : `${API_BASE_URL}/api/campanhas`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Erro ao buscar campanhas do Supabase");
  }
  return await res.json();
}

