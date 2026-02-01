#!/usr/bin/env python3
"""
Script para crear tablas y poblar la BD desde catalog.json.
Ejecutar: python -m scripts.seed_db (desde backend/) o cd backend && python scripts/seed_db.py
"""
import json
import sys
from pathlib import Path

# Añadir parent al path para imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import engine, Base
from app.models.db_models import Test, Clinic, Price, User
from sqlalchemy.orm import Session
import bcrypt


def load_catalog_json():
    path = Path(__file__).parent.parent / "app" / "data" / "catalog.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed():
    Base.metadata.create_all(bind=engine)
    data = load_catalog_json()

    with Session(engine) as db:
        # Usuario por defecto (solo si no existe)
        admin_email = "admin@doktuz.com"
        if not db.query(User).filter(User.email == admin_email).first():
            db.add(User(
                email=admin_email,
                password_hash=bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode("utf-8"),
                name="Administrador",
            ))
            db.commit()
            print("Usuario admin creado: admin@doktuz.com / admin123")

        # Limpiar datos existentes (tests, clinics, prices)
        db.query(Price).delete()
        db.query(Test).delete()
        db.query(Clinic).delete()
        db.commit()

        tests_by_key: dict = {}
        clinics_by_name: dict = {}

        # Crear clínicas (incl. las sin precios aún, ej. San Lucas -> usa precio máx)
        for name in data.get("clinics", []):
            if name and name not in clinics_by_name:
                clinic = Clinic(name=name)
                db.add(clinic)
                db.flush()
                clinics_by_name[name] = clinic.id

        for t in data["tests"]:
            key = (t["name"], t["category"])
            clinic_name = t.get("clinic")

            # Crear Test si no existe (consolidar duplicados Lima/Provincia)
            if key not in tests_by_key:
                test = Test(name=t["name"], category=t["category"])
                db.add(test)
                db.flush()
                tests_by_key[key] = test.id

            test_id = tests_by_key[key]
            prices = t.get("prices", {})

            if clinic_name:
                # Provincia: crear clínica si no existe
                if clinic_name not in clinics_by_name:
                    clinic = Clinic(name=clinic_name)
                    db.add(clinic)
                    db.flush()
                    clinics_by_name[clinic_name] = clinic.id
                db.add(Price(
                    test_id=test_id,
                    clinic_id=clinics_by_name[clinic_name],
                    ingreso=prices.get("ingreso", 0),
                    periodico=prices.get("periodico", 0),
                    retiro=prices.get("retiro", 0),
                ))
            else:
                # Lima: clinic_id = NULL
                db.add(Price(
                    test_id=test_id,
                    clinic_id=None,
                    ingreso=prices.get("ingreso", 0),
                    periodico=prices.get("periodico", 0),
                    retiro=prices.get("retiro", 0),
                ))

        db.commit()
    print("BD inicializada correctamente.")


if __name__ == "__main__":
    seed()
