from typing import Optional
from datetime import date as dt

from sqlalchemy import Date
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy import ForeignKey
from sqlalchemy.orm import mapped_column


# modelo base para o database
class Base(DeclarativeBase):
    pass


# modelo da tabela de oportunidades
class Opportunity(Base):

    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[Optional[str]]
    date: Mapped[dt] = mapped_column(Date)

# modelo da tabela de campanhas antigas
class Campaign(Base):

    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    campaign: Mapped[str]
    description: Mapped[Optional[str]]
    date: Mapped[dt] = mapped_column(Date)
    id_opportunity: Mapped[int] = mapped_column(ForeignKey("opportunities.id"))