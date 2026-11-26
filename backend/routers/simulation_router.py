"""
Router de API REST para el Simulador Energético y Climático de Trinidad
Construido con FastAPI
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any

from backend.services.climate_engine import calcular_indice_calor_rothfusz
from backend.services.tariff_engine import calcular_factura_ende_delbeni
from backend.services.simulation_engine import simular_consumo_hogar
from backend.services.validation_service import (
    ejecutar_validacion_cientifica_mape,
    listar_medidores_hogares,
    obtener_historico_medidor,
)
from backend.database.connection import get_connection

router = APIRouter(prefix="/api", tags=["Simulador"])

# Modelos Pydantic para validación de entrada
class EquipoInput(BaseModel):
    nombre: str
    tipo: str = Field(..., description="aire_acondicionado, refrigeracion, ventilacion, base")
    cantidad: int = Field(default=1, ge=1)
    potencia_kw: float = Field(..., gt=0.0)
    tecnologia: Optional[str] = Field(default="Convencional")
    horas_dia: float = Field(default=4.0, ge=0.0, le=24.0)
    temp_setpoint: Optional[float] = Field(default=24.0, ge=-25.0, le=30.0)

    @model_validator(mode="after")
    def validar_setpoint_por_tipo(self):
        if self.temp_setpoint is None:
            return self
        if self.tipo == "aire_acondicionado" and not (16.0 <= self.temp_setpoint <= 30.0):
            raise ValueError("Para aire_acondicionado, temp_setpoint debe estar entre 16.0 y 30.0 °C.")
        if self.tipo == "refrigeracion" and not (-25.0 <= self.temp_setpoint <= 15.0):
            raise ValueError("Para refrigeracion, temp_setpoint debe estar entre -25.0 y 15.0 °C.")
        return self

class SimulacionRequest(BaseModel):
    nombre_simulacion: Optional[str] = "Simulación Domiciliaria"
    temperatura_celsius: float = Field(..., ge=10.0, le=50.0)
    humedad_relativa: float = Field(..., ge=10.0, le=100.0)
    dias_mes: Optional[int] = Field(default=30, ge=22, le=37)
    aplicar_tarifa_dignidad: Optional[bool] = False
    equipos: List[EquipoInput]

@router.get("/health")
def health_check():
    return {"status": "ok", "sistema": "Simulador Energético-Climático Trinidad UABJB"}

@router.get("/clima/escenarios")
def listar_escenarios_climaticos():
    """Retorna los 12 meses históricos oficiales de Trinidad (SENAMHI / WeatherSpark)"""
    conn = get_connection()
    try:
        escenarios = conn.execute("SELECT * FROM escenarios_climaticos ORDER BY mes_numero ASC").fetchall()
        return [dict(e) for e in escenarios]
    finally:
        conn.close()

@router.get("/equipos/catalogo")
def listar_catalogo_equipos():
    """Retorna el catálogo estándar de electrodomésticos para Trinidad"""
    conn = get_connection()
    try:
        equipos = conn.execute("SELECT * FROM equipos_catalogo ORDER BY tipo ASC, potencia_nominal_kw ASC").fetchall()
        return [dict(eq) for eq in equipos]
    finally:
        conn.close()

@router.post("/simulacion/ejecutar")
def ejecutar_simulacion(req: SimulacionRequest):
    """Ejecuta la simulación termodinámica y económica bajo el pliego ENDE DELBENI AETN 666/2023"""
    equipos_dict = [eq.model_dump() for eq in req.equipos]
    resultado = simular_consumo_hogar(
        equipos_usuario=equipos_dict,
        temperatura_celsius=req.temperatura_celsius,
        humedad_relativa=req.humedad_relativa,
        dias_del_mes=req.dias_mes,
        aplicar_tarifa_dignidad=req.aplicar_tarifa_dignidad,
    )
    return resultado

class BloqueTarifarioUpdate(BaseModel):
    numero_bloque: int = Field(..., ge=1)
    costo_kwh_bs: float = Field(..., gt=0.0)


class TramoAseoUpdate(BaseModel):
    orden: int = Field(..., ge=1)
    kwh_desde: float = Field(..., ge=0.0)
    kwh_hasta: Optional[float] = Field(default=None)
    monto_bs: float = Field(..., ge=0.0)


class TarifaActualizarRequest(BaseModel):
    factor_indexacion: Optional[float] = Field(default=None, gt=0.0)
    cargo_minimo_bs: Optional[float] = Field(default=None, gt=0.0)
    aplica_tarifa_dignidad: Optional[bool] = None
    tasa_alumbrado_porc: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    bloques: Optional[List[BloqueTarifarioUpdate]] = None
    tramos_aseo: Optional[List[TramoAseoUpdate]] = None


@router.get("/tarifas/vigente")
def obtener_tarifa_vigente():
    """Retorna los bloques escalonados, indexación y tasas municipales vigentes de ENDE DELBENI"""
    conn = get_connection()
    try:
        pliego = conn.execute("SELECT * FROM pliegos_tarifarios WHERE activo = 1 LIMIT 1").fetchone()
        if not pliego:
            raise HTTPException(status_code=404, detail="No hay pliego tarifario activo.")
        bloques = conn.execute("SELECT * FROM tarifas_bloques WHERE pliego_id = ? ORDER BY numero_bloque ASC", (pliego["id"],)).fetchall()
        tasas = conn.execute("SELECT * FROM tasas_municipales WHERE pliego_id = ? AND vigente = 1 LIMIT 1", (pliego["id"],)).fetchone()
        tramos_aseo = conn.execute("SELECT * FROM tramos_aseo_urbano WHERE pliego_id = ? ORDER BY orden ASC", (pliego["id"],)).fetchall()
        
        return {
            "pliego": dict(pliego),
            "bloques": [dict(b) for b in bloques],
            "tasas": dict(tasas) if tasas else None,
            "tramos_aseo": [dict(t) for t in tramos_aseo]
        }
    finally:
        conn.close()


@router.put("/tarifas/actualizar")
def actualizar_tarifa_vigente(req: TarifaActualizarRequest):
    """Permite actualizar dinámicamente el factor de indexación, tarifas por bloque, alumbrado y tramos de aseo en SQLite"""
    conn = get_connection()
    try:
        pliego = conn.execute("SELECT * FROM pliegos_tarifarios WHERE activo = 1 LIMIT 1").fetchone()
        if not pliego:
            raise HTTPException(status_code=404, detail="No hay pliego tarifario activo.")
        p_id = pliego["id"]

        if req.factor_indexacion is not None:
            conn.execute("UPDATE pliegos_tarifarios SET factor_indexacion = ? WHERE id = ?", (req.factor_indexacion, p_id))
        if req.cargo_minimo_bs is not None:
            conn.execute("UPDATE pliegos_tarifarios SET cargo_minimo_bs = ? WHERE id = ?", (req.cargo_minimo_bs, p_id))
        if req.aplica_tarifa_dignidad is not None:
            conn.execute("UPDATE pliegos_tarifarios SET aplica_tarifa_dignidad = ? WHERE id = ?", (1 if req.aplica_tarifa_dignidad else 0, p_id))

        if req.tasa_alumbrado_porc is not None:
            conn.execute("UPDATE tasas_municipales SET tasa_alumbrado_porc = ? WHERE pliego_id = ? AND vigente = 1", (req.tasa_alumbrado_porc, p_id))

        if req.bloques:
            for b in req.bloques:
                conn.execute(
                    "UPDATE tarifas_bloques SET costo_kwh_bs = ? WHERE pliego_id = ? AND numero_bloque = ?",
                    (b.costo_kwh_bs, p_id, b.numero_bloque)
                )

        if req.tramos_aseo:
            conn.execute("DELETE FROM tramos_aseo_urbano WHERE pliego_id = ?", (p_id,))
            conn.executemany(
                "INSERT INTO tramos_aseo_urbano (pliego_id, orden, kwh_desde, kwh_hasta, monto_bs) VALUES (?, ?, ?, ?, ?)",
                [(p_id, t.orden, t.kwh_desde, t.kwh_hasta, t.monto_bs) for t in req.tramos_aseo]
            )

        conn.commit()
        return {"status": "actualizado", "pliego_id": p_id}
    finally:
        conn.close()

@router.get("/validacion/mape")
def obtener_validacion_mape():
    """
    Retorna la auditoría estadística y contraste empírico de las 150 facturas
    para el cumplimiento del Objetivo Específico 5 y la Hipótesis H1 (< 10%).
    """
    resultado = ejecutar_validacion_cientifica_mape()
    return resultado

@router.get("/hogares")
def listar_hogares_resumen():
    """Retorna los 15 hogares registrados en facturas_reales con su tipo de perfil y resumen de kWh"""
    return listar_medidores_hogares()


@router.get("/hogares/{medidor}/historico")
def obtener_historico_hogar(medidor: str):
    """Retorna el histórico cronológico de facturas y el perfil de equipos de un medidor"""
    res = obtener_historico_medidor(medidor)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Medidor '{medidor}' no encontrado.")
    return res


@router.get("/hogares/muestra")
def listar_hogares_muestra():
    """Retorna la lista de los 15 hogares de Trinidad y sus facturas para el tribunal"""
    conn = get_connection()
    try:
        hogares = conn.execute("SELECT * FROM hogares_muestra ORDER BY id ASC").fetchall()
        res = []
        for h in hogares:
            h_dict = dict(h)
            facts = conn.execute("SELECT * FROM facturas_reales WHERE hogar_id = ? ORDER BY anio ASC, mes ASC", (h["id"],)).fetchall()
            h_dict["facturas"] = [dict(f) for f in facts]
            res.append(h_dict)
        return res
    finally:
        conn.close()
