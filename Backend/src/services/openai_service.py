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
    imagem_original: bytes | list[bytes],
    quality: str = "medium",
    promo_text: str | None = None,
    num_products: int = 1,
    product_names: list[str] | None = None,
) -> bytes:
    """
    Args:
        prompt_cena: descrição em inglês do CENÁRIO (não descreve o produto).
        imagem_original: bytes da foto ou lista de bytes das fotos dos produtos.
        quality: 'low' | 'medium' | 'high' | 'xhigh' | 'max'.
        promo_text: texto opcional para selo promocional comercial (ex: 'COMPRE 1 LEVE 2').
        num_products: quantidade total de produtos/garrafas presentes.
        product_names: lista opcional de nomes/marcas dos produtos identificados.
    """
    if isinstance(imagem_original, list):
        image_files = []
        for idx, img_b in enumerate(imagem_original):
            buf = io.BytesIO(img_b)
            buf.name = f"produto_ref_{idx + 1}.png"
            image_files.append(buf)
    else:
        imagem_arquivo = io.BytesIO(imagem_original)
        imagem_arquivo.name = "produto_original.png"
        image_files = [imagem_arquivo]

    promo_instruction = ""
    if promo_text and promo_text.strip():
        promo_instruction = f" Create a sleek commercial advertising poster/flyer layout with an eye-catching promotional badge or stylish text banner displaying '{promo_text.strip()}' in the scene, positioned harmoniously without obscuring any product or label."

    cleaned_names = [p.strip() for p in (product_names or []) if p and p.strip()]

    if num_products > 1:
        if cleaned_names:
            names_str = ", ".join(f"'{name}'" for name in cleaned_names)
            products_list_instruction = f"""
    The commercial kit consists of exactly {num_products} distinct authentic products/bottles: {names_str}.
    - Every single one of these {num_products} products ({names_str}) MUST appear distinctly and clearly in the final image.
    - Do NOT omit, exclude, or hide any of these products.
    - Do NOT replace or merge multiple products into a single generic bottle.
            """
        else:
            products_list_instruction = f"""
    The commercial kit consists of exactly {num_products} distinct products/bottles shown in the reference image(s).
    - Every single one of the {num_products} products MUST appear distinctly and clearly in the final image.
    - Do NOT omit, exclude, or hide any of the products.
    - Do NOT merge products into generic bottles.
            """

        product_instruction = f"""
    Masterpiece commercial advertising photography for Instagram featuring an authentic commercial kit/collection of the {num_products} products shown in the reference image(s).
    {products_list_instruction}
    ORGANIC KIT STAGING & DEPTH:
    - Stage all {num_products} products harmoniously together as an elegant premium commercial gift kit / tasting set, organically resting on the scene's surface (such as a polished stone bar counter, rustic amburana wooden barrel table, or luxury studio pedestal).
    - The products must feel physically grounded and organically integrated into the environment: generate photorealistic contact shadows at their base, natural ambient occlusion where the bottles stand together, and subtle realistic surface reflections.
    - Directional commercial studio lighting and warm environmental rim lights must naturally wrap around the glass bottles and contours, making them look completely native to the scene rather than pasted on.
    - All {num_products} products must remain sharp, crisp, and in focus as the hero kit, with a beautiful cinematic soft bokeh in the background.

    LABEL & BRAND FIDELITY:
    - Keep ALL {num_products} products, bottles, shapes, liquid colors, caps, and labels from the reference image(s) completely authentic and faithful to the original.
    - Every single label, cursive brand logo, foil texture, typography, and detail from the reference image(s) MUST remain crisp, sharp, perfectly legible, and identical to the reference photos.
    - Do NOT replace any product with a generic bottle, and do not invent fake labels or hallucinated items.

    SCENE SETTING:
    {prompt_cena}
        """
    else:
        brand_name = cleaned_names[0] if cleaned_names else None
        if brand_name:
            brand_mention = f"featuring the Brazilian artisanal product '{brand_name}'"
            brand_detail = f"The brand title '{brand_name}', typography, liquid color, foil texture, and illustration on the label MUST remain crisp, sharp, perfectly legible, and identical to the reference photo without any distortion or hallucinated letters."
        else:
            brand_mention = "featuring the authentic artisanal product shown in the reference image"
            brand_detail = "The exact bottle, proportions, liquid color, typography, artwork, and label from the reference image MUST remain crisp, sharp, perfectly legible, and identical to the original reference photo without any distortion or hallucinated letters."

        product_instruction = f"""
    Masterpiece commercial advertising photography for Instagram {brand_mention}.
    ORGANIC PRODUCT INTEGRATION:
    - The bottle must feel physically grounded and organically integrated into the environment: generate photorealistic contact shadows at its base, natural ambient occlusion, and subtle realistic surface reflections on the table/pedestal.
    - Warm cinematic commercial lighting and gentle rim lights must naturally wrap around the bottle contours and glass.
    - The bottle is in crisp sharp focus as the central hero, with a beautiful cinematic depth of field.

    BRAND FIDELITY:
    - Keep the exact bottle, proportions, liquid color, cap, and label from the reference image completely unchanged.
    - {brand_detail}
    - Do NOT replace the product with a generic bottle, and do not invent fake labels or hallucinated text.

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
        model="gpt-image-2.5-sunburst",
        image=image_files,
        prompt=prompt_edicao,
        n=1,
        quality=quality,
        size="1024x1024",
        output_format="jpeg",
    )

    image_base64: str = result.data[0].b64_json
    return base64.b64decode(image_base64)