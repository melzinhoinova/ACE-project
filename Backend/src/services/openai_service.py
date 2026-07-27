import base64
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_key = os.getenv("OPENAI_KEY")
client = OpenAI(api_key=openai_key)


def openai_response(prompt: str) -> str:
    result = client.images.generate(
        model="gpt-image-2",
        prompt=prompt,
        n=1,
        quality="medium",      # 'low', 'medium', 'high' ou 'auto'
        size="1024x1024",
        output_format="jpeg",   # 'png', 'webp' ou 'jpeg' (NÃO inclua response_format)

    )

    # O gpt-image-2 sempre entrega a string base64 direto em .b64_json
    image_base64: str = result.data[0].b64_json

    # Decodifica e salva o arquivo localmente
    image_bytes: bytes = base64.b64decode(image_base64)
    with open("campanha.png", "wb") as f:
        f.write(image_bytes)

    return image_base64