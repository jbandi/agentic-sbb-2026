# Demo 3: Aus der Spec werden vier vertikale Schnitte

===USER===
/to-tickets Die Spec liegt als GitHub-Issue #1.

===AGENT duration="3 s"===
Ich hole das Issue und schaue mir an, wo im Code die Arbeit anfällt.

===PROGRESS duration="25 s"===
Ich lese Titel und Labels des Eltern-Issues aus, bevor ich schneide.

===TOOL===
$ gh issue view 1 --json title,labels --jq '.title, [.labels[].name]'
Umsteigeverbindungen in der Verbindungssuche
["ready-for-agent"]

===PROGRESS duration="1 min 40 s"===
Bevor ich schneide, will ich eine Zahl: wie viele Kandidaten eine Umsteigesuche im aktuellen Fahrplan überhaupt produziert, bevor irgendetwas gefiltert wird. Ein Wegwerf-Skript über `data/fahrplan.json` rechnet das durch — es gehört nicht ins Repo, sondern dient nur dieser Frage.

===TOOL===
$ node kandidaten.mjs

ZG->BR ab 08:00 minU=5: 1378 roh
LZ->IO ab 08:00 minU=5: 5292 roh
ZUE->BR ab 08:00 minU=0: 9977 roh

===PROGRESS duration="1 min 25 s"===
Die Rohzahlen prägen den Schnitt: Der Dominanzfilter muss vor den zwei Umstiegen stehen. Dazu sehe ich eine Prefactoring-Gelegenheit beim Zusammenbauen der Abschnitte. Ich formuliere jetzt den Ticket-Vorschlag.

===AGENT duration="6 s"===
Fünftausend Kandidaten für eine einzige Anfrage — bei zwölf Stationen. Das ist keine Performance-Frage, sondern eine Reihenfolge-Frage: Der Dominanzfilter muss stehen, **bevor** zwei Umstiege dazukommen, sonst sind die Tests des letzten Tickets nicht mehr lesbar. Das prägt den Schnitt.

Ausserdem eine Gelegenheit zum Prefactoring: Die Suche baut ihre Abschnitte heute inline zusammen, während sie über die Fahrten läuft. Die Umsteigesuche braucht denselben Schritt mehrfach — einmal ab der Startstation, danach ab jeder Umsteigestation. Diesen Schritt vorher herauszuziehen, macht die eigentliche Änderung klein. „Make the change easy, then make the easy change."

Der Vorschlag, vier Tickets:

**1. Prefactor: Abschnitte einer Fahrt wiederverwendbar aus dem Fahrplan ziehen**
*Blocked by:* nichts, kann sofort starten.
*Liefert:* kein neues Verhalten. Die Suche zieht ihre Abschnitte künftig über einen internen Schritt; alle 11 Tests bleiben unverändert grün. Danach ist die Umsteigesuche eine kleine Änderung statt einer grossen.

**2. Verbindungen mit einem Umstieg**
*Blocked by:* 1.
*Liefert:* den Tracer Bullet. `Luzern → Interlaken Ost` findet die Verbindung über Olten. Inklusive Mindestumsteigezeit als optionales Feld mit Default fünf.

**3. Dominierte Verbindungen verwerfen, sortieren und auf fünf kürzen**
*Blocked by:* 2.
*Liefert:* ein lesbares Resultat. Verwerfen → sortieren → kürzen, in dieser Reihenfolge.

**4. Verbindungen mit zwei Umstiegen**
*Blocked by:* 3.
*Liefert:* Ziele, die mit einem Umstieg nicht erreichbar sind. `Zug → Brig` ist der Fall.

Drei Fragen an dich: Ist die Granularität richtig? Sind die Blocking-Kanten korrekt — gatet jedes Ticket wirklich das nächste? Soll etwas zusammengelegt oder weiter aufgeteilt werden?

Eine Kante würde ich verteidigen, weil sie nicht offensichtlich ist: **4 hängt an 3, nicht an 2.** Technisch könnte man zwei Umstiege auch ohne Filter bauen. Aber dann hat das Ticket 1378 Rohkandidaten im Resultat, und niemand kann einen Test dafür schreiben.

===USER===
Granularität passt, die Kanten auch — und die Begründung für 4 → 3 überzeugt mich.

Ticket 1 ist strenggenommen kein vertikaler Schnitt, sondern reines Prefactoring. Das ist in Ordnung, es steht ja bewusst zuoberst und liefert eine überprüfbare Zusage: alle Tests bleiben grün, ohne dass einer angefasst wird. Genau das soll drinstehen.

Bei Ticket 2 hätte ich gerne den 0-Minuten-Umstieg in Olten explizit als Akzeptanzkriterium, nicht nur die Verbindung, die gefunden werden soll. Das ist der Fall, an dem man sieht, ob jemand die Regel wirklich umgesetzt hat oder nur zufällig das richtige Resultat trifft.

Publizier sie so.

===AGENT duration="4 s"===
Aufgenommen. In Ticket 2 stehen jetzt beide Richtungen: die Verbindung, die erscheinen **muss** (`Luzern → Interlaken Ost`, Ankunft 10:33), und die, die **nicht** erscheinen darf (`Zürich HB → Brig`, IC 1 an 08:30 / IC 6 ab 08:30). Ich publiziere die vier Tickets jetzt.

===PROGRESS duration="20 s"===
Ich publiziere in Dependency-Reihenfolge, damit jede Kante auf eine echte Nummer zeigen kann.

===TOOL===
$ gh issue create --title "Prefactor: Abschnitte einer Fahrt wiederverwendbar aus dem Fahrplan ziehen" --label ready-for-agent --body-file t1.md
https://github.com/jbandi/agentic-sbb-example/issues/2

===TOOL===
$ gh issue create --title "Verbindungen mit einem Umstieg" --label ready-for-agent --body-file t2.md
https://github.com/jbandi/agentic-sbb-example/issues/3

===TOOL===
$ gh issue create --title "Dominierte Verbindungen verwerfen, sortieren und auf fuenf kuerzen" --label ready-for-agent --body-file t3.md
https://github.com/jbandi/agentic-sbb-example/issues/4

===TOOL===
$ gh issue create --title "Verbindungen mit zwei Umstiegen" --label ready-for-agent --body-file t4.md
https://github.com/jbandi/agentic-sbb-example/issues/5

===PROGRESS duration="35 s"===
Jetzt die Blocking-Kanten als native GitHub-Abhängigkeiten, nicht nur als Text im Body. Damit sieht man in der Issue-Liste direkt, welches Ticket gerade dran ist.

===TOOL===
$ gh api --method POST repos/jbandi/agentic-sbb-example/issues/3/dependencies/blocked_by -F issue_id=5312846753
3

===TOOL===
$ gh api --method POST repos/jbandi/agentic-sbb-example/issues/5/dependencies/blocked_by -F issue_id=5312847187
5

===PROGRESS duration="55 s"===
Die Kanten stehen. Ich lege die Ticket-Kopien unter `docs/tickets/` ab und committe auf `step-4-tickets`.

===TOOL===
$ git commit -m "Tickets: vier vertikale Schnitte als Issues #2-#5, Kopien unter docs/tickets/"
[step-4-tickets 1da5726] Tickets: vier vertikale Schnitte als Issues #2-#5, Kopien unter docs/tickets/
 4 files changed, 132 insertions(+)

===AGENT duration="5 s"===
Fertig. Die vier Tickets, alle mit `ready-for-agent`:

| Issue | Ticket | Blocked by |
|---|---|---|
| [#2](https://github.com/jbandi/agentic-sbb-example/issues/2) | Prefactor: Abschnitte wiederverwendbar ziehen | — |
| [#3](https://github.com/jbandi/agentic-sbb-example/issues/3) | Verbindungen mit einem Umstieg | [#2](https://github.com/jbandi/agentic-sbb-example/issues/2) |
| [#4](https://github.com/jbandi/agentic-sbb-example/issues/4) | Dominanzfilter, Sortierung, höchstens fünf | [#3](https://github.com/jbandi/agentic-sbb-example/issues/3) |
| [#5](https://github.com/jbandi/agentic-sbb-example/issues/5) | Verbindungen mit zwei Umstiegen | [#4](https://github.com/jbandi/agentic-sbb-example/issues/4) |

Die **Frontier** ist damit genau ein Ticket breit: [#2](https://github.com/jbandi/agentic-sbb-example/issues/2) kann sofort starten, alle anderen warten. Bei einer linearen Kette heisst „die Frontier abarbeiten" schlicht: von oben nach unten.

Das Eltern-Issue [#1](https://github.com/jbandi/agentic-sbb-example/issues/1) habe ich weder geschlossen noch verändert — die Spec bleibt, wie sie ist.

Auf `step-4-tickets` gepusht. Immer noch keine Zeile Produktivcode — aber jetzt gibt es vier Aufgaben, die jede für sich in einen frischen Kontext passen und einzeln überprüfbar sind.

Nächster Schritt: `/implement` nimmt sie in Dependency-Reihenfolge und baut sie mit `/tdd`.
