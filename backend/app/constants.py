# app/constants.py
"""Constantes compartidas del proyecto."""

# Clasificaciones C/R/A (condicional, requisito, adicional)
CRA_CLASSIFICATIONS = frozenset(("condicional", "requisito", "adicional"))
CLASSIFICATION_LETTER: dict = {
    "condicional": "C",
    "requisito": "R",
    "adicional": "A",
}
CRA_DESCRIPTIONS: dict = {
    "adicional": "Examen adicional",
}

# Etiquetas de tipos de precio para PPT/Excel
TYPE_LABELS: dict = {
    "ingreso": "INGRESO",
    "periodico": "PERIÓDICO",
    "retiro": "RETIRO",
}
