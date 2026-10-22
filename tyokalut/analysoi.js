import { readFile, writeFile } from 'node:fs/promises';
import { jasennaRivi, ohitettava } from './jasenna.js';
import { pathToFileURL } from 'node:url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export function analysoi(teksti) {
  const tilat = {};
  const syyt = {};
  const varaajat = {};
  const virheelliset = [];

    teksti.split(/\r?\n/).forEach((rivi, i) => {

        if (ohitettava(rivi)) {
            return;
        }

        const t = jasennaRivi(rivi);
        if (!t) {
            virheelliset.push(i + 1);
            return;
        }

        const tila = (tilat[t.tila] ??= { varaukset: 0, peruutukset: 0, hylatyt: 0, minuutit: 0 });

        if (t.tapahtuma === 'VARAUS') {
            tila.varaukset++;
            tila.minuutit += t.minuutit;
            varaajat[t.kayttaja] = (varaajat[t.kayttaja] ?? 0) + 1;
        } else if (t.tapahtuma === 'PERUUTUS') {
            tila.peruutukset++;
            tila.minuutit -= t.minuutit;
        } else {
            tila.hylatyt++;
            const syy = t.syy ?? 'tuntematon';
            syyt[syy] = (syyt[syy] ?? 0) + 1;
        }

    });

    const aktiivisimmat = Object.entries(varaajat)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([nimi, maara]) => ({ nimi, maara }));

  return { tilat, hylkaysten_syyt: syyt, aktiivisimmat, virheelliset_rivit: virheelliset };
}

async function main() {
  const [tiedosto, valitsin, kohde] = process.argv.slice(2);

  if (!tiedosto) {
    console.error('Kaytto: node analysoi.js <lokitiedosto> [--json <raportti.json>]');
    process.exitCode = 1;
    return;
  }

  let teksti;
  try {
    teksti = await readFile(tiedosto, 'utf8');
  } catch (e) {
    console.error(`Tiedostoa ei voi lukea: ${tiedosto} (${e.code})`);
    process.exitCode = 1;
    return;
  }

    const raportti = analysoi(teksti);
    console.table(Object.fromEntries(Object.entries(raportti.tilat).map(([id, t]) => [id, {
    varaukset: t.varaukset, peruutukset: t.peruutukset, hylatyt: t.hylatyt,
    tunnit: Math.round((t.minuutit / 60) * 10) / 10,
    }])));
    console.log('Hylkaysten syyt:', raportti.hylkaysten_syyt);
    console.log('Aktiivisimmat:', raportti.aktiivisimmat.map((a) => `${a.nimi} (${a.maara})`).join(', '));
    if (raportti.virheelliset_rivit.length > 0) {
    console.warn('Ohitetut virheelliset rivit:', raportti.virheelliset_rivit.join(', '));
    }

    if (valitsin === '--json' && kohde) {
    await writeFile(kohde, JSON.stringify(raportti, null, 2) + '\n', 'utf8');
    console.log(`Raportti tallennettu: ${kohde}`);
    }
}

main();