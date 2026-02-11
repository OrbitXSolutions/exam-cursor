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
