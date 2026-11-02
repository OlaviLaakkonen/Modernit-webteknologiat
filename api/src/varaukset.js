/**
 * Varauslogiikka ilman Expressia: puhtaita funktioita, joita on helppo
 * testata erikseen.
 *
 * Ajat ovat paikallista aikaa muodossa "YYYY-MM-DDTHH:MM" (ei aikavyohyketta).
 * Saman paivan ajat voi verrata suoraan merkkijonoina, koska muoto on kiintea
 * ja numerot ovat aina kaksinumeroisia.
 */

const AIKA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Ovatko kaksi varausta paallekkain? Toisiaan koskettavat (10-11 ja 11-12) eivat ole. */
export function onPaallekkain(a, b) {
  return a.alku < b.loppu && b.alku < a.loppu;
}

/** Kellonaika "HH:MM" ajasta "YYYY-MM-DDTHH:MM". */
function kello(aika) {
  return aika.slice(11, 16);
}

/** Minuutit kahden saman paivan ajan valilla. */
function kesto(alku, loppu) {
  const [ah, am] = kello(alku).split(':').map(Number);
  const [lh, lm] = kello(loppu).split(':').map(Number);
  return (lh * 60 + lm) - (ah * 60 + am);
}

/**
 * Tarkistaa uuden varauksen. Palauttaa virheiden listan; tyhja lista = kelpaa.
 * Tilan olemassaolo tarkistetaan erikseen, koska se on eri virhe (404).
 */
export function validoiVaraus(syote, tila) {
  const virheet = [];
  const { alku, loppu, varaaja } = syote ?? {};

  if (typeof varaaja !== 'string' || varaaja.trim() === '') {
    virheet.push('Varaajan nimi puuttuu.');
  }
  if (typeof alku !== 'string' || !AIKA.test(alku)) {
    virheet.push('Alkuaika puuttuu tai on vaarassa muodossa (YYYY-MM-DDTHH:MM).');
  }
  if (typeof loppu !== 'string' || !AIKA.test(loppu)) {
    virheet.push('Loppuaika puuttuu tai on vaarassa muodossa (YYYY-MM-DDTHH:MM).');
  }
  if (virheet.length > 0) {
    return virheet;
  }

  if (alku.slice(0, 10) !== loppu.slice(0, 10)) {
    virheet.push('Varauksen pitaa alkaa ja paattya samana paivana.');
  } else if (alku >= loppu) {
    virheet.push('Loppuajan pitaa olla alkuajan jalkeen.');
  } else if (kesto(alku, loppu) < 15) {
    virheet.push('Lyhin varaus on 15 minuuttia.');
  }

  if (tila && (kello(alku) < tila.aukeaa || kello(loppu) > tila.sulkeutuu)) {
    virheet.push(`Tila on varattavissa ${tila.aukeaa}-${tila.sulkeutuu}.`);
  }

  return virheet;
}

/** Varaukset, joiden kanssa uusi varaus menisi paallekkain samassa tilassa. */
export function paallekkaiset(uusi, varaukset) {
  return varaukset.filter((v) => v.tila === uusi.tila && onPaallekkain(uusi, v));
}
