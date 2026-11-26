"""
Motor de Cálculo Tarifario Escalonado - Normativa ENDE DELBENI S.A.M.
Lee dinámicamente desde SQLite:
1. Estructura Base de Resolución AETN N° 666/2023 (pliegos_tarifarios y tarifas_bloques).
2. Factor de indexación comercial vigente (Art. Tercero / Anexo 3).
3. Porcentaje de Alumbrado Público (tasas_municipales) y 16 tramos de Aseo Urbano (tramos_aseo_urbano).
"""
from typing import Dict, Any, Optional
from backend.database.connection import get_connection


def calcular_aseo_urbano_trinidad(consumo_kwh: float, tramos: list) -> float:
    for t in tramos:
        kwh_hasta = t["kwh_hasta"]
        if kwh_hasta is None or consumo_kwh <= float(kwh_hasta):
            return float(t["monto_bs"])
    return float(tramos[-1]["monto_bs"]) if tramos else 150.0


def calcular_factura_ende_delbeni(
    consumo_kwh: float,
    pliego_id: Optional[int] = None,
    aplicar_tarifa_dignidad: Optional[bool] = None,
    factor_indexacion: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Calcula la facturación mensual para la categoría domiciliaria en Trinidad
    leyendo los parámetros vigentes desde la base de datos.
    """
    consumo_kwh = max(0.0, float(consumo_kwh))

    conn = get_connection()
    try:
        if pliego_id is None:
            pliego = conn.execute("SELECT * FROM pliegos_tarifarios WHERE activo = 1 LIMIT 1").fetchone()
        else:
            pliego = conn.execute("SELECT * FROM pliegos_tarifarios WHERE id = ?", (pliego_id,)).fetchone()

        if not pliego:
            raise ValueError("No se encontró un pliego tarifario activo en la base de datos.")

        p_id = pliego["id"]
        idx = float(factor_indexacion) if factor_indexacion is not None else float(pliego["factor_indexacion"])
        cargo_minimo_base = float(pliego["cargo_minimo_bs"])
        cargo_minimo_bs = round(cargo_minimo_base * idx, 3)
        limite_cargo_minimo_kwh = float(pliego["limite_cargo_minimo_kwh"])

        usa_dignidad = bool(aplicar_tarifa_dignidad) if aplicar_tarifa_dignidad is not None else bool(pliego["aplica_tarifa_dignidad"])
        limite_tarifa_dignidad_kwh = float(pliego["limite_tarifa_dignidad_kwh"])
        descuento_dignidad_porc = float(pliego["descuento_tarifa_dignidad_porc"])

        bloques_db = conn.execute(
            "SELECT * FROM tarifas_bloques WHERE pliego_id = ? ORDER BY numero_bloque ASC",
            (p_id,)
        ).fetchall()

        tasas_db = conn.execute(
            "SELECT * FROM tasas_municipales WHERE pliego_id = ? AND vigente = 1 LIMIT 1",
            (p_id,)
        ).fetchone()
        tasa_alumbrado_porc = float(tasas_db["tasa_alumbrado_porc"]) if tasas_db else 13.82

        tramos_aseo = conn.execute(
            "SELECT * FROM tramos_aseo_urbano WHERE pliego_id = ? ORDER BY orden ASC",
            (p_id,)
        ).fetchall()
    finally:
        conn.close()

    desglose_bloques = []
    energia_neta_bs = 0.0

    if consumo_kwh <= limite_cargo_minimo_kwh:
        energia_neta_bs = cargo_minimo_bs
        bloque_actual_nombre = f"Cargo mínimo (0 - {limite_cargo_minimo_kwh:.0f} kWh)"
        desglose_bloques.append({
            "bloque": bloque_actual_nombre,
            "kwh_en_bloque": round(consumo_kwh, 2),
            "tarifa_bs_kwh": round(cargo_minimo_bs / max(1.0, consumo_kwh), 3),
            "subtotal_bs": round(cargo_minimo_bs, 2)
        })
    else:
        energia_neta_bs = cargo_minimo_bs
        desglose_bloques.append({
            "bloque": f"Cargo mínimo (primeros {limite_cargo_minimo_kwh:.0f} kWh)",
            "kwh_en_bloque": limite_cargo_minimo_kwh,
            "tarifa_bs_kwh": round(cargo_minimo_bs / limite_cargo_minimo_kwh, 3),
            "subtotal_bs": round(cargo_minimo_bs, 2)
        })

        kwh_restantes = consumo_kwh - limite_cargo_minimo_kwh
        bloque_actual_nombre = "Cargo mínimo"

        for b in bloques_db:
            if kwh_restantes <= 0:
                break
            kwh_desde = float(b["kwh_desde"])
            kwh_hasta = float(b["kwh_hasta"]) if b["kwh_hasta"] is not None else float("inf")
            capacidad_b = (kwh_hasta - kwh_desde + 1.0) if kwh_hasta != float("inf") else float("inf")
            tarifa_b = round(float(b["costo_kwh_bs"]) * idx, 4)
            nombre_b = b["nombre_bloque"]

            bloque_actual_nombre = nombre_b
            kwh_tramo = min(kwh_restantes, capacidad_b)
            subtotal_tramo = kwh_tramo * tarifa_b
            energia_neta_bs += subtotal_tramo
            kwh_restantes -= kwh_tramo

            desglose_bloques.append({
                "bloque": nombre_b,
                "kwh_en_bloque": round(kwh_tramo, 2),
                "tarifa_bs_kwh": round(tarifa_b, 3),
                "subtotal_bs": round(subtotal_tramo, 2)
            })

    # Tarifa Dignidad: Subsidio del 25% solo si aplica al usuario y consumo <= 70 kWh
    descuento_dignidad_bs = 0.0
    es_elegible_dignidad = consumo_kwh <= limite_tarifa_dignidad_kwh
    if usa_dignidad and es_elegible_dignidad:
        descuento_dignidad_bs = round(energia_neta_bs * (descuento_dignidad_porc / 100.0), 2)

    energia_facturada_bs = round(energia_neta_bs - descuento_dignidad_bs, 2)

    # Tasas municipales locales parametrizadas en BD
    alumbrado_bs = round(energia_facturada_bs * (tasa_alumbrado_porc / 100.0), 2)
    aseo_bs = round(calcular_aseo_urbano_trinidad(consumo_kwh, tramos_aseo), 2)
    total_factura_bs = round(energia_facturada_bs + alumbrado_bs + aseo_bs, 2)

    advertencia_salto = None
    if 70.0 < consumo_kwh <= 100.0:
        advertencia_salto = "Ha superado el umbral de la Tarifa Dignidad (70 kWh)."
    elif 100.0 < consumo_kwh <= 130.0:
        advertencia_salto = "Ingresó al Bloque 2 (101-200 kWh). La tarifa marginal subió respecto al Bloque 1."
    elif 200.0 < consumo_kwh <= 250.0:
        advertencia_salto = "¡Alerta de Salto Crítico! Ingresó al Bloque 3 (>200 kWh), donde el costo por kWh aumenta significativamente."
    elif 500.0 < consumo_kwh <= 1000.0:
        advertencia_salto = "Consumo Elevado (501-1000 kWh). Se encuentra en el tramo superior residencial."
    elif consumo_kwh > 1000.0:
        advertencia_salto = "Consumo Extremo (>1000 kWh). Aplica el Cargo Variable 5 (tarifa máxima)."

    return {
        "consumo_kwh": round(consumo_kwh, 2),
        "factor_indexacion_aplicado": idx,
        "energia_neta_bs": round(energia_neta_bs, 2),
        "es_elegible_tarifa_dignidad": es_elegible_dignidad,
        "descuento_tarifa_dignidad_bs": descuento_dignidad_bs,
        "energia_facturada_bs": energia_facturada_bs,
        "alumbrado_publico_bs": alumbrado_bs,
        "aseo_urbano_bs": aseo_bs,
        "total_factura_bs": total_factura_bs,
        "bloque_alcanzado": bloque_actual_nombre,
        "advertencia_salto_bloque": advertencia_salto,
        "desglose_por_bloques": desglose_bloques
    }
