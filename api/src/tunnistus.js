export function luoTunnistus(avaimet) {
  const avaimella = new Map(avaimet.map((a) => [a.avain, a]));

  /** Vaatii kelvollisen avaimen ja tallentaa kayttajan req.kayttaja-kenttaan. */
  function vaadiAvain(req, res, next) {
    const kayttaja = avaimella.get(req.get('X-API-Avain') ?? '');

    if (!kayttaja) {
      return res.status(401).json({ virhe: 'API-avain puuttuu tai ei kelpaa.' });
    }

    req.kayttaja = kayttaja;
    next();
  }

  return { vaadiAvain };
}