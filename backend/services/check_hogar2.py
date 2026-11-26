from backend.database.connection import get_connection

conn = get_connection()
climas = {c["mes_numero"]: c for c in conn.execute("SELECT * FROM escenarios_climaticos").fetchall()}
facts = conn.execute("SELECT hogar_id, mes, anio, consumo_kwh, total_pagar_bs FROM facturas_reales WHERE hogar_id = 2 ORDER BY anio, mes").fetchall()

print("HOGAR 2 (Medidor1111):")
for f in facts:
    m = f["mes"]
    c = climas[m]
    print(f"Mes {m:2d} ({c['mes_nombre']:10}) | Tmax: {c['temp_max_media']:4.1f}°C | Real: {f['consumo_kwh']:5.1f} kWh | {f['total_pagar_bs']:6.1f} Bs")
