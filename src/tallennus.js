import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export function luoTallennus(tiedosto) {
  let jono = Promise.resolve();

  async function lue() {
    try {
      return JSON.parse(await readFile(tiedosto, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }

  // Atominen kirjoitus: ensin väliaikaistiedostoon, sitten rename samaan hakemistoon.
  async function kirjoita(data) {
    await mkdir(dirname(tiedosto), { recursive: true });
    const vali = `${tiedosto}.${randomUUID()}.tmp`;
    await writeFile(vali, JSON.stringify(data, null, 2));
    await rename(vali, tiedosto);
  }

  // Muutosjono: yksi luku-muokkaus-kirjoitus kerrallaan, joten päällekkäisyystarkistus
  // ja tallennus eivät voi lomittua kahden pyynnön kesken.
  // fn(nykyinen) palauttaa { data, vastaus }; data kirjoitetaan, jos se on annettu.
  // Jos fn heittää, mitään ei kirjoiteta ja jono jatkaa seuraavaan.
  function muuta(fn) {
    const suoritus = jono.then(async () => {
      const { data, vastaus } = await fn(await lue());
      if (data !== undefined) await kirjoita(data);
      return vastaus;
    });
    jono = suoritus.catch(() => {});
    return suoritus;
  }

  return { lue, muuta };
}