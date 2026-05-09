# SQL Joins and IQueryable Scoping Investigation - 2026-05-09

## Scope

Investigated this performance/security recommendation:

> Prefer SQL joins and IQueryable scoping over loading role/user IDs into memory.

No implementation changes were made. This report only inspects the latest local code.

Source of truth used:
- `Backend-API/Infrastructure/Services`
- `Backend-API/Controllers`

## Executive Verdict

The codebase is partially aligned.

The strongest/latest RBAC scoping code uses `IQueryable` well. `ResourceAuthorizationService` returns scoped query expressions and keeps department/candidate/proctor access inside SQL-translatable predicates. `UserService.GetStaffUsersAsync` also uses SQL joins/subqueries instead of loading all role users into memory.

But the codebase is not fully consistent. Several older or adjacent paths still load role user IDs, candidate IDs, or entity sets into memory and then use `Contains(...)` against the main query. Some of those are acceptable for small selected pages or explicit user-selected IDs, but others are high-growth paths and should be converted to SQL joins/subqueries.

## What Is Good

### ResourceAuthorizationService

Source:
- `Backend-API/Infrastructure/Services/Authorization/ResourceAuthorizationService.cs`

Good patterns:
- `ScopeAttemptsAsync(...)`
- `ScopeResultsAsync(...)`
- `ScopeProctorSessionsAsync(...)`
- `ScopeUsersAsync(...)`
- `GetAccessibleExamIdsAsync(...)`

Behavior:
- Accepts an existing `IQueryable`.
- Adds `Where(...)` predicates without materializing the full result set.
- Uses SQL-translatable subqueries such as:
  - department exam ownership
  - `ExamProctors.Any(...)`
  - candidate assignments/attempts
  - candidate IDs from attempts/assignments

Status:
- Good. This is the correct pattern and should remain the source of truth for data scoping.

### Staff Users

Source:
- `Backend-API/Infrastructure/Services/UserService.cs`

Good method:
- `GetStaffUsersAsync`

Good patterns:
- Excluded Candidate users are resolved by SQL join:
  - `IdentityUserRole<string>`
  - joined with roles
  - projected as `IQueryable<string>`
- Role filter is also a SQL join/subquery.
- Applies `ScopeUsersAsync(query)` before count and pagination.
- Uses `CountAsync()`, `Skip(...)`, `Take(...)`.

Status:
- Good. This is the preferred pattern.

### Main List Services

These services generally keep filters as `IQueryable` until paging:

- `AssessmentService.GetAllExamsAsync`
- `QuestionBankService.GetAllQuestionsAsync`
- `LookupsService` list methods
- `GradingService.GetGradingSessionsAsync`
- `ExamResultService.GetResultsAsync`
- `ExamResultService.GetCandidateResultListAsync`
- `ProctorService.GetSessionsAsync`
- `AttemptService.GetAttemptsAsync`
- `AuditService` list methods
- `NotificationService.GetLogsAsync`
- `DepartmentService.GetAllAsync`

Status:
- Mostly good.

Important note:
- `ToListAsync()` after `Skip/Take` is expected and correct. The risk is `ToListAsync()` before filters/scoping/paging on high-cardinality data.

## Main Problem Areas

### 1. UserService.GetUsersAsync

Source:
- `Backend-API/Infrastructure/Services/UserService.cs`

Current pattern:
- Uses `GetUsersInRoleAsync(filter.Role)`.
- Converts role users to a `HashSet`.
- Filters with `query.Where(u => userIdsInRole.Contains(u.Id))`.
- Exclude roles similarly call `GetUsersInRoleAsync(...)` and build a `HashSet`.

Assessment:
- This loads all users in the selected role into memory before filtering.
- It is partly mitigated by cache, but it is still not the preferred SQL pattern.
- `GetStaffUsersAsync` already has the better implementation.

Risk:
- Medium. Users may be limited in an on-prem deployment, but this is a shared admin path and should be consistent.

Preferred pattern:
- Replace role/exclude-role filtering with SQL joins/subqueries against `AspNetUserRoles` and `AspNetRoles`, matching `GetStaffUsersAsync`.

### 2. UserService.GetUsersByRoleAsync

Source:
- `Backend-API/Infrastructure/Services/UserService.cs`

Current pattern:
- Calls `GetUsersInRoleAsync(roleName)`.
- Converts role users to `HashSet`.
- Then creates a user query with `Contains(...)`.
- No pagination in this method.

Assessment:
- Loads all users in the role.
- Acceptable only if used for small admin dropdowns.
- Risk grows if exposed as broad list endpoint.

Risk:
- Medium.

Preferred pattern:
- Query `AspNetUserRoles`/`AspNetRoles` directly and paginate if this can return many users.

### 3. CandidateAdminService.GetCandidatesAsync

Source:
- `Backend-API/Infrastructure/Services/CandidateAdmin/CandidateAdminService.cs`

Current pattern:
- Finds Candidate role.
- Loads all candidate user IDs with `ToListAsync()`.
- Filters users with `candidateUserIds.Contains(u.Id)`.
- Then applies `ScopeUsersAsync(query)`, search/status/sort, count, pagination.

Assessment:
- Functionally correct after scoping, but candidate role membership is materialized before the main query.
- This can become expensive because Candidate is likely the largest role in the system.

Risk:
- High for large deployments.

Preferred pattern:
- Keep candidate role membership as an `IQueryable<string>` subquery or SQL join.
- Then apply `ScopeUsersAsync(query)` before count/paging.

### 4. ExamAssignmentService.GetCandidatesAsync

Source:
- `Backend-API/Infrastructure/Services/ExamAssignment/ExamAssignmentService.cs`

Current pattern:
- Loads all Candidate user IDs into a list.
- Filters users by `candidateUserIds.Contains(u.Id)`.
- If batch filter exists, loads batch candidate IDs into a list.
- Filters users by `batchCandidateIds.Contains(u.Id)`.
- Paging is server-side after that.

Assessment:
- This endpoint can be large because it powers Assign to Exam candidate selection.
- Loading all candidate IDs first is not ideal.
- Batch candidate IDs can also grow.

Risk:
- High if candidate volume is large.

Preferred pattern:
- Use `UserRoles`/`Roles` join for Candidate role.
- Use `BatchCandidates` as an `IQueryable` subquery for batch filtering.
- Keep all filters in SQL until `Skip/Take`.

### 5. ExamAssignmentService.ResolveTargetCandidateIds

Source:
- `Backend-API/Infrastructure/Services/ExamAssignment/ExamAssignmentService.cs`

Current pattern:
- For explicit candidate IDs: fine.
- For batch: returns all batch candidate IDs with `ToListAsync()`.
- For "apply to all matching filters":
  - loads all role user IDs first
  - filters users with `roleUserIds.Contains(u.Id)`
  - returns all matched IDs.

Assessment:
- For an assign operation, eventually IDs are needed, so materialization is expected.
- But role filtering should still stay SQL-side before the final `Select(u => u.Id).ToListAsync()`.

Risk:
- Medium to High depending on "assign all matching" usage.

Preferred pattern:
- Build one SQL query that includes role/batch/search/status filters, then materialize final target IDs once.
- Consider batching the assignment write path if target set can be very large.

### 6. BatchService.AddCandidatesAsync

Source:
- `Backend-API/Infrastructure/Services/Batch/BatchService.cs`

Current pattern:
- Loads all Candidate role user IDs into memory.
- Loops through requested IDs and checks `candidateUserIds.Contains(candidateId)`.
- Existing batch member IDs are loaded into a `HashSet`.

Assessment:
- Existing IDs for one batch are probably acceptable.
- Loading all Candidate user IDs is not ideal.

Risk:
- Medium.

Preferred pattern:
- Validate requested IDs with a SQL query:
  - where requested IDs join `UserRoles`/Candidate role
  - return only valid candidate IDs as a `HashSet`.
- This bounds the data to the request size.

### 7. RoleService Counts and Users In Role

Source:
- `Backend-API/Infrastructure/Services/RoleService.cs`

Current pattern:
- `GetAllRolesAsync` loops roles and calls `GetUsersInRoleAsync(...)` for each role.
- `GetRoleByIdAsync`, update/delete checks, and `GetUsersInRoleAsync` also load users through Identity APIs.

Assessment:
- For six system roles, this may be acceptable in practice.
- Still, it is not the preferred SQL aggregate pattern.

Risk:
- Low to Medium.

Preferred pattern:
- Use grouped SQL counts from `AspNetUserRoles`.
- For users-in-role list, use SQL join and pagination if list can be large.

### 8. CandidateService Candidate Portal Lists

Source:
- `Backend-API/Infrastructure/Services/Candidate/CandidateService.cs`

Observed pattern:
- Candidate exam list paths load assigned/attempted exam IDs into memory and then filter exams with `Contains(...)`.
- Some later dashboard/journey paths load available exams and related result/attempt sets into memory for shaping candidate cards.

Assessment:
- Candidate portal usually scopes to one candidate, so this is less dangerous than admin-wide candidate lists.
- Still, it can be optimized with SQL subqueries for consistency.

Risk:
- Low to Medium.

Preferred pattern:
- Keep assigned/attempted exam IDs as queryable subqueries where practical.
- Materialize only the final bounded candidate dashboard/result set.

### 9. Random Question Selection

Source:
- `Backend-API/Infrastructure/Services/Assessment/AssessmentService.cs`

Observed pattern:
- Some methods load `availableQuestions = await query.ToListAsync()`.
- Then use `OrderBy(x => random.Next()).Take(dto.Count)`.

Assessment:
- This is not role/user scoping, but it is a performance concern.
- It loads the whole eligible question pool into memory.

Risk:
- Medium if question pools are large.

Preferred pattern:
- Use database-side random ordering if acceptable for the DB provider, or preselect IDs in a bounded way.
- Keep department/question filters SQL-side before randomization.

## Acceptable In-Memory Patterns Found

These are generally acceptable:

- Materializing after `Skip/Take` for page results.
- Loading creator names for already-paged users/candidates.
- Building `HashSet`s from the current page to compute flags.
- Checking explicit selected IDs from a request.
- Loading small fixed reference data like system roles, if bounded and cached.

The key rule:
- It is okay to materialize small, bounded, already-filtered data.
- It is not ideal to materialize entire roles, candidate pools, or broad entity sets before filtering/paging.

## Final Assessment

The recommendation is only partially satisfied.

Current status by area:

| Area | SQL/IQueryable Preference | Status |
| --- | --- | --- |
| ResourceAuthorizationService | Strong IQueryable scoping | Good |
| Staff users | SQL joins/subqueries for roles | Good |
| Main exam/question/result/proctor list scoping | Mostly queryable | Good |
| General users role filtering | Loads role users into memory | Needs improvement |
| Candidate admin list | Loads all Candidate IDs | Needs improvement |
| Exam assignment candidate list | Loads Candidate and batch IDs | Needs improvement |
| Batch add candidates | Loads all Candidate IDs | Needs improvement |
| Role counts/users-in-role | Identity API loads users | Acceptable short-term, improve later |
| Candidate portal lists | Some per-candidate ID materialization | Lower risk |
| Random question selection | Loads eligible pool before random pick | Performance improvement candidate |

## Security Impact

No direct high-risk authorization bypass was found from these patterns alone.

The main concern is performance and correctness at scale:
- Memory pressure from large candidate/user roles.
- Slower admin pages as production data grows.
- Cache storing large role ID sets.
- More work in application memory instead of database indexes.

The security-relevant good news:
- The most important scope paths still call `ResourceAuthorizationService` and keep scope predicates server-side.

## Recommendations

1. Convert `UserService.GetUsersAsync` role and exclude-role filters to SQL joins/subqueries, matching `GetStaffUsersAsync`.
2. Convert `CandidateAdminService.GetCandidatesAsync` Candidate role filtering to SQL subquery instead of `ToListAsync()`.
3. Convert `ExamAssignmentService.GetCandidatesAsync` Candidate and batch filtering to SQL subqueries.
4. Convert `ExamAssignmentService.ResolveTargetCandidateIds` "apply all matching" role filter to SQL before final materialization.
5. Convert `BatchService.AddCandidatesAsync` validation to query only requested candidate IDs, not all candidates.
6. Replace `RoleService` role counts with grouped SQL counts from `AspNetUserRoles`.
7. Add pagination to any broad users-in-role endpoint if it can return many users.
8. Review random question selection to avoid loading large question pools into memory.
9. Keep using `ResourceAuthorizationService` as the central `IQueryable` scoping layer for new features.

## Priority Order

1. `CandidateAdminService.GetCandidatesAsync`
2. `ExamAssignmentService.GetCandidatesAsync`
3. `UserService.GetUsersAsync`
4. `ExamAssignmentService.ResolveTargetCandidateIds`
5. `BatchService.AddCandidatesAsync`
6. `RoleService` role counts/users-in-role
7. Candidate portal list optimizations
8. Random question selection optimization
