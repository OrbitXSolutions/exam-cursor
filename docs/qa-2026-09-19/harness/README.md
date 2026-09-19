# QA API harness — 2026-09-19

These scripts exercise the running application through HTTP and verify returned persisted business state. Their evidence is **SIMULATED TEST**, not real-browser or physical verification.

Run from the repository root with Node 22. Set `QA_API_URL` to the running backend URL, then run `node docs/qa-2026-09-19/harness/phase1-admin.mjs`.

`client.mjs` reads the seed SuperAdmin credential from existing local source at runtime. Generated QA credentials live only in `.env.qa-private.json`, ignored by the repository's existing `.env.*` rule. Evidence redacts password and token fields. `data-manifest.json` records intentionally retained QA data IDs without credentials. Do not publish the private file.

The phase script is intentionally limited to authorized admin setup. Later candidate and concurrency exercises are separate scripts and require coordination with the primary QA run.

Planned load methodology: 50 distinct authenticated candidates with independent persisted attempt IDs; synchronize start after published exam eligibility; concurrently save/overwrite answers and verify reload; periodic heartbeats; active proctor polling and SignalR event observation; simulated warnings/pause/resume/time extension on selected attempts; staggered final submission; independently compare persisted answers, calculated scores, terminal attempt states, and error/latency distributions. This is a local application workload simulation, not 50 physical browser/camera sessions. Camera/video capacity requires separate physical acceptance.
