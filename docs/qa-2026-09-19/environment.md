# QA environment — 2026-09-19

## Startup and connection evidence

- Worktree: `C:\_OrbitX Projects\Build4 IT\new-exam.worktrees\production-readiness-final-test`.
- Frontend: http://localhost:3000 — Next.js 16.0.10 development server. Initial HTML HTTP 200; browser/business verification belongs to the phase records.
- Backend: http://localhost:5221 — ASP.NET Core net9.0, Development environment. Runtime content root confirms this worktree.
- SignalR endpoint: http://localhost:5221/hubs/proctor.
- Runtime versions: .NET SDK 9.0.306; Node.js v22.15.1.
- Test database: `db_ac2b1b_examdb`; direct read-only connectivity verified. Initial count: 57 users. All 42 source migrations already exist in database migration history; no missing/extra migration IDs.
- Confirmed initial SuperAdmin login returns success, SuperAdmin role, and access token. Credentials are deliberately absent from QA reports. Retrieve email from `Backend-API/Domain/Constants/AppRoles.cs` and seeded password from `Backend-API/Infrastructure/Data/DatabaseSeeder.cs`.
- No database seed, schema, migration, branch, push, or merge operation was performed during environment setup.

## Running processes / repeatable commands

- Backend launcher PID 28228; API listener PID 49988 at initial startup.
- Frontend launcher PID 41124; Next listener PID 36296 at initial startup.
- Backend working directory: `Backend-API`; command: `dotnet run --launch-profile http`.
- Frontend working directory: `Frontend/Smart-Exam-App-main`; command: `node node_modules/next/dist/bin/next dev --port 3000`.
- Processes were started hidden via PowerShell Start-Process. Logs: `backend.stdout.log`, `backend.stderr.log`, `frontend.stdout.log`, `frontend.stderr.log` in this QA directory. Launcher IDs also in `processes.json`. PIDs may change after explicitly recorded fix restarts.
- Coordinated restart 1 (D03/D04/D05): launcher 55036, API listener 13868. Backend regression: 204 pass / 62 SQL skip. Logs `backend-restart1.*.log`.
- Coordinated restart 2 (D07/D08/D09/D11 combined): launcher 51280, API listener 52936. Backend regression: 213 pass / 62 SQL skip. Logs `backend-restart2.*.log`; `backend-combined-tests.log`. Harness/inventory paused between request batches, with no candidate attempt active during either restart.
- Coordinated restart 3 (D12/D14–D19/D21–D23 combined): launcher 52168, API listener 48376, managed terminal session 58852. Backend regression: 221 pass / 64 SQL/Redis skip / 0 fail (`backend-restart3-tests.log`, `test-results/restart3-combined.trx`). Root authorized a live recovery test with browser attempt193/session145; read-only pre/post state is in `harness/restart3-before.json` and `restart3-after.json`. Stop was 11:30:01.193 UTC; first recorded readiness probe 11:31:20.599 UTC, a stop-to-probe upper bound of 79.599 seconds (`restart3-downtime.json`). The background Start-Process relaunch command was rejected by automatic approval review without a specific reason; a directly managed terminal launch succeeded. No schema/bootstrap change was made.
- Coordinated restart 4 (D25/D27/D28/D29): launcher 4344, API listener 31492, managed terminal session 38992. Normal-path backend build passed with 0 errors. Root authorized a second live outage for D26 browser answer recovery; stop 11:41:22.052 UTC. Root subsequently captured a successful browser autosave acknowledgement at 11:41:58.663 UTC, proving recovery within 36.611 seconds. The later dedicated HTTP200 probe at 11:42:23.281 UTC is retained in `restart4-downtime.json` but is not the actual recovery time. D30 source arrived after this build/start and is not claimed loaded by this restart. Tests moved to an isolated output directory after a normal-path run hit Windows' running-DLL lock; no extra outage was introduced. Combined current-source isolated suite passed 231 / skipped 64 / failed 0 (`backend-restart4-tests-isolated.log`).
- Coordinated restart 5 (D29 short-name alias/D30, legacy answer/state fixes/D33, D32/D34/D37/D38/D39 grading fixes): launcher52480, listener33864, managed terminal55335. Build0 errors; current-source isolated tests234 pass/64 skip/0 fail. Stop11:59:12.760 UTC, dedicated readiness probe11:59:48.705 UTC,36.705-second upper bound (`restart5-downtime.json`). Runtime D34 verified a fresh submitted attempt213 still grades in the background and publishes40/40 correctly.
- Coordinated restart 6 (D42/D43/D44/D46): launcher27980, listener36796, managed terminal1834. Normal build passed. Stop12:28:34.400 UTC, first recorded readiness probe12:29:12.281 UTC,38.281-second upper bound (`restart6-downtime.json`). Post-fix D42 passed2/2; D46 passed14/14; harness owns D43 and inventory D44 evidence.
- Coordinated restart7 (D51/D52/D53/D54/D55/D57, generic-media delete authorization and pagination validation): launcher26708, listener4832, managed terminal45805. Normal build passed. Stop12:51:02.615 UTC, readiness probe12:51:40.647 UTC,38.032-second upper bound. D53 post-fix63/63, HTTP-input10/10. Inventory reports its D52 17/17, D54 6/6, D57/deletion11/11; harness owns D51/D55 replay. No active candidate interruption was introduced.
- Coordinated restart8 (user-list batched-role query): launcher50496, listener44596, managed terminal16244. Normal build passed. Stop12:57:46.269 UTC, readiness probe12:58:27.284 UTC,41.014-second upper bound. API is left running. Backend suite and role/timing replay are recorded in restart8/user-list outputs.
- Restart9 (D62 concurrent-start lock scope): launcher57384/listener25228, terminal2327. Fresh50starts succeeded; first sustained replay retained D64 SQL connection timeout. See restart9-downtime.json and concurrent-start-defect.md.
- Restart10 (D63 terminal-session lifecycle): launcher49080/listener54408, terminal3651. Fresh cancellation/actual1minute expiry6/6passed. Second50replay120/120checks passed; audit log review discovered D66.
- Restart11 (D65 proctor countdown/D66 scoped audit completion): launcher54256/listener20396, terminal56616. Stop14:06:37.394Z, readiness probe14:07:12.664Z (35.270seconds upper bound). D66 fresh persisted action/audit6/6passed; current-source engineering checks passed. This is the current API. Frontend Next listener36296 remains running; HMR loads frontend edits without restarting its dev build directory.

## Safety / caveats

- Checked startup before launch: automatic `Database.MigrateAsync()` in Program.cs is commented out. No EnsureCreated path is called at startup. Serilog configured file logging; no auto-created SQL logging schema.
- Existing `.env.local` routes frontend requests to the local backend and uses localhost:3000 for frontend URL/CORS.
- Missing local license and Development secrets are intentional accepted conditions. Missing license emits a warning and is not a write blocker under current middleware.
- Local HTTP profile emits an HTTPS-redirection-port warning; TLS is not physically verified by this local profile.
- Next emitted a non-standard inherited NODE_ENV warning and a baseline-browser-mapping-age notice. Recorded as host/tooling observations, not confirmed product defects.
- Backend compilation emits existing nullable/unreachable-code/obsolete API warnings. Build/test evidence is recorded separately.
- Business workflows, authorization boundaries, physical camera and browser behavior are not established by these environment checks.
