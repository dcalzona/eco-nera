// La simulazione autoritativa. Gira solo qui, sul PC: i telefoni mandano
// input e ricevono fotografie dello stato. Tutta la logica di gioco si
// scrive e si controlla da questo lato, con i messaggi nel terminale,
// invece che dentro una WebView su un telefono.

import { centroCasella, pavimenti, muro } from '../client/condiviso/mappa.js';
import { generaMappa, centroStanza } from '../client/condiviso/generatore.js';
import { muovi, limita, angolo, scorri } from '../client/condiviso/fisica.js';
import {
  TILE,
  SOTTOPASSO,
  SOTTOPASSI_PER_TICK,
  VITA_MASSIMA,
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
} from '../client/condiviso/regole.js';
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
    this.tuttiGiu = 0;
    this.disfatta = false;
    this.nuovoSettore(1);
  }

  /**
   * Un settore nuovo: mappa nuova, nuclei sparsi nelle stanze lontane,
   * estrazione al punto di ingresso. Si entra, si accende quello che c'e' da
   * accendere e si torna indietro — e tornare indietro non e' una formalita',
   * perche' nel frattempo la mappa si e' svegliata.
   */
  nuovoSettore(numero) {
    this.settore = numero;
    this.mappa = generaMappa(Date.now() + numero * 7717, numero);
    this.caselleLibere = pavimenti(this.mappa);
    this.rumori = new Rumori(this.mappa);
    this.proiettili = [];
    this.kit = [];
    this.sonar = [];
    this.tuttiGiu = 0;

    // I nuclei vanno nelle stanze piu' lontane dall'ingresso: vicini
    // renderebbero il settore una formalita'.
    const ingresso = this.mappa.stanze[0];
    const lontane = this.mappa.stanze
      .slice(1)
      .map((s) => ({ s, d: Math.hypot(s.x - ingresso.x, s.y - ingresso.y) }))
      .sort((a, b) => b.d - a.d);
    const quanti = Math.min(SPEDIZIONE.nucleiMax, SPEDIZIONE.nucleiBase + Math.floor(numero / 2));
    this.nuclei = lontane.slice(0, quanti).map(({ s }) => ({
      ...centroStanza(s),
      attivo: false,
      progresso: 0,
    }));

    this.estrazione = { ...centroStanza(ingresso), aperta: false, progresso: 0 };
    this.allarme = false;
    this.prossimoRichiamo = 0;

    this.nemiciBase = Math.min(SPEDIZIONE.nemiciMax, SPEDIZIONE.nemiciBase + numero);
    this.nemici = creaNemici(this.mappa, this.tettoNemici());

    for (const g of this.giocatori.values()) this.riportaAllIngresso(g);
    this.mappaCambiata = true;
    console.log(`
=== Settore ${numero}: ${quanti} nuclei, ${this.nemici.length} nemici ===`);
  }

  riportaAllIngresso(g) {
    const posto = this.mappa.partenze[(g.id - 1) % this.mappa.partenze.length];
    const p = centroCasella(this.mappa, posto.tx, posto.ty);
    g.x = p.x;
    g.y = p.y;
    g.vita = VITA_MASSIMA;
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
    return g;
  }

  esce(id) {
    const g = this.giocatori.get(id);
    if (!g) return;
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
    this.battonoISonar(dt);
    this.consumaTorce(dt);

    // Un solo campo di distanze per tutti i nemici: chi insegue scende lungo
    // la discesa piu' ripida e finisce naturalmente sul giocatore piu' vicino.
    const inPiedi = this.inPiedi();
    this.campoGiocatori = inPiedi.length ? campo(this.mappa, inPiedi) : null;

    passoNemici(this.mappa, this.nemici, inPiedi, this.campoGiocatori, dt, (n, ang, regola) => {
      this.proiettili.push(
        creaColpo(n.id, n.x, n.y, ang, regola.danno, regola.gittata, regola.velocitaColpo, true),
      );
      // Anche i loro spari si sentono, e chiamano i compagni.
      this.rumori.emetti('sparoNemico', n.x, n.y, -n.id);
    }, this.allarme);

    passoProiettili(this.mappa, this.proiettili, dt, (c) => this.chiHoColpito(c));

    this.ascoltano();
    this.sbiadisciMarchi(dt);
    this.obiettivi(dt);
    this.controllaDisfatta(dt);
    this.ripopola(dt);
    this.regolaFantoccio();
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
    } else if (regola.tipo === 'scatto') {
      g.scattoResta = regola.durata;
      console.log(`${g.nome} scatta.`);
    }

    g.abilitaRicarica = regola.ricarica;
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
   * Gli obiettivi del settore. Accendere un nucleo vuole qualche secondo fermi
   * accanto: e' il momento in cui si e' scoperti, e per questo conviene essere
   * in due — uno accende, l'altro guarda le spalle.
   */
  obiettivi(dt) {
    const vivi = this.inPiedi();

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
        console.log(restano ? `Nucleo acceso, ne restano ${restano}.` : 'Tutti i nuclei accesi: si torna indietro.');
      }
    }

    const eranoTutti = this.estrazione.aperta;
    this.estrazione.aperta = this.nuclei.every((n) => n.attivo);
    if (this.estrazione.aperta && !eranoTutti) {
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
    this.attesaRinforzi = this.allarme ? ALLARME.rinforzi : 12;

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

    for (let k = 0; k < quanti; k++) {
      const c = g.coda.shift();
      if (!c) break;
      g.ultimoSeq = c.seq;
      if (g.stato === STATO.MORTO) continue;

      g.scattoResta = Math.max(0, g.scattoResta - SOTTOPASSO);
      const velocita =
        g.stato === STATO.CRITICO
          ? VELOCITA_CRITICO
          : g.scattoResta > 0
            ? VELOCITA * ABILITA.assalto.moltiplicatore
            : undefined;
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
      console.log('Il fantoccio si fa da parte: siete in due.');
      return;
    }

    // Chi ha scelto di giocare da solo, gioca da solo.
    if (umani === 1 && this.daSoli()) {
      if (this.fantoccio) {
        this.giocatori.delete(this.fantoccio.id);
        this.fantoccio = null;
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

    // E se il compagno sta accendendo un nucleo, gli da' una mano: in due ci
    // vuole meta' tempo, ed e' proprio il momento in cui si e' scoperti.
    const daAccendere = umano
      ? this.nuclei.find(
          (n) => !n.attivo && Math.hypot(umano.x - n.x, umano.y - n.y) <= SPEDIZIONE.raggioNucleo,
        )
      : null;
    if (daAccendere) {
      if (Math.hypot(daAccendere.x - g.x, daAccendere.y - g.y) > SPEDIZIONE.raggioNucleo * 0.6) {
        this.trascina(g, daAccendere, 155, dt);
        return;
      }
      this.copri(g);
      return;
    }

    // Poi: se vede un nemico, gli spara.
    if (this.copri(g)) return;

    // Altrimenti gira nei paraggi, come prima.
    if (!g.meta || Math.hypot(g.meta.x - g.x, g.meta.y - g.y) < 12) {
      const c =
        this.casellaLiberaVicino(umano, 8) ??
        this.caselleLibere[(Math.random() * this.caselleLibere.length) | 0];
      g.meta = centroCasella(this.mappa, c.tx, c.ty);
    }
    const dx = g.meta.x - g.x;
    const dy = g.meta.y - g.y;
    const len = Math.hypot(dx, dy) || 1;
    const primaX = g.x;
    const primaY = g.y;
    muovi(g, dx / len, dy / len, dt, this.mappa);
    if (Math.hypot(g.x - primaX, g.y - primaY) < 0.4) g.meta = null;
    g.ang = Math.atan2(dy, dx);
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

  /** La fotografia da spedire ai client. Nomi corti: viaggia 20 volte al secondo. */
  istantanea(ora = Date.now()) {
    const g = [];
    for (const p of this.giocatori.values()) {
      if (!p.online) continue;
      g.push({
        i: p.id,
        // Due decimali, non uno: il telefono riparte da questo numero per
        // rifare i conti, e vicino a un muro un decimo di pixel basta a
        // cambiare se un passo si aggancia allo spigolo oppure no.
        x: Math.round(p.x * 100) / 100,
        y: Math.round(p.y * 100) / 100,
        a: Math.round(p.ang * 100) / 100,
        n: p.nome,
        r: p.ruolo,
        b: p.bot ? 1 : 0,
        s: p.ultimoSeq ?? 0, // ultimo comando eseguito: serve al telefono per rifare i conti
        v: Math.round(p.vita),
        st: p.stato,
        rn: Math.round(p.rianima * 100) / 100,
        tc: Math.round(p.stato === STATO.CRITICO ? p.criticoRimasto : p.rientroRimasto),
        l: p.torcia ? 1 : 0,
        ca: Math.round(p.carica * 100) / 100,
        es: p.esaurita ? 1 : 0,
        ab: Math.round(p.abilitaRicarica * 10) / 10,
        sc: Math.round(p.scattoResta * 10) / 10,
      });
    }

    const n = this.nemici.map((e) => ({
      i: e.id,
      x: Math.round(e.x * 10) / 10,
      y: Math.round(e.y * 10) / 10,
      a: Math.round(e.ang * 100) / 100,
      v: Math.round(e.vita),
      u: e.umore,
      m: e.marcatoResta > 0 ? 1 : 0,
    }));

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

    const ob = {
      settore: this.settore,
      nuclei: this.nuclei.map((k) => ({
        x: Math.round(k.x),
        y: Math.round(k.y),
        a: k.attivo ? 1 : 0,
        p: Math.round(k.progresso * 100) / 100,
      })),
      al: this.allarme ? 1 : 0,
      fine: this.disfatta ? 1 : 0,
      es: {
        x: Math.round(this.estrazione.x),
        y: Math.round(this.estrazione.y),
        a: this.estrazione.aperta ? 1 : 0,
        p: Math.round(this.estrazione.progresso * 100) / 100,
      },
    };

    return { t: 'stato', tick: this.tick, ms: ora, g, n, c, fu, so, ob, su: this.rumori.daSpedire([...this.giocatori.values()].filter((p) => p.online)) };
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
    stato: STATO.VIVO,
    rianima: 0,
    criticoRimasto: 0,
    rientroRimasto: 0,
    ricarica: 0,
    torcia: true,
    carica: 1,
    esaurita: false,
    abilitaRicarica: 0,
    scattoResta: 0,
    passoRumore: 0,
  };
}
