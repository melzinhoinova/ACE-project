import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.orm import Session

from src.dependencies.api_dependency import get_db, get_current_user, require_admin, AuthenticatedUser
from src.repositories.reference_repository import ReferenceRepository
from src.models.api_models import CampaignReferenceResponse, CampaignReferenceCreate, CampaignReferenceUpdate
from src.services.storage_service import upload_reference_image, delete_reference_image

router: APIRouter = APIRouter()
repository: ReferenceRepository = ReferenceRepository()


@router.get("/api/referencias", response_model=list[CampaignReferenceResponse])
def list_references(
    all: bool = False,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Retorna a lista de referências visuais de campanhas.
    Por padrão retorna apenas as ativas. Se all=True, retorna todas.
    """
    return repository.get_all(db, active_only=(not all))


@router.get("/api/referencias/{ref_id}", response_model=CampaignReferenceResponse)
def get_reference_by_id(
    ref_id: int,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ref = repository.get_by_id(db, ref_id)
    if not ref:
        raise HTTPException(status_code=404, detail="Referência não encontrada.")
    return ref


@router.post("/api/referencias", response_model=CampaignReferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_reference(
    title: str = Form(...),
    category: Optional[str] = Form(None),
    prompt_recipe: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    admin_user: AuthenticatedUser = Depends(require_admin),
):
    """
    Cria uma nova referência de estilo (exclusivo para Administrador).
    Aceita upload de arquivo de imagem ou uma URL direta.
    """
    final_image_url = image_url

    if file and file.filename:
        file_bytes = await file.read()
        if len(file_bytes) > 0:
            final_image_url = upload_reference_image(
                file_bytes=file_bytes,
                filename=f"styles/{file.filename}",
                content_type=file.content_type,
            )

    if not final_image_url:
        raise HTTPException(
            status_code=400,
            detail="É obrigatório fornecer um arquivo de imagem ou uma URL de imagem válida."
        )

    data = CampaignReferenceCreate(
        title=title,
        image_url=final_image_url,
        category=category,
        prompt_recipe=prompt_recipe,
        is_active=True,
    )
    return repository.create(db, data)


@router.patch("/api/referencias/{ref_id}", response_model=CampaignReferenceResponse)
def update_reference(
    ref_id: int,
    update_data: CampaignReferenceUpdate,
    db: Session = Depends(get_db),
    admin_user: AuthenticatedUser = Depends(require_admin),
):
    """
    Atualiza título, categoria, prompt_recipe ou status ativo/inativo da referência.
    """
    updated = repository.update(db, ref_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Referência não encontrada.")
    return updated


@router.delete("/api/referencias/{ref_id}")
def delete_reference(
    ref_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthenticatedUser = Depends(require_admin),
):
    """
    Exclui uma referência do catálogo (exclusivo para Administrador).
    """
    ref = repository.get_by_id(db, ref_id)
    if not ref:
        raise HTTPException(status_code=404, detail="Referência não encontrada.")

    # Se for uma imagem armazenada no bucket campaign-references, tenta limpar
    if "campaign-references" in ref.image_url:
        try:
            filename = ref.image_url.split("campaign-references/")[-1]
            delete_reference_image(filename)
        except Exception as e:
            print(f"[WARN] Erro ao deletar imagem do storage: {e}")

    success = repository.delete(db, ref_id)
    if not success:
        raise HTTPException(status_code=500, detail="Erro ao excluir referência.")
    return {"message": "Referência excluída com sucesso", "id": ref_id}


@router.post("/api/admin/sync-references")
def sync_references(
    admin_user: AuthenticatedUser = Depends(require_admin),
):
    """
    Sincroniza e atualiza o catálogo curado de referências no Supabase Storage e Banco (exclusivo Administrador).
    """
    try:
        from seed_hybrid_references import sync_hybrid_catalog
        summary = sync_hybrid_catalog()
        return {
            "message": "Catálogo de referências sincronizado com sucesso!",
            "details": summary,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao sincronizar catálogo: {str(e)}")
