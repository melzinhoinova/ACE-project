from services.update_score_service import UpdateScoreService

from database.connection import SessionLocal

def main() -> None:
    db = SessionLocal()

    try:
        update_score = UpdateScoreService()
        update_score.update_scores(db=db)

    except:
        db.rollback()

        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()