import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    /* /api-alkuiset pyynnot Express-palvelimelle (portti 3000). Selaimen
       nakokulmasta kaikki tulee samasta osoitteesta, joten CORSia ei tarvita. */
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});