// La simulazione autoritativa. Gira solo qui, sul PC: i telefoni mandano
// input e ricevono fotografie dello stato. Tutta la logica di gioco si
// scrive e si controlla da questo lato, con i messaggi nel terminale,
// invece che dentro una WebView su un telefono.

import { MAPPA, PARTENZE, centroCasella, pavimenti, muro } from '../client/condiviso/mappa.js';
import { muovi, limita, angolo } from '../client/condiviso/fisica.js';
import { TILE, SOTTOPASSO, SOTTOPASSI_PER_TICK } from '../client/condiviso/regole.js';

const RUOLI = ['faro', 'eco'];

/** Quanto sopravvive un personaggio dopo che il telefono si scollega. */
const GRAZIA_MS = 30_000;

export class Mondo {
  constructor() {
    this.mappa = MAPPA;
    this.giocatori = new Map(); // id -> personaggio
    this.prossimoId = 1;
    this.tick = 0;
    this.fantoccio = null;
    this.caselleLibere = pavimenti(this.mappa);
  }

  entra(sessione, nome) {
    // Stessa sessione = stesso personaggio: un ricaricamento della pagina o
    // lo schermo che si spegne non fanno ricominciare da capo.
    for (const g of this.giocatori.values()) {
      if (g.sessione === sessione) {
        g.online = true;
        g.scollegatoDa = null;
        return g;
      }
    }

    const id = this.prossimoId++;
    const usati = [...this.giocatori.values()].filter((g) => !g.bot).map((g) => g.ruolo);
    const ruolo = RUOLI.find((r) => !usati.includes(r)) ?? RUOLI[usati.length % RUOLI.length];
    const posto = PARTENZE[(id - 1) % PARTENZE.length];
    const p = centroCasella(this.mappa, posto.tx, posto.ty);

    const g = {
      id,
      sessione,
      nome: nome || (ruolo === 'faro' ? 'Faro' : 'Eco'),
      ruolo,
      bot: false,
      online: true,
      scollegatoDa: null,
      x: p.x,
      y: p.y,
      ang: -Math.PI / 2,
      // I comandi arrivano in fila e si consumano uno per sottopasso, nello
      // stesso ordine in cui il telefono li ha eseguiti prevedendo: e' questo
      // che rende i due percorsi identici.
      coda: [],
      ultimoSeq: 0,
    };
    this.giocatori.set(id, g);
    return g;
  }

  esce(id) {
    const g = this.giocatori.get(id);
    if (!g) return;
    g.online = false;
    g.scollegatoDa = Date.now();
    g.coda.length = 0;
  }

  input(id, msg) {
    const g = this.giocatori.get(id);
    if (!g) return;
    const m = limita(Number(msg.mx) || 0, Number(msg.my) || 0);
    const a = limita(Number(msg.ax) || 0, Number(msg.ay) || 0);
    g.coda.push({ seq: Number(msg.q) || 0, mx: m.x, my: m.y, ax: a.x, ay: a.y });
    // Se il telefono e' molto avanti (e' successo qualcosa alla rete) non si
    // accumula all'infinito: si buttano i comandi piu' vecchi.
    while (g.coda.length > 60) g.coda.shift();
  }

  passo(dt) {
    this.tick++;
    const ora = Date.now();

    for (const g of this.giocatori.values()) {
      if (g.bot) {
        this.guidaFantoccio(g, dt);
      } else {
        if (!g.online && ora - g.scollegatoDa > GRAZIA_MS) {
          this.giocatori.delete(g.id);
          continue;
        }
        this.consumaComandi(g);
        this.sbloccaSeIncastrato(g);
      }
    }

    this.regolaFantoccio();
  }

  /**
   * Esegue i comandi in fila, uno per sottopasso. Se la fila e' vuota il
   * personaggio resta fermo invece di ripetere l'ultimo comando: ripeterlo
   * farebbe avanzare il server di un passo che il telefono non ha fatto, e
   * tornerebbe il disaccordo che si sta cercando di togliere.
   */
  consumaComandi(g) {
    // Se si e' accumulato arretrato si recupera, ma senza strappi.
    const quanti = g.coda.length > SOTTOPASSI_PER_TICK * 3
      ? SOTTOPASSI_PER_TICK * 2
      : SOTTOPASSI_PER_TICK;

    for (let k = 0; k < quanti; k++) {
      const c = g.coda.shift();
      if (!c) break;
      g.ultimoSeq = c.seq;
      muovi(g, c.mx, c.my, SOTTOPASSO, this.mappa);
      const a = angolo(c.ax, c.ay) ?? angolo(c.mx, c.my);
      if (a !== null) g.ang = a;
    }
  }

  /**
   * Non deve mai capitare, ma se capita non deve rovinare la serata: chi si
   * ritrova dentro un muro viene rimesso sulla casella libera piu' vicina
   * invece di restare bloccato li' senza controllo.
   */
  sbloccaSeIncastrato(g) {
    const tx = Math.floor(g.x / TILE);
    const ty = Math.floor(g.y / TILE);
    if (!muro(this.mappa, tx, ty)) return;

    let miglior = null;
    let distanza = Infinity;
    for (const c of this.caselleLibere) {
      const d = (c.tx - tx) ** 2 + (c.ty - ty) ** 2;
      if (d < distanza) { distanza = d; miglior = c; }
    }
    const p = centroCasella(this.mappa, miglior.tx, miglior.ty);
    g.x = p.x;
    g.y = p.y;
    console.log(`${g.nome} era incastrato nel muro ${tx},${ty}: rimesso su ${miglior.tx},${miglior.ty}`);
  }

  /**
   * Un compagno finto quando si prova da soli: serve a vedere se
   * l'interpolazione degli altri giocatori e' liscia senza dover accendere
   * due telefoni. Appena entra una persona vera, se ne va.
   */
  regolaFantoccio() {
    const umani = [...this.giocatori.values()].filter((g) => !g.bot && g.online).length;

    if (umani >= 2 && this.fantoccio) {
      this.giocatori.delete(this.fantoccio.id);
      this.fantoccio = null;
      console.log('Il fantoccio si fa da parte: siete in due.');
      return;
    }

    if (umani === 1 && !this.fantoccio) {
      const id = this.prossimoId++;
      // Accanto a chi sta giocando: un compagno di prova che nasce dall'altra
      // parte della mappa non si vede mai, ed e' il motivo per cui esiste.
      const umano = [...this.giocatori.values()].find((g) => !g.bot && g.online);
      const posto = this.casellaLiberaVicino(umano, 3) ?? PARTENZE[1];
      const p = centroCasella(this.mappa, posto.tx, posto.ty);
      this.fantoccio = {
        id,
        sessione: null,
        nome: 'Fantoccio',
        ruolo: 'eco',
        bot: true,
        online: true,
        x: p.x,
        y: p.y,
        ang: 0,
        meta: null,
      };
      this.giocatori.set(id, this.fantoccio);
      console.log('Entra il fantoccio, cosi hai qualcuno da guardare.');
    }
  }

  /** Una casella calpestabile entro `raggio` caselle da chi gioca. */
  casellaLiberaVicino(rispettoA, raggio) {
    if (!rispettoA) return null;
    const cx = Math.floor(rispettoA.x / TILE);
    const cy = Math.floor(rispettoA.y / TILE);
    const vicine = this.caselleLibere.filter(
      (c) => Math.abs(c.tx - cx) <= raggio && Math.abs(c.ty - cy) <= raggio,
    );
    if (vicine.length === 0) return null;
    return vicine[(Math.random() * vicine.length) | 0];
  }

  guidaFantoccio(g, dt) {
    if (!g.meta || Math.hypot(g.meta.x - g.x, g.meta.y - g.y) < 12) {
      // Resta nei paraggi di chi gioca: serve a guardarlo muoversi, non a
      // farsi un giro per conto suo dall'altra parte della mappa.
      const umano = [...this.giocatori.values()].find((p) => !p.bot && p.online);
      const c = this.casellaLiberaVicino(umano, 8)
        ?? this.caselleLibere[(Math.random() * this.caselleLibere.length) | 0];
      g.meta = centroCasella(this.mappa, c.tx, c.ty);
    }
    const dx = g.meta.x - g.x;
    const dy = g.meta.y - g.y;
    const len = Math.hypot(dx, dy) || 1;
    const primaX = g.x;
    const primaY = g.y;
    muovi(g, dx / len, dy / len, dt, this.mappa);
    // Non sa aggirare i muri: se resta fermo contro uno, cambia idea.
    if (Math.hypot(g.x - primaX, g.y - primaY) < 0.4) g.meta = null;
    g.ang = Math.atan2(dy, dx);
  }

  /** La fotografia da spedire ai client. Nomi corti: viaggia 20 volte al secondo. */
  istantanea(ora = Date.now()) {
    const g = [];
    for (const p of this.giocatori.values()) {
      if (!p.online) continue;
      g.push({
        i: p.id,
        // Due decimali, non uno: il telefono riparte da questo numero per
        // rifare i conti, e vicino a un muro un decimo di pixel basta a
        // cambiare se un passo si aggancia allo spigolo oppure no.
        x: Math.round(p.x * 100) / 100,
        y: Math.round(p.y * 100) / 100,
        a: Math.round(p.ang * 100) / 100,
        n: p.nome,
        r: p.ruolo,
        b: p.bot ? 1 : 0,
        s: p.ultimoSeq ?? 0, // ultimo comando eseguito: serve al telefono per rifare i conti
      });
    }
    return { t: 'stato', tick: this.tick, ms: ora, g };
  }
}
