// Puhtaat funktiot: ei tiedostoja, ei kelloa, ei sivuvaikutuksia.

const aika = (s) => Date.parse(s);

// Puoliavoin väli [alku, loppu): peräkkäiset varaukset (loppu === alku) eivät ole päällekkäin.
export function onPaallekkain(a, b) {
  return aika(a.alku) < aika(b.loppu) && aika(b.alku) < aika(a.loppu);
}

// Palauttaa virheilmoitusten taulukon. Tyhjä taulukko = varaus kelpaa.
export function validoiVaraus(syote, tilat) {
  if (syote === null || typeof syote !== 'object' || Array.isArray(syote)) {
    return ['Pyynnön runko on oltava JSON-olio'];
  }
  const virheet = [];

  if (!tilat.some((t) => t.id === syote.tila)) {
    virheet.push('tila puuttuu tai on tuntematon');
  }
  if (typeof syote.nimi !== 'string' || syote.nimi.trim() === '') {
    virheet.push('nimi puuttuu');
  }
  const alkuOk = typeof syote.alku === 'string' && !Number.isNaN(aika(syote.alku));
  const loppuOk = typeof syote.loppu === 'string' && !Number.isNaN(aika(syote.loppu));
  if (!alkuOk) virheet.push('alku puuttuu tai ei ole kelvollinen aikaleima');
  if (!loppuOk) virheet.push('loppu puuttuu tai ei ole kelvollinen aikaleima');
  if (alkuOk && loppuOk && aika(syote.loppu) <= aika(syote.alku)) {
    virheet.push('loppu on oltava alun jälkeen');
  }
  return virheet;
}

// Samassa tilassa olevat olemassa olevat varaukset, jotka osuvat uuden kanssa päällekkäin.
export function paallekkaiset(uusi, olemassa) {
  return olemassa.filter((v) => v.tila === uusi.tila && onPaallekkain(uusi, v));
}