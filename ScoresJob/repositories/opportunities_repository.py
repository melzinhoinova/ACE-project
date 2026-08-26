from sqlalchemy.orm import Session
from schemas.schemas import Opportunity

class OpportunityRepository:

    def get_all(self, db: Session):
        return (
            db.query(Opportunity)
            .order_by(Opportunity.date)
            .all()
        )

    def update_score(
        self,
        db: Session,
        opportunity_id: int,
        score: str
    ):

        opportunity = db.get(
            Opportunity,
            opportunity_id
        )

        if opportunity is None:
            return False

        opportunity.score = score

        return True
