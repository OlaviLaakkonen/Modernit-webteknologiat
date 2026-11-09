# Paketin koko ja koodin jakaminen - raportti

## Ennen (staattinen import)

dist/index.html                   0.85 kB │ gzip:  0.46 kB
dist/assets/index-CMRma9a8.css    0.49 kB │ gzip:  0.31 kB
dist/assets/index-BvkQvH5e.js   205.69 kB │ gzip: 70.62 kB

## Jalkeen (dynaaminen import)

| Tiedosto | Koko | gzip |
dist/index.html                   0.85 kB │ gzip:  0.46 kB
dist/assets/index-CMRma9a8.css    0.49 kB │ gzip:  0.31 kB
dist/assets/index-BzbuEcGj.js     3.77 kB │ gzip:  1.65 kB
dist/assets/kaavio-Bz_FMyOQ.js  203.88 kB │ gzip: 69.88 kB

## Network-valilehti

kaavio.png

## Milloin dynaaminen import ei kannata?

"Valitse Network-välilehden yläosasta hidastus Slow 4G. Lataa sivu ja paina painiketta. Mitä käyttäjä näkee painalluksen ja kaavion välissä? Mitä jos kaavio olisi sivun tärkein asia ja näkyisi heti?"

Sivun elementit latautuvat hitaasti ja kaaviossa kestää hetki, mutta kaikki toimii silti niin kuin pitääkin.

"Kuinka monta verkkopyyntöä painallus aiheutti? Kannattaisiko 2 kB:n moduuli ladata erikseen?"

Painallus aiheutti kaksi verkkopyyntöä. 2 kB:n moduuli ei kannattaisi ladata erikseen, koska se olisi liian hidasta. 