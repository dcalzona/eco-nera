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

/**
 * Entra nella stanza e scopri chi sei.
 *
 * Nessuno dichiara di voler ospitare: si entra nello stesso numero e il
 * servizio dice a ciascuno che parte ha. Il primo che arriva ospita, e a
 * deciderlo e' una scrittura che riesce a uno solo — non un controllo seguito
 * da una decisione, che lascerebbe il tempo a tutti e due di credersi i primi.
 */
export async function entraInStanza(stanza) {
  const d = await chiedi('/api/stanza', { method: 'POST', body: JSON.stringify({ stanza }) });
  return d.ruolo; // 'ospita' | 'invitato'
}

/** Chi ospita: lascia la sua offerta. Rifarlo tiene viva la stanza. */
export async function lasciaOfferta(stanza, offerta) {
  return chiedi('/api/stanza', { method: 'PUT', body: JSON.stringify({ stanza, offerta }) });
}

/** Chi e' invitato: lascia la sua risposta. */
export async function lasciaRisposta(stanza, risposta) {
  return chiedi('/api/stanza', { method: 'PUT', body: JSON.stringify({ stanza, risposta }) });
}

/** Cosa c'e' nella stanza adesso. Vuota non e' un errore: e' chi e' arrivato primo. */
export async function guardaStanza(stanza) {
  return chiedi(`/api/stanza?stanza=${encodeURIComponent(stanza)}`, { method: 'GET' });
}

/**
 * Chi ospita aspetta la risposta, chiedendo ogni tanto.
 *
 * Non e' elegante quanto una notifica, ma per uno scambio che dura pochi
 * secondi e capita una volta a partita e' la cosa piu' semplice che funziona —
 * e soprattutto non richiede che il servizio tenga aperto niente, che e' il
 * motivo per cui puo' stare su Vercel e costare zero.
 *
 * Ogni tanto si riscrive anche l'offerta: e' il battito che tiene il posto.
 * Senza, dopo un minuto e mezzo la stanza scade sotto i piedi di chi sta li'
 * ad aspettare, e l'altro arrivando si troverebbe host al posto suo.
 */
export function aspettaRisposta(
  stanza,
  offerta,
  { ogni = 1500, finoA = 150000, battito = 30000, fermati } = {},
) {
  const scadenza = Date.now() + finoA;
  let ultimoBattito = Date.now();
  return new Promise((riuscito, fallito) => {
    const guarda = async () => {
      if (fermati?.()) return fallito(new Error('annullato'));
      if (Date.now() > scadenza) return fallito(new Error('nessuno si e collegato'));
      try {
        const d = await guardaStanza(stanza);
        if (d.risposta) return riuscito(d.risposta);
        if (Date.now() - ultimoBattito > battito) {
          ultimoBattito = Date.now();
          await lasciaOfferta(stanza, offerta);
        }
      } catch (e) {
        // Una chiesta andata storta non e' la fine: si riprova al giro dopo.
      }
      setTimeout(guarda, ogni);
    };
    guarda();
  });
}

/**
 * Chi e' invitato aspetta che chi ospita abbia lasciato la sua offerta.
 *
 * Di solito c'e' gia' o ci mette un attimo — il tempo che l'altro telefono
 * finisca di raccogliere i suoi indirizzi. Ma se chi ospita ha chiuso l'app
 * senza salutare, il suo posto resta occupato e qui non arriva mai niente: per
 * questo si smette dopo un po' invece di girare in tondo. Chi smette lo scopre
 * riprovando, quando il posto sara' scaduto e potra' prenderlo lui.
 */
export function aspettaOfferta(stanza, { ogni = 1000, finoA = 25000, fermati } = {}) {
  const scadenza = Date.now() + finoA;
  return new Promise((riuscito, fallito) => {
    const guarda = async () => {
      if (fermati?.()) return fallito(new Error('annullato'));
      if (Date.now() > scadenza) {
        return fallito(new Error('chi ospita non si e fatto vivo'));
      }
      try {
        const d = await guardaStanza(stanza);
        if (d.offerta) return riuscito(d.offerta);
      } catch (e) {
        /* si riprova al giro dopo */
      }
      setTimeout(guarda, ogni);
    };
    guarda();
  });
}
