export const minuuteiksi = (kello) => {
  const [h, m] = kello.split(':').map(Number);
  return h * 60 + m;
};

export const kelloksi = (minuutit) => {
  const h = String(Math.floor(minuutit / 60)).padStart(2, '0');
  const m = String(minuutit % 60).padStart(2, '0');
  return `${h}:${m}`;
};

export function vapaatAjat(tila, varaukset, minimi = 30) {
  const varatut = varaukset.map((v) => [
    minuuteiksi(v.alku.slice(11, 16)),
    minuuteiksi(v.loppu.slice(11, 16)),
  ]).sort((a, b) => a[0] - b[0]);

  const vapaat = [];
  let kohta = minuuteiksi(tila.aukeaa);
  const loppu = minuuteiksi(tila.sulkeutuu);

  for (const [alku, paattyy] of varatut) {
    if (alku - kohta >= minimi) {
      vapaat.push({ alku: kelloksi(kohta), loppu: kelloksi(alku), minuutit: alku - kohta });
    }
    kohta = Math.max(kohta, paattyy);
  }

  if (loppu - kohta >= minimi) {
    vapaat.push({ alku: kelloksi(kohta), loppu: kelloksi(loppu), minuutit: loppu - kohta });
  }

  return vapaat;
}