from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from PIL import Image

from google import genai
from google.genai import types

from dotenv import load_dotenv

import io
import json
import os

load_dotenv()

app = FastAPI()

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
os.environ.pop("GOOGLE_API_KEY", None)
client = genai.Client(api_key=os.getenv("KEY"))

class CampanhaMarketing(BaseModel):
    titulo_campanha: str = Field(description="Título interno da campanha")
    legenda_instagram: str = Field(description="Legenda engajadora com hashtags e gatilhos mentais")
    sugestao_prompt_cenario: str = Field(description="Prompt em inglês detalhado para gerar o fundo comercial ideal para este produto")

@app.post("/api/campanha")
async def gerar_campanha(
    nicho: str = Form(...),
    objetivo: str = Form(...),
    image: UploadFile | None = File(default=None)
):
    
    conteudo_gemini: list = []

    try:

        if image is not None:
            image_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(image_bytes))

            prompt_sistema = f"""
            Você é um especialista em marketing digital. Analise a FOTO DESTE PRODUTO e gere uma campanha 
            de alta conversão para o Instagram.
            Nicho do cliente: {nicho}
            Objetivo da campanha: {objetivo}
            No campo 'sugestao_prompt_cenario', descreva um cenário publicitário profissional (ex: 'on a minimalist wooden table with soft studio lighting, bokeh background') em INGLÊS, adequado para este produto.
            """

            conteudo_gemini = [pil_image, prompt_sistema]

        else:
            prompt_sistema = f"""
            Você é um especialista em marketing digital. Gere uma campanha 
            conceitual de alta conversão para o Instagram com base nas informações abaixo.
            Nicho do cliente: {nicho}
            Objetivo da campanha: {objetivo}
            No campo 'sugestao_prompt_cenario', descreva um cenário publicitário profissional (ex: 'on a minimalist wooden table with soft studio lighting, bokeh background') em INGLÊS, imaginando um produto ideal para esta campanha.
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

        import json
        dados_campanha = json.loads(response.text)

        return {
            "status": "sucesso",
            "campanha": dados_campanha,
            "mensagem": "Produto processado localmente com sucesso e inteligência gerada."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))