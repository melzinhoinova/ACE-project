import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Carrega as variáveis contidas no arquivo .env para a memória do sistema
load_dotenv()

app = FastAPI()

# Configura o CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Puxa os dados com segurança. Se não encontrar, assume None.
INSTAGRAM_ID = os.getenv("INSTAGRAM_ID")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
BASE_URL = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}"

# Validação extra de segurança no back-end
if not INSTAGRAM_ID or not ACCESS_TOKEN:
    print("ERRO CRÍTICO: Variáveis de ambiente não foram carregadas corretamente do arquivo .env!")

# Modelo para validar os dados que o Front-end vai enviar para esta API
class PostSchema(BaseModel):
    imageUrl: str
    caption: str

@app.post("/api/instagram/postar")
def postar_no_instagram(payload: PostSchema):
    # Garante que o servidor não tente fazer a requisição sem as chaves carregadas
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(
            status_code=500, 
            detail="Configuração do servidor incompleta. Verifique as variáveis de ambiente."
        )

    try:
        # Passo 1: Criar o Container de Mídia (POST /media)
        params_container = {
            "image_url": payload.imageUrl,
            "caption": payload.caption,
            "access_token": ACCESS_TOKEN
        }
        response_container = requests.post(f"{BASE_URL}/media", params=params_container)
        response_container.raise_for_status() 
        
        creation_id = response_container.json().get("id")
        print(f"Container criado com sucesso! ID: {creation_id}")

        # Passo 2: Efetivar a Publicação (POST /media_publish)
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
        # Se a Meta rejeitar (ex: link quebrado ou token inválido), captura a mensagem real do erro
        error_details = err.response.json() if err.response else str(err)
        raise HTTPException(status_code=400, detail={"erro": "Falha na API da Meta", "detalhes": error_details})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/instagram/dashboard/geral")
def obtener_dashboard_geral():
    """Traz os dados macro da conta lendo perfeitamente a chave total_value da v25.0"""
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração da Meta ausente.")
        
    try:
        # 1. Busca dados da conta (seguidores)
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
        
        # Faz a varredura lendo exatamente a estrutura informada pela Meta
        for metric in metrics_data:
            nome = metric.get("name")
            # Acessa diretamente a nova estrutura da API v25.0
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
            "impressions": views,  # Enviamos como 'impressions' para casar com o seu front
            "reach": reach,
            "profileViews": profile_views
        }
    except Exception as e:
        print(f"💥 Falha crítica no dashboard geral: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar dados gerais.")


    """Busca o post mais recente e traz métricas reais atualizadas da v25.0"""
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração ausente no .env.")
        
    # 1. Pede à Meta a lista de mídias (posts/reels) da conta
    url_lista = f"https://graph.facebook.com/v25.0/{INSTAGRAM_ID}/media"
    res_lista = requests.get(url_lista, params={"access_token": ACCESS_TOKEN})
    
    if res_lista.status_code != 200:
        print(f"❌ Erro da Meta ao listar mídias: {res_lista.json()}")
        raise HTTPException(status_code=res_lista.status_code, detail=res_lista.json())
        
    lista_posts = res_lista.json().get("data", [])
    if not lista_posts:
        return {
            "media_id": "nenhum", "likes": 0, "commentsCount": 0, "reach": 0,
            "comentarios": ["Nenhuma publicação encontrada nesta conta do Instagram."]
        }
        
    # Pega o ID da publicação mais recente
    media_id = lista_posts[0].get("id")
    print(f"📊 Conectado ao post real mais recente. ID: {media_id}")

    # 2. Busca curtidas e contagem de comentários nativos do post
    url_media = f"https://graph.facebook.com/v25.0/{media_id}"
    res_media = requests.get(url_media, params={"fields": "like_count,comments_count", "access_token": ACCESS_TOKEN}).json()
    
    # 3. Busca a lista com o texto dos comentários de dentro do post
    url_comments = f"https://graph.facebook.com/v25.0/{media_id}/comments"
    res_comments = requests.get(url_comments, params={"access_token": ACCESS_TOKEN}).json()
    lista_comentarios = [item.get("text") for item in res_comments.get("data", [])]
    print(f"💬 Comentários reais encontrados no post: {lista_comentarios}")
    # 4. Busca o Alcance (Reach) específico desse post
    # Nota: Para insights de mídia/post individual, o parâmetro metric_type geralmente não é obrigatório,
    # mas mantemos o tratamento seguro caso a Meta mude a estrutura.
    url_insights = f"https://graph.facebook.com/v25.0/{media_id}/insights"
    res_insights = requests.get(url_insights, params={"metric": "reach", "access_token": ACCESS_TOKEN})
    
    reach_post = 0
    if res_insights.status_code == 200:
        data_ins = res_insights.json().get("data", [])
        if data_ins:
            # Verifica se veio na lista clássica (values) ou no novo formato (total_value)
            valores = data_ins[0].get("values", [])
            if valores:
                reach_post = valores[0].get("value", 0)
            else:
                reach_post = data_ins[0].get("total_value", {}).get("value", 0)
    else:
        print(f"⚠️ Insights do post restritos: {res_insights.json()}")

    return {
        "media_id": media_id,
        "likes": res_media.get("like_count", 0),
        "commentsCount": res_media.get("comments_count", len(lista_comentarios)),
        "reach": reach_post,
        "comentarios": lista_comentarios if lista_comentarios else ["Nenhum comentário neste post ainda."]
    }

@app.get("/api/instagram/dashboard/post/recente")
def obter_dados_post_recente():
    """Busca o post mais recente, incluindo comentários principais e suas respostas (replies)"""
    if not INSTAGRAM_ID or not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Configuração ausente no .env.")
        
    # 1. Busca a lista de mídias
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

    # 2. Busca curtidas e contagem total do post
    url_media = f"https://graph.facebook.com/v25.0/{media_id}"
    res_media = requests.get(url_media, params={"fields": "like_count,comments_count", "access_token": ACCESS_TOKEN}).json()
    
    # 3. Busca comentários e suas respectivas respostas (replies)
    # Pedimos explicitamente o campo 'replies{text}' para a Meta trazer o sub-objeto
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
        
        # Verifica se esse comentário específico possui respostas aninhadas
        replies_obj = item.get("replies", {})
        replies_data = replies_obj.get("data", [])
        
        for reply in replies_data:
            texto_resposta = reply.get("text")
            # Adiciona uma marcação visual para o front-end saber que é uma resposta
            lista_comentarios_formatados.append(f"   ↳ Resposta: {texto_resposta}")
    
    # 4. Busca o Alcance (Reach)
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
    # Inicializa o servidor local na porta 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)