import fs from'node:fs';import path from'node:path';import{Client,Evidence,adminClient,here,must,privateConfig}from'./client.mjs';
const e=new Evidence('phase8-results'),superAdmin=await adminClient(e),p=privateConfig(),cm=JSON.parse(fs.readFileSync(path.join(here,'completion-manifest.json'))),matrix=cm.exams.find(x=>x.id===128),manifest={results:[],checks:[]};const persist=()=>fs.writeFileSync(path.join(here,'result-manifest.json'),JSON.stringify(manifest,null,2));
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.users.find(u=>u.email===email)?.password??p.password));return c;}
const[admin,owner,sibling,foreign]=await Promise.all(['qa26.eng.admin1@example.test','qa26.import.a@example.test','qa26.import.b@example.test','qa26.ops.admin1@example.test'].map(login));
const routes=id=>[`/api/Candidate/results/my-result/${id}`,`/api/ExamResult/my-result/${id}`,`/api/Grading/my-result/${id}`];
const manual=must(await admin.get('/api/ExamResult/attempt/208'));manifest.manualResultId=manual.id;persist();
for(const route of routes(208)){const r=await owner.get(route);e.check('Unpublished result unavailable through '+route,!r.ok,{status:r.status,totalScore:r.data?.totalScore});}
const applied=must(await admin.put('/api/ExamResult/update-from-regrade/87',{}));e.check('Regrade application updatesresultscore50and100percent',applied.totalScore===50&&applied.maxPossibleScore===50&&applied.percentage===100,applied);
must(await admin.post(`/api/ExamResult/${manual.id}/publish`));
for(const route of routes(208).slice(0,2)){const r=must(await owner.get(route));e.check('Published regraded result exposescorrect50score '+route,r.totalScore===50&&r.percentage===100,r);}
const review=must(await owner.get('/api/Candidate/results/my-result/208/review'));e.check('Regraded review matchesallfive10pointanswers',review.questions.length===5&&review.questions.every(q=>q.scoreEarned===10),review.questions.map(q=>({q:q.questionId,score:q.scoreEarned})));
for(const route of routes(208)){const r=await sibling.get(route);e.check('Sibling cannot accesspublishedothercandidate result '+route,!r.ok,{status:r.status});}
const other=await foreign.get('/api/ExamResult/attempt/208');e.check('Operations admin cannotread Engineering regraded result',!other.ok,{status:other.status});
must(await admin.post(`/api/ExamResult/${manual.id}/unpublish`));for(const route of routes(208).slice(0,2)){const r=await owner.get(route);e.check('Unpublish immediately hidescachedresult '+route,!r.ok,{status:r.status});}must(await admin.post(`/api/ExamResult/${manual.id}/publish`));
// Warm alternative route caches before changing the dedicated matrix exam's visibility policy.
for(const route of routes(203))await owner.get(route);
try{
 must(await admin.put('/api/Assessment/exams/128',{...matrix.request,showResults:false,allowReview:true,showCorrectAnswers:true}));
 const summary=must(await owner.get('/api/Candidate/results/my-result/203'));e.check('ShowResultsfalse removesprimarysummarynumericresults',summary.totalScore==null&&summary.percentage==null&&summary.isPassed==null,summary);
 const ownReview=await owner.get('/api/Candidate/results/my-result/203/review');e.check('ShowResultsfalse doesnotleak perquestion scores',!ownReview.ok||ownReview.data.questions.every(q=>q.scoreEarned==null),{questions:ownReview.data?.questions.map(q=>({q:q.questionId,score:q.scoreEarned}))});
 for(const route of ['/api/ExamResult/my-result/203','/api/Grading/my-result/203']){const r=await owner.get(route);e.check('ShowResultsfalse honored by '+route,!r.ok||r.data?.totalScore==null,{status:r.status,totalScore:r.data?.totalScore});}
 const best=await owner.get('/api/ExamResult/my-summary/exam/128');e.check('ShowResultsfalse doesnotleak bestsummaryscore',!best.ok||best.data.bestScore==null,{status:best.status,bestScore:best.data?.bestScore});
 const attempts=await owner.get('/api/Attempt/exam/128/my-attempts');e.check('ShowResultsfalse doesnotleak scorethroughattempt history',!attempts.ok||!(Array.isArray(attempts.data)?attempts.data:attempts.data.items??[]).some(x=>x.totalScore!=null),attempts.body);
 must(await admin.put('/api/Assessment/exams/128',{...matrix.request,showResults:true,allowReview:true,showCorrectAnswers:false}));
 const hidden=must(await owner.get('/api/Candidate/results/my-result/203/review'));e.check('ShowCorrectAnswersfalse removesreviewanswerkeys andcorrectness',hidden.questions.every(q=>q.isCorrect==null&&q.options.every(o=>o.isCorrect==null)));
 const legacyCorrect=await owner.get('/api/Grading/my-result/203');e.check('ShowCorrectAnswersfalse honored bylegacygradingresult',!legacyCorrect.ok||!legacyCorrect.data.questionResults?.some(q=>q.isCorrect!=null),{status:legacyCorrect.status,questionResults:legacyCorrect.data?.questionResults});
 must(await admin.put('/api/Assessment/exams/128',{...matrix.request,showResults:true,allowReview:false,showCorrectAnswers:false}));
 const noReview=await owner.get('/api/Candidate/results/my-result/203/review');e.check('AllowReviewfalse blocksprimaryreview',!noReview.ok,noReview.body);
 const alternative=await owner.get('/api/Grading/my-result/203');e.check('AllowReviewfalse hidesquestionsinlegacygradingresult',!alternative.ok||!alternative.data.questionResults?.length,{status:alternative.status,questionCount:alternative.data?.questionResults?.length});
}finally{must(await admin.put('/api/Assessment/exams/128',matrix.request),'Restore matrix exam settings');}
const rows=must(await admin.get('/api/ExamResult/exam/128?pageSize=100')).items;manifest.results=rows;persist();
for(const r of rows)if(r.isPublishedToCandidate)must(await admin.post(`/api/ExamResult/${r.id}/unpublish`));
const passed=await admin.post('/api/ExamResult/publish/exam',{examId:128,passedOnly:true});const passedRows=must(await admin.get('/api/ExamResult/exam/128?pageSize=100')).items;e.check('Passed-only publishingexcludesfailedresults',passed.ok&&passedRows.every(r=>r.isPublishedToCandidate===r.isPassed),passedRows.map(r=>({id:r.id,score:r.totalScore,passed:r.isPassed,published:r.isPublishedToCandidate})));
const failedIds=passedRows.filter(r=>!r.isPassed).map(r=>r.id),bulk=await admin.post('/api/ExamResult/publish/bulk',{resultIds:failedIds});e.check('Bulkpublishing releasesremainingfailedresults',bulk.ok&&must(await admin.get('/api/ExamResult/exam/128?pageSize=100')).items.every(r=>r.isPublishedToCandidate),bulk.body);
const duplicate=await admin.post(`/api/ExamResult/${manual.id}/publish`);e.check('Duplicatepublication safelyrejected',!duplicate.ok,duplicate.body);
manifest.results=must(await admin.get('/api/ExamResult/exam/128?pageSize=100')).items;manifest.manual=must(await admin.get('/api/ExamResult/attempt/208'));persist();
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name),manualResultId:manual.id}));
