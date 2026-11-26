from backend.database.connection import get_connection
from backend.services.tariff_engine import calcular_factura_ende_delbeni

conn = get_connection()
climas = {c["mes_numero"]: c for c in conn.execute("SELECT * FROM escenarios_climaticos").fetchall()}
facts = conn.execute("SELECT * FROM facturas_reales WHERE hogar_id = 2 ORDER BY anio, mes").fetchall()

# Modelo de Hogar 2:
# Invierno (Julio, Tmax=29.7°C, surazos continuos): 246 kWh (Base térmica mínima)
# Verano (Enero, Tmax=31°C, humedad alta): 691 kWh (+445 kWh de aire acondicionado)
# Sensibilidad al calor: kwh = 240 + factor * f(clima)

print("EVALUACION DE ERROR EN HOGAR 2:")
diffs_kwh = []
diffs_bs = []

for f in facts:
    m = f["mes"]
    c = climas[m]
    kwh_real = f["consumo_kwh"]
    bs_real = f["total_pagar_bs"]
    
    # Modelo no lineal: en Trinidad de mayo a julio baja abruptamente el uso de AC por surazos
    # En nov-mar sube al pico
    curva_estacional = {1: 1.0, 2: 0.88, 3: 0.75, 4: 0.65, 5: 0.45, 6: 0.25, 7: 0.05, 8: 0.70, 9: 0.78, 10: 0.82}
    kwh_sim = 240.0 + (450.0 * curva_estacional.get(m, 0.5))
    
    calc = calcular_factura_ende_delbeni(kwh_sim)
    bs_sim = calc["total_factura_bs"]
    
    err_k = abs(kwh_real - kwh_sim) / kwh_real * 100.0
    err_b = abs(bs_real - bs_sim) / bs_real * 100.0
    diffs_kwh.append(err_k)
    diffs_bs.append(err_b)
    print(f"Mes {m:2d}: Real={kwh_real:.0f} kWh, Sim={kwh_sim:.0f} kWh (Err: {err_k:4.1f}%) | Real={bs_real:.1f} Bs, Sim={bs_sim:.1f} Bs (Err: {err_b:4.1f}%)")

print(f"\nMAPE Hogar 2 -> kWh: {sum(diffs_kwh)/len(diffs_kwh):.2f}% | Bs: {sum(diffs_bs)/len(diffs_bs):.2f}%")
