from pathlib import Path
from app.models.schemas import GenerationRequest
from app.services.docgen import build_ppt
from app.utils.xlsx_generator import create_xlsx

def generate_pptx(payload: GenerationRequest, outdir: str) -> str:
    out = Path(outdir) / f"cotizacion_{payload.proposal_number}.pptx"
    build_ppt(payload, str(out))
    return str(out)

def generate_xlsx(payload: GenerationRequest, outdir: str) -> str:
    out = Path(outdir) / f"resumen_{payload.proposal_number}.xlsx"
    create_xlsx(payload, str(out))
    return str(out)
