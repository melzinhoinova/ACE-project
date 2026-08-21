from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from src.models.database_models import Opportunity
from src.models.api_models import OpportunityCreate, OpportunityUpdate

class OpportunityRepository:

    def get_all(self, db: Session):
        return (
            db.query(Opportunity)
            .order_by(Opportunity.date)
            .all()
        )

    def get_by_id(self, db: Session, opportunity_id: int) -> Optional[Opportunity]:
        return db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()

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

    def create(self, db: Session, data: OpportunityCreate) -> Opportunity:
        opportunity = Opportunity(
            title=data.title,
            description=data.description if data.description is not None else "",
            date=data.date,
            escopo=data.escopo if data.escopo is not None else "nacional",
            local=data.local,
        )
        db.add(opportunity)
        db.commit()
        db.refresh(opportunity)
        return opportunity

    def update(self, db: Session, opportunity_id: int, data: OpportunityUpdate) -> Optional[Opportunity]:
        opportunity = self.get_by_id(db, opportunity_id)
        if not opportunity:
            return None

        update_data = data.model_dump(exclude_unset=True)
        if "description" in update_data and update_data["description"] is None:
            update_data["description"] = ""

        for key, value in update_data.items():
            setattr(opportunity, key, value)

        db.commit()
        db.refresh(opportunity)
        return opportunity

    def delete(self, db: Session, opportunity_id: int) -> bool:
        opportunity = self.get_by_id(db, opportunity_id)
        if not opportunity:
            return False

        db.delete(opportunity)
        db.commit()
        return True
