# tests/test_constants.py
"""Tests para constantes compartidas."""
from app.constants import (
    CRA_CLASSIFICATIONS,
    CLASSIFICATION_LETTER,
    CRA_DESCRIPTIONS,
    TYPE_LABELS,
)


def test_cra_classifications():
    assert "condicional" in CRA_CLASSIFICATIONS
    assert "requisito" in CRA_CLASSIFICATIONS
    assert "adicional" in CRA_CLASSIFICATIONS
    assert "otro" not in CRA_CLASSIFICATIONS


def test_classification_letter():
    assert CLASSIFICATION_LETTER["condicional"] == "C"
    assert CLASSIFICATION_LETTER["requisito"] == "R"
    assert CLASSIFICATION_LETTER["adicional"] == "A"


def test_cra_descriptions():
    assert CRA_DESCRIPTIONS["adicional"] == "Examen adicional"


def test_type_labels():
    assert TYPE_LABELS["ingreso"] == "INGRESO"
    assert TYPE_LABELS["periodico"] == "PERIÓDICO"
    assert TYPE_LABELS["retiro"] == "RETIRO"
