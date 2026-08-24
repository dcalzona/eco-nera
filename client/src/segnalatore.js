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

/** Dove sta il servizio. Si puo' cambiare dal telefono, e si ricorda. */
const PREDEFINITO = 'https://eco-nera-segnalatore.vercel.app';

export function indirizzoSegnalatore() {
  const salvato = typeof localStorage !== 'undefined'
    ? localStorage.getItem('ecoNera.segnalatore')
    : null;
  return (salvato || PREDEFINITO).replace(/\/+$/, '');
}

export function cambiaSegnalatore(indirizzo) {
  const pulito = String(indirizzo || '').trim().replace(/\/+$/, '');
  if (!pulito) return false;
  localStorage.setItem('ecoNera.segnalatore', pulito);
  return true;
}

async function chiedi(percorso, opzioni) {
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
