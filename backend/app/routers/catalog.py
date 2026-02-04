from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import require_user
from app.services.catalog_service import get_catalog, get_clinics, get_clinics_with_ids, create_clinic

router = APIRouter()


class CreateClinicBody(BaseModel):
    name: str


@router.get("")
def fetch_catalog(
    location: str = Query(..., description="Lima = sede Lima | Provincia = sedes en provincia"),
    clinic: str | None = Query(None, description="Sede en provincia (nombre clínica)"),
    margin: float | None = Query(None, ge=0, description="Margen % para sedes en provincia"),
    _: tuple = Depends(require_user),
):
    """Catálogo según sede: Lima (sede Lima) o Provincia (sedes en provincia, por clínica)."""
    if location not in ("Lima", "Provincia"):
        raise HTTPException(status_code=400, detail="Ubicación no válida.")
    try:
        return {"catalog": get_catalog(location, clinic, margin or 0.0)}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al cargar el catálogo.")


@router.get("/clinics")
def list_clinics(
    with_ids: bool = Query(False, description="Si True, devuelve [{ id, name }]"),
    _: tuple = Depends(require_user),
):
    """Lista las clínicas. with_ids=True devuelve [{ id, name }] para selector múltiple."""
    try:
        if with_ids:
            return {"clinics": get_clinics_with_ids()}
        return {"clinics": get_clinics()}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al cargar las clínicas.")


@router.post("/clinics")
def add_clinic(body: CreateClinicBody, _: tuple = Depends(require_user)):
    """Crea una nueva sede (clínica)."""
    try:
        name = create_clinic(body.name or "")
        return {"name": name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Error al crear la sede.")
