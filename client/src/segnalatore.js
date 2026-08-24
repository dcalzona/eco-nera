// Il telefono che parla col segnalatore.
//
// Tre chiamate in croce, e nessuna di loro sa niente del gioco: si lascia una
// stringa sotto un codice, si legge una stringa dato un codice, si lascia la
// risposta. Quello che c'e' dentro quelle stringhe — la descrizione WebRTC di
// ciascun telefono — al servizio non interessa.
//
// Finito lo scambio, il segnalatore esce di scena: i due telefoni si parlano
// diretti, e se il servizio andasse giu' a meta' partita non se ne
// accorgerebbe nessuno.

/**
 * Il servizio nostro, quello che sta su.
 *
 * Prima qui c'era un indirizzo inventato come esempio, e non esisteva: chi
 * provava a farsi dare un codice si sentiva rispondere "il servizio non
 * risponde" — che e' vero, ma manda a cercare il guasto dalla parte sbagliata.
 * Non sapere dov'e' una cosa e trovarla rotta sono due guai diversi.
 *
 * Poi il campo e' rimasto vuoto, ed era onesto ma scomodo: l'indirizzo andava
 * scritto a mano su tutti e due i telefoni, sempre uguale, e sbagliarne una
 * lettera dava lo stesso guasto muto di prima. Adesso ce n'e' uno vero e
 * provato. Chi ne vuole un altro lo scrive nel campo e quello ha la
 * precedenza; se lo cancella si torna qui.
 */
const DI_FABBRICA = 'https://eco-nera.vercel.app';

export function indirizzoSegnalatore() {
  const salvato = typeof localStorage !== 'undefined'
    ? localStorage.getItem('ecoNera.segnalatore')
    : null;
  return pulisci(salvato) || DI_FABBRICA;
}

/** Vero se si sa dove chiamare. Con quello di fabbrica, sempre. */
export function segnalatoreImpostato() {
  return indirizzoSegnalatore().length > 0;
}

export function cambiaSegnalatore(indirizzo) {
  const pulito = pulisci(indirizzo);
  // Campo svuotato: si torna a quello di fabbrica, non si resta senza.
  if (!pulito) {
    localStorage.removeItem('ecoNera.segnalatore');
    return false;
  }
  localStorage.setItem('ecoNera.segnalatore', pulito);
  return true;
}

/**
 * L'indirizzo come lo scrive una persona, ridotto a come serve qui.
 *
 * Chi copia da Vercel si porta dietro il percorso, e `.../api/stanza` diventa
 * `.../api/stanza/api/stanza`: un guasto invisibile, perche' quello scritto
 * nel campo e' giusto. Meglio togliere il di piu' che spiegarlo.
 */
function pulisci(testo) {
  let s = String(testo ?? '').trim();
  if (!s) return '';
  s = s.replace(/\/+$/, '').replace(/\/api\/stanza$/i, '').replace(/\/+$/, '');
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) {
    // In casa si prova sul servizio di rete locale, che parla http; fuori e'
    // sempre https. Indovinare male qui darebbe un guasto senza spiegazione.
    const inCasa = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(s);
    s = (inCasa ? 'http://' : 'https://') + s;
  }
  return s;
}

async function chiedi(percorso, opzioni) {
  if (!segnalatoreImpostato()) {
    const e = new Error('nessun indirizzo del servizio');
    e.senzaIndirizzo = true;
    throw e;
  }
  const r = await fetch(`${indirizzoSegnalatore()}${percorso}`, {
    ...opzioni,
    headers: { 'Content-Type': 'application/json', ...(opzioni?.headers ?? {}) },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.errore || `il servizio ha risposto ${r.status}`);
  return d;
}

/** Chi ospita: lascia la sua offerta e si prende un codice di sei cifre. */
export async function creaStanza(offerta) {
  const d = await chiedi('/api/stanza', { method: 'POST', body: JSON.stringify({ offerta }) });
  return d.codice;
}

/** Chi e' invitato: si fa dare l'offerta di chi ospita. */
export async function leggiStanza(codice) {
  return chiedi(`/api/stanza?codice=${encodeURIComponent(codice)}`, { method: 'GET' });
}

/** Chi e' invitato: lascia la sua risposta sotto lo stesso codice. */
export async function lasciaRisposta(codice, risposta) {
  return chiedi('/api/stanza', { method: 'PUT', body: JSON.stringify({ codice, risposta }) });
}

/**
 * Chi ospita aspetta la risposta, chiedendo ogni tanto.
 *
 * Non e' elegante quanto una notifica, ma per uno scambio che dura pochi
 * secondi e capita una volta a partita e' la cosa piu' semplice che funziona —
 * e soprattutto non richiede che il servizio tenga aperto niente, che e' il
 * motivo per cui puo' stare su Vercel e costare zero.
 */
export function aspettaRisposta(codice, { ogni = 1500, finoA = 150000, fermati } = {}) {
  const scadenza = Date.now() + finoA;
  return new Promise((riuscito, fallito) => {
    const guarda = async () => {
      if (fermati?.()) return fallito(new Error('annullato'));
      if (Date.now() > scadenza) return fallito(new Error('nessuno si e collegato'));
      try {
        const d = await leggiStanza(codice);
        if (d.risposta) return riuscito(d.risposta);
      } catch (e) {
        // Una chiesta andata storta non e' la fine: si riprova al giro dopo.
        // Se e' la stanza a essere scaduta, lo dira' il tempo massimo.
      }
      setTimeout(guarda, ogni);
    };
    guarda();
  });
}
