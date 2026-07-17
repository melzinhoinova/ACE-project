from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from src.services.gemini_connection_service import connect_gemini

router = APIRouter()

@router.post("/api/campanha")
async def gerar_campanha(
    nicho: str = Form(...),
    objetivo: str = Form(...),
    imagem: UploadFile | None = File(default=None)
):
    
    try:
        image_bytes: bytes | None = None
        if imagem is not None:
            image_bytes = await imagem.read()

        return connect_gemini(nicho, objetivo, image_bytes)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   