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
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "65761e0f-c13e-4f4e-bb42-fff2f742bfa3-00-34j83fopcnsia.riker.replit.dev" // <--- adiciona aqui
    ],
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
