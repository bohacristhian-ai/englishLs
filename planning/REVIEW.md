# REVIEW.md — Kritische Durchsicht von `planning/PLAN.md`

Gegenstand: `planning/PLAN.md`, Stand des ersten Entwurfs.
Datum: 2026-08-15. Es existiert noch kein Code — das ist ein Dokumenten-Review.

**Vorbemerkung zur Belastbarkeit:** Ich habe diesen Plan selbst geschrieben. Ein
Selbstreview findet zuverlässig Inkonsistenzen und Lücken, aber es ist blind für
falsche Grundannahmen, die schon beim Schreiben drinsteckten. Die Befunde unten
sind konkret und nachprüfbar; die Frage „ist der Produktansatz überhaupt richtig"
kann ein Selbstreview nicht seriös beantworten. Befund **#2** kommt dem am
nächsten und ist der wichtigste Punkt dieses Dokuments.

**Ergebnis in einem Satz:** Die technische Architektur trägt, aber zwei Befunde
(**#1 Offline-Versprechen**, **#2 Selbstbewertung bei Aussprache**) treffen das
Kernversprechen der App und sollten vor M0 entschieden werden; vier weitere
(**#3–#6**) sind echte Logikfehler, die sonst erst beim Bauen auffallen.

---

## Was der Plan gut macht

Damit die Kritik einzuordnen ist — diese Entscheidungen halte ich nach der
Durchsicht weiterhin für richtig:

- **Reine Domain-Schicht.** `domain/` ohne React, ohne Storage, ohne `new Date()` im Inneren ist die Entscheidung, die das Projekt langfristig testbar hält.
- **Lazy angelegte `CardState`.** Ein Wort ohne Fortschrittseintrag gilt als „nie gesehen". Dadurch sind Level 2–10 tatsächlich ein reiner Daten-Commit ohne Migration — genau das, was für die Skalierung nötig ist.
- **Unveränderliche Wort-IDs** als explizite Regel, statt es später schmerzhaft zu lernen.
- **Lokale Tagesgrenze statt UTC**, zentralisiert in `dates.ts`.
- **Abhängigkeits-Disziplin.** Kein Router und kein UI-Kit bei fünf Screens ist die richtige Größenordnung.

---

## Schwerwiegend — vor M0 entscheiden

### #1 Das Offline-Versprechen kollidiert mit der Sprachausgabe

§12 fordert als Abnahmekriterium „App ist installierbar und **funktioniert
offline**". §7 baut die Aussprache auf `speechSynthesis`. Beides zusammen geht
auf vielen Geräten nicht auf: Ein erheblicher Teil der guten englischen Stimmen
ist **netzgebunden** (Chrome/Android liefert Google-Stimmen serverseitig,
erkennbar an `voice.localService === false`). Offline lädt die App dann zwar,
aber genau das Feature, um das es geht, schweigt — und zwar bevorzugt auf den
Geräten mit der besten Stimmqualität.

Das ist kein Randfall, sondern ein Widerspruch im Abnahmekriterium selbst.

**Empfehlung:**
- `tts.ts` erfasst `localService` und bevorzugt bei fehlender Netzverbindung eine lokale Stimme, auch wenn sie schlechter klingt.
- Die App zeigt einmalig an, ob eine lokale englische Stimme vorhanden ist („Offline-Aussprache: verfügbar / nicht verfügbar").
- §12 umformulieren zu: „App ist installierbar; Kartenlernen, IPA und Fortschritt funktionieren offline vollständig, Sprachausgabe offline nur mit lokal installierter Stimme."

Ein ehrliches Kriterium ist besser als ein gebrochenes.

### #2 Selbstbewertung ist bei *Aussprache* ein deutlich schwächeres Signal als bei Vokabelabfrage — der Plan behandelt beides gleich

Das Leitner-System steuert die gesamte Wiederholrhythmik aus der Nutzereingabe
„Sicher / Unsicher / Nochmal". Bei einer Bedeutungsabfrage ist das solide: Man
weiß ziemlich genau, ob man ein Wort übersetzen konnte.

Bei Aussprache gilt das gerade **nicht**. Der klassische Befund des
Zweitspracherwerbs ist, dass Lernende ihre eigenen Fehler in der Zielsprache
nicht hören — deshalb bleiben sie ja bestehen. Wer „thorough" mit deutschem
/s/ oder „colleague" mit Betonung hinten spricht, hört den Unterschied zur
TTS-Ausgabe oft schlicht nicht und drückt guten Gewissens „Sicher". Das
Ergebnis: Die App terminiert genau die Wörter seltener, die am meisten Übung
bräuchten. Das ist eine systematische Verzerrung in die falsche Richtung, keine
zufällige Ungenauigkeit.

§13 listet dieses Risiko **überhaupt nicht** — das Risiko-Kapitel ist rein
technisch und übersieht das größte inhaltliche Risiko des Produkts.

**Empfehlung (in dieser Reihenfolge):**

1. **Aufnehmen und Anhören (MediaRecorder) statt Spracherkennung.** Der Nutzer nimmt sich auf und hört sich direkt hinter der TTS-Ausgabe an. Die eigene Aufnahme *zurückgespielt* zu hören ist etwas völlig anderes, als sich beim Sprechen zuzuhören — Fehler werden hörbar. Das ist Browser-nativ, braucht kein Backend, kein Netz, keine Erkennungs-Engine und keine der Ungenauigkeiten, die uns die Web Speech Recognition ausgeschlossen haben. Die Aufnahme wird nicht gespeichert, nur bis zur nächsten Karte gehalten. Aufwand schätze ich auf einen halben Meilenstein — die Wirkung auf das Kernversprechen ist die höchste im ganzen Plan.
2. **Die Bewertungsfrage konkret stellen** statt „Wusstest du es?". Die Rückseite zeigt bereits Silben und Betonung — die Frage muss lauten: „Betonung auf der richtigen Silbe? Endung reduziert?" Eine überprüfbare Frage bewerten Menschen deutlich verlässlicher als ein Gefühl.
3. **Zwei Urteile trennen**, falls Punkt 1 zu teuer ist: Bedeutung gewusst (steuert Leitner) und Aussprache getroffen (steuert einen separaten Aussprache-Zähler). Aktuell vermischt ein einziger Knopf zwei verschiedene Kompetenzen.

Punkt 1 ist meine klare Empfehlung. Er passt exakt in die bestehenden
Randbedingungen und schließt die Lücke zwischen „Fokus liegt auf der Aussprache"
und dem, was der Plan tatsächlich misst.

---

## Echte Logikfehler — vor der Implementierung des jeweiligen Meilensteins zu klären

### #3 Die Session kann nie enden (M1/M4)

§6 Punkt 4: Karten mit „Nochmal" werden „ans Ende der Warteschlange gehängt und
in derselben Session erneut abgefragt". Es gibt **keine Obergrenze**. Ein Wort,
das der Nutzer nicht trifft, kann unbegrenzt oft zurückkehren; die Session
terminiert erst, wenn alles sitzt. Bei einem schwierigen Wort ist das eine
Endlosschleife, und ausgerechnet dem frustriertesten Nutzer nimmt die App das
Erfolgserlebnis des Sessionendes.

Zusätzlich ungeklärt: Zählt eine wiederholte Karte gegen das Sessionziel von 20?
Aus §6 nicht ableitbar — und die beiden Lesarten ergeben spürbar verschieden
lange Sessions.

**Empfehlung:** Höchstens **zwei** Wiederholungen pro Karte und Session; danach
bleibt die Karte in Fach 1 mit Fälligkeit morgen und die Session geht weiter.
Das Sessionziel zählt **präsentierte Karten**, Wiederholungen eingeschlossen, mit
hartem Deckel — dann ist eine „20er-Session" auch verlässlich 20 Karten lang.
Beides gehört als expliziter Satz in §6.

### #4 „Unsicher" verhält sich in Fach 5 widersinnig (M1)

§6 legt fest: „Unsicher" → Fach bleibt, fällig **morgen**. In Fach 5 heißt das:
Rhythmus 30 Tage → ein Tag → bei „Sicher" sofort wieder 30 Tage. Ein einziger
zögerlicher Klick wirft die Karte aus dem Langzeitrhythmus und holt sie am
nächsten Tag zurück, ohne dass sich am Fach etwas ändert. Das ist ein
Sonderfall-Sprung, keine Abstufung.

**Empfehlung:** „Unsicher" → **Fach − 1** (Minimum 1), Fälligkeit nach dem
Intervall des *neuen* Fachs. Damit ist die Bewertung durchgehend als
Fachbewegung definiert (−1 / 0… bzw. +1), die Sonderregel „morgen" entfällt
ersatzlos, und das Verhalten ist über alle fünf Fächer gleichförmig. Die
Fälligkeitsberechnung hängt dann ausschließlich am Fach — genau die
Vereinfachung, die die Domain-Schicht sauber hält.

### #5 `Pos` als Einzelwert kollidiert mit der eigenen Wortliste (M2)

§5.1 definiert `pos: Pos` als genau **einen** Wert. §10 führt aber auf:

- **#41 `purchase`** — dort ausdrücklich als „noun/verb" notiert. Passt nicht in das Feld.
- **#6 `appropriate`** und **#21 `deliberate`** — beide mit dem Hinweis, dass Adjektiv und Verb **unterschiedlich ausgesprochen** werden (`/-ət/` vs. `/-eɪt/`).

Bei den letzten beiden ist es gravierender als ein Typfehler: Ein Feld `ipaGb`
kann nur eine der beiden Aussprachen enthalten. Eine App, deren Kernversprechen
Aussprache ist, darf bei diesen Karten nicht offenlassen, welche Variante gerade
die richtige ist — sonst bewertet der Nutzer gegen ein Ziel, das die Karte nicht
eindeutig zeigt.

**Empfehlung:** Pro Karte genau eine Wortart festlegen und die IPA dazu passend
wählen. Bei `appropriate` und `deliberate` das Adjektiv nehmen (die häufigere
B2-Verwendung) und die Verbaussprache in `note` erwähnen. `purchase` als `noun`
führen. Die Schema-Validierung aus §5.1 prüft ohnehin schon Pflichtfelder — sie
sollte `pos` gegen die erlaubte Liste prüfen und den Fehler damit unmöglich
machen.

### #6 `stressIndex` und die IPA können sich widersprechen (M2)

Die Betonung steht **doppelt** im Datensatz: einmal als `stressIndex` über
`syllables`, einmal als `ˈ` innerhalb von `ipaGb`. Zwei Quellen für dieselbe
Information driften auseinander — bei 50 handkuratierten Einträgen ist das
keine theoretische Sorge, und §5.1 prüft nur, ob `stressIndex` *innerhalb* von
`syllables` liegt, nicht ob er mit der IPA übereinstimmt.

Dazu kommt: Die orthografische Silbentrennung ist teils willkürlich. Das
Kommentarbeispiel im Plan selbst — `["ac", "know", "ledge"]` für *acknowledge* —
ist fragwürdig; phonetisch liegt die Grenze eher bei `ac-knowl-edge`. Bei einer
Aussprache-App wandert diese Willkür direkt in die Anzeige.

**Empfehlung:** Silben **phonetisch** schneiden, nicht orthografisch, und in der
Validierung zwei zusätzliche Prüfungen ergänzen: `ipaGb` enthält genau ein
`ˈ`, und die Zahl der IPA-Silben stimmt mit `syllables.length` überein
(Vokalkerne zählen). Das fängt den Großteil der Kurationsfehler automatisch ab.

---

## Lücken und Ungenauigkeiten — mittlere Priorität

### #7 Der Zustand „nichts fällig" ist nirgends beschrieben

Ab Tag ~6 tritt regelmäßig der Fall ein, dass keine Karte fällig ist und alle 50
Wörter eingeführt sind. §8 beschreibt für Home nur „Heute fällig: N" und einen
Startknopf. Was der Knopf bei N = 0 tut, steht nirgends — und §12 enthält kein
Abnahmekriterium dafür. Erfahrungsgemäß ist das der Zustand, in dem
Lern-Apps aufgegeben werden.

**Empfehlung:** Expliziter Zustand mit dem Datum der nächsten Fälligkeit plus
einem optionalen freien Übungsdurchlauf, der den Leitner-Fortschritt **nicht**
verändert. Als Abnahmekriterium aufnehmen.

### #8 Widerspruch zwischen §13 und §11 zu Export/Import

§13 führt Export/Import des Fortschritts als Gegenmaßnahme gegen Datenverlust
und schreibt „eingeplant in M6". Die Meilensteintabelle in §11 nennt für M6
„Home, Zusammenfassung, Statistik, Einstellungen" — Export/Import taucht dort
nicht auf, und M5 (Persistenz) nennt es auch nicht. Damit fällt die einzige
Absicherung gegen Datenverlust bei der Umsetzung sehr wahrscheinlich hinten
runter.

**Empfehlung:** In §11 M6 ausdrücklich aufnehmen. Angesichts dessen, dass der
gesamte Fortschritt in einem localStorage-Eintrag liegt, den ein
„Browserdaten löschen" restlos entfernt, ist das kein Nice-to-have.

### #9 Die Abfragerichtung ist eine unausgesprochene Entscheidung

Der Karten-Flow in §8 zeigt immer Englisch vorne und deckt Deutsch hinten auf.
Trainiert wird damit ausschließlich **rezeptiv** (Wiedererkennen) plus
Aussprache. Die produktive Richtung DE → EN — die beim Vokabelaufbau die
eigentliche Arbeit ist — kommt im ganzen Plan nicht vor. Das mag für eine
Aussprache-App richtig sein, aber es ist derzeit eine stille Nebenwirkung des
Layouts und keine bewusste Entscheidung.

**Empfehlung:** In §2 als Entscheidung aufnehmen und begründen („MVP trainiert
rezeptiv + Aussprache; produktive Richtung ist v2"). Dann ist es eine Wahl und
kein Versehen.

### #10 Kein Autoplay ist als absolute Regel zu streng

§8 und CLAUDE.md legen fest: „Kein Autoplay — immer knopfgebunden", begründet
mit iOS Safari. Die Einschränkung dort gilt aber der **ersten** Ausgabe ohne
Nutzergeste; nach dem Tippen auf „Session starten" ist die Sprachausgabe für die
Sitzung freigeschaltet. Bei 20 Karten × 2 Ausgaben sind das rund 40
unnötige Extra-Taps pro Session, in einer App, deren Kernschleife das Hören ist.

**Empfehlung:** Einstellung „Wort beim Kartenwechsel automatisch vorlesen",
Standard **an**, freigeschaltet durch den Tap auf „Session starten". Die
Knopf-Bedienung bleibt zusätzlich erhalten. Die absolute Formulierung in
CLAUDE.md entsprechend entschärfen.

### #11 `unlockedLevels` ist im MVP totes Feld

`ProgressState.unlockedLevels` wird in §5.2 persistiert, aber die
Freischaltregel ist laut §11 ausdrücklich auf M8 vertagt. Im MVP schreibt also
niemand dieses Feld — es landet trotzdem mit `schemaVersion: 1` im
Nutzer-Speicher.

Nebenbei ist die geplante Regel selbst noch zu prüfen: „80 % von Level N in Fach
≥ 4". Der schnellste Weg in Fach 4 dauert bei den Intervallen 0/1/3 mindestens
vier Tage, realistisch für 40 von 50 Wörtern eher zwei bis drei Wochen. So lange
gar nichts Neues freizuschalten, dürfte demotivieren.

**Empfehlung:** Für das MVP fest mit `[1]` initialisieren und im Plan vermerken,
dass das Feld bewusst vorgehalten wird. Die Schwelle vor M8 gegen eine mildere
Variante prüfen (etwa: Level N+1 öffnet, wenn alle Wörter aus N mindestens
einmal in Fach ≥ 2 waren).

### #12 Die Wortkuration ist der kritische Pfad, wird aber wie eine Nebenaufgabe behandelt

M2 („Wortdaten") steht in §11 zwischen zwei Code-Meilensteinen, als wäre es
gleichartige Arbeit. Tatsächlich ist es die langsamste und fehleranfälligste
Aufgabe des ganzen MVP: 50 × (IPA, phonetische Silben, Betonung, Beispielsatz,
Übersetzung, Aussprachenotiz) — und Fehler darin sind besonders teuer, weil die
App dem Nutzer eine **falsche Aussprache als Ziel** vorsetzt. CLAUDE.md verlangt
„gegen ein Wörterbuch gegenprüfen", nennt aber keine Quelle.

Bei einigen Einträgen aus §10 ist die Vorlage schon jetzt strittig:
**#44 `resource`** hat auch im britischen Gebrauch konkurrierende Varianten
(`/rɪˈzɔːs/` und `/ˈriːsɔːs/`); **#24 `emphasise`/#42 `recognise`** legen die
`-ise`-Schreibung fest, ohne dass §2 eine Schreibkonvention entschieden hat.

**Empfehlung:** Eine Referenzquelle in CLAUDE.md **namentlich** festlegen und
für alle 50 Wörter dieselbe verwenden. Schreibkonvention `-ise` in §2 als
Entscheidung nachtragen. M2 zeitlich vorziehen bzw. parallel zu M1 laufen lassen
— technisch blockiert es nichts, es kann sofort beginnen.

---

## Kleinere Punkte

| # | Befund | Empfehlung |
|---|---|---|
| 13 | Tagesgrenze exakt um Mitternacht zerschneidet späte Lernsessions in zwei „Tage" | Einstellbarer Tagesbeginn, Standard 04:00 — in `dates.ts` ein Einzeiler, später schmerzhaft nachzurüsten |
| 14 | Screenreader lesen IPA-Zeichen als Unsinn vor | IPA `aria-hidden`, dafür Betonung und `note` als Text zugänglich machen |
| 15 | `history` wächst unbegrenzt, Statistik zeigt nur 14 Tage | Auf 90 Einträge deckeln |
| 16 | §12 hat kein Abnahmekriterium für „keine englische Stimme vorhanden", obwohl §7 und §13 den Fall behandeln | Als Kriterium aufnehmen — es ist der Fall, in dem die App am ehesten stumm kaputtgeht |
| 17 | Level 1 ist „B2-Kernwortschatz", Level 2–10 sind Themen — das Schema bricht bei Level 1 | Entweder bewusst als „Grundlagen-Level" benennen oder Level 1 ebenfalls thematisch fassen |
| 18 | §11 nennt keinerlei Aufwandsgröße für die sieben Meilensteine | Grobe Einordnung ergänzen, damit der Zuschnitt des MVP überhaupt verhandelbar ist |
| 19 | Zustand-`persist` schreibt bei jeder Bewertung den kompletten Fortschritt synchron in localStorage | Bei 500 Wörtern rund 75 KB pro Schreibvorgang — unkritisch, aber bewusst so entschieden und nicht übersehen |

---

## Empfohlene Beschlussliste

Vor M0 zu entscheiden:

1. **#1** — Offline-Kriterium in §12 ehrlich umformulieren, `localService` in `tts.ts` berücksichtigen. *Empfehlung: übernehmen.*
2. **#2** — Aufnehmen & Anhören (MediaRecorder) als eigener Schritt im Karten-Flow. *Empfehlung: übernehmen, als neuer Meilenstein zwischen M3 und M4.*
3. **#4** — „Unsicher" wird zu Fach − 1 statt Sonderregel „morgen". *Empfehlung: übernehmen, vereinfacht die Domain-Schicht zusätzlich.*
4. **#3** — Deckel für Wiederholungen und klare Zählweise des Sessionziels. *Empfehlung: übernehmen.*
5. **#9** — Abfragerichtung als bewusste Entscheidung in §2 dokumentieren.
6. **#12** — Wörterbuchquelle festlegen, `-ise`-Konvention festschreiben, M2 vorziehen.

Vor dem jeweiligen Meilenstein: **#5, #6** (M2) · **#7, #8, #10, #11** (M5/M6).

Die Punkte 13–19 können in einem Durchgang beim Feinschliff (M7) abgeräumt
werden, mit Ausnahme von **#13**, der in `dates.ts` von Anfang an mitgedacht
werden sollte.
