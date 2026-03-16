┌─────────────────────────────────────────┐
│ Exam Question Component │
│ ┌───────────────────────────────────┐ │
│ │ Question Text + Image │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ Embedded Spreadsheet (Sandboxed) │ │
│ │ ┌─────────┬───────────┐ │ │
│ │ │ Value │ Frequency │ (readonly)│ │
│ │ │ 1 │ 1 │ │ │
│ │ │ 2 │ 2 │ │ │
│ │ │ 34 │ 3 │ │ │
│ │ │ 43 │ 3 │ │ │
│ │ │ 5 │ 11 │ │ │
│ │ ├─────────┴───────────┤ │ │
│ │ │ Workspace Area │(editable)│ │
│ │ │ =AVERAGE(A2:A6) │ │ │
│ │ │ =STDEV(B2:B6) │ │ │
│ │ └─────────────────────┘ │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ Answer Input │ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

Analysis: Embedding Excel-like Spreadsheet in Exam
Great question — this is a common challenge in statistics exams. Let me analyze the options:

The Problem
Candidates get tabular data (like the Value/Frequency table in your image)
They need to perform statistical calculations (mean, median, std dev, etc.)
A basic calculator is clunky for tabular data
Must NOT break exam security (no file access, no internet, no data leakage)
Recommended Solution: Embedded Spreadsheet Component (Handsontable + HyperFormula)
Criteria Rating
Excel-like experience ✅ Full grid with formulas
Statistics coverage ✅ 400+ Excel functions (AVERAGE, STDEV, MEDIAN, FREQUENCY, SUM, etc.)
Security ✅ 100% client-side, no external connections
React integration ✅ Official React wrapper
Offline/sandboxed ✅ Runs entirely in browser
How It Would Work
Question has a table → System auto-populates the spreadsheet with question data (read-only cells)
Candidate gets a workspace area → Extra rows/columns where they can type formulas like =AVERAGE(A1:A5), =STDEV(B1:B5)
No security risk because:
No clipboard access to/from external apps
No file import/export
No internet/API calls
No macros
Runs entirely inside the exam React app
All formula usage logged for audit
Architecture
Security Measures
Measure Implementation
No external clipboard Disable paste from outside, internal only
No file import/export Remove all file buttons
No internet No external data source connectors
No macros/scripts Disabled entirely
Audit trail Log every formula the candidate uses
Data isolation Spreadsheet state lives only in React state
Read-only question data Lock cells containing question data
Function whitelist Only allow statistical/math functions
Alternative Options Considered
Option Pros Cons
Handsontable + HyperFormula Best balance of features, security, React support Commercial license for production
Univer (open source) Full Excel clone, free Heavier, newer project
react-spreadsheet Lightweight, free Limited formula support
Custom calculator upgrade No new dependency Poor UX for tabular data
My Recommendation
Go with Handsontable + HyperFormula because:

It covers 90%+ of Excel statistical functions your candidates need
It's fully sandboxed — zero security risk
Question tables can be pre-loaded automatically
Familiar Excel UI — candidates won't struggle
Official React integration
Implementation Impact
Frontend: New ExamSpreadsheet component, integrated into question view when allowCalculator: true and question has table data
Backend: Store table data in question model (already possible with your question structure), log formula usage
Database: Minor — add tableData JSON field to question if not exists
Existing flows: Zero impact — this is additive, the calculator stays as fallback

---

Handsontable Licensing
Handsontable has two options:

License Price Link
Free (Non-commercial) $0 Open source under RML License
Commercial Starting ~$590/dev/year https://handsontable.com/pricing
For your case: The business owner buys the commercial license from: https://handsontable.com/pricing

There's a free trial — you can develop with the free evaluation key "non-commercial-and-evaluation" and buy the license before going to production.

Understanding — No Backend/DB Changes
Clear:

No database changes
No question model changes
No backend changes
Table data is just an image in the question
Only add empty Excel sheet + calculator when isAllowCalculator = true
Candidate uses the blank spreadsheet as a working area (like scratch paper with Excel formulas)
Let me explore the frontend to understand the exam-taking UI structure before proposing the implementation plan.

---

Security Hardening
Disable paste from external clipboard (internal cell copy/paste only)
No file import/export buttons
No external data connectors
No macros
Disable right-click context menu external options
Function whitelist: only Math/Stats/Financial formulas

---

Answers First
License key: No account needed for development. I'll use "non-commercial-and-evaluation" for now. When you buy: go to https://handsontable.com/pricing → purchase → you'll get a key like xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
Production key in config: I'll put it in .env.local as NEXT_PUBLIC_HANDSONTABLE_LICENSE_KEY so it's configurable per environment

---

Summary
What was done:

# Change File

1 Installed packages handsontable@17.0.0, @handsontable/react-wrapper@17.0.0, hyperformula@3.2.0
2 License key in env .env.local — NEXT_PUBLIC_HANDSONTABLE_LICENSE_KEY=non-commercial-and-evaluation
3 New component components/exam/exam-spreadsheet.tsx
4 Integrated into exam exam-page.tsx/take-exam/[attemptId]/exam-page.tsx)
Spreadsheet Features:
400+ Excel formulas via HyperFormula (SUM, AVERAGE, STDEV, MEDIAN, IF, COUNT, MIN, MAX, etc.)
Draggable — same UX pattern as the existing calculator
Resizable — drag bottom-right corner to resize
Maximize/Minimize — expand to full screen or collapse to title bar
Clear all — reset button to wipe data
Dark/Light theme — auto-detects and matches exam theme
Formula hints bar — shows common formulas at top
15 rows × 8 columns with auto-expanding spare rows
Context menu — right-click to add/remove rows/columns, undo/redo
Column resize — drag column/row borders to resize
Security:
No file import/export
No macros
No external data connectors
Context menu restricted to grid operations only (no external links)
Runs 100% client-side, no network calls
How it works:
When isCalculatorAllowed = true → both Calculator and Spreadsheet buttons appear in the exam toolbar
They auto-hide when navigating to questions that don't allow calculator
Spreadsheet uses green accent (emerald) to visually distinguish from Calculator (blue)
z-index 9997 (below calculator at 9998) so they don't conflict
For production:
Buy license at https://handsontable.com/pricing
Replace non-commercial-and-evaluation with your purchased key in .env.local:
NEXT_PUBLIC_HANDSONTABLE_LICENSE_KEY=your-xxxxx-xxxxx-xxxxx-xxxxx

Not Work as Excel So, Next Solution:

Good question. Here's why actual Microsoft Excel can't work here:

Embedding real Excel in a browser requires:

Microsoft 365 subscription (paid, per-user)
Internet connection to Office Online servers
OneDrive/SharePoint backend integration
Each candidate needs a Microsoft account or org-level anonymous access setup
Why that's a problem for your exam:

Security: Candidate could navigate the iframe to OneDrive, access cloud files, share data — breaks exam sandboxing
Dependency: If Microsoft servers are down or slow, the exam is blocked
Cost: Per-candidate licensing for every exam session
Privacy: Exam data passes through Microsoft cloud
What Univer gives you:

Runs 100% in the browser — no server, no internet, no account needed
Looks and works identical to Google Sheets/Excel (same toolbar, same formulas, same shortcuts)
Fully sandboxed — no file upload/download, no external connections
Free, open-source, Apache 2.0 license
Data stays only in the candidate's browser memory — disappears when they close the panel
In short: You can't safely embed real Excel in an exam. Univer is the industry-standard way to give candidates the exact Excel experience inside a web app without any external dependencies or security risks.

---

## Univer License

**Free & Open Source** — Apache 2.0 license. No cost for:

- All spreadsheet features (formulas, formatting, toolbar, charts)
- Commercial use
- No per-user or per-seat fees

They have paid "Univer Go" cloud features (collaboration server, import/export server) but we don't need those — the client-side spreadsheet is 100% free.

---

## OneDrive Excel Sheet Option

If the organization already has Microsoft 365 / OneDrive, this **is technically possible**. Here's the honest evaluation:

### How it would work:

1. Pre-create a blank Excel template on the org's OneDrive/SharePoint
2. Embed it via an `<iframe>` using Microsoft's embed URL: `https://your-org.sharepoint.com/...&action=embedview&wdAllowInteractivity=True`
3. Candidate gets a full Excel Online experience — the real thing

### Pros:

- **100% real Excel** — nothing to explain to candidates
- Zero additional cost if org already has M365
- All formulas, formatting, charts work perfectly

### Risks/Challenges:

| Concern                     | Impact                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Internet required**       | If internet drops during exam, Excel iframe breaks                                                    |
| **Auth/Access**             | Candidates may need org credentials or you need anonymous links (security risk)                       |
| **Sandbox escape**          | Candidate could Right-click → "Open in Excel for the web" → navigate to OneDrive → access other files |
| **Per-candidate isolation** | Each candidate needs their own copy, otherwise they share the same sheet                              |
| **Audit trail**             | Microsoft logs who accessed what — GDPR/privacy implications                                          |
| **Latency**                 | Embedded Excel Online can be slow to load (3-5 seconds)                                               |

### My recommendation:

- If the org confirms and accepts the risks → it's doable with some iframe sandboxing (`sandbox="allow-scripts allow-same-origin"`)
- But it adds **external dependency** to the exam flow — if SharePoint is slow or down, exam is impacted
- **Univer is the safer choice** — same visual result, zero dependencies, zero cost, zero risk

### Decision needed from business:

Ask them: **"Are you okay with the exam depending on internet/Microsoft servers being available, or do you want it to work fully offline?"**

- If they say **"We accept the dependency"** → I embed OneDrive Excel
- If they say **"Must work without internet"** → Univer is the answer

What do they prefer?

Good point about internet being available anyway. The critical issue is the per-candidate isolation:

Can each candidate get their own copy?
Short answer: Not easily, and it creates major problems.

How it would have to work:
For each candidate starting an exam, the system would need to:

Call Microsoft Graph API to copy the template Excel file to a new file (e.g., Exam_Candidate_12345.xlsx)
Generate an embed URL for that specific copy
Show it in the iframe
Delete the file after exam ends
Problems with this approach:
Problem Why it's bad
Requires Microsoft Graph API integration New backend code: OAuth app registration, token management, file creation/deletion API calls
Azure AD App Registration Need admin to register an app in Azure portal with Files.ReadWrite.All permissions
100 candidates = 100 Excel files Created on OneDrive simultaneously, need cleanup after each exam
Race conditions If exam crashes/times out, orphan files remain on OneDrive forever
Backend changes Need new API endpoints to create/delete OneDrive files — violates "no backend changes" rule
Latency Graph API copy takes 2-5 seconds per candidate — delays exam start
Anonymous sharing risk Each generated link could be shared/forwarded — anyone with the link can access
Verdict:
It's possible but requires significant backend work (Microsoft Graph API integration, Azure AD setup, file lifecycle management). It turns a simple "give candidate a spreadsheet" feature into a complex cloud integration project.

Recommendation:
Univer gives the same result with zero complexity:

Looks like Google Sheets/Excel (same toolbar, same formulas)
Each candidate automatically has their own isolated copy (it's in-browser memory)
No backend changes, no API integration, no file cleanup
Works even if internet is slow (no dependency on Microsoft servers loading)
Want me to proceed with Univer?
