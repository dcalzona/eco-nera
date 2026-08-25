// Il telefono che ospita la partita.
//
// E' `ReteLocale` — il mondo che gira dentro il telefono, quello scritto per
// giocare fuori casa — con in piu' una porta aperta per un'altra persona. Il
// mondo e' lo stesso, la simulazione e' la stessa, la fotografia e' la stessa:
// cambia solo che parte anche da un'altra parte.
//
// E' il modo in cui fanno i giochi cooperativi: uno ospita e l'altro si
// collega. Nessun server dedicato, perche' nessuno dei due deve difendersi
// dall'altro — state giocando insieme contro il computer.
//
// Due canali, e la differenza fra i due e' tutto il motivo per cui si e'
// scelto WebRTC:
//
//   - `controllo` e' affidabile e ordinato, come una presa di rete. Ci passano
//     il benvenuto, la pianta, il cambio di settore, e i comandi di chi gioca:
//     roba che se si perde non si puo' ricostruire.
//   - `gioco` non e' ne' affidabile ne' ordinato. Ci passano solo le
//     fotografie, e per una fotografia arrivare tardi e' peggio che non
//     arrivare: quella dopo la rimpiazza fra cinquanta millisecondi. Su una
//     presa ordinata un pacchetto perso blocca tutti quelli dietro finche' non
//     viene rimandato, ed e' esattamente quello che sulla rete mobile si vede
//     come scatto.

import { ReteLocale } from './rete-locale.js';
import { Mondo } from '../simulazione/mondo.js';
import { TICK_HZ, VERSIONE } from '../condiviso/regole.js';
import { nuovaPresa, creaInvito, accettaRisposta } from './segnale.js';

export class ReteOspite extends ReteLocale {
  constructor() {
    super();
    this.ospito = true;
    this.presa = null;
    this.controllo = null;
    this.canaleGioco = null;
    this.idOspite = null;
    this.statoOspite = 'nessuno'; // nessuno | invitato | collegato | caduto
    this.alCambioOspite = null; // chiamata all'indietro per il menu
  }

  /**
   * Prepara l'invito da mandare all'altro. Il mondo si accende subito, prima
   * ancora che arrivi qualcuno: chi ospita puo' cominciare a giocare e farsi
   * raggiungere dopo, come in qualunque gioco cooperativo.
   */
  async apriInvito() {
    this.chiudiPresa();
    if (!this.mondo) this.mondo = new Mondo(this.difficolta);

    const presa = nuovaPresa();
    this.presa = presa;
    // I canali si aprono prima dell'offerta: e' la loro presenza a finire
    // dentro la descrizione che si manda all'altro.
    this.controllo = presa.createDataChannel('controllo', { ordered: true });
    this.canaleGioco = presa.createDataChannel('gioco', {
      ordered: false,
      maxRetransmits: 0,
    });

    this.controllo.onopen = () => {
      this.statoOspite = 'collegato';
      this.spedisciAOspite({ t: 'ciao', versione: VERSIONE }, true);
      this.alCambioOspite?.(this.statoOspite);
    };
    this.controllo.onclose = () => this.ospiteSeNeVa();
    this.controllo.onmessage = (e) => this.daOspite(JSON.parse(e.data));
    presa.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(presa.connectionState)) {
        this.ospiteSeNeVa();
      }
    };

    this.statoOspite = 'invitato';
    this.alCambioOspite?.(this.statoOspite);
    return creaInvito(presa);
  }

  /** La risposta dell'altro: da qui in poi il filo si tende da solo. */
  async chiudiInvito(codice) {
    if (!this.presa) throw new Error('nessun invito aperto');
    await accettaRisposta(this.presa, codice);
  }

  /**
   * Il compagno se n'e' andato.
   *
   * NON si fa uscire il suo personaggio dal mondo e NON si riparte: si mette
   * tutto in pausa e si aspetta. Puo' essere una galleria, il telefono che ha
   * spento lo schermo, l'app finita in secondo piano — e in tutti e tre i casi
   * fra un minuto e' di nuovo qui. Buttare fuori il personaggio vorrebbe dire
   * che al ritorno ne trova un altro, all'ingresso, senza piu' niente addosso.
   */
  ospiteSeNeVa() {
    if (this.statoOspite === 'collegato') {
      this.statoOspite = 'caduto';
      this.alCambioOspite?.(this.statoOspite);
    }
  }

  /** In partita e senza il compagno: il mondo aspetta. */
  inPausa() {
    return this.stato === 'dentro' && this.statoOspite === 'caduto';
  }

  chiudiPresa() {
    try {
      this.controllo?.close();
      this.canaleGioco?.close();
      this.presa?.close();
    } catch {
      /* gia' chiusa */
    }
    this.controllo = null;
    this.canaleGioco = null;
    this.presa = null;
  }

  /**
   * Il protocollo, dalla parte di chi ospita. Sono le stesse identiche cose
   * che dice `server/server.js` sul PC: chi si collega non sa e non deve
   * sapere se dall'altra parte c'e' un computer o il telefono di sua moglie.
   */
  daOspite(msg) {
    const m = this.mondo;
    if (!m) return;

    if (msg.t === 'entra') {
      const g = m.entra(String(msg.sessione || 'ospite'), null, String(msg.classe || ''), false);
      this.idOspite = g.id;
      this.spedisciAOspite(
        {
          t: 'benvenuto',
          versione: VERSIONE,
          id: g.id,
          ruolo: g.ruolo,
          nome: g.nome,
          tickHz: TICK_HZ,
          mappa: m.mappa,
        },
        true,
      );
      // La pianta subito dopo: la prima fotografia parla per posizioni che
      // solo la pianta conosce.
      this.spedisciAOspite(m.pianta(), true);
      this.alCambioOspite?.(this.statoOspite);
      return;
    }

    if (this.idOspite === null) return;

    if (msg.t === 'input') {
      if (Array.isArray(msg.c)) for (const c of msg.c) m.input(this.idOspite, c);
      else m.input(this.idOspite, msg);
      return;
    }
    if (msg.t === 'pronto') {
      m.pronto(this.idOspite);
      return;
    }
    if (msg.t === 'ping') {
      this.spedisciAOspite({ t: 'pong', c: msg.c, s: Date.now() }, true);
      return;
    }
    if (msg.t === 'esci') {
      m.esce(this.idOspite);
      this.idOspite = null;
      this.alCambioOspite?.(this.statoOspite);
    }
    // Il diario non serve: chi ospita vede gia' tutto da qui.
  }

  spedisciAOspite(oggetto, affidabile) {
    const canale = affidabile ? this.controllo : this.canaleGioco;
    if (!canale || canale.readyState !== 'open') return;
    try {
      canale.send(JSON.stringify(oggetto));
    } catch {
      // Il canale puo' essere pieno: una fotografia persa non e' un guaio,
      // quella dopo arriva fra cinquanta millisecondi.
    }
  }

  /**
   * Tutto quello che il mondo dice va a tutti e due, e va identico: e' la
   * stessa chiamata, non due strade parallele che col tempo divergerebbero.
   * Le fotografie prendono il canale veloce, il resto quello sicuro.
   */
  pubblica(messaggio) {
    super.pubblica(messaggio);
    this.spedisciAOspite(messaggio, messaggio.t !== 'stato');
  }

  lascia() {
    super.lascia();
    this.ospiteSeNeVa();
    this.chiudiPresa();
    this.statoOspite = 'nessuno';
  }

  spegni() {
    super.spegni();
    this.chiudiPresa();
  }
}
