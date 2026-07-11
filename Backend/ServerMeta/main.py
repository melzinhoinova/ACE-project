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



if __name__ == "__main__":
    import uvicorn
    # Inicializa o servidor local na porta 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)