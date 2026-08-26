from repositories.opportunities_repository import OpportunityRepository
from sqlalchemy.orm import Session
from schemas.schemas import OpportunityResponse


def get_opportunities(db: Session) -> list[OpportunityResponse]:
    repository = OpportunityRepository()

    opportunities = repository.get_all(db)

    return [
        OpportunityResponse.model_validate(opportunity)
        for opportunity in opportunities
    ]

if __name__ == "__main__":
    get_opportunities()