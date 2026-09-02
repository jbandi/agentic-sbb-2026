# Demo 1: Grill: Umsteigeverbindungen klären

===USER===
/grill-with-docs

Die Suche soll auch Verbindungen mit Umstieg finden, nicht nur Direktverbindungen. Luzern → Interlaken Ost sollte über Olten funktionieren. 

===AGENT duration="4 s"===
Bevor ich frage, schaue ich mir an, was tatsächlich da ist — ich will keine Frage stellen, deren Antwort im Repo steht.

Ich starte mit dem Testlauf und einer Suche auf der genannten Strecke.

===PROGRESS duration="12 s"===
Ich prüfe zuerst den Ist-Zustand: Tests laufen lassen und Luzern → Interlaken Ost suchen.

===TOOL===
$ npm test

> sbb-fahrplan@0.1.0 test
> vitest run

 RUN  v2.1.9 /Users/jonas/Dev/agentic-sbb-example

 ✓ src/domain/zeit.test.ts (6 tests) 2ms
 ✓ src/verbindungssuche.test.ts (5 tests) 3ms

 Test Files  2 passed (2)
      Tests  11 passed (11)
   Duration  330ms

===TOOL===
$ npm run suche -- Luzern "Interlaken Ost" 08:00

Luzern → Interlaken Ost, ab 08:00

  Keine Verbindung gefunden.

===PROGRESS duration="35 s"===
Keine Verbindung. Ausgangslage, wie ich sie im Code sehe:

- Die Naht ist heute eine einzige Funktion: `sucheVerbindungen(fahrplan, anfrage): Verbindung[]`, mit `Suchanfrage = { von, nach, ab }`.
- Das Datenmodell kann Umstiege bereits: `Verbindung` ist eine Liste von `Abschnitt`en, `anzahlUmstiege()` rechnet `abschnitte.length - 1`. Nur die Suche baut nie mehr als einen Abschnitt.
- `Zeit` sind Minuten seit Mitternacht, Werte ab 1440 liegen am Folgetag. `formatZeit` hängt dann ein `+1` an.
- 11 Tests laufen grün, alle gegen den echten `data/fahrplan.json`.

Jetzt prüfe ich, ob die beiden Hälften der Strecke einzeln existieren.

===TOOL===
$ npm run suche -- Luzern Olten 08:00

Luzern → Olten, ab 08:00

  43min, direkt
    08:09 Luzern → 08:52 Olten  [IR 36 Richtung Basel SBB]

$ npm run suche -- Olten "Interlaken Ost" 08:50

Olten → Interlaken Ost, ab 08:50

  1h30, direkt
    09:03 Olten → 10:33 Interlaken Ost  [IC 61 Richtung Interlaken Ost]

===PROGRESS duration="28 s"===
Beide Hälften existieren einzeln. Als Nächstes suche ich einen Fall, bei dem eine naive Umsteigesuche danebengreifen würde — Zürich HB → Brig über Olten.

===TOOL===
$ npm run suche -- "Zürich HB" Olten 08:00

Zürich HB → Olten, ab 08:00

  28min, direkt
    08:02 Zürich HB → 08:30 Olten  [IC 1 Richtung Genève]

$ npm run suche -- Olten Brig 08:25

Olten → Brig, ab 08:25

  2h00, direkt
    08:30 Olten → 10:30 Brig  [IC 6 Richtung Brig]

===PROGRESS duration="25 s"===
Ankunft und Abfahrt liegen in Olten beide auf 08:30 — der Umstieg wäre rechnerisch 0 Minuten. Zuletzt prüfe ich das Verhalten am Tagesende.

===TOOL===
$ npm run suche -- Genève "Zürich HB" 21:00

Genève → Zürich HB, ab 21:00

  2h48, direkt
    21:42 Genève → 00:30+1 Zürich HB  [IC 1 Richtung Zürich HB]

$ npm run suche -- Genève "Zürich HB" 22:00

Genève → Zürich HB, ab 22:00

  Keine Verbindung gefunden.

===PROGRESS duration="20 s"===
Späte Anfragen liefern schon heute nichts mehr. Ich habe genug Material für die erste Fragerunde.

===AGENT duration="6 s"===
Die Reise, die du meinst, ist also: 08:09 ab Luzern, 08:52 an Olten, 09:03 weiter, 10:33 an Interlaken Ost. **11 Minuten Umsteigezeit in Olten.**

Das ist die einfache Hälfte. Jetzt die Fragen, die ich vorher beantwortet haben will.

## Runde 1

❓ **Q1** — **Wie viele Umstiege sind erlaubt?**: Der Fahrplan hat 12 Stationen und 5 Linien in beiden Richtungen. Ohne Schranke wächst der Suchraum mit jeder Umstiegsstufe, und das Resultat füllt sich mit Kuriositäten (Luzern → Olten → Bern → Spiez → …). Willst du eine harte Obergrenze — 1, 2, oder unbegrenzt?

➡️ Maximal 2 Umstiege. Für Luzern → Interlaken Ost reicht 1; die 2 gibt Luft für Ziele wie Zug → Brig, ohne dass der Suchraum explodiert.

---

❓ **Q2** — **Mindestumsteigezeit**: Das ist keine Formalie. Schau dir an, was der naive Algorithmus für Zürich HB → Brig finden würde — die Läufe oben zeigen es: Der IC 1 kommt um **08:30** in Olten an. Der IC 6 nach Brig fährt um **08:30** in Olten ab. Ein Umstieg mit **0 Minuten** — und weil er der schnellste ist, stünde er zuoberst im Resultat. Die Suche würde eine Reise empfehlen, die niemand schafft.

Also: Brauchen wir eine Mindestumsteigezeit, wie gross, und wo lebt sie? Fest verdrahtete Konstante, oder Feld auf der `Suchanfrage`? Und pro Bahnhof unterschiedlich — Olten ist ein grosser Knoten mit Unterführungen, Spiez nicht?

➡️ 5 Minuten, als optionales Feld `mindestUmsteigezeit` auf der `Suchanfrage` mit Default 5. Bahnhofsspezifische Zeiten würde ich hier **nicht** machen: Der Fahrplan kennt weder Perrons noch Wege, die Werte wären erfunden.

---

❓ **Q3** — **Wo darf umgestiegen werden?**: Nur am selben Halt, also bei gleicher Stations-ID? Oder soll ein Fussweg zwischen zwei nahen Bahnhöfen zählen? Im echten Netz gibt es solche Fälle.

➡️ Nur am selben Halt. Der Fahrplan kennt keine Distanzen zwischen Stationen; ein Fussweg wäre freie Erfindung.

---

❓ **Q4** — **Betriebstag und Mitternacht**: `Zeit` darf über 1440 gehen, das Modell kann das. Die letzte IC 1 des Tages zeigt es — 21:42 ab Genève, 00:30+1 an Zürich HB, eine Stunde später findet die Suche nichts mehr.

Die Frage ist, was mit einem Umstieg passiert, der über Mitternacht ginge. Soll die Suche die Fahrten des Folgetags mitbetrachten (was heissen würde, den Fahrplan zu wiederholen), oder bleibt es beim einen Betriebstag mit dem entsprechenden Abbruch am Abend?

➡️ Ein Betriebstag, keine Wiederholung. Über Mitternacht laufende Reisen sind erlaubt, aber späte Anfragen liefern eben weniger — so wie heute schon.

===USER===
Alles vier so, wie du vorschlägst. Kurz begründet:

**Q1 — max. 2 Umstiege.** In einem Netz mit 12 Bahnhöfen ist eine Reise mit drei Umstiegen kein Reisevorschlag mehr, sondern ein Symptom. Und der Suchraum soll nicht wachsen, nur weil wir zu faul für eine Grenze waren.

**Q2 — 5 Minuten, auf der `Suchanfrage`, Default 5.** Der 0-Minuten-Umstieg in Olten ist genau der Grund, warum ich das nicht als Detail durchwinken will. Als Feld auf der Anfrage, damit man es pro Suche überschreiben kann — jemand mit Koffer und Kind rechnet anders als jemand mit Rucksack.

Bahnhofsspezifische Umsteigezeiten sind **bewusst out of scope**, nicht vergessen. Olten braucht real mehr als ein kleiner Bahnhof, das ist mir klar. Halte das als ADR fest, damit es in drei Monaten niemand als Bug meldet.

**Q3 — nur derselbe Halt.** Fusswege zwischen Bahnhöfen: out of scope.

**Q4 — ein Betriebstag.** Über Mitternacht darf eine Reise gehen, `Zeit` ≥ 1440 ist erlaubt. Fahrten des Folgetags gibt es nicht.

===AGENT duration="3 s"===
Gut, damit ist die erste Ebene gesetzt. Ich zähle kurz die Grösse des Problems aus und formuliere dann die Fragen, die erst jetzt entscheidbar sind.

===PROGRESS duration="15 s"===
Drei Fragen werden erst durch die Zulassung mehrerer Umstiege entscheidbar. Vorher will ich über Zahlen reden statt über Gefühle: Ein Wegwerf-Skript über `data/fahrplan.json` zählt aus, wie gross das Netz überhaupt ist.

===TOOL===
$ npx tsx zaehl.ts

164 Fahrten, 12 Stationen, 5 Linien

===PROGRESS duration="35 s"===
164 Fahrten auf 12 Stationen und 5 Linien — klein genug für eine vollständige Suche, gross genug, dass Varianten derselben Reise das Resultat fluten. Ich formuliere Runde 2.

===AGENT duration="5 s"===
## Runde 2

❓ **Q5** — **Sortierung**: Heute sortiert `sucheVerbindungen` nach Ankunftszeit, bei Gleichstand nach späterer Abfahrt (so steht es im Doc-Comment, der Code macht faktisch nur den ersten Teil). Sobald Umstiege dazukommen, ist das nicht mehr eindeutig: Zwei Verbindungen mit gleicher Ankunft, eine direkt, eine mit zwei Umstiegen — welche zuerst?

Kandidaten: (a) nur Ankunft, (b) Ankunft, dann Umstiege, dann Abfahrt, (c) Reisedauer zuerst.

➡️ (b): früheste Ankunft, dann wenigste Umstiege, dann späteste Abfahrt. Reisedauer als Primärkriterium führt dazu, dass ein späterer, schnellerer Zug einen früher ankommenden verdrängt — das will niemand.

---

❓ **Q6** — **Dominierte Verbindungen**: Weil jede Linie im Stundentakt fährt, produziert eine naive Suche für Luzern → Interlaken Ost dieselbe Reise in Dutzenden Varianten: eine Stunde früher losfahren und in Olten eine Stunde warten, gleiche Ankunft. Die sind für niemanden die bessere Wahl.

Soll die Suche solche Verbindungen verwerfen? Konkret ein Pareto-Filter über (Abfahrt, Ankunft, Umstiege): raus, wenn eine andere existiert, die nicht später abfährt, nicht später ankommt, nicht mehr Umstiege hat — und in mindestens einem davon echt besser ist.

➡️ Ja, filtern. Ohne das ertrinkt das Resultat in Varianten derselben Reise, und die Tests werden unlesbar.

---

❓ **Q7** — **Wie viele Verbindungen im Resultat?**: Heute gibt die Funktion alles zurück, die CLI schneidet auf 3. Bei Umstiegen kann „alles" gross werden. Obergrenze in der Suche, oder weiterhin erst in der Anzeige?

➡️ Obergrenze in der Suche. Ein Resultat, das man in einem Test wörtlich hinschreiben kann, ist mehr wert als Vollständigkeit.

---

❓ **Q8** — **Form der Naht**: Das hier ist die Architekturfrage. Umsteigesuche ist ein anderer Algorithmus als „scanne alle Fahrten". Soll das ein eigenes Modul mit eigener exportierter API werden (z.B. `umsteigesuche.ts`, direkt testbar), oder bleibt `sucheVerbindungen` die einzige öffentliche Schnittstelle und alles Neue ist intern?

➡️ Eine Naht. Alles, was neu entsteht, ist eine interne Hilfsfunktion ohne `export`. Sonst testen wir am Ende die Zwischenschritte statt das Verhalten.

===USER===
**Q5 — (b).** Früheste Ankunft, dann wenigste Umstiege, dann späteste Abfahrt. Das letzte Kriterium ist mir wichtig: Wer später losfahren kann und gleich ankommt, gewinnt. Eine Stunde länger schlafen ist ein echter Vorteil.

**Q6 — ja, Pareto-Filter, genau wie du ihn beschreibst.** Nicht später abfahren, nicht später ankommen, nicht mehr Umstiege, und in mindestens einem echt besser. Das ist die Regel. Auch das gehört als ADR festgehalten — es ist die Art Entscheid, die jemand später „aufräumt", weil er nicht sieht, warum sie da ist.

**Q7 — höchstens 5.** Drei ist mir bei Umstiegen zu knapp, zehn liest niemand.

**Q8 — eine Naht, `sucheVerbindungen(fahrplan, anfrage)`.** Kein neues öffentliches Modul, keine neue exportierte API. Getestet wird ausschliesslich dort, gegen den echten `data/fahrplan.json`, so wie die bestehenden 11 Tests. Interne Hilfsfunktionen werden nicht exportiert und nicht direkt getestet.

===AGENT duration="3 s"===
Aufgenommen. Ich prüfe, was aus diesen vier Antworten noch offen bleibt, und stelle die letzte Frage.

===PROGRESS duration="30 s"===
Aus Q7 und Q8 folgt genau eine offene Frage: Die Suche liefert neu bis zu 5 Verbindungen, die CLI schneidet auf 3. `src/cli.ts` kann mehrere Abschnitte bereits korrekt ausgeben — `beschreibe()` mappt über `abschnitte` und schreibt „1 Umstieg" statt „direkt", sobald `anzahlUmstiege() > 0`. Damit ist die Frontier auf einen Punkt geschrumpft.

===AGENT duration="4 s"===
## Runde 3

Nur noch eine, sie ergibt sich aus Q7 und Q8:

❓ **Q9** — **Was zeigt die CLI?**: `src/cli.ts` schneidet heute auf 3 Verbindungen und kann mehrere Abschnitte bereits korrekt ausgeben — `beschreibe()` mappt über `abschnitte` und schreibt „1 Umstieg" statt „direkt", sobald `anzahlUmstiege() > 0`. Soll sie bei 3 bleiben, oder alle 5 zeigen? Und soll sie die Wartezeit am Umsteigebahnhof explizit ausweisen?

➡️ Bei 3 bleiben, keine Änderung an `cli.ts`. Die Umsteigezeit steht implizit da (Ankunft der einen Zeile, Abfahrt der nächsten); sie zusätzlich auszurechnen wäre neue Anzeigelogik für ein Problem, das niemand gemeldet hat.

===USER===
Einverstanden, CLI bleibt unverändert. Sie kann mehrere Abschnitte schon darstellen — dann soll sie es einfach tun.

===AGENT duration="2 s"===
Dann ist nichts mehr offen. Ich stelle die Entscheide zusammen und markiere, was als ADR festgehalten werden muss.

===PROGRESS duration="12 s"===
Neun Entscheide aus drei Runden zusammengetragen, dazu die bewussten Auslassungen. Zwei Entscheide prüfe ich gegen die ADR-Kriterien: schwer umkehrbar, ohne Kontext überraschend, echter Trade-off.

===AGENT duration="5 s"===
Damit ist die Frontier leer. Zusammenfassung, bevor ich irgendetwas schreibe:

| # | Entscheid |
|---|---|
| 1 | Maximal **2 Umstiege** (höchstens 3 Abschnitte) |
| 2 | **Mindestumsteigezeit 5 Min**, optionales Feld `mindestUmsteigezeit` auf der `Suchanfrage`, Default 5 |
| 3 | Umstieg **nur am selben Halt** (gleiche Stations-ID), keine Fusswege |
| 4 | Sortierung: **Ankunft → Umstiege → späteste Abfahrt** |
| 5 | **Dominierte Verbindungen** werden verworfen (Pareto über Abfahrt/Ankunft/Umstiege) |
| 6 | Höchstens **5 Verbindungen** im Resultat |
| 7 | **Ein Betriebstag**; über Mitternacht erlaubt (`Zeit` ≥ 1440), keine Fahrten des Folgetags |
| 8 | **Eine Naht**: `sucheVerbindungen(fahrplan, anfrage)`, nichts Neues exportiert |
| 9 | `cli.ts` unverändert, zeigt weiterhin 3 |

Bewusst **out of scope**: bahnhofsspezifische Umsteigezeiten, Fusswege zwischen Bahnhöfen, Fahrten des Folgetags, mehr als 2 Umstiege.

Zwei Entscheide erfüllen alle drei ADR-Kriterien — schwer umkehrbar, ohne Kontext überraschend, echter Trade-off:

- **Globale statt bahnhofsspezifische Mindestumsteigezeit.** Ohne Notiz meldet jemand „Olten braucht mehr als 5 Minuten" als Bug.
- **Zwei Umstiege plus Pareto-Filter.** Ohne Notiz „räumt" jemand den Filter weg, weil er wie eine willkürliche Einschränkung aussieht.

Passt das so, oder habe ich etwas verdreht?

===USER===
Passt genau. Schreib es fest: das Glossar in `CONTEXT.md`, die beiden ADRs. Noch keinen Produktivcode.

===AGENT duration="3 s"===
Ich schreibe das Glossar in `CONTEXT.md` und die beiden ADRs, danach Tests und Typecheck. Produktivcode bleibt unberührt.

===PROGRESS duration="40 s"===
`CONTEXT.md` mit 15 Begriffen (Fahrplan / Reisen / Zeit) und die beiden ADR-Dateien sind geschrieben. Beim Schreiben habe ich zwei Unterscheidungen scharf gezogen, die im Grill implizit blieben: Umsteigezeit gegen Mindestumsteigezeit, Station gegen Halt. Jetzt Tests und Typecheck.

===TOOL===
$ npm test && npm run typecheck

 ✓ src/domain/zeit.test.ts (6 tests) 2ms
 ✓ src/verbindungssuche.test.ts (5 tests) 3ms

 Test Files  2 passed (2)
      Tests  11 passed (11)

> sbb-fahrplan@0.1.0 typecheck
> tsc --noEmit

===PROGRESS duration="20 s"===
11 Tests grün, Typecheck sauber, kein Produktivcode angefasst. Ich committe.

===TOOL===
$ git add -A && git commit -m "Grill: Umsteigeverbindungen geklaert, Glossar und zwei ADRs festgehalten"

[step-2-grill 852bce0] Grill: Umsteigeverbindungen geklaert, Glossar und zwei ADRs festgehalten
 3 files changed, 175 insertions(+)
 create mode 100644 CONTEXT.md
 create mode 100644 docs/adr/0001-mindestumsteigezeit-global-statt-pro-bahnhof.md
 create mode 100644 docs/adr/0002-hoechstens-zwei-umstiege-und-pareto-filter.md

===AGENT duration="6 s"===
Geschrieben:

- **`CONTEXT.md`** — Glossar mit 15 Begriffen, gruppiert in Fahrplan / Reisen / Zeit. Jeder Eintrag hat eine Definition und die explizit vermiedenen Synonyme, damit die Sprache nicht driftet:

```md
**Abschnitt**:
Das Teilstück einer Verbindung, das ohne Zugwechsel in einer einzigen Fahrt
zurückgelegt wird — von der Einstiegs- bis zur Ausstiegsstation.
_Avoid_: Leg, Segment, Teilstrecke, Etappe

**Umsteigezeit**:
Die Zeitspanne zwischen der Ankunft des einen Abschnitts und der Abfahrt des
nächsten, an derselben Station. Die tatsächlich anfallende Zeit einer
konkreten Verbindung.
_Avoid_: Transfer Time, Wartezeit, Anschlusszeit
```

Zwei Unterscheidungen, die im Grill implizit blieben und die ich beim Schreiben scharf gezogen habe: **Umsteigezeit** ist die anfallende Zeit, **Mindestumsteigezeit** die Schranke — nicht dasselbe Wort für beides. Und **Station** ist der Ort, **Halt** das Ereignis; der Code hält das bereits sauber auseinander.

- **`docs/adr/0001-mindestumsteigezeit-global-statt-pro-bahnhof.md`** — mit dem 0-Minuten-Umstieg in Olten als Beleg im Kontext.
- **`docs/adr/0002-hoechstens-zwei-umstiege-und-pareto-filter.md`** — Schranke und Filter zusammen, weil sie dasselbe Problem von zwei Seiten lösen.

Auf `step-2-grill` gepusht. 11 Tests grün, Typecheck sauber, kein Produktivcode berührt.

Die neun Entscheide sind jetzt die Grundlage für die Spec — und der 0-Minuten-Umstieg in Olten ist der Testfall, an dem sich zeigt, ob die Implementierung sie wirklich umgesetzt hat.
