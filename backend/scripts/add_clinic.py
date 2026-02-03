#!/usr/bin/env python3
"""
Añade una clínica a la BD (Neon o SQLite local).
Requiere DATABASE_URL en .env para Neon.

Uso (desde backend/):
  py -m scripts.add_clinic "Nombre de la Clínica"
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

from app.database import engine, Base
from app.models.db_models import Clinic
from sqlalchemy.orm import Session


def add_clinic(name: str) -> None:
    name = name.strip()
    if not name:
        print("Error: el nombre de la clínica no puede estar vacío.")
        sys.exit(1)

    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        existing = db.query(Clinic).filter(Clinic.name == name).first()
        if existing:
            print(f"La clínica '{name}' ya existe en la BD (id={existing.id}).")
            sys.exit(1)
        clinic = Clinic(name=name)
        db.add(clinic)
        db.commit()
        db.refresh(clinic)
    print(f"Clínica creada: '{name}' (id={clinic.id})")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: py -m scripts.add_clinic \"Nombre de la Clínica\"")
        print("Ejemplo: py -m scripts.add_clinic \"Clínica Nueva\"")
        sys.exit(1)
    add_clinic(sys.argv[1])
