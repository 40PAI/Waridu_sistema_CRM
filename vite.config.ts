import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    hmr: {
      port: 5000,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: [
      "83b8f7eb-24e3-4198-891e-d4d3b8fc54c0.riker.prod.repl.run"
    ],
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));