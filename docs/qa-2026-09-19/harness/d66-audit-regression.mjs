import fs from 'node:fs';
import path from 'node:path';
import {Client,Evidence,adminClient,here,must,privateConfig} from './client.mjs';
const name=process.argv[2]??'d66-audit-regression';
const ev=new Evidence(name),p=privateConfig(),admin=await adminClient(ev),candidate=new Client({evidence:ev});
const manifestPath=path.join(here,`${name}-manifest.json`);
if(fs.existsSync(manifestPath))throw new Error('Existing fixture: inspect before explicitly resuming');
must(await candidate.login('qa26.eng.candidate2@example.test',p.password),'candidate login');
const session=must(await candidate.post('/api/Candidate/exams/141/start',{}),'fresh attempt');
const state={attemptId:session.attemptId,examId:141,candidateEmail:candidate.identity,originalExpiry:session.expiresAtUtc};
fs.writeFileSync(manifestPath,JSON.stringify(state,null,2));
must(await candidate.put(`/api/Candidate/attempts/${session.attemptId}/answers`,{answers:[{questionId:131,selectedOptionIds:[376]}]}),'first answer enters InProgress');
const reason='QA26 D66 persisted ordinary proctor audit';
const added=await admin.post('/api/attempt-control/add-time',{attemptId:session.attemptId,extraMinutes:2,reason});
const persisted=must(await candidate.get(`/api/Candidate/attempts/${session.attemptId}/session`),'new candidate timer');
ev.check('Addtime effect persisted on candidate expiry',added.ok&&new Date(persisted.expiresAtUtc)-new Date(session.expiresAtUtc)===120000,{before:session.expiresAtUtc,after:persisted.expiresAtUtc});
async function assertAudit(action){
 const rows=must(await admin.get(`/api/Audit/logs?EntityName=Attempt&EntityId=${session.attemptId}&Action=${encodeURIComponent(action)}&PageSize=20`),'persisted audit rows');
 ev.check(action+' immediate persisted audit row',rows.totalCount===1&&rows.items.length===1,rows);
 if(rows.items.length===1){const detail=must(await admin.get(`/api/Audit/log/${rows.items[0].id}`),'persisted audit detail');const meta=JSON.parse(detail.metadataJson);ev.check(action+' persisted actor and metadata',detail.actorId===admin.user.id&&detail.outcomeName==='Success'&&meta.attemptId===session.attemptId&&meta.reason===reason,{id:detail.id,actorId:detail.actorId,action:detail.action,outcome:detail.outcomeName,metadata:meta});return detail.id;}
}
state.addTimeAuditId=await assertAudit('AttemptControl.AddTime');
const ended=await admin.post('/api/attempt-control/force-end',{attemptId:session.attemptId,reason});
const attempt=must(await admin.get(`/api/Attempt/${session.attemptId}/details`),'forceended state');
ev.check('Forceend persists terminal status7',ended.ok&&attempt.status===7,{status:attempt.status,response:ended.body});
state.forceEndAuditId=await assertAudit('Attempt.ForceSubmitted');
state.completedAt=new Date().toISOString();fs.writeFileSync(manifestPath,JSON.stringify(state,null,2));
console.log(JSON.stringify({checks:ev.checks.length,failed:ev.checks.filter(c=>!c.passed).map(c=>c.name),state}));
