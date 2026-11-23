/* =========================================================================
   CLIENTE DE LA API HTTP DEL ESP32 (ver seguridad_g17.ino, apartado API)
   ========================================================================= */
import { ZONAS, TIPOS, indiceTipo } from "./modelo.js";

const url = (ip, ruta) => `http://${ip.trim()}${ruta}`;

async function getJSON(ip, ruta, timeoutMs = 1800) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url(ip, ruta), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(to);
  }
}

const post = (ip, ruta) => fetch(url(ip, ruta), { method: "POST" });

/* Lee estado + historial y los traduce al formato interno del tablero */
export async function leerSistema(ip) {
  const d = await getJSON(ip, "/api/estado");
  const ev = await getJSON(ip, "/api/eventos");
  return {
    tModelo: d.t_ms / 1000,
    R: d.riesgo,
    fsm: d.estado,
    hora: d.hora,
    dia: d.dia,
    politica: {
      semivida: Math.round(d.politica.semivida_ms / 1000),
      th1: d.politica.theta1,
      th2: d.politica.theta2,
      th3: d.politica.theta3,
    },
    totalEventos: d.total_eventos,
    eventos: ev.eventos
      .map((e) => ({
        t: e.t_ms / 1000,
        zona: e.zona.split(" ")[0],
        tipo: e.tipo,
        rho: e.rho,
        R: e.R,
        nivel: e.nivel,
        detalle: e.detalle,
      }))
      .filter((e) => ZONAS[e.zona] && TIPOS[e.tipo]),
  };
}

export function enviarConfig(ip, { semivida, th1, th2, th3 }, hora, dia) {
  const q = `semivida=${semivida * 1000}&theta1=${th1}&theta2=${th2}&theta3=${th3}` +
            `&hora=${hora}&dia=${dia}`;
  return post(ip, `/api/config?${q}`);
}

export const simularEscenario = (ip, n) => post(ip, `/api/simular?escenario=${n}`);

export const inyectarEvento = (ip, zona, tipo) =>
  post(ip, `/api/evento?zona=${{ Z1: 1, Z2: 2, Z3: 3 }[zona]}&tipo=${indiceTipo(tipo)}`);

export const reiniciar = (ip) => post(ip, "/api/reset");
