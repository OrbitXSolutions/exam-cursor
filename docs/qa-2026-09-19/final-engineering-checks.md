# Final engineering checks — current QA source, 2026-09-19

These checks supplement the business/browser evidence; they are not the final full-lifecycle acceptance regression and are not a50-candidate capacity test. No new security exploration was performed after the user closed that pass.

| Check | Result | Evidence |
| --- | --- | --- |
| Backend isolated `dotnet test` |234 passed,64 skipped,0failed; total298, current D65/D66 source |`restart11-backend-tests.log`, `test-results/restart11-final.trx` |
| Frontend `pnpm typecheck` |PASS, exit0, final D68/D69 source |`final-d68-d69-typecheck.log` |
| Frontend `pnpm lint` |PASS,0errors/70warnings |`final-d68-d69-lint.log` |
| Frontend isolated production build |PASS; Turbopack compiled16.4seconds; TypeScript and78static pages/routes completed, includes D67/D68/D69 |`final-d68-d69-build.log` |
| API proxy tests against latest production artifact |7/7pass |`final-d68-d69-proxy-tests.log` |
| Answer-save queue tests |7/7pass |`final-answer-save-queue-tests.log` |
| `git diff --check` |PASS, empty output |`final-d68-d69-diff-check.log` |

SQL/Redis integration fixtures remain skipped because their setup creates/changes schema. Runtime API tests use the existing dedicated test database instead. No schema, migration, branch, push or merge operation was performed.

Frontend production build ran in a new temporary copy `C:\Users\abdal\AppData\Local\Temp\smartexam-qa-finalbuild-20260919`, with installed node_modules shared by a junction. Only the temporary copy's Next configuration sets `turbopack.root = 'C:/'` to allow that junction. Product config/source and the active development `.next` directory were not changed. Build warnings match the baseline stale browser-mapping data and transitive fstream/rimraf externalization observation. No warnings were suppressed. API proxy tests use local mock upstream servers and the production artifact; they are simulated integration tests.

Final D68/D69 source-freeze refresh completed14:44UTC: frontend TypeScript, full lint, isolated production build, proxy tests and diff check passed. D67 calculator, D68 video events and D69 video filtering browser/runtime verification are recorded by their owners/root separately; this build is additional evidence. Backend source was unchanged, so its passing restart11 suite was not unnecessarily rerun. No application restart was performed for this refresh.

Git/schema invariant check (`final-invariants.json`): branch remains `acceptance/production-readiness`; HEAD remains `2b890607988668f261fedfbf7ebf227742a637d6`, both matching session start. No differences under migrations, Infrastructure/Data or Domain/Entities. A fresh read-only SQL query found42applied migrations matching all42source migration IDs with no additions/missing IDs. Startup migration execution remains commented out. No schema/migration command was executed; a complete SQL DDL fingerprint was not captured at session start, so arbitrary external DDL drift was not independently compared.

API listener20396 (restart11) and Next listener36296 remain running at ports5221/3000 after these checks.

## Historical resource baseline

The sampler ran13:05:47–13:09:56UTC while waiting for the prepared ordinary workload, then stopped before build/static checks. No `load-manifest.json` or `phase11-load.mjs` process existed; **the50-candidate workload did not start**. Therefore `harness/phase11-load-ordinary-resources.jsonl` and its `resource-summary.json` are idle/light-activity baseline evidence only, despite the prepared run name.

There were41samples per process and no collection errors. Host has32logical processors and32384MiB RAM. API working set stayed236.08–236.20MiB, private memory122.12–122.56MiB, peak normalized host CPU0.031%. Long-running Next dev working set ranged1754–1850MiB with4161MiB private memory; this is not production Next memory and is not50rendered browsers. Short baseline stability cannot establish absence of memory leaks or concurrency readiness.

## Subsequent actual workload checkpoint

Root ran `harness/phase11-load.mjs` against the real API/database. First ramp produced43successful starts and7SQL-deadlock failures; D62 fixed the lock scope. Fresh replay then reached50simultaneously active and completed12rounds, all50 final answers/submissions and scores40/40. One autosave returned500 from a SQL pre-login timeout,119/120checks passed; observed save p95=17.142s is material degradation. D64 remains unresolved. This workload is simulated HTTP/SignalR, not50browsers/cameras. Actual host measurement is `phase11-load-after-resources.jsonl` and its summary; details in `load-reliability-finding.md`.

D63 cancelled-session lifecycle regression6/6passed after restart10; the prior43 ghost sessions were closed with history retained. The second50 replay passed120/120checks and all50scores40/40, but full log review identified D66: a lost AddTime audit write from disposed DbContext. D66's minimal await fix loaded restart11 and passed6/6 persisted action/audit checks. D65 timer mapping is included in the above current-source checks; its runtime/browser evidence is owned by concurrency_review/root. Final full-browser lifecycle regression is owned by root. Heavy checks were run only before or after measured workloads; both resource samplers are stopped. Final metrics and limitations are in `load-reliability-finding.md` and `audit-lifecycle-defect.md`.
