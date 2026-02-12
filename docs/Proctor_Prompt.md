You are my partner and senior software engineer.

We have a business demo as production ready in 24 hours.
The goal is to successfully demonstrate the system to business users and PMO — not to perfect the full backend.

Time is extremely limited.
We will work smart, professional, and production ready-focused.

We have done the Question Bank Module,
Exam Module,
Candidate Taking Exam and Submit Module,

Now Let's Work on Proctor Moudule,
Let's Start by Proctor-Center Page.

You are my partner and senior software engineer.

Before we continue improving the Proctor Module, I need a full technical clarification regarding video and screenshot recording.

Do not implement anything yet.
Just analyze and explain the current real behavior.

---

# Questions (Must Answer Clearly)

1. Is live webcam video currently implemented?
   - Is there any WebRTC / MediaRecorder / streaming logic in the frontend?
   - Is any video blob being captured and sent to backend?
   - Is there any endpoint receiving video stream or video file?

2. Are screenshots actually being captured?
   - How often?
   - From which frontend file?
   - Which endpoint receives them?
   - What validation is performed on backend?

3. Where are proctor media files stored?
   - Are they stored in MediaStorage folder?
   - If yes, provide exact folder path.
   - If not, where exactly are they saved?

4. When I enter exam 4 times:
   - Why do I only see 2 screenshots?
   - Is there throttling?
   - Is screenshot upload failing silently?
   - Is it linked to ProctorSession existence?

5. Is there any background job responsible for:
   - Video recording
   - Screenshot aggregation
   - Session cleanup

6. Is live video supposed to:
   - Be streamed in real time?
   - Or only recorded and available after exam ends?

7. Are MediaStorage folders actually receiving files during exam?
   - If yes, list what files should be created per attempt.

---

# Important

I need a factual explanation of what is implemented vs what is assumed.
No guessing.
No mock explanation.
Inspect actual code paths.

After analysis, summarize:

- What is fully working
- What is partially implemented
- What is missing completely

##

You are my partner and senior software engineer.

We have a business demo as production ready in 24 hours.
The goal is to successfully demonstrate the system to business users and PMO — not to perfect the full backend.

Time is extremely limited.
We will work smart, professional, and production ready-focused.

We still Working on Proctor Module:

==================================================================
EXECUTION ORDER (MUST FOLLOW)

1. Complete TASK A fully and verify it works.
2. THEN start TASK B.
   Do not mix changes between tasks.
   ==================================================================

# Policy (MUST FOLLOW)

- Submit normal = ProctorSessionStatus.Completed
- Terminate / Admin kill / Force End = ProctorSessionStatus.Cancelled
- Natural Expiry (timeout) = ProctorSessionStatus.Completed

==================================================================

TASK A: Fix Proctor Session Lifecycle (production-ready) + ensure Proctor Center never appears empty by providing exactly 2 safe sample sessions when there are no real active sessions.

# Business Objective

Proctor Center must reliably show all active exam sessions in real time.
A ProctorSession must exist for every started Attempt (when proctoring is enabled), and must close correctly on submit/expire/force-end/terminate.
Remove dependency on frontend calling POST /Proctor/session.

Additionally, Proctor Center must not appear empty during demo:

- If there are 0 real active sessions, show exactly 2 sample sessions (in-memory, not stored in DB), clearly marked as Sample.

# Technical Constraints

1. Follow existing project architecture and naming conventions.
2. Do NOT modify global styles or colors till confirm with me.
3. Minimal changes, no over-engineering.
4. Do NOT rely on DB seed/mock data.
5. Real sessions first; samples only fallback and easy to disable.

# Required Backend Changes (TASK A)

A1) Auto-create ProctorSession in StartAttemptAsync (backend only, idempotent)
A2) Close Active ProctorSession on:

- Submit -> Completed + EndedAt
- ForceEnd/Terminate -> Cancelled + EndedAt
- Expired -> Completed + EndedAt
  A3) AttemptControl must close ProctorSession on force-end (Cancelled)
  A4) Snapshot/Event endpoints must work without frontend create-session call

# Sample Sessions Fallback (TASK A)

- Extend GET /Proctor/sessions with includeSamples=true
- If includeSamples=true AND real active sessions count = 0:
  - return EXACTLY 2 sample sessions (in-memory)
- If real sessions exist: return real only (do not mix by default)
- Samples must be marked Sample and have safe stable IDs; disable actions in UI.

# Acceptance Criteria (TASK A)

- Start exam -> session appears
- Submit -> Completed and disappears from active
- Force end -> Cancelled and disappears
- Expire -> Completed and disappears
- No duplicates
- Samples appear only when empty + includeSamples=true

STOP after TASK A and provide Summary Output for TASK A, then start TASK B.

==================================================================

TASK B: Make proctor webcam snapshots reliable and visible (no video). Fix silent failures, add proper user feedback, and ensure Proctor Center/Session Details show evidence correctly.

# Facts

- Video recording/streaming is NOT implemented and we will NOT implement it now.
- Snapshots exist and stored in MediaStorage/proctor-snapshots/YYYY/MM/\*.jpg.
- Failures are swallowed silently.

# Requirements (TASK B)

B1) Candidate exam page:

- Webcam denial -> visible message + Retry + log event
- Improve first snapshot timing (avoid 0 screenshots for short attempts)
- Upload errors must NOT be swallowed:
  - Remove mock success on upload failure
  - show toast + retry (2 times)
  - persistent warning banner if still failing

B2) Proctor Center cards:

- show latest snapshot thumbnail + count + last time
- no broken placeholder; use avatar/initials if none

B3) Session Details:

- show screenshots gallery (latest first) + preview

B4) Storage:

- ensure URLs are accessible; implement minimal safe serving if needed

# Acceptance Criteria (TASK B)

- Denied camera shows clear UI + retry
- Upload failure is visible and retried
- Proctor Center shows thumbnail when exists
- Session details gallery works
- No mock upload success remains

After finishing TASK B give me summary Output for TASK B.

---

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- Follow existing project architecture and naming conventions.
- After finish the task give me summary Output.

---

A1 Auto-create ProctorSession (Mode=Soft, Status=Active) when StartAttemptAsync succeeds; idempotent — skips if one already exists AttemptService.cs ~178
A2a Close ProctorSession → Completed when attempt expires in GetAttemptSessionAsync AttemptService.cs ~232
A2b Close ProctorSession → Completed when attempt expires in GetAttemptTimerAsync AttemptService.cs ~360
A2c Batch-close all orphan Active ProctorSessions → Completed in ExpireOverdueAttemptsAsync AttemptService.cs ~395
A3 Close ProctorSession → Cancelled on admin ForceEnd AttemptControlService.cs ForceEndAsync
A4 Verified: UploadSnapshotAsync / RecordEventAsync already auto-create soft session — no change needed ProctorService.cs —
S-BE1 Added IncludeSamples to ProctorSessionSearchDto ProctorDtos.cs
S-BE2 Added IsSample to ProctorSessionListDto ProctorDtos.cs
S-BE3 GetSessionsAsync returns 2 sample sessions when IncludeSamples=true and real count = 0 ProctorService.cs
S-BE4 Added GenerateSampleSessions() — "Sarah Ahmed" (risk 12) & "Omar Khalid" (risk 35) ProctorService.cs
S-FE1 Added isSample to LiveSession type & ProctorSessionListDto, mapped in mapToLiveSession proctoring.ts, types/proctoring.ts
S-FE2 getLiveSessions sends IncludeSamples=true query param proctoring.ts
S-FE3 Proctor Center shows "Sample" badge on sample cards; dropdown actions (flag/warn/terminate/view) replaced with inert badge for samples page.tsx/proctor-center/page.tsx)
Lifecycle status mapping (policy)
Event ProctorSessionStatus
Candidate starts exam Active (auto-created)
Candidate submits normally Completed (existing behavior)
Timeout / natural expiry Completed
Admin Force End / Terminate Cancelled
Build status
Backend: Compiles cleanly (0 CS errors, only pre-existing warnings + file-lock from running process)
Frontend: No TypeScript errors
What the demo user will see
If real proctor sessions exist → shown as normal
If no real sessions → 2 sample cards appear ("Sarah Ahmed", "Omar Khalid") with "Sample" badge and no action buttons — Proctor Center is never empty
TASK A is complete. Stopping here as requested. Ready to start TASK B on your signal.
