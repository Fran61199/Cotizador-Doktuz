# app/services/audit_service.py
from datetime import datetime
from typing import List, Optional

from app.constants import CRA_CLASSIFICATIONS
from app.database import SessionLocal
from app.models.db_models import AuditLog
from app.models.schemas import GenerationRequest


def _count_cra(selections, cl: str) -> int:
    return sum(1 for s in (selections or []) if (s.classification or "").strip() == cl)


def _totals_excluding_cra(payload: GenerationRequest) -> tuple:
    """Totales netos por tipo (ingreso, periodico, retiro) excluyendo pruebas C/R/A."""
    ingreso = periodico = retiro = 0.0
    for s in payload.selections or []:
        if (s.classification or "").strip() in CRA_CLASSIFICATIONS:
            continue
        for t in s.types:
            v = (s.overrides or {}).get(t, s.prices.get(t, 0.0) if s.prices else 0.0)
            try:
                v = float(v)
            except (TypeError, ValueError):
                v = 0.0
            if t == "ingreso":
                ingreso += v
            elif t == "periodico":
                periodico += v
            elif t == "retiro":
                retiro += v
    return round(ingreso, 2), round(periodico, 2), round(retiro, 2)


def log_quote_generated(
    payload: GenerationRequest,
    success: bool,
    error_message: Optional[str] = None,
) -> None:
    """Registra en auditoría la generación de una cotización (una por ubicación)."""
    protocols_included = ",".join([p.name for p in (payload.protocols or [])])
    total_tests = len({s.name for s in (payload.selections or [])})
    ti, tp, tr = _totals_excluding_cra(payload)
    with SessionLocal() as db:
        row = AuditLog(
            event_type="quote_generated",
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            company=payload.company or None,
            executive=payload.executive or None,
            location=payload.location or None,
            proposal_number=payload.proposal_number or None,
            protocols_included=protocols_included or None,
            total_tests=total_tests,
            count_condicional=_count_cra(payload.selections, "condicional"),
            count_requisito=_count_cra(payload.selections, "requisito"),
            count_adicional=_count_cra(payload.selections, "adicional"),
            total_ingreso=ti,
            total_periodico=tp,
            total_retiro=tr,
            success=1 if success else 0,
            error_message=error_message[:512] if error_message else None,
        )
        db.add(row)
        db.commit()


def log_protocol_saved(
    company: str,
    executive: str,
    location: str,
    protocol_name: str,
    total_tests: int,
    count_condicional: int,
    count_requisito: int,
    count_adicional: int,
) -> None:
    """Registra el guardado de un protocolo (quién, para qué empresa, etc.)."""
    with SessionLocal() as db:
        row = AuditLog(
            event_type="protocol_saved",
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            company=company or None,
            executive=executive or None,
            location=location or None,
            protocol_name=protocol_name or None,
            total_tests=total_tests,
            count_condicional=count_condicional,
            count_requisito=count_requisito,
            count_adicional=count_adicional,
            success=1,
        )
        db.add(row)
        db.commit()
