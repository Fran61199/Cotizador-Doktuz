#!/usr/bin/env python3
"""
Añade a la BD solo las clínicas que aparecen en catalog.json y aún no existen.
No borra ni modifica tests, precios ni usuarios.
Ejecutar desde backend/: python -m scripts.add_clinics_from_catalog
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import engine, Base
from app.models.db_models import Clinic
from sqlalchemy.orm import Session


def load_catalog_json():
    path = Path(__file__).parent.parent / "app" / "data" / "catalog.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def add_missing_clinics():
    Base.metadata.create_all(bind=engine)
    data = load_catalog_json()
    names_from_catalog = [n.strip() for n in data.get("clinics", []) if n and n.strip()]

    with Session(engine) as db:
        existing = {c.name for c in db.query(Clinic.name).all()}
        added = []
        for name in names_from_catalog:
            if name not in existing:
                db.add(Clinic(name=name))
                added.append(name)
        db.commit()

    if added:
        print(f"Clínicas añadidas ({len(added)}):")
        for n in added:
            print(f"  - {n}")
    else:
        print("No había clínicas nuevas. Todas las de catalog.json ya están en la BD.")
    print("Tests y precios no se han modificado.")


if __name__ == "__main__":
    add_missing_clinics()
