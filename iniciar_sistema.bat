@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PYTHON_EXE="
if exist "%~dp0venv\Scripts\python.exe" set "PYTHON_EXE=%~dp0venv\Scripts\python.exe"
if not defined PYTHON_EXE if exist "%~dp0.venv\Scripts\python.exe" set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
if not defined PYTHON_EXE if exist "%~dp0backend\venv\Scripts\python.exe" set "PYTHON_EXE=%~dp0backend\venv\Scripts\python.exe"
if not defined PYTHON_EXE set "PYTHON_EXE=python"

echo Iniciando Backend FastAPI (127.0.0.1:8000)...
start "Backend - FastAPI" /D "%~dp0" cmd /k ""%PYTHON_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo Iniciando Frontend React (localhost:5173)...
start "Frontend - React" /D "%~dp0frontend" cmd /k "npm run dev"

echo Esperando a que los servidores inicien...
timeout /t 5 /nobreak >nul

echo Abriendo http://localhost:5173/ en el navegador...
start "" "http://localhost:5173/"
