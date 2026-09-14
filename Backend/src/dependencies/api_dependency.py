import os
import time
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.database.connection import SessionLocal

security = HTTPBearer(auto_error=False)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ebltdbhuasnrkidinhrz.supabase.co").rstrip("/")
SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibHRkYmh1YXNucmtpZGluaHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjI4NjQsImV4cCI6MjEwMDEzODg2NH0.hErNyQ2O_05KrhjKJ2mr2YrwTzV6DJBZFucIOYmdKZg"
)
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or SUPABASE_ANON_KEY


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        try:
            db.close()
        except Exception:
            pass


class AuthenticatedUser:
    def __init__(self, id: str, email: str, role: str = "Brand Manager", company_name: str | None = None):
        self.id = id
        self.email = email
        self.role = role
        self.company_name = company_name


# Cache simples de token em memória (60s TTL) para não sobrecarregar a API do Supabase
_token_cache: dict[str, tuple[AuthenticatedUser, float]] = {}


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação ausente ou inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()

    # Verifica cache
    now = time.time()
    if token in _token_cache:
        cached_user, expiry = _token_cache[token]
        if now < expiry:
            return cached_user

    # Validação com a GoTrue / Supabase Auth API
    url = f"{SUPABASE_URL}/auth/v1/user"
    active_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": active_key,
    }

    try:
        response = requests.get(url, headers=headers, timeout=6)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sessão expirada ou token inválido.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_data = response.json()
        user_id = user_data.get("id")
        email = user_data.get("email", "")

        # Busca role e company_name em public.profiles
        row = db.execute(
            text("SELECT role, company_name FROM public.profiles WHERE id = :uid"),
            {"uid": user_id},
        ).fetchone()

        role = row[0] if row and row[0] else "Brand Manager"
        company_name = row[1] if row and row[1] else None

        user = AuthenticatedUser(id=user_id, email=email, role=role, company_name=company_name)
        _token_cache[token] = (user, now + 60)
        return user

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao contatar serviço de autenticação do Supabase: {str(e)}",
        )


def require_admin(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    if current_user.role != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito exclusivamente a administradores da plataforma.",
        )
    return current_user