# Proctor Video & Screenshot Storage

## Where are video and screenshots saved?

- **Local storage (default):** On the server where the Backend-API runs, files are stored under:
  - **Base folder:** `MediaStorage` (relative to the API’s content root, e.g. `Backend-API/MediaStorage`).
  - **Proctor snapshots:** `MediaStorage/proctor-snapshots/YYYY/MM/`  
    Example: `MediaStorage/proctor-snapshots/2026/02/` for February 2026.

- **Root `MediaStorage` folder:** The root `MediaStorage` folder often has **no files directly inside it**. All proctor images are in **subfolders** like `proctor-snapshots/2026/02/`. If you only look in the root, it will appear empty.

- **Configuration:** Path and provider are set in `appsettings.json` under `MediaStorage` → `Local` → `BasePath` (default: `"MediaStorage"`).

## When are files created?

1. **Candidate is on the exam page** (after starting the attempt).
2. **Browser has camera access** (user allowed camera when prompted).
3. **Frontend captures a snapshot** (about every 90 seconds and once after 5 seconds).
4. **Upload succeeds:** Frontend sends the image to `POST /api/Proctor/snapshot/{attemptId}`. The backend saves it via `MediaStorageService` into `proctor-snapshots/YYYY/MM/`.

If any of these steps fail (e.g. camera denied, upload error), **no file is saved**.

## Why might MediaStorage (or proctor-snapshots) be empty?

1. **No successful uploads yet**  
   - Camera was blocked or not allowed.  
   - Exam was too short (e.g. less than 90 seconds), so no interval upload ran.  
   - Network or server error during upload (check backend logs).

2. **Looking in the wrong place**  
   - Check **subfolders**: `MediaStorage/proctor-snapshots/YYYY/MM/`, not only the root `MediaStorage`.

3. **Proxy/body size**  
   - If the frontend uses a proxy to the API, ensure it forwards **multipart/form-data** and allows enough body size for image uploads.

## Viewing evidence in the app

- **Proctor Center** → open a session → evidence/screenshots for that session are loaded from the backend (same files that sit under `MediaStorage/proctor-snapshots/...`).
- **Candidate Result** page → links to “Candidate Video” and “Screen Streaming” go to Proctor Center views that use this evidence.

## S3 (optional)

If `MediaStorage:Provider` is set to `"S3"` in `appsettings.json`, files are stored in the configured S3 bucket instead of the local `MediaStorage` folder. The local folder will then stay empty for new uploads.
