You are my senior performance engineer and system architect.

Project: Smart Exam — enterprise online exam and proctoring platform.

Stack:

- Backend: .NET 9 Web API, Clean Architecture, EF Core, SQL Server
- Frontend: Next.js / React / TypeScript
- Features: exams, candidates, proctoring, results, dashboards, file uploads

Important rules:

- Do NOT rely on documentation or assumptions.
- The source code is the only source of truth.
- Do NOT implement fixes yet.
- Do NOT change UI/UX.
- Do NOT break existing functionality.

---

TASK:
Perform a FULL performance audit of the system before production release.

---

ANALYZE FRONTEND:

1. Detect duplicate API calls:
   - Same endpoint called multiple times unnecessarily
   - Re-renders causing repeated requests
   - useEffect dependency issues

2. Detect over-fetching:
   - Pages calling too many endpoints (e.g., 8–10 APIs on load)
   - Opportunities to merge endpoints into a single optimized API

3. Detect under-fetching / chatty APIs:
   - Many small API calls instead of one aggregated response

4. Check:
   - useMemo / useCallback usage
   - unnecessary re-renders
   - large components without memoization

5. Check:
   - data fetching strategy (SSR, CSR, caching)
   - loading waterfalls

---

ANALYZE BACKEND:

6. Detect slow queries:
   - Missing indexes
   - N+1 query problems (EF Core Includes misuse)
   - unnecessary joins

7. Detect:
   - repeated DB calls for same data (no caching)

8. Detect:
   - heavy endpoints returning too much data

9. Detect:
   - endpoints that should be merged

10. Analyze:

- DTO size and payload size

---

CACHING:

11. Analyze caching strategy:

- Is MemoryCache or Redis used?
- What is cached?
- What SHOULD be cached but is not?

12. Detect:

- missing cache for:
  - lookups
  - static data
  - exam configuration
  - question bank

13. Detect:

- cache invalidation issues

---

API DESIGN:

14. Suggest:

- endpoints that can be merged
- endpoints that should be split

15. Detect:

- unnecessary network round trips

---

REAL PERFORMANCE RISKS:

16. Identify:

- worst performance bottlenecks in the system
- what will break under load (1000+ candidates)

17. Identify:

- critical paths during exam:
  - start exam
  - submit answers
  - autosave
  - proctoring events

---

OUTPUT FORMAT:

1. Critical performance issues
2. High / Medium / Low issues
3. Exact files, endpoints, components involved
4. Why it is a problem
5. Recommended fix
6. Expected performance gain
7. Whether DB/index changes are required

---

FINAL STEP:

Generate a file:
PERFORMANCE_AUDIT_REPORT.md

Include:

- Summary
- Top 10 optimizations
- Quick wins (can be fixed in 1–2 days)
- Advanced optimizations
- Scalability recommendations

---

## --- For Security

You are my senior performance engineer and system architect.

Project: Smart Exam — enterprise online exam and proctoring platform.

Stack:

- Backend: .NET 9 Web API, Clean Architecture, EF Core, SQL Server
- Frontend: Next.js / React / TypeScript
- Features: exams, candidates, proctoring, results, dashboards, file uploads

Important rules:

- Do NOT rely on documentation or assumptions.
- The source code is the only source of truth.
- Do NOT implement fixes yet.
- Do NOT change UI/UX.
- Do NOT break existing functionality.

---

TASK:
Perform a FULL performance audit of the system before production release.

---

ANALYZE FRONTEND:

1. Detect duplicate API calls:
   - Same endpoint called multiple times unnecessarily
   - Re-renders causing repeated requests
   - useEffect dependency issues

2. Detect over-fetching:
   - Pages calling too many endpoints (e.g., 8–10 APIs on load)
   - Opportunities to merge endpoints into a single optimized API

3. Detect under-fetching / chatty APIs:
   - Many small API calls instead of one aggregated response

4. Check:
   - useMemo / useCallback usage
   - unnecessary re-renders
   - large components without memoization

5. Check:
   - data fetching strategy (SSR, CSR, caching)
   - loading waterfalls

---

ANALYZE BACKEND:

6. Detect slow queries:
   - Missing indexes
   - N+1 query problems (EF Core Includes misuse)
   - unnecessary joins

7. Detect:
   - repeated DB calls for same data (no caching)

8. Detect:
   - heavy endpoints returning too much data

9. Detect:
   - endpoints that should be merged

10. Analyze:

- DTO size and payload size

---

CACHING:

11. Analyze caching strategy:

- Is MemoryCache or Redis used?
- What is cached?
- What SHOULD be cached but is not?

12. Detect:

- missing cache for:
  - lookups
  - static data
  - exam configuration
  - question bank

13. Detect:

- cache invalidation issues

---

API DESIGN:

14. Suggest:

- endpoints that can be merged
- endpoints that should be split

15. Detect:

- unnecessary network round trips

---

REAL PERFORMANCE RISKS:

16. Identify:

- worst performance bottlenecks in the system
- what will break under load (1000+ candidates)

17. Identify:

- critical paths during exam:
  - start exam
  - submit answers
  - autosave
  - proctoring events

---

OUTPUT FORMAT:

1. Critical performance issues
2. High / Medium / Low issues
3. Exact files, endpoints, components involved
4. Why it is a problem
5. Recommended fix
6. Expected performance gain
7. Whether DB/index changes are required

---

FINAL STEP:

Generate a file:
PERFORMANCE_AUDIT_REPORT.md

Include:

- Summary
- Top 10 optimizations
- Quick wins (can be fixed in 1–2 days)
- Advanced optimizations
- Scalability recommendations
