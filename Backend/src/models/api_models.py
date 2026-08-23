from pydantic import BaseModel, Field, field_validator
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
    sugestao_prompt_imagem: str = Field(description="Prompt em inglês detalhado descrevendo apenas o CENÁRIO/fundo comercial — não descreve o produto fisicamente")

# modelo de retorno da campanha finalizada (resposta do /api/campanha)
class CampaignModel(BaseModel):
    titulo: str
    legenda_instagram: str
    # agora é a URL da imagem no Cloudinary (não mais base64), e pode
    # vir None quando a campanha foi gerada sem foto de produto.
    imagem_instagram: Optional[str] = None
    # rastreio de fidelidade do images.edit
    original_image_url: Optional[str] = None
    fidelity_score: Optional[float] = None
    approved: bool = False

# modelo de criação de campanha no Supabase (usado em POST /api/campanhas)
class CampaignCreate(BaseModel):
    title: str
    campaign: str
    description: Optional[str] = None
    date: dt
    opportunity: str
    id_PostInstagram: Optional[str] = None

    original_image_url: Optional[str] = None
    fidelity_score: Optional[float] = None
    approved: bool = False
    generation_attempts: Optional[list] = None

    @field_validator("id_PostInstagram", mode="before")
    @classmethod
    def coerce_id_to_str(cls, v):
        if v is not None:
            return str(v)
        return v

# modelo de resposta de campanha vinda do Supabase
class CampaignDbResponse(BaseModel):
    id: int
    title: str
    campaign: str
    description: Optional[str] = None
    date: dt
    opportunity: str
    id_PostInstagram: Optional[str] = None
    original_image_url: Optional[str] = None
    fidelity_score: Optional[float] = None
    approved: bool = False
    generation_attempts: Optional[list] = None

    model_config = {
        "from_attributes": True
    }

    @field_validator("id_PostInstagram", mode="before")
    @classmethod
    def coerce_id_to_str(cls, v):
        if v is not None:
            return str(v)
        return v


class ScoreModel(BaseModel):
    opportunity: OpportunityResponse = Field(description="Objeto que representa a oportunidade")
    score: str = Field(description="Score da oportunidade")

class ScoreResponse(BaseModel):
    scores: list[ScoreModel]

class InviteRequest(BaseModel):
    email: str
    company_name: str
    role: Optional[str] = "Brand Manager"
    invite_url: str