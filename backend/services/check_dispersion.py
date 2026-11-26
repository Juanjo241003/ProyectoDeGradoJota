from backend.database.connection import get_connection
conn = get_connection()
hogares = conn.execute("SELECT * FROM hogares_muestra").fetchall()
for h in hogares:
    facts = conn.execute("SELECT periodo, consumo_kwh FROM facturas_reales WHERE hogar_id = ? ORDER BY anio, mes", (h['id'],)).fetchall()
    kwhs = [f['consumo_kwh'] for f in facts]
    prom = sum(kwhs) / len(kwhs)
    print(f"{h['alias_hogar']}: min={min(kwhs):.0f}, max={max(kwhs):.0f}, prom={prom:.1f}")
