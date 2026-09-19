import fs from'node:fs';import path from'node:path';
import{Client,Evidence,adminClient,here,must,privateConfig}from'./client.mjs';
const e=new Evidence('d15-d23-legacy-'+(process.env.QA_LABEL??'before')),p=privateConfig(),admin=await adminClient(e),c=new Client({evidence:e});must(await c.login('qa26.eng.candidate3@example.test',p.password));
const s=must(await c.post('/api/Candidate/exams/121/start',{})),ps=must(await c.get(`/api/Proctor/session/attempt/${s.attemptId}`));must(await c.post('/api/Proctor/heartbeat',{proctorSessionId:ps.id??ps.proctorSessionId,clientTimestamp:new Date().toISOString()}));
must(await c.put(`/api/Candidate/attempts/${s.attemptId}/answers`,{answers:[{questionId:132,selectedOptionIds:[380]}]}));
const bad=await c.post(`/api/Attempt/${s.attemptId}/answers`,{questionId:132,selectedOptionIds:[999999999]}),reload=must(await c.get(`/api/Candidate/attempts/${s.attemptId}/session`));const questions=reload.questions?.length?reload.questions:reload.sections.flatMap(x=>[...(x.questions??[]),...(x.topics??[]).flatMap(y=>y.questions??[])]);e.check('Legacy MCQ_Multi rejects invalid option and keeps previousvalidselection',!bad.ok&&JSON.stringify(questions.find(q=>q.questionId===132).currentAnswer?.selectedOptionIds)==='[380]',{response:bad.body,persisted:questions.find(q=>q.questionId===132).currentAnswer});
must(await c.put(`/api/Candidate/attempts/${s.attemptId}/answers`,{answers:[{questionId:131,selectedOptionIds:[376]},{questionId:132,selectedOptionIds:[379,380]},{questionId:133,selectedOptionIds:[382,383]},{questionId:134,selectedOptionIds:[385]}]}));
must(await c.post(`/api/Candidate/attempts/${s.attemptId}/submit`,{}));
let terminated=Number(process.env.QA_TERMINATED_ID??191),before=must(await admin.get(`/api/Attempt/${terminated}`));
if(before.status!==8&&before.status!==7&&process.env.QA_LABEL==='after'){
 const terminal=must(await c.post('/api/Candidate/exams/120/start',{})),session=must(await c.get(`/api/Proctor/session/attempt/${terminal.attemptId}`));
 must(await admin.post(`/api/Proctor/session/${session.id??session.proctorSessionId}/terminate`,{reason:'QA26 legacy D23 final regression'}));
 terminated=terminal.attemptId;before=must(await admin.get(`/api/Attempt/${terminated}`));
}
if(before.status!==8&&before.status!==7)throw new Error('Expected terminal fixture for legacy submit probe');
const legacy=await c.post(`/api/Attempt/${terminated}/submit`,{}),after=must(await admin.get(`/api/Attempt/${terminated}`));e.check('Legacy submit cannot convert terminated/forcesubmitted attempt',!legacy.ok&&after.status===before.status,{beforeStatus:before.status,response:legacy.body,afterStatus:after.status});
fs.writeFileSync(path.join(here,'legacy-probe-manifest.json'),JSON.stringify({objectiveAttemptId:s.attemptId,expectedScore:40,expectedMax:40,terminalProbe:terminated},null,2));
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name),attemptId:s.attemptId}));
