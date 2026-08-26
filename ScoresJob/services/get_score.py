from google import genai
from google.genai import types
from dotenv import load_dotenv
from datetime import date 

import os

from schemas.schemas import GeminiScoreResponse, OpportunityResponse

load_dotenv()

os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
os.environ.pop("GOOGLE_API_KEY", None)
client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

TEXT_MODEL = "gemini-flash-lite-latest"

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


def get_score(
    opportunities: list[OpportunityResponse]
) -> GeminiScoreResponse:

    opps_serializadas = [
        {
            "id": opp.id,
            "title": opp.title,
            "description": opp.description or "",
            "date": str(opp.date)
        }
        for opp in opportunities
    ]

    prompt = f"""
    Você é um especialista em marketing digital.

    Para cada oportunidade na lista, atribua um score:
    - high
    - medium
    - low

    O score deve representar o quão vantajosa aquela oportunidade
    será para gerar vendas em uma campanha de marketing,
    considerando que a campanha será realizada hoje.

    Considere:
    - proximidade da oportunidade;
    - relevância comercial;
    - sazonalidade;
    - potencial de vendas.

    Data atual: {date.today()}

    Oportunidades:
    {opps_serializadas}
    """

    raw_schema = GeminiScoreResponse.model_json_schema()

    safe_schema = remove_additional_properties(
        raw_schema
    )

    response = client.models.generate_content(
        model=TEXT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=safe_schema
        )
    )

    return GeminiScoreResponse.model_validate_json(
        response.text
    )