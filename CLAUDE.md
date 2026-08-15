# CLAUDE.md

Arbeitsanweisungen für Claude Code in diesem Repository.

## Projekt

**englishLs** — Lernkarteikarten-App für Englisch auf B2-Niveau. Der Fokus liegt
auf **Aussprache**; der Wiederholungsmotor ist ein **Leitner-System** mit fünf
Fächern. Ziel im Vollausbau: 10 Level à 50 Wörter. **Aktueller Umfang: MVP mit
Level 1 (50 Wörter).**

Der maßgebliche Plan steht in `planning/PLAN.md` (Revision 2). Bei Widersprüchen
zwischen diesem Dokument und dem Plan gilt der Plan — und sag Bescheid, damit wir
es angleichen. `planning/REVIEW.md` hält fest, warum einzelne Regeln so aussehen,
wie sie aussehen; es ist Historie, keine Anweisung.

**Status: Planungsphase.** Außer diesen beiden Dokumenten existiert noch kein
Code. Die unten genannten Befehle greifen ab Meilenstein M0.

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
   stillschweigend kaputtgehen.

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
Wort, **kein Ton**, keine IPA. Die Eindeutigkeit stellt der Beispielsatz mit
Lücke her.

## Wortdaten

Ein JSON pro Level unter `src/data/levels/level-NN.json`. Pflichtfelder pro Wort:
`id`, `level`, `term`, `pos`, `ipaGb`, `syllables`, `stressIndex`, `translation`,
`example`, `exampleDe`. Optional: `ipaUs`, `note`.

Beim Ergänzen von Wörtern:
- IPA **immer gegen das Cambridge Dictionary** prüfen (British English), nie aus dem Gedächtnis schreiben. Eine Quelle für alle Wörter — gemischte Quellen ergeben inkonsistente Lautschrift.
- Schreibkonvention **`-ise`** (`emphasise`, `recognise`); `-ize` ist im britischen Gebrauch ebenfalls korrekt und gehört bei betroffenen Wörtern in `note`
- `syllables` **phonetisch** schneiden, nicht orthografisch
- `stressIndex` ist 0-basiert, muss innerhalb von `syllables` liegen und mit der Position des `ˈ` in `ipaGb` übereinstimmen
- `pos` ist **genau ein** Wert. Wörter mit wortartabhängiger Aussprache (`appropriate`, `deliberate`) bekommen eine Wortart und die dazu passende IPA; die andere Variante in `note`. Eine Aussprache-App darf nicht offenlassen, welches Ziel gerade gilt.
- `translation` muss spezifisch genug sein, um das englische Wort zu identifizieren — im Modus `de-en` ist sie die Fragestellung
- Beispielsätze auf B2-Niveau, ein Satz, mit dem Zielwort im natürlichen Kontext. Der Satz dient im Modus `de-en` als Lückensatz und muss das Zielwort eindeutig machen.
- `note` für Aussprachefallen und False Friends aus deutscher Perspektive nutzen
- IDs fortlaufend und lückenlos: `l01-w001` … `l01-w050`

Die Schema-Validierung prüft automatisch: eindeutige IDs, Pflichtfelder, `pos`
aus der erlaubten Liste, `stressIndex` in Reichweite, genau ein `ˈ` in `ipaGb`,
und Silbenzahl IPA ↔ `syllables`.

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

Backend, Accounts, Cloud-Sync, Mikrofon-Spracherkennung, **Aufnahme-/Abhörfunktion
(MediaRecorder)**, Level 2–10, Gamification über Streak und Fortschritt hinaus,
Grammatik- oder Schreibübungen. Wenn etwas davon sinnvoll erscheint: vorschlagen,
nicht einfach bauen.

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
