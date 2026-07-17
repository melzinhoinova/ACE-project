from sqlalchemy.orm import Session
from src.models.database_models import Opportunity

class OpportunityRepository:

    def get_all(self, db: Session):

        return (
            db.query(Opportunity)
            .order_by(Opportunity.date)
            .all()
        )