# Cotizador EMOs — Next.js 14 + FastAPI

## Levantar todo (recomendado)
Desde la raíz del proyecto, en PowerShell:
```powershell
.\start-dev.ps1
```
Se abren dos ventanas: backend (8000) y frontend (3000).  
Si da error de “ruta no encontrada” por la **ó** en *Código*, ver abajo *Evitar problemas de encoding*.

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

## Evitar problemas de encoding (rutas con acentos)
Si la carpeta del proyecto tiene **ó** u otros acentos (ej. *Customer Success\\Código\\cotizador 6.0*), algunos terminales corrompen la ruta y fallan `cd` o `py run.py`.

**Qué hacer:**
1. **Usar siempre rutas relativas** desde la raíz del proyecto:  
   Terminal 1: `cd backend; py run.py`  
   Terminal 2: `cd frontend; npm run dev`  
   (No escribir la ruta completa en el comando.)
2. **O** mover el proyecto a una ruta sin acentos, p. ej. `C:\dev\cotizador-6`.
3. **PowerShell:** evitar `&&`; usar `;` para encadenar: `cd backend; py run.py`.
