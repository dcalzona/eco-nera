// Il disegno del briefing: cosa bisogna fare, spiegato senza parole.
//
// Le parole ci sono gia' accanto, in sei lingue. Questo disegno serve a
// un'altra cosa: farlo capire prima di averlo letto. Per questo dentro non c'e'
// nemmeno una lettera — solo le forme e i colori che si ritroveranno in
// partita, gli stessi identici. Il cerchio tratteggiato arancione qui e' lo
// stesso cerchio tratteggiato arancione che poi si vede sul pavimento.

import { disegnaOmino } from './render.js';

const C = {
  fondo: '#080c14',
  convoglio: '#c8a86a',
  boss: '#ff8a3c',
  muro: '#313d5c',
  pavimento: '#141b28',
  nostro: '#b6e06a',
  compagno: '#4ecdc4',
  nemico: '#e05a5a',
  server: '#ffd166',
  fatto: '#5fd08a',
  bomba: '#ff8a4c',
  zona: '#c98bff',
  uscita: '#7fd3ff',
  tratto: '#78849f',
};

/**
 * Disegna il quadretto della modalita'. `w` e `h` sono in punti CSS: dentro si
 * lavora su una tela nominale di 300x190 e si scala, cosi' il disegno e' lo
 * stesso su ogni telefono.
 */
export function disegnaBriefing(c, modalita, w, h) {
  c.save();
  c.clearRect(0, 0, w, h);
  c.fillStyle = C.fondo;
  c.fillRect(0, 0, w, h);
  const k = Math.min(w / 300, h / 190);
  c.translate((w - 300 * k) / 2, (h - 190 * k) / 2);
  c.scale(k, k);

  if (modalita === 'bomba') bomba(c);
  else if (modalita === 'dominio') dominio(c);
  else if (modalita === 'convoglio') convoglio(c);
  else if (modalita === 'boss') boss(c);
  else sabotaggio(c);

  c.restore();
}

// --- Sabotaggio ------------------------------------------------------------
// Due armadi appoggiati alle pareti, uno gia' spento e uno da spegnere con
// l'omino accanto, e la strada del ritorno verso l'uscita.
function sabotaggio(c) {
  stanza(c, 16, 18, 268, 154);

  // Quello gia' fatto, in alto a sinistra, appoggiato alla parete di sopra.
  armadio(c, 74, 30, Math.PI / 2, true);

  // Quello da fare, a destra contro la parete, con l'omino che ci lavora.
  armadio(c, 268, 96, Math.PI, false);
  disegnaOmino(c, 234, 96, 0, { corpo: C.nostro, arma: 'lunga' });
  anello(c, 234, 96, 19, 0.62, C.fatto);

  // Il compagno che guarda le spalle: e' il modo in cui si fa davvero.
  disegnaOmino(c, 206, 128, 2.4, { corpo: C.compagno, arma: 'corta' });

  // E poi si torna indietro.
  freccia(c, 200, 152, 60, 152, C.uscita);
  cerchio(c, 44, 152, 13, C.uscita);
}

// --- Bomba -----------------------------------------------------------------
// Tre momenti in fila: la prendi, la porti (con il tempo che scende), la
// difendi mentre arrivano.
function bomba(c) {
  stanza(c, 16, 18, 268, 154);

  // 1. Dove si prende.
  ordigno(c, 48, 62, false);
  disegnaOmino(c, 48, 96, -Math.PI / 2, { corpo: C.nostro, arma: 'lunga' });

  // 2. Il viaggio, con la clessidra sopra: e' il pezzo con il tempo.
  freccia(c, 74, 62, 138, 62, C.bomba);
  orologio(c, 106, 40);

  // 3. Il punto dove va piazzata, segnato come in partita.
  bersaglio(c, 200, 78, 34);
  ordigno(c, 200, 78, true);

  // 4. E arrivano. Il compagno sta davanti, dove serve.
  disegnaOmino(c, 168, 116, -0.9, { corpo: C.compagno, arma: 'corta' });
  for (const [x, y] of [[254, 44], [250, 130], [148, 48]]) {
    disegnaOmino(c, x, y, Math.atan2(78 - y, 200 - x), { corpo: C.nemico, arma: 'lunga' });
    freccia(c, x, y, 200 + (x - 200) * 0.34, 78 + (y - 78) * 0.34, C.nemico, true);
  }
}

// --- Dominio ---------------------------------------------------------------
// Un cerchio, voi dentro, loro che arrivano da tutte le parti.
function dominio(c) {
  stanza(c, 16, 18, 268, 154);

  const cx = 150;
  const cy = 95;
  const r = 52;

  c.save();
  const g = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  g.addColorStop(0, 'rgba(201,139,255,0.03)');
  g.addColorStop(1, 'rgba(201,139,255,0.16)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = C.zona;
  c.lineWidth = 1.6;
  c.setLineDash([7, 6]);
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  c.restore();

  anello(c, cx, cy, r - 3, 0.58, C.zona);

  disegnaOmino(c, cx - 16, cy + 6, 2.6, { corpo: C.nostro, arma: 'lunga' });
  disegnaOmino(c, cx + 16, cy - 8, -0.5, { corpo: C.compagno, arma: 'corta' });

  // Arrivano da fuori, da tutte le parti: e' l'unica missione in cui non ci si
  // nasconde, ci si pianta.
  for (const a of [-2.5, -0.9, 0.5, 2.1]) {
    const x = cx + Math.cos(a) * 116;
    const y = cy + Math.sin(a) * 66;
    disegnaOmino(c, x, y, Math.atan2(cy - y, cx - x), { corpo: C.nemico, arma: 'lunga' });
    freccia(c, x, y, cx + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12), C.nemico, true);
  }
}

// --- I mattoncini ----------------------------------------------------------

// --- Scorta il convoglio ---------------------------------------------------
// Il binario che attraversa, il vagone a meta' strada col suo cerchio attorno,
// i due omini DENTRO il cerchio, e la freccia all'indietro che dice cosa
// succede se ci si allontana. L'orologio in un angolo: qui il tempo uccide.
function convoglio(c) {
  stanza(c, 16, 18, 268, 154);

  // Il binario, da sinistra a destra.
  c.strokeStyle = C.tratto;
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(44, 108);
  c.lineTo(120, 108);
  c.lineTo(150, 74);
  c.lineTo(250, 74);
  c.stroke();

  // Le traversine: lo fanno leggere come un binario e non come un tubo.
  c.strokeStyle = 'rgba(120,132,159,0.5)';
  c.lineWidth = 2;
  for (let x = 50; x < 118; x += 14) {
    c.beginPath();
    c.moveTo(x, 102);
    c.lineTo(x, 114);
    c.stroke();
  }
  for (let x = 160; x < 248; x += 14) {
    c.beginPath();
    c.moveTo(x, 68);
    c.lineTo(x, 80);
    c.stroke();
  }

  // Il cerchio da tenere, attorno al vagone.
  anello(c, 120, 106, 40, 1, C.uscita);

  // Il vagone.
  c.fillStyle = C.convoglio;
  c.fillRect(104, 96, 32, 20);
  c.fillStyle = C.fatto;
  c.fillRect(104, 103, 32, 6);

  // I due, dentro il cerchio: e' la condizione.
  disegnaOmino(c, 92, 128, -Math.PI / 4, { corpo: C.nostro, arma: 'corta' });
  disegnaOmino(c, 146, 126, (-3 * Math.PI) / 4, { corpo: C.compagno, arma: 'corta' });

  // Avanti se ci siete, indietro se ve ne andate.
  freccia(c, 150, 92, 214, 92, C.fatto);
  freccia(c, 104, 84, 66, 84, C.nemico, true);

  // I nemici che arrivano.
  disegnaOmino(c, 236, 118, Math.PI, { corpo: C.nemico, arma: 'corta' });

  // E il tempo che scorre: e' l'unica missione in cui scaduto si perde.
  orologio(c, 254, 40);

  // L'uscita in fondo al binario.
  cerchio(c, 258, 74, 11, C.uscita);
}

// --- Uccidi il boss --------------------------------------------------------
// Il corridoio largo con i ripari, la cassa di munizioni in fondo, l'arena col
// grosso in mezzo, e le porte sbarrate dietro che si apriranno.
function boss(c) {
  // Il corridoio.
  c.fillStyle = C.pavimento;
  c.fillRect(20, 74, 116, 44);
  c.strokeStyle = C.muro;
  c.lineWidth = 3;
  c.strokeRect(20, 74, 116, 44);

  // I due che risalgono.
  disegnaOmino(c, 34, 88, 0, { corpo: C.nostro, arma: 'corta' });
  disegnaOmino(c, 34, 106, 0, { corpo: C.compagno, arma: 'corta' });

  // I ripari nel corridoio: le stesse barre che pianta l'Assalto.
  c.strokeStyle = '#8b95b3';
  c.lineWidth = 5;
  for (const [x, y] of [[68, 80], [92, 106], [114, 82]]) {
    c.beginPath();
    c.moveTo(x, y - 8);
    c.lineTo(x, y + 8);
    c.stroke();
  }
  disegnaOmino(c, 76, 104, Math.PI, { corpo: C.nemico, arma: 'corta' });
  disegnaOmino(c, 106, 84, Math.PI, { corpo: C.nemico, arma: 'corta' });

  // La cassa di munizioni in fondo al corridoio, prima di entrare.
  c.fillStyle = C.server;
  c.fillRect(126, 90, 12, 12);

  // L'arena.
  c.fillStyle = C.pavimento;
  c.fillRect(136, 42, 106, 108);
  c.strokeStyle = C.muro;
  c.lineWidth = 3;
  c.strokeRect(136, 42, 106, 108);

  // Il boss: grosso, e si vede che e' un'altra cosa.
  c.fillStyle = 'rgba(255,138,60,0.22)';
  c.beginPath();
  c.arc(186, 96, 26, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.boss;
  c.beginPath();
  c.arc(186, 96, 18, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#8a4a1c';
  c.beginPath();
  c.arc(179, 96, 6, 0, Math.PI * 2);
  c.fill();

  // Gli scagnozzi.
  disegnaOmino(c, 214, 66, Math.PI, { corpo: C.nemico, arma: 'corta' });
  disegnaOmino(c, 214, 128, Math.PI, { corpo: C.nemico, arma: 'corta' });

  // Le porte sbarrate in fondo: le grate dicono "di qui non si passa".
  c.strokeStyle = C.nemico;
  c.lineWidth = 3;
  for (const y of [72, 120]) {
    for (let k = -1; k <= 1; k++) {
      c.beginPath();
      c.moveTo(242, y + k * 7);
      c.lineTo(258, y + k * 7);
      c.stroke();
    }
  }

  // E l'uscita oltre, tratteggiata: c'e', ma non ancora.
  freccia(c, 250, 96, 274, 96, C.uscita, true);
  cerchio(c, 278, 96, 10, C.uscita);
}

function stanza(c, x, y, w, h) {
  c.save();
  c.fillStyle = C.pavimento;
  c.fillRect(x, y, w, h);
  c.strokeStyle = C.muro;
  c.lineWidth = 3;
  c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  c.restore();
}

/** Un armadio dei server, appoggiato alla parete, con le spie davanti. */
function armadio(c, x, y, ang, spento) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.fillStyle = spento ? '#26313f' : '#33405c';
  c.fillRect(-7, -11, 12, 22);
  c.strokeStyle = 'rgba(5,7,12,0.8)';
  c.lineWidth = 1;
  c.strokeRect(-7, -11, 12, 22);
  for (let k = -2; k <= 2; k++) {
    c.fillStyle = spento ? C.fatto : C.server;
    c.globalAlpha = spento ? 0.9 : (k % 2 ? 0.4 : 0.95);
    c.fillRect(2, k * 4 - 1.2, 2.6, 2.4);
  }
  c.restore();
}

function ordigno(c, x, y, piazzata) {
  c.save();
  c.fillStyle = C.bomba;
  c.beginPath();
  c.arc(x, y, 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffd9a0';
  c.beginPath();
  c.arc(x, y - 2, 2.8, 0, Math.PI * 2);
  c.fill();
  if (piazzata) anello(c, x, y, 14, 0.45, '#ff5d5d');
  c.restore();
}

/** Il segno del punto dove va piazzata: cerchio tratteggiato e squadrette. */
function bersaglio(c, x, y, r) {
  c.save();
  c.strokeStyle = C.bomba;
  c.globalAlpha = 0.75;
  c.lineWidth = 1.6;
  c.setLineDash([6, 5]);
  c.beginPath();
  c.arc(x, y, r * 0.72, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  c.globalAlpha = 1;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    c.beginPath();
    c.moveTo(x + sx * r, y + sy * r - sy * 8);
    c.lineTo(x + sx * r, y + sy * r);
    c.lineTo(x + sx * r - sx * 8, y + sy * r);
    c.stroke();
  }
  c.restore();
}

function orologio(c, x, y) {
  c.save();
  c.strokeStyle = C.bomba;
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(x, y, 8, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - 5);
  c.moveTo(x, y);
  c.lineTo(x + 4, y + 2);
  c.stroke();
  c.restore();
}

function anello(c, x, y, r, quanto, colore) {
  c.save();
  c.strokeStyle = colore;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * quanto);
  c.stroke();
  c.restore();
}

function cerchio(c, x, y, r, colore) {
  c.save();
  c.strokeStyle = colore;
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function freccia(c, x1, y1, x2, y2, colore, tratteggiata = false) {
  c.save();
  c.strokeStyle = colore;
  c.fillStyle = colore;
  c.lineWidth = 2;
  if (tratteggiata) c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.setLineDash([]);

  const ang = Math.atan2(y2 - y1, x2 - x1);
  c.translate(x2, y2);
  c.rotate(ang);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-7, 4.5);
  c.lineTo(-7, -4.5);
  c.closePath();
  c.fill();
  c.restore();
}
