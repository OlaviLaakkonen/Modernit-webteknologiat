import { useState } from 'react';
import { luoVaraus } from './api.js';

export default function Varauslomake({ tila, paiva, onLuotu }) {
  const [alku, asetaAlku] = useState('10:00');
  const [loppu, asetaLoppu] = useState('11:00');
  const [varaaja, asetaVaraaja] = useState('');
  const [aihe, asetaAihe] = useState('');
  const [virheet, asetaVirheet] = useState([]);
  const [lahetys, asetaLahetys] = useState(false);

  async function laheta(tapahtuma) {
    tapahtuma.preventDefault();

    if (varaaja.trim() === '') {
      asetaVirheet(['Kirjoita varaajan nimi.']);
      return;
    }
    if (alku >= loppu) {
      asetaVirheet(['Loppuajan pitaa olla alkuajan jalkeen.']);
      return;
    }

    asetaLahetys(true);
    asetaVirheet([]);

    try {
      await luoVaraus({
        tila, varaaja, aihe,
        alku: `${paiva}T${alku}`,
        loppu: `${paiva}T${loppu}`,
      });
      asetaVaraaja('');
      asetaAihe('');
      onLuotu?.();
    } catch (e) {
      if (e.tila === 400 && Array.isArray(e.tiedot?.virheet)) {
        asetaVirheet(e.tiedot.virheet);
      } else if (e.tila === 409) {
        const ajat = (e.tiedot?.paallekkain ?? [])
          .map((v) => `${v.alku.slice(11)}-${v.loppu.slice(11)}`)
          .join(', ');
        asetaVirheet([`Tila on jo varattu: ${ajat}.`]);
      } else {
        asetaVirheet([e.message]);
      }
    }
  }

  return (
    <form className="lomake" onSubmit={laheta}>
      <h2>Uusi varaus</h2>

      <label>
        Alkaa
        <input type="time" value={alku} onChange={(e) => asetaAlku(e.target.value)} />
      </label>
      <label>
        Paattyy
        <input type="time" value={loppu} onChange={(e) => asetaLoppu(e.target.value)} />
      </label>
      <label>
        Varaaja
        <input value={varaaja} onChange={(e) => asetaVaraaja(e.target.value)} />
      </label>
      <label>
        Aihe
        <input value={aihe} onChange={(e) => asetaAihe(e.target.value)} />
      </label>

    {virheet.length > 0 && (
        <ul role="alert">
        {virheet.map((v) => <li key={v}>{v}</li>)}
        </ul>
    )}

      <button type="submit" disabled={lahetys || !tila}>
        {lahetys ? 'Tallennetaan...' : 'Varaa'}
      </button>
    </form>
  );
}