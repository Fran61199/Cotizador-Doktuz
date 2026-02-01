# app/services/docgen/config.py
"""Configuración del módulo de generación PPT."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

PPT_TEMPLATE = os.getenv(
    "PPT_TEMPLATE",
    str(Path(__file__).resolve().parent.parent.parent / "assets" / "plantilla.pptx"),
)
PPT_TABLE_MARKER = os.getenv("PPT_TABLE_MARKER", "{{TABLA}}")

ROW_HEIGHT_INCHES = 0.12
BLANK_ROWS_BETWEEN_SECTIONS = 1

TEXT_MARKERS = {
    "RAZON_SOCIAL": "{{RAZON_SOCIAL}}",
    "DESTINATARIO": "{{DESTINATARIO}}",
    "NOMBRE_COMERCIAL": "{{NOMBRE_COMERCIAL}}",
    "PUESTO_COMERCIAL": "{{PUESTO_COMERCIAL}}",
    "XNUM": "{{x}}",
    "UBICACION": "{{UBICACION}}",
    "FECHA": "{{FECHA}}",
}
