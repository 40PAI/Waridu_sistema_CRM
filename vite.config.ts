import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
    hmr: {
      clientPort: 443,
    },
    allowedHosts: [".replit.dev", ".repl.co", ".repl.run"],
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5000,
    allowedHosts: [".replit.dev", ".repl.co", ".repl.run"],
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
