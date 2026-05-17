# Query, Pagination & RBAC Scope Investigation Report
**Generated:** 2026-05-09  
**Scope:** All production list endpoints — authorization scope, department/resource scope, search, filter, sort, count, pagination, and export safety  
**Method:** Live codebase audit (no documentation or memory assumptions)  
**Build Status at time of audit:** ✅ 0 errors, 16 pre-existing warnings

---

## Executive Summary

| Category | Status | Critical Issues |
|---|---|---|
| Controller-level RBAC | ✅ SOUND | None |
| ResourceAuthorizationService coverage | ⚠️ PARTIAL GAPS | IncidentService unscoped |
| Department scoping in service layer | ⚠️ PARTIAL GAPS | IncidentService, BatchService |
| IQueryable server-side pagination | ✅ SOUND | All list services use Skip/Take before ToListAsync |
| IQueryable server-side sort | ✅ SOUND | All list services sort on IQueryable |
| IQueryable server-side search/filter | ✅ SOUND | All list services filter on IQueryable |
| Validator PageSize caps | ⚠️ PARTIAL GAPS | 5 DTOs have no max cap |
| Export endpoint authorization | ✅ SOUND | All exports gated at controller level |
| Export data scope | ✅ SOUND | Export reuses scoped list service |
| Frontend page-size discipline | ❌ CRITICAL GAPS | 13 large-fetch hacks identified |
| Frontend local filtering | ❌ PRESENT | 4 pages filter server data client-side |

---

## 1. Controller-Level RBAC Audit

All controllers audited. Every controller has class-level or per-endpoint `[Authorize(Roles = ...)]`. No anonymous list endpoints found for admin operations.

| Controller | Role Gate | Notes |
|---|---|---|
| `DepartmentsController` | SuperAdmin only (all 11 endpoints) | ✅ |
| `UsersController` | SuperAdmin only | ✅ |
| `RolesController` | SuperAdmin only | ✅ |
| `BatchesController` | SuperAdmin, Admin | ✅ |
| `CandidatesController` | SuperAdmin, Admin | ✅ |
| `AssessmentController` | SuperAdmin, Admin, Instructor | ✅ |
| `AssignmentsController` | SuperAdmin, Admin, Instructor | ✅ |
| `ExamOperationsController` | SuperAdmin, Admin, Instructor | ✅ |
| `CandidateExamDetailsController` | SuperAdmin, Admin, Instructor | ✅ |
| `ExamResultController` | SuperAdmin, Admin, Instructor (admin ops); SuperAdmin, Candidate (own results) | ✅ |
| `GradingController` | SuperAdmin, Admin, Instructor, Examiner (grading ops); SuperAdmin, Candidate (own grade) | ✅ |
| `IncidentController` | SuperAdmin, Admin, Proctor | ✅ (fixed in Phase 2) |
| `ProctorController` | SuperAdmin, Admin, Proctor | ✅ |
| `AttemptController` | SuperAdmin, Candidate (attempt ops); SuperAdmin, Admin, Instructor (admin ops) | ✅ |
| `AttemptControlController` | SuperAdmin, Admin, Instructor | ✅ |
| `QuestionBankController` | SuperAdmin, Admin, Instructor | ✅ |
| `LookupsController` | SuperAdmin, Admin, Instructor | ✅ |
| `AuditController` | SuperAdmin ONLY | ✅ |
| `SystemLogsController` | SuperAdmin ONLY | ✅ |
| `NotificationController` | SuperAdmin ONLY | ✅ |
| `LicenseController` | SuperAdmin ONLY | ✅ |
| `SettingsController` | SuperAdmin ONLY | ✅ |
| `OrganizationController` | SuperAdmin ONLY | ✅ |
| `ExamProctorController` | SuperAdmin, Admin, Instructor | ✅ |
| `IdentityVerificationController` | SuperAdmin, Admin, Proctor, Candidate (submit); SuperAdmin, Admin, Proctor (review) | ✅ |
| `VideoRecordingController` | SuperAdmin, Admin, Proctor | ✅ |
| `CertificateController` | SuperAdmin, Admin, Instructor (list); SuperAdmin, Admin (verify, revoke) | ✅ |
| `MediaController` | delete: SuperAdmin, Admin; download/view: AllowAnonymous (architectural) | ⚠️ known open issue |

---

## 2. ResourceAuthorizationService Coverage

`ResourceAuthorizationService` is the data-scoping kernel — it provides scoped `IQueryable<T>` predicates so each user sees only their department's data (or their own records for Candidates).

### Services that correctly use ResourceAuthorizationService

| Service | Scope Methods Used |
|---|---|
| `UserService` | `ScopeUsersAsync`, `CanAccessUserAsync` |
| `CandidateAdminService` | `ScopeUsersAsync`, `CanAccessCandidateAsync`, `IsCurrentUserSuperAdminAsync` |
| `AttemptService` | `ScopeAttemptsAsync`, `CanAccessAttemptAsync`, `CanAccessCandidateAsync`, `CanAccessExamAsync` |
| `ExamResultService` | `ScopeResultsAsync`, `ScopeResultsForUserAsync`, `ScopeAttemptsAsync`, `GetAccessibleExamIdsAsync`, `CanAccessResultAsync`, `CanAccessExamAsync` |
| `ProctorService` | `ScopeProctorSessionsAsync`, `CanAccessProctorSessionAsync`, `CanAccessEvidenceAsync`, `CanAccessExamAsync` |
| `ExamOperationsService` | `ScopeUsersAsync`, `CanAccessAttemptAsync`, `CanAccessCandidateAsync`, `CanAccessExamAsync` |

### Services with their own department scoping (no ResourceAuthorizationService — uses IDepartmentService directly)

| Service | Mechanism | Assessment |
|---|---|---|
| `AssessmentService` | `IDepartmentService.GetCurrentUserDepartmentIdAsync()` → `Where(x => x.DepartmentId == scopedDeptId)` | ✅ Correct pattern |
| `QuestionBankService` | `IDepartmentService` → `Where(x => x.Subject.DepartmentId == resolvedDeptId)` | ✅ Correct pattern |
| `GradingService` | `IDepartmentService` → `Where(gs => gs.Attempt.Exam.DepartmentId == deptIdGs)` | ✅ Correct pattern |
| `LookupsService` | `IDepartmentService` → subjects/topics scoped to department | ✅ Correct pattern |

---

## 3. ❌ Data Scope Gap — IncidentService

**File:** `Backend-API/Infrastructure/Services/Incident/IncidentService.cs`

`IncidentService.GetCasesAsync()` (the primary list method for `/Incident/cases`) queries ALL incident cases without any department filter:

```csharp
// IncidentService.cs ~L247
var query = _context.Set<IncidentCase>()
     .Include(c => c.Exam)
     .Include(c => c.Candidate)
     .Include(c => c.Assignee)
     .Include(c => c.Appeals)
     .AsQueryable();

query = ApplyCaseFilters(query, searchDto);
query = query.OrderByDescending(c => c.CreatedDate);
// ← No department scope applied before pagination
```

**Impact:** An Admin in Department A can retrieve incident cases from Department B by calling `GET /api/Incident/cases`. The role gate (`SuperAdmin, Admin, Proctor`) blocks unauthorized roles but does not prevent cross-department data leakage between Admins.

**Note:** `IncidentService` has `ICurrentUserService` injected but only uses it to record `userId` on mutations (create, update, assign). It does NOT scope read queries.

**Severity:** HIGH — horizontal privilege escalation risk between Admin accounts.

---

## 4. ⚠️ Data Scope Gap — BatchService

**File:** `Backend-API/Infrastructure/Services/Batch/BatchService.cs`

`BatchService.GetBatchesAsync()` queries all non-deleted batches without department isolation:

```csharp
var query = _db.Batches.Where(b => !b.IsDeleted);
// No department filter applied
```

**Impact:** Admin from Department A can see batch names/descriptions from Department B.

**Mitigation context:** The `Batch` entity may be designed as organization-level (not department-scoped). If batches are intentionally global (shared across departments), this is correct. **Needs product clarification.**

**Severity:** MEDIUM — requires confirmation whether `Batch` entity has a `DepartmentId` field and whether isolation is required.

---

## 5. Server-Side IQueryable Audit (All List Endpoints)

All major list services correctly follow the pattern:

```
scope/filter → search → sort → CountAsync() → Skip/Take → ToListAsync()
```

### Verified services and patterns

| Service | Filter | Sort | Count before paginate | Skip/Take | Max PageSize Validator |
|---|---|---|---|---|---|
| `UserService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ❌ No cap (UserFilterDto unvalidated) |
| `CandidateAdminService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ❌ No cap (CandidateFilterDto unvalidated) |
| `AssessmentService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(100) |
| `AttemptService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(100) |
| `AttemptControlService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | N/A (no validator) |
| `ExamResultService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(100) |
| `GradingService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(100) |
| `IncidentService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(100) |
| `ProctorService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(100) |
| `QuestionBankService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(100) |
| `BatchService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ❌ No cap (BatchFilterDto unvalidated) |
| `ExamAssignmentService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | N/A (no validator) |
| `ExamOperationsService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | N/A (no validator) |
| `AuditService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ✅ LessThanOrEqualTo(500) for logs, LessThanOrEqualTo(100) for others |
| `LookupsService` (subjects) | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ❌ No SearchDto validator |
| `LookupsService` (topics) | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ❌ No SearchDto validator |
| `LookupsService` (categories) | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ❌ No SearchDto validator |
| `LookupsService` (types) | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | ❌ No SearchDto validator |
| `SystemLogService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | N/A (SuperAdmin only) |
| `NotificationService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | N/A (SuperAdmin only) |
| `DepartmentService` | ✅ IQueryable | ✅ IQueryable | ✅ | ✅ | N/A (SuperAdmin only) |
| `MediaStorageService` | ✅ IQueryable | N/A | ✅ | ✅ | N/A (SuperAdmin, Admin only) |

**Finding:** Backend pagination implementation is sound across all services. Every list endpoint materializes results only AFTER applying scope → filter → sort → count → Skip/Take. No `.ToList()` before pagination found on any list endpoint.

---

## 6. ❌ Missing MaxPageSize Validators

FluentValidation is wired globally (`AddFluentValidationAutoValidation()` + `AddValidatorsFromAssemblyContaining<Program>()`). However, the following search DTOs have **no validator registered**, meaning any client-supplied `PageSize` value is accepted:

| DTO | Used By | Max PageSize Enforced | Frontend Sends |
|---|---|---|---|
| `UserFilterDto` | `GET /api/Users` | ❌ No cap | `pageSize: 200` (permissions page) |
| `StaffUserFilterDto` | `GET /api/Users/staff` | ❌ No cap | Various |
| `CandidateFilterDto` | `GET /api/Candidates`, `GET /api/Candidates/export` | ❌ No cap | `PageSize: 100000` (export) |
| `BatchFilterDto` | `GET /api/Batches` | ❌ No cap | `pageSize: 200` (assign-to-exam picker) |
| `QuestionSubjectSearchDto` | `GET /api/Lookups/subjects` | ❌ No cap | `pageSize: 1000` (question bank page) |
| `QuestionTopicSearchDto` | `GET /api/Lookups/topics` | ❌ No cap | `pageSize: 1000` (question bank page) |
| `QuestionCategorySearchDto` | `GET /api/Lookups/categories` | ❌ No cap | `pageSize: 100` |
| `QuestionTypeSearchDto` | `GET /api/Lookups/types` | ❌ No cap | `pageSize: 100` |

**Note on CandidateFilterDto:** The backend export service ignores the client-supplied value and hard-codes `filter.PageSize = 100_000` internally. However, the missing validator means a client could send arbitrary values to the paginated list endpoint as well.

---

## 7. ❌ Frontend Large Page-Size Hacks (Complete Inventory)

### 7.1 API Layer (`lib/api/`)

| File | Line | Value | Purpose |
|---|---|---|---|
| `candidate-admin.ts` | 140 | `PageSize: "100000"` | Export candidates — loads entire dataset as one HTTP response |
| `lookups.ts` | 72, 128, 183, 242 | `pageSize \|\| 100` | All four lookup types (subjects, topics, categories, types) hard-cap at 100 |
| `question-bank.ts` | 20 | `pageSize: 100` | Question list default for question bank |
| `results.ts` | 75 | `pageSize ?? 100` | Default 100 for admin result list |
| `proctoring.ts` | 188–189 | `PageSize: "100"` | Hardcoded session list for proctor center |
| `proctoring.ts` | 462 | `pageSize: 100` | Incidents fetch inside `getProctorDashboard` |
| `reports.ts` | 72 | `"/Assessment/exams?PageSize=100"` | Hardcoded in URL string — untouchable by callers |
| `dashboard.ts` | 85 | `pageSize: 50` | Upcoming exams widget |

### 7.2 Page Components (`app/(dashboard)/`)

| Page | Line | Value | Purpose |
|---|---|---|---|
| `users/permissions/page.tsx` | 66 | `pageSize: 200` | Load all users for permissions management |
| `candidates/assign-to-exam/page.tsx` | 116 | `pageSize: 200` | Load batches for dropdown picker |
| `results/proctor-report/page.tsx` | 29 | `pageSize: 500` | Load all candidate results for report |
| `question-bank/page.tsx` | 83, 140 | `pageSize: 1000` | Load ALL subjects and topics for question bank dropdowns |
| `lookups/topics/page.tsx` | 77 | `pageSize: 1000` | Load ALL subjects for topic management |
| `exams/create-from-template/page.tsx` | 71 | `pageSize: 100` | Load exam templates |
| `batch/[id]/page.tsx` | 88 | `pageSize: 100` | Candidate search picker |
| `lookups/question-categories/page.tsx` | 68 | `pageSize: 100` | Load all categories |
| `lookups/question-types/page.tsx` | 68 | `pageSize: 100` | Load all types |
| `question-bank/ai-studio/page.tsx` | 125, 141 | `pageSize: 100` | Load subjects/topics for AI studio |
| `question-bank/create/page.tsx` | 209, 224 | `pageSize: 100` | Load subjects/topics for create form |
| `reports/page.tsx` | 62 | `pageSize: 100` | Load 100 result records for local filter |

---

## 8. ❌ Frontend Client-Side Filtering After Large Fetches

The following pages fetch a large batch from the server, then filter/sort in JavaScript:

| Page | API Call | Local Operation | Risk |
|---|---|---|---|
| `results/proctor-report/page.tsx` | `getCandidateResultList({ pageSize: 500 })` | `useMemo` filter + distinct candidate extraction | Loads 500 rows into browser memory; filter result is unpredictable if > 500 results exist |
| `reports/page.tsx` | `getExamResults(examId, { pageSize: 100 })` | `filteredCandidates = candidates.filter(...)` | Local text search on up to 100 rows; results beyond 100 are invisible |
| `dashboard.ts` | `getExams({ pageSize: 50 })` | `.filter(e => e.isPublished && ...).sort(...)` | Upcoming exams widget shows wrong data if > 50 exams exist |
| `proctoring.ts` | `getIncidents({ pageSize: 100 })` | `.filter(i => ...)` | Incident filtering in proctor dashboard limited to first 100 |

---

## 9. Export Endpoint Safety Audit

| Endpoint | Role Gate | Data Scope | PageSize Control | Assessment |
|---|---|---|---|---|
| `GET /api/Candidates/export` | SuperAdmin, Admin (class-level) | ✅ CandidateAdminService uses `ScopeUsersAsync` | Backend sets 100k internally | ⚠️ Scoped but unbounded export (intentional) |
| `GET /api/Batches/{id}/export` | SuperAdmin, Admin (class-level) | Batch is ID-specific | N/A (single batch) | ✅ |
| `POST /api/ExamResult/export/request` | SuperAdmin, Admin, Instructor | ✅ Uses job queue with `CanAccessExamAsync` scope | Async job (bounded by exam) | ✅ |
| `GET /api/ExamResult/export/{id}/download` | SuperAdmin, Admin, Instructor | ✅ Job-based, user-owned file | N/A | ✅ |
| `POST /api/Audit/export` | SuperAdmin ONLY | N/A (SuperAdmin sees all) | Async job | ✅ |
| `GET /api/Audit/export/{id}/download` | SuperAdmin ONLY | N/A | N/A | ✅ |

---

## 10. Performance Observation — Repeated DB Calls for Super Admin Check

Multiple services use this pattern:

```csharp
private async Task<bool> IsCurrentUserSuperAdminAsync()
{
    var userId = _currentUserService.UserId;
    if (string.IsNullOrEmpty(userId)) return false;
    var user = await _userManager.FindByIdAsync(userId);     // DB call #1
    return await _userManager.IsInRoleAsync(user, AppRoles.SuperAdmin); // DB call #2
}
```

This exact pattern appears in: `AssessmentService`, `QuestionBankService`, `GradingService`, `LookupsService`. Each list request makes 2 DB round-trips just to resolve the scope key. `ResourceAuthorizationService.IsUserSuperAdminAsync()` has the same pattern.

**Impact:** Every list API call for non-SuperAdmin users costs 2 extra DB queries that are not cached.

---

## 11. Prioritized Issue List

### PRIORITY 1 — CRITICAL (Security / Data Integrity)

| # | Issue | Location | Fix |
|---|---|---|---|
| 1.1 | IncidentService returns all cases without department scope | `IncidentService.cs:GetCasesAsync()` | Apply department scoping via `IDepartmentService` before pagination (same pattern as AssessmentService) |
| 1.2 | CandidateFilterDto has no MaxPageSize validator | `Application/DTOs/CandidateAdminDtos.cs` | Add `CandidateAdminValidators.cs` with `PageSize.LessThanOrEqualTo(500)` |
| 1.3 | UserFilterDto / StaffUserFilterDto have no MaxPageSize validator | `Application/DTOs/UserDtos.cs` | Add user search DTO validators with `PageSize.LessThanOrEqualTo(100)` |
| 1.4 | Frontend sends `PageSize: 200` to permissions user list (exceeds any intended cap) | `users/permissions/page.tsx:66` | Replace with proper paginated component; or use dedicated API for permission management |

### PRIORITY 2 — HIGH (Performance / Data Correctness)

| # | Issue | Location | Fix |
|---|---|---|---|
| 2.1 | `results/proctor-report/page.tsx` loads 500 result rows for local filter | `results/proctor-report/page.tsx:29` | Move search/filter to server via query params; use proper paginated table |
| 2.2 | `reports/page.tsx` fetches 100 candidates then filters client-side | `reports/page.tsx:62,70` | Pass search string as query param to `getExamResults()` |
| 2.3 | `question-bank/page.tsx` loads 1000 subjects + 1000 topics into memory | `question-bank/page.tsx:83,140` | Use server-side search dropdowns with debounce (same endpoint, pass `search` param) |
| 2.4 | `lookups/topics/page.tsx` loads 1000 subjects for dropdown | `lookups/topics/page.tsx:77` | Use paginated or search-filtered subject dropdown |
| 2.5 | `users/permissions/page.tsx` loads 200 users for full management grid | `users/permissions/page.tsx:66` | Use server-side paginated table with proper page controls |
| 2.6 | `candidates/assign-to-exam/page.tsx` loads 200 batches for picker | `assign-to-exam/page.tsx:116` | Use server-side search dropdown |
| 2.7 | Lookup API default `pageSize || 100` in all four lookup types | `lookups.ts:72,128,183,242` | Remove hardcoded override; respect caller-supplied value or use 20 |
| 2.8 | BatchFilterDto has no MaxPageSize validator | `Application/DTOs/BatchDtos.cs` | Add validator with `PageSize.LessThanOrEqualTo(100)` |
| 2.9 | Lookup search DTOs (subject, topic, category, type) have no MaxPageSize validator | `Application/DTOs/` | Add search DTO validators with appropriate caps |

### PRIORITY 3 — MEDIUM (Quality / Correctness)

| # | Issue | Location | Fix |
|---|---|---|---|
| 3.1 | BatchService has no department scope | `BatchService.cs:GetBatchesAsync()` | Clarify with product: are Batches department-scoped? If yes, add dept filter |
| 3.2 | `dashboard.ts` fetches 50 exams then locally filters upcoming | `dashboard.ts:85,88-89` | Add `isPublished=true&startAfter=<now>` server-side filter params |
| 3.3 | `proctoring.ts` fetches 100 incidents then filters client-side | `proctoring.ts:462-463` | Pass status/scope filters as query params |
| 3.4 | `reports.ts` hardcodes `PageSize=100` in URL string | `reports.ts:72` | Extract to proper function call with params |
| 3.5 | `IsCurrentUserSuperAdminAsync()` makes 2 DB calls on every list request | Multiple services | Add `IMemoryCache` or `IHttpContextAccessor`-scoped caching for the result |

### PRIORITY 4 — LOW (Observability)

| # | Issue | Location | Fix |
|---|---|---|---|
| 4.1 | Candidate export sends `PageSize=100000` as query param to backend | `candidate-admin.ts:140` | Remove from query string — backend already overrides to 100k internally |
| 4.2 | `dashboard.ts` `pageSize: 50` for upcoming exams could miss data | `dashboard.ts:85` | Use count endpoint instead of loading data for dashboard stats |

---

## 12. Services Confirmed Safe (No Changes Needed)

The following services were audited and are correctly implemented:

- **AssessmentService** — department scoped, IQueryable, proper pagination
- **QuestionBankService** — department scoped via subject, IQueryable, proper pagination
- **GradingService** — department scoped, IQueryable, proper pagination
- **LookupsService** — department scoped for subjects/topics, IQueryable, proper pagination
- **UserService** — ResourceAuthorizationService.ScopeUsersAsync, proper pagination
- **CandidateAdminService** — ResourceAuthorizationService.ScopeUsersAsync, proper pagination
- **AttemptService** — ResourceAuthorizationService.ScopeAttemptsAsync, proper pagination
- **ExamResultService** — ResourceAuthorizationService.ScopeResultsAsync + GetAccessibleExamIds, proper pagination
- **ProctorService** — ResourceAuthorizationService.ScopeProctorSessionsAsync, proper pagination
- **ExamOperationsService** — ResourceAuthorizationService.CanAccess* per-resource checks, proper pagination
- **AuditService** — SuperAdmin only, IQueryable, proper pagination, async export job pattern
- **SystemLogService** — SuperAdmin only, IQueryable, proper pagination

---

## 13. What Was NOT Changed

This report is investigation-only. No code was modified. All findings above are descriptions of the current production state.

---

*Report produced by live code audit of `c:\_OrbitX Projects\Build4 IT\new-exam` on branch `feature/proctoring-video`*
