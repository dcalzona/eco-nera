// Movimento e collisioni. Questo file lo eseguono in due: il server, che
// decide la verita', e il client, che prevede in anticipo il proprio
// personaggio per non sentire il ritardo della rete sotto il dito.
// Devono per forza calcolare la stessa cosa, quindi il codice e' uno solo.

import { RAGGIO, VELOCITA, RIPARO, TILE } from './regole.js';
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


/**
 * Si sta scavalcando un riparo? Serve al server e al telefono allo stesso
 * modo: la velocita' fa parte della previsione, e se il telefono non sapesse
 * del rallentamento si vedrebbe correre e poi verrebbe riportato indietro a
 * ogni fotografia.
 *
 * Il conto e' un cambio di assi: quanto sei avanti rispetto al riparo (lungo
 * la direzione in cui guarda) e quanto sei di lato (lungo la barriera). La
 * fascia in cui si rallenta e' piu' larga dello spessore vero, altrimenti la
 * si attraversa in due decimi di secondo e non si sente niente.
 */
export function suUnRiparo(ripari, x, y) {
  if (!ripari?.length) return false;
  for (const r of ripari) {
    const dx = x - r.x;
    const dy = y - r.y;
    const co = Math.cos(r.ang);
    const si = Math.sin(r.ang);
    const avanti = dx * co + dy * si;
    const lato = -dx * si + dy * co;
    if (Math.abs(avanti) > RIPARO.banda / 2) continue;
    if (Math.abs(lato) > RIPARO.mezzaLunghezza + RAGGIO * 0.5) continue;
    return true;
  }
  return false;
}

/** La velocita' di chi sta scavalcando, se sta scavalcando. */
/**
 * Le porte in fondo all'arena: gli scagnozzi ci passano, voi no.
 *
 * Non e' un muro nella mappa ed e' voluto. Aprire le porte cambiando la
 * griglia vorrebbe dire cambiare la mappa a partita in corso, e la mappa e'
 * l'unica cosa che i due telefoni si dicono UNA VOLTA SOLA. Cosi' invece si
 * apre una regola, e la regola sta qui — dove la applicano tutti e due, chi
 * ospita e chi prevede. Se la applicasse solo chi ospita, il telefono
 * continuerebbe a prevedere di passare e verrebbe tirato indietro a ogni
 * fotografia.
 */
export function fermatoDalleporte(arena, aperte, ent, prima) {
  if (!arena || aperte) return false;
  const o = arena.oltre;
  const tx = Math.floor(ent.x / TILE);
  const ty = Math.floor(ent.y / TILE);
  if (tx < o.x || tx >= o.x + o.w || ty < o.y || ty >= o.y + o.h) return false;
  ent.x = prima.x;
  ent.y = prima.y;
  return true;
}

export function velocitaFraIRipari(velocita, ripari, x, y) {
  return suUnRiparo(ripari, x, y) ? velocita * RIPARO.rallenta : velocita;
}
