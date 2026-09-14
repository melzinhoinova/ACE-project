import os
import sys
import unicodedata
import re
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

from src.database.connection import SessionLocal
from src.models.database_models import CampaignReference
from src.services.storage_service import upload_reference_image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_REF_DIR = os.path.join(BASE_DIR, "..", "assets", "referencias")

HYBRID_CATALOG = [
    # --- 1. CHURRASCO & FIM DE SEMANA ---
    {
        "file": "Propaganda Churrasco & Picanha na Brasa.jpg",
        "title": "Churrasco & Picanha na Brasa",
        "category": "Churrasco & Fim de Semana",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle standing proudly on a rustic Brazilian barbecue wood carving board, freshly grilled sliced succulent picanha steak with coarse salt and fresh rosemary, glowing charcoal embers and soft smoke in the background, warm golden-amber commercial studio lighting, high-end magazine advertising quality.",
    },
    # --- 2. HAPPY HOUR & BOTECO ---
    {
        "file": "Propaganda Mesa de Boteco & Petiscaria.jpg",
        "title": "Mesa de Boteco & Petiscaria",
        "category": "Happy Hour & Boteco",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle on a rustic wooden bar table, a classic small Brazilian 'copo americano' glass with a pour of golden drink, crispy pastéis, crunchy pork cracklings (torresmo) and lime wedges, authentic Brazilian tavern atmosphere with yellow tiles in the soft background, warm ambient evening light.",
    },
    # --- 3. CAIPIRINHAS & COQUETELARIA ---
    {
        "file": "Propaganda Caipirinha Clássica de Alambique.jpg",
        "title": "Caipirinha Clássica de Alambique",
        "category": "Caipirinhas & Drinks",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle with studio lighting, crystalline rock glass filled with a refreshing Brazilian lime caipirinha, cold droplets dripping down the glass, sparkling crushed ice, lime wheels, and a subtle drizzle of organic golden honey, dark polished stone bar with emerald green and golden backlit reflections.",
    },
    {
        "file": "Propaganda Giuseppe Jambu.jpg",
        "title": "Botânica & Coquetelaria Moderna",
        "category": "Caipirinhas & Drinks",
        "prompt_recipe": "High-end mixology and craft botanical cocktail scene, premium bottle displayed alongside highball cocktail glasses with crystal-clear ice, tropical green leaves, subtle ambient lounge lighting.",
    },
    # --- 4. SUNSET & PRAIA ---
    {
        "file": "Propaganda Sunset Lounge & Deck Praiano.jpg",
        "title": "Sunset Lounge & Deck Praiano",
        "category": "Sunset & Praia",
        "prompt_recipe": "Commercial advertising flyer poster, chilled artisanal bottle on a rustic weathered teak wood beach deck table, dramatic ocean sunset with golden orange and purple sky, sparkling tropical cocktail with fresh mint and crushed ice, golden hour rim lighting, luxury beach club atmosphere.",
    },
    {
        "file": "Propaganda 51 Mel Verão.jpg",
        "title": "Verão Tropical & Refrescância",
        "category": "Sunset & Praia",
        "prompt_recipe": "Vibrant sunny summer commercial style, chilled sweating bottle with cold water droplets, lime slices, sparkling ice cubes, warm beach golden hour illumination and tropical summer energy.",
    },
    # --- 5. TRADIÇÃO & AMBURANA ---
    {
        "file": "Propaganda Alambique Histórico & Amburana.jpg",
        "title": "Alambique Histórico & Amburana",
        "category": "Tradição & Alambique",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle displayed inside a rustic stone alambique distillery cellar, stacked heritage wooden amburana barrels, artisanal Canastra cheese block with honey on a dark slate board, warm dramatic amber spotlighting, authentic Brazilian distillery heritage.",
    },
    {
        "file": "Propaganda Cachaça Caribé Norte de Minas Gerais.png",
        "title": "Tradição Mineira de Alambique",
        "category": "Tradição & Alambique",
        "prompt_recipe": "Traditional Brazilian farm and alambique distillery atmosphere, rustic aged wood, oak and amburana barrels, warm artisanal lighting, heritage copper stills in soft focus background.",
    },
    # --- 6. GOURMET & MEL ---
    {
        "file": "Propaganda Cachaça Siqueira Mel.png",
        "title": "Gourmet Mel & Favos Dourados",
        "category": "Gourmet & Mel",
        "prompt_recipe": "Artisanal honey texture focus, translucent golden honeycombs gently dripping, warm golden studio lighting highlighting the pure honey infusion and craftsmanship.",
    },
    {
        "file": "Propaganda Cachaça Arbórea Simples e Minimalista.png",
        "title": "Arbórea Clean & Sofisticada",
        "category": "Sofisticado & Clean",
        "prompt_recipe": "Minimalist premium magazine editorial design, clean neutral textured backdrop, soft studio lighting, refined luxury aesthetics highlighting the bottle shape and craftsmanship.",
    },
    # --- 7. SERTANEJO & RODEIO ---
    {
        "file": "Propaganda Camarote VIP & Noite Sertaneja.jpg",
        "title": "Camarote VIP & Noite Sertaneja",
        "category": "Sertanejo & Festas",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle on an illuminated VIP lounge table, glowing amber stage spotlights and concert crowd silhouette softly blurred in the background, sleek leather textures, dramatic nightlife festival lighting, premium sertanejo country music festival atmosphere.",
    },
    {
        "file": "Propaganda 51 Ribeirão Rodeo Music.webp",
        "title": "Rodeio & Arena Sertaneja",
        "category": "Sertanejo & Festas",
        "prompt_recipe": "Nighttime country music and rodeo festival atmosphere, amber floodlights, concert stage lighting, festive country crowd energy, authentic Brazilian sertanejo event poster.",
    },
    # --- 8. GRANDES FESTAS POPULARES ---
    {
        "file": "Propaganda São João & Arraiá Tradicional.jpg",
        "title": "São João & Arraiá Tradicional",
        "category": "Festas & Eventos",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle on a rustic wooden table beside a vintage enamel mug of steaming quentão with cinnamon and clove, colorful festive Brazilian triangle bunting flags (bandeirinhas) glowing under warm string lights, cozy bonfire in the background, vibrant São João winter festival atmosphere.",
    },
    {
        "file": "Propaganda 51 Carnaval.jpg",
        "title": "Carnaval & Folia Brasileira",
        "category": "Festas & Eventos",
        "prompt_recipe": "Festive, dynamic, and colorful Brazilian Carnaval composition, stylized confetti and streamers, bright energetic lighting, joyful celebration with friends, vibrant festival poster layout.",
    },
    # --- 9. DATAS COMEMORATIVAS & FIM DE ANO ---
    {
        "file": "Propaganda Natal & Ceia Festiva.jpg",
        "title": "Natal & Ceia Festiva",
        "category": "Festas de Fim de Ano",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle standing proudly on an elegant holiday Christmas dinner table, rich pine garland with warm glowing golden fairy lights bokeh, natural pine cones, star anise and cinnamon sticks on dark rustic walnut wood, fine crystal glass with golden drink, cozy festive Christmas Eve atmosphere, high-end commercial advertising photography.",
    },
    {
        "file": "Propaganda Ano Novo & Réveillon.jpg",
        "title": "Ano Novo & Réveillon",
        "category": "Festas de Fim de Ano",
        "prompt_recipe": "Commercial advertising flyer poster, artisanal bottle standing on a sleek luxury dark slate surface, sparkling champagne flutes toast, shimmering golden and silver bokeh particles, elegant midnight fireworks softly illuminating the night sky in the background, sophisticated New Year's Eve celebration ambiance, premium celebratory lighting.",
    },
]

def optimize_image(img_path: str) -> bytes:
    img = Image.open(img_path)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    max_dim = 1200
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    out = BytesIO()
    img.save(out, format="JPEG", quality=88, optimize=True)
    return out.getvalue()

def sync_hybrid_catalog():
    print("=== SINCRONIZANDO CATÁLOGO HÍBRIDO DE CAMPANHAS PUBLICITÁRIAS ===")
    db = SessionLocal()
    results = {"total": len(HYBRID_CATALOG), "sucesso": 0, "erros": 0}
    
    try:
        for item in HYBRID_CATALOG:
            local_path = os.path.join(ASSETS_REF_DIR, item["file"])
            if not os.path.exists(local_path):
                print(f"[PULANDO] Arquivo não encontrado: {local_path}")
                results["erros"] += 1
                continue
                
            print(f"Otimizando e enviando: {item['title']} ({item['file']})...")
            try:
                opt_bytes = optimize_image(local_path)
                safe_name = unicodedata.normalize("NFKD", item["title"]).encode("ASCII", "ignore").decode("ASCII")
                safe_name = re.sub(r"[^a-zA-Z0-9_]", "_", safe_name).strip("_").lower()
                storage_filename = f"styles/ad_{safe_name}.jpg"
                
                image_url = upload_reference_image(
                    file_bytes=opt_bytes,
                    filename=storage_filename,
                    content_type="image/jpeg"
                )
                
                # Upsert no banco
                existing = db.query(CampaignReference).filter(CampaignReference.title == item["title"]).first()
                if existing:
                    existing.image_url = image_url
                    existing.category = item["category"]
                    existing.prompt_recipe = item["prompt_recipe"]
                    existing.is_active = True
                    print(f" -> Atualizado: ID {existing.id} - {existing.title}")
                else:
                    new_ref = CampaignReference(
                        title=item["title"],
                        category=item["category"],
                        image_url=image_url,
                        prompt_recipe=item["prompt_recipe"],
                        is_active=True
                    )
                    db.add(new_ref)
                    db.flush()
                    print(f" -> Inserido: ID {new_ref.id} - {new_ref.title}")
                    
                db.commit()
                results["sucesso"] += 1
            except Exception as e:
                db.rollback()
                print(f" -> Erro ao processar {item['title']}: {e}")
                results["erros"] += 1
                
        # Lista final
        all_active = db.query(CampaignReference).filter(CampaignReference.is_active == True).all()
        print(f"\n=======================================================")
        print(f"TOTAL DE CAMPANHAS REAIS ATIVAS NO BANCO: {len(all_active)}")
        print(f"=======================================================")
        for r in all_active:
            print(f" • ID {r.id}: [{r.category}] {r.title}")
            
    finally:
        db.close()
        
    return results

if __name__ == "__main__":
    sync_hybrid_catalog()
