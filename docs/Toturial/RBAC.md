# Roles & Permissions — Full Audit

> Generated: May 8, 2026 | Source of truth: actual codebase inspection
> Let's Correct this (critical Change in the system), Be Careful

the Frontend Should Match the Backend and the Backend ( Source of Truth)
Let's think together with the best performance senario

Roles in System as in the side nav action
1- SuperAdmin (Adminstration - System Logs) two exculive to superAdmin and Not Departtment Based in these pages, All Departments.

By Department (Create User from Adminstartions >> Users)
2- Admin Role (Question Bank, Exam Management, Result, Proctor Center, Candidates)
3- Instructor (Question Bank, Exam Management, Assign to Exam )
4- Proctor ( Proctor Center )
5- Examiner (Result >> Grading only )

Overall Department ( (Create Candidate from Candidates >> Candidate Data))
6- Candidates >> Candidate Profile - My Exam - Taking Exma ..etc.

As the system Will be deployed in the clinet Server ( on Promise ) No Need for Super Dev
and Delete Other (ProctorReviewer, Auditor )

## 1. Roles Defined in `AppRoles.cs` (Seeded by DatabaseSeeder)

| #   | Role         | Seeded | Notes                    |
| --- | ------------ | ------ | ------------------------ |
| 2   | `Admin`      | ✅     | Main administrative role |
| 3   | `Instructor` | ✅     | Content/exam creator     |
| 4   | `Candidate`  | ✅     | Exam taker               |
| 5   | `Examiner`   | ✅     | Grading only             |
| 6   | `Proctor`    | ✅     | Live proctoring actions  |

---

## 2. Roles Referenced in Code but NOT in AppRoles.cs / NOT Seeded ⚠️

| Role              | Where Used                                                                                      | Problem                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `ProctorReviewer` | IncidentController, ProctorController, VideoRecordingController, IdentityVerificationController | Raw string only — never seeded. Users cannot be assigned this role; endpoints permanently locked |
| `Auditor`         | AuditController                                                                                 | Raw string only — never seeded                                                                   |
| `SuperAdmin`      | AuditController (`"Admin,SuperAdmin,Auditor"`)                                                  | Does not exist in AppRoles.cs — `SuperDev` is the actual superuser. Likely a bug                 |

---

## 3. Frontend `UserRole` Enum (`lib/types/index.ts`)

```ts
export enum UserRole {
  Candidate = "Candidate",
  Instructor = "Instructor",
  Admin = "Admin",
  SuperAdmin = "SuperAdmin", // ⚠️ Not seeded in backend
  ProctorReviewer = "ProctorReviewer", // ⚠️ Not seeded in backend
  Auditor = "Auditor", // ⚠️ Not seeded in backend
  Examiner = "Examiner",
  Proctor = "Proctor",
}
```

Frontend has **8 roles** — backend only seeds **6**. `SuperAdmin`, `ProctorReviewer`, `Auditor` exist in frontend but are not seeded.

---

## 4. Permission Matrix by Module (Backend Controllers)

| Module / Controller                | SuperDev | Admin | Instructor | Examiner | Proctor | ProctorReviewer | Candidate | Auditor |
| ---------------------------------- | :------: | :---: | :--------: | :------: | :-----: | :-------------: | :-------: | :-----: |
| **Users**                          |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Roles** (read)                   |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Roles** (create/edit/delete)     |    ✅    |       |            |          |         |                 |           |         |
| **Departments**                    |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Organization / Settings**        |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Notifications / License**        |    ✅    |  ✅   |            |          |         |                 |           |         |
| **System Logs**                    |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Batches**                        |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Candidates Management**          |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Question Bank / Lookups**        |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Assessment (Exams)**             |   ✅\*   | ✅\*  |    ✅\*    |   ✅\*   |  ✅\*   |      ✅\*       |   ✅\*    |         |
| **Exam Assignments**               |    ✅    |  ✅   |     ✅     |          |         |                 |           |         |
| **Exam Operations**                |    ✅    |  ✅   |     ✅     |          |         |                 |           |         |
| **Exam Proctor Config**            |    ✅    |  ✅   |     ✅     |          |         |                 |           |         |
| **Attempt Control**                |    ✅    |  ✅   |     ✅     |          |         |                 |           |         |
| **Candidate Exam Details**         |    ✅    |  ✅   |     ✅     |          |         |                 |           |         |
| **Candidate (exam-taking)**        |          |       |            |          |         |                 |    ✅     |         |
| **Grading**                        |          |  ✅   |     ✅     |    ✅    |         |                 |           |         |
| **Exam Results**                   |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Certificates** (view)            |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Certificates** (manage/delete)   |          |  ✅   |            |          |         |                 |           |         |
| **Proctor / Video** (view)         |    ✅    |  ✅   |     ✅     |          |   ✅    |       ✅        |           |         |
| **Proctor** (actions)              |    ✅    |  ✅   |            |          |   ✅    |                 |           |         |
| **Identity Verification** (view)   |    ✅    |  ✅   |     ✅     |          |   ✅    |       ✅        |           |         |
| **Identity Verification** (submit) |    ✅    |  ✅   |            |          |         |                 |    ✅     |         |
| **Incident** (view/manage)         |    ✅    |  ✅   |     ✅     |          |         |       ✅        |           |         |
| **Incident** (delete/close)        |    ✅    |  ✅   |            |          |         |                 |           |         |
| **Audit** (view)                   |          |  ✅   |            |          |         |                 |           |   ✅    |
| **Audit** (manage policies)        |          |  ✅   |            |          |         |                 |           |         |

> \* `AssessmentController` uses `[Authorize]` only — any authenticated user can access it.

---

## 5. Frontend Sidebar Navigation — Role Visibility

| Nav Group / Item                                                        | SuperDev | Admin | Instructor | Examiner | Proctor | ProctorReviewer | Candidate | Auditor |
| ----------------------------------------------------------------------- | :------: | :---: | :--------: | :------: | :-----: | :-------------: | :-------: | :-----: |
| **Dashboard**                                                           |    ✅    |  ✅   |     ✅     |    ✅    |   ✅    |       ✅        |    ✅     |   ✅    |
| **Question Bank** (Subjects, Topics, Types, Questions)                  |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Exam Management** (Create, Template, List, Scheduler, Assign Proctor) |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Result** → Grading                                                    |          |  ✅   |     ✅     |    ✅    |         |                 |           |         |
| **Result** → Candidate Result                                           |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Result** → Terminated Attempts                                        |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Result** → Proctor Report                                             |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Proctor Center** (Dashboard, User Identification)                     |          |  ✅   |     ✅     |          |   ✅    |       ✅        |           |         |
| **Candidates** (Batch, Data, Assign to Exam, Exam Details)              |          |  ✅   |     ✅     |          |         |                 |           |         |
| **Administration** (Users, Permissions, Departments, Org, License)      |   ✅\*   |  ✅   |            |          |         |                 |           |         |
| **Notifications** (Settings, Templates, Logs)                           |   ✅\*   |  ✅   |            |          |         |                 |           |         |
| **Logs** (Audit, Candidate, Proctor, Users, Developer)                  |   ✅\*   |  ✅   |            |          |         |                 |           |         |
| **User Guide / Tutorials**                                              |   ✅\*   |  ✅   |     ✅     |    ✅    |   ✅    |       ✅        |           |   ✅    |
| **My Exams** (Candidate portal)                                         |          |       |            |          |         |                 |    ✅     |         |

> \* Frontend uses `UserRole.SuperAdmin` for these groups, but backend uses `SuperDev`. Mismatch — SuperDev user won't see these nav items.

---

## 6. Critical Issues Found

| #   | Issue                                                                   | Severity  | Impact                                                                                               |
| --- | ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| 1   | `ProctorReviewer` not in `AppRoles.cs` and not seeded                   | 🔴 High   | Users cannot be assigned this role. All ProctorReviewer-gated API endpoints permanently inaccessible |
| 2   | `Auditor` not in `AppRoles.cs` and not seeded                           | 🔴 High   | Auditor role cannot be assigned; AuditController read access for Auditor never works                 |
| 3   | `AuditController` uses `"SuperAdmin"` (non-existent role)               | 🔴 High   | SuperDev users cannot access audit endpoints — wrong role name used                                  |
| 4   | Frontend `UserRole.SuperAdmin` ≠ backend `AppRoles.SuperDev`            | 🟠 Medium | SuperDev user sees no Administration/Notifications/Logs nav items in the sidebar                     |
| 5   | `SuperAdmin` referenced in frontend sidebar but never seeded in backend | 🟠 Medium | Any user assigned `SuperAdmin` from UI gets a ghost role with no backend effect                      |
| 6   | `AssessmentController` uses `[Authorize]` (no role filter)              | 🟡 Low    | Any authenticated role (including Candidate) can call assessment endpoints                           |

---

## 7. Proposed Resolution (Pending Approval)

### Option A — Add missing roles to AppRoles.cs + seed them

Add `ProctorReviewer`, `Auditor`, and optionally `SuperAdmin` to `AppRoles.AllRoles`.

### Option B — Fix AuditController to use `SuperDev` instead of `SuperAdmin`

Replace `"Admin,SuperAdmin,Auditor"` → `$"{AppRoles.SuperDev},{AppRoles.Admin},Auditor"` (after Auditor is seeded).

### Option C — Align Frontend `UserRole.SuperAdmin` → `UserRole.SuperDev`

Rename the frontend enum value and sidebar role references from `SuperAdmin` to `SuperDev` to match backend exactly.

> **Awaiting confirmation before any implementation.**
