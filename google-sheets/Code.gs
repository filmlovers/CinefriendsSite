/**
 * CINEFRIENDS — Prenotazioni Google Sheets con scelta dei 7 posti.
 *
 * Sostituisce il contenuto del precedente Code.gs in Apps Script.
 * Mantiene compatibili le colonne già presenti e aggiunge:
 *   H = Posti scelti (nomi leggibili)
 *   I = ID posti (codici usati dal sito)
 *
 * I posti sono: Divano 1–4 e Terra 1–3.
 */

const CAPIENZA = 7;
const FOGLIO = 'Prenotazioni';
const FOGLIO_CAPIENZE = 'Capienze';
const POSTI = {
  'sofa-1': 'Divano 1',
  'sofa-2': 'Divano 2',
  'sofa-3': 'Divano 3',
  'sofa-4': 'Divano 4',
  'floor-1': 'Terra 1',
  'floor-2': 'Terra 2',
  'floor-3': 'Terra 3'
};
const POSTI_IDS = Object.keys(POSTI);
const INTESTAZIONI = [
  'Data e ora', 'Film', 'Nome', 'Email', 'Posti',
  'Partecipazione', 'Note', 'Posti scelti', 'ID posti'
];

// ---------- Lettura disponibilità ----------
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'availability';
  if (action !== 'availability') return json_({ ok: false, error: 'azione_sconosciuta' });

  const rows = righe_(foglio_());
  const booked = {};
  rows.forEach(row => {
    const film = String(row[1] || '').trim();
    const quantity = Number(row[4]);
    if (film && quantity > 0) booked[film] = (booked[film] || 0) + quantity;
  });

  return json_({
    ok: true,
    booked: booked,
    bookedSeats: postiOccupati_(rows),
    capacity: CAPIENZA,
    capacities: capienze_()
  });
}

// ---------- Nuova prenotazione ----------
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return json_({ ok: false, error: 'richiesta_non_valida' });
  }
  if (!data || data.action !== 'book') return json_({ ok: false, error: 'azione_sconosciuta' });
  if (data.hp) return json_({ ok: true, left: 0 });

  const film = String(data.film || '').trim();
  const nome = String(data.name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const quantity = parseInt(data.seats, 10);
  const requestedIds = Array.isArray(data.seatIds)
    ? data.seatIds.map(value => String(value))
    : [];

  const idsValid = requestedIds.length === quantity &&
    new Set(requestedIds).size === requestedIds.length &&
    requestedIds.every(id => Object.prototype.hasOwnProperty.call(POSTI, id));

  if (!film || film.length > 200 || !nome || nome.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200 ||
      !(quantity >= 1 && quantity <= CAPIENZA) || !idsValid) {
    return json_({ ok: false, error: 'dati_non_validi' });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (error) {
    return json_({ ok: false, error: 'occupato' });
  }

  try {
    const sheet = foglio_();
    const rows = righe_(sheet);
    let totalBooked = 0;
    let duplicate = false;

    rows.forEach(row => {
      if (String(row[1] || '').trim() !== film) return;
      const count = Number(row[4]);
      if (count > 0) {
        totalBooked += count;
        if (String(row[3] || '').trim().toLowerCase() === email) duplicate = true;
      }
    });

    const allBooked = postiOccupati_(rows);
    const occupied = allBooked[film] || [];
    const available = CAPIENZA - Math.min(CAPIENZA, totalBooked);
    const capacityFromSheet = Number(capienze_()[film]);
    const totalCapacity = Number.isFinite(capacityFromSheet) && capacityFromSheet >= 0
      ? Math.min(CAPIENZA, capacityFromSheet)
      : CAPIENZA;
    const left = Math.max(0, totalCapacity - totalBooked);

    if (duplicate) return json_({ ok: false, error: 'doppione' });
    if (quantity > left || totalBooked + quantity > totalCapacity) {
      return json_({ ok: false, error: 'esaurito', left: left });
    }
    if (requestedIds.some(id => occupied.includes(id))) {
      return json_({ ok: false, error: 'posto_occupato', left: left });
    }

    const names = requestedIds.map(id => POSTI[id]);
    sheet.appendRow([
      new Date(),
      film,
      sicuro_(nome),
      email,
      quantity,
      sicuro_(data.attendance),
      sicuro_(data.notes),
      names.join(', '),
      requestedIds.join(',')
    ]);
    SpreadsheetApp.flush();

    return json_({
      ok: true,
      left: Math.max(0, totalCapacity - totalBooked - quantity),
      bookedSeats: [...occupied, ...requestedIds]
    });
  } finally {
    lock.releaseLock();
  }
}

// ---------- Ricostruzione dei posti occupati ----------
function postiOccupati_(rows) {
  const occupied = {};

  // Prima applica i posti esplicitamente scelti dalle prenotazioni nuove.
  rows.forEach(row => {
    const film = String(row[1] || '').trim();
    const storedIds = String(row[8] || '').trim();
    if (!film || !storedIds) return;
    const ids = storedIds.split(',').map(id => id.trim())
      .filter(id => Object.prototype.hasOwnProperty.call(POSTI, id));
    if (!occupied[film]) occupied[film] = [];
    ids.forEach(id => {
      if (!occupied[film].includes(id)) occupied[film].push(id);
    });
  });

  // Compatibilità: assegna in modo stabile i posti alle vecchie prenotazioni
  // che furono registrate prima dell'introduzione della selezione grafica.
  rows.forEach(row => {
    const film = String(row[1] || '').trim();
    const quantity = Number(row[4]);
    const storedIds = String(row[8] || '').trim();
    if (!film || !(quantity > 0) || storedIds) return;
    if (!occupied[film]) occupied[film] = [];
    let remaining = quantity;
    for (let i = 0; i < POSTI_IDS.length && remaining > 0; i++) {
      const id = POSTI_IDS[i];
      if (!occupied[film].includes(id)) {
        occupied[film].push(id);
        remaining--;
      }
    }
  });

  return occupied;
}

// ---------- Funzioni di supporto ----------
function foglio_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(FOGLIO);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(FOGLIO);
    sheet.appendRow(INTESTAZIONI);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, INTESTAZIONI.length).setFontWeight('bold');
    return sheet;
  }

  // Aggiunge le intestazioni nuove senza eliminare o riscrivere le prenotazioni esistenti.
  if (sheet.getLastColumn() < INTESTAZIONI.length) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1,
      INTESTAZIONI.length - sheet.getLastColumn()).setValues([
        INTESTAZIONI.slice(sheet.getLastColumn())
      ]);
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function righe_(sheet) {
  const values = sheet.getDataRange().getValues();
  return values.slice(1);
}

function capienze_() {
  const output = {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FOGLIO_CAPIENZE);
  if (!sheet) return output;
  sheet.getDataRange().getValues().forEach(row => {
    const film = String(row[0] || '').trim();
    const count = Number(row[1]);
    if (film && count >= 0 && row[1] !== '') output[film] = Math.min(CAPIENZA, count);
  });
  return output;
}

function sicuro_(value) {
  const text = String(value == null ? '' : value).trim().slice(0, 500);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
