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
      'Vede a media distanza. Raffica veloce e continua. Con lo scatto attraversa una stanza scoperta prima che se ne accorgano.',
    'abilita.kit': 'kit medico a terra',
    'abilita.sonar': 'sonar a terra',
    'abilita.scatto': 'scatto',
    'abilita.kit.breve': 'KIT',
    'abilita.sonar.breve': 'SONAR',
    'abilita.scatto.breve': 'SCATTO',

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
      "L'armatura incassa per prima: finita quella i colpi cominciano a fare male sul serio. Si ritrova nelle casse sparse per le stanze, che danno molta armatura e poca salute. La salute vera la rimette a posto solo il kit del medico.",
    'guida.spedizione.titolo': 'La spedizione',
    'guida.spedizione.testo':
      'Ogni settore: accendi i nuclei sparsi nelle stanze, tre secondi fermo accanto, in due la meta. Poi torna all ingresso. Si esce insieme: se uno solo e fuori dal cerchio non si parte. Acceso l ultimo nucleo scatta l allarme e il settore si sveglia.',
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
    'gioco.nuclei': 'Settore {settore} — nuclei {accesi}/{totale}',
    'gioco.aTerra': 'A TERRA — {secondi}s',
    'gioco.tiRialzano': 'ti stanno rialzando…',
    'gioco.fuoriGioco': 'Fuori gioco — rientri fra {secondi}s',
    'gioco.compagnoATerra': '{nome} e a terra — {secondi}s',
    'gioco.compagnoRientra': '{nome} rientra fra {secondi}s',
    'gioco.nemiciInVista': 'nemici in vista: {quanti}',
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
      'Sees at medium range. Fast, steady fire. With the sprint, crosses an exposed room before anyone notices.',
    'abilita.kit': 'medkit on the ground',
    'abilita.sonar': 'sonar on the ground',
    'abilita.scatto': 'sprint',
    'abilita.kit.breve': 'KIT',
    'abilita.sonar.breve': 'SONAR',
    'abilita.scatto.breve': 'SPRINT',

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
      "Armour takes the hits first: once it is gone, shots start to really hurt. You find it in crates scattered through the rooms, which give plenty of armour and little health. Real health only comes back from the medic's kit.",
    'guida.spedizione.titolo': 'The expedition',
    'guida.spedizione.testo':
      'Each sector: switch on the cores scattered through the rooms — three seconds standing next to one, half that with two of you. Then head back to the entrance. You leave together: if one of you is outside the circle, nobody goes. The last core trips the alarm and the sector wakes up.',
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
    'gioco.nuclei': 'Sector {settore} — cores {accesi}/{totale}',
    'gioco.aTerra': 'DOWN — {secondi}s',
    'gioco.tiRialzano': 'being picked up…',
    'gioco.fuoriGioco': 'Out — back in {secondi}s',
    'gioco.compagnoATerra': '{nome} is down — {secondi}s',
    'gioco.compagnoRientra': '{nome} back in {secondi}s',
    'gioco.nemiciInVista': 'enemies in sight: {quanti}',
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
      'Voit à moyenne distance. Rafale rapide et continue. Avec le sprint, traverse une pièce découverte avant qu on le remarque.',
    'abilita.kit': 'trousse de soins au sol',
    'abilita.sonar': 'sonar au sol',
    'abilita.scatto': 'sprint',
    'abilita.kit.breve': 'TROUSSE',
    'abilita.sonar.breve': 'SONAR',
    'abilita.scatto.breve': 'SPRINT',

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
      "L'armure encaisse en premier : une fois partie, les tirs commencent vraiment à faire mal. On la retrouve dans des caisses dispersées dans les pièces, qui donnent beaucoup d'armure et peu de vie. La vraie vie, seule la trousse du médecin la rend.",
    'guida.spedizione.titolo': "L'expédition",
    'guida.spedizione.testo':
      "Chaque secteur : allume les noyaux dispersés dans les pièces, trois secondes immobile à côté, moitié moins à deux. Puis retourne à l'entrée. On sort ensemble : si l'un est hors du cercle, personne ne part. Le dernier noyau déclenche l'alarme et le secteur se réveille.",
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
    'gioco.nuclei': 'Secteur {settore} — noyaux {accesi}/{totale}',
    'gioco.aTerra': 'À TERRE — {secondi}s',
    'gioco.tiRialzano': 'on te relève…',
    'gioco.fuoriGioco': 'Hors jeu — retour dans {secondi}s',
    'gioco.compagnoATerra': '{nome} est à terre — {secondi}s',
    'gioco.compagnoRientra': '{nome} revient dans {secondi}s',
    'gioco.nemiciInVista': 'ennemis en vue : {quanti}',
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
      'Ve a media distancia. Ráfaga rápida y continua. Con el impulso cruza una sala descubierta antes de que se den cuenta.',
    'abilita.kit': 'botiquín en el suelo',
    'abilita.sonar': 'sónar en el suelo',
    'abilita.scatto': 'impulso',
    'abilita.kit.breve': 'BOTIQUÍN',
    'abilita.sonar.breve': 'SÓNAR',
    'abilita.scatto.breve': 'IMPULSO',

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
      'La armadura encaja primero: cuando se acaba, los disparos empiezan a doler de verdad. Se encuentra en cajas repartidas por las salas, que dan mucha armadura y poca vida. La vida de verdad solo la devuelve el botiquín del médico.',
    'guida.spedizione.titolo': 'La expedición',
    'guida.spedizione.testo':
      'Cada sector: enciende los núcleos repartidos por las salas, tres segundos quieto al lado, la mitad entre dos. Luego vuelve a la entrada. Se sale juntos: si uno está fuera del círculo, no sale nadie. El último núcleo dispara la alarma y el sector se despierta.',
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
    'gioco.nuclei': 'Sector {settore} — núcleos {accesi}/{totale}',
    'gioco.aTerra': 'EN EL SUELO — {secondi}s',
    'gioco.tiRialzano': 'te están levantando…',
    'gioco.fuoriGioco': 'Fuera — vuelves en {secondi}s',
    'gioco.compagnoATerra': '{nome} está en el suelo — {secondi}s',
    'gioco.compagnoRientra': '{nome} vuelve en {secondi}s',
    'gioco.nemiciInVista': 'enemigos a la vista: {quanti}',
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
      'Видит на средней дистанции. Быстрая непрерывная очередь. С рывком пересекает открытую комнату раньше, чем его заметят.',
    'abilita.kit': 'аптечка на полу',
    'abilita.sonar': 'сонар на полу',
    'abilita.scatto': 'рывок',
    'abilita.kit.breve': 'АПТЕЧКА',
    'abilita.sonar.breve': 'СОНАР',
    'abilita.scatto.breve': 'РЫВОК',

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
      'Броня принимает удары первой: когда она кончается, выстрелы начинают ранить по-настоящему. Её находят в ящиках, разбросанных по комнатам: они дают много брони и мало здоровья. Настоящее здоровье возвращает только аптечка медика.',
    'guida.spedizione.titolo': 'Экспедиция',
    'guida.spedizione.testo':
      'В каждом секторе: включи ядра, разбросанные по комнатам, — три секунды стоя рядом, вдвоём вдвое быстрее. Потом вернись ко входу. Уходят вместе: если один вне круга, не уходит никто. Последнее ядро включает тревогу, и сектор просыпается.',
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
    'gioco.nuclei': 'Сектор {settore} — ядра {accesi}/{totale}',
    'gioco.aTerra': 'РАНЕН — {secondi}с',
    'gioco.tiRialzano': 'тебя поднимают…',
    'gioco.fuoriGioco': 'Вне игры — вернёшься через {secondi}с',
    'gioco.compagnoATerra': '{nome} ранен — {secondi}с',
    'gioco.compagnoRientra': '{nome} вернётся через {secondi}с',
    'gioco.nemiciInVista': 'врагов в поле зрения: {quanti}',
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
      'Ziet op middellange afstand. Snel, aanhoudend vuur. Met de sprint steek je een open kamer over voor ze het doorhebben.',
    'abilita.kit': 'verbandkit op de grond',
    'abilita.sonar': 'sonar op de grond',
    'abilita.scatto': 'sprint',
    'abilita.kit.breve': 'KIT',
    'abilita.sonar.breve': 'SONAR',
    'abilita.scatto.breve': 'SPRINT',

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
      'De bepantsering vangt de klappen eerst op: is die op, dan doen schoten pas echt pijn. Je vindt haar in kisten verspreid door de kamers, die veel bepantsering en weinig leven geven. Echt leven krijg je alleen terug van de kit van de hospik.',
    'guida.spedizione.titolo': 'De expeditie',
    'guida.spedizione.testo':
      'Elke sector: zet de kernen aan die door de kamers verspreid liggen — drie seconden stil ernaast, met zijn tweeën de helft. Ga daarna terug naar de ingang. Je vertrekt samen: staat er één buiten de cirkel, dan gaat niemand. De laatste kern zet het alarm aan en de sector wordt wakker.',
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
    'gioco.nuclei': 'Sector {settore} — kernen {accesi}/{totale}',
    'gioco.aTerra': 'NEER — {secondi}s',
    'gioco.tiRialzano': 'je wordt overeind geholpen…',
    'gioco.fuoriGioco': 'Uitgeschakeld — terug over {secondi}s',
    'gioco.compagnoATerra': '{nome} ligt neer — {secondi}s',
    'gioco.compagnoRientra': '{nome} komt terug over {secondi}s',
    'gioco.nemiciInVista': 'vijanden in zicht: {quanti}',
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
