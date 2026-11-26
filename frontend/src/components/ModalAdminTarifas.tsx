import { useEffect, useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { api } from '../api';
import type { TarifaVigenteResponse } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ModalAdminTarifas({ open, onClose, onSaved }: Props) {
  const [tarifa, setTarifa] = useState<TarifaVigenteResponse | null>(null);
  const [factorIdx, setFactorIdx] = useState<number>(1.133);
  const [cargoMin, setCargoMin] = useState<number>(17.78);
  const [tasaAlumb, setTasaAlumb] = useState<number>(13.82);
  const [bloques, setBloques] = useState<Array<{ numero_bloque: number; nombre_bloque: string; costo_kwh_bs: number }>>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMensaje(null);
    api
      .getTarifaVigente()
      .then((res) => {
        setTarifa(res);
        setFactorIdx(res.pliego.factor_indexacion);
        setCargoMin(res.pliego.cargo_minimo_bs);
        setTasaAlumb(res.tasas?.tasa_alumbrado_porc ?? 13.82);
        setBloques(
          res.bloques.map((b) => ({
            numero_bloque: b.numero_bloque,
            nombre_bloque: b.nombre_bloque,
            costo_kwh_bs: b.costo_kwh_bs,
          }))
        );
      })
      .catch((err) => setMensaje(String(err)));
  }, [open]);

  if (!open) return null;

  const handleGuardar = async () => {
    if (!Number.isFinite(factorIdx) || factorIdx <= 0) {
      setMensaje('El Factor de Indexación debe ser mayor a 0.');
      return;
    }
    if (!Number.isFinite(cargoMin) || cargoMin <= 0) {
      setMensaje('El Cargo Mínimo Base debe ser mayor a 0.');
      return;
    }
    if (!Number.isFinite(tasaAlumb) || tasaAlumb < 0 || tasaAlumb > 100) {
      setMensaje('El Alumbrado Público (%) debe estar entre 0 y 100.');
      return;
    }
    if (bloques.some((b) => !Number.isFinite(b.costo_kwh_bs) || b.costo_kwh_bs <= 0)) {
      setMensaje('Todas las tarifas base por bloque deben ser mayores a 0.');
      return;
    }

    setGuardando(true);
    setMensaje(null);
    try {
      await api.actualizarTarifas({
        factor_indexacion: factorIdx,
        cargo_minimo_bs: cargoMin,
        tasa_alumbrado_porc: tasaAlumb,
        bloques: bloques.map((b) => ({
          numero_bloque: b.numero_bloque,
          costo_kwh_bs: b.costo_kwh_bs,
        })),
      });
      setMensaje('Parámetros guardados en SQLite.');
      onSaved();
    } catch (err) {
      setMensaje(String(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Administración Tarifaria (SQLite)</h3>
              <p className="text-xs text-slate-400">
                {tarifa?.pliego.nombre_resolucion || 'Pliego ENDE DELBENI AETN 666/2023'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
          <label className="flex flex-col gap-1 text-slate-300">
            Factor Indexación
            <input
              type="number"
              min={0.001}
              step={0.001}
              value={factorIdx}
              onChange={(e) => setFactorIdx(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-300">
            Cargo Mínimo Base (Bs.)
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={cargoMin}
              onChange={(e) => setCargoMin(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-300">
            Alumbrado Público (%)
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={tasaAlumb}
              onChange={(e) => setTasaAlumb(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
            />
          </label>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Tarifas base por bloque (Bs/kWh)</p>
          {bloques.map((b, idx) => (
            <div key={b.numero_bloque} className="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs">
              <span className="text-slate-200">{b.nombre_bloque}</span>
              <input
                type="number"
                min={0.0001}
                step={0.0001}
                value={b.costo_kwh_bs}
                onChange={(e) => {
                  const next = [...bloques];
                  next[idx] = { ...b, costo_kwh_bs: Number(e.target.value) };
                  setBloques(next);
                }}
                className="w-28 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-right text-white"
              />
            </div>
          ))}
        </div>

        {mensaje && (
          <p className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 mb-3">
            {mensaje}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={handleGuardar}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar en SQLite'}
          </button>
        </div>
      </div>
    </div>
  );
}
