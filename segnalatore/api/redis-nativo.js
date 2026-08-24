// Parlare a Redis nella sua lingua, senza librerie.
//
// Ci sono due modi di arrivare a un Redis: l'API REST via HTTPS — che hanno
// Upstash e il "KV" di Vercel — e il protocollo nativo su TCP, che hanno tutti.
// Se l'archivio che ci si ritrova collegato offre solo `redis://...`, la REST
// non c'e' e bisogna parlare quella.
//
// Il protocollo si chiama RESP ed e' sorprendentemente piccolo: i comandi si
// mandano come una lista di stringhe con la lunghezza davanti, e le risposte
// sono cinque forme in tutto. Per quello che serve qui — autenticarsi, SET,
// GET — sono settanta righe, contro una dipendenza da installare e da tenere
// aggiornata per sempre. Il resto del progetto non ha dipendenze: non e' il
// caso che ne compaia una per tre comandi.
//
// Il punto delicato non e' scrivere, e' leggere: TCP non consegna messaggi,
// consegna byte, e una risposta puo' arrivare spezzata in due pacchetti o
// due risposte attaccate in uno solo. Per questo si accumula e si analizza
// finche' non e' completa, invece di fidarsi di quello che arriva.

import net from 'node:net';
import tls from 'node:tls';

const A_CAPO = Buffer.from('\r\n');

/** Un comando, con la sua risposta. Torna `null` per le risposte vuote. */
export function comandoRedis(url, argomenti, { timeout = 8000 } = {}) {
  const dove = new URL(url);
  const cifrata = dove.protocol === 'rediss:';
  const porta = Number(dove.port) || 6379;
  const utente = decodeURIComponent(dove.username || '');
  const chiave = decodeURIComponent(dove.password || '');

  return new Promise((riuscito, fallito) => {
    const opzioni = { host: dove.hostname, port: porta };
    const presa = cifrata
      ? tls.connect({ ...opzioni, servername: dove.hostname })
      : net.connect(opzioni);

    let accumulato = Buffer.alloc(0);
    const risposte = [];
    // Se c'e' una chiave ci si autentica per prima cosa, nello stesso invio:
    // due comandi in un pacchetto costano un giro di rete invece di due.
    const daMandare = [];
    if (chiave) daMandare.push(utente ? ['AUTH', utente, chiave] : ['AUTH', chiave]);
    daMandare.push(argomenti);
    const attese = daMandare.length;

    const chiudi = (errore, valore) => {
      presa.removeAllListeners();
      presa.destroy();
      if (errore) fallito(errore);
      else riuscito(valore);
    };

    presa.setTimeout(timeout, () => chiudi(new Error('archivio: non risponde')));
    presa.on('error', (e) => chiudi(new Error(`archivio: ${e.message}`)));
    presa.on('close', () => {
      if (risposte.length < attese) chiudi(new Error('archivio: collegamento chiuso a meta'));
    });

    presa.on('connect', () => presa.write(daMandare.map(inRESP).join('')));
    if (cifrata) presa.on('secureConnect', () => {});

    presa.on('data', (pezzo) => {
      accumulato = Buffer.concat([accumulato, pezzo]);
      // Si analizza finche' si riesce: in un pacchetto ci possono stare due
      // risposte, e una risposta puo' essere spalmata su due pacchetti.
      for (;;) {
        const letta = analizza(accumulato, 0);
        if (!letta) return; // incompleta: si aspetta il resto
        accumulato = accumulato.subarray(letta.fine);
        if (letta.errore) return chiudi(new Error(`archivio: ${letta.errore}`));
        risposte.push(letta.valore);
        if (risposte.length === attese) return chiudi(null, risposte[risposte.length - 1]);
      }
    });
  });
}

/** Un comando in RESP: una lista di stringhe, ognuna con la sua lunghezza. */
function inRESP(argomenti) {
  let fuori = `*${argomenti.length}\r\n`;
  for (const a of argomenti) {
    const s = String(a);
    fuori += `$${Buffer.byteLength(s)}\r\n${s}\r\n`;
  }
  return fuori;
}

/**
 * Legge una risposta dall'inizio del buffer. Torna `null` se non e' ancora
 * arrivata tutta — che non e' un guasto, e' il caso normale.
 */
function analizza(buf, da) {
  if (buf.length <= da) return null;
  const tipo = buf[da];
  const fineRiga = buf.indexOf(A_CAPO, da);
  if (fineRiga < 0) return null;
  const riga = buf.toString('utf8', da + 1, fineRiga);

  // + stringa semplice, - errore, : numero
  if (tipo === 0x2b) return { valore: riga, fine: fineRiga + 2 };
  if (tipo === 0x2d) return { errore: riga, fine: fineRiga + 2 };
  if (tipo === 0x3a) return { valore: Number(riga), fine: fineRiga + 2 };

  // $ stringa lunga, con la lunghezza davanti. -1 vuol dire "niente".
  if (tipo === 0x24) {
    const quanti = Number(riga);
    if (quanti === -1) return { valore: null, fine: fineRiga + 2 };
    const inizio = fineRiga + 2;
    if (buf.length < inizio + quanti + 2) return null;
    return { valore: buf.toString('utf8', inizio, inizio + quanti), fine: inizio + quanti + 2 };
  }

  // Le liste non servono a questo servizio, ma vanno saltate senza inciampare.
  if (tipo === 0x2a) {
    const quanti = Number(riga);
    let dove = fineRiga + 2;
    const dentro = [];
    for (let k = 0; k < quanti; k++) {
      const uno = analizza(buf, dove);
      if (!uno) return null;
      dentro.push(uno.valore);
      dove = uno.fine;
    }
    return { valore: dentro, fine: dove };
  }

  return { errore: `risposta che non capisco (${String.fromCharCode(tipo)})`, fine: fineRiga + 2 };
}

/** Lo stesso magazzino di sempre, ma parlando TCP invece che HTTP. */
export function magazzinoNativo(url) {
  return {
    prendi: async (chiave, valore, durata) =>
      (await comandoRedis(url, ['SET', chiave, valore, 'EX', String(durata), 'NX'])) !== null,
    scrivi: (chiave, valore, durata) =>
      comandoRedis(url, ['SET', chiave, valore, 'EX', String(durata)]),
    leggi: (chiave) => comandoRedis(url, ['GET', chiave]),
  };
}
