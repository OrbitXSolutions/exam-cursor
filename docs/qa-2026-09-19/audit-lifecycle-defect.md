# D66: proctor actions lose audit writes after request disposal

## Confirmed reproduction

During the second actual50-candidate HTTP/SignalR workload, AddTime on attempt317 returned200 and changed the candidate timer. The server then logged `ObjectDisposedException: ApplicationDbContext` from AuditService.LogAsync. Timestamp2026-09-19 17:55:14.692+04, app-log-20260919.txt line23509, request trace21c1982e3ee5327f46e0b2533f17d069. The normal Audit API later returned0 matching AttemptControl.AddTime records for Attempt317; report agent independently verified this in `harness/phase11-final-readback.json`. The120workload assertions did not check audit persistence, so this log finding remains separate from their pass result.

The root cause is explicit: AttemptControlService launched Task.Run callbacks capturing the request-scoped IAuditService/DbContext. The HTTP scope could end before the callback ran. AddTime and ForceEnd shared this pattern.

## Minimal fix and verification

Production change: `Backend-API/Infrastructure/Services/AttemptControl/AttemptControlService.cs` now awaits those two existing audit calls before returning. It retains AuditService's existing failure-handling policy and leaves action authorization, business state rules and SignalR behavior unchanged. No schema/background-queue architecture changes.

Restart11 loaded the fix. Corrected runtime regression6/6PASS (`harness/d66-audit-regression-after.json`): candidate2 on exam141 saved an answer to enter InProgress (attempt367), received2extra minutes, and candidate session expiry increased exactly120seconds. An immediate audit GET found record820 with correct action, actor, Success outcome and metadata. ForceEnd persisted status7, and immediate audit GET found record821 with matching actor, action, Success and reason metadata.

An initial test script omitted the answer-save precondition; existing Started-state validation correctly rejected both actions, and the expected successful-action audit rows were absent. That harness failure is retained in `harness/d66-audit-regression.json`, not counted as a product defect or a passing regression. Its attempt365 expired naturally before the corrected fresh attempt. No rules were weakened to make the test pass.

Current-source checks: backend234passed/64skipped/0failed, frontend typecheckPASS, lint0errors/70warnings, isolated frontend production buildPASS, production API-proxy tests7/7PASS. SQL/Redis schema-changing integration fixtures remained disabled.

QA state retained: expired attempt365; force-submitted attempt367 with one correct answer; audit records820/821. Original missing317audit is not fabricated or backfilled. This is simulated API verification with real persisted state, not physical verification. D64's unrelated SQL pre-login timeout remains unresolved.
