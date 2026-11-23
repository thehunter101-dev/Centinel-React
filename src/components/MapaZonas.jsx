import { TIPOS, ZONAS } from "../modelo.js";

const POS = { Z0: [70, 62], Z1: [245, 62], Z2: [430, 62], Z3: [625, 62] };
const ARISTAS = [
  ["Z0", "Z1", "e1", "lector RFID"],
  ["Z1", "Z2", "e2", "paso interno"],
  ["Z2", "Z3", "e3", "puerta del rack"],
];
const COL = { libre: "var(--good)", autorizado: "var(--warning)", intruso: "var(--critical)" };
const VENTANA_ACTIVIDAD_S = 8;
const txt = (fill, extra = {}) => ({ style: { fill, fontFamily: "var(--font)" }, ...extra });

function actividadZona(z, eventos, tModelo) {
  const recientes = eventos.filter((e) => e.zona === z && tModelo - e.t < VENTANA_ACTIVIDAD_S);
  if (!recientes.length) return "libre";
  return recientes.some((e) => TIPOS[e.tipo].sev >= 0.5) ? "intruso" : "autorizado";
}

export default function MapaZonas({ eventos, tModelo }) {
  const xm = (POS.Z0[0] + POS.Z2[0]) / 2;
  return (
    <div className="card c8">
      <h2>Zonas de seguridad</h2>
      <svg viewBox="0 0 760 182" role="img"
           aria-label="Grafo de las zonas de seguridad y su estado actual">
        {/* Arista curva del acceso de servicio (Z0 -> Z2), por debajo de las etiquetas */}
        <path d={`M ${POS.Z0[0]} 90 Q ${xm} 185 ${POS.Z2[0] - 30} 70`} fill="none"
              strokeWidth={2} strokeDasharray="6 4" style={{ stroke: "var(--ink-muted)" }} />
        <text x={xm} y={162} textAnchor="middle" fontSize={10.5} {...txt("var(--ink-muted)")}>
          e4 · acceso de servicio (no vigilado por credencial)
        </text>

        {ARISTAS.map(([a, b, id, desc]) => {
          const [x1, y1] = POS[a], [x2, y2] = POS[b];
          return (
            <g key={id}>
              <line x1={x1 + 28} y1={y1} x2={x2 - 30} y2={y2} strokeWidth={2.5}
                    strokeLinecap="round" style={{ stroke: "var(--s2)" }} />
              <text x={(x1 + x2) / 2} y={y1 - 36} textAnchor="middle" fontSize={10.5}
                    fontWeight={600} {...txt("var(--ink-2)")}>{id}</text>
              <text x={(x1 + x2) / 2} y={y1 - 23} textAnchor="middle" fontSize={9.5}
                    {...txt("var(--ink-muted)")}>{desc}</text>
            </g>
          );
        })}

        {["Z0", "Z1", "Z2", "Z3"].map((z) => {
          const [x, y] = POS[z];
          const info = ZONAS[z];
          const crit = info ? info.crit : 0;
          const r = 17 + crit * 2.6;
          const act = info ? actividadZona(z, eventos, tModelo) : "libre";
          const color = info ? COL[act] : "var(--surface-2)";
          return (
            <g key={z}>
              <title>{info ? `${z} ${info.nombre}: ${act}` : "Exterior"}</title>
              <circle cx={x} cy={y} r={r} strokeWidth={2} fillOpacity={act === "libre" ? 0.22 : 0.85}
                      style={{ fill: color, stroke: info ? color : "var(--axis)",
                               transition: "fill .25s, stroke .25s" }} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={12.5} fontWeight={700}
                    {...txt(info && act !== "libre" ? "#fff" : "var(--ink-1)")}>{z}</text>
              <text x={x} y={y + r + 15} textAnchor="middle" fontSize={10.5}
                    {...txt("var(--ink-2)")}>{info ? info.nombre : "Exterior"}</text>
              {info && (
                <text x={x} y={y + r + 27} textAnchor="middle" fontSize={9.5}
                      {...txt("var(--ink-muted)")}>{`w=${crit} · ${info.sensor}`}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="leyenda">
        <span><i className="sw pt" style={{ background: "var(--good)" }} />Sin actividad</span>
        <span><i className="sw pt" style={{ background: "var(--warning)" }} />Actividad autorizada</span>
        <span><i className="sw pt" style={{ background: "var(--critical)" }} />Actividad no autorizada</span>
        <span><i className="sw" style={{ background: "var(--s2)" }} />Paso vigilado</span>
      </div>
      <div className="pie">
        El tamaño de cada nodo representa la criticidad w<sub>z</sub> de la zona. La arista e4 es
        el acceso de servicio: esquiva la recepción, por eso el pasillo técnico se vigila siempre.
      </div>
    </div>
  );
}
