# Eco Nera

Sparatutto cooperativo al buio per due giocatori, ispirato a Bullet Echo.
Si vede solo quello che illumina la propria torcia — piu' quello che illumina
il compagno. Solo PvE.

Il server gira sul PC, i giocatori stanno sui telefoni Android collegati al
Wi-Fi di casa. Come Dragon Tower: JavaScript puro, moduli ES nativi, Canvas 2D,
**nessun passo di compilazione**.

## Come provarlo

```bash
node server/server.js
```

Mentre ci si lavora conviene questo, che si riavvia da solo a ogni modifica:

```bash
npm run sviluppo
```

**Il server va riavviato quando cambia il suo codice.** Sembra ovvio e non lo
e': mira assistita, allarme, classi e modalita' in solitaria stanno tutte dalla
sua parte, e un server lasciato acceso dalla sessione prima le fa sparire tutte
insieme in silenzio — sembra che il gioco sia rotto. Per questo client e server
si dicono la versione appena si collegano, e se non coincidono il menu lo
scrive.

Il terminale stampa l'indirizzo da aprire dal telefono, tipo
`http://192.168.2.46:5190`. Nessuna app da installare per ora: l'APK arriva
alla fine, quando il gioco c'e'.

La prima volta Windows chiede se Node puo' accettare connessioni: va concesso
almeno sulle **reti private**, altrimenti il telefono non entra.

Da soli il server mette in campo un **fantoccio** che gira per la mappa, cosi'
si prova con un cellulare solo. Appena entra una seconda persona, sparisce.

## L'app Android

```bash
npm install
```

```bash
npm run apk
```

L'APK esce in `android/app/build/outputs/apk/debug/app-debug.apk`. Serve Android
Studio per JDK e SDK; se Gradle non trova Java, punta `JAVA_HOME` al runtime che
ci sta dentro: `C:\Program Files\Android\Android Studio\jbr`.

Il server resta sul PC: l'app e' solo il client. Alla prima apertura chiede
**l'indirizzo del server** — quello che il terminale stampa all'avvio — e se lo
ricorda. Se sbagli a scriverlo, dopo qualche tentativo a vuoto te lo richiede da
solo invece di restare li' a girare a vuoto.

Due dettagli che sembrano di contorno e senza i quali l'app non si collega
affatto: Capacitor serve la pagina da `https://localhost`, e da un'origine
sicura il WebView di Android **blocca le connessioni `ws://` in chiaro**. Per
questo `capacitor.config.json` mette `androidScheme: "http"` e
`cleartext: true`. Senza, l'app si apre benissimo e non trova mai il server, e
non c'e' niente nei log che lo dica chiaramente.

L'icona e la schermata d'avvio si rigenerano da codice, come tutta la grafica
del progetto:

```bash
python tools/genera_icone.py
```

Disegna i due coni che si incrociano nel buio — il Faro caldo e l'Eco freddo —
e scrive da se' tutte le densita' dentro `android/app/src/main/res`.

## Comandi

| | Telefono | PC |
| --- | --- | --- |
| Muoversi | dito sulla meta' sinistra | WASD o frecce |
| Puntare e sparare | dito sulla meta' destra | mouse |
| Abilita' del ruolo | pulsante in basso a destra | E |
| Torcia | pulsante in basso a destra | L |
| Silenziare | — | M |

## Com'e' fatto

```
server/     la simulazione, gira solo sul PC
  server.js      serve il gioco ai telefoni + ciclo a 20 passi al secondo
  mondo.js       personaggi, movimento, combattimento, fantoccio
  nemici.js      i tre umori: pattuglia, cerca, caccia
  suoni.js       come si propaga un rumore
  navigazione.js come si aggirano i muri, e chi vede chi
  proiettili.js  i colpi in volo
client/     quello che finisce sui telefoni (e nell'APK)
  condiviso/  regole, mappa, generatore e fisica: li usano sia server sia client
  src/        rete, comandi, visione, disegno
```

Il server e' l'unico a sapere la verita': i telefoni mandano comandi e ricevono
venti fotografie al secondo. Gli altri giocatori si disegnano 100 ms nel passato
interpolando fra due fotografie; il proprio personaggio si prevede in locale,
cosi' il dito risponde subito.

Perche' previsione e verita' non litighino, il mondo avanza a **sottopassi di
durata fissa** (un sessantesimo di secondo): il telefono ne fa uno per volta e
li numera, il server ne consuma tre per ogni tick nello stesso ordine e rimanda
indietro l'ultimo eseguito. Quando arriva una fotografia il telefono riparte da
li' e riesegue i comandi non ancora confermati. Il risultato e' lo stesso al
centesimo di pixel, quindi non c'e' niente da correggere e niente che scatti.

Serviva sul serio: con passi di durata diversa (50 ms sul server, 16 sul
telefono) bastava sfiorare uno spigolo perche' i due prendessero strade
opposte, fino a 250 px di distanza. Da qui la regola: **il passo elementare
non si tocca, e sta in `condiviso/regole.js`**.

Il server non ripete l'ultimo comando ricevuto: se il telefono smette di
mandarne, il personaggio si ferma. E' voluto — ripetere lo farebbe avanzare di
passi che il telefono non ha fatto.

`client/condiviso/` e' importata da tutti e due: mappa, regole e fisica sono un
codice solo.

## Le lingue

Italiano, inglese, francese, spagnolo, russo e olandese. Si scelgono dal menu e
la scelta resta; alla prima apertura il gioco prova a indovinare dalla lingua
del telefono.

I testi stanno tutti in `src/lingue.js`, un dizionario per lingua con le stesse
chiavi. Non c'e' niente di automatico, ed e' voluto: una prova confronta ogni
lingua con l'italiano e si lamenta se manca una chiave, se un testo e' rimasto
uguale all'italiano per pigrizia (con le poche eccezioni in cui la parola
coincide davvero, come "Pausa" in spagnolo) o se in una traduzione e' sparito
un segnaposto — perche' `{settore}` dimenticato vuol dire un numero che non si
vede piu'.

I nomi delle tre classi non si traducono: sono nomi propri. Si traduce quello
che raccontano.

## Il buio

Lo schermo e' nero. Si vede solo quello che una torcia illumina — la propria o
quella del compagno — piu' quello che si e' gia' visto prima, che resta
disegnato spento come un ricordo.

Il calcolo sta in `src/visione.js` e gira sul telefono, non sul server: contro
il computer non c'e' nessuno da cui nascondere la mappa, e cosi' la luce resta
fluida quanto il rendering. Da ogni sorgente parte un ventaglio di raggi che
camminano di casella in casella finche' non sbattono; le punte cucite insieme
formano il poligono illuminato. Costa **0,03 ms** in due giocatori.

I coni di tutti finiscono nella stessa lista, e quello che si vede e' la loro
**unione**: il compagno illumina anche per te. E' tutto il cooperativo in una
riga di codice — due che si coprono vedono piu' di due che vanno per conto loro.

| | **Faro** | **Eco** |
| --- | --- | --- |
| Cono | 112 gradi, corto (168 px) | 26 gradi, lungo (384 px) |
| Ruolo | sfonda ed entra | vede prima e indica |

Piu' un cerchietto di consapevolezza a 360 gradi attorno a se': chi ti arriva
alle spalle lo senti anche senza illuminarlo. Senza, girarsi al buio diventa
una lotteria.

Due dettagli che sembrano marginali e non lo sono: il raggio **sconfina di
qualche pixel dentro il muro** che lo ferma, altrimenti si vedrebbe il
pavimento illuminato dentro una stanza dalle pareti spente — ma lo sconfinamento
si arresta all'uscita della casella colpita, perche' un raggio che prende uno
spigolo di striscio riemergerebbe nel pavimento dall'altra parte (succedeva
all'1,1% dei raggi). E il cerchietto ravvicinato non sfuma sui bordi: sfumando
lasciava un anello scuro attorno al personaggio, proprio dentro al cono.

## Le tre classi

Si scelgono dal menu, e ognuna e' un modo diverso di stare nel buio.

| | **Faro** | **Eco** | **Assalto** |
| --- | --- | --- | --- |
| Vista | 112 gradi, 168 px | 26 gradi, 384 px | 58 gradi, 262 px |
| Arma | canne mozze, 5 pallini | precisione, un colpo | raffica |
| Gittata | 190 px | 430 px | 300 px |
| Rumore dello sparo | 15 caselle | 9 caselle | 12 caselle |
| Abilita' | **kit medico** a terra | **sonar** a terra | **scatto** |

Le gittate seguono le viste: ognuno colpisce fin dove vede. Anche il baccano e'
diverso — il fucile a canne mozze sveglia mezzo settore, quello di precisione
molto meno: e' un pezzo di identita' della classe che non si vede ma si sente.

Il **kit** resta per terra e vale per tutti e due, una volta a testa, e cura
fino al 70% e non oltre: chi e' malmesso torna in condizione di combattere, non
torna nuovo. Il **sonar** continua a battere da terra e segna i nemici che gli
passano vicino, anche oltre i muri: chi lo posa puo' andarsene e sapere lo
stesso cosa si muove in quella stanza. Lo **scatto** fa attraversare una stanza
scoperta prima che se ne accorgano.

Due giocatori possono scegliere la stessa classe: e' una scelta loro, e
scoprire che due Eco non aprono le porte da soli fa parte dell'imparare.

## Armatura e rifornimenti

Davanti alla salute c'e' **l'armatura**: i colpi la consumano per primi, e
quello che avanza passa oltre — un colpo grosso su un'armatura quasi finita fa
comunque male, invece di essere assorbito per intero da un residuo di niente.

La divisione serve a una cosa precisa. Le **casse di rifornimento** sparse per
le stanze danno molta armatura e poca salute: girando si recupera la capacita'
di incassare, che e' quello che mancava giocando da soli, senza rendere
inutile il Faro — che resta l'unico a rimettere in sesto davvero, con il suo
kit. Ogni cassa vale una volta per ciascuno e sparisce quando l'hanno presa
tutti: in due se ne puo' lasciare una al compagno che sta peggio.

Si vedono solo dove si e' gia' stati, come i nuclei: trovarle fa parte del
girare.

## Il conflitto

Il colpo si **raddrizza da solo** verso il nemico piu' centrato, ma solo entro
tredici gradi dal mirino e solo se non c'e' un muro in mezzo. Su un telefono il
pollice non ha la precisione di un mouse, e questo e' un gioco contro il
computer: pretendere la mira al pixel toglierebbe divertimento senza aggiungere
niente. Tredici gradi perdonano un pollice impreciso, non permettono di sparare
a caso e colpire.

Si spara tenendo premuto lo stick destro: su un telefono un pulsante separato
vorrebbe un terzo dito che non c'e'. Mirare e' sparare.

| | **Faro** | **Eco** |
| --- | --- | --- |
| Arma | rosa di 5 pallini, corta e larga | un colpo solo, lento e preciso |
| Gittata | 190 px | 430 px |

Le gittate seguono le torce: ognuno colpisce fin dove vede. E siccome i nemici
vedono a 258 px, il Faro **viene visto prima di vedere** — da solo e' in
svantaggio, con l'Eco che gli indica la stanza non lo e' piu'. E' il motivo per
cui i due ruoli esistono.

### I nemici

Tre umori, e si distinguono a colpo d'occhio dal colore: **pattuglia** (rosso
spento, gira per conto suo), **cerca** (arancione, sa che c'e' qualcuno e va a
controllare), **caccia** (arancione, ti ha visto e spara). Un nemico incassato
un colpo alle spalle passa a cercare: sparare di sorpresa funziona una volta
sola.

Quando li illumini vedi anche **il loro cono di vista**, disegnato sul
pavimento. Sapere cosa vede la sentinella e' meta' del gioco.

Non inseguono a vista — chi punta dritto al giocatore si incastra nel primo
muro. Si calcola un campo di distanze all'indietro dal bersaglio (una visita in
ampiezza della griglia) e ognuno scende lungo la discesa piu' ripida. Con piu'
sorgenti insieme ognuno insegue il piu' vicino senza doverlo decidere.

### A terra, non morti

A zero vita non si muore: si finisce **a terra**, e da li' ci si trascina piano
sperando che il compagno arrivi. Trenta secondi. Chi soccorre deve restare
vicino tre secondi buoni, e se si allontana il lavoro fatto non svanisce di
colpo ma nemmeno resta li' per sempre.

E' la meccanica per cui si dice "aspetta, arrivo" invece di giocare a due
giochi in parallelo sullo stesso schermo. Senza, sono due partite in solitaria.

Il fantoccio, quando si prova da soli, fa la sua parte: spara ai nemici che
vede e ti viene a rialzare. Cosi' il giro completo — sparare, cadere, essere
rimessi in piedi — si prova con un telefono solo.

## L'orecchio

Un rumore **non si propaga in linea d'aria**: gira per i corridoi come si gira
a piedi. Si visita la griglia in ampiezza dal punto d'origine e ci si ferma
alla distanza che quel rumore puo' percorrere. Cosi' uno sparo dentro una
stanza sigillata non allarma chi sta dall'altra parte del muro anche se in
linea retta e' a due passi, e girare largo per non farsi sentire diventa una
cosa che si puo' davvero fare.

| | quanto si sente |
| --- | --- |
| Uno sparo | 13 caselle |
| Uno sparo nemico | 11 caselle — e chiama i compagni |
| I passi | 4 caselle |

Chi sente va a controllare: non sa cosa fosse, sa solo dove. Piu' forte l'ha
sentito, piu' a lungo se lo ricorda.

Sul telefono un rumore arriva come **un archetto sul bordo dello schermo**,
nella direzione da cui e' venuto, che si allarga mentre svanisce. Sai dove, non
sai cosa. Quanto forte lo senti lo calcola il server, che conosce i muri: se lo
stimasse il telefono a distanza in linea d'aria sentiresti gli spari dentro le
stanze chiuse.

## La torcia si consuma

Ventiquattro secondi di luce, sedici per ricaricarla da spenta. A torcia spenta
resta solo il cerchietto ravvicinato — si vede pochissimo, ma **i nemici ti
individuano a meno della meta' della distanza**. Illuminare smette di essere un
interruttore sempre acceso e diventa una risorsa da spendere.

Finita la carica non basta un istante di ricarica per riaccendere: serve
risalire a un terzo. Senza quella soglia la torcia sfarfalla — si spegne, si
ricarica un briciolo, si riaccende — ed e' insopportabile da guardare.

## Le abilita' dei due ruoli

**L'Eco marca**: i nemici che sta vedendo diventano visibili a tutti e due per
sei secondi, anche attraverso i muri. E' il "vede prima e indica" scritto in
codice. Se non c'e' niente da marcare non spreca la ricarica.

**Il Faro pianta un fuoco**: una luce a terra che illumina tutt'intorno per
diciotto secondi e continua a farlo mentre lui va avanti. Gli permette di
lasciarsi una stanza illuminata alle spalle invece di portarsi dietro tutta la
luce — ma piantarlo fa rumore.

Si comandano con i due pulsanti in basso a destra (o `L` e `E` da tastiera).

## La spedizione

Un **settore** per volta: si entra, si accendono i nuclei sparsi nelle stanze
piu' lontane, si torna al punto di ingresso e si esce. Poi il settore dopo, un
po' piu' affollato — dal primo al sesto si passa da due nuclei e sette nemici a
quattro e dodici.

Accendere un nucleo vuole tre secondi fermi accanto, ed e' il momento in cui si
e' piu' scoperti: per questo conviene essere in due, uno accende e l'altro
guarda le spalle. In due si accende in meta' tempo. Allontanandosi il lavoro si
perde, piano.

Acceso l'ultimo nucleo scatta **l'allarme**: il settore si sveglia, i nemici
smettono di pattugliare e vengono verso di voi, i rinforzi arrivano al doppio
del ritmo. Non e' onniscienza — sanno dove *eravate*, e ogni tre secondi si
aggiornano: spezzare la linea di vista e cambiare strada funziona ancora. Ma
il tratto di ritorno, che era il piu' lungo e il piu' noioso, diventa il
momento in cui la serata si decide. Suona una sirena e i bordi dello schermo
pulsano di rosso — i bordi e non tutto lo schermo, perche' proprio in quel
momento serve vedere.

Non c'e' un conto alla rovescia: non si perde per il tempo, si perde se si
inciampa. La fretta la mette la sirena, non un numero.

L'uscita si apre solo a nuclei finiti, e si esce **insieme**: se uno solo e'
fuori dal cerchio non si parte. Da quel momento una freccia sul bordo dello
schermo indica dove tornare — aperta l'uscita il problema non e' piu' trovarla.
A ogni settore nuovo si riparte in piedi e con la vita piena: la tensione sta
dentro il settore, non fra un settore e l'altro.

Se non resta nessuno in piedi per quattro secondi la spedizione e' **perduta**:
lo dice una schermata con il settore a cui siete arrivati, e da li' si torna al
menu. Non riparte di nascosto dal primo settore — ritrovarcisi di colpo senza
aver capito cosa e' successo e' peggio che perdere.

Si puo' giocare **da soli**, spuntandolo nel menu: niente compagno automatico e
qualche nemico in meno. Il gioco non cambia — cambia che non c'e' nessuno a
rimetterti in piedi.

### Le mappe si generano

Stanze rettangolari collegate da corridoi a gomito, con qualche scorciatoia
perche' un percorso ad albero costringe sempre a tornare indietro dalla stessa
strada. Costa 0,18 ms per mappa.

La verifica conta piu' dell'algoritmo: una stanza irraggiungibile non si nota
provando, si nota una sera che ci si gira mezz'ora cercando un nucleo che sta
dietro un muro. Ogni mappa viene controllata e, se non e' tutta connessa,
rifatta. E la prova non si ferma al grafo delle caselle: fa **camminare
davvero** un personaggio dalla partenza al centro di ogni stanza, perche' un
corpo largo 22 px in caselle da 32 e' un'altra cosa da un puntino su un grafo.
Su 200 mappe: 386 stanze su 386 raggiunte a piedi.

## Il suono che si sente

Tutto sintetizzato al momento, come la grafica: nel progetto non c'e' un file
audio. La ragione non e' il peso, e' che qui il suono **e' una meccanica**. Il
server calcola gia' quanto forte ogni rumore arriva a ciascun giocatore
tenendo conto dei muri; il telefono prende quel numero e lo suona nel canale
giusto — a sinistra se e' successo a sinistra. Uno sparo dentro una stanza
sigillata non si sente, perche' davvero non arriva.

Sotto a tutto c'e' un bordone bassissimo che non finisce mai. Da solo non si
nota; quando qualcuno ti sta cacciando si apre il filtro e sale una quinta che
prima non c'era. Non e' musica da canticchiare, e' il modo di dire "non sei
solo" senza scriverlo sullo schermo. A terra si aggiunge un battito lento.

Si accende al primo dito sullo schermo — i browser non fanno suonare niente
prima di un gesto. Da PC si silenzia con `M`.

### Come sono disegnati i personaggi

Non pallini: omini visti dall'alto, forme vettoriali come tutto il resto.
Spalle nettamente piu' larghe che profonde (e' quella proporzione a dire
"visto dall'alto": quadrate leggono come una scatola, ovali come un uovo), la
testa piccola sopra a tutto, e **l'arma impugnata da un lato solo**.

L'asimmetria non e' un vezzo: con le braccia simmetriche la figura si fonde in
un imbuto e non si capisce dove guardi. Con un braccio teso sul calcio e la
canna che sporge oltre la sagoma, la direzione si legge senza bisogno di
frecce. E le due armi sono diverse fra loro — corta e grossa per il Faro,
lunga e sottile per l'Eco — cosi' i ruoli si riconoscono a colpo d'occhio,
anche in mezzo a una sparatoria.

## Il diario

Ogni due secondi il telefono manda al server come sta andando (fotogramma piu'
lungo, correzione massima, salto sullo schermo, fotografie al secondo,
riconnessioni). Il server stampa una riga solo quando qualcosa non va. Serve
perche' gli scatti si vedono sul dispositivo vero e non si riproducono sul PC.

## A che punto siamo

- [x] **1. Due puntini** — server, due telefoni, movimento, muri, riconnessione
- [x] **2. Il buio** — coni di luce, visione condivisa, memoria della mappa
- [x] **3. Il conflitto** — sparare, nemici, danni, stato critico e rianimazione
- [x] **4. L'orecchio** — propagazione del suono, allerta, ping, batteria, i due ruoli
- [x] **5. La spedizione** — mappe generate, obiettivi, estrazione
- [x] **6. L'app** — APK con Capacitor
