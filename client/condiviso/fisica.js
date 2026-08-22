// Movimento e collisioni. Questo file lo eseguono in due: il server, che
// decide la verita', e il client, che prevede in anticipo il proprio
// personaggio per non sentire il ritardo della rete sotto il dito.
// Devono per forza calcolare la stessa cosa, quindi il codice e' uno solo.

import { RAGGIO, VELOCITA } from './regole.js';
import { muro } from './mappa.js';

/** Riduce a lunghezza 1 un vettore piu' lungo di 1 (il dito sullo stick puo' sbordare). */
export function limita(x, y) {
  const len = Math.hypot(x, y);
  if (len <= 1 || len === 0) return { x, y };
  return { x: x / len, y: y / len };
}

/**
 * Sposta l'entita' di un passo. Prima orizzontale, poi verticale: cosi' chi
 * struscia contro un muro in diagonale continua a scivolare invece di
 * incastrarsi, che e' meta' della sensazione di un gioco che risponde bene.
 */
export function muovi(ent, mx, my, dt, mappa, velocita = VELOCITA) {
  const dir = limita(mx, my);
  if (dir.x === 0 && dir.y === 0) return;
  scorri(ent, dir.x * velocita * dt, dir.y * velocita * dt, mappa);
}

/**
 * Sposta di una quantita' qualsiasi rispettando i muri. Lo usa anche la
 * correzione del client verso il server: sommare lo scarto alle coordinate
 * senza passare di qui puo' depositare il personaggio dentro una parete, e
 * fermi non c'e' nessun movimento che lo tiri fuori.
 */
export function scorri(ent, dx, dy, mappa) {
  passoAsse(ent, dx, 0, mappa);
  passoAsse(ent, 0, dy, mappa);
}

function passoAsse(ent, dx, dy, mappa) {
  if (dx === 0 && dy === 0) return;
  ent.x += dx;
  ent.y += dy;

  const t = mappa.tile;
  // Il filo di tolleranza serve a distinguere "sto toccando" da "sono dentro".
  // Senza, un muro sfiorato esattamente di lato conta come collisione e la
  // spinta di sgombero scaraventa il personaggio di una casella intera —
  // attraverso la parete, fuori dalla mappa.
  const FILO = 0.01;

  const tx0 = Math.floor((ent.x - RAGGIO + FILO) / t);
  const tx1 = Math.floor((ent.x + RAGGIO - FILO) / t);
  const ty0 = Math.floor((ent.y - RAGGIO + FILO) / t);
  const ty1 = Math.floor((ent.y + RAGGIO - FILO) / t);

  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (!muro(mappa, tx, ty)) continue;

      // Si ricontrolla la sovrapposizione ogni volta: dopo la prima spinta il
      // personaggio non tocca piu' le caselle vicine, e continuare a spingerlo
      // via da quelle lo rimanderebbe dentro al muro appena scansato.
      if (ent.x + RAGGIO <= tx * t + FILO || ent.x - RAGGIO >= (tx + 1) * t - FILO) continue;
      if (ent.y + RAGGIO <= ty * t + FILO || ent.y - RAGGIO >= (ty + 1) * t - FILO) continue;

      // Si sgombera solo lungo l'asse su cui ci si e' mossi: e' quello il
      // movimento che ha causato la sovrapposizione.
      if (dx > 0) ent.x = tx * t - RAGGIO;
      else if (dx < 0) ent.x = (tx + 1) * t + RAGGIO;
      else if (dy > 0) ent.y = ty * t - RAGGIO;
      else if (dy < 0) ent.y = (ty + 1) * t + RAGGIO;
    }
  }
}

/** Angolo verso cui punta il personaggio, in radianti. Torna null se lo stick e' fermo. */
export function angolo(ax, ay) {
  if (ax === 0 && ay === 0) return null;
  return Math.atan2(ay, ax);
}
