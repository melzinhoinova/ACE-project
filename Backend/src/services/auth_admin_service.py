import os
import requests
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ebltdbhuasnrkidinhrz.supabase.co").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def delete_supabase_user(user_id: str, db: Session) -> dict:
    """
    Exclui um usuário completamente:
    1. Tenta via Supabase Admin REST API (GoTrue Admin API) usando SUPABASE_SERVICE_ROLE_KEY.
    2. Garante a exclusão direta no PostgreSQL (auth.users, public.profiles e public.invitations).
    """
    deleted_via_api = False
    api_error = None

    if SUPABASE_SERVICE_ROLE_KEY and not SUPABASE_SERVICE_ROLE_KEY.startswith("YOUR_"):
        url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        }
        try:
            resp = requests.delete(url, headers=headers, timeout=10)
            if resp.status_code in [200, 204]:
                deleted_via_api = True
            else:
                api_error = resp.text
        except Exception as e:
            api_error = str(e)

    # Executa também via PostgreSQL direto
    try:
        user_row = db.execute(
            text("SELECT email FROM auth.users WHERE id = :uid"), 
            {"uid": user_id}
        ).fetchone()
        email = user_row[0] if user_row else None

        # Deleta de auth.users (o CASCADE apaga em public.profiles)
        db.execute(text("DELETE FROM auth.users WHERE id = :uid"), {"uid": user_id})
        
        # Garante a exclusão em public.profiles
        db.execute(text("DELETE FROM public.profiles WHERE id = :uid"), {"uid": user_id})

        # Remove o convite correspondente se existir
        if email:
            db.execute(text("DELETE FROM public.invitations WHERE email = :email"), {"email": email})

        db.commit()
        return {"status": "success", "user_id": user_id, "deleted_via_api": deleted_via_api}
    except Exception as sql_err:
        db.rollback()
        if deleted_via_api:
            return {"status": "success", "user_id": user_id, "deleted_via_api": True}
        raise Exception(f"Falha ao excluir usuário: {sql_err} (API error: {api_error})")


def list_active_users(db: Session) -> list:
    """
    Lista todos os usuários com perfis e dados de autenticação.
    """
    sql = text("""
        SELECT 
            p.id,
            COALESCE(u.email, p.phone, 'Sem e-mail') as email,
            p.company_name,
            COALESCE(p.role, 'Brand Manager') as role,
            p.avatar_url,
            p.created_at
        FROM public.profiles p
        LEFT JOIN auth.users u ON p.id = u.id
        ORDER BY p.created_at DESC
    """)
    result = db.execute(sql).fetchall()
    users = []
    for r in result:
        users.append({
            "id": str(r[0]),
            "email": r[1],
            "company_name": r[2],
            "role": r[3],
            "avatar_url": r[4],
            "created_at": r[5].isoformat() if r[5] else None,
        })
    return users
