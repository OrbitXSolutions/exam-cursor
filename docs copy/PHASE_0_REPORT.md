# Smart Exam System — Phase 0 Foundation Report & Execution Plan

**Date:** 2026-02-03  
**Author:** Senior Full-Stack Engineer (Delivery Owner)  
**Scope:** Read-only analysis — NO code changes

---

## A) System Overview (High Level)

1. **Exam Management (Assessment)** — Create/edit exams with bilingual titles, sections, topics, duration, pass scores, and scheduling (Fixed vs Flex modes)
2. **Question Bank** — Create questions (MCQ Single/Multi, True/False, Essay, Numeric) with categories, types, attachments, and bilingual content
3. **Candidate Module** — Exam discovery, preview, start/resume exam, save answers, submit, view results
4. **Attempt Management** — Track candidate attempts, enforce max attempts, handle expiration, capture events (tab switch, copy/paste)
5. **Grading Engine** — Auto-grade objective questions; queue manual grading for essay/subjective; support re-grading
6. **Exam Results** — Finalize results from grading, publish/unpublish to candidates, generate reports
7. **Certificates** — Auto-generate certificates for passed candidates; public verification via unique code
8. **Proctoring** — Create sessions, capture webcam snapshots, log events, risk scoring, evidence storage
9. **Incident Management** — Cases, decisions, appeals, timeline tracking for proctoring violations
10. **Audit Logging** — Track user actions, retention policies, export jobs
11. **User & Role Management** — ASP.NET Identity with roles: Admin, Instructor, Candidate, SuperDev, ProctorReviewer, Auditor
12. **Media Storage** — Local or S3 storage for images, documents, proctor snapshots
13. **Lookups** — Question categories, question types (configurable metadata)
14. **i18n Support** — Frontend supports English/Arabic with RTL; backend stores bilingual fields
15. **Reports & Analytics** — Dashboard stats, pass rates, score distributions, CSV export

---

## B) Repository Map

### B.1 Backend Projects / Layers

| Layer                          | Path                                      | Responsibility                                                         |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------- |
| **Entry Point**                | `Backend-API/Program.cs`                  | DI registration, middleware, EF Core, JWT auth, Serilog, rate limiting |
| **Controllers**                | `Backend-API/Controllers/`                | REST endpoints grouped by module                                       |
| **Application/DTOs**           | `Backend-API/Application/DTOs/`           | Data Transfer Objects per module                                       |
| **Application/Interfaces**     | `Backend-API/Application/Interfaces/`     | Service contracts                                                      |
| **Application/Validators**     | `Backend-API/Application/Validators/`     | FluentValidation rules                                                 |
| **Domain/Entities**            | `Backend-API/Domain/Entities/`            | Core domain models                                                     |
| **Domain/Enums**               | `Backend-API/Domain/Enums/`               | Enum definitions (AttemptStatus, GradingStatus, etc.)                  |
| **Infrastructure/Services**    | `Backend-API/Infrastructure/Services/`    | Business logic implementations                                         |
| **Infrastructure/Data**        | `Backend-API/Infrastructure/Data/`        | EF Core DbContext, Seeder                                              |
| **Infrastructure/Persistence** | `Backend-API/Infrastructure/Persistence/` | UnitOfWork, entity configurations                                      |
| **Infrastructure/Storage**     | `Backend-API/Infrastructure/Storage/`     | Local and S3 storage providers                                         |
| **Migrations**                 | `Backend-API/Migrations/`                 | EF Core migrations (latest: AddSystemSettings)                         |

**Key Controllers:**

| Controller             | Route               | Purpose                                                      |
| ---------------------- | ------------------- | ------------------------------------------------------------ |
| AuthController         | `/api/Auth`         | Login, register, refresh token, password reset               |
| CandidateController    | `/api/Candidate`    | Candidate exam flow (exams, start, session, submit, results) |
| AttemptController      | `/api/Attempt`      | Attempt CRUD, events, timer                                  |
| GradingController      | `/api/Grading`      | Initiate grading, manual grade, complete                     |
| ExamResultController   | `/api/ExamResult`   | Finalize, publish, reports, dashboard                        |
| CertificateController  | `/api/Certificate`  | Verify, create, revoke, download                             |
| ProctorController      | `/api/Proctor`      | Sessions, events, evidence, decisions                        |
| IncidentController     | `/api/Incident`     | Cases, decisions                                             |
| AssessmentController   | `/api/Assessment`   | Exam CRUD, sections, builder, publish                        |
| QuestionBankController | `/api/QuestionBank` | Question CRUD, options, answer keys                          |
| LookupsController      | `/api/Lookups`      | Categories, types                                            |

### B.2 Frontend App Structure

| Path                            | Purpose                              |
| ------------------------------- | ------------------------------------ |
| `Frontend/Smart-Exam-App-main/` | Next.js 16 + React 19 app            |
| `app/(auth)/`                   | Login, forgot-password (auth layout) |
| `app/(candidate)/`              | Candidate exam-taking pages          |
| `app/(dashboard)/`              | Admin/Instructor dashboard pages     |
| `app/verify-certificate/`       | Public certificate verification      |
| `lib/api/`                      | API client functions by domain       |
| `lib/i18n/`                     | i18n context and translations        |
| `components/`                   | Reusable UI components               |

**Major Routes/Pages:**

| Route                     | File                                              | Status      |
| ------------------------- | ------------------------------------------------- | ----------- |
| `/login`                  | `app/(auth)/login`                                | ✅ Real API |
| `/my-exams`               | `app/(dashboard)/my-exams/page.tsx`               | ✅ Real API |
| `/take-exam/[attemptId]`  | `app/(candidate)/take-exam/[attemptId]/`          | ✅ Real API |
| `/results/[attemptId]`    | `app/(candidate)/results/[attemptId]/`            | ✅ Real API |
| `/grading`                | `app/(dashboard)/grading/page.tsx`                | ✅ Real API |
| `/grading/[submissionId]` | `app/(dashboard)/grading/[submissionId]/page.tsx` | ✅ Real API |
| `/reports`                | `app/(dashboard)/reports/page.tsx`                | ✅ Real API |
| `/verify-certificate`     | `app/verify-certificate/page.tsx`                 | ✅ Real API |
| `/proctor-center`         | `app/(dashboard)/proctor-center/`                 | ⚠️ Partial  |
| `/exams`                  | `app/(dashboard)/exams/`                          | ✅ Real API |
| `/question-bank`          | `app/(dashboard)/question-bank/`                  | ✅ Real API |

### B.3 Docs Map

| Document                 | Path                            | Contents                                   |
| ------------------------ | ------------------------------- | ------------------------------------------ |
| PROJECT_STATUS.md        | `PROJECT_STATUS.md`             | Current status, routes, API usage, TODOs   |
| GAP_ANALYSIS.md          | `GAP_ANALYSIS.md`               | Gap analysis (from 2026-01-31), priorities |
| RUNBOOK.md               | `RUNBOOK.md`                    | Setup, run instructions, demo users        |
| USER_MANUAL.md           | `docs/USER_MANUAL.md`           | End-user manual (Admin & Candidate)        |
| PROCTOR_MEDIA_STORAGE.md | `docs/PROCTOR_MEDIA_STORAGE.md` | Proctoring snapshot storage                |
| API Docs                 | `Backend-API/docs/`             | API specs per module                       |
| Implementation Plans     | `Backend-API/docs/`             | Module implementation plans                |

---

## C) Critical User Journeys (E2E)

### Journey 1: Candidate Exam Taking & Proctoring

| Step | Action                      | Backend Endpoint                                   | Frontend File                                         | DB Entities                                                 |
| ---- | --------------------------- | -------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| 1    | Login                       | `POST /api/Auth/login`                             | `app/(auth)/login`                                    | ApplicationUser                                             |
| 2    | View available exams        | `GET /api/Candidate/exams`                         | `app/(dashboard)/my-exams/page.tsx`                   | Exam, ExamSection                                           |
| 3    | Preview exam + instructions | `GET /api/Candidate/exams/{id}/preview`            | `app/(candidate)/take-exam/[attemptId]/instructions/` | Exam, ExamInstruction, ExamAccessPolicy                     |
| 4    | Start exam                  | `POST /api/Candidate/exams/{id}/start`             | `app/(candidate)/take-exam/[attemptId]/exam-page.tsx` | Attempt, AttemptQuestion                                    |
| 5    | Answer questions            | `PUT /api/Candidate/attempts/{id}/answers`         | `exam-page.tsx`                                       | AttemptAnswer                                               |
| 6    | Log proctoring events       | `POST /api/Attempt/{id}/events`                    | `exam-page.tsx`                                       | AttemptEvent                                                |
| 7    | Capture webcam snapshot     | `POST /api/Proctor/snapshot/{attemptId}`           | `exam-page.tsx` → `uploadProctorSnapshot()`           | ProctorEvidence                                             |
| 8    | Submit attempt              | `POST /api/Candidate/attempts/{id}/submit`         | `exam-page.tsx`                                       | Attempt (status=Submitted), GradingSession (auto-triggered) |
| 9    | View result (if published)  | `GET /api/Candidate/results/my-result/{attemptId}` | `app/(candidate)/results/[attemptId]/page.tsx`        | Result                                                      |

**Risks / Missing Pieces:**

- ✅ Auto-grading is triggered on submit (confirmed in CandidateService.SubmitAttemptAsync)
- ✅ Proctoring snapshot upload endpoint exists and is used
- ⚠️ ProctorSession is NOT auto-created on exam start — requires explicit creation via `POST /api/Proctor/session`
- ⚠️ Proctor events are logged via Attempt API (`/Attempt/{id}/events`), but ProctorSession events use separate endpoint
- ⚠️ Result visibility depends on `IsPublishedToCandidate` flag — must be published after grading

---

### Journey 2: Trainer/Admin Review & Grading

| Step | Action                      | Backend Endpoint                                   | Frontend File                                     | DB Entities                          |
| ---- | --------------------------- | -------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| 1    | View grading queue          | `GET /api/Grading/manual-required`                 | `app/(dashboard)/grading/page.tsx`                | GradingSession                       |
| 2    | Get grading session details | `GET /api/Grading/attempt/{attemptId}`             | `app/(dashboard)/grading/[submissionId]/page.tsx` | GradingSession, GradedAnswer         |
| 3    | Grade manual question       | `POST /api/Grading/manual-grade`                   | `page.tsx`                                        | GradedAnswer                         |
| 4    | Complete grading            | `POST /api/Grading/complete`                       | `page.tsx`                                        | GradingSession (status=Completed)    |
| 5    | Finalize result             | `POST /api/ExamResult/finalize/{gradingSessionId}` | Called by `completeGrading()`                     | Result                               |
| 6    | Publish result              | `POST /api/ExamResult/{resultId}/publish`          | (API only currently)                              | Result (IsPublishedToCandidate=true) |

**Risks / Missing Pieces:**

- ✅ Grading page now uses real API (confirmed in code)
- ⚠️ `completeGrading()` in frontend calls both `/Grading/complete` and `/ExamResult/finalize` — good
- ⚠️ **Result NOT auto-published** — admin must manually publish via API or UI
- ⚠️ No "Publish" button visible in current grading/results UI — requires API call

---

### Journey 3: Results Visibility & Refresh

| Step | Action                           | Backend Endpoint                                          | Frontend File                                  | DB Entities          |
| ---- | -------------------------------- | --------------------------------------------------------- | ---------------------------------------------- | -------------------- |
| 1    | Admin views exam results         | `GET /api/ExamResult/exam/{examId}`                       | `app/(dashboard)/reports/page.tsx`             | Result               |
| 2    | Admin views dashboard stats      | `GET /api/ExamResult/dashboard/exam/{examId}`             | `reports/page.tsx`                             | Result aggregation   |
| 3    | Export CSV                       | (Client-side generation)                                  | `reports/page.tsx`                             | —                    |
| 4    | Candidate views published result | `GET /api/Candidate/results/my-result/{attemptId}`        | `app/(candidate)/results/[attemptId]/page.tsx` | Result               |
| 5    | Candidate reviews answers        | `GET /api/Candidate/results/my-result/{attemptId}/review` | `app/(candidate)/results/[attemptId]/review/`  | Result, GradedAnswer |

**Risks / Missing Pieces:**

- ✅ Reports page connected to real API
- ✅ CSV export implemented (client-side)
- ⚠️ Candidate only sees result if `IsPublishedToCandidate = true`
- ⚠️ If `showResults = false` on exam, candidate gets summary only (no scores)

---

### Journey 4: Certificate Generation & Display

| Step | Action                                                  | Backend Endpoint                          | Frontend File                     | DB Entities |
| ---- | ------------------------------------------------------- | ----------------------------------------- | --------------------------------- | ----------- |
| 1    | Certificate auto-created when result published & passed | (Internal in ExamResultService)           | —                                 | Certificate |
| 2    | Candidate views certificates                            | `GET /api/Certificate/my-certificates`    | Result page                       | Certificate |
| 3    | Candidate downloads certificate                         | `GET /api/Certificate/{id}/download`      | Result page                       | Certificate |
| 4    | Public verification                                     | `GET /api/Certificate/verify/{code}`      | `app/verify-certificate/page.tsx` | Certificate |
| 5    | Admin creates certificate                               | `POST /api/Certificate/create/{resultId}` | (API only)                        | Certificate |
| 6    | Admin revokes certificate                               | `POST /api/Certificate/{id}/revoke`       | (API only)                        | Certificate |

**Risks / Missing Pieces:**

- ✅ Certificate entity and migration exist
- ✅ Certificate verification page works
- ⚠️ Certificate auto-creation depends on result being published AND passed
- ⚠️ No dedicated admin UI for certificate management — API only
- ⚠️ Certificate download returns HTML (print-to-PDF) — no native PDF generation

---

## D) Definition of Done Checklist (Production Readiness)

### Functional Completeness

| Item                                 | Status | Notes                                        |
| ------------------------------------ | ------ | -------------------------------------------- |
| Candidate exam flow (start → submit) | ✅     | Fully working                                |
| Auto-grading for objective questions | ✅     | MCQ, T/F, Numeric                            |
| Manual grading for essays            | ✅     | Queue + detail page                          |
| Result finalization                  | ✅     | Post-grading                                 |
| Result publishing                    | ⚠️     | Works via API; no UI button in grading flow  |
| Certificate generation               | ✅     | Auto-creates on publish if passed            |
| Certificate verification             | ✅     | Public page                                  |
| Proctoring events logging            | ✅     | Tab switch, fullscreen, copy/paste           |
| Webcam snapshot capture              | ✅     | Every 90s during exam                        |
| Reports dashboard                    | ✅     | Stats, pass rate, export                     |
| i18n (Arabic)                        | ⚠️     | Most strings translated; verify completeness |

### Security (Auth/Roles, Validation)

| Item                     | Status | Notes                                                                   |
| ------------------------ | ------ | ----------------------------------------------------------------------- |
| JWT Authentication       | ✅     | With refresh tokens                                                     |
| Role-based authorization | ✅     | Controllers have `[Authorize(Roles)]`                                   |
| Input validation         | ✅     | FluentValidation                                                        |
| Rate limiting            | ✅     | Configured in Program.cs                                                |
| Password policy          | ✅     | Identity options configured                                             |
| File upload validation   | ⚠️     | Extensions checked; size limit 10MB                                     |
| HTTPS enforcement        | ⚠️     | `UseHttpsRedirection()` present                                         |
| Secrets in config        | ❌     | **JWT secret, DB password in appsettings.json** — must move to env vars |

### Logging & Error Handling

| Item                        | Status | Notes                            |
| --------------------------- | ------ | -------------------------------- |
| Structured logging          | ✅     | Serilog to file + console        |
| Global exception middleware | ✅     | `UseGlobalExceptionMiddleware()` |
| Request logging             | ✅     | `UseSerilogRequestLogging()`     |
| Log retention               | ✅     | 30 days rolling                  |

### Data Integrity

| Item                        | Status | Notes                          |
| --------------------------- | ------ | ------------------------------ |
| Soft deletes (IsDeleted)    | ✅     | BaseEntity pattern             |
| Audit timestamps            | ✅     | CreatedDate, ModifiedDate      |
| Concurrent answer saves     | ✅     | Idempotent bulk save           |
| Attempt expiration handling | ✅     | Status check before operations |

### Performance Basics

| Item                     | Status | Notes                      |
| ------------------------ | ------ | -------------------------- |
| Pagination               | ✅     | All list endpoints         |
| Redis caching (optional) | ✅     | Falls back to in-memory    |
| Eager loading            | ✅     | Using Include()            |
| Index on hot columns     | ⚠️     | Not verified in migrations |

### Frontend Responsiveness & Translation

| Item                 | Status | Notes                                      |
| -------------------- | ------ | ------------------------------------------ |
| Responsive design    | ⚠️     | Uses Tailwind; not fully mobile-tested     |
| RTL support          | ✅     | i18n context with dir attribute            |
| Translation coverage | ⚠️     | Verify new strings (certificates, reports) |

### Testing

| Item              | Status | Notes                 |
| ----------------- | ------ | --------------------- |
| Unit tests        | ❌     | No test project found |
| Integration tests | ❌     | None                  |
| E2E/Smoke tests   | ❌     | No Playwright/Cypress |

### Deployment Readiness

| Item                  | Status | Notes                                                        |
| --------------------- | ------ | ------------------------------------------------------------ |
| Environment configs   | ⚠️     | appsettings.Development.json exists; production needs review |
| Environment variables | ❌     | Secrets hardcoded in appsettings.json                        |
| Docker support        | ❌     | No Dockerfile found                                          |
| CI/CD pipeline        | ❌     | No GitHub Actions workflow                                   |
| Migration strategy    | ✅     | Auto-migrate in dev                                          |

---

## E) Gap Analysis (No Code)

### MUST FIX (Blocks Production)

| #      | Symptom                                   | Suspected Root Cause                                                             | Impacted Modules     | Minimal Fix Approach                                                                  |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| **M1** | Secrets exposed in config                 | JWT secret, DB password in `appsettings.json`                                    | Security, Deployment | Move to environment variables; use `secrets.json` for dev                             |
| **M2** | Result not visible after grading finalize | Result `IsPublishedToCandidate` defaults to false; no auto-publish after grading | ExamResult, Grading  | Either auto-publish when grading completes OR add "Publish" button in grading UI      |
| **M3** | No ProctorSession created on exam start   | Proctoring events logged to AttemptEvent but ProctorSession not auto-created     | Proctor, Candidate   | Consider auto-creating ProctorSession in `StartExamAsync` if exam requires proctoring |
| **M4** | No test coverage                          | No test project exists                                                           | All                  | Create `Smart_Core.Tests` project; add critical path unit tests                       |

### SHOULD FIX (Quality Improvements)

| #       | Symptom                            | Suspected Root Cause                                           | Impacted Modules | Minimal Fix Approach                                                    |
| ------- | ---------------------------------- | -------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| **S1**  | Proctor Center uses partial data   | Live sessions endpoint returns data but some fields incomplete | Proctor UI       | Verify and enhance `getLiveSessions()` and session detail endpoints     |
| **S2**  | Certificate management UI missing  | Admin can only create/revoke via API                           | Certificates     | Add admin certificates list/revoke UI in `/settings` or `/certificates` |
| **S3**  | No CI/CD                           | Manual deployment                                              | DevOps           | Add GitHub Actions workflow for build/test/deploy                       |
| **S4**  | Mobile responsiveness not verified | No mobile testing                                              | Frontend         | Test and fix responsive breakpoints                                     |
| **S5**  | i18n coverage incomplete           | New features may lack Arabic translations                      | Frontend i18n    | Audit `translations.ts` for missing keys                                |
| **S6**  | Database indexes not verified      | Potential slow queries on large datasets                       | Infrastructure   | Audit and add indexes on `Attempt.CandidateId`, `Result.ExamId`, etc.   |
| **S7**  | No Docker containerization         | Deployment complexity                                          | DevOps           | Add Dockerfile and docker-compose                                       |
| **S8**  | PDF certificate generation         | Currently returns HTML                                         | Certificates     | Consider using a PDF library (e.g., DinkToPdf, QuestPDF)                |
| **S9**  | Settings page incomplete           | May use mock data                                              | Settings         | Connect to SystemSettings API                                           |
| **S10** | Audit page status unclear          | May use partial data                                           | Audit            | Verify AuditController integration                                      |

---

## F) Execution Plan (Phased)

### Phase 1: Fix Blocking Issues (Smallest Scope)

**Goal:** Remove production blockers  
**Duration:** 1-2 days  
**Acceptance Criteria:**

| Task                                  | Criteria                                                                                                                      | Owner Approval Needed     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1.1 Move secrets to env vars          | JWT secret, DB connection string read from environment; appsettings.json has placeholders only                                | No                        |
| 1.2 Auto-publish result after grading | When `CompleteGrading` is called, if exam.ShowResults=true, auto-publish; OR add explicit Publish button in grading detail UI | **Yes — choose approach** |
| 1.3 Add basic unit tests              | Create test project; cover `CandidateService.SubmitAttemptAsync`, `GradingService.InitiateGradingAsync`                       | No                        |

### Phase 2: Complete Missing Features

**Goal:** Fill functional gaps  
**Duration:** 3-5 days  
**Acceptance Criteria:**

| Task                                         | Criteria                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| 2.1 Auto-create ProctorSession on exam start | If `exam.RequireProctoring=true`, create ProctorSession in `StartExamAsync`   |
| 2.2 Enhance Proctor Center UI                | Connect to real session data; show screenshots timeline; show events timeline |
| 2.3 Add Certificates admin UI                | List certificates; revoke button; regenerate button                           |
| 2.4 Verify i18n completeness                 | Audit all new keys; add missing Arabic translations                           |
| 2.5 Add Publish button in Reports/Results    | Admin can publish individual or bulk results                                  |

### Phase 3: Hardening + Tests + DevOps

**Goal:** Production-ready quality  
**Duration:** 3-5 days  
**Acceptance Criteria:**

| Task                            | Criteria                                               |
| ------------------------------- | ------------------------------------------------------ |
| 3.1 Integration tests           | Test candidate flow E2E; test grading flow             |
| 3.2 Add database indexes        | Index on frequently queried columns                    |
| 3.3 Add Dockerfile              | Multi-stage build for backend; Node build for frontend |
| 3.4 Add GitHub Actions CI       | Build, test, lint on PR                                |
| 3.5 Mobile responsiveness audit | Test on common devices; fix breakpoints                |
| 3.6 Security review             | OWASP checklist; dependency audit                      |
| 3.7 PDF certificate generation  | Replace HTML download with PDF                         |

---

## G) Summary of Key Findings

1. **Architecture:** Clean Architecture pattern with clear separation (Controllers → Services → Domain). Well-organized.
2. **Completeness:** Most core features implemented and connected to real APIs. Grading, certificates, and proctoring are functional.
3. **Critical Gap:** Secrets in config files and result auto-publish missing are the main production blockers.
4. **Testing Gap:** No test project exists — this is a significant risk.
5. **Documentation:** Well-documented with API docs, user manual, and runbook.
6. **i18n:** Bilingual support exists but needs completeness audit.

**Recommendation:** Proceed with Phase 1 immediately to unblock production deployment. Phase 2 and 3 can follow based on priority and timeline.

---

## H) Appendix: Key File References

### Backend Key Files

- Entry Point: `Backend-API/Program.cs`
- Candidate Service: `Backend-API/Infrastructure/Services/Candidate/CandidateService.cs`
- Grading Service: `Backend-API/Infrastructure/Services/Grading/GradingService.cs`
- ExamResult Service: `Backend-API/Infrastructure/Services/ExamResult/ExamResultService.cs`
- Certificate Service: `Backend-API/Infrastructure/Services/ExamResult/CertificateService.cs`
- Proctor Service: `Backend-API/Infrastructure/Services/Proctor/ProctorService.cs`
- DbContext: `Backend-API/Infrastructure/Data/ApplicationDbContext.cs`
- Configuration: `Backend-API/appsettings.json`

### Frontend Key Files

- API Client: `Frontend/Smart-Exam-App-main/lib/api-client.ts`
- Candidate API: `Frontend/Smart-Exam-App-main/lib/api/candidate.ts`
- Grading API: `Frontend/Smart-Exam-App-main/lib/api/grading.ts`
- Certificates API: `Frontend/Smart-Exam-App-main/lib/api/certificates.ts`
- Exam Page: `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx`
- Grading Page: `Frontend/Smart-Exam-App-main/app/(dashboard)/grading/page.tsx`
- Reports Page: `Frontend/Smart-Exam-App-main/app/(dashboard)/reports/page.tsx`
- i18n: `Frontend/Smart-Exam-App-main/lib/i18n/translations.ts`

### Documentation

- Project Status: `PROJECT_STATUS.md`
- Gap Analysis: `GAP_ANALYSIS.md`
- Runbook: `RUNBOOK.md`
- User Manual: `docs/USER_MANUAL.md`
- API Docs: `Backend-API/docs/`

---

_End of Phase 0 Report_
