from repositories.opportunities_repository import OpportunityRepository
from sqlalchemy.orm import Session
from schemas.schemas import OpportunityResponse

from services.get_score import get_score


class UpdateScoreService():
    def __init__(self):
        self.repository: OpportunityRepository = OpportunityRepository()

    def update_scores(self, db: Session):

        opportunities = self.repository.get_all(db)

        opportunities_response = [
            OpportunityResponse.model_validate(
                opportunity
            )
            for opportunity in opportunities
        ]

        gemini_response = get_score(opportunities_response)
        for result in gemini_response.scores:

            self.repository.update_score(
                db=db,
                opportunity_id=result.id,
                score=result.score
            )

        db.commit()

if __name__ == "__main__":
    update = UpdateScoreService()