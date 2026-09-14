"""
src/services/master_asset_service.py

Fornece o ativo master de produto (garrafa do Melzinho em alta definição)
para fallback automático quando o usuário gera uma campanha sem enviar foto.
"""

import os
import io
import requests
from PIL import Image

MASTER_STORAGE_URL = os.getenv(
    "MASTER_ASSET_URL",
    "https://ebltdbhuasnrkidinhrz.supabase.co/storage/v1/object/public/campaign-references/brand/melzinho_master.jpg"
)

LOCAL_ASSET_CANDIDATES = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "produto", "melzinho_master_studio.jpg")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "produto", "WhatsApp Image 2026-05-13 at 14.11.37 (4).jpeg")),
]

_cached_master_bytes: bytes | None = None


def get_master_product_image_bytes() -> bytes:
    """
    Retorna os bytes da foto master do Melzinho, otimizada para geração e fidelidade.
    Tenta primeiro o arquivo local do projeto; caso indisponível, busca do Supabase Storage.
    """
    global _cached_master_bytes
    if _cached_master_bytes:
        return _cached_master_bytes

    # 1. Tenta carregar do arquivo local do repositório
    for path in LOCAL_ASSET_CANDIDATES:
        if os.path.exists(path):
            try:
                with Image.open(path) as img:
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    # Redimensiona para dimensões ideais de visão / edição (max 1200px)
                    w, h = img.size
                    max_dim = 1200
                    if max(w, h) > max_dim:
                        scale = max_dim / max(w, h)
                        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG", quality=90)
                    _cached_master_bytes = buf.getvalue()
                    print(f"[Master Asset] Carregado ativo master local: {path} ({len(_cached_master_bytes)} bytes)")
                    return _cached_master_bytes
            except Exception as e:
                print(f"[Master Asset] Falha ao processar arquivo local {path}: {e}")

    # 2. Fallback: baixa da URL pública do Supabase Storage
    try:
        res = requests.get(MASTER_STORAGE_URL, timeout=10)
        if res.status_code == 200:
            _cached_master_bytes = res.content
            print(f"[Master Asset] Carregado ativo do Supabase Storage ({len(_cached_master_bytes)} bytes)")
            return _cached_master_bytes
    except Exception as e:
        print(f"[Master Asset] Falha ao baixar do Supabase Storage: {e}")

    raise RuntimeError("Não foi possível carregar o ativo master da marca Melzinho.")
