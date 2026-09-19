# Final independent QA report — 2026-09-19

**Completed scope:** all twelve business phases were exercised to the extent described below, including two measured 50-candidate workloads and a fresh browser lifecycle through grading, publication, candidate review and PDF export. The final media checks include real-browser playback of synthetic footage. This report identifies untested combinations explicitly; it does not claim physical media acceptance or a complete security assessment.

**Assessment: ready for your structured manual review, not for unconditional customer acceptance.** Confirmed unresolved product defects remain. Following the start-lock repair, two full 50-candidate workloads verified every final answer, submission and 40/40 score. The first was 119/120 with one SQL connection timeout; the second passed 120/120 with zero HTTP errors but exposed a missing AddTime audit write, subsequently repaired and verified. The fresh final browser lifecycle produced the independently verified published result **47/50 (94%)**. Physical camera/screen acceptance and a separate security pass remain required.

The previously rejected delegated security pass is **CLOSED / NOT VERIFIED**. Automatic approval review rejected that pass for possible cybersecurity risk; the user's instruction not to repeat it was respected. This report preserves earlier evidence without claiming that the rejected pass completed. Report preparation used local records only; no security testing was performed to write it.

## Test scope, environment and evidence rules

- Workspace: `C:\_OrbitX Projects\Build4 IT\new-exam.worktrees\production-readiness-final-test`; initial branch `acceptance/production-readiness`, HEAD `2b890607988668f261fedfbf7ebf227742a637d6`.
- Dedicated existing test database `db_ac2b1b_examdb`; Next.js 16.0.10 development server at local port 3000; ASP.NET Core net9.0 Development API at local port 5221; .NET SDK 9.0.306 and Node 22.15.1. Production hosting/TLS was not reproduced. [Environment](environment.md).
- ACTUAL / PHYSICAL TEST means capture or device behavior using real camera, microphone or shared screen. None of those physical capabilities received acceptance here. REAL-BROWSER TEST means actual UI interaction, including any separately documented playback of synthetic media. SIMULATED TEST means actual local HTTP/SignalR/persistence under scripted actors, with synthetic payloads where stated. CODE/CONFIG INSPECTION ONLY does not assert runtime behavior; NOT TESTED and NOT VERIFIED remain explicit limitations.
- Missing local license and intentional Development secrets/configuration were accepted environment conditions, not defects. Credentials/tokens are omitted from this report and kept in ignored private harness state.
- No branch switch, push, merge, database schema change or migration was performed. Restarts and disposable data mutations are documented. Prepared scripts are not execution evidence.
- Do not sum overlapping assertions into an acceptance percentage. In particular, protocol 48/48 core is separate from the same file's initial media failures; incident 54/55 is separate from later preview 6/6; decision 17/21 retains four unresolved export failures. CacheService always reads the database: repeated-read checks do not prove actual cache-hit or distributed-cache behavior.

## Twelve-phase coverage summary

| Phase | Current evidence-based status |
|---|---|
| 1 Administration/setup | Browser and API exercised; D02 and D06 role editing remain open. Settings round trips and in-app notification read state verified; external delivery untested. |
| 2 Bank/scoring inputs | Four live question types, weighted/equal multi, bilingual edits/media covered; historical mutation D36 remains open. |
| 3 Exam/publication/assignment | Static/pooled/fixed/flex/public/restricted/walk-in variations and actual XLSX import/export exercised; D12/D59 remain open. |
| 4 Candidate experience | English/Arabic, access code, saves/clear/reload/order and outage recovery exercised; D55 fix not replayed, durable offline storage absent. |
| 5 Live candidate/proctor | Browser controls and 48 core protocol checks verified; physical media/device acceptance absent. |
| 6 Completion | Browser normal/partial/termination plus API blank/wrong/expiry/force/duplicate/retake matrix; fixed-timing policy and full race/resume matrix incomplete. |
| 7 Grading | Independent partial/full/zero/manual/regrade calculations and examiner browser flows verified; D36 remains material. |
| 8 Results/reports/incidents | Publication/review, downloaded artifacts, analytics and incident API workflows exercised; D50 open and D54 opening not verified. |
| 9 Roles/isolation | Selected department/candidate/role/resource matrices verified; D12 open and D51/D55 runtime closure absent. |
| 10 Adversarial/security | Rejected delegated pass CLOSED / NOT VERIFIED. Prior individual findings and fixes retained; no broad security pass. |
| 11 Performance/reliability | Two complete 50-candidate workloads: first 119/120 (D64 timeout), second 120/120 with zero HTTP errors; all 50 reloads/submissions/scores correct in both. D62/D63 repaired; D65 8/8 + browser and D66 6/6 action/audit replay verified. D64 unresolved. [Measured comparison](phase11-performance-results.md). |
| 12 Fresh final lifecycle | Fresh exam 143/attempt 368 completed through candidate tools, saved answers/reload, proctor warning and extra time, submission, examiner grading, admin review/publication, candidate review and a downloaded two-page PDF. Independent score **47/50 (94%)**, all 16 final-state checks passed. Synthetic video storage/finalization and real-browser rendering, play/pause, replay and seeking verified; physical capture remains unverified. |

## Numbered finding registry — D01 through D69

Statuses apply to the exact behavior described. “Verified” never expands a narrow replay into universal coverage. Browser references point to [browser-evidence.md](browser-evidence.md); detailed phase gaps remain in [coverage-audit.md](coverage-audit.md).

| ID | Finding | Current status and evidence |
|---|---|---|
| D01 | Department name-only edit erased bilingual descriptions | **Fixed, browser verified.** Full-record edit load; save/reload/reopen preserved descriptions. [API readback](harness/d01-browser-department-api-after.json). |
| D02 | Staff password reset reports false success; recovery incomplete | **Unresolved.** Old password still works and displayed replacement does not. [Defect and product decision](user-defects.md), [HTTP proof](defect-D02-api-reproduction.json). |
| D03 | Missing/inactive/deleted user department validation | **Fixed, 18/18 combined replay.** Controlled rejection before persistence. [D03/D05 after](harness/d03-d05-after2.json). |
| D04 | Blocked/inactive/deleted accounts retain issued JWT access | **Fixed, 38/38 replay** for HTTP and new hub negotiation. Existing connected invocation is D19. [After](admin-extra/token-after.json). |
| D05 | Arabic staff name lost/substituted in API/UI round trip | **Fixed, API and browser verified.** Independent English/Arabic values persist. [User defects](user-defects.md), [18/18 replay](harness/d03-d05-after2.json). |
| D06 | Staff account status and ordinary role edits ignored | **Partial.** Account status fixed and browser verified; ordinary role edit still falsely reports success. Separate Permissions role change/restoration works. Browser phase 9 record. |
| D07 | Settings/notification/template validation accepts invalid values or 500s | **Fixed, 19/19 API and 10 validator checks.** Rejected values unchanged; original configuration restored. [After](admin-extra/validation-after.json), [summary](admin-extra/summary.md). |
| D08 | Question key/options and weight updates violate invariants | **Fixed, 28/28 API plus browser atomic edit.** Total/options update together and invalid batches leave state unchanged. [After](harness/d08-after.json), [detail](question-option-defects.md). |
| D09 | Question/option/lookup department scope failures | **Fixed, 15/15 bank and 21/21 lookup replay.** Pre-save guards prevent hidden persisted creates. [Bank](harness/phase2-d09-scope-regression.json), [lookups](admin-extra/lookup-after.json). |
| D10 | SuperAdmin exam create requires department but UI lacks selector | **Fixed, browser verified.** Exam 123 created using active department selector; no contract expansion. Browser authoring record. |
| D11 | Publication automatically assigns unrelated proctors | **Fixed, fresh publication/browser verified.** Scoped Engineering assignment and foreign denial; 70 incorrect QA-only assignments cleaned. [Verification](harness/phase3-d11-verification.json). |
| D12 | Cohort metadata and member isolation | **Partial.** Candidate/member/export protection verified; metadata/list/update/delete ownership unresolved. [23 passes/3 open](harness/d12-after.json), [decision](batch-assignment-defects.md). |
| D13 | Candidate assignment checkbox bubbles and toggles twice | **Fixed, browser verified.** Mouse select, Space deselect, header select and selected assignment work. Browser assignment record. |
| D14 | Assignment candidate/exam scope and inactive cohort bypass | **Fixed, runtime verified.** Atomic explicit selection and actor-scoped filters with positive controls; shares D12's 26-check matrix. [Detail](batch-assignment-defects.md). |
| D15 | Invalid/foreign answer option input accepted | **Fixed, current and legacy API replays.** Bad batches reject before mutation. [23-check input replay](harness/phase5-input-regression.json), [legacy](harness/d15-d23-legacy-after.json). |
| D16 | Required identity approval bypassed at exam start | **Fixed, API workflow verified.** Both start paths require approved identity; synthetic ID only, no physical recognition. [Input replay](harness/phase5-input-regression.json). |
| D17 | Walk-in required/custom fields ignored | **Fixed, API and browser verified.** Missing/invalid fields reject before user creation; valid text/decimal values persist. [Input replay](harness/phase5-input-regression.json). |
| D18 | Foreign proctor AttemptControl list/add-time access | **Fixed, list/add-time runtime verified.** Authorized action persists/delivers; valid-state foreign force-end/resume not separately replayed. [Protocol](live-harness/protocol-after.json). |
| D19 | Already-connected blocked candidate can signal | **Fixed, invoking socket replay verified.** Invocation denied after block and restored afterward; idle recipients not proactively evicted. [Protocol](live-harness/protocol-after.json), [limits](inventory-findings.md). |
| D20 | Proctor pass-score unit says percent instead of points | **Fixed, browser verified** at 30 points. Browser attempt 193/session 145 record. |
| D21 | Cleared answer still counted answered | **Fixed, browser plus API verified.** Content-based count persisted across candidate/proctor views. [Input replay](harness/phase5-input-regression.json). |
| D22 | Sibling candidate can read another attempt/session metadata | **Fixed, scoped replay verified** with owner/proctor positive controls. [Protocol](live-harness/protocol-after.json). |
| D23 | Candidate submission converts terminated/forced terminal state | **Fixed, current and legacy replay.** Terminated stays status 8; forced state preserved. [Protocol](live-harness/protocol-after.json), [legacy](harness/d15-d23-legacy-after.json). |
| D24 | Question metadata edit erases explanations | **Fixed, bilingual browser and exact API value verified.** [Readback](harness/root-browser-state-verify-explanation.json). |
| D25 | Proctor event API returns 403 and UI falsely says no events | **Fixed, API and browser verified.** Existing events display and failures no longer become empty data. [Protocol](live-harness/protocol-after.json), browser event record. |
| D26 | Failed autosave discarded; submit can race pending answers | **Fixed for tested open-tab retry/flush path.** Real outage replay retained/saved answer and blocked early submit; seven queue tests pass. **Limit:** force-close/reload can lose memory-only edits. [Detail](offline-answer-defect.md). |
| D27 | Public share selection issues privileged staff credentials | **Narrow staff defect fixed, 2/2 replay; broader identity model unresolved.** Existing candidate selection/registration can issue general account access; common default walk-in credential remains documented. [Staff replay](harness/d27-share-after.json), [public model](harness/phase10-public-auth.json). |
| D28 | Option shuffle undone by renderer and changes between reads | **Fixed, recorded repeated-read and renderer verification.** Initial stable author-order claim withdrawn. [Order readback](harness/root-browser-state-option-order.json), [coverage](harness/COVERAGE.md). |
| D29 | Private snapshots exposed via static/generic media aliases | **Fixed, 46/46 final privacy replay**, including Windows short-name aliases; authorized synthetic image browser display. [After](live-harness/media-privacy-after.json). Physical capture not implied. |
| D30 | Negative/out-of-contract video chunk indexes persisted | **Fixed, runtime verified** for -2 and 1000000 returning 400 without byte/count change. [46-check media replay](live-harness/media-privacy-after.json), [status](inventory-findings.md). |
| D31 | Monitoring total/activity disagree with displayed events | **Display fixed, fresh browser verified.** Five events/five total and last activity match; broader risk/triage stream semantics unresolved. Latest browser checkpoint. |
| D32 | Examiner exam filter forbidden and pending metric misleading | **Fixed, API and browser verified.** Authorized grading dropdown; page-scoped metric labels/count. [39/39 replay](harness/d32-d34-after.json), [detail](grading-access-defects.md). |
| D33 | Legacy fixed start bypasses admission grace window | **Fixed, both paths deny late start without new attempt.** [Replay](harness/d33-fixed-admission-after.json). Fixed expiry policy remains separate. |
| D34 | Foreign/no-department grading reads/writes | **Fixed, 39/39 scope replay plus 2/2 fresh background grading.** [Scope](harness/d32-d34-after.json), [background](harness/d34-fresh-background.json). |
| D35 | Manual grading header shows wrong automatic subtotal | **Fixed, browser verified** automatic 34/46 before manual finalization. Browser grading record. |
| D36 | Live bank edits corrupt historical question/key/grade interpretation | **Unresolved.** Original correct answer graded zero after key change; restored key makes review disagree with stored score. [Question history](live-harness/historical-question-evidence.json), [review](live-harness/historical-review-evidence.json). |
| D37 | AutoGraded candidate review omits saved question scores | **Fixed, runtime verified.** Include AutoGraded sessions. [D37/D38 replay](harness/d37-d38-after.json). Historical D36 remains separate. |
| D38 | Zero/no-comment manual grade lacks reliable saved marker | **Fixed, API and real-browser verified.** Explicit isGraded marks zero saved; attempt 212 finalized. [Replay](harness/d37-d38-after.json). |
| D39 | ForceSubmitted cannot enter grading | **Fixed, runtime completed 10/40** while attempt remains ForceSubmitted 7. [Completion state](harness/d39-completion-state.json), [detail](grading-access-defects.md). |
| D40 | Examiner See Result invokes forbidden result-finalize route | **Fixed, browser verified.** Hide unauthorized action/link; correct copy about review/publication/regrading. No API permission expansion. Browser grading record. |
| D41 | Result View All displays raw selected option IDs | **Fixed, browser verified.** Localized selected text replaces IDs; 42/56 unchanged. Browser report record. |
| D42 | Completed pooled exam card shows estimate instead of saved max | **Fixed, 2/2 API and browser verified** 56 points/count 6. [After](harness/d42-after.json), [detail](candidate-points-defect.md). |
| D43 | Alternate result/history/review routes bypass visibility flags | **Fixed, 27/27 replay**, including warm data, publication, ShowResults/AllowReview/ShowCorrectAnswers and restoration. [After](harness/d43-privacy-after.json). |
| D44 | Incident read/write/reference/reviewer scope failures | **Fixed, 54 relevant runtime checks.** Remaining 55th preview assertion is D54, later API-fixed. [After](live-harness/phase8-incident-after.json). |
| D45 | Export correct-answer column incomplete for multi-choice | **Fixed, fresh actual XLSX/PDF content verified.** All correct options shown with unchanged scores. [Artifacts](report-artifacts/d45-after), browser record. |
| D46 | Question analytics omit automatic sessions and blank answers | **Fixed, 14/14 replay.** Actual dynamic question IDs/maxima and content-based unanswered counts. [After](harness/d46-after.json), [detail](question-performance-defect.md). |
| D47 | Fixed XLSX row height clips long essay/rubric | **Fixed, fresh artifact render verified.** Content-based row height retains wrapping. [Artifacts](report-artifacts/d47-after). Native spreadsheet acceptance remains separate. |
| D48 | Report mean/highest point scores mislabeled percentages | **Fixed, browser verified.** 18-point mean, 40-point max and 40% pass rate matched independent population calculation. [Progress closure](PROGRESS.md). |
| D49 | CSV date comma creates six fields under five-field header | **Fixed, actual fresh CSV parsed:** six rows with five columns each. [After artifact](report-artifacts/reports128-after.csv). |
| D50 | Backend export jobs remain Pending without output | **Unresolved.** Four CSV/XLSX/PDF/JSON jobs failed output checks across extended observation/restart; cancel works. [Decisions/export evidence](live-harness/phase8-decisions.json). |
| D51 | Removed staff role remains usable through JWT/socket | **Source repair loaded; post-fix runtime NOT VERIFIED.** Before HTTP/socket failures retained; current-role set checks are not runtime proof. [Before](harness/phase9-permissions-before.json), [socket before](harness/d51-socket-before.json). |
| D52 | Legacy ExamProctor roster/assign/unassign bypasses scope | **Fixed, 17/17 replay**, explicit SuperAdmin grant and immediate revoke positive controls. [After](live-harness/phase9-assignment-after.json). |
| D53 | Assessment filter/nested authoring/source-pool scope failures | **Fixed, 60/60 + 3/3 replay.** Rejections independently preserve state, authorized authoring works. [Main](harness/phase9-assessment-after.json), [source/publication](harness/d53-source-publication-after.json). |
| D54 | Incident image preview URL absent | **API fixed, 6/6; browser link visible, opening NOT VERIFIED.** Tool policy blocked the click; no workaround or product-failure claim. [After](live-harness/phase8-preview-after.json), latest browser record. |
| D55 | Unassigned candidate can start restricted foreign exam | **Source repair loaded; post-fix runtime NOT VERIFIED.** Preview and both start APIs originally failed; attempts 216/217 cancelled. [Before](harness/restricted-admission-before.json). |
| D56 | Candidate formula-prefix name exported untreated to CSV | **Fixed, actual browser download/text verified.** Apostrophe prefix, five columns, unchanged scores; no native spreadsheet execution. [Before](report-artifacts/d56-before.csv), [after](report-artifacts/d56-after.csv). |
| D57 | Foreign evidence confirmation and negative size persisted | **Fixed, combined media 11/11 replay.** Ownership/positive size enforced before mutation, original 68-byte size restored. [After](live-harness/phase10-media-after.json). |
| D58 | Generic public media delete ignores uploader scope | **Fixed, same 11/11 replay.** Foreign deletion rejected and own deletion succeeds; disposable files cleaned. [After](live-harness/phase10-media-after.json). |
| D59 | Removed question cannot be re-added due to soft-delete uniqueness | **Unresolved.** Ordinary remove/re-add produces 500; no schema/index change attempted. [Detail](assessment-isolation-defect.md), [baseline](harness/d53-source-publication-before.json). |
| D60 | Invalid media pagination returns server error | **Fixed, 10/10 input matrix plus four exact bounds.** Invalid paging returns 400 and valid path remains. [Matrix](harness/phase10-http-input.json), [bounds](harness/media-pagination-after.json). |
| D61 | User listing performs slow serial per-user role queries | **Fixed, 13/13 behavior replay.** Approximately 21s → 2.1s for 83 users. [After](harness/phase11-user-list-after-final.json), [detail](http-input-and-user-list.md). |
| D62 | Ordinary concurrent start ramp deadlocks seven requests | **Fixed; two subsequent fresh 50-start ramps passed.** Start p95 19.915s before; 5.352s and 8.599s after. Candidate serialization retained. [Diagnosis](concurrent-start-defect.md), [comparison](phase11-performance-results.md). |
| D63 | Cancelled/terminal attempts remain live proctor sessions | **Fixed;6/6fresh cancellation/actual timer-expiry checks and browser0active pass.** Close terminal sessions in the same save, filter live views by nonterminal attempt state, retain history. Existing43QAghostsessions cleaned through the normal API. [Detail](live-session-lifecycle-defect.md), [after](harness/d63-regression.json). |
| D64 | SQL connection handshake timeout during50candidate autosave workload | **Observed and unresolved; no speculative code/config change.** One of600saves returned500 before the answer handler; subsequent final saves and all50scores persisted. p95save17.142s. Underlying connection-pressure/network/SQL cause beyond the trace is not established. [Diagnosis](load-reliability-finding.md), [run](harness/load-d62-after-d64-before-evidence.json). |
| D65 | Proctor list cards show 0m for active attempts with time remaining | **Fixed, 8/8 focused replay and real-browser 10m verified.** RemainingSeconds now maps to rounded-up minutes; Started/Resumed detail handled. Fresh initial bound assertion was a harness elapsed-time error, corrected using measured elapsed. [Before](harness/d65-proctor-clock-before.json), [after](harness/d65-proctor-clock-after.json), [browser record](browser-evidence.md). |
| D66 | Successful AddTime loses audit write after request scope disposal | **Fixed; 6/6 focused persisted action/audit checks.** Await existing AddTime/ForceEnd audit calls before returning. Fresh attempt 367 extended exactly 120 seconds and then ForceSubmitted, with correct actor/action/metadata in audit rows 820/821. Original missing row for 317 remains preserved. [Diagnosis](audit-lifecycle-defect.md), [after](harness/d66-audit-regression-after.json), [original readback](harness/phase11-final-readback.json). |
| D67 | Expanded calculator keypad clips below the viewport | **Fixed, real-browser verified at 1280×720.** Card height/width bounds and scrolling expose all PV argument/keypad controls; PV(0,2,100,0,0) independently returned -200. Typecheck and targeted lint passed. [Defect/fix](d67-calculator-viewport.md), [browser record](browser-evidence.md). |
| D68 | Recording plays while displayed time/control state stays stale | **Fixed, real-browser verified.** Video event handlers now attach when the video element renders after loading. Play/pause, end at 8.021 seconds, replay, slider seek to 1.5 seconds, forward-to-end and back-to-zero all matched actual media state. The original synthetic mux incompatibility was a fixture issue, separately preserved. [Reproduction and fix](d68-video-playback.md), [browser record](browser-evidence.md). |
| D69 | Video metadata appears as blank screen captures | **Fixed, negative and positive real-browser cases verified.** Two video metadata versions now produce zero screen captures. Separate Image evidence 704 remained visible as one thumbnail and a full 320×240 preview; upload/persistence/retrieval/completion passed 5/5. Explicit type-4 eligibility is inspection only. [Defect and verification](d69-evidence-classification.md). |

## Phase 1 — Administration and setup

**Tested and passed:** REAL-BROWSER work created and edited bilingual departments and staff, saved account status, exercised the dedicated Permissions role change and restored the original role. Department name-only editing preserved both descriptions after D01; D05 preserved the independent Arabic name. SIMULATED API checks verified user/department validation and lifecycle, organization/settings/template round trips, invalid-value rejection and account eligibility. D03/D05 passed 18/18, D04 account-token replay 38/38 and D07 settings/template validation 19/19. The actual notification bell displayed 42 records; marking one QA notification Read persisted after reload. [Browser evidence](browser-evidence.md), [user replay](harness/d03-d05-after2.json), [account replay](admin-extra/token-after.json), [settings replay](admin-extra/validation-after.json).

**Findings and outcome:** D01, D03, D04, D05 and D07 have the specified closure evidence. D06 is partial: account status saves correctly, but changing the role in the ordinary staff editor still reports success without changing the role; the separate Permissions workflow works. D02 remains unresolved because reset displayed success while the old password continued to authenticate and the displayed replacement did not. D61's slow user listing was later repaired and measured in phase 11. [Reset evidence](defect-D02-api-reproduction.json), [administration defects](user-defects.md).

**Unexercised variations:** saving settings does not establish enforcement of every registration, maintenance, password or session flag. External email/SMS delivery, retry/deduplication, branding uploads and complete audit/log UI navigation were not accepted. The phase used a local Development environment and existing QA accounts; production deployment configuration was not reproduced.

## Phase 2 — Question bank and scoring inputs

**Tested and passed:** SIMULATED actual API/persistence work covered single choice, weighted and equal-share multi-select, true/false and subjective questions with rubrics, bilingual content, image/PDF attachments, subject/topic changes and applicable decimal fields. D08's atomic points/options validation passed 28/28; bank scope passed 15/15, lookup scope 21/21, and corrected attachment/lookup checks 10/10. REAL-BROWSER question 156 editing verified that a total and option-weight change saved together, rejected an invalid combination, and retained the explanation after a metadata edit. [D08 replay](harness/d08-after.json), [bank scope](harness/phase2-d09-scope-regression.json), [lookup scope](admin-extra/lookup-after.json), [attachments](harness/phase2-extra-evidence.json), [explanation readback](harness/root-browser-state-verify-explanation.json).

**Findings and outcome:** D08, D09 and D24 are repaired within those checks. D36 remains an acceptance blocker: editing a bank question after an attempt began changed its historical content/key, caused an originally correct response to grade zero, and later made review disagree with the stored grade when the key was restored. This requires a snapshot/versioning or immutable-edit policy. The actual Subjective type is ID 5; a source seed's ID 4 was not used as runtime truth. [Historical mutation](live-harness/historical-question-evidence.json), [review mismatch](live-harness/historical-review-evidence.json).

**Unexercised variations:** historical multi-select weight changes, subjective rubric changes and deletion of options used by old attempts were not independently exhausted. External AI question generation and its content quality remain unverified. INSPECTION found FAQ advertising question import but no implemented bank-import endpoint/button; the candidate-import feature in phase 3 is separate.

## Phase 3 — Exam configuration, publication and assignment

**Tested and passed:** SIMULATED fixtures covered static mixed/objective exams, fixed and flexible timing, question pools/shuffle, strict settings, walk-in registration, future/expired schedules and a draft clone. Publication validation, instructions/access policy, basic unpublish/republish, scoped candidate/proctor assignment, XLSX candidate import and candidate/cohort export were exercised. Import included two valid rows, one invalid row and repeat-import handling. REAL-BROWSER exam 123 was authored and published with six questions/56 points; assignment mouse/Space/header selection and the assigned proctor were verified. D53 authoring scope passed 60/60 plus 3/3 source/publication checks. [Exam fixtures](harness/exam-manifest.json), [import/cohort manifest](harness/batch-manifest.json), [authoring replay](harness/phase9-assessment-after.json), [source/publication replay](harness/d53-source-publication-after.json).

**Findings and outcome:** D10 added the missing SuperAdmin department selector; D11 corrected publication's unrelated proctor autoassignment; D13 corrected double-toggle checkbox behavior; D14 corrected assignment scope/inactive-cohort handling. D12 is partial: member/candidate/export/assignment checks pass, but three of 26 assertions remain open for cohort metadata ownership/list/read/change/delete. D59 still returns 500 when an author removes and re-adds the same question because the soft-deleted row conflicts with uniqueness. No schema or ownership policy was invented. [D11 replay](harness/phase3-d11-verification.json), [cohort replay](harness/d12-after.json), [assignment defects](batch-assignment-defects.md), [remove/re-add defect](assessment-isolation-defect.md).

**Unexercised variations:** every combination of active-exam editing/unpublishing, source deactivation/deletion, section timers, pool shortages/order rules and cross-timezone/browser schedules was not tested. Passing a selected publication/assignment matrix does not establish every configuration combination.

## Phase 4 — Candidate access and experience

**Tested and passed:** REAL-BROWSER English attempt 193 and Arabic/RTL attempt 199 exercised instructions, wrong/correct access code, question navigation, selection/clear/save, typed subjective input, paste prevention and save/reload. Saved content and corrected question/option order survived reload. The D26 outage replay stopped the API while an answer was pending: submission remained blocked, retry saved the answer after recovery, and reload preserved it. SIMULATED access/input checks covered repeated start resuming one active attempt and both current/legacy routes, with 23/23 input-regression checks. The final attempt's calculator/spreadsheet observations are separated into phase 12. [Browser record](browser-evidence.md), [input replay](harness/phase5-input-regression.json), [outage defect/replay](offline-answer-defect.md), [order readback](harness/root-browser-state-option-order.json).

**Findings and outcome:** D15 rejects invalid/foreign answer options before mutation; D16 enforces approved identity on the tested start paths using synthetic ID data; D17 validates walk-in required/custom fields before user creation; D21 clears answered counts correctly. D26 fixes the tested open-tab retry/flush path, and D28 fixes displayed shuffle order. D27's privileged staff-token minting repair does not resolve the broader public existing-candidate identity model. D55's restricted-assignment source repair is loaded but its post-fix runtime verification is NOT VERIFIED. [D27 narrow replay](harness/d27-share-after.json), [existing public-auth observations](harness/phase10-public-auth.json), [D55 before evidence](harness/restricted-admission-before.json).

**Unexercised variations:** memory-only pending edits may be lost if the tab closes or reloads while offline. Two-tab conflicts, all browser-back/relogin paths, keyboard/screen-reader use, mobile/touch and every identity status remain incomplete. The attempted mobile viewport override left an observed 1280×720 desktop viewport, so it supplies no mobile pass. Synthetic identity approval does not verify physical capture, matching or liveness.

## Phase 5 — Live candidate and proctor

**Tested and passed:** REAL-BROWSER candidate/proctor pairs received and acknowledged a warning, applied a five-minute extension, terminated with a required reason and redirected the candidate, displayed saved events, and opened an authorized synthetic snapshot thumbnail/modal. D31's final browser replay showed exactly five events/five total, four TabSwitched plus one PasteAttempt, with last activity matching submission/end. SIMULATED actual WebSocket/HTTP work passed 48/48 core routing, reconnect, warning recovery/fallback, heartbeat, event, time and termination checks. Later private-media checks passed 46/46; metadata/deletion checks passed 11/11. These are separate evidence sets, not an overall 80/80 protocol pass. [Protocol](live-harness/protocol-after.json), [private media](live-harness/media-privacy-after.json), [metadata/deletion](live-harness/phase10-media-after.json), [browser record](browser-evidence.md).

**Findings and outcome:** D18 corrected the tested foreign proctor list/add-time access; D19 rechecked an invoking blocked socket; D20 corrected the pass-score unit; D22 corrected sibling-attempt reads; D25 exposed actual events instead of converting an API failure to an empty list. D29/D30 repaired the tested media privacy/chunk bounds. D31 totals/activity are verified, while risk/triage aggregation remains a policy/model question. The later D63 terminal-session cleanup, D65 clock and D66 audit lifetime fixes have focused evidence in phase 11 and the registry.

**Unexercised variations:** physical camera/screen preview and capture, Required/Strict screen acquisition/grace handling, permission/device loss/recovery, real TURN/NAT/firewall behavior, liveness accuracy and 50 physical media clients remain unverified. Synthetic SDP/ICE, a 1×1 image and initial non-playable chunks prove only their stated routing/storage paths. Existing idle sockets/media recipients are not proven proactively evicted on revocation; valid-state foreign ForceEnd/resume was not separately replayed. Final-phase synthetic playback is separately verified below and cannot establish physical capture.

## Phase 6 — Submission, expiry and other completion paths

**Tested and passed:** REAL-BROWSER mixed attempt 193 submitted normally; Arabic 199 retained its termination reason/state; public walk-in 200 submitted one wrong answer and one blank after the unanswered warning and independently scored 0/20. The SIMULATED completion matrix recorded 17 functional passes across full/wrong/blank/partial answers, actual one-minute expiry, duplicate concurrent submission, late-answer rejection, finite retake allowance and force-submit. Current/legacy terminal/input replay passed 2/2, fixed-admission replay denied both late-start paths without creating attempts, and ForceSubmitted completion/grade readback passed 2/2. [Completion evidence](harness/phase6-completion.json), [legacy replay](harness/d15-d23-legacy-after.json), [fixed admission](harness/d33-fixed-admission-after.json), [force-submit state](harness/d39-completion-state.json).

**Findings and outcome:** D23 now preserves Terminated/ForceSubmitted state when a later candidate submission is attempted; D33 closes the legacy late-admission bypass; D39 allows a ForceSubmitted attempt to enter grading without rewriting its terminal status. D26 prevents the tested pending-answer submit race. Later ordinary extra-attempt workflow coverage grants and reads back 50 overrides; it does not imply all resume/second-chance semantics were tested. [Extra-attempt workflow](extra-attempt-workflow.md).

**Unexercised variations:** one fixed-duration expectation remains a product/documentation decision: observed expiry is start plus duration capped by EndAt, rather than universally scheduled start plus duration. All expiry reasons, prolonged disconnect budget combinations, save/submit/terminate races, pause/resume lineage, copied-answer behavior and new-attempt histories were not exhaustively exercised. Actual one-minute expiry does not establish every scheduler/restart scenario.

## Phase 7 — Grading, manual review and regrading

**Tested and passed:** SIMULATED independent calculations covered full/partial/zero objective results, negative/over-maximum rejection, incomplete-manual finalization guards, bulk partial success, explicit regrade and coherent last-writer behavior. D32/D34 scope replay passed 39/39, fresh background grading 2/2 and D37/D38 automatic-review/zero-marker replay 2/2. REAL-BROWSER examiner grading showed the corrected automatic subtotal **34/46**, saved manual **8/10** with feedback and finalized attempt 193 to **42/56 (75%)**. Attempt 212's zero grade without a comment reloaded as Saved and finalized. [Grading replay](harness/d32-d34-after.json), [background grading](harness/d34-fresh-background.json), [zero/automatic replay](harness/d37-d38-after.json), [browser record](browser-evidence.md).

**Findings and outcome:** D32 restores the authorized examiner exam filter and labels page-scoped counts accurately; D34 corrects selected grading read/write boundaries; D35 fixes the automatic subtotal; D37 includes AutoGraded question scores; D38 preserves an explicit saved marker for zero; D39 grades force-submission; D40 removes the examiner action that called a forbidden result-finalize route and corrects publication/regrade wording. D36 historical mutation remains a blocker and is not closed by correct arithmetic on stable questions. [Grading defects](grading-access-defects.md), [historical mismatch](live-harness/historical-review-evidence.json).

**Unexercised variations:** concurrent graders have no demonstrated conflict prompt/lock; the test established coherent final state only. Selecting every option can receive full numeric points under existing multi-select rules, with differing correctness flags for weighted/equal modes; expected penalty policy needs agreement. External AI suggestions and their quality were not accepted. The fresh final 47/50 lifecycle remains a separate phase-12 result.

## Phase 8 — Results, publication, reports and incidents

**Tested and passed:** REAL-BROWSER candidate results remained unavailable before publication, then exposed passed attempt 193 and failed 200 with correct detailed review. Downloads included English and Arabic two-page PDFs, a three-sheet XLSX and CSVs. Native OOXML/text inspection and rendered PDFs verified exact 42/56, 75%, six graded questions, localized selections and all correct multi-select options; fresh spreadsheet row-height output retained long bilingual essay/rubric content. SIMULATED result-visibility replay passed 27/27, question analytics 14/14, incident checks 54 relevant passes and later image-preview API checks 6/6. Decision/export evidence remains 17/21 because four export jobs failed. [Visibility](harness/d43-privacy-after.json), [analytics](harness/d46-after.json), [incidents](live-harness/phase8-incident-after.json), [preview](live-harness/phase8-preview-after.json), [decision/export evidence](live-harness/phase8-decisions.json).

**Findings and outcome:** D41 shows selected text instead of IDs; D42 shows saved pooled-exam maxima; D43 enforces tested result/review flags; D44 corrects selected incident boundaries; D45/D47 repair correct-answer exports and long-row layout. D46 counts automatic sessions and genuine blanks. D48 labels the independently verified mean 18 and highest 40 as points; D49 quotes the date comma so each CSV row has five fields. D56's fresh actual browser download prefixes the formula-like name with an apostrophe. D50 backend CSV/XLSX/PDF/JSON jobs remain Pending without output. D54's View link is visible and authenticated bytes passed, but opening the incident link was blocked by the browser tool before site behavior, so opening is NOT VERIFIED. [D45 files](report-artifacts/d45-after), [D47 files](report-artifacts/d47-after), [CSV after](report-artifacts/reports128-after.csv), [D56 after](report-artifacts/d56-after.csv).

**Unexercised variations:** native Excel opening/printing/formula interpretation, all population/summary/leaderboard variants, automatic incident creation and reviewer/Auditor-specific UI remain incomplete. A renderer's literal shared-string index 41 was an import artifact; native OOXML proved the underlying cell empty. Working frontend downloads do not close the separate backend export-job defect.

## Phase 9 — Roles and department isolation

**Tested and passed:** existing SIMULATED records sampled two departments, owner/sibling candidates, no-department staff, selected mixed-role and department-transfer cases, SuperAdmin operations and explicit cross-department proctor grants. Covered resources included questions/lookups, nested assessment authoring, grading/results, incidents and proctor assignments. The legacy proctor-assignment replay passed 17/17 with explicit grant/revoke positive controls; D53 authoring passed 60/60 plus 3/3. REAL-BROWSER a candidate's own result worked while a foreign result was unavailable; the Examiner administrator result route returned Access Denied; dedicated Permissions edits persisted and were restored. [Proctor grant/revoke](live-harness/phase9-assignment-after.json), [authoring](harness/phase9-assessment-after.json), [source/publication](harness/d53-source-publication-after.json), [browser record](browser-evidence.md).

**Findings and outcome:** D09, D14, D18, D22, D34, D43 and D44 have the resource-specific closure documented above; D52 and D53 close their stated legacy/nested routes. D12 cohort metadata ownership remains unresolved. D51 stale-role HTTP/socket source repair is loaded, but original before failures have no accepted post-fix runtime replay. D55 admission verification is similarly absent. The ordinary role editor D06 remains distinct from the working Permissions page. [D51 before](harness/phase9-permissions-before.json), [socket before](harness/d51-socket-before.json), [D55 before](harness/restricted-admission-before.json).

**Unexercised variations:** this is sampled route/role/state coverage, not exhaustive isolation assurance. ProctorReviewer/Auditor workflows, every mixed-role combination, no-department reviewer image access and immediate eviction of idle established connections remain unverified. No new isolation or security replay was performed during this report expansion.

## Phase 10 — Recorded adversarial and input findings

**Evidence reviewed, with explicit limits:** the rejected delegated security pass is **CLOSED / NOT VERIFIED** and was not restarted or replaced. This subsection only consolidates earlier bounded evidence: public-auth identity observations, media references/metadata/deletion, result visibility and HTTP input validation. The recorded HTTP input matrix passed 10/10 and exact pagination bounds 4/4 after D60; media ownership/size/deletion replay passed 11/11 for D57/D58. D56 additionally has a fresh actual browser CSV download/content check. [Input matrix](harness/phase10-http-input.json), [bounds](harness/media-pagination-after.json), [media replay](live-harness/phase10-media-after.json), [CSV](report-artifacts/d56-after.csv).

**Findings and outcome:** the narrow D27 privileged-staff token repair passed its recorded replay. Broader public existing-candidate selection/registration could still issue general account access, and a common walk-in default credential authenticated an existing QA account. The public-auth file contains six unresolved identity/token-model failures alongside six conventional checks; those failures are retained. D51/D55 remain source fixes without post-fix runtime acceptance. Individual repairs such as D29, D43 and D57/D58 do not add up to a complete security assessment. [Public-auth observations](harness/phase10-public-auth.json), [D27 narrow replay](harness/d27-share-after.json).

**Not exercised or accepted:** no completed rejected security pass, later stored-XSS probe, production TLS/deployment verification, comprehensive threat model or universal role/resource matrix is claimed. Native spreadsheet execution of the CSV and proactive eviction of idle socket/media listeners are also unverified. A future authorized assessment is separate work; no new security action was taken to prepare this report.

## Phase 11 measured workload and recovery

**Method:** SIMULATED actual authenticated HTTP/SignalR traffic against the running application and test database: 50 candidate connections plus a proctor, a ramp with 10 concurrent starts, repeated four-answer saves that varied partial/full selections, continuous heartbeats, timer reads, live monitoring, warning delivery, an extension, one candidate disconnect/rejoin, final saved-answer reload and submission. This exercised active workload, not merely 50 records. One actual proctor browser observed the cohort; 50 rendered browsers/cameras were not used. The two complete runs lasted approximately 5½ minutes each, including their ramps.

The second workload completed 120/120 assertions and no HTTP errors, including 50 fresh starts, 600 saves, 600 heartbeats, 600 timer reads, 50 persisted-answer reloads and 50 submissions with independently verified 40/40 scores. Actual proctor browser evidence showed 50 load cards and removed them after submission. The first full workload remains 119/120 because of D64; the second has the separate D66 log/audit failure. [Full comparison, latency/resource tables and retained limitations](phase11-performance-results.md), [latest assertions](harness/phase11-load-evidence.json), [latest manifest](harness/load-manifest.json).

| Operation | First complete run p95 | Second complete run p95 |
|---|---:|---:|
| Fresh start | 5.352 s | 8.599 s |
| Save four answers | 17.142 s | 3.992 s |
| Heartbeat | 1.446 s | 1.512 s |
| Timer read | 0.935 s | 1.039 s |
| Live monitoring | 3.293 s | 2.715 s |
| Reload saved session | 1.618 s | 1.586 s |
| Submit | 3.899 s | 2.289 s |

The first run had 599 measured heartbeat/timer pairs because a failed save prevented that round's following pair. Initial setup encountered administrator rate limiting, which was preserved; an initial ramp then exposed seven SQL deadlocks and only 43 successful starts. D62's narrow lock repair preceded both complete 50-start runs. D64's later timeout occurred during SQL connection establishment in token validation, before the answer handler; its deeper cause remains unresolved. No timeout, rate limit or validation was weakened to obtain a pass.

The second API process peaked at 450.09 MiB working set, 320.78 MiB private memory and 0.337% host CPU across 32 logical processors. Roughly 125 seconds of recovery ended at 383.48/247.46 MiB working/private memory; the API did not crash. This short observation establishes neither a leak nor absence of one. Next dev peaked at approximately 1.8 GiB working set/4.3 GiB private memory; this is not production frontend memory or 50 browser renderers. SQL-server resources, production hosting, media bandwidth, endurance and maximum capacity were not measured.

Ordinary extra-attempt grants passed 254/254 setup checks. Final normal readback passed 51/51 override/history checks: 43 grants consumed, seven remain unused because those candidates still had an ordinary second attempt available. All latest attempts were Submitted, no active attempt remained, MaxAttempts stayed 2 and prior history was retained. [Grant workflow](extra-attempt-workflow.md), [readback summary](harness/phase11-final-readback-summary.json).

## Phase 12 — Final full-lifecycle regression

**Fresh preparation:** created candidate `qa26.final.lifecycle@example.test`, Engineering exam 143 and calculator-enabled subjective question 170. The exam used five static questions, 50 points, pass score 30, a 30-minute attempt within a 120-minute admission window, two allowed attempts, assigned-only admission with code QA26FINAL, proctoring enabled and no required physical devices/identity. Setup persisted the configuration and explicitly verified that it created no attempt. [Setup evidence](harness/phase12-final-setup.json).

**REAL-BROWSER candidate and proctor:** the candidate signed in, found the assigned exam, entered the code, accepted exam instructions and started attempt 368. Single choice, weighted multi-select, equal multi-select and true/false answers each earned an independently expected 10 points; a 25-word subjective answer was saved. Reload retained all selections/text and 5/5 progress. The proctor saw the same candidate/session 320, 5/5 progress and a correct remaining clock; sent a warning that the candidate acknowledged; and granted one minute. The candidate clock updated by the 60-second server synchronization and retained the extension on reload. Warning delivery was observed after polling, not claimed instantaneous. Normal submission moved the candidate to Under Review and removed the live proctor card, leaving 0 Active Sessions. [Browser evidence](browser-evidence.md).

**REAL-BROWSER tools:** basic precedence `2+3*4=14` with expression history, statistical `SUM(2,3)=5`, scientific `sqrt(9)=3`, and financial `PV(0,2,100,0,0)=-200` were exercised. Financial mode exposed D67's clipped controls at 1280×720; the bounded scrolling fix made the original calculation accessible, and basic `7*8=56` passed after reload. The spreadsheet displayed A1=2, A2=3, A3=`SUM(A1:A2)`=5; changing A1 to 4 recalculated A3 to 7. These cover representative functions in each calculator mode, not every financial convergence/domain case or spreadsheet capability. Scratchpad persistence across closing/reopening, complex formulas, multiple worksheets and mobile tool behavior were not accepted by this run. [D67 repair](d67-calculator-viewport.md).

**REAL-BROWSER grading and publication:** Examiner saw 40/40 automatic points, awarded 7/10 with feedback, reloaded to verify Saved state, and finalized. Administrator reviewed all five answers and 47/50/94%, then published. Before publication the candidate remained Under Review; afterward My Exams changed to Completed/Passed and the result showed 94%, 47/50. Detailed subjective review retained 7/10 and the exact feedback. A separate read-only persisted-state checkpoint verified all 16 assertions, including the four exact option sets, ordinary Submitted status, completed grading 199, published result 170 and **40+7=47/50=94%**. [Final checkpoint](harness/phase12-final-checkpoint.json), [fixture manifest](harness/phase12-final-manifest.json).

**Downstream report:** downloaded the final English PDF from the administrator UI, parsed it and visually inspected both rendered pages. It contains all five rows, both multi-select answer sets, manual 7/10, 47.00/50, 94.0% and pass 30 without clipped content. Narrow type/Method columns wrap words awkwardly; this is a cosmetic improvement recommendation. Earlier Arabic PDF and XLSX coverage remains in phase 8. [Final PDF](report-artifacts/final/final-result-en.pdf), [page 1](report-artifacts/final/page-1.png), [page 2](report-artifacts/final/page-2.png).

**SIMULATED media integration and REAL-BROWSER playback:** generated an eight-second 320×240 VP8/Opus test pattern/tone, uploaded it as the candidate, retrieved matching SHA-256 bytes as authorized staff and verified asynchronous finalization. The first synthetic mux had backwards block timestamps and failed browser MSE decoding even though the delivery bytes matched; this was a fixture issue. The original 230170-byte version/evidence 702 is archived. A lossless remux produced 230169 bytes, no backwards blocks and successor evidence 703; replacement checks passed 7/7. The browser rendered and played that corrected clip. D68 then exposed a separate real defect: actual video ended at 8.021 seconds while the display stayed at zero. After the event-handler repair, play/pause, end display, replay, seek to 1.5 seconds, forward-to-end and back-to-zero all matched actual media state. D69 removed video metadata from the screen-capture grid. [Original integration](harness/phase12-video-manifest.json), [proxy readback](harness/d68-video-proxy.json), [replacement manifest](harness/d68-replacement-manifest.json), [D68](d68-video-playback.md), [D69](d69-evidence-classification.md).

The original integration harness's 18 passing checks include a local FFmpeg exit-status assertion that overlooked an Opus packet-header diagnostic. It is not clean audio acceptance. Browser rendering/control checks are independent evidence. Physical camera/microphone/screen capture, audible quality and synchronization, long/multi-chunk continuity, other codecs, capture flush during submission/termination, and production network/storage remain unverified.

The final regression reuses key supported paths after the combined repairs; it does not erase unresolved findings, replace the earlier configuration matrices, or imply that every meaningful combination was exercised. The separate physical/manual acceptance list remains required.

## Engineering checks and known test limitations

| Check | Recorded result | Limits |
|---|---|---|
| Backend isolated suite | 234 passed, 64 skipped, 0 failed; 298 total on current D65/D66 source | SQL/Redis fixtures skipped because setup creates/changes schema; skipped means not run. |
| Frontend TypeScript | Pass | Static typing does not establish browser workflows. |
| Frontend lint | 0 errors, 70 warnings | Existing warnings retained; no suppression used for a pass. |
| Isolated production build | Pass; 78 static pages and 109 listed routes | Temporary copy used; active browser QA still ran against Next dev. Does not measure production hosting capacity. |
| API proxy tests | 7/7 | Simulated upstream integration against built artifact. |
| Answer-save queue tests | 7/7 | Supports D26 logic; actual outage browser replay is separate. |
| Diff whitespace check | Pass at final engineering checkpoint | Applies to the recorded final source snapshot. |

[Final engineering record](final-engineering-checks.md), [latest test results](test-results/restart11-final.trx), [D62 source validation](concurrent-start-defect.md). The final browser lifecycle is recorded separately in phase12 and passed through report export; automated checks supplement that evidence.

Important evidence corrections: initial live tests lacked heartbeats and expired fixtures; initial option-order stability was author sorting; some early cross-create assertions ignored persisted unauthorized rows; source seed Subjective ID 4 differs from live ID 5; a spreadsheet renderer represented blank shared string 41 as literal 41 despite native OOXML proving an empty value. These were corrected rather than counted as product passes/failures. [Detailed reconciliation](coverage-audit.md).

## Artifacts and QA data changes

Recommended priorities are to resolve public candidate identity and historical grading integrity first, then complete the remaining recovery/role/cohort/export/authoring contracts. Define measurable start/save/submit latency and error targets before deployment; repeat the realistic workload in the intended hosting environment with SQL connection and server telemetry, longer endurance, and representative media traffic. The observed second-run start p95 of 8.599 seconds should be explicitly accepted or improved.

Retain regression scenarios for the confirmed failures, especially concurrent start locking, terminal-session cleanup, awaited audit writes, result privacy, answer retry and UI events that attach after asynchronous loading. Improve small-screen and keyboard accessibility, label remaining icon/slider controls, and widen the PDF type/Method columns. Clarify which capture/upload paths are implemented and which external integrations are configured; a placeholder or success message must not imply a completed operation. Durable offline answer storage and historical content versioning need explicit product decisions before implementation.

The complete evidence is under this report's directory. Primary entry points: [PROGRESS.md](PROGRESS.md), [browser-evidence.md](browser-evidence.md), [coverage-audit.md](coverage-audit.md), [harness coverage](harness/COVERAGE.md), [inventory findings](inventory-findings.md), [live status](live-harness/status.md), and [environment](environment.md).

Actual export artifacts and render/parse outputs are under [report-artifacts](report-artifacts), including English/Arabic PDFs, candidate XLSX, D45/D47 repairs and before/after CSVs. Import/export XLSX and candidate/batch manifests are in [harness](harness). JSON evidence records classifications, HTTP outcomes and independent persisted-state checks; scripts are reproducibility aids, not proof they ran. TRX files record automated suites. Logs may be ignored local files and should not be inferred absent from this working directory simply because Git does not track them.

Synthetic QA records and audit/history intentionally remain in the dedicated test database. The following identifies known records from saved manifests and final readbacks. It is not a new database-wide scan, and an original creation manifest alone is not proof of a record's latest status. Exact candidate-to-attempt mappings are retained in the linked JSON rather than inferred from ID order.

| QA data group | Exact known IDs and recorded disposition | Authoritative saved record |
|---|---|---|
| Departments and actors | Browser department **7**; Engineering **8**; Operations **9**. The role-actor manifest contains exact user UUIDs and QA email addresses. Deleted lifecycle fixtures include department **10** and user **f4ff8f17-a9e7-491c-b783-95d407eb58b5**. | [Actor/department manifest](harness/data-manifest.json), [browser record](browser-evidence.md) |
| Bank and media fixtures | Subjects **23/24**, topics **34/35**; questions **131** single, **132** weighted multi, **133** equal multi, **134** true/false, **135** subjective, **136** Operations single. Questions **138/139/140** and attachment **12** are recorded deleted. Bank media UUIDs **78129330-9236-4aad-8492-165881a873ac** (PNG) and **60fd2312-754d-4655-a93d-8ca1ab72b630** (PDF) are in the manifest. Browser-edited question **156** and final question **170** are additional fixtures. | [Bank manifest](harness/bank-manifest.json), [final manifest](harness/phase12-final-manifest.json) |
| Base exam configurations | **115** mixed lifecycle, **116** auto, **117** fixed/code, **118** pooled, **119** walk-in, **120** strict, **121** load, **122** Operations, **124** future, **125** expired and **126** draft clone. Browser-authored mixed exam **123** is recorded separately. These configurations remain QA fixtures; a schedule label is not a current-state read. | [Exam manifest](harness/exam-manifest.json), [browser record](browser-evidence.md) |
| Imported cohort/candidates | Cohort **9**, candidate **062a0b10-77eb-4689-861c-6b9d84dcce6e** (`qa26.import.a@example.test`) and **936ba850-29c7-4898-b4e1-f1c6bf510a2d** (`qa26.import.b@example.test`). Import, duplicate-import and candidate/cohort export artifacts remain. | [Batch/import manifest](harness/batch-manifest.json) |
| Browser and completion history | Browser attempts **193** (42/56), **199** (terminated), **200** (wrong/blank 0/20) and **212** (zero manual grade). Completion exams **127/128/129/130** retain attempts **202/203/204/205/206/207/208**; **202** expired and **206** ForceSubmitted in the recorded final state. Grading sessions **80/83/84/85/86/87/90** and objective result IDs **56/57/58/61/67**, manual result **62**, remain in recorded history. | [Completion manifest](harness/completion-manifest.json), [grading manifest](harness/grading-manifest.json), [result manifest](harness/result-manifest.json), [browser record](browser-evidence.md) |
| Historical integrity reproduction | Question **166**, exam **131**, attempt **210**, grading session **88** and result **60** preserve D36's mutation/review evidence. Original question key restoration does not rewrite the incorrectly stored historical score. | [Historical fixture](live-harness/historical-question-fixtures.json), [review evidence](live-harness/historical-review-evidence.json) |
| Protocol, incidents and export jobs | Recorded media/incident context: attempts **197/198**, sessions **149/150**, synthetic snapshot **700**, incident **10** and comment **1**. Browser incident **10** was Closed/Cleared at final inspection. Export jobs **1–4** remained Pending without output; export **5** was cancelled. Synthetic media does not represent physical ID/camera evidence. | [Phase-8 fixtures](live-harness/phase8-fixtures.json), [decision/export evidence](live-harness/phase8-decisions.json), [browser record](browser-evidence.md) |
| Initial load history and completed runs | Exam **121**, candidates `qa26.load.01@example.test` through `qa26.load.50@example.test`, with exact UUID mappings in the manifests. Initial attempts **219–261** / sessions **171–213** were cancelled/closed with history retained. First full-run attempts **262–311** / sessions **214–263** and second-run attempts **314–363** / sessions **266–315** all completed and independently scored 40/40. | [Initial ramp](harness/load-ramp-before-manifest.json), [first full run](harness/load-d62-after-d64-before-manifest.json), [second full run](harness/load-manifest.json) |
| Extra-attempt grants | Override IDs **6–55** granted through normal operations with unchanged MaxAttempts **2**. Final readback shows **43 consumed**, while **34–40** remain unused for load candidates **29–35**, whose ordinary second allowance was sufficient. No grant/history was deleted. | [Grant manifest](harness/d64-retake-grants-manifest.json), [final readback](harness/phase11-final-readback-summary.json) |
| D63/D65/D66 regression records | Exam **141**: cancelled attempt **312**/session **264**, expired **313**/session **265**. Exam **142**: original clock attempt **364**/session **316** later expired; corrected **366**/session **318** submitted. Audit precondition fixture **365** expired; corrected **367** on exam **141** was ForceSubmitted, with audit rows **820** AddTime and **821** ForceEnd. Original attempt **317** has no fabricated/backfilled audit row. | [D63 manifest](harness/d63-regression-manifest.json), [D65 manifest](harness/d65-proctor-clock-manifest.json), [D66 manifest](harness/d66-audit-regression-after-manifest.json), [audit diagnosis](audit-lifecycle-defect.md) |
| Fresh final lifecycle | Exam **143**, new subjective question **170**, candidate **44799c41-8cfd-4ab8-a90b-13632121949a** (`qa26.final.lifecycle@example.test`), Submitted attempt **368**, completed proctor session **320**, completed grading **199**, published result **170** with **47/50 (94%)**, and historical synthetic recording metadata **702** plus current corrected recording evidence **703**. | [Final manifest](harness/phase12-final-manifest.json), [final checkpoint](harness/phase12-final-checkpoint.json), [original media manifest](harness/phase12-video-manifest.json), [current media manifest](harness/d68-replacement-manifest.json), [browser record](browser-evidence.md) |

Configuration and temporary account-role/block changes were restored where stated. Original video-retention 0 required explicit test-data restoration after the endpoint normalized it to 30; no schema changed. Shared browser candidate identity was not changed by the synthetic-ID fixture. Temporary unauthorized assignments and disposable authoring/media fixtures were cleaned as documented; soft-deleted/audit rows remain. The D56 name fixture was renamed after verification. The 43 failed-ramp attempts were cancelled and their terminal proctor sessions closed through normal APIs, preserving history. The second workload created attempts 314–363. Override IDs 6–55 remain in history; seven grants remain unused. [Load data and readback](phase11-performance-results.md). No fabricated restoration hides a reproduced defect.

The final fixture and its released result remain in the test database: exam 143, question 170, attempt 368, session 320, grading 199 and published result 170. Its full browser sequence, independent 47/50 calculation, candidate review and final PDF are documented in phase 12 above. A separate completed image regression remains as exam 144, attempt 369/session 321 and Image evidence 704 ([five-check record](harness/d69-image-regression.json)). Synthetic media source and retrieved copies are retained with SHA-256 evidence; they do not represent physical capture.

## Changed production source and tests

The snapshot [changed-source-files.json](changed-source-files.json) was derived from actual `git diff --name-only` plus `git ls-files --others --exclude-standard`, not from a planned file list. It lists **71 production-source files and 7 test files**, excluding this QA documentation/harness/evidence and runtime media fixtures. [Source-change rationale](source-change-rationale.md) maps every production file to the confirmed defect or required supporting change; the registry above records verification and unresolved scope.

The changes span validation/DTOs, existing lifecycle and resource services, proctor media access, answer retry/order, administration/assignment/grading/results UI and export formatting. No migration/schema file is in that production snapshot. The exact filenames follow; they identify source changes, not a claim that every changed line was exercised by every test.

<!-- SOURCE_FILE_LIST: generated below from changed-source-files.json -->

### Production files

```text
Backend-API/Application/DTOs/Grading/GradingDtos.cs
Backend-API/Application/DTOs/Proctor/ProctorDtos.cs
Backend-API/Application/DTOs/QuestionBank/QuestionDtos.cs
Backend-API/Application/DTOs/Users/UserDtos.cs
Backend-API/Application/Validators/Assessment/WalkInAnswerValidation.cs
Backend-API/Application/Validators/Candidate/CandidateAnswerValidation.cs
Backend-API/Application/Validators/Notification/NotificationValidators.cs
Backend-API/Application/Validators/QuestionBank/QuestionOptionRules.cs
Backend-API/Application/Validators/QuestionBank/QuestionValidators.cs
Backend-API/Application/Validators/Settings/SystemSettingsValidators.cs
Backend-API/Application/Validators/Users/UserValidators.cs
Backend-API/Controllers/Attempt/AttemptController.cs
Backend-API/Controllers/Grading/GradingController.cs
Backend-API/Controllers/MediaController.cs
Backend-API/Controllers/Proctor/ProctorEvidenceFileController.cs
Backend-API/Controllers/Proctor/VideoRecordingController.cs
Backend-API/Domain/Common/AnswerContent.cs
Backend-API/Domain/Common/AttemptOptionOrder.cs
Backend-API/Infrastructure/Hubs/ProctorHub.cs
Backend-API/Infrastructure/Services/Assessment/AssessmentService.cs
Backend-API/Infrastructure/Services/Assessment/ExamShareService.cs
Backend-API/Infrastructure/Services/Attempt/AttemptService.cs
Backend-API/Infrastructure/Services/AttemptControl/AttemptControlService.cs
Backend-API/Infrastructure/Services/AuthService.cs
Backend-API/Infrastructure/Services/Authorization/CandidateAssignmentPolicy.cs
Backend-API/Infrastructure/Services/Authorization/CandidateIdentityPolicy.cs
Backend-API/Infrastructure/Services/Authorization/ResourceAuthorizationService.cs
Backend-API/Infrastructure/Services/Batch/BatchService.cs
Backend-API/Infrastructure/Services/Candidate/CandidateService.cs
Backend-API/Infrastructure/Services/CandidateExamDetails/CandidateExamDetailsService.cs
Backend-API/Infrastructure/Services/ExamAssignment/ExamAssignmentService.cs
Backend-API/Infrastructure/Services/ExamResult/ExamResultService.cs
Backend-API/Infrastructure/Services/Grading/AiGradingService.cs
Backend-API/Infrastructure/Services/Grading/GradingService.cs
Backend-API/Infrastructure/Services/Incident/IncidentService.cs
Backend-API/Infrastructure/Services/Lookups/LookupsService.cs
Backend-API/Infrastructure/Services/MediaStorageService.cs
Backend-API/Infrastructure/Services/Proctor/AiProctorService.cs
Backend-API/Infrastructure/Services/Proctor/ExamProctorService.cs
Backend-API/Infrastructure/Services/Proctor/ProctorService.cs
Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs
Backend-API/Infrastructure/Services/UserService.cs
Backend-API/Infrastructure/Storage/PublicMediaFileProvider.cs
Backend-API/Program.cs
Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx
Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/question-renderer.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/assign-to-exam/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/exam-details/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/departments/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/grading/[submissionId]/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/grading/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/[sessionId]/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/incidents/[id]/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/stream/[candidateId]/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/video/[candidateId]/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/[id]/edit/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/reports/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/results/ai-report/[examId]/[candidateId]/page.tsx
Frontend/Smart-Exam-App-main/app/(dashboard)/results/review/[examId]/[candidateId]/page.tsx
Frontend/Smart-Exam-App-main/components/exam/exam-calculator.tsx
Frontend/Smart-Exam-App-main/components/exam/exam-setup-content.tsx
Frontend/Smart-Exam-App-main/components/proctor/evidence-image.tsx
Frontend/Smart-Exam-App-main/components/ui/video-chunk-player.tsx
Frontend/Smart-Exam-App-main/lib/api/admin.ts
Frontend/Smart-Exam-App-main/lib/api/grading.ts
Frontend/Smart-Exam-App-main/lib/api/proctoring.ts
Frontend/Smart-Exam-App-main/lib/exam/answer-save-queue.ts
Frontend/Smart-Exam-App-main/lib/export/candidate-report.ts
Frontend/Smart-Exam-App-main/lib/i18n/translations.ts
Frontend/Smart-Exam-App-main/lib/types/api-params.ts
```

### Test files

```text
Backend-API.Tests/CandidateInputValidationTests.cs
Backend-API.Tests/NotificationIntegrationTests.cs
Backend-API.Tests/PublicMediaFileProviderTests.cs
Backend-API.Tests/QuestionOptionValidationTests.cs
Backend-API.Tests/SecurityIntegrationTests.cs
Backend-API.Tests/SettingsValidationTests.cs
Frontend/Smart-Exam-App-main/tests/answer-save-queue.test.mjs
```

## 1. Overall functional readiness

**Substantial coverage, conditional readiness only.** Real desktop browser work covered administration, question editing, exam publication/assignment, English and Arabic candidate journeys, proctor warning/time/termination, outage answer recovery, manual grading, publication, candidate review and downloaded reports. Independent API/persisted-state matrices covered more scoring, schedule, assignment, completion, grading, reporting and role variations.

The strongest earlier end-to-end result is browser attempt **193**: independent objective subtotal 34 plus manual 8 equals **42/56 (75%)**; candidate visibility changed only after publication, question-level review matched, and actual English/Arabic PDF plus XLSX exports were inspected. Arabic attempt 199 preserved termination; walk-in 200 submitted a wrong/blank combination and received 0/20. These are concrete workflows, not evidence that every configuration combination works.

Customer-facing defects remain in reset/recovery, the ordinary staff role editor, cohort ownership, historical question integrity, backend export jobs and remove/re-add authoring. The fresh final lifecycle passed through published 47/50 (94%), candidate feedback review and the exported PDF. This does not close the unresolved findings or physical acceptance gaps. [Browser record](browser-evidence.md), [phase coverage audit](coverage-audit.md), [feature inventory](feature-inventory.md).

## 2. Security readiness

**Not accepted as secure or complete.** Earlier scoped findings resulted in verified repairs to account eligibility, resource checks, input validation, result visibility, incidents and media. Those individual passes are retained in the registry above.

Unresolved issues include cohort metadata ownership (D12), the public candidate-selection/walk-in identity model associated with D27, and missing post-fix evidence for stale-role revocation (D51) and restricted-exam admission (D55). Existing public-auth records show that selecting/registering an existing candidate through a public share could issue general account credentials with access to an unrelated exam result, and that a common default walk-in password authenticated an existing QA account. The narrow D27 fix prevents privileged staff-token minting; it does not resolve those broader identity semantics. No authentication redesign was invented. [Existing public-auth evidence](harness/phase10-public-auth.json), [coverage notes](harness/COVERAGE.md).

The rejected delegated security pass remains CLOSED / NOT VERIFIED. Stored-XSS testing planned later was not run. Idle established socket/media listeners are not proven proactively evicted after role/account changes. Local HTTP testing does not verify production TLS or deployment controls. A separate authorized assessment is needed before a broad security conclusion.

## 3. Live Candidate + Proctor readiness

**Ordinary tested controls work; physical proctoring acceptance is incomplete.** Real browsers confirmed warning delivery/acknowledgment, a five-minute extension, termination with reason and candidate redirect, saved events and synthetic snapshot display. Fresh D31 browser closure shows five events/five total, four TabSwitched plus one PasteAttempt, correct last activity and retained score/progress. Actual HTTP/SignalR simulation passed 48 core routing, reconnect, warning recovery, heartbeat, event, time and termination checks. [Browser record](browser-evidence.md), [protocol evidence](live-harness/protocol-after.json).

D63 terminal-session cleanup passed focused cancellation/expiry checks and the second workload's browser observation showed exactly 50 cards that disappeared after submission. D65 shows a positive, decrementing clock, with 8/8 focused checks and real-browser 10m verification. The final browser pair verified another warning, a one-minute extension, submission and card removal. The finalized synthetic VP8/Opus clip rendered and played through the application; D68 playback controls and D69 screenshot classification have focused verification. Physical camera preview/capture, screen acquisition, audible quality, device interruption, long/multi-chunk recordings and real network/TURN/NAT behavior remain unverified. D31 risk/triage aggregation remains a separate policy/model question; disabled warning thresholds explained Countable 0. D54 shows an incident image View link, but the tool blocked clicking it before site behavior, so that opening remains unverified and is not classified as a product defect.

## 4. Performance/concurrency readiness

**A complete 50-candidate simulated workload passed; broad reliability qualification remains open.** After seven initial start deadlocks, two fresh 50-start runs completed. Both retained all final answers and produced 50 Submitted attempts with independently correct 40/40 scores. The first had one SQL connection timeout (119/120); the second passed 120/120 with zero HTTP errors but one missing audit write (D66), subsequently repaired and verified 6/6. D64 remains unresolved. The second run had start p95 8.599s, save p95 3.992s and submit p95 2.289s. These are measured observations, not an agreed latency target. [Full comparison and resources](phase11-performance-results.md).

The second API process peaked at 450.09 MiB working set, 320.78 MiB private memory and 0.337% host CPU across 32 logical processors. Brief recovery samples do not prove absence of leaks. Neither run measured 50 browser renderers, real-video throughput, SQL-server resources, production hosting or endurance. D61's 83-user listing improved from approximately 21s to 2.1s with 13/13 behavior checks. [User-list evidence](http-input-and-user-list.md).

## 5. Remaining manual/physical acceptance tests I should personally perform

1. Run a real candidate/proctor pair on the intended devices and supported browsers. Allow, deny, revoke and restore camera/screen permission; unplug/reconnect the camera; check actual live image and screen at both sides, including reload/reconnect.
2. Exercise Required/Strict screen modes and grace expiry, fullscreen/lockdown controls, a real network interruption, and the resulting warnings/termination behavior. Verify business expectations before judging policy-dependent cases.
3. Record a real exam segment, submit/terminate while recording, and play/seek/download the finalized recording. Check final upload, image quality and audio/video synchronization if supported. Repeat across the intended firewall/NAT/TURN and production storage path.
4. Exercise real ID/liveness capture and Pending/Approved/Rejected/Flagged/resubmission workflows. The QA approval used synthetic images and does not validate biometric accuracy or demo risk/liveness output.
5. Inspect the incident image View link manually. Its UI link and API bytes are verified; browser automation was prevented from opening it. Verify reviewer/Auditor-specific UI if those roles are required.
6. Run mobile/touch, keyboard/screen-reader and zoom checks, plus Arabic throughout the full lifecycle. The attempted mobile viewport override did not change the observed 1280×720 viewport and provides no mobile evidence.
7. Open the generated XLSX and CSV in the actual spreadsheet application customers use; inspect long bilingual content, printing and formula-prefix treatment. PDFs were rendered and reviewed; native Excel execution was not performed.
8. Verify configured email/SMS delivery, retry/deduplication, external AI generation/suggestions, automatic incident generation and production scheduling/storage behavior. The in-app notification bell showed 42 records and Mark read persisted after reload; that does not prove external delivery.
9. Complete the agreed timing/scoring/editing rules: fixed late-start duration, multi-select wrong-option policy, historical author edits, concurrent examiner conflicts, all required pause/resume/second-chance paths and long offline forced-close behavior.

The full distinction between untested variants and confirmed defects is in [coverage-audit.md](coverage-audit.md). Untested behavior is not automatically a product defect.

## 6. Any blockers remaining before customer acceptance

| Blocker/decision | Required outcome |
|---|---|
| D02 reset/recovery false success | Deliver an actual credential-recovery contract and functioning UI/API; stop presenting fake success. |
| D06 ordinary staff role editor | Make the visible role edit work or explicitly direct users to the working Permissions workflow. |
| D12 cohort metadata ownership | Define department/global ownership and implement/test the agreed list/read/change/delete boundaries. Member-level repairs alone do not close it. |
| D27 broader public identity model | Decide how existing candidate ownership is proven and constrain intended access; privileged staff selection is fixed but broader account access remains unresolved. |
| D36 historical question integrity | Adopt immutable snapshot/versioning or an explicit editing policy; preserve historical content, keys and grade/review consistency. |
| D50 backend export jobs | Implement processor/download behavior or remove/clearly disable the promised job workflow. Frontend downloads are a separate feature. |
| D59 remove/re-add question | Resolve soft-deleted row reuse/restoration or uniqueness policy so ordinary editing does not return 500. |
| D64 SQL connection timeout under load | Investigate connection/dependency degradation and establish the agreed latency/error reliability target; a successful later save does not erase the observed failure. |
| D51/D55 verification gaps | Treat the fixes as loaded but not runtime-verified; keep their original findings visible pending separate permitted verification. |
| Physical and deployment acceptance | Complete the required physical/device/media/customer-environment scenarios above; the fresh ordinary phase-12 lifecycle has passed. |

No schema/migration changes were authorized or performed. Several unresolved items require product decisions rather than an invented policy.

## 7. Your final assessment of whether the application is ready for my own final manual acceptance pass

**Yes, it is ready for your structured manual acceptance pass with the documented blockers visible. It is not ready for unconditional customer sign-off.** The fresh final browser lifecycle, independent result calculation, publication/review, PDF export and synthetic playback checks are complete. The second 50-candidate workload passed its HTTP/persistence assertions, and the defects found in its audit/monitoring follow-up have focused verification. Use the manual list above to assess real devices and your deployment. Passing that review cannot erase unresolved D02/D06/D12/D27/D36/D50/D59/D64 or substitute for the missing security and physical-media evidence.
