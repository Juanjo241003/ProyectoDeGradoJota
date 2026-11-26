import { AlertTriangle, CheckCircle2, Receipt, TrendingUp } from 'lucide-react';
import type { SimulacionResponse } from '../types';

interface Props {
  simulacion: SimulacionResponse | null;
  simFrio: SimulacionResponse | null;
  simCalor: SimulacionResponse | null;
}

function GaugeBloque({ kwh, bloque }: { kwh: number; bloque: string }) {
  // Escala visual 0 a 1200 kWh en arco semicircular (-90° a +90°)
  const pct = Math.min(1, Math.max(0, kwh / 1200));
  const angle = -90 + pct * 180;

  return (
    <div className="flex flex-col items-center bg-slate-950/70 border border-slate-800 rounded-xl p-4">
      <svg viewBox="0 0 220 125" className="w-56 h-32">
        {/* Segmentos de bloques */}
        <path d="M 20 110 A 90 90 0 0 1 56 38" fill="none" stroke="#10b981" strokeWidth="14" strokeLinecap="round" />
        <path d="M 60 35 A 90 90 0 0 1 110 20" fill="none" stroke="#06b6d4" strokeWidth="14" />
        <path d="M 114 20 A 90 90 0 0 1 164 38" fill="none" stroke="#f59e0b" strokeWidth="14" />
        <path d="M 168 41 A 90 90 0 0 1 200 110" fill="none" stroke="#f43f5e" strokeWidth="14" strokeLinecap="round" />

        {/* Aguja */}
        <g transform={`translate(110,110) rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-74" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="0" r="6" fill="#38bdf8" />
        </g>

        <text x="18" y="122" fontSize="9" fill="#94a3b8">0</text>
        <text x="100" y="12" fontSize="9" fill="#94a3b8">500</text>
        <text x="190" y="122" fontSize="9" fill="#94a3b8">1200+</text>
      </svg>
      <p className="text-xs text-slate-400 -mt-1">Bloque tarifario alcanzado</p>
      <p className="text-sm font-bold text-cyan-300 mt-0.5 text-center">{bloque}</p>
    </div>
  );
}

export function PanelEconomico({ simulacion, simFrio, simCalor }: Props) {
  if (!simulacion) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-center text-sm text-slate-400">
        Esperando simulación...
      </div>
    );
  }

  const f = simulacion.facturacion;
  const maxComp = Math.max(
    simFrio?.facturacion.total_factura_bs || 1,
    simCalor?.facturacion.total_factura_bs || 1,
    f.total_factura_bs
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Panel 3
        </span>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-400" />
          Desglose Económico (ENDE DELBENI)
        </h2>
      </div>

      {/* Total proyectado + Medidor de bloque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div className="bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-4">
          <p className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">
            Factura Mensual Proyectada
          </p>
          <p className="text-3xl font-extrabold text-white mt-1">
            Bs. {f.total_factura_bs.toFixed(2)}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            {f.consumo_kwh.toFixed(1)} kWh · Indexación {f.factor_indexacion_aplicado}
          </p>
        </div>

        <GaugeBloque kwh={f.consumo_kwh} bloque={f.bloque_alcanzado} />
      </div>

      {/* Semáforo preventivo de salto de bloque */}
      <div
        className={`rounded-xl border px-3.5 py-2.5 flex items-start gap-2.5 text-xs ${
          f.advertencia_salto_bloque
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
        }`}
      >
        {f.advertencia_salto_bloque ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <span>
          {f.advertencia_salto_bloque ||
            'Consumo dentro de rango estable sin alerta inmediata de salto de bloque.'}
        </span>
      </div>

      {/* Desglose exacto en Bs. */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex justify-between text-slate-300">
          <span>Energía Neta (bloques AETN 666/2023)</span>
          <span className="font-semibold">Bs. {f.energia_neta_bs.toFixed(2)}</span>
        </div>
        {f.descuento_tarifa_dignidad_bs > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>(-) Descuento Tarifa Dignidad (25%)</span>
            <span className="font-semibold">- Bs. {f.descuento_tarifa_dignidad_bs.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-300">
          <span>Alumbrado Público (13.82%)</span>
          <span className="font-semibold">Bs. {f.alumbrado_publico_bs.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Tasa de Aseo Urbano (por tramo)</span>
          <span className="font-semibold">Bs. {f.aseo_urbano_bs.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-2 text-sm">
          <span>TOTAL A PAGAR</span>
          <span className="text-emerald-400">Bs. {f.total_factura_bs.toFixed(2)}</span>
        </div>
      </div>

      {/* Desglose por bloques */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-1.5">Bloque</th>
              <th className="py-1.5 text-right">kWh</th>
              <th className="py-1.5 text-right">Bs/kWh</th>
              <th className="py-1.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {f.desglose_por_bloques.map((b, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-2">{b.bloque}</td>
                <td className="py-1.5 text-right">{b.kwh_en_bloque.toFixed(1)}</td>
                <td className="py-1.5 text-right">{b.tarifa_bs_kwh.toFixed(3)}</td>
                <td className="py-1.5 text-right font-medium">Bs. {b.subtotal_bs.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparativo mes frío vs mes caluroso */}
      {simFrio && simCalor && (
        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Comparativo Estacional (mismo inventario)
          </p>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sky-300">Mes Frío / Surazo (Junio 23.4°C)</span>
                <span className="font-semibold text-slate-100">
                  {simFrio.consumo_total_kwh} kWh · Bs. {simFrio.facturacion.total_factura_bs.toFixed(2)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{ width: `${(simFrio.facturacion.total_factura_bs / maxComp) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-rose-300">Mes Caluroso (Noviembre 30.0°C)</span>
                <span className="font-semibold text-slate-100">
                  {simCalor.consumo_total_kwh} kWh · Bs. {simCalor.facturacion.total_factura_bs.toFixed(2)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full"
                  style={{ width: `${(simCalor.facturacion.total_factura_bs / maxComp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
