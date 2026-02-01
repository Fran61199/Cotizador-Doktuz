#!/usr/bin/env python3
"""
Crea un usuario en la tabla users (para dar accesos al login).
Uso (desde backend/):
  python -m scripts.create_user email@ejemplo.com contraseña "Nombre Opcional"
  python scripts/create_user.py email@ejemplo.com contraseña "Nombre Opcional"
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import engine, Base
from app.models.db_models import User
from sqlalchemy.orm import Session
import bcrypt


def create_user(email: str, password: str, name: str | None = None) -> None:
    Base.metadata.create_all(bind=engine)
    email = email.strip().lower()
    if not email or not password:
        print("Error: email y contraseña son obligatorios.")
        sys.exit(1)

    with Session(engine) as db:
        if db.query(User).filter(User.email == email).first():
            print(f"Ya existe un usuario con email: {email}")
            sys.exit(1)
        db.add(User(
            email=email,
            password_hash=bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
            name=(name or "").strip() or None,
        ))
        db.commit()
    print(f"Usuario creado: {email}" + (f" ({name})" if name else ""))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python -m scripts.create_user <email> <contraseña> [nombre]")
        print("Ejemplo: python -m scripts.create_user nuevo@doktuz.com MiClave123 \"Juan Pérez\"")
        sys.exit(1)
    email = sys.argv[1]
    password = sys.argv[2]
    name = sys.argv[3] if len(sys.argv) > 3 else None
    create_user(email, password, name)
