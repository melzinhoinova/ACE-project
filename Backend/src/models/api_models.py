from pydantic import BaseModel, Field
from datetime import date as dt
from typing import Optional

# modelo de criacao de oportunidade
class OpportunityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: dt
    escopo: Optional[str] = "nacional"
    local: Optional[str] = None

# modelo de atualizacao de oportunidade
class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[dt] = None
    escopo: Optional[str] = None
    local: Optional[str] = None

# modelo de resposta do radar de oportunidades
class OpportunityResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    date: dt
    escopo: Optional[str] = "nacional"
    local: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

# modelo para enviar o prompt para o gemini
class GeminiPromptModel(BaseModel):
    titulo_campanha: str = Field(description="Título interno da campanha")
    legenda_instagram: str = Field(description="Legenda engajadora com hashtags e gatilhos mentais")
    sugestao_prompt_imagem: str = Field(description="Prompt em inglês detalhado para gerar o fundo comercial ideal para este produto")

# modelo de retorno da campanha finalizada
class CampaignModel(BaseModel):
    titulo: str
    legenda_instagram: str
    imagem_instagram: str

# modelo de criação de campanha no Supabase
class CampaignCreate(BaseModel):
    title: str
    campaign: str
    description: Optional[str] = None
    date: dt
    opportunity: str
    id_PostInstagram: Optional[int] = None

# modelo de resposta de campanha vinda do Supabase
class CampaignDbResponse(BaseModel):
    id: int
    title: str
    campaign: str
    description: Optional[str] = None
    date: dt
    opportunity: str
    id_PostInstagram: Optional[int] = None

    model_config = {
        "from_attributes": True
    }

