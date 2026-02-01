import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import db_models  # noqa: F401 - para registrar modelos
from app.routers import auth, catalog, generator, proposal, prices


def _get_cors_origins():
    """CORS: localhost en desarrollo, CORS_ORIGINS en producción."""
    origins_env = os.getenv("CORS_ORIGINS", "").strip()
    if origins_env:
        return [o.strip() for o in origins_env.split(",") if o.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Eventos de inicio/fin de la aplicación."""
    Base.metadata.create_all(bind=engine)
    yield
    # cleanup si hiciera falta


app = FastAPI(title="Cotizador EMOs API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Endpoint para health checks / cron ping (evitar sleep en Render)."""
    return {"ok": True}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(proposal.router, prefix="/api/proposal", tags=["proposal"])
app.include_router(generator.router, prefix="/api/generator", tags=["generator"])
app.include_router(prices.router, prefix="/api/prices", tags=["prices"])
