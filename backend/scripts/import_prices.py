#!/usr/bin/env python3
"""
Importar precios desde un CSV.

Formato del CSV (separador coma, primera fila = encabezados):
  prueba,categoria,clinica,ingreso,periodico,retiro

- prueba: nombre de la prueba (ej. "Marihuana cualitativo").
- categoria: categoría de la prueba (ej. "Laboratorio"). Si la prueba no existe, se crea.
- clinica:
  - Vacío o "Lima" → precio Lima (clinic_id NULL).
  - "TODAS" o "*" → ese precio se aplica a TODAS las clínicas de Provincia (una fila por clínica).
  - Nombre de clínica → solo esa clínica (debe existir en la BD).
- ingreso, periodico, retiro: montos (S/). Si falta, se usa 0.

Las clínicas sin precio para una prueba ya están cubiertas en la app: se usa el mayor
precio de esa prueba entre todas las clínicas (o Lima como respaldo).

Ejemplo CSV (Marihuana cualitativo 50/50/50 para todas las clínicas de provincia):
  prueba,categoria,clinica,ingreso,periodico,retiro
  Marihuana cualitativo,Laboratorio,TODAS,50,50,50

Ejemplo (solo algunas clínicas; las demás tomarán el máximo):
  Marihuana cualitativo,Laboratorio,Clínica Central,48,48,48
  Marihuana cualitativo,Laboratorio,San Juan,52,52,52

Ejecutar desde backend/:  py -m scripts.import_prices datos_precios.csv
"""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import engine
from app.models.db_models import Test, Clinic, Price
from sqlalchemy.orm import Session
def _norm(s: str) -> str:
    return (s or "").strip()


def _norm_clinic(c: str) -> str:
    v = _norm(c)
    if v.upper() in ("TODAS", "*", "ALL"):
        return "TODAS"
    if v.upper() in ("LIMA", ""):
        return "Lima"
    return v


def run(csv_path: Path, dry_run: bool = False):
    if not csv_path.exists():
        print(f"Archivo no encontrado: {csv_path}")
        return 1

    with Session(engine) as db:
        clinics = {c.name: c.id for c in db.query(Clinic).all()}
        tests_by_key = {}
        for t in db.query(Test).all():
            tests_by_key[(t.name, t.category)] = t.id

        rows_done = 0
        errors = []

        with open(csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                print("CSV vacío o sin encabezados.")
                return 1
            # Normalizar nombres de columnas (minúsculas, sin BOM)
            fieldnames = [fn.strip().lower() for fn in reader.fieldnames]
            if "prueba" not in fieldnames or "categoria" not in fieldnames:
                print("El CSV debe tener columnas: prueba, categoria, clinica, ingreso, periodico, retiro")
                return 1

            for row in reader:
                # Mapear por nombre normalizado
                row_norm = {k.strip().lower(): v for k, v in row.items() if k}
                prueba = _norm(row_norm.get("prueba", ""))
                categoria = _norm(row_norm.get("categoria", ""))
                clinica = _norm_clinic(row_norm.get("clinica", ""))
                try:
                    ingreso = float(row_norm.get("ingreso", 0) or 0)
                except ValueError:
                    ingreso = 0.0
                try:
                    periodico = float(row_norm.get("periodico", 0) or 0)
                except ValueError:
                    periodico = 0.0
                try:
                    retiro = float(row_norm.get("retiro", 0) or 0)
                except ValueError:
                    retiro = 0.0

                if not prueba or not categoria:
                    errors.append(f"Fila sin prueba/categoria: {row}")
                    continue

                # Obtener o crear test
                key = (prueba, categoria)
                if key not in tests_by_key:
                    if dry_run:
                        errors.append(f"Prueba no existe (se crearía): {prueba} / {categoria}")
                        continue
                    test = Test(name=prueba, category=categoria)
                    db.add(test)
                    db.flush()
                    tests_by_key[key] = test.id
                test_id = tests_by_key[key]

                if clinica == "Lima":
                    clinic_ids = [None]
                elif clinica == "TODAS":
                    clinic_ids = list(clinics.values())
                else:
                    if clinica not in clinics:
                        errors.append(f"Clínica no encontrada: {clinica}")
                        continue
                    clinic_ids = [clinics[clinica]]

                for cid in clinic_ids:
                    existing = (
                        db.query(Price)
                        .filter(Price.test_id == test_id, Price.clinic_id == cid)
                        .first()
                    )
                    if existing:
                        existing.ingreso = ingreso
                        existing.periodico = periodico
                        existing.retiro = retiro
                    else:
                        db.add(
                            Price(
                                test_id=test_id,
                                clinic_id=cid,
                                ingreso=ingreso,
                                periodico=periodico,
                                retiro=retiro,
                            )
                        )
                    rows_done += 1

        if errors:
            for e in errors:
                print("  ", e)
            print(f"Errores: {len(errors)}. Filas procesadas: {rows_done}")
        if dry_run:
            print("[DRY RUN] No se guardaron cambios.")
            return 0 if not errors else 1
        db.commit()
        print(f"OK: {rows_done} precio(s) importado(s).")
        return 0


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    if not args:
        print(__doc__)
        print("\nUso: py -m scripts.import_prices <archivo.csv> [--dry-run]")
        sys.exit(1)
    sys.exit(run(Path(args[0]), dry_run=dry))
