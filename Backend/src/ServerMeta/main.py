import os
import time
from datetime import datetime, timezone
from fastapi import HTTPException, APIRouter, Depends, status
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from src.dependencies.api_dependency import get_db, get_current_user, AuthenticatedUser
from src.models.api_models import CampaignScheduleRequest, CampaignDbResponse
from src.models.database_models import Campaign
from src.repositories.campaign_repository import CampaignRepository

load_dotenv()

router = APIRouter(prefix="/api/instagram", tags=["Meta Instagram"])
campaign_repo = CampaignRepository()


# Puxa os dados com segurança. Se não encontrar, assume None.
INSTAGRAM_ID = os.getenv("INSTAGRAM_ID")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
BASE_URL = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}"

if not INSTAGRAM_ID or not ACCESS_TOKEN:
    print("ERRO CRÍTICO: Variáveis de ambiente não foram carregadas corretamente do arquivo .env!")

class PostSchema(BaseModel):
    imageUrl: str
    caption: str


def publish_to_instagram_core(image_url: str, caption: str) -> dict:
    """
    Função modular de disparo para a Meta Graph API.
    Pode ser executada diretamente por rotas síncronas ou pelo worker do APScheduler.
    Retorna dicionário contendo 'post_id' e 'status'.
    Levanta exceção detalhada em caso de falha.
    """
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise ValueError("Configuração do servidor incompleta. Variáveis INSTAGRAM_ID ou ACCESS_TOKEN ausentes no .env.")

    params_container = {
        "image_url": image_url,
        "caption": caption,
        "access_token": ACCESS_TOKEN
    }
    print(f"[Meta Core] Criando container de mídia com image_url: {image_url[:80]}...")
    response_container = requests.post(f"{BASE_URL}/media", params=params_container)
    
    if not response_container.ok:
        print(f"[Meta Core] ERRO ao criar container: {response_container.status_code} - {response_container.text}")
    response_container.raise_for_status() 
    
    creation_id = response_container.json().get("id")
    print(f"[Meta Core] Container criado com sucesso! ID: {creation_id}")

    # Polling do status do container para garantir que a imagem foi baixada e processada pelo Facebook antes de publicar
    status_code = "IN_PROGRESS"
    attempts = 0
    max_attempts = 15
    
    while status_code == "IN_PROGRESS" and attempts < max_attempts:
        attempts += 1
        print(f"[Meta Core] Verificando status do container (Tentativa {attempts}/{max_attempts})...")
        time.sleep(3)
        
        url_status = f"https://graph.facebook.com/v25.0/{creation_id}"
        res_status = requests.get(url_status, params={"fields": "status_code", "access_token": ACCESS_TOKEN})
        res_status.raise_for_status()
        status_code = res_status.json().get("status_code", "IN_PROGRESS")
        print(f"[Meta Core] Status do container: {status_code}")

    if status_code != "FINISHED":
        raise RuntimeError(f"O contêiner de mídia não pôde ser processado a tempo pela Meta. Status final: {status_code}")

    params_publish = {
        "creation_id": creation_id,
        "access_token": ACCESS_TOKEN
    }
    response_publish = requests.post(f"{BASE_URL}/media_publish", params=params_publish)
    response_publish.raise_for_status()

    post_id = response_publish.json().get("id")
    print(f"[Meta Core] Publicado com sucesso! Post ID: {post_id}")
    return {
        "status": "Sucesso",
        "post_id": post_id,
        "mensagem": "Publicado com sucesso no Instagram!"
    }


@router.post("/postar")
def postar_no_instagram(
    payload: PostSchema,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    try:
        return publish_to_instagram_core(payload.imageUrl, payload.caption)
    except requests.exceptions.HTTPError as err:
        error_details = err.response.json() if err.response else str(err)
        raise HTTPException(status_code=400, detail={"erro": "Falha na API da Meta", "detalhes": error_details})
    except ValueError as val_err:
        raise HTTPException(status_code=500, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agendar", response_model=CampaignDbResponse, status_code=status.HTTP_201_CREATED)
def agendar_publicacao_instagram(
    payload: CampaignScheduleRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Enfileira uma publicação para disparo futuro no Instagram.
    Valida que a data/hora fornecida não está no passado.
    """
    now_utc = datetime.now(timezone.utc)
    scheduled_dt = payload.scheduled_at
    if scheduled_dt.tzinfo is None:
        scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
    else:
        scheduled_dt = scheduled_dt.astimezone(timezone.utc)

    if scheduled_dt <= now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A data e horário de agendamento devem estar no futuro."
        )

    payload.scheduled_at = scheduled_dt
    scheduled_campaign = campaign_repo.schedule(db, payload)
    return scheduled_campaign


@router.get("/agendados", response_model=list[CampaignDbResponse])
def listar_campanhas_agendadas(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Retorna todas as campanhas em fila com status SCHEDULED ou PROCESSING."""
    return campaign_repo.get_scheduled(db)


@router.delete("/agendados/{campaign_id}")
def cancelar_campanha_agendada(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Cancela o agendamento de uma publicação futura, mudando seu status para CANCELLED."""
    campaign = campaign_repo.get_by_id(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha agendada não encontrada.")

    if campaign.status not in ["SCHEDULED", "PENDING_APPROVAL"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível cancelar uma publicação com status '{campaign.status}'."
        )

    campaign_repo.cancel_scheduled(db, campaign_id)
    return {
        "status": "Sucesso",
        "mensagem": f"Publicação {campaign_id} cancelada com sucesso.",
        "campaign_id": campaign_id,
        "novo_status": "CANCELLED"
    }

@router.get("/dashboard/geral")
def obtener_dashboard_geral(current_user: AuthenticatedUser = Depends(get_current_user)):
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração da Meta ausente.")
        
    try:
        url_conta = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}"
        url_conta = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}"
        res_conta = requests.get(url_conta, params={"fields": "followers_count,username", "access_token": ACCESS_TOKEN}).json()
        
        # 2. Busca Insights acumulados
        url_insights = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}/insights"
        params_insights = {
            "metric": "views,reach,profile_views",
            "period": "day",
            "metric_type": "total_value",
            "access_token": ACCESS_TOKEN
        }
        res_insights = requests.get(url_insights, params=params_insights).json()
        
        metrics_data = res_insights.get("data", [])
        
        views = 0
        reach = 0
        profile_views = 0

        for metric in metrics_data:
            nome = metric.get("name")
            total_value_obj = metric.get("total_value", {})
            valor_real = total_value_obj.get("value", 0)
            
            if nome == "views":
                views = valor_real
            elif nome == "reach":
                reach = valor_real
            elif nome == "profile_views":
                profile_views = valor_real

        return {
            "username": res_conta.get("username", "sua_marca"),
            "followers": res_conta.get("followers_count", 0),
            "impressions": views,   
            "reach": reach,
            "profileViews": profile_views
        }
    except Exception as e:
        print(f"[Dashboard] Falha crítica no dashboard geral: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar dados gerais.")



def _fetch_post_metrics(media_id: str):
    url_media = f"https://graph.facebook.com/v25.0/{media_id}"
    res_media = requests.get(url_media, params={"fields": "like_count,comments_count", "access_token": ACCESS_TOKEN}).json()
    
    url_comments = f"https://graph.facebook.com/v25.0/{media_id}/comments"
    params_comments = {
        "fields": "text,replies{text}",
        "access_token": ACCESS_TOKEN
    }
    res_comments = requests.get(url_comments, params=params_comments).json()
    
    lista_comentarios_formatados = []
    
    for item in res_comments.get("data", []):
        texto_principal = item.get("text")
        lista_comentarios_formatados.append(texto_principal)
        
        replies_obj = item.get("replies", {})
        replies_data = replies_obj.get("data", [])
        
        for reply in replies_data:
            texto_resposta = reply.get("text")
            lista_comentarios_formatados.append(f"   ↳ Resposta: {texto_resposta}")
    
    url_insights = f"https://graph.facebook.com/v25.0/{media_id}/insights"
    res_insights = requests.get(url_insights, params={"metric": "reach", "access_token": ACCESS_TOKEN})
    
    reach_post = 0
    if res_insights.status_code == 200:
        data_ins = res_insights.json().get("data", [])
        if data_ins:
            valores = data_ins[0].get("values", [])
            reach_post = valores[0].get("value", 0) if valores else data_ins[0].get("total_value", {}).get("value", 0)

    return {
        "media_id": media_id,
        "likes": res_media.get("like_count", 0),
        "commentsCount": res_media.get("comments_count", 0),
        "reach": reach_post,
        "comentarios": lista_comentarios_formatados if lista_comentarios_formatados else ["Nenhum comentário ainda."]
    }

@router.get("/dashboard/post/recente")
def obter_dados_post_recente(current_user: AuthenticatedUser = Depends(get_current_user)):
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração ausente no .env.")
        
    url_lista = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}/media"
    res_lista = requests.get(url_lista, params={"access_token": ACCESS_TOKEN})
    
    if res_lista.status_code != 200:
        raise HTTPException(status_code=res_lista.status_code, detail=res_lista.json())
        
    lista_posts = res_lista.json().get("data", [])
    if not lista_posts:
        return {
            "media_id": "nenhum", "likes": 0, "commentsCount": 0, "reach": 0,
            "comentarios": ["Nenhuma publicação encontrada."]
        }
        
    media_id = lista_posts[0].get("id")
    return _fetch_post_metrics(media_id)

@router.get("/dashboard/posts/recentes")
def obter_posts_recentes(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retorna as publicações mais recentes (padrão: 5) diretamente da conta do Instagram conectada,
    enriquecidas com os dados das campanhas cadastradas no banco de dados.
    """
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração ausente no .env.")

    url_lista = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}/media"
    params = {
        "access_token": ACCESS_TOKEN,
        "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
        "limit": limit
    }
    posts = []
    try:
        res_lista = requests.get(url_lista, params=params, timeout=10)
        if res_lista.status_code == 200:
            posts = res_lista.json().get("data", [])
        else:
            print(f"[Dashboard] Erro da Meta API ao listar posts: {res_lista.status_code} {res_lista.text}")
    except Exception as e:
        print(f"[Dashboard] Exceção ao buscar posts recentes da Meta: {e}")

    # Fallback se a Meta não responder: busca as campanhas mais recentes com ID no banco
    if not posts:
        db_campaigns = (
            db.query(Campaign)
            .filter(Campaign.id_PostInstagram.isnot(None))
            .order_by(Campaign.id.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": str(c.id_PostInstagram),
                "title": c.title,
                "caption": c.campaign,
                "media_type": "IMAGE",
                "media_url": c.description if c.description and c.description.startswith("http") else None,
                "permalink": None,
                "timestamp": str(c.date),
                "campaign_id": c.id
            }
            for c in db_campaigns
        ]

    # Mapeia IDs para as campanhas salvas no banco
    media_ids = [str(p.get("id")) for p in posts if p.get("id")]
    campanhas_map = {}
    if media_ids:
        try:
            camps = (
                db.query(Campaign)
                .filter(Campaign.id_PostInstagram.in_(media_ids))
                .all()
            )
            for c in camps:
                campanhas_map[str(c.id_PostInstagram)] = c
        except Exception as err:
            print(f"[Dashboard] Aviso ao mapear campanhas do banco: {err}")

    resultado = []
    for p in posts:
        m_id = str(p.get("id"))
        camp = campanhas_map.get(m_id)
        caption = (p.get("caption") or "").strip()
        if camp and camp.title:
            titulo = camp.title
        elif caption:
            first_line = caption.split("\n")[0].strip()
            titulo = (first_line[:55] + "...") if len(first_line) > 55 else first_line
        else:
            titulo = f"Publicação #{m_id[-5:]}"

        resultado.append({
            "id": m_id,
            "title": titulo,
            "caption": caption,
            "media_type": p.get("media_type"),
            "media_url": p.get("media_url") or p.get("thumbnail_url"),
            "permalink": p.get("permalink"),
            "timestamp": p.get("timestamp"),
            "campaign_id": camp.id if camp else None
        })

    return resultado

@router.get("/dashboard/post/{media_id}")
def obter_dados_post_por_id(
    media_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração ausente no .env.")
    try:
        return _fetch_post_metrics(media_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar métricas do post {media_id}: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)