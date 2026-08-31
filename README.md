# T3 Code — Demo-App

Eine kleine Web-App, die das UI eines agentischen Coding-Tools nachbildet.
Gedacht für Vorträge: Konversationen werden aus statischen Dateien geladen und
sehen aus wie echte Sessions mit einem Coding-Agenten.

## Starten

```sh
npm install
npm run dev
```

## Konversationen hinzufügen

Lege eine `.md`-Datei im Ordner `conversations/` ab — sie erscheint automatisch
in der Sidebar (bei laufendem Dev-Server sofort per Hot Reload). Die Sortierung
folgt dem Dateinamen, daher empfiehlt sich ein Nummern-Präfix wie
`02-mein-beispiel.md`.

### Dateiformat

Markdown mit Rollen-Markern, jeweils auf einer eigenen Zeile:

```markdown
# Titel der Konversation

===USER===
Die Frage des Users. Markdown wird unterstützt.

===AGENT===
Die Antwort des Agenten — volles Markdown inkl. Code-Blöcken,
Tabellen und Listen, mit Syntax-Highlighting.

===TOOL===
$ npm test
...erste Zeile ist der Befehl, der Rest ist die Ausgabe.
Wird als aufklappbarer Terminal-Block dargestellt.
```

- Die erste `# Überschrift` vor dem ersten Marker wird als Titel verwendet
  (sonst der Dateiname).
- `===TOOL===`-Blöcke sind optional und lassen die Konversation wie eine echte
  Agenten-Session mit Tool-Aufrufen aussehen.

### Export aus einem echten Agenten

Die Datei [`EXPORT-SPEC.md`](./EXPORT-SPEC.md) ist als Prompt formuliert:
Einfach am Ende einer Session in Claude Code / Claude Desktop / ChatGPT
einfügen („Exportiere diese Konversation gemäss folgender Spezifikation: …"),
und der Agent liefert die fertige `.md`-Datei für `conversations/`.

### Aus Claude / ChatGPT übernehmen

Antworten aus Claude Desktop oder ChatGPT lassen sich direkt als Markdown
kopieren („Copy"-Button unter der Nachricht). Einfach abwechselnd unter
`===USER===` und `===AGENT===` einfügen — die Formatierung (Code-Blöcke,
Listen, Tabellen) bleibt erhalten.
