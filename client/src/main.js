// Avvio del client e giro di rendering.

import { muovi, angolo } from '../condiviso/fisica.js';
import { SOTTOPASSO, STATO, VELOCITA, VELOCITA_CRITICO, NEMICI, VITA_MASSIMA, ECO_SECONDI }
  from '../condiviso/regole.js';
import { Rete } from './rete.js';
import { Comandi } from './input.js';
import { Disegno } from './render.js';
import { calcolaVisione, nuovaMemoria, ventaglio, illuminato } from './visione.js';

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
let versioneMappaVista = -1;

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
  if (rete.versioneMappa !== versioneMappaVista) {
    // Settore nuovo: si riparte al buio, senza ricordi di una pianta che non
    // esiste piu', e senza previsioni riferite a posizioni di prima.
    versioneMappaVista = rete.versioneMappa;
    memoria = nuovaMemoria(mappa);
    io = null;
    prima = null;
    pendenti = [];
    accumulo = 0;
    ultimoTickVisto = -1;
    return;
  }
  if (!memoria) memoria = nuovaMemoria(mappa);
  const nostro = rete.ultimaNostra();
  if (!io && nostro) {
    io = { x: nostro.x, y: nostro.y, ang: nostro.a };
    prima = { x: io.x, y: io.y };
  }
  if (!io) return;

  comandi.misura(disegno.w, disegno.h);
  const centro = disegno.schermo(io.x, io.y);
  const c = comandi.leggi(centro);

  // Passi a durata fissa. Se il telefono va a 30 fotogrammi al secondo ne fa
  // due per fotogramma, se va a 120 ne fa uno ogni due: il mondo avanza allo
  // stesso ritmo comunque, ed e' il ritmo del server.
  // A terra ci si trascina, da morti non ci si muove. Il telefono applica la
  // stessa regola del server, altrimenti prevederebbe una corsa che non c'e'.
  const mioStato = nostro?.st ?? STATO.VIVO;
  const velocita =
    mioStato === STATO.MORTO ? 0 : mioStato === STATO.CRITICO ? VELOCITA_CRITICO : VELOCITA;

  accumulo += dt;
  let fatti = 0;
  while (accumulo >= SOTTOPASSO && fatti < 8) {
    accumulo -= SOTTOPASSO;
    fatti++;
    seq++;
    prima = { x: io.x, y: io.y };
    muovi(io, c.mx, c.my, SOTTOPASSO, mappa, velocita);
    const mira = angolo(c.ax, c.ay) ?? angolo(c.mx, c.my);
    if (mira !== null) io.ang = mira;
    pendenti.push({ seq, mx: c.mx, my: c.my, vel: velocita });
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
  const fuochi = rete.fuochi();
  const luci = calcolaVisione(mappa, scena, memoria, fuochi);

  // I nemici esistono anche al buio, ma si vedono solo se qualcuno li
  // illumina — o se l'Eco li ha marcati, e allora si vedono anche attraverso
  // i muri. E di quelli che si vedono si vede anche dove stanno guardando:
  // sapere cosa vede la sentinella e' meta' del gioco.
  const regolaNemico = NEMICI.pattugliatore;
  const nemiciVisti = rete.nemici().filter((n) => n.m === 1 || illuminato(luci, n.x, n.y));
  const coni = nemiciVisti.map((n) => ({
    punti: ventaglio(mappa, n.x, n.y, n.a, regolaNemico.cono, regolaNemico.vista, null),
    umore: n.u,
  }));

  disegno.scena(mappa, scena, rete.io, luci, memoria, nemiciVisti, coni, rete.colpi(), fuochi);
  disegno.stick(comandi);

  // I rumori sentiti di recente, con quanto sono svaniti.
  const adesso = performance.now();
  const echi = rete.rumoriSentiti
    .map((r) => ({
      ...r,
      forza: r.a?.[rete.io] ?? 0,
      vita: 1 - (adesso - r.nato) / (ECO_SECONDI * 1000),
    }))
    .filter((r) => r.vita > 0 && r.forza > 0);
  disegno.rumori(echi, disegnato);

  const mio = scena.find((p) => p.i === rete.io);
  disegno.pulsanti(comandi, mio);
  disegno.cruscotto(mio, scena, VITA_MASSIMA);
  const ob = rete.obiettivi();
  disegno.obiettivi(ob, memoria, mappa);
  disegno.missione(ob, disegnato);
  disegno.hud([`ping ${rete.ping} ms   fps ${fps.toFixed(0)}`]);

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
  for (const c of pendenti) muovi(rifatto, c.mx, c.my, SOTTOPASSO, mappa, c.vel ?? VELOCITA);

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
