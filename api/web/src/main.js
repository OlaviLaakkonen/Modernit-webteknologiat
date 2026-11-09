import './tyyli.css';

const $ = (id) => document.getElementById(id);

$('otsikko').textContent = import.meta.env.VITE_OTSIKKO;
$('tila').textContent = `Tila: ${import.meta.env.MODE}`;

async function hae(polku) {
  const vastaus = await fetch(`/api${polku}`);
  if (!vastaus.ok) {
    throw new Error(`Haku epaonnistui (${vastaus.status})`);
  }
  return vastaus.json();
}

async function naytaVaraukset() {
  const tila = $('tilavalinta').value;
  const paiva = $('paiva').value;
  $('viesti').textContent = 'Ladataan...';
  $('varaukset').replaceChildren();

  try {
    const varaukset = await hae(`/varaukset?tila=${encodeURIComponent(tila)}&paiva=${encodeURIComponent(paiva)}`);
    $('viesti').textContent = varaukset.length === 0 ? 'Ei varauksia tana paivana.' : '';

    for (const v of varaukset) {
      const rivi = document.createElement('li');
      /* textContent eika innerHTML: varaajan nimi on kayttajan syotetta. */
      rivi.textContent = `${v.alku.slice(11)}-${v.loppu.slice(11)}  ${v.aihe || 'Varaus'} (${v.varaaja})`;
      $('varaukset').append(rivi);
    }
  } catch (e) {
    $('viesti').textContent = `${e.message}. Onko Express-palvelin kaynnissa portissa 3000?`;
  }
}

async function alusta() {
  try {
    const tilat = await hae('/tilat');
    for (const t of tilat) {
      $('tilavalinta').append(new Option(t.nimi, t.id));
    }
    await naytaVaraukset();
  } catch (e) {
    $('viesti').textContent = `${e.message}. Onko Express-palvelin kaynnissa portissa 3000?`;
  }
}

/* Kaavio ladataan vasta painalluksesta. Vite tekee dynaamisesta importista
   oman tiedostonsa, joten Chart.js ei hidasta sivun ensimmaista latausta. */
$('kayttoaste').addEventListener('click', async () => {
  const paiva = $('paiva').value;
  const varaukset = await hae(`/varaukset?paiva=${encodeURIComponent(paiva)}`);

  const tunnit = {};
  for (const v of varaukset) {
    const minuutit = (Date.parse(v.loppu) - Date.parse(v.alku)) / 60000;
    tunnit[v.tila] = (tunnit[v.tila] ?? 0) + minuutit / 60;
  }

  const { piirraKayttoaste } = await import('./kaavio.js');
  piirraKayttoaste($('kaavio'), tunnit);
});

$('tilavalinta').addEventListener('change', naytaVaraukset);
$('paiva').addEventListener('change', naytaVaraukset);

alusta();