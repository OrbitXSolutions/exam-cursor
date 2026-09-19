import fs from 'node:fs';import path from 'node:path';
import {adminClient,Client,Evidence,here,must,privateConfig} from './client.mjs';
const ev=new Evidence('d34-fresh-background'),admin=await adminClient(ev),p=privateConfig(),email='qa26.d34.background@example.test';
const user=must(await admin.post('/api/Users',{email,password:p.password,fullName:'QA26 D34 Background Grading',role:'Candidate',departmentId:8}),'create dedicated candidate');
const candidate=new Client({evidence:ev});must(await candidate.login(email,p.password),'candidate login');
must(await admin.post('/api/Assignments/assign',{examId:116,candidateIds:[user.id],scheduleFrom:new Date(Date.now()-60000).toISOString(),scheduleTo:new Date(Date.now()+7200000).toISOString()}),'assign dedicated candidate');
const session=must(await candidate.post('/api/Candidate/exams/116/start',{}),'fresh start');
const answers=[{questionId:131,selectedOptionIds:[376]},{questionId:132,selectedOptionIds:[379,380]},{questionId:133,selectedOptionIds:[382,383]},{questionId:134,selectedOptionIds:[385]}];
must(await candidate.put(`/api/Candidate/attempts/${session.attemptId}/answers`,{answers}),'save four known correct answers');
must(await candidate.post(`/api/Candidate/attempts/${session.attemptId}/submit`,{}),'submit fresh attempt');
let grading;
for(let i=0;i<12;i++){
 const r=await admin.get(`/api/Grading/attempt/${session.attemptId}`);
 if(r.ok&&r.data.status===2){grading=r.data;break;}
 await new Promise(resolve=>setTimeout(resolve,500));
}
ev.check('Candidate background scope can still auto-grade after authorization guards',grading?.status===2&&grading.totalScore===40&&grading.maxPossibleScore===40,{session:grading?.id,status:grading?.status,total:grading?.totalScore,max:grading?.maxPossibleScore});
let result;
for(let i=0;i<8;i++){const r=await candidate.get(`/api/Candidate/results/my-result/${session.attemptId}`);if(r.ok&&r.data?.totalScore===40){result=r.data;break;}await new Promise(resolve=>setTimeout(resolve,500));}
ev.check('Background grading still creates accessible candidate result',!!result,{result});
fs.writeFileSync(path.join(here,'d34-after-submission.json'),JSON.stringify({userId:user.id,email,attemptId:session.attemptId,gradingSessionId:grading?.id,examId:116},null,2));
console.log(JSON.stringify({attemptId:session.attemptId,checks:ev.checks.length,passed:ev.checks.filter(x=>x.passed).length}));
