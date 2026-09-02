# Demo 4: Implementierung: rot, grün, Ticket für Ticket

===USER===
/implement Die Tickets #2 bis #5 aus Issue #1. Arbeite sie in Dependency-Reihenfolge ab.

===AGENT duration="3 s"===
Die Naht steht seit dem Grill fest: `sucheVerbindungen(fahrplan, anfrage)`. Dort — und nur dort — schreibe ich Tests. Ich arbeite die Kette von oben nach unten ab und beginne mit dem Prefactor aus Ticket [#2](https://github.com/jbandi/agentic-sbb-example/issues/2).

===PROGRESS duration="3 min 30 s"===
**Ticket [#2](https://github.com/jbandi/agentic-sbb-example/issues/2) — Prefactor.** Kein neues Verhalten, deshalb auch kein neuer Test. Die Zusage lautet: alle 11 bestehenden Tests bleiben grün, ohne dass einer angefasst wird.

Die Suche baut ihre Abschnitte bisher inline, während sie über die Fahrten läuft. Ich ziehe das zu `abschnitteAb(fahrplan, von, fruehestensAb)` heraus — alle Abschnitte, die von einer Station aus in einer einzigen Fahrt erreichbar sind. Genau diesen Schritt braucht die Umsteigesuche gleich mehrfach.

===TOOL===
$ npm test && npm run typecheck && npm run suche -- Bern "Zürich HB" 08:00

 Test Files  2 passed (2)
      Tests  11 passed (11)

> tsc --noEmit

Bern → Zürich HB, ab 08:00

  58min, direkt
    08:32 Bern → 09:30 Zürich HB  [IC 1 Richtung Zürich HB]

===PROGRESS duration="40 s"===
11 Tests, keiner angefasst, CLI-Ausgabe identisch. Die Änderung ist jetzt einfach.

**Ticket [#3](https://github.com/jbandi/agentic-sbb-example/issues/3) — ein Umstieg.** Rot zuerst. Vier neue Tests, darunter die beiden aus den Akzeptanzkriterien: die Verbindung, die erscheinen **muss**, und die, die **nicht** erscheinen darf.

```typescript
it("verwirft einen Umstieg, der die Mindestumsteigezeit nicht erreicht", () => {
  // In Olten kommt der IC 1 um 08:30 an und der IC 6 nach Brig fährt um 08:30 ab.
  // Dieser Umstieg hätte die früheste Ankunft und stünde sonst zuoberst.
  const verbindungen = sucheVerbindungen(fahrplan, {
    von: "ZUE",
    nach: "BR",
    ab: parseZeit("08:00"),
  });

  expect(alsFahrplanzeilen(verbindungen[0]!)).toEqual([
    "08:02 IC 1 ZUE→OL 08:30",
    "09:30 IC 6 OL→BR 11:30",
  ]);
});
```

===TOOL===
$ npm test

   × sucheVerbindungen > findet Luzern → Interlaken Ost mit einem Umstieg in Olten
   × sucheVerbindungen > verwirft einen Umstieg, der die Mindestumsteigezeit nicht erreicht
   × sucheVerbindungen > berücksichtigt eine heraufgesetzte Mindestumsteigezeit

 Test Files  1 failed | 1 passed (2)
      Tests  3 failed | 11 passed (14)

===PROGRESS duration="35 s"===
Rot. Jetzt die Implementierung: `mindestUmsteigezeit` als optionales Feld mit Default 5 und eine rekursive Sammelfunktion, die ab jeder erreichten Station weitersucht — frühestens ab Ankunft plus Mindestumsteigezeit.

===TOOL===
$ npm test

   × sucheVerbindungen > liefert die Verbindungen nach Ankunftszeit sortiert
   × sucheVerbindungen > findet keine Verbindung, wenn die Fahrtrichtung nicht passt

 Test Files  1 failed | 1 passed (2)
      Tests  2 failed | 12 passed (14)

===PROGRESS duration="25 s"===
Die drei neuen Tests sind grün — aber **zwei bestehende brechen**. Die Spec hatte genau einen vorhergesagt. Ich schaue mir beide an, statt sie wegzuschreiben:

| Test | Was er annahm | Warum er bricht |
|---|---|---|
| „nach Ankunftszeit sortiert" | liest `verbindung.abschnitte[0].ankunft` | Der erste Abschnitt **war** die ganze Verbindung, solange es nur Direktverbindungen gab. Jetzt ist es das erste Teilstück. |
| „Fahrtrichtung passt nicht" | `Olten → Luzern` liefert nur Fahrten Richtung Luzern | Stimmt nicht mehr: Mit Umstieg ist Luzern über Zürich erreichbar. |

Der erste Test meinte immer schon die Ankunft der Verbindung — ich ersetze den Zugriff durch `ankunftszeit(verbindung)`. Die Absicht bleibt, nur der Ausdruck wird richtig.

Der zweite behauptet etwas, das mit Umstiegen schlicht falsch ist. Seine Absicht war „die Fahrtrichtung wird respektiert", und die gilt weiterhin — aber pro Abschnitt, nicht pro Verbindung. Ich schreibe ihn darauf um und ergänze die Invariante, dass jeder Abschnitt später ankommt als er abfährt.

Das ist ein Befund für den Review, kein stiller Fix.

===TOOL===
$ npm test && npm run typecheck

 Test Files  2 passed (2)
      Tests  14 passed (14)

> tsc --noEmit

===PROGRESS duration="1 min 10 s"===
**Ticket [#4](https://github.com/jbandi/agentic-sbb-example/issues/4) — Dominanzfilter, Sortierung, Kürzung.** Hier ist die Versuchung gross, die erwarteten Werte aus dem eigenen Code abzulesen. Das wäre ein tautologischer Test: Er kann nie widersprechen. Ich habe die Erwartung deshalb mit einem unabhängigen Skript direkt aus `data/fahrplan.json` hergeleitet, bevor ich den Filter geschrieben habe.

===TOOL===
$ node erwartet.mjs

### LZ→IO maxU=1  (roh 144 → Front 12)
  [0] 1U 08:09 IR 36 LZ→OL 08:52 | 09:03 IC 61 OL→IO 10:33
  [1] 1U 09:09 IR 36 LZ→OL 09:52 | 10:03 IC 61 OL→IO 11:33
  [2] 1U 10:09 IR 36 LZ→OL 10:52 | 11:03 IC 61 OL→IO 12:33

### LZ→IO maxU=2  (roh 5292 → Front 12)
  [0] 1U 08:09 IR 36 LZ→OL 08:52 | 09:03 IC 61 OL→IO 10:33
  [1] 1U 09:09 IR 36 LZ→OL 09:52 | 10:03 IC 61 OL→IO 11:33
  [2] 1U 10:09 IR 36 LZ→OL 10:52 | 11:03 IC 61 OL→IO 12:33

===PROGRESS duration="1 min 50 s"===
Zwei nützliche Erkenntnisse daraus:

1. Aus 5292 Rohkandidaten werden 12 — und die ersten fünf sind bei einem wie bei zwei Umstiegen **identisch**. Der wörtliche Test, den ich jetzt schreibe, überlebt also Ticket [#5](https://github.com/jbandi/agentic-sbb-example/issues/5) unverändert. Das war nicht garantiert.
2. Der Filter reduziert um mehr als das Vierhundertfache. Die Entscheidung im Grill war keine Kosmetik.

Die Umsetzung folgt der in der Spec festgehaltenen Reihenfolge — verwerfen, sortieren, kürzen:

```typescript
return verwirfDominierte(verbindungen).sort(vergleiche).slice(0, MAX_VERBINDUNGEN);
```

`verwirfDominierte` sortiert intern einmal vor, damit ein Dominator immer vor der Verbindung steht, die er dominiert. Ein einziger Durchlauf gegen die bereits behaltenen genügt dann — sonst wären es bei 5292 Kandidaten 28 Millionen Vergleiche.

===TOOL===
$ npm test && npm run typecheck

 Test Files  2 passed (2)
      Tests  16 passed (16)

> tsc --noEmit

===PROGRESS duration="20 s"===
**Ticket [#5](https://github.com/jbandi/agentic-sbb-example/issues/5) — zwei Umstiege.** `Zug → Brig` ist der Fall: Zug liegt nur an der IR 70, Brig nur an der IC 6, und die beiden Linien teilen keine Station. Wieder rot zuerst.

===TOOL===
$ npm test

   × sucheVerbindungen > findet Zug → Brig mit zwei Umstiegen
   × sucheVerbindungen > liefert keine Verbindung mit mehr als zwei Umstiegen

      Tests  2 failed | 16 passed (18)

===PROGRESS duration="25 s"===
Grün wird das mit einer einzigen geänderten Zeile — `MAX_UMSTIEGE` von 1 auf 2. Genau dafür war der rekursive Zuschnitt aus Ticket [#3](https://github.com/jbandi/agentic-sbb-example/issues/3) da.

===TOOL===
$ npm test && npm run typecheck

 ✓ src/domain/zeit.test.ts (6 tests) 2ms
 ✓ src/verbindungssuche.test.ts (12 tests) 368ms

 Test Files  2 passed (2)
      Tests  18 passed (18)

> tsc --noEmit

===PROGRESS duration="35 s"===
Vier Tickets, 18 Tests, Typecheck sauber. Zum Abschluss prüfe ich die beiden Fälle, um die es von Anfang an ging, über die CLI.

===TOOL===
$ npm run suche -- Luzern "Interlaken Ost" 08:00

Luzern → Interlaken Ost, ab 08:00

  2h24, 1 Umstieg
    08:09 Luzern → 08:52 Olten  [IR 36 Richtung Basel SBB]
    09:03 Olten → 10:33 Interlaken Ost  [IC 61 Richtung Interlaken Ost]

===TOOL===
$ npm run suche -- "Zürich HB" Brig 08:00

Zürich HB → Brig, ab 08:00

  3h28, 1 Umstieg
    08:02 Zürich HB → 08:30 Olten  [IC 1 Richtung Genève]
    09:30 Olten → 11:30 Brig  [IC 6 Richtung Brig]

===AGENT duration="6 s"===
Die Tickets [#2](https://github.com/jbandi/agentic-sbb-example/issues/2) bis [#5](https://github.com/jbandi/agentic-sbb-example/issues/5) sind umgesetzt: 18 Tests grün, Typecheck sauber, ein Commit pro Ticket auf `step-5-implement` gepusht.

Der zweite CLI-Aufruf ist der eigentliche Beleg. Der IC 1 steht um 08:30 in Olten, und der IC 6 nach Brig fährt um 08:30 ab. Eine Suche ohne Mindestumsteigezeit hätte diesen Umstieg vorgeschlagen — er hat die früheste Ankunft und stünde damit zuoberst. Physikalisch ist er unmöglich.

Hier steht stattdessen der IC 6 um **09:30**. Nicht weil jemand den Bug gefunden hätte, sondern weil im Grill die Frage gestellt wurde, wie knapp ein Anschluss sein darf.

Als Nächstes `/code-review` gegen `main` — mit einem Befund, den ich selbst schon mitgebracht habe: Die Spec sagte, genau ein bestehender Test müsse angepasst werden. Es waren drei.
