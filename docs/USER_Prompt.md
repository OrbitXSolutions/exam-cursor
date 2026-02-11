You are my partner and senior software engineer.

We have a business demo in 24 hours.
The goal is to successfully demonstrate the system to business users and PMO — not to perfect the full backend.

Time is extremely limited.
We will work smart, professional, and demo-focused.

Rules:

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
