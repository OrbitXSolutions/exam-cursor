# Smart Exam System - Project Status

**Last Updated:** 2026-01-31

### Latest: All next steps completed
- Certificates migration applied
- Webcam snapshot capture during exam (every 90s)
- CSV export on Reports page
- i18n for verify-certificate, reports.finalizedAt, reports.noCandidates, certificate.*

---

## 1. Pages & Routes

### Frontend (Next.js 16)

| Route | Purpose | API Used | Status |
|-------|---------|----------|--------|
| `/` | Landing page | - | ✅ |
| `/login` | Login | Auth/login | ✅ |
| `/forgot-password` | Password reset | - | ✅ |
| `/my-exams` | Candidate exam list + active attempts | getAvailableExams, getDashboard | ✅ Real API |
| `/take-exam/[examId]/instructions` | Exam instructions + start | getExamPreview, startExam | ✅ Real API |
| `/take-exam/[attemptId]` | Take exam (questions, timer, submit) | getAttemptSession, saveAnswers, submitAttempt, logAttemptEvent | ✅ Real API |
| `/results/[attemptId]` | View result summary | getMyResult | ✅ Real API |
| `/results/[attemptId]/review` | Review answers (if allowed) | getMyResultReview | ✅ Real API |
| `/my-results` | All results history | getMyResults | ✅ Real API |
| `/grading` | Manual grading queue | getManualGradingRequired | ✅ Real API |
| `/grading/[attemptId]` | Grade submission | getGradingSessionByAttempt, submitManualGrade, completeGrading | ✅ Real API |
| `/verify-certificate` | Public certificate verification | verifyCertificate | ✅ Real API |
| `/dashboard` | Admin dashboard | - | ✅ |
| `/exams` | Exam management | Assessment API | ✅ |
| `/question-bank` | Question management | QuestionBank API | ✅ |
| `/users` | User management | Users API | ✅ |
| `/proctor-center` | Proctor monitoring | Proctor API (partial) | ⚠️ May use mock |
| `/reports` | Reports/analytics | getResultDashboard, getExamResults | ✅ Real API |
| `/audit` | Audit logs | Audit API | ⚠️ |
| `/settings` | System settings | - | ⚠️ |
| `/lookups` | Lookups (categories, types) | Lookups API | ✅ |

### Static or Mocked
- **Proctor monitoring UI**: May partially use mock data
- **Settings**: May use mock

---

## 2. Backend APIs

### Endpoints Used by Frontend

#### Auth
- `POST /api/Auth/login`
- `POST /api/Auth/refresh-token`

#### Candidate (requires Candidate role)
- `GET /api/Candidate/exams`
- `GET /api/Candidate/exams/{examId}/preview`
- `POST /api/Candidate/exams/{examId}/start`
- `GET /api/Candidate/attempts/{attemptId}/session`
- `PUT /api/Candidate/attempts/{attemptId}/answers`
- `POST /api/Candidate/attempts/{attemptId}/submit`
- `GET /api/Candidate/results/my-result/{attemptId}`
- `GET /api/Candidate/results/my-result/{attemptId}/review`
- `GET /api/Candidate/dashboard`

#### Attempt (authenticated)
- `GET /api/Attempt/{attemptId}/timer`
- `POST /api/Attempt/{attemptId}/events` (for proctoring events)

#### Grading (Admin/Instructor)
- `GET /api/Grading/manual-required`
- `GET /api/Grading/attempt/{attemptId}`
- `GET /api/Grading/{sessionId}/manual-queue`
- `POST /api/Grading/manual-grade`
- `POST /api/Grading/complete`

#### ExamResult (Admin/Instructor)
- `POST /api/ExamResult/finalize/{gradingSessionId}` (called after CompleteGrading)

#### Assessment, QuestionBank, Lookups, Users, etc.
- All existing endpoints as documented in `docs/`

---

## 3. Backend Changes (This Session)

| File | Change |
|------|--------|
| `CandidateService.cs` | Injected IGradingService, IExamResultService. Auto-trigger grading on SubmitAttempt. Auto-finalize and publish if fully auto-graded. |
| `AttemptEnums.cs` | Added WindowBlur, WindowFocus, CopyAttempt, PasteAttempt, RightClickAttempt event types |
| `GAP_ANALYSIS.md` | Created - comprehensive gap analysis |

---

## 4. Frontend Changes (This Session)

| File | Change |
|------|--------|
| `lib/api/candidate.ts` | logAttemptEvent now calls Attempt API; AttemptEventType aligned with backend |
| `lib/api/grading.ts` | Rewritten - real API: getManualGradingRequired, getGradingSessionByAttempt, submitManualGrade, completeGrading (includes ExamResult/finalize) |
| `app/(dashboard)/grading/page.tsx` | Replaced MOCK with real getManualGradingRequired API |
| `app/(dashboard)/grading/[submissionId]/page.tsx` | Replaced mock with real grading APIs; uses attemptId as param |
| `app/(dashboard)/my-exams/page.tsx` | Added getDashboard for QuickActions (resume active attempts); fixed resume link to use attemptId |
| `app/(candidate)/take-exam/[attemptId]/exam-page.tsx` | Updated AttemptEventType.TabSwitch → TabSwitched, WindowBlur → FullscreenExited |

---

## 5. Remaining TODOs

### High Priority
- [x] **Certificates module**: Entity, migration, service, endpoints, UI (candidate download, verify page, admin manage) ✅
- [x] **Proctoring snapshots**: POST /Proctor/snapshot/{attemptId} for multipart upload; uploadProctorSnapshot() in lib/api/proctoring.ts ✅
- [ ] **Publish result after grading**: Currently result is created but not auto-published; admin must publish from ExamResult UI (or add auto-publish when exam.ShowResults)

### Medium Priority
- [x] **Admin reports dashboard**: Reports page connected to ExamResult/dashboard and ExamResult/exam/{id} APIs ✅
- [ ] **Proctor monitoring UI**: Connect to real sessions, events, evidence
- [ ] **i18n translations**: Verify all new strings have Arabic translations

### Low Priority
- [ ] **Automated tests**: Create `Smart_Core.Tests` project. Key areas: CandidateService.SubmitAttemptAsync (grading trigger), GradingService.InitiateGradingAsync, AttemptService.SaveAnswerAsync. Frontend: Playwright/Vitest smoke tests for login, my-exams, take-exam flow.
- [ ] **CI/CD pipeline**
- [ ] **Production security review**

---

## 6. Known Issues / Notes

- Backend uses SQL Server (remote or local). Connection string in `appsettings.json`.
- Frontend proxy: `.env.local` has `BACKEND_URL=http://localhost:5221/api` for local dev.
- Grading page: submissionId in URL is actually `attemptId` (for consistency with getGradingSessionByAttempt).
- my-exams dashboard: getDashboard requires Candidate role; Admin/Instructor may get 403, in which case QuickActions will be empty.
- Result visibility: Candidate only sees result after it is published (ExamResultController.PublishResult).
