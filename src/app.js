import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { luoTallennus } from './tallennus.js';
import { validoiVaraus, paallekkaiset } from './varaukset.js';

export const TILAT = [
  { id: 'huone-a', nimi: 'Neuvotteluhuone A' },
  { id: 'huone-b', nimi: 'Neuvotteluhuone B' },
];

const RUNKO_RAJA = 100_000;

class HttpVirhe extends Error {
  constructor(tila, viesti, lisatiedot = {}) {
    super(viesti);
    this.tila = tila;
    this.lisatiedot = lisatiedot;
  }
}

function laheta(res, tila, data) {
  if (data === undefined) {
    res.writeHead(tila).end();
    return;
  }
  res.writeHead(tila, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function lueJson(req) {
  let koko = 0;
  const osat = [];
  for await (const osa of req) {
    koko += osa.length;
    if (koko > RUNKO_RAJA) throw new HttpVirhe(400, 'Pyyntö on liian suuri');
    osat.push(osa);
  }
  try {
    return JSON.parse(Buffer.concat(osat).toString('utf8'));
  } catch {
    throw new HttpVirhe(400, 'Pyynnön runko ei ole kelvollista JSONia');
  }
}

export function luoSovellus({ tiedosto }) {
  const tallennus = luoTallennus(tiedosto);

  async function reititä(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const osat = url.pathname.split('/').filter(Boolean);
    const [api, kohde, id] = osat;
    const apiPolku = api === 'api' && osat.length <= 3;

    if (apiPolku && kohde === 'tilat' && osat.length === 2 && req.method === 'GET') {
      return laheta(res, 200, TILAT);
    }

    if (apiPolku && kohde === 'varaukset' && osat.length === 2) {
      if (req.method === 'GET') {
        const tila = url.searchParams.get('tila');
        const kaikki = await tallennus.lue();
        return laheta(res, 200, tila ? kaikki.filter((v) => v.tila === tila) : kaikki);
      }
      if (req.method === 'POST') {
        const syote = await lueJson(req);
        const virheet = validoiVaraus(syote, TILAT);
        if (virheet.length) throw new HttpVirhe(400, 'Virheellinen varaus', { virheet });

        const uusi = {
          id: randomUUID(),
          tila: syote.tila,
          nimi: syote.nimi.trim(),
          alku: new Date(syote.alku).toISOString(),
          loppu: new Date(syote.loppu).toISOString(),
        };
        await tallennus.muuta((varaukset) => {
          const osuvat = paallekkaiset(uusi, varaukset);
          if (osuvat.length) {
            throw new HttpVirhe(409, 'Tila on jo varattu valitulle ajalle', {
              paallekkaiset: osuvat.map((v) => v.id),
            });
          }
          return { data: [...varaukset, uusi], vastaus: uusi };
        });
        return laheta(res, 201, uusi);
      }
    }

    if (apiPolku && kohde === 'varaukset' && osat.length === 3 && req.method === 'DELETE') {
      await tallennus.muuta((varaukset) => {
        if (!varaukset.some((v) => v.id === id)) {
          throw new HttpVirhe(404, 'Varausta ei löydy');
        }
        return { data: varaukset.filter((v) => v.id !== id) };
      });
      return laheta(res, 204);
    }

    throw new HttpVirhe(404, 'Osoitetta ei löydy');
  }

  // Yksi virheenkäsittelijä kaikille reiteille.
  function kasittelijaVirheelle(res, e) {
    if (e instanceof HttpVirhe) {
      return laheta(res, e.tila, { virhe: e.message, ...e.lisatiedot });
    }
    console.error(e);
    return laheta(res, 500, { virhe: 'Palvelinvirhe' });
  }

  return http.createServer((req, res) => {
    reititä(req, res).catch((e) => kasittelijaVirheelle(res, e));
  });
}