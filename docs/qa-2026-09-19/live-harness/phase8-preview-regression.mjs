import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_PHASE8_EXECUTE!=='phase8'){console.log('Prepared only.');process.exit(0);}
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,'phase8-preview-after.json'),JSON.stringify({classification:'SIMULATED TEST: actual HTTP and exact synthetic PNG bytes; no browser or physical capture',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output('phase8-preview-after'),p=privateConfig(),c=new Client({evidence:e});must(await c.login('qa26.eng.proctor1@example.test',p.password));
const caseId=10,privateUrl='/api/Proctor/evidence/700/download';let incident=must(await c.get(`/api/Incident/case/${caseId}`));
if([3,4].includes(incident.status))must(await c.post(`/api/Incident/case/${caseId}/reopen?reason=QA26%20image%20preview%20verification`));
const linked=must(await c.post('/api/Incident/evidence/link',{caseId,proctorEvidenceId:700,noteEn:'QA26 synthetic1x1 screenshot left for manual incident-preview acceptance'}));
try{
 e.check('New evidence link response includes type and authorized preview',linked.evidenceType==='Image'&&linked.previewUrl===privateUrl,linked);
 for(const route of [`/api/Incident/case/${caseId}/evidence`,`/api/Incident/case/${caseId}`,`/api/Incident/case/by-attempt/197`]){const data=must(await c.get(route)),items=Array.isArray(data)?data:data.evidenceLinks;e.check(`Reload ${route} retains image preview metadata`,items.some(x=>x.id===linked.id&&x.evidenceType==='Image'&&x.previewUrl===privateUrl));}
 const file=await fetch(c.base+privateUrl,{headers:{Authorization:`Bearer ${c.token}`}});e.check('Incident image link serves exact synthetic bytes under authorization',file.ok&&(await file.arrayBuffer()).byteLength===68&&file.headers.get('content-type')==='image/png'&&file.headers.get('cache-control')?.includes('no-store'));
 const anonymous=await fetch(c.base+privateUrl);e.check('Incident preview link remains private',anonymous.status===401,{status:anonymous.status});
}finally{must(await c.post('/api/Incident/decision',{caseId,outcome:1,reasonEn:'QA26 synthetic preview regression complete',closeCase:true}));}
e.record({dataLeft:{caseId,attemptId:197,evidenceLinkId:linked.id,proctorEvidenceId:700,caseStatus:'Closed/Cleared'},manual:'Case10 intentionally keeps linked synthetic PNG for real-browser incident preview acceptance.'});
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
