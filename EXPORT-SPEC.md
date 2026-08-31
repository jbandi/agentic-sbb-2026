# Export-Spezifikation: Konversation für die T3-Code-Demo-App

Du exportierst die bisherige Session als Markdown-Datei für eine Demo-App.
Erzeuge einen klaren Ablauf für jeden User-Prompt.

Die Demo muss auf den ersten Blick nur diese Inhalte zeigen:

1. User-Prompt
2. Sichtbarer Agent-Start
3. Geschlossener Block `Worked for …`
4. Sichtbares Agent-Endergebnis

Die Person in der Demo kann den Arbeitsblock später öffnen. Der Block zeigt
dann alle Fortschrittsmeldungen und Tool-Calls in ihrer ursprünglichen
Reihenfolge.

## Verbindlicher Ablauf pro User-Prompt

Erzeuge für **jeden** User-Prompt die folgenden vier Phasen:

### 1. User-Prompt

Beginne den Turn mit `===USER===`.
Übernimm die User-Nachricht wörtlich und vollständig.

### 2. Sichtbarer Agent-Start

Setze direkt danach genau einen `===AGENT===`-Block.
Verwende die erste relevante Startmeldung des Agenten.
Nenne kurz das Ziel und den nächsten Arbeitsschritt.
Nenne hier noch kein Endergebnis.

### 3. Geschlossener Arbeitsblock

Markiere alle Zwischenmeldungen mit `===PROGRESS===`.
Markiere alle Tool-Aufrufe mit `===TOOL===`.
Halte alle `PROGRESS`- und `TOOL`-Blöcke direkt zusammen.
Erzeuge pro Turn mindestens einen `PROGRESS`-Block.

Wenn keine Zwischenmeldung existiert, formuliere eine kurze Meldung aus den
tatsächlich ausgeführten Arbeitsschritten. Erfinde dabei keine neuen Fakten.

Setze **keinen** `AGENT`- oder `USER`-Block zwischen diese Arbeitsblöcke.
Die Demo fasst die zusammenhängende Folge automatisch unter `Worked for …`
zusammen. Dieser Block ist standardmäßig geschlossen.

Jeder Tool-Call bleibt im Arbeitsblock separat aufklappbar.

### 4. Sichtbares Agent-Endergebnis

Beende den Turn mit genau einem `===AGENT===`-Block.
Verwende die relevante Schlussantwort des Agenten.
Nenne das Ergebnis, die ausgeführten Prüfungen und wichtige Links.
Entferne reine Fortschrittsinformationen aus diesem Block.

## Mehrere User-Prompts

Behandle jeden neuen User-Prompt als neuen Turn.
Beende zuerst den vorherigen Turn mit einem sichtbaren Agent-Endergebnis.
Wiederhole dann den vollständigen Vier-Phasen-Ablauf.
Verwende in jedem Turn genau zwei `AGENT`-Blöcke.

Fasse die Arbeitsblöcke verschiedener User-Prompts niemals zusammen.
Jeder User-Prompt erhält einen eigenen `Worked for …`-Block.

## Beispiel mit zwei User-Prompts

```markdown
# Kurzer, prägnanter Titel der Konversation

===USER===
Erster User-Prompt, wörtlich übernommen.

===AGENT duration="2 s"===
Ich prüfe die betroffenen Dateien und passe die Implementierung an.

===PROGRESS duration="9 s"===
Ich habe die relevanten Codepfade gefunden und beginne mit der Änderung.

===TOOL===
$ rg -n "obsoleteSetting" src
Ausgabe des Befehls...

===PROGRESS duration="41 s"===
Die Änderung ist umgesetzt. Ich führe jetzt die Qualitätsprüfungen aus.

===TOOL===
$ npm test
Test Files  29 passed (29)
Tests       228 passed (228)

===AGENT duration="4 s"===
Die Änderung ist abgeschlossen. Alle 228 Tests laufen erfolgreich durch.

===USER===
Zweiter User-Prompt, wörtlich übernommen.

===AGENT duration="2 s"===
Ich ergänze die gewünschte Dokumentation und prüfe danach den Build.

===PROGRESS duration="12 s"===
Die Dokumentation ist ergänzt. Ich starte jetzt den Build.

===TOOL===
$ npm run build
Build completed successfully.

===AGENT duration="3 s"===
Die Dokumentation ist aktualisiert und der Produktions-Build ist erfolgreich.
```

Die Demo erzeugt aus diesem Beispiel zwei getrennte Arbeitsblöcke:

- `Worked for 50 s`
- `Worked for 12 s`

Schreibe die Texte `Worked for 50 s` und `Worked for 12 s` nicht in die Datei.
Die Demo berechnet und erzeugt diese Titel automatisch.

## Marker und Dauer

Verwende nur diese Rollen-Marker:

- `===USER===`
- `===AGENT===`
- `===AGENT duration="12 s"===`
- `===PROGRESS===`
- `===PROGRESS duration="8 s"===`
- `===TOOL===`

Schreibe jeden Marker allein auf eine Zeile.
Verwende Großbuchstaben und jeweils drei Gleichheitszeichen.
Rücke einen Marker nicht ein.

Die Dauer bei `AGENT` und `PROGRESS` ist optional.
Verwende für die Dauer nur `min` und `s`.
Beispiele sind `35 s` und `2 min 14 s`.

Die Demo zeigt eine Agent-Dauer als `Agent (Dauer: …)`.
Die Demo addiert alle Progress-Dauern eines Arbeitsblocks.
Diese Summe erscheint im Titel `Worked for …`.

Wenn nur die Gesamtdauer bekannt ist, schreibe sie in einen `PROGRESS`-Marker.
Erfinde keine Dauer, wenn keine Zeitangabe verfügbar ist.

## Inhalt der Blöcke

### USER

Übernimm die User-Nachricht wörtlich und vollständig.
Markdown ist erlaubt.

### AGENT

Verwende GitHub-Flavored Markdown.
Verwende `AGENT` nur für den sichtbaren Start und das sichtbare Endergebnis.
Verwende `AGENT` niemals für eine Zwischenmeldung.

### PROGRESS

Übernimm Zwischenmeldungen zur Analyse, Planung und laufenden Arbeit.
Halte jede Meldung kurz und sachlich.
Verwende Markdown nur, wenn es die Meldung klarer macht.

### TOOL

Erzeuge für jeden relevanten Tool-Aufruf einen eigenen `TOOL`-Block.
Schreibe den Befehl mit dem Präfix `$ ` in die erste Zeile.
Schreibe die Ausgabe als Klartext in die nächsten Zeilen.

Verwende keine Markdown-Code-Fences in einem `TOOL`-Block.
Kürze lange Ausgaben auf die relevanten Zeilen.

## Allgemeine Regeln

1. Schreibe eine UTF-8-Markdown-Datei.
2. Verwende als erste Zeile eine kurze `# Überschrift`.
3. Begrenze den Titel auf ungefähr 60 Zeichen.
4. Schreibe vor dem ersten Rollen-Marker keinen weiteren Inhalt.
5. Behalte die zeitliche Reihenfolge aller Nachrichten und Tool-Aufrufe bei.
6. Erfinde keine Ergebnisse, Tool-Aufrufe, Ausgaben, Links oder Zeitangaben.
7. Rücke zitierte Rollen-Marker ein, damit die Demo sie nicht interpretiert.
8. Verwende einen Dateinamen wie `NN-kurzer-slug.md`.

## Prüfung vor der Ausgabe

Prüfe für jeden User-Turn diese Punkte:

- Der Turn beginnt mit genau einem `USER`-Block.
- Danach folgt genau ein sichtbarer `AGENT`-Start.
- Alle Zwischenmeldungen verwenden `PROGRESS`.
- Alle Progress- und Tool-Blöcke bilden eine zusammenhängende Folge.
- Der Turn endet mit genau einem sichtbaren `AGENT`-Endergebnis.
- Der nächste `USER`-Block beginnt erst nach diesem Endergebnis.

Korrigiere den Export, wenn ein Punkt nicht erfüllt ist.

## Ausgabe

Gib die komplette Datei als einen einzigen Markdown-Codeblock aus.
Wenn du Dateizugriff hast, schreibe die Datei nach `conversations/NN-slug.md`.
Gib vor oder nach der Datei keine Erklärung aus.
