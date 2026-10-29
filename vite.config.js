import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  // NO_MINIFY=1 : bundle lisible + erreurs React complètes (debug)
  define: process.env.NO_MINIFY ? { 'process.env.NODE_ENV': '"development"' } : {},
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: process.env.NO_MINIFY ? false : 'esbuild',
    sourcemap: process.env.NO_MINIFY ? 'inline' : false,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
