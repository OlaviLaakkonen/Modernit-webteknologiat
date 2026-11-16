import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    /* Kehityksessa /api-pyynnot ohjataan Express-palvelimelle. Selain luulee
       puhuvansa samalle palvelimelle, joten CORS-asetuksia ei tarvita. */
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/testi/asetukset.js',
  },
});
