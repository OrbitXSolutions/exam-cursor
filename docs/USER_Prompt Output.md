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

## Builder Tab

Summary
I've successfully implemented the Builder Tab (Tab 2) for the Exam Setup page with full backend API integration:

Backend Changes:
AssessmentEnums.cs - Added SectionSourceType enum (Subject=1, Topic=2)

ExamSection.cs - Extended with builder fields:

SourceType (SectionSourceType?)
QuestionSubjectId (int?)
QuestionTopicId (int?)
PickCount (int)
Navigation properties for QuestionSubject/QuestionTopic
ExamSectionConfiguration.cs - Added FK relationships and indexes

ExamBuilderDtos.cs - New DTOs: ExamBuilderDto, BuilderSectionDto, SaveExamBuilderRequest, SaveBuilderSectionDto, QuestionsCountResponse

QuestionBankService.cs - Added GetQuestionsCountAsync method

QuestionBankController.cs - Added GET questions/count?subjectId=...&topicId=...

AssessmentService.cs - Added GetExamBuilderAsync and SaveExamBuilderAsync with validation

AssessmentController.cs - Added builder endpoints:

GET /api/Assessment/exams/{examId}/builder
PUT /api/Assessment/exams/{examId}/builder
Migration - Created AddExamSectionBuilderFields migration and applied to database

Frontend Changes:
types/index.ts - Added SectionSourceType enum and builder interfaces

api/exams.ts - Added getExamBuilder, saveExamBuilder, getQuestionsCount functions

ui/accordion.tsx - Created accordion component (shadcn/ui)

exam-setup-content.tsx - Full Builder Tab implementation with:

"By Subject" / "By Topic" radio selection
Multi-select subjects with checkbox grid
Accordion-style topics selection (for Topic mode)
Section cards with title, duration, and PickCount inputs
Real-time available questions count
Save/Load builder configuration
Validation and error handling
