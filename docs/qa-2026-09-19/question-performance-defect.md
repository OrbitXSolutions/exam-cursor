# D46 — Incomplete and inaccurate question-performance reports

Classification: SIMULATED TEST using actual HTTP calls, completed grading records, report generation, and persisted report retrieval. No browser or physical claim.

Before: exam 128's report counted only manually completed grading session 206, omitting four AutoGraded sessions. UnansweredCount was hardcoded to zero. Exam 123's dynamic questions were entirely missing because the report enumerated authored exam-question rows instead of the questions actually taken. The independent baseline failed 13/14 checks (`harness/d46-before2.json`).

Minimal production change: `Backend-API/Infrastructure/Services/ExamResult/ExamResultService.cs`, GenerateQuestionPerformanceAsync. Include AutoGraded and Completed grading sessions; union authored unused questions with actual graded question IDs; take maxima from saved AttemptQuestion points when available; count persisted blank answer content. No grades are recalculated. IncorrectAnswers retains its existing meaning (all answers that are not correct); UnansweredCount is a subset rather than a newly invented exclusive category.

After restart 6: all 14/14 checks pass (`harness/d46-after.json`). The independent oracle enumerates the five eligible grading sessions, fetches each answer, and recomputes total/correct/blank counts, mean scores and correct rates. Question 131 has five answers, three correct, one blank; questions 132–134 each have five answers, two correct, two blank. Dynamic exam 123 includes all six questions from completed attempt 193. Reading the saved report exactly matches the generated report.

The test intentionally refreshed persisted performance reports for QA exams 123 and 128. No source questions, exam settings, attempts, grades, or results were changed by this regression.
