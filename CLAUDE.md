# CLAUDE.md

Arbeitsanweisungen für Claude Code in diesem Repository.

## Projekt

**englishLs** — Lernkarteikarten-App für Englisch auf B2-Niveau. Der Fokus liegt
auf **Aussprache**; der Wiederholungsmotor ist ein **Leitner-System** mit fünf
Fächern. **10 Level à 50 Wörter (500 gesamt) sind erfasst.**

Der maßgebliche Plan steht in `planning/PLAN.md` (Revision 2). Bei Widersprüchen
zwischen diesem Dokument und dem Plan gilt der Plan — und sag Bescheid, damit wir
es angleichen. `planning/REVIEW.md` hält fest, warum einzelne Regeln so aussehen,
wie sie aussehen; es ist Historie, keine Anweisung.

**Status: M0, M1, M3, M4, M4b, M5, M6, M7 fertig; M2 bis auf die IPA-Prüfung.**

- M0 Gerüst · M1 Domain-Kern (`dates`, `leitner`, `scheduler`) mit Tests
- M2 Wortdaten: **alle 10 Level à 50 Wörter (500 gesamt)**, Loader und
  Schema-Validierung stehen — **aber keine einzige IPA ist gegen Cambridge
  geprüft**, siehe `planning/IPA-VERIFICATION.md`. Bis diese Liste abgehakt ist,
  gilt der Build nicht als lernfertig.
- M3 Sprachausgabe: `speech/tts.ts` mit Stimmenwahl, Offline-Verhalten und Tests
- M4 Karten-Flow: beide Abfragerichtungen, Aussprache-Panel, Bewertung,
  Sessionsteuerung und Tastaturbedienung
- M4b Ausspracheprüfung: Mikrofon-Check gegen Azure Pronunciation Assessment,
  hinter der Schnittstelle `speech/assessment.ts`
- M5 Persistenz: Fortschritt und Einstellungen in localStorage, Streak,
  Tageshistorie, Migration bei kaputtem Speicher
- M6 Rahmen-Screens: Home mit Fälligkeitsstand, „nichts fällig" samt freiem Üben,
  Level-Auswahl, Statistik, Einstellungen, Export/Import
- M7 PWA: Manifest, Service Worker, Icons — installierbar und offline nutzbar

Damit ist das MVP funktional vollständig. Was bleibt, ist die **IPA-Prüfung** —
bis `planning/IPA-VERIFICATION.md` abgehakt ist, gilt der Build nicht als
lernfertig.

**Alle 10 Level sind freigeschaltet** — auf Nutzerwunsch, damit der Wortbestand
durchgesehen und geprüft werden kann. Die fortschrittsabhängige Freischaltung ist
damit vom Tisch, nicht nur vertagt.

## Sprache

- Oberfläche, Übersetzungen und Beispielsatz-Übersetzungen: **Deutsch**
- Code, Bezeichner, Kommentare, Commit-Nachrichten: **Englisch**
- Antworten an den Nutzer: **Deutsch**

## Stack

React 19 + TypeScript (`strict`) + Vite · Zustand mit `persist` → localStorage ·
Vitest + React Testing Library · Plain CSS mit Custom Properties · Web Speech API
(`speechSynthesis`) für die Sprachausgabe · Vite PWA Plugin für Offline-Betrieb.

**Keine neuen Abhängigkeiten ohne Rückfrage.** Kein UI-Kit, kein CSS-Framework,
kein Router, keine Datums-Bibliothek — der Umfang rechtfertigt sie nicht.

## Befehle

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktionsbuild
npm run preview    # Produktionsbuild lokal prüfen
npm test           # Vitest (Watch)
npm run test:run   # Vitest einmalig — vor jedem Commit
npm run typecheck  # tsc --noEmit
```

Vor jedem Commit: `npm run test:run` **und** `npm run typecheck` müssen grün sein.

## Architektur — die Regeln, die wirklich zählen

1. **`src/domain/` bleibt rein.** Keine React-Imports, keine Browser-APIs, kein
   Storage, kein `new Date()` im Inneren. Zeit wird als Parameter hineingereicht.
   Diese Schicht ist der Kern und muss ohne DOM testbar bleiben.
2. **Leitner-Regeln haben genau eine Heimat:** `src/domain/leitner.ts`.
   Intervalle, Fachbewegungen und Fälligkeiten werden nirgendwo sonst berechnet
   oder dupliziert — auch nicht „kurz" in einer Komponente.
3. **Die Web Speech API wird nur in `src/speech/tts.ts` angefasst.** Komponenten
   rufen `speechSynthesis` niemals direkt auf. `tts.ts` wertet `localService`
   aus und bevorzugt offline eine lokale Stimme — viele gute EN-Stimmen sind
   netzgebunden.
4. **Wort-IDs sind unveränderlich.** Der Lernfortschritt referenziert sie. Eine
   ID zu ändern bedeutet, den Fortschritt für dieses Wort zu löschen.
5. **Datumsarithmetik nur über `src/domain/dates.ts`**, immer auf lokale
   Tagesgrenze als `YYYY-MM-DD` normalisiert, nie über rohe UTC-Timestamps.
6. **Persistierte Struktur nur mit `schemaVersion`-Erhöhung + Migration ändern.**
   Der Fortschritt des Nutzers liegt ausschließlich lokal und darf nicht
   stillschweigend kaputtgehen. `migrateProgress` in `domain/progress.ts`
   **rettet, was zu retten ist**, statt bei einem kaputten Eintrag alles zu
   verwerfen — und wirft nie, weil ein Absturz beim Start schlimmer wäre.
7. **Die Stores in `store/` bleiben dünn.** Jede Zustandsänderung ist eine reine
   Funktion in `domain/progress.ts`; der Store hält nur und ruft auf.

## Leitner-Regeln (verbindlich)

Fächer 1–5, Wiederholintervalle in Tagen: **1 → 0 · 2 → 1 · 3 → 3 · 4 → 7 ·
5 → 16**.

Bewertung ist dreistufig und wirkt **ausschließlich** über das Fach:

| Eingabe | Neues Fach |
|---|---|
| Nochmal | zurück auf 1, `correctStreak = 0` |
| Unsicher | − 1 (min. 1) |
| Sicher | + 1 (max. 5) |

Daraus folgt die Fälligkeit über eine einzige Regel:

```
dueOn = heute + Intervall(neuesFach)
```

Genau eine Ausnahme: „Sicher" in Fach 5 bleibt Fach 5 und ergibt **30 Tage**
(„gefestigt"). Es gibt **keine** weitere Sonderregel für Fälligkeiten — kein
„morgen", kein Sonderfall pro Bewertung. Wenn beim Implementieren eine zweite
Ausnahme nötig scheint, ist das ein Anlass zur Rückfrage, keine stille Ergänzung.

Session: 20 Karten Standard, höchstens 10 neue Wörter pro Tag; fällige Karten
zuerst (niedriges Fach vor hohem), dann mit neuen auffüllen. Karten, die in Fach 1
landen, kommen **höchstens zweimal pro Session** erneut dran — sonst terminiert
die Session nicht. Das Sessionziel zählt präsentierte Karten inklusive
Wiederholungen.

Tagesgrenze: lokal, Tagesbeginn einstellbar, **Standard 04:00** (nicht
Mitternacht), damit späte Sessions nicht in zwei Lerntage zerfallen.

## Abfragerichtung

Zwei Modi, am Sessionstart wählbar: **`de-en` (Standard, produktiv)** und
`en-de` (rezeptiv). Die Richtung ist eine Darstellungsentscheidung der Session —
es gibt **einen `CardState` pro Wort, nicht pro Richtung**.

Im Modus `de-en` darf die Vorderseite die Antwort nicht verraten: kein englisches
Wort, **kein Ton**, keine IPA, **und kein Ergebnis der Ausspracheprüfung** — das
nennt die erkannten Silben. Die Eindeutigkeit stellt der Beispielsatz mit Lücke
her.

## Wortdaten

Ein JSON pro Level unter `src/data/levels/level-NN.json`. Pflichtfelder pro Wort:
`id`, `level`, `term`, `pos`, `ipaGb`, `syllables`, `stressIndex`, `translation`,
`example`, `exampleDe`. Optional: `ipaUs`, `note`.

**Zum Stand der vorhandenen Daten:** Die 500 Einträge wurden auf ausdrückliche
Anweisung des Nutzers aus dem Modellwissen erfasst, weil in dieser Umgebung keine
Wörterbuchquelle erreichbar ist. Sie tragen damit eine Prüfschuld, die in
`planning/IPA-VERIFICATION.md` nachgehalten wird. Diese Ausnahme ist
dokumentiert, nicht die neue Regel — sie gilt rückwirkend für den vorhandenen
Bestand, nicht für künftige Ergänzungen.

Beim Ergänzen von Wörtern:
- IPA **gegen das Cambridge Dictionary** prüfen (British English), sobald eine Quelle erreichbar ist. Eine Quelle für alle Wörter — gemischte Quellen ergeben inkonsistente Lautschrift. Ist keine Quelle erreichbar: erfassen, aber in `planning/IPA-VERIFICATION.md` als ungeprüft eintragen und den Nutzer darauf hinweisen. Niemals ungeprüfte Lautschrift als geprüft ausgeben.
- IPA in **Cambridge-Notation mit Silbenpunkten** (`əkˈnɒl.ɪdʒ`); Einsilber tragen ebenfalls ein `ˈ`
- Schreibkonvention **`-ise`** (`emphasise`, `recognise`); `-ize` ist im britischen Gebrauch ebenfalls korrekt und gehört bei betroffenen Wörtern in `note`
- `syllables` **phonetisch** schneiden, nicht orthografisch
- `stressIndex` ist 0-basiert, muss innerhalb von `syllables` liegen und mit der Position des `ˈ` in `ipaGb` übereinstimmen
- `pos` ist **genau ein** Wert. Wörter mit wortartabhängiger Aussprache (`appropriate`, `deliberate`) bekommen eine Wortart und die dazu passende IPA; die andere Variante in `note`. Eine Aussprache-App darf nicht offenlassen, welches Ziel gerade gilt.
- `translation` muss spezifisch genug sein, um das englische Wort zu identifizieren — im Modus `de-en` ist sie die Fragestellung
- Beispielsätze auf B2-Niveau, ein Satz, mit dem Zielwort im natürlichen Kontext. Der Satz dient im Modus `de-en` als Lückensatz und muss das Zielwort eindeutig machen.
- `note` für Aussprachefallen und False Friends aus deutscher Perspektive nutzen
- IDs fortlaufend und lückenlos je Level: `lNN-w001` … `lNN-w050`
- Kein Wort darf in zwei Leveln vorkommen — der Test prüft das

Die Schema-Validierung prüft automatisch: eindeutige IDs, Pflichtfelder, `pos`
aus der erlaubten Liste, `stressIndex` in Reichweite und passend zur Position von
`ˈ`, genau ein `ˈ` in `ipaGb`, Silbenzahl IPA ↔ `syllables`, keine Dubletten über
Level hinweg, und dass das Zielwort im Beispielsatz vorkommt.

## Tests

Domain-Logik (`leitner`, `scheduler`, `dates`) und die Wortdaten-Validierung
brauchen Tests — dort sitzen Korrektheit und Nutzerdaten. Für UI-Komponenten
lohnt sich ein Test beim Karten-Flow (Auflösen, Bewerten, nächste Karte); der
Rest wird nicht auf Verdacht testabgedeckt.

## Konventionen

- Funktionskomponenten mit Hooks, keine Klassen
- Eine Komponente pro Datei, Dateiname = Komponentenname
- Kommentare erklären das *Warum*; was der Code tut, soll der Code zeigen
- Deutsche UI-Texte gehören in die Komponente, nicht in eine i18n-Struktur (fest einsprachig, siehe Nicht-Ziele im Plan)
- Sprachausgabe wird **nie** ohne vorausgegangene Nutzergeste ausgelöst (iOS Safari blockt das sonst). Autoplay beim Kartenwechsel ist erlaubt und standardmäßig an, freigeschaltet durch den Tap auf „Session starten"; die Knopfbedienung bleibt zusätzlich erhalten.
- IPA-Zeichenketten `aria-hidden` setzen — Screenreader lesen sie als Zeichensalat vor; Betonung und `note` bleiben als Text zugänglich

## Ausdrücklich außerhalb des Umfangs

Backend, Accounts, Cloud-Sync, Gamification über Streak und Fortschritt hinaus,
Grammatik- oder Schreibübungen. Wenn etwas davon sinnvoll erscheint: vorschlagen,
nicht einfach bauen.

## Ausspracheprüfung

Die Bewertung läuft über die Schnittstelle `src/speech/assessment.ts`
(`PronunciationAssessor`). Azure ist **ein Adapter** dahinter, kein
Querschnittsthema — Komponenten kennen nur die Schnittstelle. Ein Gerätemodell,
ein Schlüssel pro Nutzer oder ein Anbieterwechsel bleiben damit ein
Adaptertausch.

Regeln:
- **Der Mikrofonknopf steht auf der Vorderseite, und die Aufnahme deckt die Karte
  auf.** Lautes Aussprechen ist die Arbeit; eine Karte, die sich ohne sie umdrehen
  lässt, lädt zum zu schnellen Umdrehen ein. „Auflösen" bleibt als Ausweg für
  laute Umgebung oder fehlendes Mikrofon, tritt aber optisch zurück. Eine
  **fehlgeschlagene** Aufnahme deckt nicht auf — kein Versuch, keine Antwort.
- **Das Ergebnis erscheint erst nach dem Aufdecken**, nie auf der Vorderseite.
  Deshalb bleibt `PronunciationCheck` über das Aufdecken hinweg montiert und wird
  per `key={word.id}` erst beim nächsten Wort zurückgesetzt.
- **Die Maschine informiert, der Nutzer entscheidet.** Der Score steuert das
  Leitner-Fach *nicht*; die Bewertungsknöpfe bleiben die einzige Eingabe. Das
  umzustellen ist eine Einbahnstraße und braucht eine ausdrückliche Entscheidung.
- Ohne Schlüssel in der `.env` verschwindet der Knopf rückstandsfrei
  (`isAvailable()`), statt zu scheitern. Vite entfernt das SDK dann komplett aus
  dem Build.
- Das SDK wird **dynamisch** importiert — es ist ~370 kB und gehört nicht in den
  Startpfad.
- Fehlermeldungen des SDK sind rohes Englisch und nennen DOM-Ausnahmen statt
  Abhilfen. `microphoneMessage` übersetzt die häufigen Fälle; unbekannte Ursachen
  bleiben angehängt, statt verschluckt zu werden.
- Azures TypeScript-Typen decken die Phonem-Ebene nicht ab. Das rohe JSON wird
  in `parseAzureResult` ausgelesen; diese Funktion ist rein und getestet, damit
  eine Formatänderung als roter Test auffällt und nicht als leeres Panel.

## Bekannte Schwäche

Die Selbstbewertung ist bei *Aussprache* ein systematisch verzerrtes Signal —
Lernende hören eigene Fehler in der Zielsprache oft nicht und bewerten zu
großzügig. Das ist bekannt und im MVP bewusst nicht gelöst (§13.1 im Plan). Die
Gegenmaßnahmen, die drin sind: Die Bewertungsfrage ist konkret formuliert
(„Betonung auf der richtigen Silbe? Endungen reduziert?"), und das
Aussprache-Panel steht direkt über den Bewertungsknöpfen. Diese beiden Punkte
beim Bauen nicht wegoptimieren — sie sind alles, was die Verzerrung derzeit
bremst.

## Git

Entwicklung läuft auf `claude/english-b2-flashcard-app-8a9a1d`.
Commit-Nachrichten auf Englisch, im Imperativ (`add leitner scheduling`).
Pull Requests nur auf ausdrückliche Aufforderung.
