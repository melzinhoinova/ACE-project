from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from src.services.gemini_service import gemini_response
from src.services.openai_service import openai_response

from src.models.api_models import CampaignModel

router = APIRouter()

@router.post("/api/campanha", response_model=CampaignModel)
async def gerar_campanha(
    nicho: str = Form(...),
    objetivo: str = Form(...),
    imagem: UploadFile | None = File(default=None)
):
    
    try:
        image_bytes: bytes | None = None
        if imagem is not None:
            image_bytes = await imagem.read()

        dados_campanha = gemini_response(nicho, objetivo, image_bytes)

        titulo_campanha = dados_campanha["titulo_campanha"]
        legenda_instagram = dados_campanha["legenda_instagram"]
        prompt_openai = dados_campanha["sugestao_prompt_imagem"]

        campaign_image_bytes: bytes = openai_response(prompt_openai)

        return {
            "titulo": titulo_campanha,
            "legenda_instagram": legenda_instagram,
            "imagem_instagram": campaign_image_bytes
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   