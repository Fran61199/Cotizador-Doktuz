#!/usr/bin/env python3
"""
Añade el índice en clinic_id a la tabla prices (consultas por clínica).
No borra ni modifica datos. El único (test_id, clinic_id) ya optimiza consultas por test_id.
Ejecutar desde backend/: python -m scripts.add_price_indexes
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine


def add_indexes():
    with engine.connect() as conn:
        sql = 'CREATE INDEX IF NOT EXISTS "ix_prices_clinic_id" ON "prices" ("clinic_id")'
        conn.execute(text(sql))
        conn.commit()
        print("Índice ix_prices_clinic_id en prices(clinic_id) creado o ya existía.")


if __name__ == "__main__":
    add_indexes()
    print("Listo. Los datos no se han modificado.")
