# tests/test_api_catalog.py
"""Tests para API de catálogo."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_clinics():
    r = client.get("/api/catalog/clinics")
    assert r.status_code == 200
    data = r.json()
    assert "clinics" in data
    assert isinstance(data["clinics"], list)


def test_get_catalog_lima():
    r = client.get("/api/catalog", params={"location": "Lima"})
    assert r.status_code == 200
    data = r.json()
    assert "catalog" in data
    assert isinstance(data["catalog"], list)
