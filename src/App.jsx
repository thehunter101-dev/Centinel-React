import { useEffect, useState } from "react";
import { useSistema } from "./useSistema.js";
import Encabezado from "./components/Encabezado.jsx";
import TarjetaRiesgo from "./components/TarjetaRiesgo.jsx";
import MapaZonas from "./components/MapaZonas.jsx";
import GraficoRiesgo from "./components/GraficoRiesgo.jsx";
import PanelPolitica from "./components/PanelPolitica.jsx";
import PanelEscenarios from "./components/PanelEscenarios.jsx";
import HistorialEventos from "./components/HistorialEventos.jsx";

/* Una página publicada en la web no puede abrir conexiones hacia equipos de
   la red local: el navegador las bloquea por política de seguridad. Si este
   archivo se sirve desde un sitio remoto se ocultan los controles de conexión
   y la descarga, y queda solo el modo demostración. */
const esRemoto = location.protocol.startsWith("http") &&
  !/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);

function leerTema() {
  try {
    const t = localStorage.getItem("tema-g17");
    if (t === "light" || t === "dark") return t;
  } catch { /* almacenamiento no disponible */ }
  return "light";
}

function descargarCSV(eventos) {
  const lineas = ["t_s,zona,tipo,rho,R,nivel"];
  for (const e of [...eventos].reverse()) {
    lineas.push(`${e.t.toFixed(2)},${e.zona},${e.tipo},${e.rho.toFixed(4)},` +
                `${e.R.toFixed(4)},${e.nivel}`);
  }
  const blob = new Blob([lineas.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "eventos_seguridad_g17.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function App() {
  const s = useSistema();
  const { estado } = s;
  const [tema, setTema] = useState(leerTema);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try { localStorage.setItem("tema-g17", tema); } catch { /* nada */ }
  }, [tema]);

  return (
    <div className="wrap">
      <Encabezado modo={estado.modo} ipInicial={s.ip.current} esRemoto={esRemoto}
                  onConectar={s.conectar} onDemo={s.iniciarDemo}
                  tema={tema} onTema={() => setTema((t) => (t === "dark" ? "light" : "dark"))} />

      <main className="rejilla">
        <TarjetaRiesgo estado={estado} />
        <MapaZonas eventos={estado.eventos} tModelo={estado.tModelo} />
        <GraficoRiesgo serie={estado.serie} politica={estado.politica} />
        <PanelPolitica politica={estado.politica} hora={estado.hora} dia={estado.dia}
                       onPolitica={s.cambiarPolitica} onContexto={s.cambiarContexto} />
        <PanelEscenarios esRemoto={esRemoto} modo={estado.modo}
                         onEscenario={s.ejecutarEscenario} onEvento={s.registrarEvento}
                         onReset={s.reiniciar} onCSV={() => descargarCSV(estado.eventos)} />
        <HistorialEventos eventos={estado.eventos} />
      </main>
    </div>
  );
}
