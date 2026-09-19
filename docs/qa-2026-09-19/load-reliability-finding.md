# D64: SQL connection timeout during 50-candidate autosave workload

Classification: SIMULATED TEST using actual HTTP/SignalR workload; actual API/Next host process measurements. This was not 50 browsers or physical camera/screen verification.

The first full post-D62 run created 50 fresh attempts, reached the full active barrier, completed 12 rounds, persisted all final answers, submitted all 50, and produced 40/40 for every candidate. One autosave in round8 returned HTTP500; a subsequent answer save succeeded. 119/120 business checks passed. The failure remains a reliability finding despite correct final state.

Exact request: PUT `/api/Candidate/attempts/273/answers`, trace `68e5ed970f44d3acecde72bedc2c9b2b`. Server log timestamp 2026-09-19 17:31:54 +04 (13:31:54Z), duration15024ms. `Backend-API/Logs/app-log-20260919.txt` records SqlException -2, a connection timeout consuming the SQL pre-login handshake acknowledgement (initialization230ms, handshake14779ms). Stack reaches Program.OnTokenValidated line160 before authentication completed and before answer-saving service execution. This is not a reproduced answer/heartbeat SQL deadlock. Adjacent saves completed around17.1s; run save p95=17142ms, maximum17371ms.

No timeout extension, retry suppression, schema change, or speculative production fix was made. SQL-side connection/network diagnostics were not collected; the precise infrastructure cause is unresolved. A later clean replay can assess recurrence but cannot erase this observed failure or establish production capacity.

Evidence: `harness/load-d62-after-d64-before-*`, `harness/phase11-load-after-resources.jsonl`, `harness/phase11-load-after-resource-summary.json`. The manifest's empty `errors` array does not replace its failed business-check record.

Measured process behavior: API pid25228 remained alive. During run peak working set389.45MiB, private memory258.61MiB; CPU max1.766% normalized across32 logical processors. After recovery last working set349.14MiB, private211.39MiB; recovery CPU max0.036%. Next was a development server for the real browser work, not50 rendered clients; peak working set1745.13MiB/private4276.49MiB across the overall sample. No measurement errors. SQL server resource telemetry was not measured. These short samples do not establish absence of memory leaks.

## Second full replay after D63

Root's second run (13:52:47.143–13:58:10.825Z) passed120/120checks with zero failed workload requests,50new attempts and a full active barrier at13:54:36.591Z. Supported extra-attempt grants enabled this replay without altering exam MaxAttempts. All50finalanswers/submissions/scores40/40 were verified by root's workload. This is a successful bounded replay; D64's earlier timeout remains unresolved.

| Operation | Count | p50 ms | p95 ms | Maximum ms |
| --- | ---: | ---: | ---: | ---: |
| New attempt start |50|6017.29|8598.79|10462.27|
| Answer save |600|2125.73|3992.05|6768.39|
| Heartbeat (measured round requests) |600|1385.57|1511.81|2318.08|
| Timer |600|923.65|1039.48|2791.43|
| Live monitoring |12|2380.45|2715.12|2715.12|
| Reload persisted session |50|1389.09|1586.18|1593.60|
| Submit |50|2081.82|2288.71|3946.83|

API pid54408 remained alive: measured peak working set450.09MiB/private320.78MiB; peak normalized host CPU0.337%; maximum104threads/2423handles. After more than80seconds recovery, working set approximately383.48MiB/private247.46MiB. No host measurement errors. SQL resource/connection-pool metrics and production multi-node behavior were not measured. Next dev resource use is separately recorded and is not50browser memory.

Full application log review found no HTTP500 during this second workload but did find one additional error: AddTime attempt317 returned200, then an unawaited audit write failed because ApplicationDbContext had been disposed. The extension and candidate timer checks passed, but audit persistence failed. This separate lifecycle reliability defect was reported to root; the120business assertions did not include this log-write persistence assertion. It must not be described as an error-free application log.

Evidence: `harness/phase11-load-replay-manifest-snapshot.json`, `harness/phase11-load-replay-resources.jsonl`, `harness/phase11-load-replay-resource-summary.json`, `harness/phase11-load-replay-log-summary.json`. The log summary records3788timestamped records and the one audit error. Original failure evidence remains unchanged.
