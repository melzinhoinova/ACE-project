"""
src/services/product_composite_service.py

Monta uma composição de estúdio comercial equilibrada e orgânica quando o
usuário envia múltiplos produtos (kit, combo duo ou coleção de produtos).
Garante alinhamento de base, sombras de contato para ancoragem física,
proporções harmônicas e espaçamento de kit de presente/degustação,
permitindo que o gpt-image-2 gere uma cena realista e perfeitamente integrada.
"""

import io
from PIL import Image, ImageDraw, ImageFilter


def _add_contact_shadow(canvas: Image.Image, x: int, y: int, width: int):
    """
    Desenha uma sombra de contato suave e difusa sob a base da garrafa/produto,
    criando sensação imediata de peso, solo físico e profundidade 3D.
    """
    shadow_w = max(20, int(width * 0.90))
    shadow_h = max(12, int(width * 0.16))
    shadow_x = x + (width - shadow_w) // 2
    shadow_y = y - int(shadow_h * 0.4)

    shadow_layer = Image.new("RGBA", (shadow_w, shadow_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow_layer)
    draw.ellipse([0, 0, shadow_w, shadow_h], fill=(25, 25, 25, 110))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=max(3, shadow_h // 3)))

    canvas.paste(shadow_layer, (shadow_x, shadow_y), shadow_layer)


def create_product_lineup_composite(images_bytes: list[bytes]) -> bytes:
    """
    Combina múltiplos bytes de imagens de produtos em uma única imagem composta
    estilo kit/duo comercial com fundo neutro de estúdio e sombras de contato.
    """
    valid_bytes = [b for b in images_bytes if b and len(b) > 0]
    if not valid_bytes:
        raise ValueError("Nenhuma imagem válida fornecida para composição.")

    if len(valid_bytes) == 1:
        return valid_bytes[0]

    pil_images: list[Image.Image] = []
    for b in valid_bytes:
        try:
            img = Image.open(io.BytesIO(b))
            img.load()
            pil_images.append(img.convert("RGBA"))
        except Exception as e:
            print(f"[product_composite] Aviso ao carregar imagem: {e}")

    if not pil_images:
        return valid_bytes[0]

    if len(pil_images) == 1:
        return valid_bytes[0]

    # Altura padrão para alinhar as garrafas harmonicamente no mesmo plano visual
    target_height = 800
    resized_images: list[Image.Image] = []
    total_width = 0

    for img in pil_images:
        w, h = img.size
        if h <= 0:
            continue
        new_w = max(10, int(w * (target_height / h)))
        resized = img.resize((new_w, target_height), Image.Resampling.LANCZOS)
        resized_images.append(resized)
        total_width += new_w

    if not resized_images:
        return valid_bytes[0]

    # Para 2 produtos (kit/duo clássico), mantemos espaçamento próximo e intimista de kit
    num_items = len(resized_images)
    if num_items == 2:
        spacing = 28
    else:
        spacing = max(18, min(40, int(total_width * 0.04)))

    canvas_w = total_width + spacing * (num_items - 1) + 80  # margem lateral suave
    canvas_h = int(target_height * 1.22)  # espaço para topo e base com sombra

    # Canvas transparente de trabalho
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    # Alinhamento pela base (mesmo plano horizontal de apoio)
    baseline_y = canvas_h - int(target_height * 0.12)
    current_x = 40

    # 1. Primeiro aplica as sombras de contato sob cada produto no canvas
    shadow_x = current_x
    for img in resized_images:
        _add_contact_shadow(canvas, shadow_x, baseline_y, img.size[0])
        shadow_x += img.size[0] + spacing

    # 2. Depois sobrepõe os produtos perfeitamente sobre a base e sombra
    for img in resized_images:
        y_pos = baseline_y - img.size[1]
        if img.mode == "RGBA":
            canvas.paste(img, (current_x, y_pos), img)
        else:
            canvas.paste(img, (current_x, y_pos))
        current_x += img.size[0] + spacing

    # Redimensiona proporcionalmente para 1024x1024
    canvas.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

    # Fundo neutro de estúdio comercial suave (off-white clean para não gerar artefatos duros)
    final_canvas = Image.new("RGB", canvas.size, (246, 246, 244))
    final_canvas.paste(canvas, (0, 0), canvas)

    buffer = io.BytesIO()
    final_canvas.save(buffer, format="JPEG", quality=95)
    return buffer.getvalue()
