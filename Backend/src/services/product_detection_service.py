"""
src/services/product_detection_service.py

O usuário pode enviar:
1. Uma foto com um único produto em destaque.
2. Uma foto que já é um KIT / COMBO (ex: 2 ou 3 garrafas juntas na mesma foto).
3. Uma foto com fundo de balcão/mesa ou elementos indesejados.

Este passo usa o Gemini Flash Lite para:
- Localizar a área principal do produto ou do conjunto completo (kit/trio).
- Contar quantas unidades/garrafas estão visíveis dentro do conjunto.
- Recortar com margem de respiro segura sem cortar nenhuma garrafa.
"""

import io
import json
import os

from dotenv import load_dotenv
from PIL import Image
from google import genai
from google.genai import types

load_dotenv()

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
os.environ.pop("GOOGLE_API_KEY", None)
client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

DETECTION_MODEL = "gemini-flash-lite-latest"

PROMPT_DETECCAO = """
Analise esta imagem de produto(s).
Identifique a área principal do produto ou kit/conjunto de produtos em destaque na foto, garantindo que todo o conjunto (todas as garrafas, tampas, rótulos e embalagens) esteja incluído no enquadramento.
Conte também quantas unidades de produtos/garrafas distintas estão visíveis dentro desse conjunto principal.

Responda APENAS em JSON, no formato:
{"box_2d": [ymin, xmin, ymax, xmax], "label": "nome curto do produto ou conjunto", "quantidade": 1}

As coordenadas box_2d devem estar normalizadas de 0 a 1000 (não em pixels),
onde [0,0] é o canto superior esquerdo e [1000,1000] o canto inferior direito.
"""


def detect_and_crop_product(imagem_bytes: bytes, margem_pct: float = 0.06) -> tuple[bytes, int]:
    """
    Localiza o produto ou conjunto de produtos, recorta a área de interesse
    e retorna uma tupla (bytes_recortados, quantidade_detectada).
    """
    try:
        pil_original = Image.open(io.BytesIO(imagem_bytes)).convert("RGB")

        response = client.models.generate_content(
            model=DETECTION_MODEL,
            contents=[PROMPT_DETECCAO, pil_original],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        resultado = json.loads(response.text)
        ymin, xmin, ymax, xmax = resultado["box_2d"]
        quantidade = int(resultado.get("quantidade", 1) or 1)

        largura, altura = pil_original.size

        left = (xmin / 1000) * largura
        top = (ymin / 1000) * altura
        right = (xmax / 1000) * largura
        bottom = (ymax / 1000) * altura

        margem_x = (right - left) * margem_pct
        margem_y = (bottom - top) * margem_pct

        left = max(0, left - margem_x)
        top = max(0, top - margem_y)
        right = min(largura, right + margem_x)
        bottom = min(altura, bottom + margem_y)

        recorte = pil_original.crop((left, top, right, bottom))

        buffer = io.BytesIO()
        recorte.save(buffer, format="JPEG", quality=95)
        return buffer.getvalue(), max(1, quantidade)

    except Exception as erro:
        print(f"[product_detection] Falha ao recortar produto, usando imagem original: {erro}")
        return imagem_bytes, 1


def crop_to_single_product(imagem_bytes: bytes, margem_pct: float = 0.06) -> bytes:
    """Função utilitária legada: retorna apenas os bytes recortados."""
    recorte, _ = detect_and_crop_product(imagem_bytes, margem_pct)
    return recorte