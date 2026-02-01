# app/models/db_models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """Usuarios para login con email y contraseña."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)


class Test(Base):
    __tablename__ = "tests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    prices = relationship("Price", back_populates="test")


class Clinic(Base):
    __tablename__ = "clinics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    prices = relationship("Price", back_populates="clinic")


class Price(Base):
    """Precios por prueba. clinic_id=NULL = Lima (precio final). clinic_id set = Provincia (costo por clínica).
    Una fila por (prueba, clínica). Índices mínimos: uq_test_clinic sirve para (test_id, clinic_id) y por test_id;
    ix_prices_clinic_id solo para consultas por clínica (todas las pruebas de una clínica)."""
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=True)  # NULL = Lima
    ingreso = Column(Float, nullable=False, default=0)
    periodico = Column(Float, nullable=False, default=0)
    retiro = Column(Float, nullable=False, default=0)
    test = relationship("Test", back_populates="prices")
    clinic = relationship("Clinic", back_populates="prices")
    __table_args__ = (
        UniqueConstraint("test_id", "clinic_id", name="uq_test_clinic"),
        Index("ix_prices_clinic_id", "clinic_id"),
    )


class AuditLog(Base):
    """Auditoría: generación de cotización (y opcional guardado de protocolo)."""
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(32), nullable=False)  # 'quote_generated' | 'protocol_saved'
    created_at = Column(String(32), nullable=False)   # ISO o legible
    company = Column(String(255), nullable=True)
    executive = Column(String(255), nullable=True)
    location = Column(String(64), nullable=True)     # Lima | Provincia
    proposal_number = Column(String(32), nullable=True)
    protocol_name = Column(String(255), nullable=True)  # para protocol_saved
    protocols_included = Column(String(512), nullable=True)  # nombres separados por coma
    total_tests = Column(Integer, nullable=True)
    count_condicional = Column(Integer, nullable=True)
    count_requisito = Column(Integer, nullable=True)
    count_adicional = Column(Integer, nullable=True)
    total_ingreso = Column(Float, nullable=True)
    total_periodico = Column(Float, nullable=True)
    total_retiro = Column(Float, nullable=True)
    success = Column(Integer, nullable=True)         # 1 = ok, 0 = error
    error_message = Column(String(512), nullable=True)
