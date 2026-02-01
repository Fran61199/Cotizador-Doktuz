from typing import List, Literal, Optional, Dict
from pydantic import BaseModel

PriceType = Literal['ingreso','periodico','retiro']

class ImageCfg(BaseModel):
    base64: Optional[str] = None
    applicable_types: Optional[List[PriceType]] = None

class Selection(BaseModel):
    id: int
    testId: int
    name: str
    category: str
    protocol: str
    types: List[PriceType]
    prices: Dict[PriceType, float]
    classification: Optional[str] = None
    detail: Optional[str] = None
    overrides: Optional[Dict[PriceType, float]] = None

class Protocol(BaseModel):
    name: str

class ClinicTotal(BaseModel):
    clinic: str           # nombre de la clínica
    ingreso: float = 0
    periodico: float = 0
    retiro: float = 0


class GenerationRequest(BaseModel):
    company: str
    recipient: str
    executive: str
    executive_title: Optional[str] = None 
    location: str
    selections: List[Selection]
    protocols: List[Protocol]
    images: List[ImageCfg] = []
    proposal_number: str
    clinics: Optional[List[str]] = None      # clínicas de Provincia para totales por clínica
    clinic_totals: Optional[List[ClinicTotal]] = None  # calculado en backend si Provincia + clinics
    margin: Optional[float] = 20.0           # margen % para Provincia
