// Le mappe delle spedizioni, generate a partire da un seme.
//
// Stanze rettangolari collegate da corridoi a gomito. Non e' un algoritmo
// raffinato ed e' voluto: quello che conta al buio non e' la pianta elegante,
// e' avere stanze riconoscibili una dall'altra, corridoi che obbligano a
// scegliere da che parte andare, e la certezza che si possa arrivare ovunque.
//
// L'ultima parte e' la piu' importante: una stanza irraggiungibile non si nota
// provando, si nota una sera che ci si gira mezz'ora cercando un nucleo che
// sta dietro un muro. Per questo la connessione si verifica sempre, e una
// mappa che non la passa viene rifatta.

import { TILE, CASELLA } from './regole.js';

/**
 * Le mappe crescono col settore.
 *
 * Prima erano tutte identiche — 44 per 26, sette-dieci stanze — e da sole
 * bastavano a far sembrare uguale il quindicesimo settore al primo: cambiava
 * il disegno, non la scala, e dopo un po' l'occhio non distingueva piu'.
 * Crescendo, l'ultimo e' quasi il doppio del primo: il giro e' piu' lungo, le
 * stazioni sono piu' lontane fra loro, e tornare indietro a rifornirsi
 * comincia a costare davvero.
 */
const LARGHEZZA_BASE = 44;
const ALTEZZA_BASE = 26;
const CRESCITA = 2.2; // caselle in piu' per settore, in larghezza
const LARGHEZZA_MAX = 74;
const ALTEZZA_MAX = 42;

function misure(settore) {
  const n = Math.max(1, settore);
  return {
    larghezza: Math.min(LARGHEZZA_MAX, Math.round(LARGHEZZA_BASE + (n - 1) * CRESCITA)),
    altezza: Math.min(ALTEZZA_MAX, Math.round(ALTEZZA_BASE + (n - 1) * CRESCITA * 0.6)),
  };
}

const STANZE_BASE = { minimo: 7, massimo: 10 };

/** Piu' grande e' la mappa, piu' stanze ci stanno: sennò diventa un corridoio. */
function quanteStanze(settore) {
  const in_piu = Math.floor((Math.max(1, settore) - 1) / 3);
  return { minimo: STANZE_BASE.minimo + in_piu, massimo: STANZE_BASE.massimo + in_piu };
}
const LATO = { min: 5, max: 10 };
const ALTO = { min: 4, max: 7 };

/** Generatore di numeri con seme: la stessa mappa si puo' rifare identica. */
function dado(seme) {
  let s = seme >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function generaMappa(seme = Date.now(), settore = 1) {
  for (let tentativo = 0; tentativo < 40; tentativo++) {
    const mappa = prova(seme + tentativo * 7919, settore);
    if (mappa) return mappa;
  }
  // Non e' mai successo nelle prove, ma se succedesse meglio una mappa brutta
  // che nessuna mappa.
  return prova(1, settore, true);
}

function prova(seme, settore, insisti = false) {
  const caso = dado(seme);
  const fra = (a, b) => a + Math.floor(caso() * (b - a + 1));

  const { larghezza: LARGHEZZA, altezza: ALTEZZA } = misure(settore);
  const STANZE = quanteStanze(settore);

  const griglia = [];
  for (let y = 0; y < ALTEZZA; y++) griglia.push(new Array(LARGHEZZA).fill(CASELLA.MURO));

  // --- Le stanze -----------------------------------------------------------
  const stanze = [];
  const quante = fra(STANZE.minimo, STANZE.massimo);
  for (let k = 0; k < quante * 12 && stanze.length < quante; k++) {
    const w = fra(LATO.min, LATO.max);
    const h = fra(ALTO.min, ALTO.max);
    const x = fra(2, LARGHEZZA - w - 3);
    const y = fra(2, ALTEZZA - h - 3);
    const nuova = { x, y, w, h };
    // Un margine di due caselle fra una stanza e l'altra: attaccate
    // sembrerebbero una stanza sola con una colonna in mezzo.
    const litiga = stanze.some(
      (s) => x < s.x + s.w + 2 && x + w + 2 > s.x && y < s.y + s.h + 2 && y + h + 2 > s.y,
    );
    if (!litiga) stanze.push(nuova);
  }
  if (stanze.length < 5 && !insisti) return null;

  for (const s of stanze) scava(griglia, s.x, s.y, s.w, s.h);

  // --- I corridoi ----------------------------------------------------------
  // Ogni stanza si attacca alla precedente: cosi' sono tutte collegate per
  // costruzione. Poi qualche scorciatoia in piu', perche' un albero puro
  // costringe sempre a tornare indietro dalla stessa strada.
  const centri = stanze.map((s) => ({
    x: Math.floor(s.x + s.w / 2),
    y: Math.floor(s.y + s.h / 2),
  }));
  for (let k = 1; k < stanze.length; k++) corridoio(griglia, centri[k - 1], centri[k], caso);
  const scorciatoie = Math.max(1, Math.floor(stanze.length / 3));
  for (let k = 0; k < scorciatoie; k++) {
    const a = fra(0, stanze.length - 1);
    const b = fra(0, stanze.length - 1);
    if (a !== b) corridoio(griglia, centri[a], centri[b], caso);
  }

  // --- Le porte ------------------------------------------------------------
  // Dove un corridoio buca il perimetro di una stanza: si disegnano diverse e
  // danno alla mappa dei punti di passaggio riconoscibili.
  for (const s of stanze) {
    for (let x = s.x - 1; x <= s.x + s.w; x++) {
      metti(griglia, x, s.y - 1, CASELLA.PORTA);
      metti(griglia, x, s.y + s.h, CASELLA.PORTA);
    }
    for (let y = s.y - 1; y <= s.y + s.h; y++) {
      metti(griglia, s.x - 1, y, CASELLA.PORTA);
      metti(griglia, s.x + s.w, y, CASELLA.PORTA);
    }
  }

  const mappa = { larghezza: LARGHEZZA, altezza: ALTEZZA, tile: TILE, griglia, stanze, settore };

  // --- La verifica che conta ----------------------------------------------
  const raggiunte = visita(mappa, centri[0]);
  const calpestabili = conta(mappa);
  if (!insisti && raggiunte < calpestabili) return null;

  mappa.partenze = postiNellaStanza(stanze[0], 4);
  return mappa;
}

function scava(griglia, x, y, w, h) {
  for (let ty = y; ty < y + h; ty++)
    for (let tx = x; tx < x + w; tx++) griglia[ty][tx] = CASELLA.PAVIMENTO;
}

/** Corridoio a gomito, con il verso deciso a caso perche' non siano tutti uguali. */
function corridoio(griglia, a, b, caso) {
  if (caso() < 0.5) {
    linea(griglia, a.x, b.x, a.y, true);
    linea(griglia, a.y, b.y, b.x, false);
  } else {
    linea(griglia, a.y, b.y, a.x, false);
    linea(griglia, a.x, b.x, b.y, true);
  }
}

function linea(griglia, da, a, fisso, orizzontale) {
  const passo = da <= a ? 1 : -1;
  for (let v = da; v !== a + passo; v += passo) {
    const x = orizzontale ? v : fisso;
    const y = orizzontale ? fisso : v;
    if (x <= 0 || y <= 0 || x >= griglia[0].length - 1 || y >= griglia.length - 1) continue;
    if (griglia[y][x] === CASELLA.MURO) griglia[y][x] = CASELLA.PAVIMENTO;
  }
}

/** Diventa porta solo una casella che e' gia' un passaggio scavato. */
function metti(griglia, x, y, tipo) {
  if (x <= 0 || y <= 0 || x >= griglia[0].length - 1 || y >= griglia.length - 1) return;
  if (griglia[y][x] === CASELLA.PAVIMENTO) griglia[y][x] = tipo;
}

function conta(mappa) {
  let n = 0;
  for (const riga of mappa.griglia) for (const c of riga) if (c !== CASELLA.MURO) n++;
  return n;
}

/** Quante caselle si raggiungono davvero partendo da li'. */
function visita(mappa, da) {
  const visto = new Set();
  const coda = [`${da.x},${da.y}`];
  visto.add(coda[0]);
  while (coda.length) {
    const [x, y] = coda.pop().split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= mappa.larghezza || ny >= mappa.altezza) continue;
      if (mappa.griglia[ny][nx] === CASELLA.MURO) continue;
      const chiave = `${nx},${ny}`;
      if (visto.has(chiave)) continue;
      visto.add(chiave);
      coda.push(chiave);
    }
  }
  return visto.size;
}

function postiNellaStanza(s, quanti) {
  const posti = [];
  for (let k = 0; k < quanti; k++) {
    posti.push({
      tx: s.x + 1 + (k % Math.max(1, s.w - 2)),
      ty: s.y + 1 + (Math.floor(k / Math.max(1, s.w - 2)) % Math.max(1, s.h - 2)),
    });
  }
  return posti;
}

/**
 * Il centro di una stanza, in pixel di mondo. E' il centro della casella
 * centrale, non il punto fra quattro caselle: un obiettivo piazzato su uno
 * spigolo fra caselle sta mezzo di qua e mezzo di la', e chi ci deve arrivare
 * non ci arriva mai del tutto.
 */
export function centroStanza(s) {
  return {
    x: (s.x + Math.floor(s.w / 2) + 0.5) * TILE,
    y: (s.y + Math.floor(s.h / 2) + 0.5) * TILE,
  };
}
