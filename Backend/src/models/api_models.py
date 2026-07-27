from pydantic import BaseModel, Field
from datetime import date as dt

# modelo de resposta do radar de oportunidades
class OpportunityResponse(BaseModel):
    id: int
    title: str
    description: str
    date: dt
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