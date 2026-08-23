// La simulazione autoritativa. Gira solo qui, sul PC: i telefoni mandano
// input e ricevono fotografie dello stato. Tutta la logica di gioco si
// scrive e si controlla da questo lato, con i messaggi nel terminale,
// invece che dentro una WebView su un telefono.

import { centroCasella, pavimenti, muro } from '../condiviso/mappa.js';
import { generaMappa, centroStanza } from '../condiviso/generatore.js';
import { muovi, limita, angolo, scorri, velocitaFraIRipari } from '../condiviso/fisica.js';
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
  constructor() {
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
    this.mappa = generaMappa(Date.now() + numero * 7717, numero);
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
    if (this.modalita === 'bomba') this.preparaBomba(numero, lontane);
    else if (this.modalita === 'dominio') this.preparaDominio(numero, lontane);
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

    this.estrazione = { ...centroStanza(ingresso), aperta: false, progresso: 0 };
    this.allarme = false;
    this.prossimoRichiamo = 0;
    this.prossimaChiamata = 0;

    this.nemiciBase = Math.min(SPEDIZIONE.nemiciMax, SPEDIZIONE.nemiciBase + numero);
    this.nemici = creaNemici(this.mappa, this.tettoNemici());

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
    if (this.disfatta) {
      this.disfatta = false;
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
      ...statoIniziale(),
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
      this.rumori.emetti('passi', g.x, g.y, g.id);
      console.log(`${g.nome} ha piantato un riparo.`);
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
    this.estrazione.progresso += dt / SPEDIZIONE.durataEstrazione;
    if (this.estrazione.progresso >= 1) this.nuovoSettore(this.settore + 1);
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
      // A voi arriva solo qualche scheggia, e solo se siete proprio sopra:
      // la missione vi chiede di restare li', e non puo' poi punirvi per
      // averlo fatto.
      for (const g of this.giocatori.values()) {
        if (g.stato !== STATO.VIVO) continue;
        if (Math.hypot(g.x - b.x, g.y - b.y) > BOMBA.raggioSchegge) continue;
        this.ferisci(g, BOMBA.dannoSchegge);
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

    if (dentroNostri > 0 && !dentroLoro) z.progresso += dt / z.durata;
    else if (dentroNostri === 0) {
      z.progresso = Math.max(0, z.progresso - (dt * DOMINIO.perdita) / z.durata);
    }

    if (z.progresso >= 1) {
      z.progresso = 1;
      this.missioneFatta = true;
      console.log('Zona conquistata.');
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
    return Math.max(3, Math.round(base * (this.daSoli() ? SCONTO_DA_SOLI : 1)));
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
    // In due chi porta la bomba ha le mani occupate: il compagno diventa la
    // sua scorta, ed e' il momento piu' cooperativo del gioco. Da soli invece
    // si spara lo stesso — attraversare mezzo settore disarmati senza nessuno
    // che ti copra non sarebbe difficile, sarebbe solo ingiusto.
    if (this.portaLaBomba(g) && !this.daSoli()) return;
    const arma = ARMI[g.ruolo] ?? ARMI.faro;
    g.ricarica = arma.cadenza;

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
      };
      // Tutto il resto solo quando c'e' davvero qualcosa da dire.
      if (p.stato !== STATO.VIVO) {
        uno.st = p.stato;
        uno.tc = Math.round(p.stato === STATO.CRITICO ? p.criticoRimasto : p.rientroRimasto);
      }
      if (p.rianima > 0) uno.rn = Math.round(p.rianima * 100) / 100;
      if (p.esaurita) uno.es = 1;
      if (p.abilitaRicarica > 0) uno.ab = Math.round(p.abilitaRicarica * 10) / 10;
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

function statoIniziale() {
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
  };
}
