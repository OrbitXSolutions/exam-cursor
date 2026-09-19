# Admin configuration and access-control QA contribution

Evidence classification: **SIMULATED TEST** for scripts using the actual running API and saved SQL state; **CODE/CONFIG INSPECTION ONLY** for frontend page descriptions. No physical or real-browser tests were performed by this contribution. Main QA browser evidence is recorded separately.

## Phase 1 — organization/system/notification configuration

Executed `config-roundtrip.mjs` against the local app, saving `config-evidence-before.json`. Tested bilingual organization name/contact/footer/color persistence; anonymous effective branding; optional null fields and inactive organization; fallback to system branding; system settings save/reload; notification batching/login URL/name save/reload with outbound channels disabled; all three notification event templates with English/Arabic subjects/body/placeholders and active toggle; unknown event; invalid input; and permission checks for Admin, Instructor, Examiner, Proctor and Candidate.

Organization and system read/write are SuperAdmin-only: every tested lower role was denied. Notification settings/templates/logs allow Admin and deny the other tested roles, consistent with controller policy. This confirms current role behavior; it does **not** establish department scoping of notification logs or global settings.

No SMTP/SMS send, queue, retry or delivery was requested. Existing notification secrets were preserved, snapshots are private ignored files, and evidence redacts secrets. No logo/favicon files were replaced. The frontend counterparts were inspected (organization form and upload flows; system general/security/proctoring/brand tabs; notification SMTP/SMS/general settings; three template cards). They were not operated in a browser by this contribution.

All modified organization fields and notification configuration/templates were restored. System retention was originally `0`; the existing PUT endpoint normalizes nonpositive values to `30`, so exact restoration needed one-column test-data DML by the environment agent. Verification is `video-retention-restore.json`. No schema change occurred. Later D07 replay confirmed system settings remained byte-for-byte unchanged, including retention `0`.

### D07 — confirmed validation defects, fixed

- Negative upload/session/password-length settings and unknown proctor mode were saved.
- Negative SMTP port, nonpositive batch sizes and negative batch delay were saved.
- SMTP host longer than its 500-character SQL column and a template subject longer than 500 characters returned HTTP 500.
- Notification log pagination with page number `0` and page size `-1` returned HTTP 500.

Root cause: no validators for these DTOs. Added FluentValidation validators using existing SQL lengths, worker bounds (batch 1–500, delay 0–60000 ms), TCP port range, positive size/time/length requirements, and actual system UI modes `None`, `Soft`, `Hard` (null retains existing fallback). No database schema/migration changes.

Exact verification: `validation-regression.mjs` / `validation-after.json`: **19/19 passed**. Each original invalid input now returns 400, and a subsequent GET equals the pre-request persisted configuration. Valid maximum host/subject lengths and worker boundary values save and reload. Both templates and notification settings restored exactly. `SettingsValidationTests`: **10/10 passed**, including bilingual length boundaries, nullable mode fallback, supported UI modes and default paging.

Exploratory observations intentionally not fixed: organization accepts a 501-character name, malformed support email and `javascript:` support URL. The name has no established product limit; UI rendering/link exploitation was not tested, so these are not counted as confirmed security defects. The settings UI exposes maintenance/registration/password/session settings, but this contribution did not prove their downstream enforcement. Physical upload, email/SMS delivery and external provider integration remain untested here.

## D04 — disabled accounts retain existing access token, fixed

Reproduced using disposable Candidate and Admin users created through the product. Each actor logged in, then SuperAdmin blocked/deactivated/deleted the account while the actor retained the original bearer token. Before the fix, requests still reached candidate dashboard, department, notification and admin-template resources, and blocked/deactivated tokens could negotiate a new proctor hub connection. New login was already denied, demonstrating that login rejection did not revoke current API access.

Root cause: JWT authentication checked signature/expiry only. Added `OnTokenValidated` check against authoritative user state (`!IsDeleted`, `!IsBlocked`, `Status == Active`) on every authentication. Login now applies the same Active-only rule already used by refresh-token validation. Signed token parsing for refresh remains unchanged.

Exact verification: `token-before-corrected.json` had **19 access-control failures in 38 checks**; `token-after.json` has **38/38 passes** for the same lifecycle. Old tokens receive 401 after block/deactivate/delete; blocked/deactivated token hub negotiations receive 401; fresh login remains denied; unblock/reactivate then fresh login and API access remain functional. All created token-test accounts were soft-deleted; IDs are in the `token-*-fixtures.json` artifacts. The initial `token-before.json` also contains a mistakenly spelled notification path; use the corrected baseline for comparisons.

Limitations: this verifies REST authentication and **new** SignalR negotiations, not forced disconnection of an already established socket. Existing live sockets and stale role claims after role removal need separate live/security-phase testing. The authoritative check adds one indexed SQL account lookup per JWT authentication; performance-phase testing must include it. The active-state rule includes Pending/Suspended rejection in code, but this contribution did not change those statuses through direct test-data DML.

## Phase 2 — D09 question-bank scope, implementation contribution

Harness/root reproduced no-department Instructor listing/fetching cross-department questions/answer keys, foreign option read/update and status toggle. A cross-department create returned failure **after saving the new question**; the resulting question was independently visible in the root browser. This exposed why response-code-only verification is insufficient.

QuestionBankService now fails closed for no-department list/count/detail reads and checks the subject department before question, option and attachment reads/writes. Update checks both the existing question and target subject before mutation. SuperAdmin remains global. The pre-save guard prevents unauthorized mutations followed by a rejected response.

The environment agent is independently repairing question option validation/atomicity (D08) in the same service and preserves these guards. D09 question-bank live replay is owned by the harness after the combined restart; this document does not claim it passed before that evidence exists.

Related lookup hierarchy behavior was independently reproduced in `lookup-scope.mjs` / `lookup-before.json`: **11 failures in 21 checks**. A dedicated Instructor with no department could list/read foreign subjects/topics, persistently rename both, create a topic under another department's subject, and delete disposable topics/subjects. An Instructor assigned to another department correctly failed the list/read/update/create cases but could still delete unused foreign subjects/topics. Owner-department controls succeeded. Tests verified the resulting saved records, not only responses. All subjects/topics were disposable QA fixtures and were deleted afterward; the dedicated Instructor was soft-deleted (`lookup-before-fixtures.json`). Existing shared test actors were not moved between departments.

`LookupsService` now makes subject/topic list/detail/update and topic creation fail closed when department is absent; it also enforces department scope before either deletion. Existing owner/SuperAdmin rights remain unchanged. **After the combined restart, `lookup-after.json` passed all 21 checks**, including rejection without persisted mutations and successful owner-department create/read/update/delete controls. Its disposable subject/topic records were removed and its Instructor soft-deleted (`lookup-after-fixtures.json`).

## Production files changed by this contribution

- `Backend-API/Program.cs`: D04 authoritative account validation during JWT authentication.
- `Backend-API/Infrastructure/Services/AuthService.cs`: D04 active-account login rule consistent with refresh validation.
- `Backend-API/Application/Validators/Settings/SystemSettingsValidators.cs`: D07 numeric and supported-mode validation.
- `Backend-API/Application/Validators/Notification/NotificationValidators.cs`: D07 persisted lengths, worker/port/enum and paging validation.
- `Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs`: D09 pre-read/pre-write subject-department guards; shared with the environment agent's D08 changes.
- `Backend-API/Infrastructure/Services/Lookups/LookupsService.cs`: D09 subject/topic fail-closed read/write/deletion department scope.
- Test file `Backend-API.Tests/SettingsValidationTests.cs`: ten validator regressions; no schema/database fixture creation.

No branch, push, merge, migration or schema operation was performed. Normal-output compilation first hit the running Windows DLL lock; isolated output compilation and the ten tests succeeded. A cleanup attempt on the exact isolated build directory was rejected by automatic approval policy; the build output was left locally and ignored via `admin-extra/.gitignore` instead of retrying deletion through another mechanism.
