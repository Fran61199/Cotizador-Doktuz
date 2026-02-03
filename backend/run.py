import os
import uvicorn
from pathlib import Path

# Cargar .env para que BACKEND_API_SECRET, CORS_ORIGINS, etc. estén disponibles
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

if __name__ == '__main__':
    # reload=True puede causar KeyboardInterrupt/CancelledError en Windows al recargar
    use_reload = os.getenv('UVICORN_RELOAD', '0').strip().lower() in ('1', 'true', 'yes')
    port = int(os.getenv('PORT', '8000'))
    print(f"Backend: http://127.0.0.1:{port} (reload={use_reload})")
    if not use_reload:
        print("  -> Reinicia el proceso (Ctrl+C y py run.py) para aplicar cambios en el código.")
    uvicorn.run('app.main:app', host='127.0.0.1', port=port, reload=use_reload)
