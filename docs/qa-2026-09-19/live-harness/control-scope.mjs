import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_CONTROL_EXECUTE!=='phase5'){
 console.log('Prepared only. Phase5 guard not set; no network requests made.');process.exit(0);
}
const cfg=JSON.parse(fs.readFileSync(process.env.QA_CONTROL_FIXTURES??path.join(here,'control-fixtures.json'),'utf8'));
if(!cfg.attemptId||!cfg.examId||!cfg.candidateEmail||!cfg.ownerEmail||!cfg.deniedEmails?.length)throw new Error('Reserved active attempt, owner, candidate and denied actors are required.');
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,`control-scope-${cfg.label??'before'}.json`),JSON.stringify({classification:'SIMULATED TEST: actual HTTP authorization probes with saved-state comparison; no browser or physical verification.',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output('control-scope'),secret=privateConfig();
async function login(email){const c=new Client({evidence:e});must(await c.login(email,secret.users.find(u=>u.email===email)?.password??secret.password));return c;}
const owner=await login(cfg.ownerEmail),candidate=await login(cfg.candidateEmail);
const own=must(await owner.get(`/api/attempt-control?examId=${cfg.examId}&pageSize=100`));
e.check('Authorized owner lists reserved live attempt',own.items.some(a=>a.attemptId===cfg.attemptId));
for(const email of cfg.deniedEmails){
 const actor=await login(email);
 const listed=await actor.get(`/api/attempt-control?examId=${cfg.examId}&pageSize=100`);
 e.check(`${email} cannot list reserved attempt`,!listed.ok||!listed.data.items.some(a=>a.attemptId===cfg.attemptId),{status:listed.status});
 const before=must(await candidate.get(`/api/Attempt/${cfg.attemptId}/timer`));
 const response=await actor.post('/api/attempt-control/add-time',{attemptId:cfg.attemptId,extraMinutes:1,reason:'QA26 authorization boundary probe'});
 const after=must(await candidate.get(`/api/Attempt/${cfg.attemptId}/timer`));
 e.check(`${email} cannot extend reserved attempt`,!response.ok&&before.expiresAt===after.expiresAt,{status:response.status,before:before.expiresAt,after:after.expiresAt});
 // Destructive probes require a separately reserved disposable attempt and explicit config flag.
 if(cfg.allowForceEndProbe){
  const stateBefore=await owner.get(`/api/Attempt/${cfg.attemptId}`);
  const forced=await actor.post('/api/attempt-control/force-end',{attemptId:cfg.attemptId,reason:'QA26 foreign force-end boundary probe'});
  const stateAfter=await owner.get(`/api/Attempt/${cfg.attemptId}`);
  e.check(`${email} cannot force-end reserved attempt`,!forced.ok&&JSON.stringify(stateBefore.data?.status)===JSON.stringify(stateAfter.data?.status),{status:forced.status,before:stateBefore.data?.status,after:stateAfter.data?.status});
  if(forced.ok){e.record({observation:'Unauthorized force-end persisted. Fixture is intentionally disposable; stopping further mutation checks.'});break;}
 }
}
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(c=>!c.passed).map(c=>c.name)},null,2));
