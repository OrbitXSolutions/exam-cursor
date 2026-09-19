import fs from 'node:fs';import path from 'node:path';
import {adminClient,Client,Evidence,here,must,privateConfig} from './client.mjs';
const stage=process.argv[2]??'before',attemptId=Number(process.argv[3]??191),ev=new Evidence(`d32-d34-${stage}`),admin=await adminClient(ev),p=privateConfig();
const fixturePath=path.join(here,'d32-d34-actors.json');let fixtures;
if(fs.existsSync(fixturePath))fixtures=JSON.parse(fs.readFileSync(fixturePath));else{
 fixtures=[];for(const role of ['Admin','Examiner'])fixtures.push(must(await admin.post('/api/Users',{email:`qa26.d34.nodept.${role.toLowerCase()}@example.test`,password:p.password,fullName:`QA26 D34 No Department ${role}`,role}),'create no-department actor'));
 fs.writeFileSync(fixturePath,JSON.stringify(fixtures,null,2));
}
async function actor(email){const c=new Client({evidence:ev});must(await c.login(email,p.users.find(u=>u.email===email)?.password??p.password),'login');return c;}
const eng=await actor('qa26.eng.examiner1@example.test'),ops=await actor('qa26.ops.examiner1@example.test'),none=await actor('qa26.d34.nodept.examiner@example.test'),noneAdmin=await actor('qa26.d34.nodept.admin@example.test'),owner=await actor('qa26.eng.candidate3@example.test'),sibling=await actor('qa26.eng.candidate1@example.test');
const route=stage==='before'?'/api/Assessment/exams/dropdown':'/api/Grading/exams/dropdown';
const dropdown=await eng.get(route);ev.check('D32 Examiner can load authorized grading exam choices',dropdown.ok&&dropdown.data.some(x=>x.id===120),{status:dropdown.status});
const adminDropdown=must(await noneAdmin.get('/api/Assessment/exams/dropdown'),'no-dept Admin dropdown');ev.check('No-department Admin dropdown fails closed',adminDropdown.length===0,{count:adminDropdown.length});
if(stage!=='before'){
 const noChoices=must(await none.get(route),'no-dept Examiner dropdown');ev.check('No-department Examiner dropdown fails closed',noChoices.length===0);
 const foreignChoices=must(await ops.get(route),'Operations dropdown');ev.check('Examiner choices exclude foreign exam',!foreignChoices.some(x=>x.id===120));
 ev.check('Candidate cannot use grading dropdown',(await owner.get(route)).status===403);
 ev.check('Examiner still cannot access authoring controller',(await eng.get('/api/Assessment/exams/dropdown')).status===403);
}
const list=must(await eng.get('/api/Grading?pageSize=100&search=QA26'),'own grading list');ev.check('Same-department examiner reads QA grading list',list.items.length>0);
const noList=must(await none.get('/api/Grading?pageSize=100&search=QA26'),'no-dept grading list');ev.check('No-department examiner grading list fails closed',noList.totalCount===0,{total:noList.totalCount});
const noManual=must(await none.get('/api/Grading/manual-required?pageSize=100&search=QA26'),'no-dept manual list');ev.check('No-department manual queue list fails closed',noManual.totalCount===0,{total:noManual.totalCount});
const initiation=await ops.post('/api/Grading/initiate',{attemptId});ev.check('Foreign examiner cannot initiate protected attempt grading',!initiation.ok);
let session=await admin.get(`/api/Grading/attempt/${attemptId}`);if(!session.ok){must(await admin.post('/api/Grading/initiate',{attemptId}),'privileged initialize');session=await admin.get(`/api/Grading/attempt/${attemptId}`);}session=must(session,'target grading session');
const sid=session.id,examId=session.examId,q=session.answers[0].questionId;
for(const [name,route]of[['detail',`/api/Grading/${sid}`],['attempt-detail',`/api/Grading/attempt/${attemptId}`],['manual-queue',`/api/Grading/${sid}/manual-queue`],['stats',`/api/Grading/stats/exam/${examId}`],['question-stats',`/api/Grading/stats/exam/${examId}/questions`]]){
 must(await admin.get(route),'warm privileged '+name);
 ev.check(`Foreign examiner cannot read cached ${name}`,!(await ops.get(route)).ok);
 ev.check(`No-department examiner cannot read cached ${name}`,!(await none.get(route)).ok);
 ev.check(`Same-department examiner retains ${name}`,(await eng.get(route)).ok);
}
// This fixture has blank answers; the AI route returns locally without an external model call.
const blank=session.answers.find(a=>!a.textAnswer);if(blank)ev.check('Foreign AI suggestion is denied before answer inspection',!(await ops.post('/api/Grading/ai-suggest',{gradingSessionId:sid,questionId:blank.questionId})).ok);
const beforeScore=session.answers.find(a=>a.questionId===q).score;
const manual=await ops.post('/api/Grading/manual-grade',{gradingSessionId:sid,questionId:q,score:2,isCorrect:false,graderComment:'QA26 forbidden manual probe'});ev.check('Foreign examiner cannot submit manual grade',!manual.ok);
ev.check('Foreign manual grade does not persist',must(await admin.get(`/api/Grading/${sid}`)).answers.find(a=>a.questionId===q).score===beforeScore);
const bulk=await ops.post('/api/Grading/manual-grade/bulk',{gradingSessionId:sid,grades:[{questionId:q,score:3,isCorrect:false,graderComment:'QA26 forbidden bulk probe'}]});ev.check('Foreign examiner cannot bulk grade',!bulk.ok||bulk.data.every(x=>!x.success));
const regrade=await ops.post('/api/Grading/regrade',{gradingSessionId:sid,questionId:q,newScore:4,isCorrect:false,comment:'QA26 forbidden regrade probe',reason:'Authorization regression'});ev.check('Foreign examiner cannot regrade',!regrade.ok);
const complete=await ops.post('/api/Grading/complete',{gradingSessionId:sid});ev.check('Foreign examiner cannot finalize grading',!complete.ok);
// Restore the disposable fixture's original zero score after baseline exploit verification.
if(stage==='before')await admin.post('/api/Grading/regrade',{gradingSessionId:sid,questionId:q,newScore:beforeScore,isCorrect:false,comment:'QA26 restored baseline score',reason:'Cleanup after authorization test'});
const actualOwner=attemptId===191?owner:await actor('qa26.d34.background@example.test');
{
 must(await actualOwner.get(`/api/Grading/my-result/${attemptId}`),'warm owner result');
 ev.check('Sibling candidate cannot read warmed owner grading result',!(await sibling.get(`/api/Grading/my-result/${attemptId}`)).ok);
 must(await actualOwner.get(`/api/Grading/is-complete/${attemptId}`),'warm owner completion');
 ev.check('Sibling candidate cannot read grading completion',!(await sibling.get(`/api/Grading/is-complete/${attemptId}`)).ok);
}
if(stage!=='before'){
 ev.check('Same-department examiner retains manual grade authority',(await eng.post('/api/Grading/manual-grade',{gradingSessionId:sid,questionId:q,score:beforeScore,isCorrect:true,graderComment:'QA26 authorized same-department manual check'})).ok);
 ev.check('Same-department examiner retains bulk grade authority',(await eng.post('/api/Grading/manual-grade/bulk',{gradingSessionId:sid,grades:[{questionId:q,score:beforeScore,isCorrect:true,graderComment:'QA26 authorized same-department bulk check'}]})).ok);
 ev.check('Same-department examiner retains completion authority',(await eng.post('/api/Grading/complete',{gradingSessionId:sid})).ok);
 ev.check('Same-department examiner retains regrade authority',(await eng.post('/api/Grading/regrade',{gradingSessionId:sid,questionId:q,newScore:beforeScore,isCorrect:true,comment:'QA26 authorized same-department regrade check',reason:'Unchanged score regression'})).ok);
 const forced=await eng.post('/api/Grading/initiate',{attemptId:206});
 ev.check('D39 examiner can initiate force-submitted attempt grading',forced.ok,{body:forced.body});
 const forcedGrade=must(await eng.get('/api/Grading/attempt/206'),'read forced grading');
 ev.check('D39 force-submitted attempt calculates actual answers',forcedGrade.totalScore===10&&forcedGrade.maxPossibleScore===40,{score:forcedGrade.totalScore,max:forcedGrade.maxPossibleScore});
}
ev.record({fixture:{attemptId,sessionId:sid,examId,questionId:q}});console.log(JSON.stringify({checks:ev.checks.length,passed:ev.checks.filter(c=>c.passed).length,failed:ev.checks.filter(c=>!c.passed).map(c=>c.name)}));
