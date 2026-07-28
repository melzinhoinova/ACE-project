from typing import Optional
from sqlalchemy.orm import Session
from src.models.database_models import Campaign
from src.models.api_models import CampaignCreate

class CampaignRepository:

    def get_all(self, db: Session):
        return (
            db.query(Campaign)
            .order_by(Campaign.date.desc())
            .all()
        )

    def get_by_id(self, db: Session, campaign_id: int) -> Optional[Campaign]:
        return db.query(Campaign).filter(Campaign.id == campaign_id).first()

    def get_by_opportunity(self, db: Session, opportunity_id: int):
        return (
            db.query(Campaign)
            .filter(Campaign.id_opportunity == opportunity_id)
            .order_by(Campaign.date.desc())
            .all()
        )

    def create(self, db: Session, data: CampaignCreate) -> Campaign:
        campaign = Campaign(
            title=data.title,
            campaign=data.campaign,
            description=data.description,
            date=data.date,
            id_opportunity=data.id_opportunity,
            id_PostInstagram=data.id_PostInstagram,
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign

    def delete(self, db: Session, campaign_id: int) -> bool:
        campaign = self.get_by_id(db, campaign_id)
        if not campaign:
            return False

        db.delete(campaign)
        db.commit()
        return True
