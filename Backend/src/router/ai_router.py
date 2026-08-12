import traceback
import uuid
from typing import Annotated

from fastapi import APIRouter, Form, HTTPException, UploadFile, File

from src.services.gemini_service import generate_campaign_copy, CampanhaInput
from src.services.openai_service import openai_edit_response
from src.services.fidelity_service import score_image_fidelity
from src.services.product_detection_service import crop_to_single_product
from src.services.cloudinary_service import upload_original_product_image, upload_generated_image

from src.models.api_models import CampaignModel

router = APIRouter()

MAX_TENTATIVAS = 2  # comece com 2 pra controlar custo; suba se precisar
SCORE_MINIMO_APROVACAO = 0.8
QUALITY_TESTES = "medium"  # troque pra 'high' só quando o dono aprovar de vez


@router.post("/api/campanha", response_model=CampaignModel)
async def gerar_campanha(
    nicho: str = Form(...),
    objetivo: str = Form(...),
    detalhes: str | None = Form(default=None),
    estilo: str | None = Form(default=None),
    imagens: list[UploadFile] = File(default=[]),
):
    try:
        print(f"\n--- [REQUEST] Gerando campanha para nicho: {nicho} ---")
        print(f"Objetivo: {objetivo}")
        print(f"Estilo: {estilo}")

        images_list: list[bytes] = []
        if imagens:
            for img in imagens:
                if img.filename:
                    print(f"Imagem recebida: {img.filename} ({img.content_type})")
                    content = await img.read()
                    images_list.append(content)

        print(f"Total de imagens carregadas em bytes: {len(images_list)}")

        dados = CampanhaInput(
            nicho=nicho,
            objetivo=objetivo,
            detalhes=detalhes,
            estilo=estilo,
            images_list=images_list,
        )

        # --- Sem foto de produto: gera só o texto, sem imagem ---
        if not images_list:
            campanha = generate_campaign_copy(dados)
            return {
                "titulo": campanha["titulo_campanha"],
                "legenda_instagram": campanha["legenda_instagram"],
                "imagem_instagram": None,
                "original_image_url": None,
                "fidelity_score": None,
                "approved": False,
            }

        # Identificador único pra nomear os arquivos no Cloudinary. A linha
        # da campanha ainda não existe no banco nesse ponto do fluxo — quem
        # criar a linha depois (endpoint de salvar campanha) recebe essas
        # URLs já prontas e só grava.
        identificador = uuid.uuid4().hex

        # 0. Normaliza a entrada — extrai um produto único e bem enquadrado,
        #    não importa como o dono mandou a foto (uma unidade, duas, ângulo torto).
        imagem_original = crop_to_single_product(images_list[0])

        # 1. Persiste a foto original ANTES de gerar (hoje ela se perdia).
        original_url = upload_original_product_image(imagem_original, identificador)

        # 2. Copywriting + prompt de CENA (não descreve o produto fisicamente)
        campanha = generate_campaign_copy(dados)
        prompt_cena = campanha["sugestao_prompt_imagem"]
        print(f"Prompt de cena (gpt-image-2): {prompt_cena}")

        # 3. Loop de geração com validação de fidelidade
        melhor = {"url": None, "score": -1.0, "motivo": ""}

        for tentativa in range(1, MAX_TENTATIVAS + 1):
            imagem_gerada = openai_edit_response(prompt_cena, imagem_original, quality=QUALITY_TESTES)
            score, motivo = score_image_fidelity(imagem_original, imagem_gerada)
            url_tentativa = upload_generated_image(imagem_gerada, identificador, tentativa)

            print(f"Tentativa {tentativa}: score={score:.2f} — {motivo}")

            if score > melhor["score"]:
                melhor = {"url": url_tentativa, "score": score, "motivo": motivo}

            if score >= SCORE_MINIMO_APROVACAO:
                break

        return {
            "titulo": campanha["titulo_campanha"],
            "legenda_instagram": campanha["legenda_instagram"],
            "imagem_instagram": melhor["url"],
            "original_image_url": original_url,
            "fidelity_score": melhor["score"],
            "approved": melhor["score"] >= SCORE_MINIMO_APROVACAO,
        }

    except Exception as e:
        print(f"\n=== ERRO 500 em /api/campanha ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))