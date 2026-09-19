import fs from 'node:fs';
import path from 'node:path';
import {Client,Evidence,here,must,privateConfig} from './client.mjs';
const ev=new Evidence('d63-regression'),p=privateConfig(),state={};
const save=()=>fs.writeFileSync(path.join(here,'d63-regression-manifest.json'),JSON.stringify(state,null,2));
if(fs.existsSync(path.join(here,'d63-regression-manifest.json')))throw new Error('Existing fixture manifest: inspect and resume explicitly instead of duplicating');
async function login(email){const c=new Client({evidence:ev});must(await c.login(email,p.users.find(u=>u.email===email)?.password??p.password),'login');return c;}
const author=await login('qa26.eng.admin1@example.test'),candidate=await login('qa26.eng.candidate3@example.test');
const em=JSON.parse(fs.readFileSync(path.join(here,'exam-manifest.json'),'utf8'));
const exam=must(await author.post('/api/Assessment/exams',{...em.exams.find(x=>x.key==='auto').request,titleEn:'QA26 D63 Session Lifecycle',titleAr:'دورة حياة جلسة QA26',startAt:new Date(Date.now()-60000).toISOString(),endAt:new Date(Date.now()+3600000).toISOString(),durationMinutes:1,maxAttempts:2,passScore:5,requireProctoring:true,requireIdVerification:false,requireWebcam:false,enableScreenMonitoring:false}),'create1min exam');
state.examId=exam.id;save();
const section=must(await author.post(`/api/Assessment/exams/${exam.id}/sections`,{titleEn:'Lifecycle',titleAr:'دورة حياة',order:1}),'section');
must(await author.post(`/api/Assessment/sections/${section.id}/questions/bulk`,{questionIds:[131],useOriginalPoints:true,markAsRequired:true}),'questions');
must(await author.put(`/api/Assessment/exams/${exam.id}/access-policy`,{isPublic:true,restrictToAssignedCandidates:false,isWalkIn:false,accessCode:null}),'policy');
must(await author.post(`/api/Assessment/exams/${exam.id}/publish`),'publish');
const a=must(await candidate.post(`/api/Candidate/exams/${exam.id}/start`,{}),'start cancel fixture');state.cancelAttemptId=a.attemptId;save();
const psA=must(await candidate.get(`/api/Proctor/session/attempt/${a.attemptId}`),'session A');state.cancelSessionId=psA.id;save();
const liveBefore=must(await author.get(`/api/Proctor/sessions?ExamId=${exam.id}&Status=1&IncludeSamples=false`),'active before');
ev.check('Fresh active attempt appears in live list',liveBefore.items.some(s=>s.attemptId===a.attemptId));
must(await author.post('/api/Attempt/cancel',{attemptId:a.attemptId,reason:'QA26 D63 normal lifecycle regression'}),'cancel fresh');
const cancelled=must(await author.get(`/api/Attempt/${a.attemptId}/details`),'cancel state'),closed=must(await author.get(`/api/Proctor/session/${psA.id}`),'closed session');
ev.check('Fresh cancellation atomically closes proctor session',cancelled.status===5&&closed.status===3&&!!closed.endedAt,{attemptStatus:cancelled.status,sessionStatus:closed.status,endedAt:closed.endedAt});
const b=must(await candidate.post(`/api/Candidate/exams/${exam.id}/start`,{}),'start expiry fixture');state.expiryAttemptId=b.attemptId;state.expiresAtUtc=b.expiresAtUtc;save();
const psB=must(await candidate.get(`/api/Proctor/session/attempt/${b.attemptId}`),'session B');state.expirySessionId=psB.id;save();
while(Date.now()<new Date(b.expiresAtUtc).getTime()+1500){
 must(await candidate.post('/api/Proctor/heartbeat',{proctorSessionId:psB.id,clientTimestamp:new Date().toISOString()}),'healthy heartbeat');
 await new Promise(r=>setTimeout(r,5000));
}
const expiredRead=await candidate.get(`/api/Candidate/attempts/${b.attemptId}/session`);
const expired=must(await author.get(`/api/Attempt/${b.attemptId}/details`),'expired state'),expiredSession=must(await author.get(`/api/Proctor/session/${psB.id}`),'expired session');
ev.check('Actual1minute candidate session expiry closes proctor session',!expiredRead.ok&&expired.status===4&&expiredSession.status===2&&!!expiredSession.endedAt,{response:expiredRead.body,attemptStatus:expired.status,sessionStatus:expiredSession.status,endedAt:expiredSession.endedAt});
const active=must(await author.get(`/api/Proctor/sessions?ExamId=${exam.id}&Status=1&IncludeSamples=false`),'active after'),live=must(await author.get(`/api/Proctor/live/exam/${exam.id}`),'live after'),dash=must(await author.get(`/api/Proctor/dashboard/exam/${exam.id}`),'dashboard after'),history=must(await author.get(`/api/Proctor/sessions?ExamId=${exam.id}&IncludeSamples=false`),'history');
ev.check('Terminal attempts absent from active session list and monitoring',active.totalCount===0&&live.length===0,{activeCount:active.totalCount,liveCount:live.length});
ev.check('Dashboard active count0 retains both historical sessions',dash.activeSessions===0&&dash.totalSessions===2,dash);
ev.check('Unfiltered history retains cancelled and expired sessions',history.items.some(s=>s.attemptId===a.attemptId&&s.status===3)&&history.items.some(s=>s.attemptId===b.attemptId&&s.status===2),history.items.map(s=>({attemptId:s.attemptId,status:s.status})));
state.completedAt=new Date().toISOString();save();console.log(JSON.stringify({checks:ev.checks.length,failed:ev.checks.filter(c=>!c.passed).length,state}));
