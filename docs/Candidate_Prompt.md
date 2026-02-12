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

You are my partner and senior software engineer.

We have a business demo as production ready in 24 hours.
The goal is to successfully demonstrate the system to business users and PMO — not to perfect the full backend.

Time is extremely limited.
We will work smart, professional, and production ready-focused.

We still Working on Candidate Module:

---

TASK: [Write the exact task title here – e.g. Assign to Exam]

---

# Business Objective

Implement this feature in a demo-ready, production-looking way.
Focus on clean behavior, correct logic, and smooth UX.
Avoid over-engineering.
Do not redesign system architecture.

---

# Technical Constraints (VERY IMPORTANT)

1. Follow existing project architecture and naming conventions.
2. Do NOT modify global styles or colors unless I confirm.
3. If new table is required:
   - Inherit from BaseEntity.
   - UpdatedAt / UpdatedBy already handled.
4. Do NOT split simple data retrieval into multiple API calls.
   - The main table must be returned from ONE endpoint.
   - All relations, computed flags, joins and merging must be handled in backend.
   - Frontend must receive ready-to-use DTO.
5. No logic duplication in frontend.
6. No unnecessary APIs.

---

# Backend Requirements

- Use clean service layer logic.
- Handle relations in backend.
- Return a single enriched response model.
- Enforce business rules server-side.
- Keep performance in mind (demo scale is enough).
- Keep it simple and safe.

Example:
If table shows:
ExamAssigned?
ExamStarted?

Those must be computed in backend and returned in the main list endpoint.
Frontend must NOT call separate APIs to get status.

---

# Frontend Requirements

- Use existing UI layout/components.
- No style changes.
- Clean loading state.
- Simple confirmation dialogs.
- Clear success/error toast.
- Minimal but professional.

---

# Edge Cases

Handle basic realistic cases:

- Blocked candidate
- Already assigned
- Started exam
- Invalid input
- Duplicate operations

No over-complex scenarios.

---

After finishing the task:

Provide:

1. What was implemented
2. APIs created/updated
3. DB changes (if any)
4. Manual test steps (short checklist)
5. Important notes / assumptions

---

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- Follow existing project architecture and naming conventions.
- After finish the task give me summary Output.

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- Follow existing project architecture and naming conventions.
- After finish the task give me summary Output

the next step after finish manual grading for essay and subject questions,
in Candidate Result.

In Page of Candidate Reault
Task1:
When Click on Publish Result (I got error result not found) as in the image 1- Fix it

Taks2:
In Candidate Video or Screen Streaming or Proctor Report
Dispaly the attempt/events and logs/alert and screenshots of candidate in this attempt.

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- After finish the task give me summary Output
- Use minimal request API as ()
- Do not change view details / score card Pages.

Output

- As Admin I Expect the Candidate Reault Page with all Action is Working Fine ready to Production.

- If a backend task is quick and low risk → fix it in the real backend.
- If a backend task is complex, unstable, or time-consuming → we will create a Mock API in the frontend using:
  - JSON files
  - In-memory data
  - or temporary Next.js Route Handlers

Working style:

- We will work module by module.
- For each module:
  1. Review its purpose and demo value.
  2. List required demo features.
  3. Decide per feature:
     - Real backend
     - or Mock API
  4. Create a clear TODO checklist.
  5. Implement step by step.

You may ask questions at any time.
You may suggest smarter or safer demo shortcuts.

Before we start:

- Read and understand the full project context and documentation.
- Confirm you understand:
  - the system domain (Exam / Question Bank / Attempts / Results / Admin / Candidate)
  - the demo goal
  - your role in this process

## Once you confirm understanding, we will start with the first module together.

Current Status Summary
✅ Fully Working: Auth, Candidate journey, Grading, Reports, Certificates, Question Bank, Exams
⚠️ Partial: Proctor Center UI, Settings, Audit logs UI
❌ Not Ready: Live video proctoring, CI/CD
Demo Critical Paths
Candidate Journey: Login → My Exams → Take Exam → Submit → View Result → Download Certificate
Admin Flow: Create Questions → Create Exam → Publish → Grade → View Reports
Certificate Verification: Public page verification

## For Exam Builer: :|

Keep the old page as-is: /exams/create

Create a new page:

- /exams/setup (Create)
- /exams/setup/[examId] (Edit)

IMPORTANT UI:
Do NOT change the existing design style. Reuse the same section-card UI used in /exams/create
(green section title + icon + same spacing and card layout). The new Setup page must look identical in styling.

Setup page has 2 tabs:

1. Configuration (same sections style)
2. Builder (placeholder)

Rules:

- In /exams/setup (no id): Builder tab disabled with message “Please save exam first”
- Save/Next creates exam via real API and navigates to /exams/setup/{id}?tab=builder
- /exams/setup/[examId] loads data (GET) and allows update (PUT/PATCH)
- Please implement tabs using query string ?tab= (not local state)
  so that:
  -Page refresh keeps the active tab
  -Direct links to Builder tab are possible
  Examples:
  /exams/setup/12?tab=config
  /exams/setup/12?tab=builder

Builder tab for now: show “Welcome to Builder” + Exam ID

Place "Exam Creation" directly below the existing "Create Exam" item under the Exams section in Sidebar Navigation
Add a new menu item

## Builder Tab:

Okay Perfect Exam Setup page Configuration tab Done do not change anything,
Now Let's Start Working on Builder tab (Tab 2) in production-quality Integrated with API,

Context:

- Builder Tab must contain everything related to sections/questions logic.
- IMPORTANT: Do NOT use ExamTopic for the new Exam-Setup Page . We will rely on ExamSection only.

What we want:
Admin builds exam sections from Question Bank Subjects/Topics, sets duration per section, and sets how many questions to randomly pick per section (PickCount). Questions will be selected later per attempt; for now we persist the rules.

========================
TASKS (Step-by-step)
========================

1. Backend – minimal model updates Update ExamSection entity

- Add enum: SectionSourceType { Subject = 1, Topic = 2 }.
- Update ExamSection entity to support building sections from Question Bank:
  Add fields:
  - SourceType (SectionSourceType) // Subject or Topic
  - QuestionSubjectId (int? nullable)
  - QuestionTopicId (int? nullable)
  - PickCount (int) // number of questions to randomly pick per section
    Notes:
  - DurationMinutes already exists in ExamSection and MUST be used.

  - Keep TitleEn/TitleAr as snapshot/display fields. If QuestionSubjectId/TopicId is provided, auto-fill TitleEn/TitleAr from selected subject/topic on save if empty.

- Do NOT remove existing tables. Do NOT touch ExamTopic. Keep existing ExamQuestion unchanged

  Validation rules:
  - If sourceType=Subject: each section must have questionSubjectId, and questionTopicId must be null.
  - If sourceType=Topic: each section must have both questionSubjectId and questionTopicId.
  - pickCount >= 1 and must be <= available questions count for that subject/topic.
  - durationMinutes can be 0 or null (means no section timer).

  Save strategy:
  - Replace existing sections for the exam with provided payload (simple and deterministic).

C) Availability counts (for UI validation):
Provide an endpoint to get available questions count:
GET /api/questionbank/questions/count?subjectId=...&topicId=...
It returns { "count": N }.
This is used to show “Available: N questions” and validate pickCount.

3. Frontend – Exam Setup page integration

- Keep /exams/setup and /exams/setup/[examId] pages as they are.

4. Frontend – Build Tab UI (MVP without manual)
   In Builder tab implement this flow:

Q1) Select Subjects (multi-select)

- Multi-select dropdown with search
- Admin can select multiple subjects
- Once selected, preload their topics and availability counts (as needed)

Q2) How should sections be generated? (inline radio)

- By Subject
- By Topic

Behavior:
A) If “By Subject”

- Auto-generate a Sections Preview list: one section per selected subject.
- For each section show a Section Card (same design language as existing pages):
  - Title (read-only, from subject name)
  - DurationMinutes input (allow 0)
  - PickCount input (number of questions to randomly pick)
  - Show helper: “Available: N questions”
  - Validate PickCount <= Available

B) If “By Topic”

- After selecting subjects, show accordion per selected subject:
  - “Include all topics” (default ON)
  - If OFF: show checklist of topics for that subject
- Sections Preview becomes one section per selected topic.
- For each topic-section show Section Card:
  - Title (read-only, from topic name)
  - DurationMinutes input
  - PickCount input
  - Available count for that topic

Actions:

- “Save Builder” button:
  - Calls PUT /api/exams/{examId}/builder with sourceType + computed sections payload.
  - Shows toast success.
- Also implement “Load existing builder”:
  - On opening builder tab for an existing exam, call GET /api/exams/{examId}/builder and prefill UI (subjects selection, sourceType, sections settings).

5. Data mapping rules

- For Subject-wise:
  - ExamSection.SourceType = Subject
  - QuestionSubjectId = selected subject
  - QuestionTopicId = null
- For Topic-wise:
  - ExamSection.SourceType = Topic
  - QuestionSubjectId = topic’s parent subject id
  - QuestionTopicId = selected topic id
- Titles are stored as snapshot (TitleEn/TitleAr) filled from selected lookup.

Deliverables / acceptance:

- Builder tab works end-to-end:
  - Select subjects → choose By Subject/By Topic → set duration + pickCount → save → reload persists
- API persists rules in real DB
- UI styling matches existing patterns (no design overhaul)

## Exma menu and Actions:

Continue from the current SmartExam frontend/backend. Implement the following production-ready navigation + exam management pages.

A) Sidebar menu changes

- Create an "Exams" group in the left sidebar (keep existing design).
- Add sub menu items:
  1. Exams (existing) -> /exams (keep the old page as-is)
  2. Create Exam -> /exams/setup (new two-tabs setup page already implemented)
  3. Exams List -> /exams/list (new page to be implemented)

B) New page: Exams List (/exams/list)

- Build a table list for all exams using real backend API.
- Columns:
  - Exam Title (EN/AR display as per current locale) >> link when click open /exams/setup/{id}?tab=config
  - Status (Draft/Published/Archived badge)
  - Configuration button -> /exams/{id}/configuration
  - Builder button -> /exams/setup/{id}?tab=builder
  - Actions menu (dropdown):
    - View -> /exams/{id}/overview
    - Edit -> /exams/setup/{id}?tab=config
    - Publish or Archive (based on current status) -> call real API
    - Delete

C) New page: Exam Overview (/exams/{id}/overview)

- After a successful SAVE on Builder tab (Tab 2) in /exams/setup/{id}?tab=builder,
  redirect to /exams/{id}/overview.
- Design a Production Overview UI shows:
  "Exam Saved Successfully "
  Exam title, status, exam id.
- Primary Actions:
  1. Go to Configuration -> /exams/{id}/configuration
  2. Publish Exam (if Draft) -> call real publish API
  3. Edit Builder -> /exams/setup/{id}?tab=builder
  4. Preview Exam (if page exists; otherwise disabled)
- Secondary Actions:
  - Back to Exams List -> /exams/list
  - Archive Exam (only if Published)

Constraints:

- Do NOT modify the existing /exams page.
- Reuse the current UI style (shadcn/ui + same design language).
- Use query string tab navigation for setup pages (?tab=...).
- Ensure routing works and menu active state is correct.

## Candidate Dashboard .....

ROLE
You are a senior full-stack engineer on Smart Exam. Review the existing candidate portal pages and refactor to match the new MVP navigation.

GOAL
Set “My Exams” as the main Candidate Dashboard page, and remove/hide other candidate pages that are not needed now.

REQUIREMENTS

1. Candidate landing

- After candidate login, redirect the candidate to “My Exams” as the default landing page.
- “My Exams” becomes the dashboard home (single source of truth for what the candidate should do now).

2. Navigation cleanup

- Update the left-side menu for Candidate Portal:
  - Keep ONLY:
    - My Exams (as Dashboard)
    - My Results
  - Remove/hide:
    - old Dashboard page
    - any other candidate pages

## Left Menu

Refactor the left Sidebar navigation structure + UI behavior.

GOALS (UI/UX)

1. Any menu item that has children (submenu) MUST be collapsed by default (closed on initial load).
2. For any parent item with children, add a chevron/arrow icon at the far right to indicate it’s collapsible.
   - Arrow rotates when expanded.
   - Clicking the parent toggles expand/collapse.
3. Keep existing styling, icons, and active route highlight behavior.
4. Do NOT keep submenus expanded by default. If you have logic that auto-expands based on current route, keep it ONLY when the current route is inside that group; otherwise keep collapsed by default.

STRUCTURE CHANGES (Navigation)
A) Rename/Move Exam Section Header

- The section title above the Exams items should be: "Exam Management"
- Remove the separate "EXAM MANAGEMENT" title that appears below the Exams section (delete it).
- Hide "Exams" item (First Item)
- Add a new item "Exam Scheduler" (Empty for now page can show "Coming soon)" as Last Item (third Item).

B) Result Group (NEW)
Create a top-level collapsible group named "Result" with these sub-items in this exact order:

1. Grading ->
2. Candidate Result
3. Certificate
4. Verify Certificate
5. Proctor Report

C) Proctor Center
After Result group, keep "Proctor Center" as it is with the same existing submenu items (do not remove any).

D) Candidates Group (NEW)
After Proctor Center, add a collapsible group named "Candidates" with these items (same order):

- Batch
- Candidates Data
- Assign to Exam
- End Exam
- Resume Exam
- Add Time
- Candidate Exam Details

E) Administration Group (NEW)
After Candidates, add a collapsible group named "Administration" with these sub-items:

- Users
- Audit Logs
- Settings

Do not change unrelated business logic.

##

Here’s an explanation of each request and the error you’re seeing:

1. /api/Assessment/exams/dropdown
   Purpose: Fetches a list of available exams to populate a filter or dropdown menu. This allows users to filter results by exam.
   Why it runs: Needed to let the user select/filter by exam on the results page.
2. /api/ExamResult/summary/candidates?pageNumber=1&pageSize=200
   Purpose: Retrieves a paginated list of candidate exam results (summary view). This is likely used to display the main table/grid of candidate results.
   Why it runs: Needed to show the list of candidates and their exam results.
3. /api/Grading?PageNumber=1&PageSize=500
   Purpose: Attempts to fetch a paginated list of grading sessions or grading data.
   Why it runs: The page or a component on it is trying to load grading information, possibly for a summary, dashboard, or to check grading status.
