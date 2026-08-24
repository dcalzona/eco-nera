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
import { magazzinoNativo } from './redis-nativo.js';

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
    // Si dice cosa si e' trovato, non solo che manca qualcosa: senza questo
    // elenco l'unico modo di capire e' indovinare. Solo i NOMI delle
    // variabili, mai i valori — quelli sono chiavi.
    return res.status(500).json({
      errore: 'archivio non collegato',
      spiegazione:
        'Serve un archivio Redis collegato a questo progetto. Vanno bene tutti ' +
        'e due i modi: una coppia REST (una variabile che finisce per ' +
        'REST_API_URL o REST_URL con accanto la sua TOKEN) oppure un semplice ' +
        'indirizzo che comincia per redis:// o rediss://. Nessun prefisso e escluso.',
      variabiliCheVedo: nomiInteressanti(),
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
 * I nomi delle variabili non si indovinano: si CERCANO. A seconda di come si
 * collega l'archivio, Vercel le chiama `KV_REST_API_URL`,
 * `UPSTASH_REDIS_REST_URL`, o quello che si e' scritto nel campo "Custom
 * Prefix" della finestra di collegamento — e chi lo compila non ha nessun
 * motivo di sapere che da qualche parte c'e' del codice che si aspetta un
 * nome preciso. Allora si prende qualunque variabile finisca per REST_API_URL
 * o REST_URL e abbia accanto la sua TOKEN.
 */
function scegliMagazzino() {
  const trovato = cercaCredenziali();
  if (!trovato) return null;
  // L'archivio puo' offrire la REST oppure solo il protocollo nativo: a
  // seconda del fornitore c'e' l'una o l'altro, e a chi collega l'archivio
  // dalla finestra di Vercel non viene chiesto di scegliere. Si prende quello
  // che c'e'.
  if (trovato.tipo === 'nativo') return magazzinoNativo(trovato.url);
  const { url, chiave } = trovato;

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

/** Come si arriva all'archivio, comunque si chiamino le variabili. */
function cercaCredenziali() {
  const ambiente = process.env;

  // Prima le coppie note, che sono le piu' comuni e non lasciano dubbi.
  const note = [
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['REDIS_REST_API_URL', 'REDIS_REST_API_TOKEN'],
  ];
  for (const [u, t] of note) {
    if (ambiente[u] && ambiente[t]) {
      return { tipo: 'rest', url: ambiente[u], chiave: ambiente[t] };
    }
  }

  // Poi qualunque prefisso: `PIPPO_REST_API_URL` + `PIPPO_REST_API_TOKEN`.
  for (const nome of Object.keys(ambiente)) {
    const coda = nome.endsWith('_REST_API_URL')
      ? '_REST_API_URL'
      : nome.endsWith('_REST_URL')
        ? '_REST_URL'
        : null;
    if (!coda) continue;
    const valore = ambiente[nome];
    if (!valore || !/^https?:\/\//.test(valore)) continue;

    const radice = nome.slice(0, -coda.length);
    const possibili = [
      `${radice}${coda.replace('_URL', '_TOKEN')}`,
      `${radice}_REST_API_TOKEN`,
      `${radice}_REST_TOKEN`,
      `${radice}_TOKEN`,
    ];
    for (const t of possibili) {
      if (ambiente[t]) return { tipo: 'rest', url: valore, chiave: ambiente[t] };
    }
  }

  // Nessuna REST: va benissimo un indirizzo nativo, comunque si chiami la
  // variabile che lo contiene. Si guarda il valore, non il nome.
  for (const nome of Object.keys(ambiente)) {
    const valore = ambiente[nome];
    if (typeof valore === 'string' && /^rediss?:\/\//.test(valore)) {
      return { tipo: 'nativo', url: valore };
    }
  }

  return null;
}

/**
 * I nomi delle variabili che sembrano riguardare un archivio. Serve solo al
 * messaggio d'errore: si mandano i nomi, mai i valori.
 */
function nomiInteressanti() {
  return Object.keys(process.env)
    .filter((n) => /(KV|REDIS|UPSTASH|STORAGE|DATABASE)/i.test(n))
    .sort();
}
