/**
 * Rajapintakutsut yhdessa paikassa.
 *
 * Epaonnistunut pyynto heittaa virheen, jossa on tilakoodi (tila) ja
 * palvelimen vastaus (tiedot). Komponentti voi silloin nayttaa juuri sen
 * virheen, jonka palvelin kertoi: 400:n virhelistan tai 409:n paallekkaiset.
 */

async function pyynto(polku, asetukset = {}) {
  const vastaus = await fetch(`/api${polku}`, {
    headers: { 'Content-Type': 'application/json' },
    ...asetukset,
  });

  if (vastaus.status === 204) {
    return null;
  }

  const data = await vastaus.json().catch(() => ({}));

  if (!vastaus.ok) {
    const virhe = new Error(data.virhe ?? `Pyynto epaonnistui (${vastaus.status}).`);
    virhe.tila = vastaus.status;
    virhe.tiedot = data;
    throw virhe;
  }

  return data;
}

export const haeTilat = () => pyynto('/tilat');

export const haeVaraukset = (tila, paiva) =>
  pyynto(`/varaukset?tila=${encodeURIComponent(tila)}&paiva=${encodeURIComponent(paiva)}`);

export const luoVaraus = (varaus) =>
  pyynto('/varaukset', { method: 'POST', body: JSON.stringify(varaus) });

export const poistaVaraus = (id) =>
  pyynto(`/varaukset/${encodeURIComponent(id)}`, { method: 'DELETE' });