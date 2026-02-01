from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from app.models.schemas import GenerationRequest

def create_xlsx(req: GenerationRequest, out_path: str) -> str:
    wb = Workbook()
    ws = wb.active
    ws.title = "Resumen"
    headers = ["Protocolo","Prueba","Tipo","Precio","Clasificación","Detalle","Override","Suma?"]
    ws.append(headers)
    for c in ws[1]:
        c.font = Font(bold=True); c.alignment = Alignment(horizontal="center")

    for s in req.selections or []:
        for t in s.types:
            price = (s.overrides or {}).get(t, s.prices.get(t, 0.0))
            suma = 0 if (s.classification in ("condicional","requisito","adicional")) else price
            ws.append([s.protocol, s.name, t.capitalize(), price, s.classification or "", s.detail or "", (s.overrides or {}).get(t, ""), suma])

    wb.save(out_path)
    return out_path
