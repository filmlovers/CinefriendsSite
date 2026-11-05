/**
 * CINEFRIENDS — Prenotazioni Google Sheets con identificativo stabile della proiezione.
 * Colonne: A data, B chiave legacy leggibile, C nome, D email, E quantità,
 * F partecipazione, G note, H posti leggibili, I codici posto, J ID proiezione.
 * Mantiene la compatibilità con le righe create prima dell'introduzione degli ID.
 */

const CAPIENZA = 7;
const FOGLIO = 'Prenotazioni';
const FOGLIO_CAPIENZE = 'Capienze';
const POSTI = {
  'sofa-1': 'Divano 1', 'sofa-2': 'Divano 2', 'sofa-3': 'Divano 3', 'sofa-4': 'Divano 4',
  'floor-1': 'Terra 1', 'floor-2': 'Terra 2', 'floor-3': 'Terra 3'
};
const POSTI_IDS = Object.keys(POSTI);
const INTESTAZIONI = [
  'Data e ora', 'Film', 'Nome', 'Email', 'Posti',
  'Partecipazione', 'Note', 'Posti scelti', 'ID posti', 'ID proiezione'
];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'availability';
  if (action !== 'availability') return json_({ ok: false, error: 'azione_sconosciuta' });

  const aliases = aliasFilm_(e && e.parameter ? e.parameter.filmAliases : '');
  const rows = righe_(foglio_());
  const booked = {};
  rows.forEach(row => {
    const quantity = Number(row[4]);
    if (!(quantity > 0)) return;
    const legacy = String(row[1] || '').trim();
    const storedId = String(row[9] || '').trim();
    const id = storedId || aliases.legacyToId[legacy] || legacy;
    aggiungiConteggio_(booked, id, quantity);
    if (legacy) aggiungiConteggio_(booked, legacy, quantity);
    if (storedId && aliases.idToLegacy[storedId] && aliases.idToLegacy[storedId] !== legacy) {
      aggiungiConteggio_(booked, aliases.idToLegacy[storedId], quantity);
    }
  });

  const bookedSeats = postiOccupati_(rows, aliases);
  const capacities = capienze_();
  Object.keys(aliases.idToLegacy).forEach(id => {
    const legacy = aliases.idToLegacy[id];
    if (Object.prototype.hasOwnProperty.call(capacities, legacy)) capacities[id] = capacities[legacy];
    if (Object.prototype.hasOwnProperty.call(capacities, id)) capacities[legacy] = capacities[id];
  });

  return json_({ ok: true, booked: booked, bookedSeats: bookedSeats, capacity: CAPIENZA, capacities: capacities });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); }
  catch (error) { return json_({ ok: false, error: 'richiesta_non_valida' }); }
  if (!data || data.action !== 'book') return json_({ ok: false, error: 'azione_sconosciuta' });
  if (data.hp) return json_({ ok: true, left: 0 });

  const filmId = String(data.filmId || '').trim();
  const filmLegacy = String(data.film || '').trim();
  const nome = String(data.name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const quantity = parseInt(data.seats, 10);
  const requestedIds = Array.isArray(data.seatIds) ? data.seatIds.map(value => String(value)) : [];
  const idsValid = requestedIds.length === quantity && new Set(requestedIds).size === requestedIds.length &&
    requestedIds.every(id => Object.prototype.hasOwnProperty.call(POSTI, id));

  if (!filmId || filmId.length > 100 || !filmLegacy || filmLegacy.length > 240 || !nome || nome.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200 ||
      !(quantity >= 1 && quantity <= CAPIENZA) || !idsValid) {
    return json_({ ok: false, error: 'dati_non_validi' });
  }

  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (error) { return json_({ ok: false, error: 'occupato' }); }

  try {
    const sheet = foglio_();
    const rows = righe_(sheet);
    let totalBooked = 0;
    let duplicate = false;
    rows.forEach(row => {
      const rowId = String(row[9] || '').trim();
      const rowLegacy = String(row[1] || '').trim();
      const belongsToProjection = rowId ? rowId === filmId : rowLegacy === filmLegacy;
      if (!belongsToProjection) return;
      const count = Number(row[4]);
      if (count > 0) {
        totalBooked += count;
        if (String(row[3] || '').trim().toLowerCase() === email) duplicate = true;
      }
    });

    const aliases = aliasFilm_('');
    aliases.legacyToId[filmLegacy] = filmId;
    aliases.idToLegacy[filmId] = filmLegacy;
    const allBooked = postiOccupati_(rows, aliases);
    const occupied = allBooked[filmId] || [];
    const capacities = capienze_();
    const capacityValue = Object.prototype.hasOwnProperty.call(capacities, filmId)
      ? capacities[filmId] : capacities[filmLegacy];
    const capacityFromSheet = Number(capacityValue);
    const totalCapacity = Number.isFinite(capacityFromSheet) && capacityValue !== '' && capacityValue != null
      ? Math.max(0, Math.min(CAPIENZA, capacityFromSheet)) : CAPIENZA;
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
      new Date(), filmLegacy, sicuro_(nome), email, quantity,
      sicuro_(data.attendance), sicuro_(data.notes), names.join(', '), requestedIds.join(','), filmId
    ]);
    SpreadsheetApp.flush();
    return json_({ ok: true, left: Math.max(0, totalCapacity - totalBooked - quantity), bookedSeats: [...occupied, ...requestedIds] });
  } finally {
    lock.releaseLock();
  }
}

function aliasFilm_(raw) {
  const result = { legacyToId: {}, idToLegacy: {} };
  if (!raw) return result;
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return result;
    items.forEach(item => {
      const id = String(item && item.id || '').trim();
      const legacyKey = String(item && item.legacyKey || '').trim();
      if (id && legacyKey) {
        result.legacyToId[legacyKey] = id;
        result.idToLegacy[id] = legacyKey;
      }
    });
  } catch (error) {
    console.warn('filmAliases non valido', error);
  }
  return result;
}

function aggiungiConteggio_(target, key, value) {
  if (!key) return;
  target[key] = (Number(target[key]) || 0) + value;
}

function postiOccupati_(rows, aliases) {
  aliases = aliases || { legacyToId: {}, idToLegacy: {} };
  const occupied = {};
  // Prima raccoglie i posti esplicitamente selezionati.
  rows.forEach(row => {
    const legacy = String(row[1] || '').trim();
    const storedId = String(row[9] || '').trim();
    const key = storedId || aliases.legacyToId[legacy] || legacy;
    const idsText = String(row[8] || '').trim();
    if (!key || !idsText) return;
    if (!occupied[key]) occupied[key] = [];
    idsText.split(',').map(id => id.trim()).filter(id => Object.prototype.hasOwnProperty.call(POSTI, id)).forEach(id => {
      if (!occupied[key].includes(id)) occupied[key].push(id);
    });
  });
  // Le vecchie righe senza ID posti occupano i primi posti ancora liberi in modo stabile.
  rows.forEach(row => {
    const legacy = String(row[1] || '').trim();
    const storedId = String(row[9] || '').trim();
    const key = storedId || aliases.legacyToId[legacy] || legacy;
    const quantity = Number(row[4]);
    const idsText = String(row[8] || '').trim();
    if (!key || !(quantity > 0) || idsText) return;
    if (!occupied[key]) occupied[key] = [];
    let remaining = quantity;
    for (let i = 0; i < POSTI_IDS.length && remaining > 0; i++) {
      const id = POSTI_IDS[i];
      if (!occupied[key].includes(id)) { occupied[key].push(id); remaining--; }
    }
  });
  // Espone le stesse sedute anche con le chiavi legacy, per le versioni precedenti del contatore.
  Object.keys(aliases.idToLegacy).forEach(id => {
    const legacy = aliases.idToLegacy[id];
    if (occupied[id]) occupied[legacy] = occupied[id].slice();
    else if (occupied[legacy]) occupied[id] = occupied[legacy].slice();
    else { occupied[id] = []; occupied[legacy] = []; }
  });
  return occupied;
}

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
  const existingColumns = sheet.getLastColumn();
  if (existingColumns === 0) {
    sheet.getRange(1, 1, 1, INTESTAZIONI.length).setValues([INTESTAZIONI]);
    sheet.getRange(1, 1, 1, INTESTAZIONI.length).setFontWeight('bold');
  } else if (existingColumns < INTESTAZIONI.length) {
    sheet.getRange(1, existingColumns + 1, 1, INTESTAZIONI.length - existingColumns)
      .setValues([INTESTAZIONI.slice(existingColumns)]);
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
    if (film && row[1] !== '' && Number.isFinite(count) && count >= 0) output[film] = Math.min(CAPIENZA, count);
  });
  return output;
}

function sicuro_(value) {
  const text = String(value == null ? '' : value).trim().slice(0, 500);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
