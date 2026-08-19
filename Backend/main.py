from contextlib import asynccontextmanager
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware

from src.router.database_router import router as db_router
from src.router.ai_router import router as ai_router
from src.router.upload_router import router as upload_router
from src.ServerMeta.main import router as meta_router
from src.router.climate_data_router import router as climate_router
from src.services.scheduler_service import start_scheduler, stop_scheduler, check_and_send_opportunity_alerts
from src.services.email_service import send_opportunity_alert
from src.services.gemini_service import generate_opportunity_prompt


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Inicializa o agendador diário (às 10h da manhã)
    start_scheduler()
    yield
    # Shutdown: Finaliza o agendador
    stop_scheduler()


app = FastAPI(title="API Principal com Banco e Meta", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(db_router)
app.include_router(ai_router)
app.include_router(upload_router)
app.include_router(meta_router)
app.include_router(climate_router)


@app.get("/")
def home():
    return {"status": "ok", "scheduler": "active"}


@app.post("/api/test-email-alert")
def test_email_alert(
    title: str = Body(default="Dia dos Namorados"),
    days_remaining: int = Body(default=7),
    recipient_email: str | None = Body(default=None),
):
    """Endpoint de teste manual para disparar um e-mail via Resend imediatamente."""
    description = "Campanha promocional especial de Dia dos Namorados com desconto exclusivo."
    prompt_sug = generate_opportunity_prompt(title, description)
    res = send_opportunity_alert(
        opportunity_title=title,
        opportunity_date="12/06/2026",
        opportunity_description=description,
        days_remaining=days_remaining,
        recipient_email=recipient_email,
        image_prompt_suggestion=prompt_sug,
    )
    return res


@app.post("/api/run-scheduler-check")
def run_scheduler_check():
    """Força a execução da verificação diária de oportunidades (10h da manhã) imediatamente."""
    results = check_and_send_opportunity_alerts()
    return {"status": "executed", "alerts_processed": results}


