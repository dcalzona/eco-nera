// Chi vede cosa. Si calcola sul telefono, sessanta volte al secondo: il server
// non c'entra, perche' in un gioco contro il computer non c'e' nessuno da cui
// nascondere la mappa, e cosi' la luce resta fluida quanto il rendering.
//
// Il metodo e' un ventaglio di raggi: da ogni sorgente si spara un raggio ogni
// frazione di grado, ognuno cammina sulla griglia finche' non incontra un muro,
// e le punte dei raggi cucite insieme formano il poligono illuminato.

import { TILE, LUCI, CONSAPEVOLEZZA, SPAZIATURA_RAGGI } from '../condiviso/regole.js';

/**
 * Di quanto il raggio sconfina dentro il muro che lo ferma. Senza, il poligono
 * si chiude sulla faccia della parete e la parete resta al buio: si vedrebbe
 * il pavimento illuminato dentro una stanza dai muri spenti. Meno di una
 * casella, quindi la luce non arriva mai dall'altra parte.
 */
const SPORGENZA = 15;
import { muro } from '../condiviso/mappa.js';

/**
 * Un raggio che cammina di casella in casella (DDA). Torna quanto ha percorso
 * prima di sbattere, e per strada segna le caselle attraversate come viste.
 */
function tiro(mappa, ox, oy, dx, dy, massimo, memoria) {
  let tx = Math.floor(ox / TILE);
  let ty = Math.floor(oy / TILE);

  const passoX = dx < 0 ? -1 : 1;
  const passoY = dy < 0 ? -1 : 1;
  const salitaX = dx === 0 ? Infinity : Math.abs(TILE / dx);
  const salitaY = dy === 0 ? Infinity : Math.abs(TILE / dy);

  let latoX =
    dx === 0 ? Infinity : (dx < 0 ? ox - tx * TILE : (tx + 1) * TILE - ox) / Math.abs(dx);
  let latoY =
    dy === 0 ? Infinity : (dy < 0 ? oy - ty * TILE : (ty + 1) * TILE - oy) / Math.abs(dy);

  ricorda(memoria, mappa, tx, ty);

  let percorso = 0;
  while (percorso < massimo) {
    if (latoX < latoY) {
      percorso = latoX;
      latoX += salitaX;
      tx += passoX;
    } else {
      percorso = latoY;
      latoY += salitaY;
      ty += passoY;
    }
    if (percorso >= massimo) return massimo;
    // Il muro che ferma il raggio si vede: e' la parete che stai illuminando.
    ricorda(memoria, mappa, tx, ty);
    if (muro(mappa, tx, ty)) {
      // Si sconfina nel muro, ma senza mai uscirne dall'altro lato: un raggio
      // che prende uno spigolo di striscio attraversa la casella in pochissimo
      // e proseguendo dritto riemergerebbe nel pavimento oltre la parete.
      const uscita = Math.min(latoX, latoY) - percorso;
      return percorso + Math.max(0, Math.min(SPORGENZA, uscita - 0.02));
    }
  }
  return massimo;
}

function ricorda(memoria, mappa, tx, ty) {
  if (!memoria) return;
  if (tx < 0 || ty < 0 || tx >= mappa.larghezza || ty >= mappa.altezza) return;
  memoria.dati[ty * mappa.larghezza + tx] = 1;
}

/** Il poligono illuminato da una sorgente: il centro, poi le punte dei raggi. */
export function ventaglio(mappa, x, y, direzione, apertura, raggio, memoria) {
  // Tanti raggi quanti ne servono perche' le punte distino pochi pixel: il
  // costo va dove si vede, cioe' sui fasci lunghi.
  const quanti = Math.min(256, Math.max(10, Math.ceil((apertura * raggio) / SPAZIATURA_RAGGI)));
  const punti = [{ x, y }];
  for (let k = 0; k <= quanti; k++) {
    const a = direzione - apertura / 2 + (apertura * k) / quanti;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = tiro(mappa, x, y, dx, dy, raggio, memoria);
    punti.push({ x: x + dx * d, y: y + dy * d });
  }
  return punti;
}

/**
 * Tutte le luci in scena. I coni dei compagni finiscono nella stessa lista:
 * il campo visivo e' la loro unione, ed e' tutto il cooperativo in una riga.
 */
export function calcolaVisione(mappa, personaggi, memoria, fuochi = []) {
  const luci = [];
  for (const p of personaggi) {
    const regola = LUCI[p.r] ?? LUCI.faro;
    // A torcia spenta resta solo il cerchio ravvicinato: si vede pochissimo,
    // ma i nemici ti individuano a meno della meta' della distanza.
    if (p.l !== 0) luci.push({
      x: p.x,
      y: p.y,
      raggio: regola.raggio,
      colore: regola.colore,
      sfuma: true,
      punti: ventaglio(mappa, p.x, p.y, p.a, regola.apertura, regola.raggio, memoria),
    });
    // Il cerchio ravvicinato: poco, ma tutt'intorno. Non sfuma sui bordi —
    // sfumando lascerebbe un anello scuro attorno al personaggio proprio
    // dentro al cono, dove invece si deve vedere benissimo.
    luci.push({
      x: p.x,
      y: p.y,
      raggio: CONSAPEVOLEZZA,
      colore: regola.colore,
      sfuma: false,
      punti: ventaglio(mappa, p.x, p.y, 0, Math.PI * 2, CONSAPEVOLEZZA, memoria),
    });
  }

  // I fuochi piantati per terra dal Faro: illuminano tutt'intorno e continuano
  // a farlo mentre lui va avanti. E' quello che gli permette di lasciare una
  // stanza illuminata alle spalle invece di portarsi dietro tutta la luce.
  for (const f of fuochi) {
    luci.push({
      x: f.x,
      y: f.y,
      raggio: f.r,
      colore: LUCI.faro.colore,
      sfuma: true,
      fuoco: true,
      punti: ventaglio(mappa, f.x, f.y, 0, Math.PI * 2, f.r, memoria),
    });
  }

  return luci;
}

/** Vero se il punto cade dentro almeno una delle luci. Servira' per i nemici. */
export function illuminato(luci, x, y) {
  for (const luce of luci) {
    if (Math.hypot(x - luce.x, y - luce.y) > luce.raggio) continue;
    if (dentroPoligono(luce.punti, x, y)) return true;
  }
  return false;
}

function dentroPoligono(punti, x, y) {
  let dentro = false;
  for (let i = 0, j = punti.length - 1; i < punti.length; j = i++) {
    const a = punti[i];
    const b = punti[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

/** La memoria di quello che si e' gia' visto, una casella per byte. */
export function nuovaMemoria(mappa) {
  return { dati: new Uint8Array(mappa.larghezza * mappa.altezza), larghezza: mappa.larghezza };
}

export function giaVisto(memoria, tx, ty) {
  return memoria.dati[ty * memoria.larghezza + tx] === 1;
}
