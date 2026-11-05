/**
 * CINEFRIENDS — Prenotazioni su Google Sheets
 *
 * Questo script va incollato in Estensioni > Apps Script del foglio Google.
 * Registra ogni prenotazione in una riga e dice al sito quanti posti sono già occupati.
 * Il controllo dei posti avviene qui, e non sul sito, quindi due persone che prenotano
 * gli ultimi posti nello stesso momento non possono superare la capienza.
 *
 * Per annullare una prenotazione: cancella la riga, oppure scrivi 0 nella colonna "Posti".
 * Per cambiare la capienza di una serata: crea un foglio chiamato "Capienze" con due colonne
 * (A: il testo esatto della colonna "Film", B: i posti totali). Le altre serate usano CAPIENZA.
 */

const CAPIENZA = 7;                 // posti totali di ogni serata
const FOGLIO = 'Prenotazioni';      // nome del foglio con le prenotazioni (si crea da solo)
const FOGLIO_CAPIENZE = 'Capienze'; // facoltativo
const INTESTAZIONI = ['Data e ora', 'Film', 'Nome', 'Email', 'Posti', 'Partecipazione', 'Note'];

// ---------- Lettura: posti già occupati per ogni film ----------
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'availability';
  if (action !== 'availability') return json_({ ok: false, error: 'azione_sconosciuta' });
  const booked = {};
  righe_(foglio_()).forEach(r => {
    const film = String(r[1]).trim();
    const posti = Number(r[4]);
    if (film && posti > 0) booked[film] = (booked[film] || 0) + posti;
  });
  return json_({ ok: true, booked: booked, capacity: CAPIENZA, capacities: capienze_() });
}

// ---------- Scrittura: nuova prenotazione ----------
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'richiesta_non_valida' }); }
  if (!d || d.action !== 'book') return json_({ ok: false, error: 'azione_sconosciuta' });
  if (d.hp) return json_({ ok: true, left: 0 }); // campo trappola anti-bot: si finge di accettare

  const film = String(d.film || '').trim();
  const nome = String(d.name || '').trim();
  const email = String(d.email || '').trim().toLowerCase();
  const posti = parseInt(d.seats, 10);
  if (!film || film.length > 200 || !nome || nome.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200 ||
      !(posti >= 1 && posti <= CAPIENZA)) {
    return json_({ ok: false, error: 'dati_non_validi' });
  }

  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return json_({ ok: false, error: 'occupato' }); }
  try {
    const sheet = foglio_();
    const righe = righe_(sheet);
    let occupati = 0, doppione = false;
    righe.forEach(r => {
      if (String(r[1]).trim() !== film) return;
      const p = Number(r[4]);
      if (p > 0) {
        occupati += p;
        if (String(r[3]).trim().toLowerCase() === email) doppione = true;
      }
    });
    const totale = capienze_()[film] || CAPIENZA;
    if (doppione) return json_({ ok: false, error: 'doppione' });
    if (occupati + posti > totale) return json_({ ok: false, error: 'esaurito', left: Math.max(0, totale - occupati) });

    sheet.appendRow([new Date(), film, sicuro_(nome), email, posti, sicuro_(d.attendance), sicuro_(d.notes)]);
    SpreadsheetApp.flush();
    return json_({ ok: true, left: totale - occupati - posti });
  } finally {
    lock.releaseLock();
  }
}

// ---------- Funzioni di supporto ----------
function foglio_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(FOGLIO);
  if (!sheet) {
    sheet = ss.insertSheet(FOGLIO);
    sheet.appendRow(INTESTAZIONI);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, INTESTAZIONI.length).setFontWeight('bold');
  }
  return sheet;
}

function righe_(sheet) {
  const v = sheet.getDataRange().getValues();
  return v.slice(1);
}

function capienze_() {
  const out = {};
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FOGLIO_CAPIENZE);
  if (!s) return out;
  s.getDataRange().getValues().forEach(r => {
    const film = String(r[0]).trim(), n = Number(r[1]);
    if (film && n >= 0 && r[1] !== '') out[film] = n;
  });
  return out;
}

// Evita che il testo inserito dai visitatori venga letto come formula dal foglio
function sicuro_(v) {
  const s = String(v == null ? '' : v).trim().slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
