"""Lógica compartida para importar precios (CSV/script y API XLSX)."""
from typing import List, Dict, Any, Tuple

from sqlalchemy.orm import Session

from app.models.db_models import Test, Clinic, Price


def _norm(s: str) -> str:
    return (s or "").strip()


def _norm_clinic(c: str) -> str:
    v = _norm(c)
    if v.upper() in ("TODAS", "*", "ALL"):
        return "TODAS"
    if v.upper() in ("LIMA", ""):
        return "Lima"
    return v


def import_prices_from_rows(db: Session, rows: List[Dict[str, Any]]) -> Tuple[int, List[str]]:
    """
    Inserta/actualiza precios a partir de filas con keys: prueba, categoria, clinica, ingreso, periodico, retiro.
    clinica: vacío/Lima -> Lima; TODAS/* -> todas las clínicas; nombre -> esa clínica.
    Retorna (filas procesadas, lista de errores).
    """
    clinics = {c.name: c.id for c in db.query(Clinic).all()}
    tests_by_key = {}
    for t in db.query(Test).all():
        tests_by_key[(t.name, t.category)] = t.id

    rows_done = 0
    errors = []

    for row in rows:
        prueba = _norm(row.get("prueba", ""))
        categoria = _norm(row.get("categoria", ""))
        clinica = _norm_clinic(row.get("clinica", ""))
        try:
            ingreso = float(row.get("ingreso", 0) or 0)
        except (ValueError, TypeError):
            ingreso = 0.0
        try:
            periodico = float(row.get("periodico", 0) or 0)
        except (ValueError, TypeError):
            periodico = 0.0
        try:
            retiro = float(row.get("retiro", 0) or 0)
        except (ValueError, TypeError):
            retiro = 0.0

        if not prueba or not categoria:
            errors.append(f"Fila sin prueba/categoria: {prueba!r} / {categoria!r}")
            continue

        key = (prueba, categoria)
        if key not in tests_by_key:
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

    return rows_done, errors
