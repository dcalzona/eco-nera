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
| Puntare | dito sulla meta' destra | mouse |

## Com'e' fatto

```
server/     la simulazione, gira solo sul PC
  server.js   serve il gioco ai telefoni + ciclo a 20 passi al secondo
  mondo.js    personaggi, movimento, fantoccio
client/     quello che finisce sui telefoni (e nell'APK)
  condiviso/  regole, mappa e fisica: le usano sia server sia client
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

### Il diario

Ogni due secondi il telefono manda al server come sta andando (fotogramma piu'
lungo, correzione massima, salto sullo schermo, fotografie al secondo,
riconnessioni). Il server stampa una riga solo quando qualcosa non va. Serve
perche' gli scatti si vedono sul dispositivo vero e non si riproducono sul PC.

## A che punto siamo

- [x] **1. Due puntini** — server, due telefoni, movimento, muri, riconnessione
- [x] **2. Il buio** — coni di luce, visione condivisa, memoria della mappa
- [ ] 3. Il conflitto — sparare, nemici, danni, stato critico e rianimazione
- [ ] 4. L'orecchio — propagazione del suono, allerta, ping, batteria, i due ruoli
- [ ] 5. La spedizione — mappe generate, obiettivi, estrazione
- [ ] 6. L'app — APK con Capacitor
