"""
Esquema DDL de Base de Datos Relacional (SQLite / PostgreSQL compatible)
Sistema Web para la Simulación del Consumo Eléctrico Domiciliario - Trinidad
Basado en: AETN N° 666/2023, Climatología SENAMHI/WeatherSpark y Muestra de 15 Hogares
"""

DDL_SCHEMA = """
-- 1. Tabla de Pliegos Tarifarios Generales
CREATE TABLE IF NOT EXISTS pliegos_tarifarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_resolucion TEXT NOT NULL,
    distribuidora TEXT NOT NULL,
    categoria TEXT NOT NULL,
    cargo_minimo_bs REAL NOT NULL,
    limite_cargo_minimo_kwh REAL NOT NULL DEFAULT 20.0,
    factor_indexacion REAL NOT NULL DEFAULT 1.133,
    aplica_tarifa_dignidad INTEGER NOT NULL DEFAULT 0,
    limite_tarifa_dignidad_kwh REAL NOT NULL DEFAULT 70.0,
    descuento_tarifa_dignidad_porc REAL NOT NULL DEFAULT 25.0,
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
);

-- 2. Tabla de Bloques de Consumo Escalonados
CREATE TABLE IF NOT EXISTS tarifas_bloques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pliego_id INTEGER NOT NULL,
    numero_bloque INTEGER NOT NULL,
    nombre_bloque TEXT NOT NULL,
    kwh_desde REAL NOT NULL,
    kwh_hasta REAL, -- NULL representa sin límite superior
    costo_kwh_bs REAL NOT NULL,
    FOREIGN KEY (pliego_id) REFERENCES pliegos_tarifarios(id) ON DELETE CASCADE
);

-- 3. Tabla de Tasas Municipales Complementarias (Trinidad)
CREATE TABLE IF NOT EXISTS tasas_municipales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pliego_id INTEGER NOT NULL,
    tasa_alumbrado_porc REAL NOT NULL DEFAULT 13.82,
    tasa_aseo_fija_bs REAL NOT NULL DEFAULT 40.0,
    vigente INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (pliego_id) REFERENCES pliegos_tarifarios(id) ON DELETE CASCADE
);

-- 3b. Escala Municipal de Aseo Urbano por Tramos de Consumo (16 tramos)
CREATE TABLE IF NOT EXISTS tramos_aseo_urbano (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pliego_id INTEGER NOT NULL,
    orden INTEGER NOT NULL,
    kwh_desde REAL NOT NULL,
    kwh_hasta REAL, -- NULL representa sin límite superior (> 1000 kWh)
    monto_bs REAL NOT NULL,
    FOREIGN KEY (pliego_id) REFERENCES pliegos_tarifarios(id) ON DELETE CASCADE
);

-- 4. Tabla de Escenarios Climatológicos de Trinidad
CREATE TABLE IF NOT EXISTS escenarios_climaticos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes_nombre TEXT NOT NULL,
    mes_numero INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    temp_max_media REAL NOT NULL,
    temp_media REAL NOT NULL,
    temp_min_media REAL NOT NULL,
    temp_extrema_max REAL NOT NULL,
    humedad_relativa_prom REAL NOT NULL,
    sensacion_termica_max REAL NOT NULL,
    categoria_estacional TEXT NOT NULL, -- 'Calor Extremo', 'Verano Humedo', 'Transicion', 'Invierno/Surazo'
    descripcion TEXT
);

-- 5. Catálogo de Equipos y Climatización
CREATE TABLE IF NOT EXISTS equipos_catalogo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'aire_acondicionado', 'refrigeracion', 'ventilacion', 'base'
    capacidad_btu INTEGER,
    potencia_nominal_kw REAL NOT NULL,
    tecnologia TEXT NOT NULL DEFAULT 'Convencional', -- 'Convencional', 'Inverter'
    cop_eficiencia REAL NOT NULL DEFAULT 2.8,
    temperatura_confort_defecto REAL NOT NULL DEFAULT 24.0,
    descripcion TEXT
);

-- 6. Hogares de la Muestra Empírica (15 Hogares anonimizados)
CREATE TABLE IF NOT EXISTS hogares_muestra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_medidor TEXT NOT NULL UNIQUE,
    alias_hogar TEXT NOT NULL,
    zona_barrio TEXT NOT NULL,
    categoria_consumo TEXT NOT NULL, -- 'Bajo (<100)', 'Medio (100-400)', 'Alto (>400)'
    perfil_equipamiento_estimado TEXT
);

-- 7. Facturas Reales Recolectadas (150 registros empíricos)
CREATE TABLE IF NOT EXISTS facturas_reales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hogar_id INTEGER NOT NULL,
    periodo TEXT NOT NULL, -- 'MM/AAAA'
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    consumo_kwh REAL NOT NULL,
    venta_energia_bs REAL NOT NULL,
    alumbrado_bs REAL NOT NULL,
    aseo_bs REAL NOT NULL,
    total_pagar_bs REAL NOT NULL,
    fecha_lectura_anterior TEXT,
    fecha_lectura_actual TEXT,
    dias_facturados INTEGER DEFAULT 30,
    FOREIGN KEY (hogar_id) REFERENCES hogares_muestra(id) ON DELETE CASCADE
);

-- 8. Registro de Simulaciones de Usuario
CREATE TABLE IF NOT EXISTS simulaciones_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    nombre_simulacion TEXT,
    temperatura_ambiente REAL NOT NULL,
    humedad_relativa REAL NOT NULL,
    sensacion_termica_calculada REAL NOT NULL,
    consumo_total_kwh REAL NOT NULL,
    costo_energia_bs REAL NOT NULL,
    cargos_fijos_tasas_bs REAL NOT NULL,
    costo_total_bs REAL NOT NULL,
    bloque_tarifario_alcanzado TEXT NOT NULL,
    salto_bloque_detectado INTEGER NOT NULL DEFAULT 0,
    tarifa_dignidad_aplicada INTEGER NOT NULL DEFAULT 0,
    detalle_json TEXT NOT NULL
);
"""
