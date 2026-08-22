# Eco Nera

Sparatutto cooperativo al buio per due giocatori, ispirato a Bullet Echo.
Si vede solo quello che illumina la propria torcia — piu' quello che illumina
il compagno. Solo PvE.

Il server gira sul PC, i giocatori stanno sui telefoni Android collegati al
Wi-Fi di casa. Come Dragon Tower: JavaScript puro, moduli ES nativi, Canvas 2D,
**nessun passo di compilazione**.

## Come provarlo

```bash
node eco-nera/server/server.js
```

Il terminale stampa l'indirizzo da aprire dal telefono, tipo
`http://192.168.2.46:5190`. Nessuna app da installare per ora: l'APK arriva
alla fine, quando il gioco c'e'.

La prima volta Windows chiede se Node puo' accettare connessioni: va concesso
almeno sulle **reti private**, altrimenti il telefono non entra.

Da soli il server mette in campo un **fantoccio** che gira per la mappa, cosi'
si prova con un cellulare solo. Appena entra una seconda persona, sparisce.

## Comandi

| | Telefono | PC |
| --- | --- | --- |
| Muoversi | dito sulla meta' sinistra | WASD o frecce |
| Puntare e sparare | dito sulla meta' destra | mouse |
| Abilita' del ruolo | pulsante in basso a destra | E |
| Torcia | pulsante in basso a destra | L |

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

## Il conflitto

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

L'uscita si apre solo a nuclei finiti, e si esce **insieme**: se uno solo e'
fuori dal cerchio non si parte. Da quel momento una freccia sul bordo dello
schermo indica dove tornare — aperta l'uscita il problema non e' piu' trovarla.
A ogni settore nuovo si riparte in piedi e con la vita piena: la tensione sta
dentro il settore, non fra un settore e l'altro.

Se non resta nessuno in piedi per quattro secondi la spedizione e' perduta e si
ricomincia dal primo settore.

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

### Il diario

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
- [ ] 6. L'app — APK con Capacitor
