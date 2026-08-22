// I proiettili. Vivono solo sul server: il telefono li vede arrivare nelle
// fotografie e li interpola come tutto il resto.
//
// Si muovono a pezzetti corti anche dentro un solo passo di simulazione: a
// 940 pixel al secondo un colpo dell'Eco percorre 47 pixel in un tick, cioe'
// una casella e mezza, e controllando solo il punto d'arrivo attraverserebbe
// i muri sottili senza accorgersene.

import { TILE } from '../client/condiviso/regole.js';
import { muro } from '../client/condiviso/mappa.js';

/** Lunghezza massima di un pezzetto di volo, in pixel. */
const PEZZO = 6;

let prossimoId = 1;

export function creaColpo(padrone, x, y, ang, danno, gittata, velocita, daNemico) {
  return {
    id: prossimoId++,
    padrone,
    x,
    y,
    vx: Math.cos(ang) * velocita,
    vy: Math.sin(ang) * velocita,
    resta: gittata,
    danno,
    daNemico,
  };
}

/**
 * Fa volare tutti i colpi. `colpisci(colpo)` viene chiamata a ogni pezzetto e
 * deve tornare vero se il colpo ha centrato qualcuno: in quel caso sparisce.
 */
export function passoProiettili(mappa, proiettili, dt, colpisci) {
  for (let k = proiettili.length - 1; k >= 0; k--) {
    const c = proiettili[k];
    const tratto = Math.hypot(c.vx, c.vy) * dt;
    const pezzi = Math.max(1, Math.ceil(tratto / PEZZO));
    let finito = false;

    for (let s = 0; s < pezzi; s++) {
      c.x += (c.vx * dt) / pezzi;
      c.y += (c.vy * dt) / pezzi;
      c.resta -= tratto / pezzi;

      if (muro(mappa, Math.floor(c.x / TILE), Math.floor(c.y / TILE))) {
        finito = true;
        break;
      }
      if (colpisci(c)) {
        finito = true;
        break;
      }
      if (c.resta <= 0) {
        finito = true;
        break;
      }
    }

    if (finito) proiettili.splice(k, 1);
  }
}
