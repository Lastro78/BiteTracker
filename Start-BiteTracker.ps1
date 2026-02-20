$ErrorActionPreference = 'Stop'

function Write-Info($msg) {
    Write-Host "[BiteTracker] $msg" -ForegroundColor Cyan
}

function Ensure-Venv {
    if (-not (Test-Path ".venv/")) {
        Write-Info "Creating Python 3.11 virtual environment..."
        try {
            py -3.11 -m venv .venv
        } catch {
            Write-Info "Falling back to default python to create venv..."
            py -m venv .venv
        }
    }
}

function Ensure-Backend-Deps {
    Write-Info "Upgrading pip/setuptools/wheel and installing backend requirements..."
    .\.venv\Scripts\python -m pip install --upgrade pip setuptools wheel | Out-Null
    .\.venv\Scripts\python -m pip install -r requirements.txt | Out-Null
}

function Ensure-Frontend-Deps {
    if (-not (Test-Path "frontend/node_modules")) {
        Write-Info "Installing frontend dependencies (npm install)..."
        Push-Location frontend
        npm install | Out-Null
        Pop-Location
    }
}

Write-Info "Starting BiteTracker services..."

# Move to script directory
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Backend
Ensure-Venv
Ensure-Backend-Deps

# Frontend
Ensure-Frontend-Deps

Write-Info "Launching backend on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$(Get-Location)`"; .\.venv\Scripts\python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

Write-Info "Launching frontend on http://localhost:3000 ..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$(Join-Path (Get-Location) 'frontend')`"; npm start"

Write-Info "Done. Two windows should open: backend (Uvicorn) and frontend (React)."




