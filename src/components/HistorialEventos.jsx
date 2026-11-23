import { COLOR_NIVEL, ICONO_NIVEL, TIPOS, ZONAS } from "../modelo.js";

const FILAS_VISIBLES = 40;

export default function HistorialEventos({ eventos }) {
  return (
    <div className="card c8">
      <h2>Historial de eventos</h2>
      <div className="tablaenv">
        <table>
          <thead>
            <tr>
              <th>Tiempo</th><th>Zona</th><th>Tipo de evento</th>
              <th className="der">Aporte ρ</th><th className="der">Acumulado R</th><th>Nivel</th>
            </tr>
          </thead>
          <tbody>
            {eventos.length === 0 && (
              <tr><td colSpan={6} className="vacio">
                Sin eventos todavía. Ejecute un escenario o inyecte un evento.
              </td></tr>
            )}
            {eventos.slice(0, FILAS_VISIBLES).map((e) => {
              const col = COLOR_NIVEL[e.nivel];
              return (
                <tr key={`${e.t}-${e.zona}-${e.tipo}-${e.R}`}>
                  <td>{e.t.toFixed(1)}s</td>
                  <td>{e.zona} {ZONAS[e.zona].nombre}</td>
                  <td>{TIPOS[e.tipo].etiqueta}</td>
                  <td className="der">{e.rho.toFixed(3)}</td>
                  <td className="der" style={{ fontWeight: 650 }}>{e.R.toFixed(3)}</td>
                  <td>
                    <span className="etq"
                          style={{ background: `color-mix(in srgb, ${col} 14%, transparent)`, color: col }}>
                      {ICONO_NIVEL[e.nivel]} {e.nivel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pie">
        ρ es el riesgo que aporta el evento; R es el acumulado justo después de registrarlo.
      </div>
    </div>
  );
}
