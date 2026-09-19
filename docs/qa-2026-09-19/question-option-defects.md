# D08 — Question answer-key/scoring validation and atomic edits

## Confirmed behavior and root causes

- Runtime pre-fix API reproductions allow single-choice questions with zero options, no correct answer, or multiple correct answers; true/false permits extra options; MCQ Multi accepts no correct answer.
- MCQ Multi creation checks weighted option total, but existing individual/bulk option mutations can invalidate that same total. A scored option can be removed, and sole correct answer can be cleared.
- Foreign/duplicate option IDs in bulk updates are silently ignored/reprocessed instead of rejecting the invalid request.
- Frontend edit saves question metadata/total first, then option changes separately. It filters out newly added options, never removes omitted options, and ignores the bulk request HTTP result. A success toast therefore does not prove the displayed option list was saved.

## Fix

- A shared built-in choice-type validator requires at least two options, exactly one correct answer for single-choice/true-false, exactly two options for true-false, at least one correct answer for Multi, nonnegative weights, and the existing Multi weighted-total invariant. Legacy null-weight Multi scoring remains supported; subjective questions do not require options.
- Optional `Options` on the existing question PUT contract replaces the full option list together with type, total, and metadata in one EF SaveChanges operation. Omitted Options preserves metadata-only clients. Existing IDs are retained; additions receive IDs; omitted options are soft-deleted. Unknown/foreign and duplicate IDs fail before changing tracked entities.
- Individual/add/delete/bulk mutations validate the proposed complete option state before saving. Bulk retains its existing upsert contract rather than silently becoming a replacement endpoint.
- The editor submits the entire list and total together, including added/removed options. Option uploads must succeed before question save; upload failures reach the error path rather than reporting successful update.
- All D09 authorization guards added by the security agent were preserved before reads/mutations.

## Verification

- Focused validator tests: 9/9 PASS (`d08-validator-tests.log`). Frontend typecheck PASS (`frontend-typecheck-d08.log`).
- Runtime before/after script: `harness/d08-option-regression.mjs`; evidence and retained fixture IDs are written under `harness/d08-<stage>*.json`.
- Pre-fix runtime: 27 assertions executed, 22 failed / 5 passed. The final subjective compatibility probe initially used obsolete seeded ID4; actual live Subjective is ID5. Corrected test harness to discover live types for the after-run; this fixture mistake is not reported as a product defect.
- Fixed-runtime after regression: 28/28 PASS (`harness/d08-after.json`). Atomic total10→20 / weights6+4→12+8 plus an added and omitted option persists correctly; failed atomic changes preserve total, body, and complete options. Both update response and fresh GET exclude omitted option IDs. Legacy null-weight MCQ Multi and live Subjective ID5 remain supported.
- Combined backend suite: 213 PASS / 0 FAIL / 62 SQL integration SKIP, including unchanged model/snapshot check (`backend-combined-tests.log`). The skipped schema-mutating SQL fixtures remain intentionally disabled.
- Pre-fix disposable D08 questions temporarily entered the root's dynamic pool in subject23. Root detected the changed available count before creating any attempt. D08 cleanup soft-deletes exactly the D08 IDs from captured POST evidence (protecting original131–135 and141); after-run uses a separately created subject. Evidence `harness/d08-before-cleanup.json`.
- Cleanup verified14/14: questions142–155 are soft-deleted and return404. After-regression intentionally leaves subject29 “QA26 D08 Isolated Options” under department8 and questions156–165. The original lifecycle pool remains unchanged.
- Tests cover invalid create keys, individual/bulk weighted-total failures with unchanged persistence, add/delete constraints, foreign/duplicate option IDs, sole-correct-answer integrity, atomic total+weights+add+remove, stable retained IDs, invalid atomic request rollback, metadata-only compatibility, legacy Multi scoring metadata, and subjective no-option support.
- Classification: SIMULATED TEST using actual local HTTP API and test database. Root provides separate REAL-BROWSER editor verification. No physical/media device claim is made.

## Important unresolved integrity risk

CODE INSPECTION ONLY: `AttemptQuestion` freezes Order and Points, but has no option/key/body snapshot. `GradingService.InitiateGradingAsync` loads and grades current bank Question.Options and AnswerKey. Editing source questions after attempt creation may change grading and candidate content. This existed before D08; retained option IDs are preserved by the patch. A robust historical snapshot/versioning design may require schema changes, which are prohibited in this session. Root was asked to reproduce the source-edit-after-attempt scenario separately and report the required product decision. No schema/migration was changed.

Concurrent authoring of the same question from multiple sessions has not been validated. The patch ensures one request's question/list changes are atomic, but does not add a question-version concurrency contract.

## Production files changed for D08

- `Backend-API/Application/Validators/QuestionBank/QuestionOptionRules.cs` (new)
- `Backend-API/Application/Validators/QuestionBank/QuestionValidators.cs`
- `Backend-API/Application/DTOs/QuestionBank/QuestionDtos.cs`
- `Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs` (shared with D09 owner)
- `Frontend/Smart-Exam-App-main/lib/types/api-params.ts`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/[id]/edit/page.tsx`
- Added regression tests: `Backend-API.Tests/QuestionOptionValidationTests.cs`.
