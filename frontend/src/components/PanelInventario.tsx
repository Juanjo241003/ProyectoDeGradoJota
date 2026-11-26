import { useState } from 'react';
import { Plus, Trash2, Snowflake, Zap, Fan, Tv, ShieldCheck, Home } from 'lucide-react';
import type { EquipoCatalogo, EquipoUsuario } from '../types';

interface Props {
  catalogo: EquipoCatalogo[];
  equipos: EquipoUsuario[];
  onChangeEquipos: (next: EquipoUsuario[]) => void;
  tarifaDignidad: boolean;
  onToggleTarifaDignidad: (v: boolean) => void;
  onCargarPiloto: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  aire_acondicionado: 'Climatización (A/C)',
  refrigeracion: 'Refrigeración',
  ventilacion: 'Ventilación',
  base: 'Carga Base / Otros',
};

function TipoIcon({ tipo }: { tipo: string }) {
  if (tipo === 'aire_acondicionado') return <Snowflake className="w-4 h-4 text-cyan-400" />;
  if (tipo === 'refrigeracion') return <Zap className="w-4 h-4 text-emerald-400" />;
  if (tipo === 'ventilacion') return <Fan className="w-4 h-4 text-amber-400" />;
  return <Tv className="w-4 h-4 text-indigo-400" />;
}

export function PanelInventario({
  catalogo,
  equipos,
  onChangeEquipos,
  tarifaDignidad,
  onToggleTarifaDignidad,
  onCargarPiloto,
}: Props) {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const catalogoFiltrado =
    filtroTipo === 'todos' ? catalogo : catalogo.filter((c) => c.tipo === filtroTipo);

  const agregarDesdeCatalogo = (item: EquipoCatalogo) => {
    const nuevo: EquipoUsuario = {
      uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nombre: item.nombre,
      tipo: item.tipo,
      cantidad: 1,
      potencia_kw: item.potencia_nominal_kw,
      tecnologia: item.tecnologia,
      horas_dia: item.tipo === 'refrigeracion' ? 24 : item.tipo === 'aire_acondicionado' ? 8 : 5,
      temp_setpoint: item.temperatura_confort_defecto || 24,
    };
    onChangeEquipos([...equipos, nuevo]);
  };

  const actualizarEquipo = (uid: string, patch: Partial<EquipoUsuario>) => {
    onChangeEquipos(equipos.map((eq) => (eq.uid === uid ? { ...eq, ...patch } : eq)));
  };

  const eliminarEquipo = (uid: string) => {
    onChangeEquipos(equipos.filter((eq) => eq.uid !== uid));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Panel 1
          </span>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-cyan-400" />
            Mi Hogar (Inventario)
          </h2>
        </div>
        <button
          type="button"
          onClick={onCargarPiloto}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
        >
          Cargar Hogar Piloto (Medidor115)
        </button>
      </div>

      {/* Interruptor Tarifa Dignidad */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-5 h-5 ${tarifaDignidad ? 'text-emerald-400' : 'text-slate-500'}`} />
          <div>
            <p className="text-sm font-medium text-slate-100">Tarifa Dignidad (25% desc.)</p>
            <p className="text-xs text-slate-400">Aplica automáticamente si consumo ≤ 70 kWh/mes</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={tarifaDignidad}
          onClick={() => onToggleTarifaDignidad(!tarifaDignidad)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            tarifaDignidad ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              tarifaDignidad ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Selector visual del catálogo */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {['todos', 'aire_acondicionado', 'refrigeracion', 'ventilacion', 'base'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTipo(t)}
              className={`text-xs px-2.5 py-1 rounded-full transition cursor-pointer ${
                filtroTipo === t
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {t === 'todos' ? 'Todos' : TIPO_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
          {catalogoFiltrado.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => agregarDesdeCatalogo(item)}
              className="flex items-center justify-between gap-2 text-left p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <TipoIcon tipo={item.tipo} />
                  <span className="text-xs font-medium text-slate-100 truncate">{item.nombre}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {item.potencia_nominal_kw} kW · {item.tecnologia}
                  {item.capacidad_btu ? ` · ${(item.capacidad_btu / 1000).toFixed(0)}k BTU` : ''}
                </p>
              </div>
              <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Lista de equipos activos del hogar */}
      <div className="border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Equipos en el hogar ({equipos.length})
          </h3>
        </div>

        {equipos.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Agrega equipos desde el catálogo superior para iniciar la simulación.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {equipos.map((eq) => (
              <div
                key={eq.uid}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TipoIcon tipo={eq.tipo} />
                    <span className="text-xs font-semibold text-slate-100 truncate">{eq.nombre}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarEquipo(eq.uid)}
                    className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Eliminar equipo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex flex-col gap-0.5 text-slate-400">
                    Cant.
                    <input
                      type="number"
                      min={1}
                      max={20}
                      step={1}
                      value={eq.cantidad}
                      onChange={(e) =>
                        actualizarEquipo(eq.uid, { cantidad: Math.max(1, Math.round(Number(e.target.value)) || 1) })
                      }
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-0.5 text-slate-400">
                    Pot. (kW)
                    <input
                      type="number"
                      step={0.05}
                      min={0.01}
                      value={eq.potencia_kw}
                      onChange={(e) =>
                        actualizarEquipo(eq.uid, { potencia_kw: Math.max(0.01, Number(e.target.value) || 0.05) })
                      }
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-0.5 text-slate-400">
                    Horas/día
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={24}
                      value={eq.horas_dia}
                      onChange={(e) =>
                        actualizarEquipo(eq.uid, {
                          horas_dia: Math.min(24, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-0.5 text-slate-400">
                    Tecnología
                    <select
                      value={eq.tecnologia}
                      onChange={(e) =>
                        actualizarEquipo(eq.uid, {
                          tecnologia: e.target.value as 'Convencional' | 'Inverter',
                        })
                      }
                      className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-1 text-slate-100"
                    >
                      <option value="Convencional">On/Off</option>
                      <option value="Inverter">Inverter</option>
                    </select>
                  </label>
                </div>

                {eq.tipo === 'aire_acondicionado' && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/70">
                    <span>Termostato (Setpoint): <strong className="text-cyan-300">{eq.temp_setpoint}°C</strong></span>
                    <input
                      type="range"
                      min={18}
                      max={28}
                      step={0.5}
                      value={eq.temp_setpoint}
                      onChange={(e) => actualizarEquipo(eq.uid, { temp_setpoint: Number(e.target.value) })}
                      className="w-28 accent-cyan-400"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
