"""Lógica compartida para importar precios (CSV/script y API XLSX)."""
from typing import List, Dict, Any, Tuple

from sqlalchemy.orm import Session

from app.models.db_models import Test, Clinic, Price


def validate_import_rows(db: Session, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Valida filas sin escribir en BD. Retorna lista de dicts con las mismas keys
    más 'valid' (bool) y 'error' (str opcional).
    """
    clinic_names = {c.name for c in db.query(Clinic).all()}
    result = []
    for row in rows:
        prueba = _norm(row.get("prueba", ""))
        categoria = _norm(row.get("categoria", ""))
        clinica = _norm_clinic(row.get("clinica", ""))
        out = dict(row)
        out["valid"] = True
        out["error"] = None
        if not prueba or not categoria:
            out["valid"] = False
            out["error"] = "Falta prueba o categoría"
            result.append(out)
            continue
        try:
            float(row.get("ingreso", 0) or 0)
            float(row.get("periodico", 0) or 0)
            float(row.get("retiro", 0) or 0)
        except (ValueError, TypeError):
            out["valid"] = False
            out["error"] = "Ingreso, periódico o retiro deben ser números"
            result.append(out)
            continue
        if clinica not in ("Lima", "TODAS") and clinica not in clinic_names:
            out["valid"] = False
            out["error"] = f"Clínica no encontrada: {clinica}"
        result.append(out)
    return result


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
    Optimizado: batch de queries para evitar N+1.
    """
    clinics = {c.name: c.id for c in db.query(Clinic).all()}
    tests_by_key = {}
    for t in db.query(Test).all():
        tests_by_key[(t.name, t.category)] = t.id

    rows_done = 0
    errors = []
    
    # 1) Parsear todas las filas y preparar (test_id, clinic_id) a actualizar/insertar
    price_updates = []  # (test_id, clinic_id, ingreso, periodico, retiro)
    
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
            price_updates.append((test_id, cid, ingreso, periodico, retiro))
    
    # 2) Cargar todos los precios existentes para (test_id, clinic_id) en una query
    test_ids_set = {tid for tid, _, _, _, _ in price_updates}
    existing_prices = (
        db.query(Price)
        .filter(Price.test_id.in_(test_ids_set))
        .all()
    )
    existing_by_key = {(p.test_id, p.clinic_id): p for p in existing_prices}
    
    # 3) Aplicar updates/inserts en memoria
    new_prices = []
    for test_id, clinic_id, ingreso, periodico, retiro in price_updates:
        key = (test_id, clinic_id)
        if key in existing_by_key:
            # Update
            existing_by_key[key].ingreso = ingreso
            existing_by_key[key].periodico = periodico
            existing_by_key[key].retiro = retiro
        else:
            # Insert
            new_prices.append(
                Price(
                    test_id=test_id,
                    clinic_id=clinic_id,
                    ingreso=ingreso,
                    periodico=periodico,
                    retiro=retiro,
                )
            )
        rows_done += 1
    
    # 4) Bulk insert de nuevos precios
    if new_prices:
        db.add_all(new_prices)

    return rows_done, errors
