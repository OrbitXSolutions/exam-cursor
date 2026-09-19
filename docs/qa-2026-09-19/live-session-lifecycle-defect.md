# D63: terminal attempts left active in proctor monitoring

## Reproduction

REAL-BROWSER: root observed 93 QA load cards when only 50 candidate attempts were active: 43 cards belonged to the earlier failed ramp, whose attempts had been cancelled through the supported API. Read-only API evidence `harness/d63-cancelled-session-before.json` confirms a saved Cancelled attempt still had an Active ProctorSession and null EndedAt. The cancelled attempt history was retained deliberately.

CODE INSPECTION: `AttemptService.CancelAttemptAsync` saved the attempt/event but did not close its proctor sessions. Candidate timer-expiry paths and several legacy timer/force-submit paths had the same missing lifecycle update. Active list/live-monitoring/dashboard queries trusted session status alone.

## Bounded fix

- Close all active proctor modes for an attempt during cancellation (Cancelled) and the identified expiry/force-submit paths (Completed), before the same SaveChanges as the terminal attempt transition.
- Active session list, live monitoring and active dashboard count require a nonterminal parent attempt. Started, InProgress, Paused and Resumed remain monitorable. Unfiltered history is retained, including older inconsistent rows.
- No schema changes, score changes, deletion of attempt history, or broad workflow refactor.

Production files: `CandidateService.cs`, `AttemptService.cs`, `ProctorService.cs` under `Backend-API/Infrastructure/Services`.

## Verification checkpoint

Source build: PASS, 0 errors (`d63-build.log`). Current backend tests234passed/64skipped/0failed (`d63-backend-tests.log`); SQL integration setup was not enabled because it changes test schema. Frontend typecheck PASS.

Restart10 runtime regression:6/6PASS (`harness/d63-regression.json`). Fresh exam141, candidate3 attempt312 first appeared live, then supported cancel persisted Attempt.Cancelled and session264.Cancelled with EndedAt. Second attempt313 ran the actual configured1minute with healthy heartbeats; Candidate session read refused resume, persisted Attempt.Expired and session265.Completed with EndedAt. Active filtered list/live monitoring/dashboard active count all0; unfiltered history and dashboard total retain both2sessions. This is actual elapsed timing exercised through simulated HTTP clients, not real-browser/physical verification. Paused preservation and legacy expiry/force-submit variants were code-inspected but not freshly exercised by this focused regression.

Historical cleanup43/43PASS uses only `load-ramp-before-manifest.json` (43 attempts, exam121); every attempt's Cancelled state and candidate ownership was checked before the existing session-cancel API was called, then session status/EndedAt reread. Evidence is split into `harness/d63-old-cancelled-cleanup-sequential.json` (21verified) and `harness/d63-old-cancelled-cleanup-resume.json` (22verified). The initial serial worker was stopped to switch to3bounded workers under a global70requests/minute gate; resumed records reread state and did not repeat an already completed cancellation. The50submitted workload attempts were not modified.

QA records left: exam141 with original question131; cancelled attempt312/session264 and expired attempt313/session265. All prior43 cancellation history remains. No schema, branch, push or merge changes.
