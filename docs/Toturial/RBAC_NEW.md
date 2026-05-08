# SmartExam RBAC — Final Design (Post-Restructure)

**Date:** 2026-05-08
**System:** SmartExam / Smart_Core  
**Status:** ✅ Fully Implemented (including second-SuperAdmin feature)

---

## 1. Roles — Final List (6 Roles)

| Role           | Constant              | Description                                                                                            |
| -------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| **SuperAdmin** | `AppRoles.SuperAdmin` | Full system owner. No department scoping. Access to all data across all departments.                   |
| **Admin**      | `AppRoles.Admin`      | Department-scoped administrator. Manages users, exams, results, candidates within assigned department. |
| **Instructor** | `AppRoles.Instructor` | Creates exams and question banks, assigns to exam, views candidates list.                              |
| **Examiner**   | `AppRoles.Examiner`   | Grades exams and reviews grading sessions.                                                             |
| **Proctor**    | `AppRoles.Proctor`    | Live proctoring: manages sessions, monitors candidates, verifies identity.                             |
| **Candidate**  | `AppRoles.Candidate`  | Takes exams only. No admin access.                                                                     |

**Removed roles (were never seeded / broken):**

- ~~`ProctorReviewer`~~ — merged into `Proctor`
- ~~`Auditor`~~ — removed; audit logs accessible by `SuperAdmin` + `Admin`
- ~~`SuperDev`~~ — renamed to `SuperAdmin`

---

## 2. SuperAdmin Accounts

### 2.1 Protected SuperAdmin (System-Seeded)

| Field           | Value                                                |
| --------------- | ---------------------------------------------------- |
| Email           | `super-admin@smartexam.local`                        |
| Password        | `Smart@26Super5`                                     |
| Constant        | `ProtectedUsers.SuperAdminEmail`                     |
| Flag            | `IsProtected = true` (returned in user list API)     |
| Protection      | Cannot be modified, deleted, blocked, or deactivated |
| Role Protection | Cannot be removed from `SuperAdmin` role             |

> **First Login:** Use the credentials above on the Login page. Change the password immediately after first access via the profile settings.

### 2.2 Second SuperAdmin (Optional)

| Field           | Value                                                           |
| --------------- | --------------------------------------------------------------- |
| Created by      | Any existing SuperAdmin via Create User form                    |
| Max allowed     | **2 total** (enforced server-side in `CreateUserAsync`)         |
| Flag            | `IsProtected = false` — full edit/delete rights apply           |
| Role assignment | Only via Create User form (not via permissions drag-and-drop)   |
| Visibility      | Shown in users list with normal dropdown (edit/delete/reset PW) |

### 2.3 Business Rules Summary

- Only a SuperAdmin can create another SuperAdmin
- System enforces a maximum of **2 SuperAdmin** accounts at all times
- `super-admin@smartexam.local` is **always** protected regardless of count
- The second SuperAdmin is a regular user with `SuperAdmin` role — no special protection
- `IsProtected` flag is computed server-side: `email == ProtectedUsers.SuperAdminEmail`

---

## 3. Role Permissions Matrix

### 3.1 Backend Controller Access

| Controller                                 | SuperAdmin | Admin | Instructor | Examiner | Proctor | Candidate |
| ------------------------------------------ | :--------: | :---: | :--------: | :------: | :-----: | :-------: |
| UsersController (list/manage)              |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| UsersController (create SuperAdmin)        |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| RolesController                            |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| DepartmentsController                      |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| DepartmentsController (delete)             |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| BatchesController                          |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| CandidatesController                       |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| CandidateExamDetailsController             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| ExamAssignment                             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| ExamOperations                             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| AttemptControl                             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| ExamProctor                                |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| ProctorController (view)                   |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| ProctorController (actions)                |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| VideoRecordingController                   |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| IdentityVerificationController (class)     |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ✅     |
| IdentityVerificationController (proctor)   |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| IdentityVerificationController (candidate) |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ✅     |
| IncidentController (view)                  |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| IncidentController (modify)                |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| AuditController                            |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| SystemLogsController                       |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| OrganizationController                     |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| NotificationController                     |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| LicenseController                          |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |

### 3.2 Frontend Navigation Access

| Nav Group / Item             | SuperAdmin | Admin | Instructor | Examiner | Proctor | Candidate |
| ---------------------------- | :--------: | :---: | :--------: | :------: | :-----: | :-------: |
| Dashboard                    |     ✅     |  ✅   |     ✅     |    ✅    |   ✅    |    ✅     |
| My Exams                     |     ❌     |  ❌   |     ❌     |    ❌    |   ❌    |    ✅     |
| Question Bank                |     ❌     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| Exam Management              |     ❌     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| Result Group                 |     ❌     |  ✅   |     ❌     |    ✅    |   ❌    |    ❌     |
| Result → Candidate Result    |     ❌     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| Result → Terminated Attempts |     ❌     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| Result → Proctor Report      |     ❌     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| Proctor Center               |     ❌     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| Candidates                   |     ❌     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| Administration               |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| Notifications                |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| Logs                         |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| User Guide                   |     ✅     |  ✅   |     ✅     |    ✅    |   ✅    |    ❌     |

---

## 4. Department Scoping

| Role       | Department Scope            |
| ---------- | --------------------------- |
| SuperAdmin | All departments (no filter) |
| Admin      | Own department only         |
| Instructor | Own department only         |
| Examiner   | Own department only         |
| Proctor    | Own department only         |
| Candidate  | Own department only         |

---

## 5. Source of Truth

| Layer    | File                                     | Constant / Symbol                                                         |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Backend  | `Domain/Constants/AppRoles.cs`           | `AppRoles.SuperAdmin`, `AppRoles.Admin`, etc.                             |
| Backend  | `Domain/Constants/AppRoles.cs`           | `ProtectedUsers.SuperAdminEmail = "super-admin@smartexam.local"`          |
| Backend  | `Application/DTOs/Users/UserDtos.cs`     | `UserDto.IsProtected` — computed flag returned in every staff user record |
| Backend  | `Infrastructure/Services/UserService.cs` | `CreateUserAsync` — SuperAdmin guard + max-2 enforcement                  |
| Backend  | `Infrastructure/Services/UserService.cs` | `GetStaffUsersAsync` — sets `IsProtected` per user in mapping loop        |
| Frontend | `lib/types/index.ts`                     | `UserRole` enum + `User.isProtected?: boolean`                            |
| Database | `AspNetRoles` table                      | Seeded by `DatabaseSeeder.cs`                                             |

---

## 6. User Management Rules

### Create User

- **Role dropdown** shows: Admin, Instructor, Examiner, Proctor — **plus SuperAdmin (visible only to logged-in SuperAdmin)**
- When role = `SuperAdmin` selected: department field is hidden and not required
- When role = any other: department field is required and validated
- Backend enforces: only a SuperAdmin JWT can create another SuperAdmin; max 2 total

### Edit User

- **Role dropdown** shows: Admin, Instructor, Examiner, Proctor
- If `isProtected === true` (system-seeded SuperAdmin): role field is replaced with read-only text badge — "SuperAdmin — Role cannot be changed"
- Second SuperAdmin (`isProtected = false`): gets the full editable role dropdown

### Users List

- Candidate role users are not shown in staff list (excluded server-side)
- SuperAdmin users **are** shown in staff list
- Protected SuperAdmin row: shows lock icon → navigates to view page (no edit/delete/reset-pw dropdown)
- Second SuperAdmin row: shows normal dropdown (View, Edit, Reset Password, Block, Delete)

### Permissions Page

- Assignable roles: Admin, Instructor, Examiner, Proctor (SuperAdmin + Candidate permanently hidden)
- SuperAdmin role assignment is only possible via Create User form

---

## 7. DB Migration Note (Deployment)

When deploying to an existing database with the old `SuperDev` role:

```sql
-- Rename SuperDev to SuperAdmin
UPDATE AspNetRoles SET Name = 'SuperAdmin', NormalizedName = 'SUPERADMIN' WHERE Name = 'SuperDev';
UPDATE AspNetUserRoles SET RoleId = (SELECT Id FROM AspNetRoles WHERE Name = 'SuperAdmin')
  WHERE RoleId = (SELECT Id FROM AspNetRoles WHERE Name = 'SuperDev');

-- Remove obsolete roles (if they exist)
DELETE FROM AspNetUserRoles WHERE RoleId IN (SELECT Id FROM AspNetRoles WHERE Name IN ('ProctorReviewer', 'Auditor'));
DELETE FROM AspNetRoles WHERE Name IN ('ProctorReviewer', 'Auditor');
```

---

## 8. Files Changed (Implementation Summary)

### Backend (13 files)

| File                                                                    | Change                                                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Domain/Constants/AppRoles.cs`                                          | `SuperDev`→`SuperAdmin`, `SuperDevEmail`→`SuperAdminEmail`, added `ProtectedUsers` class                                   |
| `Infrastructure/Data/DatabaseSeeder.cs`                                 | All `SuperDev` references → `SuperAdmin`; seeded credentials (`super-admin@smartexam.local` / `Smart@26Super5`)            |
| `Application/DTOs/Users/UserDtos.cs`                                    | Added `IsProtected` property to `UserDto`                                                                                  |
| `Infrastructure/Services/UserService.cs`                                | Protection guards; `CreateUserAsync` SuperAdmin guard + max-2 check; `GetStaffUsersAsync` sets `IsProtected` per user      |
| `Infrastructure/Services/RoleService.cs`                                | Role protection guard                                                                                                      |
| `Infrastructure/Services/Assessment/AssessmentService.cs`               | `IsCurrentUserSuperDevAsync`→`IsCurrentUserSuperAdminAsync`, `isSuperDev`→`isSuperAdmin`                                   |
| `Infrastructure/Services/Authorization/ResourceAuthorizationService.cs` | `IsUserSuperDevAsync`→`IsUserSuperAdminAsync`                                                                              |
| `Infrastructure/Services/ExamResult/ExamResultService.cs`               | Role check updated                                                                                                         |
| `Infrastructure/Services/Grading/GradingService.cs`                     | Role check updated                                                                                                         |
| `Infrastructure/Services/QuestionBank/QuestionBankService.cs`           | Role check updated                                                                                                         |
| `Infrastructure/Services/Lookups/LookupsService.cs`                     | Role check updated                                                                                                         |
| `Infrastructure/Services/Proctor/ProctorService.cs`                     | Role check updated                                                                                                         |
| All 17 Controllers                                                      | `AppRoles.SuperDev`→`AppRoles.SuperAdmin`, removed `ProctorReviewer`/`Auditor`/`Instructor` from proctor/incident patterns |

### Frontend (6 files)

| File                                         | Change                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `lib/types/index.ts`                         | Removed `ProctorReviewer`/`Auditor` from `UserRole` enum; added `isProtected?: boolean` to `User` interface                |
| `components/layout/sidebar.tsx`              | Updated all role arrays — removed ProctorReviewer/Auditor, fixed group visibility                                          |
| `app/(dashboard)/users/page.tsx`             | Lock button condition changed from `role === "SuperAdmin"` → `isProtected === true`                                        |
| `app/(dashboard)/users/permissions/page.tsx` | Hidden list, roleLabel map, assignableRoles filter fixed (SuperAdmin + Candidate excluded)                                 |
| `app/(dashboard)/users/[id]/edit/page.tsx`   | Added `isProtected` state; read-only role badge for protected user; normal dropdown for all others                         |
| `app/(dashboard)/users/create/page.tsx`      | `useAuth` + `UserRole` imports; SuperAdmin option shown only to SuperAdmin; dept field hidden/optional for SuperAdmin role |

---

## 1. Roles — Final List (6 Roles)

| Role           | Constant              | Description                                                                                            |
| -------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| **SuperAdmin** | `AppRoles.SuperAdmin` | Full system owner. No department scoping. Access to all data across all departments.                   |
| **Admin**      | `AppRoles.Admin`      | Department-scoped administrator. Manages users, exams, results, candidates within assigned department. |
| **Instructor** | `AppRoles.Instructor` | Creates exams and question banks, assigns to exam, views candidates list.                              |
| **Examiner**   | `AppRoles.Examiner`   | Grades exams and reviews grading sessions.                                                             |
| **Proctor**    | `AppRoles.Proctor`    | Live proctoring: manages sessions, monitors candidates, verifies identity.                             |
| **Candidate**  | `AppRoles.Candidate`  | Takes exams only. No admin access.                                                                     |

**Removed roles (were never seeded / broken):**

- ~~`ProctorReviewer`~~ — merged into `Proctor`
- ~~`Auditor`~~ — removed; audit logs accessible by `SuperAdmin` + `Admin`
- ~~`SuperDev`~~ — renamed to `SuperAdmin`

---

The Design is Sound — With One Clarification Needed
Your model:

super-admin@smartexam.local → always fully protected (email-constant guard, unchanged)
Second SuperAdmin → normal user who happens to have SuperAdmin role — can be deleted, modified, reassigned like any other user
Max 2 SuperAdmins total enforced by backend
Only a SuperAdmin can create the second SuperAdmin
This is clean and simple. The existing ProtectedUsers.SuperAdminEmail constant continues to work exactly as-is — no architecture change needed there.

## 2. Protected SuperAdmin User

| Field           | Value                                                |
| --------------- | ---------------------------------------------------- |
| Email           | `super-admin@smartexam.local`                        |
| Constant        | `ProtectedUsers.SuperAdminEmail`                     |
| Protection      | Cannot be modified, deleted, blocked, or deactivated |
| Role Protection | Cannot be removed from `SuperAdmin` role             |

---

## 3. Role Permissions Matrix

### 3.1 Backend Controller Access

| Controller                                 | SuperAdmin | Admin | Instructor | Examiner | Proctor | Candidate |
| ------------------------------------------ | :--------: | :---: | :--------: | :------: | :-----: | :-------: |
| UsersController (list/manage)              |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| UsersController (create SuperAdmin)        |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| RolesController                            |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| DepartmentsController                      |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| DepartmentsController (delete)             |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| BatchesController                          |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| CandidatesController                       |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| CandidateExamDetailsController             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| ExamAssignment                             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| ExamOperations                             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| AttemptControl                             |     ✅     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| ExamProctor                                |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| ProctorController (view)                   |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| ProctorController (actions)                |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| VideoRecordingController                   |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| IdentityVerificationController (class)     |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ✅     |
| IdentityVerificationController (proctor)   |     ✅     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| IdentityVerificationController (candidate) |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ✅     |
| IncidentController (view)                  |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| IncidentController (modify)                |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| AuditController                            |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| SystemLogsController                       |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| OrganizationController                     |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| NotificationController                     |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| LicenseController                          |     ✅     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |

### 3.2 Frontend Navigation Access

| Nav Group / Item             | SuperAdmin | Admin | Instructor | Examiner | Proctor | Candidate |
| ---------------------------- | :--------: | :---: | :--------: | :------: | :-----: | :-------: |
| Dashboard                    |     ✅     |  ✅   |     ✅     |    ✅    |   ✅    |    ✅     |
| My Exams                     |     ❌     |  ❌   |     ❌     |    ❌    |   ❌    |    ✅     |
| Question Bank                |     ❌     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| Exam Management              |     ❌     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| Result Group                 |     ❌     |  ✅   |     ❌     |    ✅    |   ❌    |    ❌     |
| Result → Candidate Result    |     ❌     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| Result → Terminated Attempts |     ❌     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| Result → Proctor Report      |     ❌     |  ✅   |     ❌     |    ❌    |   ❌    |    ❌     |
| Proctor Center               |     ❌     |  ✅   |     ❌     |    ❌    |   ✅    |    ❌     |
| Candidates                   |     ❌     |  ✅   |     ✅     |    ❌    |   ❌    |    ❌     |
| Administration               |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| Notifications                |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| Logs                         |     ✅     |  ❌   |     ❌     |    ❌    |   ❌    |    ❌     |
| User Guide                   |     ✅     |  ✅   |     ✅     |    ✅    |   ✅    |    ❌     |

---

## 4. Department Scoping

| Role       | Department Scope            |
| ---------- | --------------------------- |
| SuperAdmin | All departments (no filter) |
| Admin      | Own department only         |
| Instructor | Own department only         |
| Examiner   | Own department only         |
| Proctor    | Own department only         |
| Candidate  | Own department only         |

---

## 5. Source of Truth

| Layer    | File                                       | Constant                                      |
| -------- | ------------------------------------------ | --------------------------------------------- |
| Backend  | `Backend-API/Domain/Constants/AppRoles.cs` | `AppRoles.SuperAdmin`, `AppRoles.Admin`, etc. |
| Backend  | `Backend-API/Domain/Constants/AppRoles.cs` | `ProtectedUsers.SuperAdminEmail`              |
| Frontend | `Frontend/.../lib/types/index.ts`          | `UserRole` enum                               |
| Database | `AspNetRoles` table                        | Seeded by `DatabaseSeeder.cs`                 |

---

## 6. User Management Rules

- **SuperAdmin** cannot be modified, blocked, deactivated, or deleted
- **SuperAdmin** cannot be removed from the `SuperAdmin` role
- **Candidate** role users are managed separately (not shown in staff management)
- **SuperAdmin** is excluded from staff management lists
- **Create User** role dropdown: Admin, Instructor, Examiner, Proctor
- **Edit User** role dropdown: Admin, Instructor, Examiner, Proctor
- **Permissions page** assignable roles: Admin, Instructor, Examiner, Proctor (SuperAdmin + Candidate hidden)

---

## 7. DB Migration Note (Deployment)

When deploying to an existing database with the old `SuperDev` role:

```sql
-- Rename SuperDev to SuperAdmin
UPDATE AspNetRoles SET Name = 'SuperAdmin', NormalizedName = 'SUPERADMIN' WHERE Name = 'SuperDev';
UPDATE AspNetUserRoles SET RoleId = (SELECT Id FROM AspNetRoles WHERE Name = 'SuperAdmin')
  WHERE RoleId = (SELECT Id FROM AspNetRoles WHERE Name = 'SuperDev');

-- Remove obsolete roles (if they exist)
DELETE FROM AspNetUserRoles WHERE RoleId IN (SELECT Id FROM AspNetRoles WHERE Name IN ('ProctorReviewer', 'Auditor'));
DELETE FROM AspNetRoles WHERE Name IN ('ProctorReviewer', 'Auditor');
```

---

## 8. Files Changed (Implementation Summary)

### Backend (12 files)

| File                                                                    | Change                                                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Domain/Constants/AppRoles.cs`                                          | `SuperDev`→`SuperAdmin`, `SuperDevEmail`→`SuperAdminEmail`                                                                 |
| `Infrastructure/Data/DatabaseSeeder.cs`                                 | All `SuperDev` references → `SuperAdmin`                                                                                   |
| `Infrastructure/Services/UserService.cs`                                | All protection guards + `IsCandidateOnly`                                                                                  |
| `Infrastructure/Services/RoleService.cs`                                | Role protection guard                                                                                                      |
| `Infrastructure/Services/Assessment/AssessmentService.cs`               | `IsCurrentUserSuperDevAsync`→`IsCurrentUserSuperAdminAsync`, `isSuperDev`→`isSuperAdmin`                                   |
| `Infrastructure/Services/Authorization/ResourceAuthorizationService.cs` | `IsUserSuperDevAsync`→`IsUserSuperAdminAsync`                                                                              |
| `Infrastructure/Services/ExamResult/ExamResultService.cs`               | Role check                                                                                                                 |
| `Infrastructure/Services/Grading/GradingService.cs`                     | Role check                                                                                                                 |
| `Infrastructure/Services/QuestionBank/QuestionBankService.cs`           | Role check                                                                                                                 |
| `Infrastructure/Services/Lookups/LookupsService.cs`                     | Role check                                                                                                                 |
| `Infrastructure/Services/Proctor/ProctorService.cs`                     | Role check                                                                                                                 |
| All 17 Controllers                                                      | `AppRoles.SuperDev`→`AppRoles.SuperAdmin`, removed `ProctorReviewer`/`Auditor`/`Instructor` from proctor/incident patterns |

### Frontend (5 files)

| File                                         | Change                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `lib/types/index.ts`                         | Removed `ProctorReviewer` and `Auditor` from `UserRole` enum                      |
| `components/layout/sidebar.tsx`              | Updated all role arrays — removed ProctorReviewer/Auditor, fixed group visibility |
| `app/(dashboard)/users/page.tsx`             | Removed ProctorReviewer/Auditor from role filter and badge variant                |
| `app/(dashboard)/users/permissions/page.tsx` | Fixed hidden list, roleLabel map, assignableRoles filter                          |
| `app/(dashboard)/users/[id]/edit/page.tsx`   | Replaced role dropdown with Admin/Instructor/Examiner/Proctor                     |
| `app/(dashboard)/users/create/page.tsx`      | Added Instructor to role dropdown                                                 |

User navigates to /users (Instructor)
↓
Layout render → synchronous check → role blocked → return <FullPageLoader />
Children NEVER mount → ZERO API calls to backend ✅
↓ (useEffect fires)
router.replace("/unauthorized") → page transitions

The useEffect is kept alongside the synchronous check — it handles the actual navigation to /unauthorized. The sync check just ensures children don't render (and don't call the backend) during that brief window.
