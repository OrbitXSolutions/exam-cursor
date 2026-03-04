## Question Attachment

now support only image
easily can support audio/video. (addsOn)

## Question with Excel

A Allow Excel file (open external app) 🔴 CRITICAL — candidate leaves exam browser, proctoring breaks, copy-paste risk, screen recording gap

B Embed Excel-like spreadsheet (e.g., Handsontable/SpreadJS)
🟡 Medium — heavy library, complex formulas may not match real Excel, licensing cost

C Built-in Scientific Calculator per question 🟢 LOW
— stays inside exam, no external app, proctoring intact

D Calculator + Formula Reference Sheet 🟢 LOW
— calculator + read-only formula cheat sheet displayed alongside question

My Recommendation: Option C + D combined
Built-in Scientific/Financial Calculator with these features:

Calculator Capabilities (covers 95% of Excel formula needs):
Basic: +, -, ×, ÷, %, parentheses
Scientific: sin, cos, tan, log, ln, √, ^, π, e
Financial: PV, FV, PMT, NPV, IRR, RATE (the main Excel financial functions)
Statistical: SUM, AVERAGE, MIN, MAX, COUNT, STDEV
Memory: M+, M-, MR, MC (like a real calculator)
History: Shows last 10 calculations so candidates can reference previous results

How it works:
Question-level flag: isCalculatorAllowed: boolean on the question entity
When true: A floating calculator button appears on that question during the exam
Calculator opens as a draggable panel inside the exam browser (like a popup calculator)
Stays inside the exam — proctoring camera, tab detection, screen recording all remain intact
No external app — zero security risk

Why NOT Excel:
Proctoring breaks — candidate alt-tabs out, screen capture misses it
Copy-paste — candidate can paste question into Excel, use AI add-ins
File sharing — candidate could open a pre-prepared Excel with answers
Incident system — your current proctoring flags tab switches as violations, Excel would trigger constant false positives
No control — you can't restrict what they do in Excel

and
Section mode: Only shows when the current section has at least one question with isCalculatorAllowed
Flat question mode: Only shows when the current question has isCalculatorAllowed
Auto-hides: When you navigate to a section/question that doesn't allow calculator, the calculator closes automatically
