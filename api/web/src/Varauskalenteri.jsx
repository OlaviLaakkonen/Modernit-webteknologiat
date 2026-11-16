import { useEffect, useState } from 'react';
import { haeTilat, haeVaraukset, poistaVaraus } from './api.js';
import Varauslomake from './Varauslomake.jsx';

/** Paikallinen paivamaara muodossa YYYY-MM-DD. */
function tanaan() {
  const nyt = new Date();
  const kk = String(nyt.getMonth() + 1).padStart(2, '0');
  const pv = String(nyt.getDate()).padStart(2, '0');
  return `${nyt.getFullYear()}-${kk}-${pv}`;
}

export default function Varauskalenteri({ alkupaiva = tanaan() }) {
  const [tilat, asetaTilat] = useState([]);
  const [tila, asetaTila] = useState('');
  const [paiva, asetaPaiva] = useState(alkupaiva);
  const [varaukset, asetaVaraukset] = useState([]);
  const [lataus, asetaLataus] = useState(true);
  const [virhe, asetaVirhe] = useState('');
  const [paivitys, asetaPaivitys] = useState(0);

 useEffect(() => {
    haeTilat()
      .then((data) => {
        asetaTilat(data);
        asetaTila((nykyinen) => nykyinen || data[0]?.id || '');
      })
      .catch((e) => asetaVirhe(e.message));
  }, []);

 useEffect(() => {
    if (!tila) {
      return;
    }

    let voimassa = true;
    asetaLataus(true);
    asetaVirhe('');

    haeVaraukset(tila, paiva)
      .then((data) => { if (voimassa) asetaVaraukset(data); })
      .catch((e) => { if (voimassa) asetaVirhe(e.message); })
      .finally(() => { if (voimassa) asetaLataus(false); });

    return () => { voimassa = false; };
  }, [tila, paiva]);

async function poista(id) {
    try {
      await poistaVaraus(id);
      asetaPaivitys((n) => n + 1);
    } catch (e) {
      asetaVirhe(e.message);
    }
  }

  return (
    <section className="kalenteri">
      <div className="valinnat">
        <label>
          Tila
          <select value={tila} onChange={(e) => asetaTila(e.target.value)}>
            {tilat.map((t) => (
              <option key={t.id} value={t.id}>{t.nimi}</option>
            ))}
          </select>
        </label>
        <label>
          Paiva
          <input type="date" value={paiva} onChange={(e) => asetaPaiva(e.target.value)} />
        </label>
      </div>

          {virhe && <p role="alert">{virhe}</p>}

      {lataus ? (
        <p>Ladataan...</p>
      ) : varaukset.length === 0 ? (
        <p>Ei varauksia tana paivana.</p>
      ) : (
        <ul className="varaukset">
          {varaukset.map((v) => (
            <li key={v.id}>
              <span className="aika">{v.alku.slice(11)}-{v.loppu.slice(11)}</span>
              <span>{v.aihe || 'Varaus'} ({v.varaaja})</span>
              <button type="button" onClick={() => poista(v.id)}>
                Poista
              </button>
            </li>
          ))}
        </ul>
      )}
    <Varauslomake tila={tila} paiva={paiva} onLuotu={() => asetaPaivitys((n) => n + 1)} />
    </section>
  );
}