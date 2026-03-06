Investigation Complete — Here's the situation:
You're right. Here's what currently happens:
Candidate starts exam → status = Started
Answers first question → status = InProgress
Candidate disconnects (internet drops, browser crash, etc.)
Timer keeps counting server-side (ExpiresAt is fixed)
Candidate reconnects → calls GetAttemptSessionAsync → status is still InProgress and time not expired → full resume allowed
Candidate continues as if nothing happened ✅
The Gap (Security Risk):
During the disconnect window:

Heartbeat stops (last heartbeat goes stale after 45s)
Snapshots stop (no webcam uploads)
WebRTC video feed drops → proctor sees nothing
No tab/clipboard/fullscreen events logged
The system logs ProctorEventType.NetworkDisconnected but takes no action beyond logging
No limit on how long the candidate can stay disconnected
Candidate could disconnect for 20 minutes, cheat freely, reconnect, and continue
The only protection is ExpiryReason.TimerExpiredWhileDisconnected — but that only fires after the full exam time runs out, not during the disconnect.

## Solution

Candidate disconnects → heartbeat stops
↓
After 45s, system detects stale heartbeat
↓
Background job starts counting disconnect time
↓
Cumulative disconnect > 60 seconds → auto-EXPIRE attempt
↓
ExpiryReason = DisconnectTimeout
↓
Log AttemptEvent with reason
↓
Candidate comes back → sees "Exam Expired"
↓
Proctor can grant new attempt via Resume tab (existing flow)

## Implementation Complete — Disconnect Budget (60s Max)

Detection Points (covers all candidate API calls):
Heartbeat arrives → ProctorService detects gap > 45s from last heartbeat → accumulates → expires if > 60s
GetSession called → AttemptService checks ProctorSession.LastHeartbeatAt staleness → same logic
SaveAnswer called → same check
GetTimer called → same check
What happens:
Candidate disconnects 65 seconds → reconnects → first API call (heartbeat/getSession/saveAnswer) → instant expiry
Multiple short disconnects (30s + 35s) → budget exceeded on second reconnect → expired
Candidate never comes back → existing timer expiry handles it naturally
Zero impact on normal flow. No frontend changes needed. Existing resume flow handles proctor granting new attempts.

---

## Access Policy for Exam:::

# Change Status

1 Auto-create AccessPolicy on exam creation (IsPublic=true) Done
2 Double safety — no AccessPolicy = hidden from candidates Done
3 RestrictToAssignedCandidates enforcement in candidate listing Done
4 AccessPolicyStatus field in ExamListDto + Access column (Public/Assigned badges) in admin exam list Done
5 Info note in publish success dialog about default access policy Done
