import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: [
      "localhost",
      "65761e0f-c13e-4f4e-bb42-fff2f742bfa3-00-34j83fopcnsia.riker.replit.dev",
    ],
    hmr: {
      port: 5000,
      host: "0.0.0.0",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: [
      "localhost",
      "65761e0f-c13e-4f4e-bb42-fff2f742bfa3-00-34j83fopcnsia.riker.replit.dev",
    ],
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
