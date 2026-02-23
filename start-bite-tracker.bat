@echo off
setlocal enabledelayedexpansion

REM Change to the directory of this script
cd /d %~dp0

echo [BiteTracker] Starting services...

REM Create venv if missing (try Python 3.11 then fallback)
if not exist .venv (
  echo [BiteTracker] Creating Python virtual environment...
  py -3.11 -m venv .venv || py -m venv .venv
)

REM Ensure backend deps
call .\.venv\Scripts\python -m pip install --upgrade pip setuptools wheel >nul 2>&1
call .\.venv\Scripts\python -m pip install -r requirements.txt >nul 2>&1

REM Ensure frontend deps
if not exist frontend\node_modules (
  echo [BiteTracker] Installing frontend dependencies (npm install)...
  pushd frontend
  call npm install >nul 2>&1
  popd
)

REM Start backend (new window)
start "BiteTracker Backend" powershell -NoExit -Command "cd `"%cd%`"; .\.venv\Scripts\python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

REM Start frontend (new window)
start "BiteTracker Frontend" powershell -NoExit -Command "cd `"%cd%\frontend`"; npm start"

echo [BiteTracker] Done. Backend on http://127.0.0.1:8000 , Frontend on http://localhost:3000
exit /b 0



