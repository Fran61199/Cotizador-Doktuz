# app/services/catalog_service.py
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import SessionLocal
from app.models.db_models import Test, Clinic, Price


def _prices_row_to_dict(ingreso: float, periodico: float, retiro: float) -> Dict[str, float]:
    return {"ingreso": ingreso, "periodico": periodico, "retiro": retiro}


def _is_all_zeros(prices: Optional[Dict[str, float]]) -> bool:
    """True si no hay precios o todos son 0."""
    if not prices:
        return True
    return (
        (prices.get("ingreso") or 0) == 0
        and (prices.get("periodico") or 0) == 0
        and (prices.get("retiro") or 0) == 0
    )


def get_clinics() -> List[str]:
    with SessionLocal() as db:
        return [c.name for c in db.query(Clinic.name).order_by(Clinic.name).all()]


def _apply_margin(prices: Dict[str, float], margin: float) -> Dict[str, float]:
    """Aplica margen % a los costos para obtener precio final."""
    if margin <= 0:
        return dict(prices)
    return {
        k: round(v * (1 + margin / 100), 2)
        for k, v in prices.items()
    }


def get_catalog(location: str, clinic: Optional[str], margin: float) -> List[Dict[str, Any]]:
    """location: Lima = sede Lima; Provincia = sedes en provincia (clinic = nombre sede)."""
    with SessionLocal() as db:
        if location == "Lima":
            return _get_catalog_lima(db)
        # Sedes en provincia: margen mínimo 20% sobre el costo
        margin_prov = max(margin or 0, 20.0)
        return _get_catalog_provincia(db, clinic or "", margin_prov)


def _get_catalog_lima(db: Session) -> List[Dict[str, Any]]:
    """Sede Lima: precios finales directos (sin margen). clinic_id NULL."""
    rows = (
        db.query(Test.id, Test.name, Test.category, Price.ingreso, Price.periodico, Price.retiro)
        .join(Price, Test.id == Price.test_id)
        .filter(Price.clinic_id.is_(None))
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "prices": {"ingreso": r.ingreso, "periodico": r.periodico, "retiro": r.retiro},
        }
        for r in rows
    ]


def _get_catalog_provincia(
    db: Session, clinic_name: str, margin: float
) -> List[Dict[str, Any]]:
    """
    Sedes en provincia: precios solo de provincia (nunca Lima).
    - Si la sede tiene precio (y no todo 0): usar ese costo.
    - Si no: usar el MAYOR precio de esa prueba entre todas las sedes provincia.
    - Si ninguna sede en provincia tiene precio: usar 0 (no se usa Lima).
    """
    clinic_id = None
    if clinic_name:
        c = db.query(Clinic.id).filter(Clinic.name == clinic_name).first()
        clinic_id = c.id if c else None

    all_tests = db.query(Test).order_by(Test.category, Test.name).all()

    # 1) Precios de la clínica seleccionada (por test_id)
    clinic_by_test: Dict[int, Dict[str, float]] = {}
    if clinic_id:
        rows = (
            db.query(Price.test_id, Price.ingreso, Price.periodico, Price.retiro)
            .filter(Price.clinic_id == clinic_id)
            .all()
        )
        for r in rows:
            clinic_by_test[r.test_id] = _prices_row_to_dict(r.ingreso, r.periodico, r.retiro)

    # 2) Máximo por prueba en Provincia (clinic_id IS NOT NULL) — solo provincia, nunca Lima
    max_prov = (
        db.query(
            Price.test_id,
            func.max(Price.ingreso).label("ingreso"),
            func.max(Price.periodico).label("periodico"),
            func.max(Price.retiro).label("retiro"),
        )
        .filter(Price.clinic_id.isnot(None))
        .group_by(Price.test_id)
        .all()
    )
    max_prov_by_test: Dict[int, Dict[str, float]] = {
        r.test_id: _prices_row_to_dict(r.ingreso or 0, r.periodico or 0, r.retiro or 0)
        for r in max_prov
    }

    zero_prices = _prices_row_to_dict(0, 0, 0)
    result = []
    for t in all_tests:
        clinic_prices = clinic_by_test.get(t.id)
        # Solo comparativo con provincia: sede actual o máximo en provincia; nunca Lima.
        if clinic_prices is None or _is_all_zeros(clinic_prices):
            base = max_prov_by_test.get(t.id) or zero_prices
        else:
            base = clinic_prices
        final = _apply_margin(base, margin)
        result.append({
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "prices": final,
        })
    return result


def _get_base_prices_provincia(db: Session, test_id: int, clinic_id: Optional[int]) -> Optional[Dict[str, float]]:
    """
    Obtiene el costo base para Provincia:
    - Si clinic_id y existe precio para esa clínica: devolverlo.
    - Si no: devolver el MAYOR de cada tipo entre todas las clínicas.
    - Si no hay precios en provincia: usar Lima como base (se aplicará margen).
    """
    # 1) Precio de la clínica específica (si existe)
    if clinic_id:
        p = (
            db.query(Price)
            .filter(Price.test_id == test_id, Price.clinic_id == clinic_id)
            .first()
        )
        if p:
            return {"ingreso": p.ingreso, "periodico": p.periodico, "retiro": p.retiro}

    # 2) Mayor precio entre todas las clínicas de Provincia
    provincia_prices = (
        db.query(
            func.max(Price.ingreso).label("ingreso"),
            func.max(Price.periodico).label("periodico"),
            func.max(Price.retiro).label("retiro"),
        )
        .filter(Price.test_id == test_id, Price.clinic_id.isnot(None))
        .first()
    )
    if provincia_prices and (
        provincia_prices.ingreso is not None
        or provincia_prices.periodico is not None
        or provincia_prices.retiro is not None
    ):
        return {
            "ingreso": provincia_prices.ingreso or 0,
            "periodico": provincia_prices.periodico or 0,
            "retiro": provincia_prices.retiro or 0,
        }

    # 3) Fallback: precio Lima (se aplicará margen en el front)
    lima = (
        db.query(Price)
        .filter(Price.test_id == test_id, Price.clinic_id.is_(None))
        .first()
    )
    if lima:
        return {"ingreso": lima.ingreso, "periodico": lima.periodico, "retiro": lima.retiro}

    return None
