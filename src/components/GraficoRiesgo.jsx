import { useRef, useState } from "react";
import { COLOR_NIVEL, ICONO_NIVEL, nivelDe } from "../modelo.js";

const VENTANA = 150;                        // segundos visibles
const ANCHO = 860, ALTO = 280;
const G = { x0: 52, y0: 16, w: 782, h: 208 };
const txt = (fill) => ({ style: { fill, fontFamily: "var(--font)" } });

export default function GraficoRiesgo({ serie, politica }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);   // {p, cx, cy}

  const ahora = serie.length ? serie[serie.length - 1].t : 0;
  const tMin = Math.max(0, ahora - VENTANA);
  const datos = serie.filter((p) => p.t >= tMin);
  const rMax = Math.max(politica.th3 * 1.22, ...datos.map((p) => p.R), 0.6);

  const X = (t) => G.x0 + ((t - tMin) / VENTANA) * G.w;
  const Y = (r) => G.y0 + G.h - (r / rMax) * G.h;

  // Bandas de nivel. Cada una lleva su etiqueta: el color no es el único canal.
  const bandas = [
    [0, politica.th1, "NORMAL"], [politica.th1, politica.th2, "PREVENTIVO"],
    [politica.th2, politica.th3, "ALERTA"], [politica.th3, rMax, "CRITICO"],
  ].filter(([lo, hi]) => hi > lo);

  const linea = datos.length > 1
    ? datos.map((p, i) => `${i ? "L" : "M"} ${X(p.t).toFixed(1)} ${Y(p.R).toFixed(1)}`).join(" ")
    : null;

  function alMover(ev) {
    const caja = svgRef.current.getBoundingClientRect();
    const xSvg = (ev.clientX - caja.left) * (ANCHO / caja.width);
    const t = tMin + ((xSvg - G.x0) / G.w) * VENTANA;
    let mejor = null, dmin = Infinity;
    for (const p of datos) {
      const d = Math.abs(p.t - t);
      if (d < dmin) { dmin = d; mejor = p; }
    }
    setHover(mejor ? { p: mejor, cx: ev.clientX, cy: ev.clientY } : null);
  }

  // Si la muestra señalada ya salió de la ventana, se descarta el tooltip
  const hp = hover && datos.includes(hover.p) ? hover : null;

  return (
    <div className="card c8">
      <h2>Evolución del riesgo</h2>
      <svg ref={svgRef} viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img"
           aria-label="Serie temporal del riesgo acumulado con las bandas de nivel">
        {bandas.map(([lo, hi, nombre]) => (
          <g key={nombre}>
            <rect x={G.x0} y={Y(hi)} width={G.w} height={Math.max(0, Y(lo) - Y(hi))}
                  fillOpacity={0.11} style={{ fill: COLOR_NIVEL[nombre] }} />
            {Y(lo) - Y(hi) > 15 && (
              <text x={G.x0 + G.w - 6} y={(Y(lo) + Y(hi)) / 2 + 3} textAnchor="end"
                    fontSize={9.5} fillOpacity={0.9} {...txt("var(--ink-2)")}>{nombre}</text>
            )}
          </g>
        ))}

        <line x1={G.x0} y1={G.y0 + G.h} x2={G.x0 + G.w} y2={G.y0 + G.h} strokeWidth={1}
              style={{ stroke: "var(--axis)" }} />
        {[0, 1, 2, 3, 4].map((i) => {
          const r = (i * rMax) / 4;
          return (
            <g key={`y${i}`}>
              <line x1={G.x0} y1={Y(r)} x2={G.x0 + G.w} y2={Y(r)} strokeWidth={0.8}
                    style={{ stroke: "var(--grid)" }} />
              <text x={G.x0 - 8} y={Y(r) + 3.5} textAnchor="end" fontSize={10}
                    {...txt("var(--ink-muted)")}>{r.toFixed(1)}</text>
            </g>
          );
        })}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const t = tMin + (VENTANA / 5) * k;
          return (
            <text key={`x${k}`} x={X(t)} y={G.y0 + G.h + 16} textAnchor="middle" fontSize={10}
                  {...txt("var(--ink-muted)")}>{`${Math.round(t)}s`}</text>
          );
        })}
        <text x={14} y={G.y0 + G.h / 2} textAnchor="middle" fontSize={10.5}
              transform={`rotate(-90 14 ${G.y0 + G.h / 2})`} {...txt("var(--ink-2)")}>
          Riesgo acumulado R(t)
        </text>

        {linea && (
          <path d={linea} fill="none" strokeWidth={2} strokeLinejoin="round"
                strokeLinecap="round" style={{ stroke: "var(--s1)" }} />
        )}

        {/* Marcas de evento, con anillo del color de la superficie para separarlas */}
        {datos.filter((p) => p.evento).map((p) => (
          <circle key={`e${p.t}`} cx={X(p.t)} cy={Y(p.R)} r={4.2} strokeWidth={1.8}
                  style={{ fill: "var(--s2)", stroke: "var(--surface-1)" }} />
        ))}

        {/* Capa de interacción: cruceta y tooltip */}
        {hp && (
          <line x1={X(hp.p.t)} x2={X(hp.p.t)} y1={G.y0} y2={G.y0 + G.h} strokeWidth={1}
                strokeDasharray="3 3" style={{ stroke: "var(--ink-2)" }} />
        )}
        <rect x={G.x0} y={G.y0} width={G.w} height={G.h} fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseMove={alMover} onMouseLeave={() => setHover(null)} />
      </svg>

      <div className="tt" style={hp ? { opacity: 1, left: hp.cx + 14, top: hp.cy - 10 } : undefined}>
        {hp && (() => {
          const n = nivelDe(hp.p.R, politica);
          return (
            <>
              <b>t = {hp.p.t.toFixed(1)} s</b><br />
              R = {hp.p.R.toFixed(3)}<br />
              <span style={{ color: COLOR_NIVEL[n], fontWeight: 650 }}>{ICONO_NIVEL[n]} {n}</span>
            </>
          );
        })()}
      </div>

      <div className="leyenda">
        <span><i className="sw" style={{ background: "var(--s1)" }} />R(t)</span>
        <span><i className="sw pt" style={{ background: "var(--s2)" }} />Evento registrado</span>
        <span><i className="sw" style={{ background: "var(--good)" }} />NORMAL</span>
        <span><i className="sw" style={{ background: "var(--warning)" }} />PREVENTIVO</span>
        <span><i className="sw" style={{ background: "var(--serious)" }} />ALERTA</span>
        <span><i className="sw" style={{ background: "var(--critical)" }} />CRÍTICO</span>
      </div>
    </div>
  );
}
