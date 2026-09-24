# Bild oder Note

Online-Werkzeug für das IDPA-Experiment: Schülerinnen und Schüler der 3./4. Primarklasse lösen ein Sudoku,
bekommen je nach Gruppe ein **Bild** (Smiley) oder eine **Note** und wählen danach die Schwierigkeit der
zweiten, nicht bewerteten Aufgabe (leichter = 1, gleich schwer = 2, schwieriger = 3).

Die Ergebnisse landen in einer Google-Tabelle. Die Kinder brauchen kein Konto.

## Links

Nach der Einrichtung (unten) ist die Seite so erreichbar:

| Zweck | Link |
|---|---|
| Gruppe Bild | `https://<dein-github-name>.github.io/bild-oder-note/#bild` |
| Gruppe Note | `https://<dein-github-name>.github.io/bild-oder-note/#note` |
| Auswertung | `https://<dein-github-name>.github.io/bild-oder-note/#auswertung` |

Für ein neues Kind am selben Gerät den Link einfach neu laden.

## Einrichtung

### 1. Google-Tabelle und Skript

1. Auf [sheets.new](https://sheets.new) eine neue Google-Tabelle anlegen, z. B. «Bild oder Note – Daten».
2. Menü **Erweiterungen → Apps Script**.
3. Den Inhalt von `google-apps-script/Code.gs` hineinkopieren (alles Bestehende ersetzen).
4. Oben im Skript `PASSWORT` ändern und speichern.
5. **Bereitstellen → Neue Bereitstellung → Typ: Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
6. Zugriff erlauben (Google fragt nach deinem Konto, «Erweitert → Weiter zu …» wählen).
7. Die **Web-App-URL** kopieren (endet auf `/exec`).

### 2. URL in die Webseite eintragen

In `index.html` diese Zeile suchen und die URL einfügen:

```js
const SCRIPT_URL='https://script.google.com/macros/s/…/exec';
```

### 3. Auf GitHub veröffentlichen

1. Auf github.com ein neues Repository **bild-oder-note** anlegen (Public).
2. **Add file → Upload files**: `index.html` (und optional die anderen Dateien) hochladen, **Commit**.
3. **Settings → Pages**: Source «Deploy from a branch», Branch **main**, Ordner **/ (root)**, **Save**.
4. Nach 1–2 Minuten ist die Seite unter `https://<dein-github-name>.github.io/bild-oder-note/` erreichbar.

### 4. Testen

Einen Durchgang mit Häkchen **Probedurchlauf** machen. In der Google-Tabelle erscheint nach der
Wahl der zweiten Aufgabe eine Zeile. In der Auswertung das Passwort eingeben und «Aktualisieren» drücken.

## Gut zu wissen

- Fällt das Internet kurz aus, bleibt das Ergebnis auf dem Gerät und wird automatisch nachgeschickt.
  Auf der Startseite steht dann, wie viele Ergebnisse noch warten. Das Gerät nicht zurücksetzen,
  bevor diese Meldung verschwunden ist.
- Änderst du später `Code.gs`, musst du unter **Bereitstellen → Bereitstellungen verwalten** eine neue
  Version bereitstellen, sonst läuft die alte weiter.
- Die Webseite selbst ist öffentlich. Speichere deshalb nur Kürzel, keine Namen der Kinder.
  Lesen und Löschen der Daten geht nur mit dem Passwort.

## Spalten in der Tabelle

| Spalte | Bedeutung |
|---|---|
| gruppe | `bild` oder `note` |
| probe | 1 = Probedurchlauf, wird in der Auswertung ausgeblendet |
| a1_leer / a1_richtig | leere Felder im ersten Sudoku / davon richtig ausgefüllt |
| a1_note | Note = 1 + 5 × Anteil richtig, auf halbe Noten gerundet |
| a1_bild | Smiley-Stufe zur gleichen Note (traurig, neutral, froh, strahlend) |
| wahl / wert | gewählte zweite Aufgabe: leichter 1, gleich 2, schwieriger 3 |
| a2_… | Ergebnis der zweiten Aufgabe (wird dem Kind nicht angezeigt) |
| …_zeit_s | benötigte Zeit in Sekunden |
