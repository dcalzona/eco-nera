// La mappa di prova, disegnata a mano. Al momento e' una sola: la generazione
// procedurale arrivera' piu' avanti, quando ci saranno obiettivi da distribuire.
//
//   #  muro        .  pavimento        +  porta (si attraversa, si disegna diversa)
//
// Tutte le righe devono essere lunghe uguale: c'e' un controllo qui sotto che
// lo verifica all'avvio, cosi' un errore di battitura si vede subito invece di
// diventare un muro invisibile in un angolo della mappa.

import { TILE, CASELLA } from './regole.js';

const DISEGNO = [
  '########################################',
  '#........#............#................#',
  '#........#............#................#',
  '#........#....####....#....########....#',
  '#........+....#..#....+....#......#....#',
  '#........#....#..#....#....#......#....#',
  '#........#....####....#....####+###....#',
  '#........#............#................#',
  '#####+########+#######################+#',
  '#......................................#',
  '#..........########..........#####.....#',
  '#..........#......#..........#...#.....#',
  '#..........#......+..........+...#.....#',
  '#..........########..........#####.....#',
  '#......................................#',
  '########+#############+#################',
  '#..............#.......................#',
  '#..............#.......................#',
  '#....######....#.....########..........#',
  '#....#....#....+.....#......+..........#',
  '#....#....#....#.....#......#..........#',
  '#....######....#.....########..........#',
  '#..............#.......................#',
  '########################################',
];

function costruisci(disegno) {
  const larghezza = disegno[0].length;
  disegno.forEach((riga, y) => {
    if (riga.length !== larghezza) {
      throw new Error(
        `Mappa storta: la riga ${y} e' lunga ${riga.length} invece di ${larghezza}.`,
      );
    }
  });

  const griglia = disegno.map((riga) =>
    [...riga].map((c) => {
      if (c === '#') return CASELLA.MURO;
      if (c === '+') return CASELLA.PORTA;
      return CASELLA.PAVIMENTO;
    }),
  );

  return { larghezza, altezza: disegno.length, tile: TILE, griglia };
}

export const MAPPA = costruisci(DISEGNO);

/** Vero se in quella casella non si puo' entrare. Fuori mappa conta come muro. */
export function muro(mappa, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= mappa.larghezza || ty >= mappa.altezza) return true;
  return mappa.griglia[ty][tx] === CASELLA.MURO;
}

/** Centro in pixel di mondo della casella indicata. */
export function centroCasella(mappa, tx, ty) {
  return { x: (tx + 0.5) * mappa.tile, y: (ty + 0.5) * mappa.tile };
}

/** Tutte le caselle calpestabili, per scegliere dove far comparire qualcosa. */
export function pavimenti(mappa) {
  const elenco = [];
  for (let ty = 0; ty < mappa.altezza; ty++) {
    for (let tx = 0; tx < mappa.larghezza; tx++) {
      if (!muro(mappa, tx, ty)) elenco.push({ tx, ty });
    }
  }
  return elenco;
}

/** Dove compaiono i giocatori: il corridoio centrale. */
export const PARTENZE = [
  { tx: 21, ty: 12 },
  { tx: 24, ty: 12 },
  { tx: 21, ty: 9 },
  { tx: 24, ty: 9 },
];
