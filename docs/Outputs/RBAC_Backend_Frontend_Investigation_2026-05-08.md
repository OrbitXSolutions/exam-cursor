# RBAC Backend and Frontend Investigation - Latest Code - 2026-05-08

## Scope

This report was rerun against the latest local code after the newest RBAC changes.

No implementation changes were made. The only file changed by this task is this report.

Source of truth used: current backend and frontend source code.

Verification run:
- `dotnet build "Backend-API\Smart_Core.sln"`
- First run was blocked by sandbox network restore/signature access.
- Re-run with approval restored packages and completed build.

## Build Status

Backend build succeeds.

Result:
- `Build succeeded.`
- `0 Error(s)`
- `13 Warning(s)`

Important update:
- The old compile blocker is resolved. `ResourceAuthorizationService` now exposes `IsCurrentUserSuperAdminAsync()`, and `UserService` compiles against it.

Build warnings still present:
- `DatabaseSeeder.cs`: nullable mismatch for seeded user department codes.
- `UserService.cs`: possible null dereference at line 110.
- `CandidateExamDetailsService.cs`: always-true `DateTimeOffset` nullable comparison.
- `CandidateAdminService.cs`: unreachable code.
- `EmailService.cs`: obsolete `ServicePointManager`.
- `IdentityVerificationService.cs`: possible null dereferences.

These warnings are not RBAC compile blockers, but the nullability warnings in user/proctor/candidate flows should be cleaned before production release.

## Requested Business RBAC

| Area | Expected Access |
| --- | --- |
| SuperAdmin | Administration and System Logs, all departments, not department-based |
| Admin | Question Bank, Exam Management, Result, Proctor Center, Candidates, department-based |
| Instructor | Question Bank, Exam Management, Assign to Exam, department-based |
| Proctor | Proctor Center |
| Examiner | Result > Grading only |
| Candidate | Candidate Profile, My Exams, Taking Exam, own candidate scope |
| Removed roles | Delete/avoid ProctorReviewer and Auditor |

## Latest Role Constants and Seeding

Source files:
- `Backend-API/Domain/Constants/AppRoles.cs`
- `Backend-API/Infrastructure/Data/DatabaseSeeder.cs`
- `Frontend/Smart-Exam-App-main/lib/types/index.ts`

Current backend roles:
- `SuperAdmin`
- `Admin`
- `Instructor`
- `Candidate`
- `Examiner`
- `Proctor`

Current frontend enum matches these six roles.

Confirmed latest good changes:
- `ProtectedUsers.SuperAdminEmail` is `super-admin@smartexam.local`.
- Seeder creates the protected system SuperAdmin with that email.
- `UserService.CreateUserAsync` restricts SuperAdmin creation to SuperAdmin users and caps SuperAdmin accounts at 2.
- `ResourceAuthorizationService` now uses the SuperAdmin naming publicly.
- `GetStaffUsersAsync` uses server-side scoping and excludes Candidate users from staff listings.

Remaining cleanup:
- Frontend tutorial data still references `ProctorReviewer` and `Auditor`.
- Frontend Users page still has display cases for `ProctorReviewer` and `Auditor`.
- Some comments still say `SuperDev`, for example `lib/api/admin.ts` and permissions page comments.

## Backend Authorization Findings

### Administration

Source files:
- `Backend-API/Controllers/UsersController.cs`
- `Backend-API/Controllers/RolesController.cs`
- `Backend-API/Controllers/DepartmentsController.cs`
- `Backend-API/Controllers/Settings/OrganizationController.cs`
- `Backend-API/Controllers/Settings/LicenseController.cs`
- `Backend-API/Controllers/Settings/NotificationController.cs`
- `Backend-API/Controllers/Settings/SettingsController.cs`

Current backend behavior:
- UsersController is now SuperAdmin-only.
- RolesController is now SuperAdmin-only.
- DepartmentsController has controller `[Authorize]` and all department operations checked as SuperAdmin-only.
- Organization protected endpoints are SuperAdmin-only.
- License upload/update is SuperAdmin-only; license status remains any authenticated user.
- NotificationController is SuperAdmin-only.
- SettingsController is SuperAdmin-only.

Frontend behavior:
- Administration and Notifications are SuperAdmin-only in sidebar and dashboard route guard.

Status:
- Matched for the Administration/Notifications SuperAdmin-only rule.

Risk:
- Low. Backend is now the source of truth for this area.

### System Logs and Audit

Source files:
- `Backend-API/Controllers/Logs/SystemLogsController.cs`
- `Backend-API/Controllers/Audit/AuditController.cs`

Current backend behavior:
- SystemLogsController is SuperAdmin-only.
- AuditController is SuperAdmin-only.

Frontend behavior:
- System Logs group is SuperAdmin-only in sidebar and dashboard route guard.

Status:
- Matched.

Risk:
- Low.

### Question Bank

Source files:
- `Backend-API/Controllers/QuestionBank/QuestionBankController.cs`
- `Backend-API/Controllers/Lookups/LookupsController.cs`
- `Backend-API/Infrastructure/Services/QuestionBank/QuestionBankService.cs`
- `Backend-API/Infrastructure/Services/Lookups/LookupsService.cs`

Current backend behavior:
- QuestionBankController allows `SuperAdmin,Admin,Instructor`.
- LookupsController allows `SuperAdmin,Admin,Instructor`.
- Services apply department isolation for non-SuperAdmin users.

Frontend behavior:
- Sidebar and dashboard route guard allow `SuperAdmin,Admin,Instructor`.

Status:
- Matched in code.

Decision note:
- This gives SuperAdmin operational access beyond Administration/System Logs. If SuperAdmin should only access Administration/System Logs, this needs tightening. If SuperAdmin is intended as all-department platform owner, current behavior is consistent.

Risk:
- Low if SuperAdmin all-access is intended.

### Exam Management

Source files:
- `Backend-API/Controllers/Assessment/AssessmentController.cs`
- `Backend-API/Controllers/Assessment/PublicExamController.cs`
- `Backend-API/Controllers/ExamOperations/ExamOperationsController.cs`
- `Backend-API/Controllers/AttemptControl/AttemptControlController.cs`

Current backend behavior:
- AssessmentController now explicitly allows `SuperAdmin,Admin,Instructor`.
- ExamOperationsController allows `SuperAdmin,Admin,Instructor`.
- AttemptControlController allows `SuperAdmin,Admin,Instructor`.
- PublicExamController remains public/unauthenticated as its name implies; this should be intentionally reviewed separately from staff RBAC.

Frontend behavior:
- Exam Management group allows `SuperAdmin,Admin,Instructor`.

Status:
- Main staff Exam Management role gate is now matched.

Risk:
- Low to Medium. PublicExamController should be reviewed by endpoint behavior, not by name, before production.

### Candidates

Source files:
- `Backend-API/Controllers/Candidate/CandidatesController.cs`
- `Backend-API/Controllers/Batch/BatchesController.cs`
- `Backend-API/Controllers/ExamAssignment/AssignmentsController.cs`
- `Backend-API/Controllers/CandidateExamDetails/CandidateExamDetailsController.cs`
- `Frontend/Smart-Exam-App-main/components/layout/sidebar.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/layout.tsx`

Current backend behavior:
- CandidatesController allows `SuperAdmin,Admin`.
- BatchesController allows `SuperAdmin,Admin`.
- AssignmentsController allows `SuperAdmin,Admin,Instructor`.
- CandidateExamDetailsController allows `SuperAdmin,Admin,Instructor`.

Frontend behavior:
- Candidates group allows `SuperAdmin,Admin,Instructor`.
- Batch, Candidates Data, Assign to Exam, and Candidate Exam Details are all visible to Instructor.
- Dashboard route guard allows `/candidates` for `SuperAdmin,Admin,Instructor`.

Business mismatch:
- Business says Candidates is Admin.
- Business says Instructor gets Assign to Exam.
- Frontend shows Batch and Candidates Data to Instructor, but backend blocks those APIs.

Risk:
- Medium. Backend is stricter and safer than frontend, but Instructor UX can still route into pages/actions that fail with authorization errors.

### Results and Grading

Source files:
- `Backend-API/Controllers/ExamResult/ExamResultController.cs`
- `Backend-API/Controllers/Grading/GradingController.cs`
- `Backend-API/Controllers/ExamResult/CertificateController.cs`
- `Frontend/Smart-Exam-App-main/components/layout/sidebar.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/layout.tsx`

Current backend behavior:
- ExamResultController allows many result/report endpoints for `SuperAdmin,Admin,Instructor`.
- Some publish/admin actions are `SuperAdmin,Admin`.
- Candidate result endpoints allow `SuperAdmin,Candidate`.
- GradingController allows grading endpoints for `SuperAdmin,Admin,Instructor,Examiner`.
- Certificate generate allows `SuperAdmin,Admin,Instructor`; revoke/status update allows `SuperAdmin,Admin`; several certificate reads are any authenticated user.

Frontend behavior:
- Result group allows `SuperAdmin,Admin,Examiner`.
- Grading route allows `SuperAdmin,Admin,Examiner`.
- Candidate Result, Terminated Attempts, and Proctor Report are `SuperAdmin,Admin`.
- Dashboard route guard allows `/results` and `/grading` for `SuperAdmin,Admin,Examiner`.

Business mismatch:
- Examiner should be grading only; frontend mostly follows this.
- Backend still allows Instructor to grading and many results endpoints.
- Frontend now blocks Instructor from `/results` and `/grading`, but direct backend API access remains possible.

Risk:
- Medium to High. Backend must be the source of truth, so Instructor result/grading access needs a decision.

### Proctor Center

Source files:
- `Backend-API/Controllers/Proctor/ProctorController.cs`
- `Backend-API/Controllers/Proctor/VideoRecordingController.cs`
- `Backend-API/Controllers/Proctor/IdentityVerificationController.cs`
- `Backend-API/Controllers/Proctor/ExamProctorController.cs`
- `Backend-API/Infrastructure/Services/Proctor/ProctorService.cs`

Current backend behavior:
- Proctor review/monitor endpoints mostly allow `SuperAdmin,Admin,Proctor`.
- IdentityVerification review paths allow `SuperAdmin,Admin,Proctor`.
- IdentityVerification submit/status paths allow `SuperAdmin,Admin,Candidate`.
- ExamProctor assignment controller allows `SuperAdmin,Admin,Instructor`.
- ProctorService uses `ResourceAuthorizationService` to scope sessions/evidence by all/dept/assignment/candidate ownership.

Frontend behavior:
- Proctor Center group allows `SuperAdmin,Admin,Proctor`.
- `/proctor/assign` is visible to Admin and Instructor from Exam Management.
- Dashboard route guard allows `/proctor-center` for `SuperAdmin,Admin,Proctor` and `/proctor` for `SuperAdmin,Admin,Proctor,Instructor`.

Status:
- Mostly matched for Admin, Proctor, and Instructor assignment flow.

Risk:
- Low to Medium. Candidate identity submit/status also allowing Admin/SuperAdmin should be intentional support behavior, not accidental broad access.

### Candidate Portal

Source files:
- `Backend-API/Controllers/Candidate/CandidateController.cs`
- `Backend-API/Controllers/Attempt/AttemptController.cs`
- `Backend-API/Controllers/ExamResult/ExamResultController.cs`
- `Frontend/Smart-Exam-App-main/app/(candidate)/layout.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/layout.tsx`
- `Frontend/Smart-Exam-App-main/components/layout/sidebar.tsx`

Current backend behavior:
- CandidateController allows `SuperAdmin,Candidate`.
- Candidate attempt endpoints allow `SuperAdmin,Candidate`.
- Candidate result endpoints allow `SuperAdmin,Candidate`.
- ResourceAuthorizationService still scopes candidate-owned data and gives SuperAdmin all access.

Frontend behavior:
- Candidate sidebar links are Candidate-only.
- Candidate route layout now blocks non-Candidate staff and redirects them to dashboard.
- Dashboard route guard allows `/my-exams`, `/my-results`, and `/verify-identity` only for Candidate.

Status:
- Frontend route hygiene is improved and now matches Candidate-only UX.
- Backend gives SuperAdmin candidate-portal API access. This is acceptable only if SuperAdmin support/all-access is intended.

Risk:
- Low if SuperAdmin all-access is intentional; Medium if Candidate APIs must be candidate-only.

## Frontend Authorization Findings

Source files:
- `Frontend/Smart-Exam-App-main/lib/types/index.ts`
- `Frontend/Smart-Exam-App-main/lib/auth/context.tsx`
- `Frontend/Smart-Exam-App-main/components/layout/sidebar.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/layout.tsx`
- `Frontend/Smart-Exam-App-main/app/(candidate)/layout.tsx`
- `Frontend/Smart-Exam-App-main/app/(dashboard)/users/*`

Findings:
- Frontend role enum matches backend six roles.
- Sidebar now includes SuperAdmin in most operational groups, matching current backend behavior.
- Dashboard layout now has a centralized `ROUTE_ROLE_MAP`.
- Candidate layout now redirects non-Candidate users away from the candidate route group.
- Login still stores only the first backend role as `user.role`.
- `hasRole` checks only that single stored role.
- If backend ever assigns multiple roles to a user, frontend authorization can diverge from JWT/backend authorization.
- Users create page exposes SuperAdmin creation only when current user has SuperAdmin role.
- Permissions page filters out SuperAdmin and Candidate from assignable roles.
- Users page and tutorial data still contain stale `ProctorReviewer`/`Auditor` references.

Risk:
- Medium. Frontend route guards are improved, but single-role frontend state remains a source of mismatch if multi-role users exist.

## Data Scope Source of Truth

Source file:
- `Backend-API/Infrastructure/Services/Authorization/ResourceAuthorizationService.cs`

Current behavior:
- SuperAdmin gets all-scope access.
- Candidate-only users are scoped to their own assignments, attempts, results, proctor sessions, and user record.
- Non-SuperAdmin staff are scoped by department.
- Proctor assignment access is included through `ExamProctors`.
- Scope-aware helpers exist for exams, attempts, results, proctor sessions, candidates, evidence, and users.
- Cache scope keys include all/dept/candidate/user distinctions.

Status:
- This is the strongest part of the current RBAC implementation and should remain the data-access source of truth below controller role gates.

Risk:
- Medium if service methods are bypassed by new endpoints. New controllers should use both explicit role gates and this resource scoping.

## Match Matrix

| Area | Frontend Latest | Backend Latest | Status |
| --- | --- | --- | --- |
| Active role list | Six roles | Six roles | Matched |
| Backend build | N/A | Builds successfully | Good |
| Removed roles | Active enum clean, stale tutorial/UI cases remain | Active constants clean | Needs cleanup |
| SuperAdmin protected account | Create UI SuperAdmin-gated | Protected email, max 2 logic, build OK | Improved |
| Administration | SuperAdmin only | SuperAdmin only | Matched |
| Notifications | SuperAdmin only | SuperAdmin only | Matched |
| System Logs/Audit | SuperAdmin only | SuperAdmin only | Matched |
| Question Bank | SuperAdmin + Admin + Instructor | SuperAdmin + Admin + Instructor | Matched |
| Exam Management | SuperAdmin + Admin + Instructor | SuperAdmin + Admin + Instructor | Matched |
| Candidates Data/Batch | SuperAdmin + Admin + Instructor | SuperAdmin + Admin | Mismatch |
| Assign to Exam | Admin + Instructor in sidebar item, route allows SuperAdmin too | SuperAdmin + Admin + Instructor | Mostly matched |
| Candidate Exam Details | SuperAdmin + Admin + Instructor | SuperAdmin + Admin + Instructor | Matched |
| Result reports | SuperAdmin + Admin | SuperAdmin + Admin + Instructor on many APIs | Mismatch |
| Grading | SuperAdmin + Admin + Examiner | SuperAdmin + Admin + Instructor + Examiner | Mismatch |
| Proctor Center | SuperAdmin + Admin + Proctor | SuperAdmin + Admin + Proctor | Matched |
| Proctor assignment | Admin + Instructor UI, route also allows SuperAdmin | SuperAdmin + Admin + Instructor | Mostly matched |
| Candidate Portal UX | Candidate only | SuperAdmin + Candidate APIs | Needs decision |
| Frontend route guards | Central dashboard guard and candidate guard exist | Backend remains source of truth | Improved |

## Security Recommendations

1. Decide the final SuperAdmin model: all-platform operational access, or only Administration/System Logs. Current code implements all-platform backend access plus SuperAdmin sidebar access for many operational areas.
2. Align Results/Grading. If business remains "Admin results, Examiner grading only", remove Instructor from backend `ExamResultController`, `GradingController`, and certificate generation where not needed.
3. Align Candidates. Either hide Batch/Candidates Data from Instructor in frontend or intentionally add backend Instructor access to those APIs.
4. Decide whether Candidate APIs should allow SuperAdmin. If this is support/admin impersonation-style access, keep it documented and audited; otherwise restrict to Candidate.
5. Keep frontend route guards, but treat them as UX only. Backend controller roles plus `ResourceAuthorizationService` must remain the security source of truth.
6. Store and evaluate all backend roles in frontend if multi-role users are possible. Current frontend only uses `roles[0]`.
7. Remove stale `ProctorReviewer`, `Auditor`, and `SuperDev` references from active UI/tutorial/comments after business confirmation.
8. Review public/authenticated certificate endpoints to ensure a logged-in user cannot fetch another candidate certificate without service-level ownership checks.
9. Add regression tests around role gates for Administration, Logs, Candidates, Results, Grading, Proctor Center, and Candidate portal endpoints.
10. Consider session invalidation or token refresh after role changes so JWT role claims do not remain stale.

## Performance Recommendations

1. Keep backend pagination and department scoping server-side.
2. Keep scope-aware cache keys, especially for users, results, exams, grading, and proctor sessions.
3. Avoid per-page permission discovery calls. Use login role data or one lightweight `/me` endpoint if refresh is required.
4. Prefer SQL joins and `IQueryable` scoping over loading role/user IDs into memory. Current staff user scoping is moving in the right direction.
5. Keep `ResourceAuthorizationService` predicates queryable so EF can translate them efficiently.
6. Review nullability warnings before production because runtime null failures in identity/proctor flows can create reliability incidents under load.

## Priority Order

1. Results/Grading backend role alignment.
2. Candidates frontend/backend alignment for Instructor.
3. Final decision on SuperAdmin operational access model.
4. Final decision on SuperAdmin access to Candidate portal APIs.
5. Certificate endpoint ownership/security review.
6. Stale role text cleanup.
7. Frontend multi-role handling if multi-role accounts are supported.
8. Build warning cleanup.
