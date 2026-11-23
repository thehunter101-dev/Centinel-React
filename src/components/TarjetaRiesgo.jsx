import { COLOR_NIVEL, ICONO_NIVEL, factorHorario, nivelDe } from "../modelo.js";

export default function TarjetaRiesgo({ estado }) {
  const nivel = nivelDe(estado.R, estado.politica);
  return (
    <div className="card c4">
      <h2>Riesgo acumulado</h2>
      <div className="hero">
        <span className="valor">{estado.R.toFixed(2)}</span>
        <span className="unidad">R(t)</span>
      </div>
      <div className="nivel" style={{ color: COLOR_NIVEL[nivel] }} aria-live="polite">
        <span className="icono">{ICONO_NIVEL[nivel]}</span><span>{nivel}</span>
      </div>
      <div className="tiles">
        <Tile k="Estado FSM" v={estado.fsm} chico />
        <Tile k="Hora simulada" v={estado.hora.toFixed(2)} />
        <Tile k="Factor horario" v={factorHorario(estado.hora, estado.dia).toFixed(2)} />
        <Tile k="Eventos" v={estado.totalEventos} />
      </div>
      <div className="pie">
        R(t) = Σ ρᵢ·e<sup>−λ(t−tᵢ)</sup> &nbsp;·&nbsp; ρ = (w<sub>z</sub>/w<sub>máx</sub>)·s<sub>t</sub>·f(h)
      </div>
    </div>
  );
}

function Tile({ k, v, chico }) {
  return (
    <div className="tile">
      <div className="k">{k}</div>
      <div className="v" style={chico ? { fontSize: 14 } : undefined}>{v}</div>
    </div>
  );
}
