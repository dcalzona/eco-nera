// Comandi: due stick virtuali che nascono dove appoggi il dito — meta'
// sinistra dello schermo per muoversi, meta' destra per puntare. Sul PC
// valgono WASD e il mouse, cosi' si prova senza telefono.

const RAGGIO_STICK = 62; // pixel di dito per arrivare a velocita' piena
const ZONA_MORTA = 9;

export class Comandi {
  constructor(canvas) {
    this.canvas = canvas;
    this.mx = 0;
    this.my = 0;
    this.ax = 0;
    this.ay = 0;
    this.spara = false;

    this.stickSx = null; // { origine:{x,y}, dito:{x,y} } in pixel CSS
    this.stickDx = null;
    this.diti = new Map(); // pointerId -> 'sx' | 'dx'

    this.tasti = new Set();
    this.mouse = null;
    this.mouseGiu = false;

    canvas.addEventListener('pointerdown', (e) => this.giu(e));
    canvas.addEventListener('pointermove', (e) => this.muove(e));
    canvas.addEventListener('pointerup', (e) => this.su(e));
    canvas.addEventListener('pointercancel', (e) => this.su(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    addEventListener('keydown', (e) => this.tasti.add(e.code));
    addEventListener('keyup', (e) => this.tasti.delete(e.code));
    addEventListener('blur', () => this.tasti.clear());
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
    this.canvas.setPointerCapture?.(e.pointerId);
    const lato = p.x < this.canvas.clientWidth / 2 ? 'sx' : 'dx';
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

function vettore(stick) {
  if (!stick) return { x: 0, y: 0 };
  const dx = stick.dito.x - stick.origine.x;
  const dy = stick.dito.y - stick.origine.y;
  const len = Math.hypot(dx, dy);
  if (len < ZONA_MORTA) return { x: 0, y: 0 };
  const forza = Math.min(len / RAGGIO_STICK, 1);
  return { x: (dx / len) * forza, y: (dy / len) * forza };
}

export { RAGGIO_STICK };
