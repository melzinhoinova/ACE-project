from datetime import date
from sqlalchemy.orm import Session
from src.models.database_models import Opportunity

class OpportunityRepository:

    def get_all(self, db: Session):

        return (
            db.query(Opportunity)
            .order_by(Opportunity.date)
            .all()
        )

    def get_current_month_opportunities(self, db: Session):
        today = date.today()
        start_month = today.replace(day=1)

        if today.month == 12:
            start_next_month = date(today.year + 1, 1, 1)
        else:
            start_next_month = date(today.year, today.month + 1, 1)

        return (
            db.query(Opportunity)
            .filter(Opportunity.date >= start_month)
            .filter(Opportunity.date < start_next_month)
            .order_by(Opportunity.date)
            .all()
        )