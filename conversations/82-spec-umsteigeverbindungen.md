# Demo 2: Aus dem Grill wird eine Spec

===USER===
/to-spec Feature: Umsteigeverbindungen für die Verbindungssuche. Der Grill dazu ist bereits gelaufen; die Entscheide stehen in `CONTEXT.md` und in `docs/adr/0001-*.md` und `docs/adr/0002-*.md`, das vollständige Transkript in `../agentic-sbb-2026/conversations/91-grill-umsteigeverbindungen.md`. Lies diese drei Quellen zuerst und synthetisiere daraus die Spec — die Naht ist `sucheVerbindungen()`.

===AGENT duration="3 s"===
Kein Interview diesmal — ich synthetisiere nur, was schon entschieden ist. Als Erstes lese ich die drei Quellen und den aktuellen Stand des Codes.

===PROGRESS duration="35 s"===
Ich sichte den aktuellen Stand: letzter Commit und die vorhandenen ADRs.

===TOOL===
$ git log --oneline -1 && ls docs/adr/
852bce0 Grill: Umsteigeverbindungen geklaert, Glossar und zwei ADRs festgehalten
0001-mindestumsteigezeit-global-statt-pro-bahnhof.md
0002-hoechstens-zwei-umstiege-und-pareto-filter.md

===PROGRESS duration="1 min 20 s"===
Aus dem Grill stehen neun Entscheide fest, aus den ADRs kommt die Begründung, aus `CONTEXT.md` die Sprache. Bevor ich die Spec schreibe, klärt sich das Wichtigste zuerst — die **Naht**, an der getestet wird.

Die Regel lautet: bestehende Nähte vor neuen, so hoch wie möglich, und so wenige wie möglich. Hier ist die ideale Zahl erreichbar, nämlich eins:

| Kandidat | Urteil |
|---|---|
| `sucheVerbindungen(fahrplan, anfrage)` | **Die Naht.** Bestehend, öffentlich, wird auch von der Kommandozeile benutzt. Alle neun Entscheide sind an ihr beobachtbar. |
| Ein neues Modul `umsteigesuche` mit eigener API | Verworfen. Wäre eine zweite Naht und würde Tests gegen Zwischenschritte einladen. |
| Die interne Kandidatensuche pro Umstiegsstufe | Verworfen. Implementierungsdetail; ein Test darauf bricht bei jedem Refactoring. |

Alles Neue wird also eine interne Hilfsfunktion ohne `export`. Das deckt sich mit Q8 aus dem Grill und mit ADR 0002 — ich schreibe es so.

===PROGRESS duration="2 min 00 s"===
Ich schreibe die Spec im Standard-Aufbau. Der Kern:

**Problem** — `Luzern → Interlaken Ost` liefert „Keine Verbindung gefunden", obwohl ein Umstieg in Olten die Reise in zweieinhalb Stunden erledigt. Für den Reisenden sieht das aus, als gäbe es keinen Zug. Tatsächlich hat nur die Suche nicht nachgesehen.

**Lösung** — Verbindungen mit einem oder zwei Umstiegen, machbar ab fünf Minuten Umsteigezeit, dominierte Verbindungen verworfen, höchstens fünf Resultate. Direktverbindungen und Umsteigeverbindungen stehen in derselben Liste und konkurrieren nach denselben Regeln.

**19 User Stories** — von „Als Reisender möchte ich, dass jeder vorgeschlagene Umstieg tatsächlich machbar ist" bis zu den beiden Stories, die das überschreibbare Feld begründen (mit Gepäck und Kind rechnet man anders als mit Rucksack).

Zwei Dinge, die im Grill implizit blieben, mache ich dabei explizit:

1. **Die Reihenfolge der Nachbearbeitung ist bedeutsam**: erst dominierte Verbindungen verwerfen, dann sortieren, dann auf fünf kürzen. Wer zuerst kürzt, wirft womöglich genau die Verbindung weg, die eine andere dominiert hätte.
2. **Scheinumstiege brauchen keine eigene Regel.** Eine Verbindung, die dieselbe Fahrt an einer Zwischenstation künstlich teilt, hat dieselbe Abfahrt und Ankunft wie die Direktverbindung, aber einen Umstieg mehr — der Dominanzfilter erledigt sie nebenbei.

Bei den Testing Decisions halte ich einen Punkt fest, der sonst untergeht: Einer der bestehenden 11 Tests hält heute fest, dass `Luzern → Interlaken Ost` **kein** Resultat liefert. Genau dieses Verhalten hebt das Feature auf — der Test muss angepasst werden, und das soll niemanden überraschen.

===TOOL===
$ gh issue create --title "Umsteigeverbindungen in der Verbindungssuche" --label ready-for-agent --body-file spec.md
https://github.com/jbandi/agentic-sbb-example/issues/1

===PROGRESS duration="45 s"===
Das Issue steht. Ich lege die Kopie unter `docs/specs/` ab, lasse die Tests laufen und committe.

===TOOL===
$ npm test && git commit -m "Spec: Umsteigeverbindungen als Issue #1 publiziert, Kopie unter docs/specs/"

 Test Files  2 passed (2)
      Tests  11 passed (11)

[step-3-spec c414802] Spec: Umsteigeverbindungen als Issue #1 publiziert, Kopie unter docs/specs/
 1 file changed, 94 insertions(+)
 create mode 100644 docs/specs/umsteigeverbindungen.md

===AGENT duration="6 s"===
Die Spec liegt als Issue [#1](https://github.com/jbandi/agentic-sbb-example/issues/1) mit dem Label `ready-for-agent` — kein weiteres Triage nötig, sie ist per Konstruktion agentenfertig. Die 11 bestehenden Tests laufen durch, der Branch `step-3-spec` ist gepusht.

Als Abnahmekriterium für das Feature als Ganzes stehen zwei Fälle in den Further Notes:

| Fall | Erwartung |
|---|---|
| `Zürich HB → Brig` ab 08:00 | Der Umstieg in Olten mit null Minuten (IC 1 an 08:30, IC 6 ab 08:30) darf **nicht** erscheinen. |
| `Luzern → Interlaken Ost` ab 08:00 | Der Umstieg in Olten mit elf Minuten **muss** erscheinen, Ankunft 10:33. |

Der erste Fall ist der interessantere: Diese Verbindung hätte die früheste Ankunft und stünde damit zuoberst. Ohne die Frage aus dem Grill wäre sie im Resultat gelandet, und kein Test hätte angeschlagen.

Noch immer kein Produktivcode — bis hierher ist ausschliesslich Verständnis entstanden, und zwar an einem Ort, an dem es jemand in drei Monaten wiederfindet.

Nächster Schritt: `/to-tickets` schneidet die Spec in vertikale Scheiben, jede für sich demonstrierbar.
