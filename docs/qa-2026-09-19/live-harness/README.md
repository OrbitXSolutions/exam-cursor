# Live protocol harness

Prepared during phases 2/3. **Not run until phase 5 authorization.** `protocol.mjs` does not start attempts; it requires two separately reserved, active candidate attempts from the lifecycle harness. They must be distinct from the root's browser-owned attempt.

Create `fixtures.json` with `examId`, `candidates` (two objects containing `email`, `attemptId`, optionally `proctorSessionId`), `proctorEmail`, `foreignProctorEmail`, and optional `identityVerificationId`. Credentials remain in the existing ignored private harness file. Set `QA_API_URL=http://localhost:5221` and `QA_LIVE_EXECUTE=phase5` to execute.

It connects actual SignalR WebSockets and calls real HTTP product routes. It tests camera/screen room membership and signaling, peer/role/department denial, warnings and persisted fallback, time extension and exact expiry delta, heartbeat/event visibility, controlled disconnect/rejoin, media/session ownership, termination and completed-attempt immutability. Synthetic SDP/ICE proves protocol routing only; it does not establish media capture, decoded video, camera/screen monitoring, device permissions, bandwidth or NAT/TURN behavior. The controlled reconnect is not a physical network interruption.

Mutations are intentional: warning/event/time extension on candidate one; termination of candidate two. It leaves candidate one active for additional authorized exercises. Do not run against another active browser test's fixtures. Video chunk/physical identity submission remains separate, and the script records missing identity fixture coverage explicitly.

Use `node --check protocol.mjs` for a syntax check. Invoking without the phase5 environment flag prints preparation status and performs no network requests.
