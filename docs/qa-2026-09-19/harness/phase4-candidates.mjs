import fs from'node:fs';import path from'node:path';
import{Client,Evidence,adminClient,here,must,privateConfig,savePrivate}from'./client.mjs';
const e=new Evidence('phase4-candidates-evidence'),admin=await adminClient(e);
const m=JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'))),em=JSON.parse(fs.readFileSync(path.join(here,'exam-manifest.json'))),bank=JSON.parse(fs.readFileSync(path.join(here,'bank-manifest.json')));
const p=privateConfig(),manifest={attempts:[],walkin:null,errors:[]};const save=()=>fs.writeFileSync(path.join(here,'attempt-manifest.json'),JSON.stringify(manifest,null,2));
async function user(email){const c=new Client({evidence:e});const credential=p.users.find(x=>x.email===email);must(await c.login(email,credential?.password??p.password),'Candidate login');return c;}
const candidate=await user('qa26.eng.candidate3@example.test');
const ops=await user('qa26.ops.candidate1@example.test');
const exam=key=>em.exams.find(x=>x.key===key);
function questions(session){return session.questions?.length?session.questions:session.sections.flatMap(s=>[...(s.questions??[]),...(s.topics??[]).flatMap(t=>t.questions??[])]);}
async function start(c,key,body={},role='scenario'){
 const x=exam(key),result=await c.post(`/api/Candidate/exams/${x.id}/start`,body);if(!result.ok){e.check(`${key} start succeeds`,false,result.body);return null;}
 const session=result.data;const entry={examId:x.id,key,role,email:c.identity,candidateId:c.user.id,attemptId:session.attemptId,status:session.status,questionIds:questions(session).map(q=>q.questionId),startedAtUtc:session.startedAtUtc,expiresAtUtc:session.expiresAtUtc};manifest.attempts.push(entry);save();
 e.check(`${key} candidate session omits correct answer fields`,!JSON.stringify(session).match(/"isCorrect"|"answerKey"|"rubricTextEn"|"correctOptions"/i),{attemptId:session.attemptId,questionCount:questions(session).length});
 const repeat=await c.post(`/api/Candidate/exams/${x.id}/start`,body);
 e.check(`${key} repeated start resumes same active attempt`,repeat.ok&&repeat.data.attemptId===session.attemptId,{first:session.attemptId,repeated:repeat.data?.attemptId});
 return{session,entry,c};
}
for(const key of ['future','expired','clone-draft']){
 const x=exam(key),before=must(await admin.get(`/api/Attempt?examId=${x.id}&candidateId=${candidate.user.id}`),'Read attempts before invalid start');
 const r=await candidate.post(`/api/Candidate/exams/${x.id}/start`,{});const after=must(await admin.get(`/api/Attempt?examId=${x.id}&candidateId=${candidate.user.id}`),'Read attempts after invalid start');
 e.check(`${key} start denied without creating attempt`,!r.ok&&before.totalCount===after.totalCount,r.body);
 const legacy=await candidate.post('/api/Attempt/start',{examId:x.id});
 e.check(`${key} legacy start cannot bypass availability`,!legacy.ok,legacy.body);
}
const unassigned=await ops.post(`/api/Candidate/exams/${exam('fixed-code').id}/start`,{accessCode:'QA26-FIXED'});
e.check('Unassigned Operations candidate cannot start assigned Engineering fixed exam',!unassigned.ok,unassigned.body);
for(const code of [undefined,'wrong']){const r=await candidate.post(`/api/Candidate/exams/${exam('fixed-code').id}/start`,code?{accessCode:code}:{});e.check(`Assigned exam rejects ${code?'wrong':'missing'} code`,!r.ok,r.body);}
const anon=await new Client({evidence:e}).post(`/api/Candidate/exams/${exam('auto').id}/start`,{});e.check('Anonymous cannot use authenticated candidate start',anon.status===401,anon.body);

const live=[];
for(const email of ['qa26.import.a@example.test','qa26.import.b@example.test']){
 const c=await user(email),active=await start(c,'lifecycle',{},'live-protocol');if(!active)continue;
 const automaticallyCreated=await c.get(`/api/Proctor/session/attempt/${active.entry.attemptId}`);
 e.check('Proctor session automatically exists immediately after candidate start',automaticallyCreated.ok,automaticallyCreated.body);
 must(await c.put(`/api/Candidate/attempts/${active.entry.attemptId}/answers`,{answers:[{questionId:131,selectedOptionIds:[376]}]}),'Save initial realistic live answer');
 const session=must(await c.post('/api/Proctor/session',{attemptId:active.entry.attemptId,mode:1,deviceFingerprint:`qa26-api-${email}`,userAgent:'QA26 API SIMULATION',browserName:'SIMULATED',operatingSystem:'Windows'}),'Create proctor session');
 active.entry.proctorSessionId=session.proctorSessionId??session.id;save();live.push(active);
}
const liveConfig={examId:exam('lifecycle').id,candidates:live.map(x=>({email:x.entry.email,attemptId:x.entry.attemptId,proctorSessionId:x.entry.proctorSessionId})),proctorEmail:'qa26.eng.proctor1@example.test',foreignProctorEmail:'qa26.ops.proctor1@example.test'};
fs.writeFileSync(path.join(here,'live-fixtures.json'),JSON.stringify(liveConfig,null,2));
const auto=await start(candidate,'auto');
if(auto){
 const qs=questions(auto.session),select=(qid,text)=>bank.questions.find(x=>x.id===qid).options.find(o=>o.textEn===text).id;
 const answers=[{questionId:131,selectedOptionIds:[select(131,'4')]},{questionId:132,selectedOptionIds:[select(132,'3')]},{questionId:133,selectedOptionIds:[select(133,'2')]},{questionId:134,selectedOptionIds:[select(134,'True')]}];
 must(await candidate.put(`/api/Candidate/attempts/${auto.entry.attemptId}/answers`,{answers}),'Save partial/wrong/correct answers');auto.entry.expectedScore=18;auto.entry.expectedMax=40;auto.entry.answers=answers;save();
 const reload=must(await candidate.get(`/api/Candidate/attempts/${auto.entry.attemptId}/session`),'Reload answers');
 e.check('Partial/wrong/correct answer selections persist after session reload',answers.every(a=>JSON.stringify(questions(reload).find(q=>q.questionId===a.questionId)?.currentAnswer?.selectedOptionIds)===JSON.stringify(a.selectedOptionIds)),{answered:reload.answeredQuestions});
 const invalid=await candidate.put(`/api/Candidate/attempts/${auto.entry.attemptId}/answers`,{answers:[{questionId:131,selectedOptionIds:[999999999]}]});
 const invalidReload=must(await candidate.get(`/api/Candidate/attempts/${auto.entry.attemptId}/session`),'Read after rejected answer');
 e.check('Invalid selected option rejected and previous answer preserved',!invalid.ok&&JSON.stringify(questions(invalidReload).find(q=>q.questionId===131).currentAnswer.selectedOptionIds)===JSON.stringify(answers[0].selectedOptionIds),invalid.body);
 const foreignAnswer=await candidate.put(`/api/Candidate/attempts/${auto.entry.attemptId}/answers`,{answers:[{questionId:136,selectedOptionIds:[bank.questions.find(x=>x.id===136).options[0].id]}]});
 e.check('Foreign exam question cannot be added to candidate answers',!foreignAnswer.ok,foreignAnswer.body);
 const victim=live[0];if(victim){const read=await candidate.get(`/api/Candidate/attempts/${victim.entry.attemptId}/session`);e.check('Candidate cannot read another candidate session',!read.ok,read.body);const write=await candidate.put(`/api/Candidate/attempts/${victim.entry.attemptId}/answers`,{answers:[answers[0]]});e.check('Candidate cannot write another candidate answers',!write.ok,write.body);}
}
const fixed=await start(candidate,'fixed-code',{accessCode:'QA26-FIXED'});
if(fixed){const expectedEnd=new Date(exam('fixed-code').request.startAt).getTime()+600*60000;e.check('Fixed exam expiry uses shared start plus duration',Math.abs(new Date(fixed.session.expiresAtUtc).getTime()-expectedEnd)<2000,{actual:fixed.session.expiresAtUtc,expected:new Date(expectedEnd).toISOString()});}
const pooled=await start(candidate,'pooled');if(pooled)e.check('Pooled candidate attempt materializes exactly3 unique questions',questions(pooled.session).length===3&&new Set(questions(pooled.session).map(x=>x.questionId)).size===3,{ids:questions(pooled.session).map(x=>x.questionId)});
const strict=await candidate.post(`/api/Candidate/exams/${exam('strict').id}/start`,{});e.check('Strict identity-required start enforces identity prerequisite server-side',!strict.ok,strict.body);
if(strict.ok){manifest.attempts.push({key:'strict',role:'prerequisite-probe',examId:exam('strict').id,attemptId:strict.data.attemptId,email:candidate.identity,candidateId:candidate.user.id,status:strict.data.status});save();}
const strictLegacy=await candidate.post('/api/Attempt/start',{examId:exam('strict').id});e.check('Legacy strict start cannot bypass identity prerequisite',!strictLegacy.ok,strictLegacy.body);
const walk=exam('walkin'),publicClient=new Client({evidence:e}),token=walk.share.shareToken;
const missing=await publicClient.post(`/api/public/exam/${token}/register`,{fullName:'QA26 Missing Dynamic',email:'qa26.walkin.missing@example.test',phoneNumber:'+971509999999'});
e.check('Walk-in required dynamic field enforced without user creation',!missing.ok&&!(await admin.get('/api/Users/by-email/qa26.walkin.missing%40example.test')).ok,missing.body);
const values=walk.walkInFields.map(f=>({fieldId:f.id,value:f.fieldType===2?'4':'QA26 Testing Lab'}));
const registration=await publicClient.post(`/api/public/exam/${token}/register`,{fullName:'QA26 Walk In Candidate',email:'qa26.walkin.acceptance@example.test',phoneNumber:'+971503333333',dynamicFields:values});
e.check('Walk-in registration with required text and numeric answer succeeds',registration.ok,registration.body);
if(registration.ok){publicClient.token=registration.data.accessToken;publicClient.identity='qa26.walkin.acceptance@example.test';publicClient.user={id:registration.data.candidateId};p.walkin=registration.data;savePrivate(p);const w=await start(publicClient,'walkin',{},'walkin');if(w){manifest.walkin={candidateId:registration.data.candidateId,attemptId:w.entry.attemptId,email:publicClient.identity};save();}}
console.log(JSON.stringify({checks:e.checks.length,failures:e.checks.filter(x=>!x.passed).map(x=>x.name),attempts:manifest.attempts,liveFixtures:'live-fixtures.json'},null,2));
