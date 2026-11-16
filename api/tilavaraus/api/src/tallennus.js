/**
 * Tallennus JSON-tiedostoon.
 *
 * Kaksi asiaa tekee tiedostosta kelvollisen tallennuspaikan pieneen
 * sovellukseen:
 *
 *  1. Kirjoitus on atominen: data kirjoitetaan ensin valiaikaiseen
 *     tiedostoon, joka nimetaan sitten oikean paalle. Kesken kaatunut
 *     kirjoitus ei jata puolikasta JSONia.
 *  2. Muutokset tehdaan jonossa: kaksi yhtaaikaista pyyntoa ei voi lukea
 *     samaa vanhaa tilaa ja kirjoittaa toistensa paalle.
 */

import { readFile, rename, writeFile } from 'node:fs/promises';

export function luoTallennus(tiedosto) {
  let jono = Promise.resolve();

  async function lue() {
    return JSON.parse(await readFile(tiedosto, 'utf8'));
  }

  async function kirjoita(data) {
    const valiaikainen = `${tiedosto}.${process.pid}.tmp`;
    await writeFile(valiaikainen, JSON.stringify(data, null, 2) + '\n', 'utf8');
    await rename(valiaikainen, tiedosto);
  }

  /**
   * Lukee datan, antaa sen muutosfunktiolle ja kirjoittaa tuloksen.
   * Muutosfunktio voi heittaa virheen, jolloin mitaan ei kirjoiteta.
   */
  function muuta(muutos) {
    const tulos = jono.then(async () => {
      const data = await lue();
      const arvo = await muutos(data);
      await kirjoita(data);
      return arvo;
    });
    jono = tulos.catch(() => {});   // virhe ei saa pysayttaa jonoa
    return tulos;
  }

  return { lue, muuta };
}
