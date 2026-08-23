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
 * Di quanto il client resta indietro rispetto al server per interpolare
 * i movimenti altrui. Due tick abbondanti: se il Wi-Fi perde un pacchetto
 * il movimento resta liscio invece di scattare.
 */
export const RITARDO_INTERP = 100;

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
    descrizione: 'Vede a media distanza. Raffica veloce e continua. Con lo scatto attraversa una stanza scoperta prima che se ne accorgano.',
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
 * Le due armi, in tinta con i due modi di vedere. Il Faro spara una rosa corta
 * e larga: devastante addosso, inutile lontano, cioe' esattamente dove arriva
 * la sua torcia. L'Eco un colpo solo, lento e preciso, che arriva fin dove
 * arriva il suo fascio. Nessuno dei due copre il lavoro dell'altro.
 */
export const ARMI = {
  faro: { cadenza: 0.42, colpi: 5, dispersione: 0.34, gittata: 190, danno: 9, velocita: 640, rumore: 15 },
  eco: { cadenza: 0.9, colpi: 1, dispersione: 0.015, gittata: 430, danno: 36, velocita: 940, rumore: 9 },
  assalto: { cadenza: 0.16, colpi: 1, dispersione: 0.07, gittata: 300, danno: 10, velocita: 820, rumore: 12 },
};

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
  assalto: { tipo: 'scatto', ricarica: 13, durata: 3.5, moltiplicatore: 1.6 },
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
  richiamo: 3.2, // ogni quanto i nemici si aggiornano su dove siete
  rinforzi: 6, // secondi fra un rinforzo e l'altro, invece di dodici
  memoria: 8, // quanto a lungo continuano a cercarvi dopo il richiamo
};

export const SPEDIZIONE = {
  nucleiBase: 2,
  nucleiMax: 4,
  nemiciBase: 6,
  nemiciMax: 14,
  raggioNucleo: 44,
  durataNucleo: 3,
  raggioEstrazione: 56,
  durataEstrazione: 2.5,
};
