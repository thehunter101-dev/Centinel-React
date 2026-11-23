import { useState } from "react";

const CONEXION = {
  demo: { clase: "demo", texto: () => "Modo demostración" },
  conectando: { clase: "", texto: () => "Conectando…" },
  vivo: { clase: "vivo", texto: (ip) => `ESP32 en ${ip}` },
  perdido: { clase: "", texto: () => "Conexión perdida" },
};

export default function Encabezado({ modo, ipInicial, esRemoto, onConectar, onDemo,
                                     tema, onTema }) {
  const [ip, setIp] = useState(ipInicial);
  const c = CONEXION[modo];

  return (
    <header>
      <div>
        <h1>Sistema Inteligente de Seguridad Física</h1>
        <div className="sub">Infraestructura tecnológica · Grupo 17 · Modelos y Simulación · UNEMI</div>
      </div>
      <div className="spacer" />
      <span className="chip" role="status">
        <span className={`punto ${c.clase}`} />
        <span>{c.texto(ip)}</span>
      </span>
      {!esRemoto && (
        <>
          <input type="text" value={ip} size={12} title="Dirección IP del ESP32"
                 aria-label="Dirección IP del ESP32"
                 onChange={(e) => setIp(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && onConectar(ip)} />
          <button className="primario" onClick={() => onConectar(ip)}>Conectar</button>
        </>
      )}
      <button onClick={onDemo}>Modo demostración</button>
      <button onClick={onTema} title="Cambiar entre modo claro y oscuro"
              aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>◐</button>
    </header>
  );
}
