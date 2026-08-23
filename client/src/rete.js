// Il filo con il server: manda gli input, riceve le fotografie dello stato
// e le rimette in fila per il rendering.
//
// Il punto delicato e' qui dentro: il server parla 20 volte al secondo, lo
// schermo disegna 60. Se disegnassimo l'ultima fotografia ricevuta gli altri
// giocatori scatterebbero. Allora si disegna sempre 100 ms nel passato, dove
// le fotografie sono gia' arrivate tutte e due, e si interpola fra loro.

import {
  RITARDO_MINIMO,
  RITARDO_MASSIMO,
  MARGINE_RITARDO,
  COMANDI_PER_PACCHETTO,
  SOGLIA_PING_RAGGRUPPA,
  ATTESA_MASSIMA_COMANDI,
  TICK_HZ,
  VERSIONE,
  STATO,
  UMORE,
  NEMICI,
} from '../condiviso/regole.js';

/** Ogni quanto arriva una fotografia, se tutto va bene. */
const INTERVALLO_FOTOGRAFIE = 1000 / TICK_HZ;

function sessione() {
  let s = localStorage.getItem('ecoNera.sessione');
  if (!s) {
    s = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ecoNera.sessione', s);
  }
  return s;
}

/**
 * Dentro l'app non c'e' un indirizzo da cui dedurre dov'e' il server: la
 * pagina arriva dal telefono stesso. Nel browser invece la pagina la serve il
 * server, quindi si sa gia' tutto e non si chiede niente.
 */
function inApp() {
  if (window.Capacitor?.isNativePlatform?.()) return true;
  // Ripiego se Capacitor non si presenta: la pagina servita dal server ha
  // sempre una porta (5190), quella impacchettata nell'app no.
  return location.protocol === 'file:' || !location.port;
}

function indirizzo() {
  if (!inApp()) return `ws://${location.host}`;
  const salvato = localStorage.getItem('ecoNera.server');
  return salvato ? `ws://${salvato}` : null;
}

/** Accetta "192.168.2.46" o "192.168.2.46:5190" e normalizza. */
export function normalizzaIndirizzo(testo) {
  const pulito = String(testo || '')
    .trim()
    .replace(/^wss?:\/\//, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  if (!pulito) return null;
  return pulito.includes(':') ? pulito : `${pulito}:5190`;
}

export class Rete {
  constructor() {
    this.ws = null;
    this.io = null; // id del nostro personaggio
    this.mappa = null;
    // Si parte dal menu, sempre. Il collegamento e' un'altra cosa e ha uno
    // stato suo: fuori casa la presa verso il PC non fallisce — resta appesa
    // finche' non scade il tempo di rete, che su un telefono puo' voler dire
    // minuti — e chi aspettava di arrivare al menu non ci arrivava mai.
    this.stato = 'menu'; // menu | collego | dentro | caduto
    this.collegamento = 'spento'; // spento | collego | aperto | caduto
    this.fotografie = [];
    this.scarto = null; // differenza fra orologio del server e nostro
    this.ping = 0;
    this.ultimoInput = 0;
    this.tentativi = 0;
    this.contaFotografie = 0;
    this.riconnessioni = 0;
    this.rumoriSentiti = []; // rumori appena arrivati, con l'ora locale
    this.rumoriVisti = new Set();
    // La pianta del settore: dove stanno le cose che non si muovono, e chi e'
    // in campo. Arriva quando cambia, non venti volte al secondo.
    this.pianta = null;
    this.versioneMappa = 0; // cambia a ogni settore nuovo
    this.ultimaFotografiaOra = 0;
    this.classe = null;

    // Il cuscino di interpolazione, che si allunga se la rete lo chiede.
    this.ritardo = RITARDO_MINIMO;
    this.ritardiRecenti = []; // di quanto e' arrivata tardi ogni fotografia

    // I comandi in attesa di partire, quando si raggruppano.
    this.daMandare = [];
    this.primoInAttesa = 0;
  }

  /**
   * Entra in partita con la classe scelta. Torna falso se non c'e' proprio
   * nessuno con cui giocare: chi ha premuto deve poterlo sapere e restare nel
   * menu, invece di finire su una scritta che non cambia mai.
   */
  entra(classe, solo = false) {
    this.classe = classe;
    this.solo = solo;
    localStorage.setItem('ecoNera.classe', classe);

    const pronta = this.ws && this.ws.readyState === WebSocket.OPEN;
    const inCorso = this.ws && this.ws.readyState === WebSocket.CONNECTING;
    // Si accetta di aspettare solo il PRIMO tentativo — quello che in casa dura
    // meno di un secondo. Se un tentativo e' gia' andato a vuoto si sa gia'
    // come va a finire, e far aspettare di nuovo vorrebbe dire tenere fermo chi
    // voleva solo giocare nel telefono.
    if (!pronta && (!inCorso || this.tentativi > 0)) {
      this.classe = null; // non si resta appesi a una partita che non puo' partire
      return false;
    }

    this.stato = 'collego';
    // Se la presa si sta ancora aprendo ci pensa `onopen`: la classe e' segnata.
    if (pronta) {
      this.ws.send(JSON.stringify({ t: 'entra', sessione: sessione(), classe, solo }));
    }
    return true;
  }

  /**
   * Si smette di giocare e si torna al menu. Si avvisa il server invece di
   * sparire e basta: cosi' il personaggio non resta in piedi in mezzo alla
   * mappa per mezzo minuto, e il compagno non aspetta uno che non torna.
   */
  lascia() {
    this.svuotaComandi();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'esci' }));
    }
    this.stato = 'menu';
    this.classe = null;
    this.io = null;
    this.fotografie.length = 0;
  }

  /** Cambia server e riparte. Il telefono se lo ricorda per la volta dopo. */
  usaIndirizzo(testo) {
    const pulito = normalizzaIndirizzo(testo);
    if (!pulito) return false;
    localStorage.setItem('ecoNera.server', pulito);
    this.tentativi = 0;
    try {
      this.ws?.close();
    } catch {
      /* gia' chiuso */
    }
    this.avvia();
    return true;
  }

  /**
    * Spegne il collegamento per sempre. Non basta chiudere la presa: la
    * chiusura fa scattare il tentativo di riconnessione, e passando alla
    * partita senza server il telefono si sarebbe ricollegato da solo un
    * secondo dopo, riaprendo una partita in casa mentre se ne gioca una fuori.
    */
  spegni() {
    this.spento = true;
    clearInterval(this.battito);
    clearInterval(this.battitoLocale);
    try {
      this.ws?.close();
    } catch {
      /* gia' chiusa */
    }
  }

  avvia() {
    if (this.spento) return;
    const url = indirizzo();
    if (!url) {
      // Nessun indirizzo: si chiede, ma il menu resta li' sotto — dal pannello
      // si puo' anche rinunciare al server e giocare nel telefono.
      this.collegamento = 'spento';
      this.chiediIndirizzo?.();
      this.chiediClasse?.();
      return;
    }

    this.collegamento = 'collego';
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      if (this.io !== null) this.riconnessioni++;
      this.tentativi = 0;
      this.collegamento = 'aperto';
      // Non si entra piu' appena aperto il collegamento: prima si sceglie la
      // classe dal menu. Se pero' si era gia' dentro (e questa e' una
      // riconnessione), si rientra da soli con la stessa scelta di prima.
      if (this.classe) {
        this.entra(this.classe, this.solo);
      } else {
        // Il menu si mostra da qui e non dal giro di rendering: se la pagina
        // e' in secondo piano il rendering non gira, e resterebbe una
        // schermata nera senza spiegazioni.
        this.stato = 'menu';
        this.chiediClasse?.();
      }
      this.battito = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ t: 'ping', c: performance.now() }));
        }
      }, 1000);
    };

    ws.onmessage = (ev) => this.ricevi(JSON.parse(ev.data));

    ws.onclose = () => {
      clearInterval(this.battito);
      if (this.spento) return;
      this.collegamento = 'caduto';
      this.tentativi++;
      // In partita e' un buco di rete e si continua a riprovare in silenzio.
      // Nel menu invece non si tocca lo stato: si resta nel menu, dove la riga
      // del server dice com'e' andata e la spunta «senza server» e' li' a un
      // dito di distanza.
      if (this.stato === 'dentro' || this.stato === 'caduto') this.stato = 'caduto';
      // Riprova da sola: il telefono che si blocca in tasca non deve
      // costringere a ricaricare la pagina, e chi accende il PC a meta' serata
      // deve ritrovarselo collegato senza fare niente.
      setTimeout(() => this.avvia(), Math.min(500 * this.tentativi, 4000));
    };

    ws.onerror = () => ws.close();
  }

  ricevi(msg) {
    if (msg.t === 'benvenuto') {
      // Un server rimasto acceso da prima fa sparire in silenzio meta' del
      // gioco: meglio dirlo che lasciare credere che sia rotto.
      this.versioneServer = msg.versione ?? 'sconosciuta';
      this.disallineato = this.versioneServer !== VERSIONE;
      this.io = msg.id;
      this.mappa = msg.mappa;
      this.ruolo = msg.ruolo;
      this.stato = 'dentro';
      return;
    }

    if (msg.t === 'ciao') {
      this.versioneServer = msg.versione ?? 'sconosciuta';
      this.disallineato = this.versioneServer !== VERSIONE;
      this.alSaluto?.();
      return;
    }

    if (msg.t === 'settore') {
      // Mappa nuova: si buttano le fotografie vecchie, che parlano di un'altra
      // pianta, e chi disegna se ne accorgera' dalla versione.
      this.mappa = msg.mappa;
      this.settore = msg.numero;
      this.fotografie.length = 0;
      this.versioneMappa++;
      return;
    }

    if (msg.t === 'pianta') {
      this.pianta = msg;
      return;
    }

    if (msg.t === 'pong') {
      this.ping = Math.round(performance.now() - msg.c);
      return;
    }

    if (msg.t === 'stato') {
      const arrivo = performance.now();
      const scarto = msg.ms - arrivo;
      // Il pacchetto arrivato con meno ritardo e' quello che dice la verita'
      // sull'orologio del server; gli altri hanno preso traffico per strada.
      if (this.scarto === null || scarto > this.scarto) this.scarto = scarto;
      else this.scarto += (scarto - this.scarto) * 0.01;

      // Quanto e' arrivata in ritardo rispetto alla piu' puntuale che si sia
      // vista: zero per quella buona, tanto per quella che ha preso traffico
      // per strada. E' questa la misura che allunga il cuscino.
      this.ritardiRecenti.push(Math.max(0, this.scarto - scarto));
      while (this.ritardiRecenti.length > 60) this.ritardiRecenti.shift();
      this.regolaRitardo();

      this.contaFotografie++;
      this.ultimaFotografiaOra = arrivo;

      // I rumori sono eventi, non stato: si raccolgono man mano che arrivano
      // e restano qualche istante per essere disegnati mentre svaniscono.
      for (const s of msg.su ?? []) {
        if (this.rumoriVisti.has(s.i)) continue;
        this.rumoriVisti.add(s.i);
        this.rumoriSentiti.push({ ...s, nato: performance.now() });
      }
      while (this.rumoriSentiti.length > 40) this.rumoriSentiti.shift();
      if (this.rumoriVisti.size > 400) this.rumoriVisti.clear();

      this.fotografie.push(msg);
      const taglio = msg.ms - 2000;
      while (this.fotografie.length > 2 && this.fotografie[0].ms < taglio) {
        this.fotografie.shift();
      }
    }
  }

  /**
   * Quanto tenersi indietro per interpolare. Si guarda il PEGGIO degli ultimi
   * tre secondi e non la media: la media va benissimo finche' non arriva il
   * pacchetto tardivo, ed e' esattamente quello che si vede a schermo.
   *
   * Si allunga in fretta e si accorcia piano. Restare corti vuol dire vedere
   * il compagno congelarsi; restare lunghi vuol dire solo vederlo un filo piu'
   * indietro, che non se ne accorge nessuno. Fra i due sbagli si sceglie
   * sempre il secondo.
   */
  regolaRitardo() {
    if (!this.ritardiRecenti.length) return;
    let peggiore = 0;
    for (const r of this.ritardiRecenti) if (r > peggiore) peggiore = r;

    const voluto = Math.min(
      RITARDO_MASSIMO,
      Math.max(RITARDO_MINIMO, INTERVALLO_FOTOGRAFIE + peggiore + MARGINE_RITARDO),
    );
    // A passi, non di colpo: spostare il cuscino sposta l'istante che si sta
    // disegnando, e farlo in un fotogramma solo si vede come uno strappo su
    // tutto quello che non e' il proprio personaggio.
    const passo = voluto > this.ritardo ? 6 : 0.4;
    this.ritardo += Math.max(-passo, Math.min(passo, voluto - this.ritardo));
  }

  /**
   * Un comando per ogni sottopasso, numerato. Il numero e' la chiave di tutto:
   * il server rimanda indietro l'ultimo che ha eseguito, e il telefono sa
   * esattamente da dove rifare i conti.
   *
   * In casa parte subito, uno per uno, come si e' sempre fatto. Fuori si
   * raggruppa: aspettare venticinque millisecondi per mandarne tre insieme
   * costa meno di quanto costi alla radio del telefono chiedere il permesso di
   * trasmettere sessanta volte al secondo.
   */
  mandaPasso(seq, io) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const tondo = (v) => Math.round(v * 1000) / 1000;
    if (!this.daMandare.length) this.primoInAttesa = performance.now();
    this.daMandare.push({
      q: seq,
      mx: tondo(io.mx),
      my: tondo(io.my),
      ax: tondo(io.ax),
      ay: tondo(io.ay),
      f: io.spara ? 1 : 0,
      l: io.torcia ? 1 : 0,
      b: io.abilita ? 1 : 0,
    });

    const quanti = this.ping > SOGLIA_PING_RAGGRUPPA ? COMANDI_PER_PACCHETTO : 1;
    const pieno = this.daMandare.length >= quanti;
    const inAttesaDaTroppo = performance.now() - this.primoInAttesa >= ATTESA_MASSIMA_COMANDI;
    if (pieno || inAttesaDaTroppo) this.svuotaComandi();
  }

  /** Manda via i comandi in attesa, in un pacchetto solo e nell'ordine giusto. */
  svuotaComandi() {
    if (!this.daMandare.length) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.daMandare.length = 0;
      return;
    }
    // Un comando solo si manda con la forma di sempre: cosi' in casa non cambia
    // nemmeno un byte, e un server rimasto indietro di una versione continua a
    // capire — che e' il caso che capita davvero, quando si aggiorna il
    // telefono e ci si dimentica il PC.
    const pacchetto =
      this.daMandare.length === 1
        ? { t: 'input', ...this.daMandare[0] }
        : { t: 'input', c: this.daMandare };
    this.ws.send(JSON.stringify(pacchetto));
    this.daMandare = [];
  }

  /** Briefing letto: si puo' cominciare. */
  mandaPronto() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ t: 'pronto' }));
  }

  mandaDiario(dati) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ t: 'diario', ...dati }));
  }

  /**
   * Dove stanno tutti, 100 ms nel passato, con le posizioni interpolate — e
   * con nome, ruolo e stato rimessi al loro posto.
   *
   * La fotografia porta solo quello che si muove: il nome e il ruolo stanno
   * nella pianta, e i campi che valgono il solito (in piedi, non ferito, senza
   * bomba in mano) non viaggiano affatto. Qui si rimettono i valori di riposo,
   * una volta sola, cosi' chi disegna trova sempre un personaggio completo e
   * non deve sapere niente di tutto questo.
   */
  personaggi() {
    const identita = this.pianta?.g ?? [];
    return this.interpolati('g', true).map((p) => {
      const chi = identita.find((q) => q.i === p.i);
      return {
        n: chi?.n ?? '',
        r: chi?.r ?? 'faro',
        b: chi?.b ?? 0,
        st: STATO.VIVO,
        rn: 0,
        tc: 0,
        es: 0,
        ab: 0,
        bo: 0,
        ...p,
      };
    });
  }

  /** I nemici, interpolati allo stesso modo, con i valori di riposo rimessi. */
  nemici() {
    return this.interpolati('n', true).map((n) => ({
      v: NEMICI.pattugliatore.vita,
      u: UMORE.PATTUGLIA,
      m: 0,
      ...n,
    }));
  }

  /**
   * Vero quando da un po' non arriva piu' niente. Non e' la stessa cosa di
   * "collegamento chiuso": la presa resta aperta e i pacchetti spariscono per
   * un paio di secondi — succede col Wi-Fi che passa da un nodo all'altro.
   * Continuare a camminare in previsione mentre il server sta fermo produce
   * uno strattone indietro di centinaia di pixel appena la rete torna.
   */
  inStallo() {
    if (this.stato !== 'dentro' || !this.ultimaFotografiaOra) return false;
    return performance.now() - this.ultimaFotografiaOra > 400;
  }

  /**
   * Lo stato degli obiettivi, rimesso insieme: dove stanno le cose lo dice la
   * pianta, come stanno lo dice la fotografia. Chi disegna riceve la stessa
   * forma di sempre e non si accorge di niente.
   */
  obiettivi() {
    const d = this.fotografie.at(-1)?.ob;
    const s = this.pianta;
    if (!d || !s) return null;

    return {
      settore: s.settore,
      md: s.md,
      pr: d.pr ?? 0,
      al: d.al ?? 0,
      fine: d.fine ?? 0,
      fatto: d.fatto ?? 0,
      nuclei: (s.nuclei ?? []).map((k, i) => ({
        x: k.x,
        y: k.y,
        o: k.o,
        a: d.nu?.[i]?.[0] ?? 0,
        p: d.nu?.[i]?.[1] ?? 0,
      })),
      es: { x: s.es.x, y: s.es.y, a: d.ea ?? 0, p: d.ep ?? 0 },
      bo: d.bo
        ? {
            st: d.bo.st,
            x: d.bo.x,
            y: d.bo.y,
            t: d.bo.t,
            n: d.bo.n,
            p: d.bo.p ?? 0,
            da: d.bo.da ?? 0,
            c: d.bo.c ?? 0,
            sx: s.bo?.sx ?? 0,
            sy: s.bo?.sy ?? 0,
            q: s.bo?.q ?? 1,
          }
        : null,
      zo: d.zo && s.zo
        ? { x: s.zo.x, y: s.zo.y, r: s.zo.r, p: d.zo.p ?? 0, c: d.zo.c ?? 0 }
        : null,
    };
  }

  /** I kit a terra: fanno anche un po' di luce, cosi' si trovano al buio. */
  fuochi() {
    return this.fotografie.at(-1)?.fu ?? [];
  }

  /** Le casse di rifornimento ancora in piedi. Stanno ferme: le dice la pianta. */
  rifornimenti() {
    return this.pianta?.ri ?? [];
  }

  /** I sonar posati dall'Eco. */
  sonar() {
    return this.fotografie.at(-1)?.so ?? [];
  }

  /**
   * I ripari piantati dall'Assalto. Non si interpolano: stanno fermi dove
   * sono stati piantati, e il telefono li usa anche per prevedere il proprio
   * rallentamento mentre li scavalca.
   */
  ripari() {
    return this.fotografie.at(-1)?.rp ?? [];
  }

  /** I lampi degli scoppi. */
  scoppi() {
    return this.fotografie.at(-1)?.sp ?? [];
  }

  /** I colpi in volo. Corrono: senza interpolarli si vedrebbero a scatti. */
  colpi() {
    return this.interpolati('c', false);
  }

  /**
   * Il lavoro comune: si trovano le due fotografie a cavallo dell'istante da
   * disegnare e si mescolano. Chi compare solo nella piu' recente (un colpo
   * appena partito) si disegna dov'e', senza mescolare niente.
   */
  interpolati(chiave, conAngolo) {
    if (this.fotografie.length === 0 || this.scarto === null) return [];
    const T = performance.now() + this.scarto - this.ritardo;

    let prima = this.fotografie[0];
    let dopo = null;
    for (let k = 0; k < this.fotografie.length; k++) {
      if (this.fotografie[k].ms <= T) prima = this.fotografie[k];
      else {
        dopo = this.fotografie[k];
        break;
      }
    }

    const listaDopo = dopo?.[chiave] ?? [];
    const listaPrima = prima[chiave] ?? [];
    if (!dopo) return listaPrima.map((p) => ({ ...p }));

    const q = (T - prima.ms) / (dopo.ms - prima.ms || 1);
    return listaDopo.map((b) => {
      const a = listaPrima.find((p) => p.i === b.i);
      if (!a) return { ...b };
      const fuso = {
        ...b,
        x: a.x + (b.x - a.x) * q,
        y: a.y + (b.y - a.y) * q,
      };
      if (conAngolo) fuso.a = a.a + differenzaAngolo(b.a, a.a) * q;
      return fuso;
    });
  }

  /** L'ultima posizione che il server ci attribuisce. */
  ultimaNostra() {
    return this.ultimaNostraConTick()?.p ?? null;
  }

  /** Come sopra, ma con il numero di tick: serve per rifare i conti una volta sola. */
  ultimaNostraConTick() {
    for (let k = this.fotografie.length - 1; k >= 0; k--) {
      const p = this.fotografie[k].g.find((g) => g.i === this.io);
      if (p) return { p, tick: this.fotografie[k].tick };
    }
    return null;
  }
}

function differenzaAngolo(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
