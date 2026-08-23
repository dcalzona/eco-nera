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
    'menu.sottotitolo': 'Scegli chi sei. Nel buio, da soli, non si va da nessuna parte.',
    'menu.entra': 'Entra',
    'menu.guida': 'Come si gioca',
    'menu.daSolo': 'Gioco da solo — niente compagno automatico, e qualche nemico in meno',
    'menu.lingua': 'Lingua',
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
    'guida.rifornimenti.titolo': 'Armatura e rifornimenti',
    'guida.rifornimenti.testo':
      "L'armatura incassa per prima: finita quella i colpi cominciano a fare male sul serio. Si ritrova nelle casse sparse per le stanze, che danno molta armatura e poca salute. La salute vera la rimette a posto solo il kit del medico. E piu si scende, meno casse si trovano.",
    'guida.spedizione.titolo': 'La spedizione',
    'guida.spedizione.testo':
      "Ogni settore ha la sua missione, e le tre si susseguono a turno. Finita — qualunque fosse — scatta l'allarme e si torna all'ingresso con tutto il settore sveglio. Si esce insieme: se uno solo e fuori dal cerchio non si parte.",
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
      "L'Assalto pianta una barriera davanti a se. Ferma i colpi dei nemici e non i vostri: da dietro si spara senza essere colpiti. Non e un muro pero — i corpi la scavalcano, i vostri e i loro, al trenta per cento della velocita, ed e li che si e scoperti. E a furia di fucilate cede.",
    'guida.modalita.titolo': 'Le tre missioni',
    'guida.modalita.sabotaggio':
      'Sabotaggio — spegni i server appoggiati alle pareti delle stanze in fondo.',
    'guida.modalita.bomba':
      'Ordigno — portalo sul punto segnato e difendilo finche non scoppia.',
    'guida.modalita.dominio': 'Dominio — entra nella zona segnata e restaci mentre arrivano.',

    'menu.offline':
      'Senza server — il gioco gira tutto nel telefono, da solo, anche fuori casa',
    'menu.controller': 'Controller collegato: {nome}',
    'server.senza': 'Gioca senza server',
    'guida.controller.titolo': 'Il controller',
    'guida.controller.testo':
      "Se al telefono e attaccato un controller — un DualShock, un DualSense — comanda quello: stick sinistro per muoverti, destro per mirare, R2 o R1 per sparare. Col pad mirare non e sparare: decide il grilletto. L2 o L1 accendono e spengono la torcia, croce o quadrato usano l'abilita, options apre il menu. Premi un tasto qualsiasi perche il telefono se ne accorga.",
    'guida.offline.titolo': 'Fuori casa',
    'guida.offline.testo':
      "Spuntando «senza server» il gioco gira tutto dentro il telefono: non servono ne il PC ne il Wi-Fi, e si puo giocare in treno. E lo stesso identico gioco — stessa simulazione, stesse missioni, stesso buio — ma da soli, perche senza server non c'e nessun posto dove il compagno potrebbe collegarsi. La partita di fuori e sua e resta nel telefono: quella in casa, sul server, non la tocca.",
    'menu.controllerStrano':
      'Controller collegato: {nome} — mappatura non standard, i comandi potrebbero essere sbagliati',
  },

  en: {
    'menu.sottotitolo': "Choose who you are. Alone in the dark, you won't get far.",
    'menu.entra': 'Enter',
    'menu.guida': 'How to play',
    'menu.daSolo': 'Playing alone — no automatic partner, and a few enemies fewer',
    'menu.lingua': 'Language',
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
    'guida.rifornimenti.titolo': 'Armour and supplies',
    'guida.rifornimenti.testo':
      "Armour takes the hits first: once it is gone, shots start to really hurt. You find it in the crates scattered through the rooms, which give a lot of armour and little health. Real health only comes back from the medic's kit. And the deeper you go, the fewer crates there are.",
    'guida.spedizione.titolo': 'The expedition',
    'guida.spedizione.testo':
      'Every sector has its own mission, and the three take turns. Once it is done — whichever it was — the alarm goes off and you head back to the entrance with the whole sector awake. You leave together: if one of you is outside the circle, nobody goes.',
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
      'The Assault plants a barrier in front of them. It stops enemy shots and not yours: from behind it you shoot without being hit. It is not a wall, though — bodies climb over it, yours and theirs, at thirty per cent speed, and that is when you are exposed. Enough gunfire brings it down.',
    'guida.modalita.titolo': 'The three missions',
    'guida.modalita.sabotaggio':
      'Sabotage — shut down the servers standing against the walls of the far rooms.',
    'guida.modalita.bomba':
      'Bomb — carry it to the marked spot and defend it until it goes off.',
    'guida.modalita.dominio': 'Hold — get into the marked zone and stay there while they come.',

    'menu.offline': 'No server — the whole game runs on the phone, alone, even away from home',
    'menu.controller': 'Controller connected: {nome}',
    'server.senza': 'Play without a server',
    'guida.controller.titolo': 'The controller',
    'guida.controller.testo':
      'If a controller is attached to the phone — a DualShock, a DualSense — it takes over: left stick to move, right stick to aim, R2 or R1 to shoot. With a pad, aiming is not shooting: the trigger decides. L2 or L1 toggle the torch, cross or square use the ability, options opens the menu. Press any button so the phone notices it.',
    'guida.offline.titolo': 'Away from home',
    'guida.offline.testo':
      'Tick “no server” and the whole game runs inside the phone: no PC, no Wi-Fi, playable on a train. It is the same game — same simulation, same missions, same dark — but alone, because without a server there is nowhere for your partner to connect. The away game is its own and stays on the phone: the one at home, on the server, is untouched.',
    'menu.controllerStrano':
      'Controller connected: {nome} — non-standard mapping, the controls may come out wrong',
  },

  fr: {
    'menu.sottotitolo': "Choisis qui tu es. Seul dans le noir, on ne va nulle part.",
    'menu.entra': 'Entrer',
    'menu.guida': 'Comment jouer',
    'menu.daSolo': 'Je joue seul — pas de coéquipier automatique, et quelques ennemis en moins',
    'menu.lingua': 'Langue',
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
    'guida.rifornimenti.titolo': 'Armure et ravitaillement',
    'guida.rifornimenti.testo':
      "L'armure encaisse en premier : une fois partie, les balles font vraiment mal. On la retrouve dans les caisses éparpillées dans les salles, qui donnent beaucoup d'armure et peu de santé. La vraie santé, seule la trousse du médecin la rend. Et plus on descend, moins il y a de caisses.",
    'guida.spedizione.titolo': "L'expédition",
    'guida.spedizione.testo':
      "Chaque secteur a sa mission, et les trois se succèdent. Une fois finie — peu importe laquelle — l'alarme se déclenche et on rentre à l'entrée avec tout le secteur réveillé. On sort ensemble : si l'un est hors du cercle, personne ne part.",
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
      "L'Assaut plante une barrière devant lui. Elle arrête leurs tirs et pas les vôtres : de derrière, on tire sans être touché. Ce n'est pas un mur pour autant — les corps l'enjambent, les vôtres comme les leurs, à trente pour cent de la vitesse, et c'est là qu'on est à découvert. Sous les balles, elle finit par céder.",
    'guida.modalita.titolo': 'Les trois missions',
    'guida.modalita.sabotaggio':
      'Sabotage — éteins les serveurs adossés aux murs des salles du fond.',
    'guida.modalita.bomba':
      "Bombe — porte-la jusqu'au point marqué et défends-la jusqu'à l'explosion.",
    'guida.modalita.dominio':
      "Contrôle — entre dans la zone marquée et restes-y pendant qu'ils arrivent.",

    'menu.offline':
      'Sans serveur — tout le jeu tourne sur le téléphone, en solo, même hors de chez toi',
    'menu.controller': 'Manette connectée : {nome}',
    'server.senza': 'Jouer sans serveur',
    'guida.controller.titolo': 'La manette',
    'guida.controller.testo':
      "Si une manette est reliée au téléphone — DualShock, DualSense — c'est elle qui commande : stick gauche pour se déplacer, droit pour viser, R2 ou R1 pour tirer. À la manette, viser n'est pas tirer : c'est la gâchette qui décide. L2 ou L1 allument et éteignent la lampe, croix ou carré utilisent la capacité, options ouvre le menu. Appuie sur n'importe quelle touche pour que le téléphone la voie.",
    'guida.offline.titolo': 'Hors de chez toi',
    'guida.offline.testo':
      "Coche « sans serveur » et tout le jeu tourne dans le téléphone : ni PC ni Wi-Fi, jouable dans le train. C'est exactement le même jeu — même simulation, mêmes missions, même noir — mais en solo, parce que sans serveur ton coéquipier n'a nulle part où se connecter. La partie hors de chez toi lui appartient et reste dans le téléphone : celle à la maison, sur le serveur, n'y touche pas.",
    'menu.controllerStrano':
      'Manette connectée : {nome} — mappage non standard, les commandes peuvent être fausses',
  },

  es: {
    'menu.sottotitolo': 'Elige quién eres. Solo, en la oscuridad, no se llega a ninguna parte.',
    'menu.entra': 'Entrar',
    'menu.guida': 'Cómo se juega',
    'menu.daSolo': 'Juego solo — sin compañero automático, y algunos enemigos menos',
    'menu.lingua': 'Idioma',
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
    'guida.rifornimenti.titolo': 'Armadura y suministros',
    'guida.rifornimenti.testo':
      'La armadura encaja primero: cuando se acaba, los disparos empiezan a doler de verdad. Se encuentra en las cajas repartidas por las salas, que dan mucha armadura y poca salud. La salud de verdad solo la repone el botiquín del médico. Y cuanto más se baja, menos cajas hay.',
    'guida.spedizione.titolo': 'La expedición',
    'guida.spedizione.testo':
      'Cada sector tiene su misión, y las tres se van turnando. Terminada — sea cual sea — salta la alarma y se vuelve a la entrada con todo el sector despierto. Se sale juntos: si uno está fuera del círculo, no se va nadie.',
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
      'El Asalto planta una barrera delante de sí. Detiene los disparos de ellos y no los vuestros: desde detrás se dispara sin recibir. Pero no es un muro: los cuerpos la cruzan, los vuestros y los suyos, al treinta por ciento de la velocidad, y ahí es donde estás al descubierto. A base de disparos acaba cediendo.',
    'guida.modalita.titolo': 'Las tres misiones',
    'guida.modalita.sabotaggio':
      'Sabotaje — apaga los servidores apoyados en las paredes de las salas del fondo.',
    'guida.modalita.bomba': 'Bomba — llévalo al punto marcado y defiéndelo hasta que estalle.',
    'guida.modalita.dominio': 'Control — entra en la zona marcada y quédate mientras llegan.',

    'menu.offline':
      'Sin servidor — el juego entero corre en el teléfono, en solitario, también fuera de casa',
    'menu.controller': 'Mando conectado: {nome}',
    'server.senza': 'Jugar sin servidor',
    'guida.controller.titolo': 'El mando',
    'guida.controller.testo':
      'Si hay un mando conectado al teléfono — un DualShock, un DualSense — manda él: stick izquierdo para moverte, derecho para apuntar, R2 o R1 para disparar. Con mando, apuntar no es disparar: decide el gatillo. L2 o L1 encienden y apagan la linterna, cruz o cuadrado usan la habilidad, options abre el menú. Pulsa cualquier botón para que el teléfono lo vea.',
    'guida.offline.titolo': 'Fuera de casa',
    'guida.offline.testo':
      'Marcando «sin servidor» el juego entero corre dentro del teléfono: no hacen falta ni el PC ni el Wi-Fi, y se puede jugar en el tren. Es el mismo juego — misma simulación, mismas misiones, misma oscuridad — pero en solitario, porque sin servidor no hay ningún sitio donde tu compañero pueda conectarse. La partida de fuera es suya y se queda en el teléfono: la de casa, en el servidor, no se toca.',
    'menu.controllerStrano':
      'Mando conectado: {nome} — mapeo no estándar, los controles pueden salir mal',
  },

  ru: {
    'menu.sottotitolo': 'Выбери, кто ты. В темноте в одиночку далеко не уйдёшь.',
    'menu.entra': 'Войти',
    'menu.guida': 'Как играть',
    'menu.daSolo': 'Играю один — без напарника-бота и с меньшим числом врагов',
    'menu.lingua': 'Язык',
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
    'guida.rifornimenti.titolo': 'Броня и снабжение',
    'guida.rifornimenti.testo':
      'Броня принимает удар первой: как только она кончится, выстрелы начинают бить по-настоящему. Она лежит в ящиках по комнатам — много брони и чуть-чуть здоровья. Настоящее здоровье возвращает только аптечка медика. И чем глубже, тем меньше ящиков.',
    'guida.spedizione.titolo': 'Экспедиция',
    'guida.spedizione.testo':
      'У каждого сектора своё задание, и три чередуются. Как только оно выполнено — любое из них — включается тревога, и вы возвращаетесь ко входу, а сектор весь на ногах. Уходят вместе: если один вне круга, не уходит никто.',
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
      'Штурмовик ставит перед собой барьер. Он держит их выстрелы, но не ваши: из-за него стреляешь, и тебя не задевают. Но это не стена — через него перелезают, и вы, и они, на тридцати процентах скорости, и вот тут ты открыт. От очередей барьер в конце концов рушится.',
    'guida.modalita.titolo': 'Три задания',
    'guida.modalita.sabotaggio': 'Саботаж — выключи серверы у стен дальних комнат.',
    'guida.modalita.bomba': 'Бомба — донеси её до отмеченной точки и держи, пока не взорвётся.',
    'guida.modalita.dominio': 'Захват — войди в отмеченную зону и держись, пока они идут.',

    'menu.offline': 'Без сервера — вся игра идёт в телефоне, в одиночку, даже вне дома',
    'menu.controller': 'Геймпад подключён: {nome}',
    'server.senza': 'Играть без сервера',
    'guida.controller.titolo': 'Геймпад',
    'guida.controller.testo':
      'Если к телефону подключён геймпад — DualShock, DualSense — командует он: левый стик двигает, правый целится, R2 или R1 стреляют. С геймпадом целиться не значит стрелять: решает курок. L2 или L1 включают и выключают фонарь, крестик или квадрат — умение, options открывает меню. Нажми любую кнопку, чтобы телефон его заметил.',
    'guida.offline.titolo': 'Вне дома',
    'guida.offline.testo':
      'Поставь галочку «без сервера» — и вся игра идёт внутри телефона: не нужны ни ПК, ни Wi-Fi, можно играть в поезде. Это та же самая игра — та же симуляция, те же задания, та же темнота — но в одиночку, потому что без сервера напарнику некуда подключаться. Партия вне дома живёт отдельно и остаётся в телефоне: домашнюю, на сервере, она не трогает.',
    'menu.controllerStrano':
      'Геймпад подключён: {nome} — нестандартная раскладка, управление может быть неверным',
  },

  nl: {
    'menu.sottotitolo': 'Kies wie je bent. Alleen in het donker kom je nergens.',
    'menu.entra': 'Beginnen',
    'menu.guida': 'Hoe je speelt',
    'menu.daSolo': 'Ik speel alleen — geen automatische partner, en wat minder vijanden',
    'menu.lingua': 'Taal',
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
    'guida.rifornimenti.titolo': 'Bepantsering en bevoorrading',
    'guida.rifornimenti.testo':
      'Het pantser vangt de klappen eerst op: is dat op, dan doen kogels pas echt pijn. Je vindt het in de kisten verspreid door de kamers, die veel pantser geven en weinig gezondheid. Echte gezondheid geeft alleen de kit van de medic terug. En hoe dieper je komt, hoe minder kisten er liggen.',
    'guida.spedizione.titolo': 'De expeditie',
    'guida.spedizione.testo':
      'Elke sector heeft zijn eigen missie, en de drie wisselen elkaar af. Zodra hij klaar is — welke het ook was — gaat het alarm af en ga je terug naar de ingang met de hele sector wakker. Je vertrekt samen: staat er één buiten de cirkel, dan gaat niemand.',
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
      'De Assault plant een barrière voor zich. Die houdt hun kogels tegen en die van jullie niet: erachter schiet je zonder geraakt te worden. Maar het is geen muur — lichamen klimmen erover, die van jullie en die van hen, op dertig procent snelheid, en juist dan sta je open. Onder genoeg vuur begeeft hij het.',
    'guida.modalita.titolo': 'De drie missies',
    'guida.modalita.sabotaggio':
      'Sabotage — zet de servers uit die tegen de muren van de verste kamers staan.',
    'guida.modalita.bomba':
      'Bom — breng hem naar de gemarkeerde plek en verdedig hem tot hij afgaat.',
    'guida.modalita.dominio':
      'Bezetting — ga de gemarkeerde zone in en blijf er terwijl ze komen.',

    'menu.offline':
      'Zonder server — het hele spel draait op de telefoon, alleen, ook buitenshuis',
    'menu.controller': 'Controller verbonden: {nome}',
    'server.senza': 'Spelen zonder server',
    'guida.controller.titolo': 'De controller',
    'guida.controller.testo':
      'Zit er een controller aan de telefoon — een DualShock, een DualSense — dan neemt die het over: linkerstick om te lopen, rechter om te richten, R2 of R1 om te schieten. Met een controller is richten niet schieten: de trigger beslist. L2 of L1 zetten de zaklamp aan en uit, kruis of vierkant gebruiken de vaardigheid, options opent het menu. Druk op een willekeurige knop zodat de telefoon hem ziet.',
    'guida.offline.titolo': 'Buitenshuis',
    'guida.offline.testo':
      'Vink “zonder server” aan en het hele spel draait in de telefoon: geen pc, geen wifi, speelbaar in de trein. Het is precies hetzelfde spel — dezelfde simulatie, dezelfde missies, hetzelfde donker — maar alleen, want zonder server is er nergens waar je maat kan inloggen. Het potje van onderweg is van zichzelf en blijft in de telefoon: dat thuis, op de server, blijft ongemoeid.',
    'menu.controllerStrano':
      'Controller verbonden: {nome} — niet-standaard indeling, de besturing kan verkeerd uitvallen',
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
