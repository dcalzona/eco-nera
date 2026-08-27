// Il server dentro il telefono.
//
// Fuori casa non c'e' il PC, e senza PC non c'e' partita. Ma la simulazione e'
// gia' scritta in JavaScript puro e non usa niente di Node — solo numeri,
// griglie e Math.random — quindi puo' girare anche dentro l'app. Qui non si
// riscrive il gioco in versione ridotta: si prende `Mondo`, quello vero, e gli
// si mette accanto un orologio.
//
// La classe estende `Rete` e cambia solo il trasporto. Tutto il resto —
// interpolazione, previsione, riconciliazione, briefing — resta il codice di
// prima, quello che e' costato piu' fatica. Se il buio offline si comportasse
// in modo anche solo un po' diverso da quello in casa, ci sarebbero due giochi
// da sistemare invece di uno.

import { Rete } from './rete.js';
import { Mondo } from '../simulazione/mondo.js';
import { TICK_HZ, VERSIONE } from '../condiviso/regole.js';

const PASSO_MS = 1000 / TICK_HZ;

export class ReteLocale extends Rete {
  constructor() {
    super();
    this.locale = true;
    this.mondo = null;
    this.battitoLocale = null;
    this.oraSim = 0;
    this.arretrato = 0;
    this.ultimoOrologio = 0;
    // Non c'e' nessun server da cui essere disallineati: il codice e' uno solo.
    this.versioneServer = VERSIONE;
    this.disallineato = false;
    this.ping = 0;
    this.stato = 'menu';
    this.collegamento = 'aperto'; // il server e' qui dentro: c'e' sempre
    // PROVA BOSS (temporaneo): se c'e', la prossima entrata butta via il
    // mondo di prima e ne fa uno che e' tutto stanze del boss.
    this.provaBoss = null;
  }

  /** Niente da collegare: si va dritti al menu. */
  avvia() {
    this.stato = 'menu';
    this.chiediClasse?.();
  }

  /**
   * Si entra nel proprio mondo. Se ce n'era gia' uno — si era usciti al menu e
   * si rientra — si riprende quello, con la spedizione dov'era: e' lo stesso
   * comportamento che si ha in casa rientrando sul server acceso.
   */
  entra(classe, solo = true) {
    this.classe = classe;
    this.solo = true; // fuori casa si gioca da soli per definizione
    // PROVA BOSS (temporaneo): mondo nuovo, e da qui in poi ogni settore e'
    // una stanza del boss, girando i tre tipi. Cosi' si esce da uno e si
    // entra nel successivo senza rifarsi la campagna ogni volta.
    if (this.provaBoss) {
      this.mondo = new Mondo(this.difficolta);
      this.mondo.soloBoss = true;
      this.mondo.nuovoSettore(this.provaBoss.settore, 'boss', this.provaBoss.tipo);
      this.provaBoss = null;
    }
    if (!this.mondo) this.mondo = new Mondo(this.difficolta);

    const g = this.mondo.entra('telefono', null, classe, true);
    this.io = g.id;
    this.ruolo = g.ruolo;
    this.mappa = this.mondo.mappa;
    this.stato = 'dentro';

    this.fotografie.length = 0;
    this.scarto = null;
    this.versioneMappa++;
    this.oraSim = performance.now();
    this.ultimoOrologio = performance.now();
    this.arretrato = 0;
    this.ricevi(this.mondo.pianta()); // com'e' fatto il settore, prima di tutto
    this.mondo.piantaCambiata = false;
    this.accendiOrologio();
    return true;
  }

  /**
   * Si torna al menu: il mondo resta com'e' ma smette di girare. Lasciarlo
   * andare mentre si guarda il menu vorrebbe dire tornare e trovarsi i nemici
   * addosso, e nessuno capirebbe perche'.
   */
  lascia() {
    if (this.mondo && this.io !== null) this.mondo.esce(this.io);
    clearInterval(this.battitoLocale);
    this.battitoLocale = null;
    this.stato = 'menu';
    this.classe = null;
    this.io = null;
    this.fotografie.length = 0;
  }

  /**
   * L'orologio del mondo, con lo stesso accumulo del server vero: si sveglia
   * piu' spesso del necessario e fa passi di durata fissa. E' la stessa regola
   * per lo stesso motivo — passi di durata diversa danno percorsi diversi
   * appena si sfiora uno spigolo, e il telefono che prevede in anticipo si
   * ritroverebbe a litigare con il mondo che sta ospitando lui stesso.
   */
  accendiOrologio() {
    clearInterval(this.battitoLocale);
    this.battitoLocale = setInterval(() => this.giroDelMondo(), 8);
  }

  /**
   * Il mondo si puo' fermare. Serve a chi ospita quando il compagno sparisce:
   * se continuasse a girare, chi torna fra un minuto ritroverebbe una partita
   * andata avanti senza di lui — nemici spostati, tempo di missione consumato,
   * e nessuna spiegazione. Fermarlo e' l'unico modo perche' "torna" voglia
   * dire davvero tornare.
   */
  inPausa() {
    return false;
  }

  giroDelMondo() {
    if (!this.mondo) return;
    if (this.inPausa()) {
      // Si tiene l'orologio allineato senza far passare il tempo, sennò al
      // ritorno il mondo recupererebbe di colpo tutti i secondi di pausa.
      this.ultimoOrologio = performance.now();
      this.arretrato = 0;
      return;
    }
    const ora = performance.now();
    this.arretrato += ora - this.ultimoOrologio;
    this.ultimoOrologio = ora;
    // Tornando in primo piano dopo che il telefono ha spento lo schermo il
    // ritardo puo' essere enorme: non si recupera mezz'ora a passi da 50 ms,
    // si riparte da adesso.
    if (this.arretrato > 500) this.arretrato = PASSO_MS;

    while (this.arretrato >= PASSO_MS) {
      this.arretrato -= PASSO_MS;
      this.oraSim += PASSO_MS;
      this.mondo.passo(PASSO_MS / 1000);

      // Settore nuovo: prima la mappa, poi la pianta, poi le fotografie.
      // Nell'ordine contrario si disegnerebbero per un istante i personaggi
      // nuovi sulla pianta vecchia.
      if (this.mondo.mappaCambiata) {
        this.mondo.mappaCambiata = false;
        this.pubblica({ t: 'settore', numero: this.mondo.settore, mappa: this.mondo.mappa });
      }
      if (this.mondo.piantaCambiata) {
        this.mondo.piantaCambiata = false;
        this.pubblica(this.mondo.pianta());
      }
      this.pubblica(this.mondo.istantanea(this.oraSim));
    }
  }

  /**
   * Quello che il mondo ha da dire, detto a chi lo sta guardando.
   *
   * Qui c'e' solo se stessi, e per questo e' un metodo di una riga. Ma quando
   * il telefono ospita anche un altro giocatore (`ReteOspite`) la stessa riga
   * diventa il punto in cui la fotografia parte anche dall'altra parte — e
   * parte identica, perche' e' la stessa. Se ci fossero due strade per dire la
   * stessa cosa, prima o poi direbbero cose diverse.
   */
  pubblica(messaggio) {
    this.ricevi(messaggio);
  }

  /**
   * I comandi vanno dritti al mondo che sta qui, ma sono LO STESSO COMANDO che
   * partirebbe per la rete: la forma la fa `Rete.comando`, arrotondamenti
   * compresi. Quando era scritta due volte, una delle due restava indietro.
   */
  mandaPasso(seq, io) {
    if (!this.mondo || this.io === null) return;
    this.mondo.input(this.io, Rete.comando(seq, io));
  }

  mandaPronto() {
    if (this.mondo && this.io !== null) this.mondo.pronto(this.io);
  }

  /** Il diario serve a raccontare al server come va la rete. Qui non c'e' rete. */
  mandaDiario() {}

  usaIndirizzo() {
    return true;
  }
}
