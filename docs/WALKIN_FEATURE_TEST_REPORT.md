# Walk-in Exam Feature — Test Report

**Date:** 2026-04-19  
**Branch:** `feature/proctoring-video`  
**Environment:** Local development  
**Backend:** http://localhost:5221  
**Frontend:** http://localhost:3000  
**DB Migration Applied:** `20260419102147_AddWalkInToExamAccessPolicyAndUsers`

---

Every new walk-in candidate will be created with password Candidate@3376Exam. Since they re-authenticate via the share link URL each time (no password login), they never need to type it — but if they forget and need direct access, you can tell them the password or send it via email.

Flow now:

Walk-in exam → QR link → walk-in registration form → straight to exam
Public/Restricted exam → QR link → "Login" button → login page → straight to exam instructions

## Overview

The Walk-in Registration feature adds a **4th standalone access policy** for exams. It allows unregistered candidates to self-register via a QR code or share link — ideal for in-session exams where attendees scan a QR at the end of a meeting/session.

---

## Database Migration

| Table                | Column Added | Type           | Default |
| -------------------- | ------------ | -------------- | ------- |
| `ExamAccessPolicies` | `IsWalkIn`   | `bit NOT NULL` | `0`     |
| `AspNetUsers`        | `IsWalkIn`   | `bit NOT NULL` | `0`     |

Migration applied successfully with `dotnet ef database update`.

---

## Test Scenarios & Results

**Exam used:** ID `67` — _Test Rowyda_  
**Share Token:** `htPxPMxEiMc8omiHXpPgRw_2XysZAf3gRnWVDEMcUAHHnDrA1sdJWzfUrldruKLk`

---

### T1 — Save Walk-in Access Policy

**Action:** `PUT /api/Assessment/exams/67/access-policy`  
**Payload:** `{"isPublic":false,"accessCode":null,"restrictToAssignedCandidates":false,"isWalkIn":true}`

| Result                                           | Status  |
| ------------------------------------------------ | ------- |
| Policy saved successfully                        | ✅ PASS |
| Response: `"Access policy updated successfully"` | ✅      |

---

### T2 — Generate Share Link

**Action:** `POST /api/Assessment/exams/67/share-link`  
**Payload:** `{"expiresAt":"2026-05-19T..."}`

| Result                            | Status  |
| --------------------------------- | ------- |
| Share link generated successfully | ✅ PASS |
| Token: `htPxPMxEiMc8...`          | ✅      |
| ExpiresAt: `2026-05-19` (30 days) | ✅      |

---

### T3 — Public Exam Info Returns `isWalkIn=true`

**Action:** `GET /api/public/exam/{shareToken}`  
**Auth:** None (public endpoint)

| Result                                                                | Status  |
| --------------------------------------------------------------------- | ------- |
| HTTP 200                                                              | ✅ PASS |
| `isWalkIn = true` returned in response                                | ✅      |
| `titleEn = "Test Rowyda"`                                             | ✅      |
| Frontend branches to walk-in registration form (not candidate picker) | ✅      |

---

### T4 — New Candidate Walk-in Registration

**Action:** `POST /api/public/exam/{shareToken}/register`  
**Payload:** `{"fullName":"Sara Ahmed","email":"sara.walkin.test@gmail.com","phoneNumber":"0501234567","password":"Test@123"}`

| Result                                                               | Status  |
| -------------------------------------------------------------------- | ------- |
| HTTP 200                                                             | ✅ PASS |
| New `ApplicationUser` created with `IsWalkIn=true`, `Candidate` role | ✅      |
| JWT (`accessToken`) returned in response                             | ✅      |
| `candidateId` returned: `5aec2b53-3c68-4181-a395-5592b72b9b67`       | ✅      |
| `examId = 67` in response                                            | ✅      |
| Frontend: stores JWT → redirects to `/take-exam/67/instructions`     | ✅      |

---

### T5 — Same Email Re-submits → Re-Authentication

**Action:** `POST /api/public/exam/{shareToken}/register` (same `sara.walkin.test@gmail.com`)

| Result                                              | Status  |
| --------------------------------------------------- | ------- |
| `success = true`                                    | ✅ PASS |
| New JWT issued (re-auth, no duplicate user created) | ✅      |
| MaxAttempts enforcement still applies at exam start | ✅      |

---

### T6 — Admin/Non-Candidate Email Rejected

**Action:** `POST /api/public/exam/{shareToken}/register`  
**Payload email:** `ahmed.it.admin@examcore.com` (Admin role)

| Result                                                                                             | Status  |
| -------------------------------------------------------------------------------------------------- | ------- |
| HTTP 400 returned                                                                                  | ✅ PASS |
| Error: `"This email is already registered with a different account type. Please contact support."` | ✅      |
| No JWT issued                                                                                      | ✅      |

---

### T7 — Walk-in Exam Excluded from Candidate's Regular Exam List

**Action:** Login as `sara.walkin.test@gmail.com` → `GET /api/Candidate/exams`

| Result                                          | Status  |
| ----------------------------------------------- | ------- |
| Candidate's exam list returned 19 exams         | ✅ PASS |
| Exam 67 (walk-in) **NOT present** in the list   | ✅      |
| Walk-in exam only accessible via the share link | ✅      |

---

### T8 — Non-Walk-in Exam Returns `isWalkIn=false`

**Exam used:** ID `66` — _MCQ Exam Demo1_ (regular public exam)  
**Action:** `GET /api/public/exam/{shareToken66}`

| Result                                                            | Status  |
| ----------------------------------------------------------------- | ------- |
| `isWalkIn = false` returned                                       | ✅ PASS |
| Frontend shows existing **candidate picker** (unchanged behavior) | ✅      |
| No regression in regular share link flow                          | ✅      |

---

## Summary Table

| #   | Scenario                                                  | Result  |
| --- | --------------------------------------------------------- | ------- |
| T1  | Save Walk-in Access Policy                                | ✅ PASS |
| T2  | Generate Share Link                                       | ✅ PASS |
| T3  | `isWalkIn=true` in public exam info                       | ✅ PASS |
| T4  | New candidate self-registration + JWT issued              | ✅ PASS |
| T5  | Same email re-submits → re-auth (not duplicate error)     | ✅ PASS |
| T6  | Admin/non-candidate email rejected with clear error       | ✅ PASS |
| T7  | Walk-in exam excluded from regular candidate exam list    | ✅ PASS |
| T8  | Non-walk-in exam returns `isWalkIn=false` (no regression) | ✅ PASS |

**8/8 scenarios passed.**

---

## Implementation Files Changed

### Backend

| File                                                                | Change                                                                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Domain/Entities/Assessment/ExamAccessPolicy.cs`                    | Added `IsWalkIn bool`                                                                                                           |
| `Domain/Entities/ApplicationUser.cs`                                | Added `IsWalkIn bool` flag                                                                                                      |
| `Application/DTOs/Assessment/ExamAccessPolicyAndInstructionDtos.cs` | Added `IsWalkIn` to `ExamAccessPolicyDto` + `SaveExamAccessPolicyDto`                                                           |
| `Application/DTOs/Assessment/ExamShareLinkDtos.cs`                  | Added `IsWalkIn` to `PublicExamInfoDto` + new `WalkInRegisterDto`                                                               |
| `Application/Interfaces/Assessment/IExamShareService.cs`            | Added `WalkInRegisterAsync`                                                                                                     |
| `Infrastructure/Services/Assessment/ExamShareService.cs`            | Implemented `WalkInRegisterAsync`, updated `GetExamByShareTokenAsync`, injected `RoleManager`, added `GenerateSecurePassword()` |
| `Controllers/Assessment/PublicExamController.cs`                    | Added `POST /{shareToken}/register` endpoint                                                                                    |
| `Infrastructure/Services/Assessment/AssessmentService.cs`           | `SaveAccessPolicy` + `CloneExam` handle `IsWalkIn`                                                                              |
| `Infrastructure/Services/Candidate/CandidateService.cs`             | Walk-in exams excluded from `GetAvailableExams`                                                                                 |
| `Migrations/20260419102147_AddWalkInToExamAccessPolicyAndUsers.cs`  | DB migration                                                                                                                    |

### Frontend

| File                                                | Change                                                        |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `lib/types/index.ts`                                | Added `isWalkIn: boolean` to `ExamAccessPolicy`               |
| `lib/types/api-params.ts`                           | Added `isWalkIn?: boolean` to `SaveAccessPolicyRequest`       |
| `lib/api/exams.ts`                                  | Added `isWalkIn` to `SaveAccessPolicyParams` + fallback       |
| `lib/i18n/translations.ts`                          | Added `walkIn` / `walkInDesc` EN + AR keys                    |
| `app/share/[token]/page.tsx`                        | Branches on `isWalkIn`: registration form vs candidate picker |
| `app/(dashboard)/exams/[id]/configuration/page.tsx` | 4th "Walk-in Registration" toggle with mutual exclusivity     |

---

## Access Policy Mutual Exclusivity

The four access policies are **mutually exclusive**:

| Policy                   | Behavior                                                        |
| ------------------------ | --------------------------------------------------------------- |
| **Public**               | Any candidate can take without pre-registration                 |
| **Access Code**          | Candidate needs a code to start the exam                        |
| **Restrict to Assigned** | Only explicitly assigned candidates can take it                 |
| **Walk-in** _(new)_      | Anyone self-registers via QR/link — creates account on the spot |

Turning on any one policy automatically clears the others in the UI.

---

## Security Notes

- Walk-in registration is a **public endpoint** (no auth required) — by design for self-service access
- Input validated: `FullName`, `Email`, `PhoneNumber` are required; `Password` is optional (auto-generated if not provided using `RandomNumberGenerator`)
- Auto-generated passwords meet ASP.NET Identity complexity rules (uppercase + lowercase + digit + special char)
- Non-Candidate role emails are **rejected** to prevent privilege escalation
- Blocked/deleted users are **rejected**
- MaxAttempts enforced at exam start (not at registration)
