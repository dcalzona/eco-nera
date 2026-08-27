// La simulazione autoritativa. Gira solo qui, sul PC: i telefoni mandano
// input e ricevono fotografie dello stato. Tutta la logica di gioco si
// scrive e si controlla da questo lato, con i messaggi nel terminale,
// invece che dentro una WebView su un telefono.

import { centroCasella, pavimenti, muro } from '../condiviso/mappa.js';
import { generaMappa, generaArena, centroStanza } from '../condiviso/generatore.js';
import {
  muovi,
  limita,
  angolo,
  scorri,
  velocitaFraIRipari,
  fermatoDalleporte,
} from '../condiviso/fisica.js';
import {
  TILE,
  SOTTOPASSO,
  SOTTOPASSI_PER_TICK,
  VITA_MASSIMA,
  ARMATURA_MASSIMA,
  ARMATURA_INIZIALE,
  RIFORNIMENTI,
  casseDelSettore,
  RIPARO,
  BOMBA,
  DOMINIO,
  modalitaDelSettore,
  ARMI,
  NEMICI,
  STATO,
  UMORE,
  CRITICO_SECONDI,
  RIANIMA_SECONDI,
  RIANIMA_DISTANZA,
  VITA_DOPO_RIANIMA,
  RIENTRO_SECONDI,
  VELOCITA,
  VELOCITA_CRITICO,
  DURATA_TORCIA,
  RICARICA_TORCIA,
  RIPRESA_TORCIA,
  SCONTO_AL_BUIO,
  ABILITA,
  PASSO_RUMOROSO,
  SPEDIZIONE,
  ALLARME,
  ASSISTENZA,
  SCONTO_DA_SOLI,
  CLASSI,
  CLASSE_PREDEFINITA,
  IMPULSO_SONAR,
  munizioniDi,
  RIPARI_PER_SETTORE,
  STAZIONE,
  stazioniDelSettore,
  SETTORI_PER_FINIRE,
  regoleDifficolta,
  DIFFICOLTA,
  CONVOGLIO,
  BOSS,
  ARENA,
  regoleSurvival,
  SURVIVAL,
} from '../condiviso/regole.js';
import { creaNemici, passoNemici, chiVede } from './nemici.js';
import { creaColpo, passoProiettili } from './proiettili.js';
import { campo, passoVerso, lineaLibera } from './navigazione.js';
import { Rumori } from './suoni.js';

/** Quanto sopravvive un personaggio dopo che il telefono si scollega. */
const GRAZIA_MS = 30_000;

/** Mezzo lato del bersaglio di un personaggio, per i colpi. */
const CORPO = 11;

export class Mondo {
  /**
   * La difficolta' si passa alla nascita e non si cambia in corsa: cambiarla
   * a meta' campagna vorrebbe dire un settore facile e il successivo incubo
   * senza che sia successo niente, e i quindici settori non sarebbero piu' una
   * cosa sola.
   */
  constructor(difficolta = 'facile') {
    // 'survival' non e' una delle quattro difficolta' e va accettata lo stesso:
    // e' l'altra scala, quella che sale da sola. Senza questa riga il
    // costruttore la riportava zitto a 'facile' e la modalita' non esisteva —
    // sembrava funzionare, ed era solo il gioco normale con un altro nome.
    const ammesse = [...DIFFICOLTA, 'survival'];
    this.difficolta = ammesse.includes(difficolta) ? difficolta : 'facile';
    this.vittoria = false;
    this.giocatori = new Map(); // id -> personaggio
    this.prossimoId = 1;
    this.tick = 0;
    this.fantoccio = null;
    this.campoGiocatori = null;
    this.attesaRinforzi = 0;
    this.settore = 0;
    this.mappaCambiata = false;
    // Suona quando cambia qualcosa nella pianta — le posizioni degli
    // obiettivi, le casse rimaste, chi c'e' in campo. Chi spedisce se ne
    // accorge e rimanda la pianta, che se no resterebbe quella di prima.
    this.piantaCambiata = true;
    this.tuttiGiu = 0;
    this.disfatta = false;
    this.pronti = new Set();
    this.prossimoRiparo = 1;
    this.nuovoSettore(1);
  }

  /**
   * Un settore nuovo: mappa nuova, nuclei sparsi nelle stanze lontane,
   * estrazione al punto di ingresso. Si entra, si accende quello che c'e' da
   * accendere e si torna indietro — e tornare indietro non e' una formalita',
   * perche' nel frattempo la mappa si e' svegliata.
   */
  nuovoSettore(numero, modalita = null) {
    this.settore = numero;
    // La modalita' si puo' imporre — serve alle prove, che devono poter
    // guardare una missione per volta senza aspettare il suo turno.
    this.modalita = modalita ?? modalitaDelSettore(numero);
    this.mappa =
      this.modalita === 'boss'
        ? generaArena(Date.now() + numero * 7717, numero)
        : generaMappa(Date.now() + numero * 7717, numero);
    this.caselleLibere = pavimenti(this.mappa);
    this.rumori = new Rumori(this.mappa);
    this.proiettili = [];
    this.kit = [];
    this.sonar = [];
    this.ripari = [];
    this.scoppi = [];
    this.tuttiGiu = 0;
    this.missioneFatta = false;

    // Il briefing: per questi secondi il settore resta addormentato e si
    // legge cosa c'e' da fare. Si puo' chiudere prima, e in due si parte
    // quando hanno detto "pronto" tutti e due.
    this.preparazione = SPEDIZIONE.preparazione;
    this.pronti = new Set();

    // Le stanze in ordine di lontananza dall'ingresso: le missioni ci
    // pescano dentro, ognuna a modo suo, ma tutte vogliono la stessa cosa —
    // che l'obiettivo non sia dietro l'angolo.
    const ingresso = this.mappa.stanze[0];
    const lontane = this.mappa.stanze
      .slice(1)
      .map((s) => ({ s, d: Math.hypot(s.x - ingresso.x, s.y - ingresso.y) }))
      .sort((a, b) => b.d - a.d)
      .map(({ s }) => s);

    this.nuclei = [];
    this.bomba = null;
    this.zona = null;
    this.convoglio = null;
    this.boss = null;
    this.porteAperte = false;
    if (this.modalita === 'bomba') this.preparaBomba(numero, lontane);
    else if (this.modalita === 'dominio') this.preparaDominio(numero, lontane);
    else if (this.modalita === 'convoglio') this.preparaConvoglio(numero, lontane, ingresso);
    else if (this.modalita === 'boss') this.preparaBoss(numero);
    else this.preparaSabotaggio(numero, lontane);

    // Le casse vanno nelle stanze di mezzo: non all'ingresso, dove non
    // servono, e non tutte addosso agli obiettivi, o basterebbe il giro della
    // missione per raccoglierle tutte. Quante siano dipende dal settore: piu'
    // si scende, meno se ne trovano.
    const perLeCasse = this.mappa.stanze.slice(1);
    this.rifornimenti = [];
    for (let k = 0; k < Math.min(casseDelSettore(numero), perLeCasse.length); k++) {
      const stanza = perLeCasse[(k * 2 + 1) % perLeCasse.length];
      // Non addosso a una cassa gia' messa: con poche stanze capitava che due
      // finissero sulla stessa casella, e allora la seconda non la prendeva
      // nessuno — passandoci sopra si raccoglievano tutte e due insieme e una
      // delle due era regalata al nulla. Si prova qualche posto e ci si
      // accontenta solo alla fine.
      // Si prova qualche posto e si tiene il piu' lontano da quelle gia' messe.
      // Non si rinuncia mai a una cassa: meglio due un po' vicine che una in
      // meno, e con poche stanze capitava di perderla per strada.
      let scelta = null;
      let migliorDistanza = -1;
      for (let tentativo = 0; tentativo < 12; tentativo++) {
        const tx = stanza.x + 1 + ((k * 3 + tentativo) % Math.max(1, stanza.w - 2));
        const ty = stanza.y + 1 + ((k * 2 + tentativo) % Math.max(1, stanza.h - 2));
        const p = centroCasella(this.mappa, tx, ty);
        const distanza = this.rifornimenti.length
          ? Math.min(...this.rifornimenti.map((r) => Math.hypot(r.x - p.x, r.y - p.y)))
          : Infinity;
        if (distanza > migliorDistanza) {
          migliorDistanza = distanza;
          scelta = p;
        }
        if (distanza > 3 * TILE) break; // abbastanza lontana: va bene cosi'
      }
      if (scelta) this.rifornimenti.push({ ...scelta, usatoDa: [] });
    }

    // Le stazioni di ricarica: colpi, kit, sonar e ripari. Ce ne sono meno man
    // mano che la campagna scende — tre nei primi cinque settori, due nei
    // cinque di mezzo, una negli ultimi — cosi' la stessa mappa pesa
    // diversamente a seconda di quando ci si arriva.
    //
    // Vanno LONTANE fra loro, e non e' estetica: due stazioni vicine sono una
    // stazione sola con due disegni, e il giro per raggiungerle — che e' il
    // costo vero del rifornirsi — sparirebbe.
    // Nell'arena la cassa e' una sola e l'ha gia' messa `preparaBoss`, in fondo
    // al corridoio: il giro delle stazioni sparse non c'entra niente con una
    // mappa che e' un corridoio e una stanza.
    if (this.modalita === 'boss') return this.finisciSettore(numero, ingresso);

    // Le casse di munizioni stanno APPOGGIATE AL MURO, come i server del
    // sabotaggio, e occupano una casella sola. In mezzo alla stanza erano un
    // oggetto che galleggiava; contro una parete sembrano una cosa installata
    // li', e obbligano a rasentare i muri per prenderle — che al buio e' tutta
    // un'altra sensazione rispetto a stare in mezzo al pavimento.
    this.stazioni = [];
    const quanteStazioni = Math.min(
      stazioniDelSettore(numero, this.difficolta),
      this.mappa.stanze.length,
    );
    for (let k = 0; k < quanteStazioni; k++) {
      let scelta = null;
      let migliorDistanza = -1;
      for (const stanza of this.mappa.stanze) {
        // Si prova qualche appiglio diverso prima di rinunciare: con una sola
        // prova capitava che un quarto delle casse finisse in mezzo alla
        // stanza, che e' proprio quello che non si voleva.
        let posto = null;
        for (let prova = 0; prova < 6 && !posto; prova++) {
          posto = this.postoAlMuro(stanza, k * 6 + prova);
        }
        if (!posto) posto = centroStanza(stanza);
        const distanza = this.stazioni.length
          ? Math.min(...this.stazioni.map((z) => Math.hypot(z.x - posto.x, z.y - posto.y)))
          : Math.hypot(posto.x - centroStanza(ingresso).x, posto.y - centroStanza(ingresso).y);
        if (distanza > migliorDistanza) {
          migliorDistanza = distanza;
          scelta = posto;
        }
      }
      if (scelta) this.stazioni.push({ x: scelta.x, y: scelta.y, ang: scelta.ang ?? 0, quanto: new Map() });
    }

    // I ripari dell'Assalto si contano a settore, e il conto riparte qui.
    for (const g of this.giocatori.values()) g.ripari = RIPARI_PER_SETTORE;

    return this.finisciSettore(numero, ingresso);
  }

  /**
   * La coda comune di ogni settore: uscita, allarme, nemici.
   *
   * E' un metodo a parte perche' l'arena ci arriva per una strada diversa —
   * salta le stazioni sparse e le casse, che in un corridoio non hanno senso —
   * ma tutto il resto deve restare identico. Due code copiate sarebbero due
   * code da tenere d'accordo per sempre.
   */
  finisciSettore(numero, ingresso) {
    // Nell'arena si esce IN AVANTI, oltre le porte: e' l'unico settore in cui
    // non si torna da dove si e' entrati, ed e' quello che rende la stanza del
    // boss una fine invece di un'andata e ritorno.
    const uscita = this.mappa.arena ? this.mappa.stanze[2] : ingresso;
    this.estrazione = { ...centroStanza(uscita), aperta: false, progresso: 0 };
    this.allarme = false;
    this.prossimoRichiamo = 0;
    this.prossimaChiamata = 0;

    this.nemiciBase = Math.min(SPEDIZIONE.nemiciMax, SPEDIZIONE.nemiciBase + numero);
    if (this.mappa.arena) {
      // Nel corridoio, non sparsi per la mappa: nell'arena ci pensa il boss a
      // chiamarne altri, e metterceli subito vorrebbe dire arrivarci gia'
      // circondati.
      const co = this.mappa.arena.corridoio;
      this.nemici = [];
      const quanti = this.mappa.arena.quantiNemici ?? ARENA.nemiciNelCorridoio;
      for (let k = 0; k < quanti; k++) {
        const quello = creaNemici(this.mappa, 1)[0];
        if (!quello) continue;
        const tx = co.x + 3 + Math.floor(((k + 1) / (quanti + 1)) * (co.w - 5));
        const ty = co.y + 1 + ((k * 3) % Math.max(1, co.h - 2));
        const p = centroCasella(this.mappa, tx, ty);
        quello.x = p.x;
        quello.y = p.y;
        this.nemici.push(quello);
      }
    } else {
      this.nemici = creaNemici(this.mappa, this.tettoNemici());
    }

    for (const g of this.giocatori.values()) this.riportaAllIngresso(g);
    this.mappaCambiata = true;
    this.piantaCambiata = true;
    console.log(`
=== Settore ${numero} — ${this.modalita} — ${this.nemici.length} nemici ===`);
  }

  /**
   * Sabotaggio: i server da spegnere. Stanno appoggiati alle pareti e non in
   * mezzo alla stanza — sembrano una cosa installata li' invece di un
   * lampadario, e obbligano a rasentare i muri, che al buio e' tutta un'altra
   * sensazione rispetto a stare in mezzo al pavimento.
   */
  preparaSabotaggio(numero, lontane) {
    const quanti = Math.min(SPEDIZIONE.nucleiMax, SPEDIZIONE.nucleiBase + Math.floor(numero / 2));
    this.nuclei = lontane.slice(0, quanti).map((stanza, k) => {
      const posto = this.postoAlMuro(stanza, k) ?? { ...centroStanza(stanza), ang: 0 };
      return { x: posto.x, y: posto.y, ang: posto.ang, attivo: false, progresso: 0 };
    });
  }

  /**
   * Una casella del bordo interno della stanza che ha un muro accanto, con
   * l'angolo verso cui guarda quello che ci si appoggia (cioe' verso il
   * centro della stanza, di spalle alla parete).
   */
  postoAlMuro(stanza, quale = 0) {
    const bordo = [];
    for (let ty = stanza.y; ty < stanza.y + stanza.h; ty++) {
      for (let tx = stanza.x; tx < stanza.x + stanza.w; tx++) {
        const suRiga = ty === stanza.y || ty === stanza.y + stanza.h - 1;
        const suColonna = tx === stanza.x || tx === stanza.x + stanza.w - 1;
        if (!suRiga && !suColonna) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (!muro(this.mappa, tx + dx, ty + dy)) continue;
          bordo.push({ tx, ty, dx, dy });
          break;
        }
      }
    }
    if (!bordo.length) return null;
    // Sempre la stessa scelta per lo stesso indice: due server nella stessa
    // stanza non devono finire l'uno sull'altro.
    const scelto = bordo[(quale * 5 + 2) % bordo.length];
    const p = centroCasella(this.mappa, scelto.tx, scelto.ty);
    return {
      // Accostato alla parete, non al centro della casella: si appoggia.
      x: p.x + scelto.dx * 9,
      y: p.y + scelto.dy * 9,
      ang: Math.atan2(-scelto.dy, -scelto.dx),
    };
  }

  /**
   * Bomba: si ritira in una stanza di mezzo e si porta in fondo. Il punto di
   * ritiro non e' all'ingresso di proposito — il viaggio comincia quando ce
   * l'hai gia' in mano, cioe' quando non puoi piu' sparare.
   */
  preparaBomba(numero, lontane) {
    const quante = numero >= 3 ? 2 : 1;
    this.bomba = {
      quante,
      fatte: 0,
      stato: 'aTerra',
      portata: null,
      tempo: 0,
      posa: 0,
      x: 0,
      y: 0,
      origine: { x: 0, y: 0 },
      sito: { x: 0, y: 0 },
      lontane,
    };
    this.preparaLaProssimaBomba();
  }

  preparaLaProssimaBomba() {
    const b = this.bomba;
    const lontane = b.lontane;
    // Il sito e' fra le piu' lontane, il ritiro fra quelle di mezzo.
    const sito = centroStanza(lontane[Math.min(b.fatte, lontane.length - 1)]);
    const ritiro = centroStanza(
      lontane[Math.min(Math.floor(lontane.length / 2) + b.fatte, lontane.length - 1)],
    );
    b.sito = sito;
    b.origine = ritiro;
    b.x = ritiro.x;
    b.y = ritiro.y;
    b.stato = 'aTerra';
    b.portata = null;
    b.tempo = 0;
    b.posa = 0;
    this.piantaCambiata = true; // il punto dove va piazzata e' un altro
  }

  /** Dominio: una zona sola, in fondo, da tenere mentre arrivano. */
  preparaDominio(numero, lontane) {
    this.zona = {
      ...centroStanza(lontane[0]),
      raggio: DOMINIO.raggio,
      progresso: 0,
      durata: DOMINIO.durata + (numero - 1) * DOMINIO.perSettore,
      contesa: false,
    };
  }

  /**
   * Scorta il convoglio.
   *
   * Il binario si traccia UNA VOLTA, seguendo lo stesso campo di navigazione
   * che usano i nemici: cosi' passa per i corridoi come ci passerebbe uno a
   * piedi, invece di puntare dritto attraverso i muri. Poi il convoglio non e'
   * altro che un punto lungo quella spezzata, e "torna indietro" diventa una
   * sottrazione invece di un'inseguimento al contrario — che con un campo di
   * flusso sarebbe stato molto piu' difficile e molto meno prevedibile.
   */
  preparaConvoglio(numero, lontane, ingresso) {
    const meta = centroStanza(ingresso);
    const partenza = centroStanza(lontane[0]);
    const binario = this.tracciaBinario(partenza, meta);

    this.convoglio = {
      binario,
      quanto: 0, // 0 = partenza, 1 = arrivato
      lunghezza: lunghezzaDelBinario(binario),
      x: binario[0].x,
      y: binario[0].y,
      // Il tempo cresce col binario: mappe piu' grandi non devono diventare
      // impossibili solo perche' sono piu' lunghe da attraversare.
      tempo: CONVOGLIO.tempo * (1 + (numero - 1) * 0.04),
      scortato: false,
      vita: CONVOGLIO.vita,
    };
  }

  /**
   * I punti del percorso, dal via all'arrivo, seguendo i corridoi.
   *
   * Si cammina sul campo CASELLA PER CASELLA, scendendo verso la distanza
   * minore. Il primo tentativo usava `passoVerso`, che pero' torna una
   * DIREZIONE e non una posizione: trattandola da punto veniva fuori un
   * binario di tre punti in linea retta, che attraversava i muri. Sembrava
   * funzionare — il convoglio si muoveva e il tempo scorreva — e sarebbe
   * saltato fuori solo guardandolo passare dentro una parete.
   *
   * Solo passi dritti, niente diagonali: un convoglio sta in mezzo al
   * corridoio, e una diagonale puo' tagliare l'angolo di un muro.
   */
  tracciaBinario(da, a) {
    const c = campo(this.mappa, [a]);
    let tx = Math.floor(da.x / TILE);
    let ty = Math.floor(da.y / TILE);
    const punti = [centroCasella(this.mappa, tx, ty)];

    // Un tetto ai passi: senza, una meta irraggiungibile girerebbe per sempre.
    for (let k = 0; k < 4000; k++) {
      const qui = c.distanze[ty * c.larghezza + tx];
      if (!(qui > 0)) break; // arrivati, oppure fuori dal campo
      let mx = tx;
      let my = ty;
      let meglio = qui;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= c.larghezza || ny >= c.altezza) continue;
        if (muro(this.mappa, nx, ny)) continue;
        const d = c.distanze[ny * c.larghezza + nx];
        if (d < meglio) {
          meglio = d;
          mx = nx;
          my = ny;
        }
      }
      if (mx === tx && my === ty) break; // non si scende piu': si e' arrivati
      tx = mx;
      ty = my;
      punti.push(centroCasella(this.mappa, tx, ty));
    }
    return punti;
  }

  /**
   * La stanza del boss.
   *
   * Il corridoio non e' un passaggio, e' una salita: nemici sparsi, alcuni
   * dietro un riparo come quello dell'Assalto, e in fondo una cassa di
   * munizioni. Chi arriva all'arena ci arriva consumato ma pieno, che e'
   * esattamente lo stato in cui una stanza del boss vuole trovarti.
   */
  preparaBoss(numero) {
    const a = this.mappa.arena;
    const c = this.mappa.arena.centro;
    const posto = centroCasella(this.mappa, c.tx, c.ty);

    this.boss = {
      id: -1,
      x: posto.x,
      y: posto.y,
      ang: Math.PI,
      vita: BOSS.vitaBase + (numero - 1) * BOSS.vitaPerSettore,
      vitaPiena: BOSS.vitaBase + (numero - 1) * BOSS.vitaPerSettore,
      ricarica: 0,
      prossimoScagnozzo: BOSS.scagnozzi,
    };
    this.porteAperte = false;

    // I ripari del corridoio: gli stessi dell'Assalto, ma sono loro ad averli.
    // Non e' un dettaglio di scenografia — obbligano ad aggirare invece di
    // avanzare dritto, che e' l'unica cosa che rende largo un corridoio largo.
    const co = a.corridoio;
    for (let k = 0; k < (a.quantiRipari ?? ARENA.ripariNelCorridoio); k++) {
      const tx = co.x + Math.floor(((k + 1) / ((a.quantiRipari ?? ARENA.ripariNelCorridoio) + 1)) * co.w);
      const ty = co.y + (k % 2 === 0 ? 2 : co.h - 3);
      const p = centroCasella(this.mappa, tx, ty);
      this.ripari.push({
        id: this.prossimoRiparo++,
        x: p.x,
        y: p.y,
        ang: Math.PI / 2,
        vita: RIPARO.vita,
        resta: Infinity, // sono dello scenario: non si consumano da soli
        padrone: -1, // di nessuno: fermano i colpi dei nemici come i vostri
      });
    }

    // La cassa in fondo al corridoio, prima di entrare.
    const fine = centroCasella(this.mappa, co.x + co.w - 2, co.y + Math.floor(co.h / 2));
    this.stazioni = [{ x: fine.x, y: fine.y, ang: 0, quanto: new Map() }];
  }

  riportaAllIngresso(g) {
    const posto = this.mappa.partenze[(g.id - 1) % this.mappa.partenze.length];
    const p = centroCasella(this.mappa, posto.tx, posto.ty);
    g.x = p.x;
    g.y = p.y;
    g.vita = VITA_MASSIMA;
    g.armatura = ARMATURA_INIZIALE;
    g.stato = STATO.VIVO;
    g.rianima = 0;
    g.criticoRimasto = 0;
    g.rientroRimasto = 0;
    g.carica = 1;
    g.esaurita = false;
    g.meta = null;
    // Il fantoccio non ha una coda di comandi: non li manda, li decide.
    if (g.coda) g.coda.length = 0;
  }

  entra(sessione, nome, classe, solo = false) {
    // Chi rientra dopo una spedizione perduta la fa ricominciare da capo.
    if (this.disfatta || this.vittoria) {
      this.disfatta = false;
      this.vittoria = false;
      this.tuttiGiu = 0;
      this.nuovoSettore(1);
    }
    // Stessa sessione = stesso personaggio: un ricaricamento della pagina o
    // lo schermo che si spegne non fanno ricominciare da capo.
    for (const g of this.giocatori.values()) {
      if (g.sessione === sessione) {
        g.online = true;
        g.scollegatoDa = null;
        g.soloVoluto = solo;
        this.piantaCambiata = true; // torna in campo, e il nome va ridetto

        // Rientrando si puo' cambiare classe. Prima no: il personaggio si
        // ritrovava dalla sessione e la classe chiesta veniva ignorata, quindi
        // sceglierne un'altra nel menu non cambiava niente — nemmeno alla
        // partita dopo.
        const voluta = CLASSI[classe] ? classe : null;
        if (voluta && voluta !== g.ruolo) {
          const nomeAutomatico = Object.values(CLASSI).some((c) => c.nome === g.nome);
          g.ruolo = voluta;
          if (nomeAutomatico) g.nome = CLASSI[voluta].nome;
          g.ricarica = 0;
          g.abilitaRicarica = 0;
          // Arma nuova, colpi nuovi: quelli di prima non ci entrano. I
          // caricatori di scorta pero' restano quelli che si erano, sennò
          // cambiare classe sarebbe un rifornimento gratis.
          g.ricaricaArma = 0;
          g.colpi = munizioniDi(voluta).caricatore;
          console.log(`${g.nome} cambia classe: ora e' ${CLASSI[voluta].nome}.`);
        }
        return g;
      }
    }

    const id = this.prossimoId++;
    // La classe la sceglie chi gioca, dal menu. Due che scelgono uguale sono
    // liberi di farlo: e' una scelta loro, e scoprire che due Eco non aprono
    // le porte da soli fa parte dell'imparare a giocarci.
    const ruolo = CLASSI[classe] ? classe : CLASSE_PREDEFINITA;
    const posto = this.mappa.partenze[(id - 1) % this.mappa.partenze.length];
    const p = centroCasella(this.mappa, posto.tx, posto.ty);

    const g = {
      id,
      sessione,
      nome: nome || CLASSI[ruolo].nome,
      ruolo,
      bot: false,
      online: true,
      scollegatoDa: null,
      x: p.x,
      y: p.y,
      ang: -Math.PI / 2,
      // I comandi arrivano in fila e si consumano uno per sottopasso, nello
      // stesso ordine in cui il telefono li ha eseguiti prevedendo: e' questo
      // che rende i due percorsi identici.
      coda: [],
      ultimoSeq: 0,
      soloVoluto: solo,
      ...statoIniziale(ruolo),
    };
    this.giocatori.set(id, g);
    this.piantaCambiata = true;
    return g;
  }

  esce(id) {
    const g = this.giocatori.get(id);
    if (!g) return;
    this.piantaCambiata = true;
    g.online = false;
    g.scollegatoDa = Date.now();
    g.coda.length = 0;
  }

  input(id, msg) {
    const g = this.giocatori.get(id);
    if (!g) return;
    const m = limita(Number(msg.mx) || 0, Number(msg.my) || 0);
    const a = limita(Number(msg.ax) || 0, Number(msg.ay) || 0);
    g.coda.push({
      seq: Number(msg.q) || 0,
      mx: m.x,
      my: m.y,
      ax: a.x,
      ay: a.y,
      f: msg.f ? 1 : 0,
      l: msg.l ? 1 : 0, // torcia accesa
      b: msg.b ? 1 : 0, // abilita' del ruolo
      rk: msg.rk ? 1 : 0, // ricarica a mano
    });
    // Se il telefono e' molto avanti (e' successo qualcosa alla rete) non si
    // accumula all'infinito: si buttano i comandi piu' vecchi.
    while (g.coda.length > 60) g.coda.shift();
  }

  passo(dt) {
    this.tick++;
    const ora = Date.now();
    this.rumori.giroNuovo();

    // Il briefing: si legge cosa c'e' da fare mentre il settore dorme. Ci si
    // puo' muovere e guardarsi intorno — non si toglie il controllo a chi
    // gioca — ma nessuno si sveglia e nessuno spara.
    //
    // Il conto scende solo se c'e' qualcuno collegato. Senza questa riga il
    // briefing scorreva a vuoto: si accende il server sul PC, si prende il
    // telefono, ci si siede — e quando finalmente si entra la presentazione
    // della missione era gia' finita da un pezzo, senza che nessuno l'avesse
    // letta. Il settore aspetta chi lo deve giocare.
    const dorme = this.preparazione > 0;
    const umani = [...this.giocatori.values()].filter((g) => !g.bot && g.online).length;
    if (dorme && umani > 0) this.preparazione = Math.max(0, this.preparazione - dt);

    for (const g of this.giocatori.values()) {
      if (g.bot) {
        this.guidaFantoccio(g, dt);
      } else {
        if (!g.online && ora - g.scollegatoDa > GRAZIA_MS) {
          this.giocatori.delete(g.id);
          continue;
        }
        this.consumaComandi(g);
        this.sbloccaSeIncastrato(g);
      }
    }

    this.curaFeriti(dt);
    this.curaConIKit(dt);
    this.raccogliRifornimenti();
    this.battonoISonar(dt);
    this.consumaRipari(dt);
    this.consumaTorce(dt);
    this.sbiadisciScoppi(dt);

    // Un solo campo di distanze per tutti i nemici: chi insegue scende lungo
    // la discesa piu' ripida e finisce naturalmente sul giocatore piu' vicino.
    const inPiedi = this.inPiedi();
    this.campoGiocatori = inPiedi.length ? campo(this.mappa, inPiedi) : null;

    if (!dorme) {
      passoNemici(this.mappa, this.nemici, inPiedi, this.campoGiocatori, dt, (n, ang, regola) => {
        this.proiettili.push(
          creaColpo(n.id, n.x, n.y, ang, regola.danno, regola.gittata, regola.velocitaColpo, true),
        );
        // Anche i loro spari si sentono, e chiamano i compagni.
        this.rumori.emetti('sparoNemico', n.x, n.y, -n.id);
      }, this.allarme, this.ripari);
    }

    passoProiettili(
      this.mappa,
      this.proiettili,
      dt,
      (c) => this.chiHoColpito(c),
      (c) => this.fermatoDaUnRiparo(c),
    );

    if (!dorme) this.ascoltano();
    if (!dorme) this.usaLeStazioni(dt);
    this.scorriRicariche(dt);
    this.sbiadisciMarchi(dt);
    this.obiettivi(dt);
    this.controllaDisfatta(dt);
    if (!dorme) this.ripopola(dt);
    this.regolaFantoccio();
  }

  /**
   * "Sono pronto": chiude il briefing. Si parte quando l'hanno detto tutti
   * quelli che stanno giocando — se bastasse uno, l'altro si ritroverebbe in
   * missione a meta' della lettura.
   */
  pronto(id) {
    this.pronti.add(id);
    const umani = [...this.giocatori.values()].filter((g) => !g.bot && g.online);
    if (umani.length && umani.every((g) => this.pronti.has(g.id))) this.preparazione = 0;
  }

  /**
   * La torcia si consuma accesa e si ricarica spenta. E' quello che trasforma
   * "illuminare" da interruttore sempre acceso a risorsa da spendere: al buio
   * si vede pochissimo, ma i nemici ti vedono meno della meta'.
   */
  consumaTorce(dt) {
    for (const g of this.giocatori.values()) {
      if (g.torcia) {
        g.carica = Math.max(0, g.carica - dt / DURATA_TORCIA);
        if (g.carica <= 0) {
          g.torcia = false;
          g.esaurita = true;
        }
      } else {
        g.carica = Math.min(1, g.carica + dt / RICARICA_TORCIA);
        if (g.esaurita && g.carica >= RIPRESA_TORCIA) g.esaurita = false;
      }
    }
  }

  /**
   * L'abilita' del ruolo. L'Eco marca i nemici che sta vedendo, e per qualche
   * secondo li vedete tutti e due anche attraverso i muri: e' il "vede prima e
   * indica" scritto in codice. Il Faro pianta un fuoco che illumina una stanza
   * per entrambi e continua a illuminarla mentre lui va avanti.
   */
  usaAbilita(g) {
    const regola = ABILITA[g.ruolo];
    if (!regola || g.abilitaRicarica > 0) return;

    if (regola.tipo === 'kit') {
      // Un kit lasciato per terra, non una cura addosso a se stessi: resta li'
      // e serve a tutti e due. Il medico che si cura da solo non e' un medico.
      this.kit.push({ x: g.x, y: g.y, resta: regola.durata, usatoDa: [] });
      this.rumori.emetti('faro', g.x, g.y, g.id);
      console.log(`${g.nome} ha lasciato un kit medico.`);
    } else if (regola.tipo === 'sonar') {
      // Il sonar sta a terra e continua a battere: chi lo posa puo' andarsene
      // e sapere lo stesso cosa si muove in quella stanza.
      this.sonar.push({ x: g.x, y: g.y, resta: regola.durata, raggio: regola.raggio, battito: 0 });
      console.log(`${g.nome} ha posato un sonar.`);
    } else if (regola.tipo === 'riparo') {
      // Finiti i ripari del settore non se ne piantano altri: si va a
      // ricaricare a una stazione. Prima bastava aspettare la ricarica e
      // ripiantarlo all'infinito, e ogni stanza diventava una posizione da
      // tenere — comodo, e proprio per questo noioso.
      if ((g.ripari ?? RIPARI_PER_SETTORE) <= 0) return;
      // Il riparo si pianta davanti, di traverso rispetto a dove si guarda.
      // Se davanti c'e' un muro non si pianta e non si consuma la ricarica:
      // sprecare l'abilita' per un pollice storto sarebbe punitivo per niente.
      const x = g.x + Math.cos(g.ang) * RIPARO.distanza;
      const y = g.y + Math.sin(g.ang) * RIPARO.distanza;
      if (muro(this.mappa, Math.floor(x / TILE), Math.floor(y / TILE))) return;
      this.ripari.push({
        id: this.prossimoRiparo++,
        x,
        y,
        ang: g.ang,
        vita: RIPARO.vita,
        resta: regola.durata,
        padrone: g.id,
      });
      g.ripari = (g.ripari ?? RIPARI_PER_SETTORE) - 1;
      this.rumori.emetti('passi', g.x, g.y, g.id);
      console.log(`${g.nome} ha piantato un riparo (ne restano ${g.ripari}).`);
    }

    g.abilitaRicarica = regola.ricarica;
  }

  /**
   * I ripari a terra: durano un po' e poi cadono da soli, oppure li buttano
   * giu' a fucilate. Non si consumano contro i vostri colpi — quelli passano
   * sopra, ed e' tutto il punto della barriera.
   */
  consumaRipari(dt) {
    for (let k = this.ripari.length - 1; k >= 0; k--) {
      const r = this.ripari[k];
      r.resta -= dt;
      if (r.resta <= 0 || r.vita <= 0) {
        this.ripari.splice(k, 1);
        if (r.vita <= 0) console.log('Un riparo e andato in pezzi.');
      }
    }
  }

  /**
   * Un colpo NEMICO che sbatte contro un riparo. I vostri passano: si spara da
   * dietro senza essere colpiti, che e' esattamente quello che chi lo pianta
   * si aspetta di ottenere.
   */
  fermatoDaUnRiparo(c) {
    if (!c.daNemico || !this.ripari.length) return false;
    for (const r of this.ripari) {
      const dx = c.x - r.x;
      const dy = c.y - r.y;
      const co = Math.cos(r.ang);
      const si = Math.sin(r.ang);
      if (Math.abs(dx * co + dy * si) > RIPARO.spessore / 2) continue;
      if (Math.abs(-dx * si + dy * co) > RIPARO.mezzaLunghezza) continue;
      r.vita -= c.danno;
      return true;
    }
    return false;
  }

  /** I lampi degli scoppi: durano il tempo di vedersi e spariscono. */
  sbiadisciScoppi(dt) {
    for (let k = this.scoppi.length - 1; k >= 0; k--) {
      this.scoppi[k].resta -= dt;
      if (this.scoppi[k].resta <= 0) this.scoppi.splice(k, 1);
    }
  }

  /**
   * I kit a terra. Curano fino a un tetto, non fino a pieno: chi e' malmesso
   * torna in condizione di combattere, non torna nuovo. E ogni kit vale una
   * volta sola per ciascuno, altrimenti basterebbe restarci sopra.
   */
  curaConIKit(dt) {
    const regola = ABILITA.faro;
    const tetto = VITA_MASSIMA * regola.tetto;

    for (let k = this.kit.length - 1; k >= 0; k--) {
      const kit = this.kit[k];
      kit.resta -= dt;
      if (kit.resta <= 0) {
        this.kit.splice(k, 1);
        continue;
      }
      for (const g of this.giocatori.values()) {
        if (g.stato !== STATO.VIVO || (!g.online && !g.bot)) continue;
        if (g.vita >= tetto) continue;
        if (kit.usatoDa.includes(g.id)) continue;
        if (Math.hypot(g.x - kit.x, g.y - kit.y) > regola.raggio) continue;
        g.vita = Math.min(tetto, g.vita + regola.cura);
        kit.usatoDa.push(g.id);
        console.log(`${g.nome} si e' curato: ${Math.round(g.vita)} di vita.`);
      }
    }
  }

  /**
   * Le casse di rifornimento. Molta armatura e poca salute: quello che si
   * ritrova girando e' la capacita' di incassare, non la carne — quella la
   * rimette in sesto solo il medico.
   */
  raccogliRifornimenti() {
    for (let k = this.rifornimenti.length - 1; k >= 0; k--) {
      const cassa = this.rifornimenti[k];
      const presenti = [...this.giocatori.values()].filter(
        (g) => (g.online || g.bot) && g.stato !== STATO.MORTO,
      );

      for (const g of presenti) {
        if (g.stato !== STATO.VIVO) continue;
        if (cassa.usatoDa.includes(g.id)) continue;
        if (Math.hypot(g.x - cassa.x, g.y - cassa.y) > RIFORNIMENTI.raggio) continue;
        if (g.armatura >= ARMATURA_MASSIMA && g.vita >= VITA_MASSIMA) continue;
        g.armatura = Math.min(ARMATURA_MASSIMA, g.armatura + RIFORNIMENTI.armatura);
        g.vita = Math.min(VITA_MASSIMA, g.vita + RIFORNIMENTI.salute);
        cassa.usatoDa.push(g.id);
        this.piantaCambiata = true;
        console.log(`${g.nome} si e' rifornito: ${Math.round(g.armatura)} di armatura.`);
      }

      // Sparisce quando l'hanno presa tutti quelli che c'erano.
      if (presenti.length && presenti.every((g) => cassa.usatoDa.includes(g.id))) {
        this.rifornimenti.splice(k, 1);
        this.piantaCambiata = true;
      }
    }
  }

  /**
   * Le stazioni di ricarica: colpi, abilita' e ripari, tutto insieme.
   *
   * Bisogna STARCI FERMI SOPRA per un paio di secondi, e non e' un fastidio
   * aggiunto: e' quello che rende il rifornirsi una decisione. Fermarsi in
   * mezzo a un settore sveglio, con l'allarme che suona, e' un rischio che si
   * corre apposta. Passandoci sopra di corsa non succede niente.
   *
   * Ognuno la puo' usare una volta sola. Una stazione che si riusa all'infinito
   * non e' un rifornimento, e' un accampamento: ci si torna dietro ogni volta
   * che si e' a secco e la scarsita' non esiste piu'.
   */
  usaLeStazioni(dt) {
    if (!this.stazioni?.length) return;
    const vivi = [...this.giocatori.values()].filter(
      (g) => (g.online || g.bot) && g.stato === STATO.VIVO,
    );

    for (const z of this.stazioni) {
      for (const g of vivi) {
        if (Math.hypot(g.x - z.x, g.y - z.y) > STAZIONE.raggio) {
          // Allontanarsi azzera: il conto va fatto stando li', non a rate.
          if (z.quanto.has(g.id)) {
            z.quanto.delete(g.id);
            this.piantaCambiata = true;
          }
          continue;
        }
        const fatto = (z.quanto.get(g.id) ?? 0) + dt;
        z.quanto.set(g.id, fatto);
        if (fatto < STAZIONE.usa) continue;

        const m = munizioniDi(g.ruolo);
        g.colpi = m.caricatore;
        g.riserve = m.caricatori - 1;
        g.ricaricaArma = 0;
        g.abilitaRicarica = 0;
        g.ripari = RIPARI_PER_SETTORE;
        z.quanto.delete(g.id);
        console.log(`${g.nome} si e' ricaricato a una cassa.`);
      }
    }
  }

  /** Quanto manca a ricaricarsi, per chi e' fermo su una stazione. */
  quantoAllaStazione(g) {
    if (!this.stazioni?.length) return 0;
    for (const z of this.stazioni) {
      const fatto = z.quanto.get(g.id);
      if (fatto) return Math.min(1, fatto / STAZIONE.usa);
    }
    return 0;
  }

  /** I sonar a terra: ogni impulso segna i nemici che ci passano dentro. */
  battonoISonar(dt) {
    for (let k = this.sonar.length - 1; k >= 0; k--) {
      const s = this.sonar[k];
      s.resta -= dt;
      if (s.resta <= 0) {
        this.sonar.splice(k, 1);
        continue;
      }
      s.battito -= dt;
      if (s.battito > 0) continue;
      s.battito = IMPULSO_SONAR;
      for (const n of this.nemici) {
        if (Math.hypot(n.x - s.x, n.y - s.y) <= s.raggio) n.marcatoResta = IMPULSO_SONAR + 0.4;
      }
    }
  }

  /**
   * Chi ha sentito cosa. Un nemico che sente qualcosa va a controllare — non
   * sa cosa fosse, sa solo dove. Chi sta gia' cacciando non si distrae.
   */
  ascoltano() {
    if (!this.rumori.nuovi.length) return;
    for (const suono of this.rumori.nuovi) {
      for (const n of this.nemici) {
        if (n.umore === UMORE.CACCIA) continue;
        if (suono.autore === -n.id) continue; // non ci si allarma da soli
        const quanto = this.rumori.quantoSiSente(suono, n.x, n.y);
        if (quanto <= 0) continue;
        n.umore = UMORE.CERCA;
        n.ultimaNota = { x: suono.x, y: suono.y };
        n.campoMeta = campo(this.mappa, [n.ultimaNota]);
        // Piu' forte l'ha sentito, piu' a lungo lo tiene a mente.
        n.oblio = Math.max(n.oblio, 3 + quanto * 5);
      }
    }
  }

  /**
   * Gli obiettivi del settore. Ogni modalita' ha la sua strada, ma il finale e'
   * sempre lo stesso: quando la missione e' fatta si accende l'allarme e si
   * torna all'uscita con tutto il settore sveglio. E' la coda in comune a
   * tenere insieme tre missioni diverse invece di farle sembrare tre giochi.
   */
  obiettivi(dt) {
    if (this.preparazione > 0) return; // si sta ancora leggendo il briefing
    const vivi = this.inPiedi();

    if (!this.missioneFatta) {
      if (this.modalita === 'bomba') this.passoBomba(dt, vivi);
      else if (this.modalita === 'dominio') this.passoDominio(dt, vivi);
      else if (this.modalita === 'convoglio') this.passoConvoglio(dt, vivi);
      else if (this.modalita === 'boss') this.passoBoss(dt, vivi);
      else this.passoSabotaggio(dt, vivi);
    }

    const eraAperta = this.estrazione.aperta;
    this.estrazione.aperta = this.missioneFatta;
    if (this.estrazione.aperta && !eraAperta) {
      this.allarme = true;
      this.prossimoRichiamo = 0;
      console.log('ALLARME: il settore si e svegliato. Tornate indietro.');
    }
    if (this.allarme) this.suonaLAllarme(dt);
    if (!this.estrazione.aperta || !vivi.length) {
      this.estrazione.progresso = 0;
      return;
    }

    // Si esce insieme: se uno solo e' fuori dal cerchio non si parte.
    const tuttiDentro = vivi.every(
      (g) => Math.hypot(g.x - this.estrazione.x, g.y - this.estrazione.y) <= SPEDIZIONE.raggioEstrazione,
    );
    if (!tuttiDentro) {
      this.estrazione.progresso = Math.max(0, this.estrazione.progresso - dt);
      return;
    }
    // Tenere l'uscita costa piu' a mano a mano che si alza la difficolta'.
    this.estrazione.progresso +=
      dt / (SPEDIZIONE.durataEstrazione * this.regole().evacuazione);
    if (this.estrazione.progresso < 1) return;
    // Quindici e si e' finita. Prima non finiva mai, e non era una scelta: era
    // che nessuno aveva deciso dove finisse.
    if (!this.senzaFine() && this.settore >= SETTORI_PER_FINIRE) {
      this.vittoria = true;
      this.estrazione.progresso = 1;
      this.piantaCambiata = true;
      console.log(`SPEDIZIONE COMPIUTA: ${SETTORI_PER_FINIRE} settori.`);
      return;
    }
    this.nuovoSettore(this.settore + 1);
  }

  /**
   * Sabotaggio. Spegnere un server vuole qualche secondo fermi accanto: e' il
   * momento in cui si e' scoperti, e per questo conviene essere in due — uno
   * lavora, l'altro guarda le spalle.
   */
  passoSabotaggio(dt, vivi) {
    for (const nucleo of this.nuclei) {
      if (nucleo.attivo) continue;
      const quanti = vivi.filter(
        (g) => Math.hypot(g.x - nucleo.x, g.y - nucleo.y) <= SPEDIZIONE.raggioNucleo,
      ).length;
      if (quanti === 0) {
        nucleo.progresso = Math.max(0, nucleo.progresso - dt / SPEDIZIONE.durataNucleo);
        continue;
      }
      // In due si fa il doppio piu' in fretta: premia stare insieme.
      nucleo.progresso += (dt * quanti) / SPEDIZIONE.durataNucleo;
      if (nucleo.progresso >= 1) {
        nucleo.progresso = 1;
        nucleo.attivo = true;
        const restano = this.nuclei.filter((n) => !n.attivo).length;
        console.log(restano ? `Server spento, ne restano ${restano}.` : 'Tutti i server spenti.');
      }
    }
    this.missioneFatta = this.nuclei.length > 0 && this.nuclei.every((n) => n.attivo);
  }

  /**
   * La bomba, in quattro tempi: sta a terra, la porti, la posi, la difendi.
   * Il pezzo che conta e' l'ultimo — piazzata, la miccia scende solo se non
   * c'e' nessuno di loro li' intorno, e quindi non basta scappare.
   */
  passoBomba(dt, vivi) {
    const b = this.bomba;
    if (!b) return;

    if (b.stato === 'aTerra') {
      const chi = vivi.find(
        (g) => !g.bot && Math.hypot(g.x - b.x, g.y - b.y) <= BOMBA.raggioRitiro,
      );
      if (chi) {
        b.stato = 'inMano';
        b.portata = chi.id;
        b.tempo = BOMBA.perPiazzare;
        b.posa = 0;
        console.log(`${chi.nome} ha preso la bomba: ${BOMBA.perPiazzare} secondi per piazzarla.`);
      }
      return;
    }

    if (b.stato === 'inMano') {
      const chi = this.giocatori.get(b.portata);
      // Se chi la porta cade, la bomba resta li' dov'e' caduto.
      if (!chi || chi.stato !== STATO.VIVO || (!chi.online && !chi.bot)) {
        b.stato = 'aTerra';
        b.portata = null;
        b.posa = 0;
        console.log('La bomba e caduta a terra.');
        return;
      }
      b.x = chi.x;
      b.y = chi.y;
      b.tempo -= dt;

      // Sul punto segnato: qualche secondo fermi e va giu'.
      if (Math.hypot(chi.x - b.sito.x, chi.y - b.sito.y) <= BOMBA.raggioPunto) {
        b.posa += dt / BOMBA.piazzamento;
        if (b.posa >= 1) {
          b.stato = 'piazzata';
          b.x = b.sito.x;
          b.y = b.sito.y;
          b.portata = null;
          b.posa = 1;
          b.tempo = BOMBA.miccia;
          this.prossimaChiamata = 0;
          console.log('Bomba piazzata. Difendetela.');
          return;
        }
      } else {
        b.posa = Math.max(0, b.posa - dt / BOMBA.piazzamento);
      }

      // Tempo scaduto con la bomba in mano: scoppia addosso e se ne prepara
      // un'altra al punto di ritiro. Il tempo e' largo e il posto e' segnato
      // fin dall'inizio: se scade, si e' fatto altro.
      if (b.tempo <= 0) {
        console.log(`La bomba e scoppiata in mano a ${chi.nome}.`);
        this.scoppi.push({ x: chi.x, y: chi.y, resta: 0.8 });
        this.rumori.emetti('sparo', chi.x, chi.y, chi.id, 18);
        this.ferisci(chi, BOMBA.dannoSeScoppia);
        this.preparaLaProssimaBomba();
      }
      return;
    }

    if (b.stato === 'piazzata') {
      // I nemici la sentono e vengono: finche' ce n'e' uno addosso, la miccia
      // sta ferma. E' questo a trasformare "piazza e scappa" in "resta li'".
      const vicino = this.nemici.some(
        (n) => Math.hypot(n.x - b.x, n.y - b.y) <= BOMBA.raggioDifesa,
      );
      b.contesa = vicino;
      this.richiamaSu(b, dt);
      if (!vicino) b.tempo -= dt;
      if (b.tempo > 0) return;

      // Scoppia: chi e' li' intorno se ne accorge, nemici compresi.
      this.scoppi.push({ x: b.x, y: b.y, resta: 1.2 });
      this.rumori.emetti('sparo', b.x, b.y, 0, 20);
      for (let k = this.nemici.length - 1; k >= 0; k--) {
        const n = this.nemici[k];
        if (Math.hypot(n.x - b.x, n.y - b.y) > BOMBA.raggioScoppio) continue;
        n.vita -= BOMBA.dannoScoppio;
        if (n.vita <= 0) this.nemici.splice(k, 1);
      }
      // E a voi arriva addosso, con il danno che scala sulla distanza: al
      // centro ammazza, al bordo e' un graffio. La missione vi chiede di stare
      // li' a difenderla, non di stare SOPRA quando parte — e la miccia si
      // vede scorrere, quindi il tempo per scansarsi c'e' tutto.
      for (const g of this.giocatori.values()) {
        if (g.stato !== STATO.VIVO) continue;
        const quanto = Math.hypot(g.x - b.x, g.y - b.y);
        if (quanto > BOMBA.raggioSchegge) continue;
        if (quanto <= BOMBA.raggioLetale) {
          console.log(`${g.nome} era sopra la bomba.`);
          this.ferisci(g, VITA_MASSIMA + ARMATURA_MASSIMA);
          continue;
        }
        // Fuori dal nocciolo il danno cala col quadrato: vicino fa ancora
        // molto male, lontano quasi niente. Lineare sarebbe stato piu' facile
        // da scrivere e piu' difficile da leggere giocando.
        const fuori =
          (quanto - BOMBA.raggioLetale) / (BOMBA.raggioSchegge - BOMBA.raggioLetale);
        this.ferisci(g, Math.round(BOMBA.dannoSchegge * (1 - fuori) ** 2));
      }

      b.fatte++;
      console.log(`Bomba ${b.fatte} di ${b.quante}: esplosa.`);
      if (b.fatte >= b.quante) {
        b.stato = 'finita';
        this.missioneFatta = true;
      } else {
        this.preparaLaProssimaBomba();
      }
    }
  }

  /**
   * Il dominio: una zona da tenere. Sale se ci sei dentro e non ci sono loro,
   * si ferma se sono entrati, e cala piano se te ne vai — cosi' non la si puo'
   * sbocconcellare nascondendosi ogni volta che si scalda.
   */
  passoDominio(dt, vivi) {
    const z = this.zona;
    if (!z) return;

    const dentroNostri = vivi.filter((g) => Math.hypot(g.x - z.x, g.y - z.y) <= z.raggio).length;
    const dentroLoro = this.nemici.some((n) => Math.hypot(n.x - z.x, n.y - z.y) <= z.raggio);
    z.contesa = dentroNostri > 0 && dentroLoro;

    // Finche' la zona e' attiva, i nemici sanno dove siete: e' una missione in
    // cui non ci si nasconde, ci si tiene.
    this.richiamaSu(z, dt);

    // In due si conquista piu' in fretta, da soli piu' piano: senza questa
    // differenza uno faceva il palo e l'altro girava a sparare, che e' il
    // contrario di una missione da fare insieme.
    if (dentroNostri > 0 && !dentroLoro) {
      const passo = dentroNostri > 1 ? DOMINIO.inDue : DOMINIO.daSolo;
      z.progresso += (dt * passo) / z.durata;
    } else if (dentroNostri === 0) {
      z.progresso = Math.max(0, z.progresso - (dt * DOMINIO.perdita) / z.durata);
    }

    if (z.progresso >= 1) {
      z.progresso = 1;
      this.missioneFatta = true;
      console.log('Zona conquistata.');
    }
  }

  /**
   * Il boss: lento, grosso, e con le porte alle spalle da cui arriva aiuto.
   *
   * Non insegue davvero — e' piu' lento di voi di proposito. Se corresse
   * sarebbe solo un pattugliatore gonfiato; cosi' invece bisogna decidere se
   * stargli davanti per colpirlo o girargli attorno per togliersi dal cono, e
   * intanto gli scagnozzi arrivano da dietro.
   */
  passoBoss(dt, vivi) {
    const b = this.boss;
    if (!b) return;

    if (b.vita <= 0) {
      if (!this.porteAperte) {
        this.porteAperte = true;
        this.missioneFatta = true;
        this.piantaCambiata = true;
        console.log('Il boss e a terra. Le porte si aprono.');
      }
      return;
    }

    // Il piu' vicino fra quelli in piedi. Non c'e' una funzione buona da
    // riusare: quella dei nemici sceglie dentro il cono, e il boss invece sa
    // sempre dove siete — e' la sua stanza.
    let preda = null;
    let quantoLontano = Infinity;
    for (const g of vivi) {
      const d = Math.hypot(g.x - b.x, g.y - b.y);
      if (d < quantoLontano) {
        quantoLontano = d;
        preda = g;
      }
    }
    if (preda) {
      const versoLaPreda = Math.atan2(preda.y - b.y, preda.x - b.x);
      b.ang = angolo(b.ang, versoLaPreda, dt * 2.2);
      const quanto = quantoLontano;
      if (quanto > BOSS.raggio + 40) {
        muovi(b, Math.cos(b.ang), Math.sin(b.ang), dt, this.mappa, BOSS.velocita);
      }
      b.ricarica -= dt;
      if (b.ricarica <= 0 && quanto <= BOSS.gittata && lineaLibera(this.mappa, b.x, b.y, preda.x, preda.y)) {
        b.ricarica = BOSS.cadenza;
        this.proiettili.push(
          creaColpo(-1, b.x, b.y, b.ang, BOSS.danno * this.regole().danno, BOSS.gittata, BOSS.velocitaColpo, true),
        );
        this.rumori.emetti('sparoNemico', b.x, b.y, -1, 20);
      }
    }

    // Gli scagnozzi entrano dalle porte in fondo: da li' passano loro e non voi.
    b.prossimoScagnozzo -= dt;
    if (b.prossimoScagnozzo <= 0 && this.nemici.length < BOSS.scagnozziInsieme) {
      b.prossimoScagnozzo = BOSS.scagnozzi;
      const porta = this.mappa.arena.porte[this.nemici.length % this.mappa.arena.porte.length];
      const p = centroCasella(this.mappa, porta.tx, porta.ty);
      const nuovo = creaNemici(this.mappa, 1)[0];
      if (nuovo) {
        nuovo.x = p.x;
        nuovo.y = p.y;
        this.nemici.push(nuovo);
      }
    }
  }

  /**
   * Il convoglio avanza se gli si sta vicino, torna indietro se lo si lascia.
   *
   * E' l'unica missione in cui FERMARSI A SPARARE FA PERDERE TERRENO: le altre
   * quattro premiano il trovare una posizione e tenerla, questa punisce chi si
   * attarda. Ed e' l'unica con un tempo che uccide davvero — scaduto quello la
   * spedizione e' persa, ed e' quello che rende "lo seguo o mi tolgo di torno
   * questi due" una scelta invece che una preferenza.
   */
  passoConvoglio(dt, vivi) {
    const v = this.convoglio;
    if (!v) return;

    v.scortato = vivi.some((g) => Math.hypot(g.x - v.x, g.y - v.y) <= CONVOGLIO.raggio);
    const passo = v.scortato ? CONVOGLIO.velocita : -CONVOGLIO.velocita * CONVOGLIO.indietro;
    v.quanto = Math.max(0, Math.min(1, v.quanto + (passo * dt) / v.lunghezza));

    const dove = puntoSulBinario(v.binario, v.quanto);
    v.x = dove.x;
    v.y = dove.y;

    // I nemici sanno dov'e': un convoglio che avanza non si nasconde.
    this.richiamaSu(v, dt);

    v.tempo -= dt;
    if (v.tempo <= 0 && !this.disfatta) {
      this.disfatta = true;
      console.log('Il convoglio non e arrivato in tempo. Spedizione perduta.');
      return;
    }

    if (v.quanto >= 1) {
      this.missioneFatta = true;
      console.log('Convoglio arrivato.');
    }
  }

  /**
   * Richiama i nemici su un punto — la bomba piazzata, la zona da tenere. E'
   * lo stesso meccanismo dell'allarme, ma puntato su una cosa invece che su
   * di voi: vengono li', e sta a voi essere li' quando arrivano.
   */
  richiamaSu(punto, dt) {
    this.prossimaChiamata -= dt;
    if (this.prossimaChiamata > 0) return;
    this.prossimaChiamata = BOMBA.richiamo;
    for (const n of this.nemici) {
      if (n.umore === UMORE.CACCIA) continue;
      n.umore = UMORE.CERCA;
      n.ultimaNota = { x: punto.x, y: punto.y };
      n.campoMeta = campo(this.mappa, [n.ultimaNota]);
      n.oblio = Math.max(n.oblio, ALLARME.memoria);
    }
  }

  /** Chi sta portando la bomba, se qualcuno la sta portando. */
  portaLaBomba(g) {
    return this.bomba?.stato === 'inMano' && this.bomba.portata === g.id;
  }

  /**
   * Con l'allarme acceso i nemici vengono aggiornati ogni tanto su dove siete.
   * Non e' onniscienza: sanno DOVE ERAVATE, e ci vanno. Spezzare la linea di
   * vista e cambiare strada funziona ancora — ma non si torna piu' indietro
   * passeggiando.
   */
  suonaLAllarme(dt) {
    this.prossimoRichiamo -= dt;
    if (this.prossimoRichiamo > 0) return;
    this.prossimoRichiamo = ALLARME.richiamo;

    const vivi = this.inPiedi();
    if (!vivi.length) return;

    for (const n of this.nemici) {
      if (n.umore === UMORE.CACCIA) continue;
      // Ognuno punta al piu' vicino fra quelli in piedi.
      let meta = vivi[0];
      let distanza = Infinity;
      for (const g of vivi) {
        const d = Math.hypot(g.x - n.x, g.y - n.y);
        if (d < distanza) {
          distanza = d;
          meta = g;
        }
      }
      n.umore = UMORE.CERCA;
      n.ultimaNota = { x: meta.x, y: meta.y };
      n.campoMeta = campo(this.mappa, [n.ultimaNota]);
      n.oblio = ALLARME.memoria;
    }
  }

  /**
   * Se non resta nessuno in piedi per qualche secondo la spedizione e' finita
   * e si ricomincia dal primo settore. Non e' una punizione severa: una
   * partita dura una serata, non un mese.
   */
  controllaDisfatta(dt) {
    if (this.giocatori.size === 0) return;
    if (this.inPiedi().length > 0) {
      this.tuttiGiu = 0;
      return;
    }
    this.tuttiGiu += dt;
    if (this.tuttiGiu > 4 && !this.disfatta) {
      // Non si riparte da soli: si dice che e' finita e si aspetta. Ritrovarsi
      // di colpo al primo settore senza aver capito cosa e' successo e' peggio
      // che perdere.
      this.disfatta = true;
      console.log(`Spedizione perduta al settore ${this.settore}.`);
    }
  }

  /** Il marchio dell'Eco si spegne da solo. */
  sbiadisciMarchi(dt) {
    for (const n of this.nemici) {
      if (n.marcatoResta > 0) n.marcatoResta = Math.max(0, n.marcatoResta - dt);
    }
  }

  /**
   * La mappa non deve svuotarsi. Ogni tanto arriva un rinforzo, lontano da chi
   * gioca: senza, dopo mezz'ora di prove si gira per stanze deserte. Quando ci
   * saranno le spedizioni vere questo diventera' il ritmo di una missione.
   */
  ripopola(dt) {
    if (this.nemici.length >= this.tettoNemici()) return;
    this.attesaRinforzi -= dt;
    if (this.attesaRinforzi > 0) return;
    // Con l'allarme arrivano fitti; mentre si tiene una zona pure, perche' e'
    // proprio la pressione a essere la missione.
    const tieneLaZona = this.modalita === 'dominio' && !this.missioneFatta;
    this.attesaRinforzi = this.allarme
      ? ALLARME.rinforzi
      : tieneLaZona
        ? DOMINIO.rinforzi
        : 12;

    const lontanoDa = [...this.giocatori.values()].filter((g) => g.online || g.bot);
    // Con l'allarme il posto lo scegliamo noi (vicino all'uscita), quindi il
    // filtro "lontano da chi gioca" qui scarterebbe stanze per niente — e
    // quando si e' vicini all'uscita finiva per non nascere nessuno, proprio
    // nel momento in cui i rinforzi servono.
    const nuovo = creaNemici(this.mappa, 1, this.allarme ? [] : lontanoDa)[0];
    if (!nuovo) return;

    // Con l'allarme i rinforzi si presentano dalla parte dell'uscita, non
    // alle spalle: cosi' il ritorno e' un attraversamento e non una fuga con
    // qualcuno che arranca dietro. Mai addosso a chi gioca, pero'.
    if (this.allarme && ALLARME.davanti) {
      const vicinoAllUscita = this.caselleLibere
        .map((c) => ({ c, d: Math.hypot((c.tx + 0.5) * TILE - this.estrazione.x, (c.ty + 0.5) * TILE - this.estrazione.y) }))
        .filter(({ c }) =>
          lontanoDa.every(
            (g) => Math.hypot(g.x - (c.tx + 0.5) * TILE, g.y - (c.ty + 0.5) * TILE) > 7 * TILE,
          ),
        )
        .sort((a, b) => a.d - b.d)[0];
      if (vicinoAllUscita) {
        const p = centroCasella(this.mappa, vicinoAllUscita.c.tx, vicinoAllUscita.c.ty);
        nuovo.x = p.x;
        nuovo.y = p.y;
        nuovo.casa = { tx: vicinoAllUscita.c.tx, ty: vicinoAllUscita.c.ty };
      }
    }
    this.nemici.push(nuovo);
  }

  /**
   * Si sta giocando da soli per scelta? Non e' la stessa cosa di "c'e' un solo
   * giocatore": chi entra da solo puo' volere il compagno automatico oppure no,
   * e la differenza cambia sia il fantoccio sia quanti nemici ci sono.
   */
  daSoli() {
    const umani = [...this.giocatori.values()].filter((g) => !g.bot && g.online);
    return umani.length === 1 && umani[0].soloVoluto === true;
  }

  /** Quanti nemici tiene in piedi questo settore, con lo sconto per chi e' solo. */
  tettoNemici() {
    const base = this.nemiciBase ?? SPEDIZIONE.nemiciBase;
    const quanti =
      base *
      this.regole().nemici *
      (this.allarme ? ALLARME.tetto : 1) *
      (this.daSoli() ? SCONTO_DA_SOLI : 1);
    return Math.max(3, Math.round(quanti));
  }

  /**
   * Le manopole in vigore adesso.
   *
   * In Survival non le sceglie nessuno: le detta il settore in cui si e'
   * arrivati, e salgono di un gradino ogni cinque. Oltre Incubo continuano a
   * salire a passi corti, perche' un tetto rimetterebbe l'altopiano che tutta
   * questa versione serviva a togliere.
   */
  regole() {
    if (this.difficolta === 'survival') return regoleSurvival(this.settore);
    return regoleDifficolta(this.difficolta);
  }

  /** In Survival non si finisce: si vede fin dove si arriva. */
  senzaFine() {
    return this.difficolta === 'survival';
  }

  /** I giocatori ancora in piedi: bersagli per i nemici, sorgenti per il campo. */
  inPiedi() {
    return [...this.giocatori.values()].filter(
      (g) => g.stato === STATO.VIVO && (g.online || g.bot),
    );
  }

  /**
   * Esegue i comandi in fila, uno per sottopasso. Se la fila e' vuota il
   * personaggio resta fermo invece di ripetere l'ultimo comando: ripeterlo
   * farebbe avanzare il server di un passo che il telefono non ha fatto, e
   * tornerebbe il disaccordo che si sta cercando di togliere.
   */
  consumaComandi(g) {
    // Se si e' accumulato arretrato si recupera, ma senza strappi.
    const quanti =
      g.coda.length > SOTTOPASSI_PER_TICK * 3 ? SOTTOPASSI_PER_TICK * 2 : SOTTOPASSI_PER_TICK;

    let eseguiti = 0;
    for (let k = 0; k < quanti; k++) {
      const c = g.coda.shift();
      if (!c) {
        // Coda a secco: il telefono non ha mandato in tempo. Sul Wi-Fi di casa
        // non succede mai; su internet e' la spia che dice se i comandi
        // raggruppati stanno arrivando troppo a singhiozzo — e senza una spia
        // si vedrebbe solo un compagno che scatta, senza sapere perche'.
        if (g.stato !== STATO.MORTO) g.codaVuota = (g.codaVuota ?? 0) + 1;
        break;
      }
      eseguiti++;
      g.ultimoSeq = c.seq;
      if (g.stato === STATO.MORTO) continue;

      // Scavalcare un riparo rallenta, e il conto lo fa la stessa funzione
      // che gira sul telefono: se qui e li' si calcolasse una velocita'
      // diversa, il personaggio verrebbe strattonato indietro a ogni
      // fotografia proprio mentre e' sopra la barriera.
      const velocita = velocitaFraIRipari(
        g.stato === STATO.CRITICO ? VELOCITA_CRITICO : VELOCITA,
        this.ripari,
        g.x,
        g.y,
      );
      const primaX = g.x;
      const primaY = g.y;
      muovi(g, c.mx, c.my, SOTTOPASSO, this.mappa, velocita);
      fermatoDalleporte(this.mappa.arena, this.porteAperte, g, { x: primaX, y: primaY });
      const a = angolo(c.ax, c.ay) ?? angolo(c.mx, c.my);
      if (a !== null) g.ang = a;

      // Camminare fa rumore. Poco — quattro caselle — ma abbastanza da farsi
      // trovare da chi ti sta gia' cercando nella stanza accanto.
      if (Math.hypot(g.x - primaX, g.y - primaY) > 0.5 && g.stato === STATO.VIVO) {
        g.passoRumore += SOTTOPASSO;
        if (g.passoRumore >= PASSO_RUMOROSO) {
          g.passoRumore = 0;
          this.rumori.emetti('passi', g.x, g.y, g.id);
        }
      }

      // La torcia la vuole accesa il giocatore, ma la carica decide.
      g.torcia = c.l === 1 && !g.esaurita && g.carica > 0;

      g.ricarica = Math.max(0, g.ricarica - SOTTOPASSO);
      g.abilitaRicarica = Math.max(0, g.abilitaRicarica - SOTTOPASSO);
      if (c.f && g.stato === STATO.VIVO) this.sparaGiocatore(g);
      if (c.b && g.stato === STATO.VIVO) this.usaAbilita(g);
      if (c.rk && g.stato === STATO.VIVO) ricaricaAMano(g);
    }
    void eseguiti;
  }

  /**
   * Il nemico verso cui vale la pena raddrizzare il colpo: il piu' centrato
   * rispetto a dove sta gia' puntando, non il piu' vicino. Chi mira a destra
   * e ha un nemico a sinistra non deve vedersi il colpo curvare.
   */
  bersaglioAssistito(g, arma) {
    let miglior = null;
    let migliorScarto = ASSISTENZA.angolo;
    for (const n of this.nemici) {
      const dx = n.x - g.x;
      const dy = n.y - g.y;
      if (Math.hypot(dx, dy) > arma.gittata) continue;
      const scarto = Math.abs(differenzaAngolo(Math.atan2(dy, dx), g.ang));
      if (scarto >= migliorScarto) continue;
      if (!lineaLibera(this.mappa, g.x, g.y, n.x, n.y)) continue;
      migliorScarto = scarto;
      miglior = { n, scarto: differenzaAngolo(Math.atan2(dy, dx), g.ang) };
    }
    return miglior;
  }

  sparaGiocatore(g) {
    if (g.ricarica > 0) return;
    // Senza colpi in canna non parte niente: si rimette il caricatore, e per
    // quei secondi si e' disarmati. E' il momento in cui il compagno serve
    // davvero, ed e' tutto il senso di avere delle munizioni invece che
    // spararne all'infinito.
    if (g.ricaricaArma > 0) return;
    if (g.colpi <= 0) {
      ricaricaArma(g);
      return;
    }
    // In due chi porta la bomba ha le mani occupate: il compagno diventa la
    // sua scorta, ed e' il momento piu' cooperativo del gioco. Da soli invece
    // si spara lo stesso — attraversare mezzo settore disarmati senza nessuno
    // che ti copra non sarebbe difficile, sarebbe solo ingiusto.
    if (this.portaLaBomba(g) && !this.daSoli()) return;
    const arma = ARMI[g.ruolo] ?? ARMI.faro;
    g.ricarica = arma.cadenza;
    g.colpi--;

    // Il pollice non e' un mouse: il colpo si raddrizza di qualche grado verso
    // il nemico piu' centrato. Poco, e solo se c'e' gia' quasi la mira.
    const assistito = this.bersaglioAssistito(g, arma);
    const mira = g.ang + (assistito ? assistito.scarto * ASSISTENZA.correzione : 0);
    // Ogni arma si sente per quanto e' rumorosa: il fucile a canne mozze
    // sveglia mezzo settore, quello di precisione molto meno. E' un pezzo di
    // identita' della classe che non si vede ma si sente.
    this.rumori.emetti('sparo', g.x, g.y, g.id, arma.rumore);
    for (let k = 0; k < arma.colpi; k++) {
      // La rosa e' simmetrica con un pizzico di casualita': tutta casuale
      // renderebbe il fucile una lotteria, tutta regolare un pettine.
      const centro = arma.colpi === 1 ? 0 : (k / (arma.colpi - 1) - 0.5) * arma.dispersione;
      const sbandata = (Math.random() - 0.5) * arma.dispersione * 0.4;
      this.proiettili.push(
        creaColpo(
          g.id,
          g.x,
          g.y,
          mira + centro + sbandata,
          arma.danno,
          arma.gittata,
          arma.velocita,
          false,
        ),
      );
    }
  }

  /**
   * I caricatori si rimettono da soli quando la canna e' vuota.
   *
   * Non si aspetta che chi gioca prema qualcosa: su un telefono un pulsante
   * "ricarica" e' un dito in piu' da trovare mentre si scappa, e nessuno lo
   * troverebbe. Si ricarica quando si prova a sparare a vuoto, e la barra lo
   * dice.
   */
  scorriRicariche(dt) {
    for (const g of this.giocatori.values()) {
      // Il caricatore si rimette DA SOLO appena la canna e' vuota, senza
      // aspettare che si prema di nuovo. Prima partiva solo premendo il
      // grilletto a vuoto, e voleva dire restare a secco mentre si scappa —
      // che e' esattamente il momento in cui uno vorrebbe che l'arma si stesse
      // gia' ricaricando da se'.
      if (g.ricaricaArma <= 0 && g.colpi <= 0 && g.riserve > 0) ricaricaArma(g);
      if (g.ricaricaArma <= 0) continue;
      g.ricaricaArma = Math.max(0, g.ricaricaArma - dt);
      if (g.ricaricaArma === 0 && g.riserve > 0) {
        g.riserve--;
        g.colpi = munizioniDi(g.ruolo).caricatore;
      }
    }
  }

  /** Chi c'e' sulla traiettoria del colpo. Torna vero se ha centrato qualcosa. */
  chiHoColpito(c) {
    if (c.daNemico) {
      for (const g of this.giocatori.values()) {
        if (g.stato === STATO.MORTO) continue;
        if (!g.online && !g.bot) continue;
        if (Math.abs(c.x - g.x) > CORPO || Math.abs(c.y - g.y) > CORPO) continue;
        this.ferisci(g, c.danno);
        return true;
      }
      return false;
    }

    // Il boss per primo: e' grosso, e i colpi che gli finiscono addosso non
    // devono passargli attraverso per andare a prendere lo scagnozzo dietro.
    const b = this.boss;
    if (b && b.vita > 0 && Math.abs(c.x - b.x) <= BOSS.raggio && Math.abs(c.y - b.y) <= BOSS.raggio) {
      b.vita -= c.danno;
      if (b.vita <= 0) console.log('Il boss e a terra.');
      return true;
    }

    for (const n of this.nemici) {
      if (Math.abs(c.x - n.x) > CORPO || Math.abs(c.y - n.y) > CORPO) continue;
      n.vita -= c.danno;
      // Un colpo incassato mette in allarme anche chi non ti aveva visto:
      // sparare alle spalle funziona una volta sola.
      if (n.umore === UMORE.PATTUGLIA) {
        n.umore = UMORE.CERCA;
        n.oblio = 4;
        const padrone = this.giocatori.get(c.padrone);
        n.ultimaNota = padrone ? { x: padrone.x, y: padrone.y } : { x: c.x, y: c.y };
        n.campoMeta = campo(this.mappa, [n.ultimaNota]);
      }
      if (n.vita <= 0) this.nemici.splice(this.nemici.indexOf(n), 1);
      return true;
    }
    return false;
  }

  ferisci(g, danno) {
    if (g.stato !== STATO.VIVO) return;

    // Prima l'armatura, poi la carne. Quello che avanza passa oltre: cosi' un
    // colpo grosso su un'armatura quasi finita fa comunque male, invece di
    // essere assorbito per intero da un residuo di niente.
    if (g.armatura > 0) {
      const assorbito = Math.min(g.armatura, danno);
      g.armatura -= assorbito;
      danno -= assorbito;
      if (danno <= 0) return;
    }

    g.vita -= danno;
    if (g.vita > 0) return;
    g.vita = 0;
    g.stato = STATO.CRITICO;
    g.criticoRimasto = CRITICO_SECONDI;
    g.rianima = 0;
    console.log(`${g.nome} e' a terra: 30 secondi per raggiungerlo.`);
  }

  /**
   * Chi e' a terra puo' essere rialzato da un compagno che gli resta vicino.
   * E' la meccanica per cui si dice "aspetta, arrivo" invece di giocare a due
   * giochi in parallelo: senza, sono due partite in solitaria sullo stesso
   * schermo.
   */
  curaFeriti(dt) {
    for (const g of this.giocatori.values()) {
      if (g.stato === STATO.MORTO) {
        g.rientroRimasto -= dt;
        if (g.rientroRimasto <= 0) this.rimettiInPiedi(g, VITA_MASSIMA);
        continue;
      }
      if (g.stato !== STATO.CRITICO) continue;

      const soccorritore = [...this.giocatori.values()].find(
        (s) =>
          s !== g &&
          s.stato === STATO.VIVO &&
          (s.online || s.bot) &&
          Math.hypot(s.x - g.x, s.y - g.y) <= RIANIMA_DISTANZA,
      );

      if (soccorritore) {
        g.rianima += dt / RIANIMA_SECONDI;
        if (g.rianima >= 1) {
          this.rimettiInPiedi(g, VITA_DOPO_RIANIMA);
          console.log(`${soccorritore.nome} ha rimesso in piedi ${g.nome}.`);
          continue;
        }
      } else if (g.rianima > 0) {
        // Se il soccorritore si allontana il lavoro non svanisce di colpo, ma
        // nemmeno resta li' per sempre.
        g.rianima = Math.max(0, g.rianima - dt / (RIANIMA_SECONDI * 2));
      }

      g.criticoRimasto -= dt;
      if (g.criticoRimasto <= 0) {
        g.stato = STATO.MORTO;
        g.rianima = 0;
        g.rientroRimasto = RIENTRO_SECONDI;
        console.log(`${g.nome} non ce l'ha fatta. Torna fra ${RIENTRO_SECONDI} secondi.`);
      }
    }
  }

  rimettiInPiedi(g, vita) {
    if (g.stato === STATO.MORTO) {
      const posto = this.mappa.partenze[(g.id - 1) % this.mappa.partenze.length];
      const p = centroCasella(this.mappa, posto.tx, posto.ty);
      g.x = p.x;
      g.y = p.y;
    }
    g.stato = STATO.VIVO;
    g.vita = vita;
    g.rianima = 0;
    g.criticoRimasto = 0;
    g.rientroRimasto = 0;
  }

  /**
   * Non deve mai capitare, ma se capita non deve rovinare la serata: chi si
   * ritrova dentro un muro viene rimesso sulla casella libera piu' vicina
   * invece di restare bloccato li' senza controllo.
   */
  sbloccaSeIncastrato(g) {
    const tx = Math.floor(g.x / TILE);
    const ty = Math.floor(g.y / TILE);
    if (!muro(this.mappa, tx, ty)) return;

    let miglior = null;
    let distanza = Infinity;
    for (const c of this.caselleLibere) {
      const d = (c.tx - tx) ** 2 + (c.ty - ty) ** 2;
      if (d < distanza) {
        distanza = d;
        miglior = c;
      }
    }
    const p = centroCasella(this.mappa, miglior.tx, miglior.ty);
    g.x = p.x;
    g.y = p.y;
    console.log(`${g.nome} era incastrato nel muro ${tx},${ty}: rimesso su ${miglior.tx},${miglior.ty}`);
  }

  /**
   * Un compagno finto quando si prova da soli: serve a vedere se
   * l'interpolazione degli altri giocatori e' liscia senza dover accendere
   * due telefoni. Appena entra una persona vera, se ne va.
   */
  regolaFantoccio() {
    const umani = [...this.giocatori.values()].filter((g) => !g.bot && g.online).length;

    if (umani >= 2 && this.fantoccio) {
      this.giocatori.delete(this.fantoccio.id);
      this.fantoccio = null;
      this.piantaCambiata = true;
      console.log('Il fantoccio si fa da parte: siete in due.');
      return;
    }

    // Chi ha scelto di giocare da solo, gioca da solo.
    if (umani === 1 && this.daSoli()) {
      if (this.fantoccio) {
        this.giocatori.delete(this.fantoccio.id);
        this.fantoccio = null;
        this.piantaCambiata = true;
        console.log('Partita in solitaria: niente fantoccio.');
      }
      return;
    }

    if (umani === 1 && !this.fantoccio) {
      const id = this.prossimoId++;
      // Accanto a chi sta giocando: un compagno di prova che nasce dall'altra
      // parte della mappa non si vede mai, ed e' il motivo per cui esiste.
      const umano = [...this.giocatori.values()].find((g) => !g.bot && g.online);
      const posto = this.casellaLiberaVicino(umano, 3) ?? this.mappa.partenze[1];
      const p = centroCasella(this.mappa, posto.tx, posto.ty);
      this.fantoccio = {
        id,
        sessione: null,
        nome: 'Fantoccio',
        // Una classe a caso: da solo si prova a turno con tutti i compagni
        // possibili, invece che sempre con lo stesso.
        ruolo: ['faro', 'eco', 'assalto'][(Math.random() * 3) | 0],
        bot: true,
        online: true,
        x: p.x,
        y: p.y,
        ang: 0,
        meta: null,
        ...statoIniziale(),
      };
      this.giocatori.set(id, this.fantoccio);
      this.piantaCambiata = true;
      console.log('Entra il fantoccio, cosi hai qualcuno da guardare.');
    }
  }

  /** Una casella calpestabile entro `raggio` caselle da chi gioca. */
  casellaLiberaVicino(rispettoA, raggio) {
    if (!rispettoA) return null;
    const cx = Math.floor(rispettoA.x / TILE);
    const cy = Math.floor(rispettoA.y / TILE);
    const vicine = this.caselleLibere.filter(
      (c) => Math.abs(c.tx - cx) <= raggio && Math.abs(c.ty - cy) <= raggio,
    );
    if (vicine.length === 0) return null;
    return vicine[(Math.random() * vicine.length) | 0];
  }

  /**
   * Il fantoccio non e' piu' solo un manichino: da' una mano. Se il compagno e'
   * a terra lo va a rialzare, se vede un nemico gli spara, altrimenti gli sta
   * dietro. Serve a poter provare da soli tutto il giro completo — sparare,
   * cadere, essere rimessi in piedi — senza accendere due telefoni.
   */
  guidaFantoccio(g, dt) {
    g.ricarica = Math.max(0, g.ricarica - dt);
    // La torcia se la gestisce da solo: la tiene accesa finche' ha carica.
    // Senza questa riga si scaricherebbe e non la riaccenderebbe mai piu',
    // perche' l'interruttore lo muovono i comandi e lui non ne manda.
    g.torcia = !g.esaurita && g.carica > 0.05;
    if (g.stato === STATO.MORTO) return;

    const umano = [...this.giocatori.values()].find((p) => !p.bot && p.online);
    const regola = NEMICI.pattugliatore; // usa lo stesso raggio di vista dei nemici

    if (g.stato === STATO.CRITICO) {
      // A terra si trascina verso il compagno, sperando che arrivi.
      if (umano) this.trascina(g, umano, VELOCITA_CRITICO, dt);
      return;
    }

    // Prima cosa: se il compagno e' a terra, si va a rialzarlo.
    if (umano && umano.stato === STATO.CRITICO) {
      const distanza = Math.hypot(umano.x - g.x, umano.y - g.y);
      if (distanza > RIANIMA_DISTANZA * 0.7) {
        this.trascina(g, umano, 155, dt);
        return;
      }
      g.ang = Math.atan2(umano.y - g.y, umano.x - g.x);
      return;
    }

    // Poi la missione, perche' un compagno che ignora l'obiettivo non e' un
    // compagno. Con l'uscita aperta si va all'uscita: se restasse a girare,
    // chi gioca da solo non potrebbe estrarsi mai, visto che si esce insieme.
    if (this.estrazione.aperta) {
      const distanza = Math.hypot(this.estrazione.x - g.x, this.estrazione.y - g.y);
      if (distanza > SPEDIZIONE.raggioEstrazione * 0.5) {
        this.trascina(g, this.estrazione, 155, dt);
        return;
      }
      // Arrivato: resta nel cerchio e si limita a coprire.
      this.copri(g);
      return;
    }

    // E poi la missione, quale che sia: dare una mano su un server, restare
    // sulla bomba piazzata, tenere la zona. Un compagno che gira per conto suo
    // mentre tu difendi qualcosa e' peggio di nessun compagno.
    const presidio = this.puntoDaPresidiare(umano);
    if (presidio) {
      if (Math.hypot(presidio.punto.x - g.x, presidio.punto.y - g.y) > presidio.vicinanza) {
        this.trascina(g, presidio.punto, 155, dt);
        return;
      }
      this.copri(g);
      return;
    }

    // Poi: se vede un nemico, gli spara.
    if (this.copri(g)) return;

    // Altrimenti gira nei paraggi — aggirando i muri come per le missioni.
    // Puntando dritto si incastrava contro gli spigoli e restava li' a
    // sbattere finche' non cambiava idea, che da fuori sembra un compagno
    // scemo o addirittura fermo.
    if (!g.meta || Math.hypot(g.meta.x - g.x, g.meta.y - g.y) < 16) {
      // Cinque caselle e non otto: da quando aggira i muri ci arriva davvero,
      // e girando attorno alle pareti un obiettivo a otto caselle in linea
      // d'aria lo portava a venti di cammino. Un compagno a venti caselle non
      // illumina piu' niente per te, che e' il motivo per cui esiste.
      const c =
        this.casellaLiberaVicino(umano, 5) ??
        this.caselleLibere[(Math.random() * this.caselleLibere.length) | 0];
      g.meta = centroCasella(this.mappa, c.tx, c.ty);
    }
    const primaX = g.x;
    const primaY = g.y;
    this.trascina(g, g.meta, 155, dt);
    // Se comunque non si e' mosso, la meta' era irraggiungibile: se ne sceglie
    // un'altra invece di insistere.
    if (Math.hypot(g.x - primaX, g.y - primaY) < 0.4) g.meta = null;
  }

  /**
   * Il posto dove il fantoccio deve piantarsi, secondo la modalita'. Torna
   * anche quanto vicino ci deve stare: su un server basta essere nel cerchio,
   * su una bomba piazzata conviene stare un po' largo per coprire le porte.
   */
  puntoDaPresidiare(umano) {
    if (this.modalita === 'bomba') {
      // Mentre la bomba viaggia sta dietro a chi la porta (ci pensa il giro
      // normale, che lo tiene vicino al compagno); piazzata, la difende.
      if (this.bomba?.stato === 'piazzata') {
        return { punto: this.bomba, vicinanza: BOMBA.raggioPunto * 1.6 };
      }
      return null;
    }

    if (this.modalita === 'dominio') {
      if (!this.zona || this.missioneFatta) return null;
      // Ci va solo se anche il compagno e' nei paraggi: da solo in mezzo alla
      // zona farebbe da bersaglio e basta.
      if (umano && Math.hypot(umano.x - this.zona.x, umano.y - this.zona.y) > this.zona.raggio * 2.4) {
        return null;
      }
      return { punto: this.zona, vicinanza: this.zona.raggio * 0.7 };
    }

    if (!umano) return null;
    const daSpegnere = this.nuclei.find(
      (n) => !n.attivo && Math.hypot(umano.x - n.x, umano.y - n.y) <= SPEDIZIONE.raggioNucleo,
    );
    return daSpegnere ? { punto: daSpegnere, vicinanza: SPEDIZIONE.raggioNucleo * 0.6 } : null;
  }

  /** Guarda se c'e' un nemico in vista e gli spara. Torna vero se ne ha trovato uno. */
  copri(g) {
    const preda = chiVede(this.mappa, g, { vista: 330, cono: Math.PI * 2 }, this.nemici);
    if (!preda) return false;
    g.ang = Math.atan2(preda.y - g.y, preda.x - g.x);
    if (g.ricarica === 0) this.sparaGiocatore(g);
    return true;
  }

  /** Va verso qualcuno aggirando i muri, con il campo di distanze. */
  trascina(g, verso, velocita, dt) {
    const c = campo(this.mappa, [{ x: verso.x, y: verso.y }]);
    const dir = passoVerso(this.mappa, c, g.x, g.y) ?? {
      x: verso.x - g.x,
      y: verso.y - g.y,
    };
    const len = Math.hypot(dir.x, dir.y) || 1;
    scorri(g, (dir.x / len) * velocita * dt, (dir.y / len) * velocita * dt, this.mappa);
    g.ang = Math.atan2(dir.y, dir.x);
  }

  /**
   * La PIANTA: tutto quello che dentro un settore non cambia mai, o cambia
   * una volta ogni tanto. Si manda quando serve e non venti volte al secondo.
   *
   * Prima ci stava dentro la fotografia, e ogni cinquantesimo di secondo
   * partivano di nuovo le posizioni dei server da spegnere, quelle delle casse
   * e i nomi dei giocatori — roba che non si era mossa di un pixel. Erano piu'
   * di un quarto del traffico, speso per ripetere cose gia' dette.
   */
  pianta() {
    const identita = [];
    for (const p of this.giocatori.values()) {
      if (!p.online) continue;
      identita.push({ i: p.id, n: p.nome, r: p.ruolo, b: p.bot ? 1 : 0 });
    }

    return {
      t: 'pianta',
      settore: this.settore,
      diQuanti: SETTORI_PER_FINIRE,
      vt: this.vittoria ? 1 : 0,
      md: this.modalita,
      g: identita,
      nuclei: this.nuclei.map((k) => ({
        x: Math.round(k.x),
        y: Math.round(k.y),
        o: Math.round((k.ang ?? 0) * 100) / 100,
      })),
      es: { x: Math.round(this.estrazione.x), y: Math.round(this.estrazione.y) },
      bo: this.bomba
        ? { sx: Math.round(this.bomba.sito.x), sy: Math.round(this.bomba.sito.y), q: this.bomba.quante }
        : null,
      zo: this.zona
        ? { x: Math.round(this.zona.x), y: Math.round(this.zona.y), r: this.zona.raggio }
        : null,
      // Il binario sta nella pianta: e' disegnato una volta e non si muove
      // piu'. Mandarlo venti volte al secondo sarebbe stato il pezzo piu'
      // pesante di tutta la fotografia, per una cosa che non cambia mai.
      ar: this.mappa.arena
        ? {
            porte: this.mappa.arena.porte.map((q) => [q.tx, q.ty]),
            oltre: this.mappa.arena.oltre,
          }
        : null,
      cv: this.convoglio
        ? { via: this.convoglio.binario.map((q) => [Math.round(q.x), Math.round(q.y)]) }
        : null,
      // Le stazioni non spariscono mai: restano disegnate, spente per chi le ha
      // gia' usate. Vederne una gia' consumata e sapere che non serve piu' e'
      // un'informazione; vedere il vuoto dove era non lo e'.
      // Le casse non si consumano: chi le ha gia' usate non interessa piu' a
      // nessuno, e nella pianta resta solo dove sono e come sono girate.
      st: (this.stazioni ?? []).map((z, i) => ({
        i,
        x: Math.round(z.x),
        y: Math.round(z.y),
        o: Math.round((z.ang ?? 0) * 100) / 100,
      })),
      ri: this.rifornimenti.map((r, i) => ({
        i,
        x: Math.round(r.x),
        y: Math.round(r.y),
        u: r.usatoDa,
      })),
    };
  }

  /**
   * La fotografia: solo quello che si muove. Nomi corti e campi taciuti quando
   * valgono il solito — un nemico intero, in ronda e non marcato manda tre
   * campi in meno, e i nemici sono la parte piu' grossa del pacchetto.
   *
   * Chi legge deve mettere i valori di riposo al posto di quelli che mancano:
   * lo fa `rete.js` una volta sola, negli accessi.
   */
  istantanea(ora = Date.now()) {
    const g = [];
    for (const p of this.giocatori.values()) {
      if (!p.online) continue;
      const uno = {
        i: p.id,
        // Due decimali, non uno: il telefono riparte da questo numero per
        // rifare i conti, e vicino a un muro un decimo di pixel basta a
        // cambiare se un passo si aggancia allo spigolo oppure no.
        x: Math.round(p.x * 100) / 100,
        y: Math.round(p.y * 100) / 100,
        a: Math.round(p.ang * 100) / 100,
        s: p.ultimoSeq ?? 0, // ultimo comando eseguito: serve a rifare i conti
        v: Math.round(p.vita),
        ar: Math.round(p.armatura),
        l: p.torcia ? 1 : 0,
        ca: Math.round(p.carica * 100) / 100,
        // I colpi in canna cambiano a ogni sparo, quindi viaggiano sempre.
        co: p.colpi,
      };
      // Tutto il resto solo quando c'e' davvero qualcosa da dire.
      if (p.stato !== STATO.VIVO) {
        uno.st = p.stato;
        uno.tc = Math.round(p.stato === STATO.CRITICO ? p.criticoRimasto : p.rientroRimasto);
      }
      if (p.rianima > 0) uno.rn = Math.round(p.rianima * 100) / 100;
      if (p.esaurita) uno.es = 1;
      if (p.abilitaRicarica > 0) uno.ab = Math.round(p.abilitaRicarica * 10) / 10;
      // Le scorte e la ricarica cambiano di rado: si dicono solo quando non
      // sono al valore di riposo, come tutto il resto della fotografia magra.
      if (p.riserve !== munizioniDi(p.ruolo).caricatori - 1) uno.rs = p.riserve;
      if (p.ricaricaArma > 0) uno.rc = Math.round(p.ricaricaArma * 10) / 10;
      if ((p.ripari ?? RIPARI_PER_SETTORE) !== RIPARI_PER_SETTORE) uno.rp = p.ripari;
      const allaStazione = this.quantoAllaStazione(p);
      if (allaStazione > 0) uno.sz = Math.round(allaStazione * 100) / 100;
      if (this.portaLaBomba(p)) uno.bo = 1;
      g.push(uno);
    }

    const vitaPiena = NEMICI.pattugliatore.vita;
    const n = this.nemici.map((e) => {
      const uno = {
        i: e.id,
        x: Math.round(e.x * 10) / 10,
        y: Math.round(e.y * 10) / 10,
        a: Math.round(e.ang * 100) / 100,
      };
      if (e.vita < vitaPiena) uno.v = Math.round(e.vita);
      if (e.umore !== UMORE.PATTUGLIA) uno.u = e.umore;
      if (e.marcatoResta > 0) uno.m = 1;
      return uno;
    });

    const c = this.proiettili.map((p) => ({
      i: p.id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      e: p.daNemico ? 1 : 0,
    }));

    // I kit fanno anche un po' di luce: uno da terra si deve poter trovare
    // al buio, altrimenti lasciarlo dietro non serve a niente.
    const fu = this.kit.map((k, i) => ({
      i,
      x: Math.round(k.x),
      y: Math.round(k.y),
      r: 74,
      resta: Math.round(k.resta * 10) / 10,
      kit: 1,
    }));

    const so = this.sonar.map((s, i) => ({
      i,
      x: Math.round(s.x),
      y: Math.round(s.y),
      r: s.raggio,
      resta: Math.round(s.resta * 10) / 10,
    }));

    // I ripari: posizione, verso e quanto sono malmessi. Il telefono ha
    // bisogno anche del verso, sia per disegnarli sia per prevedere il proprio
    // rallentamento mentre li scavalca.
    const rp = this.ripari.map((r) => ({
      i: r.id,
      x: Math.round(r.x),
      y: Math.round(r.y),
      a: Math.round(r.ang * 100) / 100,
      v: Math.round((r.vita / RIPARO.vita) * 100) / 100,
    }));

    const sp = this.scoppi.map((e, i) => ({
      i,
      x: Math.round(e.x),
      y: Math.round(e.y),
      resta: Math.round(e.resta * 100) / 100,
    }));

    // Gli obiettivi, solo per la parte che si muove. Dove stanno le cose lo
    // dice la pianta; qui si dice come stanno.
    const ob = {};
    if (this.preparazione > 0) ob.pr = Math.round(this.preparazione * 10) / 10;
    if (this.allarme) ob.al = 1;
    if (this.disfatta) ob.fine = 1;
    if (this.missioneFatta) ob.fatto = 1;
    if (this.nuclei.length) {
      // Due numeri per nucleo, in fila: l'abbinamento con la pianta e' per
      // posizione, e dentro un settore l'ordine non cambia mai.
      ob.nu = this.nuclei.map((k) => [k.attivo ? 1 : 0, Math.round(k.progresso * 100) / 100]);
    }
    if (this.estrazione.aperta) ob.ea = 1;
    if (this.estrazione.progresso > 0) ob.ep = Math.round(this.estrazione.progresso * 100) / 100;
    if (this.bomba) {
      ob.bo = {
        st: this.bomba.stato,
        x: Math.round(this.bomba.x),
        y: Math.round(this.bomba.y),
        t: Math.max(0, Math.round(this.bomba.tempo)),
        n: this.bomba.fatte,
      };
      if (this.bomba.posa > 0) ob.bo.p = Math.round(this.bomba.posa * 100) / 100;
      if (this.bomba.portata) ob.bo.da = this.bomba.portata;
      if (this.bomba.contesa) ob.bo.c = 1;
    }
    if (this.zona) {
      ob.zo = { p: Math.round(this.zona.progresso * 100) / 100 };
      if (this.zona.contesa) ob.zo.c = 1;
    }
    if (this.convoglio) {
      ob.cv = {
        x: Math.round(this.convoglio.x),
        y: Math.round(this.convoglio.y),
        q: Math.round(this.convoglio.quanto * 1000) / 1000,
        t: Math.max(0, Math.round(this.convoglio.tempo)),
      };
      if (this.convoglio.scortato) ob.cv.s = 1;
    }
    if (this.boss) {
      ob.bs = {
        x: Math.round(this.boss.x),
        y: Math.round(this.boss.y),
        a: Math.round(this.boss.ang * 100) / 100,
        v: Math.max(0, Math.round(this.boss.vita)),
        vp: this.boss.vitaPiena,
      };
    }
    // Le porte servono alla PREVISIONE, non solo al disegno: il telefono deve
    // sapere se puo' passare, sennò prevede di passare e viene tirato indietro.
    if (this.porteAperte) ob.po = 1;

    return {
      t: 'stato',
      tick: this.tick,
      ms: ora,
      g, n, c, fu, so, rp, sp, ob,
      su: this.rumori.daSpedire([...this.giocatori.values()].filter((p) => p.online)),
    };
  }
}

/** Differenza fra due angoli, riportata fra -pi greco e +pi greco. */
function differenzaAngolo(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Quanto e' lungo un binario, in pixel percorsi. */
function lunghezzaDelBinario(punti) {
  let somma = 0;
  for (let k = 1; k < punti.length; k++) {
    somma += Math.hypot(punti[k].x - punti[k - 1].x, punti[k].y - punti[k - 1].y);
  }
  return Math.max(1, somma);
}

/**
 * Il punto a una certa frazione del binario.
 *
 * Si cammina lungo la spezzata invece di interpolare fra il primo e l'ultimo
 * punto: i tratti non sono lunghi uguali — un corridoio diritto fa passi
 * lunghi, una curva ne fa tanti corti — e interpolare sull'indice farebbe
 * scattare il convoglio ogni volta che il percorso gira.
 */
function puntoSulBinario(punti, quanto) {
  if (punti.length < 2) return { ...punti[0] };
  const bersaglio = lunghezzaDelBinario(punti) * Math.max(0, Math.min(1, quanto));
  let fatto = 0;
  for (let k = 1; k < punti.length; k++) {
    const tratto = Math.hypot(punti[k].x - punti[k - 1].x, punti[k].y - punti[k - 1].y);
    if (fatto + tratto >= bersaglio) {
      const dentro = tratto > 0 ? (bersaglio - fatto) / tratto : 0;
      return {
        x: punti[k - 1].x + (punti[k].x - punti[k - 1].x) * dentro,
        y: punti[k - 1].y + (punti[k].y - punti[k - 1].y) * dentro,
      };
    }
    fatto += tratto;
  }
  return { ...punti[punti.length - 1] };
}

function statoIniziale(ruolo = CLASSE_PREDEFINITA) {
  const m = munizioniDi(ruolo);
  return {
    vita: VITA_MASSIMA,
    armatura: ARMATURA_INIZIALE,
    stato: STATO.VIVO,
    rianima: 0,
    criticoRimasto: 0,
    rientroRimasto: 0,
    ricarica: 0,
    torcia: true,
    carica: 1,
    esaurita: false,
    abilitaRicarica: 0,
    passoRumore: 0,
    codaVuota: 0,
    // Uno in canna e gli altri in tasca. Il conto e' per classe: chi spara a
    // raffica ne ha di piu' e ne consuma di piu'.
    colpi: m.caricatore,
    riserve: m.caricatori - 1,
    ricaricaArma: 0,
    ripari: RIPARI_PER_SETTORE,
  };
}

/** Rimettere il caricatore: costa tempo, ed e' il tempo in cui non si spara. */
function ricaricaArma(g) {
  const m = munizioniDi(g.ruolo);
  if (g.colpi > 0 || g.riserve <= 0 || g.ricaricaArma > 0) return false;
  g.ricaricaArma = m.ricarica;
  return true;
}

/**
 * Ricaricare quando si vuole, senza aspettare di restare a secco.
 *
 * E' il caso che conta davvero: dodici colpi su venti e una porta da aprire.
 * Li' si vuole poter decidere di riempire PRIMA, invece di scoprire a meta'
 * sparatoria che ne restavano tre.
 *
 * I colpi che restavano in canna si perdono, e non e' una svista: e' l'unica
 * cosa che rende la scelta una scelta. Se non costassero niente si
 * ricaricherebbe dopo ogni raffica e tanto varrebbe non contarli.
 */
function ricaricaAMano(g) {
  const m = munizioniDi(g.ruolo);
  if (g.ricaricaArma > 0 || g.riserve <= 0 || g.colpi >= m.caricatore) return false;
  g.colpi = 0; // quelli in canna se ne vanno con il caricatore
  g.ricaricaArma = m.ricarica;
  return true;
}
