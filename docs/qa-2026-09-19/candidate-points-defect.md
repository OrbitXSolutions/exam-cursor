# D42 — Completed dynamic exam card shows today's pool estimate

Root observed through the real browser that completed exam123 displays56.57 points although attempt193 and its result are out of56. Actual API reproduction confirms `Candidate/exams` returns56.57142857142857 while `Grading/attempt/193` returns the persisted attempt maximum56 (`harness/d42-before.json`). The question count already matches6.

Root cause: candidate discovery recomputes dynamic section points from the current question-bank average, even when the card represents a finished attempt with an existing question/points snapshot. Later pool changes therefore alter an already completed exam card.

Minimal fix in `Backend-API/Infrastructure/Services/Candidate/CandidateService.cs`, GetAvailableExamsAsync only: project each attempt's saved question count and point total, and use the latest finished attempt's values for the completed card. New/unstarted/active attempt pool selection and estimation semantics remain unchanged. No question-bank or exam configuration was modified.

Fix is live after restart 6. The post-fix API regression passed 2/2 checks (`harness/d42-after.json`): completed card points now equal the saved maximum 56 and its question count equals 6. Root owns the separate real-browser recheck. This is not a claim of historical question-content immutability: the separate source-question snapshot/design finding remains unresolved.
