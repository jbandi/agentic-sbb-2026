# Sonar-Issues klassifizieren und als PR-Tickets erfassen

===USER===
Hole die aktuellen Sonar Issues dieses Projektes.
Klassifiziere und Gruppiere diese Issues.

===AGENT duration="4 s"===
Ich hole die offenen SonarCloud-Issues des Projekts `transgourmet_portal-frontend` über die Web-API und klassifiziere sie anschliessend nach Typ, Severity, Regeln und Dateien.

===PROGRESS duration="28 s"===
Ich rufe die Issues über das Fetch-Skript des sonarcloud-issues-Skills ab und lasse mir die Rohdaten zusätzlich als JSON für die eigene Auswertung ausgeben.

===TOOL===
$ node fetch_issues.mjs transgourmet_portal-frontend --json $TEMP/sonar_portal_frontend.json
Project:  transgourmet_portal-frontend
Statuses: OPEN,CONFIRMED
Total:    165 issues
Effort:   1073 min (~17 h / ~2.2 working days)

== By type ==
  164 CODE_SMELL
    1 VULNERABILITY

== By severity ==
  117 MINOR
   36 MAJOR
    9 CRITICAL
    2 INFO
    1 BLOCKER

== Top rules ==
   42 typescript:S7778 | Do not call `Array#push()` multiple times.
   27 typescript:S1874 | 'data' is deprecated.
   15 typescript:S6478 | Move this component definition out of the parent component
   10 typescript:S7773 | Prefer `Number.parseInt` over `parseInt`.
    8 plsql:S1192      | Define a constant instead of duplicating this literal
    ...

== BLOCKER issues (1) ==
CODE_SMELL | portal-frontend/e2e/tests/sdb-report.spec.ts:5
   Add at least one assertion to this test case.

== Other vulnerabilities (1) ==
MINOR | portal-frontend/server/app.ts:5 | This framework implicitly discloses version information by default.

===PROGRESS duration="46 s"===
Die Übersicht ist geladen (165 Issues). Ich analysiere das JSON noch etwas genauer für die Gruppierung: vollständige Regel-Liste, Severity pro Regel und Detail-Liste aller CRITICAL/BLOCKER-Findings.

===TOOL===
$ node -e "aggregiere Issues nach Regel + liste CRITICAL/BLOCKER"
 42 typescript:S7778  MINOR:42   | Do not call `Array#push()` multiple times.
 27 typescript:S1874  MINOR:27   | 'data' is deprecated.
 15 typescript:S6478  MAJOR:15   | Move this component definition out of the parent component
 10 typescript:S7773  MINOR:10   | Prefer `Number.parseInt` over `parseInt`.
  8 plsql:S1192       CRITICAL:8 | Define a constant instead of duplicating this literal
  6 typescript:S3358  MAJOR:6    | Extract this nested ternary operation
  6 typescript:S6749  MINOR:6    | A fragment with only one child is redundant.
  ... (33 weitere Regeln mit 1-4 Treffern)
---
CRITICAL plsql:S1192 8x in app/features/**/select_*.sql bzw. productinfo.sql
BLOCKER  typescript:S2699 e2e/tests/sdb-report.spec.ts:5 | Add at least one assertion
CRITICAL typescript:S3776 app/shell/oauth.server.ts:109 | Cognitive Complexity 22 statt 15

===PROGRESS duration="22 s"===
Ich prüfe noch, in welchen Dateien die beiden grössten Regel-Gruppen (S1874 „deprecated" und S7778 „mehrfaches push()") liegen — das entscheidet über die Gruppierung.

===TOOL===
$ node -e "Dateien der Regeln S1874 und S7778 auflisten"
S1874: fast ausschliesslich app/common/components/ui/* (dropdown-menu 8, select 7, drawer 4, sheet 4, ...)
S7778: fast ausschliesslich PDF-Report-Exports (alcoholExtractPdfReport 16, sustainable*PdfReport 19, mwstPdfReport 5, ...)

===AGENT duration="55 s"===
## Sonar-Übersicht: `transgourmet_portal-frontend`

**165 offene Issues**, geschätzter Aufwand **~17 h**. Davon **164 Code Smells**, **1 Vulnerability**, 0 Bugs (1 BLOCKER, 9 CRITICAL, 36 MAJOR, 117 MINOR, 2 INFO).

## Klassifikation & Gruppierung

**1. Dringend / einzeln anschauen (11):** Der BLOCKER ist ein E2E-Test ohne Assertion (`sdb-report.spec.ts`). Die 8 CRITICAL (plsql:S1192) sind duplizierte Literale in reinen SELECT-Dateien — Kandidat für eine Regel-Deaktivierung statt Refactoring. Dazu 1 CRITICAL (kognitive Komplexität 22 in `oauth.server.ts`) und die einzige Vulnerability: Express `X-Powered-By`-Header in `server/app.ts` (Einzeiler).

**2. Mechanisch behebbare Massen-Issues (~60):** 42× mehrfaches `Array#push()` fast nur in den PDF-Report-Exports, 10× `Number.parseInt`, 9× Optional Chaining / unnötige Ternaries.

**3. Deprecated API (27, eine Ursache):** „'data' is deprecated" trifft fast nur die shadcn/ui-Komponenten unter `app/common/components/ui/` — besser Update oder Exclusion statt manuellem Fixen.

**4. React-Strukturprobleme (~25):** 15× Komponenten-Definition im Parent (echte Remount-Probleme), 6× verschachtelte Ternaries, 6× redundante Fragments plus Kleinkram.

**5. Modernisierungs-Hinweise (~20, MINOR):** „Prefer X over Y"-Regeln (node:-Imports, `Date.now()`, `.at()` etc.), meist Einzeiler.

Empfehlung: schnelle Wins zuerst (`x-powered-by`, Test-Assertion, oauth-Refactoring), dann Entscheidung über Ausschluss von shadcn-`ui/` und `*.sql` (~35 Issues ohne Codeänderung), und die 42 `push()`-Issues als eine gebündelte Aufgabe.

===USER===
Gruppiere die Tickets ein wenig feingranularer.
Das ziel ist dann pro Gruppe ein Issue zu erfassen und pro issue einen PR zu erstellen. Die Granularität sollte daher den Fokus auf klare PR-Reviews setzen.

===AGENT duration="3 s"===
Ich schaue mir die Verteilung der restlichen Regeln auf die Dateien an, um sinnvolle PR-Schnitte zu finden — Ziel: pro PR ein Muster oder ein Dateicluster.

===PROGRESS duration="35 s"===
Ich lasse mir für alle Regeln ausser den drei grossen Gruppen jede Fundstelle mit Datei und Zeile ausgeben.

===TOOL===
$ node -e "file:line pro Regel ausgeben (ohne S7778/S1874/S1192)"
### typescript:S6478 (15)
    app/common/components/ui/calendar.tsx:124,134,155
    app/features/invoices/components/InvoicesReportTable.tsx:32,43,91
    app/features/rekap-report/components/RekapReportTable.tsx:32,43,86
    app/features/sdb-report/components/SdbReportTable.tsx:31,40,111
    app/features/shipments/components/ShipmentReportTable.tsx:31,42,68
### typescript:S7773 (10)
    app/db/prolixpro-db.server.ts:44,45,46
    app/shell/customers-data-access.server.ts:79,80
    ...
### typescript:S3358 (6)
    app/features/productinformation/... (4), invoices-data-access (1), SdbReportListItem (1)
... (35 weitere Regeln mit allen Fundstellen)

===PROGRESS duration="1 min 20 s"===
Ich verteile jetzt alle 165 Issues überschneidungsfrei auf PR-taugliche Gruppen: Konfig-Entscheidungen getrennt von Code, riskante Refactorings getrennt von mechanischen Änderungen, pro PR ein Muster oder ein Dateicluster.

===AGENT duration="1 min 10 s"===
Die Gruppierung ist fertig — alle 165 Issues sind überschneidungsfrei auf **16 Gruppen** verteilt (jede Gruppe = 1 Issue = 1 PR):

**A. Konfig-Entscheidungen:**
1. shadcn/ui ausschließen oder aktualisieren (31)
2. plsql-Regel S1192 für `*.sql` deaktivieren (8 CRITICAL)

**B. Fokus-PRs mit echtem Review-Bedarf:**
3. `oauth.server.ts` refactoren (4, inkl. Komplexität 22→15)
4. E2E-Test sdb-report reparieren (2, inkl. BLOCKER)
5. ReDoS-Regexes vereinfachen (2)
6. Report-Tabellen: Inline-Komponenten extrahieren (12 — identisches Muster in 4 Dateien)
7. Verschachtelte Ternaries auflösen (7)

**C. Mechanische Muster-PRs:**
8. PDF-Exports alcohol+mwst: `push()` konsolidieren (21)
9. PDF-Exports sustainability: `push()` + Parameter-Objekt (23)
10. JSX-Hygiene in Feature-Komponenten (13)
11. `app/shell` Cleanup ohne oauth (12)
12. DB-Layer Cleanup (6)
13. Server/Node-Infra Cleanup inkl. `x-powered-by`-Vulnerability (6)
14. Common Hooks/Utils modernisieren (7)
15. Feature-Datenzugriff: kleine Vereinfachungen (9)

**D. Kein PR nötig:**
16. TODOs in `env.ts` klären (2)

Summe: 165/165 zugeordnet, keine Datei in zwei PRs. Empfohlene Reihenfolge: erst 1+2 (eliminiert 39 Issues ohne Codeänderung), dann 4 (BLOCKER) und 13 (Vulnerability), danach der Rest in beliebiger Reihenfolge.

Soll ich die 16 Issues als Markdown-Dateien im lokalen Issue-Tracker (`.scratch/sonar-cleanup/`) anlegen, mit jeweils vollständiger Datei:Zeile-Liste pro Issue?

===USER===
Anpassungen:

* Ticket 16 kannst du streichen, ich habe das env.ts gelöscht. Das brauchte es gar nicht mehr ...
* Ticket 1: Wir versuchen ein shadcn update
* Ticket 2: sql Rule auf sonar excluden


Dann bitte die Tickets erfassen

===AGENT duration="3 s"===
Ich lese zuerst die Issue-Tracker-Konventionen des Projekts, dann erfasse ich die 15 Tickets unter `.scratch/sonar-cleanup/`.

===PROGRESS duration="14 s"===
Konventionen sind klar: ein Verzeichnis pro Feature, `spec.md` plus eine Datei pro Ticket unter `issues/NN-<slug>.md` mit `Status:`-Zeile.

===TOOL===
$ Read docs/agents/issue-tracker.md
# Issue tracker: Local Markdown
- One feature per directory: .scratch/<feature-slug>/
- The spec is .scratch/<feature-slug>/spec.md
- Implementation issues are one file per ticket at .scratch/<feature-slug>/issues/<NN>-<slug>.md, numbered from 01
- Triage state is recorded as a Status: line near the top of each issue file
...

===PROGRESS duration="30 s"===
Ich hole noch die exakten Fundstellen der drei grossen Regel-Gruppen. Dabei zeigt sich: 26 der 27 „deprecated"-Findings sind `ElementRef is deprecated` (React-19-Deprecation) — passt gut zum shadcn-Update. Nur `Header.tsx:76` betriffft wirklich `data` und liegt ausserhalb von `ui/` — das verschiebe ich ins Common-Components-Ticket, damit keine Datei in zwei PRs auftaucht.

===TOOL===
$ node -e "file:line für S1874, S7778, S1192 ausgeben"
### typescript:S1874
   app/common/components/Header.tsx:76 | 'data' is deprecated.
   app/common/components/ui/checkbox.tsx:8 | 'ElementRef' is deprecated.
   app/common/components/ui/dropdown-menu.tsx:20,42,58,76,94,118,140,158 | 'ElementRef' is deprecated.
   app/common/components/ui/select.tsx:14,34,51,69,101,113,136 | 'ElementRef' is deprecated.
   ... (drawer, sheet, label, popover)
### typescript:S7778
   alcoholExtractPdfReport.server.ts:43,44,46,52,58,124,132,143
   alcoholExtractPdfReport.ts:44,46,48,54,60,126,134,145
   sustainableRevenuePdfReport.ts / BioPdfReport.ts / LabelPdfReport.ts / mwstPdfReport.ts ...
### plsql:S1192
   8 SQL-Dateien in app/features/**

===PROGRESS duration="25 s"===
Ich schreibe die Übersichts-Spec mit Ticket-Tabelle und empfohlener Reihenfolge.

===TOOL===
$ Write .scratch/sonar-cleanup/spec.md
File created successfully

===PROGRESS duration="1 min 5 s"===
Ich erfasse die Tickets 01-04: shadcn-Update, SQL-Regel-Ausschluss (mit fertigem Konfig-Schnipsel), oauth-Refactoring und der BLOCKER-Testfix.

===TOOL===
$ Write .scratch/sonar-cleanup/issues/01-shadcn-ui-update.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/02-sonar-plsql-rule-exclusion.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/03-oauth-server-refactoring.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/04-e2e-sdb-report-test.md
File created successfully

===PROGRESS duration="1 min 10 s"===
Tickets 05-08: ReDoS-Regexes, Report-Tabellen-Refactoring, verschachtelte Ternaries und die push()-Konsolidierung für alcohol+mwst.

===TOOL===
$ Write .scratch/sonar-cleanup/issues/05-redos-regex.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/06-report-tables-inline-components.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/07-productinformation-nested-ternaries.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/08-pdf-exports-alcohol-mwst-push.md
File created successfully

===PROGRESS duration="1 min 30 s"===
Tickets 09-15: sustainability-PDF-Exports, JSX-Hygiene, shell-, DB-Layer- und Server-Infra-Cleanup sowie die restlichen Vereinfachungen im Feature-Datenzugriff.

===TOOL===
$ Write .scratch/sonar-cleanup/issues/09-pdf-exports-sustainability-push.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/10-jsx-hygiene.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/11-shell-cleanup.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/12-db-layer-cleanup.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/13-server-infra-cleanup.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/14-common-components-hooks-utils.md
File created successfully

===TOOL===
$ Write .scratch/sonar-cleanup/issues/15-feature-data-access-simplifications.md
File created successfully

===AGENT duration="40 s"===
Alle 15 Tickets sind erfasst unter `.scratch/sonar-cleanup/`:

- **spec.md** — Übersicht, Ticket-Tabelle, empfohlene Reihenfolge, sowie der Hinweis, dass die 2 env.ts-TODOs durch die Löschung der Datei obsolet sind.
- **issues/01-15** — je ein Ticket pro PR mit `Status: open`, vollständiger Datei:Zeile-Liste aller Sonar-Findings (inkl. Regel-ID und Severity) und PR-Hinweisen zu Vorgehen, Review-Fokus und Verifikation.

Deine Anpassungen sind eingearbeitet:

- **Ticket 01** ist als **shadcn-Update** formuliert (nicht Exclusion). Dabei aufgefallen: 26 der 27 „deprecated"-Findings sind `ElementRef is deprecated` — das lösen die aktuellen shadcn-Templates direkt.
- **Ticket 02** enthält den fertigen `sonar.issue.ignore.multicriteria`-Schnipsel für den Regel-Ausschluss von `plsql:S1192` auf `**/*.sql`.
- Ticket 16 (env.ts) ist gestrichen.

Zwei bewusste Umverteilungen, damit keine Datei in zwei PRs auftaucht: das S3358-Finding in `invoices-data-access.server.ts` liegt in Ticket 15 statt 07, und beide `Header.tsx`-Findings in Ticket 14. Damit sind 163 Findings auf Tickets verteilt + 2 obsolet = alle 165 abgedeckt, und die PRs sind konfliktfrei parallel bearbeitbar.

Noch ein Hinweis aus der Analyse (in Ticket 08 vermerkt): `alcoholExtractPdfReport.ts` und `alcoholExtractPdfReport.server.ts` sehen nach nahezu identischen Zwillingsdateien aus — beim Umbau lohnt ein kurzer Blick, ob es beide braucht.
