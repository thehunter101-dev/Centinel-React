import { ESCENARIOS, EVENTOS_MANUALES } from "../modelo.js";

export default function PanelEscenarios({ esRemoto, modo, onEscenario, onEvento, onReset, onCSV }) {
  return (
    <div className="card c4">
      <h2>Escenarios de simulación</h2>
      <div className="botonera">
        {ESCENARIOS.map((esc) => (
          <button key={esc.id} onClick={() => onEscenario(esc)}>{esc.id} · {esc.nombre}</button>
        ))}
      </div>
      <h2 style={{ marginTop: 15 }}>Inyectar evento</h2>
      <div className="botonera">
        {EVENTOS_MANUALES.map(([zona, tipo, etiqueta]) => (
          <button key={etiqueta} onClick={() => onEvento(zona, tipo)}>{etiqueta}</button>
        ))}
      </div>
      <div className="fila" style={{ marginTop: 13 }}>
        <button onClick={onReset}>Reiniciar acumulador</button>
        {!esRemoto && <button onClick={onCSV}>Descargar CSV</button>}
      </div>

      {esRemoto ? (
        <div className="aviso">
          <strong>Versión publicada en línea.</strong> El navegador no permite que una página
          alojada en internet se conecte a un equipo de la red local, así que aquí solo funciona
          el modo demostración, con la misma matemática del firmware. Para monitorear el
          prototipo real hay que abrir el archivo <code>dashboard/index.html</code> del paquete
          desde el computador, conectado a la red <code>SeguridadG17</code>.
        </div>
      ) : modo === "demo" && (
        <div className="aviso">
          <strong>Modo demostración.</strong> El modelo se ejecuta en el navegador con la misma
          matemática del firmware. Al conectar con el ESP32 los datos pasan a ser los del
          prototipo.
        </div>
      )}
    </div>
  );
}
