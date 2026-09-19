import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_PHASE9_EXECUTE!=='phase9'){console.log('Prepared only.');process.exit(0);}
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,`${this.name}.json`),JSON.stringify({classification:'SIMULATED TEST: actual HTTP assignment and cross-role persistence checks',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output(process.env.QA_PHASE9_LABEL??'phase9-assignment-before'),p=privateConfig(),sa=await adminClient(e);
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.password));return c;}
const ops=await login('qa26.ops.admin1@example.test'),foreign=await login('qa26.ops.proctor1@example.test'),eng=await login('qa26.eng.admin1@example.test');
const body={examId:115,proctorIds:[foreign.user.id]};
const before=must(await sa.get('/api/ExamProctor/115'));if(before.assignedProctors.some(x=>x.id===foreign.user.id))throw Error('Fixture already assigned; do not change a pre-existing assignment.');
try{
 const peek=await ops.get('/api/ExamProctor/115');e.check('Foreign admin cannot read legacy exam proctor roster',!peek.ok,{status:peek.status});
 const assign=await ops.post('/api/ExamProctor/assign',body);const saved=must(await sa.get('/api/ExamProctor/115'));e.check('Foreign admin cannot grant exam access via legacy assignment',!assign.ok&&!saved.assignedProctors.some(x=>x.id===foreign.user.id),{status:assign.status,savedRoster:saved.assignedProctors});
 const leaked=await foreign.get('/api/Proctor/session/149');e.check('Unauthorized assignment does not unlock foreign candidate session',!leaked.ok,{status:leaked.status});
}finally{must(await sa.post('/api/ExamProctor/unassign',body),'Restore unauthorized assignment probe');}
try{
 const assigned=must(await sa.post('/api/ExamProctor/assign',body));e.check('SuperAdmin explicitly assigns cross-department proctor',assigned.successCount===1);
 e.check('Explicitly assigned proctor can inspect authorized session', (await foreign.get('/api/Proctor/session/149')).ok);
 const image=await fetch(foreign.base+'/api/Proctor/evidence/700/download',{headers:{Authorization:`Bearer ${foreign.token}`}});e.check('Explicitly assigned proctor can read authorized snapshot',image.ok&&(await image.arrayBuffer()).byteLength===68,{status:image.status});
 const incident=await foreign.get('/api/Incident/case/10');e.record({policyObservation:'Incident existing scope is department or specifically assigned no-department case reviewer; cross-department exam assignment is separate.',incidentStatus:incident.status,incidentList:await foreign.get('/api/Incident/cases?examId=115')});
 const revoke=await ops.post('/api/ExamProctor/unassign',body);const retained=must(await sa.get('/api/ExamProctor/115'));e.check('Foreign administrator cannot revoke legitimate assignment',!revoke.ok&&retained.assignedProctors.some(x=>x.id===foreign.user.id),{status:revoke.status});
}finally{must(await sa.post('/api/ExamProctor/unassign',body),'Restore explicit assignment exception');}
e.check('Explicit revocation immediately removes session access with existing token',!(await foreign.get('/api/Proctor/session/149')).ok);
for(const c of [ops,eng,foreign])for(const route of ['/api/Audit/logs?pageSize=1','/api/Audit/dashboard','/api/Audit/exports?pageSize=1'])e.check(`${c.identity} cannot read SuperAdmin audit interface ${route}`,(await c.get(route)).status===403);
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
