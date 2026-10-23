/**
 * Bild oder Note – Datenspeicher in Google Sheets.
 * Einfügen unter: Google-Tabelle > Erweiterungen > Apps Script.
 * Danach bereitstellen als Web-App (siehe README.md).
 */

// Dieses Passwort brauchst du auf der Auswertungsseite. Bitte ändern!
const PASSWORT = 'bitte-aendern';

// An diese Adresse geht bei jedem Speichern eine Backup-Mail.
const MAIL = 'deine.adresse@example.com';

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

// Backup per Mail. Ein Fehler hier darf das Speichern nicht verhindern.
function backupMail_(rec, fehler) {
  try {
    const teil = rec.a2_typ ? 'komplett' : 'Teil 1';
    let betreff = 'Bild oder Note: ' + (rec.kuerzel || '?') + ' / ' + rec.gruppe + ' (' + teil + ')';
    let text = SPALTEN.map(c => c + ': ' + (rec[c] ?? '')).join('\n')
      + '\n\nCSV:\n' + SPALTEN.join(';') + '\n' + SPALTEN.map(c => rec[c] ?? '').join(';');
    if (fehler) {
      // Fehlermail nur einmal pro Kind und Teil (die Webseite versucht es alle 20 s erneut).
      const cache = CacheService.getScriptCache(), key = 'fehler_' + rec.id + '_' + teil;
      if (cache.get(key)) return;
      cache.put(key, '1', 21600);
      betreff = 'FEHLER beim Speichern – ' + betreff;
      text = 'In die Tabelle konnte nicht gespeichert werden:\n' + fehler + '\n\n' + text;
    }
    MailApp.sendEmail(MAIL, betreff, text);
  } catch (err) {
    console.error('Mail fehlgeschlagen: ' + err);
  }
}

// Einmal im Editor ausführen, damit Google die Mail-Berechtigung abfragt.
function testMail() {
  backupMail_({ id: 'test', kuerzel: 'TEST', gruppe: 'bild' });
}

// Speichern (neu oder ergänzen, anhand der id) und Löschen.
function doPost(e) {
  const lock = LockService.getScriptLock();
  let rec = null;
  try {
    const body = JSON.parse(e.postData.contents);
    rec = body.rec || null;
    lock.waitLock(30000);
    const sh = blatt_();
    const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => String(r[0]));

    if (body.action === 'delete') {
      if (body.pw !== PASSWORT) return antwort_({ ok: false, error: 'passwort' });
      const i = ids.indexOf(String(body.id));
      if (i > 0) sh.deleteRow(i + 1);
      return antwort_({ ok: true });
    }

    if (body.action === 'save' && rec && rec.id) {
      const zeile = SPALTEN.map(c => sicher_(rec[c]));
      const i = ids.indexOf(String(rec.id));
      if (i > 0) sh.getRange(i + 1, 1, 1, SPALTEN.length).setValues([zeile]);
      else sh.appendRow(zeile);
      lock.releaseLock();                  // andere Kinder nicht auf die Mail warten lassen
      if (rec.a2_typ) backupMail_(rec);    // normale Mail: nur einmal, wenn komplett
      return antwort_({ ok: true });
    }

    return antwort_({ ok: false, error: 'unbekannt' });
  } catch (err) {
    lock.releaseLock();
    if (rec && rec.id) backupMail_(rec, String(err));   // Fehlermail
    return antwort_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
