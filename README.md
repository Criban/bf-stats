# MV / Battlefield

Persönliche, responsive Battlefield-Fanseite für den Clan MV als interaktives Spielmenü. Zwei Soldaten und eine Silhouette sind per Klick oder Tastatur auswählbar. Links erscheinen die BF6-K/D, Rang, gespielte Stunden, Matches und der Tracker-Link des ausgewählten Spielers. MV-Criban und MV-8lackh4wk belegen die ersten zwei Plätze; der dritte Platz ist ausdrücklich frei und lösen keine API-Abfragen aus.

Die Spielhistorie ist vorerst ausgeblendet; eine Timeline ist für später vorgesehen.

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

Inoffizielles Fanprojekt, nicht mit EA oder DICE verbunden. Kein eigenes Backend.


## GitHub Pages

Der Workflow `.github/workflows/pages.yml` baut und veröffentlicht die Seite nach jedem Push auf `main`. Im Repository unter Settings > Pages als Quelle GitHub Actions wählen. Der Basis-Pfad wird automatisch aus der Pages-Konfiguration übernommen. Auch die Hallenkulisse funktioniert im Unterverzeichnis einer Projektseite.
