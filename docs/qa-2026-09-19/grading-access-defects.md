# D32 / D34 / D39 — Grading access and workflow

## D32 — Examiner filter and pending metric

Root reproduced through the real browser: the Examiner grading list shows ManualRequired sessions but its exam selector contains only All, and Exams With Pending displays zero. Actual API baseline confirms Examiner receives403 on the Assessment dropdown because that controller deliberately excludes Examiner. The UI also counted all dropdown exams as pending, independent of session state.

Fix: expose only `GET /api/Grading/exams/dropdown` to the existing grading staff roles, reusing the assessment dropdown service. Assessment controller write permissions remain unchanged. The reused service was independently confirmed to disclose all exam names to an Admin without a department; it now returns an empty list before consulting the shared all-exam cache. The page counts distinct exams with outstanding manual questions in the displayed page and explicitly labels both question/exam metrics “this page” in English/Arabic. Session total retains its existing filtered total semantics.

Production files: GradingController.cs, AssessmentService.cs (dropdown only), frontend lib/api/grading.ts, grading/page.tsx. Root subsequently owns related D40 changes to the same page.

## D34 — Confirmed critical authorization failures

Baseline `harness/d32-d34-before.json`:29 assertions,9 PASS/20 FAIL (includes D32). Harness delegated disposable attempt191 for mutation probes; no root/core grading matrix attempt was changed.

- Foreign Operations Examiner could initiate Engineering grading, retrieve session detail by session/attempt ID, read manual queues and receive a local AI suggestion for an empty answer.
- Foreign Examiner successfully performed manual grade, bulk grade, regrade and complete on attempt191; privileged reload confirmed the score mutation. Original zero score was restored afterward, but the disposable session remains completed as an intentional test artifact.
- Examiner without a department could list QA sessions/manual queues and read all tested session/statistics paths.
- Sibling Candidate could read another candidate's grading-completion flag.
- Same-department Examiner reads remained available. Foreign exam-stat requests were denied in the baseline runtime. Their source still checked cache before authorization, so the fix places authorization first; no cached-stat disclosure is claimed as reproduced.
- The warmed candidate-result replay was denied in baseline. Its ownership check also followed the cache read; that check was moved before the cache as related preventive hardening, not a claimed reproduced leak.

Fix in GradingService.cs: apply existing ResourceAuthorizationService to list scope, session/attempt detail, manual queue, initiate/manual/bulk/regrade/complete, exam/question statistics and candidate completion; guard before cache reads or writes. Mutations authorize the trusted explicit actor ID, preserving CandidateService's separate background DI scope where current HttpContext can be absent. Candidate-result ownership is checked before cache access. AiGradingService.cs checks the parent attempt before loading answer details or invoking an external model. The baseline AI probe used an empty-answer fixture and returned locally; no external model request was made.

No schema or migration change. Existing role policies remain intact, including Candidate access restrictions on grading staff endpoints.

## D39 — Force-submitted attempts cannot enter grading

Harness phase7 confirmed proctor force-ended attempt206 has status ForceSubmitted7, saved answers and no grading session, yet initiate returned400 because only Submitted/Expired were accepted. Root approved adding ForceSubmitted to the existing eligibility guard in GradingService.cs. Terminated and active attempts remain excluded. Runtime regression will verify actual expected10/40 scoring.

## Verification status and data

Backend build passes with0 errors; frontend typecheck and targeted lint pass. After coordinated restart5, API replay passed39/39 assertions (`harness/d32-d34-after.json`). It includes all foreign/no-department denial paths, same-department detail/manual/bulk/regrade/complete access, candidate endpoint restrictions, dropdown scope and sibling-completion isolation. D39 force-submitted206 initiated and calculated10/40 correctly.

A newly created candidate submitted fresh attempt213 after the authorization guards: separate background grading still produced40/40 and a candidate-visible result (2/2 PASS, `harness/d34-fresh-background.json`). This proves the trusted explicit candidate actor survives the new DI scope; no HTTP-context bypass was added. The main replay then used213 as its isolated mutation fixture, preserving its40/40 score through allowed staff operations.

D39 supplementary completion succeeded as the same-department Examiner (`harness/d39-completion.json`). Its follow-up read initially used an Examiner token against the intentionally restricted Attempt endpoint and received403; the read-only verification was corrected to SuperAdmin rather than broadening permissions. Verified completed grading10/40 and preserved ForceSubmitted7 attempt state,2/2 PASS (`harness/d39-completion-state.json`). Exam128 report fixtures are now stable.

Combined backend current-source suite:234 passed,64 skipped,0 failed (`backend-restart5-tests.log`, `test-results/restart5-combined.trx`). SQL/Redis test skips remain environment/schema constraints, not represented as executed. Root's D32 browser verification remains in the root browser coverage record; this document claims API verification only for the post-fix selector/metric until that record confirms it.

New retained actor accounts: qa26.d34.nodept.admin@example.test and qa26.d34.nodept.examiner@example.test, both intentionally without departments. IDs are in `harness/d32-d34-actors.json`. Credentials are kept only in ignored/private harness state and are not reported here.

Additional retained candidate: qa26.d34.background@example.test; attempt213/exam116, final grading40/40. Exact user/grading IDs are in `harness/d34-after-submission.json`.
