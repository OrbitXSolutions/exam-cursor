# RBAC Deep Investigation — Live Code Verified — 2026-05-09

## Investigation Method

Every finding in this report is verified directly from the current codebase.
No documentation or previous reports were used as input.
Files read and cross-checked:

**Backend:**

- `Backend-API/Domain/Constants/AppRoles.cs`
- `Backend-API/Infrastructure/Data/DatabaseSeeder.cs`
- `Backend-API/Infrastructure/Services/Authorization/ResourceAuthorizationService.cs`
- All 32 controllers under `Backend-API/Controllers/**/*.cs`

**Frontend:**

- `Frontend/Smart-Exam-App-main/lib/types/index.ts`
- `Frontend/Smart-Exam-App-main/lib/auth/context.tsx`
- `Frontend/Smart-Exam-App-main/components/layout/sidebar.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/layout.tsx`
- `Frontend/Smart-Exam-App-main/app/(candidate)/layout.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/users/page.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/users/permissions/page.tsx`
- `Frontend/Smart-Exam-App-main/lib/api/admin.ts`
- `Frontend/Smart-Exam-App-main/lib/tutorials/tutorial-data.ts`

---

## Business RBAC Requirement (Source: You)

| Role       | Allowed Areas                                                                         |
| ---------- | ------------------------------------------------------------------------------------- |
| SuperAdmin | Administration, System Logs — exclusive, not department-based, all departments        |
| Admin      | Question Bank, Exam Management, Result, Proctor Center, Candidates — department-based |
| Instructor | Question Bank, Exam Management, Assign to Exam — department-based                     |
| Proctor    | Proctor Center only                                                                   |
| Examiner   | Result > Grading only                                                                 |
| Candidate  | Candidate Profile, My Exams, Taking Exam — own scope                                  |
| Removed    | ProctorReviewer, Auditor, SuperDev                                                    |

---

## 1. Backend Role Constants (AppRoles.cs)

```csharp
public const string SuperAdmin = "SuperAdmin";
public const string Admin = "Admin";
public const string Instructor = "Instructor";
public const string Candidate = "Candidate";
public const string Examiner = "Examiner";
public const string Proctor = "Proctor";
public static readonly string[] AllRoles = { SuperAdmin, Admin, Instructor, Candidate, Examiner, Proctor };
```

**Status: CLEAN.** Exactly 6 roles. No ProctorReviewer, Auditor, or SuperDev in constants.

---

## 2. Backend Controller Authorization — Verified Per Endpoint

### 2.1 Administration Group

| Controller                      | Actual Authorization                       | Business Req | Status        |
| ------------------------------- | ------------------------------------------ | ------------ | ------------- |
| UsersController (class)         | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched     |
| UsersController L158 (one op)   | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched     |
| RolesController (class)         | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched     |
| DepartmentsController (class)   | `[Authorize]` then each op = SuperAdmin    | SuperAdmin   | ✓ Matched     |
| OrganizationController          | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched     |
| LicenseController GET (status)  | `[Authorize]` (any auth user)              | Any auth     | ✓ Intentional |
| LicenseController POST (upload) | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched     |
| NotificationController          | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched     |
| SettingsController              | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched     |

### 2.2 System Logs / Audit Group

| Controller           | Actual Authorization                       | Business Req | Status    |
| -------------------- | ------------------------------------------ | ------------ | --------- |
| SystemLogsController | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched |
| AuditController      | `[Authorize(Roles = AppRoles.SuperAdmin)]` | SuperAdmin   | ✓ Matched |

### 2.3 Question Bank Group

| Controller             | Actual Authorization          | Business Req     | Status                                |
| ---------------------- | ----------------------------- | ---------------- | ------------------------------------- |
| QuestionBankController | `SuperAdmin,Admin,Instructor` | Admin,Instructor | ✓ Matched (SuperAdmin+ is acceptable) |
| LookupsController      | `SuperAdmin,Admin,Instructor` | Admin,Instructor | ✓ Matched                             |

### 2.4 Exam Management Group

| Controller               | Actual Authorization          | Business Req     | Status                                      |
| ------------------------ | ----------------------------- | ---------------- | ------------------------------------------- |
| AssessmentController     | `SuperAdmin,Admin,Instructor` | Admin,Instructor | ✓ Matched                                   |
| ExamOperationsController | `SuperAdmin,Admin,Instructor` | Admin,Instructor | ✓ Matched                                   |
| AttemptControlController | `SuperAdmin,Admin,Instructor` | Admin,Instructor | ✓ Matched                                   |
| PublicExamController     | `[AllowAnonymous]`            | (public)         | ⚠️ Needs per-endpoint audit (see Section 5) |

### 2.5 Candidates Group

| Controller                     | Actual Authorization          | Business Req                        | Status    |
| ------------------------------ | ----------------------------- | ----------------------------------- | --------- |
| CandidatesController           | `SuperAdmin,Admin`            | Admin                               | ✓ Matched |
| BatchesController              | `SuperAdmin,Admin`            | Admin                               | ✓ Matched |
| AssignmentsController          | `SuperAdmin,Admin,Instructor` | Admin + Instructor (Assign to Exam) | ✓ Matched |
| CandidateExamDetailsController | `SuperAdmin,Admin,Instructor` | Admin,Instructor                    | ✓ Matched |

### 2.6 Result and Grading Group — MISMATCHES FOUND

| Controller                         | Actual Authorization                   | Business Req        | Status                                                                                                   |
| ---------------------------------- | -------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| ExamResultController (most ops)    | `SuperAdmin,Admin,Instructor`          | **Admin only**      | ✗ **MISMATCH — Instructor has backend result access**                                                    |
| ExamResultController L115          | `SuperAdmin,Admin`                     | Admin               | ✓ (admin-only publish op)                                                                                |
| ExamResultController candidate ops | `SuperAdmin,Candidate`                 | Candidate           | ✓                                                                                                        |
| GradingController (most ops)       | `SuperAdmin,Admin,Instructor,Examiner` | **Admin,Examiner**  | ✗ **MISMATCH — Instructor has backend grading access**                                                   |
| GradingController candidate ops    | `SuperAdmin,Candidate`                 | Candidate           | ✓                                                                                                        |
| CertificateController verify       | `[AllowAnonymous]`                     | (public verify)     | ✓ Intentional public verification                                                                        |
| CertificateController my-certs     | `[Authorize]` (any auth)               | Candidate self-view | ⚠️ Any authenticated user (not restricted to Candidate)                                                  |
| CertificateController by-result    | `[Authorize]` (any auth)               | Candidate self-view | ⚠️ Any authenticated user; service passes `candidateId = currentUserId` so data-layer enforces ownership |
| CertificateController download     | `[Authorize]` (any auth)               | Candidate download  | ⚠️ Service layer enforces ownership via `GetByIdAsync(id, candidateId)` — verify service implementation  |
| CertificateController create       | `SuperAdmin,Admin,Instructor`          | Admin               | ✗ **Instructor can create certificates — should be Admin only**                                          |
| CertificateController revoke       | `SuperAdmin,Admin`                     | Admin               | ✓ Matched                                                                                                |
| CertificateController regenerate   | `SuperAdmin,Admin`                     | Admin               | ✓ Matched                                                                                                |

### 2.7 Proctor Center Group — INCIDENT MISMATCH FOUND

| Controller                            | Actual Authorization          | Business Req              | Status                                                         |
| ------------------------------------- | ----------------------------- | ------------------------- | -------------------------------------------------------------- |
| ProctorController (most ops)          | `SuperAdmin,Admin,Proctor`    | Admin,Proctor             | ✓ Matched                                                      |
| VideoRecordingController key ops      | `SuperAdmin,Admin,Proctor`    | Admin,Proctor             | ✓ Matched                                                      |
| IdentityVerificationController review | `SuperAdmin,Admin,Proctor`    | Admin,Proctor             | ✓ Matched                                                      |
| IdentityVerificationController submit | `SuperAdmin,Admin,Candidate`  | Candidate (submit)        | ✓ Matched (Admin for support access is documented pattern)     |
| ExamProctorController                 | `SuperAdmin,Admin,Instructor` | Admin,Instructor (assign) | ✓ Matched                                                      |
| **IncidentController (ALL ops)**      | **`SuperAdmin,Admin` ONLY**   | **Admin + Proctor**       | ✗ **MISMATCH — Proctor excluded from all incident operations** |

> **Impact**: The frontend routes `/proctor-center/incidents` and `/proctor-center/incidents/[id]` are accessible to Proctor role via the `/proctor-center` route guard. Proctor navigates to incidents but gets HTTP 403 from every IncidentController API call.

### 2.8 Candidate Portal Group

| Controller                                   | Actual Authorization          | Business Req | Status                                          |
| -------------------------------------------- | ----------------------------- | ------------ | ----------------------------------------------- |
| CandidateController                          | `SuperAdmin,Candidate`        | Candidate    | ✓ (SuperAdmin support access is documented)     |
| AttemptController candidate ops (L30–L183)   | `SuperAdmin,Candidate`        | Candidate    | ✓                                               |
| AttemptController management ops (L205–L238) | `SuperAdmin,Admin,Instructor` | Admin        | ⚠️ Instructor has management access to attempts |
| AttemptController admin ops (L249–L261)      | `SuperAdmin,Admin`            | Admin        | ✓                                               |

### 2.9 Media and Infrastructure

| Controller                             | Actual Authorization                   | Status                                                                                                       |
| -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| MediaController (upload, list, delete) | `[Authorize]` — any authenticated user | ⚠️ Candidate/Proctor/Examiner can upload, list ALL files, and delete any file (no ownership check on delete) |
| MediaController download (`/download`) | `[AllowAnonymous]`                     | ✗ **SECURITY RISK — Anyone with a GUID can download exam media without authentication**                      |
| MediaController view (`/view`)         | `[AllowAnonymous]`                     | ✗ **SECURITY RISK — Same as above for inline viewing**                                                       |
| AuthController two ops                 | `[Authorize]`                          | ✓ Fine (profile/refresh)                                                                                     |
| **SeedController ALL ops**             | **`[AllowAnonymous]`**                 | ✗ **CRITICAL SECURITY RISK — See Section 5**                                                                 |

---

## 3. Frontend Authorization — Verified Per File

### 3.1 Role Enum (lib/types/index.ts)

```typescript
export enum UserRole {
  Candidate = "Candidate",
  Instructor = "Instructor",
  Admin = "Admin",
  SuperAdmin = "SuperAdmin",
  Examiner = "Examiner",
  Proctor = "Proctor",
}
```

**Status: CLEAN.** Matches backend 6 roles exactly. No stale roles in the enum.

### 3.2 Auth Context (lib/auth/context.tsx)

**Single-role storage issue (code verified):**

```typescript
role: (result.data.user.roles[0] || "Candidate") as UserRole,
```

```typescript
const hasRole = (roles: UserRole | UserRole[]): boolean => {
  if (!user) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role); // only checks single stored role
};
```

**Findings:**

- Login maps `roles[0]` from backend JWT to `user.role`.
- `hasRole()` checks only this single stored role.
- All frontend route guards and sidebar visibility rely on this function.
- If a user has multiple roles in the backend, frontend authorization diverges from JWT claims and from what the backend enforces.
- Current system design appears single-role per user. If that invariant holds, this is acceptable. If multi-role users are ever created, this is a medium-risk gap.

### 3.3 Sidebar (components/layout/sidebar.tsx) — Verified Nav Groups

| Nav Group       | Group Roles                              | Sub-item Overrides                                                                                   | Backend Match                                                              |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Question Bank   | SuperAdmin,Admin,Instructor              | None                                                                                                 | ✓ Matched                                                                  |
| Exam Management | SuperAdmin,Admin,Instructor              | `assignToProctor` → Admin,Instructor only                                                            | ✓ Matched                                                                  |
| **Result**      | **SuperAdmin,Admin,Instructor,Examiner** | Grading: all 4; CandidateResult/Terminated/ProctorReport: SuperAdmin,Admin                           | ✗ Instructor visible in group (matches backend but deviates from business) |
| Proctor Center  | SuperAdmin,Admin,Proctor                 | None                                                                                                 | ✓ Matched                                                                  |
| Candidates      | SuperAdmin,Admin,Instructor              | Batch: SuperAdmin,Admin; CandidatesData: SuperAdmin,Admin; AssignToExam + ExamDetails: inherit group | ✓ Matched                                                                  |
| Administration  | SuperAdmin                               | None                                                                                                 | ✓ Matched                                                                  |
| Notifications   | SuperAdmin                               | None                                                                                                 | ✓ Matched                                                                  |
| System Logs     | SuperAdmin                               | None                                                                                                 | ✓ Matched                                                                  |

### 3.4 Dashboard Route Guard (app/(dashboard)/layout.tsx — ROUTE_ROLE_MAP)

| Route Prefix        | Frontend Guard                       | Backend Actual                       | F↔B Match | Business Match                  |
| ------------------- | ------------------------------------ | ------------------------------------ | --------- | ------------------------------- |
| `/users`            | SuperAdmin                           | SuperAdmin                           | ✓         | ✓                               |
| `/departments`      | SuperAdmin                           | SuperAdmin                           | ✓         | ✓                               |
| `/organization`     | SuperAdmin                           | SuperAdmin                           | ✓         | ✓                               |
| `/settings/license` | SuperAdmin                           | SuperAdmin                           | ✓         | ✓                               |
| `/notifications`    | SuperAdmin                           | SuperAdmin                           | ✓         | ✓                               |
| `/audit`            | SuperAdmin                           | SuperAdmin                           | ✓         | ✓                               |
| `/logs`             | SuperAdmin                           | SuperAdmin                           | ✓         | ✓                               |
| `/question-bank`    | SuperAdmin,Admin,Instructor          | SuperAdmin,Admin,Instructor          | ✓         | ✓                               |
| `/lookups`          | SuperAdmin,Admin,Instructor          | SuperAdmin,Admin,Instructor          | ✓         | ✓                               |
| `/exams`            | SuperAdmin,Admin,Instructor          | SuperAdmin,Admin,Instructor          | ✓         | ✓                               |
| `/candidates/batch` | SuperAdmin,Admin                     | SuperAdmin,Admin                     | ✓         | ✓                               |
| `/candidates/data`  | SuperAdmin,Admin                     | SuperAdmin,Admin                     | ✓         | ✓                               |
| `/candidates`       | SuperAdmin,Admin,Instructor          | SuperAdmin,Admin,Instructor          | ✓         | ✓                               |
| `/grading`          | SuperAdmin,Admin,Instructor,Examiner | SuperAdmin,Admin,Instructor,Examiner | ✓ F↔B     | ✗ Business: Instructor excluded |
| `/results`          | SuperAdmin,Admin,Instructor          | SuperAdmin,Admin,Instructor          | ✓ F↔B     | ✗ Business: Instructor excluded |
| `/proctor-center`   | SuperAdmin,Admin,Proctor             | SuperAdmin,Admin,Proctor             | ✓         | ✓                               |
| `/proctor`          | SuperAdmin,Admin,Proctor,Instructor  | SuperAdmin,Admin,Proctor,Instructor  | ✓         | ✓                               |
| `/my-exams`         | Candidate                            | Candidate                            | ✓         | ✓                               |
| `/my-results`       | Candidate                            | Candidate                            | ✓         | ✓                               |
| `/verify-identity`  | Candidate                            | Candidate                            | ✓         | ✓                               |

> **Note on `/proctor-center` + incidents:** The `/proctor-center` guard allows Proctor. The incidents pages live at `/proctor-center/incidents`, so Proctor passes the frontend guard. But the backend IncidentController denies Proctor. This creates a broken UX for Proctor users navigating to incidents.

### 3.5 Candidate Layout (app/(candidate)/layout.tsx)

```typescript
if (!isLoading && user && user.role !== UserRole.Candidate) {
  router.replace("/unauthorized")
}
// synchronous gate:
if (user.role !== UserRole.Candidate) { return <LoadingSpinner /> }
```

**Status: CLEAN.** Non-candidate users are blocked at both async (redirect) and synchronous (no render) levels.

### 3.6 Stale Role References — Verified in Code

| File                                         | Line | Type               | Content                                                                                                |
| -------------------------------------------- | ---- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| `app/(dashboard)/users/page.tsx`             | 177  | Active switch case | `case "ProctorReviewer":` in `getRoleBadgeVariant()`                                                   |
| `app/(dashboard)/users/page.tsx`             | 178  | Active switch case | `case "Auditor":` in `getRoleBadgeVariant()`                                                           |
| `app/(dashboard)/users/permissions/page.tsx` | 68   | Comment            | `// Hide Candidate (separate page) and SuperDev from permissions list`                                 |
| `app/(dashboard)/users/permissions/page.tsx` | 254  | Comment            | `// Filter out SuperDev and Candidate from assignable roles`                                           |
| `lib/api/admin.ts`                           | 76   | Comment            | `/// Dedicated staff users endpoint — Candidate and SuperDev always excluded server-side via SQL JOIN` |
| `lib/tutorials/tutorial-data.ts`             | 4127 | Tutorial text      | Lists `ProctorReviewer` and `Auditor` as active system roles                                           |
| `lib/tutorials/tutorial-data.ts`             | 4177 | Tutorial text      | Role filter dropdown listed includes `ProctorReviewer` and `Auditor`                                   |
| `lib/tutorials/tutorial-data.ts`             | 4224 | Tutorial text      | "Select a role: … ProctorReviewer, Auditor, or SuperAdmin"                                             |
| `lib/tutorials/tutorial-data.ts`             | 4316 | Tutorial text (EN) | Lists `ProctorReviewer` and `Auditor` in role descriptions                                             |
| `lib/tutorials/tutorial-data.ts`             | 4318 | Tutorial text (AR) | Lists ProctorReviewer and Auditor in Arabic                                                            |
| `lib/tutorials/tutorial-data.ts`             | 4341 | Tutorial text      | Describes ProctorReviewer and Auditor capabilities                                                     |

> The stale switch cases in `users/page.tsx` (lines 177–178) are **active code**, not just comments. They return `"outline"` variant for the old roles. Since those roles no longer exist in the system, the code is dead but not harmful — however it should be removed to keep the codebase clean.

---

## 4. ResourceAuthorizationService — Data Scope Layer

This service is the data-scoping layer below controller role gates.

**Key behaviors verified:**

| Scope Type              | Logic                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| SuperAdmin              | Full access to all records across all departments                                    |
| Candidate (only)        | Scoped to own exam assignments, attempts, results, proctor sessions, and user record |
| Non-SuperAdmin staff    | Scoped to their department's data                                                    |
| Proctor (no department) | Scoped to exams they are assigned to as proctor via `ExamProctors`                   |
| Cross-scope             | `CanAccessExamAsync`, `CanAccessAttemptAsync`, `CanAccessResultAsync`, etc.          |

**Key implementation detail:**

```csharp
private static bool IsCandidateOnly(IList<string> roles)
{
    return roles.Contains(AppRoles.Candidate) &&
           !roles.Contains(AppRoles.Admin) &&
           !roles.Contains(AppRoles.Instructor) &&
           !roles.Contains(AppRoles.Examiner) &&
           !roles.Contains(AppRoles.Proctor) &&
           !roles.Contains(AppRoles.SuperAdmin);
}
```

This is correct — candidate-only scope is enforced only when the user has NO staff role alongside Candidate.

**Status: STRONG.** This is the most robust part of the RBAC system and should remain the data-access authority. New endpoints must always pass through both controller role gates AND resource scoping predicates.

**Performance note:** `IsUserSuperAdminAsync()` calls `_userManager.FindByIdAsync()` then `IsInRoleAsync()` — two DB round-trips per request. This is called on nearly every scope method. See Section 7 for optimization.

---

## 5. Security Findings

### 5.1 CRITICAL — SeedController is Fully Anonymous in Production

**File:** `Backend-API/Controllers/SeedController.cs`

All three seed endpoints are decorated `[AllowAnonymous]`:

- `POST /api/seed` — seeds roles and SuperAdmin user
- `POST /api/seed/demo-data` — seeds demo departments, users, question data
- `POST /api/seed/all` — runs both

**Current key-check status:**

- `SeedData()`: checks `X-Seed-Key` header **only if** `AppSettings:SeedKey` is configured in `appsettings.json`. If not configured, the key check is **bypassed entirely**.
- `SeedDemoData()` and `SeedAll()`: the key check is **commented out**. Anyone can call these with no header or key.

**Impact in production on-premise:**

- An attacker who discovers the API can call `POST /api/seed/demo-data` and inject 11 demo users with known passwords (`Demo@123456`) including 3 Admins and 3 Instructors across 3 departments — without any authentication.
- `POST /api/seed/all` will also re-seed the SuperAdmin account.

**Risk: CRITICAL.** These endpoints must either be removed, restricted to `[Authorize(Roles = AppRoles.SuperAdmin)]`, or blocked entirely at the web server level (nginx/IIS rules) before go-live.

---

### 5.2 HIGH — MediaController Anonymous File Download and View

**File:** `Backend-API/Controllers/MediaController.cs`

```csharp
[HttpGet("{id:guid}/download")]
[AllowAnonymous]   // intentional per comment
public async Task<IActionResult> Download(Guid id) { ... }

[HttpGet("{id:guid}/view")]
[AllowAnonymous]
public async Task<IActionResult> View(Guid id) { ... }
```

Any person with a valid file GUID can download or inline-view any uploaded file without being authenticated. This includes:

- Exam question images
- PDF question documents
- Identity verification photos (candidate face images)
- Any other uploaded content

The comment says "Allow anonymous download if you want public file access" — this is a development convenience comment left in production code.

**Risk: HIGH.** Media access should require at minimum `[Authorize]`, with service-level checks verifying the requester has access to the exam or session the file belongs to.

---

### 5.3 HIGH — MediaController Delete Has No Ownership Check

**File:** `Backend-API/Controllers/MediaController.cs`

```csharp
[HttpDelete("{id:guid}")]
[Authorize]   // any authenticated user
public async Task<IActionResult> Delete(Guid id) { ... }
```

Any authenticated user (including Candidate, Proctor, Examiner) can send `DELETE /api/media/{guid}` for any file GUID. There is no ownership or role verification before deletion.

**Risk: HIGH.** Delete should require the requesting user to own the file or be Admin/SuperAdmin.

---

### 5.4 MEDIUM — Instructor Has Backend Access to Results and Grading

**Files:** `ExamResultController.cs`, `GradingController.cs`

The business rule says Instructor is limited to Question Bank, Exam Management, and Assign to Exam only. Results and Grading are for Admin (Results) and Examiner (Grading only).

Current backend:

- `ExamResultController`: Most result endpoints allow `SuperAdmin,Admin,Instructor`
- `GradingController`: All grading endpoints allow `SuperAdmin,Admin,Instructor,Examiner`

The frontend route guard and sidebar match this backend behavior (Frontend + Backend agree), but both deviate from the business rule.

**This means Instructor users can directly call result and grading API endpoints even though the UI hides them.**

**Risk: MEDIUM.** Decision needed: either accept Instructor result/grading access as a business decision, or tighten backend to `SuperAdmin,Admin` for results and `SuperAdmin,Admin,Examiner` for grading.

---

### 5.5 MEDIUM — IncidentController Excludes Proctor

**File:** `Backend-API/Controllers/Incident/IncidentController.cs`

All incident endpoints: `[Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin}")]` — Proctor is NOT included.

The frontend places incidents under `/proctor-center/incidents`. The route guard for `/proctor-center` allows Proctor. Proctor can navigate to the incidents page in the UI but receives HTTP 403 from every API call.

**Risk: MEDIUM.** Either:

- Add `AppRoles.Proctor` to IncidentController endpoints, OR
- Block Proctor from `/proctor-center/incidents` via a specific route guard entry placed before the `/proctor-center` catch-all.

---

### 5.6 LOW-MEDIUM — Certificate Endpoints Open to All Authenticated Users

**File:** `Backend-API/Controllers/ExamResult/CertificateController.cs`

Three endpoints use `[Authorize]` (any authenticated role):

- `GET /api/certificate/my-certificates`
- `GET /api/certificate/by-result/{resultId}`
- `GET /api/certificate/{id}/download`

These pass `candidateId = _currentUserService.UserId` to the service, which enforces ownership. However, staff users (Admin, Instructor, Proctor, Examiner) calling these endpoints will simply receive empty/not-found results rather than a clear authorization denial. This is not a data leak but adds noise and should be clarified with explicit role gates.

---

### 5.7 LOW — Instructor Can Create Certificates

**File:** `Backend-API/Controllers/ExamResult/CertificateController.cs`

```csharp
[HttpPost("create/{resultId}")]
[Authorize(Roles = "SuperAdmin,Admin,Instructor")]
```

Business says Instructor does not manage Results. Certificate creation is a Results operation. This matches the Instructor result access issue in Finding 5.4.

---

### 5.8 LOW — PublicExamController is Fully Anonymous

**File:** `Backend-API/Controllers/Assessment/PublicExamController.cs`

```csharp
[AllowAnonymous]
public class PublicExamController : ControllerBase
```

All endpoints are unauthenticated. This must be intentional for public exam enrollment or walk-in flows, but each endpoint should be audited individually to confirm no sensitive exam content is exposed without authentication.

---

## 6. Full Match Matrix — Backend vs Frontend vs Business

| Area                                  | Backend Actual                   | Frontend Guard                        | Frontend Sidebar                         | Business Req              | F↔B   | F↔Business                                                  |
| ------------------------------------- | -------------------------------- | ------------------------------------- | ---------------------------------------- | ------------------------- | ----- | ----------------------------------------------------------- |
| Role enum                             | 6 roles                          | 6 roles                               | 6 roles                                  | 6 roles                   | ✓     | ✓                                                           |
| Administration                        | SuperAdmin                       | SuperAdmin                            | SuperAdmin                               | SuperAdmin                | ✓     | ✓                                                           |
| System Logs/Audit                     | SuperAdmin                       | SuperAdmin                            | SuperAdmin                               | SuperAdmin                | ✓     | ✓                                                           |
| Notifications                         | SuperAdmin                       | SuperAdmin                            | SuperAdmin                               | SuperAdmin                | ✓     | ✓                                                           |
| Question Bank                         | SA,Admin,Instructor              | SA,Admin,Instructor                   | SA,Admin,Instructor                      | Admin,Instructor          | ✓     | ✓ (SA+OK)                                                   |
| Exam Management                       | SA,Admin,Instructor              | SA,Admin,Instructor                   | SA,Admin,Instructor                      | Admin,Instructor          | ✓     | ✓                                                           |
| Candidates (Batch+Data)               | SA,Admin                         | SA,Admin                              | SA,Admin (sub-item)                      | Admin                     | ✓     | ✓                                                           |
| Assign to Exam                        | SA,Admin,Instructor              | SA,Admin,Instructor (via /candidates) | SA,Admin,Instructor (inherits)           | Instructor+Admin          | ✓     | ✓                                                           |
| Candidate Exam Details                | SA,Admin,Instructor              | SA,Admin,Instructor                   | SA,Admin,Instructor                      | Admin                     | ✓ F↔B | ✗ Business: Instructor should not have CandidateExamDetails |
| **Results**                           | **SA,Admin,Instructor**          | **SA,Admin,Instructor**               | **SA,Admin,Instructor,Examiner (group)** | **Admin only**            | ✓ F↔B | ✗ **Instructor overreach**                                  |
| **Grading**                           | **SA,Admin,Instructor,Examiner** | **SA,Admin,Instructor,Examiner**      | **SA,Admin,Instructor,Examiner**         | **Admin,Examiner only**   | ✓ F↔B | ✗ **Instructor overreach**                                  |
| Proctor Center                        | SA,Admin,Proctor                 | SA,Admin,Proctor                      | SA,Admin,Proctor                         | Admin,Proctor             | ✓     | ✓                                                           |
| Incidents (Proctor Center)            | SA,Admin ONLY                    | SA,Admin,Proctor (via prefix)         | Not in sidebar                           | Admin+Proctor             | ✗     | ✗                                                           |
| Proctor assign (Exam Mgmt)            | SA,Admin,Instructor              | SA,Admin,Proctor,Instructor           | Admin,Instructor sub-item                | Admin,Instructor          | ✓     | ✓                                                           |
| Candidate Portal                      | SA,Candidate                     | Candidate                             | Candidate                                | Candidate                 | ✓     | ✓                                                           |
| SeedController                        | [AllowAnonymous]                 | N/A                                   | N/A                                      | Should be removed/secured | —     | ✗ Critical                                                  |
| Media download/view                   | [AllowAnonymous]                 | N/A                                   | N/A                                      | Should be [Authorize]     | —     | ✗ High risk                                                 |
| Stale roles (ProctorReviewer/Auditor) | Not in constants                 | Not in enum                           | Not in sidebar                           | Remove                    | ✓     | ⚠️ Stale in UI code/tutorials                               |

---

## 7. Security Recommendations (Prioritized)

### P0 — Immediate Before Any Production Deployment

**P0.1: Secure or remove SeedController**

- `SeedData()` key check is optional and bypassed if `AppSettings:SeedKey` is not set.
- `SeedDemoData()` and `SeedAll()` have the key check commented out entirely.
- **Recommended:** Require `[Authorize(Roles = AppRoles.SuperAdmin)]` on all seed endpoints. Only run seeding once at initial deployment, then disable the controller or block the routes at the web server.

**P0.2: Secure MediaController download and view**

- `GET /api/media/{id}/download` and `GET /api/media/{id}/view` are `[AllowAnonymous]`.
- **Recommended:** Change to `[Authorize]` and add a service-layer check that the requesting user has access to the exam or resource the file belongs to.

**P0.3: Add ownership check to MediaController delete**

- `DELETE /api/media/{id}` allows any authenticated user to delete any file.
- **Recommended:** Restrict to uploader ownership or `Admin,SuperAdmin` role.

---

### P1 — High Priority, Role Alignment Decisions Required

**P1.1: Decide Instructor access to Results and Grading**

Business says Instructor does NOT access Results or Grading. Both backend and frontend currently allow it.

If the decision is to enforce business rules:

- `ExamResultController`: Change all `SuperAdmin,Admin,Instructor` to `SuperAdmin,Admin`
- `GradingController`: Change all `SuperAdmin,Admin,Instructor,Examiner` to `SuperAdmin,Admin,Examiner`
- `CertificateController` create: Change `SuperAdmin,Admin,Instructor` to `SuperAdmin,Admin`
- Frontend `ROUTE_ROLE_MAP`: Remove Instructor from `/grading` and `/results`
- Frontend sidebar `resultNavGroup`: Remove Instructor from group roles and grading sub-item roles

**P1.2: Fix IncidentController to include Proctor**

Proctor users access `/proctor-center/incidents` in the UI (route guard passes) but get 403 from the backend.

Options:

- Add `AppRoles.Proctor` to all IncidentController endpoint role strings, OR
- Add a specific route guard entry `{ prefix: "/proctor-center/incidents", roles: [UserRole.SuperAdmin, UserRole.Admin] }` **before** the `/proctor-center` entry in `ROUTE_ROLE_MAP` to prevent Proctor from reaching incidents pages.

---

### P2 — Medium Priority

**P2.1: Review CandidateExamDetails access for Instructor**

- Backend `CandidateExamDetailsController` allows `SuperAdmin,Admin,Instructor`.
- Business says Instructor only gets Assign to Exam, not full Candidate Exam Details management.
- Evaluate whether this is acceptable or should be restricted to `SuperAdmin,Admin`.

**P2.2: Review AttemptController management endpoints for Instructor**

- L205–L238 allow `SuperAdmin,Admin,Instructor` for attempt management operations.
- Confirm Instructor legitimately needs to manage/override attempts.

**P2.3: Certificate read endpoints role clarity**

- `GET /api/certificate/my-certificates`, `by-result`, `download` use `[Authorize]` (any role).
- Consider restricting to `[Authorize(Roles = "SuperAdmin,Candidate")]` since these are candidate self-service endpoints.

**P2.4: PublicExamController endpoint-by-endpoint audit**

- Confirm each anonymous endpoint only exposes exam metadata (title, schedule) and not full question content.

---

### P3 — Low Priority, Cleanup

**P3.1: Remove stale ProctorReviewer/Auditor code**

- `users/page.tsx` L177–178: Remove dead switch cases for ProctorReviewer and Auditor from `getRoleBadgeVariant()`.
- `tutorials/tutorial-data.ts` L4127, L4177, L4224, L4316, L4318, L4341: Update tutorial text to remove ProctorReviewer and Auditor references and list only the 6 active roles.

**P3.2: Update comments referencing SuperDev**

- `users/permissions/page.tsx` L68 and L254: Replace "SuperDev" with "SuperAdmin" in comment text.
- `lib/api/admin.ts` L76: Replace "SuperDev" with "SuperAdmin" in JSDoc comment.
- `SeedController.cs` method summary: Remove reference to "SuperDev" in `SeedAll` XML doc.

**P3.3: Consider frontend multi-role handling**

- Currently `user.role = roles[0]` and `hasRole()` checks one role.
- If the business guarantees single-role-per-user, document this invariant in the seeder/user creation logic to prevent accidental multi-role assignments.
- If multi-role is ever needed, extend `User` type to store `roles: UserRole[]` and update `hasRole()` to check the array.

---

## 8. Performance Recommendations

**P1: Cache SuperAdmin check per request**

- `IsUserSuperAdminAsync()` in `ResourceAuthorizationService` calls `_userManager.FindByIdAsync()` + `IsInRoleAsync()` — two SQL queries per call.
- It is called multiple times per request within the same scope methods.
- **Recommended:** Add a lazy-cached `bool? _isSuperAdmin` field initialized once per request (using `ICurrentUserService` request scope) or memoize the result within the service instance.

**P2: Prefer IQueryable predicates in resource scoping**

- The current `ScopeAttemptsAsync`, `ScopeResultsAsync`, `ScopeProctorSessionsAsync`, and `ScopeUsersAsync` are written as composable `IQueryable` predicates, which is correct and EF-translatable.
- Avoid any future methods that materialize lists of IDs into memory before filtering (e.g., `.ToList()` then `.Contains()`). Keep predicates as SQL-translatable expressions.

**P3: Frontend — no per-page permission calls**

- Current frontend uses `user.role` from the login response for all RBAC decisions — no additional API calls.
- This is the correct pattern. Do not introduce any permission-discovery endpoint calls per navigation.

**P4: Server-side pagination is in place**

- Department scoping and user listing use server-side `IQueryable` filtering. Continue this pattern for all new list endpoints.

---

## 9. Priority Action List

| #   | Finding                                                       | Risk       | Action Required                                                 |
| --- | ------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| 1   | SeedController `[AllowAnonymous]` — all 3 ops                 | CRITICAL   | Restrict to SuperAdmin or remove before production              |
| 2   | MediaController download/view `[AllowAnonymous]`              | HIGH       | Change to `[Authorize]` + resource ownership check              |
| 3   | MediaController delete — no ownership check                   | HIGH       | Add role/ownership gate                                         |
| 4   | Instructor access to Results (backend + frontend)             | MEDIUM     | Decide and align — remove Instructor or document as intentional |
| 5   | Instructor access to Grading (backend + frontend)             | MEDIUM     | Decide and align — remove Instructor or document as intentional |
| 6   | IncidentController Proctor exclusion                          | MEDIUM     | Add Proctor to IncidentController or block from frontend route  |
| 7   | Instructor access to CertificateController create             | LOW-MEDIUM | Align with Results decision                                     |
| 8   | PublicExamController full anonymous audit                     | LOW-MEDIUM | Audit per endpoint                                              |
| 9   | Certificate open reads (`[Authorize]` any role)               | LOW        | Consider restricting to Candidate+Admin                         |
| 10  | Stale ProctorReviewer/Auditor in users/page.tsx (active code) | LOW        | Remove dead switch cases                                        |
| 11  | Stale tutorial text (ProctorReviewer/Auditor/SuperDev)        | LOW        | Update tutorial content                                         |
| 12  | Stale SuperDev comments in source code                        | LOW        | Update comments                                                 |
| 13  | SuperAdmin check DB round-trips                               | PERF       | Cache per request                                               |
| 14  | Frontend single-role storage                                  | INFO       | Document invariant or extend if multi-role needed               |

---

## 10. Summary

**What is clean and production-ready:**

- Backend role constants: 6 roles, no stale roles.
- Seeder: correct roles and protected SuperAdmin.
- Administration, System Logs, Notifications: fully SuperAdmin-only and matched front-to-back.
- Question Bank, Exam Management: matched front-to-back and aligned with business.
- Candidates (Batch + Data): Admin-only and matched front-to-back.
- Assign to Exam, AssignmentsController: Admin+Instructor and matched.
- Proctor Center (main proctor ops): Admin+Proctor and matched.
- Candidate Portal: Candidate-only UI with SuperAdmin backend access (documented pattern).
- ResourceAuthorizationService: solid data-scoping layer.
- Frontend candidate layout: correctly blocks non-Candidate staff.
- Frontend single-role enum: clean, matches backend.

**What requires a decision before go-live:**

1. Instructor access to Results, Grading, and Certificates — backend and frontend agree but deviate from business. Accept or tighten.
2. Proctor access to Incidents — backend excludes Proctor but frontend allows navigation. Fix one side.
3. SeedController security — must be resolved before any external-facing deployment.
4. MediaController anonymous download/view and unowned delete — must be resolved for any file that is not intentionally public.
