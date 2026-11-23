import { DIAS, POLITICA_OPTIMA } from "../modelo.js";

function Deslizador({ etiqueta, valor, min, max, step, formato, onChange }) {
  return (
    <div className="fila">
      <label>
        <span className="etiqueta">{etiqueta}</span>
        <input type="range" min={min} max={max} step={step} value={valor}
               onChange={(e) => onChange(parseFloat(e.target.value))} />
      </label>
      <span className="num">{formato(valor)}</span>
    </div>
  );
}

export default function PanelPolitica({ politica, hora, dia, onPolitica, onContexto }) {
  const f2 = (v) => v.toFixed(2);
  return (
    <div className="card c4">
      <h2>Política de seguridad</h2>
      <Deslizador etiqueta="Semivida T½" valor={politica.semivida} min={10} max={600} step={10}
                  formato={(v) => `${v} s`} onChange={(v) => onPolitica({ semivida: v })} />
      <Deslizador etiqueta="θ₁ preventivo" valor={politica.th1} min={0.1} max={2} step={0.05}
                  formato={f2} onChange={(v) => onPolitica({ th1: v })} />
      <Deslizador etiqueta="θ₂ alerta" valor={politica.th2} min={0.3} max={4} step={0.05}
                  formato={f2} onChange={(v) => onPolitica({ th2: v })} />
      <Deslizador etiqueta="θ₃ crítico" valor={politica.th3} min={0.5} max={6} step={0.05}
                  formato={f2} onChange={(v) => onPolitica({ th3: v })} />
      <Deslizador etiqueta="Hora del día" valor={hora} min={0} max={23.5} step={0.5}
                  formato={(v) => `${v.toFixed(1)} h`} onChange={(v) => onContexto({ hora: v })} />
      <div className="fila">
        <label>
          <span className="etiqueta">Día</span>
          <select value={dia} onChange={(e) => onContexto({ dia: parseInt(e.target.value, 10) })}>
            {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </label>
        <button onClick={() => onPolitica({ ...POLITICA_OPTIMA })}>Valores óptimos</button>
      </div>
      <div className="pie">
        Los valores por defecto provienen de la optimización con restricción TFA ≤ 0,05
        descrita en el informe.
      </div>
    </div>
  );
}
