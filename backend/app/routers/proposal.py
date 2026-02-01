# app/routers/proposal.py
from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.services.proposal_service import next_for_executive
from app.services.audit_service import log_protocol_saved

router = APIRouter()


class ProtocolSaveBody(BaseModel):
    company: str = ""
    executive: str = ""
    location: str = ""
    protocol_name: str = ""
    total_tests: int = 0
    count_condicional: int = 0
    count_requisito: int = 0
    count_adicional: int = 0


@router.get("/next")
def next_number(executive: str = Query("", description="Nombre del ejecutivo comercial")):
    """
    Devuelve correlativo por ejecutivo (zero-padded).
    """
    num = next_for_executive(executive)
    return {"proposal_number": num}


@router.post("/save-protocol")
def save_protocol(body: ProtocolSaveBody):
    """
    Registra en auditoría el guardado de un protocolo (quién, empresa, protocolo, ubicación, conteos).
    """
    log_protocol_saved(
        company=body.company,
        executive=body.executive,
        location=body.location,
        protocol_name=body.protocol_name,
        total_tests=body.total_tests,
        count_condicional=body.count_condicional,
        count_requisito=body.count_requisito,
        count_adicional=body.count_adicional,
    )
    return {"ok": True}
