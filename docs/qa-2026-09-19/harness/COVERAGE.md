# API harness coverage and evidence interpretation

All execution in this folder is **SIMULATED TEST** using actual running application HTTP endpoints and, when explicitly run, SignalR WebSockets. It is not browser interaction or physical camera/screen verification. Root QA independently performs browser coverage.

## Phase 1 — completed

Created Engineering8 and Operations9, each with Admin, Instructor, Examiner, Proctor, and3 Candidates. Exercised bilingual department persistence; duplicate/empty/oversize/code validation; user role/password/email/department validation; role and department readback; login; block/deactivate/reactivate; existing token access; profile edits; department reassignment; soft deletion and deleted-user login; pagination; management permission checks; department active filtering, membership validation, deletion protection.

Baseline defects handed to root: department description UI data loss; inactive/nonexistent department validation inconsistencies in UserService; existing blocked/inactive bearer token use. Root/other agents own production fixes and their regression records. Extra unknown-department update returned500 but preserved original membership. One immediate repeated profile PUT produced an optimistic-concurrency error; restoration through department assignment succeeded.

Evidence: `phase1-admin-evidence.json`, `phase1-department-cycles-evidence.json`, `phase1-department-final.json`, `phase1-department-restore.json`, `d01-browser-department-api-after.json`.

## Phase 2 — completed, with production fixes coordinated

Subjects23/24 and topics34/35 scoped to Engineering/Operations. Valid retained bank questions131 single choice,132 weighted multi7+3,133 equal/no-explicit-weight multi,134 true/false,135 subjective rubric,136 Operations single. All have10 points. Subjective type in this actual database is5; source seed config says4. Harness initially attempted4 and correctly received unknown-type validation, then resumed with discovered live ID5.

Create/read/option and rubric persistence; invalid body, points, foreign/missing topic/subject/type; create weight sums; bulk and individual option edits; active toggle; cross-department and no-department list/detail/create/update/option/attachment boundaries; real PNG binary upload and fetch; PDF upload; attachment primary switch/rename/delete; unsupported executable media; subject/topic rename; referenced lookup deletion protection.

Baseline defects: invalid choice structures accepted, option edits bypassed create scoring validation, no-department question/lookup access failed open, foreign option reads/updates and question toggles succeeded, foreign create saved before returning access failure. Root/other agents implemented D08/D09. `phase2-d09-scope-regression.json` verifies15/15 scoped reads/writes, actual unchanged state after rejection, and zero hidden created records. D08 verification is owned by environment agent.

Important evidence corrections: initial phase2 script's cross-create checks looked only at a failed response and recorded PASS, but root browser and a later SuperAdmin query proved the entity had been inserted. Treat those baseline assertions as **FAILED unauthorized mutations**. Initial attachment check failed because the harness incorrectly used a generic API envelope and MIME type instead of `body.file` and `Image`; corrected10/10 attachment/lookup checks are in `phase2-extra-evidence.json`. This is not a product defect. Invalid disposable questions were deleted; root/inventory cleaned cross-injection records.

No implemented question Excel/CSV import endpoint or bank import button was found, although FAQ text advertises it. AI question generation was not called by this harness because it invokes an external configured provider; root records its coverage separately.

## Phase 3 — completed

Created/published115 complete lifecycle all5 question variants;116 objective-only review;117 fixed600-minute assigned/code;118 topic pool pick3/shuffle/section timer;119 walk-in with required text and optional numeric dynamic fields;120 strict proctor identity/webcam/screen/fullscreen/security;12150-candidate load;122 Operations assigned;124 future;125 expired;126 objective clone draft. Root separately authored123 through browser.

Each initially empty draft refused publication and remained unpublished. Configured publication, total points, instructions, access policy, candidate scheduling, clone content/draft state, duplicate question rejection with actual unchanged count, invalid durations/date range, unpublish/republish, candidate unassign/reassign, draft-assignment rejection, dynamic public share metadata, and cross-department exam detail denial were exercised.

Four `proctor assigned` baseline checks in `phase3-exams-evidence.json` initially reported FAIL because publication already assigned proctors, so manual assignment was idempotently skipped. `phase3-extra-evidence.json` verifies persisted legitimate assignments. A real critical defect was found underneath: publication auto-assigned all system proctors across departments. Ops proctor could read Engineering live monitoring. Root fixed D11. Cleanup removed70 erroneous foreign/inactive assignments on10 QA exams via normal unassign API. `phase3-d11-verification.json` and root browser123 readback prove fresh publication assigned only Engineering proctor and Ops monitoring was denied.

Candidate import XLSX2 valid bilingual rows plus1 invalid email:2 inserted,1 skipped. Both candidates' role/department/login credentials verified. Repeat import inserted0 and reported3 skipped. CSV is explicitly unsupported and rejected. Cohort9 created with2 members; duplicate addition, removal/restoration, rename, active status toggle, batch scheduling117, actual export XLSX row contents verified. Ops Admin could read Engineering cohort9: handed to root as confirmed batch isolation defect. `batch-manifest.json` records imported users and export names. Actual imported credentials are only in ignored `.env.qa-private.json`; the input workbook is ignored `.env.qa-import.xlsx`.

## Phase 4 — completed with limitations

`phase4-candidates.mjs` runs candidate access and actual active attempt/answer state checks when authorized. `attempt-manifest.json` records retained attempts. `live-fixtures.json` is the contract for the separate live-protocol agent. Candidate1/2 in Engineering remain reserved for root browser exam123. Imported pair A/B is reserved for API live115.

Actual runs denied anonymous, future, expired, draft, wrong/missing-code and unassigned starts; repeated starts resumed the same active attempts. Questions/options exposed no answer keys. Cross-candidate read/write denied. Static and pooled attempts materialized questions, saved correct/wrong/partial selections and preserved them on reload. Public walk-in text/number registration and one-attempt start succeeded. Fixed exam positive start was not exercised in the first run because its fifteen-minute admission grace had already elapsed; this is a harness scheduling limitation, addressed by a fresh phase6 fixture.

Confirmed D15: arbitrary nonexistent option persisted, and a foreign question returned success while ignored. Confirmed D16: identity-required exam started without any persisted identity approval via both candidate and legacy entry points. Confirmed D17: omitted required walk-in dynamic field created a user and issued authentication. Strict webcam/screen/fullscreen acquisition was not physically exercised by this harness.

## Phase 5 — candidate/input regressions completed; live protocol owned by inventory agent

Initial live imported pair187/188 became disconnected/expired because no continuous heartbeat was running while preparations continued. Replacement pair194/195 was created, heartbeat-maintained, then transferred to the live protocol agent. These are actual HTTP/WebSocket application sessions, not physical media or browser tests.

`phase5-input-regression.json` records23/23 passing checks after the combined restart: five malformed/foreign/mixed answer batches rejected with all stored selections unchanged; empty multi-choice persisted as unanswered with candidate and proctor both reporting3/4; unverified and Pending identity denied, no extra attempts created; foreign proctor could not approve; same-department approval persisted and both start APIs resumed; terminated attempt191 could not submit and remained status8; omitted/blank/nonnumeric/foreign/duplicate registration fields rejected before any user creation; valid decimal/text fields persisted in admin reporting.

Identity verification11 belongs only to Engineering candidate3. It uses a 1x1 PNG labeled **SYNTHETIC TEST ONLY, NOT REAL ID** as both uploads; proctor approval tests the workflow, not identity recognition or liveness. Browser candidates1/2 were not modified. Source inspection found randomized demo face-match/risk values and liveness Passed; no physical identity verification is claimed.

The first input-regression execution resumed old attempt189 and then its first heartbeat correctly applied the accumulated long disconnection budget. Its D15 validations had passed before expiry, but it could not finish clearing. The subsequent complete run used fresh attempt196 and continuous heartbeat; no failure was hidden.

D23 baseline confirmed by inventory: terminated195 converted to Submitted through Candidate submit. D27 baseline in `d27-share-before.json`: anonymous selection of the QA Operations Admin through share119 minted Admin+Candidate claims and could read protected exam122. No persisted roles changed. The public candidate identity/ownership model remains a separate business-rule/security decision.

## Phase 6 — completed

`phase6-completion.json` and `completion-manifest.json` cover correct, wrong, blank and partial answers; concurrent duplicate submission with one consistent timestamp; late answer rejection with unchanged selection; max-two retakes; allowed second attempt then force-submit; forced terminal submission denial; fresh fixed exam admission; actual one-minute expiry while heartbeats continued; and all-five-variant submission to manual grading. Objective expected scores:196=18/40,203=40/40,204=0/40(blank),205=0/40(wrong),206=10/40(force-submit),207=20/20(fixed),202=10/10(saved then expired). Manual208 has40 auto points plus10 possible subjective points. Root browser193/199/200 were not mutated by this agent.

Seventeen checks passed. One initial assertion assumed fixed exams end at scheduled start plus duration; measured behavior is each candidate's actual start plus duration, capped by EndAt. Product tutorial/UI descriptions conflict, so this is recorded as an unresolved timing-policy/documentation decision, not silently changed or claimed a confirmed functional defect. Separate **D33 confirmed defect**: the legacy start endpoint bypassed the explicit fifteen-minute fixed admission window enforced by Candidate start. It created209 after the window;209 was then cancelled through the normal admin API. Minimal parity guard is implemented pending reload regression.

Alternative endpoints were independently tested: `d15-d23-legacy-before.json` confirms legacy MCQ_Multi selection999999999 persisted (name check expected "multiple", actual lookup name is "MCQ_Multi"), and legacy submission converted terminated191 to Submitted. The selected option was restored and objective201 submitted. Legacy shared option validation and active-state submit guards are implemented pending regression. Public staff-token defect D27 was verified fixed: QA Operations Admin selection now400/no token and persisted roles unchanged (`d27-share-after.json`). D28 verified through repeated same-attempt candidate sessions, matching legacy session, distinct-attempt variation, and shuffle-disabled author order.

## Phase 7 — completed matrix; one confirmed workflow failure pending fix

`phase7-grading.json` contains22 passing checks and one failure: force-submitted206 cannot enter grading because status7 is excluded (D39, environment agent owns fix). Other objective totals independently matched correct40, blank0, wrong0, weighted3+equal5+TF10=18, fixed20 and expired10. Expired attempts can be initiated for grading explicitly. Subjective208 entered one-question manual queue with auto subtotal40.

Manual and regrade negative/over-maximum scores were rejected without state changes. Completion before manual review failed. Two authorized graders concurrently saved8 and9; both calls succeeded and the final score/comment were a coherent last-writer pair. There is no conflict warning or edit lock. Bulk grading deliberately reports per-item partial success; a valid zero and invalid foreign question produced one success and one failure. A negative score in a bulk DTO rejected the whole batch before any valid-row change. **Zero with no comment** persisted and completion succeeded at40/50, but the response lacks an explicit grading-completion marker for that answer; root owns UI D38.

Duplicate completion and ordinary manual editing after completion were blocked. Explicit regrade0→10 persisted the comment, grading total50 and attempt total50. Result62 still contains40 until the separate documented `update-from-regrade` action; that next step is reserved for phase8.

Scoring policy observation: selecting all options, including incorrect ones, gives full numeric points under both multi-choice scoring models because wrong selections carry zero penalty. Weighted scoring reports IsCorrect=true at full points while equal/legacy scoring reports IsCorrect=false unless the selection exactly matches the answer key. This was physically **not** tested; actual API attempt211 and grading91 demonstrate it. No penalty or correctness-policy change was guessed.

## Phase 8 — result lifecycle and privacy fixes verified

`phase8-results.json` records 26 checks: 18 passed and eight exposed D43 result privacy failures. Regrade session87 was explicitly applied to result62 (attempt208), updating 40/50 to 50/50 and 100%, then published. All five review scores matched10. Single unpublish immediately hid the main result route, sibling candidate and Operations admin access was denied, passed-only publication excluded failed results, bulk publication released remaining failures, and duplicate publication was rejected. Exam128 flags were restored and its results left published.

D43 confirmed unpublished scores through legacy Grading/my-result, hidden score exposure through alternate result, per-question review, summary and attempt-history routes, and AllowReview/ShowCorrectAnswers bypass in the legacy grading result. Source fixes now evaluate current publication and visibility before cached payloads, filter candidate aggregates/history by visible published results, and suppress review/correctness according to existing flags. `d43-privacy-after.json` records 27/27 passing checks against restart6, including warm payloads, staff access, both histories, restored normal visibility and sibling/foreign denial. All temporary flags/publication changes were restored.

Earlier queued fixes are now verified against restart5: `d15-d23-legacy-after.json` rejects invalid legacy options and preserves a terminated attempt; `d33-fixed-admission-after.json` denies both admission APIs after the fixed grace window without adding an attempt; `d37-d38-after.json` verifies auto-only review scores and the explicit zero-grade completion marker. Root independently verified zero/no-comment attempt212 through the browser and completed grading. D39 is owned and verified by the environment agent.

## Phase 9 — role revocation and independent admission defects

`phase9-permissions-before.json` uses only dedicated qa26.phase9.scope@example.test. Candidate-only and anonymous staff-route denials, unrelated-candidate result/session denial, mixed Candidate+Examiner department scope, and same-JWT department transfer/restoration passed. D51 confirmed that removing Examiner left its existing JWT able to list other candidates' grading rows203/204/205/206/211, although a fresh Candidate-only JWT received403. Program now rejects role-claim sets that differ from current database roles; runtime replay awaits restart.

`d51-socket-before.json` separately reproduced removal of Proctor while a WebSocket remained connected: the revoked actor still delivered a warning to candidate203. ProctorHub now rechecks the role set and aborts on mismatch at authorized invocations. This does not establish immediate revocation of completely idle listening connections or already-established peer-to-peer media; that remains an explicit limitation of this verification.

The initial strict-exam unassignment start failed because of missing identity, which **does not prove assignment enforcement**. The preview continued to report eligibility. Independent no-ID/no-code/no-window-conflict probing in `restricted-admission-before.json` then confirmed D55: both Candidate and legacy Attempt start created unauthorized Engineering-candidate attempts216/217 for Operations restricted exam122 and exposed its Q136. Both attempts were cancelled. Earlier denials caused by identity, code, or timing must not be counted as validating the assignment boundary. Both start APIs and preview now share an active/nondeleted-assignment check, pending replay. Public unrestricted exams remain intentionally available across departments.

## Phase 10 — public identity and token adversarial checks

`phase10-public-auth.json` records 12 checks: six conventional token checks passed and six demonstrated unresolved public-authentication risks. Anonymous share119 selection of importedA minted a full candidate JWT and refresh token that read unrelated private exam130's published result208=50/50. Existing-email walk-in registration minted the same full account access. A common source-defined default walk-in password also successfully authenticated an existing QA walk-in account via ordinary login. These findings concern the intended public candidate-selection/identity model and require a product security decision; no guessed authentication redesign was made. D27's earlier privileged staff minting vulnerability is fixed separately.

Tampered role claims retaining the original signature, unsigned alg-none JWT, malformed JWT and invalid refresh secrets were rejected. Logout invalidated the refresh credential. No answers/grades were changed. The probes rotated importedA's refresh tokens and intentionally left exam119's required Organization response as QA adversarial test text. Candidate role/profile values remained unchanged. These are actual HTTP simulations, not physical or browser identity verification.

## Later phases — prepared/ongoing, not yet claimed complete

`phase11-load.mjs` is prepared but its existence does not mean execution. Only `phase11-load-evidence.json` plus `load-manifest.json` establish whether the50-candidate run occurred and how many actually authenticated, started, joined WebSockets, saved, and submitted. The load script does not simulate real camera/video encoding or browser rendering.

## Production files

Root explicitly expanded this agent's scope to minimal confirmed fixes. Production files changed:

- CandidateService: D15 batch validation before mutation; D16 required approved identity at start; D21 answered-state content; D23 active-state submission whitelist; D28 stable option ordering; D37 auto-graded review mapping; D43 per-question score visibility.
- AttemptService: D15 shared answer validation for legacy APIs; D16 required approved identity at legacy start; D21 content-based progress; D23 active-state submission guard; D28 stable option ordering; D33 fixed admission-window parity; D43 candidate history privacy.
- ExamShareService: D17 validate configured dynamic fields before creating users/tokens; D27 reject public authentication of staff/non-Candidate/mixed-role and inactive accounts.
- ProctorService: D21 persisted content-based answered count.
- AiProctorService: D21 content-based answered count in report inputs.
- GradingDtos/GradingService: D38 authoritative IsGraded response marker for saved zero grades; D43 candidate result publication/review/correctness guards and nullable candidate correctness.
- ExamResultService: D43 current candidate visibility checks for individual results, result lists and best/latest summaries. Other agents own report and authorization changes in this shared file.
- Program/ProctorHub: D51 current-role set validation for already issued JWTs and established socket operations; mismatches require reauthentication.
- CandidateAssignmentPolicy, CandidateService and AttemptService: D55 restricted-exam assignment boundary at both admission paths and preview eligibility.
- New helpers: `Application/Validators/Candidate/CandidateAnswerValidation.cs`, `Application/Validators/Assessment/WalkInAnswerValidation.cs`, `Infrastructure/Services/Authorization/CandidateIdentityPolicy.cs`, `Domain/Common/AnswerContent.cs`, `Domain/Common/AttemptOptionOrder.cs`.
- Tests: `Backend-API.Tests/CandidateInputValidationTests.cs` (10 passing focused validation/progress/stable-order tests).

D15/D16/D17/D21/D23, D27/D28, legacy D15/D23/D33, D37/D38 and D43 runtime fixes are verified above. D51/D55 await the next coordinated reload regression. No branch changes, pushes, merges, database schema changes, or migrations were performed by this agent.
