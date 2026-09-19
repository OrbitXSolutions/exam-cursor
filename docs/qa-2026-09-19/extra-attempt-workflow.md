# Ordinary extra-attempt grants — D64 regression preparation

SIMULATED functional verification through the actual local application API and persisted readback. This was authorized QA test-data preparation, performed after recovery sampling, the D63 old-session cleanup and restart 10 were complete. No security checks were performed.

The exact 50 candidate/previous-attempt pairs came from [load-d62-after-d64-before-manifest.json](harness/load-d62-after-d64-before-manifest.json), whose SHA-256 is retained in the grant manifest. Each previous attempt was read independently before any grant: all 50 belonged to exam 121 and the mapped candidate and were **Submitted (status 3)**. The ordinary operations list also confirmed no active attempt or existing unused override.

Between 13:46:14.549 and 13:52:12.816 UTC, the script issued exactly 50 successful `allow-new-attempt` requests with the reason **QA26 D64 concurrency regression retake**, then verified one matching audit record per candidate. Override IDs **6–55** were returned. All requests were paced, with no HTTP 429 or failed responses; the existing limiter configuration was unchanged.

At the final readback, all 50 records had exactly one unused override, no active attempt, unchanged prior-attempt counts and latest attempt IDs, and unchanged exam `maxAttempts = 2`. The script started no attempts and preserved previous history. **254/254 checks passed.** Consumption of these overrides by subsequent candidate starts belongs to root's separate regression workload and is not claimed by this grant-only evidence.

- [Final 50-record manifest](harness/d64-retake-grants-manifest.json)
- [Complete latest evidence](harness/d64-retake-grants-evidence.json)
- [Timestamped evidence](harness/d64-retake-grants-2026-09-19T13-46-14-549Z.json)
- [Reproducible script](harness/d64-retake-grants.mjs)

The script was independently reviewed and syntax-checked before execution. It requires explicit release of the recovery/cleanup window, validates the manifest's exact 50 distinct targets, stops on uncertain write outcomes and never invokes a candidate start/answer/submit endpoint.

## Readback after the second workload

Normal read-only operations-list verification passed 51/51 history/override checks: all 50 latest attempts were Submitted and matched the replay manifest, each had exactly one added attempt, no active attempt remained and MaxAttempts stayed 2. **43 overrides were consumed; seven remain unused.** The seven candidates whose initial start failed had only one prior attempt, so the replay used their ordinary second allowance; the service consumes an override only when the ordinary limit has been reached. No unused override was removed. [Readback summary](harness/phase11-final-readback-summary.json), [raw evidence](harness/phase11-final-readback.json). The same evidence file includes a separate failed D66 audit assertion; it is not an override failure.
