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
    num_products: int = 1,
) -> bytes:
    """
    Args:
        prompt_cena: descrição em inglês do CENÁRIO (não descreve o produto).
        imagem_original: bytes da foto do produto ou composite dos produtos já recortada/normalizada.
        quality: 'low' | 'medium' | 'high'. Use 'low'/'medium' em testes,
            suba pra 'high' só na versão final aprovada pro cliente.
        promo_text: texto opcional para selo promocional comercial (ex: 'COMPRE 1 LEVE 2').
        num_products: quantidade de produtos/garrafas presentes na imagem de referência.
    """
    imagem_arquivo = io.BytesIO(imagem_original)
    imagem_arquivo.name = "produto_original.png"

    promo_instruction = ""
    if promo_text and promo_text.strip():
        promo_instruction = f" Create a sleek commercial advertising poster/flyer layout with an eye-catching promotional badge or stylish text banner displaying '{promo_text.strip()}' in the scene, positioned harmoniously without obscuring any product or label."

    if num_products > 1:
        product_instruction = f"""
    High-end commercial Instagram advertising flyer poster featuring the collection of {num_products} products shown in the reference image.
    Keep ALL {num_products} products, bottles, packaging, liquid colors, and labels from the reference image completely unchanged.
    Every single label, bottle shape, typography, logo, and brand detail from the reference image MUST remain crisp, sharp, perfectly legible, and identical to the original reference photo without any distortion or hallucinated letters.
    Place this exact collection/lineup of products as the central hero group of the following commercial scene: {prompt_cena}
    Do not replace any product with a generic bottle, and do not invent fake labels or hallucinated items.
        """
    else:
        product_instruction = f"""
    High-end commercial Instagram advertising flyer poster for the Brazilian artisanal cachaça brand 'Melzinho'.
    Keep the exact bottle, proportions, liquid color, and label from the reference image completely unchanged.
    The brand cursive title 'Melzinho', the silver metallic foil texture, the dripping honey at the top of the label, and the green amburana tree illustration MUST remain crisp, sharp, perfectly legible, and identical to the original reference photo without any distortion or hallucinated letters.
    Place this exact product as the central hero focus of the following commercial scene: {prompt_cena}
        """

    prompt_edicao = f"""
    {product_instruction}
    {promo_instruction}
    Only generate the environment, lighting, commercial art direction, and background around the reference product(s).
    Do not alter, warp, or add fake text to any product label.
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