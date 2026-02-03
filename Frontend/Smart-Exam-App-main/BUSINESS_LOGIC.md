# Smart Exam App - Business Logic & Architecture

## Application Overview
The Smart Exam App is an **enterprise-grade bilingual (English/Arabic) online examination platform** with advanced proctoring, grading, and analytics capabilities. Built with Next.js 16, TypeScript, and shadcn/ui components.

## Tech Stack
- **Framework:** Next.js 16 (with Turbopack)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **State Management:** React Context (Auth, Theme, i18n)
- **API Communication:** Custom API client with proxy pattern
- **Dev Server:** http://localhost:3000

---

## Project Structure

### Route Groups

#### 1. `app/(auth)` - Authentication
- `/login` - User authentication
- `/forgot-password` - Password recovery

#### 2. `app/(dashboard)` - Admin/Instructor Dashboard
- `/dashboard` - Overview with statistics
- `/exams` - Exam management (CRUD)
- `/exams/create` - Create new exam
- `/exams/[id]` - Edit exam details
- `/question-bank` - Question library management
- `/grading` - Manual grading center
- `/grading/[submissionId]` - Grade specific submission
- `/proctor-center` - Live proctoring monitoring
- `/users` - User management
- `/audit` - Audit log viewer
- `/reports` - Analytics and reports
- `/settings` - System settings
- `/lookups` - Manage categories, types, etc.

#### 3. `app/(candidate)` - Student/Candidate Views
- `/take-exam/[attemptId]` - Take exam interface
- `/take-exam/[attemptId]/instructions` - Exam instructions & eligibility check
- `/results/[attemptId]` - View exam results
- `/results/[attemptId]/review` - Review answers

---

## Exam Structure & Response Format

### Backend Response Structure

When a candidate starts an exam, the backend returns a comprehensive `AttemptSession` object:

```json
{
  "success": true,
  "message": "Exam started successfully",
  "data": {
    "attemptId": 42,
    "examId": 1,
    "examTitleEn": "Mathematics Final Exam",
    "examTitleAr": "الاختبار النهائي للرياضيات",
    "startedAtUtc": "2024-01-15T09:30:00Z",
    "expiresAtUtc": "2024-01-15T11:30:00Z",
    "remainingSeconds": 7200,
    "status": 0,
    "attemptNumber": 2,
    "maxAttempts": 3,
    "totalQuestions": 50,
    "answeredQuestions": 0,
    "examSettings": {
      "shuffleQuestions": true,
      "shuffleOptions": true,
      "lockPreviousSections": true,
      "preventBackNavigation": false
    },
    "sections": [...],
    "questions": [],
    "instructions": [...]
  }
}
```

### Hierarchical Structure

```
Exam (AttemptSession)
├── Sections[] (displayed as tabs)
│   ├── Section 1
│   │   ├── Topics[] (optional grouping within section)
│   │   │   ├── Topic 1
│   │   │   │   └── Questions[]
│   │   │   └── Topic 2
│   │   │       └── Questions[]
│   │   └── Questions[] (direct questions without topic)
│   └── Section 2
│       └── Questions[]
└── Questions[] (flat list if no sections)
```

### Section Object

```typescript
interface ExamSection {
  sectionId: number
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  order: number
  durationMinutes: number | null      // Section-specific timer (optional)
  remainingSeconds: number | null     // Current remaining time
  sectionStartedAtUtc: string | null  // When section was started
  sectionExpiresAtUtc: string | null  // When section expires
  totalQuestions: number
  totalPoints: number
  answeredQuestions: number
  topics: ExamTopic[]                 // Optional topic grouping
  questions: AttemptQuestionDto[]     // Direct questions (no topic)
}
```

### Topic Object

```typescript
interface ExamTopic {
  topicId: number
  titleEn: string
  titleAr: string
  order: number
  totalQuestions: number
  totalPoints: number
  answeredQuestions: number
  questions: AttemptQuestionDto[]
}
```

### Question Object

```typescript
interface AttemptQuestionDto {
  attemptQuestionId: number
  questionId: number
  sectionId: number
  topicId: number | null
  order: number
  points: number
  bodyEn: string
  bodyAr: string
  questionTypeName: string           // "MCQ Single Choice", "MCQ Multiple Choice", "Essay", etc.
  questionTypeId: number
  options: QuestionOption[]          // For MCQ questions
  attachments: QuestionAttachment[]  // Images, files
  currentAnswer: CurrentAnswer | null
}

interface QuestionOption {
  id: number
  textEn: string
  textAr: string
  order: number
  attachmentPath: string | null      // Optional image per option
}

interface CurrentAnswer {
  selectedOptionIds: number[] | null  // For MCQ
  textAnswer: string | null           // For Essay/Short Answer
}
```

### Frontend Display Logic

#### 1. Section-Based Layout (Tabs)

```
If exam.sections.length > 0:
  ┌─────────────────────────────────────────────────────────┐
  │ [Section 1] [Section 2] [Section 3]  ← Tab Navigation   │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │  Section Title                    ⏱️ 25:30 remaining   │
  │  Section Description                                    │
  │                                                         │
  │  ┌─ Topic: Algebra ─────────────────────────────────┐  │
  │  │  Q1. What is 2 + 2?                    [2 pts]   │  │
  │  │  Q2. Solve for x: 2x + 5 = 15          [3 pts]   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                         │
  │  ┌─ Topic: Geometry ────────────────────────────────┐  │
  │  │  Q3. Calculate the area...             [2 pts]   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                         │
  │  ┌─ Direct Questions (no topic) ────────────────────┐  │
  │  │  Q4. General math question...          [2 pts]   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

#### 2. Section Timer Handling

```typescript
// Frontend logic for section timing
if (section.durationMinutes !== null) {
  // Section has its own timer
  displaySectionTimer(section.remainingSeconds)
  
  if (section.remainingSeconds <= 0) {
    // Section time expired - lock it
    lockSection(section.sectionId)
    moveToNextSection()
  }
}
```

#### 3. Lock Previous Sections

```typescript
// When examSettings.lockPreviousSections = true
if (examSettings.lockPreviousSections) {
  // User cannot navigate back to completed sections
  // Once moved to Section 2, Section 1 is locked
  
  for (let i = 0; i < currentSectionIndex; i++) {
    sections[i].isLocked = true
  }
}
```

#### 4. Prevent Back Navigation

```typescript
// When examSettings.preventBackNavigation = true
if (examSettings.preventBackNavigation) {
  // User cannot go back to previous questions
  // "Previous" button is disabled
  hidePreviousButton()
}
```

### Question Type Rendering

Based on `questionTypeId` and `questionTypeName`:

| Type ID | Type Name | Render Component |
|---------|-----------|------------------|
| 1 | MCQ Single Choice | Radio buttons |
| 2 | MCQ Multiple Choice | Checkboxes |
| 3 | True/False | Radio (True/False) |
| 4 | Short Answer | Text input |
| 5 | Essay | Textarea (multiline) |
| 6 | Fill in the Blank | Inline text inputs |

#### MCQ Single Choice (Radio Buttons)
```tsx
<RadioGroup value={selectedOptionId} onValueChange={handleSelect}>
  {options.map(opt => (
    <RadioGroupItem key={opt.id} value={opt.id}>
      {getLocalizedText(opt, 'text', language)}
      {opt.attachmentPath && <img src={opt.attachmentPath} />}
    </RadioGroupItem>
  ))}
</RadioGroup>
```

#### MCQ Multiple Choice (Checkboxes)
```tsx
{options.map(opt => (
  <Checkbox
    key={opt.id}
    checked={selectedOptionIds.includes(opt.id)}
    onCheckedChange={(checked) => handleMultiSelect(opt.id, checked)}
  >
    {getLocalizedText(opt, 'text', language)}
  </Checkbox>
))}
```

#### Essay / Short Answer (Textarea)
```tsx
<Textarea
  value={textAnswer}
  onChange={(e) => handleTextChange(e.target.value)}
  placeholder={t('exam.typeAnswer')}
  rows={questionTypeId === 5 ? 10 : 3}  // More rows for essay
/>
```

### Answer Auto-Save

```typescript
// Auto-save on every change
async function saveAnswer(questionId: number, answer: SaveAnswerRequest) {
  try {
    await apiClient.post(`/Candidate/attempts/${attemptId}/questions/${questionId}/answer`, {
      selectedOptionIds: answer.selectedOptionIds,  // For MCQ
      textAnswer: answer.textAnswer                 // For Essay/Short Answer
    })
  } catch (error) {
    // Queue for retry, show warning
    toast.warning(t('exam.saveError'))
  }
}

// Debounce text input (essay/short answer)
const debouncedSave = useMemo(
  () => debounce((questionId, answer) => saveAnswer(questionId, answer), 500),
  [attemptId]
)
```

### Question Body Rendering

```typescript
function renderQuestionBody(question: AttemptQuestionDto, language: string) {
  const body = language === 'ar' ? question.bodyAr : question.bodyEn
  
  return (
    <div className="question-body">
      {/* Support rich text / HTML */}
      <div dangerouslySetInnerHTML={{ __html: body }} />
      
      {/* Attachments (images, files) */}
      {question.attachments.map(att => (
        <img key={att.id} src={att.filePath} alt="Question attachment" />
      ))}
    </div>
  )
}
```

#### 4. `app/` - Public Routes
- `/` - Landing page with features showcase
- `/faq` - Frequently asked questions

---

## Core Business Logic

### 1. User Roles & Permissions

```typescript
enum UserRole {
  Candidate       // Takes exams
  Instructor      // Creates/manages exams, grades submissions
  Admin           // Full system access, user management
  SuperAdmin      // Highest privileges
  ProctorReviewer // Reviews proctoring incidents
  Auditor         // Views audit logs only
}
```

**Role Hierarchy:**
- **SuperAdmin** > **Admin** > **Instructor** > **ProctorReviewer** / **Auditor** > **Candidate**

---

### 2. Exam Types

```typescript
enum ExamType {
  Flex = 0   // Candidate can start anytime within availability window
  Fixed = 1  // All candidates must start at exact StartAt time
}
```

**Flex Exam:** 
- Available from `startAt` to `endAt`
- Each candidate can start when ready
- Duration counted from individual start time

**Fixed Exam:**
- All candidates must begin at `startAt`
- Synchronized timer for all participants
- Late joiners cannot participate

---

### 3. Exam Workflow

#### A. Exam Creation (Instructor/Admin)

**Step 1: Basic Information**
- Title (English & Arabic)
- Description (bilingual)
- Exam type (Flex/Fixed)
- Department assignment
- Time window (startAt, endAt)
- Duration in minutes
- Maximum attempts allowed
- Passing score percentage

**Step 2: Settings Configuration**

*Proctoring Settings:*
- `requireProctoring` - Enable monitoring
- `requireIdVerification` - Verify candidate identity
- `requireWebcam` - Mandate camera access

*Security Settings:*
- `preventCopyPaste` - Block clipboard operations
- `preventScreenCapture` - Disable screenshots
- `requireFullscreen` - Force fullscreen mode
- `browserLockdown` - Restrict browser features

*Question Display:*
- `shuffleQuestions` - Randomize question order
- `shuffleOptions` - Randomize answer options

*Results & Review:*
- `showResults` - Display results to candidates
- `allowReview` - Enable answer review
- `showCorrectAnswers` - Show correct solutions

**Step 3: Structure Setup**
- Create sections (logical grouping)
- Add topics within sections (optional sub-grouping)
- Set section-specific timers (optional)

**Step 4: Question Assignment**
- Browse question bank
- Filter by category, type, difficulty
- Add questions to sections/topics
- Override points per question (optional)
- Set question requirements

**Step 5: Instructions & Access**
- Add exam instructions (bilingual)
- Set access policy:
  - Public or restricted
  - Access code (optional)
  - Assign specific candidates

**Step 6: Publish**
- Set `isPublished = true`
- Set `isActive = true`
- Exam becomes available to candidates

---

#### B. Taking Exam (Candidate)

**Phase 1: Discovery**
1. Candidate logs in
2. Views dashboard with available exams
3. Sees eligibility status:
   - ✅ Can start now
   - ⏰ Not yet available
   - 🔒 Attempts exhausted
   - 📝 Active attempt in progress

**Phase 2: Preparation**
1. Click exam to view instructions
2. System checks:
   - Time window validity
   - Attempts remaining
   - Access code (if required)
   - Prerequisites met
3. Review instructions and requirements
4. Accept terms & conditions

**Phase 3: Exam Session**
1. Click "Start Exam" → Backend creates `AttemptSession`
2. System redirects to `/take-exam/[attemptId]`
3. Timer starts counting down
4. Candidate answers questions with:
   - **Navigation:** Section tabs, question grid
   - **Answer Types:** MCQ, True/False, Essay, Short Answer
   - **Features:** Flag questions, auto-save answers
   - **Restrictions:** Based on exam settings

**Phase 4: Submission**
1. Click "Submit Exam" → Confirmation dialog
2. Backend processes submission:
   - Status → `Submitted`
   - Auto-grade MCQ/True-False
   - Queue manual grading for essays
3. Redirect to results (if enabled)

---

#### C. Grading System

**Auto-Grading (Immediate):**
- Multiple Choice (single answer)
- Multiple Choice (multiple answers)
- True/False
- Matching questions

**Manual Grading (Instructor Review):**
- Essay questions
- Short answer questions
- Fill in the blank (context-dependent)

**Grading Workflow:**
1. Submission enters grading queue
2. Auto-gradable questions scored immediately
3. Status: `PendingManualGrading` if manual questions exist
4. Instructor accesses grading center
5. Reviews candidate answers
6. Assigns points based on rubric
7. Adds feedback (optional)
8. Finalizes grade
9. Status → `Completed`
10. Results published to candidate (if enabled)

**Grading Status Enum:**
```typescript
enum GradingStatus {
  Pending = 0                // Just submitted
  InProgress = 1             // Instructor reviewing
  Completed = 2              // All questions graded
  RequiresManualGrading = 3  // Has ungraded questions
}
```

---

#### D. Results & Review

**Results Display:**
- Overall score (percentage & points)
- Pass/Fail status
- Time taken
- Section breakdown
- Question statistics

**Review Mode (if enabled):**
- View all questions with answers
- See correct answers (if enabled)
- Review feedback from grader
- Cannot modify answers

---

### 4. Proctoring System

#### Proctoring Modes

```typescript
enum ProctorMode {
  None = 0  // No monitoring
  Soft = 1  // Warnings logged, no enforcement
  Hard = 2  // Violations can invalidate exam
}
```

#### Event Tracking

**System Events (Auto-detected):**
- `TabSwitch` - Candidate switched browser tabs
- `WindowBlur` - Window lost focus
- `WindowFocus` - Window regained focus
- `FullscreenExit` - Exited fullscreen mode
- `FullscreenEnter` - Entered fullscreen mode
- `CopyAttempt` - Tried to copy text
- `PasteAttempt` - Tried to paste text
- `RightClick` - Context menu attempt
- `KeyboardShortcut` - Suspicious shortcuts
- `BrowserResize` - Window resized
- `NetworkDisconnect` - Lost internet
- `NetworkReconnect` - Regained internet

**AI-Powered Detection (if enabled):**
- `FaceNotDetected` - No face in webcam
- `MultipleFaces` - Multiple people detected
- `AudioDetected` - Suspicious audio/voices
- `ScreenshareStarted` - Screen sharing detected

#### Severity Levels

```typescript
enum Severity {
  Info = 0      // Informational only
  Low = 1       // Minor concern
  Medium = 2    // Moderate concern
  High = 3      // Serious violation
  Critical = 4  // Major integrity breach
  Severe = 5    // Automatic invalidation
}
```

#### Incident Management

**Incident Workflow:**
1. Event detected → Logged automatically
2. Assigned severity based on rules
3. ProctorReviewer notified (if threshold reached)
4. Reviewer investigates with evidence:
   - Timestamps
   - Screenshots
   - Webcam captures
   - Audio recordings
5. Makes decision:
   - `Cleared` - False positive
   - `Suspicious` - Flagged for review
   - `Invalidated` - Exam canceled
   - `RequiresReview` - Escalate

**Evidence Types:**
```typescript
enum EvidenceType {
  Webcam = 0      // Webcam snapshot
  Screen = 1      // Screen capture
  Audio = 2       // Audio recording
  Screenshot = 3  // System screenshot
  Photo = 4       // ID verification photo
}
```

---

### 5. Question Bank

#### Question Types

1. **Multiple Choice (Single Answer)**
   - One correct option
   - Auto-gradable

2. **Multiple Choice (Multiple Answers)**
   - Multiple correct options
   - Auto-gradable (all or nothing or partial credit)

3. **True/False**
   - Binary choice
   - Auto-gradable

4. **Short Answer**
   - Brief text response
   - Manual grading

5. **Essay**
   - Long-form response
   - Manual grading

6. **Fill in the Blank**
   - Text completion
   - Can be auto or manual

#### Question Organization

**Categories:**
- Math
- Science
- Programming
- Language
- Business
- Engineering
- Custom categories

**Difficulty Levels:**
```typescript
enum DifficultyLevel {
  Easy = 1
  Medium = 2
  Hard = 3
}
```

**Question Fields:**
- Body (English & Arabic)
- Question type
- Category
- Difficulty
- Points (default, can be overridden in exam)
- Options (for MCQ)
- Attachments (images, files)
- Tags (for search)
- Active status

---

### 6. API Architecture

#### Proxy Pattern

```
Frontend (localhost:3000) 
    ↓
/api/proxy/* 
    ↓
Backend API (configured endpoint)
```

**Benefits:**
- CORS handling
- Request/response transformation
- Centralized error handling
- Token management
- Mock data fallback for development

#### Authentication Flow

1. **Login:**
   ```
   POST /api/proxy/Auth/login
   Body: { email, password }
   Response: { accessToken, refreshToken, expiration, user }
   ```

2. **Token Storage:**
   ```javascript
   localStorage.setItem('auth_token', accessToken)
   localStorage.setItem('user', JSON.stringify(user))
   ```

3. **Authenticated Requests:**
   ```
   Headers: { Authorization: 'Bearer <accessToken>' }
   ```

4. **Token Expiry:**
   - 401 response → Clear token → Redirect to login

5. **Refresh Token (Future):**
   ```
   POST /api/proxy/Auth/refresh
   Body: { refreshToken }
   ```

#### Key API Endpoints

**Candidate Endpoints:**
```
GET    /Candidate/dashboard              # Dashboard stats
GET    /Candidate/exams                  # Available exams
GET    /Candidate/exams/{id}/preview     # Exam details
POST   /Candidate/exams/{id}/start       # Start attempt
GET    /Candidate/attempts/{id}          # Get session
POST   /Candidate/attempts/{id}/answer   # Save answer
POST   /Candidate/attempts/{id}/submit   # Submit exam
GET    /Candidate/attempts/{id}/result   # Get results
```

**Assessment (Exam) Endpoints:**
```
GET    /Assessment/exams                      # List exams
POST   /Assessment/exams                      # Create exam
GET    /Assessment/exams/{id}                 # Get exam
PUT    /Assessment/exams/{id}                 # Update exam
DELETE /Assessment/exams/{id}                 # Delete exam
POST   /Assessment/exams/{id}/sections        # Add section
POST   /Assessment/sections/{id}/topics       # Add topic
POST   /Assessment/sections/{id}/questions    # Add questions
```

**Grading Endpoints:**
```
GET    /Grading/pending                   # Pending submissions
GET    /Grading/submissions/{id}          # Submission details
POST   /Grading/submissions/{id}/grade    # Submit grades
```

**Proctoring Endpoints:**
```
GET    /Proctoring/sessions               # Live sessions
GET    /Proctoring/sessions/{id}          # Session details
GET    /Proctoring/events/{attemptId}     # Proctoring events
POST   /Proctoring/incidents              # Log incident
PUT    /Proctoring/incidents/{id}         # Update decision
```

---

### 7. Attempt States

```typescript
enum AttemptStatus {
  NotStarted = 0  // Not yet begun
  InProgress = 1  // Currently taking exam
  Submitted = 2   // Submitted for grading
  TimedOut = 3    // Time expired (auto-submit)
  Cancelled = 4   // Canceled by admin
}
```

**State Transitions:**
```
NotStarted → InProgress (on start)
InProgress → Submitted (on submit)
InProgress → TimedOut (timer expires)
InProgress → Cancelled (admin action)
```

---

### 8. Timer Management

#### Exam-Level Timer
- Counts down from `durationMinutes`
- Displayed prominently in UI
- Auto-submit when reaches 0
- Synced with backend periodically

#### Section-Level Timer (Optional)
- Individual timer per section
- When expires, section locks
- Cannot return to previous section
- Useful for timed section exams

#### Timer Sync Strategy
- Frontend manages display timer
- Backend tracks authoritative time
- Periodic sync every 30 seconds
- On answer save, get updated timer
- Prevents time manipulation

---

### 9. Data Models (Key Interfaces)

#### User
```typescript
interface User {
  id: string
  email: string
  fullNameEn: string
  fullNameAr: string
  role: UserRole
  isActive: boolean
  createdDate: string
  avatarUrl?: string
}
```

#### Exam
```typescript
interface Exam {
  id: number
  departmentId: number
  examType: ExamType
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  startAt: string | null
  endAt: string | null
  durationMinutes: number
  maxAttempts: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  passScore: number
  isPublished: boolean
  isActive: boolean
  showResults: boolean
  allowReview: boolean
  showCorrectAnswers: boolean
  requireProctoring: boolean
  requireIdVerification: boolean
  requireWebcam: boolean
  preventCopyPaste: boolean
  preventScreenCapture: boolean
  requireFullscreen: boolean
  browserLockdown: boolean
  sectionsCount: number
  questionsCount: number
  totalPoints: number
  sections: ExamSection[]
  instructions: ExamInstruction[]
  accessPolicy: ExamAccessPolicy | null
}
```

#### AttemptSession
```typescript
interface AttemptSession {
  attemptId: number
  examId: number
  examTitleEn: string
  examTitleAr: string
  startedAtUtc: string
  expiresAtUtc: string
  remainingSeconds: number
  totalQuestions: number
  answeredQuestions: number
  status: AttemptStatus
  attemptNumber: number
  maxAttempts: number
  examSettings: ExamSettings
  sections: ExamSection[]
  questions: AttemptQuestionDto[]
  instructions: ExamInstructionDto[]
}

interface ExamSettings {
  shuffleQuestions: boolean
  shuffleOptions: boolean
  lockPreviousSections: boolean
  preventBackNavigation: boolean
}

interface ExamSection {
  sectionId: number
  titleEn: string
  titleAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  order: number
  durationMinutes: number | null
  remainingSeconds: number | null
  sectionStartedAtUtc: string | null
  sectionExpiresAtUtc: string | null
  totalQuestions: number
  totalPoints: number
  answeredQuestions: number
  topics: ExamTopic[]
  questions: AttemptQuestionDto[]
}

interface ExamTopic {
  topicId: number
  titleEn: string
  titleAr: string
  order: number
  totalQuestions: number
  totalPoints: number
  answeredQuestions: number
  questions: AttemptQuestionDto[]
}

interface AttemptQuestionDto {
  attemptQuestionId: number
  questionId: number
  sectionId: number
  topicId: number | null
  order: number
  points: number
  bodyEn: string
  bodyAr: string
  questionTypeName: string
  questionTypeId: number
  options: QuestionOption[]
  attachments: QuestionAttachment[]
  currentAnswer: CurrentAnswer | null
}

interface QuestionOption {
  id: number
  textEn: string
  textAr: string
  order: number
  attachmentPath: string | null
}

interface CurrentAnswer {
  selectedOptionIds: number[] | null
  textAnswer: string | null
}
```

---

### 10. Security Features

#### Browser Security
- Fullscreen enforcement
- Right-click disabled
- Copy/paste prevention
- Keyboard shortcuts blocked
- DevTools detection
- Print disabled

#### Network Security
- JWT token authentication
- HTTPS enforcement
- CORS policies
- API rate limiting
- XSS prevention
- SQL injection protection

#### Exam Integrity
- Question shuffling
- Option randomization
- Time tracking
- Answer encryption
- Session validation
- IP tracking
- Device fingerprinting

---

### 11. Internationalization (i18n)

#### Supported Languages
- English (en)
- Arabic (ar)

#### RTL Support
- Layout direction switching
- Text alignment
- Icon mirroring
- Date/time formatting

#### Translation Keys
Organized by feature:
- `auth.*` - Authentication
- `dashboard.*` - Dashboard
- `exams.*` - Exam management
- `questions.*` - Question bank
- `grading.*` - Grading center
- `proctoring.*` - Proctoring
- `candidate.*` - Candidate views

---

### 12. Known Issues & Limitations

#### High Priority
1. **Department ID Auto-fill**
   - Backend requires `departmentId` in exam creation
   - Should auto-fill from authenticated user
   - **Workaround:** Frontend hardcodes `departmentId: 1`

#### Medium Priority
2. **Create Section 500 Error**
   - Backend returns 500 when creating sections
   - May be related to `null` value handling
   - **Status:** Under investigation

3. **Duplicate Question Handling**
   - Currently throws error when adding duplicate
   - **Expected:** Skip duplicates silently with message
   - **Status:** Backend update planned

---

## Development Guidelines

### Code Organization
- **Components:** Reusable UI in `/components`
- **API Logic:** Separated by feature in `/lib/api`
- **Types:** Centralized in `/lib/types`
- **Utils:** Helper functions in `/lib/utils.ts`
- **Hooks:** Custom hooks in component files
- **Contexts:** Auth, Theme, i18n in `/lib/*/context.tsx`

### Best Practices
1. Use TypeScript strictly (no `any`)
2. Follow component composition pattern
3. Implement error boundaries
4. Add loading states
5. Handle edge cases
6. Write bilingual content
7. Test with different roles
8. Validate user input
9. Log important actions
10. Document complex logic

### Performance Optimization
- React.memo for expensive renders
- useMemo for computed values
- useCallback for event handlers
- Code splitting with dynamic imports
- Image optimization
- API response caching
- Debounce user input
- Virtualize long lists

---

## Future Enhancements

### Planned Features
- [ ] Question import/export (CSV, Excel)
- [ ] Bulk exam scheduling
- [ ] Advanced analytics dashboard
- [ ] Integration with LMS (Moodle, Canvas)
- [ ] Mobile app (React Native)
- [ ] Offline exam mode
- [ ] AI-powered question generation
- [ ] Plagiarism detection
- [ ] Video proctoring with AI
- [ ] Certificate generation
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Custom branding/white-label
- [ ] Multi-tenancy support
- [ ] API documentation (Swagger)

---

## Deployment

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://examapp.example.com
```

### Build Process
```bash
pnpm install
pnpm build
pnpm start
```

### Hosting Options
- Vercel (recommended for Next.js)
- AWS (EC2, ECS, Lambda)
- Azure App Service
- Google Cloud Run
- Self-hosted (Docker)

---

## Support & Documentation

### Resources
- **Frontend Repository:** OrbitXSolutions/Smart-Exam-App
- **Backend API:** (Configure endpoint)
- **Design System:** shadcn/ui
- **Icons:** Lucide React

### Contact
For technical support or questions about the business logic, refer to the development team.

---

**Last Updated:** January 18, 2026
**Version:** 1.0
**Author:** Development Team
