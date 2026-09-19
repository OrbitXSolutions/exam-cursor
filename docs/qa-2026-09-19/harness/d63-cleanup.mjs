import fs from 'node:fs';
import path from 'node:path';
import {adminClient,Evidence,must,here} from './client.mjs';
const ev=new Evidence('d63-old-cancelled-cleanup-resume'),admin=await adminClient(ev);
const prior=JSON.parse(fs.readFileSync(path.join(here,'load-ramp-before-manifest.json'),'utf8'));
if(prior.examId!==121||prior.attempts.length!==43)throw new Error('Unexpected prior ramp manifest');
const done=new Set(JSON.parse(fs.readFileSync(path.join(here,'d63-old-cancelled-cleanup-sequential.json'),'utf8')).checks.filter(c=>c.passed).map(c=>c.detail.attemptId));
const remaining=prior.attempts.filter(x=>!done.has(x.attemptId));
let nextSlot=Date.now(),index=0;
async function request(method,route,body){
 const slot=Math.max(Date.now(),nextSlot);nextSlot=slot+860;
 await new Promise(r=>setTimeout(r,slot-Date.now()));
 const response=await admin[method](route,body);
 if(response.status===429){await new Promise(r=>setTimeout(r,60000));return request(method,route,body);}
 return response;
}
await Promise.all(Array.from({length:3},async()=>{while(index<remaining.length){
 const entry=remaining[index++];
 const before=must(await request('get',`/api/Attempt/${entry.attemptId}/details`),'old attempt');
 const actor=prior.users.find(u=>u.n===entry.n);
 if(before.examId!==121||before.candidateId!==actor?.id||before.status!==5)throw new Error('Fixture state/ownership mismatch');
 const session=must(await request('get',`/api/Proctor/session/attempt/${entry.attemptId}`),'old session');
 if(session.attemptId!==entry.attemptId)throw new Error('Session mismatch');
 if(session.status===1)must(await request('post',`/api/Proctor/session/${session.id}/cancel`,{}),'close old session');
 const after=must(await request('get',`/api/Proctor/session/${session.id}`),'persisted session');
 ev.check(`Cancelled attempt ${entry.attemptId} historical session closed`,after.attemptId===entry.attemptId&&after.status===3&&!!after.endedAt,{attemptId:entry.attemptId,sessionId:session.id,beforeStatus:session.status,afterStatus:after.status,endedAt:after.endedAt});
}}));
console.log(JSON.stringify({previouslyVerified:done.size,checks:ev.checks.length,failed:ev.checks.filter(c=>!c.passed).length}));
