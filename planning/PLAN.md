# PLAN.md — englishLs

**Lernkarteikarten-App für Englisch B2 — Fokus Aussprache, Motor: Leitner-System**

Status: **Planungsphase.** Es existiert noch kein Code. Dieses Dokument ist die
Grundlage für die Umsetzung des MVP (Level 1, 50 Wörter).

---

## 1. Produktidee in einem Absatz

Eine lokale, installierbare Web-App (PWA), in der man B2-Vokabeln nicht nur
liest, sondern **laut ausspricht**. Jede Karte liefert Hörbeispiel (TTS),
IPA-Lautschrift, Silbentrennung mit markierter Betonung, deutsche Bedeutung und
einen Beispielsatz. Wiederholt wird nach dem **Leitner-System** (5 Fächer): Was
sitzt, wandert nach hinten und kommt seltener; was hakt, fällt zurück auf Fach 1.
Der volle Ausbau sind 10 Level à 50 Wörter (500 Wörter); das MVP liefert **Level 1
vollständig** und die Level-Architektur so, dass 2–10 reines Datenhinzufügen sind.

## 2. Getroffene Entscheidungen

| Thema | Entscheidung | Begründung |
|---|---|---|
| Plattform | Web-App / PWA, React + Vite + TypeScript | Läuft auf Desktop & Handy, installierbar, offline, kein Store-Deployment |
| Backend | **Keins.** Alles lokal (localStorage) | MVP braucht keine Accounts; spart die gesamte Server-Komplexität |
| Aussprache-Prüfung | Hören + **Selbstbewertung**, IPA sichtbar | Funktioniert in jedem Browser zuverlässig; Spracherkennung ist bei Nicht-Muttersprachlern zu ungenau für eine Bewertung, die den Lernfortschritt steuert |
| Kartendaten | Wort, IPA, Wortart, DE-Übersetzung, Beispielsatz (+ Silben/Betonung) | B2-tauglich und für 50 Wörter handkuratierbar in guter Qualität |
| Sprachniveau UI | Deutsch | Muttersprache des Nutzers |
| Aussprachevariante | **British English (en-GB)** als Standard, US umschaltbar | Eine Variante muss führen, sonst ist die IPA inkonsistent |

## 3. Nicht-Ziele (bewusst außerhalb des MVP)

- Kein Backend, keine Accounts, kein Cloud-Sync, keine Mehrgeräte-Synchronisation
- Keine automatische Spracherkennung per Mikrofon (Kandidat für v2, siehe §11)
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
| Routing | Eigener schlanker View-State (5 Screens brauchen keinen Router) |
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
  pos: Pos;
  ipaGb: string;         // "əkˈnɒlɪdʒ"
  ipaUs?: string;        // "əkˈnɑːlɪdʒ" (nur wenn abweichend)
  syllables: string[];   // ["ac", "know", "ledge"]
  stressIndex: number;   // 1 → zweite Silbe ist betont (0-basiert)
  translation: string;   // "anerkennen, einräumen"
  example: string;       // "She refused to acknowledge her mistake."
  exampleDe: string;     // "Sie weigerte sich, ihren Fehler einzuräumen."
  note?: string;         // Aussprachefalle: "Das 'ck' ist stumm-ähnlich…", False Friend
}
```

Ablage: `src/data/levels/level-01.json` … `level-10.json`, ein Array pro Datei.
Beim Start wird jede Datei gegen ein Schema validiert (Laufzeit-Check in Dev,
Unit-Test in CI): eindeutige IDs, alle Pflichtfelder gesetzt, `stressIndex` liegt
innerhalb von `syllables`, IPA nicht leer.

### 5.2 Lernfortschritt (dynamisch, im localStorage)

```ts
interface CardState {
  wordId: string;
  box: 1 | 2 | 3 | 4 | 5;
  dueOn: string;          // "2026-08-15", lokale Tagesgrenze
  lastReviewedAt: string | null;  // ISO-Timestamp
  correctStreak: number;
  totalCorrect: number;
  totalWrong: number;
}

interface ProgressState {
  schemaVersion: 1;       // für spätere Migrationen
  cards: Record<string, CardState>;
  unlockedLevels: number[];
  streak: { current: number; longest: number; lastSessionDay: string | null };
  history: { day: string; reviewed: number; correct: number }[];  // für Statistik
}
```

Neue Wörter werden **lazy** angelegt: Ein Wort ohne `CardState` gilt als „noch nie
gesehen" und wird von der Session als neue Karte in Fach 1 eingeführt. Das macht
das Hinzufügen von Level 2–10 später zu einem reinen Daten-Commit ohne Migration.

## 6. Leitner-System (Kern der App)

Fünf Fächer. Die Intervalle sind die einzige Stelle, an der die Wiederholrhythmik
definiert ist — reine Funktionen in `src/domain/leitner.ts`, ohne React, ohne
Storage, vollständig unit-getestet.

| Fach | Intervall bis zur nächsten Wiederholung |
|---|---|
| 1 | gleicher Tag (erneut in derselben Session) |
| 2 | 1 Tag |
| 3 | 3 Tage |
| 4 | 7 Tage |
| 5 | 16 Tage (danach dauerhaft 30 Tage = „gefestigt") |

### Bewertung — drei Stufen

Klassisches Leitner kennt nur richtig/falsch. Für Aussprache ist das zu grob,
darum drei Knöpfe:

| Eingabe | Wirkung | Fälligkeit |
|---|---|---|
| **Nochmal** (falsch) | zurück auf Fach 1, `correctStreak = 0` | heute |
| **Unsicher** | Fach bleibt | morgen |
| **Sicher** | Fach + 1 (max. 5), `correctStreak + 1` | nach Fach-Intervall |

### Session-Auswahl (`src/domain/scheduler.ts`)

1. Alle fälligen Karten sammeln (`dueOn <= heute`) aus freigeschalteten Leveln
2. Sortieren: niedriges Fach zuerst, danach nach ältester Fälligkeit
3. Mit neuen Wörtern auffüllen, bis das Sessionziel erreicht ist (Standard 20 Karten, einstellbar 10/20/30/„alle fälligen"); höchstens 10 **neue** Wörter pro Tag, damit Fach 1 nicht überläuft
4. Karten, die in der Session „Nochmal" bekommen, werden ans Ende der Warteschlange gehängt und in derselben Session erneut abgefragt

Zeitrechnung durchgängig auf **lokale Tagesgrenze** normalisiert (`YYYY-MM-DD`),
nie auf UTC-Timestamps — sonst springt die Fälligkeit je nach Uhrzeit.

## 7. Aussprache-Layer

`src/speech/tts.ts` kapselt die Web Speech API vollständig; kein Komponentencode
fasst `speechSynthesis` direkt an.

- Stimmenwahl: bevorzugt `en-GB`, Fallback `en-US`, Fallback beliebige `en-*`
- Stimmen laden asynchron → auf `voiceschanged` warten, Ergebnis cachen
- Zwei Geschwindigkeiten pro Karte: **normal** (`rate 1.0`) und **langsam** (`rate 0.6`) zum Nachsprechen von Silben
- Abspielbar: das Wort **und** der Beispielsatz getrennt
- Fehlt jede englische Stimme (kommt auf manchen Linux-Systemen vor): sichtbarer Hinweis statt stiller Nicht-Funktion; IPA und Betonung tragen die Karte dann allein

**Aussprache-Panel** (das visuelle Herzstück der Rückseite):
Silben einzeln dargestellt, die betonte Silbe optisch hervorgehoben und mit
`ˈ`-Markierung, darunter die IPA in großer Schrift, darunter die
Aussprache-Notiz, falls vorhanden (typische Fallen für Deutschsprachige,
False Friends).

## 8. Screens & Interaktion

1. **Home** — „Heute fällig: N", Streak, Level-Raster (10 Kacheln; 2–10 im MVP als „bald" gesperrt), Fortschrittsbalken Level 1, Startknopf
2. **Session** — der Karten-Flow (siehe unten)
3. **Zusammenfassung** — bearbeitete Karten, Trefferquote, Fachbewegungen, nächste Fälligkeit
4. **Statistik** — Verteilung über die fünf Fächer, gefestigte Wörter, Verlauf der letzten 14 Tage
5. **Einstellungen** — Stimme (GB/US), Sprechtempo, Sessiongröße, „IPA sofort zeigen", Fortschritt zurücksetzen (mit Rückfrage)

### Karten-Flow

```
Vorderseite:  Wort groß · Wortart · [🔊 Anhören] [🐢 Langsam]
              ↓ (Nutzer spricht laut nach)
              [Auflösen]
Rückseite:    Wort · IPA groß · Silben mit Betonung · Notiz
              DE-Übersetzung · Beispielsatz [🔊] · DE-Satz
              [Nochmal]  [Unsicher]  [Sicher]
```

Tastatur: `Leertaste` = anhören, `Enter` = auflösen, `1/2/3` = bewerten,
`Esc` = Session verlassen (Fortschritt der bewerteten Karten bleibt erhalten).
Barrierefreiheit: Fokusreihenfolge sauber, Buttons beschriftet, Kontrast AA,
`prefers-reduced-motion` respektiert.

## 9. Projektstruktur

```
englishLs/
├── CLAUDE.md
├── planning/PLAN.md
├── index.html
├── package.json · vite.config.ts · tsconfig.json
├── public/            manifest.webmanifest, Icons
└── src/
    ├── main.tsx · App.tsx
    ├── domain/        types.ts · leitner.ts · scheduler.ts · dates.ts (+ *.test.ts)
    ├── data/          words.ts (Loader + Validierung) · levels/level-01.json
    ├── store/         progressStore.ts · settingsStore.ts
    ├── speech/        tts.ts
    ├── components/    Flashcard · PronunciationPanel · RatingBar · LevelGrid · BoxChart
    ├── screens/       Home · Session · Summary · Stats · Settings
    └── styles/        tokens.css · app.css
```

Architekturregel: `domain/` ist frei von React, Browser-APIs und Storage — reine
Funktionen, direkt testbar. Alles Unreine (Zeit, Zufall, Sprachausgabe,
Persistenz) wird von außen hineingereicht.

## 10. Wortliste Level 1 (50 Wörter) — zur Abnahme

**Auswahlkriterien:** hochfrequenter B2-Kernwortschatz, und jedes Wort trägt
zusätzlich einen Aussprachewert — verschobene Betonung, Schwa-Reduktion, stumme
Silben, `th`, oder ein klassischer False Friend für Deutschsprachige.

| # | Wort | Wortart | Aussprache-/Lernfalle |
|---|---|---|---|
| 1 | acknowledge | verb | Betonung auf Silbe 2, `/əkˈnɒlɪdʒ/` |
| 2 | adequate | adj | Schwa-Endung `/ˈædɪkwət/`, nicht „-eit" |
| 3 | ambiguous | adj | 4 Silben, Betonung auf 2 |
| 4 | anxiety | noun | `/æŋˈzaɪəti/` — kein „ks" |
| 5 | appreciate | verb | `/əˈpriːʃieɪt/` |
| 6 | appropriate | adj | Adjektiv `/-ət/` vs. Verb `/-eɪt/` |
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
| 21 | deliberate | adj | Adjektiv vs. Verb unterschiedlich |
| 22 | determine | verb | `/dɪˈtɜːmɪn/` — Endung nicht „-ain" |
| 23 | efficient | adj | `/ɪˈfɪʃnt/` |
| 24 | emphasise | verb | `/ˈemfəsaɪz/` — Betonung vorn |
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
| 41 | purchase | noun/verb | `/ˈpɜːtʃəs/` — Endung nicht „-eɪs" |
| 42 | recognise | verb | `/ˈrekəɡnaɪz/` — Betonung vorn |
| 43 | reluctant | adj | `/rɪˈlʌktənt/` |
| 44 | resource | noun | `/rɪˈzɔːs/` GB vs. `/ˈriːsɔːrs/` US |
| 45 | significant | adj | Betonung auf 2 |
| 46 | similar | adj | `/ˈsɪmɪlə/` — drei Silben, Betonung vorn |
| 47 | sufficient | adj | `/səˈfɪʃnt/` |
| 48 | suspicious | adj | `/səˈspɪʃəs/` |
| 49 | thorough | adj | `/ˈθʌrə/` — `th` + stummes Ende |
| 50 | vulnerable | adj | `/ˈvʌlnərəbl/` |

**Themenvorschlag für die späteren Level** (damit Level 1 nicht willkürlich wirkt):
1 B2-Kernwortschatz · 2 Arbeit & Beruf · 3 Bildung & Lernen · 4 Gefühle &
Persönlichkeit · 5 Gesellschaft & Politik · 6 Umwelt & Natur · 7 Technologie &
Medien · 8 Gesundheit & Körper · 9 Reisen & Kultur · 10 Wirtschaft & Geld

## 11. Umsetzung in Meilensteinen

| # | Meilenstein | Inhalt | Fertig, wenn |
|---|---|---|---|
| M0 | Gerüst | Vite + TS + React, Vitest, Ordnerstruktur, CSS-Tokens | `npm run dev` und `npm test` laufen |
| M1 | Domain-Kern | `types.ts`, `leitner.ts`, `scheduler.ts`, `dates.ts` + Unit-Tests | Fachlogik & Session-Auswahl vollständig getestet, kein UI-Bezug |
| M2 | Wortdaten | 50 Wörter Level 1 als JSON, Loader + Schema-Validierung | Validierungstest grün, 50 eindeutige IDs |
| M3 | Sprachausgabe | `tts.ts` mit Stimmenwahl, Tempo, Fallback-Hinweis | Wort & Satz hörbar, Verhalten ohne EN-Stimme sauber |
| M4 | Karten-Flow | `Flashcard`, `PronunciationPanel`, `RatingBar`, Session-Screen | Eine Session von Anfang bis Ende durchspielbar |
| M5 | Persistenz | Zustand-Stores, localStorage, Schema-Version | Fortschritt überlebt Reload und Browser-Neustart |
| M6 | Rahmen-Screens | Home, Zusammenfassung, Statistik, Einstellungen | Alle fünf Screens erreichbar und funktional |
| M7 | PWA & Feinschliff | Service Worker, Manifest, Icons, Tastatur, A11y, README | Installierbar, offline nutzbar, Tastatursteuerung vollständig |

Nach M7 ist das MVP fertig und benutzbar. **M8 (später, nach Freigabe):** Level
2–10 befüllen, Freischalt-Regel scharf stellen (Level N+1 öffnet, wenn 80 % von
Level N in Fach ≥ 4 stehen).

## 12. Abnahmekriterien MVP

- [ ] 50 Wörter Level 1 vollständig und fehlerfrei kuratiert (IPA, Betonung, Beispielsatz)
- [ ] Wort und Beispielsatz sind hörbar, in normal und langsam
- [ ] Karte zeigt IPA, Silben und markierte Betonung
- [ ] Dreistufige Bewertung bewegt Karten korrekt durch die fünf Fächer
- [ ] Fälligkeiten stimmen nach den Intervallen 0/1/3/7/16 Tage
- [ ] Fortschritt überlebt Reload; „Zurücksetzen" fragt nach
- [ ] Session mit 20 Karten auf dem Handy vollständig per Daumen bedienbar
- [ ] App ist installierbar und funktioniert offline
- [ ] Domain-Logik hat Unit-Tests; `npm test` ist grün
- [ ] Level 2–10 sind sichtbar als gesperrt, ohne Fehler beim Antippen

## 13. Risiken & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Web Speech API liefert je nach Gerät andere/keine EN-Stimme (v. a. Linux, ältere Android) | Stimmenwahl mit Fallback-Kette, sichtbarer Hinweis, IPA trägt die Karte notfalls allein |
| iOS Safari spielt Sprachausgabe nur nach direkter Nutzerinteraktion ab | Kein Autoplay beim Kartenwechsel; Abspielen immer knopfgebunden |
| IPA-Zeichen werden nicht sauber gerendert | Systemschrift-Stack mit IPA-Abdeckung, Darstellung auf Zielgeräten prüfen |
| Zeitzonen/Datumsgrenzen verschieben Fälligkeiten | Alle Daten als lokales `YYYY-MM-DD`, zentral in `dates.ts`, unit-getestet |
| Handkuratierte IPA enthält Fehler | Wortliste (§10) vor Umsetzung abnehmen; Aussprachen gegen Wörterbuch gegenprüfen |
| Fach 1 läuft über, Sessions werden zäh | Deckel von 10 neuen Wörtern pro Tag |
| Datenverlust beim Leeren der Browserdaten | Export/Import des Fortschritts als JSON — kleiner Zusatz, eingeplant in M6 |

## 14. Spätere Ausbaustufen (nicht im MVP)

- Mikrofon-Assist: Web Speech Recognition als **optionaler** Hinweisgeber, niemals als alleiniger Bewerter
- Level 2–10 samt Themen und Freischaltlogik
- Export/Import bzw. Sync des Fortschritts über Geräte hinweg
- „Nur Problemwörter"-Modus (alles, was mehrfach zurückgefallen ist)
- Minimalpaare-Übung (ship/sheep, thin/tin) als eigener Aussprache-Drill
