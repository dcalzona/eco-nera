// Il suono, quello che si sente davvero.
//
// Tutto sintetizzato al momento, come la grafica: nel progetto non c'e' un
// file audio. La ragione non e' il peso, e' che qui il suono e' una meccanica.
// Il gioco calcola gia' quanto forte ogni rumore arriva a te tenendo conto dei
// muri; questo modulo prende quel numero e lo trasforma in qualcosa che si
// sente, con il canale giusto — a sinistra se e' successo a sinistra.
//
// Le regole dei browser non permettono di suonare prima di un gesto: si
// accende al primo dito sullo schermo.

const CANALI = { musica: 0.32, effetti: 0.75 };

export class Suoni {
  constructor() {
    this.ctx = null;
    this.acceso = localStorage.getItem('ecoNera.muto') !== '1';
    this.tensione = 0; // 0 = calma, 1 = ti stanno cacciando
    this.battutaProssima = 0;
  }

  /** Da chiamare al primo gesto dell'utente: prima i browser non fanno suonare niente. */
  avvia() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Contesto = window.AudioContext || window.webkitAudioContext;
    if (!Contesto) return;
    this.ctx = new Contesto();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.acceso ? 1 : 0;
    this.master.connect(this.ctx.destination);

    this.busEffetti = this.ctx.createGain();
    this.busEffetti.gain.value = CANALI.effetti;
    this.busEffetti.connect(this.master);

    this.busMusica = this.ctx.createGain();
    this.busMusica.gain.value = CANALI.musica;
    this.busMusica.connect(this.master);

    this.rumoreBuffer = this.creaRumore();
    this.avviaBordone();
    this.costruisciSirena();
  }

  /**
   * App in secondo piano: si zittisce tutto. Senza questo il bordone continua
   * a suonare a icona ridotta e l'unico modo per farlo smettere e' chiudere il
   * gioco. Basta sospendere il contesto: gli oscillatori restano dove sono e
   * al rientro riprendono da li', senza ricostruire niente.
   *
   * A differenza di un gioco per uno solo, qui la partita non si mette in
   * pausa: il server va avanti, e il compagno anche.
   */
  sospendi() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  riprendi() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  /**
   * App in secondo piano: si zittisce tutto. Senza questo il bordone continua
   * a suonare a icona ridotta e l'unico modo per farlo smettere e' chiudere il
   * gioco. Basta sospendere il contesto: gli oscillatori restano dove sono e
   * al rientro riprendono da li', senza ricostruire niente.
   *
   * A differenza di un gioco per uno solo, qui la partita non si mette in
   * pausa: il server va avanti, e il compagno anche.
   */
  sospendi() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  riprendi() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  /**
   * App in secondo piano: si zittisce tutto. Senza questo il bordone continua
   * a suonare a icona ridotta e l'unico modo per farlo smettere e' chiudere il
   * gioco. Basta sospendere il contesto: gli oscillatori restano dove sono e
   * al rientro riprendono da li', senza ricostruire niente.
   *
   * A differenza di un gioco per uno solo, qui la partita non si mette in
   * pausa: il server va avanti, e il compagno anche.
   */
  sospendi() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  riprendi() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  muto(valore) {
    this.acceso = !valore;
    localStorage.setItem('ecoNera.muto', valore ? '1' : '0');
    if (this.master) this.master.gain.value = this.acceso ? 1 : 0;
  }

  /** Mezzo secondo di rumore bianco, riusato da tutti gli effetti che ne hanno bisogno. */
  creaRumore() {
    const lunghezza = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, lunghezza, this.ctx.sampleRate);
    const dati = buffer.getChannelData(0);
    for (let k = 0; k < lunghezza; k++) dati[k] = Math.random() * 2 - 1;
    return buffer;
  }

  // --- I mattoni -----------------------------------------------------------

  /** Una botta di rumore filtrato: spari, colpi, passi. */
  botta({ durata = 0.18, taglio = 1200, discesa = 400, volume = 0.5, pan = 0, tipo = 'lowpass' }) {
    if (!this.ctx) return;
    const ora = this.ctx.currentTime;
    const sorgente = this.ctx.createBufferSource();
    sorgente.buffer = this.rumoreBuffer;

    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.setValueAtTime(taglio, ora);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(60, discesa), ora + durata);

    const inviluppo = this.ctx.createGain();
    inviluppo.gain.setValueAtTime(volume, ora);
    inviluppo.gain.exponentialRampToValueAtTime(0.0001, ora + durata);

    sorgente.connect(filtro).connect(inviluppo).connect(this.panner(pan));
    sorgente.start(ora);
    sorgente.stop(ora + durata + 0.02);
  }

  /** Una nota: obiettivi, avvisi, tutto quello che deve avere un'intonazione. */
  nota({ frequenza = 440, a = 440, durata = 0.3, volume = 0.25, pan = 0, forma = 'triangle' }) {
    if (!this.ctx) return;
    const ora = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = forma;
    osc.frequency.setValueAtTime(frequenza, ora);
    if (a !== frequenza) osc.frequency.exponentialRampToValueAtTime(Math.max(30, a), ora + durata);

    const inviluppo = this.ctx.createGain();
    inviluppo.gain.setValueAtTime(0.0001, ora);
    inviluppo.gain.exponentialRampToValueAtTime(volume, ora + 0.015);
    inviluppo.gain.exponentialRampToValueAtTime(0.0001, ora + durata);

    osc.connect(inviluppo).connect(this.panner(pan));
    osc.start(ora);
    osc.stop(ora + durata + 0.02);
  }

  panner(pan) {
    const p = this.ctx.createStereoPanner
      ? this.ctx.createStereoPanner()
      : this.ctx.createGain(); // vecchi browser: si rinuncia alla direzione
    if (p.pan) p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(this.busEffetti);
    return p;
  }

  // --- Il bordone ----------------------------------------------------------

  /**
   * Una nota bassissima che non finisce mai, piu' un soffio. Da sola non si
   * nota; quando qualcuno ti sta cercando si apre il filtro e sale una quinta
   * che prima non c'era. Non e' musica da canticchiare, e' il modo di dire
   * "non sei solo" senza scriverlo sullo schermo.
   */
  avviaBordone() {
    const ora = this.ctx.currentTime;

    this.filtroBordone = this.ctx.createBiquadFilter();
    this.filtroBordone.type = 'lowpass';
    this.filtroBordone.frequency.value = 260;
    this.filtroBordone.connect(this.busMusica);

    for (const [frequenza, guadagno] of [[55, 0.5], [55.4, 0.35], [82.5, 0.18]]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = frequenza;
      const g = this.ctx.createGain();
      g.gain.value = guadagno;
      osc.connect(g).connect(this.filtroBordone);
      osc.start(ora);
    }

    const soffio = this.ctx.createBufferSource();
    soffio.buffer = this.rumoreBuffer;
    soffio.loop = true;
    const filtroSoffio = this.ctx.createBiquadFilter();
    filtroSoffio.type = 'bandpass';
    filtroSoffio.frequency.value = 420;
    const gSoffio = this.ctx.createGain();
    gSoffio.gain.value = 0.05;
    soffio.connect(filtroSoffio).connect(gSoffio).connect(this.busMusica);
    soffio.start(ora);

    this.quinta = this.ctx.createGain();
    this.quinta.gain.value = 0;
    this.quinta.connect(this.busMusica);
    const oscQuinta = this.ctx.createOscillator();
    oscQuinta.type = 'triangle';
    oscQuinta.frequency.value = 123.5;
    oscQuinta.connect(this.quinta);
    oscQuinta.start(ora);
  }

  /**
   * La sirena dell'allarme: una nota che sale e scende senza fermarsi, con
   * sotto un ronzio basso. Non e' un effetto che parte e finisce, e' uno stato
   * — finche' suona, sai che ti stanno venendo a prendere.
   *
   * I nodi si costruiscono una volta sola e poi si alza e si abbassa il
   * volume: accendere e spegnere oscillatori a ogni cambio fa schiocchi.
   */
  costruisciSirena() {
    const ora = this.ctx.currentTime;

    this.sirenaVolume = this.ctx.createGain();
    this.sirenaVolume.gain.value = 0;
    this.sirenaVolume.connect(this.busMusica);

    const voce = this.ctx.createOscillator();
    voce.type = 'sawtooth';
    voce.frequency.value = 520;

    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 1400;

    // L'oscillatore lento che fa salire e scendere la nota: e' questo che la
    // rende una sirena invece di un fischio.
    const altalena = this.ctx.createOscillator();
    altalena.type = 'sine';
    altalena.frequency.value = 0.38;
    const escursione = this.ctx.createGain();
    escursione.gain.value = 210;
    altalena.connect(escursione).connect(voce.frequency);

    voce.connect(filtro).connect(this.sirenaVolume);
    voce.start(ora);
    altalena.start(ora);

    // Il ronzio basso sotto, che da' corpo.
    const ronzio = this.ctx.createOscillator();
    ronzio.type = 'square';
    ronzio.frequency.value = 68;
    const gRonzio = this.ctx.createGain();
    gRonzio.gain.value = 0.22;
    ronzio.connect(gRonzio).connect(this.sirenaVolume);
    ronzio.start(ora);
  }

  sirena(accesa) {
    if (!this.ctx || !this.sirenaVolume) return;
    const ora = this.ctx.currentTime;
    this.sirenaVolume.gain.cancelScheduledValues(ora);
    this.sirenaVolume.gain.setValueAtTime(this.sirenaVolume.gain.value, ora);
    // Si accende in fretta e si spegne piano: cosi' finisce come un respiro
    // invece che come un interruttore.
    this.sirenaVolume.gain.linearRampToValueAtTime(accesa ? 0.16 : 0, ora + (accesa ? 0.25 : 0.8));
  }

  /**
   * Ogni fotogramma: quanto e' tesa la situazione. Si muove piano, perche' una
   * colonna sonora che scatta a ogni nemico che ti perde di vista e' peggio
   * del silenzio.
   */
  aggiorna(dt, { cacciatori = 0, critico = false, allarme = false }) {
    if (!this.ctx) return;
    const voluta = critico || allarme ? 1 : Math.min(1, cacciatori / 2);
    this.tensione += (voluta - this.tensione) * Math.min(1, dt * 1.5);

    this.filtroBordone.frequency.value = 260 + this.tensione * 520;
    this.quinta.gain.value = this.tensione * 0.09;

    // Un battito del cuore quando si e' a terra: lento, ma c'e'.
    if (critico && this.ctx.currentTime > this.battutaProssima) {
      this.battutaProssima = this.ctx.currentTime + 1.1;
      this.nota({ frequenza: 62, a: 44, durata: 0.34, volume: 0.3, forma: 'sine' });
    }
  }

  // --- Le voci del gioco ---------------------------------------------------

  /**
   * Un rumore del mondo. `forza` la calcola il server tenendo conto dei muri,
   * quindi uno sparo dentro una stanza chiusa non arriva — ed e' giusto che
   * non si senta nemmeno.
   */
  rumore(genere, forza, pan) {
    if (!this.ctx || forza <= 0) return;
    const v = Math.min(1, forza);
    if (genere === 'sparo') {
      this.botta({ durata: 0.16, taglio: 2600, discesa: 300, volume: 0.5 * v, pan });
      this.nota({ frequenza: 160, a: 60, durata: 0.12, volume: 0.16 * v, pan, forma: 'square' });
    } else if (genere === 'sparoNemico') {
      this.botta({ durata: 0.2, taglio: 1500, discesa: 180, volume: 0.42 * v, pan });
      this.nota({ frequenza: 110, a: 48, durata: 0.16, volume: 0.14 * v, pan, forma: 'sawtooth' });
    } else if (genere === 'passi') {
      this.botta({ durata: 0.07, taglio: 700, discesa: 220, volume: 0.3 * v, pan });
    } else if (genere === 'faro') {
      this.nota({ frequenza: 300, a: 520, durata: 0.3, volume: 0.2 * v, pan });
    }
  }

  /** Gli avvenimenti che riguardano te, senza direzione: capitano a te. */
  evento(nome) {
    if (!this.ctx) return;
    switch (nome) {
      case 'ferito':
        this.botta({ durata: 0.22, taglio: 900, discesa: 90, volume: 0.55 });
        this.nota({ frequenza: 90, a: 55, durata: 0.2, volume: 0.3, forma: 'sine' });
        break;
      case 'aTerra':
        this.nota({ frequenza: 220, a: 55, durata: 1.1, volume: 0.4, forma: 'sawtooth' });
        this.botta({ durata: 0.6, taglio: 500, discesa: 70, volume: 0.4 });
        break;
      case 'rialzato':
        for (const [k, f] of [[0, 262], [0.09, 330], [0.18, 392]]) {
          setTimeout(() => this.nota({ frequenza: f, a: f, durata: 0.4, volume: 0.26 }), k * 1000);
        }
        break;
      case 'nemicoAbbattuto':
        this.nota({ frequenza: 420, a: 130, durata: 0.28, volume: 0.22, forma: 'square' });
        break;
      case 'nucleoAcceso':
        for (const [k, f] of [[0, 392], [0.1, 523], [0.2, 659]]) {
          setTimeout(() => this.nota({ frequenza: f, a: f, durata: 0.35, volume: 0.24 }), k * 1000);
        }
        break;
      case 'uscitaAperta':
        for (const [k, f] of [[0, 330], [0.14, 494], [0.28, 659], [0.42, 988]]) {
          setTimeout(() => this.nota({ frequenza: f, a: f, durata: 0.5, volume: 0.2 }), k * 1000);
        }
        break;
      case 'settore':
        this.nota({ frequenza: 130, a: 262, durata: 0.9, volume: 0.3, forma: 'triangle' });
        break;
      case 'torciaAccesa':
        this.botta({ durata: 0.05, taglio: 4000, discesa: 1500, volume: 0.25 });
        break;
      case 'torciaSpenta':
        this.botta({ durata: 0.05, taglio: 1800, discesa: 600, volume: 0.2 });
        break;
      case 'caricaFinita':
        this.nota({ frequenza: 330, a: 160, durata: 0.5, volume: 0.24, forma: 'square' });
        break;
      case 'marchio':
        this.nota({ frequenza: 700, a: 1200, durata: 0.22, volume: 0.2, forma: 'sine' });
        break;
      default:
        break;
    }
  }
}
