from datetime import date, datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.dependencies.api_dependency import SessionLocal
from src.models.database_models import Opportunity, Campaign
from src.services.email_service import send_opportunity_alert, send_manual_approval_alert
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


def process_scheduled_campaigns():
    """
    Worker periódico executado a cada 1 minuto pelo APScheduler.
    Busca campanhas com status 'SCHEDULED' cujo scheduled_at <= NOW (UTC).
    - Se publish_mode == 'MANUAL': altera para 'PENDING_APPROVAL' e envia e-mail ao gestor.
    - Se publish_mode == 'AUTONOMOUS':
        1. Altera para 'PROCESSING' (trava otimista / idempotência).
        2. Dispara a publicação na Meta via publish_to_instagram_core.
        3. Se sucesso: altera status para 'PUBLISHED' e salva o post_id retornado.
        4. Se falha: altera status para 'FAILED' e salva a mensagem de erro em error_log.
    """
    now_utc = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        due_campaigns = (
            db.query(Campaign)
            .filter(
                Campaign.status == "SCHEDULED",
                Campaign.scheduled_at != None,
                Campaign.scheduled_at <= now_utc,
            )
            .all()
        )

        if not due_campaigns:
            return []

        print(f"\n[Scheduler Queue] Encontradas {len(due_campaigns)} campanha(s) pronta(s) para processamento.")

        processed = []
        for campaign in due_campaigns:
            print(f"[Scheduler Queue] Processando campanha ID={campaign.id}, Título='{campaign.title}', Modo={campaign.publish_mode}")
            
            if campaign.publish_mode == "MANUAL":
                campaign.status = "PENDING_APPROVAL"
                db.commit()
                date_str = campaign.date.strftime("%d/%m/%Y") if hasattr(campaign.date, "strftime") else str(campaign.date)
                send_manual_approval_alert(
                    campaign_title=campaign.title,
                    campaign_date=date_str,
                    campaign_id=campaign.id,
                )
                print(f"[Scheduler Queue] Campanha ID={campaign.id} atualizada para PENDING_APPROVAL (alerta enviado).")
                processed.append({"id": campaign.id, "status": "PENDING_APPROVAL"})
                continue

            # Modo AUTONOMOUS: Trava otimista para PROCESSING
            campaign.status = "PROCESSING"
            db.commit()

            # Extração da URL da imagem
            image_url = campaign.description or ""
            if "http" in image_url:
                image_url = image_url[image_url.index("http"):].strip()

            caption = campaign.campaign or ""

            try:
                from src.ServerMeta.main import publish_to_instagram_core
                res = publish_to_instagram_core(image_url=image_url, caption=caption)
                post_id = str(res.get("post_id"))

                campaign.status = "PUBLISHED"
                campaign.id_PostInstagram = post_id
                campaign.error_log = None
                db.commit()
                print(f"[Scheduler Queue] Campanha ID={campaign.id} publicada com SUCESSO! Post ID={post_id}")
                processed.append({"id": campaign.id, "status": "PUBLISHED", "post_id": post_id})
            except Exception as err:
                error_msg = str(err)
                print(f"[Scheduler Queue] ERRO ao publicar campanha ID={campaign.id}: {error_msg}")
                campaign.status = "FAILED"
                campaign.error_log = error_msg
                db.commit()
                processed.append({"id": campaign.id, "status": "FAILED", "error": error_msg})

        return processed
    except Exception as e:
        print(f"[Scheduler Queue] Erro geral no loop de processamento: {e}")
        return []
    finally:
        db.close()


def start_scheduler():
    """Inicializa o agendador com job diário de alertas e job a cada minuto para publicações."""
    scheduler.add_job(
        check_and_send_opportunity_alerts,
        trigger=CronTrigger(hour=10, minute=0),
        id="daily_opportunity_email_job",
        replace_existing=True,
    )
    scheduler.add_job(
        process_scheduled_campaigns,
        trigger="interval",
        minutes=1,
        id="process_scheduled_campaigns_job",
        replace_existing=True,
    )
    if not scheduler.running:
        scheduler.start()
        print("[Scheduler] APScheduler iniciado com sucesso! (Job diário às 10:00 AM e Fila a cada 1 min)")


def stop_scheduler():
    """Finaliza o agendador ao encerrar a aplicação."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Scheduler] APScheduler encerrado.")
