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
};

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
  faro: { cadenza: 0.42, colpi: 5, dispersione: 0.34, gittata: 190, danno: 9, velocita: 640 },
  eco: { cadenza: 0.9, colpi: 1, dispersione: 0.015, gittata: 430, danno: 36, velocita: 940 },
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
  eco: { tipo: 'marchio', ricarica: 9, durata: 6 },
  faro: { tipo: 'fuoco', ricarica: 16, durata: 18, raggio: 152 },
};
