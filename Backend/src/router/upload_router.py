import base64
import os
import traceback
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

router = APIRouter()

class UploadImageRequest(BaseModel):
    image_base64: str  # Pode ser data URL (com prefixo) ou base64 puro

@router.post("/api/upload-imagem")
def upload_imagem(payload: UploadImageRequest):
    """
    Recebe uma imagem em base64 (data URL ou base64 puro),
    faz upload para o Cloudinary e retorna a URL pública permanente.
    """
    try:
        b64 = payload.image_base64
        
        # Se for uma URL direta (HTTP/HTTPS), passa diretamente para o Cloudinary baixar e hospedar de forma estável
        if b64.startswith("http://") or b64.startswith("https://"):
            file_to_upload = b64
            print(f"Iniciando upload de URL para Cloudinary: {b64[:100]}...")
        else:
            if "," in b64:
                b64 = b64.split(",")[1]
            file_to_upload = f"data:image/png;base64,{b64}"
            print(f"Iniciando upload de Base64 para Cloudinary. Tamanho: {len(b64)} chars")

        result = cloudinary.uploader.upload(
            file_to_upload,
            folder="ace_campanhas",
            resource_type="image",
        )

        url = result.get("secure_url")
        public_id = result.get("public_id")
        print(f"Upload Cloudinary OK! URL: {url} | public_id: {public_id}")

        return {"url": url, "public_id": public_id}

    except Exception as e:
        print(f"\n=== ERRO no upload Cloudinary ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Falha no upload para Cloudinary: {str(e)}")
