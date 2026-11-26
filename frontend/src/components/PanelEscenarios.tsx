import { Thermometer, Droplets, Calendar, Flame, CloudSnow } from 'lucide-react';
import type { EscenarioClimatico, SimulacionResponse } from '../types';

interface Props {
  escenarios: EscenarioClimatico[];
  mesSeleccionado: number | null;
  temperatura: number;
  humedad: number;
  diasMes: number;
  simulacion: SimulacionResponse | null;
  cargando: boolean;
  onSelectMes: (esc: EscenarioClimatico) => void;
  onChangeTemperatura: (t: number) => void;
  onChangeHumedad: (h: number) => void;
  onChangeDias: (d: number) => void;
}

export function PanelEscenarios({
  escenarios,
  mesSeleccionado,
  temperatura,
  humedad,
  diasMes,
  simulacion,
  cargando,
  onSelectMes,
  onChangeTemperatura,
  onChangeHumedad,
  onChangeDias,
}: Props) {
  const clima = simulacion?.clima_evaluado;

  const riesgoColor =
    clima?.nivel_riesgo === 'Peligro Extremo' || clima?.nivel_riesgo === 'Peligro'
      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
      : clima?.nivel_riesgo === 'Precaución Extrema'
      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
      : clima?.nivel_riesgo === 'Precaución'
      ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-200'
      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Panel 2
          </span>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-400" />
            Simulador de Escenarios (Trinidad)
          </h2>
        </div>
        {cargando && (
          <span className="text-xs text-cyan-400 animate-pulse">Calculando...</span>
        )}
      </div>

      {/* Selector de 12 meses reales */}
      <div>
        <p className="text-xs text-slate-400 mb-2">Meses históricos de Trinidad (SENAMHI / WeatherSpark):</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {escenarios.map((esc) => {
            const active = mesSeleccionado === esc.mes_numero;
            return (
              <button
                key={esc.id}
                type="button"
                onClick={() => onSelectMes(esc)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  active
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div>{esc.mes_nombre.slice(0, 3)}</div>
                <div className="text-[10px] text-slate-400">{esc.temp_media}°C</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Escenarios extremos rápidos */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            onChangeTemperatura(23.4);
            onChangeHumedad(75);
          }}
          className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 flex items-center gap-1 cursor-pointer"
        >
          <CloudSnow className="w-3.5 h-3.5" /> Surazo (23.4°C)
        </button>
        <button
          type="button"
          onClick={() => {
            onChangeTemperatura(38.0);
            onChangeHumedad(70);
          }}
          className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/25 flex items-center gap-1 cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5" /> Ola de Calor 38°C
        </button>
        <button
          type="button"
          onClick={() => {
            onChangeTemperatura(41.3);
            onChangeHumedad(70);
          }}
          className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 flex items-center gap-1 cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5" /> Ola Extrema 41.3°C
        </button>
      </div>

      {/* Sliders interactivos */}
      <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperatura media ambiente
            </span>
            <span className="font-bold text-amber-300">{temperatura.toFixed(1)} °C</span>
          </div>
          <input
            type="range"
            min={14}
            max={43}
            step={0.1}
            value={temperatura}
            onChange={(e) => onChangeTemperatura(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Humedad relativa
            </span>
            <span className="font-bold text-cyan-300">{humedad.toFixed(0)} %</span>
          </div>
          <input
            type="range"
            min={35}
            max={95}
            step={1}
            value={humedad}
            onChange={(e) => onChangeHumedad(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Días facturados del ciclo
            </span>
            <span className="font-bold text-indigo-300">{diasMes} días</span>
          </div>
          <input
            type="range"
            min={22}
            max={37}
            step={1}
            value={diasMes}
            onChange={(e) => onChangeDias(Number(e.target.value))}
            className="w-full accent-indigo-400"
          />
        </div>
      </div>

      {/* Resultado Rothfusz */}
      {clima && (
        <div className={`rounded-xl border p-3.5 ${riesgoColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Índice de Calor (Rothfusz NOAA)</p>
              <p className="text-2xl font-extrabold">{clima.sensacion_termica_c.toFixed(1)} °C</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/25">
              {clima.nivel_riesgo}
            </span>
          </div>
          <p className="text-xs mt-1.5 opacity-90">{clima.efecto_fisiologico}</p>
        </div>
      )}

      {/* Desglose por equipo y ciclo de trabajo */}
      {simulacion && (
        <div className="border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Consumo mensual proyectado</span>
            <span className="text-base font-bold text-white">{simulacion.consumo_total_kwh} kWh</span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {simulacion.detalle_equipos.map((d, idx) => (
              <div
                key={`${d.nombre}-${idx}`}
                className="flex items-center justify-between text-xs bg-slate-950/60 rounded-lg px-2.5 py-1.5 border border-slate-800/70"
              >
                <span className="text-slate-300 truncate pr-2">
                  {d.cantidad > 1 ? `${d.cantidad}× ` : ''}
                  {d.nombre}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  {(d.tipo === 'aire_acondicionado' || d.tipo === 'refrigeracion') && (
                    <span className="text-[11px] text-cyan-400">
                      Ciclo {(d.factor_carga_calculado * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="font-semibold text-slate-100 w-16 text-right">
                    {d.kwh_mes.toFixed(1)} kWh
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
