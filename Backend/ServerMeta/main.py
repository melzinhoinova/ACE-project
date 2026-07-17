import os
from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

router = APIRouter(prefix="/api/instagram", tags=["Meta Instagram"])


# Puxa os dados com segurança. Se não encontrar, assume None.
INSTAGRAM_ID = os.getenv("INSTAGRAM_ID")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
BASE_URL = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}"

if not INSTAGRAM_ID or not ACCESS_TOKEN:
    print("ERRO CRÍTICO: Variáveis de ambiente não foram carregadas corretamente do arquivo .env!")

class PostSchema(BaseModel):
    imageUrl: str
    caption: str

@router.post("/postar")
def postar_no_instagram(payload: PostSchema):
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(
            status_code=500, 
            detail="Configuração do servidor incompleta. Verifique as variáveis de ambiente."
        )

    try:
        params_container = {
            "image_url": payload.imageUrl,
            "caption": payload.caption,
            "access_token": ACCESS_TOKEN
        }
        response_container = requests.post(f"{BASE_URL}/media", params=params_container)
        response_container.raise_for_status() 
        
        creation_id = response_container.json().get("id")
        print(f"Container criado com sucesso! ID: {creation_id}")

        params_publish = {
            "creation_id": creation_id,
            "access_token": ACCESS_TOKEN
        }
        response_publish = requests.post(f"{BASE_URL}/media_publish", params=params_publish)
        response_publish.raise_for_status()

        return {
            "status": "Sucesso",
            "post_id": response_publish.json().get("id"),
            "mensagem": "Publicado com sucesso no Instagram!"
        }

    except requests.exceptions.HTTPError as err:
        error_details = err.response.json() if err.response else str(err)
        raise HTTPException(status_code=400, detail={"erro": "Falha na API da Meta", "detalhes": error_details})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/geral")
def obtener_dashboard_geral():
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
        print(f"💥 Falha crítica no dashboard geral: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar dados gerais.")

    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração ausente no .env.")
        
    url_lista = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}/media"
    res_lista = requests.get(url_lista, params={"access_token": ACCESS_TOKEN})
    
    if res_lista.status_code != 200:
        print(f"Erro da Meta ao listar mídias: {res_lista.json()}")
        raise HTTPException(status_code=res_lista.status_code, detail=res_lista.json())
        
    lista_posts = res_lista.json().get("data", [])
    if not lista_posts:
        return {
            "media_id": "nenhum", "likes": 0, "commentsCount": 0, "reach": 0,
            "comentarios": ["Nenhuma publicação encontrada nesta conta do Instagram."]
        }
        
    media_id = lista_posts[0].get("id")
    print(f"Conectado ao post real mais recente. ID: {media_id}")

    url_media = f"https://graph.facebook.com/v25.0/{media_id}"
    res_media = requests.get(url_media, params={"fields": "like_count,comments_count", "access_token": ACCESS_TOKEN}).json()
    url_comments = f"https://graph.facebook.com/v25.0/{media_id}/comments"
    res_comments = requests.get(url_comments, params={"access_token": ACCESS_TOKEN}).json()
    lista_comentarios = [item.get("text") for item in res_comments.get("data", [])]
    print(f"Comentários reais encontrados no post: {lista_comentarios}")
    
    url_insights = f"https://graph.facebook.com/v25.0/{media_id}/insights"
    res_insights = requests.get(url_insights, params={"metric": "reach", "access_token": ACCESS_TOKEN})
    
    reach_post = 0
    if res_insights.status_code == 200:
        data_ins = res_insights.json().get("data", [])
        if data_ins:
            valores = data_ins[0].get("values", [])
            if valores:
                reach_post = valores[0].get("value", 0)
            else:
                reach_post = data_ins[0].get("total_value", {}).get("value", 0)
    else:
        print(f"Insights do post restritos: {res_insights.json()}")

    return {
        "media_id": media_id,
        "likes": res_media.get("like_count", 0),
        "commentsCount": res_media.get("comments_count", len(lista_comentarios)),
        "reach": reach_post,
        "comentarios": lista_comentarios if lista_comentarios else ["Nenhum comentário neste post ainda."]
    }

@router.get("/dashboard/post/recente")
def obter_dados_post_recente():
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)