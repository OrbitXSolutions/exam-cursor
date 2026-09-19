import fs from 'node:fs';import path from 'node:path';
import {Client,Evidence,adminClient,here,must,privateConfig,savePrivate} from './client.mjs';
const label=process.env.QA_LABEL??'before',e=new Evidence('restricted-admission-'+label),admin=await adminClient(e),p=privateConfig();
const actor=JSON.parse(fs.readFileSync(path.join(here,'phase9-actor.json'))),c=new Client({evidence:e});must(await c.login(actor.email,p.password));
const policy=must(await admin.get('/api/Assessment/exams/122')).accessPolicy;
e.check('Fixture is restricted Operations exam',policy.restrictToAssignedCandidates===true&&policy.isPublic===false,policy);
const schedule=new URLSearchParams({examId:'122',search:'qa26.phase9.scope',pageSize:'100',scheduleFrom:new Date(Date.now()-60000).toISOString(),scheduleTo:new Date(Date.now()+3600000).toISOString()});
const assignments=must(await admin.get('/api/Assignments/candidates?'+schedule));
e.check('Engineering candidate has no assignment to Operations exam',assignments.items.every(x=>x.id!==actor.id||!x.examAssigned),assignments.items);
const preview=await c.get('/api/Candidate/exams/122/preview');
e.check('Unassigned candidate preview disallows restricted exam',!preview.ok||preview.data.eligibility.canStartNow===false,{status:preview.status,eligibility:preview.data?.eligibility});
const attempts=[];
for(const [route,body] of [['/api/Candidate/exams/122/start',{}],['/api/Attempt/start',{examId:122}]]){
 const response=await c.post(route,body);e.check('Unassigned candidate cannot start via '+route,!response.ok&&response.body?.message?.includes('not assigned'),{status:response.status,attemptId:response.data?.attemptId,message:response.body?.message});
 if(response.ok){
  const id=response.data.attemptId??response.data.id;attempts.push(id);
  const stored=must(await admin.get(`/api/Attempt/${id}/details`));
  e.record({confirmedUnauthorizedPersistence:{id,examId:stored.examId,candidateId:stored.candidateId,status:stored.status,questions:stored.questions?.map(q=>q.questionId)}});
  must(await admin.post('/api/Attempt/cancel',{attemptId:id,reason:'QA26 unauthorized admission probe cleanup'}));
 }
}
if(label==='after'){
 const email='qa26.assigned.positive@example.test',found=await admin.get('/api/Users/by-email/'+email);
 const positive=found.ok?found.data:must(await admin.post('/api/Users',{email,password:p.password,fullName:'QA26 D55 Assigned Positive',role:'Candidate',departmentId:8}));
 if(!p.users.some(u=>u.email===email)){p.users.push({email,password:p.password});savePrivate(p);}
 const allowed=new Client({evidence:e});must(await allowed.login(email,p.password));
 const assignment=must(await admin.post('/api/Assignments/assign',{examId:122,candidateIds:[positive.id],scheduleFrom:new Date(Date.now()-60000).toISOString(),scheduleTo:new Date(Date.now()+3600000).toISOString()}));
 const previewAllowed=must(await allowed.get('/api/Candidate/exams/122/preview'));
 e.check('Explicit authorized cross-department assignment makes candidate eligible',previewAllowed.eligibility.canStartNow===true,assignment);
 let created;
 try{
  created=must(await allowed.post('/api/Candidate/exams/122/start',{}));
  const legacyResume=must(await allowed.post('/api/Attempt/start',{examId:122}));
  e.check('Both start APIs allow explicitly assigned candidate and resume one attempt',created.attemptId===legacyResume.attemptId,{candidateAttempt:created.attemptId,legacyAttempt:legacyResume.attemptId});
  const persisted=must(await admin.get(`/api/Attempt/${created.attemptId}/details`));
  e.check('Authorized assigned attempt persists intended exam and candidate',persisted.examId===122&&persisted.candidateId===positive.id,{examId:persisted.examId,candidateId:persisted.candidateId});
 }finally{if(created?.attemptId)must(await admin.post('/api/Attempt/cancel',{attemptId:created.attemptId,reason:'QA26 D55 positive authorization cleanup'}));}
 const publicAttempt=must(await allowed.post('/api/Candidate/exams/116/start',{}));
 e.check('Public unrestricted exam still admits candidate without assignment',publicAttempt.examId===116,{attemptId:publicAttempt.attemptId});
 const bank=JSON.parse(fs.readFileSync(path.join(here,'bank-manifest.json')));
 const answers=bank.questions.filter(q=>[131,132,133,134].includes(q.id)).map(q=>({questionId:q.id,selectedOptionIds:q.options.filter(o=>o.isCorrect).map(o=>o.id)}));
 must(await allowed.put(`/api/Candidate/attempts/${publicAttempt.attemptId}/answers`,{answers}));
 must(await allowed.post(`/api/Candidate/attempts/${publicAttempt.attemptId}/submit`));
 e.check('Public admission retains normal answer persistence and submission',must(await admin.get(`/api/Attempt/${publicAttempt.attemptId}`)).status===3,{attemptId:publicAttempt.attemptId});
 fs.writeFileSync(path.join(here,'d55-positive-fixture.json'),JSON.stringify({id:positive.id,email,examId:122,attemptId:created?.attemptId,cancelled:true,publicExamId:116,publicAttemptId:publicAttempt.attemptId,expectedObjectiveScore:40},null,2));
}
fs.writeFileSync(path.join(here,'restricted-admission-'+label+'-manifest.json'),JSON.stringify({actor,attempts,allCreatedAttemptsCancelled:true},null,2));
console.log(JSON.stringify({checks:e.checks.length,failures:e.checks.filter(x=>!x.passed).map(x=>x.name),attempts}));
