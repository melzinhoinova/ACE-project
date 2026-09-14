from typing import Optional
from sqlalchemy.orm import Session
from src.models.database_models import CampaignReference
from src.models.api_models import CampaignReferenceCreate, CampaignReferenceUpdate


class ReferenceRepository:

    def get_all(self, db: Session, active_only: bool = True) -> list[CampaignReference]:
        query = db.query(CampaignReference)
        if active_only:
            query = query.filter(CampaignReference.is_active.is_(True))
        return query.order_by(CampaignReference.id.asc()).all()

    def get_by_id(self, db: Session, ref_id: int) -> Optional[CampaignReference]:
        return db.query(CampaignReference).filter(CampaignReference.id == ref_id).first()

    def create(self, db: Session, data: CampaignReferenceCreate) -> CampaignReference:
        ref = CampaignReference(
            title=data.title,
            image_url=data.image_url,
            category=data.category,
            prompt_recipe=data.prompt_recipe,
            is_active=data.is_active if data.is_active is not None else True,
        )
        db.add(ref)
        db.commit()
        db.refresh(ref)
        return ref

    def update(self, db: Session, ref_id: int, data: CampaignReferenceUpdate) -> Optional[CampaignReference]:
        ref = self.get_by_id(db, ref_id)
        if not ref:
            return None
        if data.title is not None:
            ref.title = data.title
        if data.image_url is not None:
            ref.image_url = data.image_url
        if data.category is not None:
            ref.category = data.category
        if data.prompt_recipe is not None:
            ref.prompt_recipe = data.prompt_recipe
        if data.is_active is not None:
            ref.is_active = data.is_active
        db.commit()
        db.refresh(ref)
        return ref

    def delete(self, db: Session, ref_id: int) -> bool:
        ref = self.get_by_id(db, ref_id)
        if not ref:
            return False
        db.delete(ref)
        db.commit()
        return True
