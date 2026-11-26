from backend.services.validation_service import ejecutar_validacion_cientifica_mape

r = ejecutar_validacion_cientifica_mape()
print("=== RESULTADOS GLOBALES DE LA TESIS ===")
print("Total Hogares Analizados:", r["total_hogares_evaluados"])
print("Total Facturas Reales:", r["total_facturas_analizadas"])
print(f"MAPE Global Demanda Fisica (kWh): {r['mape_global_kwh']}%")
print(f"MAPE Global Facturacion Monetaria (Bs): {r['mape_global_facturacion_bs']}%")
print("HIPOTESIS H1 COMPROBADA (<10%):", r["hipotesis_h1_verificada"])
print("\nConclusion:")
print(r["conclusion_cientifica"])

print("\n--- Desglose por Hogar ---")
for h in r["hogares"]:
    print(f"{h['alias']} ({h['codigo_medidor']}): Q_base={h['q_base_kwh']} kWh, Q_clima={h['q_climatica_kwh']} kWh | Error kWh={h['mape_kwh']}% | Error Bs={h['mape_bs']}%")
