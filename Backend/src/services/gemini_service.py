from PIL import Image

from google import genai
from google.genai import types

from dotenv import load_dotenv

import os
import io
import json
import requests

from src.models.api_models import GeminiPromptModel

load_dotenv()

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
os.environ.pop("GOOGLE_API_KEY", None)
client = genai.Client(api_key=os.getenv("GEMINI_KEY"))
open_meteo = os.getenv("OPEN_METEO_URL")

def get_climate_context():

    latitude, longitude = 21.5601, 50.3045

    params = {
        "latitude": latitude,
        "longitude": longitude,

        "current": [
            "temperature_2m",
            "apparent_temperature",
        ],

        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
        ],
    }

    response = requests.get(open_meteo, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    current = data["current"]
    daily = data["daily"]

    context_prompt: list = []

    if current["temperature_2m"] >= 25:
        context_prompt.append(
            "Temperatura moderada à alta indica melhor venda de bebidas que são servidas geladas, considere o frescor de uma bebida trincando"
            ) 

    elif current["temperature_2m"] < 25:
        context_prompt.append(
            "Temperatura moderada à baixa indica melhor venda de bebidas que esquentam, conseidere o calor do alcool"
            )

    return context_prompt

def gemini_response(
        nicho: str,
        objetivo: str,
        detalhes: str | None = None,
        estilo: str | None = None,
        images_list: list[bytes] | None = None
    ):

    prompt_sistema = f"""
    Você é um especialista em marketing digital. Gere uma campanha de alta conversão para o Instagram.
    A legenda gerada (legenda_instagram) deve ser concisa, direta e cativante, com no máximo 2 a 3 parágrafos pequenos (evite textos excessivamente longos), acompanhada de hashtags e gatilhos mentais adequados.
    Propagandas devem sempre mirar em um público com mais de 18 anos devido a venda de bebidas alcóolicas.
    Nicho do cliente: {nicho}
    Objetivo da campanha: {objetivo}
    """

    if detalhes:
        prompt_sistema += f"\nDetalhes e ideias adicionais fornecidos pelo cliente: {detalhes}"

    if estilo:
        prompt_sistema += f"\nEstilo estético visual desejado: {estilo}"

    if images_list is not None and len(images_list) > 0:
        conteudo_gemini = []
        for img_bytes in images_list:
            pil_image = Image.open(io.BytesIO(img_bytes))
            conteudo_gemini.append(pil_image)
            
        prompt_sistema += """
        Você DEVE analisar detalhadamente o produto apresentado nas FOTOS DO PRODUTO (sua cor, formato geométrico da embalagem/frasco, tampa, rótulo e design de logotipo).
        No campo 'sugestao_prompt_imagem', descreva em INGLÊS um cenário publicitário realista (com o estilo visual selecionado) onde o produto original esteja posicionado em destaque no centro da cena.
        CRÍTICO: O prompt gerado para o DALL-E 3 DEVE conter uma descrição física extremamente detalhada do seu produto (exemplo: 'A tall cylindrical glass bottle filled with amber liquid, featuring a white minimalist label with the black text brand logo...'). NÃO diga apenas 'the product' ou 'the brand logo'. Descreva os atributos visuais e formato do produto em detalhes para que o DALL-E 3 consiga desenhá-lo de forma realista e fiel conforme as fotos de referência, sem distorcer sua geometria ou omitir sua marca e logotipo. O produto deve ser o elemento central da imagem publicitária. O prompt gerado deve conter apenas a descrição do cenário e do produto em inglês, sem incluir marcas d'água ou textos de slogan no fundo.
        """
        conteudo_gemini.append(prompt_sistema)
    else:
        prompt_sistema += """
        No campo 'sugestao_prompt_imagem', descreva um cenário publicitário profissional em INGLÊS que seja adequado para o nicho e incorpore o estilo estético selecionado (por exemplo, se o estilo for 'Fotorrealista', descreva a cena com termos como 'professional commercial photography, studio lighting, highly detailed'; se for 'Minimalista', descreva a cena com 'minimalist setting, clean pastel background, soft shadows'). O prompt de imagem gerado deve descrever apenas a composição cênica em inglês, sem incluir textos, marcas d'água ou banners.
        """
        conteudo_gemini = [prompt_sistema]

    # CONTEXTO CLIMÁTICO
    contexto_clima = get_climate_context()
    print("Contexto Clima:", contexto_clima)
    prompt_sistema += f"""
    Contexto sobre o clima atual: {", ".join(contexto_clima)}
    """

    # ANÁLISE MULTIMODAL E COPYWRITING COM GEMINI
    model = 'gemini-flash-lite-latest'

    response = client.models.generate_content(
        model=model,
        contents=conteudo_gemini,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiPromptModel
        )
    )

    dados_campanha = json.loads(response.text)

    return dados_campanha