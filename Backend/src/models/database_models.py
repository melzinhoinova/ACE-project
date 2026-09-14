from typing import Optional
from datetime import date as dt, datetime

from sqlalchemy import Date, DateTime, BigInteger, Numeric, String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# modelo base para o database
class Base(DeclarativeBase):
    pass


# modelo da tabela de oportunidades
class Opportunity(Base):

    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str]
    description: Mapped[Optional[str]]
    date: Mapped[dt] = mapped_column(Date)
    escopo: Mapped[Optional[str]] = mapped_column(default="nacional")
    local: Mapped[Optional[str]]
    score: Mapped[Optional[str]]
    

# modelo da tabela de campanhas antigas
class Campaign(Base):

    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str]
    campaign: Mapped[str]
    description: Mapped[Optional[str]]
    date: Mapped[dt] = mapped_column(Date)
    opportunity: Mapped[str]
    id_PostInstagram: Mapped[Optional[str]] = mapped_column("id_PostInstagram", String(64), unique=True, nullable=True)

    status: Mapped[Optional[str]] = mapped_column(String(32), default="PUBLISHED", nullable=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    publish_mode: Mapped[Optional[str]] = mapped_column(String(32), default="AUTONOMOUS", nullable=True)
    error_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    original_image_url: Mapped[Optional[str]]
    fidelity_score: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)
    approved: Mapped[bool] = mapped_column(default=False)
    generation_attempts: Mapped[Optional[list]] = mapped_column(JSONB, default=list)


# modelo da tabela de referências de campanhas
class CampaignReference(Base):

    __tablename__ = "campaign_references"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255))
    image_url: Mapped[str] = mapped_column(String(1024))
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    prompt_recipe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)