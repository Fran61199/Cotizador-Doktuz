# app/services/proposal_service.py
import json
from pathlib import Path
from typing import Dict

COUNTERS_FILE = Path(__file__).parent.parent / "data" / "proposal_counters.json"
COUNTERS_FILE.parent.mkdir(parents=True, exist_ok=True)

EXEC_WHITELIST = {
    "Maria Alejandra Coria",
    "Kery Blanco",
    "Stephanie Calambrogio",
    "Ana Príncipe",
    "Franco Salgado",
    "Patricia Cánepa",
}

def _slug(s: str) -> str:
    import re, unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower() or "default"

def _load() -> Dict[str, int]:
    if COUNTERS_FILE.exists():
        try:
            return json.loads(COUNTERS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}

def _save(d: Dict[str, int]) -> None:
    COUNTERS_FILE.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

def next_for_executive(executive: str) -> str:
    # si quieres restringir:
    # if executive and executive not in EXEC_WHITELIST:
    #     raise ValueError("Ejecutivo no permitido")
    data = _load()
    key = _slug(executive or "default")
    cur = int(data.get(key, 0)) + 1
    data[key] = cur
    _save(data)
    return f"{cur:04d}"  # 0001, 0002, ...
