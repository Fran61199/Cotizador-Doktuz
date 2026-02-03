"""Dependencias de autenticación API: validación de secret compartido y usuario (JWT vía proxy)."""
import os
from typing import Annotated

from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import User

BACKEND_API_SECRET = os.getenv("BACKEND_API_SECRET", "").strip()


def require_api_secret(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Exige Authorization: Bearer <BACKEND_API_SECRET>. Usar en rutas públicas (login, register, etc.)."""
    if not BACKEND_API_SECRET:
        raise HTTPException(
            status_code=500,
            detail="BACKEND_API_SECRET no configurado",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Falta o inválido Authorization")
    token = authorization[7:].strip()
    if token != BACKEND_API_SECRET:
        raise HTTPException(status_code=401, detail="No autorizado")


def require_user(
    authorization: Annotated[str | None, Header()] = None,
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
    x_user_email: Annotated[str | None, Header(alias="X-User-Email")] = None,
    db: Session = Depends(get_db),
) -> tuple[str, str]:
    """Exige secret + usuario (headers que envía el proxy Next.js tras validar JWT).
    Valida que el usuario exista en BD para evitar suplantación con IDs arbitrarios."""
    if not BACKEND_API_SECRET:
        raise HTTPException(status_code=500, detail="BACKEND_API_SECRET no configurado")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Falta o inválido Authorization")
    if authorization[7:].strip() != BACKEND_API_SECRET:
        raise HTTPException(status_code=401, detail="No autorizado")
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(status_code=401, detail="Sesión requerida")
    user_id_str = x_user_id.strip()
    try:
        user_id_int = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Sesión inválida")
    # SQLite INTEGER es 64-bit signed; rechazar IDs que desbordan (ej. subject de Google)
    if user_id_int < -(2**63) or user_id_int > 2**63 - 1:
        raise HTTPException(status_code=401, detail="Sesión inválida")
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return (user_id_str, (x_user_email or "").strip())
