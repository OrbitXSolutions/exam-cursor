Current Architecture (Findings)
QuestionType is a Lookup Table, NOT an Enum
Correction to your assumption: QuestionType is NOT a backend enum. It's a database lookup table (QuestionTypes) with a corresponding EF entity QuestionType (Id, NameEn, NameAr). The frontend mirrors it as an interface, not an enum.

How Types Are Used
Layer Pattern
DB QuestionTypes lookup table, FK on Questions.QuestionTypeId
Backend Validates QuestionTypeId exists in DB. No enum-based branching. Fully generic.
Frontend Create Hardcoded QUESTION_TYPE = { MCQ_SINGLE: 1, MCQ_MULTI: 2, ... } constants. Branching per ID to show different UI cards
Frontend Candidate Exam QuestionRenderer with switch on type ID → dedicated sub-components per type
Frontend Results/Grading Type-agnostic. Branches only on "has options?" vs "has textAnswer?"

Existing Infrastructure That Helps Us
QuestionAttachment entity already exists (image/PDF per question, with IsPrimary flag)
QuestionOption.AttachmentPath already exists (image per option — already prepared!)
The system already supports attachments on questions and images on options

---

The Design Decision We Need to Discuss
Your idea is an Image-Based Question — the question body contains an image/chart, and the answer format can be any existing type (MCQ Single, MCQ Multi, TrueFalse, Subjective).

There are two architectural approaches:

Option A: New Question Type (Id = 7, "ImageQuestion") — NOT Recommended
Creates a new type but then needs a sub-type to define the answer format
Breaks the clean 1:1 mapping of type → answer format
Adds a new dimension of complexity (type + sub-type)
Every frontend switch/branch needs new cases + sub-type handling
Option B: Image/Attachment is a Property of any question, NOT a type — RECOMMENDED
The question body already has a text body (BodyEn/BodyAr)
We add the concept of a "body image" (primary attachment displayed inline with the question)
Any existing type can have an image/chart in the question body
MCQ Single with image? Just attach an image to the question
Essay with chart? Same thing
MCQ with image options? QuestionOption.AttachmentPath already exists!
This approach means:

ZERO new question types in DB
ZERO changes to backend logic, validation, or grading
The current QuestionAttachment with IsPrimary = true already serves as "the main question image"
Frontend changes are purely UI: show the primary attachment image above the question body

You're right to question this. Here's what's actually happening:

MediaController (POST /api/Media/upload) — This is a generic file storage service. It saves files to wwwroot/{folder} and returns metadata (path, size, etc.). It's used for proctoring screenshots/video, but it's just a general-purpose file uploader with a ?folder= parameter to organize files into different directories.

QuestionBank attachment flow is actually a two-step process that already exists:

Step 1 — Upload the file via POST /api/Media/upload?folder=QuestionAttachments → gets back file path
Step 2 — Link it to the question via POST /api/QuestionBank/questions/{id}/attachments → saves the metadata record (CreateQuestionAttachmentDto: fileName, filePath, fileType, fileSize, isPrimary)
The QuestionBank controller doesn't accept file uploads directly — it only accepts JSON metadata ([FromBody] CreateQuestionAttachmentDto). So MediaController is the correct upload mechanism — it's not proctoring-specific, it's a shared file storage service that serves any module.

The current implementation in the create page does exactly this two-step flow correctly. No changes needed — MediaController is the right tool for the job.

## Question Attachment

now support only image
easily can support audio/video. (addsOn)

## Partial Scoring for MCQ Multi

**Status: ✅ Implemented**

### Database

- `QuestionOptions.Points` column added (`decimal(10,2)`, nullable)
- Migration: `20260403045255_AddOptionPoints`

### Backend

- `QuestionOption` entity: `decimal? Points` property
- DTOs: `Points` field on `QuestionOptionDto`, `CreateQuestionOptionDto`, `UpdateQuestionOptionDto`
- Validators: sum of option points must equal question total points (tolerance 0.01), each option points >= 0
- `QuestionBankService`: Points mapped in all CRUD paths (create, read, update, bulk update)
- `GradingService.GradeMcqAnswer()`:
  - If option points set → score = sum of points for correctly selected options
  - If option points null (legacy) → equal distribution: `total / correctCount` per correct option
  - Wrong selections = 0 (no negative penalty)

### Frontend

- Create page (`/question-bank/create`): per-option Points input + real-time sum indicator for MCQ Multi
- Edit page (`/question-bank/[id]/edit`): per-option Points input + sum indicator + validation on submit
- Types updated: `QuestionOption.points`, `CreateQuestionRequest` options include points

### Backward Compatibility

- Nullable Points field — existing questions without points continue to work with equal distribution
- No changes to MCQ Single or True/False grading

## Question with Excel
