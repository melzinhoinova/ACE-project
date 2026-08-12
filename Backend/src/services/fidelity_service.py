"""
src/services/fidelity_service.py

Usa o Gemini como "juiz": compara a imagem gerada pelo gpt-image-2 com a
foto original do produto e dá uma nota de fidelidade + motivo.
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

JUIZ_MODEL = "gemini-flash-lite-latest"

PROMPT_AVALIACAO = """
Compare as duas imagens: a primeira é a foto ORIGINAL do produto,
a segunda é uma imagem GERADA que deveria conter o mesmo produto em uma nova cena.

Avalie o quão fiel a imagem gerada é ao produto original em: cor, formato,
proporções, texto/rótulo, logotipo e formato da tampa/embalagem.

Seja rigoroso: qualquer distorção perceptível de forma, cor ou texto do rótulo
deve reduzir bastante o score. Pequenas diferenças de ângulo/iluminação da CENA
não devem penalizar, desde que o PRODUTO em si esteja fiel.

Responda APENAS em JSON, no formato:
{"score": <número de 0.0 a 1.0>, "motivo": "<explicação curta em português>"}
"""


def score_image_fidelity(imagem_original: bytes, imagem_gerada: bytes) -> tuple[float, str]:
    pil_original = Image.open(io.BytesIO(imagem_original))
    pil_gerada = Image.open(io.BytesIO(imagem_gerada))

    response = client.models.generate_content(
        model=JUIZ_MODEL,
        contents=[PROMPT_AVALIACAO, pil_original, pil_gerada],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    resultado = json.loads(response.text)
    return float(resultado["score"]), resultado.get("motivo", "")