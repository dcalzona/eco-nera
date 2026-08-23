// Il suono. E' la meccanica che dice al giocatore "c'e' qualcuno" senza
// mostrarglielo, ed e' quella che rende il buio interessante invece che
// soltanto scomodo.
//
// Non si propaga in linea d'aria. Un rumore gira per i corridoi come si gira
// a piedi: si visita la griglia in ampiezza dal punto d'origine e ci si ferma
// alla distanza che quel rumore puo' percorrere. Cosi' uno sparo dentro una
// stanza chiusa non allarma chi sta dall'altra parte del muro, anche se in
// linea retta e' a due passi — e girare largo per non farsi sentire diventa
// una cosa che si puo' davvero fare.

import { SUONI, TILE } from '../condiviso/regole.js';
import { campo } from './navigazione.js';

let prossimoId = 1;

/** Quanti rumori si tengono in lista per spedirli ai telefoni. */
const MEMORIA_RUMORI = 24;

export class Rumori {
  constructor(mappa) {
    this.mappa = mappa;
    this.recenti = [];
    this.nuovi = [];
  }

  /**
   * Fa rumore. Torna l'elenco delle caselle raggiunte insieme alla distanza,
   * cosi' chi ascolta puo' sapere non solo se ha sentito ma anche quanto forte.
   */
  emetti(genere, x, y, autore, raggio) {
    const regola = SUONI[genere];
    if (!regola) return null;
    // Il raggio si puo' forzare: le tre armi non fanno lo stesso baccano.
    const portata = raggio ?? regola.raggio;

    const propagazione = campo(this.mappa, [{ x, y }], portata);
    const suono = {
      id: prossimoId++,
      genere,
      x,
      y,
      autore,
      raggio: portata,
      forza: regola.forza,
      propagazione,
    };

    this.recenti.push(suono);
    this.nuovi.push(suono);
    while (this.recenti.length > MEMORIA_RUMORI) this.recenti.shift();
    return suono;
  }

  /** Quanto forte arriva questo rumore a chi sta li'. Zero se non arriva. */
  quantoSiSente(suono, x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.mappa.larghezza || ty >= this.mappa.altezza) return 0;
    const passi = suono.propagazione.distanze[ty * this.mappa.larghezza + tx];
    if (passi > suono.raggio) return 0;
    return suono.forza * (1 - passi / (suono.raggio + 1));
  }

  /**
   * I rumori nati in questo tick, con quanto forte li ha sentiti ciascun
   * ascoltatore. Il calcolo lo fa il server, che conosce i muri: se lo
   * facesse il telefono a occhio, per distanza in linea d'aria, sentiresti
   * gli spari dentro le stanze sigillate.
   */
  daSpedire(ascoltatori = []) {
    return this.nuovi.map((s) => {
      const a = {};
      for (const g of ascoltatori) {
        const quanto = this.quantoSiSente(s, g.x, g.y);
        if (quanto > 0) a[g.id] = Math.round(quanto * 100) / 100;
      }
      return { i: s.id, x: Math.round(s.x), y: Math.round(s.y), k: s.genere, a };
    });
  }

  /** Da chiamare a inizio tick: i rumori del tick precedente non sono piu' nuovi. */
  giroNuovo() {
    this.nuovi.length = 0;
  }
}
