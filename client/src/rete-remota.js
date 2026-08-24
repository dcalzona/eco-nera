// Il telefono invitato.
//
// E' `Rete` — quella che parla col server sul PC — con la presa cambiata: al
// posto della WebSocket c'e' un canale WebRTC verso il telefono di chi ospita.
// Tutto il resto e' identico, e non per pigrizia: previsione, riconciliazione,
// cuscino elastico e comandi raggruppati sono la parte del progetto costata
// piu' fatica, e riscriverla per un trasporto diverso vorrebbe dire avere due
// versioni da tenere d'accordo per sempre.
//
// I comandi vanno sul canale affidabile e non su quello veloce. E' una scelta,
// e va detta: un comando perso lascerebbe un buco nella catena dei sottopassi,
// e la previsione del telefono e la verita' di chi ospita prenderebbero strade
// diverse senza rimedio. Le fotografie invece si possono perdere volentieri —
// quella dopo rimpiazza quella prima — e infatti arrivano dal canale veloce.

import { Rete } from './rete.js';
import { nuovaPresa, rispondiAInvito } from './segnale.js';

export class ReteRemota extends Rete {
  constructor() {
    super();
    this.invitata = true;
    this.presa = null;
    this.controllo = null;
    this.canaleGioco = null;
    this.stato = 'menu';
    this.collegamento = 'spento';
  }

  // --- la presa, cambiata --------------------------------------------------
  pronta() {
    return this.controllo?.readyState === 'open';
  }

  inApertura() {
    return !!this.presa && !this.pronta();
  }

  spedisci(oggetto) {
    if (!this.pronta()) return false;
    try {
      this.controllo.send(JSON.stringify(oggetto));
    } catch {
      return false;
    }
    return true;
  }

  /** Non c'e' niente da comporre: si aspetta un invito. */
  avvia() {
    if (this.spento) return;
    this.stato = 'menu';
    this.chiediClasse?.();
  }

  /**
   * Prende il codice dell'invito e restituisce quello di risposta, da
   * rimandare a chi ospita. Da li' in poi il filo si tende da solo.
   */
  async rispondi(codice) {
    this.chiudiPresa();
    const presa = nuovaPresa();
    this.presa = presa;
    this.collegamento = 'collego';

    // I canali li apre chi invita: qui si aspetta di vederseli arrivare.
    presa.ondatachannel = (e) => {
      const canale = e.channel;
      if (canale.label === 'controllo') {
        this.controllo = canale;
        canale.onmessage = (m) => this.ricevi(JSON.parse(m.data));
        canale.onopen = () => {
          this.collegamento = 'aperto';
          this.tentativi = 0;
          clearInterval(this.battito);
          this.battito = setInterval(
            () => this.spedisci({ t: 'ping', c: performance.now() }),
            1000,
          );
          // Se si era gia' scelta una classe (si e' premuto Entra mentre il
          // filo si tendeva) si entra da soli.
          if (this.classe) this.entra(this.classe, this.solo);
          this.chiediClasse?.();
        };
        canale.onclose = () => this.filoCaduto();
      } else {
        this.canaleGioco = canale;
        canale.onmessage = (m) => this.ricevi(JSON.parse(m.data));
      }
    };

    presa.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(presa.connectionState)) {
        this.filoCaduto();
      }
    };

    return rispondiAInvito(presa, codice);
  }

  filoCaduto() {
    clearInterval(this.battito);
    if (this.spento) return;
    this.collegamento = 'caduto';
    // In partita lo si dice a chi gioca; nel menu si resta nel menu, dove c'e'
    // il modo di farsi mandare un altro invito.
    if (this.stato === 'dentro' || this.stato === 'caduto') this.stato = 'caduto';
  }

  chiudiPresa() {
    clearInterval(this.battito);
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

  lascia() {
    this.svuotaComandi();
    this.spedisci({ t: 'esci' });
    this.stato = 'menu';
    this.classe = null;
    this.io = null;
    this.fotografie.length = 0;
  }

  spegni() {
    this.spento = true;
    this.chiudiPresa();
    this.collegamento = 'spento';
  }
}
