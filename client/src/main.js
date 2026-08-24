// Avvio del client e giro di rendering.

import { muovi, angolo, velocitaFraIRipari } from '../condiviso/fisica.js';
import { SOTTOPASSO, STATO, UMORE, VELOCITA, VELOCITA_CRITICO, NEMICI, VITA_MASSIMA, ECO_SECONDI }
  from '../condiviso/regole.js';
import { Rete } from './rete.js';
import { ReteLocale } from './rete-locale.js';
import { ReteOspite } from './rete-ospite.js';
import { ReteRemota } from './rete-remota.js';
import { Comandi } from './input.js';
import { Disegno } from './render.js';
import { calcolaVisione, nuovaMemoria, ventaglio, illuminato } from './visione.js';
import { Suoni } from './audio.js';
import { disegnaOmino, coloreDi, armaDi } from './render.js';
import { CLASSI, ABILITA, VERSIONE, BOMBA } from '../condiviso/regole.js';
import { LINGUE, t, impostaLingua, linguaCorrente, traduciPagina } from './lingue.js';
import { disegnaBriefing } from './briefing.js';
import {
  creaStanza,
  leggiStanza,
  lasciaRisposta,
  aspettaRisposta,
  indirizzoSegnalatore,
  segnalatoreImpostato,
  cambiaSegnalatore,
} from './segnalatore.js';

const canvas = document.getElementById('gioco');
const disegno = new Disegno(canvas);
const comandi = new Comandi(canvas);
const suoni = new Suoni();

/**
 * Quattro modi di giocare, un gioco solo. Cambia unicamente CHI tiene la
 * simulazione: il PC di casa, questo telefono, questo telefono che ne serve
 * anche un altro, oppure il telefono di qualcun altro. Tutto il resto —
 * previsione, riconciliazione, buio, missioni — e' lo stesso identico codice,
 * e deve restarlo: quattro varianti del gioco sarebbero quattro giochi da
 * sistemare ogni volta.
 */
const MODI = ['casa', 'telefono', 'ospite', 'invitato'];
let modo = localStorage.getItem('ecoNera.modo');
if (!MODI.includes(modo)) {
  // Chi arriva dalla versione di prima aveva solo una spunta.
  modo = localStorage.getItem('ecoNera.offline') === '1' ? 'telefono' : 'casa';
}
let rete = creaRete(modo);

// I browser non fanno suonare niente prima di un gesto: si accende al primo
// dito sullo schermo, e da li' in poi resta acceso.
for (const evento of ['pointerdown', 'keydown', 'touchstart']) {
  addEventListener(evento, () => suoni.avvia(), { once: false, passive: true });
}
addEventListener('keydown', (e) => {
  if (!e.repeat && e.code === 'KeyM') suoni.muto(suoni.acceso);
});

// --- Il pannello dell'indirizzo -------------------------------------------
// Nel browser non si vede mai: la pagina arriva dal server, quindi l'indirizzo
// si sa. Dentro l'APK invece la pagina sta sul telefono e il server va cercato.
const pannello = document.getElementById('collegamento');
const modulo = document.getElementById('modulo');
const campo = document.getElementById('indirizzo');
const nota = document.getElementById('nota');

function chiediIndirizzo(chiave = '') {
  traduciPagina();
  pannelloMenu.hidden = true; // prima il server, poi la scelta della classe
  nota.textContent = chiave ? t(chiave) : '';
  campo.value = localStorage.getItem('ecoNera.server') ?? '';
  pannello.hidden = false;
  setTimeout(() => campo.focus(), 50);
}

/**
 * Il collegamento giusto per il modo scelto. Le tre chiamate all'indietro sono
 * le stesse: chi le riceve non sa e non deve sapere se il mondo sta sul PC o
 * dentro il telefono.
 */
function creaRete(quale) {
  const r =
    quale === 'telefono'
      ? new ReteLocale()
      : quale === 'ospite'
        ? new ReteOspite()
        : quale === 'invitato'
          ? new ReteRemota()
          : new Rete();
  r.alCambioOspite = () => aggiornaStatoServer();
  r.chiediIndirizzo = chiediIndirizzo;
  r.chiediClasse = () => {
    pannelloMenu.hidden = false;
    avvisaSeDisallineato();
  };
  r.alSaluto = () => avvisaSeDisallineato();
  return r;
}

/** Si cambia modo dal menu: si spegne quello di prima e si riparte pulito. */
function usaModo(quale) {
  modo = quale;
  localStorage.setItem('ecoNera.modo', quale);
  rete.spegni();
  rete = creaRete(quale);
  window.ecoNera.rete = rete;
  // Il mondo e' un altro: si buttano ricordo, previsione e comandi in volo.
  memoria = null;
  io = null;
  prima = null;
  pendenti = [];
  versioneMappaVista = -1;
  briefingMostrato = null;
  pannello.hidden = true;
  pannelloInvito.hidden = true;
  rete.avvia();
  adeguaMenuAlModo();
}

modulo.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!rete.usaIndirizzo(campo.value)) {
    nota.textContent = t('server.sbagliato');
    return;
  }
  nota.textContent = '';
  pannello.hidden = true;
  if (rete.stato === 'menu') pannelloMenu.hidden = false;
});

// --- Il menu ---------------------------------------------------------------
// Si sceglie la classe e si entra. Ogni scheda mostra l'omino vero, disegnato
// con lo stesso codice del gioco: quello che scegli e' quello che vedrai.
const pannelloMenu = document.getElementById('menu');
const pannelloGuida = document.getElementById('guida');
const elencoClassi = document.getElementById('classi');
const bottoneAvvio = document.getElementById('avvio');

let classeScelta = localStorage.getItem('ecoNera.classe');
if (!CLASSI[classeScelta]) classeScelta = null;

function costruisciMenu() {
  elencoClassi.innerHTML = '';
  for (const [id, classe] of Object.entries(CLASSI)) {
    const scheda = document.createElement('button');
    scheda.type = 'button';
    scheda.className = 'classe';
    scheda.style.color = coloreDi(id);
    scheda.setAttribute('aria-pressed', String(id === classeScelta));

    // L'anteprima si disegna alla risoluzione vera dello schermo, altrimenti
    // sui telefoni fitti viene sgranata.
    const dpr = Math.min(devicePixelRatio || 1, 3);
    const larghezza = 44;
    const altezza = 34;
    const tela = document.createElement('canvas');
    tela.width = larghezza * dpr;
    tela.height = altezza * dpr;
    const c = tela.getContext('2d');
    c.scale(dpr, dpr);
    c.translate(larghezza / 2 - 4, altezza / 2);
    c.scale(1.7, 1.7);
    disegnaOmino(c, 0, 0, 0, { corpo: coloreDi(id), arma: armaDi(id) });

    const abilita = ABILITA[id];
    const intestazione = document.createElement('div');
    intestazione.className = 'intestazione';
    intestazione.append(tela);
    // I nomi delle classi non si traducono, sono nomi propri: si traduce
    // quello che raccontano.
    intestazione.insertAdjacentHTML(
      'beforeend',
      `<div><div class="nome">${classe.nome}</div>
       <div class="arma">${t(`classe.${id}.arma`)} · ${t(`classe.${id}.ruolo`)}</div></div>`,
    );
    scheda.append(intestazione);
    scheda.insertAdjacentHTML(
      'beforeend',
      `<div class="desc">${t(`classe.${id}.desc`)}</div>
       <div class="abilita">${t(`abilita.${abilita.tipo}`)} · ${abilita.ricarica} s</div>`,
    );

    scheda.addEventListener('click', () => {
      classeScelta = id;
      suoni.avvia();
      for (const altra of elencoClassi.children) altra.setAttribute('aria-pressed', 'false');
      scheda.setAttribute('aria-pressed', 'true');
      bottoneAvvio.disabled = false;
    });
    elencoClassi.append(scheda);
  }
  bottoneAvvio.disabled = !classeScelta;
}

// --- La lingua -------------------------------------------------------------
const sceltaLingua = document.getElementById('lingua');
for (const [codice, nome] of Object.entries(LINGUE)) {
  const opzione = document.createElement('option');
  opzione.value = codice;
  opzione.textContent = nome;
  sceltaLingua.append(opzione);
}
sceltaLingua.value = linguaCorrente();
sceltaLingua.addEventListener('change', () => {
  impostaLingua(sceltaLingua.value);
  traduciPagina();
  costruisciMenu(); // le schede delle classi hanno testo dentro
  avvisaSeDisallineato();
});

// Come sta il server. Sta nel menu e non su una schermata a parte: e' li' che
// si decide se giocare in casa o nel telefono, e la decisione vuole saperlo.
const rigaServer = document.getElementById('statoServer');
rigaServer.addEventListener('click', () => {
  if (modo === 'casa') chiediIndirizzo();
  else if (modo !== 'telefono') apriPannelloInvito();
});

function aggiornaStatoServer() {
  if (modo === 'telefono') {
    rigaServer.hidden = true;
    return;
  }
  if (modo === 'ospite') {
    // Chi ospita non cerca nessuno: aspetta che arrivi qualcuno.
    const come = rete.statoOspite ?? 'nessuno';
    rigaServer.hidden = false;
    rigaServer.textContent = t(`invito.stato.${come}`);
    rigaServer.classList.toggle('guasto', come === 'caduto');
    return;
  }
  if (modo === 'invitato') {
    const come = rete.collegamento;
    rigaServer.hidden = false;
    rigaServer.textContent = t(
      come === 'aperto' ? 'invito.stato.collegato' : come === 'collego' ? 'invito.stato.attesa' : 'invito.stato.nessuno',
    );
    rigaServer.classList.toggle('guasto', come === 'caduto');
    return;
  }
  const come = rete.collegamento;
  const chiave =
    come === 'aperto' ? 'menu.serverPronto' : come === 'collego' ? 'menu.serverCerco' : 'menu.serverNiente';
  rigaServer.hidden = false;
  rigaServer.textContent = t(chiave);
  rigaServer.classList.toggle('guasto', chiave === 'menu.serverNiente');
}

const spuntaSolo = document.getElementById('daSolo');
spuntaSolo.checked = localStorage.getItem('ecoNera.solo') === '1';

// Dove si gioca. Le altre tre scelte implicano tutte "da soli sul PC": o il
// PC non c'e' proprio, o il compagno arriva da un'altra strada.
const sceltaDove = document.getElementById('dove');
for (const quale of MODI) {
  const opzione = document.createElement('option');
  opzione.value = quale;
  sceltaDove.append(opzione);
}
sceltaDove.value = modo;

const bottoneInvito = document.getElementById('apriInvito');
bottoneInvito.addEventListener('click', () => apriPannelloInvito());

function adeguaMenuAlModo() {
  sceltaDove.value = modo;
  for (const opzione of sceltaDove.options) opzione.textContent = t(`menu.dove.${opzione.value}`);
  // La spunta "da solo" ha senso solo con il server di casa: negli altri modi
  // o si e' da soli per forza, o il compagno arriva da un invito.
  spuntaSolo.disabled = modo !== 'casa';
  if (modo !== 'casa') spuntaSolo.checked = modo !== 'ospite' && modo !== 'invitato';
  bottoneInvito.hidden = modo !== 'ospite' && modo !== 'invitato';
  bottoneInvito.textContent = t('menu.invito');
  aggiornaStatoServer();
}
adeguaMenuAlModo();

sceltaDove.addEventListener('change', () => {
  suoni.avvia();
  usaModo(sceltaDove.value);
});

// E dal pannello dell'indirizzo si puo' rinunciare al server: e' li' che uno
// si accorge di non essere a casa.
document.getElementById('senzaServer').addEventListener('click', () => {
  pannello.hidden = true;
  usaModo('telefono');
});

// --- Lo scambio dell'invito ---------------------------------------------
// Due codici, uno per parte. E' la parte piu' scomoda di tutto il gioco, e si
// vede: ma e' anche l'unica che non chiede nessun server acceso da nessuna
// parte, e quindi funziona anche in treno.
const pannelloInvito = document.getElementById('invito');
const mioCodice = document.getElementById('mioCodice');
const suoCodice = document.getElementById('suoCodice');
const invitoStato = document.getElementById('invitoStato');
const passoCrea = document.getElementById('passoCrea');
const passoMio = document.getElementById('passoMio');
const passoSuo = document.getElementById('passoSuo');
const passoCodice = document.getElementById('passoCodice');
const passoChiedi = document.getElementById('passoChiedi');
const campoCodice = document.getElementById('campoCodice');
const codiceGrande = document.getElementById('codiceGrande');
/** Chiudendo il pannello si smette di aspettare, invece di continuare a chiedere. */
let annullato = false;

function apriPannelloInvito() {
  traduciPagina(pannelloInvito);
  document.getElementById('invitoSpiega').textContent = t(`invito.spiega.${modo}`);
  document.getElementById('invitoIncollaEtichetta').textContent = t(`invito.incolla.${modo}`);
  document.getElementById('usaCodice').textContent =
    t(modo === 'ospite' ? 'invito.collega' : 'invito.rispondi');
  const campoServizio = document.getElementById('campoServizio');
  campoServizio.value = indirizzoSegnalatore();
  // Senza indirizzo non c'e' niente da provare: si dice subito e si apre lo
  // scambio a mano, che funziona comunque.
  if (!segnalatoreImpostato()) {
    document.getElementById('aMano').open = true;
  }

  // Chi ospita si fa dare un numero; chi e' invitato lo scrive.
  passoCrea.hidden = modo !== 'ospite';
  passoCodice.hidden = true;
  passoChiedi.hidden = modo === 'ospite';
  passoMio.hidden = true;
  passoSuo.hidden = false;
  mioCodice.value = '';
  suoCodice.value = '';
  campoCodice.value = '';
  codiceGrande.textContent = '';
  invitoStato.textContent = '';
  annullato = false;
  pannelloMenu.hidden = true;
  pannelloInvito.hidden = false;
}

document.getElementById('chiudiInvito').addEventListener('click', () => {
  annullato = true;
  pannelloInvito.hidden = true;
  pannelloMenu.hidden = false;
  aggiornaStatoServer();
});

document.getElementById('campoServizio').addEventListener('change', (e) => {
  cambiaSegnalatore(e.target.value);
});

/**
 * Chi ospita: prepara l'offerta, la lascia al servizio, mostra il numero e
 * aspetta. Il numero e' l'unica cosa che deve arrivare all'altro, e ci arriva
 * a voce — che e' il modo piu' veloce che esista.
 */
document.getElementById('creaInvito').addEventListener('click', async () => {
  suoni.avvia();
  invitoStato.textContent = t('invito.stato.preparo');
  let offerta;
  try {
    offerta = await rete.apriInvito();
  } catch {
    invitoStato.textContent = t('invito.stato.errore');
    return;
  }

  // Lo scambio a mano resta pronto sotto, per quando il servizio non risponde.
  mioCodice.value = offerta;
  passoMio.hidden = false;

  try {
    invitoStato.textContent = t('invito.stato.creo');
    const numero = await creaStanza(offerta);
    passoCrea.hidden = true;
    passoCodice.hidden = false;
    codiceGrande.textContent = `${numero.slice(0, 3)} ${numero.slice(3)}`;
    invitoStato.textContent = t('invito.stato.dilloEAspetta');

    const risposta = await aspettaRisposta(numero, { fermati: () => annullato });
    await rete.chiudiInvito(risposta);
    invitoStato.textContent = t('invito.stato.attesa');
  } catch (e) {
    passoCrea.hidden = true;
    invitoStato.textContent = perche(e);
    document.getElementById('aMano').open = true;
    if (e.senzaIndirizzo) document.getElementById('campoServizio').focus();
  }
});

/**
 * Perche' non ha funzionato, detto in modo che si sappia dove guardare.
 *
 * Non sapere dov'e' il servizio e trovarlo rotto sono due guai diversi: il
 * primo si risolve scrivendo un indirizzo, il secondo guardando Vercel. Dirli
 * con la stessa frase manda a cercare dalla parte sbagliata — ed e'
 * esattamente quello che e' successo.
 */
function perche(e) {
  if (e?.senzaIndirizzo) return t('invito.stato.senzaIndirizzo');
  // Il messaggio del servizio, quando ce n'e' uno, vale piu' di qualunque
  // frase generica: dice gia' cosa manca.
  const suo = String(e?.message ?? '');
  const utile = suo && suo !== 'Failed to fetch' && !suo.startsWith('NetworkError');
  return utile ? `${t('invito.stato.servizioDice')} ${suo}` : t('invito.stato.servizioGiu');
}

/** Chi e' invitato: scrive il numero, e il resto succede da solo. */
document.getElementById('usaNumero').addEventListener('click', async () => {
  suoni.avvia();
  const numero = campoCodice.value.replace(/\D/g, '');
  if (numero.length < 6) {
    invitoStato.textContent = t('invito.stato.codiceCorto');
    return;
  }
  try {
    invitoStato.textContent = t('invito.stato.cerco');
    const stanza = await leggiStanza(numero);
    const risposta = await rete.rispondi(stanza.offerta);
    await lasciaRisposta(numero, risposta);
    invitoStato.textContent = t('invito.stato.attesa');
  } catch (e) {
    invitoStato.textContent = perche(e);
    document.getElementById('aMano').open = true;
    if (e.senzaIndirizzo) document.getElementById('campoServizio').focus();
  }
});

// --- La via di riserva: i due codici lunghi, a mano ---------------------
document.getElementById('usaCodice').addEventListener('click', async () => {
  suoni.avvia();
  const codice = suoCodice.value.trim();
  if (!codice) return;
  try {
    if (modo === 'ospite') {
      await rete.chiudiInvito(codice);
      invitoStato.textContent = t('invito.stato.attesa');
    } else {
      mioCodice.value = await rete.rispondi(codice);
      passoMio.hidden = false;
      invitoStato.textContent = t('invito.stato.rimandalo');
    }
  } catch (e) {
    invitoStato.textContent = t('invito.stato.errore');
  }
});

document.getElementById('copiaCodice').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(mioCodice.value);
    invitoStato.textContent = t('invito.stato.copiato');
  } catch {
    // Senza permesso per gli appunti si ripiega sulla selezione: si copia a mano.
    mioCodice.select();
  }
});

document.getElementById('condividiCodice').addEventListener('click', async () => {
  try {
    await navigator.share({ text: mioCodice.value });
  } catch {
    /* annullato, o non si puo' */
  }
});

bottoneAvvio.addEventListener('click', () => {
  if (!classeScelta) return;
  suoni.avvia();
  localStorage.setItem('ecoNera.solo', spuntaSolo.checked ? '1' : '0');
  // Se non c'e' nessun server si resta nel menu e lo si dice, invece di
  // spedire chi gioca su una scritta che non cambia mai.
  if (!rete.entra(classeScelta, spuntaSolo.checked)) {
    aggiornaStatoServer();
    return;
  }
  pannelloMenu.hidden = true;
  pannelloFine.hidden = true;
  pannelloPausa.hidden = true;
  bottonePausa.hidden = false;
  sorvegliaIngresso();
});

/**
 * Otto secondi per entrare, poi si torna al menu.
 *
 * Fuori casa il collegamento verso il PC non fallisce: resta appeso finche' non
 * scade il tempo di rete, che su un telefono puo' voler dire minuti. Senza
 * questa sorveglianza si restava fermi su "mi collego al server" senza poter
 * fare niente — nemmeno arrivare alla spunta per giocare senza server, che sta
 * proprio nel menu da cui si era appena usciti.
 */
let guardiaIngresso = null;
function sorvegliaIngresso() {
  clearTimeout(guardiaIngresso);
  if (rete.locale) return;
  guardiaIngresso = setTimeout(() => {
    if (rete.stato === 'dentro') return;
    rete.classe = null; // e non ci si ritrovi dentro fra dieci minuti, da soli
    rete.stato = 'menu';
    pannelloMenu.hidden = false;
    bottonePausa.hidden = true;
    aggiornaStatoServer();
  }, 8000);
}

// --- Pausa e uscita --------------------------------------------------------
// Il gioco non si ferma davvero — il server va avanti — ma si puo' smettere.
const pannelloPausa = document.getElementById('pausa');
const bottonePausa = document.getElementById('apriPausa');

function tornaAlMenu() {
  pannelloBriefing.hidden = true;
  briefingMostrato = null;
  pannelloPausa.hidden = true;
  pannelloFine.hidden = true;
  bottonePausa.hidden = true;
  pannelloMenu.hidden = false;
  rete.lascia();
  suoni.sirena(false);
}

bottonePausa.addEventListener('click', () => {
  pannelloPausa.hidden = false;
});
document.getElementById('riprendi').addEventListener('click', () => {
  pannelloPausa.hidden = true;
});
document.getElementById('esciAlMenu').addEventListener('click', tornaAlMenu);

// --- Il briefing -----------------------------------------------------------
// Prima di ogni missione: cosa si va a fare, scritto e disegnato. Per quei
// secondi il settore resta addormentato — e' il server a tenerlo fermo, non il
// telefono, altrimenti in due uno leggerebbe mentre l'altro viene braccato.
const pannelloBriefing = document.getElementById('briefing');
const briefingTela = document.getElementById('briefingDisegno');
const briefingConto = document.getElementById('briefingConto');
let briefingMostrato = null; // quale settore/modalita' e' gia' preparato
let prontoDetto = false;

document.getElementById('briefingVai').addEventListener('click', () => {
  suoni.avvia();
  prontoDetto = true;
  rete.mandaPronto();
});

/**
 * I tasti del controller che non riguardano il personaggio: options apre e
 * chiude il menu di pausa, e durante il briefing options e croce dicono
 * tutti e due la stessa cosa — sono pronto. Con un pad in mano nessuno vuole
 * allungare il dito sullo schermo per un pulsante.
 */
function tastiDiServizio() {
  const menu = comandi.menuPremuto;
  const conferma = comandi.confermaPremuta;
  comandi.menuPremuto = false;
  comandi.confermaPremuta = false;
  if (!menu && !conferma) return;

  if (!pannelloBriefing.hidden) {
    document.getElementById('briefingVai').click();
    // La croce ha gia' fatto il suo mestiere: non deve anche piantare un
    // riparo nella stanza d'ingresso mentre si legge.
    comandi.abilita = false;
    return;
  }
  if (menu) pannelloPausa.hidden = !pannelloPausa.hidden;
}

/**
 * Nel menu si dice se un controller si e' fatto vedere. Serve davvero: finche'
 * non si preme un tasto il browser non lo mostra affatto, e senza questa riga
 * uno resterebbe a chiedersi se il gioco lo veda o no.
 */
function controllerNelMenu() {
  const riga = document.getElementById('controller');
  if (!riga) return;
  const pad = comandi.padCollegato();
  if (!pad) {
    riga.hidden = true;
    return;
  }
  riga.hidden = false;
  // Se il telefono non lo presenta in mappatura standard i tasti sono ai posti
  // sbagliati e non c'e' modo di indovinarli: meglio dirlo subito invece di
  // lasciar credere che il gioco non veda il pad.
  const chiave = pad.mapping === 'standard' ? 'menu.controller' : 'menu.controllerStrano';
  riga.textContent = t(chiave, { nome: nomeDelPad(pad.id) });
}

/** "Wireless Controller (STANDARD GAMEPAD Vendor: 054c...)" → "Wireless Controller". */
function nomeDelPad(id) {
  return String(id || '').split(' (')[0].slice(0, 28) || '?';
}

function aggiornaBriefing(ob) {
  if (!ob || !(ob.pr > 0)) {
    if (!pannelloBriefing.hidden) pannelloBriefing.hidden = true;
    briefingMostrato = null;
    return;
  }

  const chiave = `${ob.settore}/${ob.md}`;
  if (briefingMostrato !== chiave) {
    briefingMostrato = chiave;
    prontoDetto = false;
    document.getElementById('briefingSettore').textContent =
      t('briefing.settore', { settore: ob.settore });
    document.getElementById('briefingTitolo').textContent = t(`modo.${ob.md}.nome`);
    // I secondi li dice la regola, non il testo: se domani la bomba dura di
    // piu, il briefing lo dice da solo invece di mentire in sei lingue.
    document.getElementById('briefingTesto').textContent =
      t(`modo.${ob.md}.come`, { secondi: BOMBA.perPiazzare });
    traduciPagina(pannelloBriefing);

    // Il disegno alla risoluzione vera dello schermo: su un telefono fitto,
    // alla risoluzione logica, verrebbe sgranato.
    const dpr = Math.min(devicePixelRatio || 1, 3);
    const w = briefingTela.clientWidth || 300;
    const h = briefingTela.clientHeight || 190;
    briefingTela.width = Math.round(w * dpr);
    briefingTela.height = Math.round(h * dpr);
    const c = briefingTela.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    disegnaBriefing(c, ob.md, w, h);

    pannelloBriefing.hidden = false;
  }

  briefingConto.textContent = prontoDetto
    ? t('briefing.attesa')
    : t('briefing.conto', { secondi: Math.ceil(ob.pr) });
}

// --- Fine partita ----------------------------------------------------------
const pannelloFine = document.getElementById('fine');
const fineDettaglio = document.getElementById('fineDettaglio');
document.getElementById('tornaAlMenu').addEventListener('click', tornaAlMenu);
document.getElementById('apriGuida').addEventListener('click', () => {
  pannelloGuida.hidden = false;
});
document.getElementById('chiudiGuida').addEventListener('click', () => {
  pannelloGuida.hidden = true;
});

traduciPagina();
costruisciMenu();
// Le chiamate all'indietro (menu, saluto, richiesta dell'indirizzo) le mette
// gia' creaRete: sono le stesse per il mondo sul PC e per quello nel telefono.

/**
 * Un server rimasto acceso da prima parla una lingua piu' vecchia e fa
 * sparire in silenzio tutto quello che sta dalla sua parte. Meglio dirlo che
 * lasciar credere che il gioco sia rotto.
 */
function avvisaSeDisallineato() {
  const avviso = document.getElementById('avvisoVersione');
  if (!rete.disallineato) {
    avviso.hidden = true;
    return;
  }
  avviso.hidden = false;
  avviso.textContent = t('menu.versioneVecchia', {
    server: rete.versioneServer,
    client: VERSIONE,
  });
  document.getElementById('menuDentro').append(avviso);
}
rete.avvia();

// --- La previsione locale --------------------------------------------------
// Il proprio personaggio non si aspetta la risposta del server: si muove
// subito, e poi si rifanno i conti quando arriva la verita'. Perche' i conti
// tornino, qui si eseguono passi della stessa identica durata di quelli del
// server (SOTTOPASSO), sullo stesso identico codice, nello stesso ordine —
// ogni comando ha un numero e il server dice fin dove e' arrivato.
let io = null; // posizione dopo l'ultimo sottopasso
let prima = null; // posizione prima dell'ultimo sottopasso, per interpolare
let accumulo = 0;
let seq = 0;
let pendenti = []; // comandi che il server non ha ancora confermato
let ultimoTickVisto = -1;
let memoria = null; // le caselle gia' viste, che restano disegnate spente
let versioneMappaVista = -1;
let eraInStallo = false;
let lampo = 0; // il lampo rosso quando l'allarme scatta

let scorso = performance.now();
let fps = 0;

function giro(ora) {
  requestAnimationFrame(giro);
  const dt = Math.min((ora - scorso) / 1000, 0.25);
  scorso = ora;
  fps += (1 / (dt || 1) - fps) * 0.05;

  if (rete.stato === 'menu') {
    // Se si sta scrivendo l'indirizzo del server, parla quel pannello.
    if (pannelloMenu.hidden && pannello.hidden) pannelloMenu.hidden = false;
    if (!bottonePausa.hidden) bottonePausa.hidden = true;
    controllerNelMenu();
    aggiornaStatoServer();
    return; // parla il menu
  }

  if (rete.stato !== 'dentro' || !rete.mappa) {
    if (rete.stato === 'senzaIndirizzo') return; // parla il pannello
    disegno.scena({ larghezza: 0, altezza: 0, griglia: [] }, [], 0, null, null);
    disegno.messaggio(t(rete.stato === 'caduto' ? 'gioco.caduta' : 'gioco.collegamento'));
    return;
  }
  if (!pannello.hidden) pannello.hidden = true;

  const mappa = rete.mappa;
  if (rete.versioneMappa !== versioneMappaVista) {
    // Settore nuovo: si riparte al buio, senza ricordi di una pianta che non
    // esiste piu', e senza previsioni riferite a posizioni di prima.
    versioneMappaVista = rete.versioneMappa;
    suoni.sirena(false);
    prima_.allarme = null;
    memoria = nuovaMemoria(mappa);
    io = null;
    prima = null;
    pendenti = [];
    accumulo = 0;
    ultimoTickVisto = -1;
    return;
  }
  if (!memoria) memoria = nuovaMemoria(mappa);
  const nostro = rete.ultimaNostra();
  if (!io && nostro) {
    io = { x: nostro.x, y: nostro.y, ang: nostro.a };
    prima = { x: io.x, y: io.y };
  }
  if (!io) return;

  comandi.misura(disegno.w, disegno.h);
  const centro = disegno.schermo(io.x, io.y);
  const c = comandi.leggi(centro);
  tastiDiServizio();

  // Se le fotografie non arrivano piu', si sta fermi. Camminare per due
  // secondi mentre il server non riceve i comandi non fa avanzare di un
  // metro: fa solo tornare indietro di colpo quando la rete si riprende.
  const stallo = rete.inStallo();
  if (stallo) {
    eraInStallo = true;
    accumulo = 0;
  } else if (eraInStallo) {
    eraInStallo = false;
    risincronizza();
  }

  // Passi a durata fissa. Se il telefono va a 30 fotogrammi al secondo ne fa
  // due per fotogramma, se va a 120 ne fa uno ogni due: il mondo avanza allo
  // stesso ritmo comunque, ed e' il ritmo del server.
  // A terra ci si trascina, da morti non ci si muove. Il telefono applica la
  // stessa regola del server, altrimenti prevederebbe una corsa che non c'e'.
  const mioStato = nostro?.st ?? STATO.VIVO;
  const ripari = rete.ripari();
  const velocitaBase =
    mioStato === STATO.MORTO ? 0 : mioStato === STATO.CRITICO ? VELOCITA_CRITICO : VELOCITA;

  accumulo += stallo ? 0 : dt;
  let fatti = 0;
  while (!stallo && accumulo >= SOTTOPASSO && fatti < 8) {
    accumulo -= SOTTOPASSO;
    fatti++;
    seq++;
    prima = { x: io.x, y: io.y };
    // Scavalcare un riparo rallenta, e il conto si rifa' a ogni sottopasso
    // esattamente come sul server. Farlo una volta per fotogramma sembrerebbe
    // uguale e non lo e': la fascia della barriera e' larga meno di quanto si
    // cammini in un fotogramma, e basterebbe a far litigare i due calcoli.
    const velocita = velocitaFraIRipari(velocitaBase, ripari, io.x, io.y);
    muovi(io, c.mx, c.my, SOTTOPASSO, mappa, velocita);
    const mira = angolo(c.ax, c.ay) ?? angolo(c.mx, c.my);
    if (mira !== null) io.ang = mira;
    pendenti.push({ seq, mx: c.mx, my: c.my, vel: velocita });
    if (pendenti.length > 300) pendenti.shift();
    rete.mandaPasso(seq, c);
  }
  if (fatti === 8) accumulo = 0; // troppo arretrato (app tornata in primo piano)

  if (!stallo) riconcilia(mappa);

  // Fra un sottopasso e l'altro si interpola, altrimenti a 60 fotogrammi con
  // passi da un sessantesimo capiterebbe un fotogramma fermo e uno doppio.
  const q = Math.min(1, accumulo / SOTTOPASSO);
  const disegnato = {
    x: prima.x + (io.x - prima.x) * q,
    y: prima.y + (io.y - prima.y) * q,
    a: io.ang,
  };

  const scena = rete
    .personaggi()
    .map((p) => (p.i === rete.io ? { ...p, ...disegnato } : p));

  disegno.inquadra(mappa, disegnato.x, disegnato.y);
  // Le torce di tutti finiscono nella stessa lista: quello che si vede e'
  // la loro unione, e il compagno illumina anche per te.
  const fuochi = rete.fuochi();
  const luci = calcolaVisione(mappa, scena, memoria, fuochi);

  // I nemici esistono anche al buio, ma si vedono solo se qualcuno li
  // illumina — o se l'Eco li ha marcati, e allora si vedono anche attraverso
  // i muri. E di quelli che si vedono si vede anche dove stanno guardando:
  // sapere cosa vede la sentinella e' meta' del gioco.
  const regolaNemico = NEMICI.pattugliatore;
  const nemiciVisti = rete.nemici().filter((n) => n.m === 1 || illuminato(luci, n.x, n.y));
  const coni = nemiciVisti.map((n) => ({
    punti: ventaglio(mappa, n.x, n.y, n.a, regolaNemico.cono, regolaNemico.vista, null),
    umore: n.u,
  }));

  disegno.scena(mappa, scena, rete.io, luci, memoria, {
    nemici: nemiciVisti,
    coni,
    colpi: rete.colpi(),
    oggetti: fuochi,
    sonar: rete.sonar(),
    casse: rete.rifornimenti(),
    ripari,
    scoppi: rete.scoppi(),
    mioId: rete.io,
  });
  disegno.stick(comandi);

  // I rumori sentiti di recente, con quanto sono svaniti.
  const adesso = performance.now();
  const echi = rete.rumoriSentiti
    .map((r) => ({
      ...r,
      forza: r.a?.[rete.io] ?? 0,
      vita: 1 - (adesso - r.nato) / (ECO_SECONDI * 1000),
    }))
    .filter((r) => r.vita > 0 && r.forza > 0);
  disegno.rumori(echi, disegnato);

  const mio = scena.find((p) => p.i === rete.io);
  disegno.pulsanti(comandi, mio);
  disegno.cruscotto(mio, scena, VITA_MASSIMA);
  suona(dt, scena.find((p) => p.i === rete.io), disegnato);

  const ob = rete.obiettivi();

  // Spedizione perduta: lo dice una schermata, non un ritorno improvviso al
  // primo settore senza aver capito cosa e' successo.
  if (ob?.fine && pannelloFine.hidden) {
    fineDettaglio.textContent = t('fine.dettaglio', { settore: ob.settore });
    pannelloFine.hidden = false;
    suoni.sirena(false);
    suoni.evento('aTerra');
  }

  aggiornaBriefing(ob);
  disegno.obiettivi(ob, memoria, mappa);
  if (ob?.al) {
    disegno.allarme();
    lampo = Math.max(0, lampo - dt * 2);
    disegno.lampoAllarme(lampo);
  }
  disegno.missione(ob, disegnato);
  disegno.hud([
    `ping ${rete.ping} ms   fps ${fps.toFixed(0)}`,
    t('gioco.nemiciInVista', { quanti: nemiciVisti.length }),
  ]);
  if (stallo) disegno.avviso(t('gioco.stallo'));

  aggiornaDiario(dt, scena.some((p) => p.i === rete.io), fps, disegnato);
}

/**
 * Dopo un'interruzione si riparte dalla posizione del server e si buttano i
 * comandi non confermati: alcuni si sono persi per strada, e rieseguirli
 * porterebbe il telefono da un'altra parte rispetto alla verita'.
 */
function risincronizza() {
  const nostro = rete.ultimaNostra();
  pendenti = [];
  accumulo = 0;
  ultimoTickVisto = -1;
  if (!nostro || !io) return;
  io.x = nostro.x;
  io.y = nostro.y;
  prima = { x: io.x, y: io.y };
}

/**
 * Rifa' i conti quando arriva una fotografia: si riparte dalla posizione che
 * il server dichiara, si buttano i comandi che ha gia' eseguito e si rieseguono
 * quelli rimasti. Se il telefono e il server hanno calcolato la stessa cosa —
 * ed e' il caso normale — non si sposta di un pixel.
 */
function riconcilia(mappa) {
  const foto = rete.ultimaNostraConTick();
  if (!foto || foto.tick === ultimoTickVisto) return;
  ultimoTickVisto = foto.tick;

  const rifatto = { x: foto.p.x, y: foto.p.y };
  pendenti = pendenti.filter((c) => c.seq > (foto.p.s ?? 0));
  for (const c of pendenti) muovi(rifatto, c.mx, c.my, SOTTOPASSO, mappa, c.vel ?? VELOCITA);

  const dx = rifatto.x - io.x;
  const dy = rifatto.y - io.y;
  const scarto = Math.hypot(dx, dy);
  diario.correzioneMax = Math.max(diario.correzioneMax, scarto);
  // Sotto il decimo di pixel e' solo l'arrotondamento dei numeri spediti:
  // inseguirlo produrrebbe un tremolio continuo per niente.
  if (scarto < 0.1) return;

  io.x = rifatto.x;
  io.y = rifatto.y;
  // Anche il punto di partenza dell'interpolazione si sposta, altrimenti la
  // correzione si vedrebbe come uno strappo nel fotogramma successivo.
  prima.x += dx;
  prima.y += dy;
}

requestAnimationFrame(giro);

// Maniglia per frugare nello stato dalla console del browser durante le prove.
window.ecoNera = {
  rete,
  comandi,
  disegno,
  giro, // per far avanzare il gioco a mano quando si prova senza schermo
  suoni,
  get io() { return io; },
  get pendenti() { return pendenti; },
};

// --- Il suono --------------------------------------------------------------
// Quello che succede si sente: i rumori del mondo con la loro direzione e la
// loro forza (che tiene conto dei muri, la calcola il server), e quello che
// capita a te come avvenimento senza direzione.
const prima_ = {
  vita: null,
  armatura: null,
  stato: null,
  nemici: null,
  nuclei: null,
  uscita: null,
  allarme: null,
  settore: null,
  torcia: null,
  esaurita: null,
  abilita: null,
  bomba: null,
  bombeFatte: null,
};

/** Quanto manca al prossimo tic della miccia. */
let ticchettio = 0;

function suona(dt, mio, dove) {
  const ob = rete.obiettivi();
  const nemici = rete.nemici();

  // Si segnano i rumori originali, non le copie che il disegno si fa a ogni
  // fotogramma: segnare la copia vorrebbe dire risuonare tutto sessanta volte
  // al secondo.
  for (const r of rete.rumoriSentiti) {
    if (r.suonato) continue;
    r.suonato = true;
    const forza = r.a?.[rete.io] ?? 0;
    if (forza <= 0) continue;
    suoni.rumore(r.k, forza, Math.max(-1, Math.min(1, (r.x - dove.x) / 420)));
  }

  if (mio) {
    if (prima_.vita !== null && mio.v < prima_.vita) suoni.evento('ferito');
    if (prima_.armatura !== null && (mio.ar ?? 0) > prima_.armatura) suoni.evento('rifornimento');
    if (prima_.stato !== null && mio.st !== prima_.stato) {
      if (mio.st === STATO.CRITICO) suoni.evento('aTerra');
      if (prima_.stato !== STATO.VIVO && mio.st === STATO.VIVO) suoni.evento('rialzato');
    }
    if (prima_.torcia !== null && mio.l !== prima_.torcia) {
      suoni.evento(mio.l ? 'torciaAccesa' : 'torciaSpenta');
    }
    if (prima_.esaurita === 0 && mio.es === 1) suoni.evento('caricaFinita');
    // L'abilita' appena usata: la ricarica salta da zero al massimo.
    if (prima_.abilita !== null && mio.ab > prima_.abilita + 0.5) {
      if (mio.r === 'eco') suoni.evento('marchio');
      if (mio.r === 'assalto') suoni.evento('riparo');
    }
    prima_.vita = mio.v;
    prima_.armatura = mio.ar ?? 0;
    prima_.stato = mio.st;
    prima_.torcia = mio.l;
    prima_.esaurita = mio.es;
    prima_.abilita = mio.ab;
  }

  if (prima_.nemici !== null && nemici.length < prima_.nemici) suoni.evento('nemicoAbbattuto');
  prima_.nemici = nemici.length;

  if (ob) {
    const accesi = ob.nuclei.filter((n) => n.a).length;
    if (prima_.nuclei !== null && accesi > prima_.nuclei) suoni.evento('nucleoAcceso');
    if (prima_.uscita === 0 && ob.es.a === 1) suoni.evento('uscitaAperta');
    // La sirena non e' un effetto che parte e finisce: e' uno stato, e si
    // accende e si spegne insieme all'allarme.
    if (prima_.allarme !== ob.al) {
      suoni.sirena(ob.al === 1);
      if (ob.al === 1) lampo = 1;
    }
    prima_.allarme = ob.al;
    if (prima_.settore !== null && ob.settore !== prima_.settore) suoni.evento('settore');
    prima_.nuclei = accesi;
    prima_.uscita = ob.es.a;
    prima_.settore = ob.settore;

    // La bomba: prenderla, posarla, e il tic della miccia. Il tic e' la voce
    // della modalita' — dice quanto manca senza costringere a leggere un
    // numero mentre si spara.
    const b = ob.bo;
    if (b) {
      if (prima_.bomba !== null && prima_.bomba !== b.st) {
        if (b.st === 'inMano') suoni.evento('bombaPresa');
        if (b.st === 'piazzata') suoni.evento('bombaPiazzata');
      }
      if (prima_.bombeFatte !== null && b.n > prima_.bombeFatte) suoni.evento('scoppio');
      prima_.bomba = b.st;
      prima_.bombeFatte = b.n;

      // In mano lo sente solo chi la porta; piazzata lo sentono tutti e due.
      const miRiguarda = (b.st === 'inMano' && b.da === rete.io) || b.st === 'piazzata';
      if (miRiguarda && !b.c) {
        ticchettio -= dt;
        if (ticchettio <= 0) {
          ticchettio = b.t <= 10 ? 0.4 : 1;
          suoni.evento(b.t <= 10 ? 'ticFitto' : 'tic');
        }
      } else {
        ticchettio = 0;
      }
    } else {
      prima_.bomba = null;
      prima_.bombeFatte = null;
    }
  }

  suoni.aggiorna(dt, {
    cacciatori: nemici.filter((n) => n.u === UMORE.CACCIA).length,
    critico: mio?.st === STATO.CRITICO,
    allarme: ob?.al === 1,
  });
}

// --- Il diario -------------------------------------------------------------
// Il telefono racconta al server come sta andando. Serve perche' gli scatti si
// vedono sul dispositivo vero e non si riproducono sul PC: invece di tirare a
// indovinare, si guardano i numeri di chi sta giocando davvero.
const diario = {
  fotogrammaPiuLungo: 0,
  correzioneMax: 0,
  saltoMax: 0,
  assente: false,
  da: performance.now(),
};
let dovEro = null;

function aggiornaDiario(dt, sonoInScena, fps, disegnato) {
  diario.fotogrammaPiuLungo = Math.max(diario.fotogrammaPiuLungo, dt * 1000);
  if (!sonoInScena) diario.assente = true;

  // Quanto e' saltato sullo schermo il personaggio da un fotogramma all'altro:
  // e' la misura diretta di quello che si vede come "scatto".
  if (dovEro) {
    diario.saltoMax = Math.max(diario.saltoMax, Math.hypot(disegnato.x - dovEro.x, disegnato.y - dovEro.y));
  }
  dovEro = { x: disegnato.x, y: disegnato.y };

  const ora = performance.now();
  if (ora - diario.da < 2000) return;

  rete.mandaDiario({
    fps: Math.round(fps),
    fotogrammaPiuLungo: Math.round(diario.fotogrammaPiuLungo),
    correzioneMax: Math.round(diario.correzioneMax * 10) / 10,
    saltoMax: Math.round(diario.saltoMax * 10) / 10,
    assente: diario.assente,
    fotografie: Math.round((rete.contaFotografie * 1000) / (ora - diario.da)),
    riconnessioni: rete.riconnessioni,
    ping: rete.ping,
    arretrati: pendenti.length,
  });

  rete.contaFotografie = 0;
  rete.riconnessioni = 0;
  diario.fotogrammaPiuLungo = 0;
  diario.correzioneMax = 0;
  diario.saltoMax = 0;
  diario.assente = false;
  diario.da = ora;
}

// Lo schermo non deve spegnersi durante una partita.
async function tieniAcceso() {
  try {
    await navigator.wakeLock?.request('screen');
  } catch {
    /* il browser puo' rifiutare: non e' grave */
  }
}
tieniAcceso();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    suoni.sospendi();
    return;
  }
  tieniAcceso();
  // Mentre l'app era in secondo piano il disegno era fermo e i comandi non
  // partivano: il server ci ha lasciati dov'eravamo. Si riparte da li' invece
  // di riprendere una previsione vecchia di chissa' quanto.
  risincronizza();
  suoni.riprendi();
});

// Su alcuni telefoni, uscendo dall'app, arriva questo e non l'altro.
addEventListener('pagehide', () => suoni.sospendi());
addEventListener('blur', () => {
  if (document.hidden) suoni.sospendi();
});
