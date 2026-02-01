# Cotizador EMOs — Next.js 14 + FastAPI

## Backend
```
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python scripts/seed_db.py   # Inicializar BD desde catalog.json (primera vez)
py run.py
```
API: http://localhost:8000

### Base de datos
- SQLite en `backend/app/data/cotizador.db`
- **Lima**: precios finales directos
- **Provincia**: precios en BD son costos; se aplica margen mínimo 20%
- Si una clínica no tiene precio, se usa el mayor precio de esa prueba entre clínicas + margen

## Frontend
```
cd frontend
npm i
npm run dev
```
App: http://localhost:3000

- Bootstrap CSS se importa en `layout.tsx`, y su JS se carga solo en cliente vía `bootstrap-client.tsx`.
- El acordeón usa la estructura oficial de Bootstrap (sin botones anidados).
- El generador ZIP devuelve un archivo con PPTX+XLSX aunque no haya plantilla.
- `NEXT_PUBLIC_API_URL` en `.env.local` (por defecto `http://localhost:8000`).

## Tests (Backend)
```
cd backend
pip install -r requirements.txt   # incluye pytest, httpx
py -m pytest tests -v
```
