import { useCallback, useEffect, useState } from 'react';
import { Zap, Settings, BarChart3, Sliders, AlertTriangle } from 'lucide-react';
import { api } from './api';
import type {
  EquipoCatalogo,
  EquipoUsuario,
  EscenarioClimatico,
  SimulacionResponse,
  ValidacionMapeResponse,
} from './types';
import { PanelInventario } from './components/PanelInventario';
import { PanelEscenarios } from './components/PanelEscenarios';
import { PanelEconomico } from './components/PanelEconomico';
import { PanelCientifico } from './components/PanelCientifico';
import { ModalAdminTarifas } from './components/ModalAdminTarifas';

const INVENTARIO_INICIAL: EquipoUsuario[] = [
  {
    uid: 'init-ac',
    nombre: 'A/C Split 12.000 BTU (Convencional)',
    tipo: 'aire_acondicionado',
    cantidad: 1,
    potencia_kw: 1.15,
    tecnologia: 'Convencional',
    horas_dia: 10,
    temp_setpoint: 24,
  },
  {
    uid: 'init-ref',
    nombre: 'Heladera Domiciliaria Inverter',
    tipo: 'refrigeracion',
    cantidad: 1,
    potencia_kw: 0.14,
    tecnologia: 'Inverter',
    horas_dia: 24,
    temp_setpoint: 4,
  },
  {
    uid: 'init-base',
    nombre: 'Iluminación LED, TV, Routers y Electrónica',
    tipo: 'base',
    cantidad: 1,
    potencia_kw: 0.18,
    tecnologia: 'Convencional',
    horas_dia: 12,
    temp_setpoint: 24,
  },
];

const INVENTARIO_PILOTO_H04: EquipoUsuario[] = [
  { uid: 'h04-pride', nombre: 'PRIDE AC-12RHBSE-R32 (11.000 BTU)', tipo: 'aire_acondicionado', cantidad: 1, potencia_kw: 1.005, tecnologia: 'Convencional', horas_dia: 18, temp_setpoint: 24.5 },
  { uid: 'h04-chiq', nombre: 'CHiQ CSH-12OC (12.000 BTU)', tipo: 'aire_acondicionado', cantidad: 1, potencia_kw: 1.09, tecnologia: 'Convencional', horas_dia: 18, temp_setpoint: 24.5 },
  { uid: 'h04-meling', nombre: 'MELING CSH-12K (12.000 BTU)', tipo: 'aire_acondicionado', cantidad: 1, potencia_kw: 1.16, tecnologia: 'Convencional', horas_dia: 12, temp_setpoint: 24.5 },
  { uid: 'h04-lg', nombre: 'LG Split Clásico (12.000 BTU)', tipo: 'aire_acondicionado', cantidad: 1, potencia_kw: 1.15, tecnologia: 'Convencional', horas_dia: 9, temp_setpoint: 24.5 },
  { uid: 'h04-ref', nombre: 'Heladera Samsung Inverter + Frigobar', tipo: 'refrigeracion', cantidad: 1, potencia_kw: 0.2, tecnologia: 'Inverter', horas_dia: 24, temp_setpoint: 4 },
  { uid: 'h04-bomba', nombre: 'Bomba de Agua 0.5 HP', tipo: 'base', cantidad: 1, potencia_kw: 0.45, tecnologia: 'Convencional', horas_dia: 0.5, temp_setpoint: 24 },
  { uid: 'h04-duchas', nombre: 'Duchas Eléctricas (2, tibia ~3.5 kW)', tipo: 'base', cantidad: 1, potencia_kw: 3.5, tecnologia: 'Convencional', horas_dia: 0.63, temp_setpoint: 24 },
  { uid: 'h04-elec', nombre: 'Electrónica, TVs, PC, PS5, LED, Routers', tipo: 'base', cantidad: 1, potencia_kw: 0.272, tecnologia: 'Convencional', horas_dia: 18, temp_setpoint: 24 },
];

export function App() {
  const [vista, setVista] = useState<'simulador' | 'tribunal'>('simulador');
  const [adminOpen, setAdminOpen] = useState(false);

  const [escenarios, setEscenarios] = useState<EscenarioClimatico[]>([]);
  const [catalogo, setCatalogo] = useState<EquipoCatalogo[]>([]);
  const [equipos, setEquipos] = useState<EquipoUsuario[]>(INVENTARIO_INICIAL);
  const [tarifaDignidad, setTarifaDignidad] = useState(false);

  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(1);
  const [temperatura, setTemperatura] = useState<number>(27.7);
  const [humedad, setHumedad] = useState<number>(79.3);
  const [diasMes, setDiasMes] = useState<number>(30);

  const [simulacion, setSimulacion] = useState<SimulacionResponse | null>(null);
  const [simFrio, setSimFrio] = useState<SimulacionResponse | null>(null);
  const [simCalor, setSimCalor] = useState<SimulacionResponse | null>(null);
  const [cargandoSim, setCargandoSim] = useState(false);

  const [validacion, setValidacion] = useState<ValidacionMapeResponse | null>(null);
  const [cargandoVal, setCargandoVal] = useState(false);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getEscenarios(), api.getCatalogoEquipos()])
      .then(([escs, cat]) => {
        setEscenarios(escs);
        setCatalogo(cat);
        const ene = escs.find((e) => e.mes_numero === 1) || escs[0];
        if (ene) {
          setMesSeleccionado(ene.mes_numero);
          setTemperatura(ene.temp_media);
          setHumedad(ene.humedad_relativa_prom);
        }
        setErrorBackend(null);
      })
      .catch((err) => {
        setErrorBackend(`No se pudo conectar con FastAPI en http://localhost:8000 (${String(err)})`);
      });
  }, []);

  const ejecutarTodasSimulaciones = useCallback(async () => {
    if (equipos.length === 0) return;
    setCargandoSim(true);
    const eqPayload = equipos.map(({ uid: _uid, ...rest }) => rest);
    try {
      const [actual, frio, calor] = await Promise.all([
        api.ejecutarSimulacion({
          temperatura_celsius: temperatura,
          humedad_relativa: humedad,
          dias_mes: diasMes,
          aplicar_tarifa_dignidad: tarifaDignidad,
          equipos: eqPayload,
        }),
        api.ejecutarSimulacion({
          temperatura_celsius: 23.4,
          humedad_relativa: 75,
          dias_mes: 30,
          aplicar_tarifa_dignidad: tarifaDignidad,
          equipos: eqPayload,
        }),
        api.ejecutarSimulacion({
          temperatura_celsius: 30.0,
          humedad_relativa: 72.4,
          dias_mes: 30,
          aplicar_tarifa_dignidad: tarifaDignidad,
          equipos: eqPayload,
        }),
      ]);
      setSimulacion(actual);
      setSimFrio(frio);
      setSimCalor(calor);
      setErrorBackend(null);
    } catch (err) {
      setErrorBackend(`Error al simular: ${String(err)}`);
    } finally {
      setCargandoSim(false);
    }
  }, [equipos, temperatura, humedad, diasMes, tarifaDignidad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void ejecutarTodasSimulaciones();
    }, 180);
    return () => clearTimeout(timer);
  }, [ejecutarTodasSimulaciones]);

  const cargarValidacion = useCallback(() => {
    setCargandoVal(true);
    api
      .getValidacionMape()
      .then((res) => {
        setValidacion(res);
        setErrorBackend(null);
      })
      .catch((err) => setErrorBackend(String(err)))
      .finally(() => setCargandoVal(false));
  }, []);

  useEffect(() => {
    if (vista === 'tribunal' && !validacion) {
      cargarValidacion();
    }
  }, [vista, validacion, cargarValidacion]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                Simulador Energético-Climático Trinidad
              </h1>
              <p className="text-xs text-slate-400">
                Rothfusz (NOAA) · Pliego ENDE DELBENI AETN N° 666/2023 · Modo 100% Local
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVista('simulador')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                vista === 'simulador'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" /> Simulador (Paneles 1–3)
            </button>
            <button
              type="button"
              onClick={() => setVista('tribunal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                vista === 'tribunal'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Tribunal View (Panel 4)
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-cyan-400" /> Tarifas
            </button>
          </div>
        </div>
      </header>

      {/* Banner error backend si no está levantado */}
      {errorBackend && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4">
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-xl px-4 py-3 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorBackend}</span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {vista === 'simulador' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <PanelInventario
              catalogo={catalogo}
              equipos={equipos}
              onChangeEquipos={setEquipos}
              tarifaDignidad={tarifaDignidad}
              onToggleTarifaDignidad={setTarifaDignidad}
              onCargarPiloto={() => setEquipos(INVENTARIO_PILOTO_H04)}
            />
            <PanelEscenarios
              escenarios={escenarios}
              mesSeleccionado={mesSeleccionado}
              temperatura={temperatura}
              humedad={humedad}
              diasMes={diasMes}
              simulacion={simulacion}
              cargando={cargandoSim}
              onSelectMes={(esc) => {
                setMesSeleccionado(esc.mes_numero);
                setTemperatura(esc.temp_media);
                setHumedad(esc.humedad_relativa_prom);
              }}
              onChangeTemperatura={(t) => {
                setMesSeleccionado(null);
                setTemperatura(t);
              }}
              onChangeHumedad={(h) => {
                setMesSeleccionado(null);
                setHumedad(h);
              }}
              onChangeDias={setDiasMes}
            />
            <PanelEconomico simulacion={simulacion} simFrio={simFrio} simCalor={simCalor} />
          </div>
        ) : (
          <PanelCientifico data={validacion} cargando={cargandoVal} onRecargar={cargarValidacion} />
        )}
      </main>

      <ModalAdminTarifas
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onSaved={() => {
          void ejecutarTodasSimulaciones();
          if (validacion) cargarValidacion();
        }}
      />
    </div>
  );
}

export default App;
