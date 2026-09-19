# Smart Exam independent acceptance QA — 2026-09-19

## Controls
- Dedicated test database; disposable synthetic records may remain.
- No branch changes, push, merge, schema or migration changes.
- Intentional Development secrets/configuration and missing local license are excluded defects.
- Evidence labels: PHYSICAL, REAL-BROWSER, SIMULATED (API/integration/load), INSPECTION ONLY, NOT TESTED.
- Existing reports/tests are background only; results below require fresh evidence.

## Phase ledger
| Phase | Status | Evidence and remaining work |
|---|---|---|
| 1 Admin / system setup | Exercised | Browser bilingual departments/users/status/Permissions and notification read persistence; API CRUD/settings/token lifecycle. D02 reset and ordinary D06 role editor remain unresolved; D06 status fixed. |
| 2 Question bank / scoring | Exercised | Four live types, equal/weighted multi, bilingual/decimal/calculator authoring, image/PDF, subject/topic CRUD. D08/D09/D24 verified; D36 historical mutation remains unresolved. |
| 3 Exam configuration / publication / assignment | Exercised | Exams115–126 across fixed/flex/manual/pools/access/strict/load/future/expired/cloned. Browser123 published6questions56pts, candidates1/2assigned. Import/export realXLSX parsed. D10/D11/D13 verified. D14 and candidate content scope verified; D12 cohort metadata ownership unresolved. |
| 4 Candidate access / experience | Exercised | Real English193 and Arabic199, codes, save/clear/reload/paste prevention. D15/D16/D17/D21/D26/D28 verified. D55 loaded but original negative regression not verified when security pass closed. |
| 5 Live candidate + proctor | Exercised with physical limits | Real warning+5minute extension both sides, termination, actualSignalR simulation48core passes, private media46/46. D25/D31 realbrowser eventlog+totals verified. Physical capture unavailable/unverified. |
| 6 Completion | Exercised | Real browser193normal,199terminated,200partial. APIcorrect/blank/wrong/expiry/force/duplicateconcurrent/retakecap. Fixedtimerduration remains policy decision. |
| 7 Grading / regrading | Exercised | Independent auto/partial/zero/manual/bulk/concurrent/regrade matrix. Browser19342/56 and212zero0/50. D34 39/39, D39 verified. D36 unresolved historical integrity. |
| 8 Results / approval / reports | Exercised | Browser publication/review; actual bilingual PDF/XLSX/CSV export fixes verified incl D56. D43 27/27, D44 54/54, D46 14/14, D54 API6/6; incident image opening blocked by tool policy. D50 jobs unresolved. |
| 9 Roles / department isolation | Exercised with limits | D52 17/17; D53 63/63; earlier workflow matrices. D12 metadata unresolved; D51 loaded but original after-replay not verified when security pass closed. |
| 10 Adversarial security | Closed / partial evidence | Available earlier targeted findings retained. Rejected delegated/Daybreak-dependent pass CLOSED NOT VERIFIED by user instruction; no retry. |
| 11 Performance / concurrency / reliability | Completed with explicit limitations | Two full50-candidate HTTP+SignalR workloads, first119/120(D64SQLconnectiontimeout), second120/120; all100finalscores40/40. D62startlocks,D63terminalsessioncleanup,D65clock,D66auditlifetime fixed/verified. Briefresource/recoverymeasurement; no50physicalbrowser/media/enduranceclaim. |
| 12 Full lifecycle regression | Completed with explicit limitations | Fresh 143 → 368/session 320 → grading 199 → published result 170; 47/50=94%, 16 final checks passed. Actual tools, warning/+1 minute, save/reload, review and two-page PDF verified. D67 calculator, D68 playback events and D69 evidence classification fixed and browser verified. One synthetic finalized video and positive image fixture passed; physical and long/multi-chunk media remain unverified. |

The following ledger is chronological and retains superseded investigation checkpoints. For final statuses use [FINAL-QA-REPORT.md](FINAL-QA-REPORT.md), the current phase ledger above and the closure entry at the end.

## Defect ledger
- D01 department name-only edit erased bilingual descriptions. Fixed frontend full-record fetch; browser restore/name-only save/reload/reopen passed.
- D02 staff reset-password reports fake success (list and detail). Environment agent owns investigation/fix.
- D03 user create invalid department returns 500; create/update accept inactive department. Environment agent owns fix.
- D04 block/deactivate rejects new login but existing bearer token retains access. Inventory agent owns auth fix.
- D05 staff detail Arabic name displays English after bilingual creation; pending API confirmation and mapper fix.
- D03/D05 fixed,18/18 fresh API regression checks passed.
- D04 fixed,38/38 token replay checks passed; already-open hub connections still require live testing.
- D06 browser account status changes ignored. Root wired existing activate/deactivate endpoints; verification pending. Role selector remains unverified repair.
- D07 settings/template input validations fixed using existing SQL/UI/worker bounds;19/19 API checks passed,10 validator tests passed.
- D08 single choice create accepts invalid key/options; update options can violate weighted sums. Atomic question/options fix owned environment agent.
- D09 question bank authorization leaks for staff lacking department; foreign option endpoints/mutations and persisted cross-department creates also affected. Inventory agent guards service methods; lookup scope probes ongoing.
- D10 SuperAdmin exam creation required department but had no selector. Root added paginated active department selector using existing backend contract. Browser successfully created exam123 after fix; typecheck passed.
- Settings numeric/mode validation probes found failures; agent evidence pending. Do not confuse this with intentional Development config/license conditions.

## Production changes
- Frontend/Smart-Exam-App-main/app/(dashboard)/departments/page.tsx — D01 preserve descriptions on edit.
- Full current file list must be derived from git diff for final report; team changes in progress. No schema/migration modifications.

## Data and artifacts
Use synthetic QA26 identifiers. Record created IDs and persistent evidence alongside this file. Do not commit test passwords/tokens.
- Branch at start: acceptance/production-readiness; HEAD 2b890607988668f261fedfbf7ebf227742a637d6; initial worktree clean.
- Browser dept7 QA26UI; API departments8/9; actor IDs in harness/data-manifest.json. Browser-created proctor ID 4c4eb16d-93d3-41d9-8881-d4d741212885.
- Baseline checks: backend194 pass/62 skipped; frontend typecheck pass; lint0 errors/80 warnings; isolated production build109 routes; proxy7/7.

## Phase 3 completion / phase 4 entry
- D03/D05 runtime18/18; D04 token38/38; D07 config19/19; D08 options28/28; D09 bank15/15 +lookup21/21 now pass on combined server.
- D05 Arabic and D06 account status verified in browser; account restored Active.
- D08 REAL-BROWSER question156 atomic20pts,12+8 correct weights, C removed/replacement added; detail and reopened weights verified.
- D11 automatic proctor scope fixed; fresh123 only Engineering proctor, foreign403. Removed70 erroneous QA-only older autoassignments on10 exams.
- D12 confirmed cohort details leak across departments; no department ownership stored, unresolved pending business/schema decision. No schema changed.
- D13 REAL-BROWSER assignment row checkbox toggled twice via bubbling. Fixed stopPropagation on checkbox; mouse selection, Space deselection, header selection and selected assignment verified. Exam123 candidates1/2 assigned by UI.
- Phase3 API import/batches14 pass/1 confirmed D12 fail; XLSX rows independently parsed. Phase4 candidate variation testing started; no proctor interventions yet.
- Phase4 core access variations executed33 APIchecks: future/expired/draft/code/unassigned refusals and active random/strict/walkin sessions. D15 invalid option IDs persisted; D16 required ID not server-enforced; D17 required walkin fields ignored; fixes underway.
- Phase5 underway with actual browser193/session145 and independent HTTP+SignalR pair. D18 foreign proctor alternate AttemptControl listing/addtime confirmed; D19 blocked alreadyconnected user still signals; fixes underway. Initial protocol pair expired due testharness omitted heartbeat, correctedscenarios rerunning (not counted valid failures).
- D20 proctor scoreunit fixed30points from30%, browserverified. D21 cleared-answer contentcount frontend fixed+browserverified; backendcount repair pending.
- D24 explanationpreservation fixed, browserdetailbothEN/AR and APIexactvaluePASS. D26 outageanswerloss confirmed bybrowserreload5/6 Truefalse +independentAPIcurrentAnswernull. Fixenvironmentowned.
- Combined backend afterD12/D14/D15-D19/D21-D23:221passed64skipped0failed. Restart79.599s, recoveredactive193. Phase6 completionauthorized following liveprotocolbaseline; livefix/mediaregressionscontinue.

### Additional confirmed findings
- D25 Proctor event endpoint403 whileSuperAdmin returns13actualevents193; UI swallowed403 toNoevents. Fixinventory pendingrestart andfallbackrefresh. AIreportcitedexisting events, notproofAIaccuracy.
- D27 critical publicshare119/select-candidate QAopsadminID mintsAdmin+Candidate token grantingOpsExam122 detail. HarnessfixrejectnonCandidateonlyaccounts; candidate-onlyimpersonationaccessmodel remainsdecisionrequired.
- D28 optionshuffle: renderer3sortsundidrandomizedAPIsequence; rootremovedsorts. Independent3sessionreads confirmedserveralsoreshuffleseachread, harnessimplementingstableperattemptorderwithoutschema. Initialpre-fixUIstableoptionorderwasfalseassurance (allauthororder); withdrawnclaimofpersistedrandomoptionorder.
- D29 syntheticprivateproctorsnapshotpublicvia/media andgenericMedia view/download/list; inventoryownsfix. No physicalcaptureclaimed.
- D12/D14 after26checks23pass,3remaincohortmetadata/list/deletewithoutowner. Foreigncandidatecontents,XLSX/membermutation/assignmentnowprotected; no schemaused.
- Postcombinedinputfixregression23/23; D15/D16/D17/D21/D23 confirmed, strictIDonlyengcandidate3 syntheticapproved. Rootcandidate1/2identityuntouched.
- Phase6 API17passes; fixedtimerdurationassertionflagrequirespolicydecision (actualcandidategetsfullindependentdurationwithinadmissionwindow). Actual1minexpiry,correct40,blank0,wrong0,force10,duplicateconcurrent,retakecap exercised. LegacyfixedadmissionbypassD33confirmedandbeingfixed.
- Phase7nowactive: realexaminergrading193; harnessscorematrixandmanual208; inventoryhistoricalbankmutationprobe.

## Phase7 completion and phase8 entry
- Real examiner graded193 manual8/10 withfeedback; reloadpreserved8andfeedback, Finalize enabled1/1, confirmed42points (independent34auto+8manual/56=75%). Candidate stillSubmitted/UnderReview beforepublication, tobevalidatedphase8.
- D35headerfixed automatic34/46 (previousincorrect0%); browserverifiedbeforefinalize.
- D38 zerogradewithoutcomment persistence trackedviaauthoritativeisGraded DTO; frontendpatched, pendingruntimebrowser.
- D40 examinerSeeResultcallsroleforbiddenExamResult/finalize403, observedbrowserfailure. RoothidesresultmanagementactionforExaminer andfinalizationtoastlink; preservesbackendroles. Confirmationcopy nowaccuratelyrequiresreview/publication, regradingforlaterchanges. Pendingbrowserverification.
- D34 confirmedforeignandno-deptgradingread/writeleaks fixedbyenvironment; D39forcesubmittedeligibilityminimalfixincluded, pendingruntime.
- D36 confirmedhistoricalquestionkeymutation corruptsgradeandreviews; unresolvedediting/versioningdecisionpotentialschema. No schema modified.
- D29 canonicalprivate-mediafix passed butWindowsDOSshortaliasexposedprivatebytes; reopened, aliasproviderfixpendingruntime.
- D41 REAL-BROWSER resultreview ViewAll showedrawDBIDs376/379/382/385/397 whileSingleViewcorrectlyshowedselectedtext. MinimalViewAllchangeusesexistingselectedOptions localizedlabelswithfallback; verificationpending.
- D15legacy/D23legacy/D33fixedgrace/D37autoreview/D38zerogrademarkerruntimeallverifiedharnessrestart5. D32dropdown/D38zerofinalize/D40hiddenforExaminerverifiedrootbrowser. D41ViewAllfixpendingreloadspecifictabverify.

- D47questionXLSXrowsallfixed15pt withwrap: exportedlongessay/rubricclippedinrender, sourceexplicitfixed15confirms. Minimalcontent-basedrowheightnowcalculatedfromexistingcolumnwidthsandnewlines; freshartifactrenderpending. XLSXnativeblank41importartifactissuekeptseparate.
- D48REALBROWSERfixed18pointsmean40pointsmaxand40%passmatchesindependent128calculation.
- D49freshCSVparsed6rowsall5columns; beforeheader5anddatarows6. ReportCSVdownloadregressionPASS.
- Phase8coreworkflowscompleted; privacyD43/incidentD44/reportD46combinedruntimepending. Phase9isolationnowactiveacrossagents; rootbrowsersecurity/rolecheckscontinue.

## Phase9 checkpoint and phase10 entry
- D51 revokedroleJWT stillgrantsExaminerafterDBrole removal; harnessfixedauthoritativerolesetcheckawaitrestart7.
- D52 legacyExamProctor foreignroster/assign/unassignbypassconfirmed17checks4fail; assignmentunlockedprivilegedproctorsessionaccess. Restoredfixtureassignments; inventoryfixawaitreload.
- D53 Assessmentfilterandnestedauthoring/poolscope family environmentreproducing/fixing.
- D54 incidentimagepreviewURLnullfunctionaldefect inventoryfixsecureauthenticatedendpoint.
- D55 criticalunassignedEngineeringcandidate startedOperationsrestricted122 viaBOTHstartAPIs, question136exposed; attempts216/217cancelled. Sharedassignmentgate+previewfixawaitrestart7. Earlierunassigneddenialsfromotherprerequisitesarenotproofassignmentenforcement.
- D44incident54/54runtimePASS; all5proctordecisionstatus/lock/override/foreignguards17/17PASS. BackendexportjobsCSV/XLSX/PDF/JSONremainPendingaround15minandacrossrestart:noProcessPendingworker +TODOdownload/processor. D50unresolvedrequiresfeatureimplementationdecision.
- Phase10nowactive safeCSVformula/storedXSSfixture pluspublicshare/media/adversarialAPIprobes. 50concurrencyload remainsphase11 pending; no claim50tested yet.

## Continuation checkpoint — remaining functional/performance work
- Daybreak-dependent/delegated rejected security pass CLOSED as NOT VERIFIED, requires a separate security pass. User explicitly instructed not to repeat it. No optional security-tool availability blocks remaining QA.
- D56 actual downloaded exam116 CSV contains candidate-provided formula-prefix name =1+1. Minimal CSV text-prefix protection applied; fresh actual-download verification pending. No native spreadsheet formula execution performed.
- D57 evidence-confirm ownership/filesize fixed; D58 generic public media deletion ownership fixed; combined11/11 afterrestart7.
- D52 legacy proctor assignment17/17; D54 authenticated incident preview6/6; D53 assessment authoring scope63/63 runtime PASS.
- D59 remove/re-add exam question unique-index500 remains unresolved pending restore/reuse semantics or migration decision. No schema changed.
- D60 media pagination invalid input returns400;10/10 plus4bounds pass.
- D61 serial per-user role queries batched:83users21s→2.1s,13/13 behavior/isolation checks pass afterrestart8.
- Restart8 current API listener44596. 234backendpass/64skip/0fail, frontendtypecheck/diffcheckPASS. 50load begins next; prior sampler segment is BASELINE ONLY.

## Phase11 measured workload checkpoint
- D62 afterrestart9:50fresh attempt IDs,50candidate WebSockets plus1proctor, all12rounds executed,50finalanswerreloads correct,50submitted,50independent40/40scores. 119/120checks: one autosave500 duringround8 retained asD64; subsequent saves succeeded. This is not a cleanperformancepass.
- Operationp50/p95/max(ms): start3952/5352/6140; save2157/17142/17371; heartbeat1388/1446/4164; timer923/935/1130; monitoring2590/3293/3293; reload1397/1618/1630; submit2087/3899/3912. Fullrun preserved load-d62-after-d64-before-*.
- D63 confirmedcancelledattemptskeepActiveproctorsessions, causing43ghostloadcards inrealproctorUI. Fix/cleanup pending withoutmodifyingactiveworkload.
- Candidate50load is actualHTTP/WebSocket simulation; one realproctorbrowserobserved listing. No50browsers/cameras ormediaencodingload claim.
- Prepared phase12-final.mjs andphase12-video.mjs are NOTexecuted yet. Plannedplayablesynthetic8sVP8/Opus complements priornonplayablechunk tests; no physicalcaptureclaim.
- D63 restart10 runtime6/6PASS: fresh312Cancelled/session264CancelledEndedAt; actualone-minute313Expired/session265CompletedEndedAt; live/list/dashboardactive0, historytotal2retained. Browser0ActiveSessions confirmed. Prior43cancelledsessionrowscleanedbyexistingAPI, allverified.
- D64 rootcauseconfirmedSqlException-2 pre-login handshake~14.8s duringOnTokenValidated beforeSaveAnswers, notanotherdeadlock. SQLconnection/dependencydegradationunderload remainsunresolved; no speculative timeout/retry/config change. Second50run plannedusingnormalAdmin extra-attemptgrants; noMaxAttempts weakening.
- CacheService always reads authoritativeDB and never caches. Repeated-read/cache-path assertions do not prove actualcachehit/invalidation/distributedcache behavior.

## Final closure — all requested phases completed to the documented extent

- The two complete 50-candidate HTTP/SignalR workloads, resource measurements, original failures, D62/D63/D65/D66 repairs and limitations are reconciled in phase11-performance-results.md. The first run's D64 SQL timeout remains unresolved; the later clean HTTP run does not erase it.
- Fresh browser exam 143 → attempt 368/session 320 → grading 199 → published result 170 completed, independently 40+7=47/50=94%. Candidate/proctor actions, calculator/spreadsheet use, reload, examiner grading, publication, feedback review and final PDF were exercised through the real browser (no physical device-capture claim). All 16 persisted-state assertions passed again after final media work.
- D67 calculator viewport, D68 video event subscriptions and D69 evidence classification are minimally fixed and real-browser verified. The synthetic video container issue is preserved as a fixture correction, not a product defect. Corrected recording metadata 703 and isolated Image evidence 704 remain with their manifests; image regression exam 144/attempt 369/session 321 completed normally.
- Final frontend typecheck, production build, 7/7 proxy tests and diff check passed; lint 0 errors/70 warnings. Backend current source remained 234 passed/64 skipped/0 failed. SQL/Redis schema-creating fixtures were intentionally not run. Branch/HEAD and 42 applied migrations remain unchanged; no push, merge or schema changes.
- The rejected delegated security pass remains CLOSED / NOT VERIFIED and was not retried. D51/D55 after-verification, D54 incident link opening and physical/device/deployment acceptance remain gaps. Known unresolved defects and policy decisions are retained.
- FINAL-QA-REPORT.md is the comprehensive final deliverable, with 69 numbered findings, all 12 phases, exact changed-file rationale, remaining data, explicit unexercised variants and seven final readiness conclusions. Historical checkpoints above are retained as a chronology, not current pending work.
