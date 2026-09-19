import fs from 'node:fs';
import path from 'node:path';
import {adminClient,Evidence,must,here} from './client.mjs';
const ev=new Evidence(process.argv[2]??'d62-cancel-ramp'),admin=await adminClient(ev);
const prior=JSON.parse(fs.readFileSync(path.join(here,'load-ramp-before-manifest.json'),'utf8'));
if(prior.examId!==121||prior.attempts.length!==43)throw new Error('Unexpected prior ramp manifest; refusing cleanup');
let index=0;
await Promise.all(Array.from({length:4},async()=>{
 while(index<prior.attempts.length){
  const entry=prior.attempts[index++],before=must(await admin.get(`/api/Attempt/${entry.attemptId}/details`),'pre-cancel attempt');
  const actor=prior.users.find(u=>u.n===entry.n);
  if(before.examId!==121||before.candidateId!==actor?.id)throw new Error('Fixture ownership mismatch; refusing cancellation');
  if(before.status===5){ev.check(`Prior ramp attempt${entry.attemptId} already cancelled and retained`,true,{status:before.status});continue;}
  const cancelled=await admin.post('/api/Attempt/cancel',{attemptId:entry.attemptId,reason:'QA26 D62 preserve failed concurrent ramp history before fresh-attempt regression'});
  const after=must(await admin.get(`/api/Attempt/${entry.attemptId}/details`),'persisted cancellation');
  ev.check(`Prior ramp attempt${entry.attemptId} cancelled and retained`,cancelled.ok&&after.id===entry.attemptId&&after.status===5,{beforeStatus:before.status,response:cancelled.body,afterStatus:after.status});
 }
}));
console.log(JSON.stringify({checks:ev.checks.length,passed:ev.checks.filter(c=>c.passed).length,failed:ev.checks.filter(c=>!c.passed).map(c=>c.name)}));
