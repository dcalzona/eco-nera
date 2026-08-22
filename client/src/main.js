// Avvio del client e giro di rendering.

import { muovi, angolo } from '../condiviso/fisica.js';
import { SOTTOPASSO } from '../condiviso/regole.js';
import { Rete } from './rete.js';
import { Comandi } from './input.js';
import { Disegno } from './render.js';
import { calcolaVisione, nuovaMemoria } from './visione.js';

const canvas = document.getElementById('gioco');
const disegno = new Disegno(canvas);
const comandi = new Comandi(canvas);
const rete = new Rete();
rete.avvia();

// --- La previsione locale --------------------------------------------------
// Il proprio personaggio non si aspetta la risposta del server: si muove
// subito, e poi si rifanno i conti quando arriva la verita'. Perche' i conti
// tornino, qui si eseguono passi della stessa identica durata di quelli del
// server (SOTTOPASSO), sullo stesso identico codice, nello stesso ordine —
// ogni comando ha un numero e il server dice fin dove e' arrivato.
let io = null; // posizione dopo l'ultimo sottopasso
let prima = null; // posizione prima dell'ultimo sottopasso, per interpolare
let accumulo = 0;
let seq = 0;
let pendenti = []; // comandi che il server non ha ancora confermato
let ultimoTickVisto = -1;
let memoria = null; // le caselle gia' viste, che restano disegnate spente

let scorso = performance.now();
let fps = 0;

function giro(ora) {
  requestAnimationFrame(giro);
  const dt = Math.min((ora - scorso) / 1000, 0.25);
  scorso = ora;
  fps += (1 / (dt || 1) - fps) * 0.05;

  if (rete.stato !== 'dentro' || !rete.mappa) {
    disegno.scena({ larghezza: 0, altezza: 0, griglia: [] }, [], 0, null, null);
    disegno.messaggio(
      rete.stato === 'caduto' ? 'Connessione persa — riprovo…' : 'Mi collego al server…',
    );
    return;
  }

  const mappa = rete.mappa;
  if (!memoria) memoria = nuovaMemoria(mappa);
  const nostro = rete.ultimaNostra();
  if (!io && nostro) {
    io = { x: nostro.x, y: nostro.y, ang: nostro.a };
    prima = { x: io.x, y: io.y };
  }
  if (!io) return;

  const centro = disegno.schermo(io.x, io.y);
  const c = comandi.leggi(centro);

  // Passi a durata fissa. Se il telefono va a 30 fotogrammi al secondo ne fa
  // due per fotogramma, se va a 120 ne fa uno ogni due: il mondo avanza allo
  // stesso ritmo comunque, ed e' il ritmo del server.
  accumulo += dt;
  let fatti = 0;
  while (accumulo >= SOTTOPASSO && fatti < 8) {
    accumulo -= SOTTOPASSO;
    fatti++;
    seq++;
    prima = { x: io.x, y: io.y };
    muovi(io, c.mx, c.my, SOTTOPASSO, mappa);
    const mira = angolo(c.ax, c.ay) ?? angolo(c.mx, c.my);
    if (mira !== null) io.ang = mira;
    pendenti.push({ seq, mx: c.mx, my: c.my });
    if (pendenti.length > 300) pendenti.shift();
    rete.mandaPasso(seq, c);
  }
  if (fatti === 8) accumulo = 0; // troppo arretrato (app tornata in primo piano)

  riconcilia(mappa);

  // Fra un sottopasso e l'altro si interpola, altrimenti a 60 fotogrammi con
  // passi da un sessantesimo capiterebbe un fotogramma fermo e uno doppio.
  const q = Math.min(1, accumulo / SOTTOPASSO);
  const disegnato = {
    x: prima.x + (io.x - prima.x) * q,
    y: prima.y + (io.y - prima.y) * q,
    a: io.ang,
  };

  const scena = rete
    .personaggi()
    .map((p) => (p.i === rete.io ? { ...p, ...disegnato } : p));

  disegno.inquadra(mappa, disegnato.x, disegnato.y);
  // Le torce di tutti finiscono nella stessa lista: quello che si vede e'
  // la loro unione, e il compagno illumina anche per te.
  const luci = calcolaVisione(mappa, scena, memoria);
  disegno.scena(mappa, scena, rete.io, luci, memoria);
  disegno.stick(comandi);
  disegno.hud([
    `ping ${rete.ping} ms   fps ${fps.toFixed(0)}`,
    `in gioco: ${scena.map((p) => p.n).join(', ')}`,
  ]);

  aggiornaDiario(dt, scena.some((p) => p.i === rete.io), fps, disegnato);
}

/**
 * Rifa' i conti quando arriva una fotografia: si riparte dalla posizione che
 * il server dichiara, si buttano i comandi che ha gia' eseguito e si rieseguono
 * quelli rimasti. Se il telefono e il server hanno calcolato la stessa cosa —
 * ed e' il caso normale — non si sposta di un pixel.
 */
function riconcilia(mappa) {
  const foto = rete.ultimaNostraConTick();
  if (!foto || foto.tick === ultimoTickVisto) return;
  ultimoTickVisto = foto.tick;

  const rifatto = { x: foto.p.x, y: foto.p.y };
  pendenti = pendenti.filter((c) => c.seq > (foto.p.s ?? 0));
  for (const c of pendenti) muovi(rifatto, c.mx, c.my, SOTTOPASSO, mappa);

  const dx = rifatto.x - io.x;
  const dy = rifatto.y - io.y;
  const scarto = Math.hypot(dx, dy);
  diario.correzioneMax = Math.max(diario.correzioneMax, scarto);
  // Sotto il decimo di pixel e' solo l'arrotondamento dei numeri spediti:
  // inseguirlo produrrebbe un tremolio continuo per niente.
  if (scarto < 0.1) return;

  io.x = rifatto.x;
  io.y = rifatto.y;
  // Anche il punto di partenza dell'interpolazione si sposta, altrimenti la
  // correzione si vedrebbe come uno strappo nel fotogramma successivo.
  prima.x += dx;
  prima.y += dy;
}

requestAnimationFrame(giro);

// Maniglia per frugare nello stato dalla console del browser durante le prove.
window.ecoNera = {
  rete,
  comandi,
  disegno,
  giro, // per far avanzare il gioco a mano quando si prova senza schermo
  get io() { return io; },
  get pendenti() { return pendenti; },
};

// --- Il diario -------------------------------------------------------------
// Il telefono racconta al server come sta andando. Serve perche' gli scatti si
// vedono sul dispositivo vero e non si riproducono sul PC: invece di tirare a
// indovinare, si guardano i numeri di chi sta giocando davvero.
const diario = {
  fotogrammaPiuLungo: 0,
  correzioneMax: 0,
  saltoMax: 0,
  assente: false,
  da: performance.now(),
};
let dovEro = null;

function aggiornaDiario(dt, sonoInScena, fps, disegnato) {
  diario.fotogrammaPiuLungo = Math.max(diario.fotogrammaPiuLungo, dt * 1000);
  if (!sonoInScena) diario.assente = true;

  // Quanto e' saltato sullo schermo il personaggio da un fotogramma all'altro:
  // e' la misura diretta di quello che si vede come "scatto".
  if (dovEro) {
    diario.saltoMax = Math.max(diario.saltoMax, Math.hypot(disegnato.x - dovEro.x, disegnato.y - dovEro.y));
  }
  dovEro = { x: disegnato.x, y: disegnato.y };

  const ora = performance.now();
  if (ora - diario.da < 2000) return;

  rete.mandaDiario({
    fps: Math.round(fps),
    fotogrammaPiuLungo: Math.round(diario.fotogrammaPiuLungo),
    correzioneMax: Math.round(diario.correzioneMax * 10) / 10,
    saltoMax: Math.round(diario.saltoMax * 10) / 10,
    assente: diario.assente,
    fotografie: Math.round((rete.contaFotografie * 1000) / (ora - diario.da)),
    riconnessioni: rete.riconnessioni,
    ping: rete.ping,
    arretrati: pendenti.length,
  });

  rete.contaFotografie = 0;
  rete.riconnessioni = 0;
  diario.fotogrammaPiuLungo = 0;
  diario.correzioneMax = 0;
  diario.saltoMax = 0;
  diario.assente = false;
  diario.da = ora;
}

// Lo schermo non deve spegnersi durante una partita.
async function tieniAcceso() {
  try {
    await navigator.wakeLock?.request('screen');
  } catch {
    /* il browser puo' rifiutare: non e' grave */
  }
}
tieniAcceso();
addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') tieniAcceso();
});
