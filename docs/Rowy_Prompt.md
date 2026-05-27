You are my partner and senior software engineer.
this application is product live in production with many users
Time is extremely limited. Free of Error and High performance
We will work smart, professional, and production ready-focused.

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- After finish the task give me summary Output
- Use minimal request API as you can in frontend one page
- Do not Change or break any flow
- Ask me or take permission anytime
  Do not trust documentation or memory as the source of truth. They may be outdated. The current codebase is the only reliable source—inspect it deeply and verify every assumption against the actual implementation.
- After implementation, list changed files and manual QA cases.
  and make sure build is success
  This is a production system. Safety is more important than speed. If you are unsure, stop and explain the risk instead of guessing.

The buiness user want a new feature when candidate Walkin-Registration (Self-Registration) (Email - name - Phone)
he want to add more feild per exam requirement
(Dynamic Field)
What is the best, High Performance to do that without break current flow?

Email: super-admin@smartexam.local
Password: Smart@26Super5
tASK :
aS aDMIN, Instructor
I nned to seed Email Notification logs
to confrim Whether the email sent to candidates or not

Now the Email Menu is only for Superadmin
(Allow - Admin also to see the side nav Ema Back and Front)

--- Review the task
Good.

Now perform a final production safety review for this implementation.

Tasks:

1. Re-check for any broken imports, unused imports, type errors, or lint issues.
2. Verify no existing form behavior changed except the dropdown loading behavior.
3. Verify subjectId/topicId types remain exactly compatible with existing submit API payloads.
4. Verify topic selection fully resets when subject changes.
5. Verify no duplicate API requests or infinite re-render loops exist.
6. Verify dropdown closes correctly after selection.
7. Verify Load More appends instead of replacing existing items.
8. Verify search resets pagination correctly.
9. Verify no memory leaks from debounce timers or async state updates after unmount.
10. Verify accessibility/basic keyboard interaction still works.

Then provide:

- Final changed files list
- Manual QA checklist
- Any remaining risks or edge cases
- Whether this is safe to push to production

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

=====================
I need the same two improvements applied to the Terminated Attempts page that were already done on the Candidate Result page.

FILE: Frontend/Smart-Exam-App-main/app/(dashboard)/results/terminated-attempts/page.tsx

---

### CHANGE 1 — Filters always visible when no results

**Current problem:**
The loading spinner, EmptyState, and the entire <Card> (table) are in a ternary block:

{loadingData ? <LoadingSpinner/> : filteredAttempts.length === 0 ? <EmptyState/> : <Card>...</Card>}

When filteredAttempts.length === 0, the whole Card disappears including nothing to show. But the filters (Exam select + Search input) are ABOVE this block in a separate <div> — they stay visible.  
So actually the filters don't disappear here — the bug is that the summary stat Cards (the 4 count cards) use `terminatedAttempts` counts which are client-side computed and still show correct counts.

### CHANGE 2 — Server-side pagination

This is inefficient — pagination needs to be server-side.

Default page size = 10.
Preserve all existing functionality: Allow New Attempt dialog, Show Reason dialog, action dropdowns.
Do NOT change the bilingual (Arabic/English) labels.

Storage in DB:

Column Value Purpose
PasswordHash AQAAAAIAAYagAAAAE... ASP.NET Identity hash — login only
EncryptedPassword Base64(IV + AES ciphertext) Recoverable for email delivery
Is it sent via email?
Yes — NotificationService calls \_encryption.Decrypt(user.EncryptedPassword) and includes the plain password in the welcome email to the candidate. This is by design so admins can send login credentials.

Is this secure?
The EncryptedPassword field is AES-256 encrypted — not plain text. The decryption key comes from EncryptionSettings:Key in appsettings.json. As long as that key is protected (environment variable / secrets manager in production), the stored data is safe even if the DB is compromised.

Summary: Password field on the "Create Candidate" form is optional — leave it blank to auto-generate one. Either way, the candidate receives it via email and can log in with it.

Summary
Changed file: CandidateService.cs:154

What was done: After candidateAttempts is fetched (already in memory), added a 5-line in-memory filter for regular non-walk-in candidates:

EndAt = null → always visible
EndAt >= now → still open or upcoming → visible
Candidate has an attempt for it → keep (result review access preserved)
Everything else (expired, never attempted) → removed from the list
Zero extra DB queries — reuses candidateAttempts already fetched on that path.

Walk-in candidates → untouched (their branch was already correct).
