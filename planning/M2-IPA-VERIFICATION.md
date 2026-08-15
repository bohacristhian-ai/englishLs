# M2 — Offene IPA-Verifikation

**Status: 50 von 50 Transkriptionen sind ungeprüft.**

`CLAUDE.md` schreibt verbindlich vor: „IPA **immer gegen das Cambridge
Dictionary** prüfen (British English), nie aus dem Gedächtnis schreiben."

Genau das war in der Entwicklungsumgebung nicht möglich —
`dictionary.cambridge.org` ist durch die Netzwerk-Policy gesperrt
(Proxy antwortet mit 403), ebenso Oxford Learner's, Wiktionary und
`api.dictionaryapi.dev`. Die Transkriptionen in `level-01.json` stammen daher aus
dem Modellwissen und sind **nicht** verifiziert.

**M2 gilt erst als abgeschlossen, wenn diese Liste vollständig abgehakt ist.**
Bis dahin darf kein Build als lernfertig gelten: Eine falsche Lautschrift setzt
dem Lernenden ein falsches Aussprachziel vor — genau der Schaden, gegen den die
Regel geschrieben wurde.

## Was bereits maschinell geprüft ist

Die Schema-Validierung (`src/data/words.ts`, Tests in `src/data/words.test.ts`)
bestätigt für alle 50 Einträge:

- eindeutige, lückenlose IDs `l01-w001` … `l01-w050`
- alle Pflichtfelder vorhanden und nicht leer, `pos` aus der erlaubten Liste
- genau ein Hauptbetonungszeichen `ˈ` pro Transkription
- Silbenzahl der IPA stimmt mit `syllables` überein
- `stressIndex` stimmt mit der Position von `ˈ` in `ipaGb` überein
- das Zielwort kommt im Beispielsatz tatsächlich vor (Lückensatz-Modus)

Das prüft **innere Konsistenz**, nicht **Richtigkeit**. Eine durchgehend falsche
Transkription besteht diese Tests problemlos.

## Notation

Die IPA ist in **Cambridge-Notation mit Silbenpunkten** erfasst: `əkˈnɒl.ɪdʒ`.
Der Punkt trennt Silben, das `ˈ` ersetzt den Punkt an der betonten Silbe. Diese
Schreibweise lässt sich eins zu eins mit dem Wörterbucheintrag vergleichen und
erlaubt die maschinelle Gegenprüfung oben.

## Vorgehen beim Abarbeiten

Für jedes Wort auf `dictionary.cambridge.org/dictionary/english/<wort>` die
**UK**-Transkription ablesen und mit der Spalte unten vergleichen. Bei
Abweichung: `ipaGb` korrigieren, danach `syllables` und `stressIndex` nachziehen
und `npm run test:run` laufen lassen — die Validierung meldet Inkonsistenzen
sofort.

Weicht die US-Aussprache ab, gehört sie als `ipaUs` dazu (bisher hat kein Eintrag
dieses Feld).

## Checkliste

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Anmerkung zur Prüfung |
|---|---|---|---|---|
| ☐ | 1 | acknowledge | `əkˈnɒl.ɪdʒ` | |
| ☐ | 2 | adequate | `ˈæd.ə.kwət` | |
| ☐ | 3 | ambiguous | `æmˈbɪɡ.ju.əs` | |
| ☐ | 4 | anxiety | `æŋˈzaɪ.ə.ti` | |
| ☐ | 5 | appreciate | `əˈpriː.ʃi.eɪt` | |
| ☐ | 6 | appropriate | `əˈprəʊ.pri.ət` | **Adjektiv-Variante** prüfen, nicht das Verb |
| ☐ | 7 | assume | `əˈsjuːm` | Yod: `/sjuː/` vs. `/suː/` |
| ☐ | 8 | attitude | `ˈæt.ɪ.tjuːd` | **unsicher**: Cambridge zeigt evtl. `/ˈæt.ɪ.tʃuːd/` |
| ☐ | 9 | awkward | `ˈɔː.kwəd` | |
| ☐ | 10 | beneficial | `ˌben.ɪˈfɪʃ.əl` | |
| ☐ | 11 | colleague | `ˈkɒl.iːɡ` | |
| ☐ | 12 | comfortable | `ˈkʌmf.tə.bəl` | **unsicher**: Cambridge führt evtl. viersilbig `/ˈkʌm.fə.tə.bəl/` |
| ☐ | 13 | commitment | `kəˈmɪt.mənt` | |
| ☐ | 14 | comparison | `kəmˈpær.ɪ.sən` | |
| ☐ | 15 | conscious | `ˈkɒn.ʃəs` | |
| ☐ | 16 | consequence | `ˈkɒn.sɪ.kwəns` | |
| ☐ | 17 | contribute | `kənˈtrɪb.juːt` | Zweitbetonung `/ˈkɒn.trɪ.bjuːt/` ist verbreitet — ggf. in `note` |
| ☐ | 18 | convenient | `kənˈviː.ni.ənt` | |
| ☐ | 19 | crucial | `ˈkruː.ʃəl` | |
| ☐ | 20 | curiosity | `ˌkjʊə.riˈɒs.ə.ti` | |
| ☐ | 21 | deliberate | `dɪˈlɪb.ər.ət` | **Adjektiv-Variante** prüfen, nicht das Verb |
| ☐ | 22 | determine | `dɪˈtɜː.mɪn` | |
| ☐ | 23 | efficient | `ɪˈfɪʃ.ənt` | |
| ☐ | 24 | emphasise | `ˈem.fə.saɪz` | |
| ☐ | 25 | encourage | `ɪnˈkʌr.ɪdʒ` | |
| ☐ | 26 | enthusiasm | `ɪnˈθjuː.zi.æz.əm` | **unsicher**: Silbenschnitt der Endung „-asm“ prüfen |
| ☐ | 27 | environment | `ɪnˈvaɪ.rən.mənt` | |
| ☐ | 28 | essential | `ɪˈsen.ʃəl` | |
| ☐ | 29 | establish | `ɪˈstæb.lɪʃ` | |
| ☐ | 30 | eventually | `ɪˈven.tʃu.ə.li` | |
| ☐ | 31 | evidence | `ˈev.ɪ.dəns` | |
| ☐ | 32 | familiar | `fəˈmɪl.i.ər` | Nicht-rhotisches `/ər/` am Ende prüfen |
| ☐ | 33 | genuine | `ˈdʒen.ju.ɪn` | |
| ☐ | 34 | hierarchy | `ˈhaɪ.ə.rɑː.ki` | **unsicher**: evtl. dreisilbig `/ˈhaɪə.rɑː.ki/` |
| ☐ | 35 | inevitable | `ɪˈnev.ɪ.tə.bəl` | |
| ☐ | 36 | maintenance | `ˈmeɪn.tən.əns` | |
| ☐ | 37 | negotiate | `nəˈɡəʊ.ʃi.eɪt` | Erstsilbe `/nə/` vs. `/nɪ/` |
| ☐ | 38 | opportunity | `ˌɒp.əˈtʃuː.nə.ti` | Yod-Verschmelzung `/tʃuː/` vs. `/tjuː/` |
| ☐ | 39 | perspective | `pəˈspek.tɪv` | |
| ☐ | 40 | persuade | `pəˈsweɪd` | |
| ☐ | 41 | purchase | `ˈpɜː.tʃəs` | |
| ☐ | 42 | recognise | `ˈrek.əɡ.naɪz` | |
| ☐ | 43 | reluctant | `rɪˈlʌk.tənt` | |
| ☐ | 44 | resource | `rɪˈzɔːs` | **strittig**: `/ˈriː.sɔːs/` ist im GB-Gebrauch ebenfalls verbreitet |
| ☐ | 45 | significant | `sɪɡˈnɪf.ɪ.kənt` | |
| ☐ | 46 | similar | `ˈsɪm.ɪ.lər` | |
| ☐ | 47 | sufficient | `səˈfɪʃ.ənt` | |
| ☐ | 48 | suspicious | `səˈspɪʃ.əs` | |
| ☐ | 49 | thorough | `ˈθʌr.ə` | |
| ☐ | 50 | vulnerable | `ˈvʌl.nər.ə.bəl` | |

## Besonders zu prüfen

Die mit **unsicher** oder **strittig** markierten Einträge (8, 12, 26, 34, 44)
sind die, bei denen ich die geringste Zuversicht habe. Wer die Liste abarbeitet,
sollte dort anfangen — dort sitzt der wahrscheinlichste Fehler.

Die deutschen Übersetzungen, Beispielsätze und Aussprachenotizen sind eigene
Autorenarbeit und von dieser Einschränkung **nicht** betroffen; sie können
unabhängig davon redaktionell geprüft werden.
