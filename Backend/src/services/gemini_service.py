import io
import json
import os
from dataclasses import dataclass, field

import time
from fastapi import HTTPException
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


@dataclass
class CampanhaInput:
    nicho: str
    objetivo: str
    detalhes: str | None = None
    estilo: str | None = None
    images_list: list[bytes] = field(default_factory=list)
    reference_title: str | None = None
    reference_recipe: str | None = None
    texto_promocional: str | None = None
    evento: str | None = None
    evento_descricao: str | None = None


def generate_campaign_copy(dados: CampanhaInput) -> dict:
    prompt_sistema = f"""
    Você é um especialista em marketing digital de alto padrão. Gere uma campanha de alta conversão para o Instagram.
    A legenda gerada (legenda_instagram) deve ser concisa, direta e cativante, com no máximo 2 a 3 parágrafos pequenos,
    acompanhada de hashtags e gatilhos mentais adequados.
    DIRETRIZ DE TOM E ESTILO:
    - Mantenha tom profissional, executivo e autêntico.
    - É EXPRESSAMENTE PROIBIDO o uso excessivo de emojis (evite emojis como marcadores de tópicos ou após cada frase).
    - Utilize no máximo 1 ou 2 emojis discretos e bem contextualizados ao longo de toda a legenda, ou nenhum se preferir tom mais sóbrio.
    Propagandas devem sempre mirar em um público com mais de 18 anos devido a venda de bebidas alcóolicas.
    Nicho do cliente: {dados.nicho}
    Objetivo da campanha: {dados.objetivo}
    """

    if dados.detalhes:
        prompt_sistema += f"\nDetalhes e ideias adicionais fornecidos pelo cliente: {dados.detalhes}"

    if dados.estilo:
        prompt_sistema += f"\nEstilo estético visual desejado: {dados.estilo}"

    tem_evento = bool(dados.evento and dados.evento.strip() and dados.evento.lower() not in ("geral", "campanha promocional"))

    if tem_evento:
        desc_evento = f" ({dados.evento_descricao})" if dados.evento_descricao else ""
        prompt_sistema += f"""
    ★ EVENTO / DATA COMEMORATIVA CENTRAL: '{dados.evento}'{desc_evento}
    Esta campanha celebra especificamente o evento '{dados.evento}'.
    A legenda_instagram DEVE conectar o sabor premium e a tradição do Melzinho com a celebração e espírito festivo de '{dados.evento}'.
    """

    if dados.reference_recipe:
        if tem_evento:
            prompt_sistema += f"""
    ★ DIRETRIZ DE FUSÃO TEMÁTICA OBRIGATÓRIA (THEME FUSION PROTOCOL):
    - Estilo de referência visual: {dados.reference_title or ''}
    - Receita técnica da referência: {dados.reference_recipe}
    - Evento comemorativo da campanha: {dados.evento}

    REGRA DE OURO PARA O CAMPO 'sugestao_prompt_imagem':
    Você DEVE fundir e harmonizar o evento '{dados.evento}' com o estilo de referência '{dados.reference_title or 'comercial'}':
    1. O estilo de referência determina a técnica fotográfica, enquadramento de produto hero, reflexos nobres e iluminação de estúdio comercial.
    2. A atmosfera, adereços e elementos decorativos de bom gosto do evento '{dados.evento}' DEVEM OBRIGATORIAMENTE ESTAR VISÍVEIS NA CENA:
       - Se for Natal: inclua iluminação natalina com luzes de fada (fairy lights) em bokeh dourado quente, pinhas, canela em pau, fita comemorativa discreta, clima acolhedor de ceia de fim de ano.
       - Se for Ano Novo / Réveillon: taças de brinde, luzes cintilantes brancas e douradas, clima elegante de virada.
       - Se for São João / Festa Junina: fogueira acolhedora ao fundo, caneca de quentão, bandeirinhas festivas rústicas.
       - Se for Dia dos Pais: clima nobre de degustação especial, couro, madeira escura e brinde em família.
       - Se for Carnaval: energia vibrante, confetes sutis e clima de celebração tropical.
    3. A garrafa oficial do 'Melzinho' permanece como o produto hero absoluto, central e com iluminação publicitária brilhante.
    NUNCA ignore o evento '{dados.evento}'. O anúncio DEVE ser inconfundivelmente comemorativo de '{dados.evento}'!
    """
        else:
            prompt_sistema += f"\nDIRETRIZ DE REFERÊNCIA VISUAL / ESTILO PUBLICITÁRIO:\nEstilo: {dados.reference_title or ''}\nReceita visual: {dados.reference_recipe}\nAo compor o campo 'sugestao_prompt_imagem', incorpore rigorosamente os elementos de composição, paleta, iluminação e atmosfera dessa referência."
    elif tem_evento:
        prompt_sistema += f"""
    ★ DIRETRIZ VISUAL DE EVENTO SAZONAL:
    Crie uma composição publicitária comercial deslumbrante e inconfundivelmente comemorativa para o evento '{dados.evento}', com garrafa hero de Melzinho em primeiro plano, adereços elegantes da data e iluminação festiva de alto padrão.
    """

    if dados.texto_promocional:
        prompt_sistema += f"\nOFERTA / SELO PROMOCIONAL DA CAMPANHA: '{dados.texto_promocional}'. Destaque essa oferta imperdível na legenda e no apelo do anúncio."

    conteudo_gemini: list = []

    if dados.images_list:
        for img_bytes in dados.images_list:
            conteudo_gemini.append(Image.open(io.BytesIO(img_bytes)))

        prompt_sistema += """
        No campo 'sugestao_prompt_imagem', crie uma descrição em INGLÊS para uma composição publicitária comercial de alto impacto (commercial social media advertising flyer poster) para o Instagram.
        Descreva o ambiente cênico profissional (iluminação de estúdio comercial, reflexos quentes, composição moderna, superfícies de destaque e elementos cênicos do estilo).
        O produto central em destaque é a garrafa da cachaça artesanal 'Melzinho'.
        NÃO redesenhe ou altere o rótulo do produto, pois os detalhes visuais da garrafa serão preservados da foto de referência.
        """
    else:
        prompt_sistema += """
        No campo 'sugestao_prompt_imagem', crie uma descrição em INGLÊS para uma composição publicitária comercial de alto impacto (commercial social media advertising flyer poster) para a cachaça artesanal 'Melzinho'.
        Descreva o cenário publicitário de estúdio, iluminação comercial quente e composição limpa e moderna.
        """

    contexto_clima = get_climate_context()
    prompt_sistema += f"\nContexto sobre o clima atual: {', '.join(contexto_clima)}"

    conteudo_gemini.append(prompt_sistema)

    # 1. Tenta Gemini com retry automático em caso de sobrecarga (503 / UNAVAILABLE)
    last_error = None
    for attempt in range(1, 3):
        try:
            response = client.models.generate_content(
                model=TEXT_MODEL,
                contents=conteudo_gemini,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiPromptModel,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            last_error = e
            err_msg = str(e)
            print(f"[Gemini] Tentativa {attempt}/2 falhou: {err_msg[:120]}")
            if attempt < 2 and ("503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg):
                time.sleep(2)
                continue
            break

    # 2. Se o Gemini falhar por indisponibilidade temporária, aciona contingência na OpenAI
    print("[IA] Gemini indisponível no momento. Acionando fallback automático com OpenAI gpt-4o-mini...")
    try:
        return generate_campaign_copy_openai_fallback(dados, prompt_sistema)
    except Exception as fallback_err:
        print(f"[Fallback OpenAI] Erro na contingência: {fallback_err}")
        raise HTTPException(
            status_code=503,
            detail="Os servidores de IA estão com alta demanda temporária. Por favor, tente novamente em alguns instantes."
        )


def generate_campaign_copy_openai_fallback(dados: CampanhaInput, prompt_sistema: str) -> dict:
    """
    Fallback de alta disponibilidade: se a API do Gemini estiver fora do ar ou sobrecarregada,
    usa o modelo gpt-4o-mini da OpenAI para gerar a copy e o prompt publicitário da campanha.
    """
    from src.services.openai_service import client as openai_client
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    f"{prompt_sistema}\n\n"
                    "Responda OBRIGATORIAMENTE em formato JSON válido contendo exatamente estas 3 chaves:\n"
                    "{\n"
                    '  "titulo_campanha": "Título chamativo",\n'
                    '  "legenda_instagram": "Legenda concisa e engajadora",\n'
                    '  "sugestao_prompt_imagem": "Prompt em inglês descrevendo o cenário comercial"\n'
                    "}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Gere a campanha de marketing para o nicho '{dados.nicho}' e objetivo '{dados.objetivo}'"
                    + (f" e evento comemorativo '{dados.evento}'" if dados.evento and dados.evento.strip() else "")
                    + "."
                )
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    content = response.choices[0].message.content
    return json.loads(content)


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
