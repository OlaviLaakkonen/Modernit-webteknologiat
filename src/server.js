import { luoSovellus } from './app.js';

const tiedosto = process.env.VARAUS_TIEDOSTO ?? './data/varaukset.json';
const portti = Number(process.env.PORT ?? 3000);

luoSovellus({ tiedosto }).listen(portti, () => {
  console.log(`Varausrajapinta kuuntelee portissa ${portti}, data: ${tiedosto}`);
});