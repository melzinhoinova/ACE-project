"""
src/services/storage_service.py

Gerencia o armazenamento de arquivos no bucket Supabase Storage 'campaign-references'
e ativos de marca (master product image).
"""

import os
import mimetypes
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET_NAME = "campaign-references"


import unicodedata
import re

def sanitize_storage_key(path: str) -> str:
    """Remove acentos e caracteres inválidos para chaves do Supabase Storage mantendo pastas."""
    parts = path.replace("\\", "/").split("/")
    clean_parts = []
    for part in parts:
        # Remove acentos
        nfkd = unicodedata.normalize("NFKD", part)
        ascii_text = nfkd.encode("ASCII", "ignore").decode("ASCII")
        # Substitui espaços e caracteres especiais por underline
        clean = re.sub(r"[^a-zA-Z0-9._-]", "_", ascii_text)
        # Evita múltiplos underlines
        clean = re.sub(r"_+", "_", clean).strip("_")
        clean_parts.append(clean)
    return "/".join(clean_parts)


def upload_reference_image(file_bytes: bytes, filename: str, content_type: Optional[str] = None) -> str:
    """
    Faz upload de um arquivo para o bucket Supabase Storage 'campaign-references'
    e retorna sua URL pública acessível.
    """
    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = "image/jpeg"

    safe_filename = sanitize_storage_key(filename)

    endpoint = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{safe_filename}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apiKey": SUPABASE_KEY,
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    response = requests.post(endpoint, headers=headers, data=file_bytes)
    if response.status_code not in (200, 201):
        # Tenta PUT se já existir
        put_response = requests.put(endpoint, headers=headers, data=file_bytes)
        if put_response.status_code not in (200, 201):
            raise RuntimeError(f"Falha ao enviar arquivo para o Supabase Storage: {response.status_code} - {response.text}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{safe_filename}"
    return public_url


def delete_reference_image(filename: str) -> bool:
    """
    Remove um arquivo do bucket Supabase Storage.
    """
    safe_filename = sanitize_storage_key(filename)
    endpoint = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{safe_filename}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apiKey": SUPABASE_KEY,
    }
    response = requests.delete(endpoint, headers=headers)
    return response.status_code in (200, 204)
