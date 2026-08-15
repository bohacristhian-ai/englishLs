# PLAN.md — englishLs

**Lernkarteikarten-App für Englisch B2 — Fokus Aussprache, Motor: Leitner-System**

Status: **Planungsphase.** Es existiert noch kein Code. Dieses Dokument ist die
Grundlage für die Umsetzung des MVP (Level 1, 50 Wörter).

Revision 2 — die Befunde aus `planning/REVIEW.md` sind eingearbeitet. Wo der
Review eine Entscheidung offengelassen hat, steht sie jetzt in §2.

---

## 1. Produktidee in einem Absatz

Eine lokale, installierbare Web-App (PWA), in der man B2-Vokabeln nicht nur
liest, sondern **laut ausspricht**. Standardmäßig steht die deutsche Bedeutung
vorne: Man produziert das englische Wort selbst, spricht es aus und prüft danach
gegen Hörbeispiel (TTS), IPA-Lautschrift, Silbentrennung mit markierter Betonung
und Beispielsatz. Wiederholt wird nach dem **Leitner-System** (5 Fächer): Was
sitzt, wandert nach hinten und kommt seltener; was hakt, fällt zurück. Der volle
Ausbau sind 10 Level à 50 Wörter (500 Wörter); das MVP liefert **Level 1
vollständig** und die Level-Architektur so, dass 2–10 reines Datenhinzufügen sind.

## 2. Getroffene Entscheidungen

| Thema | Entscheidung | Begründung |
|---|---|---|
| Plattform | Web-App / PWA, React + Vite + TypeScript | Läuft auf Desktop & Handy, installierbar, offline, kein Store-Deployment |
| Backend | **Keins.** Alles lokal (localStorage) | MVP braucht keine Accounts; spart die gesamte Server-Komplexität |
| Aussprache-Prüfung | Hören + **Selbstbewertung**, IPA sichtbar | Funktioniert in jedem Browser zuverlässig; Spracherkennung ist bei Nicht-Muttersprachlern zu ungenau, um den Lernfortschritt zu steuern. **Bekannte Schwäche, siehe §13.1** |
| **Abfragerichtung** | **DE → EN als Standard**, am Sessionstart auf EN → DE umschaltbar | Produktive Richtung ist die eigentliche Lernarbeit; die Wahl pro Session hält beide Modi verfügbar, ohne zwei Fortschrittsstände zu erzeugen |
| **Aufnahme-Funktion** | **Nicht im MVP** | Bewusst zurückgestellt; bleibt der stärkste Kandidat für v2 (§14) |
| Kartendaten | Wort, IPA, Wortart, DE-Übersetzung, Beispielsatz (+ Silben/Betonung) | B2-tauglich und für 50 Wörter handkuratierbar in guter Qualität |
| Sprachniveau UI | Deutsch | Muttersprache des Nutzers |
| Aussprachevariante | **British English (en-GB)** als Standard, US umschaltbar | Eine Variante muss führen, sonst ist die IPA inkonsistent |
| **IPA-Referenzquelle** | **Cambridge Dictionary**, verbindlich für alle Wörter | Eine feste Quelle statt Gedächtnis; lernerorientiert, GB und US getrennt ausgewiesen |
| **Schreibkonvention** | **`-ise`** (`emphasise`, `recognise`) | Konsequent zur en-GB-Entscheidung. `-ize` ist im britischen Gebrauch ebenfalls korrekt — die `note` weist bei betroffenen Wörtern darauf hin |

## 3. Nicht-Ziele (bewusst außerhalb des MVP)

- Kein Backend, keine Accounts, kein Cloud-Sync, keine Mehrgeräte-Synchronisation
- Keine automatische Spracherkennung per Mikrofon
- **Keine Aufnahme-/Abhörfunktion** (zurückgestellt, siehe §14)
- Level 2–10 werden **nicht** befüllt (Architektur ja, Daten nein)
- Keine Gamification über Streak + Fortschritt hinaus (keine Punkte, kein Shop)
- Keine Grammatik-, Hör- oder Schreibübungen — nur Vokabel + Aussprache
- Keine Internationalisierung der Oberfläche (fest Deutsch)

## 4. Tech-Stack

| Baustein | Wahl |
|---|---|
| Build | Vite |
| Sprache | TypeScript (`strict: true`) |
| UI | React 19, Funktionskomponenten + Hooks |
| State | Zustand mit `persist`-Middleware → localStorage |
| Routing | Eigener schlanker View-State (die Screens brauchen keinen Router) |
| Styling | Plain CSS mit CSS Custom Properties, Mobile-first, Dark/Light |
| Tests | Vitest (Domain-Logik), React Testing Library (Karten-Flow) |
| Sprachausgabe | Web Speech API (`speechSynthesis`) — Browser-nativ, keine Abhängigkeit |
| Offline | Vite PWA Plugin (Service Worker, Manifest) |

Bewusst schlank: keine UI-Bibliothek, kein CSS-Framework, kein Router, kein
State-Machine-Framework. Die Domain-Logik ist klein genug, dass sie als reine
Funktionen lesbarer ist als jede Abstraktion darüber.

## 5. Datenmodell

### 5.1 Wort (statisch, versioniert im Repo)

```ts
type Pos = 'verb' | 'noun' | 'adjective' | 'adverb' | 'phrase';

interface Word {
  id: string;            // "l01-w007" — stabil, nie ändern (Fortschritt hängt daran)
  level: number;         // 1..10
  term: string;          // "acknowledge"
  pos: Pos;              // genau EIN Wert, siehe Kurationsregeln
  ipaGb: string;         // "əkˈnɒlɪdʒ" — Quelle: Cambridge
  ipaUs?: string;        // "əkˈnɑːlɪdʒ" (nur wenn abweichend)
  syllables: string[];   // ["ac", "knowl", "edge"] — phonetisch geschnitten
  stressIndex: number;   // 1 → zweite Silbe ist betont (0-basiert)
  translation: string;   // "anerkennen, einräumen"
  example: string;       // "She refused to acknowledge her mistake."
  exampleDe: string;     // "Sie weigerte sich, ihren Fehler einzuräumen."
  note?: string;         // Aussprachefalle, False Friend, Schreibvariante
}
```

Ablage: `src/data/levels/level-01.json` … `level-10.json`, ein Array pro Datei.

**Validierung** (Laufzeit-Check in Dev, Unit-Test in CI):
- eindeutige IDs, lückenlos fortlaufend, alle Pflichtfelder gesetzt
- `pos` ist einer der erlaubten Werte
- `stressIndex` liegt innerhalb von `syllables`
- `ipaGb` enthält **genau ein** `ˈ` (Hauptbetonung)
- Silbenzahl aus `ipaGb` stimmt mit `syllables.length` überein
- `stressIndex` stimmt mit der Position von `ˈ` in `ipaGb` überein

`ipaGb` wird in **Cambridge-Notation mit Silbenpunkten** erfasst: `əkˈnɒl.ɪdʒ`.
Der Punkt trennt Silben, das `ˈ` ersetzt den Punkt an der betonten Silbe. Das
war ursprünglich nicht so geplant (Revision 2 wollte Vokalkerne zählen), hat sich
bei der Umsetzung aber als klar überlegen erwiesen: Der Silbenschnitt wird
maschinell **exakt** prüfbar statt heuristisch, und die Zeichenkette lässt sich
eins zu eins mit dem Wörterbucheintrag vergleichen. Für die Anzeige liefert
`plainIpa()` die Form ohne Trennzeichen.

Die letzten drei Prüfungen adressieren Review-Befund #6: Die Betonung steht
zwangsläufig doppelt im Datensatz (als `stressIndex` und als `ˈ` in der IPA), und
zwei Quellen für dieselbe Information driften bei Handkuration auseinander. Die
Validierung fängt das automatisch ab, statt sich auf Sorgfalt zu verlassen.

**Kurationsregeln** (Ergänzung zu CLAUDE.md):
- Wörter mit wortartabhängiger Aussprache (`appropriate`, `deliberate`) bekommen **eine** Wortart und die dazu passende IPA; die andere Variante steht in `note`. Eine Aussprache-App darf nicht offenlassen, welches Ziel gerade gilt.
- `translation` muss spezifisch genug sein, um das englische Wort zu identifizieren — sie ist im Standardmodus die Fragestellung (siehe §5.3).
- Silben **phonetisch** schneiden, nicht orthografisch.

### 5.2 Lernfortschritt (dynamisch, im localStorage)

```ts
interface CardState {
  wordId: string;
  box: 1 | 2 | 3 | 4 | 5;
  dueOn: string;          // "2026-08-15", lokale Tagesgrenze
  introducedOn: string;   // Lerntag der Einführung — deckelt neue Wörter pro Tag
  lastReviewedAt: string | null;  // ISO-Timestamp
  correctStreak: number;
  totalCorrect: number;
  totalWrong: number;
  consolidated: boolean;  // in Fach 5 mit „Sicher" bestätigt
}

interface ProgressState {
  schemaVersion: 1;       // für spätere Migrationen
  cards: Record<string, CardState>;
  unlockedLevels: number[];   // im MVP fest [1]
  streak: { current: number; longest: number; lastSessionDay: string | null };
  history: { day: string; reviewed: number; correct: number }[];  // max. 90 Einträge
}
```

Neue Wörter werden **lazy** angelegt: Ein Wort ohne `CardState` gilt als „noch nie
gesehen" und wird von der Session als neue Karte in Fach 1 eingeführt. Das macht
das Hinzufügen von Level 2–10 später zu einem reinen Daten-Commit ohne Migration.

Zwei Felder sind bei der Umsetzung von M1 hinzugekommen, weil die dokumentierten
Regeln ohne sie nicht implementierbar waren: `introducedOn` — ohne das Datum der
Einführung lässt sich „höchstens 10 neue Wörter pro Tag" über mehrere Sessions
eines Tages hinweg nicht durchsetzen. `consolidated` — der Statusschirm zeigt
„gefestigte Wörter", und der Zustand ist aus Fach und Streak nicht zuverlässig
ableitbar (eine Karte kann Fach 5 mit hohem Streak erreichen, ohne dort je
bestätigt worden zu sein).

**Ein `CardState` pro Wort, nicht pro Richtung.** Die Abfragerichtung ist eine
Darstellungsentscheidung der Session, kein eigener Lernpfad: **50 Wörter pro
Level ergeben 50 Lernkarten**, unabhängig davon, in welcher Richtung abgefragt
wird. Die Alternative — je Richtung ein eigener Lernstand — hätte denselben
50 Wörtern 100 Lernkarten mit getrennten Fächern und Fälligkeiten gegeben und ist
bewusst verworfen.

Der in Kauf genommene Nachteil: Wer ein Wort rezeptiv sicher kann, produktiv aber
nicht, sieht das im Fach nicht getrennt. Dafür bleibt es bei einer
Fälligkeitsrechnung und einer Statistik. Getrennte Pfade sind ein v2-Thema, falls
sich die Vermischung im Gebrauch als störend erweist.

`unlockedLevels` wird im MVP fest mit `[1]` initialisiert und von keinem Code
fortgeschrieben — das Feld wird bewusst vorgehalten, damit die Freischaltung
später ohne Schema-Migration greifen kann.

### 5.3 Kartenrichtung

```ts
type Direction = 'de-en' | 'en-de';
```

Wird beim Sessionstart gewählt (Standard `de-en`), gilt für die gesamte Session
und wird nicht persistiert — außer als zuletzt gewählte Voreinstellung in den
Einstellungen.

## 6. Leitner-System (Kern der App)

Fünf Fächer. Die Intervalle sind die einzige Stelle, an der die Wiederholrhythmik
definiert ist — reine Funktionen in `src/domain/leitner.ts`, ohne React, ohne
Storage, vollständig unit-getestet.

| Fach | Intervall bis zur nächsten Wiederholung |
|---|---|
| 1 | 0 Tage (erneut in derselben Session) |
| 2 | 1 Tag |
| 3 | 3 Tage |
| 4 | 7 Tage |
| 5 | 16 Tage |

### Bewertung — drei Stufen, eine Regel

| Eingabe | Neues Fach |
|---|---|
| **Nochmal** | zurück auf 1, `correctStreak = 0` |
| **Unsicher** | Fach − 1 (Minimum 1) |
| **Sicher** | Fach + 1 (Maximum 5), `correctStreak + 1` |

Daraus folgt die Fälligkeit über eine **einzige** Regel:

```
dueOn = heute + Intervall(neuesFach)
```

Genau eine Ausnahme: Wer eine Karte in Fach 5 mit „Sicher" bestätigt, bleibt in
Fach 5 und bekommt **30 Tage** — die Karte gilt als „gefestigt".

> **Änderung gegenüber Revision 1** (Review-Befund #4): Zuvor bedeutete
> „Unsicher" *Fach bleibt, fällig morgen*. In Fach 5 hieß das 30 Tage → 1 Tag →
> 30 Tage: ein einziger zögerlicher Klick warf die Karte aus dem
> Langzeitrhythmus. Mit „Fach − 1" ist die Bewertung durchgehend als
> Fachbewegung definiert, die Sonderregel „morgen" entfällt ersatzlos, und die
> Domain-Schicht kennt nur noch `dueOn = heute + Intervall(Fach)`.

### Session-Auswahl (`src/domain/scheduler.ts`)

1. Alle fälligen Karten sammeln (`dueOn <= heute`) aus freigeschalteten Leveln
2. Sortieren: niedriges Fach zuerst, danach nach ältester Fälligkeit
3. Mit neuen Wörtern auffüllen, bis das Sessionziel erreicht ist (Standard 20 Karten, einstellbar 10/20/30/„alle fälligen"); höchstens 10 **neue** Wörter pro Tag, damit Fach 1 nicht überläuft
4. Karten, die in der Session in Fach 1 landen, werden ans Ende der Warteschlange gehängt — **höchstens zweimal pro Karte und Session**. Danach bleibt die Karte in Fach 1 mit Fälligkeit heute und die Session läuft weiter.
5. Das Sessionziel zählt **präsentierte Karten**, Wiederholungen eingeschlossen. Eine „20er-Session" ist damit verlässlich 20 Karten lang.

> **Änderung gegenüber Revision 1** (Review-Befund #3): Zuvor gab es keine
> Obergrenze für Wiederholungen — eine Session konnte bei einem hartnäckigen
> Wort nicht terminieren, und ob Wiederholungen gegen das Sessionziel zählen,
> war nicht festgelegt.

Zeitrechnung durchgängig auf **lokale Tagesgrenze** normalisiert (`YYYY-MM-DD`),
nie auf UTC-Timestamps. Der Tageswechsel liegt einstellbar bei **04:00** statt um
Mitternacht (Standard), damit eine späte Lernsession nicht in zwei Lerntage
zerfällt und den Streak zerreißt.

### Nichts fällig

Sind keine Karten fällig und alle Wörter eingeführt, zeigt Home das Datum der
nächsten Fälligkeit und bietet einen **freien Übungsdurchlauf** an, der den
Leitner-Fortschritt nicht verändert (kein Fachwechsel, kein `dueOn`, keine
Statistik). Dieser Zustand tritt ab etwa Tag 6 regelmäßig ein und ist erfahrungs-
gemäß der Moment, in dem Lern-Apps aufgegeben werden — er braucht ein Angebot,
keine leere Seite.

## 7. Aussprache-Layer

`src/speech/tts.ts` kapselt die Web Speech API vollständig; kein Komponentencode
fasst `speechSynthesis` direkt an.

- Stimmenwahl: bevorzugt `en-GB`, Fallback `en-US`, Fallback beliebige `en-*`
- Stimmen laden asynchron → auf `voiceschanged` warten, Ergebnis cachen
- Zwei Geschwindigkeiten pro Karte: **normal** (`rate 1.0`) und **langsam** (`rate 0.6`) zum Nachsprechen von Silben
- Abspielbar: das Wort **und** der Beispielsatz getrennt
- Fehlt jede englische Stimme: sichtbarer Hinweis statt stiller Nicht-Funktion; IPA und Betonung tragen die Karte dann allein

### Offline-Verhalten

`tts.ts` wertet `SpeechSynthesisVoice.localService` aus. Ein erheblicher Teil der
guten englischen Stimmen ist **netzgebunden** (Chrome/Android liefert
Google-Stimmen serverseitig) — offline schweigt dann ausgerechnet auf den
Geräten mit der besten Stimmqualität das Kernfeature.

- Ohne Netzverbindung wird eine Stimme mit `localService === true` bevorzugt, auch wenn sie schlechter klingt
- Die Einstellungen zeigen dauerhaft an, ob eine lokale englische Stimme vorhanden ist („Offline-Aussprache: verfügbar / nicht verfügbar")

> **Änderung gegenüber Revision 1** (Review-Befund #1): §12 versprach pauschal
> „funktioniert offline". Das war für das Kernfeature nicht haltbar; das
> Abnahmekriterium ist jetzt entsprechend präzisiert.

### Autoplay

Einstellung „Wort beim Kartenwechsel automatisch vorlesen", **Standard an**,
freigeschaltet durch den Tap auf „Session starten". Die iOS-Safari-Einschränkung
betrifft die *erste* Ausgabe ohne Nutzergeste; danach ist die Sprachausgabe für
die Sitzung frei. Bei 20 Karten spart das rund 40 unnötige Taps in einer App,
deren Kernschleife das Hören ist. Die Knopfbedienung bleibt zusätzlich erhalten.

**Im Modus DE → EN wird auf der Vorderseite nichts abgespielt** — das würde die
Antwort verraten. Autoplay greift dort erst beim Aufdecken.

### Aussprache-Panel

Das visuelle Herzstück der Rückseite: Silben einzeln dargestellt, die betonte
Silbe optisch hervorgehoben und mit `ˈ`-Markierung, darunter die IPA in großer
Schrift, darunter die Aussprache-Notiz, falls vorhanden.

## 8. Screens & Interaktion

1. **Home** — „Heute fällig: N", Streak, Level-Raster (10 Kacheln; 2–10 im MVP als „bald" gesperrt), Fortschrittsbalken Level 1, Startknopf; bei N = 0 der Zustand aus §6
2. **Sessionstart** — Richtungswahl (DE → EN vorausgewählt, EN → DE umschaltbar), Sessiongröße, dann Start
3. **Session** — der Karten-Flow (siehe unten)
4. **Zusammenfassung** — bearbeitete Karten, Trefferquote, Fachbewegungen, nächste Fälligkeit
5. **Statistik** — Verteilung über die fünf Fächer, gefestigte Wörter, Verlauf der letzten 14 Tage
6. **Einstellungen** — Stimme (GB/US), Sprechtempo, Autoplay, Sessiongröße, Standardrichtung, Tagesbeginn, Export/Import, Fortschritt zurücksetzen (mit Rückfrage)

### Karten-Flow

**Modus DE → EN (Standard, produktiv):**

```
Vorderseite:  Deutsche Bedeutung · Wortart
              Beispielsatz mit Lücke:  "She refused to ______ her mistake."
              ↓ (Nutzer produziert das Wort und spricht es laut)
              [Auflösen]
Rückseite:    Wort · IPA groß · Silben mit Betonung · Notiz
              [🔊 Anhören] [🐢 Langsam] · Beispielsatz [🔊] · DE-Satz
              [Nochmal]  [Unsicher]  [Sicher]
```

Die **Lücke im Beispielsatz** ist nicht Deko, sondern löst ein echtes Problem der
produktiven Richtung: „anerkennen, einräumen" passt auf `acknowledge`, `admit`
und `recognise` gleichermaßen. Der Satzkontext macht die Frage eindeutig, ohne
dass wir zusätzliche Daten brauchen — `example` liegt ohnehin vor.

**Modus EN → DE (rezeptiv):**

```
Vorderseite:  Wort groß · Wortart · [🔊 Anhören] [🐢 Langsam]
              ↓ (Nutzer spricht laut nach)
              [Auflösen]
Rückseite:    IPA groß · Silben mit Betonung · Notiz
              DE-Übersetzung · Beispielsatz [🔊] · DE-Satz
              [Nochmal]  [Unsicher]  [Sicher]
```

### Die Bewertungsfrage

Über den drei Knöpfen steht keine vage Frage („Wusstest du es?"), sondern eine
überprüfbare, die sich auf das Aussprache-Panel direkt darüber bezieht:

> **Betonung auf der richtigen Silbe? Endungen reduziert?**

Menschen bewerten eine konkrete, nachprüfbare Frage deutlich verlässlicher als
ein Gefühl. Das mildert die Verzerrung aus §13.1, hebt sie aber nicht auf.

### Bedienung & Barrierefreiheit

Tastatur: `Leertaste` = anhören, `Enter` = auflösen, `1/2/3` = bewerten,
`Esc` = Session verlassen (Fortschritt der bewerteten Karten bleibt erhalten).
Fokusreihenfolge sauber, Buttons beschriftet, Kontrast AA,
`prefers-reduced-motion` respektiert. Die IPA-Zeichenkette wird `aria-hidden`
gesetzt — Screenreader lesen sie sonst als Zeichensalat vor; Betonungsangabe und
`note` bleiben als Text zugänglich.

## 9. Projektstruktur

```
englishLs/
├── CLAUDE.md
├── planning/PLAN.md · planning/REVIEW.md
├── index.html
├── package.json · vite.config.ts · tsconfig.json
├── public/            manifest.webmanifest, Icons
└── src/
    ├── main.tsx · App.tsx
    ├── domain/        types.ts · leitner.ts · scheduler.ts · dates.ts (+ *.test.ts)
    ├── data/          words.ts (Loader + Validierung) · levels/level-01.json
    ├── store/         progressStore.ts · settingsStore.ts
    ├── speech/        tts.ts
    ├── components/    Flashcard · CardFrontDeEn · CardFrontEnDe · PronunciationPanel
    │                  RatingBar · LevelGrid · BoxChart
    ├── screens/       Home · SessionSetup · Session · Summary · Stats · Settings
    └── styles/        tokens.css · app.css
```

Architekturregel: `domain/` ist frei von React, Browser-APIs und Storage — reine
Funktionen, direkt testbar. Alles Unreine (Zeit, Zufall, Sprachausgabe,
Persistenz) wird von außen hineingereicht.

## 10. Wortliste Level 1 (50 Wörter) — zur Abnahme

**Auswahlkriterien:** hochfrequenter B2-Kernwortschatz, und jedes Wort trägt
zusätzlich einen Aussprachewert — verschobene Betonung, Schwa-Reduktion, stumme
Silben, `th`, oder ein klassischer False Friend für Deutschsprachige.

Alle IPA-Angaben werden bei der Kuration (M2) **gegen das Cambridge Dictionary**
geprüft; die Spalte unten nennt die Falle, nicht die endgültige Lautschrift.

| # | Wort | Wortart | Aussprache-/Lernfalle |
|---|---|---|---|
| 1 | acknowledge | verb | Betonung auf Silbe 2, `/əkˈnɒlɪdʒ/` |
| 2 | adequate | adj | Schwa-Endung `/ˈædɪkwət/`, nicht „-eit" |
| 3 | ambiguous | adj | 4 Silben, Betonung auf 2 |
| 4 | anxiety | noun | `/æŋˈzaɪəti/` — kein „ks" |
| 5 | appreciate | verb | `/əˈpriːʃieɪt/` |
| 6 | appropriate | **adj** | Adjektiv `/-ət/`; Verbaussprache `/-eɪt/` steht in `note` |
| 7 | assume | verb | `/əˈsjuːm/` |
| 8 | attitude | noun | Betonung vorn, `/ˈætɪtjuːd/` |
| 9 | awkward | adj | `/ˈɔːkwəd/` — kein „w" am Ende hörbar |
| 10 | beneficial | adj | `/ˌbenɪˈfɪʃl/` |
| 11 | colleague | noun | `/ˈkɒliːɡ/` — Betonung vorn, nicht wie dt. „Kollege" |
| 12 | comfortable | adj | `/ˈkʌmftəbl/` — drei Silben, nicht vier |
| 13 | commitment | noun | Doppel-m, Betonung Mitte |
| 14 | comparison | noun | Betonung wandert ggü. „compare" |
| 15 | conscious | adj | `/ˈkɒnʃəs/` |
| 16 | consequence | noun | Endung `/-kwəns/` |
| 17 | contribute | verb | `/kənˈtrɪbjuːt/` — Betonung Mitte |
| 18 | convenient | adj | `/kənˈviːniənt/` |
| 19 | crucial | adj | `/ˈkruːʃl/` |
| 20 | curiosity | noun | 5 Silben, Betonung auf 3 |
| 21 | deliberate | **adj** | Adjektiv `/-ət/`; Verbaussprache `/-eɪt/` steht in `note` |
| 22 | determine | verb | `/dɪˈtɜːmɪn/` — Endung nicht „-ain" |
| 23 | efficient | adj | `/ɪˈfɪʃnt/` |
| 24 | emphasise | verb | `/ˈemfəsaɪz/` — Betonung vorn; `-ize` ebenfalls korrekt (`note`) |
| 25 | encourage | verb | `/ɪnˈkʌrɪdʒ/` |
| 26 | enthusiasm | noun | `/ɪnˈθjuːziæzəm/` — `th` + Betonung |
| 27 | environment | noun | `/ɪnˈvaɪrənmənt/` — das „n" in der Mitte |
| 28 | essential | adj | `/ɪˈsenʃl/` |
| 29 | establish | verb | Betonung auf 2 |
| 30 | eventually | adv | **False Friend**: „schließlich", nicht „eventuell" |
| 31 | evidence | noun | `/ˈevɪdəns/` |
| 32 | familiar | adj | `/fəˈmɪliə/` — Betonung Mitte |
| 33 | genuine | adj | `/ˈdʒenjuɪn/` — nicht „-ain" |
| 34 | hierarchy | noun | `/ˈhaɪərɑːki/` |
| 35 | inevitable | adj | `/ɪnˈevɪtəbl/` |
| 36 | maintenance | noun | `/ˈmeɪntənəns/` — Betonung vorn, Schwa-Mitte |
| 37 | negotiate | verb | `/nɪˈɡəʊʃieɪt/` — „ti" wird „ʃi" |
| 38 | opportunity | noun | 5 Silben, Betonung auf 3 |
| 39 | perspective | noun | Betonung auf 2 |
| 40 | persuade | verb | `/pəˈsweɪd/` |
| 41 | purchase | **noun** | `/ˈpɜːtʃəs/` — Endung nicht „-eɪs"; Verbgebrauch in `note` |
| 42 | recognise | verb | `/ˈrekəɡnaɪz/` — Betonung vorn; `-ize` ebenfalls korrekt (`note`) |
| 43 | reluctant | adj | `/rɪˈlʌktənt/` |
| 44 | resource | noun | Cambridge-Variante ist maßgeblich; GB/US weichen ab |
| 45 | significant | adj | Betonung auf 2 |
| 46 | similar | adj | `/ˈsɪmɪlə/` — drei Silben, Betonung vorn |
| 47 | sufficient | adj | `/səˈfɪʃnt/` |
| 48 | suspicious | adj | `/səˈspɪʃəs/` |
| 49 | thorough | adj | `/ˈθʌrə/` — `th` + stummes Ende |
| 50 | vulnerable | adj | `/ˈvʌlnərəbl/` |

**Level-Themen:** Level 1 ist bewusst kein Thema, sondern das **Grundlagen-Level**
(hochfrequenter B2-Kernwortschatz). Ab Level 2 wird thematisch gegliedert:
2 Arbeit & Beruf · 3 Bildung & Lernen · 4 Gefühle & Persönlichkeit ·
5 Gesellschaft & Politik · 6 Umwelt & Natur · 7 Technologie & Medien ·
8 Gesundheit & Körper · 9 Reisen & Kultur · 10 Wirtschaft & Geld

## 11. Umsetzung in Meilensteinen

Größenangaben sind **relativ** (S/M/L), keine Zeitzusagen — sie dienen dazu, den
Zuschnitt des MVP verhandelbar zu machen.

| # | Meilenstein | Größe | Inhalt | Fertig, wenn |
|---|---|---|---|---|
| M0 | Gerüst | S | Vite + TS + React, Vitest, Ordnerstruktur, CSS-Tokens | `npm run dev` und `npm test` laufen |
| M1 | Domain-Kern | M | `types.ts`, `leitner.ts`, `scheduler.ts`, `dates.ts` + Unit-Tests | Fachlogik, Wiederholungsdeckel und Session-Auswahl vollständig getestet, kein UI-Bezug |
| M2 | Wortdaten ⟂ | **L** | 50 Wörter Level 1 gegen Cambridge kuratiert, Loader + Schema-Validierung | Validierungstest grün, 50 eindeutige IDs, **IPA gegen Cambridge geprüft** — offen, siehe `planning/M2-IPA-VERIFICATION.md` |
| M3 | Sprachausgabe | M | `tts.ts` mit Stimmenwahl, Tempo, `localService`, Fallback-Hinweis | Wort & Satz hörbar, Verhalten ohne EN-Stimme und offline sauber |
| M4 | Karten-Flow | **L** | `Flashcard` mit **beiden Richtungen**, `PronunciationPanel`, `RatingBar`, `SessionSetup`, Session-Screen | Eine Session in beiden Richtungen durchspielbar |
| M5 | Persistenz | M | Zustand-Stores, localStorage, Schema-Version, Tagesbeginn 04:00 | Fortschritt überlebt Reload und Browser-Neustart |
| M6 | Rahmen-Screens | M | Home (inkl. „nichts fällig"), Zusammenfassung, Statistik, Einstellungen, **Export/Import** | Alle Screens erreichbar und funktional |
| M7 | PWA & Feinschliff | M | Service Worker, Manifest, Icons, Tastatur, A11y, README | Installierbar, offline nutzbar, Tastatursteuerung vollständig |

**⟂ M2 läuft parallel zu M1.** Die Wortkuration ist der kritische Pfad des MVP —
50 × (IPA, phonetische Silben, Betonung, Beispielsatz, Übersetzung, Notiz) — und
technisch blockiert sie nichts. Fehler darin sind besonders teuer, weil die App
dann eine *falsche Aussprache als Ziel* vorsetzt. Sie kann sofort beginnen.

Nach M7 ist das MVP fertig und benutzbar. **M8 (später, nach Freigabe):** Level
2–10 befüllen und die Freischaltregel scharf stellen. Die ursprünglich
angedachte Schwelle „80 % von Level N in Fach ≥ 4" ist vor M8 zu prüfen: Der
schnellste Weg in Fach 4 dauert bei den Intervallen 0/1/3 mindestens vier Tage,
für 40 von 50 Wörtern realistisch zwei bis drei Wochen. So lange gar nichts
freizuschalten dürfte demotivieren — mildere Variante: Level N+1 öffnet, wenn
alle Wörter aus N mindestens einmal in Fach ≥ 2 standen.

## 12. Abnahmekriterien MVP

- [ ] 50 Wörter Level 1 vollständig kuratiert, IPA gegen Cambridge geprüft
- [ ] Schema-Validierung grün, inklusive Betonungs-Gegenprüfung IPA ↔ `stressIndex`
- [ ] Session in **beiden Richtungen** spielbar, DE → EN ist vorausgewählt
- [ ] Im Modus DE → EN verrät die Vorderseite die Antwort nicht (kein Ton, kein Wort)
- [ ] Wort und Beispielsatz sind hörbar, in normal und langsam
- [ ] Karte zeigt IPA, Silben und markierte Betonung
- [ ] Dreistufige Bewertung bewegt Karten korrekt durch die fünf Fächer
- [ ] Fälligkeiten stimmen nach den Intervallen 0/1/3/7/16 Tage, „gefestigt" nach 30
- [ ] Eine Session terminiert auch dann, wenn eine Karte wiederholt „Nochmal" bekommt
- [ ] Zustand „nichts fällig" zeigt nächste Fälligkeit und freien Übungsdurchlauf
- [ ] Fehlt eine englische Stimme, sagt die App das sichtbar und bleibt bedienbar
- [ ] Fortschritt überlebt Reload; Export/Import funktioniert; „Zurücksetzen" fragt nach
- [ ] Session mit 20 Karten auf dem Handy vollständig per Daumen bedienbar
- [ ] App ist installierbar; **Kartenlernen, IPA und Fortschritt funktionieren offline vollständig, Sprachausgabe offline nur mit lokal installierter Stimme**
- [ ] Domain-Logik hat Unit-Tests; `npm test` ist grün
- [ ] Level 2–10 sind sichtbar als gesperrt, ohne Fehler beim Antippen

## 13. Risiken & Gegenmaßnahmen

### 13.1 Offenes Risiko: Selbstbewertung bei Aussprache

**Dies ist das größte inhaltliche Risiko des MVP, und es ist bewusst nicht
gelöst.**

Das Leitner-System steuert die gesamte Wiederholrhythmik aus der Eingabe
„Sicher / Unsicher / Nochmal". Bei einer Bedeutungsabfrage ist das solide. Bei
Aussprache nicht: Der klassische Befund des Zweitspracherwerbs ist, dass
Lernende ihre eigenen Fehler in der Zielsprache nicht hören — deshalb bleiben sie
bestehen. Wer `thorough` mit deutschem /s/ spricht, hört den Unterschied zur
TTS-Ausgabe oft nicht und drückt guten Gewissens „Sicher". Die App terminiert
dann ausgerechnet die Wörter seltener, die am meisten Übung bräuchten. Das ist
eine systematische Verzerrung in die falsche Richtung, keine zufällige
Ungenauigkeit.

Im MVP wird das nur **gemildert**, nicht behoben:
- die Bewertungsfrage ist konkret und nachprüfbar formuliert (§8)
- das Aussprache-Panel steht direkt über den Bewertungsknöpfen, nicht daneben

Die eigentliche Gegenmaßnahme — sich aufnehmen und direkt hinter der TTS-Ausgabe
anhören — ist bewusst auf v2 verschoben (§14). Wer die eigene Aufnahme
*zurückgespielt* hört, nimmt Fehler wahr, die beim Sprechen selbst unhörbar
bleiben. Sollte sich im Gebrauch zeigen, dass Wörter „durchrutschen", ist das
der erste Hebel.

### 13.2 Technische Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Gute EN-Stimmen sind netzgebunden → offline schweigt das Kernfeature | `localService` auswerten, lokale Stimme bevorzugen, Verfügbarkeit anzeigen, Abnahmekriterium ehrlich formuliert (§12) |
| Web Speech API liefert je nach Gerät andere/keine EN-Stimme | Fallback-Kette, sichtbarer Hinweis, IPA trägt die Karte notfalls allein |
| iOS Safari spielt Sprachausgabe nur nach Nutzergeste ab | Autoplay wird durch den Tap auf „Session starten" freigeschaltet, Knopfbedienung bleibt |
| IPA-Zeichen werden nicht sauber gerendert | Systemschrift-Stack mit IPA-Abdeckung, Darstellung auf Zielgeräten prüfen |
| Zeitzonen/Datumsgrenzen verschieben Fälligkeiten | Alle Daten als lokales `YYYY-MM-DD`, Tagesbeginn 04:00, zentral in `dates.ts`, unit-getestet |
| Handkuratierte IPA enthält Fehler | Cambridge als verbindliche Quelle, automatische Betonungs-Gegenprüfung in der Validierung, Wortliste (§10) vorab abgenommen |
| DE → EN ist mehrdeutig (mehrere EN-Wörter passen auf eine Übersetzung) | Lückensatz auf der Vorderseite macht die Frage eindeutig; `translation` wird bei der Kuration spezifisch genug gehalten |
| Fach 1 läuft über, Sessions werden zäh | Deckel von 10 neuen Wörtern pro Tag, höchstens 2 Wiederholungen pro Karte und Session |
| Datenverlust beim Leeren der Browserdaten | Export/Import des Fortschritts als JSON, fest in M6 eingeplant |
| `persist` schreibt bei jeder Bewertung den vollen Fortschritt synchron | Bei 500 Wörtern rund 75 KB pro Schreibvorgang — bewusst akzeptiert, bei spürbarem Ruckeln auf gedrosseltes Schreiben umstellen |

## 14. Spätere Ausbaustufen (nicht im MVP)

- **Aufnehmen & Vergleichen (MediaRecorder)** — stärkster Kandidat, direkte Gegenmaßnahme zu §13.1: eigene Aufnahme unmittelbar hinter der TTS-Ausgabe anhören. Browser-nativ, kein Backend, kein Netz.
- Level 2–10 samt Themen und Freischaltlogik
- Getrennte Leitner-Pfade je Abfragerichtung, falls sich die Vermischung als störend erweist
- Mikrofon-Assist: Web Speech Recognition als **optionaler** Hinweisgeber, niemals als alleiniger Bewerter
- Sync des Fortschritts über Geräte hinweg
- „Nur Problemwörter"-Modus (alles, was mehrfach zurückgefallen ist)
- Minimalpaare-Übung (ship/sheep, thin/tin) als eigener Aussprache-Drill
