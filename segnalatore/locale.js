// Il segnalatore in casa, per provarlo senza pubblicarlo.
//
//   node segnalatore/locale.js
//
// Mette in piedi due cose: l'endpoint vero — lo STESSO file che finira' su
// Vercel, non una copia — e un finto Redis in memoria che parla il protocollo
// di quello vero. Cosi' la prova esercita il codice che andra' online, comandi
// Redis compresi, e non una versione semplificata che poi si comporta diverso.
//
// In memoria vuol dire che spegnendolo si perde tutto: va benissimo per delle
// stanze che vivono tre minuti, e non va bene per niente altro.

import http from 'node:http';

const PORTA = Number(process.argv[2]) || 5191;

// Il finto Redis sta sulla stessa porta: l'endpoint ci parla via HTTP come
// parlerebbe a quello vero.
// Il nome delle variabili si puo' cambiare da riga di comando: serve a
// provare che l'endpoint le trovi comunque si chiamino, che e' esattamente il
// punto in cui ci si e' impantanati collegando l'archivio vero.
const PREFISSO = process.argv[3] || 'KV';
process.env[`${PREFISSO}_REST_API_URL`] = `http://127.0.0.1:${PORTA}/finto-redis`;
process.env[`${PREFISSO}_REST_API_TOKEN`] = 'in-casa';

const { default: stanza } = await import('./api/stanza.js');

/** Il magazzino finto: chiave -> { valore, scadenza }. */
const roba = new Map();

function vivo(chiave) {
  const v = roba.get(chiave);
  if (!v) return null;
  if (v.scadenza < Date.now()) {
    roba.delete(chiave);
    return null;
  }
  return v.valore;
}

function fintoRedis(comando) {
  const [nome, chiave, valore, ...resto] = comando;
  if (nome === 'GET') return vivo(chiave);
  if (nome === 'SET') {
    const soloSeLibera = resto.includes('NX');
    if (soloSeLibera && vivo(chiave) !== null) return null;
    const dove = resto.indexOf('EX');
    const durata = dove >= 0 ? Number(resto[dove + 1]) : 300;
    roba.set(chiave, { valore, scadenza: Date.now() + durata * 1000 });
    return 'OK';
  }
  throw new Error(`comando che il finto Redis non sa fare: ${nome}`);
}

/** Un `res` che si comporta come quello di Vercel. */
function rispostaFinta(res) {
  const finta = {
    codice: 200,
    setHeader: (k, v) => res.setHeader(k, v),
    status(n) {
      finta.codice = n;
      return finta;
    },
    json(oggetto) {
      res.writeHead(finta.codice, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(oggetto));
      return finta;
    },
    end() {
      res.writeHead(finta.codice);
      res.end();
      return finta;
    },
  };
  return finta;
}

function leggiCorpo(req) {
  return new Promise((finito) => {
    let testo = '';
    req.on('data', (p) => { testo += p; });
    req.on('end', () => finito(testo));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://interno');
  const testo = await leggiCorpo(req);

  if (url.pathname === '/finto-redis') {
    try {
      const risultato = fintoRedis(JSON.parse(testo));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: risultato }));
    } catch (e) {
      res.writeHead(500).end(JSON.stringify({ error: String(e.message) }));
    }
    return;
  }

  if (url.pathname === '/api/stanza') {
    const finto = {
      method: req.method,
      query: Object.fromEntries(url.searchParams),
      body: testo ? JSON.parse(testo) : undefined,
    };
    await stanza(finto, rispostaFinta(res));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('qui non c e niente');
});

server.listen(PORTA, () => {
  console.log(`\n  segnalatore in casa: http://127.0.0.1:${PORTA}/api/stanza`);
  console.log('  (archivio in memoria: si perde tutto allo spegnimento)\n');
});
