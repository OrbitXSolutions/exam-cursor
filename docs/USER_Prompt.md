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
