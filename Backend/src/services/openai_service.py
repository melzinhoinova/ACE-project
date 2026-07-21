from openai import OpenAI

from dotenv import load_dotenv

import base64
import os

load_dotenv()

openai_key = os.getenv("OPENAI_KEY")
client = OpenAI(api_key=openai_key)

def openai_response(prompt: str) -> str:

    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        n=1,
    )

    image_base64: str = result.data[0].b64_json

    # Converte para bytes apenas para salvar
    image_bytes: bytes = base64.b64decode(image_base64)

    # teste para gerar imagem
    with open("campanha.png", "wb") as f:
        f.write(image_bytes)

    return image_base64