from repositories.opportunities_repository import OpportunityRepository
from schemas.schemas import GeminiScoreResponse
from sqlalchemy.orm import Session

def update_scores(
    db: Session,
    gemini_response: GeminiScoreResponse
):

    repository = OpportunityRepository()


    for result in gemini_response.scores:

        repository.update_score(
            db=db,
            opportunity_id=result.id,
            score=result.score
        )

    db.commit()