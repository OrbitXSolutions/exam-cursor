# Fresh browser evidence

## Phase 1 — Administration
- REAL-BROWSER: Opened localhost:3000/login and signed in using system admin seed account. Dashboard and department navigation worked. Intentional missing license banner observed, excluded finding.
- REAL-BROWSER: Empty Add Department submit rejected with “Both English and Arabic names are required”. Created QA26 Browser Lab (QA26UI), Arabic name مختبر اختبار المتصفح, descriptions `Persistent English QA description` / `وصف الاختبار المحفوظ`.
- D01 reproduced: Edit immediately showed both descriptions blank. Renamed to QA26 Browser Lab Renamed and saved without touching descriptions. API GET confirmed both persisted as null (harness/d01-browser-department-api-after.json), ID 7.
- D01 fixed in `Frontend/Smart-Exam-App-main/app/(dashboard)/departments/page.tsx`: get full department before editing; load failures show toast instead of opening an incomplete form.
- D01 REAL-BROWSER regression: restored both descriptions through edit form, saved, reopened and both displayed. Renamed to QA26 Browser Lab Verified without touching descriptions, saved, reloaded entire page, reopened Edit. DOM values exactly matched both original descriptions and new name. Cancel left state unchanged.

- REAL-BROWSER: Created QA26 Browser Proctor, bilingual name, Proctor role, dept7. Empty required fields and mismatched passwords rejected. Search reduced staff list to exactly one matching user. Detail persisted ID/email/role/status.
- D02 reproduced in browser: staff menu Reset Password shows `Password reset. Temporary password: TempPass123!`; subsequent API confirms original still works and alleged temporary password fails. Detail has same unsupported action. Full reset remains unresolved (no complete backend/admin token-delivery workflow).
- D05 reproduced: Arabic detail/edit displayed English despite Arabic input. Backend/frontend mapping fix delegated.
- D06 reproduced: unchecking Account Status and saving returned detail still Active. Frontend now invokes existing activate/deactivate endpoint when the saved status differs; browser verification pending. Role selector is also ignored by mapper, but replacement semantics for multiple roles need further investigation.

## Phase 2 — Question bank
- REAL-BROWSER: Empty create reports missing English body/subject/correct choice/option text. Created single-answer question130 bilingual body+options, General subject, Easy, calculator enabled,4 points. Preview verified content, correct key in edit, calculator badge. Edited to4.5 points, detail persisted4.5. Screenshot visually verified bilingual layout.
- REAL-BROWSER: MCQ_Multi form exposes per-option points. Authored question with2+4 correct weights and0 distractor. Changed sum to5 for6-point question; create rejected with exact sum mismatch message. Restored4 and submitted; persistence pending.
- Actual database supports four visible types with Subjective ID5 (source seed ID4 differs). API harness queries runtime types.
- Weighted browser question141 saved successfully (subject23,6pts, correct option weights2+4, wrong0); preview preserved English body and Arabic body. Empty Arabic option labels intentionally fallback to English.

## Phase 3 — Exam authoring and publication
- REAL-BROWSER D10 reproduced: seed SuperAdmin could complete setup but save returned Department ID required; there was no department input. Added paginated active-department selector for SuperAdmin creation only, preserving server scope for other roles. Selected Engineering and successfully created exam123. Typecheck passed.
- Exam123 QA26 Browser Operational Readiness: Flex; start2026-09-19 10:00UAE/end2026-09-21 23:59UAE;60min;max2;shuffle questions/options. By Subject builder selected QA26 eng Foundations;6 available,56points initially. Attempted pick7 automatically clamped6. Saved/reloaded builder. Set pass30 absolute points and saved.
- During regression fixture creation the pool temporarily expanded; no attempts active. Team is removing temporary fixtures and will verify stable pool before candidate starts. Do not treat temporary pool estimate as a scoring defect.
- Saved review and correct-answer flags. Correct-answer switch disabled until review enabled. Security proctoring/copy prevention on;webcam/ID/screen/fullscreen/lockdown off;warnings0. UI exposes screen monitoring as Strict on/off (API supports other modes separately).
- Added bilingual candidate instruction. Saved Assigned-only access,Public off,access code QA26LIVE. Published successfully after D11 autoassignment fix: post-publication page reports exactly1 assigned proctor and restricted access. Candidate assignment pending.
- D05/D06 REAL-BROWSER verification: Arabic name loaded correctly, changed Arabic to `مراقب اختبار المتصفح المؤكد`, unchecked Account Status, saved; detail showed exact Arabic and Inactive. Reopened, enabled and saved (restoration verification pending).

## Unfinished browser coverage
Remaining question variations are API-exercised; exam, candidate/proctor and post-exam browser workflows pending.

### Browser regression and candidate entry
- Staff restored Active after status regression, Arabic retained.
- Question156 editor: 10 ->20 total, weights6/4 ->12/8, removed C, added D browser replacement0. Saved detail20pts and reopened12/8/0 confirm atomic behavior. Isolated subject29, no live pool changes.
- Exam123 candidate1 assigned using exact-email filtered all-matching, result1 targeted1success0skip and tableYes. Candidate2 assigned with selected action after D13 checkbox repair. D13 repro mouse/keyboard/direct-coordinate click did not select; event bubbled to clickable row and toggled twice. Fix browser mouse selects, Space deselects, header selects, confirmation counts1.
- Candidate session tab4 uses127.0.0.1 origin to isolate from admin localhost.

### Phase4 / Phase5 browser attempt193 session145
- Candidate1 login lands identity onboarding; MyExams navigation accessible. OpenCamera requested but no usable camera preview/error/dialog observed; no physical camera verification claimed. Exam123 ID/webcam/screen optional, so permitted normal start.
- MyExams showed future disabled, fixed admission-window-over disabled, browser exam6questions56points30pass60min2attempts.
- Wrong access code rejected,0attempts; correctQA26LIVE creates193.6question order [131,134,132,133,135,141] persisted onreload.
- Candidate answers:131option2;132option2(weight7);133option2 then cleared;135typed essay15words;141Verifyrestore(weight2);134blank. Pasting essay blockedtoast; typing accepted.
- Proctor session145 saw active candidate, correct profile/device/progress. Sent warning exactQA26live text; candidate modal received via fallbackpoll, acknowledged. Added5minutes; candidate timer increased5, proctor+5 persisted. No webcam configured, so code intentionally uses10s fallback rather than SignalR; physical/video not verified.
- Reload preserved selections, empty133, essay, timeextension. D20 proctor incorrectly labeled passscore30%; fixed30points, browserverified.
- D21 clearanswer left5/6/83% and Q4Answered. Frontend contentpredicatefix now4/6/67%, Q4Unanswered inSummary; backendprogress audit delegated.

### Controlled outage / explanation regression
- D24 reproduced: isolated156 seeded EN/ARexplanations, browser metadata save erased bothnull; evidenceharness/d24-before.json. Added explanation passthrough ineditpayload/types; restoredfixture, browsersavedrenamedbody, detailshowsboth exactexplanations. Final APIcheck follows.
- Frontend typecheck afterD13/D20/D21/D24 passed.
- API controlledoutage11:30:01.193Z–11:31:20.599Z (79.599s). Candidate193 remainedactive; timercontinued. Q134True selected~11:30:10 duringconfirmedconnectionrefusal: Savefailed displayedthenauto-cleared5s. Browser6/6 while freshpostrestartsession Q134currentAnswernull andserver5/6. D26 autosave retry/submissionflush repair assignedenvironment. No physicalnetworkdisconnect claimed (localAPIprocessrestart).
- AIProctorReport actualgeneration returned structured report onsynthetic193. Contentadvisory, notacceptedasevidenceofintegrity; citedPasteAttempt/TabSwitched whileproctorAllEventsdisplayempty. D25 underlying403 eventendpointinvestigation inventory.

### Phase5/6 completed browser evidence
- D26 secondoutage replay: True134selectedduring11:41:22APIstop; manualConfirmSubmit refusedwithsaveerror, persistentretry retained. Automaticretry acknowledged11:41:58.663UTC; independentCandidate193session showsstatus2 +newanswer573[385]. ReloadTruechecked6/6. NormalconfirmthenSubmitted afterrecovery, no lostanswers.
- D28 API3consecutivereadsnowstable PASS, rendererhonorssequence. Beforefix3readassertionFAIL wasrecordedtooloutput; initialstableUIclaimwithdrawn (itwasauthor-sorting).
- Candidate2Arabic instructions/title/RTL/options displayed, differentquestionorder, attempt199session151; answeredTrue. Proctor requiredterminationreason, savedQA26controlledtermination; candidate receivedreason+redirectedMyExams showsTerminated1attemptused1remaining. Proctoractivecardremoved.
- Walkinpublic119 realbrowsercustomrequiredOrganizationrejectedmissing; name/email/phone+OrganizationQA26BrowserLaboratory+number2.5 registeredqa26.browser.walkin@example.test, started200. Wrongprime4 +blankTF, Submitdialog1answered1unanswered warning, confirmedSubmitted. Serverindependentauto0/20.
-193normalmixedsubmit6answered, objectiveindependent10+10+7+5+2=34, essayawaitingmanual. ExaminerqueueManualRequired1.
- D25realproctor145 eventlognowshows4TabSwitchedHigh +1PasteAttemptMedium. D31adjacentTotal0 inconsistencyfixedsourcependingbrowsercheck; thresholdcount0 intentionalwarningsdisabled.
- D29realbrowserauthorized149 LatestSnapshot andScreenshot thumbnaildecoded1x1; ScreenshotPreviewmodaldecoded1x1. SyntheticPNGfixture700 only, notphysicalcapture. API41/41privacyregressionpasses.
- Attempted390x844 viewportoverridehadnoeffect: observedactual1280x720. Responsive/mobile acceptance NOTverified; override reset. DesktopArabicrendering visuallyinspected.

### Phase7 examinerfinalization / phase8 entry
- Reload193 showedManual8/10, exactfeedback, 1/1saved100%; finalizationdialogconfirmedandtoastscore42, queueFinalized. Independently34auto+8manual=42/56=75%.
- CandidateMyExamsfreshreload remainedSubmitted/UnderReview, noresultlink beforeapproval/publication.
- ExaminerSeeResult on193 returnedfailedfinalizeResult devlog; controllerexplicitlyexcludesExaminer. D40UIactionhiddenusingexistingresultmanagementroles, noAPIpermissionexpansion. Finalizationconfirmcopyalsoincorrectlypromisedinstantvisibility andnochanges, correctedreview/publicationandregrading.

### Restart5 and phase8 browser checkpoint
- D38 realbrowser212 loadedzeroScore0/nullcomment asSaved1/1afterreload; Finalizeenabled. Updatedfinalizationcopyreview/publicationverified. ClickedFinalize; pendingresultconfirmation.
- Admin193resultreview42/56(75%), sixquestionsscores10+7+5+10+8+2 exactlymatch. ResultwasManualGraded/PublishedNo. ClickedPublishResult fromActions; pendingcross-roleconfirmation.
- CurrentAPIrestart5 listener33864 launcher52480, includesD30,D29DOSalias,legacyD15/D23/D33,D32/D34/D37/D38/D39. Workresumedafterusercontinue; allthreeagentsresumedtheirboundedtasks.
- Restart5runtimeD38REALBROWSER212zeroSaved1/1Finalizenowcompleted; ExaminerqueueFinalized andD40noSeeResultbuttons. D32dropdownnowEngineering16examnames, noOps, metric0pendingcorrectforcurrentpage.
- Phase8REALBROWSERadminPublish193nowPublishedYes42/56. CandidatefreshreloadCompleted/Passed/ViewResults193. Walkin200freshreloadCompleted/Failed/noattemptsleft/ViewResults200. D42completedpooledexamcardpoints56.57insteadpersisted56assignedenvironmentreproduction.
- RootfrontendtypecheckpassesafterD38/D40/D41.

### Phase8 report artifacts
- Real browser exportedExcel3sheets,EnglishPDF2pages,ArabicPDF2pages; filesarrivedDownloads despitebrowserdownload-eventtimeout(toolnotificationlimitation). Copiedexactartifactsto report-artifacts.
- IndependentlyparsedOOXML confirms42/56,75%,pass30,6questions6graded0pending. Artifact-toolimport/render incorrectlyrepresentsblanksharedstring41asliteral41; nativeOOXMLprovesemptystring, NOTproductdefect.
- RenderedbothPDFall2pageswithPopplerandvisuallyinspected. ReadableENandArabicRTL,nooverlappingcontent, minorMethodcolumnwrapandlargewhitespace. SnapshotnoExcelphysicalapplicationopened.
- D45confirmedexportCorrectAnswercolumnincomplete:132shows2instead2,3;133shows2instead2,4;141onlyVerifyrestore. ExistingDTOCorrectOptionsalreadycomplete butfrontendtype/helperuseSelectedOptions. Minimalfrontendtype+helperfixmade; freshbrowserexportverificationpending.
- Candidate193detailedreview7/10partialand8/10essay+exactfeedbackverified. Candidate200wrong0/10andblank0/10Unansweredverified. Scorecard193all6scorescorrectandtextualanswerspresent.
- D41resultViewAllREALBROWSERnowanswers2/2/2/True/essay/Verifyrestore insteadrawIDs; verified42/56unchanged.
- D45afterfreshbrowserExcel&PDFnativecontent132CorrectAnswer2,3;1332,4;141bothsecurepractices, exactscoresunchanged. D47freshXLSXrenderEN+ARlongessay/rubricfitsheightwithwrap (artifact-toolArabicshapingandblank41importlimitsremain, notproductclaims).
- D48REALBROWSERReports128AverageScore18%Highest40% mislabelsrawpoints (actualvalues10,40,0,0,40of40 =>18pointsmean/45%;max40points/100%). UI labelsnowpoints preservingbackendmetrics andpopulation. PendingfreshUIverify.
- D49REALBROWSERCSV128has5headerfieldsbut6recordfieldsbecauseunquotedlocalizeddatetimecomma; allfieldsnowCSVquotedwithescapedquotes. Formula-injectioninspectionrisknotyetliveruntimeconfirmed.

### Phase9 real-browser boundaries and staff role editing
- Freshcandidate1own193result42/56accessible; directforeign200showsResultsNotAvailablewithoutscore/content. Earlierloginredirectprecededrefreshedsessionandisnotcountedasauthorizationevidence.
- Examiner directadministratorCandidateResult route explicitly403AccessDenied/Examiner. D40gradingqueuehasViewonly, noforbiddenSeeResultaction.
- D06roleaspectnowREALBROWSERconfirmed: browserproctorstaffeditRoleExaminer→SaveChanges reportsupdated butdetailstillProctor. Noactualrolechanged. DedicatedPermissionsUIexistswithseparateadd/removecalls; notsilentlyrewiredpendingmulti-role/atomicreplacementsemanticsreview.
- Phase9activenow; D42/D43/D44/D46 loadedinrestart6API36796, verificationrunning. Noactivebrowserexaminterruption.
- Phase9REALBROWSERdedicatedPermissionsrolechangeProctor→ExaminerpersistedAPIroles[Examiner]andfreshUI. RestoredProctorviaUIandAPIroles[Proctor]. RegularusereditroleignoredremainsD06separate. PermissionsuserlistPageSize200took21.6srecordedfrontendproxylog, toassessperformancephase11.
- D42REALBROWSERcompletedexam123nowPoints56 matching19356max. D43API27/27privacyfixchecksPASS, D46API14/14questionreportchecksPASSafterrestart6.

## Final checkpoint — CSV and incident preview
- D56 REAL-BROWSER: administrator report116 showed existing =1+1 fixture; actual ExportReport downloaded d56-after.csv. Native text inspection shows apostrophe-prefixed name, same5columns, same numeric scores and ordinary rows; before file preserved. Fixture renamed QA26 CSV Security. No native Excel execution. Optional planned stored-XSS probe was NOT RUN; rejected security pass remains closed.
- D54 REAL-BROWSER: incident10 Closed/Cleared, Evidence(1) displays correct synthetic image filename/note and new View link. Clicking View was blocked by the browser automation security policy before site behavior could be observed. No workaround attempted. Image opening in this incident UI is NOT VERIFIED; six API checks already verified authenticated exact bytes. This tool restriction is not counted as a product defect.
- Proctor UI during failed load ramp displayed45active cards,43load candidates plus2earlierfixtures. This confirms43visible, not50capacity.
- D62 ordinary workload:50accountsauthenticated; concurrent ramp yielded43starts and7SQLdeadlockHTTP500. Startp50=15.262s,p95=19.915s,max=27.483s. Preserved load-ramp-before-* evidence; fix underway.
- D31 final REAL-BROWSER closure: EngineeringProctor session145 shows EventsLog5, TotalViolations5, breakdown4TabSwitched+1PasteAttempt, Lastactivity3:44:24PM equalsSubmitted/EndedAt, score42Passed,6/6answers. Countable0 remains intentional maxwarnings0, Lowrisk0 notclaimedresolvedintegration.
- Notification REAL-BROWSER: admin bell opens42notifications/3pages, QA26AssessmentScopeAfter row Markread→Read; reloadstillRead. Existing publication/start/submission notifications andactionlinks visible. No SMTP/SMS delivery claimed.
- D63 REAL-BROWSER during D62fresh replay: ProctorCenter displays94ActiveSessions and93cardsforQA26FiftyCandidateLoad. Actual workload manifest has50freshattempts; the43previouscancelledattempts remainlistedLive. ExactUIcount is not claimed as94activecandidates. Read-only backend confirmation assignedenvironment; no restart during measured workload.
- D63 afterrestart10 REAL-BROWSER: ProctorCenter refreshed to0ActiveSessions / NoActiveSessions, with0QA26loadcards. Earlier43cancelledghostcards are gone, all50submittedloadrecords alsoexcluded. History was retained; freshAPIcancel/expiry regression runningseparately.
- Second50replay REAL-BROWSER underrestart10: ProctorCenter refresh displays exactly50ActiveSessions and50QA26FiftyCandidateLoadcards. No43cancelledghosts. APIharness independentlyverifies50freshattempts after50normaladminextra-attemptgrants.

## Phase 11 completion and final-regression preparation
- REAL-BROWSER proctor dashboard during second complete workload showed exactly 50 Active Sessions and 50 QA26 Fifty Candidate Load cards. After all 50 submitted, refresh removed those load cards. The one then-active card was a new D65 clock regression fixture, not a leftover load session.
- D65 before: QA26 D65 Proctor Remaining Clock, QA26 Engineering Candidate 3, session316 was Live but showed 0m; concurrent candidate timer API had positive remaining time. The frontend mapper hardcoded zero. After verification is pending combined restart11.
- Examiner signed in freshly and saw the completed load cohort in the Grading UI with Finalized statuses and zero pending questions.
- The final fixture will use a 120-minute admission window and a 30-minute per-candidate duration, with a new calculator-enabled subjective question. Preparation itself does not start or answer the exam.
- D65 after restart11: proctor dashboard card session318, QA26 Updated Candidate / QA26 D65 Proctor Remaining Clock, showed **10m** instead of hardcoded0m. The separate one-minute audit fixture showed1m, demonstrating different duration values. Agent's API evidence supplies timer comparison; root physically did not capture devices.
- Final setup passed with new candidate44799c41-8cfd-4ab8-a90b-13632121949a, exam143, subjective question170. REAL-BROWSER login initially lands on Identity Verification; My Exams remains accessible for this exam configured without required identity. Search found the assigned exam with5questions,50points,pass30,duration30min,2allowedattempts. Instructions and correct access code QA26FINAL started the normal UI flow.
- Final browser attempt368/session320: all four objective choices selected correctly plus25-word subjective response; Saved,5/5,100%. Calculator basic2+3×4=14 with expression in History; statisticalSUM(2,3)=5; scientific√(9)=3. Spreadsheet canvasA1=2,A2=3,A3=SUM(A1:A2) displayed5; editingA1to4 recalculatedA3to7. These are real UI calculations, not source/unit-only tests.
- New D67: at1280x720, Financial>PV adds an argument panel that pushes calculator zero/equal buttons below the visible viewport. Fixed-position panel has no usable content scroll. Two locator failures led to screenshot confirmation of clipping; this is not counted as a math error. Minimal responsive-scroll repair in progress.
- Final proctor dashboard displayed28m while candidate showed27:xx, consistent with ceiling minutes. Detail showed InProgress,5/5,100%, Engineering department and30-point threshold. Sent named QA26 warning; candidate received the exact message and acknowledged I Understand. Delivery was observed after a polling interval, not measured as instantaneous WebSocket delivery. A one-minute extension was requested through the proctor dialog.
- D67 repaired UI passed original Financial/PV path: every0/Next/=Calc input worked, PV(0,2,100,0,0)=-200. Screenshot showed bounded panel ending within720px viewport with scrollbar. After full exam reload, basic7×8=56 also passed; all5 persisted answers/25-word text and extra-time-adjusted timer remained intact.
- Final live +1minute appeared in proctor detail as Extra Time Added +1min and updated candidate timer by the next60-second server sync; candidate reload retained the extended expiry. Summary showed5/5answered,0unanswered,0flagged. Confirm & Submit used through actual UI.
- Submission368 appeared as Submitted/Pending Grading/Under Review for candidate. Liveproctordashboard returned0ActiveSessions. Examiner UI showed Automatic40/40 and1manualquestion; entered7points andspecificfeedback, Saved markerpersistedafterreload, then finalizedwithresult-review/publicationwording. Grade listshowedFinalized.
- Admin Candidate Result showed47/50,Pass,ManualGraded,PublishedNo. ViewDetails Single/ViewAll showedfour10/10objectiveanswers withtexts2;2,3;2,4;True andsubjective7/10plusfeedback. BeforepublicationcandidatecontinuedUnderReview. AdminPublishResult changedPublishedYes; candidateafterreload showedCompleted/Passed, then result94%,47/50,A andDetailedReviewlink. Independent finalcheckpoint16/16passed withno pendingstage: grading199/result170/session320/attempt368.
- Candidate Detailed Review question5 showed7/10, exactsavedanswerandfeedback, withoverall94%and47/50. DownloadedfreshEnglishPDFfromadminActions:35,627bytes,two pages,47.00/50,94.0%,pass30,all5questionrowsandcorrectmultianswers2,3and2,4. ParsedwithpypdfandrenderedwithPoppler; bothpagesvisuallyreadableandunclipped. NarrowMethod/typecolumnswrapwordsawkwardly(cosmeticimprovement). Files underreport-artifacts/final/.
- Synthetic recording initial checkpoint: attempt 368/evidence 702, 230170 bytes, approximately eight seconds of 320×240 VP8/Opus, exact SHA-256 retrieval and background finalization persisted. The original local decoder check used exit status only and overlooked an Opus diagnostic; this is not clean audio acceptance. The real-browser player initially failed. Its later diagnosis and closure follow.

## Final media and lifecycle closure

- The initial generated container had 39 backwards block timestamps and was incompatible with browser MediaSource despite matching stored bytes. It was preserved, then losslessly remuxed to a 230169-byte version with zero backwards block timestamps. Successor evidence 703 and its manifest identify the current synthetic fixture. This was a fixture issue, not a storage corruption claim.
- **D68 before, REAL-BROWSER:** the remux rendered the animated pattern. Actual media reached currentTime=duration=8.021, ended=true, paused=true, readyState=4 with no media error, but the displayed timer remained 0:00/0:08 and the seek slider stayed at zero. The component's mount-only listener effect ran before the video existed.
- **D68 after, REAL-BROWSER:** rendered video events update controls after loading. Play changed to Pause; natural completion displayed 0:08/0:08 and returned to Play. Replay and Pause stopped at 0.165 seconds. Three ArrowRight presses on the time slider sought to 1.5 seconds and displayed 0:01/0:08. Forward 10s clamped to 8.021; Back 10s clamped to zero; resume played again. A screenshot visibly showed the animated pattern with the pause icon. A later pause lookup after the short clip had already ended correctly found no Pause control; it is not a defect.
- **D69 before/after, REAL-BROWSER:** final session 320 had only two Video metadata versions but showed two blank screen captures. After removing the all-evidence fallback it showed zero captures and No screen captures available, retaining the 1/1 video player.
- **D69 positive regression:** isolated normal image upload/completion created exam 144, attempt 369/session 321, Image evidence 704. Its video page displayed one capture. Selecting Screen 704 loaded both thumbnail and full 320×240 preview, visibly labeled QA26 SYNTHETIC IMAGE REGRESSION / No camera or screen capture with color bars. Both DOM images were complete at natural dimensions 320×240. The first immediate preview screenshot preceded asynchronous authenticated-image loading; the settled image was correct. This is not the blocked incident View action from D54.
- After all media/source work, ordinary persisted-state checkpoint 368 passed all 16 checks again at 14:47 UTC. Candidate Answer Review was reloaded through the real browser: Passed, 94%, 47/50 persisted; question 5 retained the exact answer, 7/10 and saved feedback. The final candidate review tab was retained for the user's manual inspection.
- Limits: all footage/images above are synthetic. No physical camera/microphone/screen capture, audible quality, synchronization, long/multi-chunk continuity, other codecs, final physical capture flush or deployment storage/network acceptance is claimed. The synthetic type-3 image path is exercised; generic type-4 integration remains inspection only.
