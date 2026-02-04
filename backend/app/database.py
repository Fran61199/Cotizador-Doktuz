# app/database.py
import os
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'cotizador.db'}")

engine = create_engine(DB_PATH, connect_args={"check_same_thread": False} if "sqlite" in DB_PATH else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_no_realiza_column():
    """Añade la columna no_realiza a prices si no existe (SQLite). Evita 500 en /api/prices/list."""
    if "sqlite" not in DB_PATH:
        return
    try:
        with engine.connect() as conn:
            r = conn.execute(text("PRAGMA table_info(prices)"))
            cols = [row[1] for row in r.fetchall()]
            if "no_realiza" in cols:
                return
            conn.execute(text("ALTER TABLE prices ADD COLUMN no_realiza INTEGER DEFAULT 0"))
            conn.commit()
    except Exception:
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
