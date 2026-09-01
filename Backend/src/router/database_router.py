from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from src.dependencies.api_dependency import get_db

from src.repositories.opportunity_repository import OpportunityRepository
from src.repositories.campaign_repository import CampaignRepository

from src.models.api_models import (
    OpportunityCreate, OpportunityUpdate, OpportunityResponse,
    CampaignCreate, CampaignDbResponse, InviteRequest
)
from src.services.email_service import send_invite_email


router: APIRouter = APIRouter()

repository: OpportunityRepository = OpportunityRepository()
campaign_repo: CampaignRepository = CampaignRepository()

@router.get("/api/oportunidades", response_model=list[OpportunityResponse])
async def get_opportunities(all: bool = False, db: Session = Depends(get_db)):
    if all:
        return repository.get_all(db)
    return repository.get_current_month_opportunities(db)

@router.get("/api/oportunidades/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opportunity = repository.get_by_id(db, opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
    return opportunity

@router.post("/api/oportunidades", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(data: OpportunityCreate, db: Session = Depends(get_db)):
    return repository.create(db, data)

@router.put("/api/oportunidades/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(opportunity_id: int, data: OpportunityUpdate, db: Session = Depends(get_db)):
    updated = repository.update(db, opportunity_id, data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
    return updated

@router.delete("/api/oportunidades/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    deleted = repository.delete(db, opportunity_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidade não encontrada")
    return None

# --- ROTAS DE CAMPANHAS ---

@router.get("/api/campanhas", response_model=list[CampaignDbResponse])
async def get_campaigns(opportunity: Optional[str] = None, db: Session = Depends(get_db)):
    if opportunity:
        return campaign_repo.get_by_opportunity(db, opportunity)
    return campaign_repo.get_all(db)

@router.post("/api/campanhas", response_model=CampaignDbResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(data: CampaignCreate, db: Session = Depends(get_db)):
    return campaign_repo.create(db, data)

@router.delete("/api/campanhas/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    deleted = campaign_repo.delete(db, campaign_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha não encontrada")
    return None

# --- ROTA DE ENVIOS DE CONVITE B2B ---

@router.post("/api/invite-user")
async def invite_user(data: InviteRequest):
    result = send_invite_email(
        recipient_email=data.email,
        company_name=data.company_name,
        role=data.role or "Brand Manager",
        invite_url=data.invite_url,
    )
    return {"success": result.get("status") == "success", "result": result}


# --- ROTAS DE GESTÃO DE USUÁRIOS (ADMIN) ---

from src.services.auth_admin_service import delete_supabase_user, list_active_users

@router.get("/api/admin/users")
async def get_admin_users(db: Session = Depends(get_db)):
    """Retorna a lista de usuários ativos cadastrados no Supabase."""
    try:
        return list_active_users(db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/api/admin/users/{user_id}")
async def delete_admin_user(user_id: str, db: Session = Depends(get_db)):
    """Exclui um usuário completamente do auth.users e perfis no Supabase."""
    try:
        return delete_supabase_user(user_id, db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


