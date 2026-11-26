import { useState } from 'react';
import { BarChart3, CheckCircle2, FileCheck2, Info, AlertCircle } from 'lucide-react';
import type { ValidacionMapeResponse } from '../types';

interface Props {
  data: ValidacionMapeResponse | null;
  cargando: boolean;
  onRecargar: () => void;
}

function CurvaComparativaSVG({
  puntos,
}: {
  puntos: Array<{ label: string; real: number; sim: number; atipico?: boolean }>;
}) {
  if (puntos.length === 0) return null;
  const w = 640;
  const h = 210;
  const padL = 46;
  const padR = 16;
  const padT = 18;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const maxVal = Math.max(100, ...puntos.flatMap((p) => [p.real, p.sim])) * 1.1;
  const xPos = (i: number) =>
    puntos.length === 1 ? padL + innerW / 2 : padL + (i / (puntos.length - 1)) * innerW;
  const yPos = (v: number) => padT + innerH - (v / maxVal) * innerH;

  const pathReal = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.real)}`).join(' ');
  const pathSim = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.sim)}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[460px] h-52">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
          const val = Math.round(maxVal * frac);
          const y = yPos(val);
          return (
            <g key={idx}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#1e293b" strokeWidth="1" />
              <text x={padL - 6} y={y + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        <path d={pathReal} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        <path d={pathSim} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 4" />

        {puntos.map((p, i) => {
          const x = xPos(i);
          return (
            <g key={p.label + i}>
              <circle
                cx={x}
                cy={yPos(p.real)}
                r={p.atipico ? 5 : 4}
                fill={p.atipico ? '#f43f5e' : '#38bdf8'}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <circle
                cx={x}
                cy={yPos(p.sim)}
                r={3.5}
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text x={x} y={h - 10} fontSize="9.5" fill="#94a3b8" textAnchor="middle">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300 mt-1 px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-sky-400 inline-block" /> Real (kWh)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-400 inline-block border-t border-dashed border-amber-400" /> Simulado (kWh)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Mes atípico desocupado (&lt; 0.25 × P75)
        </span>
      </div>
    </div>
  );
}

export function PanelCientifico({ data, cargando, onRecargar }: Props) {
  const [hogarIdSel, setHogarIdSel] = useState<number>(4);

  if (cargando && !data) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        Ejecutando auditoría científica sobre las 150 facturas en SQLite...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        No se pudieron cargar los resultados de validación.
      </div>
    );
  }

  const n1 = data.validacion_nivel_1_piloto;
  const hogarSel = data.hogares.find((h) => h.hogar_id === hogarIdSel) || data.hogares[0];

  return (
    <div className="space-y-6">
      {/* Encabezado y resumen 3 capas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Panel 4 · Tribunal View
            </span>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Módulo Científico y Validación Empírica (150 Facturas)
            </h2>
          </div>
          <button
            type="button"
            onClick={onRecargar}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            Recalcular Auditoría
          </button>
        </div>

        {/* 3 tarjetas principales: Motor Tarifario, Nivel 1, Nivel 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* (a) Motor Tarifario */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300 uppercase">
                (a) Motor Tarifario AETN 666/2023
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {data.mape_motor_tarifario_bs.toFixed(2)}% <span className="text-sm font-normal text-emerald-300">MAPE Bs.</span>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Validado sobre 150 facturas reales (indexación 1.133, alumbrado 13.82%, 16 tramos aseo).
            </p>
          </div>

          {/* (b) Nivel 1 Hogar Piloto */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 uppercase">
                (b) Nivel 1 · Piloto ({n1.codigo_medidor})
              </span>
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {n1.mape_kwh.toFixed(2)}% <span className="text-sm font-normal text-cyan-300">MAPE kWh</span>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              MAPE Bs.: <strong>{n1.mape_bs.toFixed(2)}%</strong> · Inventario real verificado por placas + fechas exactas de PDF ({n1.facturas} facturas).
            </p>
          </div>

          {/* (c) Nivel 2 15 Hogares */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 uppercase">
                (c) Nivel 2 · 15 Hogares ({data.total_facturas_depuradas}/{data.total_facturas_brutas})
              </span>
              <Info className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {data.mape_depurado_kwh.toFixed(2)}% <span className="text-sm font-normal text-amber-300">MAPE Dep. kWh</span>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Dep. Bs.: <strong>{data.mape_depurado_bs.toFixed(2)}%</strong> · Bruto: {data.mape_bruto_kwh}% kWh / {data.mape_bruto_bs}% Bs.
            </p>
          </div>
        </div>

        {/* Conclusión científica dinámica */}
        <div className="mt-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-200 leading-relaxed">
            <p className="font-semibold text-cyan-300 mb-1">Conclusión Científica Dinámica (Backend):</p>
            <p>{data.conclusion_cientifica}</p>
            <p className="text-slate-400 mt-1">
              Criterio uniforme de desocupación: <code className="text-slate-300">{data.criterio_atipicos}</code> ({data.total_atipicos_identificados} registros atípicos aislados en Hogar 01 y Hogar 14).
            </p>
          </div>
        </div>
      </div>

      {/* Sección Nivel 1: Hogar Piloto (Medidor115) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-base font-bold text-white mb-1">
          Validación Física Directa (Nivel 1) — {n1.hogar} ({n1.codigo_medidor})
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Inventario fijo real (PRIDE 1.005 kW, CHiQ 1.090 kW, MELING 1.160 kW, LG 1.150 kW, refrigeración Inverter, bomba 0.5 HP, 2 duchas y base) evaluado con fechas reales de lectura y rampa gradual 23.0–26.5 °C.
        </p>

        <CurvaComparativaSVG
          puntos={n1.detalle_facturas.map((d) => ({
            label: d.periodo,
            real: d.kwh_real,
            sim: d.kwh_simulado,
          }))}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2">Periodo</th>
                <th className="py-2 text-right">Días</th>
                <th className="py-2 text-right">Tmed Pond.</th>
                <th className="py-2 text-right">Real kWh</th>
                <th className="py-2 text-right">Sim. kWh</th>
                <th className="py-2 text-right">Err. kWh</th>
                <th className="py-2 text-right">Real Bs.</th>
                <th className="py-2 text-right">Sim. Bs.</th>
                <th className="py-2 text-right">Err. Bs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {n1.detalle_facturas.map((d) => (
                <tr key={d.periodo}>
                  <td className="py-1.5 font-medium">{d.periodo}</td>
                  <td className="py-1.5 text-right">{d.dias_facturados}</td>
                  <td className="py-1.5 text-right">{d.temp_media_ponderada}°C</td>
                  <td className="py-1.5 text-right">{d.kwh_real}</td>
                  <td className="py-1.5 text-right text-amber-300">{d.kwh_simulado}</td>
                  <td className={`py-1.5 text-right font-semibold ${d.error_kwh_porc <= 10 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {d.error_kwh_porc}%
                  </td>
                  <td className="py-1.5 text-right">{d.bs_real.toFixed(1)}</td>
                  <td className="py-1.5 text-right">{d.bs_simulado.toFixed(1)}</td>
                  <td className="py-1.5 text-right">{d.error_bs_porc}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección Nivel 2: Selector de Hogar + Curva + Tabla de 15 Hogares */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Validación Extensiva (Nivel 2) — Curva por Hogar
            </h3>
            <p className="text-xs text-slate-400">
              Selecciona cualquiera de los 15 hogares para inspeccionar su perfil técnico equivalente fijo y sus 10 facturas.
            </p>
          </div>
          <select
            value={hogarSel.hogar_id}
            onChange={(e) => setHogarIdSel(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
          >
            {data.hogares.map((h) => (
              <option key={h.hogar_id} value={h.hogar_id}>
                {h.alias} ({h.codigo_medidor}) — Dep: {h.mape_depurado_kwh}% kWh
              </option>
            ))}
          </select>
        </div>

        <CurvaComparativaSVG
          puntos={hogarSel.detalle_facturas.map((d) => ({
            label: d.periodo,
            real: d.kwh_real,
            sim: d.kwh_simulado,
            atipico: d.es_atipico_desocupado,
          }))}
        />

        {/* Tabla resumen 15 hogares */}
        <div className="overflow-x-auto border-t border-slate-800 pt-4">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2">Hogar</th>
                <th className="py-2">Medidor</th>
                <th className="py-2 text-right">P75 (kWh)</th>
                <th className="py-2 text-center">Válidas</th>
                <th className="py-2 text-right">MAPE Bruto kWh</th>
                <th className="py-2 text-right">MAPE Bruto Bs.</th>
                <th className="py-2 text-right">MAPE Dep. kWh</th>
                <th className="py-2 text-right">MAPE Dep. Bs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {data.hogares.map((h) => (
                <tr
                  key={h.hogar_id}
                  onClick={() => setHogarIdSel(h.hogar_id)}
                  className={`cursor-pointer hover:bg-slate-800/50 ${
                    h.hogar_id === hogarSel.hogar_id ? 'bg-slate-800/40' : ''
                  }`}
                >
                  <td className="py-1.5 font-medium">{h.alias}</td>
                  <td className="py-1.5 text-slate-400">{h.codigo_medidor}</td>
                  <td className="py-1.5 text-right">{h.p75_kwh}</td>
                  <td className="py-1.5 text-center">
                    {h.facturas_depuradas}/{h.facturas_totales}
                  </td>
                  <td className="py-1.5 text-right text-slate-400">{h.mape_bruto_kwh}%</td>
                  <td className="py-1.5 text-right text-slate-400">{h.mape_bruto_bs}%</td>
                  <td className="py-1.5 text-right font-semibold text-cyan-300">{h.mape_depurado_kwh}%</td>
                  <td className="py-1.5 text-right font-semibold text-amber-300">{h.mape_depurado_bs}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
