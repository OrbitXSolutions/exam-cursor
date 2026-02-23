INCIDENT MODULE — 6 Tables

1. IncidentCase (The core table)
   Aspect Detail
   What A formal investigation record tied to a specific exam attempt. Contains case number, severity (Low/Medium/High/Critical), status (Open → InReview → Resolved → Closed), source (ProctorAuto / ManualReport / SystemRule), outcome (Cleared/Suspicious/Invalidated/Escalated), risk score snapshot, and resolution notes (En/Ar).
   When created When a proctor (or system rule) flags suspicious behavior during an exam — e.g., tab-switch violations, face not detected, high risk score. Also manually by admin/proctor.
   Who sees it Admin/Proctor: full access — create, assign, review, resolve, close. Candidate: read-only view of their own incidents via my-incidents / my-incident/attempt/{id} endpoints.
2. IncidentTimelineEvent
   Aspect Detail
   What Chronological activity log on a case — every status change, assignment, evidence link, decision, comment, appeal action, severity change, reopen.
   When Auto-created by the service whenever any action happens on an IncidentCase (created, assigned, status changed, evidence linked, decision recorded, comment added, appeal submitted/reviewed, severity changed, reopened).
   Who sees it Admin/Proctor only — via GET case/{id}/timeline. Shows full audit trail of who did what and when.
3. IncidentEvidenceLink
   Aspect Detail
   What Links proctor evidence (screenshots, snapshots) and proctor events (tab-switch, face-lost) to an incident case. References ProctorEvidence and ProctorEvent tables.
   When When a reviewer attaches proof to a case — "here's the screenshot showing the candidate looking away at 10:42".
   Who sees it Admin/Proctor — via GET case/{id}/evidence. The candidate sees a limited view through their incident details.
4. IncidentDecisionHistory
   Aspect Detail
   What Every formal decision on a case — outcome (Cleared/Suspicious/Invalidated/Escalated), reason (En/Ar), internal notes, risk score at decision time. Also tracks appeal decisions with IsAppealDecision flag.
   When When a reviewer records a verdict: "cleared — false positive" or "invalidated — confirmed cheating". Multiple decisions can exist (e.g., initial decision + appeal reversal).
   Who sees it Admin/Proctor — full history. Candidate — only the final outcome via their incident view, not internal notes.
5. IncidentComment
   Aspect Detail
   What Discussion thread on a case. Has IsVisibleToCandidate flag to control visibility. Supports edit tracking.
   When Reviewers discuss the case, add internal notes, or post a message visible to the candidate.
   Who sees it Admin/Proctor — all comments. Candidate — only comments marked IsVisibleToCandidate = true.
6. AppealRequest
   Aspect Detail
   What A candidate's formal challenge against an incident decision. Contains message, supporting info, status (Submitted → InReview → Approved/Rejected), reviewer notes.
   When After a case is resolved against a candidate, they can submit an appeal (if allowed — checked via can-appeal endpoint).
   Who sees it Candidate — their own appeals. Admin/Proctor — all appeals for review.
   AUDIT MODULE — 3 Tables
7. AuditLog
   Aspect Detail
   What System-wide activity log. Every significant action across the platform: login, exam created, question edited, attempt started, grade changed, user role modified, etc. Captures actor (user/system/service), action name, entity affected, before/after JSON snapshots, IP, user agent, channel (Web/Mobile/Admin), outcome (Success/Failure), duration.
   When Should be written on every important operation. The service has LogAsync, LogSuccessAsync, LogFailureAsync, LogSystemActionAsync methods. Currently not wired into most operations — that's why the table is empty.
   Who sees it Admin only — full dashboard, search, entity history, user activity tracking, correlation tracking, failure analysis. Not visible to candidates or proctors.
8. AuditRetentionPolicy
   Aspect Detail
   What Rules for how long to keep audit logs. Configurable per entity/action/channel/actor type. Supports archiving before deletion. Has priority ordering and default policy.
   When Set up by admin. Executed periodically to clean old audit records.
   Who sees it Admin only — policy management UI.
9. AuditExportJob
   Aspect Detail
   What Tracks export requests for audit data. Supports CSV, Excel, PDF, JSON formats. Tracks status (Pending → Processing → Completed/Failed), file path, size, expiration.
   When When admin requests a filtered export of audit logs — e.g., "export all login failures from last month as CSV".
   Who sees it Admin only — can view their exports and download results.
   WHY ALL TABLES ARE EMPTY
   Module Root Cause
   Incident No incident has ever been created — neither automatically (the ProcessProctorIncidentAsync method exists but isn't called from proctor flow) nor manually. The system detects violations in proctor sessions but never creates an IncidentCase from them.
   Audit The IAuditService.LogAsync() calls are not wired into the application's operations. The service exists and works, but nothing calls it — no middleware, no interceptor, no manual calls in controllers/services.

======
For production version not for demo only,
aS pmO requirement.
the candidate can not see the Incident and not option to AppealRequest ( Will not use this Option).

For Proctor-Center >> Session Details Page /proctor-center/{sessionId}
I have some notes:

Note1:
If the candidate switch tab or any other violations,he can see the warining but the proctor can not see it.
Solution or suggest better if you have:
All browser violations (tab switch, face lost, minimize, etc.) must be pushed in real time (Smart Polling with SignalR Priority)
(Should be using background job not effect the candidate actions on exam)
-Display Events Log in this page

Note2:
the actions in Exam Control (terminsate - add time - add attempt ) it is all about real live sessions.
Solution or suggest better if you have:
Add action in proctor center session details ( Add time (SignalR)) Only action.
because terminate it already there and add attempt it is not a real time action (happens after candidatre submit exam), it is in Exam Operation Page.

Note3:
Incident Module, Full stack task backend and front page
(auto-create incidents from proctor violations + manual create + review + resolve)
Why auto-create, the violations dispaly in events log and if the proctor want to take an action he can do it manually?
the candidate can not see the Incident and not option to AppealRequest ( Will not never use this Option)
So I think no need for auto , what do you think?

Note4:
Full stack task the Audit Log capturing key actions (login, exam start, submit, force-end)

##

Okay Perfect, Let's continue with next Note 5:
It's really high sensetive, Do not break any flow or logic
This is a critical flow change. Let me analyze the full impact before touching anything.

Perfect. Let me consolidate everything into final confirmed points.

Currently, when a candidate enters an exam and leaves without submitting (for example by closing the tab or browser), the system keeps the attempt in an “In Progress” state and allows the candidate to resume it later. However, based on the business requirement for the production version, this behavior must be removed. There should be no “In Progress” or automatic resume option.
If a candidate exits the exam without submitting, the attempt must be permanently closed (e.g., marked as Abandoned or Not Submitted) and cannot be reused. If the candidate needs to take the exam again, only the Admin or Proctor can grant a new attempt from the Exam Operations screen, which will appear under a separate “Resume” section for the candidate.
All such actions must be recorded in the Audit log.

Note 1: What happens with the timer when candidate disconnects and returns?
The EndTime is set once at start and never pauses. The timer is server-side.
So your understanding is exactly correct:

Scenario What happens
Exam = 60 min, disconnect after 10 min, return after 30 min Timer shows ~30 min remaining. Candidate continues.
Exam = 60 min, disconnect after 10 min, return after 65 min Timer shows 0. Frontend detects expired → auto-submits or shows "Expired".
The timer never stops. It's based on EndTime which is fixed in the database. This is already good security — candidate can't "pause" an exam by closing the browser

Note 2: Can proctor/admin tell WHY an attempt expired?
When an attempt expires, it gets Status = Expired in both cases:

Timer ran out while candidate was active
Timer ran out while candidate was disconnected

public enum AttemptStatus
{
NotStarted = 0,
InProgress = 1,
Submitted = 2,
Expired = 3,
Graded = 4,
Abandoned = 5,
Resumed = 6
}

From the exam configuration:

Time Type StartDateTime EndDateTime DurationMinutes Behavior
Fixed Set Set Set All candidates start at StartDateTime, exam ends at StartDateTime + Duration or EndDateTime (whichever first)
Flexible Set Set Set Candidate can start anytime between StartDateTime and EndDateTime, gets DurationMinutes from their start time. But if StartTime + Duration > EndDateTime, exam cuts short at EndDateTime

Note 3: What is the current Resume status business logic?

- Keep the existing enum as-is. Add ExpiryReason sub-field to the Attempt entity.
  public enum AttemptStatus
  {
  NotStarted = 0,
  InProgress = 1,
  Submitted = 2,
  Expired = 3, // All expiry scenarios use this + ExpiryReason
  Graded = 4,
  Abandoned = 5, // NOT USED — remove from frontend display
  Resumed = 6 // New attempt granted by admin/proctor
  }

public enum ExpiryReason
{
None = 0,
TimerExpiredWhileActive = 1, // Candidate was working, timer ran out
TimerExpiredWhileDisconnected = 2, // Candidate left, timer ran out (detected via heartbeat gap > 5 min before expiry)
ExamWindowClosed = 3 // Exam EndDateTime passed
}
Point 3: Force-End via SignalR When EndDateTime Hits
If candidate is mid-exam and exam's EndDateTime arrives → force-end immediately via SignalR. Auto-submit their current answers, set Expired + ExamWindowClosed. Candidate sees "Exam window has closed" message.

Point 4: Resumed Status for New Attempts
When admin/proctor grants a new attempt:

NEW attempt → Status = Resumed (not NotStarted) — so candidate knows it's a second chance
ORIGINAL attempt → stays as Expired (with its ExpiryReason) — preserved for audit
Add ResumedFromAttemptId field on new attempt to link back to original
