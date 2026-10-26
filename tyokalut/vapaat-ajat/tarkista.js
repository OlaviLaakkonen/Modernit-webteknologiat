import assert from 'node:assert/strict';
import { vapaatAjat } from './vapaat.js';

const tila = { aukeaa: '08:00', sulkeutuu: '16:00' };
const varaus = (alku, loppu) => ({ alku: `2026-10-20T${alku}`, loppu: `2026-10-20T${loppu}` });

assert.deepEqual(vapaatAjat(tila, []),
  [{ alku: '08:00', loppu: '16:00', minuutit: 480 }], 'tyhja paiva');

assert.deepEqual(vapaatAjat(tila, [varaus('08:00', '16:00')]), [], 'taysi paiva');

assert.deepEqual(vapaatAjat(tila, [varaus('10:00', '11:30'), varaus('08:15', '09:45')]),
  [{ alku: '11:30', loppu: '16:00', minuutit: 270 }], 'sekaisin');

assert.deepEqual(vapaatAjat(tila, [varaus('09:00', '12:00'), varaus('10:00', '11:00')]),
  [{ alku: '08:00', loppu: '09:00', minuutit: 60 },
   { alku: '12:00', loppu: '16:00', minuutit: 240 }], 'paallekkain');

assert.equal(vapaatAjat(tila, [varaus('08:15', '09:45'), varaus('10:00', '11:30')], 10).length, 3, 'minimi 10');

console.log('Kaikki tarkistukset OK');