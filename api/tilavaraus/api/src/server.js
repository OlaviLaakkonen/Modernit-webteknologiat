import { fileURLToPath } from 'node:url';
import { luoSovellus } from './app.js';

const tiedosto = process.env.DATA_TIEDOSTO
  ?? fileURLToPath(new URL('../data/varaukset.json', import.meta.url));
const portti = Number(process.env.PORT ?? 3000);

luoSovellus({ tiedosto }).listen(portti, () => {
  console.log(`Tilavarausrajapinta: http://localhost:${portti}/api/tilat`);
});
