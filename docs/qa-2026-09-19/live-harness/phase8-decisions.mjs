import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_PHASE8_EXECUTE!=='phase8'){console.log('Prepared only.');process.exit(0);}
class Output extends Evidence{save(){const value=JSON.stringify({classification:'SIMULATED TEST: authenticated REST and persisted state',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2);for(let i=0;;i++){try{fs.writeFileSync(path.join(here,`${this.name}.json`),value);return;}catch(err){if(i>=10)throw err;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}}}
const e=new Output(process.env.QA_PHASE8_LABEL??'phase8-decisions'),p=privateConfig();
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.users.find(u=>u.email===email)?.password??p.password));return c;}
const sa=await adminClient(e),proctor=await login('qa26.eng.proctor1@example.test'),foreign=await login('qa26.ops.proctor1@example.test'),ops=await login('qa26.ops.admin1@example.test');
let attempt=must(await sa.get('/api/Attempt/197'));
e.record({fixture:{attemptId:197,sessionId:149,initialAttemptStatus:attempt.status},note:'Own protocol fixture. Synthetic proctor decisions, no physical incident.'});
const body={proctorSessionId:149,status:2,decisionReasonEn:'QA26 decision lifecycle synthetic review',finalize:false};
if([1,2,6].includes(attempt.status)){
 e.check('Active attempt rejects premature proctor decision',!(await proctor.post('/api/Proctor/decision',body)).ok);
 const candidate=await login('qa26.protocol.1789817576996.a@example.test');must(await candidate.post('/api/Candidate/attempts/197/submit',{}),'Submit own fixture for post-exam review');attempt=must(await sa.get('/api/Attempt/197'));
}
let initial=await proctor.get('/api/Proctor/session/149/decision');
if(initial.ok&&initial.data.isFinalized)must(await proctor.post('/api/Proctor/decision/override',{decisionId:initial.data.id,newStatus:2,overrideReason:'QA26 repeat workflow'}));
else{
 for(const status of [1,2,3,4,5]){const saved=await proctor.post('/api/Proctor/decision',{...body,status});const loaded=await proctor.get('/api/Proctor/session/149/decision');e.check(`Supported decision ${status} saves and reloads`,saved.ok&&loaded.ok&&loaded.data.status===status,{status:saved.status,body:saved.body});}
 const final=must(await proctor.post('/api/Proctor/decision',{...body,status:2,finalize:true}));
 e.check('Finalized decision rejects ordinary mutation',!(await proctor.post('/api/Proctor/decision',{...body,status:3})).ok);
 const overridden=must(await proctor.post('/api/Proctor/decision/override',{decisionId:final.id,newStatus:3,overrideReason:'QA26 evidence warrants second review'}));
 e.check('Override records previous status and persists finalized state',overridden.previousStatus===2&&overridden.status===3&&overridden.wasOverridden&&overridden.isFinalized,overridden);
 must(await proctor.post('/api/Proctor/decision/override',{decisionId:final.id,newStatus:2,overrideReason:'QA26 final synthetic clearance'}));
}
const decision=must(await proctor.get('/api/Proctor/session/149/decision'));
for(const c of [foreign,ops]){
 e.check(`${c.identity} cannot read decision`,!(await c.get('/api/Proctor/session/149/decision')).ok);
 e.check(`${c.identity} cannot override decision`,!(await c.post('/api/Proctor/decision/override',{decisionId:decision.id,newStatus:4,overrideReason:'QA26 prohibited override'})).ok);
 e.check(`${c.identity} cannot make decision`,!(await c.post('/api/Proctor/decision',{...body,status:4})).ok);
}
e.check('Foreign decision mutations leave saved clearance intact',must(await proctor.get('/api/Proctor/session/149/decision')).status===2);
e.check('Invalid decision enum rejected',!(await proctor.post('/api/Proctor/decision',{...body,status:99})).ok);
const terminated=await proctor.post('/api/Proctor/decision',{...body,proctorSessionId:150,status:4});
e.record({policyObservation:'Terminated attempt198 cannot receive decision: service permits Submitted/Expired only. No policy inferred or changed.',response:terminated});
e.check('Decision changes preserve terminal attempt status',must(await sa.get('/api/Attempt/197')).status===attempt.status);
for(const id of [1,2,3,4]){const job=await sa.get(`/api/ExamResult/export/${id}`);e.record({exportObservation:job.data});if(job.ok)e.check(`Backend export ${id} produces downloadable output within observed interval`,job.data.status===3&&!!job.data.filePath,{status:job.data.status,requestedAt:job.data.requestedAt,observedAt:new Date().toISOString()});}
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
