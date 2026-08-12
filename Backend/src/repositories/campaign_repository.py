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

    def get_by_opportunity(self, db: Session, opportunity: str):
        return (
            db.query(Campaign)
            .filter(Campaign.opportunity == opportunity)
            .order_by(Campaign.date.desc())
            .all()
        )

    def create(self, db: Session, data: CampaignCreate) -> Campaign:
        campaign = Campaign(
            title=data.title,
            campaign=data.campaign,
            description=data.description,
            date=data.date,
            opportunity=data.opportunity,
            id_PostInstagram=int(data.id_PostInstagram) if data.id_PostInstagram else None,
            original_image_url=data.original_image_url,
            fidelity_score=data.fidelity_score,
            approved=data.approved,
            generation_attempts=data.generation_attempts or [],
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

    # ------------------------------------------------------------------ #
    # NOVOS — úteis se você quiser reprocessar/reaprovar uma campanha
    # que já existe no banco (ex: gerar uma nova imagem pra campanha antiga)
    # ------------------------------------------------------------------ #

    def registrar_tentativa(
        self,
        db: Session,
        campaign_id: int,
        tentativa: int,
        url: str,
        score: float,
        motivo: str,
    ) -> Optional[Campaign]:
        campaign = self.get_by_id(db, campaign_id)
        if not campaign:
            return None

        historico = list(campaign.generation_attempts or [])
        historico.append({
            "tentativa": tentativa,
            "url": url,
            "score": score,
            "motivo": motivo,
        })
        campaign.generation_attempts = historico
        db.commit()
        db.refresh(campaign)
        return campaign

    def finalizar_campanha(
        self,
        db: Session,
        campaign_id: int,
        description_url: str,
        fidelity_score: float,
        approved: bool,
    ) -> Optional[Campaign]:
        campaign = self.get_by_id(db, campaign_id)
        if not campaign:
            return None

        campaign.description = description_url
        campaign.fidelity_score = fidelity_score
        campaign.approved = approved
        db.commit()
        db.refresh(campaign)
        return campaign