# CONTEXTO DE TRASPASO Y REGLAS DE VALIDACIÓN (PROYECTO DE GRADO)

## 1. Estado actual verificado
- **Motor tarifario (`tariff_engine.py`):** Validado y parametrizado en SQLite (factor de indexación 1.133, alumbrado 13.82%, 16 tramos de aseo urbano, Tarifa Dignidad opcional `bool = False`). MAPE Total Pagar = 2.62% sobre las 150 facturas reales.
- **Integración (`validation_service.py`):** Ya se eliminó la regresión lineal (`STRESS_INDEX_TRINIDAD`), se conectó `simular_consumo_hogar()` y se corrigió `conclusion_cientifica` para ser dinámica.
- **Problema pendiente de resolver (prioridad antes del Frontend):**
  1. `simulation_engine.py` satura el ciclo de trabajo del compresor al 100% casi todo el año por usar `temp_max_media` en la ecuación de Rothfusz.
  2. `_perfil_equipos_fijo_por_mediana()` distorsiona el consumo y dispara el MAPE depurado a 56.50%.
  3. La regla de atipicidad (`mediana_hogar >= 100`) no detectó la desocupación del Hogar 01 (mediana 50.0 kWh con meses de 3–35 kWh frente a picos >360 kWh).

## 2. Estrategia metodológica obligatoria (Validación en 2 Niveles)
NO inventar encuestas de campo ni sobreajustar parámetros mes a mes. Aplicar estrictamente:
- **Nivel 1 — Validación Física Directa (1 Hogar Piloto con inventario real):** Usar el inventario real detallado abajo (verificar si corresponde al Hogar 04 - Medidor115).
- **Nivel 2 — Validación Extensiva (14 hogares restantes sin encuesta):** Identificar un único perfil técnico equivalente fijo por hogar (carga base + capacidad equivalente de climatización) constante durante los 10 meses, evaluado exclusivamente mediante el motor físico de Rothfusz y el pliego AETN N° 666/2023.
- **Transparencia:** Mantener las 150 facturas visibles. Reportar siempre MAPE Bruto (150 facturas) y MAPE Depurado con un criterio estadístico formal uniforme para meses de vivienda desocupada (por ejemplo, caída relativa respecto al percentil 75 del hogar).

## 3. Inventario real preliminar del Hogar Piloto (presunto Hogar 04 - Medidor115)
- **Estabilidad:** Sin viajes, sin cambios de ocupación y sin compra de equipos nuevos en el último año.
- **Climatización (6 A/C instalados; 4 de uso diario en meses calurosos):**
  - 2 aires acondicionados: ~18 h/día.
  - 2 aires acondicionados: ~10–12 h/día.
  - 2 aires acondicionados adicionales: uso mínimo/ocasional.
  - *Pendiente de confirmar con fotos de etiquetas técnicas:* capacidad en BTU, potencia nominal (W) y tecnología (Inverter vs. On/Off) de los 4 equipos diarios, más reducción de horas en surazos.
- **Refrigeración (24/7):** 1 heladera Samsung moderna de 1 puerta (Inverter) + 1 frigobar.
- **Cargas térmicas y agua:**
  - 2 duchas eléctricas (1 uso diario, 1 día por medio; *pendiente confirmar minutos totales/día*).
  - Cocina a gas GLP (consumo eléctrico despreciable; NO es de inducción).
  - 1 bomba de agua eléctrica domiciliaria (modelar con estándar 0.5–1 HP).
- **Electrónica, iluminación y electrodomésticos:**
  - 1 PC de escritorio (~6 h/día) + 1 monitor + 1 laptop principal (~6–7 h/día).
  - 3 laptops adicionales (uso casi nulo).
  - 1 PlayStation 5 (~2 h/día).
  - 3 TVs: 65" (~1 h/día), 50" (~6 h/día), 30" (~3–5 h/día).
  - 1 lavadora (4 ciclos/semana), 1 microondas (1 vez/semana, ~20–30 min).
  - ~20 focos LED (~5–6 h/día), 3 routers Wi-Fi (24/7), 1 Alexa (24/7).

## 4. Restricciones técnicas
- Mantener el sistema 100% funcional en modo local (FastAPI + SQLite + React) sin dependencias de internet para la defensa.
- No avanzar al Frontend en React hasta corregir `simulation_engine.py` y revisar los resultados del nuevo MAPE.