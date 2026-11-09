/**
 * Tilavarausrajapinta.
 *
 * Sovellus luodaan funktiolla, joka saa datatiedoston polun. Nain testit
 * voivat kayttaa omaa tilapaista tiedostoaan, eika oikeaan dataan kosketa.
 */

import express from 'express';
import { randomUUID } from 'node:crypto';
import { luoTallennus } from './tallennus.js';
import { paallekkaiset, validoiVaraus } from './varaukset.js';

/** Virhe, joka tietaa oman HTTP-tilakoodinsa. */
class HttpVirhe extends Error {
  constructor(tila, viesti, lisat = {}) {
    super(viesti);
    this.tila = tila;
    this.lisat = lisat;
  }
}

export function luoSovellus({ tiedosto }) {
  const tallennus = luoTallennus(tiedosto);
  const app = express();

  app.use(express.json());

  app.get('/api/tilat', async (req, res) => {
    const { tilat } = await tallennus.lue();
    res.json(tilat);
  });

  /* ?tila=A101 ja ?paiva=2026-10-20 rajaavat; molemmat valinnaisia. */
  app.get('/api/varaukset', async (req, res) => {
    const { varaukset } = await tallennus.lue();
    const { tila, paiva } = req.query;

    const tulos = varaukset
      .filter((v) => !tila || v.tila === tila)
      .filter((v) => !paiva || v.alku.startsWith(paiva))
      .sort((a, b) => a.alku.localeCompare(b.alku));

    res.json(tulos);
  });

  app.post('/api/varaukset', async (req, res) => {
    const uusi = await tallennus.muuta((data) => {
      const tila = data.tilat.find((t) => t.id === req.body?.tila);
      if (!tila) {
        throw new HttpVirhe(404, 'Tilaa ei loydy.');
      }

      const virheet = validoiVaraus(req.body, tila);
      if (virheet.length > 0) {
        throw new HttpVirhe(400, 'Varaus ei kelpaa.', { virheet });
      }

      const varaus = {
        id: randomUUID(),
        tila: tila.id,
        alku: req.body.alku,
        loppu: req.body.loppu,
        varaaja: req.body.varaaja.trim(),
        aihe: typeof req.body.aihe === 'string' ? req.body.aihe.trim() : '',
      };

      const esteet = paallekkaiset(varaus, data.varaukset);
      if (esteet.length > 0) {
        throw new HttpVirhe(409, 'Tila on jo varattu tuolle ajalle.', { paallekkain: esteet });
      }

      data.varaukset.push(varaus);
      return varaus;
    });

    res.status(201).json(uusi);
  });

  app.delete('/api/varaukset/:id', async (req, res) => {
    await tallennus.muuta((data) => {
      const sijainti = data.varaukset.findIndex((v) => v.id === req.params.id);
      if (sijainti === -1) {
        throw new HttpVirhe(404, 'Varausta ei loydy.');
      }
      data.varaukset.splice(sijainti, 1);
    });

    res.status(204).end();
  });

  /* Tuntematon osoite: JSON-vastaus eika Expressin HTML-sivu. */
  app.use((req, res) => {
    res.status(404).json({ virhe: 'Osoitetta ei loydy.' });
  });

  /* Kaikki virheet yhdessa paikassa. Express 5 ohjaa myos async-kasittelijoiden
     virheet tanne, joten try/catchia ei tarvita reiteissa. */
  // eslint-disable-next-line no-unused-vars
  app.use((virhe, req, res, next) => {
    if (virhe instanceof HttpVirhe) {
      return res.status(virhe.tila).json({ virhe: virhe.message, ...virhe.lisat });
    }
    if (virhe.type === 'entity.parse.failed') {
      return res.status(400).json({ virhe: 'Pyynnon JSON on viallinen.' });
    }
    console.error(virhe);
    res.status(500).json({ virhe: 'Palvelimella tapahtui virhe.' });
  });

  return app;
}
