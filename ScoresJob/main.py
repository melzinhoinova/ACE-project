from services.get_opportunities import get_opportunities
from services.get_score import get_score
from services.update_score import update_scores

from database.connection import SessionLocal

def main() -> None:
    db = SessionLocal()

    try:
        opportunities = get_opportunities(db=db)
        scores = get_score(opportunities=opportunities)
        update_scores(db=db, gemini_response=scores)

    except:
        db.rollback()

        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()