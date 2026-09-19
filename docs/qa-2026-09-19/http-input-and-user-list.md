# HTTP input and user-list findings

## D60 — Media pagination validation

SIMULATED TEST using actual HTTP calls. `harness/phase10-http-input-before.json` records Media?pageSize=-1 and Media?pageNumber=0 returning500. The same bounded matrix verified invalid Assessment pagination/enum rejection, malformed JSON400/unsupported XML415, and SQL-like/HTML/Arabic/emoji search values handled as literal data.

Minimal production change: `Backend-API/Controllers/MediaController.cs` uses positive Range validation for pageNumber/pageSize and rejects a calculated paging offset above int.MaxValue before it can overflow. After restart7 the full matrix passes10/10 (`harness/phase10-http-input.json`, `phase10-http-input-after.log`). Four additional exact boundary checks pass after restart8 (`harness/media-pagination-after.json`): zero page size, negative page number and positive integer-overflow combination return400; page1/size1 remains200. This does not claim an application-wide injection audit; only the listed requests were exercised.

## D61 — User-list latency

Root observed about21.5seconds loading Users?pageSize200 in the real browser. Independently timed API requests after restart7 returned20 users in6523/6965ms and83 users in21025–21240ms, repeated with page sizes100/200. All six requests returned role arrays. Exact records: `harness/phase11-user-list-before.json`.

The source performs one sequential UserManager.GetRolesAsync round-trip per returned row in both general and staff lists. CacheService deliberately invokes factories directly, so the script's cold/warm labels only distinguish first/repeated requests; there is no effective read cache to warm. Measurements occurred alongside bounded QA API regressions, with no50-candidate workload yet.

Minimal source fix in `Backend-API/Infrastructure/Services/UserService.cs`: query role memberships once for IDs already selected by the existing scoped, filtered, paginated user query. Scope, counts, ordering, DTO mapping and cache behavior remain. Both general and staff methods use the helper. Source compiles with0errors.

After restart8, the definitive replay passes13/13 checks (`harness/phase11-user-list-after-final.json`). The83-user responses now take2103–2108ms, about90% lower latency than the21025–21240ms baseline. Twenty-user responses take2096–2102ms. Independent individual-user detail requests confirm candidate, proctor, Admin and SuperAdmin role arrays match the list; staff filtering excludes Candidate and respects department; role+department filtering remains correct. The SuperAdmin-only controller remains403 to department Admin. Two earlier harness runs incorrectly expected department Admin to access that existing restricted controller and stopped on403; the test actor was corrected, with no production authorization change.

Current-source backend suite after restart8:234 passed,64 SQL/Redis setup skips,0failed (`backend-restart8-tests.log`, `test-results/restart8-combined.trx`). No isolated SQL fixture setup was enabled because it modifies schema.

No database changes are required or made for either fix. A30-second actual host baseline sample is in `harness/phase11-baseline-resources.jsonl`, covering only light API QA activity. It is not a50-candidate load result. API working set is about235MB; the long-running Next development process is about1863MB working set/4161MB private memory. These dev-server observations do not establish production capacity or a memory leak. The reusable `harness/sample-resources.ps1` sampler is ready for the larger simulated workload, which remains pending.
