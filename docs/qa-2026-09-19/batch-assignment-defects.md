# D12 / D14 — Cohort and exam-assignment isolation

## Baseline (actual API/database; simulated users)

`harness/d12-batch-assignment-boundaries.mjs before` executed20 assertions:5 PASS /15 FAIL. Evidence `harness/d12-before.json`.

- Operations Admin reads Engineering cohort candidate names/email/mobile via batch detail; export XLSX contains Engineering candidate name/email. Extracted evidence `harness/d12-before-export-extracted.json`.
- Foreign Admin removes protected cohort members; Engineering Admin adds an inaccessible Operations candidate; changes persist.
- Batch names/descriptions, updates and deletion are global across Admins.
- Assignment candidate selection exposes foreign candidates and works for inaccessible exams. Foreign actors assign/unassign inaccessible exams. Explicit and filtered assignment accept inaccessible candidates. Inactive cohorts can be assigned.
- Same-department Admin assignment and Instructor assignment work; Instructor is correctly forbidden from batch management itself.
- Disposable before-fixture candidates: `qa26.d12.before.eng@example.test`, `qa26.d12.before.ops@example.test`; exact IDs in `harness/d12-before-fixtures.json`. All temporary exam117 assignments were unassigned. Disposable cohort was soft-deleted. Existing lifecycle users/batches were not modified.

## D12 — Partially fixed; cohort ownership requires product decision

`Batch` has no DepartmentId or stable organization ownership field. Its only creator reference is nullable CreatedBy. Existing specification describes global Admin-only logical candidate groups, and does not define departmental cohort ownership. Deriving department from today's creator or member departments would invent behavior, especially for moved/deleted creators, empty cohorts, mixed cohorts, and SuperAdmin-created cohorts.

No schema change was made. Batch metadata/list/update/delete isolation remains UNRESOLVED and needs an explicit ownership policy, potentially a schema/migration change (prohibited in this session).

Safe subfix applies existing ResourceAuthorizationService user entitlements to candidate lists/counts, detail, XLSX rows, additions and removals. Out-of-scope candidate details are hidden and memberships cannot be changed through known candidate IDs. Cache keys include actor scope. SuperAdmin retains complete visibility; intentional mixed cohorts can expose only the members each ordinary actor is entitled to access.

## D14 — Assignment authorization fix (runtime verified)

- Apply the existing exam resource guard to candidate selection, assign and unassign.
- Scope candidate queries for explicit, batch and filtered selection through existing user resource rules, including intentional assignment/attempt-derived access.
- Reject an explicit list containing unavailable candidates as a whole, before any mutation/notification, preventing partially successful mixed-scope requests.
- Require the selected batch to exist and be active before batch assignment. This is an existing documented batch rule.
- Cache keys include actor scope.
- Preserve Admin/Instructor roles already permitted by AssignmentsController; no broader roles were enabled.

## Production files

- `Backend-API/Infrastructure/Services/Batch/BatchService.cs`
- `Backend-API/Infrastructure/Services/ExamAssignment/ExamAssignmentService.cs`
- Existing SQL integration fixture in `Backend-API.Tests/NotificationIntegrationTests.cs` updated to provide a real authorized actor/candidate role for the newly enforced service checks. SQL fixture remains skipped because it creates/drops databases; no schema operation was run.

Build succeeded with 0 errors (`d12-d14-build.log`); existing warnings remain. Combined normal-path regression after all shared fixes passed 221 tests, skipped 64 SQL/Redis-dependent tests and failed none (`backend-restart3-tests.log`). No schema-mutating integration fixture was enabled.

The completed runtime regression has 26 assertions: 23 PASS and three expected UNRESOLVED metadata/list/delete assertions (`harness/d12-after.json`). A mixed explicit candidate list is rejected atomically; privileged reload proves neither candidate assigned. An intentionally mixed SuperAdmin-created cohort reveals/assigns only entitled candidates for each ordinary Admin. Same-department Admin and Instructor assignment remains available. Inactive batch assignment is rejected. Downloaded foreign XLSX content contains seven column headers and no protected candidate name/email (`harness/d12-after-export-extracted.json`).

An independent bounded code review found the authorization guards precede assignment mutations and the filtered batch member includes are not followed by queries that would reintroduce inaccessible tracked members. Runtime replay subsequently verified those boundaries. Candidate scope intentionally includes existing department exam assignments/attempts; the fix preserves that existing entitlement model rather than imposing strict current DepartmentId equality.

After fixtures retained: `qa26.d12.after.eng@example.test` and `qa26.d12.after.ops@example.test` (exact IDs in `harness/d12-after-fixtures.json`). All temporary exam117 assignments were unassigned; disposable before/after cohorts were soft-deleted. No browser lifecycle candidate or exam123 was changed by these checks.
