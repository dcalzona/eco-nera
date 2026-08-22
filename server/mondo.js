// La simulazione autoritativa. Gira solo qui, sul PC: i telefoni mandano
// input e ricevono fotografie dello stato. Tutta la logica di gioco si
// scrive e si controlla da questo lato, con i messaggi nel terminale,
// invece che dentro una WebView su un telefono.

import { MAPPA, PARTENZE, centroCasella, pavimenti, muro } from '../client/condiviso/mappa.js';
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
  VELOCITA_CRITICO,
} from '../client/condiviso/regole.js';
import { creaNemici, passoNemici, chiVede, NEMICI_IN_CAMPO } from './nemici.js';
import { creaColpo, passoProiettili } from './proiettili.js';
import { campo, passoVerso } from './navigazione.js';

const RUOLI = ['faro', 'eco'];

/** Quanto sopravvive un personaggio dopo che il telefono si scollega. */
const GRAZIA_MS = 30_000;

/** Mezzo lato del bersaglio di un personaggio, per i colpi. */
const CORPO = 11;

export class Mondo {
  constructor() {
    this.mappa = MAPPA;
    this.giocatori = new Map(); // id -> personaggio
    this.prossimoId = 1;
    this.tick = 0;
    this.fantoccio = null;
    this.caselleLibere = pavimenti(this.mappa);
    this.nemici = creaNemici(this.mappa);
    this.proiettili = [];
    this.campoGiocatori = null;
    this.attesaRinforzi = 0;
  }

  entra(sessione, nome) {
    // Stessa sessione = stesso personaggio: un ricaricamento della pagina o
    // lo schermo che si spegne non fanno ricominciare da capo.
    for (const g of this.giocatori.values()) {
      if (g.sessione === sessione) {
        g.online = true;
        g.scollegatoDa = null;
        return g;
      }
    }

    const id = this.prossimoId++;
    const usati = [...this.giocatori.values()].filter((g) => !g.bot).map((g) => g.ruolo);
    const ruolo = RUOLI.find((r) => !usati.includes(r)) ?? RUOLI[usati.length % RUOLI.length];
    const posto = PARTENZE[(id - 1) % PARTENZE.length];
    const p = centroCasella(this.mappa, posto.tx, posto.ty);

    const g = {
      id,
      sessione,
      nome: nome || (ruolo === 'faro' ? 'Faro' : 'Eco'),
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
    g.coda.push({ seq: Number(msg.q) || 0, mx: m.x, my: m.y, ax: a.x, ay: a.y, f: msg.f ? 1 : 0 });
    // Se il telefono e' molto avanti (e' successo qualcosa alla rete) non si
    // accumula all'infinito: si buttano i comandi piu' vecchi.
    while (g.coda.length > 60) g.coda.shift();
  }

  passo(dt) {
    this.tick++;
    const ora = Date.now();

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

    // Un solo campo di distanze per tutti i nemici: chi insegue scende lungo
    // la discesa piu' ripida e finisce naturalmente sul giocatore piu' vicino.
    const inPiedi = this.inPiedi();
    this.campoGiocatori = inPiedi.length ? campo(this.mappa, inPiedi) : null;

    passoNemici(this.mappa, this.nemici, inPiedi, this.campoGiocatori, dt, (n, ang, regola) => {
      this.proiettili.push(
        creaColpo(n.id, n.x, n.y, ang, regola.danno, regola.gittata, regola.velocitaColpo, true),
      );
    });

    passoProiettili(this.mappa, this.proiettili, dt, (c) => this.chiHoColpito(c));

    this.ripopola(dt);
    this.regolaFantoccio();
  }

  /**
   * La mappa non deve svuotarsi. Ogni tanto arriva un rinforzo, lontano da chi
   * gioca: senza, dopo mezz'ora di prove si gira per stanze deserte. Quando ci
   * saranno le spedizioni vere questo diventera' il ritmo di una missione.
   */
  ripopola(dt) {
    if (this.nemici.length >= NEMICI_IN_CAMPO) return;
    this.attesaRinforzi -= dt;
    if (this.attesaRinforzi > 0) return;
    this.attesaRinforzi = 12;

    const lontanoDa = [...this.giocatori.values()].filter((g) => g.online || g.bot);
    const nuovo = creaNemici(this.mappa, 1, lontanoDa)[0];
    if (nuovo) this.nemici.push(nuovo);
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

      const velocita = g.stato === STATO.CRITICO ? VELOCITA_CRITICO : undefined;
      muovi(g, c.mx, c.my, SOTTOPASSO, this.mappa, velocita);
      const a = angolo(c.ax, c.ay) ?? angolo(c.mx, c.my);
      if (a !== null) g.ang = a;

      g.ricarica = Math.max(0, g.ricarica - SOTTOPASSO);
      if (c.f && g.stato === STATO.VIVO) this.sparaGiocatore(g);
    }
  }

  sparaGiocatore(g) {
    if (g.ricarica > 0) return;
    const arma = ARMI[g.ruolo] ?? ARMI.faro;
    g.ricarica = arma.cadenza;
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
          g.ang + centro + sbandata,
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
      const posto = PARTENZE[(g.id - 1) % PARTENZE.length];
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

    if (umani === 1 && !this.fantoccio) {
      const id = this.prossimoId++;
      // Accanto a chi sta giocando: un compagno di prova che nasce dall'altra
      // parte della mappa non si vede mai, ed e' il motivo per cui esiste.
      const umano = [...this.giocatori.values()].find((g) => !g.bot && g.online);
      const posto = this.casellaLiberaVicino(umano, 3) ?? PARTENZE[1];
      const p = centroCasella(this.mappa, posto.tx, posto.ty);
      this.fantoccio = {
        id,
        sessione: null,
        nome: 'Fantoccio',
        ruolo: 'eco',
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

    // Poi: se vede un nemico, gli spara.
    const preda = chiVede(this.mappa, g, { vista: 330, cono: Math.PI * 2 }, this.nemici);
    if (preda) {
      g.ang = Math.atan2(preda.y - g.y, preda.x - g.x);
      if (g.ricarica === 0) this.sparaGiocatore(g);
      return;
    }

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
      });
    }

    const n = this.nemici.map((e) => ({
      i: e.id,
      x: Math.round(e.x * 10) / 10,
      y: Math.round(e.y * 10) / 10,
      a: Math.round(e.ang * 100) / 100,
      v: Math.round(e.vita),
      u: e.umore,
    }));

    const c = this.proiettili.map((p) => ({
      i: p.id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      e: p.daNemico ? 1 : 0,
    }));

    return { t: 'stato', tick: this.tick, ms: ora, g, n, c };
  }
}

function statoIniziale() {
  return {
    vita: VITA_MASSIMA,
    stato: STATO.VIVO,
    rianima: 0,
    criticoRimasto: 0,
    rientroRimasto: 0,
    ricarica: 0,
  };
}
