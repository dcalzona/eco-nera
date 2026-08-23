// Comandi: due stick virtuali che nascono dove appoggi il dito — meta'
// sinistra dello schermo per muoversi, meta' destra per puntare. Sul PC
// valgono WASD e il mouse, cosi' si prova senza telefono. E se al telefono e'
// attaccato un controller — un DualShock, un DualSense — comanda quello.

const RAGGIO_STICK = 62; // pixel di dito per arrivare a velocita' piena
const ZONA_MORTA = 9;

/**
 * Gli stick veri non tornano mai esattamente a zero: senza una zona morta il
 * personaggio deriva piano per conto suo, e su un pad un po' vissuto deriva
 * parecchio. Appena fuori dalla zona morta si riparte da fermo e non da meta'
 * velocita', altrimenti il minimo tocco fa uno scatto.
 */
const ZONA_MORTA_PAD = 0.18;

/**
 * I tasti del controller, nella numerazione "standard" — quella che Chrome
 * usa per DualShock 4 e DualSense. Piu' di un tasto per mestiere: chi e'
 * abituato ai grilletti e chi ai dorsali trova comodo il suo.
 *
 * Mirare NON e' sparare, qui. Sullo schermo lo e' per forza — un terzo dito
 * non c'e' — ma con un pad in mano ci sono i grilletti, e tenere separate le
 * due cose e' meta' del motivo per cui giocare col pad e' piu' bello.
 */
const PAD = {
  fuoco: [7, 5], // R2, R1
  torcia: [6, 4], // L2, L1
  abilita: [0, 2], // croce, quadrato
  menu: [9, 8], // options, share
  su: [12], giu: [13], sinistra: [14], destra: [15], // croce direzionale
};

export class Comandi {
  constructor(canvas) {
    this.canvas = canvas;
    this.mx = 0;
    this.my = 0;
    this.ax = 0;
    this.ay = 0;
    this.spara = false;
    this.torcia = true;   // acceso di partenza
    this.abilita = false;
    this.abilitaFino = 0;
    // La misura dello schermo la detta il disegno, non il canvas: due fonti
    // di verita' sulle stesse coordinate prima o poi divergono, e i pulsanti
    // finirebbero disegnati in un posto e premibili in un altro.
    this.larghezza = 0;
    this.altezza = 0;

    this.stickSx = null; // { origine:{x,y}, dito:{x,y} } in pixel CSS
    this.stickDx = null;
    this.diti = new Map(); // pointerId -> 'sx' | 'dx'

    this.tasti = new Set();
    this.mouse = null;
    this.mouseGiu = false;

    // Il controller. `padPrima` serve a riconoscere il momento in cui un tasto
    // viene premuto: la torcia e l'abilita' vogliono il fronte di salita, non
    // lo stato — tenendo premuto non si deve lampeggiare.
    this.padPrima = [];
    this.padAcceso = false;
    this.padNome = '';
    this.menuPremuto = false;
    this.confermaPremuta = false;
    addEventListener('gamepadconnected', (e) => {
      this.padAcceso = true;
      this.padNome = e.gamepad?.id ?? '';
    });
    addEventListener('gamepaddisconnected', () => {
      this.padAcceso = false;
      this.padNome = '';
    });

    canvas.addEventListener('pointerdown', (e) => this.giu(e));
    canvas.addEventListener('pointermove', (e) => this.muove(e));
    canvas.addEventListener('pointerup', (e) => this.su(e));
    canvas.addEventListener('pointercancel', (e) => this.su(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    addEventListener('keydown', (e) => {
      // Tasti per provare dal PC. L'accensione e l'abilita' vogliono il fronte
      // di salita, non lo stato: tenendo premuto non si deve lampeggiare.
      if (!e.repeat && e.code === 'KeyL') this.torcia = !this.torcia;
      if (!e.repeat && e.code === 'KeyE') this.premiAbilita();
      this.tasti.add(e.code);
    });
    addEventListener('keyup', (e) => this.tasti.delete(e.code));
    addEventListener('blur', () => this.tasti.clear());
  }

  /**
   * I due pulsanti stanno nell'angolo in basso a destra, dove il pollice
   * arriva lasciando un attimo lo stick di mira. Le loro posizioni servono
   * anche al disegno, quindi stanno qui una volta sola.
   */
  misura(larghezza, altezza) {
    if (larghezza === this.larghezza && altezza === this.altezza) return;
    this.larghezza = larghezza;
    this.altezza = altezza;
    this.leggiMargini();
  }

  leggiMargini() {
    const stile = getComputedStyle(document.body);
    const numero = (nome) => parseFloat(stile.getPropertyValue(nome)) || 0;
    this.margineDestro = numero('--sar');
    this.margineBasso = numero('--sab');
  }

  pulsanti() {
    const w = this.larghezza || this.canvas.clientWidth;
    const h = this.altezza || this.canvas.clientHeight;
    // In fila lungo il bordo inferiore, non impilati: impilati occupano
    // proprio la fascia verticale dove il pollice destro deve poter appoggiare
    // per lo stick di mira.
    const y = h - 52 - (this.margineBasso ?? 0);
    const destra = w - 52 - (this.margineDestro ?? 0);
    return {
      torcia: { x: destra, y, r: 32 },
      abilita: { x: destra - 78, y, r: 32 },
    };
  }

  premiAbilita() {
    // Resta premuto un attimo: i comandi partono sessanta volte al secondo e
    // uno solo potrebbe cadere in un momento in cui il server non lo consuma.
    this.abilita = true;
    this.abilitaFino = performance.now() + 200;
  }

  dentroUnPulsante(p) {
    const b = this.pulsanti();
    for (const nome of ['abilita', 'torcia']) {
      if (Math.hypot(p.x - b[nome].x, p.y - b[nome].y) <= b[nome].r + 8) return nome;
    }
    return null;
  }

  posizione(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  giu(e) {
    const p = this.posizione(e);
    if (e.pointerType === 'mouse') {
      this.mouse = p;
      this.mouseGiu = true;
      return;
    }
    // Un dito che comincia su un pulsante e' un pulsante, non uno stick.
    const pulsante = this.dentroUnPulsante(p);
    if (pulsante === 'torcia') {
      this.torcia = !this.torcia;
      return;
    }
    if (pulsante === 'abilita') {
      this.premiAbilita();
      return;
    }

    this.canvas.setPointerCapture?.(e.pointerId);
    const lato = p.x < (this.larghezza || this.canvas.clientWidth) / 2 ? 'sx' : 'dx';
    // Un dito per lato: il secondo sullo stesso lato viene ignorato.
    if (this.diti.has(e.pointerId)) return;
    if (lato === 'sx' && this.stickSx) return;
    if (lato === 'dx' && this.stickDx) return;
    this.diti.set(e.pointerId, lato);
    const stick = { origine: p, dito: p };
    if (lato === 'sx') this.stickSx = stick;
    else this.stickDx = stick;
  }

  muove(e) {
    const p = this.posizione(e);
    if (e.pointerType === 'mouse') {
      this.mouse = p;
      return;
    }
    const lato = this.diti.get(e.pointerId);
    if (!lato) return;
    const stick = lato === 'sx' ? this.stickSx : this.stickDx;
    if (stick) stick.dito = p;
  }

  su(e) {
    if (e.pointerType === 'mouse') {
      this.mouseGiu = false;
      return;
    }
    const lato = this.diti.get(e.pointerId);
    if (!lato) return;
    this.diti.delete(e.pointerId);
    if (lato === 'sx') this.stickSx = null;
    else this.stickDx = null;
  }

  /**
   * Il primo controller collegato, letto adesso. Torna null se non ce n'e'
   * nessuno — e "collegato" non basta: finche' non si preme un tasto il
   * browser non lo fa nemmeno vedere, per non dare a ogni pagina un modo di
   * riconoscere chi la sta guardando.
   */
  padCollegato() {
    const elenco = navigator.getGamepads?.() ?? [];
    for (const p of elenco) if (p && p.connected) return p;
    return null;
  }

  leggiPad() {
    const p = this.padCollegato();
    if (!p) {
      this.padAcceso = false;
      return null;
    }
    this.padAcceso = true;
    this.padNome = p.id ?? '';
    const stato = daPad(p, this.padPrima);
    this.padPrima = p.buttons.map((b) => premuto(b));
    return stato;
  }

  /**
   * Legge lo stato dei comandi. `centro` e' il punto sullo schermo dove sta
   * il nostro personaggio: serve per far puntare il mouse.
   */
  leggi(centro) {
    const sx = vettore(this.stickSx);
    this.mx = sx.x;
    this.my = sx.y;

    const dx = vettore(this.stickDx);
    this.ax = dx.x;
    this.ay = dx.y;

    // Tastiera e mouse, se qualcuno sta provando dal PC.
    if (this.mx === 0 && this.my === 0) {
      let kx = 0;
      let ky = 0;
      if (this.tasti.has('KeyA') || this.tasti.has('ArrowLeft')) kx -= 1;
      if (this.tasti.has('KeyD') || this.tasti.has('ArrowRight')) kx += 1;
      if (this.tasti.has('KeyW') || this.tasti.has('ArrowUp')) ky -= 1;
      if (this.tasti.has('KeyS') || this.tasti.has('ArrowDown')) ky += 1;
      this.mx = kx;
      this.my = ky;
    }

    // Si spara tenendo premuto lo stick destro: su un telefono un pulsante
    // separato costringe a un terzo dito che non c'e'. Mirare e' sparare.
    this.spara = Math.hypot(this.ax, this.ay) > 0.45;
    if (this.abilita && performance.now() > this.abilitaFino) this.abilita = false;

    // Il controller ha l'ultima parola: se lo si sta usando, comanda lui.
    const pad = this.leggiPad();
    if (pad) {
      if (pad.mx !== 0 || pad.my !== 0) {
        this.mx = pad.mx;
        this.my = pad.my;
      }
      if (pad.ax !== 0 || pad.ay !== 0) {
        this.ax = pad.ax;
        this.ay = pad.ay;
        // Col pad si mira senza sparare: il grilletto decide.
        this.spara = pad.fuoco;
      } else if (pad.fuoco) {
        this.spara = true;
      }
      if (pad.torcia) this.torcia = !this.torcia;
      if (pad.abilita) this.premiAbilita();
      if (pad.menu) this.menuPremuto = true;
      if (pad.conferma) this.confermaPremuta = true;
    }

    if (this.ax === 0 && this.ay === 0 && this.mouse && centro) {
      const vx = this.mouse.x - centro.x;
      const vy = this.mouse.y - centro.y;
      const len = Math.hypot(vx, vy);
      if (len > 12) {
        this.ax = vx / len;
        this.ay = vy / len;
        this.spara = this.mouseGiu;
      }
    }

    return this;
  }
}

/** Un tasto e' premuto? Vale sia per i tasti secchi sia per i grilletti. */
function premuto(b) {
  if (!b) return false;
  return typeof b === 'object' ? b.pressed || b.value > 0.3 : b > 0.3;
}

/**
 * Da uno stato del controller ai comandi del gioco. Sta fuori dalla classe di
 * proposito: e' tutta la logica del pad, senza uno schermo intorno, e cosi' la
 * si puo' provare senza un controller in mano.
 *
 * `prima` e' l'elenco dei tasti premuti al giro precedente: i comandi che
 * accendono e spengono qualcosa tornano veri solo nell'istante in cui il tasto
 * scende.
 */
export function daPad(pad, prima = []) {
  const asse = (i) => pad.axes?.[i] ?? 0;
  const giu = (elenco) => elenco.some((i) => premuto(pad.buttons?.[i]));
  const appenaGiu = (elenco) => elenco.some((i) => premuto(pad.buttons?.[i]) && !prima[i]);

  const sinistro = stickPad(asse(0), asse(1));
  // La croce direzionale vale come lo stick sinistro, per chi la preferisce.
  if (sinistro.x === 0 && sinistro.y === 0) {
    sinistro.x = (giu(PAD.destra) ? 1 : 0) - (giu(PAD.sinistra) ? 1 : 0);
    sinistro.y = (giu(PAD.giu) ? 1 : 0) - (giu(PAD.su) ? 1 : 0);
  }
  const destro = stickPad(asse(2), asse(3));

  return {
    mx: sinistro.x,
    my: sinistro.y,
    ax: destro.x,
    ay: destro.y,
    fuoco: giu(PAD.fuoco),
    torcia: appenaGiu(PAD.torcia),
    abilita: appenaGiu(PAD.abilita),
    menu: appenaGiu(PAD.menu),
    conferma: appenaGiu(PAD.abilita),
  };
}

/** Zona morta con ripartenza da zero, cosi' il minimo tocco non fa uno scatto. */
function stickPad(x, y) {
  const len = Math.hypot(x, y);
  if (len < ZONA_MORTA_PAD) return { x: 0, y: 0 };
  const forza = Math.min((len - ZONA_MORTA_PAD) / (1 - ZONA_MORTA_PAD), 1);
  return { x: (x / len) * forza, y: (y / len) * forza };
}

function vettore(stick) {
  if (!stick) return { x: 0, y: 0 };
  const dx = stick.dito.x - stick.origine.x;
  const dy = stick.dito.y - stick.origine.y;
  const len = Math.hypot(dx, dy);
  if (len < ZONA_MORTA) return { x: 0, y: 0 };
  const forza = Math.min(len / RAGGIO_STICK, 1);
  return { x: (dx / len) * forza, y: (dy / len) * forza };
}

export { RAGGIO_STICK, PAD, ZONA_MORTA_PAD };
