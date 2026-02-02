#!/usr/bin/env python3
"""
Elimina un usuario por email de la tabla users.

Usa DATABASE_URL del .env. Para borrar en PRODUCCIÓN (Neon), ejecuta con la URL de producción:

  set DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require
  py -m scripts.delete_user franco.obando16@icloud.com

(O en Render: Shell → mismo comando con DATABASE_URL ya configurado.)
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from app.database import engine, DB_PATH
from app.models.db_models import User
from sqlalchemy.orm import Session


def delete_user(email: str) -> bool:
    """Elimina el usuario con ese email. Devuelve True si existía y se eliminó."""
    email = email.strip().lower()
    if not email:
        return False
    with Session(engine) as db:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return False
        db.delete(user)
        db.commit()
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: py -m scripts.delete_user <email>")
        print("Para producción: define DATABASE_URL con la URL de Neon y ejecuta desde backend/")
        sys.exit(1)
    email = sys.argv[1]
    # Mostrar qué BD se usa (sin mostrar contraseña)
    db_display = DB_PATH.split("@")[-1] if "@" in DB_PATH else ("SQLite local" if "sqlite" in DB_PATH else "?")
    print(f"BD: {db_display}")
    if delete_user(email):
        print(f"Usuario eliminado: {email}")
    else:
        print(f"No existe usuario con email: {email}")
        sys.exit(1)
