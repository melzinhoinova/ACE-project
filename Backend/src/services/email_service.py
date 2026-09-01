import os
import json
import urllib.request
import resend

def send_email_via_brevo(
    to_email: str, 
    subject: str, 
    html_content: str, 
    sender_name: str = "ACE Plataforma", 
    sender_email: str | None = None
) -> dict:
    """
    Envia e-mail via API HTTP v3 da Brevo (antigo Sendinblue).
    O plano gratuito do Brevo permite enviar 300 e-mails/dia para QUALQUER destinatário.
    """
    brevo_key = os.getenv("BREVO_API_KEY")
    if not brevo_key:
        return {"status": "skipped", "reason": "BREVO_API_KEY ausente"}

    from_email = sender_email or os.getenv("BREVO_SENDER_EMAIL", "contato@ace.ai")

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": brevo_key.strip(),
        "content-type": "application/json",
    }
    payload = {
        "sender": {"name": sender_name, "email": from_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content,
        "headers": {
            "X-Mailin-Tag": "transactional",
            "X-Mailin-Custom": "no-track",
        },
    }

    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            print(f"[Brevo] E-mail enviado com sucesso para {to_email}! MessageID: {res_data.get('messageId', 'N/A')}")
            return {"status": "success", "id": res_data.get("messageId")}
    except Exception as e:
        print(f"[Brevo] Erro ao enviar e-mail: {e}")
        return {"status": "error", "message": str(e)}


def send_opportunity_alert(
    opportunity_title: str,
    opportunity_date: str,
    opportunity_description: str | None,
    days_remaining: int,
    recipient_email: str | None = None,
    image_prompt_suggestion: str | None = None,
) -> dict:
    """
    Envia um e-mail transacional alertando sobre uma oportunidade.
    """
    to_email = recipient_email or os.getenv("NOTIFICATION_DEST_EMAIL")
    if not to_email:
        print("[EmailService] AVISO: NOTIFICATION_DEST_EMAIL não configurado. E-mail não enviado.")
        return {"status": "skipped", "reason": "NOTIFICATION_DEST_EMAIL ausente"}

    is_tomorrow = days_remaining == 1
    badge_label = "AMANHÃ ÀS 10H!" if is_tomorrow else "EM 1 SEMANA (7 DIAS)"
    badge_bg = "#ef4444" if is_tomorrow else "#f59e0b"
    subject = f"{'🚨 [AMANHÃ!]' if is_tomorrow else '🔥 [7 DIAS]'} Oportunidade ACE: {opportunity_title}"
    app_url = os.getenv("FRONTEND_URL", "https://ace-project-tan.vercel.app")

    prompt_html = ""
    if image_prompt_suggestion:
        prompt_html = f"""
        <div style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.05) 100%); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 14px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #f97316; margin-bottom: 6px;">
            💡 Sugestão de Prompt de Imagem (IA):
          </div>
          <div style="font-size: 13px; font-style: italic; color: #e4e4e7; line-height: 1.5;">
            "{image_prompt_suggestion}"
          </div>
          <div style="font-size: 10px; color: #a1a1aa; margin-top: 8px;">
            Use esta sugestão no campo de ideias do <strong>Estúdio de Criação</strong> para guiar a IA na geração da arte!
          </div>
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }}
        .container {{ max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; padding: 32px; }}
        .badge {{ display: inline-block; background-color: {badge_bg}; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }}
        .title {{ font-size: 24px; font-weight: 800; margin-top: 16px; margin-bottom: 8px; color: #ffffff; }}
        .meta {{ font-size: 14px; color: #a1a1aa; margin-bottom: 16px; }}
        .desc {{ font-size: 14px; line-height: 1.6; color: #d4d4d8; background-color: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 20px; }}
        .cta-btn {{ display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 14px; text-align: center; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35); }}
        .footer {{ font-size: 11px; color: #71717a; text-align: center; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align: left;">
          <span class="badge">{badge_label}</span>
        </div>
        <div class="title">{opportunity_title}</div>
        <div class="meta">📅 Data da Oportunidade: <strong>{opportunity_date}</strong></div>
        
        {f'<div class="desc">{opportunity_description}</div>' if opportunity_description else ''}

        {prompt_html}

        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">
          A inteligência do ACE identificou esta oportunidade no seu radar. Não perca tempo e prepare o criativo e a legenda perfeita para o Instagram antes dos seus concorrentes!
        </p>

        <div style="margin-top: 28px; text-align: center;">
          <a href="{app_url}/gerador" class="cta-btn">🚀 Gerar Campanha no ACE Estúdio</a>
        </div>

        <div class="footer">
          ACE - Automação & Inteligência de Campanhas © 2026<br>
          Este é um e-mail automático enviado pelo seu Radar de Oportunidades.
        </div>
      </div>
    </body>
    </html>
    """

    # Tenta primeiro Brevo se configurado
    if os.getenv("BREVO_API_KEY"):
        res_brevo = send_email_via_brevo(to_email, subject, html_content)
        if res_brevo.get("status") == "success":
            return res_brevo

    # Fallback para Resend
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("[Resend] AVISO: RESEND_API_KEY não configurada em .env. E-mail não enviado.")
        return {"status": "skipped", "reason": "RESEND_API_KEY ausente"}

    resend.api_key = api_key
    from_email = os.getenv("RESEND_FROM_EMAIL", "ACE Oportunidades <onboarding@resend.dev>")
    params: resend.Emails.SendParams = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }

    try:
        response = resend.Emails.send(params)
        print(f"[Resend] E-mail enviado com sucesso! ID: {response.get('id', 'N/A')}")
        return {"status": "success", "id": response.get("id")}
    except Exception as e:
        print(f"[Resend] Erro ao enviar e-mail: {e}")
        return {"status": "error", "message": str(e)}


def send_invite_email(
    recipient_email: str,
    company_name: str,
    role: str,
    invite_url: str,
) -> dict:
    """
    Envia um e-mail transacional com o convite de acesso B2B à plataforma ACE.
    Prioriza Brevo se BREVO_API_KEY estiver configurada, com fallback para Resend.
    """
    subject = f"🔑 Convite de Acesso- ACE Studio "

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }}
        .container {{ max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; padding: 32px; }}
        .badge {{ display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; }}
        .title {{ font-size: 24px; font-weight: 800; margin-top: 16px; margin-bottom: 8px; color: #ffffff; }}
        .meta {{ font-size: 14px; color: #a1a1aa; margin-bottom: 16px; }}
        .desc {{ font-size: 14px; line-height: 1.6; color: #d4d4d8; background-color: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 20px; }}
        .cta-btn {{ display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 14px; text-align: center; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35); }}
        .footer {{ font-size: 11px; color: #71717a; text-align: center; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align: left;">
          <span class="badge">CONVITE EXCLUSIVO </span>
        </div>
        <div class="title">Bem-vindo ao ACE Studio</div>
        <div class="meta">Sua marca <strong>{company_name}</strong> foi convidada com o nível de acesso <strong>{role}</strong>.</div>
        
        <div class="desc">
          Você recebeu um convite para gerenciar inteligência comercial sazonal, criar campanhas visuais com IA e acompanhar métricas em tempo real no Instagram.
        </div>

        <div style="margin-top: 28px; text-align: center;">
          <a href="{invite_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #f97316; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 14px; text-align: center; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);" class="cta-btn">✨ Ativar Minha Conta</a>
        </div>

        <div style="margin-top: 24px; font-size: 12px; color: #a1a1aa; word-break: break-all; text-align: center; line-height: 1.6;">
          Ou acesse diretamente pelo link:<br>
          <a href="{invite_url}" target="_blank" rel="noopener noreferrer" style="color: #f97316; text-decoration: underline; font-weight: 600;">{invite_url}</a>
        </div>

        <div class="footer">
          ACE — AutoSales Campaign Engine © 2026<br>
          Este e-mail foi enviado porque sua empresa foi cadastrada por um Administrador da plataforma.
        </div>
      </div>
    </body>
    </html>
    """

    # 1. Tenta Brevo (se BREVO_API_KEY estiver no .env)
    if os.getenv("BREVO_API_KEY"):
        res_brevo = send_email_via_brevo(recipient_email, subject, html_content)
        if res_brevo.get("status") == "success":
            return res_brevo
        print("[EmailService] Brevo falhou ou não retornou sucesso, tentando Resend...")

    # 2. Fallback para Resend
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("[Resend] AVISO: RESEND_API_KEY não configurada em .env. E-mail de convite não enviado.")
        return {"status": "skipped", "reason": "RESEND_API_KEY ausente"}

    resend.api_key = api_key
    from_email = os.getenv("RESEND_FROM_EMAIL", "ACE Plataforma <onboarding@resend.dev>")
    params: resend.Emails.SendParams = {
        "from": from_email,
        "to": [recipient_email],
        "subject": subject,
        "html": html_content,
    }

    try:
        response = resend.Emails.send(params)
        print(f"[Resend] E-mail de convite enviado com sucesso para {recipient_email}! ID: {response.get('id', 'N/A')}")
        return {"status": "success", "id": response.get("id")}
    except Exception as e:
        print(f"[Resend] Erro ao enviar e-mail de convite via Resend: {e}")
        return {"status": "error", "message": str(e)}


