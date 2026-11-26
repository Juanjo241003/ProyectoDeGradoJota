"""
Prueba unitaria y de integración directa de los endpoints FastAPI (sin socketpair/asyncio)
para validación en entornos sin sockets TCP/loopback.
"""
from backend.routers.simulation_router import (
    health_check,
    listar_escenarios_climaticos,
    listar_catalogo_equipos,
    obtener_tarifa_vigente,
    ejecutar_simulacion,
    listar_hogares_muestra,
    obtener_validacion_mape,
    SimulacionRequest,
    EquipoInput,
)

def main():
    print("1. Probando GET /api/health...", flush=True)
    r1 = health_check()
    assert r1["status"] == "ok"
    print(f"   -> 200 OK | {r1}", flush=True)

    print("2. Probando GET /api/clima/escenarios...", flush=True)
    r2 = listar_escenarios_climaticos()
    assert len(r2) == 12
    print(f"   -> 200 OK | {len(r2)} meses cargados", flush=True)

    print("3. Probando GET /api/equipos/catalogo...", flush=True)
    r3 = listar_catalogo_equipos()
    assert len(r3) == 14
    print(f"   -> 200 OK | {len(r3)} equipos cargados", flush=True)

    print("4. Probando GET /api/tarifas/vigente...", flush=True)
    r4 = obtener_tarifa_vigente()
    assert r4["pliego"]["distribuidora"] == "ENDE DELBENI S.A.M."
    print(f"   -> 200 OK | Distribuidora: {r4['pliego']['distribuidora']} ({len(r4['bloques'])} bloques)", flush=True)

    print("5. Probando POST /api/simulacion/ejecutar...", flush=True)
    req = SimulacionRequest(
        temperatura_celsius=33.5,
        humedad_relativa=78.0,
        equipos=[
            EquipoInput(nombre="Split 12k BTU", tipo="aire_acondicionado", potencia_kw=1.15, horas_dia=8.0),
            EquipoInput(nombre="Heladera", tipo="refrigeracion", potencia_kw=0.18, horas_dia=24.0),
        ],
    )
    r5 = ejecutar_simulacion(req)
    assert r5["consumo_total_kwh"] > 0
    print(f"   -> 200 OK | Consumo: {r5['consumo_total_kwh']} kWh | Total: {r5['facturacion']['total_factura_bs']} Bs", flush=True)

    print("6. Probando GET /api/hogares/muestra...", flush=True)
    r6 = listar_hogares_muestra()
    assert len(r6) == 15
    print(f"   -> 200 OK | {len(r6)} hogares cargados", flush=True)

    print("7. Probando GET /api/validacion/mape...", flush=True)
    r7 = obtener_validacion_mape()
    assert r7["total_hogares_evaluados"] == 15
    print(
        f"   -> 200 OK | Hogares: {r7['total_hogares_evaluados']} | Facturas: {r7['total_facturas_analizadas']} | "
        f"MAPE kWh: {r7['mape_global_kwh']}% | MAPE Bs: {r7['mape_global_facturacion_bs']}%",
        flush=True,
    )

    print("TODAS LAS PRUEBAS DE ENDPOINTS COMPLETADAS CON EXITO.", flush=True)

if __name__ == "__main__":
    main()
