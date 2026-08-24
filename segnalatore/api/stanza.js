// Il servizietto che fa incontrare i due telefoni.
//
// Non e' un server di gioco: non sa niente del gioco, non vede una partita,
// non tiene niente acceso. Fa una cosa sola — tiene da parte due stringhe per
// tre minuti, sotto un codice di sei cifre — e per questo sta benissimo su
// Vercel, che e' fatto apposta per funzioni che rispondono e muoiono.
//
// Il giro e' questo:
//
//   POST  /api/stanza  {stanza}            ->  {ruolo: 'ospita'|'invitato'}
//   PUT   /api/stanza  {stanza, offerta}   ->  {ok}
//   GET   /api/stanza?stanza=1234          ->  {offerta, risposta}
//   PUT   /api/stanza  {stanza, risposta}  ->  {ok}
//
// La stanza e' un numero di quattro cifre che si scelgono i due giocatori.
// Nessuno dichiara di voler ospitare: entrano tutti e due nello stesso numero
// e il POST dice a ciascuno chi e'. **Il primo che arriva ospita**, e a
// deciderlo non e' la fortuna ma il `SET NX` dell'archivio: se premono nello
// stesso millesimo di secondo, uno solo vince la scrittura.
//
// Chi ospita lascia la sua offerta e poi chiede ogni tanto se e' arrivata la
// risposta. Chi e' invitato aspetta l'offerta, prepara la sua risposta e la
// lascia li'. Finito lo scambio i due telefoni si parlano diretti e questo
// servizio non c'entra piu' niente: se lo spegnessero a meta' partita non se
// ne accorgerebbe nessuno.

/**
 * Quanto vive una stanza senza che nessuno la tocchi.
 *
 * E' piu' corta di prima — un minuto e mezzo invece di tre — e il motivo e'
 * che adesso il numero lo scegliete voi e lo riusate. Se chi ospita chiude
 * l'app senza salutare, il suo posto resta occupato da un telefono che non
 * c'e' piu': chi entra dopo si aggancerebbe a un fantasma e aspetterebbe per
 * sempre. Scaduta la stanza, il posto torna libero e si riprova.
 *
 * Chi ospita la tiene viva riscrivendo la sua offerta mentre aspetta: e' un
 * battito che non costa un giro di rete in piu', perche' quel giro lo fa gia'.
 */
import { magazzinoNativo } from './redis-nativo.js';

const DURATA = 90;

/**
 * Quattro cifre, e stavolta scelte da chi gioca.
 *
 * Quando il numero lo dava il servizio ne servivano sei, a caso: un codice
 * vivo e indovinabile lascia rubare l'invito. Uno che scegliete voi e' un'altra
 * cosa — e la gente sceglie 1234, 0000, l'anno di nascita. Per un cooperativo
 * contro il computer il danno massimo e' che entri qualcuno di troppo, e si
 * accetta. Per qualunque cosa che contasse davvero, no.
 */
const CIFRE = 4;

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
    if (req.method === 'POST') return await prendiPosto(req, res, magazzino);
    if (req.method === 'GET') return await guardaStanza(req, res, magazzino);
    if (req.method === 'PUT') return await lasciaQualcosa(req, res, magazzino);
    return res.status(405).json({ errore: 'metodo non previsto' });
  } catch (e) {
    return res.status(500).json({ errore: String(e?.message ?? e) });
  }
}

// --- Le mosse --------------------------------------------------------------

/**
 * Chi sono io in questa stanza?
 *
 * Tutta la domanda sta in una scrittura sola: `SET ... NX` riesce a uno solo.
 * Chi ci riesce ospita, chi trova occupato e' l'invitato — e non c'e' nessuna
 * finestra fra il controllo e la decisione in cui possano infilarsi tutti e
 * due, che e' il motivo per cui non si guarda prima se il posto e' libero.
 */
async function prendiPosto(req, res, magazzino) {
  const stanza = pulisciCodice(corpo(req).stanza ?? '');
  if (!stanza) return res.status(400).json({ errore: 'numero di stanza non valido' });

  const preso = await magazzino.prendi(`stanza:${stanza}:capo`, '1', DURATA);
  if (!preso) return res.status(200).json({ ruolo: 'invitato', dura: DURATA });

  // Il posto era libero: prima di dire "ospiti tu" si butta via quello che era
  // rimasto della volta prima. Senza questo, chi entra fra un attimo leggerebbe
  // l'offerta della partita di ieri e aspetterebbe un telefono spento — con un
  // numero fisso che si riusa tutte le sere, non e' un caso di scuola.
  await magazzino.cancella(`stanza:${stanza}`);
  await magazzino.cancella(`stanza:${stanza}:r`);
  return res.status(200).json({ ruolo: 'ospita', dura: DURATA });
}

/** Cosa c'e' nella stanza: l'offerta di chi ospita, e la risposta se e' arrivata. */
async function guardaStanza(req, res, magazzino) {
  const stanza = pulisciCodice(req.query?.stanza ?? '');
  if (!stanza) return res.status(400).json({ errore: 'numero di stanza non valido' });

  const [offerta, risposta] = await Promise.all([
    magazzino.leggi(`stanza:${stanza}`),
    magazzino.leggi(`stanza:${stanza}:r`),
  ]);
  // Stanza vuota non e' un errore: e' il caso normale di chi arriva per primo
  // e sta aspettando. Chi aspetta ripassa fra un secondo.
  return res.status(200).json({ offerta: offerta ?? null, risposta: risposta ?? null });
}

/** L'offerta di chi ospita, o la risposta di chi e' invitato. */
async function lasciaQualcosa(req, res, magazzino) {
  const { stanza: grezzo, offerta, risposta } = corpo(req);
  const stanza = pulisciCodice(grezzo ?? '');
  if (!stanza) return res.status(400).json({ errore: 'numero di stanza non valido' });

  const roba = offerta ?? risposta;
  if (!roba || typeof roba !== 'string' || roba.length > 20000) {
    return res.status(400).json({ errore: 'descrizione mancante o assurda' });
  }

  if (offerta) {
    // Riscrivere l'offerta rinnova anche il posto: e' il battito di chi ospita
    // mentre aspetta, e non costa un giro di rete in piu' perche' lo fa gia'.
    await magazzino.scrivi(`stanza:${stanza}`, offerta, DURATA);
    await magazzino.scrivi(`stanza:${stanza}:capo`, '1', DURATA);
  } else {
    await magazzino.scrivi(`stanza:${stanza}:r`, risposta, DURATA);
  }
  return res.status(200).json({ ok: true });
}

// --- Cose piccole ----------------------------------------------------------

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
    // Torna vero solo se il posto era libero: e' il "NX" a garantirlo, ed e'
    // tutto quello su cui si regge "il primo che arriva ospita".
    prendi: async (chiave_, valore, durata) =>
      (await comanda(['SET', chiave_, valore, 'EX', String(durata), 'NX'])) !== null,
    scrivi: (chiave_, valore, durata) => comanda(['SET', chiave_, valore, 'EX', String(durata)]),
    leggi: (chiave_) => comanda(['GET', chiave_]),
    cancella: (chiave_) => comanda(['DEL', chiave_]),
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
