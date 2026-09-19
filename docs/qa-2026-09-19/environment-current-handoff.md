# Environment subtask checkpoint — 2026-09-19 14:11 UTC

## Runtime and remaining work

API http://localhost:5221 is running after restart11 (D65/D66). Listener20396, launcher54256, managed exec terminal56616. Frontend http://localhost:3000 remains running on Next listener36296/launcher41124. No branch/push/merge/schema/migration operation was performed. Current-source backend tests234pass/64skip/0fail; frontend typecheck/build pass; lint0errors70warnings; production proxy7/7pass. PIDs/timestamps are in `processes.json` and `restart11-downtime.json`. See `final-engineering-checks.md` for exact outputs.

Root executed the50-candidate API/SignalR workload. First ramp produced43 starts/7 SQL deadlocks; D62 fixed start-lock query scope with no schema change. The first fresh replay created50 new attempts and completed12rounds plus submission/grading. One autosave returned500 from a SQL pre-login connection timeout;119/120checks passed, all50finalanswers/scores40/40 persisted. D64 remains unresolved reliability degradation. A second full50 replay after restart10 and supported retake grants passed120/120checks, zero request failures, all scores40/40. Resource measurements with recovery are complete in both `phase11-load-after-resource-summary.json` and `phase11-load-replay-resource-summary.json`. Full second-run log review did expose a separate disposed-context audit failure after successful AddTime317. See `load-reliability-finding.md`; do not claim error-free logs or resolved D64. Both samplers are stopped. Root's final full-browser lifecycle regression remains pending.

D63 old43 cancelled-attempt ghost sessions were closed through supported API with43/43verification; history retained. Minimal lifecycle/query fix is deployed restart10; fresh cancellation+actual1min expiry runtime regression6/6passed (exam141, cancelled312/session264, expired313/session265). The user closed further security exploration; current work is ordinary performance and lifecycle validation only.

D66 confirmed missing AddTime317 audit was fixed by awaiting the existing scoped audit calls for AddTime/ForceEnd. Fresh persisted effect+audit regression6/6PASS on attempt367 (Audit820/821). An initial harness omitted first-answer/InProgress precondition; those rejected Started-state calls and expired attempt365 are retained separately. No production rule was weakened. `audit-lifecycle-defect.md` is definitive. D65 proctor clock runtime/browser verification and final browser lifecycle remain with concurrency_review/root; no active resource sampler or heavy checks remain here.

## Newly completed since prior checkpoint

- D42: candidate completed dynamic-exam card now uses saved latest finished attempt point/count snapshot. API2/2passed (exam123 card56/count6). Root owns real-browser recheck. `candidate-points-defect.md`.
- D46: performance reports include AutoGraded/Completed, actual dynamic question IDs, saved question maxima and blank content. API14/14passed; report128 counts all5results, report123 contains6actualquestions. `question-performance-defect.md`.
- D53: Assessment list/nested authoring/source pools now enforce existing department authorization. Main matrix60/60 plus valid-source/publication3/3passed. All disposable exams132–140 used by this agent are soft-deleted; no root exam123 mutation. `assessment-isolation-defect.md`.
- D60 Media pagination input defect: negative/zero values formerly500; now400, overflow rejected, positive path retained. Full bounded HTTP-input matrix10/10 plus4exact pagination checks. Production file `Backend-API/Controllers/MediaController.cs`.
- D61 User-list performance defect:83users took21.0–21.2s; batched role lookup now2.10–2.11s. Definitive replay13/13pass. Production file `Backend-API/Infrastructure/Services/UserService.cs`; preserves prior D03/D05 edits. `http-input-and-user-list.md`.
- Restart7 loaded harness D51/D55 and inventory D52/D54/D57/generic-media deletion guard as well as D53/pagination. Inventory reports17/17+6/6+11/11pass. Harness owns its D51/D55 after-results; do not infer their completion from a loaded build.

## Unresolved issues owned/recorded here

- Fake Reset Password action D02 has no implemented admin reset workflow; requires product decision/delivery contract. No invented reset API.
- Cohort metadata ownership D12 lacks DepartmentId/stable ownership semantics; membership protection fixed, global metadata CRUD remains unresolved. No schema guessed.
- Historical source-question content/options/answer-key editing may affect grading; attempts only snapshot order/points. Existing report records this limitation; no schema change.
- D59 soft-delete question uniqueness failure: remove then re-add same question yields500 due IX_ExamQuestions_ExamId_QuestionId; reusing a deleted SectionId/Order also conflicts. Baseline evidence `harness/d53-source-publication-before.json` and application log. Requires decision on restoring deleted rows vs uniqueness semantics; no migration changed.
- D26 answer retry is memory-resident; force-close/reload despite pending-answer warning can still lose unsaved data. Browser normal outage/retry/submit flow was verified by root; durable offline storage is not implemented or claimed.

Previous confirmed source fixes, exact verification and file lists remain in `user-defects.md`, `question-option-defects.md`, `batch-assignment-defects.md`, `offline-answer-defect.md`, `grading-access-defects.md`. All direct HTTP harness evidence is simulated workload against actual application/persisted state; do not label it real-browser or physical evidence. The post-submit77-byte synthetic media chunk in attempt195 is deliberately nonplayable and must not be used for physical playback acceptance.
