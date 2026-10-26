import { readFile } from 'node:fs/promises';
import { vapaatAjat } from './vapaat.js';

const KAYTTO = 'Kaytto: node nayta-vapaat.js <YYYY-MM-DD> [tila] [--minimi <minuutit>]';

const [paiva, ...loput] = process.argv.slice(2);
let tilaRaja = null;
let minimi = 30;

for (let i = 0; i < loput.length; i++) {
  if (loput[i] === '--minimi') {
    minimi = Number(loput[i + 1]);
    i++;                       // ohitetaan luku, se ei ole tilan tunnus
  } else {
    tilaRaja = loput[i];
  }
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(paiva ?? '')) {
  console.error(KAYTTO);
  process.exit(1);
}
if (!Number.isInteger(minimi) || minimi <= 0) {
  console.error('--minimi pitaa olla positiivinen kokonaisluku');
  console.error(KAYTTO);
  process.exit(1);
}

const tiedosto = new URL('./varaukset.json', import.meta.url);
const { tilat, varaukset } = JSON.parse(await readFile(tiedosto, 'utf8'));

const valitut = tilaRaja ? tilat.filter((t) => t.id === tilaRaja) : tilat;

if (valitut.length === 0) {
  console.error(`Tuntematon tila: ${tilaRaja}`);
  process.exit(1);
}

for (const tila of valitut) {
  const paivan = varaukset.filter((v) => v.tila === tila.id && v.alku.startsWith(paiva));
  const vapaat = vapaatAjat(tila, paivan, minimi)

  console.log(`${tila.nimi} (${tila.aukeaa}-${tila.sulkeutuu})`);
  if (vapaat.length === 0) {
    console.log('  ei vapaita aikoja');
  }
  for (const v of vapaat) {
    console.log(`  ${v.alku}-${v.loppu}  (${v.minuutit} min)`);
  }
}