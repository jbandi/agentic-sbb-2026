# Sonar-Cleanup: Tickets 3–7 parallel implementiert mit PRs

===USER===
ultracode  Implementiere Tickets #3 bis #7 aus D:\sources\portal-workspace\portal-frontend\portal-frontend\.scratch\sonar-cleanup
Erstelle für jedes Ticket einen Branch. Implementiere das Ticket in einem worktree und erstelle einen Bitbucket PR.

===AGENT duration="6 s"===
Ich schaue mir zuerst die Tickets an und verschaffe mir einen Überblick über das Repo-Setup. Danach starte ich einen Multi-Agent-Workflow mit je einem Implementierungs-Agenten pro Ticket in eigenem Worktree.

===PROGRESS duration="15 s"===
Ich verschaffe mir einen Überblick über Worktrees, Branches und die Ticket-Dateien.

===TOOL===
$ git worktree list && git branch -a
D:/sources/portal-workspace/portal-frontend                    dbb9fa9 [develop]
D:/.../worktrees/ticket-12-aa18ae                              dbb9fa9 [claude/sonar-cleanup-tickets-3-7-4738de]
+ feature/sonar-cleanup-08-pdf-push-alcohol-mwst
+ feature/sonar-cleanup-09-pdf-push-sustainability
+ feature/sonar-cleanup-10-jsx-hygiene
...
remotes/origin/HEAD -> origin/develop

===TOOL===
$ ls .scratch/sonar-cleanup/issues
01-shadcn-ui-update.md
02-sonar-plsql-rule-exclusion.md
03-oauth-server-refactoring.md
04-e2e-sdb-report-test.md
05-redos-regex.md
06-report-tables-inline-components.md
07-productinformation-nested-ternaries.md
08-pdf-exports-alcohol-mwst-push.md
...

===TOOL===
$ cat .scratch/sonar-cleanup/spec.md issues/03..07*.md
Sonar-Cleanup: Abbau der offenen SonarCloud-Issues (165 offen, 1 BLOCKER, 9 CRITICAL).
Pro Ticket ein PR. Tickets sind unabhängig und in beliebiger Reihenfolge mergebar.
03: oauth.server.ts refactoren (4 Findings, u.a. S3776 kognitive Komplexität 22>15)
04: E2E-Test sdb-report reparieren (S2699 BLOCKER: Test ohne Assertion, S1607)
05: ReDoS-anfällige Regexes vereinfachen (2x S8786 MAJOR)
06: Report-Tabellen: Inline-Komponenten extrahieren (12x S6478 MAJOR, 4 Dateien)
07: productinformation: verschachtelte Ternaries auflösen (5x S3358, 1x S4623)

===PROGRESS duration="40 s"===
Die Tickets sind klar. Vorheriges Muster (Tickets 8–15) verwendet Branches `feature/sonar-cleanup-NN-…` mit PRs nach `develop`. Ich sammle noch Repo-Kontext: npm-Scripts, Remote, Zieldateien und die Commit-Konvention.

===TOOL===
$ git remote -v && node -e "console.log(require('./package.json').scripts)"
origin  git@bitbucket.org:transgourmet/portal-frontend.git
"lint": "eslint --cache ...",
"test:unit": "vitest run --project=unit",
"typecheck": "react-router typegen && tsc --build --noEmit"

===TOOL===
$ ls app/shell/oauth.server.ts e2e/tests/sdb-report.spec.ts app/common/utils/numberFormatUtil.ts ...
app/common/utils/numberFormatUtil.ts
app/features/invoices/components/InvoicesReportTable.tsx
app/features/productinformation/productinfo-csv-builder.server.ts
app/features/productinformation/routes/csv.tsx
app/features/rekap-report/components/RekapReportTable.tsx
app/features/sdb-report/components/SdbReportListItem.tsx
app/features/sdb-report/components/SdbReportTable.tsx
app/features/shipments/components/ShipmentReportTable.tsx
app/shell/oauth.server.ts
e2e/tests/sdb-report.spec.ts
playwright.config.ts

===TOOL===
$ git log --format='%s' -1 feature/sonar-cleanup-10-jsx-hygiene
Sonar-Cleanup 10: JSX-Hygiene in Feature-Komponenten (redundante Fragmente, stabile Keys, sort-Kopie, Readonly-Props, fromCodePoint, Button-Type)

===TOOL===
$ test -d portal-frontend/node_modules
worktree: none
main HAS node_modules

===PROGRESS duration="25 s"===
`node_modules` gibt es nur im Haupt-Checkout — jeder Agent muss in seinem Worktree `npm ci` ausführen. Commit-Konvention: einzeiliges deutsches Subject `Sonar-Cleanup NN: …`. Ich starte jetzt den Workflow: pro Ticket eine Pipeline mit Implementierung im isolierten Worktree → adversarialem Review → Fix+Push. Die PRs erstelle ich danach selbst über die Bitbucket-API.

===TOOL===
$ Workflow sonar-cleanup-tickets-3-7 (5 Pipelines: Implement -> Review -> Finalize)
Workflow launched in background. Task ID: wx1dis8r3
Run ID: wf_f5494c8e-5f3

===PROGRESS duration="10 s"===
Der Workflow läuft im Hintergrund. Währenddessen lade ich die Bitbucket-Skill-Anleitung und prüfe, ob das API-Token funktioniert, damit die PR-Erstellung nachher nicht scheitert.

===TOOL===
$ curl.exe -s -o NUL -w "%{http_code}" -u $cred https://api.bitbucket.org/2.0/user
200

===PROGRESS duration="20 min 8 s"===
Der Workflow arbeitet die 5 Tickets parallel ab: 15 Agenten (5x Implement im isolierten Worktree mit npm ci, typecheck, lint, test:unit — 5x adversarialer Review — 5x Finalize mit Fixes und Push). Alle 15 Agenten erfolgreich, 5/5 Tickets finalisiert.

===TOOL===
$ Workflow-Ergebnis wf_f5494c8e-5f3
Ticket 03: feature/sonar-cleanup-03-oauth-server — approved; minor Review-Issue
  (JSON.stringify -> String(cause)) vor Push gefixt; typecheck/lint/unit grün (57 Tests)
Ticket 04: feature/sonar-cleanup-04-e2e-sdb-report — Review CRITICAL: E2E-User hat
  keine SDB-Daten (per SQL gegen TGSTEST verifiziert, 0 Zeilen). Fix: vollständige
  Assertions implementiert, Suite als test.describe.skip mit Begründung annotiert
Ticket 05: feature/sonar-cleanup-05-redos-regex — approved ohne Issues; Äquivalenz
  per Brute-Force mit >200'000 Inputs verifiziert; 84 Tests grün
Ticket 06: feature/sonar-cleanup-06-report-tables — approved; 12x S6478 gelöst,
  minor Hinweis (pre-existing Copy-Paste-ID) bewusst nicht gefixt (out of scope)
Ticket 07: feature/sonar-cleanup-07-productinfo-ternaries — approved ohne Issues;
  CSV-Output per SHA-256-Vergleich byte-identisch nachgewiesen
failed: []

===PROGRESS duration="50 s"===
Alle 5 Tickets sind implementiert, reviewt und gepusht. Ich lege die PR-Beschreibungen als Dateien ab und verifiziere die Branches auf origin.

===TOOL===
$ git ls-remote --heads origin "feature/sonar-cleanup-0[3-7]*"
45f5462  refs/heads/feature/sonar-cleanup-03-oauth-server
a251a9e  refs/heads/feature/sonar-cleanup-04-e2e-sdb-report
c9eb039  refs/heads/feature/sonar-cleanup-05-redos-regex
cc59f34  refs/heads/feature/sonar-cleanup-06-report-tables
196001d  refs/heads/feature/sonar-cleanup-07-productinfo-ternaries

===PROGRESS duration="30 s"===
Ich erstelle die fünf PRs nach develop über die Bitbucket-API (PowerShell-Skript; ein Encoding-Problem mit Umlauten per UTF-8-BOM behoben).

===TOOL===
$ powershell -File create-prs-bom.ps1
OK PR #60 [OPEN] feature/sonar-cleanup-03-oauth-server -> develop
   https://bitbucket.org/transgourmet/portal-frontend/pull-requests/60
OK PR #61 [OPEN] feature/sonar-cleanup-04-e2e-sdb-report -> develop
   https://bitbucket.org/transgourmet/portal-frontend/pull-requests/61
OK PR #62 [OPEN] feature/sonar-cleanup-05-redos-regex -> develop
   https://bitbucket.org/transgourmet/portal-frontend/pull-requests/62
OK PR #63 [OPEN] feature/sonar-cleanup-06-report-tables -> develop
   https://bitbucket.org/transgourmet/portal-frontend/pull-requests/63
OK PR #64 [OPEN] feature/sonar-cleanup-07-productinfo-ternaries -> develop
   https://bitbucket.org/transgourmet/portal-frontend/pull-requests/64

===PROGRESS duration="15 s"===
Zum Abschluss räume ich die fünf Workflow-Worktrees dieses Laufs auf — die Branches sind lokal und auf origin gesichert.

===TOOL===
$ for i in 1..5: git worktree remove --force .claude/worktrees/wf_f5494c8e-5f3-$i
Worktrees dieses Laufs entfernt

===AGENT duration="14 s"===
Fertig — alle fünf Tickets sind implementiert, adversarial reviewt, gepusht und als PRs nach `develop` erstellt:

| Ticket | PR | Ergebnis |
|---|---|---|
| 03 oauth.server.ts | [PR #60](https://bitbucket.org/transgourmet/portal-frontend/pull-requests/60) | `handleOAuthCallback` in 7 benannte Teilfunktionen zerlegt, plus S7781/S6582/S6551 |
| 04 E2E sdb-report | [PR #61](https://bitbucket.org/transgourmet/portal-frontend/pull-requests/61) | Vollständige Assertions ergänzt, Suite begründet geskippt (siehe unten) |
| 05 ReDoS-Regexes | [PR #62](https://bitbucket.org/transgourmet/portal-frontend/pull-requests/62) | Beide S8786-Regexes linearisiert, neue Unit-Tests für `formatAmount` |
| 06 Report-Tabellen | [PR #63](https://bitbucket.org/transgourmet/portal-frontend/pull-requests/63) | 12× S6478: Inline-Komponenten in allen 4 Tabellen auf Modulebene extrahiert |
| 07 productinfo-Ternaries | [PR #64](https://bitbucket.org/transgourmet/portal-frontend/pull-requests/64) | 5 Ternaries aufgelöst + redundantes `undefined` entfernt |

In allen fünf Worktrees liefen `typecheck`, `lint` und `test:unit` grün. Zwei Punkte aus der Review-Phase sind erwähnenswert:

- **Ticket 04:** Der Reviewer hat per SQL gegen TGSTEST verifiziert, dass der E2E-User weiterhin **keine SDB-Dokumente** hat — ein blosses Reaktivieren hätte zwei dauerhaft rote E2E-Tests erzeugt. Umgesetzt wurde daher die Ticket-Alternative: Tests vollständig mit Assertions implementiert, Suite als `test.describe.skip` mit dokumentierter Begründung annotiert. Follow-up: SDB-Testdaten für den E2E-User anlegen, dann nur den Skip entfernen.
- **Ticket 03:** Der Review fand im S6551-Fix ein Detail (`JSON.stringify` könnte bei exotischen Causes werfen) — wurde vor dem Push auf `String(cause)` korrigiert. Da es sicherheitskritischer Code ist: Login sowie Ablauf von Access- und Refresh-Token bitte einmal manuell durchspielen.

Nebenbefund aus Ticket 06 (out of scope, als Folge-Task vorgeschlagen): Die `PdfCell` in `SdbReportTable.tsx` trägt ein von der Rechnungs-Tabelle kopiertes ID-Präfix.
