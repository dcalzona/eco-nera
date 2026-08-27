// Le lingue del gioco.
//
// Un dizionario per lingua, con le stesse chiavi. Non c'e' niente di
// automatico: se una chiave manca in una lingua si vede subito, perche' la
// prova le confronta tutte con l'italiano e si lamenta. Meglio accorgersene
// scrivendo che trovarsi una scritta in italiano in mezzo a una partita in
// russo.
//
// Il nome del gioco non si traduce, e nemmeno i nomi delle tre classi: sono
// nomi propri. Si traduce quello che spiegano.

export const LINGUE = {
  it: 'Italiano',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
  nl: 'Nederlands',
};

const TESTI = {
  it: {
    'menu.entra': 'Entra',
    'menu.guida': 'Come si gioca',
    'menu.versioneVecchia':
      'Attenzione: il server e alla versione {server}, l app alla {client}. Riavvia il server sul PC, altrimenti mancheranno pezzi di gioco.',

    'classe.faro.arma': 'Fucile a canne mozze',
    'classe.faro.ruolo': 'Medico',
    'classe.faro.desc':
      'Vede largo e vicino. Devastante addosso, inutile lontano. Lascia a terra un kit che rimette in sesto tutti e due.',
    'classe.eco.arma': 'Fucile di precisione',
    'classe.eco.ruolo': 'Ricognitore',
    'classe.eco.desc':
      'Vede stretto e lontanissimo. Un colpo solo, lento e pesante. Posa un sonar che scopre i nemici anche oltre i muri.',
    'classe.assalto.arma': "Fucile d'assalto",
    'classe.assalto.ruolo': 'Incursore',
    'classe.assalto.desc':
      'Vede a media distanza. Raffica veloce e continua. Pianta un riparo: da dietro si spara senza essere colpiti.',
    'abilita.kit': 'kit medico a terra',
    'abilita.sonar': 'sonar a terra',
    'abilita.riparo': 'riparo a terra',
    'abilita.kit.breve': 'KIT',
    'abilita.sonar.breve': 'SONAR',
    'abilita.riparo.breve': 'RIPARO',
    'guida.titolo': 'Come si gioca',
    'guida.buio.titolo': 'Il buio',
    'guida.buio.testo':
      'Vedi solo quello che la tua torcia illumina, piu quello che illumina il tuo compagno. I due campi visivi si sommano: in due si vede quasi il doppio. Quello che hai gia visto resta disegnato spento, come un ricordo.',
    'guida.comandi.titolo': 'Comandi',
    'guida.comandi.muovere': 'Dito a sinistra — ti muovi.',
    'guida.comandi.sparare': 'Dito a destra — punti, e spari tenendo premuto.',
    'guida.comandi.torcia':
      'TORCIA — la spegni. Vedi pochissimo, ma i nemici ti individuano a meno della meta della distanza. La carica dura ventiquattro secondi.',
    'guida.comandi.abilita': "Il secondo pulsante — l'abilita della tua classe.",
    'guida.rumore.titolo': 'Il rumore',
    'guida.rumore.testo':
      'I rumori girano per i corridoi, non attraverso i muri: uno sparo in una stanza chiusa non si sente. Quello che senti arriva dall orecchio giusto, e un archetto sul bordo dello schermo ti dice da dove. Sai dove, non sai cosa. Ogni arma fa un baccano diverso.',
    'guida.terra.titolo': 'A terra, non morti',
    'guida.terra.testo':
      'A zero vita resti a terra trenta secondi e ti trascini piano. Il compagno puo raggiungerti e rimetterti in piedi restandoti vicino tre secondi. Se non resta nessuno in piedi, la spedizione e persa.',
    'guida.rifornimenti.titolo': 'Armatura e casse di ricarica',
    'guida.rifornimenti.testo':
      "L'armatura incassa per prima: finita quella i colpi cominciano a far male sul serio. La si trova nelle casse sparse per le stanze, che danno molta armatura e poca salute — la salute vera la rimette solo il kit del medico. Poi ci sono le CASSE DI RICARICA, appoggiate ai muri: fermandocisi sopra un paio di secondi si rifanno colpi, kit, sonar e ripari. Non si consumano, ma quei due secondi fermi in mezzo a un settore sveglio sono un rischio che si corre apposta. Ce ne sono meno man mano che si scende.",
    'guida.spedizione.titolo': 'La spedizione',
    'guida.spedizione.testo':
      "Ogni settore ha la sua missione. Ogni cinque settori le trovate tutte e quattro in ordine sparso, e il quinto e' sempre il boss. Finita la missione — qualunque fosse — scatta l'allarme e si torna all'ingresso con tutto il settore addosso. Si esce insieme: se uno e' fuori dal cerchio non parte nessuno, e tenerlo costa qualche secondo fermi li'.",
    'guida.chiudi': 'Ho capito',

    'pausa.titolo': 'Pausa',
    'pausa.avviso': 'La partita non si ferma: il server va avanti e il compagno anche.',
    'pausa.riprendi': 'Riprendi',
    'pausa.esci': 'Esci al menu',

    'fine.titolo': 'Spedizione perduta',
    'fine.dettaglio': 'Siete arrivati al settore {settore}. Nessuno e rimasto in piedi.',
    'fine.torna': 'Torna al menu',

    'server.titolo': 'Eco Nera',
    'server.istruzione': "Scrivi l'indirizzo che il server stampa sul PC.",
    'server.collega': 'Collegati',
    'server.sbagliato': 'Scrivi qualcosa tipo 192.168.2.46:5190',
    'server.nessuno': 'Non risponde nessuno a questo indirizzo.',

    'gioco.collegamento': 'Mi collego al server…',
    'gioco.caduta': 'Connessione persa — riprovo…',
    'gioco.stallo': 'Rete interrotta — aspetto…',
    'gioco.torcia': 'TORCIA',
    'gioco.allarme': "ALLARME — torna all'uscita",
    'gioco.tornaUscita': 'Settore {settore} — torna all uscita',
    'gioco.server': 'Settore {settore} — server {accesi}/{totale}',
    'gioco.aTerra': 'A TERRA — {secondi}s',
    'gioco.tiRialzano': 'ti stanno rialzando…',
    'gioco.fuoriGioco': 'Fuori gioco — rientri fra {secondi}s',
    'gioco.compagnoATerra': '{nome} e a terra — {secondi}s',
    'gioco.compagnoRientra': '{nome} rientra fra {secondi}s',
    'gioco.nemiciInVista': 'nemici in vista: {quanti}',

    'briefing.settore': 'Settore {settore}',
    'briefing.vai': 'Sono pronto',
    'briefing.conto': 'si parte fra {secondi}s',
    'briefing.attesa': 'aspetto il compagno…',
    'modo.sabotaggio.nome': 'Sabotaggio',
    'modo.sabotaggio.come':
      "Nelle stanze in fondo ci sono dei server appoggiati alle pareti. Restagli accanto qualche secondo per spegnerli: in due ci vuole meta tempo. Spenti tutti, si torna all'uscita.",
    'modo.bomba.nome': 'Ordigno',
    'modo.bomba.come':
      "Prendi l'ordigno dov'e segnato. Da quel momento hai {secondi} secondi per portarlo sul punto arancione, e in due chi lo porta ha le mani occupate e non spara. Piazzato, difendilo: la miccia scende solo se non c'e nessuno di loro li intorno.",
    'modo.dominio.nome': 'Dominio',
    'modo.dominio.come':
      "In fondo al settore c'e una zona segnata. Entraci e restaci: la conquista sale finche ci sei tu e non ci sono loro. Continuano ad arrivare, quindi non e questione di nascondersi, e questione di tenere.",
    'gioco.bombaPrendi': "Settore {settore} — prendi l'ordigno",
    'gioco.bombaPorta': 'PIAZZALA — {secondi}s',
    'gioco.bombaDifendi': 'DIFENDILA — {secondi}s',
    'gioco.bombaBloccata': 'MICCIA FERMA — sono addosso alla bomba',
    'gioco.zona': 'Settore {settore} — zona {percento}%',
    'gioco.zonaContesa': 'ZONA CONTESA — sono dentro',
    'guida.riparo.titolo': 'Il riparo',
    'guida.riparo.testo':
      "L'Assalto pianta un riparo davanti a se'. Ferma i colpi dei nemici e non i vostri: da dietro si spara senza essere colpiti. Non e' un muro pero' — i corpi ci passano sopra, i vostri e i loro, al trenta per cento della velocita', ed e' li' che si e' scoperti. Abbastanza piombo lo butta giu'. Se ne piantano DUE per settore, e si ricaricano alle casse: il contatore sta sul tasto che li pianta.",
    'guida.modalita.titolo': 'Le tre missioni',
    'guida.modalita.sabotaggio':
      'Sabotaggio — spegni i server appoggiati alle pareti delle stanze in fondo.',
    'guida.modalita.bomba':
      'Ordigno — portalo sul punto segnato e difendilo finche non scoppia.',
    'guida.modalita.dominio': 'Dominio — entra nella zona segnata e restaci mentre arrivano.',

    'menu.controller': 'Controller collegato: {nome}',
    'server.senza': 'Gioca senza server',
    'guida.controller.titolo': 'Il controller',
    'guida.controller.testo':
      "Se al telefono e attaccato un controller — un DualShock, un DualSense — comanda quello: stick sinistro per muoverti, destro per mirare, R2 o R1 per sparare. Col pad mirare non e sparare: decide il grilletto. L2 o L1 accendono e spengono la torcia, croce o quadrato usano l'abilita, options apre il menu. Premi un tasto qualsiasi perche il telefono se ne accorga.",
    'guida.offline.titolo': 'Fuori casa',
    'guida.offline.testo':
      "Scegliendo SOLO il mondo gira dentro il telefono: niente PC, niente Wi-Fi, si gioca in treno. E' lo stesso gioco — stessa simulazione, stesse missioni, stesso buio — ma da soli. La partita fuori casa e' sua e resta nel telefono: quella di casa, sul server, non si tocca.",
    'menu.controllerStrano':
      'Controller collegato: {nome} — mappatura non standard, i comandi potrebbero essere sbagliati',

    'menu.serverPronto': 'Server: pronto',
    'menu.serverCerco': 'Server: sto cercando…',
    'menu.serverNiente':
      'Server: non risponde — tocca per cambiare indirizzo, o spunta «senza server» qui sotto',

    'guida.invito.titolo': 'In due via internet: una stanza',
    'guida.invito.testo':
      "Vi mettete d'accordo su un numero di quattro cifre e lo scrivete tutti e due: chi entra per primo ospita — il mondo gira nel suo telefono — e il secondo si collega direttamente li', senza niente in mezzo. Chi ospita non lo sceglie nessuno, e il gioco ve lo scrive. Se chi ospita esce, la partita finisce: il mondo era sul suo telefono.",

    'invito.servizio': 'Indirizzo del servizio',
    'invito.stato.servizioGiu': 'il servizio non risponde: provate lo scambio a mano qui sotto',

    'invito.stato.senzaIndirizzo':
      "Manca l'indirizzo del servizio: scrivilo qui sotto. Intanto si puo' fare a mano.",
    'invito.stato.servizioDice': 'il servizio risponde:',

    'menu.scegliClasse': 'Scelta del personaggio',
    'menu.scegliModo': 'Scelta modalita',
    'menu.modo.solo': 'Solo',
    'menu.modo.casa': 'Duo (offline)',
    'menu.modo.rete': 'Duo (online)',
    'menu.collega': 'Collega',
    'menu.versione': 'versione',
    'stanza.quattroCifre': 'servono quattro cifre',
    'stanza.entro': 'entro nella stanza...',
    'stanza.ospitoAspetto': 'ospiti tu: sto aspettando l altro',
    'stanza.cercoChiOspita': 'cerco chi ospita...',
    'stanza.collegatoOspiti': 'collegati! Ospiti tu: il gioco gira qui',
    'stanza.collegatoOspita': 'collegati! Ospita l altro telefono',
    'stanza.nessunoLi': 'in questa stanza non si e fatto vivo nessuno: riprova',
    'stanza.nessunoArrivato': 'non e arrivato nessuno',

    'gioco.ricarico': 'ricarico',
    'gioco.ricarica': 'mi rifornisco...',

    'menu.scegliDifficolta': 'Difficolta',
    'menu.difficoltaDalServer': 'Difficolta: la decide il server di casa',
    'menu.difficolta.facile': 'Facile',
    'menu.difficolta.normale': 'Normale',
    'menu.difficolta.difficile': 'Difficile',
    'menu.difficolta.incubo': 'Incubo',
    'fine.vittoria': 'SPEDIZIONE COMPIUTA',
    'fine.dettaglioVittoria': 'Tutti e {settori} i settori. Siete usciti.',
    'gioco.compagnoSparito': "Il compagno non c’è. Il mondo aspetta.",

    'menu.difficolta.survival': 'Survival',
    'modo.convoglio.nome': 'Scorta il convoglio',
    'modo.convoglio.come':
      'Stagli vicino e avanza. Se lo lasci solo torna indietro, e il tempo non aspetta.',
    'modo.boss.nome': 'Uccidi il boss',
    'modo.boss.come':
      'Risali il corridoio, ricaricati in fondo, e abbatti quello grosso. Poi le porte si aprono.',
    'gioco.convoglio': 'convoglio',
    'gioco.convoglioSolo': 'il convoglio torna indietro!',

    'guida.munizioni.titolo': 'I colpi finiscono',
    'guida.munizioni.testo':
      "Tre caricatori a testa: venti colpi l'uno per l'Assalto, dieci per Faro ed Eco. Finita la canna si ricarica da sola, e per quei secondi si e' disarmati. I numeri non sono uguali per tutti apposta: con una dotazione l'Eco fa trenta nemici (uno per colpo), il Faro quindici, l'Assalto dodici. Chi spara tanto finisce presto, chi mira bene dura. I colpi si vedono nel tondo accanto ai tasti: l'anello e' il caricatore, i puntini sono le scorte.",
    'guida.modalita.convoglio':
      'Convoglio — stagli vicino e avanza; se lo lasci solo torna indietro, e il tempo non aspetta.',
    'guida.modalita.boss':
      'Boss — risali il corridoio riparandoti dietro le barriere di traverso, ricaricati in fondo, abbatti quello grosso. Ce ne sono tre: il bruto e uno scagnozzo grande il doppio e spara come loro, il carro tira di rado ma il colpo e grosso e fa malissimo, il mitragliere tira fittissimo ma solo da vicino. Poi le porte si aprono e si esce di la.',
    'guida.difficolta.titolo': 'Difficolta e Survival',
    'guida.difficolta.testo':
      "Quattro difficolta': in Facile il gioco e' esattamente quello di sempre, le altre alzano quanti sono i nemici, quanto fanno male e quanto in fretta arrivano i rinforzi. La campagna e' di quindici settori e poi si e' finita. SURVIVAL e' un'altra cosa e per questo ha un altro colore: non si sceglie nessuna difficolta', si parte da facile e ogni cinque livelli si sale, all'infinito. Si vede fin dove si arriva.",
    'guida.comandi.ricarica':
      'Il tondo dei colpi — si preme per ricaricare, anche col caricatore a meta (R sulla tastiera, cerchio sul pad).',
  },

  en: {
    'menu.entra': 'Enter',
    'menu.guida': 'How to play',
    'menu.versioneVecchia':
      'Warning: the server is version {server}, the app is {client}. Restart the server on the PC, or parts of the game will be missing.',

    'classe.faro.arma': 'Sawn-off shotgun',
    'classe.faro.ruolo': 'Medic',
    'classe.faro.desc':
      'Sees wide and close. Devastating up close, useless at range. Drops a kit that patches up both of you.',
    'classe.eco.arma': 'Sniper rifle',
    'classe.eco.ruolo': 'Scout',
    'classe.eco.desc':
      'Sees narrow and very far. One slow, heavy shot. Places a sonar that reveals enemies even through walls.',
    'classe.assalto.arma': 'Assault rifle',
    'classe.assalto.ruolo': 'Raider',
    'classe.assalto.desc':
      'Sees at middling range. Fast, steady bursts. Plants a barricade you can shoot from without being hit.',
    'abilita.kit': 'medkit on the ground',
    'abilita.sonar': 'sonar on the ground',
    'abilita.riparo': 'deployable cover',
    'abilita.kit.breve': 'KIT',
    'abilita.sonar.breve': 'SONAR',
    'abilita.riparo.breve': 'COVER',
    'guida.titolo': 'How to play',
    'guida.buio.titolo': 'The dark',
    'guida.buio.testo':
      'You only see what your torch lights up, plus what your partner lights up. The two fields of view add together: together you see almost twice as much. What you have already seen stays drawn dimly, like a memory.',
    'guida.comandi.titolo': 'Controls',
    'guida.comandi.muovere': 'Left thumb — you move.',
    'guida.comandi.sparare': 'Right thumb — you aim, and fire while holding.',
    'guida.comandi.torcia':
      'TORCH — switch it off. You see very little, but enemies spot you at less than half the distance. The charge lasts twenty-four seconds.',
    'guida.comandi.abilita': 'The second button — your class ability.',
    'guida.rumore.titolo': 'Sound',
    'guida.rumore.testo':
      'Sound travels along corridors, not through walls: a shot in a sealed room cannot be heard. What you hear comes from the right ear, and an arc at the edge of the screen tells you from where. You know where, not what. Each weapon makes a different racket.',
    'guida.terra.titolo': 'Down, not dead',
    'guida.terra.testo':
      'At zero health you stay down for thirty seconds, crawling slowly. Your partner can reach you and get you back up by staying close for three seconds. If nobody is left standing, the expedition is lost.',
    'guida.rifornimenti.titolo': 'Armour and resupply crates',
    'guida.rifornimenti.testo':
      "Armour takes the hits first: once it is gone, shots start to really hurt. You find it in the crates scattered through the rooms, which give a lot of armour and little health — real health only comes back from the medic's kit. Then there are the RESUPPLY CRATES against the walls: stand on one for a couple of seconds and you get back ammo, kit, sonar and barriers. They do not run out, but standing still in a wide-awake sector is a risk you take on purpose. The deeper you go, the fewer there are.",
    'guida.spedizione.titolo': 'The expedition',
    'guida.spedizione.testo':
      'Every sector has its own mission. Every five sectors you get all four in a shuffled order, and the fifth is always the boss. Once it is done — whichever it was — the alarm goes off and you head back with the whole sector awake. You leave together: if one of you is outside the circle nobody goes, and holding it costs a few seconds standing there.',
    'guida.chiudi': 'Got it',

    'pausa.titolo': 'Paused',
    'pausa.avviso': 'The game does not stop: the server keeps going, and so does your partner.',
    'pausa.riprendi': 'Resume',
    'pausa.esci': 'Quit to menu',

    'fine.titolo': 'Expedition lost',
    'fine.dettaglio': 'You reached sector {settore}. Nobody was left standing.',
    'fine.torna': 'Back to menu',

    'server.titolo': 'Eco Nera',
    'server.istruzione': 'Type the address the server prints on the PC.',
    'server.collega': 'Connect',
    'server.sbagliato': 'Type something like 192.168.2.46:5190',
    'server.nessuno': 'Nobody is answering at this address.',

    'gioco.collegamento': 'Connecting to the server…',
    'gioco.caduta': 'Connection lost — retrying…',
    'gioco.stallo': 'Network dropped — waiting…',
    'gioco.torcia': 'TORCH',
    'gioco.allarme': 'ALARM — get back to the exit',
    'gioco.tornaUscita': 'Sector {settore} — back to the exit',
    'gioco.server': 'Sector {settore} — servers {accesi}/{totale}',
    'gioco.aTerra': 'DOWN — {secondi}s',
    'gioco.tiRialzano': 'being picked up…',
    'gioco.fuoriGioco': 'Out — back in {secondi}s',
    'gioco.compagnoATerra': '{nome} is down — {secondi}s',
    'gioco.compagnoRientra': '{nome} back in {secondi}s',
    'gioco.nemiciInVista': 'enemies in sight: {quanti}',

    'briefing.settore': 'Sector {settore}',
    'briefing.vai': "I'm ready",
    'briefing.conto': 'starting in {secondi}s',
    'briefing.attesa': 'waiting for your partner…',
    'modo.sabotaggio.nome': 'Sabotage',
    'modo.sabotaggio.come':
      'Servers stand against the walls of the far rooms. Stay next to one for a few seconds to shut it down: two of you do it in half the time. Once they are all off, head back to the exit.',
    'modo.bomba.nome': 'Bomb',
    'modo.bomba.come':
      'Pick the bomb up where it is marked. From then on you have {secondi} seconds to carry it to the orange spot, and with two of you whoever carries it has their hands full and cannot shoot. Once it is down, defend it: the fuse only runs while none of them are nearby.',
    'modo.dominio.nome': 'Hold',
    'modo.dominio.come':
      'There is a marked zone at the far end of the sector. Get in and stay in: the capture only climbs while you are there and they are not. They keep coming, so it is not about hiding, it is about holding.',
    'gioco.bombaPrendi': 'Sector {settore} — grab the bomb',
    'gioco.bombaPorta': 'PLANT IT — {secondi}s',
    'gioco.bombaDifendi': 'DEFEND IT — {secondi}s',
    'gioco.bombaBloccata': 'FUSE STALLED — they are on the bomb',
    'gioco.zona': 'Sector {settore} — zone {percento}%',
    'gioco.zonaContesa': 'ZONE CONTESTED — they are inside',
    'guida.riparo.titolo': 'The barricade',
    'guida.riparo.testo':
      'The Assault plants a barrier in front of them. It stops enemy shots and not yours: from behind it you shoot without being hit. It is not a wall, though — bodies climb over it, yours and theirs, at thirty per cent speed, and that is when you are exposed. Enough gunfire brings it down. You get TWO per sector, and they come back at the resupply crates: the counter is on the button that plants them.',
    'guida.modalita.titolo': 'The three missions',
    'guida.modalita.sabotaggio':
      'Sabotage — shut down the servers standing against the walls of the far rooms.',
    'guida.modalita.bomba':
      'Bomb — carry it to the marked spot and defend it until it goes off.',
    'guida.modalita.dominio': 'Hold — get into the marked zone and stay there while they come.',

    'menu.controller': 'Controller connected: {nome}',
    'server.senza': 'Play without a server',
    'guida.controller.titolo': 'The controller',
    'guida.controller.testo':
      'If a controller is attached to the phone — a DualShock, a DualSense — it takes over: left stick to move, right stick to aim, R2 or R1 to shoot. With a pad, aiming is not shooting: the trigger decides. L2 or L1 toggle the torch, cross or square use the ability, options opens the menu. Press any button so the phone notices it.',
    'guida.offline.titolo': 'Away from home',
    'guida.offline.testo':
      'Pick SOLO and the world runs inside the phone: no PC, no Wi-Fi, playable on a train. It is the same game — same simulation, same missions, same dark — but alone. The away game is its own and stays on the phone: the one at home, on the server, is untouched.',
    'menu.controllerStrano':
      'Controller connected: {nome} — non-standard mapping, the controls may come out wrong',

    'menu.serverPronto': 'Server: ready',
    'menu.serverCerco': 'Server: looking…',
    'menu.serverNiente':
      'Server: no answer — tap to change the address, or tick “no server” below',

    'guida.invito.titolo': 'Two players over the internet: a room',
    'guida.invito.testo':
      'You agree on a four-digit number and you both type it in: whoever gets there first hosts — the world runs on their phone — and the second one connects straight to it, with nothing in between. Nobody picks the host, and the game tells you which of you it is. If the host leaves, the match ends: the world was on their phone.',

    'invito.servizio': 'Service address',
    'invito.stato.servizioGiu': 'the service is not answering: try the manual swap below',

    'invito.stato.senzaIndirizzo':
      'The service address is missing: type it below. Meanwhile you can swap by hand.',
    'invito.stato.servizioDice': 'the service says:',

    'menu.scegliClasse': 'Choose your character',
    'menu.scegliModo': 'Choose the mode',
    'menu.modo.solo': 'Solo',
    'menu.modo.casa': 'Duo (offline)',
    'menu.modo.rete': 'Duo (online)',
    'menu.collega': 'Connect',
    'menu.versione': 'version',
    'stanza.quattroCifre': 'four digits, please',
    'stanza.entro': 'entering the room...',
    'stanza.ospitoAspetto': 'you are hosting: waiting for the other one',
    'stanza.cercoChiOspita': 'looking for the host...',
    'stanza.collegatoOspiti': 'connected! You host: the game runs here',
    'stanza.collegatoOspita': 'connected! The other phone hosts',
    'stanza.nessunoLi': 'nobody showed up in this room: try again',
    'stanza.nessunoArrivato': 'nobody came',

    'gioco.ricarico': 'reloading',
    'gioco.ricarica': 'resupplying...',

    'menu.scegliDifficolta': 'Difficulty',
    'menu.difficoltaDalServer': 'Difficulty: set by the home server',
    'menu.difficolta.facile': 'Easy',
    'menu.difficolta.normale': 'Normal',
    'menu.difficolta.difficile': 'Hard',
    'menu.difficolta.incubo': 'Nightmare',
    'fine.vittoria': 'EXPEDITION COMPLETE',
    'fine.dettaglioVittoria': 'All {settori} sectors. You made it out.',
    'gioco.compagnoSparito': "Your partner is gone. The world is waiting.",

    'menu.difficolta.survival': 'Survival',
    'modo.convoglio.nome': 'Escort the convoy',
    'modo.convoglio.come':
      'Stay close and it moves. Leave it alone and it rolls back, and the clock does not wait.',
    'modo.boss.nome': 'Kill the boss',
    'modo.boss.come':
      'Push up the corridor, reload at the end, and bring down the big one. Then the doors open.',
    'gioco.convoglio': 'convoy',
    'gioco.convoglioSolo': 'the convoy is rolling back!',


    'guida.munizioni.titolo': 'Ammo runs out',
    'guida.munizioni.testo':
      'Three magazines each: twenty rounds apiece for Assault, ten for Beacon and Echo. When the magazine empties it reloads by itself, and for those seconds you are unarmed. The numbers differ on purpose: on one full load Echo kills thirty (one shot each), Beacon fifteen, Assault twelve. Spray a lot and you run dry early; aim well and you last. The count sits in the dial next to the buttons — the ring is the magazine, the dots are your spares.',
    'guida.modalita.convoglio':
      'Convoy — stay close and it moves; leave it alone and it rolls back, and the clock does not wait.',
    'guida.modalita.boss':
      'Boss — push up the corridor behind the crosswise barriers, reload at the end, bring down the big one. There are three of them: the brute is a minion twice the size and shoots like one, the tank fires rarely but the shell is huge and hurts, the gunner fires very fast but only up close. Then the doors open and you leave through them.',
    'guida.difficolta.titolo': 'Difficulty and Survival',
    'guida.difficolta.testo':
      'Four difficulties: on Easy the game is exactly the one you know, the others raise how many enemies there are, how hard they hit and how fast reinforcements arrive. The campaign is fifteen sectors and then it is over. SURVIVAL is a different thing, which is why it is a different colour: you pick no difficulty at all — it starts easy and climbs a step every five levels, forever. You see how far you get.',
    'guida.comandi.ricarica':
      'The ammo dial — press it to reload, even with a half-full magazine (R on the keyboard, circle on the pad).',
  },

  fr: {
    'menu.entra': 'Entrer',
    'menu.guida': 'Comment jouer',
    'menu.versioneVecchia':
      "Attention : le serveur est en version {server}, l'application en {client}. Redémarre le serveur sur le PC, sinon des morceaux du jeu manqueront.",

    'classe.faro.arma': 'Fusil à canon scié',
    'classe.faro.ruolo': 'Médecin',
    'classe.faro.desc':
      'Voit large et près. Dévastateur au contact, inutile à distance. Laisse au sol une trousse qui remet en état tous les deux.',
    'classe.eco.arma': 'Fusil de précision',
    'classe.eco.ruolo': 'Éclaireur',
    'classe.eco.desc':
      'Voit étroit et très loin. Un seul tir, lent et lourd. Pose un sonar qui révèle les ennemis même à travers les murs.',
    'classe.assalto.arma': "Fusil d'assaut",
    'classe.assalto.ruolo': 'Assaillant',
    'classe.assalto.desc':
      "Voit à moyenne distance. Rafales rapides et continues. Plante une barricade d'où l'on tire sans être touché.",
    'abilita.kit': 'trousse de soins au sol',
    'abilita.sonar': 'sonar au sol',
    'abilita.riparo': 'barricade au sol',
    'abilita.kit.breve': 'TROUSSE',
    'abilita.sonar.breve': 'SONAR',
    'abilita.riparo.breve': 'ABRI',
    'guida.titolo': 'Comment jouer',
    'guida.buio.titolo': "L'obscurité",
    'guida.buio.testo':
      "Tu ne vois que ce que ta lampe éclaire, plus ce qu'éclaire ton coéquipier. Les deux champs de vision s'additionnent : à deux, on voit presque le double. Ce que tu as déjà vu reste dessiné en sourdine, comme un souvenir.",
    'guida.comandi.titolo': 'Commandes',
    'guida.comandi.muovere': 'Pouce gauche — tu te déplaces.',
    'guida.comandi.sparare': 'Pouce droit — tu vises, et tu tires en maintenant.',
    'guida.comandi.torcia':
      'LAMPE — tu l éteins. Tu vois très peu, mais les ennemis te repèrent à moins de la moitié de la distance. La charge dure vingt-quatre secondes.',
    'guida.comandi.abilita': 'Le deuxième bouton — la capacité de ta classe.',
    'guida.rumore.titolo': 'Le bruit',
    'guida.rumore.testo':
      "Les bruits suivent les couloirs, ils ne traversent pas les murs : un tir dans une pièce fermée ne s'entend pas. Ce que tu entends arrive de la bonne oreille, et un arc au bord de l'écran te dit d'où. Tu sais où, pas quoi. Chaque arme fait un vacarme différent.",
    'guida.terra.titolo': 'À terre, pas morts',
    'guida.terra.testo':
      "À zéro de vie tu restes à terre trente secondes et tu rampes lentement. Ton coéquipier peut te rejoindre et te relever en restant près de toi trois secondes. S'il ne reste personne debout, l'expédition est perdue.",
    'guida.rifornimenti.titolo': 'Armure et caisses de ravitaillement',
    'guida.rifornimenti.testo':
      "L'armure encaisse en premier : une fois partie, les tirs font vraiment mal. On la trouve dans les caisses dispersees dans les salles, qui donnent beaucoup d'armure et peu de vie — la vraie vie ne revient que du kit du medecin. Il y a aussi les CAISSES DE RAVITAILLEMENT posees contre les murs : rester dessus deux secondes rend balles, kit, sonar et barrieres. Elles ne s'epuisent pas, mais rester immobile dans un secteur reveille est un risque qu'on prend expres. Plus on descend, moins il y en a.",
    'guida.spedizione.titolo': "L'expédition",
    'guida.spedizione.testo':
      "Chaque secteur a sa mission. Tous les cinq secteurs on les trouve toutes les quatre dans un ordre melange, et le cinquieme est toujours le boss. Une fois finie — quelle qu'elle soit — l'alarme se declenche et on rentre avec tout le secteur sur le dos. On sort ensemble : si l'un est hors du cercle personne ne part, et tenir le cercle coute quelques secondes immobiles.",
    'guida.chiudi': "J'ai compris",

    'pausa.titolo': 'Pause',
    'pausa.avviso': "La partie ne s'arrête pas : le serveur continue, et ton coéquipier aussi.",
    'pausa.riprendi': 'Reprendre',
    'pausa.esci': 'Quitter vers le menu',

    'fine.titolo': 'Expédition perdue',
    'fine.dettaglio': "Vous êtes arrivés au secteur {settore}. Personne n'est resté debout.",
    'fine.torna': 'Retour au menu',

    'server.titolo': 'Eco Nera',
    'server.istruzione': "Écris l'adresse que le serveur affiche sur le PC.",
    'server.collega': 'Se connecter',
    'server.sbagliato': 'Écris quelque chose comme 192.168.2.46:5190',
    'server.nessuno': 'Personne ne répond à cette adresse.',

    'gioco.collegamento': 'Connexion au serveur…',
    'gioco.caduta': 'Connexion perdue — nouvel essai…',
    'gioco.stallo': "Réseau coupé — j'attends…",
    'gioco.torcia': 'LAMPE',
    'gioco.allarme': "ALARME — retourne à la sortie",
    'gioco.tornaUscita': 'Secteur {settore} — retourne à la sortie',
    'gioco.server': 'Secteur {settore} — serveurs {accesi}/{totale}',
    'gioco.aTerra': 'À TERRE — {secondi}s',
    'gioco.tiRialzano': 'on te relève…',
    'gioco.fuoriGioco': 'Hors jeu — retour dans {secondi}s',
    'gioco.compagnoATerra': '{nome} est à terre — {secondi}s',
    'gioco.compagnoRientra': '{nome} revient dans {secondi}s',
    'gioco.nemiciInVista': 'ennemis en vue : {quanti}',

    'briefing.settore': 'Secteur {settore}',
    'briefing.vai': 'Je suis prêt',
    'briefing.conto': 'départ dans {secondi}s',
    'briefing.attesa': 'on attend ton coéquipier…',
    'modo.sabotaggio.nome': 'Sabotage',
    'modo.sabotaggio.come':
      'Des serveurs sont adossés aux murs des salles du fond. Reste à côté quelques secondes pour en éteindre un : à deux, deux fois plus vite. Tous éteints, on rentre à la sortie.',
    'modo.bomba.nome': 'Bombe',
    'modo.bomba.come':
      "Ramasse la bombe à l'endroit indiqué. À partir de là tu as {secondi} secondes pour la porter sur le point orange, et à deux celui qui la porte a les mains prises et ne tire pas. Une fois posée, défends-la : la mèche ne descend que si aucun d'eux n'est dans les parages.",
    'modo.dominio.nome': 'Contrôle',
    'modo.dominio.come':
      "Au fond du secteur, une zone marquée. Entre et restes-y : la prise ne monte que tant que tu y es et qu'ils n'y sont pas. Ils continuent d'arriver — il ne s'agit pas de se cacher, il s'agit de tenir.",
    'gioco.bombaPrendi': 'Secteur {settore} — récupère la bombe',
    'gioco.bombaPorta': 'POSE-LA — {secondi}s',
    'gioco.bombaDifendi': 'DÉFENDS-LA — {secondi}s',
    'gioco.bombaBloccata': 'MÈCHE BLOQUÉE — ils sont sur la bombe',
    'gioco.zona': 'Secteur {settore} — zone {percento}%',
    'gioco.zonaContesa': 'ZONE DISPUTÉE — ils sont dedans',
    'guida.riparo.titolo': 'La barricade',
    'guida.riparo.testo':
      "L'Assaut plante une barriere devant lui. Elle arrete les tirs ennemis et pas les votres : derriere, on tire sans etre touche. Ce n'est pas un mur — les corps l'escaladent, les votres et les leurs, a trente pour cent de la vitesse, et c'est la qu'on est expose. Assez de plomb la fait tomber. On en a DEUX par secteur, et elles reviennent aux caisses : le compteur est sur le bouton qui les plante.",
    'guida.modalita.titolo': 'Les trois missions',
    'guida.modalita.sabotaggio':
      'Sabotage — éteins les serveurs adossés aux murs des salles du fond.',
    'guida.modalita.bomba':
      "Bombe — porte-la jusqu'au point marqué et défends-la jusqu'à l'explosion.",
    'guida.modalita.dominio':
      "Contrôle — entre dans la zone marquée et restes-y pendant qu'ils arrivent.",

    'menu.controller': 'Manette connectée : {nome}',
    'server.senza': 'Jouer sans serveur',
    'guida.controller.titolo': 'La manette',
    'guida.controller.testo':
      "Si une manette est reliée au téléphone — DualShock, DualSense — c'est elle qui commande : stick gauche pour se déplacer, droit pour viser, R2 ou R1 pour tirer. À la manette, viser n'est pas tirer : c'est la gâchette qui décide. L2 ou L1 allument et éteignent la lampe, croix ou carré utilisent la capacité, options ouvre le menu. Appuie sur n'importe quelle touche pour que le téléphone la voie.",
    'guida.offline.titolo': 'Hors de chez toi',
    'guida.offline.testo':
      "Choisis SOLO et le monde tourne dans le telephone : pas de PC, pas de Wi-Fi, jouable dans le train. C'est le meme jeu — meme simulation, memes missions, meme obscurite — mais seul. La partie hors de la maison est la sienne et reste dans le telephone : celle de la maison, sur le serveur, n'est pas touchee.",
    'menu.controllerStrano':
      'Manette connectée : {nome} — mappage non standard, les commandes peuvent être fausses',

    'menu.serverPronto': 'Serveur : prêt',
    'menu.serverCerco': 'Serveur : recherche…',
    'menu.serverNiente':
      'Serveur : pas de réponse — touche pour changer l’adresse, ou coche « sans serveur » ci-dessous',

    'guida.invito.titolo': 'A deux par internet : une salle',
    'guida.invito.testo':
      "Vous convenez d'un nombre a quatre chiffres et vous le tapez tous les deux : le premier arrive heberge — le monde tourne sur son telephone — et le second s'y connecte directement, sans rien entre les deux. Personne ne choisit l'hote, et le jeu vous dit qui c'est. Si l'hote s'en va, la partie s'arrete : le monde etait sur son telephone.",

    'invito.servizio': 'Adresse du service',
    'invito.stato.servizioGiu':
      "le service ne répond pas : essayez l'échange à la main ci-dessous",

    'invito.stato.senzaIndirizzo':
      "L'adresse du service manque : écris-la ci-dessous. En attendant, on peut échanger à la main.",
    'invito.stato.servizioDice': 'le service répond :',

    'menu.scegliClasse': 'Choix du personnage',
    'menu.scegliModo': 'Choix du mode',
    'menu.modo.solo': 'Solo',
    'menu.modo.casa': 'Duo (hors ligne)',
    'menu.modo.rete': 'Duo (en ligne)',
    'menu.collega': 'Connecter',
    'menu.versione': 'version',
    'stanza.quattroCifre': 'il faut quatre chiffres',
    'stanza.entro': 'entree dans la salle...',
    'stanza.ospitoAspetto': "c'est toi l'hote : j'attends l'autre",
    'stanza.cercoChiOspita': "je cherche l'hote...",
    'stanza.collegatoOspiti': "connectes ! Tu es l'hote : le jeu tourne ici",
    'stanza.collegatoOspita': "connectes ! C'est l'autre telephone qui heberge",
    'stanza.nessunoLi': "personne ne s'est manifeste dans cette salle : reessaie",
    'stanza.nessunoArrivato': "personne n'est venu",

    'gioco.ricarico': 'je recharge',
    'gioco.ricarica': 'je me ravitaille...',

    'menu.scegliDifficolta': 'Difficulte',
    'menu.difficoltaDalServer': 'Difficulte : decidee par le serveur',
    'menu.difficolta.facile': 'Facile',
    'menu.difficolta.normale': 'Normal',
    'menu.difficolta.difficile': 'Difficile',
    'menu.difficolta.incubo': 'Cauchemar',
    'fine.vittoria': 'EXPEDITION ACCOMPLIE',
    'fine.dettaglioVittoria': 'Les {settori} secteurs. Vous etes sortis.',
    'gioco.compagnoSparito': "Ton coequipier a disparu. Le monde attend.",

    'menu.difficolta.survival': 'Survie',
    'modo.convoglio.nome': 'Escorte le convoi',
    'modo.convoglio.come':
      "Reste pres et il avance. Laisse-le seul et il recule, et le temps n'attend pas.",
    'modo.boss.nome': 'Tue le boss',
    'modo.boss.come':
      'Remonte le couloir, recharge au bout, et abats le gros. Les portes souvriront.',
    'gioco.convoglio': 'convoi',
    'gioco.convoglioSolo': 'le convoi recule !',


    'guida.munizioni.titolo': 'Les balles se terminent',
    'guida.munizioni.testo':
      "Trois chargeurs chacun : vingt balles pour l'Assaut, dix pour Phare et Echo. Le chargeur vide se recharge tout seul, et pendant ces secondes on est desarme. Les chiffres different expres : avec une dotation Echo tue trente ennemis (un par balle), Phare quinze, Assaut douze. Qui arrose finit tot, qui vise bien dure. Le compte est dans le cadran a cote des boutons : l'anneau est le chargeur, les points sont les reserves.",
    'guida.modalita.convoglio':
      "Convoi — reste pres et il avance ; laisse-le seul et il recule, et le temps n'attend pas.",
    'guida.modalita.boss':
      'Boss — remonte le couloir en te couvrant derriere les barrieres en travers, recharge au bout, abats le gros. Il y en a trois : la brute est un sbire deux fois plus grand qui tire pareil, le char tire rarement mais son obus fait tres mal, le mitrailleur tire tres vite mais seulement de pres. Les portes souvrent et on sort par la.',
    'guida.difficolta.titolo': 'Difficulte et Survie',
    'guida.difficolta.testo':
      "Quatre difficultes : en Facile le jeu est exactement celui que tu connais, les autres augmentent le nombre d'ennemis, leurs degats et la vitesse des renforts. La campagne fait quinze secteurs et puis c'est fini. SURVIE est autre chose, d'ou la couleur differente : on ne choisit aucune difficulte — on part en facile et on monte d'un cran tous les cinq niveaux, sans fin. On voit jusqu'ou on arrive.",
    'guida.comandi.ricarica':
      'Le cadran des balles — appuie pour recharger, meme a moitie plein (R au clavier, cercle sur la manette).',
  },

  es: {
    'menu.entra': 'Entrar',
    'menu.guida': 'Cómo se juega',
    'menu.versioneVecchia':
      'Atención: el servidor está en la versión {server} y la aplicación en la {client}. Reinicia el servidor en el PC o faltarán partes del juego.',

    'classe.faro.arma': 'Escopeta recortada',
    'classe.faro.ruolo': 'Médico',
    'classe.faro.desc':
      'Ve ancho y cerca. Demoledora de cerca, inútil de lejos. Deja en el suelo un botiquín que recompone a los dos.',
    'classe.eco.arma': 'Rifle de precisión',
    'classe.eco.ruolo': 'Explorador',
    'classe.eco.desc':
      'Ve estrecho y lejísimos. Un solo disparo, lento y pesado. Coloca un sónar que descubre a los enemigos incluso a través de los muros.',
    'classe.assalto.arma': 'Fusil de asalto',
    'classe.assalto.ruolo': 'Asaltante',
    'classe.assalto.desc':
      'Ve a media distancia. Ráfagas rápidas y continuas. Planta una barricada desde la que disparar sin recibir.',
    'abilita.kit': 'botiquín en el suelo',
    'abilita.sonar': 'sónar en el suelo',
    'abilita.riparo': 'barricada desplegable',
    'abilita.kit.breve': 'BOTIQUÍN',
    'abilita.sonar.breve': 'SÓNAR',
    'abilita.riparo.breve': 'PARAPETO',
    'guida.titolo': 'Cómo se juega',
    'guida.buio.titolo': 'La oscuridad',
    'guida.buio.testo':
      'Solo ves lo que ilumina tu linterna, más lo que ilumina tu compañero. Los dos campos de visión se suman: entre dos se ve casi el doble. Lo que ya has visto queda dibujado apagado, como un recuerdo.',
    'guida.comandi.titolo': 'Controles',
    'guida.comandi.muovere': 'Dedo izquierdo — te mueves.',
    'guida.comandi.sparare': 'Dedo derecho — apuntas, y disparas manteniendo pulsado.',
    'guida.comandi.torcia':
      'LINTERNA — la apagas. Ves poquísimo, pero los enemigos te detectan a menos de la mitad de distancia. La carga dura veinticuatro segundos.',
    'guida.comandi.abilita': 'El segundo botón — la habilidad de tu clase.',
    'guida.rumore.titolo': 'El ruido',
    'guida.rumore.testo':
      'Los ruidos recorren los pasillos, no atraviesan los muros: un disparo en una sala cerrada no se oye. Lo que oyes llega por el oído correcto, y un arco en el borde de la pantalla te dice desde dónde. Sabes dónde, no sabes qué. Cada arma hace un estruendo distinto.',
    'guida.terra.titolo': 'En el suelo, no muertos',
    'guida.terra.testo':
      'Con cero de vida te quedas en el suelo treinta segundos y te arrastras despacio. Tu compañero puede alcanzarte y levantarte quedándose cerca tres segundos. Si no queda nadie en pie, la expedición se pierde.',
    'guida.rifornimenti.titolo': 'Armadura y cajas de recarga',
    'guida.rifornimenti.testo':
      'La armadura encaja primero: agotada esa, los disparos empiezan a doler de verdad. Se encuentra en las cajas repartidas por las salas, que dan mucha armadura y poca vida — la vida de verdad solo la devuelve el kit del medico. Ademas estan las CAJAS DE RECARGA apoyadas en las paredes: parandose encima un par de segundos vuelven balas, kit, sonar y barreras. No se agotan, pero quedarse quieto en un sector despierto es un riesgo que se corre a proposito. Cuanto mas se baja, menos hay.',
    'guida.spedizione.titolo': 'La expedición',
    'guida.spedizione.testo':
      'Cada sector tiene su mision. Cada cinco sectores salen las cuatro en orden mezclado, y el quinto es siempre el jefe. Terminada la mision — la que fuera — salta la alarma y se vuelve con todo el sector encima. Se sale juntos: si uno esta fuera del circulo no sale nadie, y mantenerlo cuesta unos segundos ahi parados.',
    'guida.chiudi': 'Entendido',

    'pausa.titolo': 'Pausa',
    'pausa.avviso': 'La partida no se detiene: el servidor sigue, y tu compañero también.',
    'pausa.riprendi': 'Reanudar',
    'pausa.esci': 'Salir al menú',

    'fine.titolo': 'Expedición perdida',
    'fine.dettaglio': 'Llegasteis al sector {settore}. No quedó nadie en pie.',
    'fine.torna': 'Volver al menú',

    'server.titolo': 'Eco Nera',
    'server.istruzione': 'Escribe la dirección que el servidor muestra en el PC.',
    'server.collega': 'Conectar',
    'server.sbagliato': 'Escribe algo como 192.168.2.46:5190',
    'server.nessuno': 'Nadie responde en esta dirección.',

    'gioco.collegamento': 'Conectando con el servidor…',
    'gioco.caduta': 'Conexión perdida — reintentando…',
    'gioco.stallo': 'Red interrumpida — esperando…',
    'gioco.torcia': 'LINTERNA',
    'gioco.allarme': 'ALARMA — vuelve a la salida',
    'gioco.tornaUscita': 'Sector {settore} — vuelve a la salida',
    'gioco.server': 'Sector {settore} — servidores {accesi}/{totale}',
    'gioco.aTerra': 'EN EL SUELO — {secondi}s',
    'gioco.tiRialzano': 'te están levantando…',
    'gioco.fuoriGioco': 'Fuera — vuelves en {secondi}s',
    'gioco.compagnoATerra': '{nome} está en el suelo — {secondi}s',
    'gioco.compagnoRientra': '{nome} vuelve en {secondi}s',
    'gioco.nemiciInVista': 'enemigos a la vista: {quanti}',

    'briefing.settore': 'Sector {settore}',
    'briefing.vai': 'Estoy listo',
    'briefing.conto': 'empieza en {secondi}s',
    'briefing.attesa': 'esperando a tu compañero…',
    'modo.sabotaggio.nome': 'Sabotaje',
    'modo.sabotaggio.come':
      'Hay servidores apoyados en las paredes de las salas del fondo. Quédate al lado unos segundos para apagar uno: entre dos se tarda la mitad. Apagados todos, se vuelve a la salida.',
    'modo.bomba.nome': 'Bomba',
    'modo.bomba.come':
      'Coge el explosivo donde está marcado. Desde ese momento tienes {secondi} segundos para llevarlo al punto naranja, y entre dos quien lo lleva tiene las manos ocupadas y no dispara. Colocado, defiéndelo: la mecha solo baja si no hay ninguno de ellos cerca.',
    'modo.dominio.nome': 'Control',
    'modo.dominio.come':
      'Al fondo del sector hay una zona marcada. Entra y quédate: la conquista sube mientras estés tú y no estén ellos. Siguen llegando, así que no se trata de esconderse, se trata de aguantar.',
    'gioco.bombaPrendi': 'Sector {settore} — coge el explosivo',
    'gioco.bombaPorta': 'COLÓCALO — {secondi}s',
    'gioco.bombaDifendi': 'DEFIÉNDELO — {secondi}s',
    'gioco.bombaBloccata': 'MECHA PARADA — están encima del explosivo',
    'gioco.zona': 'Sector {settore} — zona {percento}%',
    'gioco.zonaContesa': 'ZONA DISPUTADA — están dentro',
    'guida.riparo.titolo': 'La barricada',
    'guida.riparo.testo':
      'El Asalto planta una barrera delante. Para los disparos enemigos y no los tuyos: desde detras se dispara sin recibir. No es un muro — los cuerpos la trepan, los tuyos y los suyos, al treinta por ciento de velocidad, y ahi es donde estas expuesto. Bastante plomo la tira. Se plantan DOS por sector, y vuelven en las cajas: el contador esta en el boton que las planta.',
    'guida.modalita.titolo': 'Las tres misiones',
    'guida.modalita.sabotaggio':
      'Sabotaje — apaga los servidores apoyados en las paredes de las salas del fondo.',
    'guida.modalita.bomba': 'Bomba — llévalo al punto marcado y defiéndelo hasta que estalle.',
    'guida.modalita.dominio': 'Control — entra en la zona marcada y quédate mientras llegan.',

    'menu.controller': 'Mando conectado: {nome}',
    'server.senza': 'Jugar sin servidor',
    'guida.controller.titolo': 'El mando',
    'guida.controller.testo':
      'Si hay un mando conectado al teléfono — un DualShock, un DualSense — manda él: stick izquierdo para moverte, derecho para apuntar, R2 o R1 para disparar. Con mando, apuntar no es disparar: decide el gatillo. L2 o L1 encienden y apagan la linterna, cruz o cuadrado usan la habilidad, options abre el menú. Pulsa cualquier botón para que el teléfono lo vea.',
    'guida.offline.titolo': 'Fuera de casa',
    'guida.offline.testo':
      'Eligiendo SOLO el mundo corre dentro del telefono: sin PC, sin Wi-Fi, se juega en el tren. Es el mismo juego — misma simulacion, mismas misiones, misma oscuridad — pero solo. La partida de fuera es suya y se queda en el telefono: la de casa, en el servidor, no se toca.',
    'menu.controllerStrano':
      'Mando conectado: {nome} — mapeo no estándar, los controles pueden salir mal',

    'menu.serverPronto': 'Servidor: listo',
    'menu.serverCerco': 'Servidor: buscando…',
    'menu.serverNiente':
      'Servidor: no responde — toca para cambiar la dirección, o marca «sin servidor» aquí abajo',

    'guida.invito.titolo': 'Dos por internet: una sala',
    'guida.invito.testo':
      'Os poneis de acuerdo en un numero de cuatro cifras y lo escribis los dos: quien llega primero es el anfitrion — el mundo corre en su telefono — y el segundo se conecta directamente alli, sin nada en medio. Nadie elige al anfitrion, y el juego os dice quien es. Si el anfitrion se va, la partida termina: el mundo estaba en su telefono.',

    'invito.servizio': 'Dirección del servicio',
    'invito.stato.servizioGiu':
      'el servicio no responde: probad el intercambio a mano de abajo',

    'invito.stato.senzaIndirizzo':
      'Falta la dirección del servicio: escríbela abajo. Mientras tanto se puede hacer a mano.',
    'invito.stato.servizioDice': 'el servicio responde:',

    'menu.scegliClasse': 'Eleccion del personaje',
    'menu.scegliModo': 'Eleccion del modo',
    'menu.modo.solo': 'Solo',
    'menu.modo.casa': 'Duo (sin conexion)',
    'menu.modo.rete': 'Duo (en linea)',
    'menu.collega': 'Conectar',
    'menu.versione': 'version',
    'stanza.quattroCifre': 'hacen falta cuatro cifras',
    'stanza.entro': 'entrando en la sala...',
    'stanza.ospitoAspetto': 'anfitrion eres tu: espero al otro',
    'stanza.cercoChiOspita': 'buscando al anfitrion...',
    'stanza.collegatoOspiti': 'conectados! Anfitrion eres tu: el juego corre aqui',
    'stanza.collegatoOspita': 'conectados! El otro telefono es el anfitrion',
    'stanza.nessunoLi': 'en esta sala no ha aparecido nadie: intentalo otra vez',
    'stanza.nessunoArrivato': 'no ha venido nadie',

    'gioco.ricarico': 'recargando',
    'gioco.ricarica': 'reabasteciendo...',

    'menu.scegliDifficolta': 'Dificultad',
    'menu.difficoltaDalServer': 'Dificultad: la decide el servidor',
    'menu.difficolta.facile': 'Facil',
    'menu.difficolta.normale': 'Normal',
    'menu.difficolta.difficile': 'Dificil',
    'menu.difficolta.incubo': 'Pesadilla',
    'fine.vittoria': 'EXPEDICION COMPLETADA',
    'fine.dettaglioVittoria': 'Los {settori} sectores. Habeis salido.',
    'gioco.compagnoSparito': "Tu companero no esta. El mundo espera.",

    'menu.difficolta.survival': 'Supervivencia',
    'modo.convoglio.nome': 'Escolta el convoy',
    'modo.convoglio.come':
      'Quedate cerca y avanza. Si lo dejas solo retrocede, y el tiempo no espera.',
    'modo.boss.nome': 'Mata al jefe',
    'modo.boss.come':
      'Sube por el pasillo, recarga al final y derriba al grande. Luego se abren las puertas.',
    'gioco.convoglio': 'convoy',
    'gioco.convoglioSolo': 'el convoy retrocede!',


    'guida.munizioni.titolo': 'Las balas se acaban',
    'guida.munizioni.testo':
      'Tres cargadores cada uno: veinte balas para Asalto, diez para Faro y Eco. Vaciado el cargador se recarga solo, y durante esos segundos estas desarmado. Los numeros son distintos a proposito: con una dotacion Eco mata a treinta (uno por bala), Faro quince, Asalto doce. Quien dispara mucho acaba pronto, quien apunta bien dura. La cuenta esta en el circulo junto a los botones: el anillo es el cargador, los puntos son las reservas.',
    'guida.modalita.convoglio':
      'Convoy — quedate cerca y avanza; si lo dejas solo retrocede, y el tiempo no espera.',
    'guida.modalita.boss':
      'Jefe — sube por el pasillo cubriendote tras las barreras atravesadas, recarga al final, derriba al grande. Hay tres: el bruto es un esbirro del doble de tamano y dispara igual, el tanque dispara poco pero su proyectil es enorme y duele, el ametrallador dispara rapidisimo pero solo de cerca. Luego se abren las puertas y se sale por ahi.',
    'guida.difficolta.titolo': 'Dificultad y Supervivencia',
    'guida.difficolta.testo':
      'Cuatro dificultades: en Facil el juego es exactamente el de siempre, las otras suben cuantos enemigos hay, cuanto hacen dano y como de rapido llegan los refuerzos. La campana son quince sectores y luego se acaba. SUPERVIVENCIA es otra cosa, y por eso tiene otro color: no se elige ninguna dificultad — se empieza en facil y se sube un escalon cada cinco niveles, sin fin. Se ve hasta donde llegas.',
    'guida.comandi.ricarica':
      'El circulo de las balas — pulsalo para recargar, incluso a medio cargador (R en el teclado, circulo en el mando).',
  },

  ru: {
    'menu.entra': 'Войти',
    'menu.guida': 'Как играть',
    'menu.versioneVecchia':
      'Внимание: версия сервера {server}, версия приложения {client}. Перезапусти сервер на компьютере, иначе часть игры пропадёт.',

    'classe.faro.arma': 'Обрез',
    'classe.faro.ruolo': 'Медик',
    'classe.faro.desc':
      'Видит широко и близко. В упор — разрушительно, издалека — бесполезно. Оставляет на полу аптечку, которая приводит в порядок обоих.',
    'classe.eco.arma': 'Снайперская винтовка',
    'classe.eco.ruolo': 'Разведчик',
    'classe.eco.desc':
      'Видит узко и очень далеко. Один выстрел — медленный и тяжёлый. Ставит сонар, который обнаруживает врагов даже сквозь стены.',
    'classe.assalto.arma': 'Штурмовая винтовка',
    'classe.assalto.ruolo': 'Штурмовик',
    'classe.assalto.desc':
      'Видит на средней дистанции. Быстрые непрерывные очереди. Ставит укрытие: из-за него стреляешь, а тебя не задевают.',
    'abilita.kit': 'аптечка на полу',
    'abilita.sonar': 'сонар на полу',
    'abilita.riparo': 'укрытие на земле',
    'abilita.kit.breve': 'АПТЕЧКА',
    'abilita.sonar.breve': 'СОНАР',
    'abilita.riparo.breve': 'ЩИТ',
    'guida.titolo': 'Как играть',
    'guida.buio.titolo': 'Темнота',
    'guida.buio.testo':
      'Ты видишь только то, что освещает твой фонарь, плюс то, что освещает напарник. Два поля зрения складываются: вдвоём видно почти вдвое больше. Уже увиденное остаётся нарисованным приглушённо, как воспоминание.',
    'guida.comandi.titolo': 'Управление',
    'guida.comandi.muovere': 'Левый палец — движение.',
    'guida.comandi.sparare': 'Правый палец — прицел, и стрельба при удержании.',
    'guida.comandi.torcia':
      'ФОНАРЬ — выключить. Видно совсем мало, зато враги замечают тебя меньше чем с половины расстояния. Заряда хватает на двадцать четыре секунды.',
    'guida.comandi.abilita': 'Вторая кнопка — способность твоего класса.',
    'guida.rumore.titolo': 'Звук',
    'guida.rumore.testo':
      'Звук идёт по коридорам, а не сквозь стены: выстрел в закрытой комнате не слышен. То, что ты слышишь, приходит в нужное ухо, а дуга на краю экрана показывает откуда. Ты знаешь где, но не знаешь что. Каждое оружие шумит по-своему.',
    'guida.terra.titolo': 'Ранен, а не убит',
    'guida.terra.testo':
      'При нуле здоровья ты лежишь тридцать секунд и медленно ползёшь. Напарник может добраться и поднять тебя, побыв рядом три секунды. Если на ногах никого не осталось — экспедиция проиграна.',
    'guida.rifornimenti.titolo': 'Броня и ящики снабжения',
    'guida.rifornimenti.testo':
      'Броня принимает удар первой. Её находят в ящиках по комнатам: много брони и мало здоровья — здоровье возвращает только аптечка. Есть ещё ЯЩИКИ СНАБЖЕНИЯ у стен: постой на нём пару секунд — и вернутся патроны, аптечка, сонар и заграждения. Они не исчезают, но стоять неподвижно в разбуженном секторе — риск. Чем глубже, тем их меньше.',
    'guida.spedizione.titolo': 'Экспедиция',
    'guida.spedizione.testo':
      'У каждого сектора своя задача. Каждые пять секторов выпадают все четыре в случайном порядке, а пятый всегда босс. После задачи включается тревога и надо возвращаться. Выходите вместе.',
    'guida.chiudi': 'Понятно',

    'pausa.titolo': 'Пауза',
    'pausa.avviso': 'Игра не останавливается: сервер продолжает, и напарник тоже.',
    'pausa.riprendi': 'Продолжить',
    'pausa.esci': 'Выйти в меню',

    'fine.titolo': 'Экспедиция проиграна',
    'fine.dettaglio': 'Вы дошли до сектора {settore}. На ногах не осталось никого.',
    'fine.torna': 'Вернуться в меню',

    'server.titolo': 'Eco Nera',
    'server.istruzione': 'Введи адрес, который сервер печатает на компьютере.',
    'server.collega': 'Подключиться',
    'server.sbagliato': 'Напиши что-то вроде 192.168.2.46:5190',
    'server.nessuno': 'По этому адресу никто не отвечает.',

    'gioco.collegamento': 'Подключаюсь к серверу…',
    'gioco.caduta': 'Связь потеряна — пробую снова…',
    'gioco.stallo': 'Сеть пропала — жду…',
    'gioco.torcia': 'ФОНАРЬ',
    'gioco.allarme': 'ТРЕВОГА — возвращайся к выходу',
    'gioco.tornaUscita': 'Сектор {settore} — возвращайся к выходу',
    'gioco.server': 'Сектор {settore} — серверы {accesi}/{totale}',
    'gioco.aTerra': 'РАНЕН — {secondi}с',
    'gioco.tiRialzano': 'тебя поднимают…',
    'gioco.fuoriGioco': 'Вне игры — вернёшься через {secondi}с',
    'gioco.compagnoATerra': '{nome} ранен — {secondi}с',
    'gioco.compagnoRientra': '{nome} вернётся через {secondi}с',
    'gioco.nemiciInVista': 'врагов в поле зрения: {quanti}',

    'briefing.settore': 'Сектор {settore}',
    'briefing.vai': 'Я готов',
    'briefing.conto': 'старт через {secondi}с',
    'briefing.attesa': 'ждём напарника…',
    'modo.sabotaggio.nome': 'Саботаж',
    'modo.sabotaggio.come':
      'В дальних комнатах у стен стоят серверы. Постой рядом несколько секунд, чтобы выключить один: вдвоём вдвое быстрее. Когда погаснут все, возвращайтесь к выходу.',
    'modo.bomba.nome': 'Бомба',
    'modo.bomba.come':
      'Возьми бомбу там, где отмечено. С этого момента у тебя {secondi} секунд, чтобы донести её до оранжевой точки, и вдвоём тот, кто несёт, занят руками и не стреляет. Установил — защищай: фитиль горит, только пока рядом нет никого из них.',
    'modo.dominio.nome': 'Захват',
    'modo.dominio.come':
      'В дальней части сектора есть отмеченная зона. Зайди и оставайся: захват растёт, пока там ты и нет их. Они будут идти всё время — тут не прячутся, тут держат.',
    'gioco.bombaPrendi': 'Сектор {settore} — возьми бомбу',
    'gioco.bombaPorta': 'УСТАНОВИ — {secondi}с',
    'gioco.bombaDifendi': 'ЗАЩИЩАЙ — {secondi}с',
    'gioco.bombaBloccata': 'ФИТИЛЬ СТОИТ — они у бомбы',
    'gioco.zona': 'Сектор {settore} — зона {percento}%',
    'gioco.zonaContesa': 'ЗОНА ОСПАРИВАЕТСЯ — они внутри',
    'guida.riparo.titolo': 'Укрытие',
    'guida.riparo.testo':
      'Штурмовик ставит заграждение. Оно держит вражеские выстрелы и не держит ваши. Это не стена: через него перелезают на тридцати процентах скорости. Их ДВА на сектор, и они восстанавливаются у ящиков: счётчик на кнопке.',
    'guida.modalita.titolo': 'Три задания',
    'guida.modalita.sabotaggio': 'Саботаж — выключи серверы у стен дальних комнат.',
    'guida.modalita.bomba': 'Бомба — донеси её до отмеченной точки и держи, пока не взорвётся.',
    'guida.modalita.dominio': 'Захват — войди в отмеченную зону и держись, пока они идут.',

    'menu.controller': 'Геймпад подключён: {nome}',
    'server.senza': 'Играть без сервера',
    'guida.controller.titolo': 'Геймпад',
    'guida.controller.testo':
      'Если к телефону подключён геймпад — DualShock, DualSense — командует он: левый стик двигает, правый целится, R2 или R1 стреляют. С геймпадом целиться не значит стрелять: решает курок. L2 или L1 включают и выключают фонарь, крестик или квадрат — умение, options открывает меню. Нажми любую кнопку, чтобы телефон его заметил.',
    'guida.offline.titolo': 'Вне дома',
    'guida.offline.testo':
      'Выбери ОДИН — и мир крутится внутри телефона: без ПК, без Wi-Fi, можно играть в поезде. Та же игра, но в одиночку.',
    'menu.controllerStrano':
      'Геймпад подключён: {nome} — нестандартная раскладка, управление может быть неверным',

    'menu.serverPronto': 'Сервер: готов',
    'menu.serverCerco': 'Сервер: ищу…',
    'menu.serverNiente':
      'Сервер: не отвечает — нажми, чтобы сменить адрес, или поставь галочку «без сервера» ниже',

    'guida.invito.titolo': 'Вдвоём через интернет: комната',
    'guida.invito.testo':
      'Вы договариваетесь о четырёхзначном числе и вводите его оба: кто вошёл первым, тот ведёт игру — мир крутится на его телефоне — а второй подключается напрямую, без посредников. Ведущего никто не выбирает, и игра сама скажет, кто это. Если ведущий выйдет, партия закончится: мир был на его телефоне.',

    'invito.servizio': 'Адрес сервиса',
    'invito.stato.servizioGiu': 'сервис не отвечает: попробуйте обмен вручную ниже',

    'invito.stato.senzaIndirizzo':
      'Нет адреса сервиса: впиши его ниже. Пока можно обменяться вручную.',
    'invito.stato.servizioDice': 'сервис отвечает:',

    'menu.scegliClasse': 'Выбор персонажа',
    'menu.scegliModo': 'Выбор режима',
    'menu.modo.solo': 'Один',
    'menu.modo.casa': 'Вдвоём (оффлайн)',
    'menu.modo.rete': 'Вдвоём (онлайн)',
    'menu.collega': 'Подключиться',
    'menu.versione': 'версия',
    'stanza.quattroCifre': 'нужны четыре цифры',
    'stanza.entro': 'вхожу в комнату...',
    'stanza.ospitoAspetto': 'ты ведёшь игру: жду второго',
    'stanza.cercoChiOspita': 'ищу того, кто ведёт...',
    'stanza.collegatoOspiti': 'соединились! Игра идёт здесь',
    'stanza.collegatoOspita': 'соединились! Игру ведёт другой телефон',
    'stanza.nessunoLi': 'в этой комнате никто не появился: попробуй ещё',
    'stanza.nessunoArrivato': 'никто не пришёл',

    'gioco.ricarico': 'перезарядка',
    'gioco.ricarica': 'пополняю запасы...',

    'menu.scegliDifficolta': 'Сложность',
    'menu.difficoltaDalServer': 'Сложность: её задаёт сервер',
    'menu.difficolta.facile': 'Лёгкая',
    'menu.difficolta.normale': 'Обычная',
    'menu.difficolta.difficile': 'Сложная',
    'menu.difficolta.incubo': 'Кошмар',
    'fine.vittoria': 'ЭКСПЕДИЦИЯ ЗАВЕРШЕНА',
    'fine.dettaglioVittoria': 'Все {settori} секторов. Вы вышли.',
    'gioco.compagnoSparito': "Напарника нет. Мир ждёт.",

    'menu.difficolta.survival': 'Выживание',
    'modo.convoglio.nome': 'Сопроводи конвой',
    'modo.convoglio.come': 'Держись рядом — идёт. Отойдёшь — катится назад, а время не ждёт.',
    'modo.boss.nome': 'Убей босса',
    'modo.boss.come': 'Пройди коридор, пополни запасы и вали большого. Потом двери откроются.',
    'gioco.convoglio': 'конвой',
    'gioco.convoglioSolo': 'конвой катится назад!',


    'guida.munizioni.titolo': 'Патроны кончаются',
    'guida.munizioni.testo':
      'По три магазина: двадцать патронов у Штурмовика, десять у Маяка и Эха. Пустой магазин меняется сам, и эти секунды ты безоружный. Цифры разные нарочно: на одном боекомплекте Эхо убьёт тридцать, Маяк пятнадцать, Штурмовик двенадцать. Счётчик рядом с кнопками: кольцо — магазин, точки — запас.',
    'guida.modalita.convoglio':
      'Конвой — держись рядом, и он идёт; отойдёшь — катится назад, а время не ждёт.',
    'guida.modalita.boss':
      'Босс — пройди коридор, прикрываясь поперечными барьерами, пополни запасы в конце, вали большого. Их трое: громила — вдвое больший рядовой и стреляет так же, танк бьёт редко, но снаряд огромный и очень больно, пулемётчик бьёт очень часто, но только вблизи. Потом двери откроются.',
    'guida.difficolta.titolo': 'Сложность и Выживание',
    'guida.difficolta.testo':
      'Четыре сложности: на Лёгкой это ровно та игра, которую ты знаешь. Кампания — пятнадцать секторов, и на этом всё. ВЫЖИВАНИЕ — другое, поэтому и цвет другой: сложность не выбирают, она растёт каждые пять уровней, бесконечно.',
    'guida.comandi.ricarica':
      'Круг с патронами — нажми, чтобы перезарядить, даже с половиной магазина (R на клавиатуре, круг на геймпаде).',
  },

  nl: {
    'menu.entra': 'Beginnen',
    'menu.guida': 'Hoe je speelt',
    'menu.versioneVecchia':
      'Let op: de server is versie {server}, de app is {client}. Herstart de server op de pc, anders ontbreken er delen van het spel.',

    'classe.faro.arma': 'Afgezaagd jachtgeweer',
    'classe.faro.ruolo': 'Hospik',
    'classe.faro.desc':
      'Ziet breed en dichtbij. Verwoestend van dichtbij, nutteloos op afstand. Laat een kit achter die jullie allebei weer oplapt.',
    'classe.eco.arma': 'Scherpschuttersgeweer',
    'classe.eco.ruolo': 'Verkenner',
    'classe.eco.desc':
      'Ziet smal en heel ver. Eén schot, traag en zwaar. Legt een sonar neer die vijanden zelfs door muren heen laat zien.',
    'classe.assalto.arma': 'Aanvalsgeweer',
    'classe.assalto.ruolo': 'Stormtroep',
    'classe.assalto.desc':
      "Ziet op middellange afstand. Snelle, aanhoudende salvo's. Plaatst dekking waarachter je schiet zonder geraakt te worden.",
    'abilita.kit': 'verbandkit op de grond',
    'abilita.sonar': 'sonar op de grond',
    'abilita.riparo': 'dekking neerzetten',
    'abilita.kit.breve': 'KIT',
    'abilita.sonar.breve': 'SONAR',
    'abilita.riparo.breve': 'DEKKING',
    'guida.titolo': 'Hoe je speelt',
    'guida.buio.titolo': 'Het donker',
    'guida.buio.testo':
      'Je ziet alleen wat je zaklamp verlicht, plus wat je partner verlicht. De twee gezichtsvelden tellen op: samen zie je bijna het dubbele. Wat je al gezien hebt blijft gedempt staan, als een herinnering.',
    'guida.comandi.titolo': 'Besturing',
    'guida.comandi.muovere': 'Linkerduim — je beweegt.',
    'guida.comandi.sparare': 'Rechterduim — je richt, en schiet zolang je vasthoudt.',
    'guida.comandi.torcia':
      'ZAKLAMP — uitzetten. Je ziet bijna niets, maar vijanden zien jou pas op minder dan de halve afstand. De lading duurt vierentwintig seconden.',
    'guida.comandi.abilita': 'De tweede knop — de vaardigheid van je klasse.',
    'guida.rumore.titolo': 'Geluid',
    'guida.rumore.testo':
      'Geluid loopt door de gangen, niet door muren heen: een schot in een afgesloten kamer hoor je niet. Wat je hoort komt uit het juiste oor, en een boog aan de rand van het scherm zegt waarvandaan. Je weet waar, niet wat. Elk wapen maakt ander kabaal.',
    'guida.terra.titolo': 'Neer, niet dood',
    'guida.terra.testo':
      'Op nul leven lig je dertig seconden neer en kruip je langzaam. Je partner kan je bereiken en overeind helpen door drie seconden dichtbij te blijven. Blijft er niemand staan, dan is de expeditie verloren.',
    'guida.rifornimenti.titolo': 'Bepantsering en bevoorradingskisten',
    'guida.rifornimenti.testo':
      'Bepantsering vangt de klappen eerst op. Je vindt die in de kisten door de kamers, die veel bepantsering en weinig leven geven — echt leven komt alleen terug van de kit van de medic. Daarnaast zijn er de BEVOORRADINGSKISTEN tegen de muren: sta er een paar seconden op en je krijgt kogels, kit, sonar en barrieres terug. Ze raken niet op, maar stilstaan in een wakkere sector is een risico dat je bewust neemt. Hoe dieper je komt, hoe minder er zijn.',
    'guida.spedizione.titolo': 'De expeditie',
    'guida.spedizione.testo':
      'Elke sector heeft zijn eigen missie. Elke vijf sectoren krijg je alle vier in willekeurige volgorde, en de vijfde is altijd de baas. Daarna gaat het alarm af en ga je terug met de hele sector wakker. Je vertrekt samen: staat een van jullie buiten de cirkel, dan gaat niemand.',
    'guida.chiudi': 'Begrepen',

    'pausa.titolo': 'Pauze',
    'pausa.avviso': 'Het spel stopt niet: de server gaat door, en je partner ook.',
    'pausa.riprendi': 'Verdergaan',
    'pausa.esci': 'Terug naar het menu',

    'fine.titolo': 'Expeditie verloren',
    'fine.dettaglio': 'Jullie kwamen tot sector {settore}. Er bleef niemand staan.',
    'fine.torna': 'Terug naar het menu',

    'server.titolo': 'Eco Nera',
    'server.istruzione': 'Typ het adres dat de server op de pc laat zien.',
    'server.collega': 'Verbinden',
    'server.sbagliato': 'Typ iets als 192.168.2.46:5190',
    'server.nessuno': 'Niemand antwoordt op dit adres.',

    'gioco.collegamento': 'Verbinden met de server…',
    'gioco.caduta': 'Verbinding weg — opnieuw proberen…',
    'gioco.stallo': 'Netwerk weg — wachten…',
    'gioco.torcia': 'ZAKLAMP',
    'gioco.allarme': 'ALARM — terug naar de uitgang',
    'gioco.tornaUscita': 'Sector {settore} — terug naar de uitgang',
    'gioco.server': 'Sector {settore} — servers {accesi}/{totale}',
    'gioco.aTerra': 'NEER — {secondi}s',
    'gioco.tiRialzano': 'je wordt overeind geholpen…',
    'gioco.fuoriGioco': 'Uitgeschakeld — terug over {secondi}s',
    'gioco.compagnoATerra': '{nome} ligt neer — {secondi}s',
    'gioco.compagnoRientra': '{nome} komt terug over {secondi}s',
    'gioco.nemiciInVista': 'vijanden in zicht: {quanti}',

    'briefing.settore': 'Sector {settore}',
    'briefing.vai': 'Ik ben klaar',
    'briefing.conto': 'start over {secondi}s',
    'briefing.attesa': 'wachten op je maat…',
    'modo.sabotaggio.nome': 'Sabotage',
    'modo.sabotaggio.come':
      "In de verste kamers staan servers tegen de muren. Blijf er een paar seconden naast om er een uit te zetten: met z'n tweeën gaat het twee keer zo snel. Allemaal uit, dan terug naar de uitgang.",
    'modo.bomba.nome': 'Bom',
    'modo.bomba.come':
      "Pak de bom op waar het gemarkeerd staat. Vanaf dat moment heb je {secondi} seconden om hem naar de oranje plek te brengen, en met z'n tweeën heeft de drager zijn handen vol en schiet hij niet. Eenmaal geplaatst: verdedigen. De lont loopt alleen door als er niemand van hen in de buurt is.",
    'modo.dominio.nome': 'Bezetting',
    'modo.dominio.come':
      'Achterin de sector ligt een gemarkeerde zone. Ga erin en blijf er: de verovering loopt alleen op zolang jij er staat en zij niet. Ze blijven komen — het gaat niet om verstoppen, het gaat om standhouden.',
    'gioco.bombaPrendi': 'Sector {settore} — pak de bom',
    'gioco.bombaPorta': 'PLAATSEN — {secondi}s',
    'gioco.bombaDifendi': 'VERDEDIGEN — {secondi}s',
    'gioco.bombaBloccata': 'LONT STAAT STIL — ze staan bij de bom',
    'gioco.zona': 'Sector {settore} — zone {percento}%',
    'gioco.zonaContesa': 'ZONE BETWIST — ze staan erin',
    'guida.riparo.titolo': 'De dekking',
    'guida.riparo.testo':
      'De Assault plant een barriere voor zich. Die stopt vijandelijke schoten en niet die van jou. Het is geen muur — lichamen klimmen eroverheen op dertig procent snelheid, en dan sta je bloot. Je krijgt er TWEE per sector, en ze komen terug bij de kisten: de teller staat op de knop die ze plant.',
    'guida.modalita.titolo': 'De drie missies',
    'guida.modalita.sabotaggio':
      'Sabotage — zet de servers uit die tegen de muren van de verste kamers staan.',
    'guida.modalita.bomba':
      'Bom — breng hem naar de gemarkeerde plek en verdedig hem tot hij afgaat.',
    'guida.modalita.dominio':
      'Bezetting — ga de gemarkeerde zone in en blijf er terwijl ze komen.',

    'menu.controller': 'Controller verbonden: {nome}',
    'server.senza': 'Spelen zonder server',
    'guida.controller.titolo': 'De controller',
    'guida.controller.testo':
      'Zit er een controller aan de telefoon — een DualShock, een DualSense — dan neemt die het over: linkerstick om te lopen, rechter om te richten, R2 of R1 om te schieten. Met een controller is richten niet schieten: de trigger beslist. L2 of L1 zetten de zaklamp aan en uit, kruis of vierkant gebruiken de vaardigheid, options opent het menu. Druk op een willekeurige knop zodat de telefoon hem ziet.',
    'guida.offline.titolo': 'Buitenshuis',
    'guida.offline.testo':
      'Kies SOLO en de wereld draait in de telefoon: geen PC, geen Wi-Fi, speelbaar in de trein. Hetzelfde spel — dezelfde simulatie, dezelfde missies, hetzelfde donker — maar alleen.',
    'menu.controllerStrano':
      'Controller verbonden: {nome} — niet-standaard indeling, de besturing kan verkeerd uitvallen',

    'menu.serverPronto': 'Server: klaar',
    'menu.serverCerco': 'Server: zoeken…',
    'menu.serverNiente':
      'Server: geen antwoord — tik om het adres te wijzigen, of vink “zonder server” hieronder aan',

    'guida.invito.titolo': 'Met zijn tweeen via internet: een kamer',
    'guida.invito.testo':
      'Jullie spreken een getal van vier cijfers af en typen het allebei in: wie er als eerste is, is de host — de wereld draait op zijn telefoon — en de tweede verbindt er rechtstreeks mee, zonder iets ertussen. Niemand kiest de host, en het spel vertelt jullie wie het is. Als de host weggaat, is de partij voorbij: de wereld stond op zijn telefoon.',

    'invito.servizio': 'Adres van de dienst',
    'invito.stato.servizioGiu':
      'de dienst antwoordt niet: probeer de handmatige uitwisseling hieronder',

    'invito.stato.senzaIndirizzo':
      'Het adres van de dienst ontbreekt: typ het hieronder. Ondertussen kan het handmatig.',
    'invito.stato.servizioDice': 'de dienst zegt:',

    'menu.scegliClasse': 'Kies je personage',
    'menu.scegliModo': 'Kies de modus',
    'menu.modo.solo': 'Alleen',
    'menu.modo.casa': 'Duo (offline)',
    'menu.modo.rete': 'Duo (online)',
    'menu.collega': 'Verbinden',
    'menu.versione': 'versie',
    'stanza.quattroCifre': 'er zijn vier cijfers nodig',
    'stanza.entro': 'de kamer binnengaan...',
    'stanza.ospitoAspetto': 'jij bent de host: ik wacht op de ander',
    'stanza.cercoChiOspita': 'op zoek naar de host...',
    'stanza.collegatoOspiti': 'verbonden! Jij host: het spel draait hier',
    'stanza.collegatoOspita': 'verbonden! De andere telefoon host',
    'stanza.nessunoLi': 'in deze kamer is niemand opgedoken: probeer opnieuw',
    'stanza.nessunoArrivato': 'er is niemand gekomen',

    'gioco.ricarico': 'herladen',
    'gioco.ricarica': 'bevoorraden...',

    'menu.scegliDifficolta': 'Moeilijkheid',
    'menu.difficoltaDalServer': 'Moeilijkheid: bepaald door de server',
    'menu.difficolta.facile': 'Makkelijk',
    'menu.difficolta.normale': 'Normaal',
    'menu.difficolta.difficile': 'Moeilijk',
    'menu.difficolta.incubo': 'Nachtmerrie',
    'fine.vittoria': 'EXPEDITIE VOLBRACHT',
    'fine.dettaglioVittoria': 'Alle {settori} sectoren. Jullie zijn eruit.',
    'gioco.compagnoSparito': "Je maatje is weg. De wereld wacht.",

    'menu.difficolta.survival': 'Survival',
    'modo.convoglio.nome': 'Escorteer het konvooi',
    'modo.convoglio.come':
      'Blijf dichtbij en het rijdt. Laat het alleen en het rolt terug, en de klok wacht niet.',
    'modo.boss.nome': 'Dood de baas',
    'modo.boss.come':
      'Ga de gang door, laad bij aan het eind, en leg de grote neer. Dan gaan de deuren open.',
    'gioco.convoglio': 'konvooi',
    'gioco.convoglioSolo': 'het konvooi rolt terug!',


    'guida.munizioni.titolo': 'De kogels raken op',
    'guida.munizioni.testo':
      'Drie magazijnen elk: twintig kogels voor Assault, tien voor Baken en Echo. Een leeg magazijn wordt vanzelf vervangen, en die seconden ben je ongewapend. De getallen verschillen met opzet: met een volle uitrusting doodt Echo er dertig (een per schot), Baken vijftien, Assault twaalf. Wie veel schiet is snel leeg, wie goed mikt houdt het vol. De teller staat in de ring naast de knoppen: de ring is het magazijn, de stippen zijn de reserves.',
    'guida.modalita.convoglio':
      'Konvooi — blijf dichtbij en het rijdt; laat het alleen en het rolt terug, en de klok wacht niet.',
    'guida.modalita.boss':
      'Baas — ga de gang door en dek je achter de dwarse barrieres, laad bij aan het eind, leg de grote neer. Er zijn er drie: de bullebak is een handlanger van dubbele grootte en schiet net zo, de tank schiet zelden maar zijn granaat doet enorm pijn, de schutter schiet heel snel maar alleen dichtbij. Dan gaan de deuren open.',
    'guida.difficolta.titolo': 'Moeilijkheid en Survival',
    'guida.difficolta.testo':
      'Vier moeilijkheden: op Makkelijk is het spel precies dat wat je kent. De campagne is vijftien sectoren en dan is het klaar. SURVIVAL is iets anders, vandaar de andere kleur: je kiest geen moeilijkheid — het begint makkelijk en stijgt elke vijf levels, eindeloos. Je ziet hoe ver je komt.',
    'guida.comandi.ricarica':
      'De kogelring — druk om te herladen, ook bij een half magazijn (R op het toetsenbord, cirkel op de controller).',
  },
};

const PREDEFINITA = 'it';
let corrente = scegliDaSola();

/** La lingua salvata, oppure quella del telefono, oppure l'italiano. */
function scegliDaSola() {
  const salvata = typeof localStorage !== 'undefined' ? localStorage.getItem('ecoNera.lingua') : null;
  if (salvata && TESTI[salvata]) return salvata;
  const delTelefono = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : null;
  return TESTI[delTelefono] ? delTelefono : PREDEFINITA;
}

export function linguaCorrente() {
  return corrente;
}

export function impostaLingua(codice) {
  if (!TESTI[codice]) return false;
  corrente = codice;
  if (typeof localStorage !== 'undefined') localStorage.setItem('ecoNera.lingua', codice);
  return true;
}

/**
 * Il testo nella lingua scelta. I valori fra graffe si sostituiscono: cosi'
 * ogni lingua puo' mettere il numero dove le serve, che non e' sempre nello
 * stesso posto.
 */
export function t(chiave, valori) {
  const testo = TESTI[corrente]?.[chiave] ?? TESTI[PREDEFINITA][chiave] ?? chiave;
  if (!valori) return testo;
  return testo.replace(/\{(\w+)\}/g, (intero, nome) =>
    valori[nome] === undefined ? intero : String(valori[nome]),
  );
}

/** Riempie tutti gli elementi marcati con data-t. */
export function traduciPagina(radice = document) {
  for (const el of radice.querySelectorAll('[data-t]')) {
    el.textContent = t(el.dataset.t);
  }
  for (const el of radice.querySelectorAll('[data-t-segnaposto]')) {
    el.placeholder = t(el.dataset.tSegnaposto);
  }
  document.documentElement.lang = corrente;
}

/** Serve alla prova che controlla che non manchi niente in nessuna lingua. */
export function chiaviDi(codice) {
  return Object.keys(TESTI[codice] ?? {});
}
