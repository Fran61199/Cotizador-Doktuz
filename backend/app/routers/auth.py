from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import User
import bcrypt

router = APIRouter()


class CredentialsBody(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None


@router.post("/verify", response_model=UserResponse)
def verify_credentials(body: CredentialsBody, db: Session = Depends(get_db)):
    """Verifica email y contraseña. Retorna el usuario si es válido."""
    user = db.query(User).filter(User.email == body.email.strip().lower()).first()
    if not user or not bcrypt.checkpw(body.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return UserResponse(id=user.id, email=user.email, name=user.name)
