# Phase 11 — measured concurrency and reliability

The second complete workload passed **120/120 assertions with no HTTP errors**: 50 authenticated candidates, 50 fresh attempts, 50 active persisted sessions, 50 candidate WebSockets and an assigned proctor, 12 rounds of saves/heartbeats/timer reads, 50 correct saved-answer reloads, 50 submissions and 50 independently verified objective scores of **40/40**. This is SIMULATED actual local HTTP/SignalR/persistence work. The real proctor browser separately showed exactly 50 load cards and removed them after submission. It is not 50 rendered browsers or physical video clients. [Assertions](harness/phase11-load-evidence.json), [manifest](harness/load-manifest.json), [browser record](browser-evidence.md).

The earlier failed ramp and first complete run remain material evidence. The second run does not resolve the underlying cause of D64's SQL connection timeout. Its successful HTTP responses also do not mean the application log was error-free: D66 lost an AddTime audit write after a successful control action.

## Workload comparison

| Stage | Established result | Remaining issue |
|---|---|---|
| Initial setup | 49/50 account authentications | Administrator rate limiting; setup observation, not capacity result. |
| Initial concurrent ramp | 50 authenticated; 43 attempts started | Seven SQL 1205 deadlocks/HTTP 500 (D62); no full-active barrier. |
| First complete run after D62 repair | 50 fresh starts and sockets; 12 rounds; 50 final answers/reloads/submissions/scores correct; 119/120 checks | One of 600 saves returned 500 (D64). D63 exposed 43 cancelled attempts retained as live proctor sessions. |
| Second complete run after D63 repair and ordinary retake grants | 50 fresh starts and sockets; 600 saves, 600 heartbeats, 600 timer reads; 50 reloads/submissions/scores; 120/120 checks; zero HTTP errors | One server-log audit failure (D66). D65 incorrect proctor clock was separately reproduced. Later focused verification passed D65 8/8 plus browser 10m and D66 6/6; this does not retroactively alter the load log. |

[Setup observation](harness/load-setup-rate-limit-evidence.json), [failed ramp](harness/load-ramp-before-evidence.json), [initial ramp manifest](harness/load-ramp-before-manifest.json), [first complete assertions](harness/load-d62-after-d64-before-evidence.json), [first complete manifest](harness/load-d62-after-d64-before-manifest.json). The first full manifest's empty `errors` array does not override its recorded failed round assertion.

The first complete run was 13:28:08.020–13:33:40.479 UTC, reaching all 50 active at 13:29:49.493. The second was 13:52:47.143–13:58:10.825 UTC, reaching all 50 active at 13:54:36.591. These are short measured workloads, not endurance tests or a measured maximum capacity. The application ran locally in Development with an external existing SQL dependency.

## Latencies

All values below are seconds measured by the harness. The failed initial ramp's starts were p50 **15.262**, p95 **19.915**, maximum **27.483**. D62 repair completed two subsequent 50-start ramps without another start deadlock; request timing still varied substantially between runs.

| Operation | First full samples | First p50 / p95 / max | Second full samples | Second p50 / p95 / p99 / max |
|---|---:|---:|---:|---:|
| Fresh start | 50 | 3.952 / 5.352 / 6.140 | 50 | 6.017 / 8.599 / 10.462 / 10.462 |
| Save four answers | 600 | 2.157 / 17.142 / 17.371 | 600 | 2.126 / 3.992 / 6.757 / 6.768 |
| Heartbeat | 599 | 1.388 / 1.446 / 4.164 | 600 | 1.386 / 1.512 / 1.569 / 2.318 |
| Timer read | 599 | 0.923 / 0.935 / 1.130 | 600 | 0.924 / 1.039 / 1.849 / 2.791 |
| Live proctor monitoring | 12 | 2.590 / 3.293 / 3.293 | 12 | 2.380 / 2.715 / 2.715 / 2.715 |
| Reload saved session | 50 | 1.397 / 1.618 / 1.630 | 50 | 1.389 / 1.586 / 1.594 / 1.594 |
| Submit | 50 | 2.087 / 3.899 / 3.912 | 50 | 2.082 / 2.289 / 3.947 / 3.947 |

The first run's failed save prevented its following heartbeat/timer pair, hence 599 of each. Warning persistence and actual WebSocket delivery passed in the second run. Its time extension persisted: 35,887 remaining seconds before and 35,943 after adding 60 seconds, accounting for elapsed request time. No agreed latency service-level target was supplied; these measured latencies are not automatically acceptable customer experience.

## Defects, logs and persisted state

- **D62:** narrow start-lock repair preserves candidate serialization and addresses the conflicting active-attempt lock. Seven original failed starts remain preserved; the 43 successfully created attempts were later cancelled through ordinary APIs without deleting history. [Diagnosis](concurrent-start-defect.md).
- **D63:** terminal sessions now close with their attempts and live queries exclude terminal parent attempts. Fresh cancellation and actual one-minute expiry passed 6/6. The second browser workload showed 50 cards without the 43 prior ghosts; after submission, load cards disappeared. [Diagnosis](live-session-lifecycle-defect.md), [focused replay](harness/d63-regression.json).
- **D64:** first-run save for attempt 273 failed at 13:31:54 UTC with SQL pre-login handshake timeout, trace `68e5ed970f44d3acecde72bedc2c9b2b`. It occurred during token validation before the answer handler; it is not another answer/start deadlock. Its deeper network/SQL/connection-pressure cause remains unknown. No speculative timeout/retry/pool change was applied. [Diagnosis](load-reliability-finding.md).
- **D66:** the second run contained one error among 3,788 timestamped log records: `AttemptControl.AddTime` on attempt 317 failed to write its audit log after the successful action, with a disposed scoped context. Exact normal Audit API readback returned zero matching rows. This is independent of the 120 passing workload assertions. [Log summary](harness/phase11-load-replay-log-summary.json), [readback](harness/phase11-final-readback.json). The minimal repair now awaits the existing audit calls before returning. Fresh attempt 367 passed 6/6 action/audit checks: AddTime extended expiry exactly 120 seconds with audit row 820, then ForceEnd persisted status 7 with row 821 and correct actor/metadata. The initial harness omitted the answer-save precondition, so Started-state action rejection was not a product failure. No missing historical audit row was fabricated. [Diagnosis](audit-lifecycle-defect.md), [corrected replay](harness/d66-audit-regression-after.json).

Ordinary administrator retake preparation granted exactly 50 overrides (IDs 6–55) after verifying all prior attempts terminal, with 254/254 checks and no 429 or failed responses. The subsequent normal operations readback passed **51/51 override/history checks**: every latest replay attempt was Submitted, with one added attempt, no active attempt and unchanged MaxAttempts 2. **43 overrides were consumed; seven remain unused.** Those seven candidates had only one previous attempt because their initial ramp start failed; their second attempt used ordinary allowance. The service consumes an override only after the ordinary attempt limit is reached. No residual override was deleted. [Grant workflow](extra-attempt-workflow.md), [final readback summary](harness/phase11-final-readback-summary.json).

## Actual host resource observations

The host exposed 32 logical processors and 32,384.11 MiB total memory. CPU below is host-normalized, not percentage of one core. SQL Server, its connection pool and network dependency resources were not instrumented.

| Observation | First complete run | Second complete run |
|---|---:|---:|
| API working-set peak | 389.45 MiB | 450.09 MiB |
| API private-memory peak | 258.61 MiB | 320.78 MiB |
| API maximum host CPU | 1.766% | 0.337% |
| API final sampled working set / private memory | 349.14 / 211.39 MiB | 383.48 / 247.46 MiB |
| Next dev working-set / private-memory peak, entire sampling window | 1745.13 / 4276.49 MiB | 1822.06 / 4355.11 MiB |

[First resource summary](harness/phase11-load-after-resource-summary.json), [second resource summary](harness/phase11-load-replay-resource-summary.json). Second sampling covered 13:52:30.301–14:00:15.437 UTC with 59 samples per process and no measurement errors. During the workload API host CPU p50/p95/max was 0.138%/0.310%/0.337%; threads peaked at 104 and handles at 2,423. The 17 after-run samples extended roughly 124.6 seconds past workload completion: API working set moved 386.24→383.48 MiB, private memory 253.28→247.46 MiB and CPU stayed at or below 0.075%.

The API did not crash during these workloads. Retained memory after brief recovery neither proves a leak nor establishes absence of one. Next.js was one development server with other browser work, not 50 frontend renderers. Physical camera/screen streaming, recording bandwidth, cross-network clients, production hosting, long-duration stability, autoscaling and a database-capacity ceiling remain outside this evidence.
