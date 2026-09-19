import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_PHASE8_EXECUTE!=='phase8'){console.log('Prepared only.');process.exit(0);}
function write(file,value){for(let i=0;;i++){try{fs.writeFileSync(file,JSON.stringify(value,null,2));return;}catch(error){if(i>=10)throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}}
class Output extends Evidence{save(){write(path.join(here,`${this.name}.json`),{classification:'SIMULATED TEST: actual authenticated HTTP API calls and saved application state. No browser or physical capture.',startedAt:this.startedAt,checks:this.checks,events:this.events});}}
const e=new Output(process.env.QA_PHASE8_LABEL??'phase8-before'),p=privateConfig();
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.users.find(u=>u.email===email)?.password??p.password),'login');return c;}
const sa=await adminClient(e),eng=await login('qa26.eng.admin1@example.test'),ops=await login('qa26.ops.admin1@example.test'),proctor=await login('qa26.eng.proctor1@example.test'),foreign=await login('qa26.ops.proctor1@example.test'),candidate=await login('qa26.protocol.1789817576996.a@example.test');
const fixturePath=path.join(here,'phase8-fixtures.json');
let fixtures=fs.existsSync(fixturePath)?JSON.parse(fs.readFileSync(fixturePath,'utf8')):{examId:128,attemptId:197,sessionId:149,secondAttemptId:198,secondSessionId:150,exports:[]};
function save(){write(fixturePath,fixtures);}
if(process.env.QA_PHASE8_SKIP_REPORTS!=='1'){
const result=must(await eng.get('/api/ExamResult/exam/128?pageSize=100'));
const items=result.items??result;
const report=must(await eng.post('/api/ExamResult/report/generate',{examId:128}));
const scores=items.map(x=>x.totalScore),passes=items.filter(x=>x.isPassed).length;
e.check('Report score statistics match independently aggregated persisted results',report.averageScore===scores.reduce((a,b)=>a+b,0)/scores.length&&report.highestScore===Math.max(...scores)&&report.lowestScore===Math.min(...scores)&&report.totalPassed===passes&&report.totalFailed===scores.length-passes,{report,expectedScores:scores});
e.check('Report saved and reload returns same generated report',must(await eng.get('/api/ExamResult/report/exam/128')).id===report.id);
const dashboard=must(await eng.get('/api/ExamResult/dashboard/exam/128'));
e.check('Dashboard totals and pass rate agree with persisted results',dashboard.gradedCount===items.length&&Math.abs(dashboard.passRate-passes/items.length*100)<0.01&&dashboard.publishedCount===items.filter(x=>x.isPublishedToCandidate).length,dashboard);
const empty=must(await eng.post('/api/ExamResult/report/generate',{examId:128,fromDate:'2000-01-01T00:00:00Z',toDate:'2000-01-02T00:00:00Z'}));
e.check('Empty date range generates zero report safely',empty.totalAttempts===0&&empty.totalPassed===0&&empty.averageScore===0);
must(await eng.post('/api/ExamResult/report/generate',{examId:128}));
e.check('Reversed report date interval rejected',!(await eng.post('/api/ExamResult/report/generate',{examId:128,fromDate:'2030-01-01T00:00:00Z',toDate:'2000-01-01T00:00:00Z'})).ok);
const performance=must(await eng.post('/api/ExamResult/report/question-performance/generate',{examId:128}));
e.check('Question analysis contains all four questions and completed automatic attempts',performance.length===4&&performance.every(x=>x.totalAnswers>=3),performance);
e.check('Question analysis counts known all-blank attempt as unanswered',performance.length===4&&performance.every(x=>x.unansweredCount>=1),performance);
for(const c of [ops,candidate])for(const route of ['/api/ExamResult/report/exam/128','/api/ExamResult/report/question-performance/exam/128','/api/ExamResult/dashboard/exam/128'])e.check(`${c.identity} cannot access department report ${route}`,!(await c.get(route)).ok);
e.check('Foreign administrator cannot generate report',!(await ops.post('/api/ExamResult/report/generate',{examId:128})).ok);
e.check('Foreign administrator cannot generate question analysis',!(await ops.post('/api/ExamResult/report/question-performance/generate',{examId:128})).ok);
if(!fixtures.exports.length){for(const format of [1,2,3,4]){const job=must(await eng.post('/api/ExamResult/export/request',{examId:128,format,passedOnly:format===1?true:null,failedOnly:format===2?true:null}));fixtures.exports.push(job.id);save();}}
for(const id of fixtures.exports){const job=must(await eng.get(`/api/ExamResult/export/${id}`));e.check(`Export ${id} persisted requested format`,[1,2,3,4].includes(job.format)&&job.examId===128);e.check(`Foreign department cannot access export ${id}`,!(await ops.get(`/api/ExamResult/export/${id}`)).ok);e.check(`Foreign department cannot cancel export ${id}`,!(await ops.post(`/api/ExamResult/export/${id}/cancel`)).ok);}
e.check('Invalid export enum rejected',!(await eng.post('/api/ExamResult/export/request',{examId:128,format:99})).ok);
const cancel=must(await eng.post('/api/ExamResult/export/request',{examId:128,format:1}));fixtures.cancelledExport=cancel.id;save();must(await eng.post(`/api/ExamResult/export/${cancel.id}/cancel`));const cancelled=must(await eng.get(`/api/ExamResult/export/${cancel.id}`));e.check('Pending export cancellation persists failure/cancellation reason',cancelled.status===4&&cancelled.errorMessage==='Cancelled by user');
e.check('Cancelled export cannot download',!(await eng.get(`/api/ExamResult/export/${cancel.id}/download`)).ok);
}
if(!fixtures.caseId){const created=must(await proctor.post('/api/Incident/case',{attemptId:197,proctorSessionId:149,source:2,severity:2,titleEn:'QA26 incident lifecycle and scope',titleAr:'اختبار مراجعة حادثة',summaryEn:'Synthetic protocol and screenshot review only.'}),'create incident');fixtures.caseId=created.id;save();}
const caseId=fixtures.caseId,own=must(await proctor.get(`/api/Incident/case/${caseId}`));
e.check('Incident persists with candidate and correct attempt',own.attemptId===197&&own.proctorSessionId===149&&own.candidateId===candidate.user.id);
if(!fixtures.commentId){fixtures.commentId=must(await proctor.post('/api/Incident/comment',{caseId,body:'QA26 internal review comment',isVisibleToCandidate:false})).id;save();}
for(const c of [ops,foreign,candidate]){
 for(const route of [`/api/Incident/case/${caseId}`,`/api/Incident/case/by-attempt/197`,`/api/Incident/case/${caseId}/comments`,`/api/Incident/case/${caseId}/timeline`,`/api/Incident/dashboard/exam/115`])e.check(`${c.identity} cannot read private incident ${route}`,!(await c.get(route)).ok);
 const mutate=await c.put('/api/Incident/case',{id:caseId,titleEn:'QA26 unauthorized title mutation'});const after=must(await proctor.get(`/api/Incident/case/${caseId}`));e.check(`${c.identity} cannot modify incident or persist unauthorized title`,!mutate.ok&&after.titleEn===own.titleEn,{status:mutate.status,savedTitle:after.titleEn});if(after.titleEn!==own.titleEn)must(await proctor.put('/api/Incident/case',{id:caseId,titleEn:own.titleEn}));
}
const foreignList=must(await ops.get('/api/Incident/cases?examId=115&pageSize=100'));e.check('Foreign incident list excludes engineering case',!foreignList.items.some(x=>x.id===caseId));
const foreignDashboard=must(await ops.get('/api/Incident/dashboard'));e.check('Foreign global dashboard scoped to its listed cases',foreignDashboard.totalCases===must(await ops.get('/api/Incident/cases?pageSize=100')).totalCount,{foreignDashboard});
e.record({fixtures,remaining:'Export jobs pending for subsequent polling; incident remains open for controlled workflow/regression. Unauthorized title restored after each probe.'});
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name),fixtures},null,2));
