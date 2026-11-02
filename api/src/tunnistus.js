export function vaadiAvain(avaimet) {
  return (req, res, next) => {
    const annettu = req.get('X-API-Avain');
    const kayttaja = avaimet.find((a) => a.avain === annettu);

    if (!annettu || !kayttaja) {
      const virhe = new Error('Avain puuttuu tai on virheellinen');
      virhe.status = 401;
      return next(virhe);
    }

    app.use((virhe, req, res, next) => {
        const status = virhe.status ?? 500;
        res.status(status).json({ virhe: virhe.message });
    });

    req.kayttaja = {
      kayttajatunnus: kayttaja.kayttajatunnus,
      nimi: kayttaja.nimi,
      rooli: kayttaja.rooli,
    };
    next();
  };
}