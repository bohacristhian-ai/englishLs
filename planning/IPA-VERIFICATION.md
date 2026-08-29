# IPA-Verifikation — offene Prüfliste

**Status: 500 von 500 Transkriptionen sind ungeprüft.**

Alle zehn Level wurden auf ausdrückliche Anweisung des Nutzers aus dem
Modellwissen erfasst, weil in der Entwicklungsumgebung **keine
Wörterbuchquelle erreichbar ist**: `dictionary.cambridge.org` antwortet über den
Netzwerk-Proxy mit 403, ebenso Oxford Learner's, Wiktionary und
`api.dictionaryapi.dev`.

Referenzstandard bleibt das **Cambridge Dictionary, British English**. Diese
Liste hält die entstandene Prüfschuld nach, damit sie sichtbar bleibt und nicht
stillschweigend in einen ausgelieferten Build wandert.

## Was bereits maschinell geprüft ist

Die Schema-Validierung (`src/data/words.ts`, Tests in `src/data/words.test.ts`)
bestätigt für alle 500 Einträge:

- eindeutige, lückenlose IDs je Level (`lNN-w001` … `lNN-w050`)
- alle Pflichtfelder vorhanden und nicht leer, `pos` aus der erlaubten Liste
- genau ein Hauptbetonungszeichen `ˈ` pro Transkription
- Silbenzahl der IPA stimmt mit `syllables` überein
- `stressIndex` stimmt mit der Position von `ˈ` in `ipaGb` überein
- kein Wort kommt in zwei Leveln vor
- das Zielwort kommt im Beispielsatz tatsächlich vor (Lückensatz-Modus)

Das prüft **innere Konsistenz**, nicht **Richtigkeit**. Eine durchgehend falsche
Transkription besteht diese Tests problemlos. Der Validator kann nicht wissen,
wie ein Wort wirklich klingt.

## Notation

IPA in **Cambridge-Notation mit Silbenpunkten**: `əkˈnɒl.ɪdʒ`. Der Punkt trennt
Silben, das `ˈ` ersetzt den Punkt an der betonten Silbe. So lässt sich die
Zeichenkette direkt mit dem Wörterbucheintrag vergleichen.

**Eine bewusste Abweichung:** Einsilber tragen hier immer ein `ˈ`
(z. B. `ˈdet` für *debt*), Cambridge lässt es dort weg. Das ist kein Fehler,
sondern hält den Validator einheitlich.

## Vorgehen

Pro Wort `dictionary.cambridge.org/dictionary/english/<wort>` öffnen, die
**UK**-Transkription ablesen, mit der Spalte unten vergleichen. Bei Abweichung
`ipaGb` korrigieren, dann `syllables` und `stressIndex` nachziehen und
`npm run test:run` laufen lassen — die Validierung meldet Inkonsistenzen sofort.
Weicht die US-Aussprache ab, gehört sie als `ipaUs` dazu (bisher hat kein
Eintrag dieses Feld).

## Zuerst prüfen

Die unten mit **⚠** markierten Einträge sind die, bei denen die Variante oder der
Silbenschnitt strittig ist und ich die geringste Zuversicht habe. Dort sitzt der
wahrscheinlichste Fehler — mit ihnen anfangen.

Die deutschen Übersetzungen, Beispielsätze und Aussprachenotizen sind eigene
Autorenarbeit und von dieser Einschränkung **nicht** betroffen.


## Level 1 — Grundlagen (B2-Kernwortschatz)

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | acknowledge | `əkˈnɒl.ɪdʒ` |  |
| ☐ | 2 | adequate | `ˈæd.ə.kwət` |  |
| ☐ | 3 | ambiguous | `æmˈbɪɡ.ju.əs` |  |
| ☐ | 4 | anxiety | `æŋˈzaɪ.ə.ti` |  |
| ☐ | 5 | appreciate | `əˈpriː.ʃi.eɪt` |  |
| ☐ | 6 | appropriate | `əˈprəʊ.pri.ət` |  |
| ☐ | 7 | assume | `əˈsjuːm` |  |
| ☐ | 8 | attitude | `ˈæt.ɪ.tjuːd` | ⚠ Cambridge zeigt evtl. /ˈæt.ɪ.tʃuːd/ (Yod-Verschmelzung) |
| ☐ | 9 | awkward | `ˈɔː.kwəd` |  |
| ☐ | 10 | beneficial | `ˌben.ɪˈfɪʃ.əl` |  |
| ☐ | 11 | colleague | `ˈkɒl.iːɡ` |  |
| ☐ | 12 | comfortable | `ˈkʌmf.tə.bəl` | ⚠ evtl. viersilbig /ˈkʌm.fə.tə.bəl/ |
| ☐ | 13 | commitment | `kəˈmɪt.mənt` |  |
| ☐ | 14 | comparison | `kəmˈpær.ɪ.sən` |  |
| ☐ | 15 | conscious | `ˈkɒn.ʃəs` |  |
| ☐ | 16 | consequence | `ˈkɒn.sɪ.kwəns` |  |
| ☐ | 17 | contribute | `kənˈtrɪb.juːt` | ⚠ Zweitbetonung /ˈkɒn.trɪ.bjuːt/ ist verbreitet |
| ☐ | 18 | convenient | `kənˈviː.ni.ənt` |  |
| ☐ | 19 | crucial | `ˈkruː.ʃəl` |  |
| ☐ | 20 | curiosity | `ˌkjʊə.riˈɒs.ə.ti` |  |
| ☐ | 21 | deliberate | `dɪˈlɪb.ər.ət` |  |
| ☐ | 22 | determine | `dɪˈtɜː.mɪn` |  |
| ☐ | 23 | efficient | `ɪˈfɪʃ.ənt` |  |
| ☐ | 24 | emphasise | `ˈem.fə.saɪz` |  |
| ☐ | 25 | encourage | `ɪnˈkʌr.ɪdʒ` |  |
| ☐ | 26 | enthusiasm | `ɪnˈθjuː.zi.æz.əm` | ⚠ Silbenschnitt der Endung „-asm“ prüfen |
| ☐ | 27 | environment | `ɪnˈvaɪ.rən.mənt` |  |
| ☐ | 28 | essential | `ɪˈsen.ʃəl` |  |
| ☐ | 29 | establish | `ɪˈstæb.lɪʃ` |  |
| ☐ | 30 | eventually | `ɪˈven.tʃu.ə.li` |  |
| ☐ | 31 | evidence | `ˈev.ɪ.dəns` |  |
| ☐ | 32 | familiar | `fəˈmɪl.i.ər` |  |
| ☐ | 33 | genuine | `ˈdʒen.ju.ɪn` |  |
| ☐ | 34 | hierarchy | `ˈhaɪ.ə.rɑː.ki` | ⚠ evtl. dreisilbig /ˈhaɪə.rɑː.ki/ |
| ☐ | 35 | inevitable | `ɪˈnev.ɪ.tə.bəl` |  |
| ☐ | 36 | maintenance | `ˈmeɪn.tən.əns` |  |
| ☐ | 37 | negotiate | `nəˈɡəʊ.ʃi.eɪt` | ⚠ Erstsilbe /nə/ vs. /nɪ/ |
| ☐ | 38 | opportunity | `ˌɒp.əˈtʃuː.nə.ti` | ⚠ Yod-Verschmelzung /tʃuː/ vs. /tjuː/ |
| ☐ | 39 | perspective | `pəˈspek.tɪv` |  |
| ☐ | 40 | persuade | `pəˈsweɪd` |  |
| ☐ | 41 | purchase | `ˈpɜː.tʃəs` |  |
| ☐ | 42 | recognise | `ˈrek.əɡ.naɪz` |  |
| ☐ | 43 | reluctant | `rɪˈlʌk.tənt` |  |
| ☐ | 44 | resource | `rɪˈzɔːs` | ⚠ /ˈriː.sɔːs/ im GB-Gebrauch ebenfalls verbreitet |
| ☐ | 45 | significant | `sɪɡˈnɪf.ɪ.kənt` |  |
| ☐ | 46 | similar | `ˈsɪm.ɪ.lər` |  |
| ☐ | 47 | sufficient | `səˈfɪʃ.ənt` |  |
| ☐ | 48 | suspicious | `səˈspɪʃ.əs` |  |
| ☐ | 49 | thorough | `ˈθʌr.ə` |  |
| ☐ | 50 | vulnerable | `ˈvʌl.nər.ə.bəl` |  |

## Level 2 — Arbeit & Beruf

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | achievement | `əˈtʃiːv.mənt` |  |
| ☐ | 2 | applicant | `ˈæp.lɪ.kənt` |  |
| ☐ | 3 | apprentice | `əˈpren.tɪs` |  |
| ☐ | 4 | attendance | `əˈten.dəns` |  |
| ☐ | 5 | bureaucracy | `bjʊəˈrɒk.rə.si` |  |
| ☐ | 6 | candidate | `ˈkæn.dɪ.dət` |  |
| ☐ | 7 | career | `kəˈrɪər` |  |
| ☐ | 8 | certificate | `səˈtɪf.ɪ.kət` |  |
| ☐ | 9 | competent | `ˈkɒm.pɪ.tənt` |  |
| ☐ | 10 | contract | `ˈkɒn.trækt` |  |
| ☐ | 11 | corporate | `ˈkɔː.pər.ət` |  |
| ☐ | 12 | deadline | `ˈded.laɪn` |  |
| ☐ | 13 | delegate | `ˈdel.ɪ.ɡət` |  |
| ☐ | 14 | department | `dɪˈpɑːt.mənt` |  |
| ☐ | 15 | employee | `ɪmˈplɔɪ.iː` |  |
| ☐ | 16 | employer | `ɪmˈplɔɪ.ər` |  |
| ☐ | 17 | entrepreneur | `ˌɒn.trə.prəˈnɜːr` |  |
| ☐ | 18 | expertise | `ˌek.spɜːˈtiːz` |  |
| ☐ | 19 | freelance | `ˈfriː.lɑːns` |  |
| ☐ | 20 | income | `ˈɪŋ.kʌm` |  |
| ☐ | 21 | industry | `ˈɪn.də.stri` |  |
| ☐ | 22 | interview | `ˈɪn.tə.vjuː` |  |
| ☐ | 23 | manufacture | `ˌmæn.jəˈfæk.tʃər` |  |
| ☐ | 24 | objective | `əbˈdʒek.tɪv` |  |
| ☐ | 25 | occupation | `ˌɒk.jəˈpeɪ.ʃən` |  |
| ☐ | 26 | overtime | `ˈəʊ.və.taɪm` |  |
| ☐ | 27 | permanent | `ˈpɜː.mə.nənt` |  |
| ☐ | 28 | personnel | `ˌpɜː.sənˈel` |  |
| ☐ | 29 | procedure | `prəˈsiː.dʒər` |  |
| ☐ | 30 | productivity | `ˌprɒd.ʌkˈtɪv.ə.ti` |  |
| ☐ | 31 | profession | `prəˈfeʃ.ən` |  |
| ☐ | 32 | promotion | `prəˈməʊ.ʃən` |  |
| ☐ | 33 | qualification | `ˌkwɒl.ɪ.fɪˈkeɪ.ʃən` |  |
| ☐ | 34 | recruitment | `rɪˈkruːt.mənt` |  |
| ☐ | 35 | redundancy | `rɪˈdʌn.dən.si` |  |
| ☐ | 36 | reliable | `rɪˈlaɪ.ə.bəl` |  |
| ☐ | 37 | resign | `rɪˈzaɪn` |  |
| ☐ | 38 | responsibility | `rɪˌspɒn.sɪˈbɪl.ə.ti` |  |
| ☐ | 39 | salary | `ˈsæl.ər.i` |  |
| ☐ | 40 | schedule | `ˈʃedʒ.uːl` |  |
| ☐ | 41 | shift | `ˈʃɪft` |  |
| ☐ | 42 | skilled | `ˈskɪld` |  |
| ☐ | 43 | staff | `ˈstɑːf` |  |
| ☐ | 44 | supervisor | `ˈsuː.pə.vaɪ.zər` |  |
| ☐ | 45 | tedious | `ˈtiː.di.əs` |  |
| ☐ | 46 | temporary | `ˈtem.pər.ər.i` |  |
| ☐ | 47 | thrive | `ˈθraɪv` |  |
| ☐ | 48 | vacancy | `ˈveɪ.kən.si` |  |
| ☐ | 49 | wage | `ˈweɪdʒ` |  |
| ☐ | 50 | workload | `ˈwɜːk.ləʊd` |  |

## Level 3 — Bildung & Lernen

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | academic | `ˌæk.əˈdem.ɪk` |  |
| ☐ | 2 | analyse | `ˈæn.əl.aɪz` |  |
| ☐ | 3 | assessment | `əˈses.mənt` |  |
| ☐ | 4 | assignment | `əˈsaɪn.mənt` |  |
| ☐ | 5 | attentive | `əˈten.tɪv` |  |
| ☐ | 6 | cognitive | `ˈkɒɡ.nə.tɪv` |  |
| ☐ | 7 | comprehension | `ˌkɒm.prɪˈhen.ʃən` |  |
| ☐ | 8 | concentrate | `ˈkɒn.sən.treɪt` |  |
| ☐ | 9 | curriculum | `kəˈrɪk.jə.ləm` |  |
| ☐ | 10 | criterion | `kraɪˈtɪə.ri.ən` |  |
| ☐ | 11 | degree | `dɪˈɡriː` |  |
| ☐ | 12 | dissertation | `ˌdɪs.əˈteɪ.ʃən` |  |
| ☐ | 13 | distinction | `dɪˈstɪŋk.ʃən` |  |
| ☐ | 14 | educate | `ˈed.jʊ.keɪt` |  |
| ☐ | 15 | elaborate | `ɪˈlæb.ər.ət` |  |
| ☐ | 16 | emphasis | `ˈem.fə.sɪs` |  |
| ☐ | 17 | evaluate | `ɪˈvæl.ju.eɪt` |  |
| ☐ | 18 | insight | `ˈɪn.saɪt` |  |
| ☐ | 19 | faculty | `ˈfæk.əl.ti` |  |
| ☐ | 20 | fluent | `ˈfluː.ənt` |  |
| ☐ | 21 | graduate | `ˈɡrædʒ.u.eɪt` |  |
| ☐ | 22 | hypothesis | `haɪˈpɒθ.ə.sɪs` |  |
| ☐ | 23 | intuitive | `ɪnˈtjuː.ɪ.tɪv` |  |
| ☐ | 24 | lecture | `ˈlek.tʃər` |  |
| ☐ | 25 | literacy | `ˈlɪt.ər.ə.si` |  |
| ☐ | 26 | memorise | `ˈmem.ər.aɪz` |  |
| ☐ | 27 | methodology | `ˌmeθ.əˈdɒl.ə.dʒi` |  |
| ☐ | 28 | motivation | `ˌməʊ.tɪˈveɪ.ʃən` |  |
| ☐ | 29 | numerous | `ˈnjuː.mər.əs` |  |
| ☐ | 30 | outcome | `ˈaʊt.kʌm` |  |
| ☐ | 31 | participate | `pɑːˈtɪs.ɪ.peɪt` |  |
| ☐ | 32 | pedagogy | `ˈped.ə.ɡɒdʒ.i` |  |
| ☐ | 33 | plagiarism | `ˈpleɪ.dʒər.ɪ.zəm` | ⚠ Silbenschnitt der Endung prüfen |
| ☐ | 34 | postgraduate | `ˌpəʊstˈɡrædʒ.u.ət` |  |
| ☐ | 35 | primary | `ˈpraɪ.mər.i` |  |
| ☐ | 36 | profound | `prəˈfaʊnd` |  |
| ☐ | 37 | pursue | `pəˈsjuː` |  |
| ☐ | 38 | questionnaire | `ˌkwes.tʃəˈneər` |  |
| ☐ | 39 | relevant | `ˈrel.ə.vənt` |  |
| ☐ | 40 | research | `rɪˈsɜːtʃ` |  |
| ☐ | 41 | revision | `rɪˈvɪʒ.ən` |  |
| ☐ | 42 | scholarship | `ˈskɒl.ə.ʃɪp` |  |
| ☐ | 43 | seminar | `ˈsem.ɪ.nɑːr` |  |
| ☐ | 44 | supervise | `ˈsuː.pə.vaɪz` |  |
| ☐ | 45 | syllabus | `ˈsɪl.ə.bəs` |  |
| ☐ | 46 | theoretical | `ˌθiː.əˈret.ɪ.kəl` |  |
| ☐ | 47 | thesis | `ˈθiː.sɪs` |  |
| ☐ | 48 | tuition | `tjuːˈɪʃ.ən` |  |
| ☐ | 49 | undergraduate | `ˌʌn.dəˈɡrædʒ.u.ət` |  |
| ☐ | 50 | vocabulary | `vəˈkæb.jə.lər.i` |  |

## Level 4 — Gefühle & Persönlichkeit

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | affection | `əˈfek.ʃən` |  |
| ☐ | 2 | ambitious | `æmˈbɪʃ.əs` |  |
| ☐ | 3 | arrogant | `ˈær.ə.ɡənt` |  |
| ☐ | 4 | ashamed | `əˈʃeɪmd` |  |
| ☐ | 5 | cautious | `ˈkɔː.ʃəs` |  |
| ☐ | 6 | compassion | `kəmˈpæʃ.ən` |  |
| ☐ | 7 | confident | `ˈkɒn.fɪ.dənt` |  |
| ☐ | 8 | considerate | `kənˈsɪd.ər.ət` |  |
| ☐ | 9 | content | `kənˈtent` |  |
| ☐ | 10 | courage | `ˈkʌr.ɪdʒ` |  |
| ☐ | 11 | desperate | `ˈdes.pər.ət` |  |
| ☐ | 12 | disappointed | `ˌdɪs.əˈpɔɪn.tɪd` |  |
| ☐ | 13 | eager | `ˈiː.ɡər` |  |
| ☐ | 14 | embarrassed | `ɪmˈbær.əst` |  |
| ☐ | 15 | empathy | `ˈem.pə.θi` |  |
| ☐ | 16 | envious | `ˈen.vi.əs` |  |
| ☐ | 17 | frustrated | `frʌsˈtreɪ.tɪd` |  |
| ☐ | 18 | generous | `ˈdʒen.ər.əs` |  |
| ☐ | 19 | grateful | `ˈɡreɪt.fəl` |  |
| ☐ | 20 | guilty | `ˈɡɪl.ti` |  |
| ☐ | 21 | humble | `ˈhʌm.bəl` |  |
| ☐ | 22 | impatient | `ɪmˈpeɪ.ʃənt` |  |
| ☐ | 23 | insecure | `ˌɪn.sɪˈkjʊər` |  |
| ☐ | 24 | irritated | `ˈɪr.ɪ.teɪ.tɪd` |  |
| ☐ | 25 | jealous | `ˈdʒel.əs` |  |
| ☐ | 26 | loyalty | `ˈlɔɪ.əl.ti` |  |
| ☐ | 27 | melancholy | `ˈmel.əŋ.kɒl.i` |  |
| ☐ | 28 | modest | `ˈmɒd.ɪst` |  |
| ☐ | 29 | nostalgia | `nɒsˈtæl.dʒə` |  |
| ☐ | 30 | optimistic | `ˌɒp.tɪˈmɪs.tɪk` |  |
| ☐ | 31 | outgoing | `ˌaʊtˈɡəʊ.ɪŋ` |  |
| ☐ | 32 | overwhelmed | `ˌəʊ.vəˈwelmd` |  |
| ☐ | 33 | patience | `ˈpeɪ.ʃəns` |  |
| ☐ | 34 | persistent | `pəˈsɪs.tənt` |  |
| ☐ | 35 | pessimistic | `ˌpes.ɪˈmɪs.tɪk` |  |
| ☐ | 36 | polite | `pəˈlaɪt` |  |
| ☐ | 37 | prejudice | `ˈpredʒ.ə.dɪs` |  |
| ☐ | 38 | reassure | `ˌriː.əˈʃɔːr` |  |
| ☐ | 39 | resentment | `rɪˈzent.mənt` |  |
| ☐ | 40 | resilient | `rɪˈzɪl.i.ənt` |  |
| ☐ | 41 | ruthless | `ˈruːθ.ləs` |  |
| ☐ | 42 | sensible | `ˈsen.sə.bəl` |  |
| ☐ | 43 | sincere | `sɪnˈsɪər` |  |
| ☐ | 44 | stubborn | `ˈstʌb.ən` |  |
| ☐ | 45 | sympathy | `ˈsɪm.pə.θi` |  |
| ☐ | 46 | temper | `ˈtem.pər` |  |
| ☐ | 47 | tolerant | `ˈtɒl.ər.ənt` |  |
| ☐ | 48 | trustworthy | `ˈtrʌstˌwɜː.ði` |  |
| ☐ | 49 | sorrow | `ˈsɒr.əʊ` |  |
| ☐ | 50 | withdrawn | `wɪðˈdrɔːn` |  |

## Level 5 — Gesellschaft & Politik

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | abolish | `əˈbɒl.ɪʃ` |  |
| ☐ | 2 | advocate | `ˈæd.və.keɪt` |  |
| ☐ | 3 | authority | `ɔːˈθɒr.ə.ti` |  |
| ☐ | 4 | campaign | `kæmˈpeɪn` |  |
| ☐ | 5 | citizen | `ˈsɪt.ɪ.zən` |  |
| ☐ | 6 | civil | `ˈsɪv.əl` |  |
| ☐ | 7 | constitution | `ˌkɒn.stɪˈtjuː.ʃən` |  |
| ☐ | 8 | controversial | `ˌkɒn.trəˈvɜː.ʃəl` |  |
| ☐ | 9 | corruption | `kəˈrʌp.ʃən` |  |
| ☐ | 10 | democracy | `dɪˈmɒk.rə.si` |  |
| ☐ | 11 | discrimination | `dɪˌskrɪm.ɪˈneɪ.ʃən` |  |
| ☐ | 12 | election | `ɪˈlek.ʃən` |  |
| ☐ | 13 | equality | `iˈkwɒl.ə.ti` |  |
| ☐ | 14 | govern | `ˈɡʌv.ən` |  |
| ☐ | 15 | immigration | `ˌɪm.ɪˈɡreɪ.ʃən` |  |
| ☐ | 16 | inequality | `ˌɪn.ɪˈkwɒl.ə.ti` |  |
| ☐ | 17 | influential | `ˌɪn.fluˈen.ʃəl` |  |
| ☐ | 18 | justice | `ˈdʒʌs.tɪs` |  |
| ☐ | 19 | legislation | `ˌledʒ.ɪˈsleɪ.ʃən` |  |
| ☐ | 20 | liberty | `ˈlɪb.ə.ti` |  |
| ☐ | 21 | majority | `məˈdʒɒr.ə.ti` |  |
| ☐ | 22 | minority | `maɪˈnɒr.ə.ti` |  |
| ☐ | 23 | municipal | `mjuːˈnɪs.ɪ.pəl` |  |
| ☐ | 24 | negotiation | `nəˌɡəʊ.ʃiˈeɪ.ʃən` |  |
| ☐ | 25 | opposition | `ˌɒp.əˈzɪʃ.ən` |  |
| ☐ | 26 | parliament | `ˈpɑː.lə.mənt` |  |
| ☐ | 27 | petition | `pəˈtɪʃ.ən` |  |
| ☐ | 28 | policy | `ˈpɒl.ə.si` |  |
| ☐ | 29 | poverty | `ˈpɒv.ə.ti` |  |
| ☐ | 30 | prejudiced | `ˈpredʒ.ə.dɪst` |  |
| ☐ | 31 | protest | `ˈprəʊ.test` |  |
| ☐ | 32 | reform | `rɪˈfɔːm` |  |
| ☐ | 33 | refugee | `ˌref.jʊˈdʒiː` |  |
| ☐ | 34 | regulation | `ˌreɡ.jəˈleɪ.ʃən` |  |
| ☐ | 35 | representative | `ˌrep.rɪˈzen.tə.tɪv` |  |
| ☐ | 36 | sovereignty | `ˈsɒv.rən.ti` |  |
| ☐ | 37 | statistics | `stəˈtɪs.tɪks` |  |
| ☐ | 38 | suburb | `ˈsʌb.ɜːb` |  |
| ☐ | 39 | surveillance | `səˈveɪ.ləns` |  |
| ☐ | 40 | taxation | `tækˈseɪ.ʃən` |  |
| ☐ | 41 | tolerance | `ˈtɒl.ər.əns` |  |
| ☐ | 42 | unemployment | `ˌʌn.ɪmˈplɔɪ.mənt` |  |
| ☐ | 43 | welfare | `ˈwel.feər` |  |
| ☐ | 44 | referendum | `ˌref.əˈren.dəm` |  |
| ☐ | 45 | advocacy | `ˈæd.və.kə.si` |  |
| ☐ | 46 | diplomacy | `dɪˈpləʊ.mə.si` |  |
| ☐ | 47 | solidarity | `ˌsɒl.ɪˈdær.ə.ti` |  |
| ☐ | 48 | census | `ˈsen.səs` |  |
| ☐ | 49 | accountable | `əˈkaʊn.tə.bəl` |  |
| ☐ | 50 | consensus | `kənˈsen.səs` |  |

## Level 6 — Umwelt & Natur

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | abundant | `əˈbʌn.dənt` |  |
| ☐ | 2 | agriculture | `ˈæɡ.rɪ.kʌl.tʃər` |  |
| ☐ | 3 | atmosphere | `ˈæt.mə.sfɪər` |  |
| ☐ | 4 | biodiversity | `ˌbaɪ.əʊ.daɪˈvɜː.sə.ti` |  |
| ☐ | 5 | climate | `ˈklaɪ.mət` |  |
| ☐ | 6 | conservation | `ˌkɒn.səˈveɪ.ʃən` |  |
| ☐ | 7 | contaminate | `kənˈtæm.ɪ.neɪt` |  |
| ☐ | 8 | deforestation | `diːˌfɒr.ɪˈsteɪ.ʃən` |  |
| ☐ | 9 | drought | `ˈdraʊt` |  |
| ☐ | 10 | ecosystem | `ˈiː.kəʊˌsɪs.təm` |  |
| ☐ | 11 | emission | `iˈmɪʃ.ən` |  |
| ☐ | 12 | endangered | `ɪnˈdeɪn.dʒəd` |  |
| ☐ | 13 | erosion | `iˈrəʊ.ʒən` |  |
| ☐ | 14 | extinct | `ɪkˈstɪŋkt` |  |
| ☐ | 15 | fertile | `ˈfɜː.taɪl` | ⚠ GB /aɪl/ vs. AE /əl/ |
| ☐ | 16 | flourish | `ˈflʌr.ɪʃ` |  |
| ☐ | 17 | fossil | `ˈfɒs.əl` |  |
| ☐ | 18 | glacier | `ˈɡlæs.i.ər` | ⚠ GB /ˈɡlæs.i.ər/ vs. /ˈɡleɪ.si.ər/ |
| ☐ | 19 | habitat | `ˈhæb.ɪ.tæt` |  |
| ☐ | 20 | hazardous | `ˈhæz.ə.dəs` |  |
| ☐ | 21 | hemisphere | `ˈhem.ɪ.sfɪər` |  |
| ☐ | 22 | irrigation | `ˌɪr.ɪˈɡeɪ.ʃən` |  |
| ☐ | 23 | landfill | `ˈlænd.fɪl` |  |
| ☐ | 24 | livestock | `ˈlaɪv.stɒk` |  |
| ☐ | 25 | marine | `məˈriːn` |  |
| ☐ | 26 | meadow | `ˈmed.əʊ` |  |
| ☐ | 27 | moisture | `ˈmɔɪs.tʃər` |  |
| ☐ | 28 | nutrient | `ˈnjuː.tri.ənt` |  |
| ☐ | 29 | organic | `ɔːˈɡæn.ɪk` |  |
| ☐ | 30 | pesticide | `ˈpes.tɪ.saɪd` |  |
| ☐ | 31 | pollution | `pəˈluː.ʃən` |  |
| ☐ | 32 | preserve | `prɪˈzɜːv` |  |
| ☐ | 33 | recycle | `ˌriːˈsaɪ.kəl` |  |
| ☐ | 34 | renewable | `rɪˈnjuː.ə.bəl` |  |
| ☐ | 35 | reservoir | `ˈrez.ə.vwɑːr` |  |
| ☐ | 36 | sanctuary | `ˈsæŋk.tʃu.ər.i` |  |
| ☐ | 37 | scarce | `ˈskeəs` |  |
| ☐ | 38 | sediment | `ˈsed.ɪ.mənt` |  |
| ☐ | 39 | shrink | `ˈʃrɪŋk` |  |
| ☐ | 40 | species | `ˈspiː.ʃiːz` |  |
| ☐ | 41 | sustainable | `səˈsteɪ.nə.bəl` |  |
| ☐ | 42 | temperate | `ˈtem.pər.ət` |  |
| ☐ | 43 | terrain | `təˈreɪn` |  |
| ☐ | 44 | pristine | `ˈprɪs.tiːn` |  |
| ☐ | 45 | toxic | `ˈtɒk.sɪk` |  |
| ☐ | 46 | tributary | `ˈtrɪb.jə.tər.i` |  |
| ☐ | 47 | vegetation | `ˌvedʒ.əˈteɪ.ʃən` |  |
| ☐ | 48 | wilderness | `ˈwɪl.də.nəs` |  |
| ☐ | 49 | wildlife | `ˈwaɪld.laɪf` |  |
| ☐ | 50 | catastrophe | `kəˈtæs.trə.fi` |  |

## Level 7 — Technologie & Medien

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | algorithm | `ˈæl.ɡə.rɪ.ðəm` | ⚠ Silbenschnitt der Endung prüfen |
| ☐ | 2 | analogue | `ˈæn.ə.lɒɡ` |  |
| ☐ | 3 | artificial | `ˌɑː.tɪˈfɪʃ.əl` |  |
| ☐ | 4 | bandwidth | `ˈbænd.wɪdθ` |  |
| ☐ | 5 | broadcast | `ˈbrɔːd.kɑːst` |  |
| ☐ | 6 | browser | `ˈbraʊ.zər` |  |
| ☐ | 7 | circuit | `ˈsɜː.kɪt` |  |
| ☐ | 8 | compatible | `kəmˈpæt.ə.bəl` |  |
| ☐ | 9 | component | `kəmˈpəʊ.nənt` |  |
| ☐ | 10 | credible | `ˈkred.ə.bəl` |  |
| ☐ | 11 | cybersecurity | `ˌsaɪ.bə.sɪˈkjʊə.rə.ti` |  |
| ☐ | 12 | database | `ˈdeɪ.tə.beɪs` |  |
| ☐ | 13 | device | `dɪˈvaɪs` |  |
| ☐ | 14 | digital | `ˈdɪdʒ.ɪ.təl` |  |
| ☐ | 15 | encryption | `ɪnˈkrɪp.ʃən` |  |
| ☐ | 16 | engine | `ˈen.dʒɪn` |  |
| ☐ | 17 | feature | `ˈfiː.tʃər` |  |
| ☐ | 18 | firmware | `ˈfɜːm.weər` |  |
| ☐ | 19 | glitch | `ˈɡlɪtʃ` |  |
| ☐ | 20 | hardware | `ˈhɑːd.weər` |  |
| ☐ | 21 | innovation | `ˌɪn.əˈveɪ.ʃən` |  |
| ☐ | 22 | interface | `ˈɪn.tə.feɪs` |  |
| ☐ | 23 | journalism | `ˈdʒɜː.nə.lɪ.zəm` | ⚠ Silbenschnitt der Endung prüfen |
| ☐ | 24 | misinformation | `ˌmɪs.ɪn.fəˈmeɪ.ʃən` |  |
| ☐ | 25 | network | `ˈnet.wɜːk` |  |
| ☐ | 26 | obsolete | `ˈɒb.səl.iːt` | ⚠ Betonung vorn oder hinten je nach Quelle |
| ☐ | 27 | outage | `ˈaʊ.tɪdʒ` |  |
| ☐ | 28 | password | `ˈpɑːs.wɜːd` |  |
| ☐ | 29 | platform | `ˈplæt.fɔːm` |  |
| ☐ | 30 | prototype | `ˈprəʊ.tə.taɪp` |  |
| ☐ | 31 | publisher | `ˈpʌb.lɪ.ʃər` |  |
| ☐ | 32 | reliability | `rɪˌlaɪ.əˈbɪl.ə.ti` |  |
| ☐ | 33 | retrieve | `rɪˈtriːv` |  |
| ☐ | 34 | server | `ˈsɜː.vər` |  |
| ☐ | 35 | software | `ˈsɒft.weər` |  |
| ☐ | 36 | subscription | `səbˈskrɪp.ʃən` |  |
| ☐ | 37 | latency | `ˈleɪ.tən.si` |  |
| ☐ | 38 | transmit | `trænzˈmɪt` | ⚠ /trænz/ vs. /træns/ |
| ☐ | 39 | upgrade | `ˈʌp.ɡreɪd` |  |
| ☐ | 40 | virtual | `ˈvɜː.tʃu.əl` |  |
| ☐ | 41 | wireless | `ˈwaɪə.ləs` |  |
| ☐ | 42 | automation | `ˌɔː.təˈmeɪ.ʃən` |  |
| ☐ | 43 | censorship | `ˈsen.sə.ʃɪp` |  |
| ☐ | 44 | anonymous | `əˈnɒn.ɪ.məs` |  |
| ☐ | 45 | malfunction | `ˌmælˈfʌŋk.ʃən` |  |
| ☐ | 46 | streaming | `ˈstriː.mɪŋ` |  |
| ☐ | 47 | bias | `ˈbaɪ.əs` |  |
| ☐ | 48 | coverage | `ˈkʌv.ər.ɪdʒ` |  |
| ☐ | 49 | headline | `ˈhed.laɪn` |  |
| ☐ | 50 | archive | `ˈɑː.kaɪv` |  |

## Level 8 — Gesundheit & Körper

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | ailment | `ˈeɪl.mənt` |  |
| ☐ | 2 | allergy | `ˈæl.ə.dʒi` |  |
| ☐ | 3 | anaesthetic | `ˌæn.əsˈθet.ɪk` | ⚠ Schreibweise und Vokal der ersten Silbe prüfen |
| ☐ | 4 | antibiotic | `ˌæn.ti.baɪˈɒt.ɪk` |  |
| ☐ | 5 | anxious | `ˈæŋk.ʃəs` |  |
| ☐ | 6 | artery | `ˈɑː.tər.i` |  |
| ☐ | 7 | bruise | `ˈbruːz` |  |
| ☐ | 8 | chronic | `ˈkrɒn.ɪk` |  |
| ☐ | 9 | circulation | `ˌsɜː.kjəˈleɪ.ʃən` |  |
| ☐ | 10 | diagnosis | `ˌdaɪ.əɡˈnəʊ.sɪs` |  |
| ☐ | 11 | digestion | `daɪˈdʒes.tʃən` |  |
| ☐ | 12 | dizzy | `ˈdɪz.i` |  |
| ☐ | 13 | dosage | `ˈdəʊ.sɪdʒ` |  |
| ☐ | 14 | epidemic | `ˌep.ɪˈdem.ɪk` |  |
| ☐ | 15 | exhausted | `ɪɡˈzɔː.stɪd` |  |
| ☐ | 16 | fatigue | `fəˈtiːɡ` |  |
| ☐ | 17 | hygiene | `ˈhaɪ.dʒiːn` |  |
| ☐ | 18 | immune | `ɪˈmjuːn` |  |
| ☐ | 19 | infection | `ɪnˈfek.ʃən` |  |
| ☐ | 20 | inflammation | `ˌɪn.fləˈmeɪ.ʃən` |  |
| ☐ | 21 | injury | `ˈɪn.dʒər.i` |  |
| ☐ | 22 | insomnia | `ɪnˈsɒm.ni.ə` |  |
| ☐ | 23 | joint | `ˈdʒɔɪnt` |  |
| ☐ | 24 | muscle | `ˈmʌs.əl` |  |
| ☐ | 25 | nausea | `ˈnɔː.zi.ə` |  |
| ☐ | 26 | nutrition | `njuːˈtrɪʃ.ən` |  |
| ☐ | 27 | obesity | `əʊˈbiː.sə.ti` |  |
| ☐ | 28 | outbreak | `ˈaʊt.breɪk` |  |
| ☐ | 29 | painkiller | `ˈpeɪnˌkɪl.ər` |  |
| ☐ | 30 | physician | `fɪˈzɪʃ.ən` |  |
| ☐ | 31 | posture | `ˈpɒs.tʃər` |  |
| ☐ | 32 | prescription | `prɪˈskrɪp.ʃən` |  |
| ☐ | 33 | recovery | `rɪˈkʌv.ər.i` |  |
| ☐ | 34 | rehabilitation | `ˌriː.əˌbɪl.ɪˈteɪ.ʃən` |  |
| ☐ | 35 | remedy | `ˈrem.ə.di` |  |
| ☐ | 36 | respiratory | `rəˈspɪr.ə.tər.i` |  |
| ☐ | 37 | sedentary | `ˈsed.ən.tər.i` |  |
| ☐ | 38 | severe | `sɪˈvɪər` |  |
| ☐ | 39 | surgery | `ˈsɜː.dʒər.i` |  |
| ☐ | 40 | symptom | `ˈsɪmp.təm` |  |
| ☐ | 41 | therapy | `ˈθer.ə.pi` |  |
| ☐ | 42 | vaccine | `ˈvæk.siːn` | ⚠ Betonung vorn vs. hinten |
| ☐ | 43 | wellbeing | `ˌwelˈbiː.ɪŋ` |  |
| ☐ | 44 | wound | `ˈwuːnd` |  |
| ☐ | 45 | swollen | `ˈswəʊ.lən` |  |
| ☐ | 46 | contagious | `kənˈteɪ.dʒəs` |  |
| ☐ | 47 | hereditary | `həˈred.ɪ.tər.i` |  |
| ☐ | 48 | metabolism | `məˈtæb.əl.ɪ.zəm` | ⚠ Silbenschnitt der Endung prüfen |
| ☐ | 49 | sanitation | `ˌsæn.ɪˈteɪ.ʃən` |  |
| ☐ | 50 | relapse | `ˈriː.læps` |  |

## Level 9 — Reisen & Kultur

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | accommodation | `əˌkɒm.əˈdeɪ.ʃən` |  |
| ☐ | 2 | aisle | `ˈaɪl` |  |
| ☐ | 3 | ancestor | `ˈæn.ses.tər` |  |
| ☐ | 4 | architecture | `ˈɑː.kɪ.tek.tʃər` |  |
| ☐ | 5 | authentic | `ɔːˈθen.tɪk` |  |
| ☐ | 6 | boundary | `ˈbaʊn.dər.i` |  |
| ☐ | 7 | cathedral | `kəˈθiː.drəl` |  |
| ☐ | 8 | commemorate | `kəˈmem.ər.eɪt` |  |
| ☐ | 9 | cuisine | `kwɪˈziːn` |  |
| ☐ | 10 | customs | `ˈkʌs.təmz` |  |
| ☐ | 11 | delayed | `dɪˈleɪd` |  |
| ☐ | 12 | departure | `dɪˈpɑː.tʃər` |  |
| ☐ | 13 | destination | `ˌdes.tɪˈneɪ.ʃən` |  |
| ☐ | 14 | dialect | `ˈdaɪ.ə.lekt` |  |
| ☐ | 15 | excursion | `ɪkˈskɜː.ʃən` |  |
| ☐ | 16 | exhibition | `ˌek.sɪˈbɪʃ.ən` |  |
| ☐ | 17 | heritage | `ˈher.ɪ.tɪdʒ` |  |
| ☐ | 18 | hospitality | `ˌhɒs.pɪˈtæl.ə.ti` |  |
| ☐ | 19 | indigenous | `ɪnˈdɪdʒ.ə.nəs` |  |
| ☐ | 20 | itinerary | `aɪˈtɪn.ər.ər.i` |  |
| ☐ | 21 | landmark | `ˈlænd.mɑːk` |  |
| ☐ | 22 | luggage | `ˈlʌɡ.ɪdʒ` |  |
| ☐ | 23 | monument | `ˈmɒn.jə.mənt` |  |
| ☐ | 24 | mosaic | `məʊˈzeɪ.ɪk` |  |
| ☐ | 25 | nomadic | `nəʊˈmæd.ɪk` |  |
| ☐ | 26 | peninsula | `pəˈnɪn.sjə.lə` | ⚠ /sjə/ vs. /sə/ |
| ☐ | 27 | picturesque | `ˌpɪk.tʃərˈesk` |  |
| ☐ | 28 | pilgrimage | `ˈpɪl.ɡrɪ.mɪdʒ` |  |
| ☐ | 29 | quaint | `ˈkweɪnt` |  |
| ☐ | 30 | ritual | `ˈrɪtʃ.u.əl` |  |
| ☐ | 31 | scenery | `ˈsiː.nər.i` |  |
| ☐ | 32 | sightseeing | `ˈsaɪtˌsiː.ɪŋ` |  |
| ☐ | 33 | souvenir | `ˌsuː.vənˈɪər` |  |
| ☐ | 34 | spectacular | `spekˈtæk.jə.lər` |  |
| ☐ | 35 | terminal | `ˈtɜː.mɪ.nəl` |  |
| ☐ | 36 | tradition | `trəˈdɪʃ.ən` |  |
| ☐ | 37 | turbulence | `ˈtɜː.bjə.ləns` |  |
| ☐ | 38 | vibrant | `ˈvaɪ.brənt` |  |
| ☐ | 39 | voyage | `ˈvɔɪ.ɪdʒ` |  |
| ☐ | 40 | wander | `ˈwɒn.dər` |  |
| ☐ | 41 | customary | `ˈkʌs.tə.mər.i` |  |
| ☐ | 42 | folklore | `ˈfəʊk.lɔːr` |  |
| ☐ | 43 | remote | `rɪˈməʊt` |  |
| ☐ | 44 | bustling | `ˈbʌs.lɪŋ` |  |
| ☐ | 45 | reservation | `ˌrez.əˈveɪ.ʃən` |  |
| ☐ | 46 | ceremony | `ˈser.ɪ.mə.ni` |  |
| ☐ | 47 | detour | `ˈdiː.tʊər` |  |
| ☐ | 48 | expedition | `ˌek.spəˈdɪʃ.ən` |  |
| ☐ | 49 | hostel | `ˈhɒs.təl` |  |
| ☐ | 50 | panorama | `ˌpæn.ərˈɑː.mə` |  |

## Level 10 — Wirtschaft & Geld

| ✓ | # | Wort | erfasste IPA (ungeprüft) | Hinweis |
|---|---|---|---|---|
| ☐ | 1 | acquisition | `ˌæk.wɪˈzɪʃ.ən` |  |
| ☐ | 2 | allocate | `ˈæl.ə.keɪt` |  |
| ☐ | 3 | asset | `ˈæs.et` |  |
| ☐ | 4 | auditor | `ˈɔː.dɪ.tər` |  |
| ☐ | 5 | bankruptcy | `ˈbæŋk.rəpt.si` |  |
| ☐ | 6 | benchmark | `ˈbentʃ.mɑːk` |  |
| ☐ | 7 | commodity | `kəˈmɒd.ə.ti` |  |
| ☐ | 8 | competitor | `kəmˈpet.ɪ.tər` |  |
| ☐ | 9 | consumer | `kənˈsjuː.mər` |  |
| ☐ | 10 | currency | `ˈkʌr.ən.si` |  |
| ☐ | 11 | debt | `ˈdet` |  |
| ☐ | 12 | deficit | `ˈdef.ɪ.sɪt` |  |
| ☐ | 13 | depreciation | `dɪˌpriː.ʃiˈeɪ.ʃən` |  |
| ☐ | 14 | dividend | `ˈdɪv.ɪ.dend` |  |
| ☐ | 15 | entrepreneurial | `ˌɒn.trə.prəˈnɜː.ri.əl` |  |
| ☐ | 16 | equity | `ˈek.wɪ.ti` |  |
| ☐ | 17 | expenditure | `ɪkˈspen.dɪ.tʃər` |  |
| ☐ | 18 | fluctuate | `ˈflʌk.tʃu.eɪt` |  |
| ☐ | 19 | forecast | `ˈfɔː.kɑːst` |  |
| ☐ | 20 | incentive | `ɪnˈsen.tɪv` |  |
| ☐ | 21 | inflation | `ɪnˈfleɪ.ʃən` |  |
| ☐ | 22 | insurance | `ɪnˈʃɔː.rəns` |  |
| ☐ | 23 | invoice | `ˈɪn.vɔɪs` |  |
| ☐ | 24 | leverage | `ˈliː.vər.ɪdʒ` | ⚠ GB /ˈliː.vər.ɪdʒ/ vs. /ˈlev.ər.ɪdʒ/ strittig |
| ☐ | 25 | liability | `ˌlaɪ.əˈbɪl.ə.ti` |  |
| ☐ | 26 | merger | `ˈmɜː.dʒər` |  |
| ☐ | 27 | monopoly | `məˈnɒp.əl.i` |  |
| ☐ | 28 | mortgage | `ˈmɔː.ɡɪdʒ` |  |
| ☐ | 29 | outsource | `ˈaʊtˌsɔːs` |  |
| ☐ | 30 | overhead | `ˈəʊ.və.hed` |  |
| ☐ | 31 | portfolio | `ˌpɔːtˈfəʊ.li.əʊ` |  |
| ☐ | 32 | premium | `ˈpriː.mi.əm` |  |
| ☐ | 33 | procurement | `prəˈkjʊə.mənt` |  |
| ☐ | 34 | profitable | `ˈprɒf.ɪ.tə.bəl` |  |
| ☐ | 35 | recession | `rɪˈseʃ.ən` |  |
| ☐ | 36 | revenue | `ˈrev.ə.njuː` |  |
| ☐ | 37 | shareholder | `ˈʃeəˌhəʊl.dər` |  |
| ☐ | 38 | stakeholder | `ˈsteɪkˌhəʊl.dər` |  |
| ☐ | 39 | subsidy | `ˈsʌb.sə.di` |  |
| ☐ | 40 | surplus | `ˈsɜː.pləs` |  |
| ☐ | 41 | turnover | `ˈtɜːnˌəʊ.vər` |  |
| ☐ | 42 | venture | `ˈven.tʃər` |  |
| ☐ | 43 | wholesale | `ˈhəʊl.seɪl` |  |
| ☐ | 44 | audit | `ˈɔː.dɪt` |  |
| ☐ | 45 | collateral | `kəˈlæt.ər.əl` |  |
| ☐ | 46 | arrears | `əˈrɪəz` |  |
| ☐ | 47 | creditor | `ˈkred.ɪ.tər` |  |
| ☐ | 48 | viable | `ˈvaɪ.ə.bəl` |  |
| ☐ | 49 | quota | `ˈkwəʊ.tə` |  |
| ☐ | 50 | solvent | `ˈsɒl.vənt` |  |

---

**500 Einträge, davon 20 als besonders strittig markiert.**
