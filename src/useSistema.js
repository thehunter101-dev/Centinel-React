/* =========================================================================
   ESTADO DEL TABLERO
   Un reductor puro (el tiempo entra siempre como argumento) más un hook que
   gestiona los temporizadores del modo demostración y del sondeo al ESP32.
   ========================================================================= */
import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  ESCENARIOS, POLITICA_OPTIMA, decaer, nivelDe, riesgoInstantaneo,
} from "./modelo.js";
import * as api from "./api.js";

const MAX_EVENTOS = 120;
const MAX_SERIE = 900;
const PERIODO_DEMO_MS = 500;
const PERIODO_SONDEO_MS = 700;
const PAUSA_ESCENARIO_MS = 900;

function estadoInicial(ahora = Date.now()) {
  return {
    R: 0,
    t0: ahora,
    tUltimo: ahora,
    tModelo: 0,           // reloj del modelo en s (navegador o millis() del ESP32)
    politica: { ...POLITICA_OPTIMA },
    hora: 10,
    dia: 1,
    eventos: [],          // del más reciente al más antiguo
    serie: [],            // muestras {t, R, evento} para el gráfico
    fsm: "REPOSO",
    totalEventos: 0,
    modo: "demo",         // demo | conectando | vivo | perdido
  };
}

const seg = (s, ahora) => (ahora - s.t0) / 1000;

function conSerie(serie, punto) {
  const n = [...serie, punto];
  return n.length > MAX_SERIE ? n.slice(n.length - MAX_SERIE) : n;
}

function reductor(s, a) {
  switch (a.type) {
    case "TICK": {
      const R = decaer(s.R, (a.ahora - s.tUltimo) / 1000, s.politica.semivida);
      const t = seg(s, a.ahora);
      const fsm = nivelDe(R, s.politica) === "NORMAL" ? "REPOSO" : s.fsm;
      return { ...s, R, tUltimo: a.ahora, tModelo: t, fsm,
               serie: conSerie(s.serie, { t, R, evento: false }) };
    }
    case "EVENTO": {
      const t = seg(s, a.ahora);
      const rho = riesgoInstantaneo(a.zona, a.tipo, s.hora, s.dia);
      const R = decaer(s.R, (a.ahora - s.tUltimo) / 1000, s.politica.semivida) + rho;
      const nivel = nivelDe(R, s.politica);
      const fsm = nivel === "CRITICO" ? "CRITICO"
                : nivel === "ALERTA" ? "ALERTA"
                : a.tipo.startsWith("ACCESO_A") ? "ZONA_ACTIVA" : "REPOSO";
      const ev = { t, zona: a.zona, tipo: a.tipo, rho, R, nivel, detalle: a.detalle };
      return {
        ...s, R, tUltimo: a.ahora, tModelo: t, fsm,
        totalEventos: s.totalEventos + 1,
        eventos: [ev, ...s.eventos].slice(0, MAX_EVENTOS),
        serie: conSerie(s.serie, { t, R, evento: true }),
      };
    }
    case "POLITICA": {
      // El riesgo decae con la semivida vieja hasta el instante del cambio
      const R = decaer(s.R, (a.ahora - s.tUltimo) / 1000, s.politica.semivida);
      return { ...s, R, tUltimo: a.ahora, politica: { ...s.politica, ...a.cambios } };
    }
    case "CONTEXTO":
      return { ...s, hora: a.hora ?? s.hora, dia: a.dia ?? s.dia };
    case "RESET":
      return { ...estadoInicial(a.ahora), politica: s.politica, hora: s.hora,
               dia: s.dia, modo: s.modo };
    case "MODO":
      return { ...s, modo: a.modo };
    case "INSTANTANEA": {
      const d = a.datos;
      const t = seg(s, a.ahora);
      return {
        ...s, modo: "vivo", R: d.R, fsm: d.fsm, hora: d.hora, dia: d.dia,
        politica: d.politica, totalEventos: d.totalEventos, eventos: d.eventos,
        tModelo: d.tModelo, tUltimo: a.ahora,
        serie: conSerie(s.serie, { t, R: d.R, evento: false }),
      };
    }
    default:
      return s;
  }
}

export function useSistema() {
  const [estado, despachar] = useReducer(reductor, undefined, () => estadoInicial());
  const ref = useRef(estado);
  ref.current = estado;

  const ipRef = useRef("192.168.4.1");
  const escenarioRef = useRef(0);   // token para cancelar un escenario en curso
  const vivo = () => ref.current.modo === "vivo";

  /* --- Temporizadores: demo (modelo local) o sondeo (ESP32) ------------- */
  const sondeando = estado.modo === "conectando" || estado.modo === "vivo" ||
                    estado.modo === "perdido";
  useEffect(() => {
    if (!sondeando) {
      const id = setInterval(() => despachar({ type: "TICK", ahora: Date.now() }),
                             PERIODO_DEMO_MS);
      return () => clearInterval(id);
    }
    let enCurso = false, activo = true;
    const sondear = async () => {
      if (enCurso) return;          // no apilar peticiones si el ESP32 tarda
      enCurso = true;
      try {
        const datos = await api.leerSistema(ipRef.current);
        if (activo) despachar({ type: "INSTANTANEA", datos, ahora: Date.now() });
      } catch {
        if (activo && ref.current.modo === "vivo") despachar({ type: "MODO", modo: "perdido" });
      } finally {
        enCurso = false;
      }
    };
    sondear();
    const id = setInterval(sondear, PERIODO_SONDEO_MS);
    return () => { activo = false; clearInterval(id); };
  }, [sondeando]);

  /* --- Acciones ---------------------------------------------------------- */
  const conectar = useCallback((ip) => {
    ipRef.current = ip;
    despachar({ type: "MODO", modo: "conectando" });
  }, []);

  const iniciarDemo = useCallback(() => despachar({ type: "MODO", modo: "demo" }), []);

  const sincronizar = useCallback((cambios = {}) => {
    if (!vivo()) return;
    const s = ref.current;
    api.enviarConfig(ipRef.current, { ...s.politica, ...cambios.politica },
                     cambios.hora ?? s.hora, cambios.dia ?? s.dia).catch(() => {});
  }, []);

  const cambiarPolitica = useCallback((cambios) => {
    despachar({ type: "POLITICA", cambios, ahora: Date.now() });
    sincronizar({ politica: cambios });
  }, [sincronizar]);

  const cambiarContexto = useCallback((ctx) => {
    despachar({ type: "CONTEXTO", ...ctx });
    sincronizar(ctx);
  }, [sincronizar]);

  const registrarEvento = useCallback(async (zona, tipo, detalle = "manual") => {
    if (vivo()) {
      try { await api.inyectarEvento(ipRef.current, zona, tipo); return; } catch { /* local */ }
    }
    despachar({ type: "EVENTO", zona, tipo, detalle, ahora: Date.now() });
  }, []);

  const ejecutarEscenario = useCallback(async (esc) => {
    if (vivo()) {
      try { await api.simularEscenario(ipRef.current, ESCENARIOS.indexOf(esc) + 1); return; }
      catch { /* si falla, se ejecuta en el navegador */ }
    }
    const token = ++escenarioRef.current;
    despachar({ type: "CONTEXTO", hora: esc.hora, dia: esc.dia });
    for (const [zona, tipo] of esc.pasos) {
      if (token !== escenarioRef.current) return;   // otro escenario o un reinicio
      despachar({ type: "EVENTO", zona, tipo, detalle: esc.id, ahora: Date.now() });
      await new Promise((r) => setTimeout(r, PAUSA_ESCENARIO_MS));
    }
  }, []);

  const reiniciar = useCallback(async () => {
    escenarioRef.current++;
    if (vivo()) { try { await api.reiniciar(ipRef.current); } catch { /* nada */ } }
    despachar({ type: "RESET", ahora: Date.now() });
  }, []);

  return {
    estado, ip: ipRef,
    conectar, iniciarDemo, cambiarPolitica, cambiarContexto,
    registrarEvento, ejecutarEscenario, reiniciar,
  };
}
