@echo off
chcp 65001 >nul

echo Cerrando Backend - FastAPI y Frontend - React...
taskkill /FI "WINDOWTITLE eq Backend - FastAPI*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - React*" /T /F >nul 2>&1

echo Sistema detenido correctamente.
timeout /t 2 /nobreak >nul
exit /b 0
