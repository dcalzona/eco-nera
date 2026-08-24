// Un Redis finto che parla RESP, per provare il segnalatore senza averne uno.
//
// Serve a controllare il pezzo piu' delicato: la lettura delle risposte. TCP
// non consegna messaggi, consegna byte — una risposta puo' arrivare spezzata
// in due pacchetti, o due risposte attaccate in uno solo — e chi legge deve
// reggere tutti e due i casi. Con `spezza: true` questo finto Redis manda le
// risposte un byte alla volta, che e' il modo piu' cattivo possibile e il modo
// piu' onesto di scoprire se il lettore e' scritto bene.
//
// Capisce quattro comandi: AUTH, SET (con EX e NX), GET, PING. Bastano.

import net from 'node:net';

export function accendi(porta, { chiave = 'segreta', spezza = false } = {}) {
  const roba = new Map();

  const vivo = (k) => {
    const v = roba.get(k);
    if (!v) return null;
    if (v.scadenza < Date.now()) {
      roba.delete(k);
      return null;
    }
    return v.valore;
  };

  const server = net.createServer((presa) => {
    let dentro = Buffer.alloc(0);
    let autenticata = !chiave;

    // Una coda sola per quello che esce, e un solo che la svuota. Serve per
    // forza: due comandi arrivano spesso nello stesso pacchetto, e con due
    // sgocciolatori in parallelo i byte delle due risposte si mescolerebbero —
    // il che romperebbe la prova invece di metterla alla prova.
    let daScrivere = Buffer.alloc(0);
    let sgocciola = false;
    const rispondi = (testo) => {
      if (!spezza) return presa.write(testo);
      daScrivere = Buffer.concat([daScrivere, Buffer.from(testo)]);
      if (sgocciola) return;
      sgocciola = true;
      const prossimo = () => {
        if (presa.destroyed) return;
        if (!daScrivere.length) {
          sgocciola = false;
          return;
        }
        presa.write(daScrivere.subarray(0, 1));
        daScrivere = daScrivere.subarray(1);
        setTimeout(prossimo, 1);
      };
      prossimo();
    };

    presa.on('data', (pezzo) => {
      dentro = Buffer.concat([dentro, pezzo]);
      for (;;) {
        const letto = leggiComando(dentro);
        if (!letto) return;
        dentro = dentro.subarray(letto.fine);
        esegui(letto.argomenti);
      }
    });

    function esegui(argomenti) {
      const nome = String(argomenti[0] ?? '').toUpperCase();

      if (nome === 'AUTH') {
        const data = argomenti[argomenti.length - 1];
        if (data === chiave) {
          autenticata = true;
          return rispondi('+OK\r\n');
        }
        return rispondi('-WRONGPASS chiave sbagliata\r\n');
      }
      if (!autenticata) return rispondi('-NOAUTH serve autenticarsi\r\n');
      if (nome === 'PING') return rispondi('+PONG\r\n');

      if (nome === 'SET') {
        const [, k, v, ...resto] = argomenti;
        const parole = resto.map((x) => String(x).toUpperCase());
        if (parole.includes('NX') && vivo(k) !== null) return rispondi('$-1\r\n');
        const dove = parole.indexOf('EX');
        const durata = dove >= 0 ? Number(resto[dove + 1]) : 300;
        roba.set(k, { valore: v, scadenza: Date.now() + durata * 1000 });
        return rispondi('+OK\r\n');
      }

      if (nome === 'GET') {
        const v = vivo(argomenti[1]);
        if (v === null) return rispondi('$-1\r\n');
        return rispondi(`$${Buffer.byteLength(v)}\r\n${v}\r\n`);
      }

      return rispondi(`-ERR comando che non conosco: ${nome}\r\n`);
    }
  });

  return new Promise((pronto) => server.listen(porta, () => pronto(server)));
}

/** Legge un comando (una lista RESP). Torna null se non e' arrivato tutto. */
function leggiComando(buf) {
  if (!buf.length || buf[0] !== 0x2a) return null;
  const A_CAPO = Buffer.from('\r\n');
  let dove = buf.indexOf(A_CAPO);
  if (dove < 0) return null;
  const quanti = Number(buf.toString('utf8', 1, dove));
  dove += 2;

  const argomenti = [];
  for (let k = 0; k < quanti; k++) {
    if (buf[dove] !== 0x24) return null;
    const fineRiga = buf.indexOf(A_CAPO, dove);
    if (fineRiga < 0) return null;
    const lunghezza = Number(buf.toString('utf8', dove + 1, fineRiga));
    const inizio = fineRiga + 2;
    if (buf.length < inizio + lunghezza + 2) return null;
    argomenti.push(buf.toString('utf8', inizio, inizio + lunghezza));
    dove = inizio + lunghezza + 2;
  }
  return { argomenti, fine: dove };
}
