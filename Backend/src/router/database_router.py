from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from pydantic import BaseModel

from src.repositories.opportunity_repository import OpportunityRepository
from src.dependencies.api_dependency import get_db

from src.models.api_models import OpportunityResponse

router = APIRouter()

repository = OpportunityRepository()

@router.get("/api/oportunidades", response_model=list[OpportunityResponse])
async def get_opportunities(db: Session = Depends(get_db)):
    return repository.get_all(db)