# Smart Exam Performance Audit Report

Date: 2026-05-03  
Scope: static source-code audit only. No documentation assumptions, no runtime profiling, no UI/UX changes.

## Summary

Smart Exam has a solid baseline: paging exists in many admin lists, several lookup/list endpoints use memory caching, and the exam-taking page mostly uses one large session payload instead of loading questions one by one. The largest production risks are not small render issues; they are request amplification, stale process-local cache, heavyweight EF queries on critical paths, and high write volume during live exams.

At 1000+ concurrent candidates, the system is most likely to strain on answer saving, attempt/proctor event logging, webcam evidence uploads, proctor-center polling, and report/dashboard aggregation. The source shows several endpoints loading entire object graphs or whole result/session sets into memory before calculating counts. Those patterns will work in demos and small cohorts, then degrade sharply as attempts, events, and media grow.

## Top 10 Optimizations

1. Stop duplicate attempt event writes during exam start and answer save.
2. Replace per-process `IMemoryCache` with Redis/distributed cache for production scale-out.
3. Fix cache invalidation for candidate dashboard, candidate available exams, results, grading, and exam operations when attempts/results change.
4. Rewrite `SaveAnswerAsync` to load only the target attempt question/answer instead of the full attempt question graph.
5. Rewrite `BulkSaveAnswersAsync` as a true batch upsert, not a loop over single-answer saves.
6. Add an aggregated admin dashboard endpoint to replace 5-6 frontend calls on dashboard load.
7. Move results/proctor dashboard aggregation into SQL projections and aggregate queries instead of `ToListAsync()` over all rows.
8. Reduce proctor-center refresh pressure; current active-session polling is every 5 seconds despite the comment saying 30 seconds.
9. Add composite indexes for hot filters: active attempts, live proctor sessions, evidence by session/type/time, results by exam/publish/finalized status.
10. Remove production request/response payload logging in frontend API client and Next proxy.

## Critical Performance Issues

### 1. Duplicate exam events during the highest-traffic path

Files and components:
- `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/candidate.ts`
- `Backend-API/Infrastructure/Services/Attempt/AttemptService.cs`

Endpoints:
- `GET /api/Candidate/attempts/{attemptId}/session`
- `PUT /api/Candidate/attempts/{attemptId}/answers`
- `POST /api/Attempt/{attemptId}/events`

Why it is a problem:
- `AttemptService.StartAttemptAsync` already creates an `AttemptEventType.Started` row.
- `exam-page.tsx` calls `logAttemptEvent(...Started)` after every `initializeExam()` session load, including resume/reload.
- `AttemptService.SaveAnswerAsync` already creates an `AttemptEventType.AnswerSaved` row.
- `exam-page.tsx` then calls `logAttemptEvent(...AnswerSaved)` after `saveAnswer`.

Impact under load:
- Every answer can become two writes: one answer transaction plus one extra event API call/write.
- For 1000 candidates answering 50 questions, this can add about 50,000 avoidable HTTP calls and about 50,000 duplicate event rows.
- Proctor reports and risk calculations become heavier because event tables grow faster than actual candidate actions.

Recommended fix:
- Backend should own domain events for answer saved and attempt started.
- Frontend should log only browser/proctor events not already emitted by backend.
- Make `Started` idempotent or record a separate `Resumed`/`SessionOpened` event only when needed.

Expected performance gain:
- 30-50% fewer write operations on the exam-taking path, depending on exam length.

DB/index changes required:
- No required schema change. Optional cleanup/migration may be needed for existing duplicate `AttemptEvents`.

### 2. Candidate and results caches can remain stale for up to 5 hours

Files:
- `Backend-API/Infrastructure/Services/CacheService.cs`
- `Backend-API/Domain/Constants/CacheKeys.cs`
- `Backend-API/Infrastructure/Services/Candidate/CandidateService.cs`
- `Backend-API/Infrastructure/Services/Attempt/AttemptService.cs`
- `Backend-API/Infrastructure/Services/ExamResult/ExamResultService.cs`

Endpoints affected:
- `GET /api/Candidate/dashboard`
- `GET /api/Candidate/journey`
- `GET /api/Candidate/exams`
- `GET /api/ExamResult/candidate-result-list`
- `GET /api/ExamResult/dashboard/exam/{examId}`

Why it is a problem:
- Candidate data uses `CacheKeys.VeryLong` of 5 hours for available exams and dashboard.
- Attempt mutation methods mostly invalidate `AttemptsPrefix`, but not `CandidatesPrefix`, `ResultsPrefix`, `GradingPrefix`, or `ExamOpsPrefix`.
- Start, submit, grading, result publish, admin override, and termination all change what candidate dashboards/results should show.
- In a production release this is both a performance and correctness issue: users may refresh repeatedly, creating more load, while still seeing stale data.

Recommended fix:
- Define mutation-to-cache invalidation rules:
  - Start/save/submit/cancel/terminate attempt: invalidate candidate cache for that candidate, attempts, exam ops, relevant proctor/result summaries.
  - Grading/finalize/publish: invalidate results, candidate dashboard, candidate available/journey, grading.
  - Exam assignment/admin override: invalidate candidate and exam ops caches.
- Use shorter TTL for candidate exam state if Redis events/invalidation are not available.

Expected performance gain:
- Prevents refresh storms and stale-data retries; mostly reliability gain, but can reduce redundant user-triggered reloads significantly.

DB/index changes required:
- No DB change.

### 3. In-memory cache is process-local and not production-scale safe

Files:
- `Backend-API/Program.cs`
- `Backend-API/Infrastructure/Services/CacheService.cs`

Why it is a problem:
- `AddMemoryCache()` and singleton `ICacheService` cache only inside one API process.
- `RemoveByPrefix` tracks keys in an in-process static dictionary.
- With multiple API instances, one instance can mutate data while other instances keep stale cache entries until TTL expiry.
- There is no Redis/distributed cache detected in source.

Recommended fix:
- Use Redis/`IDistributedCache` for production.
- Publish cache invalidation across instances.
- Keep `IMemoryCache` only for per-instance tiny data that can tolerate inconsistency.

Expected performance gain:
- Enables safe horizontal scale. Reduces DB load consistently across all nodes instead of only per process.

DB/index changes required:
- No DB change. Infrastructure change required.

### 4. Save answer loads too much data and bulk save is not truly bulk

Files:
- `Backend-API/Infrastructure/Services/Attempt/AttemptService.cs`
- `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/candidate.ts`

Endpoints:
- `PUT /api/Candidate/attempts/{attemptId}/answers`
- Legacy alias in `candidate.ts`: `saveAnswer()` wraps one answer in the bulk endpoint.

Why it is a problem:
- `SaveAnswerAsync` loads attempt, all questions, question types, all options, and all answers for the attempt to save one question.
- `BulkSaveAnswersAsync` loops over `SaveAnswerAsync`, causing N full graph loads and N `SaveChangesAsync()` calls.
- The frontend saves MCQ immediately and subjective answers after 1s debounce, so this path is the write hot spot during an exam.

Recommended fix:
- Query only:
  - attempt id/candidate/status/expiry
  - target `AttemptQuestion` by `(AttemptId, QuestionId)`
  - existing `AttemptAnswer` by `(AttemptId, QuestionId)`
  - minimal question metadata needed for validation
- Implement real batch save for multiple answers with one attempt validation and one `SaveChangesAsync()`.
- Move answer-saved event creation into the same optimized batch.

Expected performance gain:
- 50-80% lower DB work for answer saves on large exams.

DB/index changes required:
- Existing indexes on `AttemptQuestions(AttemptId, QuestionId)` and `AttemptAnswers(AttemptId, QuestionId)` are good. No required new index for the optimized query.

### 5. Frontend dashboard over-fetches and duplicates exam list calls

Files:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/dashboard/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/dashboard.ts`

Endpoints on load:
- `GET /Assessment/exams?pageNumber=1&pageSize=1`
- `GET /Grading/manual-required?pageNumber=1&pageSize=1`
- `GET /Incident/dashboard`
- `GET /Assessment/exams?pageNumber=1&pageSize=50`
- `GET /Incident/cases?Status=Open&PageNumber=1&PageSize=5`
- `GET /License/status`

Why it is a problem:
- One dashboard render fans out to about six backend calls.
- `Assessment/exams` is called twice with different page sizes.
- Several dashboard charts still use static frontend data, so network calls do not fully represent rendered data.

Recommended fix:
- Add `GET /api/Dashboard/admin-summary` returning stats, upcoming exams, open incidents, and license summary.
- Keep individual endpoints for detail pages.

Expected performance gain:
- 60-80% fewer network round trips for admin dashboard load.

DB/index changes required:
- Possibly add aggregate-friendly indexes, depending on final dashboard SQL. Suggested composites:
  - `Attempts(ExamId, Status, StartedAt)`
  - `Results(ExamId, IsPublishedToCandidate, FinalizedAt)`
  - `IncidentCases(Status, Severity, AssignedTo)` already exists.

## High Issues

### H1. Proctor center polls active sessions every 5 seconds

Files:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/proctoring.ts`
- `Backend-API/Infrastructure/Services/Proctor/ProctorService.cs`

Endpoints:
- `GET /api/Proctor/sessions?PageNumber=1&PageSize=100&Status=1`
- `GET /api/Proctor/triage?top=3&includeSample=...`

Why it is a problem:
- The comment says auto-refresh every 30 seconds, but the interval is `5000`.
- `GetSessionsAsync` includes exam, candidate, decision, evidence items, and attempt for every active session.
- At multiple proctor dashboards, this becomes repeated full list scans and object graph materialization.

Recommended fix:
- Use SignalR push for session list deltas and proctor events.
- If polling remains, raise interval to 15-30 seconds and request only fields needed for the grid.
- Add a lightweight live endpoint with projection only, not entity includes.

Expected performance gain:
- 70-85% fewer proctor-center list requests if interval moves from 5s to 30s.

DB/index changes required:
- Add composite index `ProctorSessions(Status, StartedAt)` or `ProctorSessions(Status, ExamId, StartedAt)`.

### H2. Results dashboard loads whole tables before aggregating

Files:
- `Backend-API/Infrastructure/Services/ExamResult/ExamResultService.cs`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/reports/page.tsx`

Endpoints:
- `GET /api/ExamResult/dashboard/exam/{examId}`
- `GET /api/ExamResult/exam/{examId}?PageNumber=1&PageSize=100`

Why it is a problem:
- `GetResultDashboardAsync` loads all attempts, all results, and all grading sessions for an exam into memory, then counts/averages in C#.
- Report page then separately fetches result list for the same exam.

Recommended fix:
- Use SQL aggregate projections for counts, averages, pass/fail, published/unpublished, pending grading.
- Consider one report endpoint returning dashboard summary plus the first page of candidates.

Expected performance gain:
- 60-90% lower memory and query payload for large exams.

DB/index changes required:
- Add/verify:
  - `Results(ExamId, IsPassed)`
  - `Results(ExamId, IsPublishedToCandidate)`
  - `GradingSessions(AttemptId, Status)` or denormalized/filterable `ExamId` if this dashboard is hot.

### H3. Proctor dashboard and risk calculation load all events

Files:
- `Backend-API/Infrastructure/Services/Proctor/ProctorService.cs`

Endpoints:
- `GET /api/Proctor/dashboard/exam/{examId}`
- `POST /api/Proctor/session/{sessionId}/calculate-risk`

Why it is a problem:
- `GetDashboardAsync` includes all events for all sessions in an exam.
- `CalculateRiskScoreInternalAsync` includes all session events, then separately loads all attempt events for the same attempt.
- Event tables are among the fastest-growing tables in this system.

Recommended fix:
- Use grouped SQL queries for event counts by type/severity/time window.
- Store rolling session counters and last event summaries during event ingestion.
- Calculate risk incrementally on event write or via background worker.

Expected performance gain:
- Major for proctored exams: avoids loading thousands to millions of event rows into API memory.

DB/index changes required:
- Existing `ProctorEvents(ProctorSessionId, EventType, OccurredAt)` is good.
- Add `ProctorEvents(AttemptId, OccurredAt)` if attempt-correlated risk checks remain common.

### H4. Question bank list loads options and attachments for list rows

Files:
- `Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/page.tsx`

Endpoint:
- `GET /api/QuestionBank/questions`

Why it is a problem:
- The list endpoint includes `Options` and `Attachments`, but the UI list only needs attachment count and basic question metadata.
- This grows payload and EF materialization cost as question bank size increases.

Recommended fix:
- Project directly to `QuestionListDto`.
- Replace `Attachments.Count` with SQL count projection.
- Load options/attachments only on detail/edit pages.

Expected performance gain:
- 30-70% smaller payload for question-bank list depending on attachment/option volume.

DB/index changes required:
- Existing question lookup indexes are mostly sufficient.

### H5. Candidate available exams has per-builder-section query loops

Files:
- `Backend-API/Infrastructure/Services/Candidate/CandidateService.cs`

Endpoint:
- `GET /api/Candidate/exams`

Why it is a problem:
- For each distinct builder pool, code runs `CountAsync()` and then `SumAsync()`.
- With many builder sections, this becomes a 2N query pattern before returning the exam list.
- This endpoint is cached for 5 hours, but stale cache is itself a correctness risk.

Recommended fix:
- Group builder pools and aggregate counts/sums in one query.
- Cache stable question-bank pool stats separately and invalidate on question changes.

Expected performance gain:
- Removes query amplification for candidates and dashboards using available exam data.

DB/index changes required:
- Add composite `Questions(SubjectId, TopicId, IsActive, IsDeleted)` if not present as a composite.

## Medium Issues

### M1. Large client components increase render and maintenance cost

Files:
- `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx` ~2474 lines
- `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/[sessionId]/page.tsx` ~1926 lines
- `Frontend/Smart-Exam-App-main/app/(dashboard)/results/ai-report/[examId]/[candidateId]/page.tsx` ~1621 lines
- `Frontend/Smart-Exam-App-main/components/exam/exam-setup-content.tsx` ~1231 lines

Why it is a problem:
- Large components hold many state variables and effects in one render scope.
- `exam-page.tsx` updates timers every second and carries proctoring, media, answers, navigation, dialogs, and rendering in one component.
- Many child components are not memoized, so timer/state changes can re-render broad subtrees.

Recommended fix:
- Split exam page into memoized islands: timer header, question view, navigator, proctoring controller, media recorder, dialogs.
- Use `React.memo` for question cards/options where props are stable.
- Keep 1-second ticking state as close to timer display as possible.

Expected performance gain:
- Lower client CPU and smoother exam UI, especially on low-end candidate devices.

DB/index changes required:
- No.

### M2. No frontend request cache layer

Files:
- `Frontend/Smart-Exam-App-main/lib/api-client.ts`
- Most `app/(dashboard)/**/page.tsx` client pages

Why it is a problem:
- Data fetching is mostly client-side `useEffect`.
- There is no SWR/React Query cache, request de-duplication, stale-while-revalidate, or cancellation in the common API client.
- Browser navigation between list/detail pages often refetches reference data.

Recommended fix:
- Introduce a data-fetching cache for dashboard/admin pages.
- Cache stable lookups client-side with TTL: roles, departments, question types, subjects, public branding.

Expected performance gain:
- 20-50% fewer duplicate frontend requests during admin navigation.

DB/index changes required:
- No.

### M3. Search filters use `ToLower().Contains()`

Files:
- `Backend-API/Infrastructure/Services/Assessment/AssessmentService.cs`
- `Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs`
- `Backend-API/Infrastructure/Services/ExamOperations/ExamOperationsService.cs`
- Other list services with similar patterns

Why it is a problem:
- `ToLower().Contains()` prevents normal index seeks and encourages scans.
- Question/body search and user/email search will slow as data grows.

Recommended fix:
- Use database collation-aware search, persisted normalized columns, or SQL Server full-text indexes for question body and exam title search.

Expected performance gain:
- High for large search-heavy pages.

DB/index changes required:
- Yes: full-text or normalized search indexes.

### M4. Settings/organization/branding are read directly without cache

Files:
- `Backend-API/Controllers/Settings/SettingsController.cs`
- `Backend-API/Controllers/Settings/OrganizationController.cs`
- `Frontend/Smart-Exam-App-main/lib/hooks/use-branding.ts`

Endpoints:
- `GET /api/Settings`
- `GET /api/Organization`
- `GET /api/Organization/branding`

Why it is a problem:
- These values are static/rarely changed and good cache candidates.
- Branding is requested by frontend context/hooks and can be hit frequently.

Recommended fix:
- Cache settings/organization/branding with explicit invalidation on update/upload.
- Send HTTP `Cache-Control`/ETag for public branding assets.

Expected performance gain:
- Small to medium, but very low risk quick win.

DB/index changes required:
- No.

### M5. Production logging of full API payloads

Files:
- `Frontend/Smart-Exam-App-main/lib/api-client.ts`
- `Frontend/Smart-Exam-App-main/app/api/proxy/[...path]/route.ts`

Why it is a problem:
- Logs full request/response data, including large payloads.
- Adds CPU and memory overhead in browser and Next server.
- Risks leaking candidate answers, tokens-adjacent metadata, and exam data into logs.

Recommended fix:
- Gate verbose logs behind development-only flags.
- In production, log endpoint, status, duration, and correlation id only.

Expected performance gain:
- Small to medium, larger during exam sessions and report exports.

DB/index changes required:
- No.

## Low Issues

### L1. `reactStrictMode` is disabled

File:
- `Frontend/Smart-Exam-App-main/next.config.mjs`

Why it matters:
- Disabling Strict Mode reduces duplicate dev-only effects but hides render/effect idempotency issues during development.
- This is not a production duplicate-call source, but it lowers confidence.

Recommended fix:
- Re-enable when effects are cleaned up and request de-duplication exists.

### L2. Dashboard renders static chart data while calling real APIs

File:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/dashboard/page.tsx`

Why it matters:
- Extra network work does not fully map to what users see.
- This can mislead release validation and performance testing.

Recommended fix:
- Either wire charts to aggregated backend data or remove unused network work from dashboard.

## API Design Recommendations

Endpoints to merge:
- Admin dashboard: merge `Assessment/exams`, `Grading/manual-required`, `Incident/dashboard`, `Incident/cases`, and `License/status` into `GET /Dashboard/admin-summary`.
- Reports page: merge `ExamResult/dashboard/exam/{examId}` and first page of `ExamResult/exam/{examId}` into `GET /ExamResult/exam/{examId}/report-overview`.
- Proctor session detail: merge session detail and latest evidence into a lightweight `GET /Proctor/session/{sessionId}/live-detail` for polling/detail refresh.
- User permissions: merge `Users`, `Departments`, and `Roles` boot data into `GET /Users/permissions-page-data`.

Endpoints to split:
- `GET /QuestionBank/questions`: split list projection from full detail. List should not include options/attachments.
- `GET /Proctor/sessions`: split grid list from full session details/evidence.
- `GET /Candidate/attempts/{attemptId}/session`: consider a smaller timer/status endpoint for periodic sync; current frontend `getAttemptTimer()` falls back to full session via `getAttemptSession()`.

## Critical Exam Paths

### Start exam

Files:
- `Frontend/Smart-Exam-App-main/lib/api/candidate.ts`
- `Backend-API/Infrastructure/Services/Attempt/AttemptService.cs`

Risks:
- `StartAttemptAsync` loads a large exam graph with sections, questions, question types, options, attachments, policy, and instructions.
- It creates attempt, attempt questions, started event, proctor session, saves, then reloads attempt questions.
- Duplicate `Started` event can be added by frontend when exam page initializes.

Recommended fix:
- Cache immutable published exam blueprint separately.
- Generate attempt questions from projection rather than tracked full graph.
- Remove duplicate frontend `Started` event.

### Submit answers/autosave

Files:
- `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx`
- `Backend-API/Infrastructure/Services/Attempt/AttemptService.cs`

Risks:
- Each answer save is heavy and duplicates event logging.
- Subjective answer debounce is 1 second, which can still generate many writes during typing pauses.
- Bulk endpoint is not efficient for actual bulk.

Recommended fix:
- True upsert/batch save.
- Coalesce frontend autosaves.
- Remove frontend answer-saved event call.

### Timer sync

Files:
- `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/candidate.ts`

Risks:
- `getAttemptTimer()` in frontend calls `getAttemptSession()` because timer endpoint is not used by the candidate API helper.
- That turns 60-second timer sync into a full session fetch if exercised.

Recommended fix:
- Add/use `GET /Candidate/attempts/{attemptId}/timer` or proxy to existing attempt timer endpoint.

Expected gain:
- Very high payload reduction for long exams.

### Proctoring events and snapshots

Files:
- `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx`
- `Backend-API/Infrastructure/Services/Proctor/ProctorService.cs`
- `Backend-API/Controllers/Proctor/VideoRecordingController.cs`

Risks:
- Webcam snapshots every 60 seconds per candidate.
- Video chunks and finalize add storage/CPU pressure.
- Proctor event/risk calculations can load all events.

Recommended fix:
- Keep raw media off SQL Server; store object metadata only.
- Queue video finalize work in a background worker.
- Use event aggregation tables/counters for proctor dashboards.

## Caching Strategy

Detected:
- `IMemoryCache` via `AddMemoryCache()`.
- `ICacheService` supports get/set/remove by prefix.
- Cached domains include users, roles, departments, lookups, questions, exams, candidates, batches, attempts, results, incidents, certificates, assignments, operations.
- No Redis/distributed cache detected.

What should be cached but is missing or incomplete:
- Settings/system configuration.
- Organization/branding settings.
- Published exam blueprint used at start/resume.
- Question pool aggregate stats by subject/topic.
- Proctor risk rules.
- Video config/system settings.

Invalidation issues:
- Candidate caches are not invalidated by attempt lifecycle changes.
- Results caches are not clearly invalidated by all grading/publish paths.
- Exam operation caches can be stale after start/submit/override/terminate.
- Process-local prefix invalidation will not work across multiple API instances.

## Scalability Recommendations

- Use Redis for cache and SignalR backplane before running multiple API instances.
- Add background queues for grading, video finalization, report export, and heavy proctor risk calculations.
- Keep exam-taking endpoints lean and single-purpose; avoid full graph loads after attempt start.
- Partition or archive high-volume tables: `AttemptEvents`, `ProctorEvents`, `ProctorEvidence`, video chunks/metadata, audit logs.
- Add load tests that model:
  - 1000 candidates start exam within 5 minutes.
  - 1000 candidates save 50 answers each.
  - 1000 candidates upload 60-second webcam snapshots.
  - 10 proctors monitor active sessions.
  - Reports generated after a large exam ends.

## Quick Wins: 1-2 Days

- Remove duplicate frontend `Started` and `AnswerSaved` event logging.
- Change proctor-center polling interval from 5s to 15-30s or pause when tab hidden.
- Disable full payload console logs outside development.
- Add cache to settings/organization/branding/video config.
- Add a real timer endpoint call instead of using full session fetch for timer sync.
- Reduce question-bank list payload by removing options include from list endpoint.

## Advanced Optimizations

- Redis distributed cache with invalidation events.
- SQL aggregate rewrite for result/proctor dashboards.
- True batch answer save with single `SaveChangesAsync()`.
- Incremental proctor risk scoring and event counters.
- Published exam blueprint cache/materialized snapshot.
- Full-text search for question bodies and exam titles.
- Table partitioning/retention policies for event/media/audit tables.

