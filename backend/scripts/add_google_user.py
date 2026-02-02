#!/usr/bin/env python3
"""
Añade un usuario autorizado para Google sign-in (solo @doktuz.com).
No requiere contraseña: usa el marcador GOOGLE_ONLY.

Uso (desde backend/):
  python -m scripts.add_google_user franco.salgado@doktuz.com
  python -m scripts.add_google_user franco.salgado@doktuz.com "Franco Salgado"

Usa la variable de entorno DATABASE_URL (la de Neon para producción).
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Cargar .env si existe (para DATABASE_URL)
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

# Importar después de agregar el path
from app.database import engine
from app.models.db_models import User
from sqlalchemy.orm import Session

GOOGLE_MARKER = "GOOGLE_ONLY"
ALLOWED_DOMAIN = "doktuz.com"


def add_google_user(email: str, name: str | None = None) -> None:
    email = email.strip().lower()
    if not email:
        print("Error: email obligatorio.")
        sys.exit(1)
    if not email.endswith(f"@{ALLOWED_DOMAIN}"):
        print(f"Error: solo se permiten emails @{ALLOWED_DOMAIN}")
        sys.exit(1)

    with Session(engine) as db:
        if db.query(User).filter(User.email == email).first():
            print(f"Ya existe el usuario: {email}")
            sys.exit(1)
        user = User(
            email=email,
            password_hash=GOOGLE_MARKER,
            name=(name or "").strip() or None,
        )
        db.add(user)
        db.commit()
    print(f"Usuario añadido (Google): {email}" + (f" ({name})" if name else ""))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m scripts.add_google_user <email@doktuz.com> [nombre]")
        print("Ejemplo: python -m scripts.add_google_user franco.salgado@doktuz.com")
        sys.exit(1)
    email = sys.argv[1]
    name = sys.argv[2] if len(sys.argv) > 2 else None
    add_google_user(email, name)
