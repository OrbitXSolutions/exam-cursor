# Smart Exam — Proctoring Live Video + Server Recording (MVP Production-minded)

ou are my partner and senior software engineer.

We have a business demo as production ready in 24 hours.
The goal is to successfully demonstrate the system to business users and PMO — not to perfect the full backend.

Time is extremely limited.
We will work smart, professional, and production ready-focused.
working inside an existing production-ready system (Frontend + Backend).
Your goal: implement **Live video view (proctor view-only)** + **server-stored recording** while keeping the current system stable.

## Non-negotiable rules

1. **NO breaking changes**. Do not modify existing grading/submit/result flows. Do not change existing proctor screenshot capture flow.
2. **NO UI style changes**. Do not change design system, colors, spacing, typography. If you must add UI, it must reuse existing components and visual patterns with minimal footprint.
3. **Minimal API requests** from frontend. Avoid chatty polling. Prefer reuse of existing endpoints and SignalR/event-based approaches.
4. **Discovery-first**: You must inspect existing code, DB schema, current proctoring module, and existing media storage conventions before adding anything.
5. Do not introduce any external paid third-party services (Twilio/Agora/Daily/etc). Everything must be self-hosted / built-in.
6. Windows hosting is expected. Use tools that can run on Windows.

## Business requirements (MVP)

### A) Live video (view-only)

- Candidate already opens camera for proctoring (existing).
- Add **Live video streaming** so a Proctor can watch the candidate **in real-time**.
- Proctor is **view-only** (no camera publish; no voice for now).
- Provide basic connection status on proctor side: Live / Reconnecting / Offline (recording continues).

### B) Recording (stored on same server)

- Candidate video must be recorded and saved on the **same server** (local storage).
- Recording must be retrievable later by supervisors via a dedicated page (**Attempt Video Page**).
- Recording approach for MVP:
  - Record on client using MediaRecorder as **WebM chunks** during exam.
  - Upload chunks continuously to backend (every 2–3 seconds).
  - On finalize (exam submit/end attempt): backend merges chunks and converts final output to **MP4** using FFmpeg on the server.
  - Store MP4 path/metadata and make it playable on Attempt Video Page.

### C) Retention policy (Admin setting)

- Admin can set **RetentionDays (X)**.
- A daily job deletes expired MP4 recordings (and any leftover chunks) older than X days.
- Attempt Video Page should show a clear message: “This recording will be deleted after X days” (text only; do not change styling).

### D) Attempt Video Page (standalone)

- A standalone route/page for supervisors to open and watch the recording:
  - MP4 Player
  - Timeline list of existing proctoring events (if already present in system)
  - Screenshots gallery (reuse existing data; do not reimplement screenshot capture)
- Do not redesign pages. Add the smallest possible new page consistent with current routing and auth patterns.

### E) Events (no new messaging now)

- Do NOT implement proctor<->candidate messaging now.
- Only ensure any existing “warning overlay/toast” UI remains unchanged.
- Capture/record minimal proctoring events relevant to video reliability if already part of system (e.g., live connection failures). If the system already logs proctoring events, reuse it.

## Technical constraints & expectations

- Use **WebRTC** for live streaming between candidate and proctor.
- Use existing real-time mechanism if present (SignalR is preferred if already used). If no real-time exists, add minimal signaling.
- Implement robust reconnect logic:
  - ICE restart
  - renegotiation
  - hard reset fallback
- Recording reliability:
  - chunk upload with retry/backoff
  - avoid losing data on short network interruptions
  - keep chunks small (2–3 seconds)
- Storage:
  - Follow existing `MediaStorage` conventions, folder structure, and naming style.
  - Keep root folder clean; store per YYYY/MM or existing pattern.
- Security:
  - Reuse existing auth guards, middleware, and patterns (do not invent a new auth scheme).
  - Attempt Video Page must be protected similarly to existing proctor/result pages.
- Performance:
  - Avoid increasing number of API calls significantly.
  - Avoid polling loops.

## Work plan requirements (must do)

1. Start with a **Discovery Report**:
   - List existing proctoring architecture: candidate camera flow, screenshot flow, any live session model, any SignalR usage, existing media storage doc, existing endpoints, existing DB tables.
   - Identify the best IDs to bind everything (AttemptId vs SessionId or both) based on existing code.
2. Produce a **TODO plan** with milestones and file-level changes.
3. Implement in small commits; each milestone should be testable.
4. At the end, produce a single markdown report file named:
   **PROCTORING_VIDEO_IMPLEMENTATION.md**
   containing:
   - Summary of what was implemented
   - What was reused vs added
   - DB changes (tables/columns/migrations)
   - New/changed endpoints (names discovered from codebase)
   - New pages/routes
   - How to run FFmpeg / required server prerequisites
   - Retention job schedule and how to configure RetentionDays
   - Manual test checklist results (pass/fail)
   - Known limitations (e.g., live may fail on some NAT environments without TURN)

## Milestones (implement in this order)

### Milestone 0 — Discovery (no code changes)

- Analyze repo structure.
- Identify current proctoring module entry points.
- Identify how screenshots are stored and surfaced.
- Identify auth patterns for proctor/admin.
- Identify any existing SignalR hubs or real-time infra.

### Milestone 1 — Live signaling and connection

- Implement minimal signaling (prefer SignalR if already exists).
- Candidate publishes video stream to proctor (view-only).
- Proctor page can connect to a candidate attempt/session and watch.
- Add reconnect logic and status indicator (no design changes).

### Milestone 2 — Chunk recording upload

- Implement MediaRecorder chunking on candidate side.
- Implement backend chunk accept/store with validation, ordering, and durability.
- Ensure minimal impact to existing flows.

### Milestone 3 — Finalize + Merge + Convert to MP4

- On attempt end/submit/finalize: merge chunks, convert to MP4 using FFmpeg.
- Store output path/metadata linked to attempt/session.
- Ensure this is done safely (prefer async background job if architecture supports; otherwise implement careful server-side processing without blocking critical paths).

### Milestone 4 — Attempt Video Page

- Add standalone page to:
  - Play MP4
  - Show timeline events (reuse existing)
  - Show screenshots (reuse existing)
- Add navigation entry points with minimal UI: e.g., button/link from existing attempt report/proctor report pages (do not alter layout).

### Milestone 5 — Retention job

- Add Admin setting RetentionDays (reuse settings storage if exists).
- Add daily job to delete expired recordings.
- Ensure safe deletion + logs.

### Milestone 6 — End-to-end test + report

- Run manual tests.
- Fill PROCTORING_VIDEO_IMPLEMENTATION.md with all details.

## Questions (ask me early, but do not block work)

You may ask clarification questions only if you cannot find answers in code.
Prefer to proceed by inspecting code and making conservative, reversible choices.
If something is unclear, implement with feature flags or config switches and document it.

Now begin with Milestone 0 (Discovery) and produce the TODO plan before coding.

==== How to test
Manual Test Checklist

# Test How to verify

T1 Feature flags off Set EnableLiveVideo: false and EnableVideoRecording: false in appsettings → exam should work exactly as before, no WebRTC, no chunks uploaded
T2 Snapshot capture unchanged Start exam as candidate → screenshots still upload every 60s to proctor dashboard (check proctor-center)
T3 Camera permission denied Deny camera when prompted → exam must continue normally, no crash
T4 Chunk upload Enable recording, start exam → open browser DevTools Network tab → look for POST /api/Proctor/video-chunk/{attemptId} every ~3 seconds
T5 Live video Open proctor-center session detail in a second browser/tab → you should see live video from candidate with LIVE badge
T6 Connection status Kill candidate's network briefly → proctor should show Reconnecting then Offline → restore network → should reconnect
T7 Submit + finalize Submit exam → check that submit completes instantly (no delay) → check backend logs for Video processing completed message
T8 MP4 file created After finalize, check Backend-API/MediaStorage/video-recordings/{attemptId}/recording.mp4 exists and is playable
T9 Attempt Video Page Navigate to /proctor-center/recording/{attemptId} → MP4 player + events timeline + screenshots gallery should render
