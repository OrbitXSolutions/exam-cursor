# Production source change rationale

This supplements the final report with an explicit file-to-reason map. The registry explains defects and verification; the plain filename inventory alone did not tie each DTO, helper, shared renderer and service change to its purpose. This document closes that traceability gap. It is an offline source/document review, not new runtime or security testing.

Captured 2026-09-19T14:51:57.631Z from actual `git diff --name-only` plus untracked source, excluding QA artifacts, runtime media and test files. **71 production files are mapped exactly once**, including the video-player file absent from the earlier 70-file snapshot. No final-report or production source was edited by this audit.

Finding IDs refer to the [final report registry](FINAL-QA-REPORT.md). A reason does not establish a runtime pass: D51/D55 remain unverified; D06 roles, D12 metadata, the broader D27 identity model, D36, D50, D59 and D64 remain open as recorded. Cache-key work does not prove actual cache hits because the current cache service reads the database. D68 distinguishes a corrected synthetic mux fixture from the repaired playback-control UI defect; real-browser play/pause/end, replay and seeking now match the actual media state. D69 removes video evidence from the screenshot collection, with both video-only and positive Image 704 browser cases verified. Neither establishes physical media acceptance.

## Administration and settings

| Changed production file | Why it changed |
|---|---|
| `Backend-API/Application/DTOs/Users/UserDtos.cs` | D05: carry Arabic full name independently in list/detail/update contracts so the UI does not substitute the English/display name. |
| `Backend-API/Application/Validators/Users/UserValidators.cs` | D05: bound the newly carried Arabic name to the persisted name length. |
| `Backend-API/Application/Validators/Notification/NotificationValidators.cs` | D07: reject notification settings/template/test-send values outside supported enums, lengths and worker bounds before invalid persistence or server errors. |
| `Backend-API/Application/Validators/Settings/SystemSettingsValidators.cs` | D07: reject invalid upload/session/password limits and unsupported default proctor modes. |
| `Backend-API/Infrastructure/Services/UserService.cs` | D03/D05/D61: validate the target active department before mutation, persist FullNameAr, and replace serial per-user role lookups with one query scoped to the selected users. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/departments/page.tsx` | D01: load the full department before opening Edit because the list omits descriptions and previously overwrote them with empty strings. |
| `Frontend/Smart-Exam-App-main/lib/api/admin.ts` | D05/D06: map/send FullNameAr separately and use the existing activate/deactivate route for status changes. This does not fix the separate ordinary role-edit defect. |

## Question bank, authoring and assignment

| Changed production file | Why it changed |
|---|---|
| `Backend-API/Application/DTOs/QuestionBank/QuestionDtos.cs` | D08: accept an optional complete option list alongside a question update so points and options can be validated/saved atomically; omission preserves metadata-only clients. |
| `Backend-API/Application/Validators/QuestionBank/QuestionOptionRules.cs` | D08: centralize choice-count, correct-key, nonnegative weight and weighted-total invariants for creation and edits. |
| `Backend-API/Application/Validators/QuestionBank/QuestionValidators.cs` | D08: apply the common option invariants and nested option validation before create/update persistence. |
| `Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs` | D08/D09: enforce question/subject scope before writes, validate option ownership and invariants, update total/options together, and prevent deleted or foreign options leaking into ordinary operations. |
| `Backend-API/Infrastructure/Services/Lookups/LookupsService.cs` | D09: scope subject/topic lookup reads and mutations to the actor department and validate related ownership before saving. |
| `Backend-API/Infrastructure/Services/Assessment/AssessmentService.cs` | D11/D53: restrict automatic proctor assignment to the exam department; make department scope mandatory; check nested exam/section/question/instruction/policy/source resources and their linked bank ownership before reads and writes. D59 soft-delete uniqueness remains unresolved. |
| `Backend-API/Infrastructure/Services/Batch/BatchService.cs` | D12/D14: apply actor/candidate scope to cohort members, exports and assignment-related operations. This does not supply the unresolved cohort metadata ownership model. |
| `Backend-API/Infrastructure/Services/ExamAssignment/ExamAssignmentService.cs` | D14: scope candidate/exam lists and assignment mutations, validate explicit selections atomically, and reject inactive or inaccessible cohort membership. |
| `Backend-API/Infrastructure/Services/Proctor/ExamProctorService.cs` | D52: protect legacy roster/assign/unassign operations, restrict available proctors, and include actor scope in roster cache keys/invalidation while preserving authorized explicit grants. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/[id]/edit/page.tsx` | D08/D24: submit question total and complete options in one update, retain both explanations, and surface option-image upload failures rather than continuing with a partial save. |
| `Frontend/Smart-Exam-App-main/lib/types/api-params.ts` | D08/D24: type the optional atomic option list and bilingual explanations in the frontend update contract. |
| `Frontend/Smart-Exam-App-main/components/exam/exam-setup-content.tsx` | D10: provide and require the active-department selector for SuperAdmin exam creation, matching the existing backend contract. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/assign-to-exam/page.tsx` | D13: stop the checkbox click from bubbling to the row and toggling the same candidate twice. |

## Candidate admission, answers and lifecycle

| Changed production file | Why it changed |
|---|---|
| `Backend-API/Application/Validators/Assessment/WalkInAnswerValidation.cs` | D17: validate configured required/custom fields, duplicate/unknown field IDs, lengths and finite numeric values before walk-in user creation. |
| `Backend-API/Application/Validators/Candidate/CandidateAnswerValidation.cs` | D15: reject duplicate/foreign/deleted choices and invalid answer shapes while retaining the intentional empty-answer clear operation. |
| `Backend-API/Domain/Common/AnswerContent.cs` | D21/D46: share a content predicate so an empty persisted answer row is not treated as an answered question by candidate/proctor/report paths. |
| `Backend-API/Domain/Common/AttemptOptionOrder.cs` | D28: derive a stable per-attempt/question/option ordering key so repeat session reads do not reshuffle. |
| `Backend-API/Infrastructure/Services/Authorization/CandidateIdentityPolicy.cs` | D16: share the latest approved identity requirement between the current and legacy start paths. Synthetic workflow verification does not establish physical identity accuracy. |
| `Backend-API/Infrastructure/Services/Authorization/CandidateAssignmentPolicy.cs` | D55: share the active, nondeleted assignment requirement for restricted-exam admission. Source is loaded; post-fix runtime verification remains NOT VERIFIED. |
| `Backend-API/Infrastructure/Services/Assessment/ExamShareService.cs` | D17/D27: validate walk-in fields and active account eligibility, and prevent public share selection/registration from minting staff or mixed-role credentials. The wider existing-candidate identity model remains unresolved. |
| `Backend-API/Infrastructure/Services/Attempt/AttemptService.cs` | D15/D16/D21/D23/D28/D33/D43/D55/D62/D63: align legacy admission, answer content/validation, stable options, terminal-state handling and result visibility; lock the active attempt by primary key under existing candidate serialization; close proctor sessions with terminal attempts. Verification limits remain per finding. |
| `Backend-API/Infrastructure/Services/Candidate/CandidateService.cs` | D15/D16/D17/D21/D23/D28/D42/D43/D55/D62/D63: align current candidate admission/answer/terminal paths, preserve stable option order and saved attempt maxima, enforce result visibility, narrow the start lock, and close terminal proctor sessions. D55 remains runtime-unverified. |
| `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx` | D21/D26: count real answer content, enqueue/retry pending saves, flush before manual submission, prevent overlapping submits, and keep monitoring/retry alive until the server accepts submission. Pending edits remain memory-only. |
| `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/question-renderer.tsx` | D28: render the server-provided per-attempt option sequence instead of sorting it back into author order. |
| `Frontend/Smart-Exam-App-main/lib/exam/answer-save-queue.ts` | D26: retain and serialize pending answer writes, retry failures, and expose a flush result so submission cannot silently discard an unsaved open-tab edit. |
| `Frontend/Smart-Exam-App-main/lib/i18n/translations.ts` | D26/D40: explain retry/unsaved-submit behavior in English/Arabic and correct grading finalization copy to describe later publication and regrading. |
| `Frontend/Smart-Exam-App-main/components/exam/exam-calculator.tsx` | D67: constrain floating-panel width/height, enable vertical scrolling and clamp resize position so expanded Financial/PV controls remain accessible at the tested viewport. Calculation formulas are unchanged. |

## Account and live proctor behavior

| Changed production file | Why it changed |
|---|---|
| `Backend-API/Infrastructure/Services/AuthService.cs` | D04: reject login for deleted or nonactive accounts rather than checking only the Inactive enum value. |
| `Backend-API/Program.cs` | D04/D51: recheck authoritative account eligibility and compare current roles after JWT validation so old issued claims are not treated as current administration state. D51 post-fix runtime closure is absent. |
| `Backend-API/Infrastructure/Hubs/ProctorHub.cs` | D19/D51: recheck account eligibility for an existing socket invocation and abort stale-role invocations. This does not prove proactive eviction of an idle recipient or peer media. |
| `Backend-API/Infrastructure/Services/Authorization/ResourceAuthorizationService.cs` | D22: prevent candidate-only roles from obtaining staff-like session/evidence access solely through department shortcuts. |
| `Backend-API/Controllers/Attempt/AttemptController.cs` | D25: allow the Proctor role to reach the existing scoped attempt-events service so authorized proctors can view the events already collected. |
| `Backend-API/Infrastructure/Services/AttemptControl/AttemptControlService.cs` | D18/D66: scope attempt lists and control targets to the acting user; await AddTime/ForceEnd audit writes within the request scope instead of capturing its DbContext in fire-and-forget tasks. |
| `Backend-API/Application/DTOs/Proctor/ProctorDtos.cs` | D65: carry RemainingSeconds on the live session-list DTO so frontend cards can display the authoritative remaining time. |
| `Backend-API/Infrastructure/Services/Proctor/ProctorService.cs` | D21/D29/D54/D57/D63/D65: count actual answer content, return authorized image URLs, validate evidence confirmation ownership/positive size, exclude terminal parent attempts from live views, and compute remaining time for Started/InProgress/Paused/Resumed versus terminal states. |
| `Backend-API/Infrastructure/Services/Proctor/AiProctorService.cs` | D21: use real answer content for activity/progress inputs rather than counting empty persisted answer rows. This is not AI model-quality acceptance. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/[sessionId]/page.tsx` | D20/D25/D29/D31: show pass score in points, refresh the actual attempt-event stream, derive displayed event totals/latest activity from that stream, and load snapshots with authenticated evidence rendering. Risk-model aggregation is not redefined. |
| `Frontend/Smart-Exam-App-main/lib/api/proctoring.ts` | D25/D65: propagate event fetch errors instead of fabricating an empty list and map server remaining seconds to nonnegative rounded-up minutes rather than hardcoded zero. |

## Evidence files, incidents and playback

| Changed production file | Why it changed |
|---|---|
| `Backend-API/Controllers/Proctor/ProctorEvidenceFileController.cs` | D29/D54: supply an authenticated image evidence download route with ownership checks, supported image types and private/no-store response headers. |
| `Backend-API/Controllers/Proctor/VideoRecordingController.cs` | D29/D30: reject negative/out-of-range chunk indexes and use authenticated evidence URLs instead of public static snapshot paths. |
| `Backend-API/Controllers/MediaController.cs` | D29/D60: make protected media responses private/no-store with nosniff and reject invalid/overflowing pagination before server errors. |
| `Backend-API/Infrastructure/Services/MediaStorageService.cs` | D29/D58: scope private snapshot access/listing, return authenticated snapshot URLs, and require permitted uploader/actor scope for deletion. |
| `Backend-API/Infrastructure/Storage/PublicMediaFileProvider.cs` | D29: exclude private snapshot/chunk roots and reject Windows short-name/path aliases that could bypass the public-file filter. |
| `Backend-API/Infrastructure/Services/CandidateExamDetails/CandidateExamDetailsService.cs` | D29: replace public snapshot paths with the authenticated evidence download route in candidate detail responses. |
| `Backend-API/Infrastructure/Services/Incident/IncidentService.cs` | D44/D54: apply consistent case/child/write scope, validate linked attempt/session/evidence/reviewer references, preserve the explicitly internal system path, invalidate affected views, and expose eligible image preview URLs. |
| `Frontend/Smart-Exam-App-main/components/proctor/evidence-image.tsx` | D29/D54: fetch authorized evidence bytes and render/revoke local object URLs; provide the corresponding authenticated View-link behavior. Incident link opening remains unverified where the tool blocked it. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/exam-details/page.tsx` | D29: use authenticated EvidenceImage for protected candidate snapshot display. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/page.tsx` | D29: use authenticated EvidenceImage for protected proctor card snapshots. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/stream/[candidateId]/page.tsx` | D29: use authenticated EvidenceImage for protected stream-page snapshots. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/video/[candidateId]/page.tsx` | D29/D69: render protected image snapshots with authenticated EvidenceImage, and map only filtered image evidence into Screenshots. Removing the fallback to all evidence prevents finalized video files from appearing as broken screenshot cards when no images exist. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/results/ai-report/[examId]/[candidateId]/page.tsx` | D29: use authenticated EvidenceImage for protected evidence thumbnails in AI reports. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/incidents/[id]/page.tsx` | D54: use the authenticated EvidenceLink instead of navigating directly to protected bytes without request credentials. API/link visibility is verified; tool-blocked opening is not. |
| `Frontend/Smart-Exam-App-main/components/ui/video-chunk-player.tsx` | D68: bind time/play/pause/end/duration handlers directly to the rendered video instead of a mount-only effect that ran before the loading branch created the element; keep timer, seek position and Play/Pause state synchronized with actual playback. Add a semantic Play/Pause label and concise stage-specific failures with structured console diagnostics; remove the temporary 50 ms tracing delay. Corrected synthetic media already proved real decoding; this repairs the separately confirmed frozen UI, with real-browser play/pause/end at 8.021 seconds, replay, seek to 1.5 seconds, forward-to-end and back-to-zero verified. No codec, API, capture or buffering algorithm changed. |

## Grading, results and exports

| Changed production file | Why it changed |
|---|---|
| `Backend-API/Application/DTOs/Grading/GradingDtos.cs` | D38/D43: expose an explicit IsGraded flag for saved zero/no-comment grades and permit nullable correctness when result policy withholds correctness. |
| `Backend-API/Controllers/Grading/GradingController.cs` | D32: provide the grading-specific exam dropdown to authorized Examiner users through the existing scoped assessment service. |
| `Backend-API/Infrastructure/Services/Grading/GradingService.cs` | D34/D37/D38/D39/D43: enforce actor-aware grading scope including background submissions, allow ForceSubmitted grading, include AutoGraded detail, map explicit saved-grade state, and honor candidate review/correct-answer visibility. |
| `Backend-API/Infrastructure/Services/Grading/AiGradingService.cs` | D34: authorize the grading session/attempt before AI suggestion work. This does not validate an external AI provider or suggestion quality. |
| `Backend-API/Infrastructure/Services/ExamResult/ExamResultService.cs` | D43/D46: check publication/ShowResults before candidate result/history/summary reads, and include AutoGraded sessions, actual attempted pooled questions/maxima and content-based unanswered counts in analytics. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/grading/page.tsx` | D32/D40: use the authorized grading dropdown, show accurate current-page pending metrics, and hide result-finalization actions from roles that cannot manage results. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/grading/[submissionId]/page.tsx` | D35/D38/D40: compute the displayed automatic-only subtotal, recognize a saved zero via IsGraded, and gate the result action by the existing management roles. |
| `Frontend/Smart-Exam-App-main/lib/api/grading.ts` | D32/D38/D45: type and consume the grading-specific dropdown, explicit IsGraded marker and full CorrectOptions list already supplied for reports. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/results/review/[examId]/[candidateId]/page.tsx` | D41: display localized selected option text in View All rather than raw IDs, retaining fallback behavior when text is unavailable. |
| `Frontend/Smart-Exam-App-main/lib/export/candidate-report.ts` | D45/D47: export every correct option from CorrectOptions and size wrapped XLSX rows from their content so long essays/rubrics are not clipped. |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/reports/page.tsx` | D48/D49/D56: label raw mean/highest values as points, quote/escape every CSV field including localized dates, and prefix formula-like candidate strings to preserve text interpretation. Native spreadsheet execution remains separate. |

## Evidence and limits

The [phase coverage audit](coverage-audit.md), [measured load comparison](phase11-performance-results.md), [D66 diagnosis](audit-lifecycle-defect.md), [D67 browser closure](d67-calculator-viewport.md) and [engineering checks](final-engineering-checks.md) establish the corresponding checks and limitations. [D68 playback evidence](d68-video-playback.md) separates original timestamp-order incompatibility from the confirmed event-handler lifecycle defect. The [D69 evidence-classification record](d69-evidence-classification.md) verifies zero screenshots for video-only metadata and a positive 320×240 Image 704 thumbnail/preview. Type-4 eligibility remains source inspection only. This mapping does not claim every changed line was independently tested, add a security assessment, or resolve an open product policy.
