from typing import Optional
from datetime import date as dt

from sqlalchemy import Date, BigInteger, Numeric
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
    

# modelo da tabela de campanhas antigas
class Campaign(Base):

    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str]
    campaign: Mapped[str]
    description: Mapped[Optional[str]]
    date: Mapped[dt] = mapped_column(Date)
    opportunity: Mapped[str]
    id_PostInstagram: Mapped[Optional[int]] = mapped_column("id_PostInstagram", BigInteger, unique=True, nullable=True)

    
    original_image_url: Mapped[Optional[str]]
    fidelity_score: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)
    approved: Mapped[bool] = mapped_column(default=False)
    generation_attempts: Mapped[Optional[list]] = mapped_column(JSONB, default=list)