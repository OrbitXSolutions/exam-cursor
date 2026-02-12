You are my partner and senior software engineer.

We have a business demo as production ready in 24 hours.
The goal is to successfully demonstrate the system to business users and PMO — not to perfect the full backend.

Time is extremely limited.
We will work smart, professional, and production ready-focused.

We still Working on Candidate Module:
Let's Candidates Data Page
Implement the Admin module: Candidates → "Candidates Data" page end-to-end (Backend + Frontend) in a production-ready way.
DO NOT rewrite existing auth/roles logic; integrate with current patterns.

# Goal

Admins can manage candidates (create, edit, delete, block/unblock), search/filter, and import/export candidates via Excel.
Candidates are system users (they do NOT self-register). When created, they must be added to Users table and assigned Candidate role.

# UI Page: Candidates Data

## Layout

- Table list sorted by newest first (CreatedAt desc).
- Top toolbar:
  - "Add Candidate" button
  - Search input (by Full Name, Email, Roll No, Mobile)
  - Optional filter: Status (Active/Blocked)
  - Actions: Export Excel, Download Template, Import Excel (Bulk Upload)

## Table Columns

- Full Name
- Email
- Roll No
- Mobile Number
- Status (Active/Blocked) with badge
- CreatedAt
- CreatedBy (admin name/email if available)
- Actions column: Edit, Delete, Block/Unblock

## Candidate Create/Edit Form (Modal or page)

Fields:

- Full Name (required)
- Email (required, unique, valid email)
- Password (required on create, optional on edit)
- Roll No (required, unique per tenant/exam scope if applicable)
- Mobile Number (optional but validated)
- Status: Active / Blocked

Behavior:

- On Create:
  - Create user record
  - Assign Candidate role
- On Edit:
  - Update candidate profile fields
  - Password update only if provided
- On Block:
  - Candidate cannot login/take exam (enforce backend check)
- On Delete:
  - Use safe strategy: - If candidate has attempts/exam relations -> soft delete or prevent delete with clear message - Otherwise allow delete
    (Choose the safest approach consistent with existing system)

# Excel Export

- Export current filtered list to .xlsx
- Column headers exactly:
  FullName, Email, RollNo, Mobile, Status, CreatedAt
- Ensure proper date formatting.

# Excel Import (Bulk Upload)

## Template

- Provide a downloadable template .xlsx with required columns:
  FullName, Email, Password, RollNo, Mobile
- Add notes row or sheet "Instructions" (optional) but keep data sheet clean.

## Import rules

- Validate each row:
  - required fields
  - email format
  - unique Email + unique RollNo
- For errors:
  - Do NOT fail whole upload if some rows invalid.
  - Return a detailed results summary:
    - inserted count
    - skipped count
    - per-row errors (row number + reasons)
- Insert valid candidates, assign Candidate role.
- Password handling:
  - If password missing, auto-generate a strong temporary password and include it in result summary securely (or provide a separate downloadable "import results" file). Follow security best practice for this product.
- After successful import, refresh list.

# Backend Requirements

## DB

- Confirm there is a RollNo field; if not, add it (migration).
- Candidate ties to Users table.
- Make sure Candidate role exists and is used.

## APIs (REST)

- GET /api/candidates
  - query params: search, status, page, pageSize, sort
  - returns paginated result
- POST /api/candidates
- PUT /api/candidates/{id}
- PATCH /api/candidates/{id}/block (or /status)
- DELETE /api/candidates/{id}
- GET /api/candidates/export (returns Excel)
- GET /api/candidates/import-template (returns template file)
- POST /api/candidates/import (multipart file upload)

## Validation & Security

- Admin-only access.
- Prevent duplicate emails/roll numbers at DB level and API level.
- Ensure blocked candidate is rejected in candidate auth/session flows (wherever exam access is checked).

# Frontend Requirements

- Use existing UI components/theme; keep it clean and professional.
- Table supports pagination and loading states.
- Form has inline validation and clear error messages.
- Confirm dialogs for delete and block/unblock.
- Import flow:
  - button opens file picker
  - show progress/loading
  - show results summary in a modal (success + per-row errors)
- Export downloads file with a meaningful name: candidates_YYYY-MM-DD.xlsx

# Deliverables

1. Backend: migrations + entities + services + controllers + endpoints + validation
2. Frontend: Candidates Data page UI + forms + actions + import/export flows
3. Brief manual test checklist (Swagger + UI)
4. Edge cases handled (duplicates, blocked access, partial import errors)

Follow existing project architecture and naming conventions.

## Result:

Summary — Batch Management Module
Backend (8 files)
File Action
Domain/Entities/Batch/Batch.cs Created — Batch entity (BaseEntity) + BatchCandidate join table
Infrastructure/Data/Configurations/BatchConfiguration.cs Created — EF fluent config: unique name index, composite (BatchId, CandidateId)
Infrastructure/Data/ApplicationDbContext.cs Modified — Added DbSet<Batch> + DbSet<BatchCandidate>
Application/DTOs/Batch/BatchDtos.cs Created — 8 DTOs: List, Detail, Candidate, Create, Update, Filter, CandidateIds, ChangeResult
Application/Interfaces/Batch/IBatchService.cs Created — 9 methods: CRUD + toggle + add/remove candidates + export
Infrastructure/Services/Batch/BatchService.cs Created — Full implementation (~280 lines) with ClosedXML export
Controllers/Batch/BatchesController.cs Created — 9 endpoints under /api/Batches
Program.cs Modified — Registered IBatchService/BatchService
Migration: AddBatches — applied to database

API Endpoints
Method Route Purpose
GET /api/Batches List (paginated, search, filter)
GET /api/Batches/{id} Detail with candidates
POST /api/Batches Create batch
PUT /api/Batches/{id} Update batch
DELETE /api/Batches/{id} Soft delete
POST /api/Batches/{id}/toggle-status Activate/Deactivate
POST /api/Batches/{id}/candidates Add candidates (bulk)
DELETE /api/Batches/{id}/candidates Remove candidates (bulk)
GET /api/Batches/{id}/export Export members to Excel
Frontend (3 files)
File Action
lib/api/batch.ts Created — Types + API functions matching all 9 endpoints
candidates/batch/page.tsx/candidates/batch/page.tsx) Replaced — Full batch list page (table, create/edit dialog, delete, status toggle, export, pagination)
candidates/batch/[id]/page.tsx Created — Batch detail page (info cards, member table with search, add/remove candidates, bulk remove, export)
Verified
Backend build: succeeded
Backend /api/Batches: 401 (auth working)
Frontend /candidates/batch: 200
Frontend /candidates/batch/1: 200
Bilingual: EN/AR throughout

## Asign

You are a senior full-stack engineer working on Smart Exam system.

Implement a complete "Batch Management" module inside Admin → Candidates → Batch.

This module allows grouping candidates into logical collections (Batches) so that exams can later be assigned per Batch.

DO NOT break existing Users/Candidates structure.
Integrate cleanly with current architecture.

---

# BUSINESS GOAL

---

A Batch is a logical group of Candidates.
Example use cases:

- School A - Grade 10 - Section B
- Training Cohort - March 2026
- HR Screening - IT Department

Admin must be able to:

- Create batches
- Add/remove candidates
- Bulk assign exam to batch
- View batch statistics
- Export batch members

---

# DATABASE DESIGN

---

## Table: Batches

Fields:

- Id (PK)
- Name (required, unique)
- Description (optional)
- IsActive (bool)
- CreatedAt
- CreatedBy
- UpdatedAt
- UpdatedBy

## Relationship

Many-to-Many:
Batch ↔ Candidate (User)

Create linking table:
BatchCandidates:

- Id
- BatchId (FK)
- CandidateId (FK)
- AddedAt
- AddedBy

Add unique constraint:
(BatchId, CandidateId)

---

# UI: Batch List Page

---

Columns:

- Batch Name
- Description
- Total Candidates
- Active / Inactive
- CreatedAt
- Actions (View, Edit, Delete, Activate/Deactivate)

Top toolbar:

- Add Batch button
- Search by name
- Filter by status (Active/Inactive)
- Export Batches (Excel optional)

Sorted by newest first.

---

# CREATE / EDIT BATCH

---

Fields:

- Batch Name (required, unique)
- Description
- Status (Active / Inactive)

Validation:

- Cannot create duplicate name
- Cannot delete batch if it contains candidates (either prevent or require confirmation)

---

# VIEW BATCH DETAILS

---

Page sections:

## Section 1: Batch Info

- Name
- Description
- Total Candidates
- CreatedAt / CreatedBy

## Section 2: Candidate List (inside batch)

Table:

- RollNo
- FullName
- Email
- Mobile
- Status (Active/Blocked)
- Remove from batch (action)

Top actions:

- Add Candidates (opens modal)
- Remove selected
- Export batch members (Excel)

---

# ADD CANDIDATES TO BATCH

---

Modal:

- Search candidates by name/email/rollNo
- Filter: only candidates NOT already in batch
- Multi-select
- Add selected

Bulk safe behavior:

- Ignore duplicates
- Show summary after adding:
  - Added count
  - Skipped count

---

# REMOVE CANDIDATES FROM BATCH

---

- Allow multi-select remove
- Confirmation dialog
- Do NOT delete candidate from system — only remove link

---

# ASSIGN EXAM TO BATCH (Integration)

---

From Batch details page:

Button:
"Assign Exam to Batch"

Flow:

- Select Exam
- Select Schedule Window (From/To datetime)
- Confirm action

Backend:
Create ExamAssignments for all candidates in batch.

Rules:

- Skip already assigned candidates
- Skip blocked candidates
- Skip candidates who already started same exam
- Return detailed summary:
  - Success count
  - Skipped count + reasons

---

# REPORTING FEATURES

---

Inside Batch details:

- Assigned count
- Started count
- Completed count
- Not started count

(Optional but recommended)

---

# SECURITY

---

- Admin-only access
- Audit logging for:
  - Create batch
  - Add candidates
  - Remove candidates
  - Assign exam

---

# EDGE CASES

---

- Prevent deleting batch if used in historical reporting (optional soft delete)
- If batch is inactive → prevent exam assignment
- Handle large batches (1000+ candidates) efficiently (use background job if needed)

---

# API Endpoints (REST)

---

GET /api/batches
POST /api/batches
PUT /api/batches/{id}
DELETE /api/batches/{id}
GET /api/batches/{id}
POST /api/batches/{id}/candidates
DELETE /api/batches/{id}/candidates
POST /api/batches/{id}/assign-exam
GET /api/batches/{id}/export

---

# FRONTEND REQUIREMENTS

---

- Clean enterprise UI
- Pagination
- Proper loading states
- Confirmation dialogs
- Result summary modals
- Toast notifications

---

# DELIVERABLES

---

1. DB migration
2. Backend entities + services + controllers
3. Full frontend pages
4. Manual test checklist
5. Clear business rule documentation

## Asign to Exam

Summary Output

1. What Was Implemented
   Assign to Exam (Single + Batch + Filtered) — full-stack feature allowing admins/instructors to assign candidates to published exams with three modes:

Manual selection — pick individual candidates via checkboxes
Batch mode — assign all candidates in a specific batch
Filter-all mode — assign all candidates matching current search/status filters
Unified candidate endpoint returns ExamAssigned and ExamStarted flags computed server-side in a single query.

2. API Endpoints Created
   Method Route Description
   GET /api/Assignments/candidates Enriched candidate list with ExamAssigned/ExamStarted flags
   POST /api/Assignments/assign Assign exam (single/batch/filtered) with schedule
   POST /api/Assignments/unassign Unassign exam from selected candidates
   All endpoints require SuperDev, Admin, or Instructor role.

3. Database Changes
   New table: ExamAssignments (Id, ExamId, CandidateId, ScheduleFrom, ScheduleTo, IsActive, AssignedAt, AssignedBy + BaseEntity audit columns)
   Unique filtered index on (ExamId, CandidateId) where IsActive=1 AND IsDeleted=0
   Migration: AddExamAssignments — created and applied
4. Files Created / Modified
   Backend (7 new, 2 modified):

ExamAssignment.cs — entity
ExamAssignmentConfiguration.cs — EF config
ExamAssignmentDtos.cs — 6 DTOs
IExamAssignmentService.cs — interface
ExamAssignmentService.cs — service (~270 lines)
AssignmentsController.cs — controller
ApplicationDbContext.cs — added DbSet
Program.cs — DI registration
Frontend (1 new, 1 modified):

exam-assignment.ts — API service + types
page.tsx/candidates/assign-to-exam/page.tsx) — replaced placeholder with full UI 5. Manual Test Steps
Login as Admin → Navigate to Candidates → Assign to Exam
Select a published exam from the dropdown
Set valid Schedule From/To (To > From)
Candidate table loads with Assigned/Started badges
Select candidates via checkboxes → Click Assign → Confirm → See result summary
Verify assigned candidates show "Yes" badge on reload
Select assigned candidates → Click Unassign → Verify badge reverts
Use Assign All Matching to bulk-assign by batch or filter
Verify blocked candidates and already-started exams are skipped (shown in result details)

===============================

You are my partner and senior software engineer.

We are implementing a production-ready feature inside Smart Exam.

This feature must be scalable, clean, maintainable, and enterprise-grade.
It must follow solid backend architecture and clean frontend structure.

We still Working on Candidate Module:

---

TASK: Implement "Candidate Exam Control" page (End Exam + Resume Exam + Add Time) as a unified operational control center for active exam attempts.

---

# Business Objective

Provide administrators with centralized control over active and paused exam attempts.

This page must allow:

1. Force End Exam (Force Submit)
2. Resume Exam
3. Add Extra Time
4. Monitor attempt state in real time (status + remaining time)

This feature operates on Exam Attempts (NOT Assignments).

---

# Core Concept

Assignment = permission to start exam.
Attempt = actual running session.

This page controls Attempt lifecycle.

---

# Database Expectations

Use existing ExamAttempt entity if available.
If enhancements are needed, extend safely using BaseEntity.

ExamAttempt (assumed fields):

- Id
- ExamId
- CandidateId
- Status (NotStarted / InProgress / Paused / Submitted / ForceSubmitted / Expired)
- StartedAt
- SubmittedAt
- RemainingSeconds
- TotalDurationSeconds
- LastActivityAt
- IsLocked (optional)
- DeviceInfo (optional)
- IPAddress (optional)

Add if missing:

- ForceSubmittedBy
- ForceSubmittedAt
- ExtraTimeSeconds (accumulated)
- ResumeCount (optional)
- AuditNotes (optional)

All new entities inherit from BaseEntity.

---

# Page Scope

This page lists ONLY attempts that are:

- InProgress
- Paused
- Disconnected (if exists)
- Locked (if exists)

Completed attempts should not appear here (unless filter changed).

---

# Backend Requirements

IMPORTANT:
Return enriched DTO from ONE main endpoint.
Frontend must not call separate APIs to compute flags.

---

## 1) Main Endpoint

GET /api/attempt-control

Query params:

- examId (optional)
- batchId (optional)
- search (RollNo/Email/Name)
- status (InProgress / Paused / All)
- page
- pageSize

Response must include:

For each attempt:

- AttemptId
- CandidateId
- RollNo
- FullName
- ExamName
- StartedAt
- RemainingSeconds
- Status
- LastActivityAt
- ExtraTimeSeconds
- ResumeCount
- IsLocked
- IPAddress
- DeviceInfo
- CanForceEnd (bool)
- CanResume (bool)
- CanAddTime (bool)

These flags must be computed in backend based on business rules.

Pagination required.

---

## 2) Force End Exam Endpoint

POST /api/attempt-control/force-end

Body:

- attemptId
- reason (optional)

Rules:

- Only allowed if Status = InProgress OR Paused
- Change Status to ForceSubmitted
- Set SubmittedAt = now
- Store ForceSubmittedBy
- Prevent future resume
- Trigger grading pipeline if applicable

Return:

- success
- updated status
- timestamp

---

## 3) Resume Exam Endpoint

POST /api/attempt-control/resume

Body:

- attemptId

Rules:

- Allowed only if Status = Paused OR Disconnected
- Must still be within schedule window
- Must not be submitted
- Change Status to InProgress
- Increment ResumeCount
- Log action

Return updated attempt snapshot.

---

## 4) Add Time Endpoint

POST /api/attempt-control/add-time

Body:

- attemptId
- extraMinutes
- reason (optional)

Rules:

- Allowed only if Status = InProgress
- Increase RemainingSeconds
- Increase ExtraTimeSeconds
- Log who added time
- Ensure no overflow or negative value

Return updated RemainingSeconds.

---

# Business Rules Enforcement

- Cannot resume submitted attempt.
- Cannot force end already submitted attempt.
- Cannot add time to submitted attempt.
- Must validate schedule window.
- All operations must be transactional.
- Audit every action (AdminId + timestamp).

---

# Frontend Requirements

Page Name: Candidate Exam Control

Layout:

Filters:

- Exam dropdown
- Batch dropdown
- Search
- Status filter

Table Columns:

- RollNo
- Name
- Exam
- Status (colored badge)
- StartedAt
- Remaining Time (live countdown optional)
- Extra Time Added
- Resume Count
- Last Activity
- Actions

Actions per row:

- Force End (red)
- Resume (blue)
- Add Time (clock icon)

Behavior:

- Confirmation modal for Force End
- Modal input for Add Time
- Disable buttons based on CanForceEnd / CanResume / CanAddTime flags
- Proper loading states
- Toast notifications
- No global style changes

---

# Performance

- No N+1 queries.
- Proper joins.
- Index on ExamId, CandidateId, Status.
- Efficient pagination.
- Designed to handle 10k+ attempts safely.

---

# Security

- Admin-only endpoint.
- Role-based authorization.
- Validate ownership if multi-tenant.
- Prevent manipulation of attempt state.

---

# Logging & Auditing

Every control action must:

- Be logged
- Include AdminId
- Include IP if needed
- Include reason if provided

---

After finishing:

Provide:

1. What was implemented
2. DB changes
3. Endpoints created
4. Business rules implemented
5. Manual test checklist
6. Any assumptions made

---

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- Follow existing project architecture and naming conventions.
- After finish the task give me summary Output.
