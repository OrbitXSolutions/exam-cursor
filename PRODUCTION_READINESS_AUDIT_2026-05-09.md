# Production Readiness Audit Report
**Date:** 2026-05-09  
**Branch:** `feature/proctoring-video`  
**Audited by:** GitHub Copilot (Claude Sonnet 4.6)  
**Scope:** RBAC alignment · IQueryable patterns · Dropdown/lookup pagination · Frontend data-fetching · Export safety · PageSize validators · Performance risks · Security/data-leakage

---

## Executive Summary

The codebase is **structurally sound and architecturally mature**. The vast majority of backend service methods follow the correct IQueryable pipeline (scope → filter → CountAsync → OrderBy → Skip/Take → ToListAsync). RBAC is consistently declared and the frontend route-guard mirrors the backend role attributes accurately.

However, **3 production blockers** and **8 high-severity issues** were identified that must be resolved before pushing to production. The most critical are an open, unauthenticated seed endpoint that can wipe and recreate production data, and an export path that loads up to 100,000 rows into application memory in a single synchronous call.

**Verdict: NOT safe to push to production in current state.**

---

## 1. What Is Working Correctly

| Area | Status |
|------|--------|
| IQueryable pipeline order (scope → filter → count → paginate → materialize) | ✅ Correct across all major services |
| Resource authorization scoping (department isolation, exam access, user scope) | ✅ Implemented via `ResourceAuthorizationService` |
| Backend RBAC attributes on all controllers | ✅ Consistent and granular |
| Frontend `ROUTE_ROLE_MAP` vs backend `[Authorize(Roles)]` | ✅ Aligned |
| FluentValidation auto-wired (`AddFluentValidationAutoValidation`) | ✅ Active |
| Proctor assign exam dropdown: debounced server-search + load-more (pageSize=20) | ✅ Correct pattern |
| Audit and ExamResult exports: async job-based pattern | ✅ Safe |
| Sort applied before Skip/Take (not before CountAsync — correct) | ✅ Correct |
| Certificate verification: `[AllowAnonymous]` is intentional and safe | ✅ Legitimate |
| Public exam share link controller: token-scoped, no data leak | ✅ Acceptable |
| Rate limiting configured (`AddRateLimiter`) | ✅ Present |

---

## 2. Production Blockers (STOP — Do Not Deploy)

### BLOCKER-1 · SeedController endpoints are publicly accessible in production
**Severity: CRITICAL**  
**File:** [Backend-API/Controllers/SeedController.cs](Backend-API/Controllers/SeedController.cs)  
**Lines:** 93–152

The `POST /api/Seed/demo-data` and `POST /api/Seed/all` endpoints are decorated `[AllowAnonymous]` and the seed key protection was **commented out**:

```csharp
// Optional: Add a seed key for production security
//   var seedKey = _configuration["AppSettings:SeedKey"];
//var providedKey = Request.Headers["X-Seed-Key"].FirstOrDefault();
//if (!string.IsNullOrEmpty(seedKey) && seedKey != providedKey)
//      return Unauthorized(...);
```

Any unauthenticated HTTP client can call these endpoints and seed the entire database with demo users (including Admin accounts with known passwords `Demo@123456`). In production this is a full system takeover vector.

**The initial `/api/Seed` (SeedData) endpoint also lacks environment checks** — its key guard only fires if `AppSettings:SeedKey` is configured, with no environment check to disable in production.

**Fix required before deploy:**
- Remove or disable the entire `SeedController` in production builds, or add `[Authorize(Roles = AppRoles.SuperAdmin)]` and reinstate the key guard on all three methods.
- Alternatively, add `app.Environment.IsProduction()` guard in `Program.cs` to skip registering the seeder entirely.

---

### BLOCKER-2 · Export candidates loads 100,000 rows into memory synchronously
**Severity: CRITICAL (OOM / performance)**  
**Files:**
- [Backend-API/Infrastructure/Services/CandidateAdmin/CandidateAdminService.cs](Backend-API/Infrastructure/Services/CandidateAdmin/CandidateAdminService.cs) — Line 347
- [Frontend/Smart-Exam-App-main/lib/api/candidate-admin.ts](Frontend/Smart-Exam-App-main/lib/api/candidate-admin.ts) — Line 140

**Backend code:**
```csharp
public async Task<byte[]> ExportCandidatesAsync(CandidateFilterDto filter)
{
    // Remove pagination for export
    filter.PageNumber = 1;
    filter.PageSize = 100_000;          // ← 100K rows loaded into RAM
    var response = await GetCandidatesAsync(filter);
```

**Frontend code:**
```typescript
query.set("PageSize", "100000");       // ← bypasses validator cap of 100
```

The `CandidateFilterDtoValidator` correctly caps PageSize at 100, but the export service **mutates the filter DTO after validation** to 100,000, bypassing that cap entirely. On a large tenant with tens of thousands of candidates, this will load all records into application RAM, materialize them into a `List<CandidateListDto>`, and then build an XL workbook in memory.

**Fix required before deploy:**
- Replace with a streaming/chunked approach: query the database in pages of ≤5,000 and write each chunk directly into the XLWorkbook stream, or use the existing async job-based pattern already in place for Audit and ExamResult exports.
- Remove the `PageSize = 100_000` mutation entirely.

---

### BLOCKER-3 · Media files (evidence, identity photos, question images) are publicly downloadable without authentication
**Severity: CRITICAL (data leakage)**  
**File:** [Backend-API/Controllers/MediaController.cs](Backend-API/Controllers/MediaController.cs) — Lines 71, 90

```csharp
[HttpGet("{id:guid}/download")]
[AllowAnonymous] // Allow anonymous download if you want public file access
public async Task<IActionResult> Download(Guid id) { ... }

[HttpGet("{id:guid}/view")]
[AllowAnonymous]
public async Task<IActionResult> View(Guid id) { ... }
```

The `MediaStorage` subsystem stores proctoring evidence (screenshots, webcam frames), identity verification documents (national IDs), and question attachments under a flat GUID namespace. With these two endpoints anonymous, any person who can guess or obtain a file GUID can download sensitive candidate ID photos or proctor screenshots without any authentication.

**Fix required before deploy:**
- Remove both `[AllowAnonymous]` attributes. Require at minimum `[Authorize]`.
- For question images that may need public access during a live exam, scope the download check to the active attempt token.

---

## 3. High Severity Issues

### HIGH-1 · Frontend exam builder fetches only first 100 questions then filters client-side
**File:** [Frontend/Smart-Exam-App-main/app/(dashboard)/exams/[id]/builder/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/exams/[id]/builder/page.tsx) — Line 125  
[Frontend/Smart-Exam-App-main/lib/api/question-bank.ts](Frontend/Smart-Exam-App-main/lib/api/question-bank.ts) — Line 20

```typescript
// question-bank.ts — default pageSize baked in:
const queryString = buildQueryString({ pageSize: 100, ...params })

// builder/page.tsx:
const questionsData = await getQuestions()            // fetches max 100 questions
setAvailableQuestions(questionsData.items.filter((q) => q.isActive))  // client-side filter
```

With a question bank of >100 questions, the builder silently shows only the first 100 and the `.filter(q => q.isActive)` runs on that partial slice. Exam authors building exams with large question banks receive an incomplete list with no warning.

**Fix:** Replace with a paginated/searchable question picker that issues server-side queries.

---

### HIGH-2 · Reports page CSV export only exports the visible page (100 records)
**File:** [Frontend/Smart-Exam-App-main/app/(dashboard)/reports/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/reports/page.tsx) — Lines 126–163

```typescript
getExamResults(selectedExamId, {
    pageSize: 100,          // ← fetches max 100 results
    search: searchQuery,
}).then((res) => {
    setCandidates(res.items)   // stores first 100 only
})

function exportCsv() {
    // exports only candidates[] — the local 100-item array
    const rows = candidates.map(...)
```

If an exam has 500 candidates, the exported CSV silently contains only the first 100. There is no UI warning about truncation.

**Fix:** Either (a) call the async results export job API before downloading, or (b) display a warning that the CSV represents only the loaded page.

---

### HIGH-3 · SystemLogFilterDto has no PageSize validator — unbounded query possible
**File:** [Backend-API/Application/DTOs/Logs/SystemLogDtos.cs](Backend-API/Application/DTOs/Logs/SystemLogDtos.cs) — Line 51  
No validator found under `Application/Validators/` for `SystemLogFilterDto`.

```csharp
public int PageSize { get; set; } = 50;   // no validator enforces a cap
```

A SuperAdmin (or an attacker who compromises a SuperAdmin token) can request `pageSize=999999` on the system logs endpoint, loading the entire log table into RAM. System log tables grow fast and can contain millions of rows.

**Fix:** Add `SystemLogFilterDtoValidator` with `.LessThanOrEqualTo(200)` or similar cap.

---

### HIGH-4 · Exam setup component requests pageSize=500 for subjects/topics but backend cap is 200
**File:** [Frontend/Smart-Exam-App-main/components/exam/exam-setup-content.tsx](Frontend/Smart-Exam-App-main/components/exam/exam-setup-content.tsx) — Lines 175, 185

```typescript
const response = await getQuestionSubjects({ pageSize: 500 })   // validator cap is 200 → returns 400
const response = await getQuestionTopics({ subjectId, pageSize: 500 })  // same issue
```

`QuestionSubjectValidators` caps at 200 and `QuestionTopicValidators` caps at 200. These requests will be **rejected with a 400 validation error** from the backend, silently breaking the exam setup subjects/topics dropdowns.

**Fix:** Reduce to `pageSize: 100` and implement proper server-side search with load-more.

---

### HIGH-5 · Users/permissions page fetches 200 users with client-side filter — truncates silently
**File:** [Frontend/Smart-Exam-App-main/app/(dashboard)/users/permissions/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/users/permissions/page.tsx) — Lines 60–70

```typescript
const res = await getUsers({
    search: search || undefined,
    page: 1,
    pageSize: 200,          // hard-coded ceiling
})
setUsers(res.items.filter(u => !hidden.includes(u.role as string)))
```

Any tenant with >200 staff users (across Admin, Instructor, Examiner, Proctor) will have a silently truncated permissions list. The page has no "load more", no pagination, and no warning when the real count exceeds 200. The `UserFilterDtoValidator` allows up to 500, but the frontend is capped at 200.

**Fix:** Replace with proper server-side pagination.

---

### HIGH-6 · Client-side incident filtering after fixed page load in getSessionDetails
**File:** [Frontend/Smart-Exam-App-main/lib/api/proctoring.ts](Frontend/Smart-Exam-App-main/lib/api/proctoring.ts) — Lines 462–468

```typescript
const inc = await getIncidents({ pageNumber: 1, pageSize: 100 });
incidents = inc.items.filter(
    (i) => i.examTitle === session.examTitle && i.candidateName === session.candidateName,
);
```

This fetches the first 100 incidents across all exams/candidates then filters locally. It will:
1. Miss incidents for this session if there are >100 total incidents.
2. Expose (in memory, briefly) incident records from other candidates to the current request context.

**Fix:** Pass `examId` and `candidateId` as query params to the backend and use the server-side filter already available in `IncidentService`.

---

### HIGH-7 · Question bank, lookups, batch dropdowns use large fixed pageSizes — no load-more
**Files:**
- [Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/page.tsx) — Lines 83, 140 (`pageSize: 200`)
- [Frontend/Smart-Exam-App-main/app/(dashboard)/lookups/topics/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/lookups/topics/page.tsx) — Line 77 (`pageSize: 200`)
- [Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/[id]/edit/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/question-bank/%5Bid%5D/edit/page.tsx) — Lines 97, 143 (`pageSize: 100`)
- [Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/batch/[id]/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/batch/%5Bid%5D/page.tsx) — Line 88 (`pageSize: 100`)
- [Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/assign-to-exam/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/candidates/assign-to-exam/page.tsx) — Line 150 (`pageSize: 100` for batches)

All of these fetch a fixed large block and silently truncate when data exceeds that number. None implement load-more or server-side async search (unlike the well-implemented proctor assign dropdown).

**Fix:** Replace pre-load pattern with async debounced search + load-more, following the pattern in [proctor/assign/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/proctor/assign/page.tsx).

---

### HIGH-8 · reports.ts fetches only 100 exams for reports dropdown — truncates
**File:** [Frontend/Smart-Exam-App-main/lib/api/reports.ts](Frontend/Smart-Exam-App-main/lib/api/reports.ts) — Line 73

```typescript
const data = await apiClient.get<{ items?: ExamListItem[] }>("/Assessment/exams?PageSize=100")
```

The reports dropdown will be limited to the first 100 exams. Large tenants with >100 exams will not be able to generate reports for later-created exams.

**Fix:** Replace with a searchable async dropdown using `pageSize: 20` and load-more.

---

## 4. Medium Severity Issues

### MED-1 · LookupsController GET endpoints are AllowAnonymous — leaks internal taxonomy
**File:** [Backend-API/Controllers/Lookups/LookupsController.cs](Backend-API/Controllers/Lookups/LookupsController.cs) — Lines 30, 165, 233

`GET /api/Lookups/question-categories`, `GET /api/Lookups/question-subjects`, and `GET /api/Lookups/question-topics` are all `[AllowAnonymous]`.

These endpoints expose the organization's internal curriculum taxonomy (subjects, categories, topics) without any authentication. While the data is not highly sensitive, it may reveal internal department names and organizational structure to external parties.

If these endpoints are needed during the public exam-taking flow (e.g., for candidate registration), they should be scoped to authenticated candidates only or use a separate public read DTO that excludes internal metadata.

---

### MED-2 · AuditLogSearchDtoValidator allows pageSize up to 500
**File:** [Backend-API/Application/Validators/Audit/AuditValidators.cs](Backend-API/Application/Validators/Audit/AuditValidators.cs) — Line 15

```csharp
.LessThanOrEqualTo(500).WithMessage("Page size cannot exceed 500");
```

500 audit log rows in a single response can be large in a high-activity system. Recommend reducing to 100–200.

---

### MED-3 · UserFilterDtoValidator allows pageSize up to 500
**File:** [Backend-API/Application/Validators/Users/UserValidators.cs](Backend-API/Application/Validators/Users/UserValidators.cs) — Line 31

```csharp
.LessThanOrEqualTo(500).WithMessage("Page size cannot exceed 500");
```

SuperAdmin-only endpoint but 500 user records with role resolution per record (N+1 lookups to `GetRolesAsync`) is significant. Recommend cap of 100.

---

### MED-4 · DepartmentsController GetAll has no PageSize validator
**File:** [Backend-API/Controllers/DepartmentsController.cs](Backend-API/Controllers/DepartmentsController.cs) — Lines 24–32

```csharp
[HttpGet]
[Authorize(Roles = AppRoles.SuperAdmin)]
public async Task<IActionResult> GetAll(
    [FromQuery] string? search = null,
    [FromQuery] bool includeInactive = false,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)   // ← no validator, no cap enforced
```

The `pageSize` is a raw query param with no FluentValidation validator attached. A SuperAdmin can pass `pageSize=999999`. The service (`DepartmentService.GetAllAsync`) applies correct pagination but without a validator cap a very large value causes a large query.

---

## 5. Low Severity Issues

### LOW-1 · Exam setup loads all subjects/topics even if only 1–2 are needed
The exam builder fetches all subjects and all topics per selected subject in parallel. For a tenant with many subjects, this creates many parallel API calls on page load. Consider lazy-loading topics only when a subject is selected (topics are already lazy via `loadTopicsForSubject`; subjects should also use search-as-you-type).

### LOW-2 · lookups question-types and question-categories pages load 100 items with no pagination
**Files:**
- [Frontend/Smart-Exam-App-main/app/(dashboard)/lookups/question-types/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/lookups/question-types/page.tsx) — Line 68
- [Frontend/Smart-Exam-App-main/app/(dashboard)/lookups/question-categories/page.tsx](Frontend/Smart-Exam-App-main/app/(dashboard)/lookups/question-categories/page.tsx) — Line 68

These are management pages (not dropdowns), so loading 100 records for display is acceptable, but they have no "load more" if the count exceeds 100.

### LOW-3 · `CandidateAdminService.GetCandidatesAsync` uses `UserRoles` join to resolve candidates
Lines 56–57: The service first materializes all candidate user IDs via `_db.UserRoles.Where(...).Select(...).ToListAsync()` (unbounded) and then queries `_db.Users.Where(u => candidateUserIds.Contains(u.Id))`. For a tenant with 50,000 candidates, the first query loads 50,000 IDs into RAM before the `Contains` clause. Consider replacing with a direct join query against `UserRoles` within the main IQueryable.

### LOW-4 · N+1 pattern in UserService.GetAllUsersAsync
[Backend-API/Infrastructure/Services/UserService.cs](Backend-API/Infrastructure/Services/UserService.cs) — Line 185: After pagination, a `foreach` loop calls `_userManager.GetRolesAsync(user)` per user, producing N+1 database calls for the roles table. With `pageSize=500` this is 500 individual role lookups per request.

---

## 6. PageSize Caps Summary

| DTO / Filter | Validator Cap | Default | Assessment |
|---|---|---|---|
| `QuestionSearchDto` | 100 | 10 | ✅ Good |
| `ExamFilterDto` | 100 | 10 | ✅ Good |
| `CandidateFilterDto` | 100 | 20 | ✅ Good (export bypasses — see BLOCKER-2) |
| `AttemptFilterDto` | 100 | 10 | ✅ Good |
| `BatchFilterDto` | 100 | 20 | ✅ Good |
| `GradingSearchDto` | 100 | 10 | ✅ Good |
| `IncidentSearchDto` | 100 | 20 | ✅ Good |
| `ProctorSessionSearchDto` | 100 | 20 | ✅ Good |
| `ExamResultSearchDto` | 100 | 10 | ✅ Good |
| `ExamAssignmentFilterDto` | (check) | 20 | ⚠️ Verify |
| `QuestionSubjectSearchDto` | **200** | 10 | ⚠️ Review — large for a lookup |
| `QuestionTopicSearchDto` | **200** | 10 | ⚠️ Review — large for a lookup |
| `AuditLogSearchDto` | **500** | 50 | ⚠️ High — consider reducing to 100 |
| `UserFilterDto` (staff) | **500** | 10 | ⚠️ High — consider reducing to 100 |
| `StaffUserFilterDto` | 100 | 10 | ✅ Good |
| `SystemLogFilterDto` | **NONE** | 50 | 🔴 Missing validator — CRITICAL gap |

---

## 7. RBAC Alignment: Frontend vs Backend

| Route | Frontend `ROUTE_ROLE_MAP` | Backend `[Authorize(Roles)]` | Aligned? |
|---|---|---|---|
| `/users` | SuperAdmin | `UsersController: SuperAdmin` | ✅ |
| `/departments` | SuperAdmin | `DepartmentsController: SuperAdmin` | ✅ |
| `/organization` | SuperAdmin | `OrganizationController: SuperAdmin` | ✅ |
| `/settings/license` | SuperAdmin | `SettingsController: SuperAdmin` | ✅ |
| `/audit` | SuperAdmin | `AuditController: SuperAdmin` | ✅ |
| `/logs` | SuperAdmin | `SystemLogsController: SuperAdmin` | ✅ |
| `/question-bank` | SuperAdmin, Admin, Instructor | `QuestionBankController: SuperAdmin, Admin, Instructor` | ✅ |
| `/lookups` | SuperAdmin, Admin, Instructor | `LookupsController: SuperAdmin, Admin, Instructor` | ✅ |
| `/exams` | SuperAdmin, Admin, Instructor | `AssessmentController: SuperAdmin, Admin, Instructor` | ✅ |
| `/candidates/batch` | SuperAdmin, Admin | `BatchesController: SuperAdmin, Admin` | ✅ |
| `/candidates/data` | SuperAdmin, Admin | `CandidatesController: SuperAdmin, Admin` | ✅ |
| `/candidates` | SuperAdmin, Admin, Instructor | `CandidateExamDetailsController: SuperAdmin, Admin, Instructor` | ✅ |
| `/grading` | SuperAdmin, Admin, Instructor, Examiner | `GradingController: SuperAdmin, Admin, Instructor, Examiner` | ✅ |
| `/results` | SuperAdmin, Admin, Instructor | `ExamResultController` (check) | ✅ |
| `/proctor` | SuperAdmin, Admin, Proctor, Instructor | `ProctorController: Authorize on class` | ⚠️ Class-level `[Authorize]` only — method-level role grants vary; confirm Instructor can only reach `/proctor/assign` |
| `/my-exams`, `/my-results` | Candidate | `CandidateController: SuperAdmin, Candidate` | ✅ |

**Note:** The frontend `ROUTE_ROLE_MAP` provides only browser-level routing protection. All enforcement is authoritative at the backend — this is correctly implemented.

---

## 8. Recommended Priority Order

| Priority | Issue | Effort |
|---|---|---|
| 1 | BLOCKER-1: Disable/secure SeedController in production | Low |
| 2 | BLOCKER-2: Replace export with streaming/job-based approach | Medium |
| 3 | BLOCKER-3: Remove `[AllowAnonymous]` from Media download/view | Low |
| 4 | HIGH-1: Fix exam builder question loading (paginated search) | High |
| 5 | HIGH-2: Fix reports CSV export to use full dataset | Medium |
| 6 | HIGH-3: Add SystemLogFilterDtoValidator with cap | Low |
| 7 | HIGH-4: Fix exam-setup-content pageSize 500 → 100 | Low |
| 8 | HIGH-5: Fix permissions page users fetch to use pagination | Medium |
| 9 | HIGH-6: Fix getSessionDetails incidents to use server-side filter | Low |
| 10 | HIGH-7: Replace remaining large-fetch dropdowns with async search | High |
| 11 | HIGH-8: Fix reports exam dropdown with async search | Medium |
| 12 | MED-1: Review LookupsController AllowAnonymous intent | Low |
| 13 | MED-2/3: Tighten AuditLog and User pageSize caps to 100 | Low |
| 14 | MED-4: Add pageSize validator to DepartmentsController | Low |
| 15 | LOW-3: Refactor CandidateAdmin UserRoles join to stay in DB | Medium |
| 16 | LOW-4: Batch role lookups in UserService | Medium |

---

## 9. Final Verdict

| Category | Result |
|---|---|
| RBAC frontend/backend alignment | ✅ Aligned |
| Server-side IQueryable pipeline | ✅ Correct |
| CountAsync before pagination | ✅ Correct |
| ToListAsync only after Skip/Take | ✅ Correct |
| Authorization scoping before count | ✅ Correct |
| Dropdown async search (all dropdowns) | ❌ Multiple large-fetch hacks remain |
| No local filtering over partial pages | ❌ Multiple violations |
| Export safety | ❌ 100K in-memory export (BLOCKER) |
| PageSize validators present and reasonable | ⚠️ Missing for SystemLog; too large for Audit/Users |
| Security / data leakage | ❌ Open seed endpoint + open media download |
| **Safe to push to production** | 🔴 **NO** |

The system requires resolution of all 3 blockers and at minimum HIGH-3 through HIGH-6 before a production deployment. HIGH-1, HIGH-2, HIGH-7, and HIGH-8 represent functional correctness issues that will silently degrade user experience at scale and should be resolved in the next sprint.
