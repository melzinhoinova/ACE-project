"""
src/services/product_detection_service.py

O usuário pode enviar:
1. Uma foto com um único produto em destaque.
2. Uma foto que já é um KIT / COMBO (ex: 2 ou 3 garrafas juntas na mesma foto).
3. Uma foto com fundo de balcão/mesa ou elementos indesejados.

Este passo usa o Gemini Flash Lite para:
- Localizar a área principal do produto ou do conjunto completo (kit/trio).
- Contar quantas unidades/garrafas estão visíveis dentro do conjunto.
- Recortar com margem de respiro segura sem cortar nenhuma garrafa.
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
Analise esta imagem de produto(s) comercial(is).
1. Identifique a área principal do produto ou kit/conjunto de produtos em destaque na foto, garantindo que todo o conjunto (todas as garrafas, tampas, rótulos e frascos) esteja incluído no enquadramento.
2. Conte com precisão quantas unidades de produtos/garrafas distintas estão visíveis dentro desse conjunto principal.
3. Identifique o nome da marca, título do rótulo e tipo de cada produto visível (por exemplo: "Doce Trago Premium", "Senhor dos Pampas", "Melzinho").

Responda APENAS em JSON, no formato:
{
  "box_2d": [ymin, xmin, ymax, xmax],
  "label": "nome descritivo do produto ou kit",
  "quantidade": 1,
  "produtos_identificados": ["Nome/Rótulo 1", "Nome/Rótulo 2"]
}

As coordenadas box_2d devem estar normalizadas de 0 a 1000 (não em pixels),
onde [0,0] é o canto superior esquerdo e [1000,1000] o canto inferior direito.
"""


from pydantic import BaseModel, Field


class DetectedProductResponse(BaseModel):
    box_2d: list[int] = Field(description="Bounding box [ymin, xmin, ymax, xmax] normalizado de 0 a 1000 englobando todo o conjunto")
    label: str = Field(description="Descrição curta do produto ou conjunto/kit")
    quantidade: int = Field(description="Número total de garrafas ou produtos distintos visíveis")
    produtos_identificados: list[str] = Field(description="Nomes dos rótulos/marcas de cada produto visível")


def _flatten_boxes(raw) -> list[list[float]]:
    """Converte qualquer estrutura de bounding boxes retornada pelo Gemini em uma lista de [ymin, xmin, ymax, xmax]."""
    if not raw:
        return []
    if isinstance(raw, (list, tuple)) and len(raw) == 4 and all(isinstance(x, (int, float)) for x in raw):
        return [[float(x) for x in raw]]
    result = []
    if isinstance(raw, (list, tuple)):
        for item in raw:
            result.extend(_flatten_boxes(item))
    elif isinstance(raw, dict):
        if all(k in raw for k in ("ymin", "xmin", "ymax", "xmax")):
            result.append([float(raw["ymin"]), float(raw["xmin"]), float(raw["ymax"]), float(raw["xmax"])])
        elif "box_2d" in raw:
            result.extend(_flatten_boxes(raw["box_2d"]))
        elif "box" in raw:
            result.extend(_flatten_boxes(raw["box"]))
    return result


def detect_and_crop_product(imagem_bytes: bytes, margem_pct: float = 0.06) -> tuple[bytes, int, list[str]]:
    """
    Localiza o produto ou conjunto de produtos, recorta a área de interesse
    e retorna uma tupla (bytes_recortados, quantidade_detectada, produtos_identificados).
    """
    try:
        pil_original = Image.open(io.BytesIO(imagem_bytes)).convert("RGB")

        # 1. Tenta com response_schema para formato estrito
        resultado = None
        try:
            response = client.models.generate_content(
                model=DETECTION_MODEL,
                contents=[PROMPT_DETECCAO, pil_original],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DetectedProductResponse,
                ),
            )
            if response.text and response.text.strip():
                resultado = json.loads(response.text.strip())
        except Exception as schema_err:
            print(f"[product_detection] Aviso: geração com schema falhou ({schema_err}). Usando JSON livre...")

        # 2. Se não obteve resultado, tenta modo JSON flexível
        if not resultado:
            response = client.models.generate_content(
                model=DETECTION_MODEL,
                contents=[PROMPT_DETECCAO, pil_original],
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            resultado = json.loads(response.text.strip())

        # 3. Normaliza a resposta (seja dict ou lista de objetos)
        if isinstance(resultado, list):
            raw_boxes = []
            produtos_raw = []
            for item in resultado:
                if isinstance(item, dict):
                    raw_boxes.append(item.get("box_2d") or item.get("box"))
                    p = item.get("produtos_identificados") or item.get("label") or item.get("marca")
                    if isinstance(p, list):
                        produtos_raw.extend(p)
                    elif p:
                        produtos_raw.append(p)
                else:
                    raw_boxes.append(item)
            quantidade = max(len(resultado), len(produtos_raw), 1)
        elif isinstance(resultado, dict):
            raw_boxes = resultado.get("box_2d") or resultado.get("boxes_2d") or resultado.get("box") or [0, 0, 1000, 1000]
            try:
                quantidade = int(resultado.get("quantidade", 1) or 1)
            except (ValueError, TypeError):
                quantidade = 1
            produtos_raw = resultado.get("produtos_identificados") or resultado.get("marcas") or resultado.get("produtos") or []
        else:
            raw_boxes = [0, 0, 1000, 1000]
            quantidade = 1
            produtos_raw = []

        boxes = _flatten_boxes(raw_boxes)
        if boxes:
            ymin = max(0.0, min(b[0] for b in boxes))
            xmin = max(0.0, min(b[1] for b in boxes))
            ymax = min(1000.0, max(b[2] for b in boxes))
            xmax = min(1000.0, max(b[3] for b in boxes))
            if len(boxes) > quantidade:
                quantidade = len(boxes)
        else:
            ymin, xmin, ymax, xmax = 0.0, 0.0, 1000.0, 1000.0

        if isinstance(produtos_raw, str):
            produtos_raw = [produtos_raw]
        elif not isinstance(produtos_raw, list):
            produtos_raw = []

        cleaned_prods = []
        for p in produtos_raw:
            if isinstance(p, dict):
                val = p.get("nome") or p.get("rotulo") or p.get("label") or p.get("marca") or str(p)
                cleaned_prods.append(str(val).strip())
            elif p:
                cleaned_prods.append(str(p).strip())

        produtos = [p for p in cleaned_prods if p and len(p) > 1]
        if len(produtos) > quantidade:
            quantidade = len(produtos)

        print(f"[product_detection] Sucesso: {quantidade} produto(s) | Box: [{ymin:.0f}, {xmin:.0f}, {ymax:.0f}, {xmax:.0f}] | Marcas: {produtos}")

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

        if right - left < 20 or bottom - top < 20:
            recorte = pil_original
        else:
            recorte = pil_original.crop((left, top, right, bottom))

        buffer = io.BytesIO()
        recorte.save(buffer, format="JPEG", quality=95)
        return buffer.getvalue(), max(1, quantidade), produtos

    except Exception as erro:
        print(f"[product_detection] Falha ao recortar produto, usando imagem original: {erro}")
        return imagem_bytes, 1, []


def crop_to_single_product(imagem_bytes: bytes, margem_pct: float = 0.06) -> bytes:
    """Função utilitária legada: retorna apenas os bytes recortados."""
    recorte, _, _ = detect_and_crop_product(imagem_bytes, margem_pct)
    return recorte