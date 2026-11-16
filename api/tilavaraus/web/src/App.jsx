/**
 * Lahtopohja: Vite + React, proxy rajapintaan valmiina (vite.config.js).
 *
 * Kaynnista ensin rajapinta (api-kansiossa: npm run dev) ja sitten tama
 * (npm run dev). Tehdaan yhdessa:
 *   1. src/api.js        rajapintakutsut yhteen paikkaan
 *   2. src/Varauskalenteri.jsx  tilan ja paivan valinta, varauslista, poisto
 */

export default function App() {
  return (
    <main>
      <h1>Tilavaraus</h1>
      <p>Tahan tulee varauskalenteri.</p>
    </main>
  );
}
