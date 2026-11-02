import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { luoSovellus } from './app.js';
import { onPaallekkain } from './varaukset.js';

const AVAIMET = [
  { avain: 'k1', kayttajatunnus: 'matti', nimi: 'Matti Meikäläinen', rooli: 'kayttaja' },
  { avain: 'k2', kayttajatunnus: 'liisa', nimi: 'Liisa Esimerkki', rooli: 'kayttaja' },
  { avain: 'a1', kayttajatunnus: 'admin', nimi: 'Ylläpitäjä', rooli: 'yllapitaja' },
];

if (r1.status !== 201) console.log(await r1.clone().text());

async function kaynnista() {
  const dir = await mkdtemp(join(tmpdir(), 'varaus-'));
  const tiedosto = join(dir, 'v.json');
  await writeFile(tiedosto, '[]');
  const palvelin = luoSovellus({ tiedosto, avaimet: AVAIMET });
  await new Promise((r) => palvelin.listen(0, r));
  return {
    base: `http://127.0.0.1:${palvelin.address().port}`,
    sulje: () => { palvelin.closeAllConnections(); return new Promise((r) => palvelin.close(r)); },
  };
}

// Avain on valinnainen, jotta voidaan testata myös pyyntöjä ilman avainta.
const post = (body, avain) => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(avain ? { 'X-API-Avain': avain } : {}),
  },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
const poista = (avain) => ({
  method: 'DELETE',
  headers: avain ? { 'X-API-Avain': avain } : {},
});
const varaus = (alku, loppu, tila = 'huone-a') => ({ tila, nimi: 'Testi', alku, loppu });

test('onPaallekkain: peräkkäiset eivät ole päällekkäin', () => {
  const a = { alku: '2026-11-02T09:00:00Z', loppu: '2026-11-02T10:00:00Z' };
  assert.equal(onPaallekkain(a, { alku: '2026-11-02T10:00:00Z', loppu: '2026-11-02T11:00:00Z' }), false);
  assert.equal(onPaallekkain(a, { alku: '2026-11-02T09:30:00Z', loppu: '2026-11-02T11:00:00Z' }), true);
});

test('API: luonti, 409, 400, 404, poisto', async () => {
  const { base, sulje } = await kaynnista();
  try {
    assert.equal((await (await fetch(`${base}/api/tilat`)).json()).length, 2);

    const r1 = await fetch(`${base}/api/varaukset`, post(varaus('2026-11-02T09:00:00Z', '2026-11-02T10:00:00Z'), 'k1'));
    assert.equal(r1.status, 201);
    const luotu = await r1.json();

    const r2 = await fetch(`${base}/api/varaukset`, post(varaus('2026-11-02T09:30:00Z', '2026-11-02T10:30:00Z'), 'k1'));
    assert.equal(r2.status, 409);
    assert.deepEqual((await r2.json()).paallekkaiset, [luotu.id]);

    // sama aika toisessa tilassa ja heti perään samassa tilassa onnistuvat
    assert.equal((await fetch(`${base}/api/varaukset`, post(varaus('2026-11-02T09:30:00Z', '2026-11-02T10:30:00Z', 'huone-b'), 'k1'))).status, 201);
    assert.equal((await fetch(`${base}/api/varaukset`, post(varaus('2026-11-02T10:00:00Z', '2026-11-02T11:00:00Z'), 'k1'))).status, 201);

    assert.equal((await fetch(`${base}/api/varaukset`, post(varaus('2026-11-02T11:00:00Z', '2026-11-02T10:00:00Z'), 'k1'))).status, 400);
    assert.equal((await fetch(`${base}/api/varaukset`, post('{rikki', 'k1'))).status, 400);

    assert.equal((await fetch(`${base}/api/varaukset/ei-ole`, poista('k1'))).status, 404);
    assert.equal((await fetch(`${base}/api/ei-ole`)).status, 404);
    assert.equal((await fetch(`${base}/api/varaukset/${luotu.id}`, poista('k1'))).status, 204);
    assert.equal((await (await fetch(`${base}/api/varaukset`)).json()).length, 2);
  } finally {
    await sulje();
  }
});

test('rinnakkaiset samat varaukset: vain yksi onnistuu', async () => {
  const { base, sulje } = await kaynnista();
  try {
    const tulokset = await Promise.all(
      Array.from({ length: 10 }, () =>
        fetch(`${base}/api/varaukset`, post(varaus('2026-11-03T09:00:00Z', '2026-11-03T10:00:00Z'), 'k1')).then((r) => r.status)));
    assert.equal(tulokset.filter((s) => s === 201).length, 1);
    assert.equal(tulokset.filter((s) => s === 409).length, 9);
  } finally {
    await sulje();
  }
});

// --- API-avain ja roolit ---

test('lukeminen (GET) on avointa ilman avainta', async () => {
  const { base, sulje } = await kaynnista();
  try {
    assert.equal((await fetch(`${base}/api/tilat`)).status, 200);
    assert.equal((await fetch(`${base}/api/varaukset`)).status, 200);
  } finally {
    await sulje();
  }
});

test('varaaminen ja poistaminen vaativat avaimen: puuttuva tai väärä -> 401', async () => {
  const { base, sulje } = await kaynnista();
  try {
    const v = varaus('2026-11-04T09:00:00Z', '2026-11-04T10:00:00Z');
    assert.equal((await fetch(`${base}/api/varaukset`, post(v))).status, 401);
    assert.equal((await fetch(`${base}/api/varaukset`, post(v, 'vaara'))).status, 401);
    assert.equal((await fetch(`${base}/api/varaukset/jokin-id`, poista())).status, 401);
    assert.equal((await fetch(`${base}/api/varaukset/jokin-id`, poista('vaara'))).status, 401);
    // mikään ei tallentunut
    assert.equal((await (await fetch(`${base}/api/varaukset`)).json()).length, 0);
  } finally {
    await sulje();
  }
});

test('nimi ja omistaja tulevat avaimesta, eivät pyynnön rungosta', async () => {
  const { base, sulje } = await kaynnista();
  try {
    const r = await fetch(`${base}/api/varaukset`, post(
      { ...varaus('2026-11-05T09:00:00Z', '2026-11-05T10:00:00Z'), nimi: 'Huijari', omistaja: 'admin' },
      'k1',
    ));
    assert.equal(r.status, 201);
    const luotu = await r.json();
    assert.equal(luotu.nimi, 'Matti Meikäläinen');
    assert.equal(luotu.omistaja, 'matti');

    // sama tallennettuna
    const lista = await (await fetch(`${base}/api/varaukset`)).json();
    assert.equal(lista[0].omistaja, 'matti');
    assert.equal(lista[0].nimi, 'Matti Meikäläinen');
  } finally {
    await sulje();
  }
});

test('poisto: käyttäjä vain omansa (403), ylläpitäjä kenen tahansa', async () => {
  const { base, sulje } = await kaynnista();
  try {
    const luo = async (tunti) => {
      const p = String(tunti).padStart(2, '0');
      const r = await fetch(`${base}/api/varaukset`, post(
        varaus(`2026-11-06T${p}:00:00Z`, `2026-11-06T${p}:30:00Z`), 'k1'));
      assert.equal(r.status, 201);
      return (await r.json()).id;
    };

    const id1 = await luo(9);
    // toisen käyttäjän varaus -> 403, ja varaus säilyy
    assert.equal((await fetch(`${base}/api/varaukset/${id1}`, poista('k2'))).status, 403);
    assert.equal((await (await fetch(`${base}/api/varaukset`)).json()).length, 1);
    // omistaja saa poistaa
    assert.equal((await fetch(`${base}/api/varaukset/${id1}`, poista('k1'))).status, 204);

    // ylläpitäjä saa poistaa kenen tahansa varauksen
    const id2 = await luo(10);
    assert.equal((await fetch(`${base}/api/varaukset/${id2}`, poista('a1'))).status, 204);
    assert.equal((await (await fetch(`${base}/api/varaukset`)).json()).length, 0);
  } finally {
    await sulje();
  }
});