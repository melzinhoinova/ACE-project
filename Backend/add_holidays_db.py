from src.database.connection import SessionLocal
from src.models.database_models import Opportunity

from datetime import date, datetime

from sqlalchemy.orm import Session

import requests
BASE_URL = "https://date.nager.at/api/v3"

db = SessionLocal()


def get_holidays(year: int, country: str = "BR") -> list[dict]:

    response = requests.get(
        f"{BASE_URL}/PublicHolidays/{year}/{country}"
    )

    response.raise_for_status()

    return response.json()

def create_opportunity(
    db: Session,
    title: str,
    description: str,
    event_date: date
):

    opportunity = Opportunity(
        title=title,
        description=description,
        date=event_date
    )

    db.add(opportunity)


holidays = get_holidays(2026)

for holiday in holidays:

    existing = (
        db.query(Opportunity)
        .filter(
            Opportunity.title == holiday["localName"],
        )
        .first()
    )

    if existing:
        continue

    create_opportunity(
        db=db,
        title=holiday["localName"],
        description=holiday["name"],
        event_date=datetime.strptime(
            holiday["date"],
            "%Y-%m-%d"
        ).date()
    )

db.commit()
db.close()