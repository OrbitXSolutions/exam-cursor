# Smart Exam — Proctoring Live Video + Server Recording

## Implementation Report

### Architecture Overview

```
Candidate Browser                          Proctor Browser
┌─────────────────┐                        ┌─────────────────┐
│ getUserMedia()  │                        │  <video> viewer  │
│ CandidatePubl.  │◄──── WebRTC ────►     │  ProctorViewer   │
│ ChunkRecorder   │      (STUN only)      │  (view-only)     │
│  ▼ 3s chunks    │                        └────────┬────────┘
│  POST /video-   │                                 │
│  chunk/{id}     │                          SignalR Hub
└────────┬────────┘                     /hubs/proctor (JWT)
         │                                   │
         ▼                                   ▼
┌─────────────────────────────────────────────────────┐
│                   Backend (.NET 9)                   │
│  VideoRecordingController                            │
│   • POST /video-chunk/{attemptId}                    │
│   • POST /video-finalize/{attemptId}                 │
│   • GET  /video-recording/{attemptId}                │
│   • GET  /video-stream/{attemptId}                   │
│  ProctorHub (SignalR)                                │
│   • JoinAttemptRoom / LeaveAttemptRoom               │
│   • SendOffer / SendAnswer / SendIceCandidate        │
│   • RequestRenegotiation / NotifyConnectionStatus    │
│  VideoRetentionService (BackgroundService)           │
│   • Runs daily, deletes recordings > N days          │
└──────────────────────┬──────────────────────────────┘
                       │
                ┌──────▼──────┐
                │ MediaStorage/│
                │ video-chunks/│
                │ video-rec…/  │
                └──────────────┘
```

---

### Files Created / Modified

#### Backend

| File                                               | Action   | Purpose                                                                              |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `Infrastructure/Hubs/ProctorHub.cs`                | Created  | SignalR hub for WebRTC signaling (offers, answers, ICE candidates, room management)  |
| `Controllers/Proctor/VideoRecordingController.cs`  | Created  | Chunk upload, FFmpeg finalize, video streaming, recording metadata                   |
| `Infrastructure/Services/VideoRetentionService.cs` | Created  | Daily background job — deletes expired videos per `VideoRetentionDays`               |
| `Domain/Entities/SystemSettings.cs`                | Modified | Added `VideoRetentionDays` property (default: 30)                                    |
| `Program.cs`                                       | Modified | Registered SignalR, ProctorHub mapping, JWT query-string auth, VideoRetentionService |
| `Migrations/*_AddVideoRetentionDays.cs`            | Created  | EF Core migration for new column                                                     |

#### Frontend

| File                                                            | Action   | Purpose                                                                       |
| --------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `lib/signalr/proctor-signaling.ts`                              | Created  | SignalR connection manager with auto-reconnect, WebSocket transport, JWT auth |
| `lib/webrtc/candidate-publisher.ts`                             | Created  | WebRTC publisher (candidate side) — shares webcam stream with proctors        |
| `lib/webrtc/proctor-viewer.ts`                                  | Created  | WebRTC viewer (proctor side) — receives candidate stream, view-only           |
| `lib/webrtc/chunk-recorder.ts`                                  | Created  | MediaRecorder → 3s WebM chunks → upload queue with retry                      |
| `lib/types/proctoring.ts`                                       | Modified | Added `attemptId` to `LiveSession` interface                                  |
| `lib/api/proctoring.ts`                                         | Modified | Maps `attemptId` from session detail DTO                                      |
| `app/(candidate)/take-exam/[attemptId]/exam-page.tsx`           | Modified | Integrated CandidatePublisher + ChunkRecorder; stops + finalizes on submit    |
| `app/(dashboard)/proctor-center/[sessionId]/page.tsx`           | Modified | Live WebRTC video with status badge, snapshot fallback, "View Recording" link |
| `app/(dashboard)/proctor-center/recording/[attemptId]/page.tsx` | Created  | Standalone Attempt Video Page — MP4 player, events timeline, screenshots      |
| `app/(dashboard)/proctor-center/video/[candidateId]/page.tsx`   | Modified | Replaced placeholder with real video player + "View Full Recording" link      |

---

### Milestone Completion

| Milestone | Description                            | Status      |
| --------- | -------------------------------------- | ----------- |
| M0        | Discovery & codebase analysis          | ✅ Complete |
| M1        | SignalR hub + WebRTC signaling         | ✅ Complete |
| M2        | Chunk recorder + upload endpoint       | ✅ Complete |
| M3        | FFmpeg finalize + MP4 conversion       | ✅ Complete |
| M4        | Attempt Video Page + stream endpoint   | ✅ Complete |
| M5        | Retention service + admin setting      | ✅ Complete |
| M6        | Integration (exam page + proctor view) | ✅ Complete |

---

### How It Works

#### Candidate Side (Exam Page)

1. When the candidate starts the exam, `getUserMedia()` captures the webcam (already existing for proctoring snapshots).
2. `CandidatePublisher` reuses that stream — creates a WebRTC peer connection and publishes video via SignalR signaling.
3. `ChunkRecorder` simultaneously records 3-second WebM chunks using `MediaRecorder` API and uploads each chunk via `POST /api/Proctor/video-chunk/{attemptId}`.
4. On exam submission, the recorder flushes pending chunks, then calls `POST /api/Proctor/video-finalize/{attemptId}` which triggers FFmpeg conversion to MP4.

#### Proctor Side (Session Detail Page)

1. When a proctor opens a session detail page for an active session, `ProctorViewer` connects via SignalR and joins the attempt room.
2. Upon receiving the candidate's WebRTC offer, it creates an answer and establishes a view-only connection.
3. The live video stream is displayed in a `<video>` element with a real-time LIVE badge.
4. Connection status indicator shows: **LIVE** (green), **Connecting/Reconnecting** (amber), **Offline** (gray).
5. Snapshot fallback is shown when no live stream is available.
6. For completed sessions, a "View Recording" button links to the standalone Attempt Video Page.

#### Video Recording Pipeline

```
Webcam → MediaRecorder (VP9/VP8, 500kbps)
  → 3-second WebM chunks
  → POST /video-chunk/{attemptId} (FormData)
  → MediaStorage/video-chunks/{attemptId}/chunk_000001.webm ...

On Submit:
  → POST /video-finalize/{attemptId}
  → FFmpeg concat + transcode (libx264, CRF 28, fast preset)
  → MediaStorage/video-recordings/{attemptId}/recording.mp4
  → ProctorEvidence record (EvidenceType.Video)
```

#### Retention

- `VideoRetentionService` runs as a `BackgroundService` (every 24 hours, 5-min startup delay).
- Reads `VideoRetentionDays` from `SystemSettings` (default: 30 days).
- Deletes expired `ProctorEvidence` records (Video type) and their on-disk files.
- Cleans orphaned chunk directories older than retention cutoff.
- Admin can change `VideoRetentionDays` via the Settings API.

---

### Configuration

#### Required: FFmpeg

FFmpeg must be available on the server for MP4 conversion. The controller searches:

1. System PATH
2. `C:\ffmpeg\bin\ffmpeg.exe`
3. `C:\Program Files\ffmpeg\bin\ffmpeg.exe`
4. `{appRoot}/tools/ffmpeg.exe`

If FFmpeg is not found, a binary concat fallback produces a WebM file (lower quality, no H.264).

**Install on Windows:**

```powershell
winget install Gyan.FFmpeg
# or download from https://ffmpeg.org/download.html and add to PATH
```

#### Environment Variables

| Variable                  | Default                 | Description                                  |
| ------------------------- | ----------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:5183` | Backend URL for SignalR WebSocket connection |

#### SystemSettings

| Setting              | Default | Description                                        |
| -------------------- | ------- | -------------------------------------------------- |
| `VideoRetentionDays` | 30      | Days to keep video recordings before auto-deletion |

---

### API Endpoints

#### Video Recording

| Method | Path                                       | Auth                     | Description                                                              |
| ------ | ------------------------------------------ | ------------------------ | ------------------------------------------------------------------------ |
| POST   | `/api/Proctor/video-chunk/{attemptId}`     | Candidate                | Upload a WebM chunk (multipart form: `chunk`, `chunkIndex`, `timestamp`) |
| POST   | `/api/Proctor/video-finalize/{attemptId}`  | Candidate                | Merge chunks → MP4, create ProctorEvidence                               |
| GET    | `/api/Proctor/video-recording/{attemptId}` | Admin/Instructor/Proctor | Recording metadata, events, screenshots                                  |
| GET    | `/api/Proctor/video-stream/{attemptId}`    | Admin/Instructor/Proctor | Stream MP4 with HTTP range support                                       |

#### SignalR Hub

| Hub Path                           | Auth       | Description                     |
| ---------------------------------- | ---------- | ------------------------------- |
| `/hubs/proctor?access_token={jwt}` | JWT Bearer | WebRTC signaling for live video |

---

### Frontend Pages

| Route                                   | Purpose                                                  |
| --------------------------------------- | -------------------------------------------------------- |
| `/take-exam/{attemptId}`                | Exam page — publishes WebRTC, records chunks             |
| `/proctor-center/{sessionId}`           | Session detail — live video viewer, snapshots, incidents |
| `/proctor-center/recording/{attemptId}` | Standalone video playback page with events timeline      |
| `/proctor-center/video/{candidateId}`   | Per-candidate video view with recording player           |

---

### Non-Breaking Changes

- **No existing API contracts modified** — all new endpoints are additive.
- **No UI style changes** — uses existing shadcn/ui components and Tailwind classes.
- **No new npm packages** — `@microsoft/signalr` was already installed.
- **No external paid services** — STUN-only (Google public servers), local storage.
- **Existing proctoring (snapshots)** — fully preserved, unchanged.
- **Graceful degradation** — if WebRTC fails, snapshot view remains functional; if FFmpeg missing, binary concat fallback.

---

### Build Status

- **Backend**: ✅ `dotnet build` — 0 errors, 11 pre-existing warnings
- **Frontend**: ✅ `next build` — 0 errors, all pages compiled successfully
