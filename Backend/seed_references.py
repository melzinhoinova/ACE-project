"""
Backend/seed_references.py

Faz o upload dos 7 estilos de referência e do ativo master do Melzinho para o Supabase Storage
e cadastra as referências na tabela `campaign_references`.
"""

import os
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

from src.models.database_models import Base, CampaignReference
from src.database.connection import engine, SessionLocal
from src.services.storage_service import upload_reference_image

REFERENCES_DATA = [
    {
        "file": "Propaganda 51 Mel Verão.jpg",
        "title": "Verão Tropical & Refrescância",
        "category": "Verão & Praia",
        "prompt_recipe": "Estilo comercial solar e vibrante de verão, garrafa suada com gotículas d'água gelada, fatias de limão e gelo ao redor, iluminação dourada de praia e elementos tropicais.",
    },
    {
        "file": "Propaganda 51 Ribeirão Rodeo Music.webp",
        "title": "Rodeio & Noite Sertaneja",
        "category": "Sertanejo & Rodeio",
        "prompt_recipe": "Estilo noturno e imponente para eventos e rodeios, iluminação âmbar e dourada, holofotes de palco, poeira de arena estilizada e atmosfera festiva sertaneja.",
    },
    {
        "file": "Propaganda 51 Carnaval.jpg",
        "title": "Carnaval & Folia Brasileira",
        "category": "Festas & Eventos",
        "prompt_recipe": "Composição dinâmica e colorida de Carnaval, serpentinas e confetes estilizados, cores alegres, iluminação energética e clima de celebração festiva com amigos.",
    },
    {
        "file": "Propaganda Cachaça Siqueira Mel.png",
        "title": "Gourmet Mel & Favos Dourados",
        "category": "Gourmet & Mel",
        "prompt_recipe": "Foco na textura artesanal do mel, favos de mel dourados translúcidos escorrendo suavemente, iluminação dourada quente e sofisticada destacando a pureza do ingrediente.",
    },
    {
        "file": "Propaganda Cachaça Arbórea Simples e Minimalista.png",
        "title": "Arbórea Clean & Sofisticada",
        "category": "Sofisticado & Clean",
        "prompt_recipe": "Design minimalista e elegante de revista premium, fundo texturizado sóbrio, iluminação suave de estúdio, tipografia refinada e valorização artística da garrafa.",
    },
    {
        "file": "Propaganda Cachaça Caribé Norte de Minas Gerais.png",
        "title": "Tradição Mineira de Alambique",
        "category": "Rústico & Tradicional",
        "prompt_recipe": "Ambiente acolhedor e tradicional de fazenda ou alambique de Minas Gerais, madeira nobre envelhecida, barris de carvalho e iluminação acolhedora de aconchego rústico.",
    },
    {
        "file": "Propaganda Giuseppe Jambu.jpg",
        "title": "Botânica & Coquetelaria Moderna",
        "category": "Coquetelaria & Botânico",
        "prompt_recipe": "Estilo moderno de coquetelaria em bar de alta classe, folhagens verdes tropicais elegantes, drinks montados com gelo cristalino e iluminação suave de lounge.",
    },
]


def optimize_image_bytes(filepath: str, max_dim: int = 1400) -> tuple[bytes, str]:
    """Redimensiona imagens muito grandes para manter upload rápido e econômico."""
    with Image.open(filepath) as img:
        img_format = "PNG" if img.format == "PNG" else "JPEG"
        mime = "image/png" if img_format == "PNG" else "image/jpeg"
        
        # Converte RGBA para RGB se for salvar como JPEG
        if img_format == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        w, h = img.size
        if max(w, h) > max_dim:
            scale = max_dim / max(w, h)
            new_size = (int(w * scale), int(h * scale))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            
        buf = BytesIO()
        img.save(buf, format=img_format, quality=88, optimize=True)
        return buf.getvalue(), mime


def seed():
    print("Iniciando upload do ativo master do produto Melzinho...")
    product_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "produto"))
    refs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "referencias"))

    # 1. Master product asset
    mineirinho_path = os.path.join(product_dir, "mineirinho.jpg")
    master_bytes, mime = optimize_image_bytes(mineirinho_path, max_dim=1600)
    master_url = upload_reference_image(master_bytes, "brand/melzinho_master.jpg", mime)
    print(f"Master product asset URL: {master_url}")

    # Salva URL nas variáveis de ambiente ou arquivo local para referência
    with open(os.path.join(os.path.dirname(__file__), "master_asset_url.txt"), "w", encoding="utf-8") as f:
        f.write(master_url)

    # 2. Seed das 7 referências
    db = SessionLocal()
    try:
        for item in REFERENCES_DATA:
            filepath = os.path.join(refs_dir, item["file"])
            if not os.path.exists(filepath):
                print(f"Arquivo nao encontrado: {filepath}")
                continue

            file_bytes, mime = optimize_image_bytes(filepath, max_dim=1200)
            remote_name = f"styles/{item['file']}"
            public_url = upload_reference_image(file_bytes, remote_name, mime)
            print(f"Uploaded {item['title']} -> {public_url}")

            # Atualiza ou cria na tabela
            existing = db.query(CampaignReference).filter(CampaignReference.title == item["title"]).first()
            if existing:
                existing.image_url = public_url
                existing.category = item["category"]
                existing.prompt_recipe = item["prompt_recipe"]
                existing.is_active = True
                print(f"Atualizado: {item['title']}")
            else:
                ref = CampaignReference(
                    title=item["title"],
                    image_url=public_url,
                    category=item["category"],
                    prompt_recipe=item["prompt_recipe"],
                    is_active=True,
                )
                db.add(ref)
                print(f"Criado: {item['title']}")

        db.commit()

        # Verifica contagem final
        count = db.query(CampaignReference).count()
        print(f"\nTotal de referências cadastradas no banco: {count}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
