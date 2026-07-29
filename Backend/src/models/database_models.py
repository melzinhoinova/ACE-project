from typing import Optional
from datetime import date as dt

from sqlalchemy import Date, BigInteger
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
