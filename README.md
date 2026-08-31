# englishLs

Lernkarteikarten-App für Englisch auf B2-Niveau. Der Fokus liegt auf der
**Aussprache**; wiederholt wird nach dem **Leitner-System** mit fünf Fächern.

**Live:** [english-ls-topaz.vercel.app](https://english-ls-topaz.vercel.app)

## Was drin ist

- **500 Wörter** in 10 thematischen Leveln à 50 Einträgen, mit IPA,
  Silbentrennung, Betonung, deutscher Übersetzung, B2-Beispielsatz und
  Aussprachenotizen
- **Zwei Abfragerichtungen:** DE → EN (produktiv, Standard) mit Lückensatz, und
  EN → DE (rezeptiv)
- **Sprachausgabe** über die Web Speech API, mit Normal- und Langsam-Tempo
- **Ausspracheprüfung** per Mikrofon gegen Azure Pronunciation Assessment —
  optional, nur mit hinterlegtem Schlüssel. Der Knopf steht auf der *Vorderseite*:
  die Aufnahme deckt die Karte auf, das Ergebnis erscheint danach
- **Installierbar als App** und offline nutzbar; alle 500 Wörter liegen nach dem
  ersten Besuch auf dem Gerät
- **Statistik** über Fächerverteilung, Streak und die letzten Lerntage
- **Export/Import** des Fortschritts als JSON — der Fortschritt liegt nur lokal

## Stand

| Meilenstein | Status |
|---|---|
| M0 Gerüst | fertig |
| M1 Domain-Kern | fertig |
| M2 Wortdaten | Daten und Validierung fertig, **IPA-Prüfung offen** |
| M3 Sprachausgabe | fertig |
| M4 Karten-Flow | fertig |
| M4b Ausspracheprüfung | fertig |
| M5 Persistenz | fertig |
| M6 Rahmen-Screens | fertig |
| M7 PWA | fertig — installierbar, offline nutzbar |

> **Wichtige Einschränkung:** Keine der 500 Lautschriften ist gegen das Cambridge
> Dictionary geprüft. Sie stammen aus Modellwissen, weil in der
> Entwicklungsumgebung keine Wörterbuchquelle erreichbar war. Die Validierung
> prüft innere Konsistenz, nicht Richtigkeit. Nachgehalten in
> [`planning/IPA-VERIFICATION.md`](planning/IPA-VERIFICATION.md).

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm run test:run   # Tests einmalig
npm run typecheck  # tsc --noEmit
npm run build      # Produktionsbuild
```

Vor jedem Commit müssen `test:run` und `typecheck` grün sein.

### Ausspracheprüfung einrichten (optional)

```bash
cp .env.example .env
```

Schlüssel und Region einer Azure-Speech-Ressource eintragen. Ohne Schlüssel
verschwindet der Mikrofon-Knopf und das SDK fällt aus dem Build — die App
funktioniert ansonsten vollständig.

> Vite backt `VITE_*`-Variablen in das Bundle. Der Schlüssel ist in einem
> veröffentlichten Build **nicht geheim**. Das ist nur vertretbar, solange die
> Azure-Ressource im Gratistarif F0 läuft, der nicht abrechnen kann. Vor einem
> Wechsel auf S0 den Schlüssel neu generieren.

## Arbeitsweise

`main` ist immer deploybar und wird nach Vercel ausgeliefert. Neue Arbeit
entsteht auf einem eigenen Branch pro Meilenstein, bekommt dort eine
Preview-URL, und wird erst nach Prüfung nach `main` gemergt.

## Dokumente

- [`planning/PLAN.md`](planning/PLAN.md) — der maßgebliche Plan
- [`planning/REVIEW.md`](planning/REVIEW.md) — kritische Durchsicht des Plans samt Erledigungsstand
- [`planning/IPA-VERIFICATION.md`](planning/IPA-VERIFICATION.md) — offene Prüfliste aller 500 Lautschriften
- [`CLAUDE.md`](CLAUDE.md) — Arbeitsanweisungen und verbindliche Regeln
