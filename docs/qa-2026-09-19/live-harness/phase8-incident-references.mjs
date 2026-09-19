import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_PHASE8_EXECUTE!=='phase8'){console.log('Prepared only.');process.exit(0);}
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,`${this.name}.json`),JSON.stringify({classification:'SIMULATED TEST: actual HTTP and persisted incident references',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output('phase8-incident-references-before'),p=privateConfig(),sa=await adminClient(e);
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.password));return c;}
const own=await login('qa26.eng.proctor1@example.test'),foreign=await login('qa26.ops.proctor1@example.test');
const base={attemptId:198,proctorSessionId:150,source:2,severity:2,titleEn:'QA26 disposable incident reference test',titleAr:'اختبار المراجع'};
async function close(id){must(await sa.post('/api/Incident/case/status',{caseId:id,newStatus:2}));must(await sa.post('/api/Incident/decision',{caseId:id,outcome:1,reasonEn:'QA26 scope probe cleanup',closeCase:true}));}
const created=await foreign.post('/api/Incident/case',base);
const persisted=await sa.get('/api/Incident/case/by-attempt/198');
e.check('Foreign incident create rejected before persistence',!created.ok&&!persisted.ok,{response:created.status,persistedId:persisted.data?.id});
if(created.ok){const id=created.data.id;const linked=await foreign.post('/api/Incident/evidence/link',{caseId:id,proctorEvidenceId:700,noteEn:'QA26 foreign evidence probe'});const links=must(await sa.get(`/api/Incident/case/${id}/evidence`));e.check('Foreign actor cannot link foreign private evidence',!linked.ok&&!links.some(x=>x.proctorEvidenceId===700),{status:linked.status,links});if(linked.ok)must(await sa.delete(`/api/Incident/evidence/${linked.data.id}`));await close(id);}
const mismatch=await own.post('/api/Incident/case',{...base,proctorSessionId:149});
e.check('Incident rejects session belonging to another attempt',!mismatch.ok,{response:mismatch.status,saved:mismatch.data});if(mismatch.ok)await close(mismatch.data.id);
const before=must(await own.get('/api/Incident/case/10'));
const assignment=await own.post('/api/Incident/case/assign',{caseId:10,assigneeId:foreign.user.id});
const after=must(await own.get('/api/Incident/case/10'));
e.check('Reviewer cannot assign incident to a foreign department user',!assignment.ok&&after.assignedTo===before.assignedTo,{status:assignment.status,assignedTo:after.assignedTo});
must(await sa.post('/api/Incident/case/assign',{caseId:10,assigneeId:own.user.id}));
e.record({cleanup:'Created diagnostic cases closed; evidence link removed; case10 now InReview assigned to Engineering Proctor for later workflow.'});
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
