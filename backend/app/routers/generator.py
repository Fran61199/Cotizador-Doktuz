import os, zipfile
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import require_user
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.constants import CRA_CLASSIFICATIONS
from app.models.schemas import GenerationRequest, ClinicTotal, Selection
from app.services.generator_service import generate_pptx, generate_xlsx
from app.services.audit_service import log_quote_generated
from app.services.catalog_service import get_catalog

router = APIRouter()
TEMP_DIR = Path(__file__).resolve().parent.parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)

def _slug(s: str) -> str:
    import re, unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s).strip("_")
    return s or "archivo"

def _cleanup(paths):
    for p in paths:
        try:
            os.remove(p)
        except FileNotFoundError:
            pass

def _compute_clinic_totals(payload: GenerationRequest, catalogs_by_clinic: dict) -> list:
    """Calcula totales por clínica (sedes provincia): ingreso, periodico, retiro excluyendo C/R/A.
    catalogs_by_clinic: {clinic_name: catalog} precargados."""
    clinics = payload.clinics or []
    if not clinics:
        return []
    result = []
    for clinic_name in clinics:
        catalog = catalogs_by_clinic.get(clinic_name, [])
        by_name = {t["name"]: t["prices"] for t in catalog}
        ingreso = periodico = retiro = 0.0
        for s in payload.selections or []:
            if (getattr(s, "classification", None) or "").strip() in CRA_CLASSIFICATIONS:
                continue
            prices = by_name.get(s.name, {})
            for t in s.types:
                v = (s.overrides or {}).get(t, prices.get(t, 0.0))
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
        result.append(ClinicTotal(clinic=clinic_name, ingreso=round(ingreso, 2), periodico=round(periodico, 2), retiro=round(retiro, 2)))
    return result


def _prepare_payload_for_docgen(payload: GenerationRequest, lima_catalog: list) -> GenerationRequest:
    """
    Retorna una copia del payload lista para docgen.
    En Provincia: selecciones con precios Lima (sin mutar el original).
    lima_catalog: catálogo Lima precargado.
    """
    if payload.location != "Provincia" or not payload.clinic_totals:
        return payload
    lima_by_name = {t["name"]: dict(t.get("prices", {})) for t in lima_catalog}
    new_selections = []
    for s in (payload.selections or []):
        if s.name in lima_by_name:
            new_selections.append(Selection(
                id=s.id, testId=s.testId, name=s.name, category=s.category,
                protocol=s.protocol, types=s.types,
                prices=lima_by_name[s.name],
                classification=s.classification, detail=s.detail or "",
                overrides={},
            ))
        else:
            new_selections.append(s)
    return payload.model_copy(update={"selections": new_selections})


@router.post("/create")
def create_documents(payload: GenerationRequest, _: tuple = Depends(require_user)):
    if not payload.company or not payload.recipient or not payload.executive:
        raise HTTPException(status_code=400, detail="Faltan empresa/destinatario/ejecutivo")
    if not payload.selections and not payload.images:
        raise HTTPException(status_code=400, detail="Debe existir al menos una selección o imagen")

    # Precargar catálogos una sola vez (optimización: evita N llamadas a get_catalog)
    margin = payload.margin or 20.0
    lima_catalog = None
    catalogs_by_clinic = {}
    
    if payload.clinics:
        # Cargar catálogo Lima si es necesario para Provincia
        if payload.location == "Provincia":
            lima_catalog = get_catalog("Lima", None, 0)
        # Cargar catálogo por clínica una sola vez
        for clinic_name in payload.clinics:
            catalogs_by_clinic[clinic_name] = get_catalog("Provincia", clinic_name, margin)
    
    # Totales por clínica si hay sedes provincia seleccionadas
    if not payload.clinics:
        payload.clinic_totals = []
    elif not payload.clinic_totals:
        payload.clinic_totals = _compute_clinic_totals(payload, catalogs_by_clinic)

    # Copia para docgen: en Provincia, primera tabla usa precios Lima (sin mutar payload)
    if lima_catalog is None and payload.location == "Provincia" and payload.clinic_totals:
        lima_catalog = get_catalog("Lima", None, 0)
    docgen_payload = _prepare_payload_for_docgen(payload, lima_catalog or [])

    try:
        pptx_path = generate_pptx(docgen_payload, str(TEMP_DIR))
        xlsx_path = generate_xlsx(docgen_payload, str(TEMP_DIR))

        zip_name = f"cotizacion_{_slug(payload.company)}_{payload.proposal_number}.zip"
        zip_path = str(TEMP_DIR / zip_name)

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(pptx_path, os.path.basename(pptx_path))
            z.write(xlsx_path, os.path.basename(xlsx_path))

        log_quote_generated(payload, success=True)
        bg = BackgroundTask(_cleanup, [pptx_path, xlsx_path, zip_path])
        return FileResponse(zip_path, media_type="application/zip", filename=zip_name, background=bg)
    except Exception as e:
        try:
            log_quote_generated(payload, success=False, error_message=str(e))
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Error al generar el documento. Intenta de nuevo.")
