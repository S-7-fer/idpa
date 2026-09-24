/**
 * Bild oder Note – Datenspeicher in Google Sheets.
 * Einfügen unter: Google-Tabelle > Erweiterungen > Apps Script.
 * Danach bereitstellen als Web-App (siehe README.md).
 */

// Dieses Passwort brauchst du auf der Auswertungsseite. Bitte ändern!
const PASSWORT = 'bitte-aendern';

const BLATT = 'Ergebnisse';
const SPALTEN = ['id', 'datum', 'klasse', 'kuerzel', 'gruppe', 'probe',
  'a1_leer', 'a1_richtig', 'a1_ausgefuellt', 'a1_note', 'a1_bild', 'a1_zeit_s',
  'wahl', 'wert', 'a2_typ', 'a2_ergebnis', 'a2_geloest', 'a2_zeit_s'];

function blatt_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(BLATT);
  if (!sh) sh = ss.insertSheet(BLATT);
  if (sh.getLastRow() === 0) {
    sh.appendRow(SPALTEN);
    sh.setFrozenRows(1);
  }
  return sh;
}

function antwort_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Text, der mit = + - @ beginnt, würde Google Sheets als Formel lesen.
function sicher_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

// Auswertung: alle Zeilen lesen (nur mit Passwort).
function doGet(e) {
  if ((e.parameter.pw || '') !== PASSWORT) return antwort_({ ok: false, error: 'passwort' });
  const werte = blatt_().getDataRange().getValues();
  const kopf = werte.shift();
  const rows = werte.map(r => Object.fromEntries(kopf.map((h, i) => [h, r[i]])));
  return antwort_({ ok: true, rows: rows });
}

// Speichern (neu oder ergänzen, anhand der id) und Löschen.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const body = JSON.parse(e.postData.contents);
    const sh = blatt_();
    const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => String(r[0]));

    if (body.action === 'delete') {
      if (body.pw !== PASSWORT) return antwort_({ ok: false, error: 'passwort' });
      const i = ids.indexOf(String(body.id));
      if (i > 0) sh.deleteRow(i + 1);
      return antwort_({ ok: true });
    }

    if (body.action === 'save' && body.rec && body.rec.id) {
      const zeile = SPALTEN.map(c => sicher_(body.rec[c]));
      const i = ids.indexOf(String(body.rec.id));
      if (i > 0) sh.getRange(i + 1, 1, 1, SPALTEN.length).setValues([zeile]);
      else sh.appendRow(zeile);
      return antwort_({ ok: true });
    }

    return antwort_({ ok: false, error: 'unbekannt' });
  } finally {
    lock.releaseLock();
  }
}
