// Disegno. Lo schermo e' nero: si vede solo cio' che una torcia illumina —
// la propria o quella del compagno — piu' quello che si e' gia' visto prima,
// che resta disegnato spento, come un ricordo.

import { TILE, CASELLA } from '../condiviso/regole.js';
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

  scena(mappa, personaggi, io, luci, memoria) {
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

    // 3. I personaggi. I compagni si vedono sempre: si sa dov'e' il proprio,
    //    anche al buio. I nemici, quando ci saranno, solo dentro la luce.
    for (const p of personaggi) this.personaggio(p, p.i === io);

    c.restore();
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

function tinta(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
