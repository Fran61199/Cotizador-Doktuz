# Levanta backend y frontend. Ejecutar desde la raíz del proyecto (donde está este script).
# Uso: .\start-dev.ps1   o   powershell -File start-dev.ps1
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

Write-Host "Backend: $root\backend" -ForegroundColor Cyan
Write-Host "Frontend: $root\frontend" -ForegroundColor Cyan
Write-Host ""
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; py run.py"
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"
Write-Host "Se abrieron dos ventanas: backend (puerto 8000) y frontend (puerto 3000)." -ForegroundColor Green
