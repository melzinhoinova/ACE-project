from typing import Literal
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as dt

from sqlalchemy import Date, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class OpportunityScoreItem(BaseModel):
    id: int = Field(
        description="ID da oportunidade correspondente"
    )

    score: Literal["high", "medium", "low"] = Field(
        description="Classificação da oportunidade"
    )

class GeminiScoreResponse(BaseModel):
    scores: list[OpportunityScoreItem]

class OpportunityResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    date: dt
    escopo: Optional[str] = "nacional"
    local: Optional[str] = None

    model_config = {
        "from_attributes": True
    }



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
    score: Mapped[Optional[str]] = mapped_column(
        String,
        nullable=True
    )