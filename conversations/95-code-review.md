# Demo 5: Code-Review auf zwei Achsen

===USER===
/code-review seit main

===AGENT duration="3 s"===
Fixpunkt ist `main`. Ich pinne den Diff, bestimme die Spec-Quelle und die Standards-Quellen und starte danach beide Review-Achsen parallel.

===PROGRESS duration="15 s"===
Ich pinne den Diff gegen `main`.

===TOOL===
$ git rev-parse main && git log main..HEAD --oneline
01a0f915ac4354a42798db75b78c683bd2a63322
bc531c3 Ticket #5: Verbindungen mit zwei Umstiegen
26dc941 Ticket #4: dominierte Verbindungen verwerfen, sortieren, auf fuenf kuerzen
fb1299f Ticket #3: Verbindungen mit einem Umstieg und Mindestumsteigezeit
7888efa Ticket #2: Abschnitte einer Fahrt wiederverwendbar aus dem Fahrplan ziehen

===PROGRESS duration="25 s"===
Spec ist Issue [#1](https://github.com/jbandi/agentic-sbb-example/issues/1), die Tickets sind [#2](https://github.com/jbandi/agentic-sbb-example/issues/2) bis [#5](https://github.com/jbandi/agentic-sbb-example/issues/5). Als Standards-Quellen habe ich `CLAUDE.md`, `CONTEXT.md` und die beiden ADRs. Ich starte jetzt beide Achsen **parallel** in zwei Sub-Agenten, die sich gegenseitig nicht sehen. Das ist der Punkt: eine Änderung kann jede Konvention einhalten und trotzdem das Falsche bauen. Wer beides in einem Kopf prüft, lässt die eine Achse die andere zudecken.

===TOOL===
$ Agent(subagent_type=general-purpose) x2  # parallel
Achse Standards: CLAUDE.md, CONTEXT.md, ADR 0001, ADR 0002 + Fowler-Smell-Baseline
Achse Spec:      Issue #1 und die Akzeptanzkriterien der Tickets #2-#5
Async agent launched successfully. agentId: a48b3375...
Async agent launched successfully. agentId: a0ab2ee9...

===PROGRESS duration="6 min 45 s"===
Die beiden Sub-Agenten laufen parallel. Während sie arbeiten, prüfe ich mit Wegwerf-Skripten unter `scratchpad/` selbst nach. Zwei Verdachtsmomente: Wird jedes Sortierkriterium überhaupt wirksam? Und stimmt die Behauptung der Spec, dass genau **ein** bestehender Test angepasst werden musste?

===TOOL===
$ npx tsx scratchpad/probe5.ts
OL->LZ Verbindungen: 5
  richtung Abschnitt 1: Luzern | Abschnitte: 1
  richtung Abschnitt 1: Luzern | Abschnitte: 1
  richtung Abschnitt 1: Luzern | Abschnitte: 1
BS->BN erste-Abschnitt-Ankuenfte: [538,571,598,631,658] monoton: true

===PROGRESS duration="4 min 30 s"===
Zwischenstand der beiden Achsen:

- **Spec**: drei bestehende Tests geändert, erlaubt war genau einer; dazu ein abgeschwächter Richtungs-Test und ein Mitternachts-Test, der am Kriterium vorbeiprüft.
- **Standards**: der Default der Mindestumsteigezeit ist nirgends beobachtbar gepinnt, und ein Sortieraufruf wirkt nicht.

Ich prüfe jetzt den Kronzeugen-Fall der Spec, `Zürich HB → Brig`.

===TOOL===
$ npm run suche -- "Zürich HB" Brig 08:00
Zürich HB → Brig, ab 08:00

  3h28, 1 Umstieg
    08:02 Zürich HB → 08:30 Olten  [IC 1 Richtung Genève]
    09:30 Olten → 11:30 Brig  [IC 6 Richtung Brig]

  3h28, 1 Umstieg
    08:02 Zürich HB → 09:00 Bern  [IC 1 Richtung Genève]
    10:02 Bern → 11:30 Brig  [IC 6 Richtung Brig]

  3h28, 1 Umstieg
    09:02 Zürich HB → 09:30 Olten  [IC 1 Richtung Genève]
    10:30 Olten → 12:30 Brig  [IC 6 Richtung Brig]

===PROGRESS duration="1 min 20 s"===
Bestätigt: fünf Plätze, aber nur drei Reisen — und davon sind zwei dieselben zwei Züge. Über den ganzen Fahrplan gemessen sind 101 von 870 Anfragen betroffen. Jetzt messe ich den Default der Mindestumsteigezeit nach.

===TOOL===
$ npx tsx scratchpad/probe4.ts
mindestUmsteigezeit=1 vs. Default: 96 abweichende Anfragen
mindestUmsteigezeit=3 vs. Default: 0 abweichende Anfragen
mindestUmsteigezeit=4 vs. Default: 0 abweichende Anfragen
mindestUmsteigezeit=6 vs. Default: 36 abweichende Anfragen

===PROGRESS duration="1 min 10 s"===
Der Default ist an der Naht nicht scharf gestellt: Werte von drei bis fünf Minuten liefern identische Resultate. Beide Achsen sind zurück und decken sich. Ich schreibe den Bericht.

===PROGRESS duration="1 min 30 s"===
Der Bericht liegt unter `docs/reviews/umsteigeverbindungen.md` und ist committed und gepusht. Abschliessend Tests und Typecheck.

===TOOL===
$ npm test && npm run typecheck
 ✓ src/domain/zeit.test.ts (6 tests) 2ms
 ✓ src/verbindungssuche.test.ts (12 tests) 383ms

 Test Files  2 passed (2)
      Tests  18 passed (18)

> tsc --noEmit

===AGENT duration="6 s"===
Beide Achsen sind zurück und decken sich. Der Bericht liegt unter `docs/reviews/umsteigeverbindungen.md` auf `step-6-code-review`, committed und gepusht. Das Wesentliche:

## Achse Spec

**Drei bestehende Tests geändert — erlaubt war genau einer.** Ticket [#3](https://github.com/jbandi/agentic-sbb-example/issues/3) sagt wörtlich: „das ist die **einzige** erlaubte Änderung an einem bestehenden Test". Lässt man die Testdatei aus `main` gegen die neue Implementierung laufen, sind vier von fünf grün — nur der Luzern-Test fällt, wie vorhergesagt. Die beiden anderen Änderungen waren also nicht erzwungen. Schlimmer: der Richtungs-Test wurde dabei **abgeschwächt**. Die Zusicherung galt vorher für alle Resultate, jetzt nur noch für die direkten. `Olten → Luzern` liefert heute fünf rein direkte Verbindungen — die alte, stärkere Fassung wäre grün geblieben.

**Fünf Plätze, drei Reisen.** Das trifft ausgerechnet den Kronzeugen-Fall der Spec, `Zürich HB → Brig` ab 08:00: Vorschlag eins und zwei sind **dieselben zwei Züge** — derselbe IC 1 ab 08:02, derselbe IC 6 an 11:30. Unterschiedlich ist nur, wo der Umstieg verbucht wird. Der Reisende sitzt in beiden Fällen in denselben Wagen. Von drei Vorschlägen bleibt einer.

Nach dem Buchstaben der Spec ist das korrekt: Gleichstand in allen drei Kriterien ist keine Dominanz. Die Absicht von Story 6 und 7 ist trotzdem verfehlt. 101 von 870 Anfragen sind betroffen. Das ist eine Lücke in der Dominanzdefinition der Spec, kein Bug — und gehört deshalb zurück in Issue [#1](https://github.com/jbandi/agentic-sbb-example/issues/1), nicht still im Code repariert.

**Der Mitternachts-Test prüft nicht, was das Kriterium meint.** Er trifft eine Direktverbindung und läuft unverändert grün gegen `main`. Das eigentliche Risiko — eine Umsteigezeit über die Tagesgrenze — bleibt ungetestet, obwohl der Fahrplan den Fall hergibt.

## Achse Standards

**ADR 0001 verlangt, dass der Default beobachtbar getestet wird.** Kein Test pinnt die fünf Minuten. Der Olten-Test bestünde mit jedem Default ab eins; nachgemessen liefern drei, vier und fünf Minuten über alle Anfragen identische Resultate.

**Ein wirkungsloser Sortieraufruf.** `src/verbindungssuche.ts:164` sortiert eine Liste, die `verwirfDominierte` intern bereits mit demselben Comparator sortiert hat. Nicht falsch, aber folgenlos — und es liest sich wie die Umsetzung von Regel 2, während die Sortierung real im Filter passiert.

## Und ein Befund über die Spec selbst

Zwei Akzeptanzkriterien von Ticket [#4](https://github.com/jbandi/agentic-sbb-example/issues/4) haben keinen Test, und das ist keine Nachlässigkeit: Sie sind an der Naht **nicht beobachtbar**. „Bei gleicher Ankunft und gleich vielen Umstiegen steht die später abfahrende vorn" — die früher abfahrende wird vom Pareto-Filter immer vorher verworfen. Regel 1 des Tickets macht Regel 2 unsichtbar. In 193 Gleichstandspaaren war die Abfahrt ausnahmslos ebenfalls gleich.

Die Kriterien gehören im Ticket als „nicht prüfbar" vermerkt, nicht mit einem Test erzwungen, der die Naht verlassen müsste.

## Fazit

Die Umsetzung ist inhaltlich richtig, ohne Scope Creep, mit unveränderter CLI. Abnahmereif ist der Branch trotzdem nicht: die Zwillingsverbindungen zurück in Issue [#1](https://github.com/jbandi/agentic-sbb-example/issues/1), die stärkere Richtungs-Zusicherung wiederherstellen, drei billige Tests nachziehen.

18 Tests grün, Typecheck sauber, Review committed und gepusht. Keine Code-Änderung — dieser Schritt reviewt nur.
