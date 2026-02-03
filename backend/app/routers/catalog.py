from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import require_user
from app.services.catalog_service import get_catalog, get_clinics

router = APIRouter()


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
def list_clinics(_: tuple = Depends(require_user)):
    """Lista las clínicas disponibles."""
    try:
        return {"clinics": get_clinics()}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al cargar las clínicas.")
