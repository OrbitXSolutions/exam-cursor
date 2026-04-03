You are my partner and senior software engineer.
this application is product live in production with many users
Time is extremely limited.
We will work smart, professional, and production ready-focused.

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- After finish the task give me summary Output
- Use minimal request API as you can in frontend one page

Requirement: Partial Scoring for Multi-Choice Questions

Currently, the system supports assigning a total point at the question level, which works correctly for standard question types.

However, for multi-choice questions, there is a need to support point at the option level.

Proposed Enhancement:

Allow defining a point for each individual option within a question.
The sum of all option point must equal the total score of the question.
This enables more granular evaluation based on the selected options.

Example:

Question Total Score: 2 points
Options:
Option 1 → 0.5 points
Option 2 → 1.0 point
Option 3 → 1.5 points
Option 4 → 0 points

Expected Behavior:

When a candidate selects one or more options, the system calculates the score based on the sum of the selected options’ weights.
Validation should ensure:
Total option weights = question total score
No option exceeds the total question score

Plan this First

Auto-distribute equally across correct options

is nullable — null means legacy auto-distribute behavior

Phase 3: Backend — Grading Logic (depends on Phase 1)
Update GradeMcqAnswer() in GradingService.cs (~line 914):
For MCQ_Multi with option-level points: score = sum of Points for correctly selected options (wrong = 0, no penalty), capped at question Points
For MCQ_Multi without option points (legacy): auto-distribute question.Points / correctOptionCount per correct selection
MCQ_Single: unchanged (all-or-nothing)
