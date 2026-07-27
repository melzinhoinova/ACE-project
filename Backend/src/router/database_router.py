from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from src.dependencies.api_dependency import get_db
from src.repositories.opportunity_repository import OpportunityRepository
from src.models.api_models import OpportunityResponse

router: APIRouter = APIRouter()

repository: OpportunityRepository = OpportunityRepository()

@router.get("/api/oportunidades", response_model=list[OpportunityResponse])
async def get_opportunities(db: Session = Depends(get_db)):
    return repository.get_current_month_opportunities(db)