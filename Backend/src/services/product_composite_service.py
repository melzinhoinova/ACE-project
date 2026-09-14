"""
src/services/product_composite_service.py

Monta uma composição limpa e equilibrada quando o usuário envia múltiplos
produtos (2, 3, 4, 5 ou mais). Garante que todos os produtos sejam
preservados lado a lado no quadro de referência enviado ao gpt-image-2,
evitando que a IA alucine garrafas genéricas.
"""

import io
from PIL import Image


def create_product_lineup_composite(images_bytes: list[bytes]) -> bytes:
    """
    Combina múltiplos bytes de imagens de produtos em uma única imagem composta
    (lineup comercial) com fundo limpo, pronta para ser usada como referência no gpt-image-2.
    """
    valid_bytes = [b for b in images_bytes if b and len(b) > 0]
    if not valid_bytes:
        raise ValueError("Nenhuma imagem válida fornecida para composição.")

    if len(valid_bytes) == 1:
        return valid_bytes[0]

    pil_images = []
    for b in valid_bytes:
        try:
            img = Image.open(io.BytesIO(b))
            img.load()
            pil_images.append(img.convert("RGBA"))
        except Exception as e:
            print(f"[product_composite] Aviso: erro ao carregar imagem: {e}")

    if not pil_images:
        return valid_bytes[0]

    if len(pil_images) == 1:
        return valid_bytes[0]

    # Altura alvo padronizada para equilibrar os produtos
    target_height = 800
    resized_images = []
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

    # Espaçamento dinâmico entre produtos
    spacing = max(20, min(50, int(total_width * 0.05)))
    canvas_w = total_width + spacing * (len(resized_images) - 1)
    canvas_h = int(target_height * 1.15)

    # Cria canvas RGBA transparente
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 0))

    current_x = 0
    y_offset = int((canvas_h - target_height) / 2)
    for img in resized_images:
        # Cola preservando transparência se houver canal alfa
        if img.mode == "RGBA":
            canvas.paste(img, (current_x, y_offset), img)
        else:
            canvas.paste(img, (current_x, y_offset))
        current_x += img.size[0] + spacing

    # Ajusta o canvas final para caber proporcionalmente dentro de 1024x1024
    canvas.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

    # Fundo branco comercial limpo para o modelo de edição
    final_canvas = Image.new("RGB", canvas.size, (255, 255, 255))
    final_canvas.paste(canvas, (0, 0), canvas)

    buffer = io.BytesIO()
    final_canvas.save(buffer, format="JPEG", quality=95)
    return buffer.getvalue()
