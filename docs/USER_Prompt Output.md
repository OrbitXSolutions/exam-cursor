## for Exam Design :

Summary
Created the Exam Setup page with tabs controlled via query string:

Files Created
components/exam/exam-setup-content.tsx - Shared component with Configuration and Builder tabs
app/(dashboard)/exams/setup/page.tsx/exams/setup/page.tsx) - Create mode (no examId)
app/(dashboard)/exams/setup/[examId]/page.tsx - Edit mode
Files Modified
components/layout/sidebar.tsx - Added "Exam Creation" nav item
lib/i18n/translations.ts - Added "examCreation" translations (EN/AR)
Features
Tab persistence via URL: ?tab=config or ?tab=builder
Create mode (/exams/setup): Builder tab disabled with "Please save exam first" message
Edit mode (/exams/setup/[examId]): Loads exam data via getExam(), both tabs enabled
Configuration tab: Exact same UI as /exams/create (green section titles, icons, cards)
Builder tab placeholder: Shows "Welcome to Builder" + Exam ID
Real API integration: POST to create, GET to load, PUT to update
Sidebar: "Exam Creation" item placed below "Exams"
