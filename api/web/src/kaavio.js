/**
 * Kayttoastekaavio. Tama moduuli tuo Chart.js:n, joka on koko sovelluksen
 * suurin riippuvuus. Siksi sita ei tuoda main.js:n alussa vaan vasta, kun
 * kayttaja pyytaa kaaviota (ks. main.js, dynaaminen import).
 */

import Chart from 'chart.js/auto';

let kaavio;

/** Piirtaa tilojen varatut tunnit pylvaina. */
export function piirraKayttoaste(kangas, tunnitTiloittain) {
  kaavio?.destroy();
  kaavio = new Chart(kangas, {
    type: 'bar',
    data: {
      labels: Object.keys(tunnitTiloittain),
      datasets: [{ label: 'Varatut tunnit', data: Object.values(tunnitTiloittain) }],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}