# SonarCloud-Issues gruppieren und beheben

===USER===
/sonarcloud-issues gruppiere die aktuellen Sonar Issues und zeige mir diese

===AGENT duration="3 s"===
Ich hole die aktuellen SonarCloud-Issues. Zuerst ermittle ich den Projekt-Key.

===PROGRESS duration="11 s"===
Ich suche zunächst nach einer `sonar-project.properties` im Workspace und prüfe parallel, ob der Key stattdessen in den CI-Dateien gesetzt wird.

===TOOL===
$ ls "D:/sources/portal-workspace/portal-frontend/portal-frontend/sonar-project.properties"
Exit code 2

Glob-Suche nach **/sonar-project.properties in D:/sources/portal-workspace:
.claude\worktrees\sonar-cleanup-exclusions-2b54ef\sonar-project.properties
D:\sources\portal-workspace\portal-frontend\sonar-project.properties

===TOOL===
$ cat D:\sources\portal-workspace\portal-frontend\sonar-project.properties
# Wiederholte String-Literale sind in statischen SELECTs normal.
# Nur plsql:S1192 ausschliessen; alle anderen PL/SQL-Regeln bleiben aktiv.
sonar.issue.ignore.multicriteria=plsqlS1192
sonar.issue.ignore.multicriteria.plsqlS1192.ruleKey=plsql:S1192
sonar.issue.ignore.multicriteria.plsqlS1192.resourceKey=portal-frontend/**/*.sql

===PROGRESS duration="8 s"===
Die Properties-Datei enthält nur eine Ausschlussregel, keinen Projekt-Key. Laut Skill-Spezifikation überschreibt ein Key aus den CI-Argumenten die Properties-Datei — ich sehe im Jenkinsfile nach.

===TOOL===
$ grep -n "sonar" "D:/sources/portal-workspace/portal-frontend/Jenkinsfile"
19:  - name: sonar-scanner
20:    image: artifactory.transgourmet.ch/transgourmet-docker/cicd/sonar-scanner-cli:11
62:                container('sonar-scanner') {
63:                    withSonarQubeEnv(installationName: 'sonar-cloud') {
79:                            sonar-scanner -Dsonar.projectKey=transgourmet_portal-frontend -Dsonar.sources=./portal-frontend -Dsonar.organization=transgourmet-schweiz ${sonarArgs}

===PROGRESS duration="14 s"===
Projekt-Key ist eindeutig: `transgourmet_portal-frontend`. Ich rufe jetzt die offenen Issues ab und lege die Rohdaten zusätzlich als JSON ab.

===TOOL===
$ node "C:/Users/jonas.bandi/.claude/skills/sonarcloud-issues/scripts/fetch_issues.mjs" transgourmet_portal-frontend --json ".scratch/sonar-issues.json"
Exit code 1
ERROR: the token in D:/sources/.env was rejected by SonarCloud (HTTP 401).

===PROGRESS duration="9 s"===
Der Abruf scheitert an HTTP 401. Ich prüfe, ob die Variable überhaupt vorhanden ist und ob es ein reines Formatproblem in der `.env` ist.

===TOOL===
$ grep -o "^[A-Z_]*=" "D:/sources/.env"
BITBUCKET_API_TOKEN=
SONAR_CLOUD_API_TOKEN=
WWSMONITOR_KIBANA_API_KEY=

===TOOL===
$ node -e "… fetch https://sonarcloud.io/api/authentication/validate mit Token-Prefix-Ausgabe …"
Permission for this action was denied by the Claude Code auto mode classifier.
Reason: [Credential Materialization] The script echoes a slice of the live SONAR_CLOUD_API_TOKEN
(prefix chars and length) to stdout via console.log.

===PROGRESS duration="16 s"===
Der Sicherheits-Classifier blockiert zu Recht jede Ausgabe von Token-Bestandteilen. Ich teste die Gültigkeit deshalb ohne den Token oder Teile davon auszugeben, und prüfe vorher, welches Auth-Schema das Skript verwendet.

===TOOL===
$ grep -n "Authorization\|Basic\|Bearer\|SONAR_CLOUD_API_TOKEN" fetch_issues.mjs
42:  const TOKEN_VARS = ['SONAR_CLOUD_API_TOKEN'];
60:  const headers = { Authorization: 'Bearer ' + token };
64:  const check = await fetch('https://sonarcloud.io/api/components/show?component=' + …

===TOOL===
$ node -e "… Basic-Auth gegen validate und components/show, ohne Token-Ausgabe …"
basic-validate 200 {"valid":false}
basic-component 401

===PROGRESS duration="12 s"===
SonarCloud meldet den Token selbst als ungültig — sowohl mit Bearer- als auch mit Basic-Auth. Ich prüfe noch, ob die `.env`-Zeile formal beschädigt ist, damit ich eine Fehlkonfiguration ausschliessen kann.

===TOOL===
$ node -e "… strukturelle Prüfung der .env-Zeile, keine Token-Ausgabe …"
hasQuotes false
hasSpace false
hasHash false
looksLikeSonarToken false
empty false

===PROGRESS duration="13 s"===
Die Zeile ist formal in Ordnung, der Wert hat aber kein `squ_`/`sqa_`-Präfix — also ein Token im alten Format. Ich prüfe abschliessend, ob es einen alternativen Zugriffsweg über einen SonarQube-MCP-Server oder die `sonarqube-cli` gibt.

===TOOL===
$ ToolSearch "sonarqube issues list"
Keine SonarQube-MCP-Tools gefunden (nur CronList, ListMcpResourcesTool, list_sessions, list_connected_browsers).

===TOOL===
$ which sonar sonarqube-cli
/usr/bin/bash: line 1: sonar: command not found

===AGENT duration="9 s"===
Ich komme aktuell nicht an die Issues heran — das ist ein Auth-Problem, kein Skript-Problem:

**Der SonarCloud-Token in `D:/sources/.env` ist ungültig.**

Was ich geprüft habe:
- Project Key sauber ermittelt: `transgourmet_portal-frontend` (aus `Jenkinsfile:79`, `-Dsonar.projectKey=...`)
- Skript-Aufruf → `HTTP 401`
- Gegenprobe direkt gegen `api/authentication/validate`: SonarCloud antwortet `{"valid": false}` — sowohl mit Bearer- als auch mit Basic-Auth
- Die Zeile in der `.env` ist formal in Ordnung (keine Quotes, keine Leerzeichen, kein Kommentar), aber der Wert hat kein `squ_`/`sqa_`-Präfix, ist also ein Token im alten Format — vermutlich abgelaufen oder widerrufen
- Alternative Wege existieren hier nicht: kein `sonarqube-cli` installiert, kein SonarQube-MCP-Server verbunden

**Nächster Schritt (musst du machen, ich fasse keine Credentials an):**

1. Neuen Token erzeugen: https://sonarcloud.io/account/security
2. In `D:/sources/.env` die Zeile `SONAR_CLOUD_API_TOKEN=` mit dem neuen Wert ersetzen

Danach sag einfach Bescheid, dann hole ich die Issues und liefere dir die gruppierte Auswertung (Totals, Severities, Top-Rules, Top-Files, Blocker im Detail).

===USER===
Ich habe das Token aktualisiert. Versuch nochmals.

===AGENT duration="2 s"===
Ich starte den Abruf der offenen Issues für `transgourmet_portal-frontend` erneut und werte sie anschliessend gruppiert aus.

===PROGRESS duration="15 s"===
Ich rufe die Issues mit dem aktualisierten Token ab und speichere die Rohdaten als JSON für die anschliessende Detailauswertung.

===TOOL===
$ node fetch_issues.mjs transgourmet_portal-frontend --json ".scratch/sonar-issues.json"
Project:  transgourmet_portal-frontend
Statuses: OPEN,CONFIRMED
Total:    18 issues
Effort:   95 min (~1 h / ~0.2 working days)

== By type ==
   18 CODE_SMELL

== By severity ==
   17 MINOR
    1 MAJOR

== Top 15 rules ==
   14 typescript:S6759 | Mark the props of the component as read-only.
    1 typescript:S7780 | `String.raw` should be used to avoid escaping `\`.
    1 typescript:S1607 | Remove this unit test or explain why it is ignored.
    1 typescript:S6551 | 'cause' will use Object's default stringification format
    1 typescript:S7765 | Use `.includes()` instead of `.some()` when checking value existence.

== Top 10 files ==
    3 portal-frontend/app/features/invoices/components/InvoicesReportTable.tsx
    3 portal-frontend/app/features/rekap-report/components/RekapReportTable.tsx
    3 portal-frontend/app/features/sdb-report/components/SdbReportTable.tsx
    3 portal-frontend/app/features/shipments/components/ShipmentReportTable.tsx
    1 portal-frontend/app/common/components/ui/calendar.tsx
    1 portal-frontend/app/common/components/ui/sheet.tsx
    1 portal-frontend/e2e/pages/SdbReportPage.ts
    1 portal-frontend/e2e/tests/sdb-report.spec.ts
    1 portal-frontend/app/shell/oauth.server.ts
    1 portal-frontend/app/common/components/useSelectableItems.ts

===PROGRESS duration="12 s"===
Der Abruf funktioniert. Für die Gruppierung nach Regel inklusive Datei und Zeilennummer werte ich das Roh-JSON separat aus.

===TOOL===
$ node -e "… Gruppierung des Roh-JSON nach Regel mit file:line …"
### typescript:S6759  (14)  [MINOR]
    Mark the props of the component as read-only.
    - app/common/components/ui/calendar.tsx:153  (5min)
    - app/common/components/ui/sheet.tsx:53  (5min)
    - app/features/invoices/components/InvoicesReportTable.tsx:20, 32, 42
    - app/features/rekap-report/components/RekapReportTable.tsx:20, 34, 44
    - app/features/sdb-report/components/SdbReportTable.tsx:22, 34, 44
    - app/features/shipments/components/ShipmentReportTable.tsx:19, 31, 41

### typescript:S7780  (1)  [MINOR]
    - e2e/pages/SdbReportPage.ts:39  (5min)

### typescript:S1607  (1)  [MAJOR]
    Remove this unit test or explain why it is ignored.
    - e2e/tests/sdb-report.spec.ts:14  (10min)

### typescript:S6551  (1)  [MINOR]
    - app/shell/oauth.server.ts:306  (5min)

### typescript:S7765  (1)  [MINOR]
    - app/common/components/useSelectableItems.ts:36  (5min)

===AGENT duration="11 s"===
Token funktioniert. Hier die aktuellen Sonar-Issues für `transgourmet_portal-frontend`:

## Überblick

**18 Issues · ~95 min Aufwand · alles Code Smells** — keine Bugs, keine Vulnerabilities.

| Severity | Anzahl |
|---|---|
| MAJOR | 1 |
| MINOR | 17 |

Keine BLOCKER, keine CRITICAL.

## Gruppiert nach Regel

### 1. `typescript:S6759` — Props als `readonly` markieren · 14× MINOR · 70 min
Mit Abstand der dominante Block (78 % aller Issues). Sehr gleichförmiges Muster — die vier Report-Tabellen haben je 3 Treffer.

| Datei | Zeilen |
|---|---|
| InvoicesReportTable.tsx | 20, 32, 42 |
| RekapReportTable.tsx | 20, 34, 44 |
| SdbReportTable.tsx | 22, 34, 44 |
| ShipmentReportTable.tsx | 19, 31, 41 |
| calendar.tsx | 153 |
| sheet.tsx | 53 |

**Das ist ein Codemod-Kandidat:** In einem Durchgang erledigt man 14 von 18 Issues.

Anmerkung: `calendar.tsx` und `sheet.tsx` sind shadcn/ui-Komponenten — genau der Bereich, den der Branch `feature/sonar-cleanup-01-shadcn-ui-update` anfasst.

### 2. `typescript:S1607` — Ignorierter Test · 1× **MAJOR** · 10 min
`e2e/tests/sdb-report.spec.ts:14` — ein übersprungener Test. Das einzige MAJOR-Issue und inhaltlich das relevanteste.

### 3. `typescript:S6551` — `cause` stringifiziert zu `[object Object]` · 1× MINOR · 5 min
`app/shell/oauth.server.ts:306` — im Fehlerpfad des OAuth-Handlings. Von den Kleinigkeiten die einzige mit echtem Nutzen: aktuell geht dort im Log vermutlich die Ursache verloren.

### 4. `typescript:S7765` — `.some()` → `.includes()` · 1× MINOR · 5 min
`app/common/components/useSelectableItems.ts:36`

### 5. `typescript:S7780` — `String.raw` statt Escaping · 1× MINOR · 5 min
`e2e/pages/SdbReportPage.ts:39`

## Einschätzung

Der Zustand ist gut — nichts Sicherheitsrelevantes, nichts Blockierendes. Sinnvolle Reihenfolge:

1. **S6759-Sweep** (14 Issues, ein Change) — grösster Hebel
2. **S1607** im e2e-Test — das einzige MAJOR, braucht eine inhaltliche Entscheidung
3. Die drei Einzelfälle als Sammel-Commit

Soll ich mit dem S6759-Sweep anfangen?

===USER===
Ignorierter Test: Kommentar steht eigentlich in MISSING_SDB_TEST_DATA. Bitte code so ergänzen, dass Sonar zufrieden ist.
Alle issues bitte beheben. Auf einem eigenen Branch mit Prefix 'KUN-388' in einem worktree. Dann PR auf Bitbucket erstellen.

===AGENT duration="3 s"===
Ich lege einen Worktree mit einem eigenen `KUN-388`-Branch an und behebe darin alle 18 Issues. Vorher prüfe ich, auf welchem Stand der Branch aufsetzen muss.

===PROGRESS duration="18 s"===
Zwei der Issues liegen in `calendar.tsx` und `sheet.tsx`. Diese Dateien werden vom lokalen Branch `feature/sonar-cleanup-01-shadcn-ui-update` umgeschrieben. Ich prüfe, ob dieser Commit bereits auf develop ist.

===TOOL===
$ git log --oneline develop -3 && git branch --contains d2ed66b -a
a664570 Merged in feature/sonar-cleanup-02-sql-exclusion (pull request #66)
094e653 Sonar-Cleanup 02: plsql:S1192 gezielt ausschliessen
3d5cb6e Merged in feature/sdb-report-pdf-button-id (pull request #65)
--- is d2ed66b on develop? ---
* feature/sonar-cleanup-01-shadcn-ui-update
  remotes/origin/HEAD -> origin/develop
  remotes/origin/develop

===TOOL===
$ git show --stat d2ed66b && git ls-remote --heads origin feature/sonar-cleanup-01-shadcn-ui-update
Sonar-Cleanup 01: shadcn/ui-Komponenten auf React-19-Muster aktualisieren
 .../app/common/components/ui/calendar.tsx          |  86 +++---
 portal-frontend/app/common/components/ui/sheet.tsx | 116 ++++----
 8 files changed, 464 insertions(+), 452 deletions(-)
=== remote branch exists? ===
(keine Ausgabe — Branch nicht auf origin)

===TOOL===
$ git show develop:.../sheet.tsx | sed -n '45,70p'
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (

===PROGRESS duration="22 s"===
Bestätigt: Auf develop steht `sheet.tsx` noch auf `React.forwardRef` — genau das Muster, das der unmergte Branch entfernt. Ein develop-basierter KUN-388-Branch würde Code anfassen, den der andere Branch löscht. Das ist eine Entscheidung, die den Umfang der Arbeit ändert, deshalb frage ich nach.

===TOOL===
$ AskUserQuestion "Worauf soll KUN-388 basieren bzw. wie gehe ich mit calendar.tsx/sheet.tsx um?"
Optionen: (1) Auf develop, ohne shadcn-Dateien  (2) Auf develop, alle 18  (3) Auf dem shadcn-Branch stapeln
Antwort des Users: "Ich habe den shadcn branch bereits auf develop gemerged. Daher stand von develop verwenden."

===TOOL===
$ git fetch origin --prune && git log --oneline origin/develop -5 && git merge-base --is-ancestor d2ed66b origin/develop
1390153 Merged in feature/sonar-cleanup-01-shadcn-ui-update (pull request #67)
d2ed66b Sonar-Cleanup 01: shadcn/ui-Komponenten auf React-19-Muster aktualisieren
a664570 Merged in feature/sonar-cleanup-02-sql-exclusion (pull request #66)
=== shadcn commit on origin/develop? ===
JA - d2ed66b ist in origin/develop

===PROGRESS duration="14 s"===
Der shadcn-Commit ist über PR #67 auf origin/develop. Damit entfällt der Konflikt und ich kann auf develop basieren und alle 18 Issues in einem Branch beheben. Ich lege den Worktree an.

===TOOL===
$ EnterWorktree KUN-388-sonar-cleanup
Created worktree at .claude\worktrees\KUN-388-sonar-cleanup on branch worktree-KUN-388-sonar-cleanup.

===TOOL===
$ git branch -m KUN-388-sonar-cleanup && git merge-base --is-ancestor origin/develop HEAD
## KUN-388-sonar-cleanup
=== base ok? ===
HEAD enthaelt origin/develop

===PROGRESS duration="12 s"===
Branch heisst jetzt `KUN-388-sonar-cleanup` und sitzt auf origin/develop. Ich lese die betroffenen Dateien, um das konkrete Muster hinter den 14 S6759-Findings zu verstehen.

===TOOL===
$ cat app/features/invoices/components/InvoicesReportTable.tsx
20: function SelectAllHeader({ table }: HeaderContext<InvoiceReportItemDto, unknown>) {
32: function SelectRowCell({ row }: CellContext<InvoiceReportItemDto, unknown>) {
42: function PdfCell({ row }: CellContext<InvoiceReportItemDto, unknown>) {
57: }: Readonly<InvoicesReportTableProps>) {

===PROGRESS duration="16 s"===
Das Muster ist in allen vier Report-Tabellen identisch: Die Haupt-Exportkomponente ist bereits `Readonly`, die drei Hilfskomponenten `SelectAllHeader`, `SelectRowCell` und `PdfCell` sind es nicht. Ich wende die Änderung auf alle vier Dateien an.

===TOOL===
$ Edit ×12 in InvoicesReportTable.tsx, ShipmentReportTable.tsx, RekapReportTable.tsx, SdbReportTable.tsx
HeaderContext<…> -> Readonly<HeaderContext<…>>
CellContext<…>   -> Readonly<CellContext<…>>
Alle 12 Edits erfolgreich.

===PROGRESS duration="19 s"===
Bei `calendar.tsx` und `sheet.tsx` stimmen die Zeilennummern aus dem Sonar-Report nicht mehr, weil der shadcn-Merge beide Dateien neu geschrieben hat. Ich markiere dort konsequent alle Komponenten-Props, statt auf veraltete Zeilennummern zu zielen.

===TOOL===
$ Edit ×5 in calendar.tsx
Calendar, CalendarRoot, CalendarChevron, CalendarWeekNumber, CalendarDayButton -> Readonly<…>
Alle 5 Edits erfolgreich.

===TOOL===
$ Edit ×5 in sheet.tsx
SheetOverlay, SheetContent, SheetHeader/SheetFooter, SheetTitle, SheetDescription -> Readonly<…>
Alle Edits erfolgreich.

===PROGRESS duration="24 s"===
Jetzt die vier Einzelfälle. Bei S6551 im OAuth-Fehlerpfad wähle ich bewusst nicht `JSON.stringify`, weil das bei zirkulären Referenzen im Fehlerhandler selbst werfen und den nachfolgenden Redirect verhindern könnte.

===TOOL===
$ Edit useSelectableItems.ts
- return selectedIds.some((x) => x === id);
+ return selectedIds.includes(id);

===TOOL===
$ Edit SdbReportPage.ts
- new RegExp(`/${DEFAULT_LANG}/sdb-report(?:\\?|$)`)
+ new RegExp(String.raw`/${DEFAULT_LANG}/sdb-report(?:\?|$)`)

===TOOL===
$ Edit oauth.server.ts
- const causeMessage = cause instanceof Error ? cause.message : String(cause);
- console.error('ArcticFetchError cause:', causeMessage);
+ // Nicht-Error-Ursachen unveraendert weiterreichen, damit der Logger sie
+ // ausklappt statt sie zu '[object Object]' zu stringifizieren.
+ console.error('ArcticFetchError cause:', cause instanceof Error ? cause.message : cause);

===PROGRESS duration="15 s"===
Beim S1607-Fall bestätigt sich die Angabe aus dem Prompt: Die Begründung steht in der Konstante `MISSING_SDB_TEST_DATA`, Sonar kann der Referenz aber nicht folgen. Ich stelle den Grund zusätzlich als Kommentar direkt an die Skip-Stelle, ohne das Testverhalten zu ändern.

===TOOL===
$ Edit e2e/tests/sdb-report.spec.ts
  test.describe('with SDB test data', () => {
+   // Bewusst deaktiviert (Grund siehe MISSING_SDB_TEST_DATA): Der Standard-E2E-User
+   // besitzt keine SDB-Dokumente. Die Tests werden reaktiviert, sobald passende
+   // Testdaten oder ein dedizierter User vorhanden sind -> KUN-348.
    test.skip(true, MISSING_SDB_TEST_DATA);

===PROGRESS duration="41 s"===
Alle 18 Issues sind bearbeitet. Der Worktree hat noch keine Dependencies, die installiere ich vor der Verifikation.

===TOOL===
$ npm ci --no-audit --no-fund
added 919 packages in 12s

===TOOL===
$ npm run typecheck
> react-router typegen && tsc --build --noEmit
(keine Fehler)

===TOOL===
$ npm run lint
> eslint --cache --cache-location ./node_modules/.cache/eslint .
(keine Fehler)

===TOOL===
$ npm run test:unit
Test Files  12 passed (12)
Tests       84 passed (84)
Duration    2.42s

===PROGRESS duration="1 min 12 s"===
Typecheck, Lint und Unit-Tests sind grün. Die `String.raw`-Umstellung ist die riskanteste Änderung — unter `String.raw` würde aus `\\?` ein optionaler Backslash statt eines literalen Fragezeichens. Das prüfe ich explizit gegen.

===TOOL===
$ node re-check.mjs
alt      : \/de\/sdb-report(?:\?|$)
neu      : \/de\/sdb-report(?:\?|$)
identisch: true
https://x/de/sdb-report -> alt: true neu: true
https://x/de/sdb-report?a=1 -> alt: true neu: true
https://x/de/sdb-reportXY -> alt: false neu: false

===TOOL===
$ npm run build
✓ built in 2.71s
✓ built in 933ms
build/server/assets/server-build-Ch7GUBtI.js   637.08 kB │ gzip: 130.16 kB

===PROGRESS duration="34 s"===
Alle Prüfungen grün. Ich committe die Änderung und pushe den Branch.

===TOOL===
$ git status --porcelain && git diff --stat
10 geänderte Dateien
 32 insertions(+), 28 deletions(-)

===TOOL===
$ git add -A && git commit -F -
f3487fb KUN-388: offene SonarCloud-Issues beheben

===TOOL===
$ git push -u origin KUN-388-sonar-cleanup
branch 'KUN-388-sonar-cleanup' set up to track 'origin/KUN-388-sonar-cleanup'.
 * [new branch]      KUN-388-sonar-cleanup -> KUN-388-sonar-cleanup

===PROGRESS duration="21 s"===
Der Branch ist auf origin. Ich erstelle jetzt den Pull Request über die Bitbucket-API.

===TOOL===
$ powershell -ExecutionPolicy Bypass -File create-pr.ps1
http_code=201
PR #68 [OPEN] KUN-388: offene SonarCloud-Issues beheben
KUN-388-sonar-cleanup -> develop
https://bitbucket.org/transgourmet/portal-frontend/pull-requests/68

===TOOL===
$ rm create-pr.ps1 && git status --porcelain
(sauber wenn leer)

===AGENT duration="12 s"===
Fertig. [PR #68](https://bitbucket.org/transgourmet/portal-frontend/pull-requests/68) ist offen: `KUN-388-sonar-cleanup` → `develop`.

## Was behoben wurde

Alle 18 Issues, 10 Dateien, +32/−28 Zeilen.

| Regel | Anzahl | Änderung |
|---|---|---|
| `S6759` | 14 | Komponenten-Props als `Readonly<...>` |
| `S1607` | 1 | Skip-Begründung als Kommentar an die Stelle gestellt |
| `S6551` | 1 | `String(cause)` raus, Ursache direkt an `console.error` |
| `S7765` | 1 | `.some()` → `.includes()` |
| `S7780` | 1 | `String.raw` fürs URL-Pattern |

## Drei Punkte, die du beim Review sehen solltest

**calendar.tsx / sheet.tsx:** Der Sonar-Report stammt von vor dem Merge von PR #67 — die Zeilennummern waren veraltet, weil der shadcn-Commit beide Dateien neu geschrieben hat. Ich habe dort deshalb *alle* Komponenten-Props markiert (5 in `calendar.tsx`, 6 in `sheet.tsx`), nicht nur die je eine gemeldete Stelle. Das deckt die Meldungen ab und verhindert, dass beim nächsten Scan neue S6759-Findings aus denselben Dateien auftauchen.

**S1607:** Wie von dir beschrieben — der Grund stand in `MISSING_SDB_TEST_DATA`, Sonar folgt der Konstanten-Referenz aber nicht. Der Text steht jetzt zusätzlich als Kommentar über `test.skip(...)`, die Konstante bleibt unverändert in Verwendung. Die Tests bleiben deaktiviert.

**S6551 ist die einzige echte Verhaltensänderung:** `String(cause)` hat Nicht-Error-Ursachen zu `[object Object]` gemacht und die Information im OAuth-Fehlerlog vernichtet. Ich reiche `cause` jetzt unverändert als eigenes `console.error`-Argument durch, statt — wie sonst bei S6551 üblich — auf `JSON.stringify` zu gehen: das hätte in einem Fehlerhandler bei zirkulären Referenzen selbst werfen und den nachfolgenden `redirect` verhindern können.

## Verifikation

`typecheck`, `lint`, `test:unit` (84 Tests / 12 Dateien) und `build` — alle grün. Zusätzlich habe ich die `String.raw`-Umstellung gegengeprüft: beide Varianten erzeugen exakt `\/de\/sdb-report(?:\?|$)` mit identischen Match-Ergebnissen. Hier war ein Fehler leicht möglich, weil `\\?` unter `String.raw` zu einem *optionalen Backslash* statt einem literalen Fragezeichen geworden wäre.

Die e2e-Tests (`test:e2e`) habe ich nicht ausgeführt — die brauchen einen laufenden Server bzw. `portaltest`. Betroffen wären `SdbReportPage.ts` und `sdb-report.spec.ts`; die Regex-Gegenprobe deckt den riskanten Teil davon ab, der Rest läuft über die Jenkins-Pipeline.

Der Worktree liegt unter `.claude/worktrees/KUN-388-sonar-cleanup` und ist sauber.
