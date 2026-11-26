from backend.database.connection import get_connection

conn = get_connection()
climas = {c['mes_numero']: c for c in conn.execute('SELECT * FROM escenarios_climaticos').fetchall()}
hogares = conn.execute('SELECT * FROM hogares_muestra').fetchall()

def linear_regression(x, y):
    n = len(x)
    sx = sum(x)
    sy = sum(y)
    sxx = sum(xi*xi for xi in x)
    sxy = sum(xi*yi for xi, yi in zip(x, y))
    denom = (n * sxx - sx * sx)
    if abs(denom) < 1e-9:
        return sy / n, 0.0
    beta = (n * sxy - sx * sy) / denom
    alpha = (sy - beta * sx) / n
    return alpha, beta

mapes = []
for h in hogares:
    facts = conn.execute('SELECT mes, anio, consumo_kwh, total_pagar_bs FROM facturas_reales WHERE hogar_id = ? ORDER BY anio, mes', (h['id'],)).fetchall()
    kwhs = [f['consumo_kwh'] for f in facts]
    deltas = [max(0.0, climas[f['mes']]['temp_max_media'] - 24.0) for f in facts]
    alpha, beta = linear_regression(deltas, kwhs)
    preds = [max(5.0, alpha + beta * d) for d in deltas]
    errors = [abs(real - p) / max(1.0, real) * 100.0 for real, p in zip(kwhs, preds)]
    m = sum(errors) / len(errors)
    mapes.append(m)
    alias = h['alias_hogar']
    print(f"{alias}: Base={alpha:.1f} kWh, Sensibilidad={beta:.1f} kWh/C, MAPE={m:.2f}%")

promedio = sum(mapes) / len(mapes)
print(f"=== MAPE PROMEDIO GLOBAL CALIBRADO: {promedio:.2f}% ===")
