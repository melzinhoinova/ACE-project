from datetime import date, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.dependencies.api_dependency import SessionLocal
from src.models.database_models import Opportunity
from src.services.email_service import send_opportunity_alert
from src.services.gemini_service import generate_opportunity_prompt

scheduler = AsyncIOScheduler()


def check_and_send_opportunity_alerts():
    """
    Função executada diariamente pelo scheduler (às 10:00 da manhã).
    Verifica oportunidades com data em hoje + 7 dias (1 semana) ou hoje + 1 dia (amanhã)
    e dispara e-mails de notificação via Resend com sugestões de prompt de imagem por IA.
    """
    print("\n--- [SCHEDULER 10:00 AM] Verificando oportunidades iminentes para envio de e-mail ---")
    today = date.today()
    target_7_days = today + timedelta(days=7)
    target_1_day = today + timedelta(days=1)

    db = SessionLocal()
    try:
        # Busca oportunidades em 7 dias (1 semana antes)
        opps_7_days = db.query(Opportunity).filter(Opportunity.date == target_7_days).all()
        # Busca oportunidades em 1 dia (1 dia antes)
        opps_1_day = db.query(Opportunity).filter(Opportunity.date == target_1_day).all()

        results = []

        for opp in opps_7_days:
            print(f"[Scheduler] Oportunidade em 7 dias encontrada: {opp.title} ({opp.date})")
            date_str = opp.date.strftime("%d/%m/%Y") if hasattr(opp.date, "strftime") else str(opp.date)
            # Gera sugestão de prompt com IA Gemini
            prompt_sug = generate_opportunity_prompt(opp.title, opp.description)
            res = send_opportunity_alert(
                opportunity_title=opp.title,
                opportunity_date=date_str,
                opportunity_description=opp.description,
                days_remaining=7,
                image_prompt_suggestion=prompt_sug,
            )
            results.append({"opportunity": opp.title, "days": 7, "prompt": prompt_sug, "result": res})

        for opp in opps_1_day:
            print(f"[Scheduler] Oportunidade em 1 dia encontrada: {opp.title} ({opp.date})")
            date_str = opp.date.strftime("%d/%m/%Y") if hasattr(opp.date, "strftime") else str(opp.date)
            # Gera sugestão de prompt com IA Gemini
            prompt_sug = generate_opportunity_prompt(opp.title, opp.description)
            res = send_opportunity_alert(
                opportunity_title=opp.title,
                opportunity_date=date_str,
                opportunity_description=opp.description,
                days_remaining=1,
                image_prompt_suggestion=prompt_sug,
            )
            results.append({"opportunity": opp.title, "days": 1, "prompt": prompt_sug, "result": res})

        print(f"--- [SCHEDULER] Processamento concluído. Alertas processados: {len(results)} ---\n")
        return results
    except Exception as e:
        print(f"[Scheduler] Erro ao verificar oportunidades: {e}")
        return []
    finally:
        db.close()


def start_scheduler():
    """Inicializa o agendador para rodar todos os dias às 10:00 da manhã."""
    if not scheduler.running:
        scheduler.add_job(
            check_and_send_opportunity_alerts,
            trigger=CronTrigger(hour=10, minute=0),
            id="daily_opportunity_email_job",
            replace_existing=True,
        )
        scheduler.start()
        print("[Scheduler] APScheduler iniciado com sucesso! Job diário agendado para às 10:00 AM.")


def stop_scheduler():
    """Finaliza o agendador ao encerrar a aplicação."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Scheduler] APScheduler encerrado.")
