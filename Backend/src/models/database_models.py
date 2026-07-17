from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column


# modelo base para o database
class Base(DeclarativeBase):
    pass


# modelo da tabela de oportunidades
class Opportunity(Base):

    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[str]
    date: Mapped[str]