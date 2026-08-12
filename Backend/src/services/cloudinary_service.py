"""
src/services/cloudinary_service.py

Persiste tanto a foto ORIGINAL do produto (hoje ela se perdia depois do
request) quanto cada tentativa de imagem gerada.
"""

import os
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


def upload_original_product_image(imagem_bytes: bytes, identificador: str) -> str:
    resultado = cloudinary.uploader.upload(
        imagem_bytes,
        folder="ace_campanhas/originais",
        public_id=f"{identificador}_original",
        overwrite=True,
    )
    return resultado["secure_url"]


def upload_generated_image(imagem_bytes: bytes, identificador: str, tentativa: int) -> str:
    resultado = cloudinary.uploader.upload(
        imagem_bytes,
        folder="ace_campanhas",
        public_id=f"{identificador}_tentativa_{tentativa}",
        overwrite=True,
    )
    return resultado["secure_url"]