#!/usr/bin/env python3
"""
Corrige nombres de clínicas con mojibake (ej. ClÃnica -> Clínica).
Utf-8 mal interpretado como Latin-1. Requiere DATABASE_URL en .env para Neon.

Uso (desde backend/):
  py -m scripts.fix_clinic_encoding
"""
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


def fix_mojibake(s: str) -> str | None:
    """Convierte texto con mojibake (UTF-8 leído como Latin-1) a UTF-8 correcto."""
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return None


def main() -> None:
    Base.metadata.create_all(bind=engine)
    fixed = []
    with Session(engine) as db:
        for clinic in db.query(Clinic).all():
            corrected = fix_mojibake(clinic.name)
            if corrected and corrected != clinic.name:
                clinic.name = corrected
                fixed.append((clinic.id, corrected))
        if fixed:
            db.commit()
            print("Nombres corregidos:")
            for id_, name in fixed:
                print(f"  id={id_}: {name}")
        else:
            print("No se encontraron nombres con mojibake.")


if __name__ == "__main__":
    main()
