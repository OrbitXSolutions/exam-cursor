# Baseline engineering checks

Executed 2026-09-19 around 14:45–14:49 UAE time. These are supplemental engineering checks, not substitutes for business QA.

| Check | Result | Evidence |
| --- | --- | --- |
| Backend `dotnet test Backend-API.Tests/Backend-API.Tests.csproj` | PASS: 194 passed, 0 failed, 62 skipped, 256 total; test duration 9 seconds | `backend-tests.log`, `test-results/baseline.trx` |
| Frontend `pnpm typecheck` | PASS, exit 0 | `frontend-typecheck.log` |
| Frontend `pnpm lint` | PASS exit 0, but 80 warnings, 0 errors | `frontend-lint.log` |
| Frontend production `next build` in isolated copied source | PASS exit 0; Turbopack compiled in 17.0 seconds; 109 routes listed | `frontend-build.log` |
| Frontend API proxy regression suite against newly built isolated artifact | PASS: 7/7 | `frontend-tests-built.log` |

## Important limits and observations

- The 62 skipped backend tests are SQL integration tests gated by `TEST_SQLSERVER_CONNECTION`. They were not enabled: fixture code calls `EnsureCreatedAsync`, and concurrency tests execute `ALTER TABLE` to inject failures. This QA session must not change schema. SQL-backed runtime workflows are covered separately through the running product and existing schema.
- Lint warnings include React effect dependency warnings, unoptimized image elements, and a TanStack Table/React Compiler compatibility warning. No suppression was added.
- Production build ran in `%TEMP%\smartexam-qa-build-20260919`, copied from the frontend source. A node_modules directory junction reused installed dependencies. The first attempt failed because Turbopack rejected the junction outside its root. A TEMP-COPY-ONLY `turbopack.root = 'C:/'` setting allowed the normal build to complete. Product source/config was not altered for this procedure.
- Build warns that the transitive `fstream` dependency's `rimraf` cannot be externalized from the project directory. Build still completes; baseline-browser-mapping also reports stale data. These warnings are not proof of a runtime defect.
- The API proxy suite starts real local HTTP servers with a mocked upstream backend and production Next artifact. It verifies forwarding semantics, not real database business behavior. It is a SIMULATED INTEGRATION TEST.
- All baseline checks left the active development server running. No production files were changed by the environment/check agent.
