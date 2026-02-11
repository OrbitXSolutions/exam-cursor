that means ExamQuestions will not be used?

ExamQuestions is still used - but only for Manual mode (when admin manually picks specific questions).

Mode ExamQuestions AttemptQuestions
1- Manual (admin picks questions) ✅ Used ✅ Copied from ExamQuestions
2- Builder (random from QuestionBank) ❌ Empty ✅ Picked at attempt start
Summary:
Manual Mode: Admin selects specific questions → stored in ExamQuestions → copied to AttemptQuestions when candidate starts

Builder Mode: Admin configures "pick 3 questions from Hardware Basics topic" → stored in ExamSections (SourceType, QuestionSubjectId, PickCount) → random questions picked from Questions table → saved directly to AttemptQuestions

Your current exam (ID 8) uses Builder mode only, so ExamQuestions stays empty. If you create an exam using Manual mode (picking individual questions), ExamQuestions will be populated.

Data Flow:
Builder sections store: SourceType, QuestionSubjectId, QuestionTopicId, PickCount
When candidate starts → questions randomly picked from QuestionBank → saved to AttemptQuestions (not ExamQuestions)
Each candidate can get different random questions from the same topics
To test:
Publish your exam (ID 8)
Login as a candidate
Start the exam
Check AttemptQuestions table - questions will appear there
Note: Admin preview/review won't show questions since they're generated per-attempt. Want me to add a "Preview" feature that generates sample questions for admin review?

### Points

Found it! The issue is PassScore validation:

PassScore: 25
Total Points for Builder sections: 1+1+1+3+1+1 = 8 points (default 1 point per question)

- Solution:
  Backend is running. Try publishing again now.

The fix: Validation now calculates total points using actual question points from QuestionBank instead of assuming 1 point per question.

Before: 8 points (1 × 8 questions)
After: ~47.5 points (actual points)
PassScore: 25 ✓ (25 < 47.5)

## Candidate:

Implemented all exam-taking flow improvements:

1. Instructions Page (instructions/page.tsx/take-exam/[attemptId]/instructions/page.tsx))

Added prominent exam title & description banner at the top
Added Ready Check Card with:
Fullscreen support detection (browser API check)
Webcam permission check (only if proctoring enabled)
Green/red badges for status indicators
Retry button for failed webcam permission
Summary message showing pass/fail status
Start button now disabled if any ready check fails 2. Security Features (already in exam-page.tsx/take-exam/[attemptId]/exam-page.tsx))

✓ Fullscreen enforcement on start
✓ Fullscreen exit detection with event logging
✓ Tab switching detection with event logging
✓ Copy/paste prevention with event logging 3. Section Navigation (already implemented)

✓ Tab locks for previous sections when lockPreviousSections enabled
✓ Section timer display with auto-advance when time expires
✓ canNavigateBack() enforces navigation rules 4. Server-Driven Timer (already implemented)

✓ Timer syncs with server every 60 seconds
✓ Auto-submit when overall time expires
✓ Event logging for timeouts 5. Translations

Added EN/AR strings for ready check UI (readyCheck, fullscreenSupport, webcamPermission, allChecksPassed, etc.)

## Exam Module --

After Exam Submission - Next Steps
When a candidate submits an exam, the typical flow is:

Grading - Auto-grade objective questions (MCQ, True/False)
Manual Grading - If essay/subjective questions exist
Result Calculation - Total score, pass/fail determination
Result Publishing - Make results visible to candidate
Certificate Generation - If candidate passed

Candidate Submits
↓

1. Attempt.Status = Submitted
2. AttemptEvent logged (EventType: Submitted)
3. GradingService.InitiateGradingAsync() auto-triggered
   ↓
4. GradingSession created
5. GradedAnswer records created per question
6. MCQ/TrueFalse auto-graded
   ↓
7. If all auto-gradable → FinalizeResultAsync() called
8. Result record created
9. CandidateExamSummary refreshed
10. If exam.ShowResults=true → Result auto-published

1 Attempts Status = 2 (Submitted), SubmittedAt populated, TotalScore filled
2 AttemptEvents New row with EventType = Submitted
3 AttemptAnswers One row per question with SelectedOptionIdsJson or TextAnswer
4 GradingSessions Status = AutoGraded (if all MCQ) or ManualRequired (if essay questions)
5 GradedAnswers One row per question with Score, IsCorrect
6 Results Final result record with TotalScore, IsPassed, IsPublishedToCandidate
7 CandidateExamSummaries Aggregated candidate-exam data

## Not Used Table

## Candidate result

Refactor the "Candidate Result" page UI/UX and table columns/actions.

SCOPE

- Update ONLY the Candidate Result listing page (View candidate results by exam).
- Keep existing data fetching logic as-is, but reshape UI & table mapping to match the required fields.
- Do not break existing features (score card view, certificate, proctor assets, etc.). If a feature already exists as a column/button, move it under Actions.

PAGE REQUIREMENTS

1. Filters / Header Controls
   A) Exam Filter

- Keep existing "Exam" dropdown.
- Keep refresh button if it exists.

B) Result Status Filter (NEW)
Add a filter dropdown named "Result Status" with values:

- All
- Passed
- Failed
- Under Review
- Not Published

Filtering behavior:

- "All": no status filtering
- "Passed"/"Failed": filter by final result status (Pass/Fail)
- "Under Review": attempts submitted but grading not completed / result not finalized
- "Not Published": result exists but not published to candidate (Published = false)

C) Search (Update)

- Search input should search by Candidate Name OR Candidate Email (not roll no).
- Search should filter the currently loaded results list (client-side) unless server-side search already exists.

2. Summary Card

- Keep the top summary card but rename it to reflect the filtered count:
  "Total candidates" = count after applying filters/search.

3. Table Structure
   Replace current table columns with EXACT columns below (same order):

Columns:

1. Sr. No.
2. Exam
3. Candidate (Name + Attempt Number)
   - Display format example:
     "Ali Mahmoud (Attempt #2)" or "Ali Mahmoud - Attempt 2"
4. Score (e.g., 78/100 if available; otherwise show numeric score)
5. Percentage (e.g., 73.68%)
6. Status (Pass/Fail)
   - Use clear badge styling (green for Pass, red for Fail)
7. Grading Status
   - Possible values:
     "Auto Graded" / "Manual Graded" / "Pending" / "In Review" (use what the backend provides; map safely)
8. Published (Yes/No)
   - Show a badge or small indicator

Remove/Move these old columns if they exist:

- Score Card, Certificate, Exam Analysis, Exam Review, AI Report, Candidate Video, Exam time, Screen Shots, etc.
  Instead: put them under Actions.

4. Actions Column (NEW)
   Add a final column: "Actions" with icon buttons / dropdown actions:

Actions required:

- View Details Go To (Exam Review )
- Score Card
- Publish Result
- Generate Certificate
- View Attempt
- View Proctor Report >> Go TO AI Report
- Candidate Video
- Screen Streaming

Rules:

- If “Published” is already true, disable/hide "Publish Result".
- If result is not graded yet (Under Review / Pending), disable/hide:
  - Publish Result
  - Generate Certificate
- Generate Certificate should be enabled only when:
  - Grading is completed AND
  - Candidate passed (or according to existing business rules if already implemented)

UI suggestion:

- Use a compact actions menu (kebab menu) OR a row of 3–5 icons with tooltips.
- Keep consistent with existing design system/components.

5. Data Mapping Notes (No routes)

- The table row must be built from existing attempt/result models already used in the page.
- Attempt Number: if not directly available, derive it safely (e.g., sort attempts by created date and index them) or display "Attempt" without number.
- Published flag: use the existing published property if present; otherwise add it to local view model from API response if already returned.

6. Robustness / Edge Cases

- If score or percentage is missing, display "—".
- If candidate email is missing, search by name only.
- Ensure table remains responsive with horizontal scroll only if truly needed.

## Storage Camera Recording Fixed ✅

Webcam stream is now kept alive continuously during the exam instead of opening/closing for each snapshot
Snapshots are taken every 60 seconds from the persistent stream
Added proper cleanup on exam end
Files are saved to MediaStorage/proctor-snapshots folder
