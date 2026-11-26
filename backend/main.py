"""
Servidor Principal FastAPI - Sistema Web de Simulación de Consumo Eléctrico
Carrera de Ingeniería de Sistemas - UABJB
"""
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from backend.routers.simulation_router import router as simulation_router

app = FastAPI(
    title="Simulador de Consumo Eléctrico y Clima - Trinidad (ENDE DELBENI / AETN 666/2023)",
    description="Motor de cálculo termodinámico, bloques tarifarios y validación científica empírica.",
    version="1.0.0"
)

# Permitir CORS para comunicación transparente con el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation_router)

FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST_DIR.is_dir():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Endpoint no encontrado")
        if full_path:
            candidate = (FRONTEND_DIST_DIR / full_path).resolve()
            if candidate.is_relative_to(FRONTEND_DIST_DIR.resolve()) and candidate.is_file():
                return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
