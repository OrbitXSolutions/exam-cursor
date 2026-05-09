# Pagination and Department Scoping Investigation - 2026-05-09

## Scope

Investigated this recommendation from the RBAC report:

> Keep backend pagination and department scoping server-side.

No implementation changes were made. This report only inspects the latest local code.

Source of truth used:
- Frontend source under `Frontend/Smart-Exam-App-main`
- Backend controllers/services under `Backend-API`

## Executive Verdict

The application is mostly using server-side pagination and server-side department/resource scoping for the main production lists.

Backend pagination is present in the core services through `CountAsync()`, `Skip(...)`, and `Take(...)`.

Backend department/resource scoping is also mostly server-side, especially through:
- `ResourceAuthorizationService`
- `DepartmentService.GetCurrentUserDepartmentIdAsync()`
- service-level filters on exams, questions, lookups, grading, results, attempts, proctor sessions, candidates, and users.

However, it is not fully clean end to end. Some frontend pages still load a fixed page or large page and then filter locally. This is not usually a direct data-security issue when backend scoping is correct, but it is a performance and correctness issue because search/filter results can be incomplete outside the loaded page.

## Backend Server-Side Pagination Confirmed

### Users

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/users/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/admin.ts`

Frontend sends:
- `PageNumber`
- `PageSize`
- `Search`
- `Role`
- `Status`
- `DepartmentId`

Backend:
- `Backend-API/Infrastructure/Services/UserService.cs`

Backend behavior:
- Applies `ScopeUsersAsync(query)` before paging.
- Applies search/status/department/role filters before paging.
- Uses `CountAsync()`, then `Skip(...)`, `Take(...)`.

Status:
- Server-side pagination: Yes.
- Server-side department scoping: Yes.
- Frontend department filter exists, but backend remains source of truth.

### Staff Users / Permissions

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/users/permissions/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/admin.ts`

Frontend behavior:
- Calls `getStaffUsers(...)`.
- Sends optional `DepartmentId`.
- Permissions page requests `pageSize: 200`.

Backend:
- `UserService.GetStaffUsersAsync`

Backend behavior:
- Excludes Candidate through SQL role subquery.
- Applies `ScopeUsersAsync(query)`.
- Applies department/role/status filters before pagination.
- Uses `Skip(...)` and `Take(...)`.

Status:
- Server-side pagination: Yes, but frontend uses a high page size for permissions.
- Server-side department scoping: Yes.

Risk:
- Low to Medium. `pageSize: 200` is acceptable for an admin utility if bounded, but the UI should not assume it has all users if total count exceeds 200.

### Exams

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/exams/list/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/exams.ts`

Frontend sends:
- `PageNumber`
- `PageSize`
- `Search`
- `IsActive`
- `IsPublished`

Backend:
- `Backend-API/Infrastructure/Services/Assessment/AssessmentService.cs`

Backend behavior:
- Resolves current user department when `FilterByUserDepartment` is enabled.
- Non-SuperAdmin users are filtered by `DepartmentId`.
- SuperAdmin sees all.
- Applies search/status filters before paging.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Server-side pagination: Yes.
- Server-side department scoping: Yes.

Note:
- Frontend does not send department filters for the main exam list, which is good. The backend decides scope.

### Question Bank

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/question-bank.ts`

Frontend sends:
- `pageNumber`
- `pageSize`
- `search`
- `subjectId`
- `topicId`
- `questionTypeId`
- `difficultyLevel`

Backend:
- `Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs`

Backend behavior:
- Resolves current user department.
- Filters questions through `Subject.DepartmentId` for non-SuperAdmin.
- Applies all filters before paging.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Server-side pagination: Yes.
- Server-side department scoping: Yes.

### Lookups

Frontend:
- `Frontend/Smart-Exam-App-main/lib/api/lookups.ts`

Backend:
- `Backend-API/Infrastructure/Services/Lookups/LookupsService.cs`

Backend behavior:
- Subjects and topics are department-scoped for non-SuperAdmin users.
- Pagination uses `Skip(...)` and `Take(...)`.

Status:
- Server-side pagination: Yes.
- Server-side department scoping: Yes.

Risk:
- Low. Some frontend pages request lookup dropdowns with `pageSize: 500` or `1000`. This is common for dropdowns, but still bounded and should stay bounded.

### Candidates Data

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/data/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/candidate-admin.ts`

Frontend sends:
- `PageNumber`
- `PageSize`
- `Search`
- `Status`
- optional sorting

Backend:
- `Backend-API/Infrastructure/Services/CandidateAdmin/CandidateAdminService.cs`

Backend behavior:
- Gets Candidate role user IDs.
- Applies `ScopeUsersAsync(query)`.
- Applies search/status/sort before paging.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Server-side pagination: Yes.
- Server-side resource/department scoping: Yes.

Important note:
- The business/tutorial text says candidate data is shared across departments, but the current service still applies `ScopeUsersAsync`, which can limit candidates by department/attempt/assignment/proctor access. This is a business-scope decision to confirm.

Export concern:
- `exportCandidates()` sends `PageSize=100000`.
- That is not frontend pagination, but it is a bulk export pattern. It should ideally use a dedicated backend export endpoint that streams or generates a file server-side with enforced filters and limits.

### Batch

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/batch/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/batch.ts`

Frontend sends:
- `PageNumber`
- `PageSize`
- `Search`
- `Status`
- optional sorting

Backend:
- `Backend-API/Infrastructure/Services/Batch/BatchService.cs`

Backend behavior:
- Applies search/status/sort before paging.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Server-side pagination: Yes.
- Department scoping: Not present in `BatchService`.

Risk:
- Medium only if batches are expected to be department-isolated. Current batch model appears global/shared, similar to shared candidates. If batches should be department-specific, backend needs a department field and server-side scope.

### Assign To Exam

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/assign-to-exam/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/exam-assignment.ts`

Frontend sends:
- `ExamId`
- `ScheduleFrom`
- `ScheduleTo`
- `BatchId`
- `Search`
- `Status`
- `PageNumber`
- `PageSize`

Backend:
- `Backend-API/Infrastructure/Services/ExamAssignment`

Status from API usage and service scan:
- Server-side pagination: Yes.
- Scope should be backend-owned because assignment is keyed by exam and backend exam access is scoped.

Frontend risk:
- Batch dropdown loads `getBatches({ pageSize: 200 })`. If more than 200 batches exist, the dropdown will be incomplete.

### Results

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/results/candidate-result/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/results.ts`

Frontend sends:
- `pageNumber`
- `pageSize`
- `examId`
- `excludeTerminated`

Backend:
- `Backend-API/Infrastructure/Services/ExamResult/ExamResultService.cs`

Backend behavior:
- `GetResultsAsync` applies `ScopeResultsAsync(query)` before paging.
- `GetCandidateResultListAsync` applies `ScopeAttemptsAsync(attemptsQuery)` before grouping and paging.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Server-side pagination: Yes.
- Server-side scope: Yes.

Frontend issue:
- `results/candidate-result/page.tsx` applies `resultStatus` and `searchQuery` locally after one server page is loaded.
- This means search/status filtering is not complete across all results. It only filters the current page.

Risk:
- Medium for correctness and UX.
- Low for data security if backend scoping remains correct.

### Grading

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/grading/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/grading.ts`

Frontend sends:
- `PageNumber`
- `PageSize`
- pending/all list selection

Backend:
- `Backend-API/Infrastructure/Services/Grading/GradingService.cs`

Backend behavior:
- Resolves SuperAdmin vs current department.
- Filters grading sessions by `Attempt.Exam.DepartmentId` for non-SuperAdmin.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Server-side pagination: Yes.
- Server-side department scoping: Yes.

Frontend issue:
- Search and exam filter are applied locally to the loaded page:
  - `filteredSubmissions = submissions.filter(...)`
  - `examOptions` are derived from current page only.

Risk:
- Medium. A user searching for a candidate/exam that is on page 3 will not find it while on page 1.

### Proctor Center

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/proctoring.ts`

Frontend behavior:
- `getLiveSessions()` requests `PageNumber=1`, `PageSize=100`, `Status=1`.
- Search, flagged filter, and risk sorting are done in frontend.
- No real pagination UI exists on the live proctor page.

Backend:
- `Backend-API/Infrastructure/Services/Proctor/ProctorService.cs`

Backend behavior:
- Applies `ScopeProctorSessionsAsync(query)`.
- Applies filters.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Backend supports server-side pagination/scoping.
- Frontend uses a fixed first page of 100 active sessions and local filtering/sorting.

Risk:
- Medium to High for large exam sessions. Active sessions beyond the first 100 will not appear in the live view.

### Proctor Incidents

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/incidents/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/proctoring.ts`

Frontend behavior:
- `getIncidents()` defaults to `PageNumber=1`, `PageSize=50`.
- Page filters by search, severity, reviewed state locally.
- Uses `DataTable`, but the API call itself does not pass UI pagination/filter state.

Backend:
- `Backend-API/Infrastructure/Services/Incident/IncidentService.cs`

Backend behavior:
- Incident list service uses `Skip(...)` and `Take(...)`.

Status:
- Backend supports server-side pagination.
- Frontend currently handles filtering locally on the first returned page.

Risk:
- Medium. Incident search/filter can miss records outside the first 50.

### Audit and System Logs

Frontend:
- `Frontend/Smart-Exam-App-main/app/(dashboard)/audit/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/admin.ts`
- `Frontend/Smart-Exam-App-main/lib/api/system-logs.ts`

Frontend sends:
- audit: `PageNumber`, `PageSize`, search/action/entity/outcome/date filters
- system logs: `PageNumber`, `PageSize`, level/search/action/endpoint/status/user/date filters

Backend:
- `Backend-API/Infrastructure/Services/Audit/AuditService.cs`
- system log service via `SystemLogsController`

Status:
- Server-side pagination: Yes.
- Department scoping: Not applicable; logs are SuperAdmin-only.

### Notifications

Frontend:
- `Frontend/Smart-Exam-App-main/lib/api/notifications.ts`

Frontend sends:
- `PageNumber`
- `PageSize`
- status/channel/event/exam/date/search filters

Status:
- Server-side pagination is used for notification logs.
- Department scoping is not applicable if Notifications remain SuperAdmin-only.

## Frontend Department Scoping Handling Found

Frontend does contain department-related UI/API parameters in these places:

- `lib/api/admin.ts`: sends `DepartmentId` for users/staff users filters and department assignment.
- `app/(dashboard)/users/page.tsx`: department filter in Users page.
- `app/(dashboard)/users/permissions/page.tsx`: department filter for permissions view.
- `app/(dashboard)/users/create/page.tsx`: sends selected `departmentId` when creating staff users.
- `app/(dashboard)/exams/[id]/configuration/page.tsx` and edit/setup flows: carry exam `departmentId`.
- `lib/api/exams.ts`: exam create/update type includes `departmentId`; mock fallback includes `departmentId: 1`.

Security assessment:
- Frontend department parameters are UI filters or create/update inputs.
- They are not the source of truth.
- Backend validates or overrides department for non-SuperAdmin in user/exam/question flows.

Important risk:
- Any frontend `DepartmentId` filter should only narrow already-authorized data. It must never be trusted to grant access. Current backend generally follows this rule.

## Frontend Local Filtering / Large Page Calls Found

| Area | File | Pattern | Risk |
| --- | --- | --- | --- |
| Grading | `app/(dashboard)/grading/page.tsx` | Search and exam filter run on current page only | Medium |
| Candidate Result | `app/(dashboard)/results/candidate-result/page.tsx` | Search/result status filter run on current page only | Medium |
| Proctor Center | `app/(dashboard)/proctor-center/page.tsx` | Loads first 100 active sessions, filters/sorts locally | Medium to High |
| Proctor Incidents | `app/(dashboard)/proctor-center/incidents/page.tsx` | Loads first 50 incidents, filters locally | Medium |
| Proctor Report | `app/(dashboard)/results/proctor-report/page.tsx` | Loads first 500 candidate result rows and filters locally | Medium |
| Candidate Export | `lib/api/candidate-admin.ts` | `PageSize=100000` for export | Medium |
| Assign To Exam dropdowns | `app/(dashboard)/candidates/assign-to-exam/page.tsx` | `getBatches({ pageSize: 200 })` | Low to Medium |
| Reports helper | `lib/api/reports.ts` | `/Assessment/exams?PageSize=100` | Low |
| Dashboard helper | `lib/api/dashboard.ts` | Loads `pageSize: 50`, filters upcoming locally | Low |

## Final Assessment

The recommendation is not fully satisfied, but the critical security side is mostly satisfied.

What is good:
- Main backend services do server-side pagination.
- Main backend services do department/resource scoping before pagination.
- Frontend list pages mostly send page/filter params to backend.
- Backend cache keys usually include scope and page/pageSize.

What is not fully server-side:
- Several frontend pages still filter/search over only the loaded page.
- Some pages use fixed large page sizes instead of true pagination.
- Proctor Center is the largest operational risk because live monitoring can silently omit active sessions beyond the first 100.
- Batch has server-side pagination but no department scoping in the backend service; this is acceptable only if batches are intentionally global.

## Recommendations

1. Move Grading search and exam filter into backend query params.
2. Move Candidate Result search and result-status filter into backend query params.
3. Add real pagination/filter params to Proctor Center instead of fixed `PageSize=100`.
4. Add server-side filtering/pagination wiring to Proctor Incidents page.
5. Replace Proctor Report's first-500 load with searchable backend endpoints or dependent dropdown APIs.
6. Replace candidate export `PageSize=100000` with a dedicated backend export flow that applies filters and streams/generates the file server-side.
7. Confirm whether Batch is global or department-scoped. If department-scoped, add backend department ownership/scoping.
8. Keep frontend `DepartmentId` only as a narrowing filter. Backend must continue to enforce the authenticated user's scope.

## Priority Order

1. Proctor Center fixed first 100 active sessions.
2. Grading page local search/exam filter.
3. Candidate Result page local search/status filter.
4. Proctor Incidents first-page local filters.
5. Proctor Report first 500 rows.
6. Candidate export `PageSize=100000`.
7. Batch global-vs-department decision.
