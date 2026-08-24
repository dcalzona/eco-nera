// Il servizietto che fa incontrare i due telefoni.
//
// Non e' un server di gioco: non sa niente del gioco, non vede una partita,
// non tiene niente acceso. Fa una cosa sola — tiene da parte due stringhe per
// tre minuti, sotto un codice di sei cifre — e per questo sta benissimo su
// Vercel, che e' fatto apposta per funzioni che rispondono e muoiono.
//
// Il giro e' questo:
//
//   POST  /api/stanza  {offerta}            ->  {codice}
//   GET   /api/stanza?codice=482913         ->  {offerta, risposta}
//   PUT   /api/stanza  {codice, risposta}   ->  {ok}
//
// Chi ospita crea la stanza e poi chiede ogni tanto se e' arrivata la
// risposta. Chi e' invitato legge l'offerta, prepara la sua risposta e la
// lascia li'. Finito lo scambio i due telefoni si parlano diretti e questo
// servizio non c'entra piu' niente: se lo spegnessero a meta' partita non se
// ne accorgerebbe nessuno.

/** Quanto vive una stanza. Tre minuti: il tempo di dire un codice a voce. */
const DURATA = 180;

/** Sei cifre e non quattro: si leggono al telefono lo stesso, e nessuno le indovina. */
const CIFRE = 6;

export default async function handler(req, res) {
  // L'app gira dentro una WebView con origine `http://localhost`: senza queste
  // intestazioni il browser rifiuta la risposta prima ancora di leggerla.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const magazzino = scegliMagazzino();
  if (!magazzino) {
    return res.status(500).json({
      errore: 'magazzino non configurato',
      spiegazione:
        'Serve un archivio Redis collegato al progetto. Cercate le variabili ' +
        'KV_REST_API_URL e KV_REST_API_TOKEN (oppure UPSTASH_REDIS_REST_URL e ' +
        'UPSTASH_REDIS_REST_TOKEN): nessuna delle due coppie e presente.',
    });
  }

  try {
    if (req.method === 'POST') return await creaStanza(req, res, magazzino);
    if (req.method === 'GET') return await leggiStanza(req, res, magazzino);
    if (req.method === 'PUT') return await scriviRisposta(req, res, magazzino);
    return res.status(405).json({ errore: 'metodo non previsto' });
  } catch (e) {
    return res.status(500).json({ errore: String(e?.message ?? e) });
  }
}

// --- Le tre mosse ----------------------------------------------------------

async function creaStanza(req, res, magazzino) {
  const { offerta } = corpo(req);
  if (!offerta || typeof offerta !== 'string' || offerta.length > 20000) {
    return res.status(400).json({ errore: 'offerta mancante o assurda' });
  }

  // Si tira un codice e si prova a prenderlo. Se e' gia' occupato se ne tira
  // un altro: con un milione di codici e due stanze vive capita quasi mai, ma
  // "quasi mai" senza un rimedio e' la sera in cui non funziona.
  for (let tentativo = 0; tentativo < 8; tentativo++) {
    const codice = codiceACaso();
    const preso = await magazzino.prendi(`stanza:${codice}`, offerta, DURATA);
    if (preso) return res.status(200).json({ codice, dura: DURATA });
  }
  return res.status(503).json({ errore: 'nessun codice libero, riprovate' });
}

async function leggiStanza(req, res, magazzino) {
  const codice = pulisciCodice(req.query?.codice ?? '');
  if (!codice) return res.status(400).json({ errore: 'codice non valido' });

  const offerta = await magazzino.leggi(`stanza:${codice}`);
  if (!offerta) return res.status(404).json({ errore: 'stanza scaduta o inesistente' });

  const risposta = await magazzino.leggi(`stanza:${codice}:r`);
  return res.status(200).json({ offerta, risposta: risposta ?? null });
}

async function scriviRisposta(req, res, magazzino) {
  const { codice: grezzo, risposta } = corpo(req);
  const codice = pulisciCodice(grezzo ?? '');
  if (!codice) return res.status(400).json({ errore: 'codice non valido' });
  if (!risposta || typeof risposta !== 'string' || risposta.length > 20000) {
    return res.status(400).json({ errore: 'risposta mancante o assurda' });
  }
  // La stanza deve esistere: se e' scaduta, meglio dirlo che lasciare una
  // risposta a marcire sotto un codice che nessuno leggera' mai.
  if (!(await magazzino.leggi(`stanza:${codice}`))) {
    return res.status(404).json({ errore: 'stanza scaduta o inesistente' });
  }
  await magazzino.scrivi(`stanza:${codice}:r`, risposta, DURATA);
  return res.status(200).json({ ok: true });
}

// --- Cose piccole ----------------------------------------------------------

function codiceACaso() {
  const massimo = 10 ** CIFRE;
  const n = Math.floor(Math.random() * massimo);
  return String(n).padStart(CIFRE, '0');
}

function pulisciCodice(testo) {
  const solo = String(testo).replace(/\D/g, '');
  return solo.length === CIFRE ? solo : null;
}

function corpo(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

/**
 * L'archivio. Si parla con Redis via HTTP — nient'altro che `fetch` — cosi'
 * questo servizio non ha nemmeno una dipendenza da installare, come il resto
 * del progetto.
 *
 * I nomi delle variabili sono due coppie perche' a seconda di come si collega
 * l'archivio al progetto Vercel le chiama in un modo o nell'altro: si guardano
 * tutte e due invece di indovinare.
 */
function scegliMagazzino() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const chiave = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !chiave) return null;

  const comanda = async (comando) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(comando),
    });
    if (!r.ok) throw new Error(`archivio: ${r.status}`);
    const d = await r.json();
    return d.result;
  };

  return {
    // Torna vero solo se il codice era libero: e' il "NX" a garantirlo, e
    // senza quello due stanze potrebbero prendersi lo stesso codice.
    prendi: async (chiave_, valore, durata) =>
      (await comanda(['SET', chiave_, valore, 'EX', String(durata), 'NX'])) !== null,
    scrivi: (chiave_, valore, durata) => comanda(['SET', chiave_, valore, 'EX', String(durata)]),
    leggi: (chiave_) => comanda(['GET', chiave_]),
  };
}
