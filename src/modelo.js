/* =========================================================================
   MODELO — la misma matemática del firmware (modelo_riesgo.h) y de la
   simulación en Python (simulacion/modelo.py). Funciones puras, sin React.
   ========================================================================= */

export const ZONAS = {
  Z1: { nombre: "Recepción", crit: 2, sensor: "RFID RC522" },
  Z2: { nombre: "Pasillo técnico", crit: 3, sensor: "PIR HC-SR501" },
  Z3: { nombre: "Sala de servidores", crit: 5, sensor: "PIR + reed switch" },
};
export const CRIT_MAX = 5;

/* El orden de las claves es el del enum TipoEvento del firmware: el índice
   se usa en POST /api/evento?tipo=n. No reordenar. */
export const TIPOS = {
  ACCESO_AUTORIZADO: { sev: 0.0, etiqueta: "Acceso autorizado" },
  ACCESO_DENEGADO: { sev: 0.35, etiqueta: "Acceso denegado" },
  ACCESO_FUERA_HORARIO: { sev: 0.5, etiqueta: "Acceso fuera de horario" },
  MOVIMIENTO_NO_AUTORIZADO: { sev: 0.7, etiqueta: "Movimiento no autorizado" },
  PUERTA_FORZADA: { sev: 0.95, etiqueta: "Puerta forzada" },
  TAMPER: { sev: 0.8, etiqueta: "Tamper (fallos repetidos)" },
  PANICO: { sev: 1.0, etiqueta: "Pánico" },
};
export const indiceTipo = (tipo) => Object.keys(TIPOS).indexOf(tipo);

export const NIVELES = ["NORMAL", "PREVENTIVO", "ALERTA", "CRITICO"];
export const COLOR_NIVEL = {
  NORMAL: "var(--good)",
  PREVENTIVO: "var(--warning)",
  ALERTA: "var(--serious)",
  CRITICO: "var(--critical)",
};
export const ICONO_NIVEL = { NORMAL: "●", PREVENTIVO: "▲", ALERTA: "◆", CRITICO: "■" };

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/* Valores óptimos de la optimización con restricción TFA ≤ 0,05 (apartado 8.4) */
export const POLITICA_OPTIMA = { semivida: 180, th1: 0.8, th2: 1.8, th3: 3.2 };

export function factorHorario(hora, dia) {
  if (dia >= 5) return 1.8;
  if (hora >= 0 && hora < 5) return 1.8;
  if (hora >= 7 && hora < 19) return 1.0;
  return 1.6;
}

/* Ecuación (1): ρ = (w_z / w_máx) · s_t · f(h) */
export function riesgoInstantaneo(zona, tipo, hora, dia) {
  return (ZONAS[zona].crit / CRIT_MAX) * TIPOS[tipo].sev * factorHorario(hora, dia);
}

export const lambdaDe = (semivida) => Math.LN2 / semivida;

export function nivelDe(R, { th1, th2, th3 }) {
  if (R >= th3) return "CRITICO";
  if (R >= th2) return "ALERTA";
  if (R >= th1) return "PREVENTIVO";
  return "NORMAL";
}

/* Forma recursiva: R(t_k) = R(t_{k-1})·e^(−λ·dt) */
export function decaer(R, dtSeg, semivida) {
  const r = R * Math.exp(-lambdaDe(semivida) * Math.max(0, dtSeg));
  return r < 1e-4 ? 0 : r;
}

/* =========================================================================
   ESCENARIOS — los mismos seis del informe y del firmware (ESCENARIO n)
   ========================================================================= */
export const ESCENARIOS = [
  { id: "E1", nombre: "Jornada normal", hora: 9, dia: 1,
    pasos: [["Z1", "ACCESO_AUTORIZADO"], ["Z2", "ACCESO_AUTORIZADO"], ["Z3", "ACCESO_AUTORIZADO"]] },
  { id: "E2", nombre: "Credencial clonada", hora: 2, dia: 6,
    pasos: [["Z1", "ACCESO_FUERA_HORARIO"], ["Z2", "MOVIMIENTO_NO_AUTORIZADO"],
            ["Z2", "MOVIMIENTO_NO_AUTORIZADO"], ["Z3", "PUERTA_FORZADA"]] },
  { id: "E3", nombre: "Acceso de servicio", hora: 3, dia: 6,
    pasos: [["Z2", "MOVIMIENTO_NO_AUTORIZADO"], ["Z2", "MOVIMIENTO_NO_AUTORIZADO"],
            ["Z2", "MOVIMIENTO_NO_AUTORIZADO"], ["Z3", "PUERTA_FORZADA"]] },
  { id: "E4", nombre: "Forzamiento del rack", hora: 3.5, dia: 3,
    pasos: [["Z3", "PUERTA_FORZADA"], ["Z3", "MOVIMIENTO_NO_AUTORIZADO"]] },
  { id: "E5", nombre: "Fuerza bruta", hora: 2.5, dia: 3,
    pasos: [["Z1", "ACCESO_DENEGADO"], ["Z1", "ACCESO_DENEGADO"], ["Z1", "ACCESO_DENEGADO"],
            ["Z1", "TAMPER"], ["Z1", "ACCESO_DENEGADO"], ["Z1", "ACCESO_DENEGADO"]] },
  { id: "E6", nombre: "Falsos positivos PIR", hora: 10, dia: 2,
    pasos: [["Z2", "MOVIMIENTO_NO_AUTORIZADO"], ["Z2", "MOVIMIENTO_NO_AUTORIZADO"],
            ["Z2", "MOVIMIENTO_NO_AUTORIZADO"]] },
];

export const EVENTOS_MANUALES = [
  ["Z1", "ACCESO_AUTORIZADO", "Acceso válido Z1"],
  ["Z1", "ACCESO_DENEGADO", "Denegado Z1"],
  ["Z2", "MOVIMIENTO_NO_AUTORIZADO", "Movimiento Z2"],
  ["Z3", "MOVIMIENTO_NO_AUTORIZADO", "Movimiento Z3"],
  ["Z3", "PUERTA_FORZADA", "Puerta forzada Z3"],
  ["Z3", "PANICO", "Pánico"],
];
