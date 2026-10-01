# MV / Battlefield

Persönliche, responsive Battlefield-Fanseite für den Clan MV als interaktives Spielmenü. MV-8lackh4wk, MV-Criban, MV-KingCoffee und MV-54bI44 sind per Klick oder Tastatur auswählbar. Die Statistikansicht zeigt die BF6-Werte des ausgewählten Spielers. MV-KingCoffee und MV-54bI44 haben private Profile und lösen keine API-Abfragen aus. MV-54bI44 sitzt während seiner Einsatzpause auf einem Campingstuhl. Sein Porträt liegt in `public/images/54bi44-camping-chair.png`.

Die Battlefield-Historie lässt sich für öffentliche Profile öffnen.

## Lokal starten

```sh
npm install
npm start
```

Anschließend http://localhost:4200 öffnen. `npm run build` erstellt den Produktionsbuild in `dist/bf6-squad/browser`.

Die passende Node-22-Laufzeit wird als lokale Entwicklungsabhängigkeit installiert. Die npm-Skripte nutzen sie direkt, sodass die globale Node-Installation unverändert bleibt.

Die Profile samt Tracker-Links stehen im typisierten `players`-Array in `src/main.ts`. Das Menü und die Soldatenauswahl stehen in `src/app/app.component.html`. Die wiederverwendbare `ProfileCardComponent` in `src/app/profile-card/` zeigt die Statistikansicht des ausgewählten Spielers. Globale Farben und Layout stehen in `src/styles.css`.

Die aktiven Bilder liegen in `public/images/criban-soldier.png` und `public/images/8lackh4wk-soldier.png`. Zum Austauschen `players[].image` in `src/main.ts` ändern. Der freie Platz verwendet `public/images/soldier-placeholder.svg`. Bildprompts: `public/images/SOLDIERS-GENERATION.md`. Auf Mobilgeräten steht die Auswahl oberhalb der Statistiken.

Die generierten Soldatenbilder liegen in `public/images/criban.png` und `public/images/8lackh4wk.png`. Prompts und Herkunft sind in `public/images/GENERATION.md` dokumentiert. Angular kopiert `public/` in den Build. Schriften werden von Google Fonts geladen; ohne Netzwerk greifen lokale Ersatzschriften.

`Bf6StatsService` lädt K/D, Matches und Spielzeit über `/bf6/stats/`. Die Stunden werden aus `secondsPlayed / 3600` berechnet (numerische Entsprechung zu `timePlayed`). Der Rang kommt separat aus `/bf6/profile/`, Feld `playerProfiles[0].playerCard.rank`. Schlägt nur die Profilabfrage fehl, bleiben die anderen Werte sichtbar; der Rang wird als nicht verfügbar markiert. Die Karten zeigen Lade- und Fehlerzustände mit Wiederholen-Button. Die API kann Daten zwischenspeichern; die Werte sind keine Echtzeit-Spielstände.

Nach Änderungen an `angular.json` den Entwicklungsserver neu starten (`Strg+C`, dann `npm start`), damit neue Asset-Verzeichnisse wie `public/images/` ausgeliefert werden.

## BF6-Statistik-Abzug

Erfolgreich geladene API-Statistiken werden pro Spieler für fünf Minuten im Arbeitsspeicher gecached. Beim Spielerwechsel werden sie wiederverwendet; parallele Abfragen für denselben Spieler teilen einen Request. Nach einem Neuladen der Seite beginnt der Cache neu. „Erneut laden“ leert den Cache des ausgewählten Spielers. Fehler und lokale Statistik-Abzüge werden nicht gecached.

Die BF6-Ansicht zeigt auch die abgefeuerten Schüsse (`shotsFired`). Die Historie summiert Spielzeit, Schüsse und Matches aus den numerischen `totals` der Einträge in `src/app/data/battlefield-history.ts` und den aktuellen BF6-Werten (bei API-Problemen aus dem lokalen Abzug). BF6 wird einmal gezählt. Fehlende Werte werden nicht als null Schüsse oder null Matches interpretiert, sondern als unvollständige Summe gekennzeichnet. Bei neuen historischen Einträgen die numerischen `totals` zusammen mit den angezeigten `stats` pflegen.

`npm run snapshot:bf6` ruft die Statistiken und den Rang von MV-8lackh4wk und MV-Criban ab und speichert sie mit dem jeweiligen Abrufdatum in `public/data/bf6-stats-snapshot.json`. Private Profile werden nicht abgerufen. Ein bestehender Abzug wird erst ersetzt, wenn beide Spieler erfolgreich abgerufen und K/D sowie Rang geprüft wurden.

Der Abzug wird mit der Seite ausgeliefert. Bei API-Fehlern, ungültiger K/D oder Zeitüberschreitungen lädt die Statistikansicht automatisch diese Datei. Sie kennzeichnet die gespeicherten Werte und zeigt Datum und Uhrzeit des Abzugs in der Zeitzone Europe/Berlin. „Live-Daten erneut laden“ versucht erneut die API. Bei erfolgreichen API-Abfragen werden weiterhin Live-Daten angezeigt. Zum Aktualisieren den Befehl erneut ausführen und die Seite mit der aktualisierten Datei veröffentlichen.

Inoffizielles Fanprojekt, nicht mit EA oder DICE verbunden. Kein eigenes Backend.


## GitHub Pages

Der Workflow `.github/workflows/pages.yml` baut und veröffentlicht die Seite nach jedem Push auf `main`. Im Repository unter Settings > Pages als Quelle GitHub Actions wählen. Der Basis-Pfad wird automatisch aus der Pages-Konfiguration übernommen. Auch die Hallenkulisse funktioniert im Unterverzeichnis einer Projektseite.
