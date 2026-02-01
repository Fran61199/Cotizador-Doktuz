# tests/conftest.py
"""Pytest fixtures."""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Cliente HTTP para tests."""
    return TestClient(app)
