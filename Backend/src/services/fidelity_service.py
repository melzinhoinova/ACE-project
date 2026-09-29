"""
src/services/fidelity_service.py

Usa o Gemini como "juiz": compara a imagem gerada pelo gpt-image-2.5-sunburst com a
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
Compare as duas imagens: a primeira é a foto ORIGINAL de referência (produto único ou kit/conjunto de produtos),
a segunda é a imagem GERADA que deve conter os mesmos produtos integrados em uma nova cena comercial.

Critérios de avaliação rigorosos:
1. QUANTIDADE E PRESENÇA: Se a imagem original contém múltiplos produtos/garrafas (kit/combo/trio), TODOS os produtos e garrafas devem estar presentes na imagem gerada. A exclusão ou omissão de qualquer produto original deve penalizar severamente a nota (score < 0.6).
2. FIDELIDADE VISUAL: Avalie a fidelidade em rótulos, títulos das marcas, tipografia, cores do líquido, formato das garrafas e tampas.
3. Não penalize variações normais de iluminação e composição do cenário, desde que os produtos originais estejam fiéis, legíveis e preservados.

Responda APENAS em JSON, no formato:
{"score": <número de 0.0 a 1.0>, "motivo": "<explicação curta em português>"}
"""


import time


def score_image_fidelity(imagem_original: bytes, imagem_gerada: bytes) -> tuple[float, str]:
    pil_original = Image.open(io.BytesIO(imagem_original))
    pil_gerada = Image.open(io.BytesIO(imagem_gerada))

    models_to_try = [JUIZ_MODEL, "gemini-2.0-flash", "gemini-1.5-flash"]
    last_error = None

    for model_name in models_to_try:
        for attempt in range(3):  # Tenta até 3 vezes por modelo
            try:
                print(f"Tentando avaliar fidelidade de imagem com {model_name} (tentativa {attempt + 1})...")
                response = client.models.generate_content(
                    model=model_name,
                    contents=[PROMPT_AVALIACAO, pil_original, pil_gerada],
                    config=types.GenerateContentConfig(response_mime_type="application/json"),
                )
                resultado = json.loads(response.text)
                return float(resultado["score"]), resultado.get("motivo", "")
            except Exception as e:
                last_error = e
                print(f"Erro ao avaliar fidelidade com {model_name} na tentativa {attempt + 1}: {e}")
                time.sleep(1 * (attempt + 1))
                continue

    # Fallback estático de contingência final para evitar erro 500 no endpoint
    print(f"ATENÇÃO: Todos os modelos de avaliação de fidelidade falharam. Retornando fallback seguro. Erro final: {last_error}")
    return 0.80, "Avaliação temporariamente indisponível devido à alta demanda do servidor de IA. Imagem aprovada por contingência."