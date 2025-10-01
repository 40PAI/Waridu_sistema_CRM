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
      ".replit.dev", 
      ".repl.co", 
      ".repl.run",
      "65761e0f-c13e-4f4e-bb42-fff2f742bfa3-00-34j83fopcnsia.riker.replit.dev"
    ],
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: [
      ".replit.dev", 
      ".replit.app",
      ".repl.co", 
      ".repl.run",
    ],
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Component libraries (Radix)
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-popover',
            '@radix-ui/react-alert-dialog',
          ],
          
          // Form libraries
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          
          // Charts library
          'vendor-charts': ['recharts'],
          
          // PDF generation
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          
          // Supabase
          'vendor-supabase': [
            '@supabase/supabase-js',
            '@supabase/auth-ui-react',
            '@supabase/auth-ui-shared',
          ],
          
          // Date utilities
          'vendor-date': ['date-fns', 'react-day-picker'],
          
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild' as const,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
    ],
  },
  envPrefix: ['VITE_', 'SUPABASE_'], // Ensure Vite loads SUPABASE_ prefixed env vars
}));