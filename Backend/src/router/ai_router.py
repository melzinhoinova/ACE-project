from fastapi import APIRouter, Form, HTTPException, UploadFile, File
import traceback

from src.services.gemini_service import gemini_response
from src.services.openai_service import openai_response

from src.models.api_models import CampaignModel

router = APIRouter()

@router.post("/api/campanha", response_model=CampaignModel)
async def gerar_campanha(
    nicho: str = Form(...),
    objetivo: str = Form(...),
    detalhes: str | None = Form(default=None),
    estilo: str | None = Form(default=None),
    imagens: list[UploadFile] = File(default=[])
):
    
    try:
        print(f"\n--- [REQUEST] Gerando campanha para nicho: {nicho} ---")
        print(f"Objetivo: {objetivo}")
        print(f"Estilo: {estilo}")
        
        images_list: list[bytes] | None = None
        if imagens:
            images_list = []
            for img in imagens:
                if img.filename:
                    print(f"Imagem recebida: {img.filename} ({img.content_type})")
                    content = await img.read()
                    images_list.append(content)
            if len(images_list) == 0:
                images_list = None

        print(f"Total de imagens carregadas em bytes: {len(images_list) if images_list else 0}")
        dados_campanha = gemini_response(nicho, objetivo, detalhes, estilo, images_list)
        print(f"Prompt sugerido pelo Gemini para DALL-E: {dados_campanha.get('sugestao_prompt_imagem')}")

        titulo_campanha = dados_campanha["titulo_campanha"]
        legenda_instagram = dados_campanha["legenda_instagram"]
        prompt_openai = dados_campanha["sugestao_prompt_imagem"]

        campaign_image_base64: str = openai_response(prompt_openai)

        return {
            "titulo": titulo_campanha,
            "legenda_instagram": legenda_instagram,
            "imagem_instagram": campaign_image_base64
        }
    
    except Exception as e:
        print(f"\n=== ERRO 500 em /api/campanha ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))   