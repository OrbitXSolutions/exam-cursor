# D26 — Offline answer loss and submission race

## Confirmed original failure — real browser + actual API state

During root-authorized API outage 11:30:01.193–11:31:20.599 UTC, browser candidate attempt193 answered question134 True around 11:30:10. The browser briefly displayed Save failed, then removed the error while still showing True and 6/6 answered. After recovery, a fresh server session returned currentAnswer=null for question134. Root evidence: `root-browser-state-candidate-checkpoint.json`. No synthetic API mutation was used to produce that browser answer.

Root cause: each UI edit independently fired a save request; failure discarded the request and hid its error after five seconds. Requests could overlap/out-of-order. Submission never waited for pending answers and stopped monitoring before knowing whether submission succeeded.

## Minimal fix

- `Frontend/Smart-Exam-App-main/lib/exam/answer-save-queue.ts`: serialize saves, retain the latest pending revision per question, retry every three seconds and when connectivity returns, retain failure state until all pending answers are acknowledged, stop retries on terminal cleanup/unmount.
- `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx`: connect queue to existing save API/UI; warn before closing/reloading with unsaved answers; guard duplicate submission; flush pending answers before manual submission; keep monitoring/retries active on a failed submission request; stop only after server accepts completion. Automatic time expiry still attempts completion, and all retries use the same server-validated answer endpoint—no late-answer bypass or deadline extension.
- `Frontend/Smart-Exam-App-main/lib/i18n/translations.ts`: English/Arabic messages explain that answers remain unsaved and are being retried, and why manual submission is blocked.

## Verification

Seven focused Node tests passed (`Frontend/Smart-Exam-App-main/tests/answer-save-queue.test.mjs`): automatic recovery after transient failure; serial/latest-value ordering during an in-flight save; failed flush blocks submission and recovered flush saves all answers first; same-turn empty-flush race; re-enqueue of same object reference; persistent error across failed retries/new edits; cancellation prevents retries/completion callbacks. Frontend TypeScript check passed. These are SIMULATED unit tests, not browser evidence.

Targeted lint passed with 0 errors and five existing effect-dependency warnings (`d26-lint.log`). Post-submission final media flush was checked against the actual API on disposable submitted attempt195: five assertions passed—terminal precondition, owned final chunk upload stored, persisted listing, byte-for-byte download hash, and preserved Submitted status (`harness/d26-terminal-chunk.json`). The new file is `video-chunks/195/chunk_900001.webm` with explicitly synthetic non-playable probe bytes. This verifies storage/authorization after submission, not physical recording or playback. UploadVideoChunk checks ownership but does not reject terminal attempts; finalization still follows recorder stop/upload drain. Existing recorder 15-second flush timeout was not changed.

Second real-browser outage verification PASSED, performed by root on attempt193 after loading the new bundle. During the outage starting 11:41:22.052 UTC, root selected question134 True around 11:41:30. Manual submission around 11:41:48 was blocked with the keep-page-open message and persistent retry indicator. Automatic retry succeeded by 11:41:58.663 UTC without re-entering the answer; a fresh API session showed answer id573 with selected option385 while the attempt remained InProgress (status2). Reload retained True and 6/6 answers. Normal manual submission around 11:44 then transitioned to Submitted. Evidence: `root-browser-state-candidate-checkpoint.json` and root browser coverage record. The successful save proves recovery within 36.611 seconds, before the later explicit server readiness probe.

Pending answer data is retained in memory only: beforeunload warns, but force-closing the tab/browser or accepting a reload while offline can still discard unsaved edits. Durable offline storage/version reconciliation would be a separate design decision and is not claimed here.
