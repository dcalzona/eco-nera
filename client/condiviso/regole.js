/**
 * La versione del gioco. Serve a una cosa sola ma importante: il client
 * dentro l'APK e' impacchettato, il server gira sul PC, e i due possono
 * finire disallineati senza che nulla lo dica — un server lasciato acceso
 * dalla sera prima fa sparire in silenzio tutto quello che sta dalla sua
 * parte (mira assistita, allarme, modalita' in solitaria) e sembra che il
 * gioco sia rotto. Se i numeri non coincidono, ora lo si legge a schermo.
 */
export const VERSIONE = '4.2';

// Numeri che server e client devono conoscere allo stesso modo.
// Questa cartella e' condivisa: il server la importa da ../client/condiviso/,
// il browser la scarica come modulo ES. Un solo posto da modificare.

/** Passi di simulazione al secondo sul server. */
export const TICK_HZ = 20;

/** Lato di una casella della mappa, in pixel di mondo. */
export const TILE = 32;

/** Mezzo lato del quadrato di collisione di un personaggio. */
export const RAGGIO = 11;

/**
 * Velocita' di corsa in pixel al secondo: ~4.8 caselle al secondo.
 * E' il "ritmo medio" — si attraversa una stanza in un paio di secondi,
 * ma non si scappa da tutto. E' il primo numero da toccare in prova.
 */
export const VELOCITA = 155;

/**
 * Di quanto il client resta indietro rispetto al server per interpolare i
 * movimenti altrui. Due tick abbondanti: se il Wi-Fi perde un pacchetto il
 * movimento resta liscio invece di scattare.
 *
 * Non e' piu' un numero fisso, ed e' il motivo per cui ce ne sono tre. In casa
 * le fotografie arrivano puntuali e cento millisecondi bastano e avanzano;
 * fuori, su una rete mobile, un pacchetto ogni tanto arriva con ottanta
 * millisecondi di ritardo, e con un cuscino da cento il compagno si congela
 * per un istante ogni volta. Allora il cuscino si misura: si guarda quanto
 * tardano davvero le fotografie e ci si tiene quel tanto piu' indietro.
 *
 * Il minimo e' proprio cento — cioe' quello di sempre. Cosi' in casa il
 * comportamento e' identico a prima, al millisecondo: il cuscino si allunga
 * solo quando la rete lo chiede davvero.
 */
export const RITARDO_MINIMO = 100;
export const RITARDO_MASSIMO = 320;

/**
 * Quanto si sta larghi oltre al ritardo misurato. Un po' di margine sopra il
 * pacchetto piu' tardivo visto di recente: senza, si sta sempre sul filo e
 * basta un pacchetto un filo peggiore degli altri per restare a secco.
 */
export const MARGINE_RITARDO = 15;

/**
 * I comandi in salita. Il telefono ne produce uno per sottopasso, sessanta al
 * secondo: in casa si spediscono uno per uno e va benissimo. Su rete mobile
 * sessanta pacchettini al secondo arrivano peggio di venti pacchetti pieni —
 * la radio deve chiedere il permesso di trasmettere a ogni giro, e i permessi
 * costano decine di millisecondi.
 *
 * Quindi si raggruppano, ma solo quando serve: sotto la soglia di ping si
 * continua a mandarli uno alla volta, esattamente come prima. Raggruppare
 * aggiunge un filo di ritardo, e su una rete che non ne ha bisogno sarebbe
 * ritardo regalato via.
 */
export const COMANDI_PER_PACCHETTO = 3;
export const SOGLIA_PING_RAGGRUPPA = 15; // ms
export const ATTESA_MASSIMA_COMANDI = 25; // ms: non si trattiene un comando oltre

/**
 * Il passo elementare con cui si muove il mondo, uguale per il server e per il
 * telefono. E' la regola piu' importante del progetto: due passi di durata
 * diversa producono percorsi diversi appena si sfiora uno spigolo, e il
 * giocatore vede il proprio personaggio strattonato. Il server ne esegue tre
 * per ogni tick, il telefono uno per ogni sedicesimo di secondo, ma il calcolo
 * e' lo stesso identico calcolo.
 */
export const SOTTOPASSO = 1 / 60;

/** Quanti sottopassi entrano in un tick del server. */
export const SOTTOPASSI_PER_TICK = Math.round((1 / TICK_HZ) / SOTTOPASSO);

export const CASELLA = { PAVIMENTO: 0, MURO: 1, PORTA: 2 };

/**
 * La torcia di ciascun ruolo. E' qui che vive l'asimmetria del cooperativo:
 * il Faro vede largo e vicino, l'Eco stretto e lontano. Nessuno dei due vede
 * abbastanza da solo, e i due coni insieme coprono cose che separati no.
 *
 * `apertura` in radianti, `raggio` in pixel di mondo (una casella = 32).
 */
export const LUCI = {
  faro: { apertura: (112 * Math.PI) / 180, raggio: 168, colore: '#ffc65c' },
  eco: { apertura: (26 * Math.PI) / 180, raggio: 384, colore: '#4ecdc4' },
  assalto: { apertura: (58 * Math.PI) / 180, raggio: 262, colore: '#b6e06a' },
};

/**
 * Le tre classi, con il nome che si legge nel menu. Sono tre modi di stare
 * nel buio: chi ci entra dentro, chi lo guarda da lontano, chi ci passa in
 * mezzo di corsa. Le portate delle armi seguono quelle delle torce — ognuno
 * colpisce fin dove vede — e ogni abilita' fa una cosa che le altre due non
 * sanno fare, cosi' due scelte uguali si sentono subito piu' povere di due
 * diverse.
 */
export const CLASSI = {
  faro: {
    nome: 'Faro',
    arma: 'Fucile a canne mozze',
    ruolo: 'Medico',
    descrizione: 'Vede largo e vicino. Devastante addosso, inutile lontano. Lascia a terra un kit che rimette in piedi tutti e due.',
  },
  eco: {
    nome: 'Eco',
    arma: 'Fucile di precisione',
    ruolo: 'Ricognitore',
    descrizione: 'Vede stretto e lontanissimo. Un colpo solo, lento e pesante. Posa un sonar che scopre i nemici anche oltre i muri.',
  },
  assalto: {
    nome: 'Assalto',
    arma: "Fucile d'assalto",
    ruolo: 'Incursore',
    descrizione: 'Vede a media distanza. Raffica veloce e continua. Pianta un riparo da cui si spara senza essere colpiti.',
  },
};

export const CLASSE_PREDEFINITA = 'faro';

/**
 * Il cerchio di consapevolezza attorno a se', a 360 gradi: chi ti arriva alle
 * spalle lo senti anche senza illuminarlo. Senza questo, girarsi al buio
 * diventa una lotteria e il gioco smette di essere teso per diventare ingiusto.
 */
export const CONSAPEVOLEZZA = 56;

/**
 * Quanto stanno distanti, in pixel, le punte di due raggi vicini. Contano i
 * pixel e non i gradi: un cerchietto di 56 pixel di raggio e un fascio lungo
 * 384 hanno bisogno di un numero di raggi molto diverso per apparire
 * ugualmente lisci, e sprecarne su quello corto costa e non si vede.
 */
export const SPAZIATURA_RAGGI = 3;

// --- Combattimento ---------------------------------------------------------

export const VITA_MASSIMA = 100;

/**
 * L'armatura sta davanti alla salute: i colpi la consumano per primi, e
 * finita quella cominciano a fare male sul serio.
 *
 * La divisione serve a una cosa precisa: l'armatura si ritrova nelle casse
 * sparse per il settore, la salute quasi solo dal kit del medico. Cosi'
 * girando si recupera la capacita' di incassare — che e' quello che mancava
 * giocando da soli — senza rendere inutile il Faro, che resta l'unico a
 * rimettere in sesto davvero.
 */
export const ARMATURA_MASSIMA = 100;

/** Con quanta armatura si entra in un settore nuovo. */
export const ARMATURA_INIZIALE = 60;

/**
 * Le casse di rifornimento sparse per le stanze. Danno molta armatura e poca
 * salute, valgono una volta per ciascuno, e spariscono quando le hanno usate
 * tutti — chi gioca da solo se ne accorge subito, chi gioca in due puo'
 * lasciarne una al compagno che sta peggio.
 */
export const RIFORNIMENTI = {
  quante: 3, // nel primo settore
  minimo: 1, // non si scende mai sotto una: un settore senza niente e' solo crudele
  ogniSettori: 2, // una in meno ogni due settori
  raggio: 34,
  armatura: 70,
  salute: 15,
};

/**
 * Quante casse ci sono in un settore. All'inizio se ne trovano tre e si gira
 * tranquilli; piu' si scende, meno se ne trovano, e la stessa armatura che al
 * primo settore era abbondante diventa qualcosa da amministrare. E' il modo
 * piu' semplice di alzare la difficolta' senza toccare i nemici: non ti fanno
 * piu' male, sei tu che hai meno margine.
 */
export function casseDelSettore(numero) {
  const meno = Math.floor((numero - 1) / RIFORNIMENTI.ogniSettori);
  return Math.max(RIFORNIMENTI.minimo, RIFORNIMENTI.quante - meno);
}

/**
 * Le due armi, in tinta con i due modi di vedere. Il Faro spara una rosa corta
 * e larga: devastante addosso, inutile lontano, cioe' esattamente dove arriva
 * la sua torcia. L'Eco un colpo solo, lento e preciso, che arriva fin dove
 * arriva il suo fascio. Nessuno dei due copre il lavoro dell'altro.
 */
export const ARMI = {
  faro: { cadenza: 0.42, colpi: 5, dispersione: 0.34, gittata: 190, danno: 9, velocita: 640, rumore: 15 },
  // 52 e non 36, e il numero che conta e' 46: la vita di un pattugliatore.
  // Con 36 l'Eco sbagliava il colpo secco per dieci punti, quindi gliene
  // servivano due a 0,9 secondi l'uno — era il PIU' LENTO dei tre a uccidere
  // (0,90 s contro 0,64 dell'Assalto e 0,42 del Faro) e per giunta doveva
  // azzeccare un colpo stretto da lontano. Non era una sensazione, era
  // aritmetica: la classe piu' difficile da usare era anche la peggiore.
  eco: { cadenza: 0.9, colpi: 1, dispersione: 0.015, gittata: 430, danno: 52, velocita: 940, rumore: 9 },
  assalto: { cadenza: 0.16, colpi: 1, dispersione: 0.07, gittata: 300, danno: 10, velocita: 820, rumore: 12 },
};

// --- Le munizioni ----------------------------------------------------------

/**
 * Tre caricatori a testa, e finiti quelli si va a cercarne.
 *
 * Prima si sparava all'infinito, ed e' meta' del motivo per cui dopo sei
 * settori il gioco diventava una passeggiata: non c'era NIENTE da
 * amministrare. Un colpo che costa qualcosa cambia ogni decisione — se
 * ingaggiare o passare oltre, se finire quello ferito o risparmiare, se
 * tornare indietro fino alla stazione o tirare avanti al buio.
 *
 * I numeri non sono uguali per tutti, e non e' bilanciamento: e' l'identita'
 * delle classi vista dal lato del costo. L'Assalto ha il doppio dei colpi e ne
 * spende cinque per nemico; l'Eco ne ha dieci e ne spende uno. Chi spara tanto
 * finisce presto, chi mira bene dura — ed e' la stessa cosa che il gioco gia'
 * diceva con la gittata, detta un'altra volta con le riserve.
 */
export const MUNIZIONI = {
  faro: { caricatore: 10, caricatori: 3, ricarica: 1.7 },
  eco: { caricatore: 10, caricatori: 3, ricarica: 2.1 },
  assalto: { caricatore: 20, caricatori: 3, ricarica: 1.5 },
};

export function munizioniDi(ruolo) {
  return MUNIZIONI[ruolo] ?? MUNIZIONI.faro;
}

// --- Le stazioni ------------------------------------------------------------

/**
 * Dove si ricarica tutto: colpi, kit, sonar e riparo.
 *
 * Ce ne sono meno man mano che la campagna scende — tre nei primi cinque
 * settori, due nei cinque di mezzo, una negli ultimi — cosi' la stessa mappa
 * pesa diversamente a seconda di quando ci si arriva. E' la stessa curva delle
 * casse, e per lo stesso motivo: sotto una non si scende mai, perche' un
 * settore senza niente non e' difficile, e' solo crudele.
 */
export const STAZIONE = {
  raggio: 32,
  usa: 2.2, // secondi fermi addosso per prendere tutto
  quante: [3, 2, 1], // nelle tre fasi della campagna
};

export function stazioniDelSettore(numero, difficolta = 'facile') {
  const fase = Math.min(2, Math.floor((numero - 1) / (SETTORI_PER_FINIRE / 3)));
  const base = STAZIONE.quante[fase];
  return Math.max(1, Math.round(base * regoleDifficolta(difficolta).stazioni));
}

// --- La campagna ------------------------------------------------------------

/**
 * Quindici settori e si e' finita.
 *
 * Prima non finiva mai, e non era una scelta: era che nessuno aveva deciso
 * dove finisse. Dall'ottavo in poi i numeri smettevano di crescere — quattordici
 * nemici, quattro obiettivi, una cassa — e ogni settore era identico al
 * precedente tranne il numero scritto in cima. Andare avanti non voleva dire
 * niente, e infatti dopo sei si smetteva.
 */
export const SETTORI_PER_FINIRE = 15;

// --- Le quattro difficolta' -------------------------------------------------

/**
 * Quella di prima diventa "facile", e resta esattamente com'era: chi ha gia'
 * giocato deve ritrovare il gioco che conosce, non una versione ritoccata di
 * nascosto. Tutte le altre si moltiplicano a partire da li'.
 *
 * Le manopole sono poche di proposito. Non si tocca la VITA dei nemici —
 * gonfiarla fa solo sparare piu' a lungo alla stessa cosa, che e' noia
 * travestita da sfida. Si tocca quanti sono, quanto fanno male, quanto in
 * fretta arrivano i rinforzi, e quanto vi resta in tasca.
 */
export const DIFFICOLTA = ['facile', 'normale', 'difficile', 'incubo'];

/**
 * Quello che si sceglie nel menu: le quattro difficolta' piu' Survival.
 *
 * Survival sta nella STESSA riga e non in una sua, e non e' per risparmiare
 * spazio (anche): e' che scegliere Survival E una difficolta' non vuol dire
 * niente — li' la difficolta' la detta il settore. Mettendola in fila con le
 * altre, "non si sceglie" si legge senza doverlo spiegare.
 */
export const SCELTE_DIFFICOLTA = [...DIFFICOLTA, 'survival'];

const REGOLE_DIFFICOLTA = {
  facile: { nemici: 1, danno: 1, rinforzi: 1, caricatori: 1, stazioni: 1, evacuazione: 1 },
  normale: { nemici: 1.25, danno: 1.25, rinforzi: 0.8, caricatori: 1, stazioni: 1, evacuazione: 1.25 },
  difficile: { nemici: 1.5, danno: 1.5, rinforzi: 0.62, caricatori: 0.67, stazioni: 0.7, evacuazione: 1.5 },
  incubo: { nemici: 1.85, danno: 1.9, rinforzi: 0.45, caricatori: 0.67, stazioni: 0.5, evacuazione: 1.8 },
};

export function regoleDifficolta(quale) {
  return REGOLE_DIFFICOLTA[quale] ?? REGOLE_DIFFICOLTA.facile;
}

/** Quanto si resta a terra prima di morire davvero, e cosa serve per rialzarsi. */
export const CRITICO_SECONDI = 30;
export const RIANIMA_SECONDI = 3;
export const RIANIMA_DISTANZA = 36;
export const VITA_DOPO_RIANIMA = 45;
export const RIENTRO_SECONDI = 10;

/** A terra ci si trascina, non si corre. */
export const VELOCITA_CRITICO = 38;

// --- Nemici ----------------------------------------------------------------

export const NEMICI = {
  pattugliatore: {
    vita: 46,
    velocita: 94,
    cono: (68 * Math.PI) / 180,
    vista: 258,
    cadenza: 1.15,
    pausaMira: 0.5,
    danno: 11,
    gittata: 240,
    velocitaColpo: 470,
    colore: '#e05a5a',
  },
};

/** Quanto continua a cercarti dopo averti perso di vista. */
export const OBLIO_SECONDI = 6;

export const STATO = { VIVO: 0, CRITICO: 1, MORTO: 2 };
export const UMORE = { PATTUGLIA: 0, CERCA: 1, CACCIA: 2 };

// --- Il suono --------------------------------------------------------------

/**
 * Quanto lontano si sente una cosa, in caselle percorse. Non in linea d'aria:
 * il suono gira per i corridoi come si gira a piedi, quindi uno sparo in una
 * stanza chiusa non allarma chi sta tre stanze piu' in la' anche se in linea
 * retta e' vicinissimo. E' la differenza fra un gioco in cui nascondersi
 * significa qualcosa e uno in cui non significa niente.
 */
export const SUONI = {
  sparo: { raggio: 13, forza: 1 },
  sparoNemico: { raggio: 11, forza: 0.8 },
  passi: { raggio: 4, forza: 0.35 },
  faro: { raggio: 6, forza: 0.5 },
};

/** Ogni quanto un personaggio in movimento fa rumore coi piedi. */
export const PASSO_RUMOROSO = 0.5;

/** Quanto resta a schermo il segnale di un rumore. */
export const ECO_SECONDI = 1.4;

// --- La torcia -------------------------------------------------------------

/** Secondi di torcia accesa a carica piena, e secondi per ricaricarla tutta. */
export const DURATA_TORCIA = 24;
export const RICARICA_TORCIA = 16;

/**
 * Finita la carica la torcia si spegne, e non basta un istante di ricarica per
 * riaccenderla: serve arrivare a questo livello. Senza questa soglia di
 * ripresa la torcia sfarfalla — si spegne, si ricarica un briciolo, si
 * riaccende, si rispegne — ed e' insopportabile da guardare.
 */
export const RIPRESA_TORCIA = 0.35;

/** Quanto ci vedono meno i nemici quando sei al buio. */
export const SCONTO_AL_BUIO = 0.45;

// --- Le abilita' dei due ruoli --------------------------------------------

/**
 * L'Eco marca i nemici che sta vedendo: per qualche secondo li vedete tutti e
 * due, anche attraverso i muri. Il Faro pianta un fuoco che illumina una
 * stanza per entrambi e continua a farlo mentre lui va avanti.
 */
export const ABILITA = {
  faro: { tipo: 'kit', ricarica: 22, durata: 40, raggio: 30, cura: 45, tetto: 0.7 },
  eco: { tipo: 'sonar', ricarica: 18, durata: 14, raggio: 320 },
  assalto: { tipo: 'riparo', ricarica: 16, durata: 50 },
};

/**
 * Il riparo dell'Assalto: una barriera che si pianta davanti a se'.
 *
 * Ferma i colpi dei NEMICI e non i vostri. E' asimmetrico di proposito: da
 * dietro si spara e non si viene colpiti, ed e' quello che trasforma una
 * stanza aperta in una posizione da tenere — che e' esattamente quello che
 * serviva alle due modalita' nuove, difendere la bomba e tenere la zona.
 *
 * Ma non e' un muro: i corpi ci passano sopra, lentamente. Chi lo scavalca —
 * voi o loro — cammina al trenta per cento della velocita' per il tempo di
 * scollinare, ed e' li' che si e' scoperti. Se fosse invalicabile basterebbe
 * tapparsi un corridoio e la serata finirebbe li'.
 *
 * `spessore` e' quanto e' spesso davvero (lo usano i colpi), `banda' quanto e'
 * larga la fascia in cui si rallenta: piu' larga di quella vera, altrimenti si
 * scavalca in due decimi di secondo e non si sente niente.
 */
/**
 * Quanti ripari si possono piantare in un settore.
 *
 * Prima erano infiniti, con solo un'attesa fra l'uno e l'altro: bastava
 * aspettare sedici secondi e ripiantarlo, e ogni stanza diventava una
 * posizione da tenere. Due per settore, e si ricaricano alle stazioni, vuol
 * dire doverli SPENDERE — decidere dove vale la pena fermarsi e dove no. E'
 * la stessa medicina delle munizioni: quello che non costa niente non si
 * amministra, e quello che non si amministra annoia.
 */
export const RIPARI_PER_SETTORE = 2;

export const RIPARO = {
  mezzaLunghezza: 30, // quasi due caselle di larghezza in tutto
  spessore: 9,
  banda: 26,
  distanza: 26, // quanto avanti a chi lo pianta
  vita: 150,
  rallenta: 0.3, // la velocita' scende del settanta per cento
};

/** Quanto batte il sonar: ogni impulso rinfresca il marchio sui nemici sentiti. */
export const IMPULSO_SONAR = 1.6;

// --- La spedizione ---------------------------------------------------------

/**
 * Un settore per volta: si entra, si accendono i nuclei sparsi per le stanze,
 * si torna al punto di ingresso e si esce. Poi il settore dopo, un po' piu'
 * affollato. La tensione sta dentro il settore, non fra un settore e l'altro:
 * a ogni passaggio si riparte con la vita piena.
 */
/**
 * L'allarme. Acceso l'ultimo nucleo, il settore si sveglia: tutti sanno
 * grosso modo dove siete e vengono. Il tratto di ritorno era il piu' lungo e
 * il piu' noioso — camminare a ritroso su una mappa gia' vista — e questo lo
 * trasforma nel momento in cui la serata si decide.
 *
 * Nessun conto alla rovescia: non si perde per il tempo, si perde se si
 * inciampa. La fretta la mette la sirena, non un numero.
 */
export const ALLARME = {
  richiamo: 2.4, // ogni quanto i nemici si aggiornano su dove siete
  /**
   * Ogni quanto arriva un rinforzo durante l'evacuazione.
   *
   * Era 5 secondi anche in facile, e il ritorno finiva prima che qualcuno
   * riuscisse a tagliarvi la strada: si usciva quasi sempre indisturbati, e
   * l'allarme era una scritta piu' che una fase. Adesso 3,4 anche al livello
   * piu' basso, e le difficolta' piu' alte lo stringono ancora.
   */
  rinforzi: 3.4,

  memoria: 10, // quanto a lungo continuano a cercarvi dopo il richiamo
  // Con l'allarme corrono: da fermi sono piu' lenti di voi, e inseguendovi da
  // dietro non vi raggiungerebbero mai. Il ritorno dev'essere una fuga, e per
  // esserlo qualcuno vi deve tagliare la strada.
  velocita: 1.3,
  // I rinforzi arrivano DAVANTI, verso l'uscita, non alle spalle: e' quello
  // che rende il ritorno un attraversamento invece di una passeggiata con
  // qualcuno che arranca dietro.
  davanti: true,
  /** Con l'allarme il settore ne regge di piu': e' il momento di punta. */
  tetto: 1.45,
};

/**
 * L'assistenza alla mira. Su un telefono il pollice non ha la precisione di un
 * mouse, e questo e' un gioco contro il computer: pretendere la mira al pixel
 * toglierebbe divertimento senza aggiungere niente. Il colpo si raddrizza
 * verso il nemico piu' centrato, ma solo entro pochi gradi — abbastanza da
 * perdonare un pollice impreciso, non abbastanza da sparare a caso e colpire.
 */
export const ASSISTENZA = {
  angolo: (13 * Math.PI) / 180, // quanto lontano dal mirino puo' stare il bersaglio
  correzione: 0.85, // quanta parte dello scarto si raddrizza
};

/** Quanti nemici in meno quando si gioca da soli. */
export const SCONTO_DA_SOLI = 0.65;

export const SPEDIZIONE = {
  nucleiBase: 2,
  nucleiMax: 4,
  nemiciBase: 6,
  nemiciMax: 14,
  raggioNucleo: 44,
  durataNucleo: 3,
  raggioEstrazione: 56,
  /**
   * Quanto si resta fermi nel cerchio per uscire.
   *
   * Erano due secondi e mezzo: si arrivava e si spariva, e l'evacuazione era
   * una scritta. Sette, e di piu' alle difficolta' alte, e' un'ATTESA DA
   * TENERE — fermi in un punto che tutti conoscono, mentre arrivano.
   *
   * Ci avevo provato prima tenendo l'uscita CHIUSA per una dozzina di secondi
   * dopo la missione, e sbagliavo: il viaggio di ritorno e' gia' l'evacuazione,
   * e una porta che si apre a tempo non la rende piu' dura — punisce chi
   * arriva in fretta, che resta su un cerchio spento senza niente da fare.
   * Provandolo, il giocatore moriva li' in piedi ad aspettare una porta.
   */
  durataEstrazione: 7,
  /**
   * Il briefing. Prima che il settore si svegli si legge cosa c'e' da fare:
   * per quei secondi i nemici stanno fermi. Non e' un dettaglio di comodo —
   * tre modalita' diverse senza un momento in cui si guarda il disegno e si
   * capisce l'obiettivo diventano tre partite in cui si gira a caso. Si puo'
   * chiudere prima premendo il pulsante; in due si parte quando sono pronti
   * tutti e due.
   */
  preparazione: 12,
};

// --- Le tre modalita' ------------------------------------------------------

/**
 * Ogni settore ha il suo tipo di missione, e si susseguono in giro: primo
 * settore sabotaggio, secondo bomba, terzo dominio, poi si ricomincia. In giro
 * e non a caso, perche' a caso capita di farne tre uguali di fila proprio la
 * sera che si vorrebbe vederle tutte — e cambiare idea e' una riga sola.
 *
 * Quello che NON cambia mai e' la coda: finito l'obiettivo, qualunque fosse,
 * scatta l'allarme e si torna all'uscita con tutto il settore addosso.
 */
export const MODALITA = ['sabotaggio', 'bomba', 'dominio', 'convoglio', 'boss'];

/** Le quattro che si mescolano. La quinta ha un posto fisso. */
const MODALITA_MESCOLATE = MODALITA.filter((m) => m !== 'boss');

/**
 * Cinque settori per blocco: le prime quattro modalita' in ordine sparso, e
 * la quinta e' SEMPRE il boss.
 *
 * Sparso e non a caso settore per settore: pescando ogni volta capiterebbe di
 * farne tre uguali di fila proprio la sera che si vorrebbero vedere tutte.
 * Mescolando il blocco si vedono tutte e quattro, sempre, in un ordine che
 * cambia — che e' quello che si vuole davvero quando si dice "a caso".
 *
 * E il boss in fondo al blocco diventa il muro fra un gradino e l'altro: in
 * Survival la difficolta' sale ogni cinque livelli, quindi il boss e' esatta-
 * mente la prova che dice se sei pronto per quello dopo.
 */
export function modalitaDelSettore(numero, seme = 1) {
  const n = Math.max(1, Math.floor(numero));
  const dentro = (n - 1) % 5; // 0..4
  if (dentro === 4) return 'boss';

  // Lo stesso blocco deve dare sempre lo stesso ordine: chi ospita e chi
  // guarda le prove devono vedere la stessa cosa, e un `Math.random()` qui
  // vorrebbe dire una modalita' diversa a ogni ricalcolo.
  const blocco = Math.floor((n - 1) / 5);
  return mescola(MODALITA_MESCOLATE, seme * 7919 + blocco * 104729)[dentro];
}

/** Mescolata ripetibile: stesso seme, stesso ordine. */
function mescola(elenco, seme) {
  const fuori = elenco.slice();
  let x = (seme % 2147483647) || 1;
  const prossimo = () => {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
  for (let k = fuori.length - 1; k > 0; k--) {
    const j = Math.floor(prossimo() * (k + 1));
    [fuori[k], fuori[j]] = [fuori[j], fuori[k]];
  }
  return fuori;
}

// --- Scorta il convoglio ---------------------------------------------------

/**
 * Un convoglio che avanza se gli si sta vicino e torna indietro se lo si
 * lascia solo. E' l'unica missione in cui STARE FERMI A SPARARE FA PERDERE
 * TERRENO: le altre quattro premiano il trovare una posizione e tenerla,
 * questa punisce chi si attarda.
 *
 * E' anche l'unica con un tempo che uccide. Scaduto quello la spedizione e'
 * persa: e' voluto, ed e' quello che rende la scelta "lo seguo o mi fermo a
 * togliermi di torno questi due" una scelta vera invece che una preferenza.
 */
export const CONVOGLIO = {
  raggio: 96, // entro quanto bisogna stargli per farlo avanzare
  velocita: 42, // pixel al secondo quando lo si scorta
  indietro: 0.55, // quanto torna indietro, rispetto a quanto va avanti
  tempo: 150, // secondi per portarlo in fondo
  vita: 260, // non serve ancora: i nemici non lo attaccano. Vedi sotto.
  raggioCorpo: 22,
};

// --- La stanza del boss ----------------------------------------------------

/**
 * Il boss: piu' grosso, piu' duro, e con piu' vita a mano a mano che si scende.
 *
 * La vita cresce col settore perche' altrimenti l'ultimo boss sarebbe identico
 * al primo — lo stesso appiattimento che rendeva noiosi i settori dopo l'ottavo.
 */
export const BOSS = {
  vitaBase: 420,
  vitaPerSettore: 90,
  velocita: 66, // lento: e' una cosa che avanza, non che ti insegue
  cadenza: 1.6,
  danno: 26,
  gittata: 300,
  velocitaColpo: 380,
  raggio: 26, // il doppio abbondante di un pattugliatore
  cono: (78 * Math.PI) / 180,
  vista: 320,
  colore: '#ff8a3c',
  /** Ogni quanto arriva uno scagnozzo dalle porte in fondo. */
  scagnozzi: 7,
  scagnozziInsieme: 4,
};

/** La forma del livello boss: un corridoio largo che sfocia in un'arena. */
export const ARENA = {
  corridoioLungo: 26, // caselle
  corridoioLargo: 9, // le 8/10 chieste
  stanzaLarga: 20,
  stanzaAlta: 15,
  nemiciNelCorridoio: 5,
  ripariNelCorridoio: 3,
};

// --- Survival --------------------------------------------------------------

/**
 * Niente difficolta' da scegliere: si parte da facile e ogni cinque livelli si
 * sale di un gradino. Dopo Incubo non ci si ferma — un tetto rimetterebbe
 * l'altopiano che abbiamo appena tolto — ma i passi si accorciano, cosi' la
 * corsa dura piu' a lungo prima di diventare impossibile.
 */
export const SURVIVAL = { ogniQuanti: 5, passoOltre: 0.12 };

export function regoleSurvival(settore) {
  const gradino = Math.floor((Math.max(1, settore) - 1) / SURVIVAL.ogniQuanti);
  const dentroLaScala = Math.min(gradino, DIFFICOLTA.length - 1);
  const base = regoleDifficolta(DIFFICOLTA[dentroLaScala]);
  const oltre = Math.max(0, gradino - (DIFFICOLTA.length - 1));
  if (!oltre) return base;

  // Oltre Incubo si continua, ma piano: i moltiplicatori che fanno male
  // crescono, quelli che tolgono roba non scendono sotto il minimo — restare
  // senza NIENTE non e' difficile, e' solo la fine della partita.
  const piu = 1 + oltre * SURVIVAL.passoOltre;
  return {
    nemici: base.nemici * piu,
    danno: base.danno * piu,
    rinforzi: Math.max(0.25, base.rinforzi / piu),
    caricatori: base.caricatori,
    stazioni: base.stazioni,
    evacuazione: base.evacuazione * piu,
  };
}

/**
 * La bomba. Si prende, si ha un tempo per portarla dov'e' segnato, e poi la si
 * difende finche' non scoppia — perche' i nemici la sentono e vengono a
 * disinnescarla. Finche' ce n'e' uno vicino la miccia si ferma: non basta
 * piazzarla e scappare, bisogna restare.
 *
 * In due chi la porta non spara: ha le mani occupate, e il compagno diventa
 * la sua scorta. Da soli invece si spara, perche' altrimenti sarebbe solo una
 * passeggiata a occhi chiusi in mezzo ai nemici.
 */
export const BOMBA = {
  perPiazzare: 50, // secondi da quando la prendi a quando deve essere giu'
  piazzamento: 3, // secondi fermi sul punto per posarla
  miccia: 55, // e poi quanto ci mette a scoppiare
  raggioRitiro: 34,
  raggioPunto: 40,
  raggioDifesa: 120, // entro quanto un nemico blocca la miccia
  dannoSeScoppia: 55, // se scade il tempo mentre ce l'hai in mano
  /**
   * Lo scoppio arriva piu' lontano di quanto arrivi il disturbo: se i due
   * raggi fossero uguali, un nemico dentro il raggio dello scoppio bloccherebbe
   * per definizione la miccia, e la bomba non ne prenderebbe mai nemmeno uno.
   * Cosi' invece c'e' un anello — fra 120 e 190 — dove stanno arrivando e li
   * prende in pieno.
   */
  raggioScoppio: 190,
  dannoScoppio: 70,
  // A voi arriva molto meno, e solo se ci siete proprio sopra. Difendere la
  // bomba vuol dire starci vicino: punire con settanta danni la cosa che la
  // missione stessa chiede di fare sarebbe una trappola, non una regola.
  /**
   * Lo scoppio addosso a VOI, e adesso fa male sul serio.
   *
   * Prima erano 25 punti fissi entro 90 pixel: una scheggia, una cosa che si
   * incassava senza pensarci. Ma difendere una bomba che non fa niente non e'
   * difendere, e' aspettare — e la missione diventava "stai fermo e spara".
   *
   * Adesso il danno scala con la distanza: al centro AMMAZZA, e si sfuma fino
   * a un graffio al bordo. Il conto non punisce la missione — restare li' e'
   * quello che vi si chiede — punisce lo stare SOPRA la bomba quando parte.
   * Il tempo per allontanarsi c'e' tutto: la miccia si vede scorrere.
   */
  raggioSchegge: 150,
  raggioLetale: 46, // dentro questo, si va giu' e basta
  dannoSchegge: 78, // al centro; sfuma a poco piu' di zero al bordo
  richiamo: 3, // ogni quanto i nemici si aggiornano su dov'e' la bomba
};

/**
 * Il dominio: una zona da tenere. Il progresso sale se ci sei dentro tu e non
 * ci sono nemici, si ferma se sono entrati, e cala piano se te ne vai — cosi'
 * non si puo' sbocconcellarla nascondendosi ogni volta che si scalda.
 */
export const DOMINIO = {
  raggio: 92,
  durata: 40, // secondi di presenza per conquistarla
  perSettore: 6, // e qualcuno in piu' man mano che si scende
  perdita: 0.35, // quanto si perde stando fuori, rispetto a quanto si guadagna
  /**
   * In due dentro il cerchio si conquista PIU' IN FRETTA, da soli piu' piano.
   *
   * Prima uno o due era uguale: uno restava dentro a fare il palo e l'altro
   * girava a sparare, che e' il contrario di una missione cooperativa. Il
   * numero da guardare e' 1.0 — restare in due vale piu' della somma di due
   * mezze presenze, e restarci da soli costa tempo che i nemici usano per
   * arrivare.
   */
  daSolo: 0.65,
  inDue: 1.45,
  rinforzi: 6, // secondi fra un nemico e l'altro mentre si tiene la zona
};
