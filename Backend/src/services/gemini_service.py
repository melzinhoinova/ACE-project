import io
import json
import os
from dataclasses import dataclass, field

from dotenv import load_dotenv
from PIL import Image
from google import genai
from google.genai import types

from pydantic import BaseModel, Field
from src.models.api_models import GeminiPromptModel
from src.models.api_models import OpportunityResponse, ScoreResponse
from src.services.climate_data_service import get_climate_context

load_dotenv()

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
os.environ.pop("GOOGLE_API_KEY", None)
client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

TEXT_MODEL = "gemini-flash-lite-latest"


class OpportunityScoreItem(BaseModel):
    id: int = Field(description="ID da oportunidade correspondente")
    score: str = Field(description="Classificação da oportunidade: high, medium, ou low")


class GeminiScoreResponse(BaseModel):
    scores: list[OpportunityScoreItem]


def remove_additional_properties(schema: dict) -> dict:
    """
    Remove recursivamente a chave 'additionalProperties' de um JSON Schema
    para torná-lo compatível com a Gemini Developer API.
    """
    if not isinstance(schema, dict):
        return schema

    cleaned = {}
    for key, value in schema.items():
        if key == "additionalProperties":
            continue  # Ignora a chave problemática

        if isinstance(value, dict):
            cleaned[key] = remove_additional_properties(value)
        elif isinstance(value, list):
            cleaned[key] = [
                remove_additional_properties(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            cleaned[key] = value

    return cleaned


def get_score(opportunities: list[OpportunityResponse]) -> dict:
    opps_serializadas = []
    for opp in opportunities:
        opp_id = getattr(opp, "id", None)
        opp_title = getattr(opp, "title", None)
        opp_desc = getattr(opp, "description", None)
        opp_date = getattr(opp, "date", None)

        opps_serializadas.append({
            "id": opp_id,
            "title": opp_title,
            "description": opp_desc or "",
            "date": str(opp_date) if opp_date else ""
        })

    prompt: str = f"""
    Você é um especialista em marketing digital. Para cada oportunidade na lista,
    atribua um score de high, medium, low de acordo com o quão vantajosa aquela oportunidade será para gerar vendas
    em uma campanha de marketing atualmente. Leve em consideração notícias atuais e pesquisas de mercado.
    
    opportunities: {opps_serializadas}
    """

    raw_schema = GeminiScoreResponse.model_json_schema()
    safe_schema = remove_additional_properties(raw_schema)

    response = client.models.generate_content(
        model=TEXT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=safe_schema
        )
    )

    dados = json.loads(response.text)

    scores_dict = {}
    if "scores" in dados and isinstance(dados["scores"], list):
        for item in dados["scores"]:
            if isinstance(item, dict) and "id" in item and "score" in item:
                scores_dict[item["id"]] = item["score"]

    final_scores = []
    for opp in opportunities:
        opp_id = getattr(opp, "id", None)
        score_val = scores_dict.get(opp_id, "medium")
        final_scores.append({
            "opportunity": opp,
            "score": score_val
        })

    return {"scores": final_scores}


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


def generate_opportunity_prompt(title: str, description: str | None = None) -> str:
    """
    Gera com Gemini uma sugestão curta de prompt de cena visual (em português)
    para inspirar a criação da imagem publicitária no e-mail de alerta.
    """
    try:
        prompt_str = f"""
        Você é um diretor de arte publicitário experiente.
        Escreva uma sugestão curta de prompt de imagem/cenário visual (em português, máximo 2 frases)
        para criar o anúncio perfeito sobre a oportunidade: '{title}'.
        {f'Descrição complementar: {description}' if description else ''}
        Responda APENAS com o texto da sugestão do prompt de imagem, sem aspas e sem saudações.
        """
        res = client.models.generate_content(
            model=TEXT_MODEL,
            contents=prompt_str,
        )
        return res.text.strip().replace('"', '')
    except Exception as e:
        print(f"[Gemini] Aviso: Falha ao gerar prompt de imagem: {e}")
        return f"Cenário publicitário de estúdio elegante em iluminação comercial suave para a campanha de {title}, composição limpa e moderna."