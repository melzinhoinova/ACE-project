import base64
import io
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_key = os.getenv("OPENAI_KEY")
client = OpenAI(api_key=openai_key)


def openai_edit_response(
    prompt_cena: str,
    imagem_original: bytes,
    quality: str = "medium",
    promo_text: str | None = None,
) -> bytes:
    """
    Args:
        prompt_cena: descrição em inglês do CENÁRIO (não descreve o produto).
        imagem_original: bytes da foto do produto já recortada/normalizada.
        quality: 'low' | 'medium' | 'high'. Use 'low'/'medium' em testes,
            suba pra 'high' só na versão final aprovada pro cliente.
        promo_text: texto opcional para selo promocional comercial (ex: 'COMPRE 1 LEVE 2').
    """
    imagem_arquivo = io.BytesIO(imagem_original)
    imagem_arquivo.name = "produto_original.png"

    promo_instruction = ""
    if promo_text and promo_text.strip():
        promo_instruction = f" Create a sleek commercial advertising poster/flyer layout with an eye-catching promotional badge or stylish text banner displaying '{promo_text.strip()}' in the scene, positioned harmoniously without obscuring the bottle or its label."

    prompt_edicao = f"""
    High-end commercial Instagram advertising flyer poster for the Brazilian artisanal cachaça brand 'Melzinho'.
    Keep the exact bottle, proportions, liquid color, and label from the reference image completely unchanged.
    The brand cursive title 'Melzinho', the silver metallic foil texture, the dripping honey at the top of the label, and the green amburana tree illustration MUST remain crisp, sharp, perfectly legible, and identical to the original reference photo without any distortion or hallucinated letters.
    Place this exact product as the central hero focus of the following commercial scene: {prompt_cena}
    {promo_instruction}
    Only generate the environment, lighting, commercial art direction, and background around the product.
    Do not alter, warp, or add fake text to the bottle label.
    Ensure any promotional badges, ribbons, or text banners are rendered with crisp, sharp, professional commercial typography.
    """

    result = client.images.edit(
        model="gpt-image-2",
        image=[imagem_arquivo],
        prompt=prompt_edicao,
        n=1,
        quality=quality,
        size="1024x1024",
        output_format="jpeg",
    )

    image_base64: str = result.data[0].b64_json
    return base64.b64decode(image_base64)