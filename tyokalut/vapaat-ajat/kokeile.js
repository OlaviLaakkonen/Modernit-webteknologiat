import { vapaatAjat } from './vapaat.js';

const A101 = { aukeaa: '08:00', sulkeutuu: '16:00' };
const varaus = (alku, loppu) => ({ alku: `2026-10-20T${alku}`, loppu: `2026-10-20T${loppu}` });

console.log('A101:', vapaatAjat(A101, [varaus('08:15', '09:45'), varaus('10:00', '11:30')]));
console.log('A101, minimi 10:', vapaatAjat(A101, [varaus('08:15', '09:45'), varaus('10:00', '11:30')], 10));

console.log('Sekaisin:', vapaatAjat(A101, [varaus('10:00', '11:30'), varaus('08:15', '09:45')]));

console.log('Paallekkain:', vapaatAjat(A101, [varaus('09:00', '12:00'), varaus('10:00', '11:00')]));

console.log('Taysi paiva:', vapaatAjat(A101, [varaus('08:00', '16:00')]));
console.log('Tyhja paiva:', vapaatAjat(A101, []));