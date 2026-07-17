from PIL import Image

from google import genai
from google.genai import types

from dotenv import load_dotenv

import os
import io
import json

from src.models.api_models import CampanhaMarketing

load_dotenv()

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
os.environ.pop("GOOGLE_API_KEY", None)
client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

def connect_gemini(
        nicho: str,
        objetivo: str,
        image_bytes: bytes | None
    ):

    conteudo_gemini: list = []

    if image_bytes is not None:
        pil_image = Image.open(io.BytesIO(image_bytes))

        prompt_sistema = f"""
        Você é um especialista em marketing digital. Analise a FOTO DESTE PRODUTO e gere uma campanha 
        de alta conversão para o Instagram.
        Nicho do cliente: {nicho}
        Objetivo da campanha: {objetivo}
        No campo 'sugestao_prompt_imagem', descreva um cenário publicitário profissional (ex: 'on a minimalist wooden table with soft studio lighting, bokeh background') em INGLÊS, adequado para este produto.
        """

        conteudo_gemini = [pil_image, prompt_sistema]

    else:
        prompt_sistema = f"""
        Você é um especialista em marketing digital. Gere uma campanha 
        conceitual de alta conversão para o Instagram com base nas informações abaixo.
        Nicho do cliente: {nicho}
        Objetivo da campanha: {objetivo}
        No campo 'sugestao_prompt_imagem', descreva um cenário publicitário profissional (ex: 'on a minimalist wooden table with soft studio lighting, bokeh background') em INGLÊS, imaginando um produto ideal para esta campanha.
        """

        conteudo_gemini = [prompt_sistema]

    # ANÁLISE MULTIMODAL E COPYWRITING COM GEMINI (Custo R$ 0,00 no Free Tier)
    model = 'gemini-2.5-flash'

    response = client.models.generate_content(
        model=model,
        contents=conteudo_gemini,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CampanhaMarketing
        )
    )

    dados_campanha = json.loads(response.text)

    return {
        "status": "sucesso",
        "campanha": dados_campanha,
        "mensagem": "Campanha gerada com sucesso!"
    }