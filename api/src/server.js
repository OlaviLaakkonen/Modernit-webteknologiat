import { readFileSync } from 'node:fs';
import { luoSovellus } from './app.js';

const tiedosto = process.env.VARAUS_TIEDOSTO ?? './data/varaukset.json';
const avaintiedosto = process.env.AVAIMET_TIEDOSTO ?? './data/avaimet.json';
const portti = Number(process.env.PORT ?? 3000);

function lataaAvaimet(polku) {
  try {
    const avaimet = JSON.parse(readFileSync(polku, 'utf8'));
    if (!Array.isArray(avaimet)) throw new Error('Tiedoston pitää sisältää taulukko');
    return avaimet;
  } catch (e) {
    console.error(`Avaintiedoston lukeminen epäonnistui (${polku}): ${e.message}`);
    process.exit(1);
  }
}

   const AVAIMET = [
     { avain: 'k1', kayttajatunnus: 'matti', nimi: 'Matti Meikäläinen', rooli: 'kayttaja' },
     { avain: 'k2', kayttajatunnus: 'liisa', nimi: 'Liisa Esimerkki', rooli: 'kayttaja' },
     { avain: 'a1', kayttajatunnus: 'admin', nimi: 'Ylläpitäjä', rooli: 'yllapitaja' },
   ];

luoSovellus({ tiedosto, avaimet: AVAIMET }).listen(portti, () => {
  console.log(
    `Varausrajapinta kuuntelee portissa ${portti}, data: ${tiedosto}, avaimia: ${avaimet.length}`,
  );
});