#!/usr/bin/env python3
"""
Añade la columna no_realiza a la tabla prices (la clínica no realiza esta prueba).
Ejecutar desde backend/: python -m scripts.add_no_realiza_column
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine


def add_no_realiza_column():
    with engine.connect() as conn:
        r = conn.execute(text("PRAGMA table_info(prices)"))
        cols = [row[1] for row in r.fetchall()]
        if "no_realiza" in cols:
            print("La columna no_realiza ya existe en prices.")
            return
        conn.execute(text("ALTER TABLE prices ADD COLUMN no_realiza INTEGER DEFAULT 0"))
        conn.commit()
        print("Columna no_realiza añadida a prices.")


if __name__ == "__main__":
    add_no_realiza_column()
    print("Listo.")
