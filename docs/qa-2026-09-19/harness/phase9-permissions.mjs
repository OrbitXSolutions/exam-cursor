import fs from 'node:fs';
import path from 'node:path';
import {Client,Evidence,adminClient,here,must,privateConfig,savePrivate} from './client.mjs';
const e=new Evidence('phase9-permissions-'+(process.env.QA_LABEL??'before')), p=privateConfig(), admin=await adminClient(e);
const email='qa26.phase9.scope@example.test';
let actor=await admin.get('/api/Users/by-email/'+email);
const user=actor.ok?actor.data:must(await admin.post('/api/Users',{email,password:p.password,fullName:'QA26 Phase9 Scope Actor',role:'Candidate',departmentId:8}));
if(!p.users.some(x=>x.email===email)){p.users.push({email,password:p.password});savePrivate(p);}
fs.writeFileSync(path.join(here,'phase9-actor.json'),JSON.stringify({id:user.id,email,departmentId:8,finalRoles:['Candidate']},null,2));
const c=new Client({evidence:e}), anon=new Client({evidence:e});
const existing=must(await admin.get('/api/Users/'+user.id));
if(existing.roles.includes('Examiner'))must(await admin.post('/api/Roles/remove-user',{userId:user.id,roleName:'Examiner'}));
must(await admin.post('/api/Departments/assign-user',{userId:user.id,departmentId:8}));
must(await c.login(email,p.password));
for(const route of ['/api/Grading/attempt/208','/api/ExamResult/attempt/208','/api/Assignments/candidates?examId=128','/api/Users?pageSize=1']){
 const r=await c.get(route);e.check('Candidate-only cannot enter staff endpoint '+route,r.status===403,{status:r.status});
 const a=await anon.get(route);e.check('Anonymous cannot enter protected endpoint '+route,a.status===401,{status:a.status});
}
for(const route of ['/api/Candidate/results/my-result/208','/api/ExamResult/my-result/208','/api/Grading/my-result/208','/api/Proctor/session/attempt/203']){
 const r=await c.get(route);e.check('Unrelated candidate cannot read another candidate resource '+route,!r.ok,{status:r.status});
}
const schedule={scheduleFrom:new Date(Date.now()-60000).toISOString(),scheduleTo:new Date(Date.now()+3600000).toISOString()};
try {
 must(await admin.post('/api/Assignments/assign',{examId:128,candidateIds:[user.id],...schedule}));
 must(await admin.post('/api/Roles/add-user',{userId:user.id,roleName:'Examiner'}));
 const mixed=new Client({evidence:e});must(await mixed.login(email,p.password));
 const own=await mixed.get('/api/Grading?examId=128&pageSize=100');
 e.check('Mixed Candidate/Examiner can grade its current department',own.ok&&own.data.items.some(x=>x.attemptId===203),{status:own.status,count:own.data?.items?.length});
 const foreign=await mixed.get('/api/Grading/stats/exam/122');e.check('Mixed role respects foreign-department boundary',!foreign.ok,{status:foreign.status});
 must(await admin.post('/api/Departments/assign-user',{userId:user.id,departmentId:9}));
 const movedOld=await mixed.get('/api/Grading?examId=128&pageSize=100'),movedNew=await mixed.get('/api/Grading/stats/exam/122');
 e.check('Existing JWT loses previous department grading list after transfer',!movedOld.ok||movedOld.data.items.length===0,{status:movedOld.status,count:movedOld.data?.items?.length});
 e.check('Existing JWT uses newly assigned department authorization',movedNew.ok,{status:movedNew.status});
 must(await admin.post('/api/Departments/assign-user',{userId:user.id,departmentId:8}));
 const restored=await mixed.get('/api/Grading?examId=128&pageSize=100');e.check('Restored department applies without fresh login',restored.ok&&restored.data.items.some(x=>x.attemptId===203));
 must(await admin.post('/api/Roles/remove-user',{userId:user.id,roleName:'Examiner'}));
 const revoked=await mixed.get('/api/Grading?examId=128&pageSize=100');
 e.check('Revoked Examiner role immediately blocks previously issued JWT',revoked.status===401||revoked.status===403,{status:revoked.status,exposedAttempts:revoked.data?.items?.map(x=>x.attemptId),currentRoles:must(await admin.get('/api/Users/'+user.id)).roles});
 const fresh=new Client({evidence:e});must(await fresh.login(email,p.password));
 const denied=await fresh.get('/api/Grading?examId=128&pageSize=100');e.check('Fresh Candidate-only JWT is denied the same grading endpoint',denied.status===403,{status:denied.status});
 must(await admin.post('/api/Assignments/assign',{examId:120,candidateIds:[user.id],...schedule}));
 const assigned=must(await fresh.get('/api/Candidate/exams/120/preview'));
 e.check('Explicit assignment appears in candidate eligibility',!assigned.eligibility.reasons.some(r=>r.toLowerCase().includes('not assigned')),assigned);
 must(await admin.post('/api/Assignments/unassign',{examId:120,candidateIds:[user.id]}));
 const removed=await fresh.get('/api/Candidate/exams/120/preview');
 e.check('Unassignment is reflected immediately for existing candidate JWT',!removed.ok||(removed.data.eligibility.canStartNow===false&&removed.data.eligibility.reasons.some(r=>r.toLowerCase().includes('not assigned'))),{status:removed.status,reasons:removed.data?.eligibility?.reasons});
 const start=await fresh.post('/api/Candidate/exams/120/start',{});e.check('Unassigned candidate denied specifically by assignment before other prerequisites',!start.ok&&start.body?.message?.includes('not assigned'),{status:start.status,message:start.body?.message});
} finally {
 const state=must(await admin.get('/api/Users/'+user.id));
 if(state.roles.includes('Examiner'))must(await admin.post('/api/Roles/remove-user',{userId:user.id,roleName:'Examiner'}));
 if(state.departmentId!==8)must(await admin.post('/api/Departments/assign-user',{userId:user.id,departmentId:8}));
 for(const examId of [120,128])await admin.post('/api/Assignments/unassign',{examId,candidateIds:[user.id]});
}
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name),actorId:user.id}));
