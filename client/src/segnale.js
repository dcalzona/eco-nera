// Come fanno due telefoni a trovarsi.
//
// WebRTC sa collegare direttamente due dispositivi in capo al mondo, ma non sa
// come farli incontrare la prima volta: uno deve far avere all'altro una
// descrizione di se' — quali indirizzi ha, su che porte ascolta, con quali
// chiavi cifra — e ricevere indietro la stessa cosa. Quel primo scambio se lo
// deve inventare chi scrive il gioco.
//
// Qui la descrizione diventa un codice di testo compatto, e a passarlo da una
// parte all'altra ci pensa il segnalatore: chi ospita la lascia li' sotto un
// numero di sei cifre, l'altro scrive quel numero e se la prende.
//
// Per un pezzo quei due codici si passavano a mano — WhatsApp, un messaggio,
// a voce se uno aveva pazienza — ed era la parte piu' scomoda del gioco:
// dieci minuti per cominciare una partita, e un carattere sbagliato buttava
// via tutto. Adesso c'e' il numero, e la strada a mano e' stata tolta: tenerla
// li' accanto a quella buona faceva solo credere che quella buona non
// bastasse.
//
// Il segnalatore serve solo a questo primo scambio. Da qui in poi i due
// telefoni si parlano diretti e lui non c'entra piu' niente.

/**
 * I server STUN servono a una cosa sola: dire a un telefono qual e' il suo
 * indirizzo visto da fuori. Senza, due telefoni su reti diverse non riescono
 * nemmeno a nominarsi. Non passa nessun dato di gioco da qui.
 */
export const STUN = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
];

/** Quanto si aspetta che finisca la raccolta degli indirizzi, al massimo. */
const ATTESA_CANDIDATI = 5000;

export function nuovaPresa() {
  return new RTCPeerConnection({ iceServers: STUN });
}

/**
 * Aspetta che il telefono abbia finito di raccogliere i suoi indirizzi.
 *
 * Si potrebbe mandarli uno alla volta man mano che arrivano — e' il modo
 * elegante — ma vorrebbe dire un canale aperto fra i due telefoni PRIMA di
 * averne uno, cioe' il problema che stiamo risolvendo. Aspettando, la
 * descrizione diventa un codice unico e autosufficiente.
 *
 * Su certe reti l'ultimo indirizzo non arriva mai: dopo cinque secondi ci si
 * accontenta di quelli che ci sono, che di solito bastano.
 */
export function aspettaCandidati(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((finito) => {
    const orologio = setTimeout(chiudi, ATTESA_CANDIDATI);
    function chiudi() {
      clearTimeout(orologio);
      pc.removeEventListener('icegatheringstatechange', guarda);
      finito();
    }
    function guarda() {
      if (pc.iceGatheringState === 'complete') chiudi();
    }
    pc.addEventListener('icegatheringstatechange', guarda);
  });
}

// --- Il codice da passarsi -------------------------------------------------

/**
 * La descrizione diventa testo compatto. Il formato SDP e' prolisso — due o
 * tre chilobyte — e nessuno si copia tre chilobyte: si comprime e si scrive in
 * lettere e numeri, e resta un pugno di caratteri.
 */
export async function inCodice(descrizione) {
  const testo = JSON.stringify({ t: descrizione.type, s: descrizione.sdp });
  return base64url(await stringi(testo));
}

export async function daCodice(codice) {
  const testo = await allarga(daBase64url(codice.trim()));
  const d = JSON.parse(testo);
  return { type: d.t, sdp: d.s };
}

async function stringi(testo) {
  const grezzo = new TextEncoder().encode(testo);
  if (typeof CompressionStream === 'undefined') return grezzo;
  const flusso = new Blob([grezzo]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flusso).arrayBuffer());
}

async function allarga(byte) {
  if (typeof DecompressionStream === 'undefined') return new TextDecoder().decode(byte);
  const flusso = new Blob([byte]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(flusso).text();
}

function base64url(byte) {
  let s = '';
  for (const b of byte) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function daBase64url(codice) {
  const s = atob(codice.replace(/-/g, '+').replace(/_/g, '/'));
  const byte = new Uint8Array(s.length);
  for (let k = 0; k < s.length; k++) byte[k] = s.charCodeAt(k);
  return byte;
}

// --- Le due mosse del ballo ------------------------------------------------

/**
 * Chi ospita: apre i canali, si descrive, e consegna il codice da mandare
 * all'altro. I canali vanno creati PRIMA dell'offerta: e' la loro presenza a
 * finire dentro la descrizione, e senza non ci sarebbe niente da collegare.
 */
export async function creaInvito(pc) {
  await pc.setLocalDescription(await pc.createOffer());
  await aspettaCandidati(pc);
  return inCodice(pc.localDescription);
}

/** Chi ospita, seconda mossa: prende la risposta e il filo si tende. */
export async function accettaRisposta(pc, codice) {
  await pc.setRemoteDescription(await daCodice(codice));
}

/** Chi e' invitato: prende l'invito e restituisce il codice di risposta. */
export async function rispondiAInvito(pc, codice) {
  await pc.setRemoteDescription(await daCodice(codice));
  await pc.setLocalDescription(await pc.createAnswer());
  await aspettaCandidati(pc);
  return inCodice(pc.localDescription);
}
