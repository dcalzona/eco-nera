// Server di Eco Nera: serve il gioco ai telefoni e fa girare la simulazione.
//
//   node server/server.js [porta]
//
// I telefoni aprono http://<ip-del-pc>:5190 sulla stessa rete Wi-Fi.
// Non serve costruire l'APK per provare: quello arrivera' alla fine.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

import { Mondo } from '../client/simulazione/mondo.js';
import { TICK_HZ, VERSIONE, DIFFICOLTA }
from '../client/condiviso/regole.js';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.join(QUI, '..', 'client');
const PORTA = Number(process.argv[2]) || 5190;

const TIPI = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://interno');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';

  const file = path.join(RADICE, rel);
  // Nessuna uscita dalla cartella del client.
  if (!file.startsWith(RADICE)) {
    res.writeHead(403).end('no');
    return;
  }

  fs.readFile(file, (err, dati) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Non trovato: ' + rel);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPI[path.extname(file)] ?? 'application/octet-stream',
      // Senza questo il browser continua a servire i vecchi moduli ES dopo
      // una modifica, e sembra che il codice nuovo non faccia effetto.
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    });
    res.end(dati);
  });
});

// La difficolta' del server di casa si dice all'avvio:
//   node server/server.js --difficolta incubo
// Sta qui e non nel menu perche' il mondo e' UNO SOLO per tutti quelli che si
// collegano: se la scegliesse chi entra, il secondo cambierebbe la partita al
// primo a meta' spedizione.
const scelta = process.argv[process.argv.indexOf('--difficolta') + 1];
const mondo = new Mondo(DIFFICOLTA.includes(scelta) ? scelta : 'facile');
const wss = new WebSocketServer({ server });

// Quale collegamento comanda quale personaggio. Serve perche' un telefono puo'
// aprire il collegamento nuovo prima che il vecchio si sia chiuso: senza
// questo, la chiusura del vecchio marcava come scollegato il personaggio che
// il nuovo stava gia' usando, e il giocatore spariva dalle fotografie pur
// continuando a muoversi.
const padroni = new Map();

wss.on('connection', (ws, req) => {
  ws.gioco = null;
  const da = req.socket.remoteAddress?.replace('::ffff:', '') ?? '?';

  // La versione si dice subito, prima ancora che scelgano la classe: se il
  // server e' rimasto acceso da ieri, chi gioca deve saperlo PRIMA di
  // giocare, non dopo aver scoperto che meta' del gioco non c'e'.
  manda(ws, { t: 'ciao', versione: VERSIONE });

  ws.on('message', (grezzo) => {
    let msg;
    try {
      msg = JSON.parse(grezzo);
    } catch {
      return;
    }

    if (msg.t === 'entra') {
      const g = mondo.entra(
        String(msg.sessione || ''),
        String(msg.nome || '').slice(0, 16),
        String(msg.classe || ''),
        msg.solo === true,
      );

      const vecchio = padroni.get(g.id);
      if (vecchio && vecchio !== ws) {
        console.log(`  (${g.nome} aveva un collegamento vecchio ancora aperto: lo chiudo)`);
        vecchio.gioco = null; // la sua chiusura non deve piu' toccare il personaggio
        try { vecchio.close(); } catch { /* gia' morto */ }
      }
      padroni.set(g.id, ws);
      ws.gioco = g.id;
      manda(ws, {
        t: 'benvenuto',
        versione: VERSIONE,
        id: g.id,
        ruolo: g.ruolo,
        nome: g.nome,
        tickHz: TICK_HZ,
        mappa: mondo.mappa,
      });
      // La pianta subito dopo il benvenuto: la prima fotografia parla per
      // posizioni che solo la pianta conosce, e senza di lei chi entra
      // vedrebbe un settore senza obiettivi per un cinquantesimo di secondo.
      manda(ws, mondo.pianta());
      console.log(`+ ${g.nome} (${g.ruolo}) da ${da}`);
      return;
    }

    if (msg.t === 'input' && ws.gioco) {
      // Due forme: un comando solo (com'e' sempre stato) oppure un gruppo. Si
      // accettano tutte e due, cosi' un telefono con l'app vecchia continua a
      // giocare invece di muoversi a scatti senza che nessuno capisca perche'.
      if (Array.isArray(msg.c)) {
        for (const c of msg.c) mondo.input(ws.gioco, c);
      } else {
        mondo.input(ws.gioco, msg);
      }
      return;
    }

    if (msg.t === 'diario' && ws.gioco) {
      // Il client racconta come e' andato l'ultimo tratto. Si stampa solo
      // quando qualcosa non va, altrimenti il terminale diventa illeggibile.
      const g = mondo.giocatori.get(ws.gioco);
      const nome = g ? g.nome : '?';
      const guai = [];
      if (msg.saltoMax > 6) guai.push(`salto sullo schermo di ${msg.saltoMax} px`);
      if (msg.correzioneMax > 2) guai.push(`correzione di ${msg.correzioneMax} px`);
      if (msg.fotogrammaPiuLungo > 60) guai.push(`fotogramma da ${msg.fotogrammaPiuLungo} ms`);
      if (msg.assente) guai.push('sparito dalle fotografie');
      if (msg.riconnessioni > 0) guai.push(`${msg.riconnessioni} riconnessioni`);
      if (msg.fotografie < 15) guai.push(`solo ${msg.fotografie} fotografie al secondo`);
      if (msg.arretrati > 12) guai.push(`${msg.arretrati} comandi non confermati`);
      // Quante volte il personaggio e' rimasto fermo perche' i comandi non
      // erano ancora arrivati. Su quaranta tick in due secondi, otto vuol dire
      // che un quinto della partita e' stato a singhiozzo.
      if (g && g.codaVuota > 8) guai.push(`${g.codaVuota} tick senza comandi`);
      if (g) g.codaVuota = 0;
      if (guai.length) {
        console.log(`! ${nome}: ${guai.join(', ')}  [${msg.fps} fps, ping ${msg.ping} ms]`);
      }
      return;
    }

    if (msg.t === 'pronto' && ws.gioco) {
      // Briefing letto. Il settore parte quando l'hanno detto tutti.
      mondo.pronto(ws.gioco);
      return;
    }

    if (msg.t === 'esci' && ws.gioco) {
      const g = mondo.giocatori.get(ws.gioco);
      mondo.esce(ws.gioco);
      padroni.delete(ws.gioco);
      ws.gioco = null;
      if (g) console.log(`- ${g.nome} ha lasciato la partita`);
      return;
    }

    if (msg.t === 'ping') {
      manda(ws, { t: 'pong', c: msg.c, s: Date.now() });
    }
  });

  ws.on('close', () => {
    if (!ws.gioco) return;
    // Se nel frattempo il personaggio e' passato a un collegamento piu'
    // recente, questa chiusura riguarda un fantasma: non deve fare nulla.
    if (padroni.get(ws.gioco) !== ws) return;
    padroni.delete(ws.gioco);
    const g = mondo.giocatori.get(ws.gioco);
    mondo.esce(ws.gioco);
    if (g) console.log(`- ${g.nome} si e' scollegato (torna entro 30s e riprende)`);
  });
});

function manda(ws, oggetto) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(oggetto));
}

const passoMs = 1000 / TICK_HZ;
let ultimo = Date.now();
let accumulo = 0;
let oraSim = Date.now();

// Su Windows i timer hanno grana ~15,6 ms: un setInterval da 50 ms scatta in
// realta' ogni 62,5, e il server girerebbe a 16 passi al secondo invece di 20.
// Allora si sveglia piu' spesso del necessario e si accumula il tempo vero,
// eseguendo passi di durata fissa. Il ritmo medio torna esatto, e la
// simulazione diventa deterministica: stesso passo ovunque, sempre.
setInterval(() => {
  const ora = Date.now();
  accumulo += ora - ultimo;
  ultimo = ora;
  // Dopo una sospensione del PC il ritardo puo' essere enorme: non si recupera
  // mezz'ora di partita a passi da 50 ms, si riparte da adesso.
  if (accumulo > 500) accumulo = passoMs;

  while (accumulo >= passoMs) {
    accumulo -= passoMs;
    oraSim += passoMs;
    mondo.passo(passoMs / 1000);

    // L'orario e' quello della simulazione, non l'orologio: cosi' le
    // fotografie arrivano al client perfettamente equidistanti e
    // l'interpolazione non ha sussulti anche se il timer ha tremato.
    // Settore nuovo: prima la mappa, poi le fotografie. Nell'ordine
    // contrario il telefono disegnerebbe per un istante i personaggi nuovi
    // sulla pianta vecchia.
    if (mondo.mappaCambiata) {
      mondo.mappaCambiata = false;
      const annuncio = JSON.stringify({
        t: 'settore',
        numero: mondo.settore,
        mappa: mondo.mappa,
      });
      for (const ws of wss.clients) {
        if (ws.gioco && ws.readyState === ws.OPEN) ws.send(annuncio);
      }
    }

    // Quello che nel settore non si muove si manda solo quando cambia: le
    // posizioni degli obiettivi, le casse rimaste, chi c'e' in campo. Prima
    // ripartivano venti volte al secondo ed erano piu' di un quarto del
    // traffico, speso per ripetere cose gia' dette.
    if (mondo.piantaCambiata) {
      mondo.piantaCambiata = false;
      const pianta = JSON.stringify(mondo.pianta());
      for (const ws of wss.clients) {
        if (ws.gioco && ws.readyState === ws.OPEN) ws.send(pianta);
      }
    }

    const foto = JSON.stringify(mondo.istantanea(oraSim));
    for (const ws of wss.clients) {
      if (ws.gioco && ws.readyState === ws.OPEN) ws.send(foto);
    }
  }
}, 8);

function indirizziLocali() {
  const fuori = [];
  for (const schede of Object.values(os.networkInterfaces())) {
    for (const s of schede ?? []) {
      if (s.family === 'IPv4' && !s.internal) fuori.push(s.address);
    }
  }
  return fuori;
}

server.listen(PORTA, () => {
  console.log('\n  ECO NERA — server acceso\n');
  console.log(`  su questo PC:   http://localhost:${PORTA}`);
  for (const ip of indirizziLocali()) {
    console.log(`  dal telefono:   http://${ip}:${PORTA}`);
  }
  console.log(`\n  simulazione a ${TICK_HZ} passi al secondo. Ctrl+C per fermare.\n`);
});
