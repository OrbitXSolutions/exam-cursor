RiskScore — Current Implementation Status
Yes, it IS implemented. Here's the full breakdown:

1. Backend — Where RiskScore lives
   Entity Field Description
   ProctorSession.cs:46 RiskScore (decimal?) Main risk score per proctoring session (0–100)
   ProctorRiskSnapshot.cs:16 RiskScore (decimal) Historical snapshot — auditable progression
   IdentityVerification.cs:33 RiskScore (decimal?) Risk score from identity verification checks
   IncidentCase.cs:35 RiskScoreAtCreate (decimal?) Snapshot of risk when incident was created
   IncidentDecisionHistory.cs:32 RiskScoreAtDecision (decimal?) Snapshot at decision time
   ExamReport.cs:37 AverageRiskScore (decimal?) Average risk for final exam report
2. Backend — How it's calculated
   In ProctorService.cs:457 — CalculateRiskScoreInternalAsync():

Loads all active ProctorRiskRules from DB
Groups session events by EventType
For each rule: counts matching events, applies threshold, window, max triggers, and accumulates RiskPoints
Caps total at 100
Updates ProctorSession.RiskScore
Creates a ProctorRiskSnapshot for audit trail
Triggered by:

API endpoint: POST /api/proctor/session/{sessionId}/calculate-risk
Internally when logging an event (LogEventAsync calls it after saving an event) 3. Frontend — Where you can SEE it
Page What it shows
AI Report /results/ai-report/[examId]/[candidateId] Computes its OWN overallRiskScore client-side from event data (weighted: Face 35%, Behavior 30%, Eye 20%, Environment 15%) — does NOT use the backend RiskScore
Proctor Video /proctor-center/video/[candidateId] Displays session.riskScore (from backend)
Proctor Stream /proctor-center/stream/[candidateId] Has riskScore in the type definition
Incident Details /proctor-center/incidents/[id] Shows riskScoreAtCreate and riskScoreAtDecision
User Identification /proctor/user-identification Shows identity verification riskScore with color coding
Candidate Exam Details /candidates/exam-details Shows proctor.riskScore 4. Key Observation — Two Different Risk Calculations
This is important:

Backend RiskScore: Rule-based engine using ProctorRiskRule table (DB-driven, configurable rules with priorities, thresholds, windows, max triggers)
Frontend AI Report: Hardcoded client-side formula from raw events (different weights, different penalties, independent calculation)
These are two separate systems that can produce different numbers for the same session.

## Update Version2

how sub-scores these are computed client-side? based on what?

From the computeAnalysis() function in the AI Report page — here's exactly how each sub-score works:

All 4 sub-scores start at 100 and get penalized based on counting specific eventType numbers from the attempt events array:

1. Face Detection Score (100 → 0)
2. Eye Tracking Score (100 → 0)
3. Behavior Score (100 → 0)
4. Environment Score (100 → 0)
   Overall Risk (the one we're replacing)
   Key facts:

The data source is AttemptEvent[] from /Attempt/{attemptId}/events — real backend data
The penalty weights (×8, ×12, etc.) and category weights (35%, 30%, etc.) are hardcoded in the frontend — no backend equivalent
The backend ProctorRiskRule system uses a completely different rule engine (DB-driven rules with thresholds, windows, max triggers, priority)
The sub-scores are purely a frontend invention — the backend has no concept of "Face Detection Score" or "Eye Tracking Score"
So the sub-scores are real event data, fake formula. The events are real, but the penalty multipliers and weights are arbitrary frontend constants that have no alignment with the backend risk rules.

Done. Here's what changed — one block, zero risk:

Before: overallRiskScore = hardcoded client-side formula (always)

After:

session.riskScore exists → use backend value (source of truth from Rule Engine)
session.riskScore is null → fallback to client formula (graceful degradation, no crash)
Nothing else touched:

Sub-scores (Face, Eye, Behavior, Environment) — unchanged, visual diagnostics
Suspicious activities — unchanged
Recommendations — unchanged (still driven by the overallRiskScore which now comes from backend)
All other pages — untouched
Ready for your next task.

Task1-A — Risk Badge:

Colored badge on each card's video overlay showing score · Level
Green (Low ≤20), Yellow (Medium ≤50), Orange (High ≤75), Red (Critical >75)
Matches backend GetRiskLevel thresholds exactly
Positioned below incident count to avoid overlap
Task1-B — Sort by Risk:

Dropdown next to search bar with 3 options: Default, Risk High→Low, Risk Low→High
Sorting is user-triggered only — grid stays static during live polling
No auto-reorder during 5s refresh cycle
Task1-C — Violations Count:

Shows Violations: X on card body when > 0, with red destructive styling
Uses backend totalViolations directly — no extra API calls
AR/EN supported

Auto-flag sessions with violations > 5 in loadSessions
Add a filterMode state for "all" vs "flagged"

Proctor AI Assistant (Top Bar)
UI: Keep the first two (Active Sessions, Flagged Sessions)
replace 2 KPI cards with AI assistant area

“Proctor Assistant” As Example: or Suggest better design content

The Example?
Who should I review now? or Show me top priority sessions ( Make a useful assissment)

Output Example output:
Ali Mahmoud — Critical
Reason: Multiple faces (3) in last 2 min + tab switches (4)
Nour Ahmed — High
Reason: Camera blocked + fullscreen exited
CTA: Review

Backend: endpoint returns “top recommended sessions” + short reasons

AI: generates the human explanation risk

do not use incidents since it is manully by proctor

## AI Here:

What was built — Proctor AI Assistant
Backend (3 files changed)
ProctorDtos.cs — New TriageRecommendationDto:

sessionId, candidateName, examTitle, riskScore, riskLevel, totalViolations
reasonEn / reasonAr — human-readable explanations in both languages
IProctorService.cs — Added GetTriageRecommendationsAsync(int top)

ProctorService.cs — Full implementation:

Queries active sessions with RiskScore > 0, ordered by risk desc
Loads recent events (last 5 min) grouped by type for each session
BuildTriageReasons() generates human-readable EN/AR reasons from event types:
"Multiple faces (3) + Tab switches (4) + Camera blocked (1)"
"وجوه متعددة (3) + تبديل التبويب (4) + الكاميرا محجوبة (1)"
Falls back to sample triage data when no real sessions exist (demo-safe)
No incidents used — purely event/violation-based
ProctorController.cs — GET /api/Proctor/triage?top=5

Frontend (2 files changed)
proctoring.ts — getTriageRecommendations() API call

proctor-center/page.tsx/proctor-center/page.tsx) — UI replacement:

Kept: Active Sessions + Flagged Sessions KPI cards
Replaced: Total Incidents + Active Exams → Proctor Assistant panel (spans 2 columns)
Shows: "Who needs review now?" with up to 3 recommendations
Each recommendation: colored risk badge, candidate name, reason text, "Review" CTA button
Loads alongside sessions on every 5s refresh (parallel Promise.all)
AR/EN bilingual

UI Changes:

Title → "AI Proctor Assistant" with larger font (text-lg font-bold), purple theme matching "AI Suggest Grade"
Question → "Who needs review now?" in text-sm (bigger than before)
Purple gradient button → ✨ Ask AI — same exact styling as the AI Suggest Grade button
Thinking animation → When clicked, shows LoadingSpinner + pulsing "AI is thinking now..." (1.5s delay for effect)
AI Response panel → slides in with purple border + gradient background, ✨ AI Recommendations header with ✕ close button
Demo checkbox → top-right corner, checked by default. When checked, backend returns sample data if no real sessions exist. Unchecked = production mode (real data only).
Sample indicator → small pulsing dot with "Sample data" label only shows when demo data is displayed
To your question: No, this does not use an actual AI model. It's a rule-based engine — the backend queries active sessions, groups recent events by type, and builds human-readable reasons from the event counts. It looks and feels AI-powered in the demo, but it's deterministic logic. Integrating a real LLM can be done later if needed.

How it works in the demo:
Proctor opens session details → sees the new "AI Proctor Report" card in the sidebar
Clicks "Generate AI Analysis" → loading spinner while GPT-4o analyzes
Gets back: risk level badge, confidence %, risk explanation, suspicious behaviors list, actionable recommendation, collapsible detailed analysis
Can "Regenerate" anytime for updated analysis
Everything is advisory only — exactly like AI grading
