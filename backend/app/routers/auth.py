from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt

from app.database import get_db
from app.models.db_models import User

router = APIRouter()

# Marcador para usuarios solo Google (no usan contraseña)
GOOGLE_MARKER = "GOOGLE_ONLY"


class CredentialsBody(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None


class AddUserBody(BaseModel):
    email: str
    name: str | None = None


@router.post("/verify", response_model=UserResponse)
def verify_credentials(body: CredentialsBody, db: Session = Depends(get_db)):
    """Verifica email y contraseña. Retorna el usuario si es válido."""
    user = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if user.password_hash == GOOGLE_MARKER:
        raise HTTPException(status_code=401, detail="Usa inicio con Google")
    try:
        if not bcrypt.checkpw(body.password.encode("utf-8"), user.password_hash.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return UserResponse(id=user.id, email=user.email, name=user.name)


@router.get("/allowed")
def check_allowed(email: str = Query(...), db: Session = Depends(get_db)):
    """Verifica si un email está autorizado (Google OAuth: cualquier dominio si está en la tabla)."""
    email_trim = (email or "").strip().lower()
    if not email_trim:
        return {"allowed": False}
    user = db.query(User).filter(User.email == email_trim).first()
    return {"allowed": user is not None}


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """Lista todos los usuarios autorizados."""
    users = db.query(User).order_by(User.email).all()
    return [UserResponse(id=u.id, email=u.email, name=u.name) for u in users]


@router.post("/users", response_model=UserResponse)
def add_user(body: AddUserBody, db: Session = Depends(get_db)):
    """Añade un usuario autorizado para Google OAuth (cualquier email, ej. @doktuz.com o @gmail.com)."""
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email obligatorio")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    name = (body.name or "").strip() or None
    user = User(email=email, password_hash=GOOGLE_MARKER, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(id=user.id, email=user.email, name=user.name)
