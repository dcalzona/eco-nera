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
    if (!this.mondo) this.mondo = new Mondo();

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

  giroDelMondo() {
    if (!this.mondo) return;
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

      // Settore nuovo: prima la mappa, poi le fotografie. Nell'ordine
      // contrario si disegnerebbero per un istante i personaggi nuovi sulla
      // pianta vecchia.
      if (this.mondo.mappaCambiata) {
        this.mondo.mappaCambiata = false;
        this.mappa = this.mondo.mappa;
        this.settore = this.mondo.settore;
        this.fotografie.length = 0;
        this.versioneMappa++;
      }

      // La pianta prima della fotografia, come fa il server vero: la
      // fotografia parla per posizioni che solo la pianta conosce.
      if (this.mondo.piantaCambiata) {
        this.mondo.piantaCambiata = false;
        this.ricevi(this.mondo.pianta());
      }

      this.ricevi(this.mondo.istantanea(this.oraSim));
    }
  }

  /**
   * I comandi. Si arrotondano come li arrotonderebbe la rete: il server vero
   * riceve tre decimali, e il telefono prevede con il numero pieno. E' uno
   * scarto minuscolo, ma e' uno scarto che esiste in casa — e allora deve
   * esistere anche qui, o le due partite non sono piu' la stessa partita.
   */
  mandaPasso(seq, io) {
    if (!this.mondo || this.io === null) return;
    const tondo = (v) => Math.round(v * 1000) / 1000;
    this.mondo.input(this.io, {
      q: seq,
      mx: tondo(io.mx),
      my: tondo(io.my),
      ax: tondo(io.ax),
      ay: tondo(io.ay),
      f: io.spara ? 1 : 0,
      l: io.torcia ? 1 : 0,
      b: io.abilita ? 1 : 0,
    });
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
