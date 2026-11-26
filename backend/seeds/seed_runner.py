"""
Poblador de Base de Datos (Seeds) con Datos Reales y Oficiales:
1. Resolución AETN N° 666/2023 (ENDE DELBENI S.A.M.)
2. Climatología Oficial de Trinidad 2025-2026 (SENAMHI / WeatherSpark)
3. Catálogo de Equipos de Climatización y Cargas Residenciales
4. Muestra Empírica de 15 Hogares y 150 Facturas Reales de Trinidad
"""
import json
import os
import sqlite3
from backend.database.connection import get_connection, init_db

FACTURAS_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "facturas",
    "facturas_150_dataset.json"
)

TRAMOS_ASEO_DEFAULT = [
    (1, 0.0, 50.0, 5.0),
    (2, 51.0, 100.0, 10.0),
    (3, 101.0, 150.0, 18.0),
    (4, 151.0, 200.0, 20.0),
    (5, 201.0, 250.0, 25.0),
    (6, 251.0, 300.0, 30.0),
    (7, 301.0, 350.0, 35.0),
    (8, 351.0, 400.0, 40.0),
    (9, 401.0, 450.0, 45.0),
    (10, 451.0, 500.0, 50.0),
    (11, 501.0, 600.0, 60.0),
    (12, 601.0, 700.0, 70.0),
    (13, 701.0, 800.0, 80.0),
    (14, 801.0, 900.0, 90.0),
    (15, 901.0, 1000.0, 100.0),
    (16, 1001.0, None, 150.0),
]

def seed_tarifas(conn):
    cursor = conn.cursor()
    # Migración idempotente si la tabla ya existía sin factor_indexacion
    cols = [r[1] for r in cursor.execute("PRAGMA table_info(pliegos_tarifarios)").fetchall()]
    if "factor_indexacion" not in cols:
        cursor.execute("ALTER TABLE pliegos_tarifarios ADD COLUMN factor_indexacion REAL NOT NULL DEFAULT 1.133")

    cursor.execute("SELECT id FROM pliegos_tarifarios WHERE codigo_resolucion = 'AETN-R-0666/2023'")
    row = cursor.fetchone()
    if row:
        pliego_id = row[0]
        cursor.execute("UPDATE pliegos_tarifarios SET factor_indexacion = 1.133, aplica_tarifa_dignidad = 0 WHERE id = ?", (pliego_id,))
        cursor.execute("UPDATE tasas_municipales SET tasa_alumbrado_porc = 13.82 WHERE pliego_id = ?", (pliego_id,))
        if cursor.execute("SELECT COUNT(*) FROM tramos_aseo_urbano WHERE pliego_id = ?", (pliego_id,)).fetchone()[0] == 0:
            cursor.executemany(
                "INSERT INTO tramos_aseo_urbano (pliego_id, orden, kwh_desde, kwh_hasta, monto_bs) VALUES (?, ?, ?, ?, ?)",
                [(pliego_id, o, d, h, m) for o, d, h, m in TRAMOS_ASEO_DEFAULT]
            )
        return

    # 1. Insertar Pliego Principal ENDE DELBENI
    cursor.execute("""
        INSERT INTO pliegos_tarifarios (
            codigo_resolucion, distribuidora, categoria, cargo_minimo_bs,
            limite_cargo_minimo_kwh, factor_indexacion, aplica_tarifa_dignidad,
            limite_tarifa_dignidad_kwh, descuento_tarifa_dignidad_porc,
            vigente_desde, vigente_hasta, activo
        ) VALUES (
            'AETN-R-0666/2023', 'ENDE DELBENI S.A.M.', 'DOMICILIARIA', 12.251,
            20.0, 1.133, 0, 70.0, 25.0, '2023-11-01', '2027-10-31', 1
        )
    """)
    pliego_id = cursor.lastrowid

    # 2. Insertar Bloques Escalonados (Anexo 2, Pág. 35)
    bloques = [
        (pliego_id, 1, "Cargo variable 1 (21 - 100 kWh)", 21.0, 100.0, 0.712),
        (pliego_id, 2, "Cargo variable 2 (101 - 200 kWh)", 101.0, 200.0, 0.827),
        (pliego_id, 3, "Cargo variable 3 (201 - 500 kWh)", 201.0, 500.0, 0.994),
        (pliego_id, 4, "Cargo variable 4 (501 - 1000 kWh)", 501.0, 1000.0, 0.994),
        (pliego_id, 5, "Cargo variable 5 (> 1000 kWh)", 1001.0, None, 1.289)
    ]
    cursor.executemany("""
        INSERT INTO tarifas_bloques (pliego_id, numero_bloque, nombre_bloque, kwh_desde, kwh_hasta, costo_kwh_bs)
        VALUES (?, ?, ?, ?, ?, ?)
    """, bloques)

    # 3. Tasas Municipales Complementarias (Trinidad)
    cursor.execute("""
        INSERT INTO tasas_municipales (pliego_id, tasa_alumbrado_porc, tasa_aseo_fija_bs, vigente)
        VALUES (?, 13.82, 40.0, 1)
    """, (pliego_id,))

    # 4. Tramos de Aseo Urbano (16 tramos)
    cursor.executemany(
        "INSERT INTO tramos_aseo_urbano (pliego_id, orden, kwh_desde, kwh_hasta, monto_bs) VALUES (?, ?, ?, ?, ?)",
        [(pliego_id, o, d, h, m) for o, d, h, m in TRAMOS_ASEO_DEFAULT]
    )

def seed_climatologia(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM escenarios_climaticos")
    if cursor.fetchone()[0] > 0:
        return

    # Datos oficiales consolidados de Trinidad (2025 - 2026)
    meses_data = [
        ("Enero", 1, 2026, 31.0, 27.7, 24.3, 34.0, 79.3, 35.8, "Verano Humedo", "Mes caluroso con alta saturación de humedad (100% horas bochornosas)."),
        ("Febrero", 2, 2026, 31.6, 27.9, 24.2, 34.0, 78.4, 36.4, "Verano Humedo", "Mes de altas temperaturas continuas con demanda elevada de climatización nocturna."),
        ("Marzo", 3, 2026, 30.2, 27.1, 23.9, 33.0, 81.7, 34.8, "Verano Humedo", "Alta humedad relativa promedio y sensación térmica sostenida."),
        ("Abril", 4, 2026, 30.6, 27.3, 24.0, 33.0, 78.3, 35.0, "Transicion", "Fin del periodo húmedo y transición hacia los primeros frentes fríos."),
        ("Mayo", 5, 2026, 27.5, 23.4, 19.4, 34.0, 74.0, 28.5, "Invierno/Surazo", "Entrada de surazos térmicos con caídas abruptas de temperatura (mínima 14°C)."),
        ("Junio", 6, 2026, 27.5, 23.4, 19.2, 33.0, 75.0, 28.2, "Invierno/Surazo", "Mes más frío del año en Trinidad con mínima extrema de 11°C. Uso mínimo de A/C."),
        ("Julio", 7, 2026, 29.7, 25.0, 20.3, 34.0, 73.0, 30.5, "Invierno/Surazo", "Alternancia entre días frescos de surazo y días de reactivación térmica."),
        ("Agosto", 8, 2026, 32.0, 26.5, 21.0, 37.0, 68.0, 34.0, "Transicion", "Comienzo de vientos cálidos y baja temporal de humedad relativa."),
        ("Septiembre", 9, 2026, 32.0, 26.7, 21.4, 37.0, 70.0, 35.2, "Calor Extremo", "Intensificación de radiación solar y aumento de carga térmica en techos y muros."),
        ("Octubre", 10, 2026, 31.4, 26.7, 22.1, 37.0, 74.0, 36.0, "Calor Extremo", "Mes crítico de reactivación generalizada de climatización (91.4% bochornoso)."),
        ("Noviembre", 11, 2026, 35.3, 30.0, 24.7, 38.0, 72.4, 42.5, "Calor Extremo", "Pico térmico anual histórico en Trinidad. Horas compresor de A/C al máximo."),
        ("Diciembre", 12, 2025, 30.2, 27.0, 23.7, 34.0, 80.0, 35.5, "Verano Humedo", "Verano amazónico húmedo con uso intensivo continuado de electrodomésticos.")
    ]

    cursor.executemany("""
        INSERT INTO escenarios_climaticos (
            mes_nombre, mes_numero, anio, temp_max_media, temp_media, temp_min_media,
            temp_extrema_max, humedad_relativa_prom, sensacion_termica_max,
            categoria_estacional, descripcion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, meses_data)

def seed_catalogo_equipos(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM equipos_catalogo")
    if cursor.fetchone()[0] > 0:
        return

    equipos = [
        ("Aire Acondicionado 9.000 BTU (Convencional)", "aire_acondicionado", 9000, 0.85, "Convencional", 2.8, 24.0, "Apto para habitaciones pequeñas (hasta 12 m²). Compresor On/Off."),
        ("Aire Acondicionado 9.000 BTU (Inverter)", "aire_acondicionado", 9000, 0.65, "Inverter", 3.6, 24.0, "Alta eficiencia con modulación de compresor. Reduce consumo en régimen estacionario."),
        ("Aire Acondicionado 12.000 BTU (Convencional)", "aire_acondicionado", 12000, 1.15, "Convencional", 2.8, 24.0, "Capacidad estándar más común en dormitorios trinitarios (hasta 16 m²)."),
        ("Aire Acondicionado 12.000 BTU (Inverter)", "aire_acondicionado", 12000, 0.88, "Inverter", 3.8, 24.0, "Inverter estándar de alta eficiencia con ahorro estimado del 30-40%."),
        ("Aire Acondicionado 18.000 BTU (Convencional)", "aire_acondicionado", 18000, 1.80, "Convencional", 2.7, 24.0, "Para salas medianas y oficinas (hasta 25 m²). Alto consumo en arranques."),
        ("Aire Acondicionado 18.000 BTU (Inverter)", "aire_acondicionado", 18000, 1.35, "Inverter", 3.5, 24.0, "Eficiente para espacios amplios."),
        ("Aire Acondicionado 24.000 BTU (Convencional)", "aire_acondicionado", 24000, 2.35, "Convencional", 2.6, 24.0, "Para salas amplias y áreas integradas. Genera altos saltos de bloque tarifario."),
        ("Aire Acondicionado 24.000 BTU (Inverter)", "aire_acondicionado", 24000, 1.80, "Inverter", 3.4, 24.0, "Inverter de gran capacidad para espacios sociales."),
        ("Refrigerador Domiciliario Mediano (250-300 L)", "refrigeracion", None, 0.18, "Convencional", 2.5, 4.0, "Ciclo de trabajo influenciado directamente por temperatura ambiental."),
        ("Freezer / Congelador Horizontal", "refrigeracion", None, 0.25, "Convencional", 2.4, -18.0, "Aparato de congelación continua común en hogares del oriente boliviano."),
        ("Ventilador de Techo", "ventilacion", None, 0.075, "Convencional", 1.0, 24.0, "Potencia promedio de 75W operando en velocidades 2-3."),
        ("Ventilador de Pie / Pedestal", "ventilacion", None, 0.055, "Convencional", 1.0, 24.0, "Potencia promedio de 55W."),
        ("Carga Base Hogar Básico (Iluminación LED + TV + Router)", "base", None, 0.08, "Convencional", 1.0, 24.0, "Consumo no climatológico residual para hogares de 1-2 personas."),
        ("Carga Base Hogar Estándar (Iluminación + 2 TV + Lavadora + PC)", "base", None, 0.18, "Convencional", 1.0, 24.0, "Consumo base residual para familias típicas trinitarias.")
    ]

    cursor.executemany("""
        INSERT INTO equipos_catalogo (
            nombre, tipo, capacidad_btu, potencia_nominal_kw, tecnologia,
            cop_eficiencia, temperatura_confort_defecto, descripcion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, equipos)

def seed_hogares_y_facturas(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM facturas_reales")
    if cursor.fetchone()[0] > 0:
        return

    if not os.path.exists(FACTURAS_JSON_PATH):
        print(f"Advertencia: No se encontró {FACTURAS_JSON_PATH}")
        return

    with open(FACTURAS_JSON_PATH, "r", encoding="utf-8") as f:
        facturas_data = json.load(f)

    # Agrupar facturas por carpeta de medidor
    carpetas = {}
    for item in facturas_data:
        c = item["carpeta"]
        if c not in carpetas:
            carpetas[c] = []
        carpetas[c].append(item)

    # Clasificar hogares y guardarlos
    hogar_id_map = {}
    alias_contador = 1

    for carpeta, facts in sorted(carpetas.items()):
        promedio_kwh = sum(x["consumo_kwh"] for x in facts) / len(facts)
        if promedio_kwh < 100:
            categoria = "Bajo (<100)"
            perfil = "Sin A/C, ventiladores e iluminación básica. Hogar elegible para Tarifa Dignidad."
        elif promedio_kwh <= 400:
            categoria = "Medio (100-400)"
            perfil = "1 A/C de 9.000 a 12.000 BTU de uso nocturno + 1 refrigerador + ventiladores."
        else:
            categoria = "Alto (>400)"
            perfil = "2 o más A/C (12.000 a 24.000 BTU) de uso diurno/nocturno + congelador."

        medidor_raw = facts[0].get("medidor", carpeta)
        cursor.execute("""
            INSERT INTO hogares_muestra (codigo_medidor, alias_hogar, zona_barrio, categoria_consumo, perfil_equipamiento_estimado)
            VALUES (?, ?, ?, ?, ?)
        """, (carpeta, f"Hogar Muestra {alias_contador:02d}", "Área Urbana Trinidad", categoria, perfil))
        hogar_id_map[carpeta] = cursor.lastrowid
        alias_contador += 1

    # Insertar las 150 facturas
    facturas_insert = []
    for item in facturas_data:
        h_id = hogar_id_map[item["carpeta"]]
        periodo = item.get("periodo", "1/2026")
        try:
            partes = periodo.split("/")
            mes = int(partes[0])
            anio = int(partes[1])
        except Exception:
            mes = 1
            anio = 2026

        facturas_insert.append((
            h_id,
            periodo,
            mes,
            anio,
            float(item.get("consumo_kwh", 0.0)),
            float(item.get("venta_energia_bs", 0.0)),
            float(item.get("alumbrado_bs", 0.0)),
            float(item.get("aseo_bs", 0.0)),
            float(item.get("total_pagar_bs", 0.0))
        ))

    cursor.executemany("""
        INSERT INTO facturas_reales (
            hogar_id, periodo, mes, anio, consumo_kwh,
            venta_energia_bs, alumbrado_bs, aseo_bs, total_pagar_bs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, facturas_insert)

def run_all_seeds():
    init_db()
    conn = get_connection()
    try:
        seed_tarifas(conn)
        seed_climatologia(conn)
        seed_catalogo_equipos(conn)
        seed_hogares_y_facturas(conn)
        conn.commit()
        print("Población de datos iniciales completada exitosamente.")
    finally:
        conn.close()

if __name__ == "__main__":
    run_all_seeds()
