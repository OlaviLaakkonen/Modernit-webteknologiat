import { readFile } from 'node:fs/promises';
import { jasennaRivi, ohitettava } from './jasenna.js';

const teksti = await readFile('varausloki.log', 'utf8');
const virheelliset = [];
const tilat = {};
const varaajat = {};
const syyt = {};

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

console.log('Virheelliset rivit:', virheelliset);
console.log('Tilat:', tilat);
console.log('Varaajat:', varaajat);
console.log('Hylkäysten syyt:', syyt);