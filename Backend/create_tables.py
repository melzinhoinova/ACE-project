from src.models.database_models import Base
from src.database.connection import engine

Base.metadata.create_all(bind=engine)