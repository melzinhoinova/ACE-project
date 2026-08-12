import io
import json
import os
from dataclasses import dataclass, field

from dotenv import load_dotenv
from PIL import Image
from google import genai
from google.genai import types

from src.models.api_models import GeminiPromptModel
from src.services.climate_data_service import get_climate_context

load_dotenv()

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
os.environ.pop("GOOGLE_API_KEY", None)
client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

TEXT_MODEL = "gemini-flash-lite-latest"


@dataclass
class CampanhaInput:
    nicho: str
    objetivo: str
    detalhes: str | None = None
    estilo: str | None = None
    images_list: list[bytes] = field(default_factory=list)


def generate_campaign_copy(dados: CampanhaInput) -> dict:
    prompt_sistema = f"""
    Você é um especialista em marketing digital. Gere uma campanha de alta conversão para o Instagram.
    A legenda gerada (legenda_instagram) deve ser concisa, direta e cativante, com no máximo 2 a 3 parágrafos pequenos,
    acompanhada de hashtags e gatilhos mentais adequados.
    Propagandas devem sempre mirar em um público com mais de 18 anos devido a venda de bebidas alcóolicas.
    Nicho do cliente: {dados.nicho}
    Objetivo da campanha: {dados.objetivo}
    """

    if dados.detalhes:
        prompt_sistema += f"\nDetalhes e ideias adicionais fornecidos pelo cliente: {dados.detalhes}"

    if dados.estilo:
        prompt_sistema += f"\nEstilo estético visual desejado: {dados.estilo}"

    conteudo_gemini: list = []

    if dados.images_list:
        for img_bytes in dados.images_list:
            conteudo_gemini.append(Image.open(io.BytesIO(img_bytes)))

        prompt_sistema += """
        Observe o produto nas fotos apenas para entender o nicho/contexto visual.
        No campo 'sugestao_prompt_imagem', descreva em INGLÊS apenas o CENÁRIO publicitário
        (iluminação, ambiente, composição, ângulo, superfícies, atmosfera) onde o produto ficará em destaque.
        NÃO descreva a aparência física do produto (cor, formato, rótulo, logotipo) — isso será preservado
        automaticamente a partir da foto original em uma etapa posterior de edição de imagem.
        """
    else:
        prompt_sistema += """
        No campo 'sugestao_prompt_imagem', descreva um cenário publicitário profissional em INGLÊS adequado
        ao nicho e ao estilo estético selecionado. Descreva apenas a composição cênica, sem textos, marcas
        d'água ou banners.
        """

    contexto_clima = get_climate_context()
    prompt_sistema += f"\nContexto sobre o clima atual: {', '.join(contexto_clima)}"

    conteudo_gemini.append(prompt_sistema)

    response = client.models.generate_content(
        model=TEXT_MODEL,
        contents=conteudo_gemini,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiPromptModel,
        ),
    )

    return json.loads(response.text)