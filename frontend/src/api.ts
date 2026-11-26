import type {
  EquipoCatalogo,
  EquipoUsuario,
  EscenarioClimatico,
  HogarHistoricoResponse,
  HogarMedidorResumen,
  SimulacionResponse,
  TarifaVigenteResponse,
  ValidacionMapeResponse,
} from './types';

const API_ORIGIN =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');
const API_BASE = `${API_ORIGIN}/api`;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getEscenarios: () => fetchJson<EscenarioClimatico[]>(`${API_BASE}/clima/escenarios`),
  getCatalogoEquipos: () => fetchJson<EquipoCatalogo[]>(`${API_BASE}/equipos/catalogo`),
  getTarifaVigente: () => fetchJson<TarifaVigenteResponse>(`${API_BASE}/tarifas/vigente`),
  getValidacionMape: () => fetchJson<ValidacionMapeResponse>(`${API_BASE}/validacion/mape`),
  getHogares: () => fetchJson<HogarMedidorResumen[]>(`${API_BASE}/hogares`),
  getHistoricoHogar: (medidor: string) =>
    fetchJson<HogarHistoricoResponse>(`${API_BASE}/hogares/${encodeURIComponent(medidor)}/historico`),

  ejecutarSimulacion: (payload: {
    nombre_simulacion?: string;
    temperatura_celsius: number;
    humedad_relativa: number;
    dias_mes: number;
    aplicar_tarifa_dignidad: boolean;
    equipos: Array<Omit<EquipoUsuario, 'uid'>>;
  }) =>
    fetchJson<SimulacionResponse>(`${API_BASE}/simulacion/ejecutar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  actualizarTarifas: (payload: {
    factor_indexacion?: number;
    cargo_minimo_bs?: number;
    aplica_tarifa_dignidad?: boolean;
    tasa_alumbrado_porc?: number;
    bloques?: Array<{ numero_bloque: number; costo_kwh_bs: number }>;
  }) =>
    fetchJson<{ status: string; pliego_id: number }>(`${API_BASE}/tarifas/actualizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};
