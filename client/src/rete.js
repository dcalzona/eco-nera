// Il filo con il server: manda gli input, riceve le fotografie dello stato
// e le rimette in fila per il rendering.
//
// Il punto delicato e' qui dentro: il server parla 20 volte al secondo, lo
// schermo disegna 60. Se disegnassimo l'ultima fotografia ricevuta gli altri
// giocatori scatterebbero. Allora si disegna sempre 100 ms nel passato, dove
// le fotografie sono gia' arrivate tutte e due, e si interpola fra loro.

import { RITARDO_INTERP } from '../condiviso/regole.js';

function sessione() {
  let s = localStorage.getItem('ecoNera.sessione');
  if (!s) {
    s = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ecoNera.sessione', s);
  }
  return s;
}

function indirizzo() {
  // Servito dal server stesso: l'indirizzo lo sappiamo gia'.
  if (location.protocol === 'http:') return `ws://${location.host}`;
  // Impacchettato come app: li' bisognera' chiederlo. Per ora un ripiego.
  const salvato = localStorage.getItem('ecoNera.server');
  return salvato ? `ws://${salvato}` : null;
}

export class Rete {
  constructor() {
    this.ws = null;
    this.io = null; // id del nostro personaggio
    this.mappa = null;
    this.stato = 'collego'; // collego | dentro | caduto
    this.fotografie = [];
    this.scarto = null; // differenza fra orologio del server e nostro
    this.ping = 0;
    this.ultimoInput = 0;
    this.tentativi = 0;
    this.contaFotografie = 0;
    this.riconnessioni = 0;
    this.rumoriSentiti = []; // rumori appena arrivati, con l'ora locale
    this.rumoriVisti = new Set();
    this.versioneMappa = 0; // cambia a ogni settore nuovo
  }

  avvia() {
    const url = indirizzo();
    if (!url) {
      this.stato = 'caduto';
      return;
    }

    this.stato = this.tentativi === 0 ? 'collego' : 'riprovo';
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      if (this.io !== null) this.riconnessioni++;
      this.tentativi = 0;
      ws.send(JSON.stringify({ t: 'entra', sessione: sessione() }));
      this.battito = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ t: 'ping', c: performance.now() }));
        }
      }, 1000);
    };

    ws.onmessage = (ev) => this.ricevi(JSON.parse(ev.data));

    ws.onclose = () => {
      clearInterval(this.battito);
      this.stato = 'caduto';
      this.tentativi++;
      // Riprova da sola: il telefono che si blocca in tasca non deve
      // costringere a ricaricare la pagina.
      setTimeout(() => this.avvia(), Math.min(500 * this.tentativi, 4000));
    };

    ws.onerror = () => ws.close();
  }

  ricevi(msg) {
    if (msg.t === 'benvenuto') {
      this.io = msg.id;
      this.mappa = msg.mappa;
      this.ruolo = msg.ruolo;
      this.stato = 'dentro';
      return;
    }

    if (msg.t === 'settore') {
      // Mappa nuova: si buttano le fotografie vecchie, che parlano di un'altra
      // pianta, e chi disegna se ne accorgera' dalla versione.
      this.mappa = msg.mappa;
      this.settore = msg.numero;
      this.fotografie.length = 0;
      this.versioneMappa++;
      return;
    }

    if (msg.t === 'pong') {
      this.ping = Math.round(performance.now() - msg.c);
      return;
    }

    if (msg.t === 'stato') {
      const arrivo = performance.now();
      const scarto = msg.ms - arrivo;
      // Il pacchetto arrivato con meno ritardo e' quello che dice la verita'
      // sull'orologio del server; gli altri hanno preso traffico per strada.
      if (this.scarto === null || scarto > this.scarto) this.scarto = scarto;
      else this.scarto += (scarto - this.scarto) * 0.01;

      this.contaFotografie++;

      // I rumori sono eventi, non stato: si raccolgono man mano che arrivano
      // e restano qualche istante per essere disegnati mentre svaniscono.
      for (const s of msg.su ?? []) {
        if (this.rumoriVisti.has(s.i)) continue;
        this.rumoriVisti.add(s.i);
        this.rumoriSentiti.push({ ...s, nato: performance.now() });
      }
      while (this.rumoriSentiti.length > 40) this.rumoriSentiti.shift();
      if (this.rumoriVisti.size > 400) this.rumoriVisti.clear();

      this.fotografie.push(msg);
      const taglio = msg.ms - 2000;
      while (this.fotografie.length > 2 && this.fotografie[0].ms < taglio) {
        this.fotografie.shift();
      }
    }
  }

  /**
   * Un comando per ogni sottopasso, numerato. Il numero e' la chiave di tutto:
   * il server rimanda indietro l'ultimo che ha eseguito, e il telefono sa
   * esattamente da dove rifare i conti.
   */
  mandaPasso(seq, io) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        t: 'input',
        q: seq,
        mx: Math.round(io.mx * 1000) / 1000,
        my: Math.round(io.my * 1000) / 1000,
        ax: Math.round(io.ax * 1000) / 1000,
        ay: Math.round(io.ay * 1000) / 1000,
        f: io.spara ? 1 : 0,
        l: io.torcia ? 1 : 0,
        b: io.abilita ? 1 : 0,
      }),
    );
  }

  mandaDiario(dati) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ t: 'diario', ...dati }));
  }

  /** Dove stanno tutti, 100 ms nel passato, con le posizioni interpolate. */
  personaggi() {
    return this.interpolati('g', true);
  }

  /** I nemici, interpolati allo stesso modo. */
  nemici() {
    return this.interpolati('n', true);
  }

  /** Lo stato degli obiettivi del settore. */
  obiettivi() {
    return this.fotografie.at(-1)?.ob ?? null;
  }

  /** I fuochi piantati per terra: luci in piu' per tutti. */
  fuochi() {
    const ultima = this.fotografie.at(-1);
    return ultima?.fu ?? [];
  }

  /** I colpi in volo. Corrono: senza interpolarli si vedrebbero a scatti. */
  colpi() {
    return this.interpolati('c', false);
  }

  /**
   * Il lavoro comune: si trovano le due fotografie a cavallo dell'istante da
   * disegnare e si mescolano. Chi compare solo nella piu' recente (un colpo
   * appena partito) si disegna dov'e', senza mescolare niente.
   */
  interpolati(chiave, conAngolo) {
    if (this.fotografie.length === 0 || this.scarto === null) return [];
    const T = performance.now() + this.scarto - RITARDO_INTERP;

    let prima = this.fotografie[0];
    let dopo = null;
    for (let k = 0; k < this.fotografie.length; k++) {
      if (this.fotografie[k].ms <= T) prima = this.fotografie[k];
      else {
        dopo = this.fotografie[k];
        break;
      }
    }

    const listaDopo = dopo?.[chiave] ?? [];
    const listaPrima = prima[chiave] ?? [];
    if (!dopo) return listaPrima.map((p) => ({ ...p }));

    const q = (T - prima.ms) / (dopo.ms - prima.ms || 1);
    return listaDopo.map((b) => {
      const a = listaPrima.find((p) => p.i === b.i);
      if (!a) return { ...b };
      const fuso = {
        ...b,
        x: a.x + (b.x - a.x) * q,
        y: a.y + (b.y - a.y) * q,
      };
      if (conAngolo) fuso.a = a.a + differenzaAngolo(b.a, a.a) * q;
      return fuso;
    });
  }

  /** L'ultima posizione che il server ci attribuisce. */
  ultimaNostra() {
    return this.ultimaNostraConTick()?.p ?? null;
  }

  /** Come sopra, ma con il numero di tick: serve per rifare i conti una volta sola. */
  ultimaNostraConTick() {
    for (let k = this.fotografie.length - 1; k >= 0; k--) {
      const p = this.fotografie[k].g.find((g) => g.i === this.io);
      if (p) return { p, tick: this.fotografie[k].tick };
    }
    return null;
  }
}

function differenzaAngolo(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
