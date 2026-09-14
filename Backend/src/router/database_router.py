from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from src.dependencies.api_dependency import get_db, get_current_user, require_admin, AuthenticatedUser

from src.repositories.opportunity_repository import OpportunityRepository
from src.repositories.campaign_repository import CampaignRepository

from src.models.api_models import (
    OpportunityCreate, OpportunityUpdate, OpportunityResponse,
    CampaignCreate, CampaignDbResponse, InviteRequest
)
from src.services.email_service import send_invite_email
from src.services.auth_admin_service import delete_supabase_user, list_active_users


router: APIRouter = APIRouter()

repository: OpportunityRepository = OpportunityRepository()
campaign_repo: CampaignRepository = CampaignRepository()

@router.get("/api/oportunidades", response_model=list[OpportunityResponse])
def get_opportunities(
    all: bool = False, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if all:
        return repository.get_all(db)
    return repository.get_current_month_opportunities(db)

@router.get("/api/oportunidades/{opportunity_id}", response_model=OpportunityResponse)
def get_opportunity(
    opportunity_id: int, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    opportunity = repository.get_by_id(db, opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
    return opportunity

@router.post("/api/oportunidades", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    data: OpportunityCreate, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return repository.create(db, data)

@router.put("/api/oportunidades/{opportunity_id}", response_model=OpportunityResponse)
def update_opportunity(
    opportunity_id: int, 
    data: OpportunityUpdate, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    updated = repository.update(db, opportunity_id, data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
    return updated

@router.delete("/api/oportunidades/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: int, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    deleted = repository.delete(db, opportunity_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
    return None

# --- ROTAS DE CAMPANHAS ---

@router.get("/api/campanhas", response_model=list[CampaignDbResponse])
def get_campaigns(
    opportunity: Optional[str] = None, 
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if opportunity:
        return campaign_repo.get_by_opportunity(db, opportunity)
    return campaign_repo.get_all(db, limit=limit)

@router.post("/api/campanhas", response_model=CampaignDbResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreate, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return campaign_repo.create(db, data)

@router.delete("/api/campanhas/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: int, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    deleted = campaign_repo.delete(db, campaign_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha não encontrada")
    return None

# --- ROTA DE ENVIOS DE CONVITE B2B (EXCLUSIVO ADMIN) ---

@router.post("/api/invite-user")
def invite_user(
    data: InviteRequest,
    current_user: AuthenticatedUser = Depends(require_admin)
):
    result = send_invite_email(
        recipient_email=data.email,
        company_name=data.company_name,
        role=data.role or "Brand Manager",
        invite_url=data.invite_url,
    )
    return {"success": result.get("status") == "success", "result": result}


# --- ROTAS DE GESTÃO DE USUÁRIOS (ADMIN) ---

@router.get("/api/admin/users")
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(require_admin)
):
    """Retorna a lista de usuários ativos cadastrados no Supabase (exclusivo para Administradores)."""
    try:
        return list_active_users(db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/api/admin/users/{user_id}")
def delete_admin_user(
    user_id: str, 
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(require_admin)
):
    """Exclui um usuário completamente do auth.users e perfis no Supabase (exclusivo para Administradores)."""
    try:
        return delete_supabase_user(user_id, db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



