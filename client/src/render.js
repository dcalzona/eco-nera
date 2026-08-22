// Disegno. Lo schermo e' nero: si vede solo cio' che una torcia illumina —
// la propria o quella del compagno — piu' quello che si e' gia' visto prima,
// che resta disegnato spento, come un ricordo.

import { TILE, CASELLA, STATO, UMORE, NEMICI, ABILITA } from '../condiviso/regole.js';
import { giaVisto } from './visione.js';
import { RAGGIO_STICK } from './input.js';

const COLORI = {
  fondo: '#05070c',
  pavimento: '#1d2637',
  pavimentoRiga: '#232d41',
  muro: '#313d5c',
  muroCima: '#44547f',
  porta: '#8a6a3a',
  // Il ricordo: stessi disegni, quasi spenti.
  ricordoPavimento: '#0c1017',
  ricordoMuro: '#141b28',
  ricordoPorta: '#1c1a16',
  faro: '#ffc65c',
  eco: '#4ecdc4',
  fantoccio: '#8b95b3',
  nemico: '#e05a5a',
  nemicoAllerta: '#ffa03c',
  colpo: '#ffe9a8',
  colpoNemico: '#ff7a6a',
  vita: '#5fd08a',
  vitaVuota: '#2a3142',
  critico: '#ff5d5d',
  fuoco: '#ffb347',
  marchio: '#c98bff',
  rumore: '#e8e2c0',
  pulsante: 'rgba(223,230,245,0.16)',
  pulsanteAcceso: 'rgba(255,198,92,0.30)',
  testo: '#dfe6f5',
  testoSpento: '#78849f',
};

export class Disegno {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.zoom = 1;
    this.cam = { x: 0, y: 0 };
    this.w = 0;
    this.h = 0;
    this.ridimensiona();
    addEventListener('resize', () => this.ridimensiona());
    // Il solo evento 'resize' non basta: se al primo giro il layout non e'
    // ancora pronto il canvas resta largo zero e lo schermo resta nero per
    // sempre. L'osservatore se ne accorge appena la pagina prende una misura.
    new ResizeObserver(() => this.ridimensiona()).observe(this.canvas);
  }

  ridimensiona() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (w === this.w && h === this.h && this.canvas.width) return;
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Inquadratura: circa undici caselle in verticale, che su un telefono in
    // orizzontale e' abbastanza vicino da leggere la scena e abbastanza largo
    // da vedere arrivare qualcosa.
    this.zoom = Math.max(0.8, Math.min(this.h / (11 * TILE), 2.4));
  }

  /** Il punto del mondo su cui sta la telecamera, senza uscire dalla mappa. */
  inquadra(mappa, x, y) {
    const mezzaW = this.w / 2 / this.zoom;
    const mezzaH = this.h / 2 / this.zoom;
    const mondoW = mappa.larghezza * TILE;
    const mondoH = mappa.altezza * TILE;
    this.cam.x = mondoW <= mezzaW * 2 ? mondoW / 2 : Math.max(mezzaW, Math.min(x, mondoW - mezzaW));
    this.cam.y = mondoH <= mezzaH * 2 ? mondoH / 2 : Math.max(mezzaH, Math.min(y, mondoH - mezzaH));
  }

  schermo(x, y) {
    return {
      x: (x - this.cam.x) * this.zoom + this.w / 2,
      y: (y - this.cam.y) * this.zoom + this.h / 2,
    };
  }

  /** Il rettangolo di mondo inquadrato, in pixel di mondo. */
  finestra() {
    const mezzaW = this.w / 2 / this.zoom;
    const mezzaH = this.h / 2 / this.zoom;
    return { x: this.cam.x - mezzaW, y: this.cam.y - mezzaH, w: mezzaW * 2, h: mezzaH * 2 };
  }

  scena(mappa, personaggi, io, luci, memoria, nemici = [], coni = [], colpi = [], fuochi = []) {
    const c = this.ctx;
    c.fillStyle = COLORI.fondo;
    c.fillRect(0, 0, this.w, this.h);
    if (!mappa.griglia?.length) return;

    c.save();
    c.translate(this.w / 2, this.h / 2);
    c.scale(this.zoom, this.zoom);
    c.translate(-this.cam.x, -this.cam.y);

    // 1. Il ricordo: quello che si e' gia' visto, spento.
    if (memoria) this.piastrelle(mappa, memoria);

    // 2. La luce: si ritaglia l'unione dei coni e dentro si disegna a colori.
    if (luci?.length) {
      c.save();
      c.beginPath();
      for (const luce of luci) this.contorno(luce);
      c.clip();
      this.piastrelle(mappa, null);
      c.restore();

      // La tinta e la sfumatura ai bordi, una luce per volta.
      for (const luce of luci) {
        c.save();
        c.beginPath();
        this.contorno(luce);
        c.clip();
        this.alone(luce);
        c.restore();
      }
    }

    // 3. Cosa vedono i nemici che stiamo guardando. Si disegna prima di loro,
    //    sotto, come una macchia sul pavimento.
    for (const cono of coni) this.conoNemico(cono);

    // 3b. I fuochi piantati per terra.
    for (const f of fuochi) this.fuoco(f);

    // 4. I personaggi. I compagni si vedono sempre: si sa dov'e' il proprio,
    //    anche al buio. I nemici solo quando qualcuno li illumina.
    for (const n of nemici) this.nemico(n);
    for (const p of personaggi) this.personaggio(p, p.i === io);

    // 5. I colpi in volo si vedono sempre, anche al buio: una scia nel nero e'
    //    il modo piu' onesto di dire "ti stanno sparando, e da quella parte".
    for (const colpo of colpi) this.colpo(colpo);

    c.restore();
  }

  conoNemico(cono) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    this.contorno(cono);
    c.fillStyle = cono.umore === UMORE.PATTUGLIA ? 'rgba(224,90,90,0.07)' : 'rgba(255,160,60,0.13)';
    c.fill();
    c.restore();
  }

  fuoco(f) {
    const c = this.ctx;
    // Un puntino che pulsa: si deve capire che e' una cosa messa li' da
    // qualcuno, non un nemico.
    const battito = 4 + Math.sin(performance.now() / 180) * 1.2;
    c.fillStyle = COLORI.fuoco;
    c.beginPath();
    c.arc(f.x, f.y, battito, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,179,71,0.5)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(f.x, f.y, 10, 0, Math.PI * 2);
    c.stroke();
  }

  nemico(n) {
    const c = this.ctx;
    const colore = n.u === UMORE.PATTUGLIA ? COLORI.nemico : COLORI.nemicoAllerta;

    // Marcato dall'Eco: si vede attraverso i muri, e si vede che e' marcato.
    if (n.m) {
      c.strokeStyle = COLORI.marchio;
      c.lineWidth = 2;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.arc(n.x, n.y, 17, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    }

    c.fillStyle = colore;
    c.beginPath();
    c.arc(n.x, n.y, 11, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.translate(n.x, n.y);
    c.rotate(n.a);
    c.fillStyle = '#05070c';
    c.fillRect(6, -2.5, 7, 5);
    c.restore();

    const pieno = Math.max(0, n.v) / NEMICI.pattugliatore.vita;
    if (pieno < 1) {
      c.fillStyle = COLORI.vitaVuota;
      c.fillRect(n.x - 11, n.y - 18, 22, 3);
      c.fillStyle = COLORI.nemico;
      c.fillRect(n.x - 11, n.y - 18, 22 * pieno, 3);
    }
  }

  colpo(p) {
    const c = this.ctx;
    c.fillStyle = p.e ? COLORI.colpoNemico : COLORI.colpo;
    c.beginPath();
    c.arc(p.x, p.y, p.e ? 3 : 2.4, 0, Math.PI * 2);
    c.fill();
  }

  contorno(luce) {
    const c = this.ctx;
    const p = luce.punti;
    c.moveTo(p[0].x, p[0].y);
    for (let k = 1; k < p.length; k++) c.lineTo(p[k].x, p[k].y);
    c.closePath();
  }

  alone(luce) {
    const c = this.ctx;
    const f = this.finestra();
    const g = c.createRadialGradient(luce.x, luce.y, 0, luce.x, luce.y, luce.raggio);
    g.addColorStop(0, tinta(luce.colore, 0.20));
    g.addColorStop(0.5, tinta(luce.colore, 0.07));
    if (luce.sfuma) {
      // Il fascio si spegne verso la punta. Rimane leggero: dove due luci si
      // sovrappongono la penombra si somma, e calcando la mano si otterrebbero
      // macchie scure proprio dove ci si sta illuminando a vicenda.
      g.addColorStop(0.82, 'rgba(5,7,12,0.16)');
      g.addColorStop(1, 'rgba(5,7,12,0.5)');
    } else {
      g.addColorStop(1, tinta(luce.colore, 0));
    }
    c.fillStyle = g;
    c.fillRect(f.x, f.y, f.w, f.h);
  }

  /** Con `memoria` disegna spento le caselle gia' viste; senza, a colori pieni. */
  piastrelle(mappa, memoria) {
    const c = this.ctx;
    const f = this.finestra();
    const tx0 = Math.max(0, Math.floor(f.x / TILE));
    const tx1 = Math.min(mappa.larghezza - 1, Math.ceil((f.x + f.w) / TILE));
    const ty0 = Math.max(0, Math.floor(f.y / TILE));
    const ty1 = Math.min(mappa.altezza - 1, Math.ceil((f.y + f.h) / TILE));

    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (memoria && !giaVisto(memoria, tx, ty)) continue;
        const casella = mappa.griglia[ty][tx];
        const x = tx * TILE;
        const y = ty * TILE;

        if (casella === CASELLA.MURO) {
          c.fillStyle = memoria ? COLORI.ricordoMuro : COLORI.muro;
          c.fillRect(x, y, TILE, TILE);
          if (!memoria && ty > 0 && mappa.griglia[ty - 1][tx] !== CASELLA.MURO) {
            c.fillStyle = COLORI.muroCima;
            c.fillRect(x, y, TILE, 4);
          }
          continue;
        }

        if (memoria) c.fillStyle = COLORI.ricordoPavimento;
        else c.fillStyle = (tx + ty) % 2 === 0 ? COLORI.pavimento : COLORI.pavimentoRiga;
        c.fillRect(x, y, TILE, TILE);

        if (casella === CASELLA.PORTA) {
          c.fillStyle = memoria ? COLORI.ricordoPorta : COLORI.porta;
          c.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        }
      }
    }
  }

  personaggio(p, sonoIo) {
    const c = this.ctx;
    const colore = p.b ? COLORI.fantoccio : p.r === 'faro' ? COLORI.faro : COLORI.eco;

    if (p.st === STATO.CRITICO) {
      // A terra: un cerchio spezzato che si richiude man mano che il compagno
      // lo rianima. Si legge da lontano senza bisogno di scritte.
      c.strokeStyle = COLORI.critico;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(p.x, p.y, 16, 0, Math.PI * 2 * Math.max(0.06, p.rn ?? 0));
      c.stroke();
      c.globalAlpha = 0.55;
    }

    c.fillStyle = colore;
    c.beginPath();
    c.arc(p.x, p.y, 11, 0, Math.PI * 2);
    c.fill();

    // Il verso in cui punta: una tacca sul bordo.
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.a);
    c.fillStyle = '#05070c';
    c.fillRect(6, -2.5, 7, 5);
    c.restore();

    c.globalAlpha = 1;

    if (sonoIo) {
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(p.x, p.y, 14, 0, Math.PI * 2);
      c.stroke();
    } else {
      c.fillStyle = COLORI.testo;
      c.font = '9px system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillText(p.n, p.x, p.y - 18);
    }
  }

  stick(stato) {
    const c = this.ctx;
    for (const s of [stato.stickSx, stato.stickDx]) {
      if (!s) continue;
      c.strokeStyle = 'rgba(223,230,245,0.22)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(s.origine.x, s.origine.y, RAGGIO_STICK, 0, Math.PI * 2);
      c.stroke();

      const dx = s.dito.x - s.origine.x;
      const dy = s.dito.y - s.origine.y;
      const len = Math.hypot(dx, dy) || 1;
      const f = Math.min(len, RAGGIO_STICK);
      c.fillStyle = 'rgba(223,230,245,0.35)';
      c.beginPath();
      c.arc(s.origine.x + (dx / len) * f, s.origine.y + (dy / len) * f, 20, 0, Math.PI * 2);
      c.fill();
    }
  }

  /**
   * I rumori sentiti: un archetto sul bordo dello schermo, nella direzione da
   * cui e' arrivato il suono. Si sa DOVE, non si sa COSA — ed e' proprio quello
   * che rende il buio teso invece che soltanto scomodo.
   */
  rumori(echi, io) {
    if (!echi.length) return;
    const c = this.ctx;
    const cx = this.w / 2;
    const cy = this.h / 2;
    const raggio = Math.min(this.w, this.h) * 0.40;

    for (const e of echi) {
      const ang = Math.atan2(e.y - io.y, e.x - io.x);
      const apertura = 0.30 + e.forza * 0.34;
      const opacita = Math.min(0.85, e.forza * 1.5) * e.vita * e.vita;
      if (opacita < 0.02) continue;

      c.strokeStyle = `rgba(232,226,192,${opacita.toFixed(3)})`;
      c.lineWidth = 3 + e.forza * 5;
      c.lineCap = 'round';
      c.beginPath();
      // L'arco si allarga mentre svanisce, come un'onda che si apre.
      c.arc(cx, cy, raggio + (1 - e.vita) * 16, ang - apertura / 2, ang + apertura / 2);
      c.stroke();
    }
    c.lineCap = 'butt';
  }

  /** I due pulsanti: torcia e abilita' del ruolo, con carica e ricarica. */
  pulsanti(comandi, mio) {
    if (!mio) return;
    const c = this.ctx;
    const b = comandi.pulsanti();

    // Abilita': l'anello si richiude mentre torna disponibile.
    const regola = ABILITA[mio.r] ?? ABILITA.faro;
    const pronta = (mio.ab ?? 0) <= 0;
    cerchio(c, b.abilita, pronta ? COLORI.pulsanteAcceso : COLORI.pulsante);
    if (!pronta) {
      const quanto = 1 - mio.ab / regola.ricarica;
      c.strokeStyle = 'rgba(223,230,245,0.5)';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(b.abilita.x, b.abilita.y, b.abilita.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * quanto);
      c.stroke();
    }
    c.fillStyle = pronta ? COLORI.testo : COLORI.testoSpento;
    c.font = '10px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText(regola.tipo === 'marchio' ? 'MARCA' : 'FUOCO', b.abilita.x, b.abilita.y + 4);

    // Torcia: il pulsante mostra la carica come un anello che si consuma.
    const accesa = mio.l === 1;
    cerchio(c, b.torcia, accesa ? COLORI.pulsanteAcceso : COLORI.pulsante);
    c.strokeStyle = mio.es ? COLORI.critico : accesa ? COLORI.faro : COLORI.testoSpento;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(b.torcia.x, b.torcia.y, b.torcia.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (mio.ca ?? 1));
    c.stroke();
    c.fillStyle = accesa ? COLORI.testo : COLORI.testoSpento;
    c.fillText('TORCIA', b.torcia.x, b.torcia.y + 4);
  }

  /**
   * Vita propria, stato del compagno, e — quando si e' a terra — il tempo che
   * resta. Sta in basso a sinistra, lontano dai pollici.
   */
  cruscotto(mio, tutti, vitaMassima) {
    if (!mio) return;
    const c = this.ctx;
    const y = this.h - 26;

    barra(c, 12, y, 140, 9, Math.max(0, mio.v) / vitaMassima, COLORI.vita);
    c.fillStyle = COLORI.testo;
    c.font = '11px ui-monospace, Consolas, monospace';
    c.textAlign = 'left';
    c.fillText(`${Math.max(0, mio.v)}`, 158, y + 9);

    // Il compagno: come sta e se ha bisogno.
    const compagno = tutti.find((p) => p.i !== mio.i);
    if (compagno) {
      const yc = y - 16;
      barra(c, 12, yc, 90, 6, Math.max(0, compagno.v) / vitaMassima,
            compagno.st === STATO.VIVO ? COLORI.eco : COLORI.critico);
      c.fillStyle = compagno.st === STATO.CRITICO ? COLORI.critico : COLORI.testoSpento;
      c.fillText(
        compagno.st === STATO.CRITICO
          ? `${compagno.n} e' a terra — ${compagno.tc}s`
          : compagno.st === STATO.MORTO
            ? `${compagno.n} rientra fra ${compagno.tc}s`
            : compagno.n,
        108,
        yc + 6,
      );
    }

    if (mio.st === STATO.CRITICO) {
      // Bordo rosso che pulsa: si capisce che e' grave senza leggere niente.
      const battito = 0.18 + 0.12 * Math.sin(performance.now() / 260);
      const bordo = c.createRadialGradient(
        this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.22,
        this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.62,
      );
      bordo.addColorStop(0, 'rgba(255,93,93,0)');
      bordo.addColorStop(1, `rgba(255,93,93,${battito.toFixed(3)})`);
      c.fillStyle = bordo;
      c.fillRect(0, 0, this.w, this.h);

      c.textAlign = 'center';
      c.fillStyle = COLORI.critico;
      c.font = '15px system-ui, sans-serif';
      c.fillText(`A TERRA — ${mio.tc}s`, this.w / 2, 34);
      if ((mio.rn ?? 0) > 0) {
        c.fillStyle = COLORI.testo;
        c.font = '11px system-ui, sans-serif';
        c.fillText('ti stanno rialzando…', this.w / 2, 52);
      }
    } else if (mio.st === STATO.MORTO) {
      c.fillStyle = 'rgba(5,7,12,0.6)';
      c.fillRect(0, 0, this.w, this.h);
      c.textAlign = 'center';
      c.fillStyle = COLORI.testo;
      c.font = '17px system-ui, sans-serif';
      c.fillText(`Fuori gioco — rientri fra ${mio.tc}s`, this.w / 2, this.h / 2);
    }
  }

  hud(righe) {
    const c = this.ctx;
    c.font = '12px ui-monospace, Consolas, monospace';
    c.textAlign = 'left';
    c.fillStyle = COLORI.testoSpento;
    righe.forEach((r, k) => c.fillText(r, 10, 20 + k * 15));
  }

  messaggio(testo) {
    const c = this.ctx;
    c.fillStyle = 'rgba(5,7,12,0.82)';
    c.fillRect(0, 0, this.w, this.h);
    c.fillStyle = COLORI.testo;
    c.font = '16px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText(testo, this.w / 2, this.h / 2);
  }
}

function cerchio(c, p, riempimento) {
  c.fillStyle = riempimento;
  c.beginPath();
  c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  c.fill();
}

function barra(c, x, y, larghezza, altezza, quanto, colore) {
  c.fillStyle = COLORI.vitaVuota;
  c.fillRect(x, y, larghezza, altezza);
  c.fillStyle = colore;
  c.fillRect(x, y, larghezza * Math.max(0, Math.min(1, quanto)), altezza);
}

function tinta(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
