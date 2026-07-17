from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.router.database_router import router as db_router
from src.router.ai_router import router as ai_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok"}

app.include_router(db_router)
app.include_router(ai_router)