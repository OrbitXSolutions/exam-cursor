# D69 — Video evidence incorrectly listed as screen captures

## Reproduction and cause

REAL-BROWSER proctor recording page for final candidate `44799c41-8cfd-4ab8-a90b-13632121949a`, attempt 368/session 320, displayed two blank screen-capture thumbnails and “2 screen captures recorded.” The only evidence was Video metadata 702 and 703, representing the original and corrected synthetic clip. No snapshot had been uploaded to this final session.

`loadSnapshots` filtered image evidence but fell back to **all evidence** when none matched. Video metadata therefore became screenshot records, inflating the count and producing unusable placeholders.

## Minimal repair

In `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/video/[candidateId]/page.tsx`, build the snapshot list only from matching still-image evidence. Preserve backend `Image = 3` and `ScreenCapture = 4` eligibility and the existing image/photo name compatibility checks. Do not treat Video, Audio or ScreenRecording metadata as still images merely because no images exist.

No backend, database schema, recording bytes, permissions, or grading result was changed by this repair. The legacy fallback that displays ordinary Image records in the screen-capture section remains unchanged.

## Verification

- REAL-BROWSER reload of the original failing final-session page shows **0 screen captures recorded** and **No screen captures available**, while the playable video remains present as **1/1** chunks.
- The final candidate's published **47/50 (94%)** lifecycle is unchanged.
- SIMULATED positive image fixture: exam 144, candidate `0d70f96e-612a-4bc1-81c9-091201b1a23c`, attempt 369/session 321. Normal active-attempt upload created Image evidence 704, then the attempt completed normally. The 320×240 PNG has 4522 bytes and SHA-256 `6684ab6cb0269e028756e6d7f92e1ca385bbd2c492b2f84f1f919204abebed1c`; authorized retrieval matched. [Five passing checks](harness/d69-image-regression.json).
- REAL-BROWSER positive regression: the completed session showed **1 screen captures recorded** and the Screen 704 thumbnail. Clicking it loaded the full preview, visibly labeled **QA26 SYNTHETIC IMAGE REGRESSION / No camera or screen capture** with three color bars. Both image DOM elements were complete and had natural dimensions 320×240. The first immediate capture preceded authenticated image loading; the settled preview rendered correctly. The page correctly showed no video chunks for this image-only fixture.

## Limits

Physical screen acquisition is not verified. Source inspection found the generic type-4 upload route requires an active session and provides a placeholder upload URL, while the implemented snapshot path produces type 3. No type-4 row or upload was fabricated to claim runtime acceptance. The blocked incident View action (D54) is a separate workflow and was not retried.
