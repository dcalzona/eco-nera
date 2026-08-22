// Come i nemici trovano la strada, e come capiscono se ti vedono.
//
// Niente inseguimento a vista: uno che punta dritto al giocatore si incastra
// nel primo muro e il gioco diventa ridicolo. Si usa un campo di distanze
// calcolato all'indietro dal bersaglio (una visita in ampiezza della griglia),
// e ogni nemico scende lungo la discesa piu' ripida. Costa poco — la mappa e'
// di mille caselle — e con piu' sorgenti insieme ognuno insegue il giocatore
// piu' vicino senza doverlo decidere.

import { TILE } from '../client/condiviso/regole.js';
import { muro } from '../client/condiviso/mappa.js';

const IRRAGGIUNGIBILE = 30000;

/**
 * Distanza in passi di ogni casella dalla piu' vicina fra le sorgenti.
 * `sorgenti` sono punti in pixel di mondo.
 */
export function campo(mappa, sorgenti) {
  const larghezza = mappa.larghezza;
  const altezza = mappa.altezza;
  const distanze = new Int32Array(larghezza * altezza).fill(IRRAGGIUNGIBILE);
  const coda = new Int32Array(larghezza * altezza);
  let testa = 0;
  let fine = 0;

  for (const s of sorgenti) {
    const tx = Math.floor(s.x / TILE);
    const ty = Math.floor(s.y / TILE);
    if (muro(mappa, tx, ty)) continue;
    const i = ty * larghezza + tx;
    if (distanze[i] === 0) continue;
    distanze[i] = 0;
    coda[fine++] = i;
  }

  while (testa < fine) {
    const i = coda[testa++];
    const tx = i % larghezza;
    const ty = (i / larghezza) | 0;
    const d = distanze[i] + 1;

    for (let k = 0; k < 4; k++) {
      const nx = tx + (k === 0 ? 1 : k === 1 ? -1 : 0);
      const ny = ty + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= larghezza || ny >= altezza) continue;
      if (muro(mappa, nx, ny)) continue;
      const j = ny * larghezza + nx;
      if (distanze[j] <= d) continue;
      distanze[j] = d;
      coda[fine++] = j;
    }
  }

  return { distanze, larghezza, altezza };
}

/**
 * Verso quale direzione conviene muoversi da qui per avvicinarsi al bersaglio.
 * Torna null se non c'e' strada. Le diagonali si prendono solo quando anche le
 * due caselle ortogonali sono libere, altrimenti si taglierebbero gli spigoli
 * e ci si incastrerebbe contro il muro.
 */
export function passoVerso(mappa, c, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= c.larghezza || ty >= c.altezza) return null;

  const qui = c.distanze[ty * c.larghezza + tx];
  if (qui >= IRRAGGIUNGIBILE) return null;
  if (qui === 0) return null; // ci siamo gia'

  let miglior = qui;
  let scelta = null;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = tx + dx;
      const ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= c.larghezza || ny >= c.altezza) continue;
      if (muro(mappa, nx, ny)) continue;
      if (dx !== 0 && dy !== 0) {
        if (muro(mappa, tx + dx, ty) || muro(mappa, tx, ty + dy)) continue;
      }
      const d = c.distanze[ny * c.larghezza + nx];
      if (d < miglior) {
        miglior = d;
        scelta = { tx: nx, ty: ny };
      }
    }
  }

  if (!scelta) return null;
  // Si punta al centro della casella scelta: tenersi in mezzo al corridoio
  // evita di strusciare contro gli spigoli a ogni passo.
  const mx = (scelta.tx + 0.5) * TILE - x;
  const my = (scelta.ty + 0.5) * TILE - y;
  const len = Math.hypot(mx, my) || 1;
  return { x: mx / len, y: my / len };
}

/** C'e' una parete fra i due punti? Cammino sulla griglia, come i raggi di luce. */
export function lineaLibera(mappa, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distanza = Math.hypot(dx, dy);
  if (distanza < 1) return true;

  const dirX = dx / distanza;
  const dirY = dy / distanza;

  let tx = Math.floor(x1 / TILE);
  let ty = Math.floor(y1 / TILE);
  const passoX = dirX < 0 ? -1 : 1;
  const passoY = dirY < 0 ? -1 : 1;
  const salitaX = dirX === 0 ? Infinity : Math.abs(TILE / dirX);
  const salitaY = dirY === 0 ? Infinity : Math.abs(TILE / dirY);
  let latoX =
    dirX === 0 ? Infinity : (dirX < 0 ? x1 - tx * TILE : (tx + 1) * TILE - x1) / Math.abs(dirX);
  let latoY =
    dirY === 0 ? Infinity : (dirY < 0 ? y1 - ty * TILE : (ty + 1) * TILE - y1) / Math.abs(dirY);

  let percorso = 0;
  while (percorso < distanza) {
    if (latoX < latoY) {
      percorso = latoX;
      latoX += salitaX;
      tx += passoX;
    } else {
      percorso = latoY;
      latoY += salitaY;
      ty += passoY;
    }
    if (percorso >= distanza) return true;
    if (muro(mappa, tx, ty)) return false;
  }
  return true;
}

export { IRRAGGIUNGIBILE };
