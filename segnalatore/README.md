# Il segnalatore

Fa una cosa sola: tiene da parte due stringhe per tre minuti, sotto un codice
di sei cifre. Serve a far incontrare i due telefoni la prima volta.

**Non è un server di gioco.** Non sa niente del gioco, non vede una partita,
non tiene niente acceso. Finito lo scambio i due telefoni si parlano diretti e
questo servizio non c'entra più niente: se lo spegnessero a metà partita non se
ne accorgerebbe nessuno.

```
POST  /api/stanza  {offerta}            ->  {codice}
GET   /api/stanza?codice=482913         ->  {offerta, risposta}
PUT   /api/stanza  {codice, risposta}   ->  {ok}
```

## Provarlo in casa

```bash
node segnalatore/locale.js
```

Mette in piedi l'endpoint vero — lo stesso file che va su Vercel — più un finto
Redis in memoria che parla il protocollo di quello vero. Poi nell'app, dentro
«scambio a mano», si scrive `http://192.168.x.x:5191` come indirizzo del
servizio.

## Metterlo su Vercel

Serve un archivio Redis perché le due richieste — quella di chi ospita e quella
di chi è invitato — finiscono su due esecuzioni diverse della funzione, che non
si ricordano niente l'una dell'altra.

**Va bene qualunque Redis**, di qualunque fornitore. Il servizio sa parlare in
tutti e due i modi: l'API REST su HTTPS (Upstash, il «KV» di Vercel) oppure il
protocollo nativo su TCP, cioè un semplice indirizzo `redis://` o `rediss://`.
Sceglie da sé in base a quello che trova.

1. Su **vercel.com**, *Add New → Project*, e collega il repository
   `dcalzona/eco-nera`.
2. In **Root Directory** scegli `segnalatore`. È il passo che si dimentica:
   senza, Vercel guarda nella cartella sbagliata e non trova niente.
3. Deploy.
4. Nel progetto appena creato: **Storage → Create Database → Redis** (va bene
   il piano gratuito), e collegalo al progetto.
5. **Redeploy**, perché le variabili le legge solo alla partenza.

Se la finestra di collegamento chiede un **Custom Prefix**, va bene qualunque
cosa: il codice non indovina i nomi, li cerca. Prende qualunque variabile
finisca per `_REST_API_URL` o `_REST_URL` con accanto la sua `_TOKEN`, quindi
`KV_`, `UPSTASH_REDIS_`, `STORAGE_` o quello che avete scritto voi funzionano
tutti uguale.

Se qualcosa non torna, apri `/api/stanza` nel browser: risponde dicendo cosa
cerca **e quali variabili vede** (solo i nomi, mai i valori). Da lì si capisce
in dieci secondi se manca l'archivio o se è solo questione di rinfrescare il
deploy.

### I due modi di arrivarci

| l'archivio offre | il servizio usa |
| --- | --- |
| `..._REST_API_URL` + `..._TOKEN` | l'API REST su HTTPS |
| `REDIS_URL` = `redis://...` | il protocollo nativo su TCP |

Il protocollo nativo è implementato a mano in `api/redis-nativo.js`: settanta
righe, tre comandi, nessuna dipendenza. Il pezzo delicato non è scrivere, è
leggere — TCP consegna byte, non messaggi, e una risposta può arrivare spezzata
in due pacchetti o due risposte attaccate in una. Per questo `finto-redis.js`
sa rispondere **un byte alla volta**: è il modo più cattivo possibile, ed è
l'unico modo onesto di scoprire se il lettore è scritto bene.

## Quanto costa

Niente. Una partita sono tre richieste in tutto (una per creare, una per
leggere, una per rispondere) più qualche controllo di chi aspetta: siamo
nell'ordine delle decine di richieste al giorno, contro le centinaia di
migliaia del piano gratuito.

## Sulla riservatezza

Al servizio arriva solo la descrizione WebRTC dei due telefoni — indirizzi di
rete e chiavi di cifratura — e resta lì tre minuti. Nessun dato di gioco ci
passa mai: quelli viaggiano diretti fra i due telefoni, cifrati, e il
segnalatore non li vede nemmeno di sfuggita.

Chi indovinasse un codice ancora vivo potrebbe rubare l'invito e collegarsi al
posto vostro. Con un milione di codici, tre minuti di vita e una partita
cooperativa contro il computer, è un rischio che si accetta volentieri.
