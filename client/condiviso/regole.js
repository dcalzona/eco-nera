/**
 * La versione del gioco. Serve a una cosa sola ma importante: il client
 * dentro l'APK e' impacchettato, il server gira sul PC, e i due possono
 * finire disallineati senza che nulla lo dica — un server lasciato acceso
 * dalla sera prima fa sparire in silenzio tutto quello che sta dalla sua
 * parte (mira assistita, allarme, modalita' in solitaria) e sembra che il
 * gioco sia rotto. Se i numeri non coincidono, ora lo si legge a schermo.
 */
export const VERSIONE = '1.2';

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
  rinforzi: 5, // secondi fra un rinforzo e l'altro, invece di dodici
  memoria: 10, // quanto a lungo continuano a cercarvi dopo il richiamo
  // Con l'allarme corrono: da fermi sono piu' lenti di voi, e inseguendovi da
  // dietro non vi raggiungerebbero mai. Il ritorno dev'essere una fuga, e per
  // esserlo qualcuno vi deve tagliare la strada.
  velocita: 1.3,
  // I rinforzi arrivano DAVANTI, verso l'uscita, non alle spalle: e' quello
  // che rende il ritorno un attraversamento invece di una passeggiata con
  // qualcuno che arranca dietro.
  davanti: true,
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
  durataEstrazione: 2.5,
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
export const MODALITA = ['sabotaggio', 'bomba', 'dominio'];

export function modalitaDelSettore(numero) {
  return MODALITA[(numero - 1) % MODALITA.length];
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
  raggioSchegge: 90,
  dannoSchegge: 25,
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
  rinforzi: 6, // secondi fra un nemico e l'altro mentre si tiene la zona
};
