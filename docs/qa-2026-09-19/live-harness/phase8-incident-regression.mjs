import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_PHASE8_EXECUTE!=='phase8'){console.log('Prepared only.');process.exit(0);}
class Output extends Evidence{save(){const value=JSON.stringify({classification:'SIMULATED TEST: actual HTTP incident lifecycle and persisted isolation',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2);for(let i=0;;i++){try{fs.writeFileSync(path.join(here,`${this.name}.json`),value);return;}catch(err){if(i>=10)throw err;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}}}
const e=new Output(process.env.QA_PHASE8_LABEL??'phase8-incident-after'),p=privateConfig(),sa=await adminClient(e);
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.password));return c;}
const own=await login('qa26.eng.proctor1@example.test'),foreign=await login('qa26.ops.proctor1@example.test'),ops=await login('qa26.ops.admin1@example.test'),eng=await login('qa26.eng.admin1@example.test');
const caseId=10;
let current=must(await own.get(`/api/Incident/case/${caseId}`));if([3,4].includes(current.status))current=must(await own.post(`/api/Incident/case/${caseId}/reopen?reason=QA26%20regression`));
const beforeComments=must(await own.get(`/api/Incident/case/${caseId}/comments`));
const comment=must(await own.post('/api/Incident/comment',{caseId,body:'QA26 review comment roundtrip',isVisibleToCandidate:false}));
const link=must(await own.post('/api/Incident/evidence/link',{caseId,proctorEvidenceId:700,noteEn:'QA26 authorized synthetic snapshot'}));
const reads=[`/api/Incident/case/${caseId}`,`/api/Incident/case/by-attempt/197`,`/api/Incident/case/${caseId}/comments`,`/api/Incident/case/${caseId}/timeline`,`/api/Incident/case/${caseId}/evidence`,`/api/Incident/case/${caseId}/decisions`,`/api/Incident/case/${caseId}/decision/latest`,`/api/Incident/dashboard/exam/115`];
for(const c of [ops,foreign]){
 for(const route of reads)e.check(`${c.identity} denied incident read ${route}`,!(await c.get(route)).ok);
 const mutations=[['PUT','/api/Incident/case',{id:caseId,titleEn:'QA26 forbidden persisted title'}],['POST','/api/Incident/comment',{caseId,body:'QA26 forbidden comment',isVisibleToCandidate:false}],['DELETE',`/api/Incident/comment/${comment.id}`],['POST','/api/Incident/case/assign',{caseId,assigneeId:c.user.id}],['POST','/api/Incident/case/status',{caseId,newStatus:3}],['POST','/api/Incident/decision',{caseId,outcome:4,reasonEn:'QA26 forbidden escalation',closeCase:true}],['POST','/api/Incident/evidence/link',{caseId,proctorEvidenceId:700}],['DELETE',`/api/Incident/evidence/${link.id}`]];
 for(const [method,route,body] of mutations)e.check(`${c.identity} denied incident mutation ${method} ${route}`,!(await c.request(method,route,body)).ok);
 const after=must(await own.get(`/api/Incident/case/${caseId}`));const comments=must(await own.get(`/api/Incident/case/${caseId}/comments`));const evidence=must(await own.get(`/api/Incident/case/${caseId}/evidence`));e.check(`${c.identity} denied writes leave persisted state intact`,after.titleEn===current.titleEn&&after.status===current.status&&after.assignedTo===current.assignedTo&&comments.length===beforeComments.length+1&&comments.some(x=>x.id===comment.id)&&evidence.some(x=>x.id===link.id));
 const list=must(await c.get('/api/Incident/cases?pageSize=100')),dash=must(await c.get('/api/Incident/dashboard'));e.check(`${c.identity} list and global totals are scoped`,!list.items.some(x=>x.id===10)&&dash.totalCases===list.totalCount);
}
const countBefore=must(await sa.get('/api/Incident/cases?examId=115&pageSize=100')).totalCount;
const foreignCreate=await foreign.post('/api/Incident/case',{attemptId:198,proctorSessionId:150,source:2,severity:2,titleEn:'QA26 forbidden cross-department create',titleAr:'حادث'});
e.check('Foreign case creation refused before persistence',!foreignCreate.ok&&must(await sa.get('/api/Incident/cases?examId=115&pageSize=100')).totalCount===countBefore);
const mismatch=await own.post('/api/Incident/case',{attemptId:198,proctorSessionId:149,source:2,severity:2,titleEn:'QA26 mismatched attempt session',titleAr:'حادث'});e.check('Mismatched session refused before persistence',!mismatch.ok&&must(await sa.get('/api/Incident/cases?examId=115&pageSize=100')).totalCount===countBefore);
const assign=await own.post('/api/Incident/case/assign',{caseId,assigneeId:foreign.user.id});e.check('Cross-department reviewer assignment refused and unchanged',!assign.ok&&must(await own.get(`/api/Incident/case/${caseId}`)).assignedTo===current.assignedTo);
e.check('Invalid direct close from InReview refused',!(await own.post(`/api/Incident/case/${caseId}/close`)).ok);
must(await own.put('/api/Incident/case',{id:caseId,severity:3,summaryEn:'QA26 reviewed synthetic evidence'}));e.check('Severity and summary edit survive reload',must(await own.get(`/api/Incident/case/${caseId}`)).severity===3);
must(await own.put('/api/Incident/comment',{commentId:comment.id,body:'QA26 edited review comment'}));e.check('Own comment edit records edited state',must(await own.get(`/api/Incident/case/${caseId}/comments`)).some(x=>x.id===comment.id&&x.isEdited&&x.body==='QA26 edited review comment'));
e.check('Another reviewer cannot edit the author comment',!(await eng.put('/api/Incident/comment',{commentId:comment.id,body:'QA26 another author'})).ok);
const evidence=must(await own.get(`/api/Incident/case/${caseId}/evidence`));e.check('Linked synthetic screenshot has usable authenticated preview',evidence.some(x=>x.id===link.id&&x.previewUrl===`/api/Proctor/evidence/700/download`),evidence);
for(const outcome of [1,2,3,4]){const saved=must(await own.post('/api/Incident/decision',{caseId,outcome,reasonEn:`QA26 synthetic outcome ${outcome}`,closeCase:false}));const loaded=must(await own.get(`/api/Incident/case/${caseId}/decision/latest`));e.check(`Incident outcome ${outcome} persists with history`,saved.outcome===outcome&&loaded.id===saved.id&&must(await own.get(`/api/Incident/case/${caseId}`)).status===3);}
must(await own.post(`/api/Incident/case/${caseId}/close`));e.check('Closed incident rejects ordinary edits',!(await own.put('/api/Incident/case',{id:caseId,severity:2})).ok);
must(await own.post(`/api/Incident/case/${caseId}/reopen?reason=QA26%20evidence%20review`));e.check('Reopen returns case to review',must(await own.get(`/api/Incident/case/${caseId}`)).status===2);
must(await own.delete(`/api/Incident/evidence/${link.id}`));e.check('Evidence unlink removes only association',!must(await own.get(`/api/Incident/case/${caseId}/evidence`)).some(x=>x.id===link.id)&&(await own.get('/api/Proctor/evidence/700/download-url')).ok);
must(await own.delete(`/api/Incident/comment/${comment.id}`));e.check('Comment deletion persists',!must(await own.get(`/api/Incident/case/${caseId}/comments`)).some(x=>x.id===comment.id));
const email=`qa26.incident.nodept.${Date.now()}@example.test`;const user=must(await sa.post('/api/Users',{email,password:p.password,fullName:'QA26 Incident reviewer no department',role:'Proctor',departmentId:null}));const nodept=await login(email);
try{
 e.check('Unassigned no-department reviewer list empty and detail denied',must(await nodept.get('/api/Incident/cases')).totalCount===0&&!(await nodept.get(`/api/Incident/case/${caseId}`)).ok);
 must(await sa.post('/api/Incident/case/assign',{caseId,assigneeId:user.id}));e.check('Explicitly assigned no-department reviewer retains intended case access',(await nodept.get(`/api/Incident/case/${caseId}`)).ok&&must(await nodept.get('/api/Incident/cases')).items.some(x=>x.id===caseId));
 must(await sa.post('/api/Incident/case/assign',{caseId,assigneeId:own.user.id}));e.check('Case reassignment revokes old reviewer even after cache warmup',!(await nodept.get(`/api/Incident/case/${caseId}`)).ok);
}finally{must(await sa.post('/api/Incident/case/assign',{caseId,assigneeId:own.user.id}));must(await sa.delete(`/api/Users/${user.id}`));}
must(await own.post('/api/Incident/decision',{caseId,outcome:1,reasonEn:'QA26 final synthetic clearance',closeCase:true}));
e.record({dataLeft:'Case10 closed/Cleared, severityHigh, original internal comment retained, added temporary comment/evidence link removed, no-department reviewer soft-deleted.',policyObservation:'All four incident outcomes persist as case decisions; they do not themselves mutate candidate scores/attempt status. No guessed invalidation semantics added.'});
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
