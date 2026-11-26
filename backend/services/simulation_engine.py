"""
Simulador de Consumo Termodinámico Residencial
Modela el consumo de equipos en función del Delta Térmico (Sensación Térmica - Setpoint)
"""
import math
from typing import List, Dict, Any, Optional
from backend.services.climate_engine import calcular_indice_calor_rothfusz
from backend.services.tariff_engine import calcular_factura_ende_delbeni

def simular_consumo_hogar(
    equipos_usuario: List[Dict[str, Any]],
    temperatura_celsius: float,
    humedad_relativa: float,
    dias_del_mes: int = 30,
    aplicar_tarifa_dignidad: Optional[bool] = None
) -> Dict[str, Any]:
    """
    Simula el consumo en kWh y la facturación en Bs. para un inventario de equipos dado.
    
    Cada equipo en `equipos_usuario` debe tener:
    - id_equipo / nombre
    - tipo: 'aire_acondicionado', 'refrigeracion', 'ventilacion', 'base'
    - cantidad: int
    - potencia_kw: float
    - tecnologia: 'Convencional' | 'Inverter'
    - horas_dia: float (horas de uso promedio diario)
    - temp_setpoint: float (temperatura configurada en termostato, defecto 24°C)
    """
    # 1. Calcular sensación térmica exterior efectiva
    clima = calcular_indice_calor_rothfusz(temperatura_celsius, humedad_relativa)
    hi_c = clima["sensacion_termica_c"]

    consumo_kwh_desagregado = {
        "aire_acondicionado": 0.0,
        "refrigeracion": 0.0,
        "ventilacion": 0.0,
        "base": 0.0
    }

    detalle_equipos_simulados = []

    for eq in equipos_usuario:
        tipo = eq.get("tipo", "base")
        cantidad = int(eq.get("cantidad", 1))
        potencia_kw = float(eq.get("potencia_kw", 0.1))
        tecnologia = eq.get("tecnologia", "Convencional")
        horas_dia = float(eq.get("horas_dia", 4.0))
        setpoint = float(eq.get("temp_setpoint", 24.0))

        delta_t = max(0.0, hi_c - setpoint)

        # Factor de carga del compresor (Duty Cycle / Duty Factor)
        if tipo == "aire_acondicionado":
            if hi_c < setpoint:
                # Transición suave por debajo del setpoint (evita salto discontinuo en surazos)
                deficit_t = setpoint - hi_c
                if tecnologia == "Inverter":
                    factor_carga = max(0.12, 0.22 - (deficit_t * 0.04))
                else:
                    factor_carga = max(0.15, 0.30 - (deficit_t * 0.05))
            else:
                # Curva asintótica termodinámica: evita saturación prematura al 100% en meses
                # normales y diferencia surazos, transición, verano y olas de calor (38-41.3 °C)
                if tecnologia == "Inverter":
                    factor_carga = 0.22 + 0.68 * (1.0 - math.exp(-0.055 * delta_t))
                else:
                    factor_carga = 0.30 + 0.70 * (1.0 - math.exp(-0.065 * delta_t))

            # Rampa lineal continua de factor de uso estacional entre 23.0 °C (surazo) y 26.5 °C (cálido normal)
            if temperatura_celsius <= 23.0:
                factor_uso_estacional = 0.38
            elif temperatura_celsius >= 26.5:
                factor_uso_estacional = 1.00
            else:
                factor_uso_estacional = 0.38 + 0.62 * ((temperatura_celsius - 23.0) / 3.5)

            kwh_diario = cantidad * potencia_kw * (horas_dia * factor_uso_estacional) * factor_carga

        elif tipo == "refrigeracion":
            # Un refrigerador opera 24h, pero el compresor cicla según la temperatura ambiente
            delta_ref = max(0.0, hi_c - 20.0)
            if tecnologia == "Inverter":
                factor_carga = min(0.75, 0.25 + (delta_ref * 0.014))
            else:
                factor_carga = min(0.85, 0.30 + (delta_ref * 0.018))
            kwh_diario = cantidad * potencia_kw * 24.0 * factor_carga

        elif tipo == "ventilacion":
            # Un ventilador tiene carga resistiva/inductiva constante (no cicla compresor)
            kwh_diario = cantidad * potencia_kw * horas_dia

        else:
            # Carga base (iluminación, TV, electrónica)
            kwh_diario = cantidad * potencia_kw * horas_dia

        kwh_mensual = round(kwh_diario * dias_del_mes, 2)
        consumo_kwh_desagregado[tipo] = round(consumo_kwh_desagregado.get(tipo, 0.0) + kwh_mensual, 2)

        detalle_equipos_simulados.append({
            "nombre": eq.get("nombre", f"Equipo {tipo}"),
            "tipo": tipo,
            "cantidad": cantidad,
            "potencia_kw": potencia_kw,
            "horas_dia": horas_dia,
            "factor_carga_calculado": round(factor_carga if tipo in ["aire_acondicionado", "refrigeracion"] else 1.0, 3),
            "kwh_mes": kwh_mensual
        })

    consumo_total_kwh = round(sum(consumo_kwh_desagregado.values()), 2)

    # 2. Facturar con el motor de ENDE DELBENI (AETN 666/2023)
    facturacion = calcular_factura_ende_delbeni(
        consumo_total_kwh,
        aplicar_tarifa_dignidad=aplicar_tarifa_dignidad,
    )

    return {
        "clima_evaluado": clima,
        "consumo_total_kwh": consumo_total_kwh,
        "consumo_desagregado_kwh": consumo_kwh_desagregado,
        "facturacion": facturacion,
        "detalle_equipos": detalle_equipos_simulados
    }
