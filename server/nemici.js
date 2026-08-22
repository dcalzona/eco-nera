// I nemici e la loro testa. Tre soli umori, ma leggibili a colpo d'occhio:
// pattuglia, cerca, caccia. Un nemico che si capisce e' un nemico con cui si
// puo' giocare — se non si intuisce cosa sta per fare, morire sembra ingiusto.

import { NEMICI, OBLIO_SECONDI, UMORE, TILE, SCONTO_AL_BUIO } from '../client/condiviso/regole.js';
import { PARTENZE, pavimenti, centroCasella } from '../client/condiviso/mappa.js';
import { scorri } from '../client/condiviso/fisica.js';
import { campo, passoVerso, lineaLibera } from './navigazione.js';

/** Quanto si allontana dal proprio posto quando pattuglia, in caselle. */
const GIRO_DI_RONDA = 7;

/** Quanto sta lontano dalle partenze dei giocatori il posto di un nemico. */
const DISTANZA_DALLE_PARTENZE = 9;

/** Quanti nemici tiene in piedi la mappa. */
export const NEMICI_IN_CAMPO = 8;

let prossimoId = 1;

/**
 * `lontanoDa` sono punti (di solito i giocatori) da cui il nuovo arrivato deve
 * tenersi alla larga: un rinforzo che compare addosso a chi gioca e' sleale.
 */
export function creaNemici(mappa, quanti = NEMICI_IN_CAMPO, lontanoDa = []) {
  const libere = pavimenti(mappa).filter((c) => {
    if (!PARTENZE.every((p) => Math.abs(p.tx - c.tx) + Math.abs(p.ty - c.ty) > DISTANZA_DALLE_PARTENZE))
      return false;
    return lontanoDa.every(
      (g) => Math.hypot(g.x - (c.tx + 0.5) * TILE, g.y - (c.ty + 0.5) * TILE) > 13 * TILE,
    );
  });

  const nemici = [];
  const presi = [];
  for (let k = 0; k < quanti && libere.length; k++) {
    // Sparpagliati: si sceglie ogni volta la casella piu' lontana da tutte
    // quelle gia' usate, cosi' non nascono tutti nella stessa stanza.
    let miglior = libere[0];
    let migliorPunteggio = -1;
    for (const c of libere) {
      const punteggio = presi.length
        ? Math.min(...presi.map((p) => (p.tx - c.tx) ** 2 + (p.ty - c.ty) ** 2))
        : (c.tx - 20) ** 2 + (c.ty - 12) ** 2;
      if (punteggio > migliorPunteggio) {
        migliorPunteggio = punteggio;
        miglior = c;
      }
    }
    presi.push(miglior);

    const regola = NEMICI.pattugliatore;
    const p = centroCasella(mappa, miglior.tx, miglior.ty);
    nemici.push({
      id: prossimoId++,
      tipo: 'pattugliatore',
      x: p.x,
      y: p.y,
      ang: Math.random() * Math.PI * 2,
      vita: regola.vita,
      umore: UMORE.PATTUGLIA,
      casa: { tx: miglior.tx, ty: miglior.ty },
      meta: null,
      campoMeta: null,
      ultimaNota: null,
      oblio: 0,
      ricarica: 0,
      mira: 0,
    });
  }
  return nemici;
}

/**
 * Un passo di pensiero per tutti. `bersagli` sono i giocatori ancora in piedi,
 * `campoBersagli` il campo di distanze verso di loro (calcolato una volta sola
 * per tutti), `spara` la funzione che crea un proiettile.
 */
export function passoNemici(mappa, nemici, bersagli, campoBersagli, dt, spara) {
  for (const n of nemici) {
    const regola = NEMICI[n.tipo];
    n.ricarica = Math.max(0, n.ricarica - dt);

    const visto = chiVede(mappa, n, regola, bersagli);

    if (visto) {
      if (n.umore !== UMORE.CACCIA) n.mira = regola.pausaMira;
      n.umore = UMORE.CACCIA;
      n.ultimaNota = { x: visto.x, y: visto.y };
      n.oblio = OBLIO_SECONDI;
      n.campoMeta = null;
      cacciando(mappa, n, regola, visto, campoBersagli, dt, spara);
      continue;
    }

    if (n.umore === UMORE.CACCIA) {
      // Persa di vista: si va dove era, non si dimentica subito.
      n.umore = UMORE.CERCA;
      n.campoMeta = n.ultimaNota ? campo(mappa, [n.ultimaNota]) : null;
    }

    if (n.umore === UMORE.CERCA) {
      n.oblio -= dt;
      const arrivato =
        !n.ultimaNota || Math.hypot(n.ultimaNota.x - n.x, n.ultimaNota.y - n.y) < TILE * 0.7;
      if (n.oblio <= 0 || arrivato) {
        n.umore = UMORE.PATTUGLIA;
        n.meta = null;
        n.campoMeta = null;
      } else {
        cammina(mappa, n, regola, n.campoMeta, dt);
      }
      continue;
    }

    pattugliando(mappa, n, regola, dt);
  }
}

/** Il primo bersaglio dentro il cono, abbastanza vicino e non coperto da un muro. */
function chiVede(mappa, n, regola, bersagli) {
  let miglior = null;
  let piuVicino = Infinity;
  for (const b of bersagli) {
    const dx = b.x - n.x;
    const dy = b.y - n.y;
    const distanza = Math.hypot(dx, dy);
    // Al buio si e' molto piu' difficili da individuare: e' il guadagno che
    // ripaga la scomodita' di spegnere la torcia.
    const portata = regola.vista * (b.torcia === false ? SCONTO_AL_BUIO : 1);
    if (distanza > portata || distanza > piuVicino) continue;
    const scarto = Math.abs(differenza(Math.atan2(dy, dx), n.ang));
    if (scarto > regola.cono / 2) continue;
    if (!lineaLibera(mappa, n.x, n.y, b.x, b.y)) continue;
    miglior = b;
    piuVicino = distanza;
  }
  return miglior;
}

function cacciando(mappa, n, regola, bersaglio, campoBersagli, dt, spara) {
  const dx = bersaglio.x - n.x;
  const dy = bersaglio.y - n.y;
  const distanza = Math.hypot(dx, dy);
  n.ang = Math.atan2(dy, dx);

  if (distanza <= regola.gittata) {
    // A tiro ci si ferma e si spara: uno che corre e spara insieme non da'
    // mai il tempo di reagire.
    n.mira = Math.max(0, n.mira - dt);
    if (n.mira === 0 && n.ricarica === 0) {
      spara(n, n.ang, regola);
      n.ricarica = regola.cadenza;
    }
    return;
  }

  n.mira = regola.pausaMira;
  const verso = campoBersagli ? passoVerso(mappa, campoBersagli, n.x, n.y) : null;
  const dir = verso ?? { x: dx / (distanza || 1), y: dy / (distanza || 1) };
  scorri(n, dir.x * regola.velocita * dt, dir.y * regola.velocita * dt, mappa);
}

function pattugliando(mappa, n, regola, dt) {
  if (!n.meta || !n.campoMeta || Math.hypot(n.meta.x - n.x, n.meta.y - n.y) < TILE * 0.6) {
    const scelta = casellaDelGiro(mappa, n);
    if (!scelta) return;
    n.meta = centroCasella(mappa, scelta.tx, scelta.ty);
    n.campoMeta = campo(mappa, [n.meta]);
  }
  cammina(mappa, n, regola, n.campoMeta, dt);
}

function cammina(mappa, n, regola, c, dt) {
  if (!c) return;
  const dir = passoVerso(mappa, c, n.x, n.y);
  if (!dir) {
    n.meta = null;
    n.campoMeta = null;
    return;
  }
  const primaX = n.x;
  const primaY = n.y;
  scorri(n, dir.x * regola.velocita * dt, dir.y * regola.velocita * dt, mappa);
  // Guarda dove sta andando, ma solo se si e' mosso davvero: fermo contro un
  // muro girerebbe la testa a caso.
  if (Math.hypot(n.x - primaX, n.y - primaY) > 0.3) n.ang = Math.atan2(dir.y, dir.x);
  else {
    n.meta = null;
    n.campoMeta = null;
  }
}

function casellaDelGiro(mappa, n) {
  const candidate = [];
  for (let ty = n.casa.ty - GIRO_DI_RONDA; ty <= n.casa.ty + GIRO_DI_RONDA; ty++) {
    for (let tx = n.casa.tx - GIRO_DI_RONDA; tx <= n.casa.tx + GIRO_DI_RONDA; tx++) {
      if (tx < 0 || ty < 0 || tx >= mappa.larghezza || ty >= mappa.altezza) continue;
      if (mappa.griglia[ty][tx] === 1) continue;
      candidate.push({ tx, ty });
    }
  }
  if (!candidate.length) return null;
  return candidate[(Math.random() * candidate.length) | 0];
}

function differenza(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export { chiVede };
