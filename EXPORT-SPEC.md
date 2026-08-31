# Export-Spezifikation: Konversation für die T3-Code-Demo-App

Du bist ein Coding-Agent und sollst die bisherige Konversation dieser Session
als Markdown-Datei exportieren, damit sie in einer Demo-App angezeigt werden
kann. Halte dich exakt an dieses Format.

## Dateiformat

Eine einzelne UTF-8-Markdown-Datei mit folgendem Aufbau:

```markdown
# Kurzer, prägnanter Titel der Konversation

===USER===
Erste Nachricht des Users, wörtlich übernommen.

===AGENT===
Deine Antwort als Markdown.

===TOOL===
$ npm test
Ausgabe des Befehls...

===AGENT===
Fortsetzung deiner Antwort nach dem Tool-Aufruf.

===USER===
Nächste User-Nachricht.
```

## Regeln

1. **Titel**: Die erste Zeile ist eine `# Überschrift` mit einem kurzen Titel
   (max. ~60 Zeichen), der die Konversation beschreibt. Sie erscheint in der
   Sidebar der Demo-App.

2. **Rollen-Marker**: `===USER===`, `===AGENT===` und `===TOOL===` stehen
   jeweils **allein auf einer eigenen Zeile**, exakt so geschrieben
   (Grossbuchstaben, drei Gleichheitszeichen, keine Einrückung, kein weiterer
   Text auf der Zeile). Jeder Marker beginnt einen neuen Block; ein Block endet
   am nächsten Marker oder am Dateiende.

3. **Alles vor dem ersten Marker wird ignoriert** (ausser der Titel-Überschrift).
   Schreibe dort keinen Inhalt hin.

4. **USER-Blöcke**: Die User-Nachrichten wörtlich und vollständig übernehmen.
   Markdown ist erlaubt.

5. **AGENT-Blöcke**: Deine Antworten als GitHub-Flavored Markdown, so wie du
   sie tatsächlich formatiert hast — mit Code-Blöcken (immer mit
   Sprach-Angabe, z. B. ```typescript), Listen, Tabellen, Inline-Code.
   Überschriften sind erlaubt, aber sparsam einsetzen.

6. **TOOL-Blöcke** (optional, aber erwünscht — sie machen die Session
   authentisch): Für jeden relevanten Tool-/Terminal-Aufruf einen eigenen
   `===TOOL===`-Block einfügen, an der Stelle im Gesprächsverlauf, wo er
   passiert ist.
   - **Erste Zeile**: der Befehl, mit `$ `-Präfix (z. B. `$ npm test`).
   - **Restliche Zeilen**: die Ausgabe als Klartext.
   - **Kein** Markdown und **keine** ```-Fences innerhalb von TOOL-Blöcken —
     der Inhalt wird als Rohtext gerendert. Lange Ausgaben sinnvoll kürzen
     (z. B. auf die letzten ~15 Zeilen).
   - Ein TOOL-Block unterbricht einen AGENT-Block; danach mit `===AGENT===`
     fortfahren, wenn noch Text folgt.

7. **Verboten im Inhalt**: Zeilen, die exakt `===USER===`, `===AGENT===` oder
   `===TOOL===` lauten (sie würden als Marker interpretiert). Falls so etwas
   zitiert werden muss, einrücken oder in einen Code-Block setzen.

8. **Dateiname**: Kleinbuchstaben, Bindestriche, mit zweistelligem
   Nummern-Präfix für die Sortierung: `NN-kurzer-slug.md`
   (z. B. `03-dark-mode-toggle.md`).

## Ausgabe

Gib die komplette Datei als einen einzigen Markdown-Codeblock aus (oder
schreibe sie direkt nach `conversations/NN-slug.md`, falls du Dateizugriff
hast). Keine Erklärungen davor oder danach.
