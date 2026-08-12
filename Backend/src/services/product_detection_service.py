"""
src/services/product_detection_service.py

O dono da loja pode mandar a foto de qualquer jeito: duas garrafas lado a
lado, várias unidades, ângulo torto, fundo com outras coisas no quadro.
Se mandarmos essa foto "crua" pro images.edit, o modelo pode preservar
elementos indesejados (ex: duas garrafas na imagem final).

Este passo usa o Gemini pra localizar UM único produto em destaque na foto
e recorta só ele, com uma margem de respiro. Se a detecção falhar, cai de
volta pra foto original sem quebrar o pipeline.
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
Analise esta imagem de produto. Pode haver uma ou mais unidades do mesmo
produto na foto (ex: duas garrafas iguais lado a lado).

Identifique APENAS UMA unidade do produto — a mais nítida, centralizada e
bem enquadrada — mesmo que existam outras unidades iguais na imagem.

Responda APENAS em JSON, no formato:
{"box_2d": [ymin, xmin, ymax, xmax], "label": "nome curto do produto"}

As coordenadas box_2d devem estar normalizadas de 0 a 1000 (não em pixels),
onde [0,0] é o canto superior esquerdo e [1000,1000] o canto inferior direito.
"""


def crop_to_single_product(imagem_bytes: bytes, margem_pct: float = 0.06) -> bytes:
    try:
        pil_original = Image.open(io.BytesIO(imagem_bytes)).convert("RGB")

        response = client.models.generate_content(
            model=DETECTION_MODEL,
            contents=[PROMPT_DETECCAO, pil_original],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        resultado = json.loads(response.text)
        ymin, xmin, ymax, xmax = resultado["box_2d"]

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
        return buffer.getvalue()

    except Exception as erro:
        print(f"[product_detection] Falha ao recortar produto, usando imagem original: {erro}")
        return imagem_bytes