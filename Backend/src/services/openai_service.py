import base64
import io
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_key = os.getenv("OPENAI_KEY")
client = OpenAI(api_key=openai_key)


def openai_edit_response(prompt_cena: str, imagem_original: bytes, quality: str = "medium") -> bytes:
    """
    Args:
        prompt_cena: descrição em inglês do CENÁRIO (não descreve o produto).
        imagem_original: bytes da foto do produto já recortada/normalizada.
        quality: 'low' | 'medium' | 'high'. Use 'low'/'medium' em testes,
            suba pra 'high' só na versão final aprovada pro cliente.
    """
    imagem_arquivo = io.BytesIO(imagem_original)
    imagem_arquivo.name = "produto_original.png"

    prompt_edicao = f"""
    Keep the exact product from the reference image unchanged — same color, shape,
    proportions, label text, logo and packaging. Do not redesign or reinterpret it.
    Place this exact product as the central focus of the following scene: {prompt_cena}
    Only generate the environment, lighting and background around the product.
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