import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

/* El build produce UN SOLO archivo HTML con el JavaScript y el CSS incrustados
   y lo deja en dashboard/index.html. Así el tablero sigue abriéndose con doble
   clic (file://), sin servidor ni instalación, como indica el informe. */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: "./",
  build: {
    outDir: "..",
    emptyOutDir: false,   // nunca borrar el resto de la carpeta dashboard/
    target: "es2019",
  },
});
