# CLAUDE.md

Arbeitsanweisungen für Claude Code in diesem Repository.

## Projekt

**englishLs** — Lernkarteikarten-App für Englisch auf B2-Niveau. Der Fokus liegt
auf **Aussprache**; der Wiederholungsmotor ist ein **Leitner-System** mit fünf
Fächern. Ziel im Vollausbau: 10 Level à 50 Wörter. **Aktueller Umfang: MVP mit
Level 1 (50 Wörter).**

Der maßgebliche Plan steht in `planning/PLAN.md`. Bei Widersprüchen zwischen
diesem Dokument und dem Plan gilt der Plan — und sag Bescheid, damit wir es
angleichen.

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
   rufen `speechSynthesis` niemals direkt auf.
4. **Wort-IDs sind unveränderlich.** Der Lernfortschritt referenziert sie. Eine
   ID zu ändern bedeutet, den Fortschritt für dieses Wort zu löschen.
5. **Datumsarithmetik nur über `src/domain/dates.ts`**, immer auf lokale
   Tagesgrenze als `YYYY-MM-DD` normalisiert, nie über rohe UTC-Timestamps.
6. **Persistierte Struktur nur mit `schemaVersion`-Erhöhung + Migration ändern.**
   Der Fortschritt des Nutzers liegt ausschließlich lokal und darf nicht
   stillschweigend kaputtgehen.

## Leitner-Regeln (verbindlich)

Fächer 1–5, Wiederholintervalle in Tagen: **1 → 0 · 2 → 1 · 3 → 3 · 4 → 7 ·
5 → 16** (nach Fach 5 dauerhaft 30 = „gefestigt").

Bewertung ist dreistufig:

| Eingabe | Fach | Nächste Fälligkeit |
|---|---|---|
| Nochmal | zurück auf 1 | heute (erneut in derselben Session) |
| Unsicher | unverändert | morgen |
| Sicher | + 1 (max. 5) | nach Fach-Intervall |

Session: 20 Karten Standard, höchstens 10 neue Wörter pro Tag; fällige Karten
zuerst (niedriges Fach vor hohem), dann mit neuen auffüllen.

## Wortdaten

Ein JSON pro Level unter `src/data/levels/level-NN.json`. Pflichtfelder pro Wort:
`id`, `level`, `term`, `pos`, `ipaGb`, `syllables`, `stressIndex`, `translation`,
`example`, `exampleDe`. Optional: `ipaUs`, `note`.

Beim Ergänzen von Wörtern:
- IPA gegen ein Wörterbuch gegenprüfen (Standard: **British English**), nicht aus dem Gedächtnis schreiben
- `stressIndex` ist 0-basiert und muss innerhalb von `syllables` liegen
- Beispielsätze auf B2-Niveau, ein Satz, mit dem Zielwort im natürlichen Kontext
- `note` für Aussprachefallen und False Friends aus deutscher Perspektive nutzen
- IDs fortlaufend und lückenlos: `l01-w001` … `l01-w050`

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
- Kein Autoplay von Sprachausgabe — immer knopfgebunden (iOS Safari verlangt das, und es ist auch respektvoller)

## Ausdrücklich außerhalb des Umfangs

Backend, Accounts, Cloud-Sync, Mikrofon-Spracherkennung, Level 2–10, Gamification
über Streak und Fortschritt hinaus, Grammatik- oder Schreibübungen. Wenn etwas
davon sinnvoll erscheint: vorschlagen, nicht einfach bauen.

## Git

Entwicklung läuft auf `claude/english-b2-flashcard-app-8a9a1d`.
Commit-Nachrichten auf Englisch, im Imperativ (`add leitner scheduling`).
Pull Requests nur auf ausdrückliche Aufforderung.
