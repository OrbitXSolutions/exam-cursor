# Smart Exam System - Gap Analysis

**Date:** 2026-01-31  
**Scope:** Production readiness for Candidate, Grading, Certificates, Proctoring, Reports

---

## 1. Current State Summary

### Backend (ASP.NET Core 9, Clean Architecture)

| Module | Controller | Status | Notes |
|--------|------------|--------|-------|
| Auth | AuthController | ✅ Complete | JWT, login, refresh |
| Question Bank | QuestionBankController | ✅ Complete | CRUD, categories, types |
| Assessment | AssessmentController | ✅ Complete | Exams, sections, topics, publish |
| Candidate | CandidateController | ✅ Complete | exams, preview, start, session, save answers, submit, results, dashboard |
| Attempt | AttemptController | ✅ Complete | start, session, timer, save (single+bulk), submit, events |
| Grading | GradingController | ✅ Complete | initiate, manual grade, complete, queue |
| ExamResult | ExamResultController | ✅ Complete | finalize, publish, reports |
| Proctor | ProctorController | ✅ Complete | sessions, events, evidence, decisions |
| Incident | IncidentController | ✅ Complete | |
| Audit | AuditController | ✅ Complete | |
| Lookups | LookupsController | ✅ Complete | |
| Users/Roles | UsersController, RolesController | ✅ Complete | |

### Frontend (Next.js 16, React 19)

| Page/Route | Status | API Used |
|------------|--------|----------|
| /login | ✅ | Auth |
| /my-exams | ✅ Real API | getAvailableExams |
| /take-exam/[examId]/instructions | ✅ Real API | getExamPreview, startExam |
| /take-exam/[attemptId] | ✅ Real API | getAttemptSession, saveAnswers, submitAttempt |
| /results/[attemptId] | ✅ Real API | getMyResult |
| /results/[attemptId]/review | ✅ Real API | getMyResultReview |
| /my-results | ? | getMyResults |
| /grading | ❌ **MOCK** | MOCK_SUBMISSIONS |
| /grading/[submissionId] | ? | Needs real API |
| /proctor-center | ? | May use mock |
| /reports | ? | |
| Certificates | ❌ **MISSING** | N/A |

---

## 2. Gap Analysis by Deliverable

### A) Candidate Module (Exam Taking Experience)

| Item | Backend | Frontend | Gap |
|------|---------|----------|-----|
| List available exams | ✅ | ✅ | None |
| Exam preview + instructions | ✅ | ✅ | None |
| Access code validation | ✅ | ✅ | None |
| Start attempt | ✅ | ✅ | None |
| Resume attempt | ✅ | Partial | my-exams doesn't show QuickActions (active attempts) from dashboard API |
| Timer with server sync | ✅ Attempt/{id}/timer | ⚠️ Uses session | Candidate API has no timer - uses session. Frontend derives from session. OK. |
| Save answer (single + bulk) | ✅ | ✅ | None |
| Autosave | N/A | ⚠️ | Frontend may need debounced autosave - verify |
| Submit flow | ✅ | ✅ | None |
| Result page | ✅ | ✅ | None |
| Review (showCorrectAnswers) | ✅ | ✅ | None |
| lockPreviousSections / preventBackNavigation | ✅ | ✅ | In exam-page |
| **logAttemptEvent** | ✅ Attempt API | ❌ Returns true locally | Frontend does NOT call backend for events |

### B) Attempt & Answer Saving

| Item | Status | Gap |
|------|--------|-----|
| MaxAttempts enforcement | ✅ CandidateService | None |
| Flex vs Fixed timing | ✅ | None |
| Autosave concurrency | ✅ Idempotent bulk save | None |
| Expired attempts | ✅ | None |
| **Auto-trigger grading on submit** | ❌ | **SubmitAttempt does NOT call InitiateGrading** |

### C) Submission Flow

| Item | Status | Gap |
|------|--------|-----|
| Submit endpoint | ✅ | None |
| Grading initiation | ❌ | Must be triggered after submit |

### D) Result & Grading Workflow

| Item | Backend | Frontend | Gap |
|------|---------|----------|-----|
| Auto-grade objective (MCQ, T/F, Numeric) | ✅ GradingService | N/A | None |
| Manual grading queue | ✅ | ❌ Uses MOCK | Connect grading page to API |
| Reviewer override + feedback | ✅ | ❌ | Grading detail page needs real API |
| Finalize result | ✅ | ❌ | |
| Publish/unpublish results | ✅ | ? | |

### E) Reviewer/Grader Module

| Item | Status | Gap |
|------|--------|-----|
| Queue of attempts needing manual grading | ✅ GET manual-required | ❌ Frontend mocked | Connect to Grading/manual-required |
| View attempt answers per section | ✅ | ❌ | Implement in grading/[id] |
| Input scores + feedback | ✅ | ❌ | |
| Finalize result | ✅ | ❌ | |
| ProctorReviewer role | ⚠️ | ProctorController uses "ProctorReviewer" | Verify role exists in seed |

### F) Certificates Module

| Item | Status | Gap |
|------|--------|-----|
| Certificate entity | ❌ | **Does not exist** | Create entity, migration |
| Generate PDF/template | ❌ | | |
| Unique certificate code | ❌ | | |
| Verification endpoint | ❌ | | |
| Store metadata | ❌ | | |
| Candidate download | ❌ | | |
| Admin re-generate/revoke | ❌ | | |

### G) Proctoring Module

| Item | Backend | Frontend | Gap |
|------|---------|----------|-----|
| ProctorSession creation | ✅ | ? | |
| Events (tab switch, blur, copy/paste) | ✅ Attempt/events, Proctor/event | ❌ logAttemptEvent is local | Call Attempt API or Proctor API |
| Webcam snapshots upload | ✅ Proctor Evidence (request-upload flow) | ❌ | Need simpler blob upload for snapshots |
| Evidence storage | ✅ | | ProctorEvidence uses EvidenceType - check for Snapshot |
| Live proctor view | ✅ live/exam/{id} | ? | MVP |
| Monitoring list | ✅ sessions | ? | |

### H) Admin Reports & Analytics

| Item | Status | Gap |
|------|--------|-----|
| Attempts by exam | ✅ | ? | |
| Pass rate | ✅ ExamResult reports | ? | |
| Average score | ✅ | ? | |
| Suspicious events count | ? | | May need aggregation |
| Dashboard stats | ? | | |
| Export CSV | ? | | |

### I) Production Readiness

| Item | Status | Gap |
|------|--------|-----|
| Input validation | ✅ FluentValidation | | |
| Authorization | ✅ Roles on controllers | | |
| Logging | ✅ Serilog | | |
| Error handling | ✅ Global middleware | | |
| File upload security | ? | | Verify MediaController |
| Paging for lists | ✅ | | |
| CI/CD | ? | | |
| Tests | ? | | Minimal/none |

---

## 3. Implementation Priority

### Phase 1 (Critical - Unblocks candidate flow)
1. **Auto-trigger grading on SubmitAttempt** - CandidateService.SubmitAttemptAsync should call GradingService.InitiateGradingAsync
2. **logAttemptEvent** - Frontend should call Attempt API POST attempts/{id}/events
3. **QuickActions** - my-exams should fetch dashboard for active attempts, show "Resume" link

### Phase 2 (Grading UI)
4. **Grading page** - Replace MOCK with getManualGradingRequired API
5. **Grading detail page** - Connect to real grading APIs (submission, manual grade, finalize)

### Phase 3 (Certificates)
6. **Certificate entity + migration**
7. **Certificate service + endpoints**
8. **Certificate UI** (candidate + admin)

### Phase 4 (Proctoring MVP)
9. **Webcam snapshot upload** - Simple POST multipart for snapshots
10. **Frontend event logging** - Call Attempt/events on tab switch, blur, etc.
11. **Proctor monitoring UI** - Sessions, events timeline, snapshots gallery

### Phase 5 (Reports)
12. **Admin reports dashboard** - Attempts, pass rate, suspicious events
13. **Export CSV** (if easy)

### Phase 6 (Production)
14. **PROJECT_STATUS.md, RUNBOOK.md**
15. **Basic tests**
16. **Security review**

---

## 4. API Route Reference

### Candidate (all require Candidate role)
- GET /api/Candidate/exams
- GET /api/Candidate/exams/{examId}/preview
- POST /api/Candidate/exams/{examId}/start
- GET /api/Candidate/attempts/{attemptId}/session
- PUT /api/Candidate/attempts/{attemptId}/answers
- POST /api/Candidate/attempts/{attemptId}/submit
- GET /api/Candidate/results/my-result/{attemptId}
- GET /api/Candidate/results/my-result/{attemptId}/review
- GET /api/Candidate/dashboard

### Attempt (authenticated)
- POST /api/Attempt/start
- GET /api/Attempt/{attemptId}/session
- GET /api/Attempt/{attemptId}/timer
- POST /api/Attempt/{attemptId}/answers
- POST /api/Attempt/{attemptId}/answers/bulk
- POST /api/Attempt/{attemptId}/events
- POST /api/Attempt/{attemptId}/submit

### Grading
- POST /api/Grading/initiate
- GET /api/Grading/manual-required
- GET /api/Grading/attempt/{attemptId}
- GET /api/Grading/{sessionId}/manual-queue
- POST /api/Grading/manual-grade
- POST /api/Grading/complete

### Proxy Path
Frontend uses `/api/proxy` → backend `{BACKEND_URL}`. All Candidate/Attempt/Grading calls go through proxy.
