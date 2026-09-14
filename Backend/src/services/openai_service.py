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
    Masterpiece commercial advertising photography for Instagram featuring an authentic commercial kit/duo of the {num_products} products shown in the reference image.
    ORGANIC KIT STAGING & DEPTH:
    - Stage the {num_products} products harmoniously together as an elegant premium commercial gift kit / tasting set, organically resting on the scene's surface (such as a polished stone bar counter, rustic amburana wooden barrel table, or luxury studio pedestal).
    - The products must feel physically grounded and organically integrated into the environment: generate photorealistic contact shadows at their base, natural ambient occlusion where the bottles stand together, and subtle realistic surface reflections.
    - Directional commercial studio lighting and warm environmental rim lights must naturally wrap around the glass bottles and contours, making them look completely native to the scene rather than pasted on.
    - Both products must remain sharp, crisp, and in focus as the hero kit, with a beautiful cinematic soft bokeh in the background.

    LABEL & BRAND FIDELITY:
    - Keep ALL {num_products} products, bottles, shapes, liquid colors, caps, and labels from the reference image completely authentic and faithful to the original.
    - Every single label, cursive brand logo, foil texture, typography, and detail from the reference image MUST remain crisp, sharp, perfectly legible, and identical to the reference photo.
    - Do NOT replace any product with a generic bottle, and do not invent fake labels or hallucinated items.

    SCENE SETTING:
    {prompt_cena}
        """
    else:
        product_instruction = f"""
    Masterpiece commercial advertising photography for Instagram featuring the Brazilian artisanal cachaça brand 'Melzinho'.
    ORGANIC PRODUCT INTEGRATION:
    - The bottle must feel physically grounded and organically integrated into the environment: generate photorealistic contact shadows at its base, natural ambient occlusion, and subtle realistic surface reflections on the table/pedestal.
    - Warm cinematic commercial lighting and gentle rim lights must naturally wrap around the bottle contours and glass.
    - The bottle is in crisp sharp focus as the central hero, with a beautiful cinematic depth of field.

    BRAND FIDELITY:
    - Keep the exact bottle, proportions, liquid color, and label from the reference image completely unchanged.
    - The brand cursive title 'Melzinho', the silver metallic foil texture, the dripping honey at the top of the label, and the green amburana tree illustration MUST remain crisp, sharp, perfectly legible, and identical to the original reference photo without any distortion or hallucinated letters.

    SCENE SETTING:
    {prompt_cena}
        """

    prompt_edicao = f"""
    {product_instruction}
    {promo_instruction}
    Generate the rich commercial environment, lighting, surface, and atmosphere around the authentic reference product(s).
    Ensure the product(s) blend seamlessly and organically into the scene with natural lighting, contact shadows, and realistic physical presence.
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