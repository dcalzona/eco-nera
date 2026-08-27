// Disegno. Lo schermo e' nero: si vede solo cio' che una torcia illumina —
// la propria o quella del compagno — piu' quello che si e' gia' visto prima,
// che resta disegnato spento, come un ricordo.

import { TILE, CASELLA, STATO, UMORE, NEMICI, ABILITA, ARMATURA_MASSIMA, RIPARO, BOMBA,
  munizioniDi, STAZIONE, RIPARI_PER_SETTORE, CONVOGLIO, regoleBoss,
} from '../condiviso/regole.js';
import { giaVisto } from './visione.js';
import { t } from './lingue.js';
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
  assalto: '#b6e06a',
  kit: '#7fe0a0',
  sonar: '#8fd0ff',
  armatura: '#8ab4ff',
  cassa: '#c8a86a',
  colpo: '#ffe9a8',
  colpoNemico: '#ff7a6a',
  vita: '#5fd08a',
  vitaVuota: '#2a3142',
  critico: '#ff5d5d',
  fuoco: '#ffb347',
  marchio: '#c98bff',
  nucleo: '#ffd166',
  nucleoAcceso: '#5fd08a',
  riparo: '#9aa8c4',
  riparoRotto: '#6d5040',
  bomba: '#ff8a4c',
  miccia: '#ff5d5d',
  zona: '#c98bff',
  scoppio: '#ffd9a0',
  uscita: '#7fd3ff',
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

  scena(mappa, personaggi, io, luci, memoria, extra = {}) {
    const {
      nemici = [], coni = [], colpi = [], oggetti = [], sonar = [],
      casse = [], stazioni = [], ripari = [], scoppi = [], mioId = null,
    } = extra;
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

    // 3b. Le cose lasciate per terra: kit, sonar, ripari.
    for (const s of sonar) this.sonarATerra(s);
    for (const z of stazioni) this.stazione(z, memoria, mioId);
    for (const cassa of casse) this.cassaRifornimento(cassa, memoria, mioId);
    for (const o of oggetti) this.kitMedico(o);
    for (const r of ripari) this.riparo(r);

    // 4. I personaggi. I compagni si vedono sempre: si sa dov'e' il proprio,
    //    anche al buio. I nemici solo quando qualcuno li illumina.
    for (const n of nemici) this.nemico(n);
    for (const p of personaggi) this.personaggio(p, p.i === io);

    // 5. I colpi in volo si vedono sempre, anche al buio: una scia nel nero e'
    //    il modo piu' onesto di dire "ti stanno sparando, e da quella parte".
    for (const colpo of colpi) this.colpo(colpo);
    for (const e of scoppi) this.scoppio(e);

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

  /**
   * Una cassa di rifornimento. Si vede solo dove si e' gia' stati, come i
   * nuclei: trovarle fa parte del girare. Se l'hai gia' presa tu resta
   * disegnata spenta — al compagno serve ancora.
   */
  cassaRifornimento(cassa, memoria, mioId) {
    if (memoria && !this.scoperto(cassa, memoria)) return;
    const c = this.ctx;
    const presa = mioId !== null && cassa.u?.includes(mioId);
    c.save();
    c.globalAlpha = presa ? 0.28 : 1;

    c.fillStyle = COLORI.cassa;
    stondato(c, cassa.x - 9, cassa.y - 7, 18, 14, 3);
    c.fill();
    c.strokeStyle = 'rgba(5,7,12,0.7)';
    c.lineWidth = 1.2;
    c.stroke();

    // La fascia chiara sul coperchio: la fa leggere come una cassa e non come
    // una macchia sul pavimento.
    c.fillStyle = COLORI.armatura;
    c.fillRect(cassa.x - 9, cassa.y - 2, 18, 3.4);

    if (!presa) {
      c.strokeStyle = tinta(COLORI.armatura, 0.35 + 0.25 * Math.sin(performance.now() / 400));
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(cassa.x, cassa.y, 14, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }

  /**
   * Una stazione di ricarica.
   *
   * Si disegna anche quando e' gia' stata usata, spenta: vedere che c'e' e che
   * non serve piu' e' un'informazione, vedere il vuoto dove era non lo e' — e
   * senza si torna indietro per niente proprio quando si e' a secco.
   *
   * Il cerchio attorno e' il raggio vero in cui bisogna stare, non una
   * decorazione: si vede dove fermarsi senza doverlo indovinare.
   */
  stazione(z, memoria, mioId) {
    if (memoria && !this.scoperto(z, memoria)) return;
    const c = this.ctx;
    const usata = mioId !== null && z.u?.includes(mioId);
    c.save();
    c.globalAlpha = usata ? 0.22 : 1;

    // La cassa madre: piu' larga e bassa di una cassa qualsiasi, cosi' le due
    // non si confondono a colpo d'occhio.
    c.fillStyle = usata ? COLORI.vitaVuota : '#2f4a44';
    stondato(c, z.x - 15, z.y - 10, 30, 20, 4);
    c.fill();
    c.strokeStyle = 'rgba(5,7,12,0.7)';
    c.lineWidth = 1.2;
    c.stroke();

    // Tre tacche: si legge come "roba da prendere" e non come un macchinario.
    c.fillStyle = usata ? COLORI.testoSpento : COLORI.kit;
    for (let k = -1; k <= 1; k++) c.fillRect(z.x + k * 8 - 2, z.y - 5, 4, 10);

    if (!usata) {
      c.strokeStyle = tinta(COLORI.kit, 0.3 + 0.22 * Math.sin(performance.now() / 500));
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(z.x, z.y, STAZIONE.raggio, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }

  /**
   * Il riparo dell'Assalto: una barra piantata di traverso. Si vede sempre,
   * anche al buio — e' roba vostra, e sapere dov'e' la propria copertura fa
   * parte del poterla usare. Quanto e' malmesso si legge dal colore: da
   * metallo chiaro a legno bruciato.
   */
  riparo(r) {
    const c = this.ctx;
    const pieno = Math.max(0, Math.min(1, r.v ?? 1));
    c.save();
    c.translate(r.x, r.y);
    c.rotate(r.a);

    // Il corpo: lungo lungo la barriera, sottile lungo la direzione di tiro.
    c.fillStyle = pieno > 0.35 ? COLORI.riparo : COLORI.riparoRotto;
    c.globalAlpha = 0.45 + 0.55 * pieno;
    c.fillRect(-RIPARO.spessore / 2, -RIPARO.mezzaLunghezza, RIPARO.spessore, RIPARO.mezzaLunghezza * 2);
    c.globalAlpha = 1;

    // Il lato verso cui protegge, marcato: si deve capire da che parte stare.
    c.fillStyle = tinta(COLORI.assalto, 0.55 * pieno + 0.15);
    c.fillRect(RIPARO.spessore / 2 - 2, -RIPARO.mezzaLunghezza, 2, RIPARO.mezzaLunghezza * 2);

    // Le crepe quando comincia a cedere.
    if (pieno < 0.7) {
      c.strokeStyle = 'rgba(5,7,12,0.75)';
      c.lineWidth = 1.2;
      c.beginPath();
      for (let k = -1; k <= 1; k++) {
        const y = k * RIPARO.mezzaLunghezza * 0.55;
        c.moveTo(-RIPARO.spessore / 2, y);
        c.lineTo(RIPARO.spessore / 2, y + 4 * (1 - pieno));
      }
      c.stroke();
    }
    c.restore();
  }

  /** Uno scoppio: un anello che si apre e si spegne. */
  scoppio(e) {
    const c = this.ctx;
    const q = Math.max(0, Math.min(1, e.resta / 1.2));
    const raggio = BOMBA.raggioScoppio * (1 - q * 0.85);
    c.save();
    c.globalAlpha = q;
    const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, Math.max(1, raggio));
    g.addColorStop(0, tinta(COLORI.scoppio, 0.9));
    g.addColorStop(0.6, tinta(COLORI.bomba, 0.45));
    g.addColorStop(1, tinta(COLORI.bomba, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(e.x, e.y, Math.max(1, raggio), 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = tinta(COLORI.scoppio, q);
    c.lineWidth = 3;
    c.beginPath();
    c.arc(e.x, e.y, Math.max(1, raggio), 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  /** Il kit medico lasciato a terra: una croce che pulsa piano. */
  kitMedico(k) {
    const c = this.ctx;
    const battito = 0.75 + 0.25 * Math.sin(performance.now() / 320);
    c.save();
    c.globalAlpha = Math.min(1, k.resta / 3) * battito; // sbiadisce prima di sparire
    c.fillStyle = COLORI.kit;
    c.fillRect(k.x - 6, k.y - 2, 12, 4);
    c.fillRect(k.x - 2, k.y - 6, 4, 12);
    c.strokeStyle = tinta(COLORI.kit, 0.45);
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(k.x, k.y, 11, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  /**
   * Il sonar: un cerchio che si allarga a ondate. Si vede anche al buio, e la
   * sua portata si intuisce dall'onda — cosi' si capisce dove conviene posarlo.
   */
  sonarATerra(s) {
    const c = this.ctx;
    const fase = ((performance.now() / 1600) % 1);
    c.save();
    c.globalAlpha = Math.min(1, s.resta / 3);

    c.strokeStyle = tinta(COLORI.sonar, 0.5 * (1 - fase));
    c.lineWidth = 2;
    c.beginPath();
    c.arc(s.x, s.y, 10 + fase * (s.r - 10), 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = COLORI.sonar;
    c.beginPath();
    c.arc(s.x, s.y, 4.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = tinta(COLORI.sonar, 0.35);
    c.beginPath();
    c.arc(s.x, s.y, 9, 0, Math.PI * 2);
    c.stroke();
    c.restore();
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

    this.omino(n.x, n.y, n.a, { corpo: colore, arma: 'lunga' });

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
    // La granata del carro porta il suo raggio addosso: si vede grossa perche'
    // PRENDE grosso, non per scenografia. E ha un alone, cosi' si legge da
    // lontano che quella li' non e' un proiettile qualunque.
    if (p.g) {
      c.fillStyle = tinta(COLORI.fuoco, 0.22);
      c.beginPath();
      c.arc(p.x, p.y, p.g + 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = COLORI.fuoco;
      c.beginPath();
      c.arc(p.x, p.y, p.g, 0, Math.PI * 2);
      c.fill();
      return;
    }
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

  /**
   * Un omino visto dall'alto, alla maniera dei giochi a volo d'uccello: si
   * vedono le spalle, la testa, e le braccia protese in avanti sull'arma. Il
   * verso in cui punta si legge dalle braccia, che e' piu' chiaro di una
   * tacca sul bordo e non ha bisogno di essere spiegato.
   *
   * Tutto disegnato con forme, come il resto: le due armi sono diverse fra
   * loro perche' i due ruoli si riconoscano anche da lontano.
   */
  omino(x, y, angolo, opzioni) {
    disegnaOmino(this.ctx, x, y, angolo, opzioni);
  }

  personaggio(p, sonoIo) {
    const c = this.ctx;
    const colore = p.b ? COLORI.fantoccio : coloreDi(p.r);

    if (p.st === STATO.CRITICO) {
      // A terra: un cerchio spezzato che si richiude man mano che il compagno
      // lo rianima. Si legge da lontano senza bisogno di scritte.
      c.strokeStyle = COLORI.critico;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(p.x, p.y, 16, 0, Math.PI * 2 * Math.max(0.06, p.rn ?? 0));
      c.stroke();
    }

    this.omino(p.x, p.y, p.a, {
      corpo: colore,
      arma: armaDi(p.r),
      alpha: p.st === STATO.CRITICO ? 0.75 : 1,
      aTerra: p.st === STATO.CRITICO,
    });

    // Chi porta la bomba se la vede addosso, e la vede anche il compagno: in
    // due bisogna sapere a colpo d'occhio chi ha le mani occupate.
    if (p.bo === 1) this.ordigno(p.x, p.y - 14, null, false);

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
   * Il convoglio e il suo binario.
   *
   * Il binario si vede sempre, spento: e' la cosa che dice DOVE ANDRA', e
   * senza quella scortare qualcosa che si muove da solo diventa seguirlo alla
   * cieca. Il cerchio attorno al vagone e' il raggio vero entro cui bisogna
   * stare, non una decorazione — si vede quando lo si sta perdendo prima che
   * cominci a tornare indietro.
   */
  convoglio(cv) {
    if (!cv) return;
    const c = this.ctx;

    c.strokeStyle = 'rgba(138,106,58,0.35)';
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(cv.via[0][0], cv.via[0][1]);
    for (const q of cv.via) c.lineTo(q[0], q[1]);
    c.stroke();

    // Il pezzo gia' fatto, acceso: si legge il progresso guardando il binario
    // invece che una barra in un angolo.
    c.strokeStyle = tinta(COLORI.cassa, 0.75);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cv.via[0][0], cv.via[0][1]);
    for (const q of cv.via) {
      c.lineTo(q[0], q[1]);
      if (Math.hypot(q[0] - cv.x, q[1] - cv.y) < 6) break;
    }
    c.stroke();

    c.strokeStyle = cv.s
      ? tinta(COLORI.vita, 0.5 + 0.25 * Math.sin(performance.now() / 300))
      : tinta(COLORI.critico, 0.55);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cv.x, cv.y, CONVOGLIO.raggio, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = COLORI.cassa;
    stondato(c, cv.x - 18, cv.y - 12, 36, 24, 4);
    c.fill();
    c.strokeStyle = 'rgba(5,7,12,0.75)';
    c.lineWidth = 1.4;
    c.stroke();
    c.fillStyle = cv.s ? COLORI.vita : COLORI.critico;
    c.fillRect(cv.x - 18, cv.y - 3, 36, 6);
  }

  /**
   * Il boss: piu' grosso, con la sua barra di vita addosso.
   *
   * La barra sta SOPRA di lui e non in cima allo schermo, perche' al buio la
   * cosa che si cerca e' lui: se la barra sta altrove si guarda quella e non
   * la stanza, e questo e' un gioco in cui bisogna guardare la stanza.
   */
  /**
   * Il boss, che adesso sono tre e nessuno e' una palla.
   *
   * Prima era un cerchio arancione con un puntino: una forma che nel gioco non
   * esiste, disegnata al posto di quella che esiste. Due di questi tre sono lo
   * scagnozzo che si conosce gia', ingrandito il doppio — la mole si legge
   * perche' c'e' un metro accanto, gli scagnozzi veri — e il terzo e' un carro
   * armato, che si capisce cos'e' senza bisogno che nessuno lo spieghi.
   */
  boss(b) {
    if (!b) return;
    const c = this.ctx;
    const tipo = b.tp ?? 'bruto';
    const suo = regoleBoss(tipo);

    // L'ombra sotto, e un anello sottile che gli sta ADDOSSO. Il primo alone
    // che avevo messo era un disco pieno largo il doppio della sagoma: da
    // lontano tornava a essere una palla con dentro un omino, cioe' proprio la
    // cosa da cui si scappava. Un alone deve dire "e' grosso", non prendere il
    // posto di quello che e' grosso.
    const attorno = suo.scala * 8;
    c.fillStyle = 'rgba(5,7,12,0.45)';
    c.beginPath();
    c.ellipse(b.x, b.y + 3, attorno * 1.05, attorno * 0.9, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = tinta(suo.colore, 0.3);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(b.x, b.y, attorno, 0, Math.PI * 2);
    c.stroke();

    if (tipo === 'carro') this.carroArmato(b, suo);
    else {
      this.omino(b.x, b.y, b.a, { corpo: suo.colore, arma: 'lunga', scala: suo.scala });
      if (tipo === 'mitragliere') this.armaMontata(b, suo);
    }

    barra(c, b.x - 30, b.y - suo.raggio - 16, 60, 6, b.v / Math.max(1, b.vp), COLORI.critico);
  }

  /**
   * Il carro: scafo, due cingoli e una torretta con la canna lunga. Visto
   * dall'alto e' una scatola con dei denti sui fianchi, ed e' abbastanza —
   * nessuno ha mai avuto dubbi su cosa fosse una scatola con i cingoli.
   */
  carroArmato(b, suo) {
    const c = this.ctx;
    c.save();
    c.translate(b.x, b.y);
    c.rotate(b.a);

    // I cingoli, con le maglie: sono loro a dire che quella cosa e' cingolata.
    c.fillStyle = scurisci(suo.colore, 0.32);
    stondato(c, -21, -23, 42, 10, 3);
    c.fill();
    stondato(c, -21, 13, 42, 10, 3);
    c.fill();
    c.strokeStyle = 'rgba(5,7,12,0.55)';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = -17; x <= 17; x += 6) {
      c.moveTo(x, -22);
      c.lineTo(x, -14);
      c.moveTo(x, 14);
      c.lineTo(x, 22);
    }
    c.stroke();

    // Lo scafo.
    c.fillStyle = suo.colore;
    c.strokeStyle = 'rgba(5,7,12,0.7)';
    c.lineWidth = 1.4;
    stondato(c, -20, -14, 40, 28, 5);
    c.fill();
    c.stroke();

    // La torretta, arretrata, e la canna che esce davanti.
    c.fillStyle = '#0e121a';
    c.fillRect(4, -3.2, 30, 6.4);
    c.fillRect(30, -4.6, 4, 9.2); // il freno di bocca
    c.fillStyle = scurisci(suo.colore, 0.62);
    c.beginPath();
    c.arc(-2, 0, 11.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = scurisci(suo.colore, 1.25);
    c.beginPath();
    c.arc(-6, -4, 2.4, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  /**
   * L'arma montata del mitragliere: canna corta e grossa sopra quella
   * dell'omino, cassa dei colpi e bipiede. Corta perche' la sua gittata E'
   * corta — la sagoma dice da sola dove finisce il pericolo.
   */
  armaMontata(b, suo) {
    const c = this.ctx;
    c.save();
    c.translate(b.x, b.y);
    c.rotate(b.a);

    // La canna in acciaio CHIARO, non nera come quella degli scagnozzi: e'
    // questa la cosa che distingue il mitragliere dal bruto, e una canna nera
    // su fondo nero non distingue niente. Corta e grossa, come la sua gittata.
    c.fillStyle = '#7b8698';
    stondato(c, 8, 2, 23, 7, 2.5);
    c.fill();
    c.fillStyle = '#39414f';
    c.fillRect(29, 0.5, 4.5, 10); // il freno di bocca

    // La cassa dei colpi appesa di lato, col nastro che entra nell'arma.
    c.fillStyle = scurisci(suo.colore, 0.5);
    c.strokeStyle = 'rgba(5,7,12,0.7)';
    c.lineWidth = 1;
    stondato(c, 11, -5, 12, 8, 2);
    c.fill();
    c.stroke();
    c.strokeStyle = '#c8a86a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(17, 3);
    c.lineTo(17, 1);
    c.stroke();

    // E il bipiede sotto la volata.
    c.strokeStyle = '#5a6478';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(24, 8.5);
    c.lineTo(28, 13);
    c.moveTo(24, 8.5);
    c.lineTo(20, 13);
    c.stroke();
    c.lineCap = 'butt';

    c.restore();
  }

  /**
   * Le porte in fondo all'arena, finche' sono chiuse.
   *
   * Vanno disegnate perche' altrimenti si sbatte contro un muro che non c'e':
   * il pavimento e' pavimento, il divieto e' una regola. Vedere una grata
   * chiusa e capire che si apre uccidendo quello grosso e' tutta la lettura
   * che serve.
   */
  porte(ar, aperte) {
    if (!ar || aperte) return;
    const c = this.ctx;
    const o = ar.oltre;
    c.fillStyle = 'rgba(224,90,90,0.10)';
    c.fillRect(o.x * TILE, o.y * TILE, o.w * TILE, o.h * TILE);
    c.strokeStyle = tinta(COLORI.critico, 0.55);
    c.lineWidth = 3;
    for (const [tx, ty] of ar.porte) {
      const x = (tx + 0.5) * TILE;
      const y = (ty + 0.5) * TILE;
      c.beginPath();
      for (let k = -1; k <= 1; k++) {
        c.moveTo(x - 6, y + k * 9);
        c.lineTo(x + 6, y + k * 9);
      }
      c.stroke();
    }
  }

  /**
   * Gli obiettivi, disegnati nel mondo. Ogni modalita' disegna la sua roba, ma
   * l'uscita e' sempre la stessa e sta sempre in fondo: e' il pezzo che dice
   * "qualunque cosa tu sia venuto a fare, ora si torna indietro".
   *
   * I server si vedono solo dove si e' gia' stati — trovarli e' meta' del
   * settore. La bomba e la zona no: sono segnate dal briefing, e la tensione
   * li' non sta nel cercarle, sta nell'arrivarci e restarci.
   */
  obiettivi(ob, memoria, mappa) {
    if (!ob) return;
    const c = this.ctx;
    c.save();
    c.translate(this.w / 2, this.h / 2);
    c.scale(this.zoom, this.zoom);
    c.translate(-this.cam.x, -this.cam.y);

    if (ob.md === 'bomba') {
      this.disegnaBomba(ob.bo);
      this.avvisoBomba(ob.bo);
    }
    else if (ob.md === 'dominio') this.disegnaZona(ob.zo);
    else if (ob.md === 'convoglio') this.convoglio(ob.cv);
    else if (ob.md === 'boss') {
      // Le porte prima del boss: sono scenario, e lui ci sta davanti.
      this.porte(ob.ar, ob.po === 1);
      this.boss(ob.bs);
    } else for (const n of ob.nuclei) this.serverDaSpegnere(n, memoria);

    const uscita = ob.es;
    if (uscita.a || this.scoperto(uscita, memoria)) {
      const battito = uscita.a ? 0.55 + 0.45 * Math.sin(performance.now() / 260) : 0.3;
      c.strokeStyle = COLORI.uscita;
      c.globalAlpha = battito;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(uscita.x, uscita.y, 22, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
      if (uscita.p > 0) {
        c.strokeStyle = COLORI.uscita;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(uscita.x, uscita.y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * uscita.p);
        c.stroke();
      }
    }

    c.restore();
  }

  /**
   * Un server da spegnere: un armadio appoggiato al muro, con le spie davanti.
   * Appoggiato e non in mezzo alla stanza — sembra una cosa installata li', e
   * obbliga a rasentare le pareti, che al buio e' un'altra sensazione.
   */
  serverDaSpegnere(nucleo, memoria) {
    if (!this.scoperto(nucleo, memoria)) return;
    const c = this.ctx;
    const spento = nucleo.a === 1;
    c.save();
    c.translate(nucleo.x, nucleo.y);
    c.rotate(nucleo.o ?? 0);

    // L'armadio: sviluppato lungo la parete, poco profondo.
    c.fillStyle = spento ? '#26313f' : '#33405c';
    stondato(c, -7, -11, 12, 22, 2);
    c.fill();
    c.strokeStyle = 'rgba(5,7,12,0.8)';
    c.lineWidth = 1.2;
    c.stroke();

    // Le spie sul davanti: rosse e inquiete finche' e' acceso, verdi e ferme
    // quando e' spento. E' il colpo d'occhio che dice se manca ancora.
    const battito = 0.45 + 0.45 * Math.sin(performance.now() / 260);
    for (let k = -2; k <= 2; k++) {
      c.fillStyle = spento
        ? tinta(COLORI.nucleoAcceso, 0.85)
        : tinta(COLORI.nucleo, 0.35 + battito * 0.6 * ((k + 3) % 2));
      c.fillRect(2, k * 4 - 1.2, 2.6, 2.4);
    }
    c.restore();

    if (!spento && nucleo.p > 0) {
      c.strokeStyle = COLORI.nucleoAcceso;
      c.lineWidth = 3.5;
      c.beginPath();
      c.arc(nucleo.x, nucleo.y, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * nucleo.p);
      c.stroke();
    }
  }

  /** La bomba: dove si prende, dove va portata, e quanto manca. */
  /**
   * Gli ultimi secondi della miccia: la bomba pulsa e si vede il cerchio che
   * ammazza. Senza, si muore accanto a una cosa che non aveva detto niente —
   * e la missione ti aveva appena chiesto di restarle vicino.
   */
  avvisoBomba(b) {
    if (!b || b.st !== 'piazzata' || b.t > BOMBA.avviso) return;
    const c = this.ctx;
    const battito = 0.35 + 0.35 * Math.sin(performance.now() / 90);
    c.strokeStyle = `rgba(255,93,93,${battito.toFixed(2)})`;
    c.lineWidth = 3;
    c.setLineDash([7, 6]);
    c.beginPath();
    c.arc(b.x, b.y, BOMBA.raggioLetale, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = `rgba(255,93,93,${(battito * 0.25).toFixed(2)})`;
    c.beginPath();
    c.arc(b.x, b.y, BOMBA.raggioLetale, 0, Math.PI * 2);
    c.fill();
  }

  disegnaBomba(bo) {
    if (!bo || bo.st === 'finita') return;
    const c = this.ctx;

    // Il punto dove va piazzata: finche' non e' giu', si vede sempre.
    if (bo.st !== 'piazzata') {
      const battito = 0.4 + 0.3 * Math.sin(performance.now() / 300);
      c.save();
      c.strokeStyle = tinta(COLORI.bomba, battito);
      c.lineWidth = 2.5;
      c.setLineDash([7, 5]);
      c.beginPath();
      c.arc(bo.sx, bo.sy, 26, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      // Quattro squadrette agli angoli: si legge come "qui", non come "cosa".
      c.strokeStyle = tinta(COLORI.bomba, 0.75);
      c.lineWidth = 2;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        c.beginPath();
        c.moveTo(bo.sx + sx * 30, bo.sy + sy * 30 - sy * 9);
        c.lineTo(bo.sx + sx * 30, bo.sy + sy * 30);
        c.lineTo(bo.sx + sx * 30 - sx * 9, bo.sy + sy * 30);
        c.stroke();
      }
      if (bo.p > 0) {
        c.strokeStyle = COLORI.bomba;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(bo.sx, bo.sy, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * bo.p);
        c.stroke();
      }
      c.restore();
    }

    // La bomba vera. In mano la disegna il personaggio che la porta.
    if (bo.st === 'inMano') return;
    this.ordigno(bo.x, bo.y, bo.st === 'piazzata' ? bo.t / BOMBA.miccia : null, bo.c === 1);
  }

  /**
   * L'ordigno. `miccia` da 1 a 0 quando e' piazzata: l'anello si consuma, e
   * quando un nemico e' li' vicino l'anello si ferma e diventa rosso — si deve
   * capire senza leggere che la miccia sta ferma per colpa loro.
   */
  ordigno(x, y, miccia, bloccata) {
    const c = this.ctx;
    const battito = 0.5 + 0.5 * Math.sin(performance.now() / (miccia !== null ? 160 : 420));
    c.save();

    c.fillStyle = COLORI.bomba;
    c.beginPath();
    c.arc(x, y, 8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(5,7,12,0.7)';
    c.lineWidth = 1.2;
    c.stroke();

    // La spia che lampeggia sopra.
    c.fillStyle = tinta(bloccata ? COLORI.critico : COLORI.scoppio, 0.35 + 0.65 * battito);
    c.beginPath();
    c.arc(x, y - 2, 3.2, 0, Math.PI * 2);
    c.fill();

    if (miccia !== null) {
      c.strokeStyle = bloccata ? COLORI.critico : COLORI.miccia;
      c.lineWidth = 3.5;
      c.beginPath();
      c.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, miccia)));
      c.stroke();
    } else {
      c.strokeStyle = tinta(COLORI.bomba, 0.3 + 0.35 * battito);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 15, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }

  /** La zona da tenere: un cerchio con quanto manca sul bordo. */
  disegnaZona(zo) {
    if (!zo) return;
    const c = this.ctx;
    const battito = 0.5 + 0.5 * Math.sin(performance.now() / 420);
    c.save();

    const g = c.createRadialGradient(zo.x, zo.y, zo.r * 0.2, zo.x, zo.y, zo.r);
    g.addColorStop(0, tinta(zo.c ? COLORI.critico : COLORI.zona, 0.02));
    g.addColorStop(1, tinta(zo.c ? COLORI.critico : COLORI.zona, 0.14));
    c.fillStyle = g;
    c.beginPath();
    c.arc(zo.x, zo.y, zo.r, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = tinta(zo.c ? COLORI.critico : COLORI.zona, 0.35 + 0.3 * battito);
    c.lineWidth = 2;
    c.setLineDash([9, 7]);
    c.beginPath();
    c.arc(zo.x, zo.y, zo.r, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);

    if (zo.p > 0) {
      c.strokeStyle = COLORI.zona;
      c.lineWidth = 5;
      c.beginPath();
      c.arc(zo.x, zo.y, zo.r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * zo.p);
      c.stroke();
    }
    c.restore();
  }

  scoperto(punto, memoria) {
    if (!memoria) return false;
    return giaVisto(memoria, Math.floor(punto.x / TILE), Math.floor(punto.y / TILE));
  }

  /**
   * L'allarme: il bordo dello schermo pulsa di rosso. Pulsa il bordo e non
   * tutto lo schermo perche' il gioco si vede gia' poco di suo — coprirlo di
   * rosso lo renderebbe illeggibile proprio nel momento in cui serve vedere.
   */
  allarme(intensita = 1) {
    const c = this.ctx;
    const battito = 0.5 + 0.5 * Math.sin(performance.now() / 240);
    const forza = (0.30 + 0.34 * battito) * intensita;

    // Parte quasi dal centro e arriva ai bordi: cosi' si vede sul serio.
    // Resta un alone e non una lastra rossa perche' il gioco si vede gia'
    // poco di suo, e proprio in quel momento serve vedere.
    const bordo = c.createRadialGradient(
      this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.08,
      this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.62,
    );
    bordo.addColorStop(0, 'rgba(255,40,40,0)');
    bordo.addColorStop(0.55, `rgba(255,40,40,${(forza * 0.35).toFixed(3)})`);
    bordo.addColorStop(1, `rgba(255,40,40,${forza.toFixed(3)})`);
    c.fillStyle = bordo;
    c.fillRect(0, 0, this.w, this.h);

    // Una riga rossa lungo il bordo, che non lascia dubbi.
    c.strokeStyle = `rgba(255,60,60,${(0.35 + 0.45 * battito).toFixed(3)})`;
    c.lineWidth = 4;
    c.strokeRect(2, 2, this.w - 4, this.h - 4);
  }

  /** Il lampo del momento in cui l'allarme scatta: mezzo secondo, poi passa. */
  lampoAllarme(quanto) {
    if (quanto <= 0) return;
    const c = this.ctx;
    c.fillStyle = `rgba(255,60,60,${(quanto * 0.45).toFixed(3)})`;
    c.fillRect(0, 0, this.w, this.h);
  }

  /**
   * A che punto e' la missione, in alto. Una riga sola, diversa per ogni
   * modalita' e per ogni momento: cosa fare adesso, non cosa fare in generale.
   * E' l'unico posto in cui il gioco parla, quindi deve dire la cosa giusta.
   */
  missione(ob, io) {
    if (!ob) return;
    const c = this.ctx;
    const bo = ob.bo;
    const zo = ob.zo;

    let testo;
    let colore = COLORI.testo;
    if (ob.al) {
      testo = t('gioco.allarme');
      colore = COLORI.critico;
    } else if (ob.es.a) {
      testo = t('gioco.tornaUscita', { settore: ob.settore });
      colore = COLORI.uscita;
    } else if (ob.md === 'bomba' && bo) {
      const quale = bo.q > 1 ? ` (${bo.n + 1}/${bo.q})` : '';
      if (bo.st === 'aTerra') {
        testo = t('gioco.bombaPrendi', { settore: ob.settore }) + quale;
        colore = COLORI.bomba;
      } else if (bo.st === 'inMano') {
        testo = t('gioco.bombaPorta', { secondi: bo.t }) + quale;
        colore = bo.t <= 12 ? COLORI.critico : COLORI.bomba;
      } else {
        testo = bo.c
          ? t('gioco.bombaBloccata', { secondi: bo.t })
          : t('gioco.bombaDifendi', { secondi: bo.t });
        colore = bo.c ? COLORI.critico : COLORI.miccia;
      }
    } else if (ob.md === 'dominio' && zo) {
      testo = zo.c
        ? t('gioco.zonaContesa')
        : t('gioco.zona', { settore: ob.settore, percento: Math.round(zo.p * 100) });
      colore = zo.c ? COLORI.critico : COLORI.zona;
    } else {
      const accesi = ob.nuclei.filter((n) => n.a).length;
      testo = t('gioco.server', { settore: ob.settore, accesi, totale: ob.nuclei.length });
    }

    c.textAlign = 'center';
    c.font = ob.al ? 'bold 14px system-ui, sans-serif' : '13px system-ui, sans-serif';
    c.fillStyle = colore;
    c.fillText(testo, this.w / 2, 24);

    if (!io) return;

    // Una freccia sul bordo verso quello che conta adesso. L'uscita quando e'
    // aperta; se no la bomba o la zona, che il briefing ha gia' segnato sulla
    // pianta. Per i server no: trovarli e' il gioco.
    let meta = null;
    if (ob.es.a) meta = { x: ob.es.x, y: ob.es.y, colore: COLORI.uscita };
    else if (ob.md === 'bomba' && bo && bo.st !== 'finita') {
      meta = bo.st === 'aTerra'
        ? { x: bo.x, y: bo.y, colore: COLORI.bomba }
        : { x: bo.sx, y: bo.sy, colore: COLORI.bomba };
    } else if (ob.md === 'dominio' && zo) meta = { x: zo.x, y: zo.y, colore: COLORI.zona };
    if (!meta) return;

    const ang = Math.atan2(meta.y - io.y, meta.x - io.x);
    const raggio = Math.min(this.w, this.h) * 0.44;
    const x = this.w / 2 + Math.cos(ang) * raggio;
    const y = this.h / 2 + Math.sin(ang) * raggio;
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.fillStyle = meta.colore;
    c.globalAlpha = 0.5 + 0.35 * Math.sin(performance.now() / 260);
    c.beginPath();
    c.moveTo(11, 0);
    c.lineTo(-7, 7);
    c.lineTo(-7, -7);
    c.closePath();
    c.fill();
    c.restore();
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
    // Quanti ripari restano, addosso al tasto che li pianta: e' il numero che
    // serve proprio mentre si decide se piantarne uno, e cercarlo in un angolo
    // dello schermo vorrebbe dire non guardarlo mai.
    if (regola.tipo === 'riparo') {
      const rimasti = mio.rp ?? RIPARI_PER_SETTORE;
      for (let k = 0; k < RIPARI_PER_SETTORE; k++) {
        const px = b.abilita.x - ((RIPARI_PER_SETTORE - 1) * 6) + k * 12;
        c.fillStyle = k < rimasti ? COLORI.assalto : COLORI.vitaVuota;
        c.fillRect(px, b.abilita.y + b.abilita.r + 4, 9, 4);
      }
    }

    c.fillStyle = pronta ? COLORI.testo : COLORI.testoSpento;
    c.font = '10px system-ui, sans-serif';
    c.textAlign = 'center';
    // L'etichetta segue l'abilita' vera: prima diceva ancora MARCA e FUOCO,
    // che sono i nomi di due abilita' che non esistono piu'.
    c.fillText(t(`abilita.${regola.tipo}.breve`), b.abilita.x, b.abilita.y + 4);

    // Torcia: il pulsante mostra la carica come un anello che si consuma.
    const accesa = mio.l === 1;
    cerchio(c, b.torcia, accesa ? COLORI.pulsanteAcceso : COLORI.pulsante);
    c.strokeStyle = mio.es ? COLORI.critico : accesa ? COLORI.faro : COLORI.testoSpento;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(b.torcia.x, b.torcia.y, b.torcia.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (mio.ca ?? 1));
    c.stroke();
    c.fillStyle = accesa ? COLORI.testo : COLORI.testoSpento;
    c.fillText(t('gioco.torcia'), b.torcia.x, b.torcia.y + 4);
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

    // L'armatura sta sopra la salute, piu' sottile: e' il primo strato a
    // consumarsi, e si legge nell'ordine in cui se ne va.
    if ((mio.ar ?? 0) > 0) {
      barra(c, 12, y - 8, 140, 5, mio.ar / ARMATURA_MASSIMA, COLORI.armatura);
    }

    // Il compagno: come sta e se ha bisogno.
    const compagno = tutti.find((p) => p.i !== mio.i);
    if (compagno) {
      const yc = y - 16;
      barra(c, 12, yc, 90, 6, Math.max(0, compagno.v) / vitaMassima,
            compagno.st === STATO.VIVO ? COLORI.eco : COLORI.critico);
      c.fillStyle = compagno.st === STATO.CRITICO ? COLORI.critico : COLORI.testoSpento;
      c.fillText(
        compagno.st === STATO.CRITICO
          ? t('gioco.compagnoATerra', { nome: compagno.n, secondi: compagno.tc })
          : compagno.st === STATO.MORTO
            ? t('gioco.compagnoRientra', { nome: compagno.n, secondi: compagno.tc })
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
      c.fillText(t('gioco.aTerra', { secondi: mio.tc }), this.w / 2, 34);
      if ((mio.rn ?? 0) > 0) {
        c.fillStyle = COLORI.testo;
        c.font = '11px system-ui, sans-serif';
        c.fillText(t('gioco.tiRialzano'), this.w / 2, 52);
      }
    } else if (mio.st === STATO.MORTO) {
      c.fillStyle = 'rgba(5,7,12,0.6)';
      c.fillRect(0, 0, this.w, this.h);
      c.textAlign = 'center';
      c.fillStyle = COLORI.testo;
      c.font = '17px system-ui, sans-serif';
      c.fillText(t('gioco.fuoriGioco', { secondi: mio.tc }), this.w / 2, this.h / 2);
    }
  }

  /**
   * Le munizioni: un pulsante tondo in fila con torcia e abilita'.
   *
   * Prima erano un numero e dei pallini scritti in basso a destra, che
   * cadevano proprio sopra il tasto della torcia: si sovrapponevano e non si
   * capiva cosa fosse cosa. Adesso hanno la stessa faccia degli altri due
   * comandi — cerchio, anello, numero — perche' stanno nello stesso posto e si
   * guardano nello stesso momento. E' lo stesso trucco delle pozioni di Dragon
   * Tower: il numero non sta in un angolo dello schermo, sta ADDOSSO alla cosa
   * che lo consuma.
   *
   * E si preme: ricarica. Il caricatore si rimetteva gia' da solo, ma solo a
   * canna vuota — e in mezzo c'e' il caso che conta, dodici su venti e una
   * porta da aprire. Quando premerlo serve a qualcosa il pulsante si accende,
   * come gli altri due: se e' spento non c'e' niente da fare.
   *
   * `X/Y` e non un numero solo: dodici da soli non dicono se sono tanti o
   * pochi, dodici su venti si'.
   */
  munizioni(comandi, mio) {
    if (!mio) return;
    const c = this.ctx;
    const b = comandi.pulsanti().munizioni;
    if (!b) return;

    const m = munizioniDi(mio.r ?? 'faro');
    const colpi = mio.co ?? m.caricatore;
    const riserve = mio.rs ?? 0;
    const ricarica = mio.rc ?? 0;
    const secco = colpi === 0 && riserve === 0;
    const pochi = colpi <= Math.max(2, Math.round(m.caricatore * 0.25));
    // Acceso quando premerlo cambia qualcosa: c'e' posto in canna e c'e' un
    // caricatore da metterci. Sennò e' spento come un'abilita' in ricarica.
    const puoRicaricare = ricarica <= 0 && riserve > 0 && colpi < m.caricatore;

    cerchio(c, b, puoRicaricare ? COLORI.pulsanteAcceso : COLORI.pulsante);

    // L'anello: il caricatore, o la ricarica in corso.
    const quanto = ricarica > 0 ? 1 - ricarica / m.ricarica : colpi / m.caricatore;
    c.strokeStyle = ricarica > 0
      ? COLORI.armatura
      : secco
        ? COLORI.critico
        : pochi
          ? COLORI.nemicoAllerta
          : COLORI.testo;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * quanto);
    c.stroke();

    c.textAlign = 'center';
    if (ricarica > 0) {
      c.fillStyle = COLORI.armatura;
      c.font = '10px system-ui, sans-serif';
      c.fillText(t('gioco.ricarico'), b.x, b.y + 4);
    } else {
      // I colpi in canna grandi, la capienza piccola accanto: il numero che si
      // guarda mentre si spara e' il primo, il secondo serve solo a dargli una
      // misura. Scriverli uguali vorrebbe dire leggerli tutti e due ogni volta.
      c.fillStyle = secco ? COLORI.critico : pochi ? COLORI.nemicoAllerta : COLORI.testo;
      c.font = '17px ui-monospace, Consolas, monospace';
      const grande = String(colpi);
      const piccolo = `/${m.caricatore}`;
      const largoGrande = c.measureText(grande).width;
      c.font = '11px ui-monospace, Consolas, monospace';
      const largoPiccolo = c.measureText(piccolo).width;
      const inizio = b.x - (largoGrande + largoPiccolo) / 2;

      c.textAlign = 'left';
      c.font = '17px ui-monospace, Consolas, monospace';
      c.fillText(grande, inizio, b.y + 6);
      c.fillStyle = COLORI.testoSpento;
      c.font = '11px ui-monospace, Consolas, monospace';
      c.fillText(piccolo, inizio + largoGrande, b.y + 6);
      c.textAlign = 'center';
    }

    // I caricatori di scorta, sotto: uno per puntino.
    for (let k = 0; k < m.caricatori - 1; k++) {
      const px = b.x - ((m.caricatori - 2) * 5) + k * 10;
      c.fillStyle = k < riserve ? COLORI.testo : COLORI.vitaVuota;
      c.beginPath();
      c.arc(px, b.y + b.r + 7, 3, 0, Math.PI * 2);
      c.fill();
    }

    // Fermi su una cassa: la barra che si riempie, al centro dello schermo.
    // Li' e non qui, perche' in quei due secondi non si fa altro e si e' fermi
    // in mezzo a un settore sveglio: e' una cosa da guardare, non da spiare.
    if ((mio.sz ?? 0) > 0) {
      c.fillStyle = COLORI.kit;
      c.font = '12px system-ui, sans-serif';
      c.fillText(t('gioco.ricarica'), this.w / 2, this.h - 58);
      barra(c, this.w / 2 - 70, this.h - 52, 140, 6, mio.sz, COLORI.kit);
    }
  }

  hud(righe) {
    const c = this.ctx;
    c.font = '12px ui-monospace, Consolas, monospace';
    c.textAlign = 'left';
    c.fillStyle = COLORI.testoSpento;
    righe.forEach((r, k) => c.fillText(r, 10, 20 + k * 15));
  }

  /** Una riga di avviso in alto, senza coprire il gioco. */
  avviso(testo) {
    const c = this.ctx;
    c.font = '13px system-ui, sans-serif';
    c.textAlign = 'center';
    const larghezza = c.measureText(testo).width + 24;
    c.fillStyle = 'rgba(255,93,93,0.16)';
    c.fillRect((this.w - larghezza) / 2, 34, larghezza, 24);
    c.fillStyle = COLORI.critico;
    c.fillText(testo, this.w / 2, 50);
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


/**
 * Un omino visto dall'alto. Sta fuori dalla classe perche' lo disegna anche il
 * menu, su una tela sua, per far vedere com'e' fatta ogni classe.
 *
 * Spalle nettamente piu' larghe che profonde: e' quella proporzione a dire
 * "visto dall'alto". E l'arma impugnata da un lato solo, perche' e'
 * l'asimmetria a far leggere "persona che tiene qualcosa" — con le braccia
 * simmetriche viene fuori un imbuto senza direzione.
 */
/**
 * `scala` serve ai bossi: due di loro SONO uno scagnozzo, disegnato due volte
 * piu' grande. Ridisegnarli a mano avrebbe voluto dire due sagome che si
 * assomigliano ma non si somigliano, e la somiglianza qui e' il punto — chi
 * vede il grosso deve capire in mezzo secondo che e' la stessa cosa di prima,
 * solo che stavolta non muore.
 */
export function disegnaOmino(
  c, x, y, angolo, { corpo, arma = 'corta', alpha = 1, aTerra = false, scala = 1 },
) {
  c.save();
  c.translate(x, y);
  c.rotate(angolo);
  if (scala !== 1) c.scale(scala, scala);
  c.globalAlpha = alpha;

  if (aTerra) {
    disegnaSteso(c, corpo);
    c.globalAlpha = 1;
    c.restore();
    return;
  }

  const lunga = arma === 'lunga';
  const media = arma === 'media';
  const scuro = 'rgba(5,7,12,0.7)';

  c.fillStyle = corpo;
  c.strokeStyle = scuro;
  c.lineWidth = 1;
  stondato(c, -4.6, -5.7, 7.2, 11.4, 2.6);
  c.fill();
  c.stroke();

  // Tre armi diverse a vedersi: corta e grossa, media, lunga e sottile.
  const lunghezza = lunga ? 11.5 : media ? 9.5 : 7;
  const spessore = lunga ? 1.8 : media ? 2.2 : 2.8;
  c.fillStyle = '#0e121a';
  c.fillRect(4.2, 2.6 - spessore / 2, lunghezza, spessore);
  if (media) {
    // Il caricatore curvo del fucile d'assalto: piccolo, ma lo distingue.
    c.fillRect(6.2, 3.9, 2, 2.6);
  }

  c.strokeStyle = scurisci(corpo, 0.78);
  c.lineWidth = 2.3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0.5, 4.4);
  c.lineTo(4.6, 2.9);
  c.stroke();
  c.beginPath();
  c.moveTo(-0.5, -4.4);
  c.lineTo(2.2, -3.9);
  c.stroke();

  c.fillStyle = scurisci(corpo, 1.15);
  c.beginPath();
  c.arc(5, 2.7, 1.5, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = scurisci(corpo, 0.5);
  c.strokeStyle = scuro;
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0.4, 0, 3.4, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  c.globalAlpha = 1;
  c.lineCap = 'butt';
  c.restore();
}

/**
 * Chi e' a terra si vede disteso: il corpo lungo invece che largo, le braccia
 * aperte, l'arma caduta di lato. In piedi e a terra devono essere due sagome
 * diverse a colpo d'occhio — se cambia solo il colore, in mezzo a una
 * sparatoria non ci si accorge che il compagno e' giu'.
 */
function disegnaSteso(c, corpo) {
  const scuro = 'rgba(5,7,12,0.7)';

  // L'arma sfuggita di mano, un po' piu' in la'.
  c.fillStyle = '#0e121a';
  c.save();
  c.rotate(0.6);
  c.fillRect(2, 7, 9, 2.2);
  c.restore();

  // Le braccia larghe, abbandonate.
  c.strokeStyle = scurisci(corpo, 0.7);
  c.lineWidth = 2.2;
  c.lineCap = 'round';
  for (const lato of [-1, 1]) {
    c.beginPath();
    c.moveTo(-1, lato * 2);
    c.lineTo(3.5, lato * 6.5);
    c.stroke();
  }

  // Il corpo disteso: lungo nel verso in cui e' caduto, non largo.
  c.fillStyle = scurisci(corpo, 0.82);
  c.strokeStyle = scuro;
  c.lineWidth = 1;
  stondato(c, -7.5, -3.4, 14, 6.8, 3);
  c.fill();
  c.stroke();

  // La testa da un capo, per capire da che parte e' girato.
  c.fillStyle = scurisci(corpo, 0.5);
  c.beginPath();
  c.arc(6.4, 0, 3.1, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  c.lineCap = 'butt';
}

/** Un rettangolo con gli angoli stondati, gia' pronto da riempire o contornare. */
function stondato(c, x, y, larghezza, altezza, raggio) {
  c.beginPath();
  c.moveTo(x + raggio, y);
  c.arcTo(x + larghezza, y, x + larghezza, y + altezza, raggio);
  c.arcTo(x + larghezza, y + altezza, x, y + altezza, raggio);
  c.arcTo(x, y + altezza, x, y, raggio);
  c.arcTo(x, y, x + larghezza, y, raggio);
  c.closePath();
}

/** Un'ellisse piena, che serve di continuo per i corpi visti dall'alto. */
function ellisse(c, x, y, rx, ry) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

/** Lo stesso colore, piu' scuro: ombre e dettagli restano in tinta. */
function scurisci(hex, quanto) {
  const n = parseInt(hex.slice(1), 16);
  const limita = (v) => Math.max(0, Math.min(255, Math.round(v * quanto)));
  return `rgb(${limita((n >> 16) & 255)},${limita((n >> 8) & 255)},${limita(n & 255)})`;
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

/** Il colore e l'arma di una classe, in un posto solo. */
export function coloreDi(classe) {
  if (classe === 'eco') return COLORI.eco;
  if (classe === 'assalto') return COLORI.assalto;
  return COLORI.faro;
}

export function armaDi(classe) {
  if (classe === 'eco') return 'lunga';
  if (classe === 'assalto') return 'media';
  return 'corta';
}

function tinta(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
