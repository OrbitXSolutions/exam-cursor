# Staff/user administration defects

## D02 — Password reset falsely reports success; recovery feature incomplete (unresolved)

- Root's REAL-BROWSER reproduction: staff-list Reset Password for `qa26.browser.proctor@example.test` reports a fixed temporary password as if the password changed.
- Independent actual HTTP follow-up: existing password still authenticates (200, success); displayed temporary password fails (400, invalid credentials). See `defect-D02-api-reproduction.json` (secrets omitted).
- Root cause: users list handler is a toast-only stub. User detail uses `resetUserPassword`, whose implementation always throws “Password reset not available via API.” There is no staff-admin reset endpoint.
- Further CODE INSPECTION ONLY: forgot-password page waits 1.5 seconds and displays mock success without calling the backend. Backend provides email-token recovery, but no frontend `/reset-password` page exists. No recovery emails were sent during this investigation.
- Left unresolved: implementing an administrator-issued temporary password versus a user-owned email recovery flow requires a credential delivery/business decision. The false-success behavior is a confirmed defect, and reset/recovery is not acceptance-ready. No invented credential reset/security semantics were added.

## D03 — User endpoints bypass department assignment rules (fixed and verified)

- Runtime baseline: POST /Users and PUT /Users with a nonexistent department return 500; inactive and soft-deleted departments are accepted and persist. The dedicated Department assignment endpoint already rejects inactive departments.
- Expected behavior is established by the existing assignment service and database relation: only an existing, nondeleted, active department can be assigned. Explicitly clearing the department remains supported.
- Minimal fix: UserService validates the selected department before creating or modifying an entity. The existing global query filter excludes soft-deleted departments; the added predicate requires active state. Invalid assignment returns a controlled validation failure.
- No database schema/migrations changed.

## D05 — Arabic staff name lost in API/UI round trip (fixed and verified)

- Root REAL-BROWSER reproduction: created Arabic name is shown as English on detail.
- Runtime baseline: creation stores Arabic in the existing entity field, but UserDto omits it; GET cannot return it. PUT ignores `fullNameAr`. Frontend mapper substitutes English for Arabic, and frontend update sends Arabic as displayName.
- Minimal fix: add FullNameAr to user response/update DTOs; persist update in existing entity field; validate existing 200-character field limit; map/send fullNameAr in frontend API client. English and Arabic remain independent.
- No database schema/migrations changed.

## Reproduction and regression harness

- `harness/d03-d05-regression.mjs before` ran against the original runtime: 18 expectations, 5 pass / 13 fail. See `harness/d03-d05-before.json`.
- Fixed-runtime repeat `after2`: 18/18 PASS, including persistence checks. See `harness/d03-d05-after2.json`. First after-run passed 17 assertions then encountered a transient Windows evidence-file write error; repeated from start to obtain complete evidence.
- Backend regression suite in normal output location: 204 PASS, 0 FAIL, 62 SQL integration SKIP; frontend typecheck PASS. See `backend-userfix-tests-standard.log`, `frontend-typecheck-userfix.log`. An earlier isolated-output run had one source-path assumption test failure; normal-path rerun resolved that harness issue.
- Covers missing/inactive/deleted department creation and updates, absence of user after rejected creation, unchanged state after rejected update, Arabic create/GET/update persistence, overlength Arabic validation, explicit department clearing, and valid active reassignment.
- Classification: SIMULATED TEST (real HTTP API, real application persistence, no browser). Root separately verifies UI changes in a real browser.
- Fixtures left intentionally: departments 11 (active), 12 (inactive), 13 (soft-deleted); regression Proctor user `1b6fa53c-aa2e-4ddb-9f51-16365c456443`; two users created during the pre-fix inactive/deleted department acceptance reproduction. Emails use `qa26.user-* @example.test` without the space. Exact manifest: `harness/d03-d05-fixtures.json` and before/after evidence.

## Production files changed by this investigation

- `Backend-API/Infrastructure/Services/UserService.cs` — department validation and Arabic update persistence.
- `Backend-API/Application/DTOs/Users/UserDtos.cs` — Arabic name response/update contract.
- `Backend-API/Application/Validators/Users/UserValidators.cs` — Arabic name length validation.
- `Frontend/Smart-Exam-App-main/lib/api/admin.ts` — Arabic name mapping and update payload. Other agents may subsequently edit the same file for independently reproduced staff-edit defects.
