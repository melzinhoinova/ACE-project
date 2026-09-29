import random
import traceback
import uuid
from typing import Annotated

from fastapi import APIRouter, Form, HTTPException, UploadFile, File, Depends
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from src.dependencies.api_dependency import get_current_user, get_db, AuthenticatedUser
from src.services.gemini_service import generate_campaign_copy, CampanhaInput
from src.services.openai_service import openai_edit_response
from src.services.fidelity_service import score_image_fidelity
from src.services.product_detection_service import detect_and_crop_product, crop_to_single_product
from src.services.product_composite_service import create_product_lineup_composite
from src.services.cloudinary_service import upload_original_product_image, upload_generated_image
from src.services.master_asset_service import get_master_product_image_bytes
from src.models.database_models import CampaignReference
from src.models.api_models import CampaignModel

router = APIRouter()

MAX_TENTATIVAS = 2  # comece com 2 pra controlar custo; suba se precisar
SCORE_MINIMO_APROVACAO = 0.8
QUALITY_TESTES = "medium"  # Modo preferido: estética mais natural, orgânica e sem aspecto artificial


def _executar_pipeline_geracao(
    dados: CampanhaInput,
    images_list: list[bytes],
    texto_promocional: str | None,
    final_evento: str | None,
) -> dict:
    identificador = uuid.uuid4().hex

    # 0. Normaliza e detecta produtos em cada imagem enviada:
    # Trata tanto o caso de 1 foto com múltiplos produtos (ex: kit com 3 mini garrafas),
    # quanto o caso de múltiplas fotos enviadas (ex: 1 foto com 1 produto + outra foto com 3 produtos).
    cropped_list: list[bytes] = []
    total_detected_qty = 0
    all_identified_products: list[str] = []

    print(f"[Pipeline] Analisando {len(images_list)} imagem(ns) de entrada...")
    for idx, img_b in enumerate(images_list):
        try:
            c, qty, prods = detect_and_crop_product(img_b)
            cropped_list.append(c)
            total_detected_qty += qty
            all_identified_products.extend(prods)
            print(f"[Product Detection] Imagem #{idx + 1}: {qty} produto(s) detectado(s) -> {prods}")
        except Exception as e:
            print(f"[Product Detection] Aviso ao recortar item #{idx + 1}: {e}")
            cropped_list.append(img_b)
            total_detected_qty += 1

    # Remove duplicatas preservando a ordem dos rótulos
    unique_products = list(dict.fromkeys([p.strip() for p in all_identified_products if p and p.strip()]))

    # O número total de produtos é o total de garrafas detectadas somadas em todas as fotos
    num_products = max(total_detected_qty, len(images_list), 1)
    dados.num_products = num_products
    dados.product_names = unique_products

    print(f"[Pipeline] Total consolidado: {num_products} produto(s) | Marcas/Rótulos: {unique_products}")

    # Monta imagem de referência para preview e persistência
    if len(cropped_list) > 1:
        imagem_original = create_product_lineup_composite(cropped_list)
        imagens_para_ia = cropped_list
    else:
        imagem_original = cropped_list[0] if cropped_list else images_list[0]
        imagens_para_ia = imagem_original

    # 1. Persiste a foto original/composta ANTES de gerar
    original_url = upload_original_product_image(imagem_original, identificador)

    # 2. Copywriting + prompt de CENA comercial com estilo de referência
    campanha = generate_campaign_copy(dados)
    prompt_cena = campanha["sugestao_prompt_imagem"]
    print(f"Prompt de cena gerado: {prompt_cena}")

    # 3. Loop de geração com validação de fidelidade via gpt-image-2.5-sunburst
    melhor = {"url": None, "score": -1.0, "motivo": ""}

    for tentativa in range(1, MAX_TENTATIVAS + 1):
        imagem_gerada = openai_edit_response(
            prompt_cena,
            imagens_para_ia,
            quality=QUALITY_TESTES,
            promo_text=texto_promocional,
            num_products=num_products,
            product_names=unique_products,
        )
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
        "evento": final_evento,
    }


@router.post("/api/campanha", response_model=CampaignModel)
async def gerar_campanha(
    nicho: str = Form(...),
    objetivo: str = Form(...),
    detalhes: str | None = Form(default=None),
    estilo: str | None = Form(default=None),
    reference_id: int | None = Form(default=None),
    texto_promocional: str | None = Form(default=None),
    evento: str | None = Form(default=None),
    evento_descricao: str | None = Form(default=None),
    imagens: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    try:
        print(f"\n--- [REQUEST] Gerando campanha para nicho: {nicho} | evento: {evento} (usuário: {current_user.email}) ---")
        print(f"Objetivo: {objetivo}")
        print(f"Estilo: {estilo}")
        print(f"Referência ID: {reference_id}")
        print(f"Texto Promocional: {texto_promocional}")
        print(f"Evento Sazonal: {evento}")

        # Resolve diretriz da referência de estilo selecionada ou automática
        ref_title = None
        ref_recipe = None
        if reference_id and reference_id > 0:
            selected_ref = db.query(CampaignReference).filter(CampaignReference.id == reference_id).first()
            if selected_ref:
                ref_title = selected_ref.title
                ref_recipe = selected_ref.prompt_recipe
                print(f"[Estilo] Referência selecionada pelo usuário: #{selected_ref.id} - {selected_ref.title}")
        else:
            # Modo 'Surpreenda-me / Automático': seleciona aleatoriamente entre as referências ativas
            active_refs = db.query(CampaignReference).filter(CampaignReference.is_active.is_(True)).all()
            if active_refs:
                selected_ref = random.choice(active_refs)
                ref_title = selected_ref.title
                ref_recipe = selected_ref.prompt_recipe
                print(f"[Estilo] Modo Automático selecionou: #{selected_ref.id} - {selected_ref.title}")

        images_list: list[bytes] = []
        if imagens:
            for img in imagens:
                if img.filename:
                    print(f"Imagem recebida: {img.filename} ({img.content_type})")
                    content = await img.read()
                    if content:
                        images_list.append(content)

        print(f"Total de imagens enviadas pelo usuário: {len(images_list)}")

        # --- Fallback automático para o ativo master da marca caso o usuário não envie foto ---
        if not images_list:
            print("[Master Fallback] Nenhuma foto enviada. Carregando ativo master oficial da garrafa Melzinho...")
            master_bytes = get_master_product_image_bytes()
            images_list.append(master_bytes)

        # Detecção e normalização inteligente do evento sazonal / data comemorativa
        final_evento = evento
        final_nicho = nicho

        KNOWN_HOLIDAYS = [
            ("natal", "Natal"),
            ("ano novo", "Ano Novo"),
            ("reveillon", "Ano Novo / Réveillon"),
            ("carnaval", "Carnaval"),
            ("sao joao", "São João / Festa Junina"),
            ("festa junina", "Festa Junina"),
            ("dia dos pais", "Dia dos Pais"),
            ("dia das maes", "Dia das Mães"),
            ("dia dos namorados", "Dia dos Namorados"),
            ("black friday", "Black Friday"),
            ("pascoa", "Páscoa"),
            ("tiradentes", "Tiradentes"),
            ("independencia", "Independência do Brasil"),
            ("finados", "Dia de Finados"),
            ("proclamacao", "Proclamação da República"),
            ("trabalhador", "Dia do Trabalhador"),
            ("consciencia negra", "Consciência Negra"),
        ]

        if not final_evento:
            search_text = f"{nicho} {objetivo}".lower()
            for key, holiday_name in KNOWN_HOLIDAYS:
                if key in search_text:
                    final_evento = holiday_name
                    print(f"[Theme Fusion] Data comemorativa detectada automaticamente: {final_evento}")
                    break

        if final_nicho and any(k in final_nicho.lower() for k, _ in KNOWN_HOLIDAYS):
            final_nicho = "Cachaça Artesanal"

        dados = CampanhaInput(
            nicho=final_nicho,
            objetivo=objetivo,
            detalhes=detalhes,
            estilo=estilo,
            images_list=images_list,
            reference_title=ref_title,
            reference_recipe=ref_recipe,
            texto_promocional=texto_promocional,
            evento=final_evento,
            evento_descricao=evento_descricao,
        )

        return await run_in_threadpool(
            _executar_pipeline_geracao,
            dados,
            images_list,
            texto_promocional,
            final_evento,
        )

    except Exception as e:
        print(f"\n=== ERRO 500 em /api/campanha ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))