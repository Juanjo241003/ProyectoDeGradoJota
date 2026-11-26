export interface EscenarioClimatico {
  id: number;
  mes_nombre: string;
  mes_numero: number;
  anio: number;
  temp_max_media: number;
  temp_media: number;
  temp_min_media: number;
  temp_extrema_max: number;
  humedad_relativa_prom: number;
  sensacion_termica_max: number;
  categoria_estacional: string;
  descripcion: string;
}

export interface EquipoCatalogo {
  id: number;
  nombre: string;
  tipo: 'aire_acondicionado' | 'refrigeracion' | 'ventilacion' | 'base';
  capacidad_btu: number | null;
  potencia_nominal_kw: number;
  tecnologia: 'Convencional' | 'Inverter';
  cop_eficiencia: number;
  temperatura_confort_defecto: number;
  descripcion: string;
}

export interface EquipoUsuario {
  uid: string;
  nombre: string;
  tipo: 'aire_acondicionado' | 'refrigeracion' | 'ventilacion' | 'base';
  cantidad: number;
  potencia_kw: number;
  tecnologia: 'Convencional' | 'Inverter';
  horas_dia: number;
  temp_setpoint: number;
}

export interface SimulacionResponse {
  clima_evaluado: {
    temperatura_aire_c: number;
    humedad_relativa_porc: number;
    sensacion_termica_c: number;
    nivel_riesgo: string;
    efecto_fisiologico: string;
  };
  consumo_total_kwh: number;
  consumo_desagregado_kwh: {
    aire_acondicionado: number;
    refrigeracion: number;
    ventilacion: number;
    base: number;
  };
  facturacion: {
    consumo_kwh: number;
    factor_indexacion_aplicado: number;
    energia_neta_bs: number;
    es_elegible_tarifa_dignidad: boolean;
    descuento_tarifa_dignidad_bs: number;
    energia_facturada_bs: number;
    alumbrado_publico_bs: number;
    aseo_urbano_bs: number;
    total_factura_bs: number;
    bloque_alcanzado: string;
    advertencia_salto_bloque: string | null;
    desglose_por_bloques: Array<{
      bloque: string;
      kwh_en_bloque: number;
      tarifa_bs_kwh: number;
      subtotal_bs: number;
    }>;
  };
  detalle_equipos: Array<{
    nombre: string;
    tipo: string;
    cantidad: number;
    potencia_kw: number;
    horas_dia: number;
    factor_carga_calculado: number;
    kwh_mes: number;
  }>;
}

export interface TarifaVigenteResponse {
  pliego: {
    id: number;
    nombre_resolucion: string;
    factor_indexacion: number;
    cargo_minimo_bs: number;
    limite_cargo_minimo_kwh: number;
    aplica_tarifa_dignidad: number;
    limite_tarifa_dignidad_kwh: number;
    descuento_tarifa_dignidad_porc: number;
  };
  bloques: Array<{
    id: number;
    numero_bloque: number;
    nombre_bloque: string;
    kwh_desde: number;
    kwh_hasta: number | null;
    costo_kwh_bs: number;
  }>;
  tasas: {
    id: number;
    tasa_alumbrado_porc: number;
  } | null;
  tramos_aseo: Array<{
    id: number;
    orden: number;
    kwh_desde: number;
    kwh_hasta: number | null;
    monto_bs: number;
  }>;
}

export interface ValidacionMapeResponse {
  total_hogares_evaluados: number;
  total_facturas_brutas: number;
  total_facturas_depuradas: number;
  total_atipicos_identificados: number;
  criterio_atipicos: string;
  mape_motor_tarifario_bs: number;
  validacion_nivel_1_piloto: {
    hogar: string;
    codigo_medidor: string;
    facturas: number;
    mape_kwh: number;
    mape_bs: number;
    inventario_real: Array<{
      nombre: string;
      tipo: string;
      cantidad: number;
      potencia_kw: number;
      tecnologia: string;
      horas_dia: number;
      temp_setpoint: number;
    }>;
    detalle_facturas: Array<{
      periodo: string;
      dias_facturados: number;
      temp_media_ponderada: number;
      kwh_real: number;
      kwh_simulado: number;
      error_kwh_porc: number;
      bs_real: number;
      bs_simulado: number;
      error_bs_porc: number;
    }>;
  };
  mape_bruto_kwh: number;
  mape_bruto_bs: number;
  mape_depurado_kwh: number;
  mape_depurado_bs: number;
  meta_hipotesis_porc: number;
  hipotesis_h1_verificada: boolean;
  conclusion_cientifica: string;
  registros_atipicos: Array<{
    hogar: string;
    codigo_medidor: string;
    periodo: string;
    kwh_real: number;
    mediana_hogar_kwh: number;
    p75_hogar_kwh: number;
    umbral_25_porc_kwh: number;
    bs_real: number;
    error_bruto_bs_porc: number;
  }>;
  hogares: Array<{
    hogar_id: number;
    alias: string;
    codigo_medidor: string;
    categoria: string;
    mediana_kwh: number;
    p75_kwh: number;
    inventario_asignado: Array<{
      nombre: string;
      tipo: string;
      cantidad: number;
      potencia_kw: number;
      horas_dia: number;
    }>;
    facturas_totales: number;
    facturas_depuradas: number;
    mape_bruto_kwh: number;
    mape_bruto_bs: number;
    mape_depurado_kwh: number;
    mape_depurado_bs: number;
    cumple_meta_depurada: boolean;
    detalle_facturas: Array<{
      periodo: string;
      temp_max_c: number;
      humedad_porc: number;
      sensacion_termica_rothfusz_c: number;
      kwh_real: number;
      kwh_simulado: number;
      error_kwh_porc: number;
      bs_real: number;
      bs_simulado: number;
      error_bs_porc: number;
      bloque_alcanzado: string;
      es_atipico_desocupado: boolean;
    }>;
  }>;
}
