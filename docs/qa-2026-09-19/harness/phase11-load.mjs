import fs from 'node:fs';
import path from 'node:path';
import { Client,Evidence,adminClient,here,must,privateConfig,savePrivate,redact } from './client.mjs';
import { connectSignalR } from './signalr.mjs';

// Execute only after the primary QA run reaches the performance phase.
if(process.env.QA_LOAD_EXECUTE!=='phase11')throw new Error('Prepared only: phase11 authorization and QA_LOAD_EXECUTE=phase11 required');
const count=Number(process.env.QA_LOAD_COUNT??50), rounds=Number(process.env.QA_LOAD_ROUNDS??12);
class LoadEvidence extends Evidence {
 constructor(){super('phase11-load-evidence');this.pending=[];fs.writeFileSync(path.join(here,'phase11-load-requests.jsonl'),'');}
 record(event){this.pending.push(redact({at:new Date().toISOString(),...event}));if(this.pending.length>=100)this.flush();}
 flush(){if(this.pending.length){fs.appendFileSync(path.join(here,'phase11-load-requests.jsonl'),this.pending.map(x=>JSON.stringify(x)).join('\n')+'\n');this.pending=[];}}
 save(){this.flush();super.save();}
}
const e=new LoadEvidence();
const a=await adminClient(e),privateData=privateConfig();
const fixtures=JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'),'utf8'));
const exams=JSON.parse(fs.readFileSync(path.join(here,'exam-manifest.json'),'utf8'));
const bank=JSON.parse(fs.readFileSync(path.join(here,'bank-manifest.json'),'utf8'));
const exam=exams.exams.find(x=>x.key==='load');
const dept=fixtures.departments.find(x=>x.key==='eng');
const actors=[],sockets=[];
let heartbeatBusy=false;
async function heartbeatAll(){if(heartbeatBusy)return;heartbeatBusy=true;try{await Promise.allSettled(actors.filter(x=>x.proctorSession&&!x.submitted).map(x=>x.c.post('/api/Proctor/heartbeat',{proctorSessionId:x.proctorSession.id??x.proctorSession.proctorSessionId,clientTimestamp:new Date().toISOString(),metadataJson:'{"source":"QA26 continuous load heartbeat"}'})));}finally{heartbeatBusy=false;}}
const heartbeatLoop=setInterval(heartbeatAll,10000);
const run={classification:'SIMULATED TEST: actual HTTP and SignalR/WebSocket application workload; no physical cameras, microphones, screen sharing or browser render workload',count,rounds,examId:exam.id,startedAt:new Date().toISOString(),users:[],attempts:[],errors:[],metrics:{}};
const save=()=>fs.writeFileSync(path.join(here,'load-manifest.json'),JSON.stringify(run,null,2));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function limited(items,limit,fn){let next=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){const index=next++;try{await fn(items[index],index);}catch(error){run.errors.push({index,error:error.message});save();}}}));}
const objective=bank.questions.filter(q=>exam.questionIds.includes(q.id));
const answers=objective.map(q=>({questionId:q.id,selectedOptionIds:q.options.filter(o=>o.isCorrect).map(o=>o.id)}));
const metrics={};
function time(category,result){(metrics[category]??=[]).push(result.ms);return result;}

try {
 await limited(Array.from({length:count},(_,i)=>i+1),5,async n=>{
  const email=`${process.env.QA_LOAD_EMAIL_PREFIX??'qa26.load'}.${String(n).padStart(2,'0')}@example.test`;
  const found=await a.get(`/api/Users/by-email/${encodeURIComponent(email)}`);
  const user=found.ok?found.data:must(await a.post('/api/Users',{email,password:privateData.password,fullName:`QA26 Load Candidate ${n}`,role:'Candidate',departmentId:dept.id}),'Create load candidate');
  const c=new Client({evidence:e});must(await c.login(email,privateData.password),'Load candidate login');
  actors.push({n,user,c});run.users.push({n,id:user.id,email});save();
 });
 e.check('All 50 distinct simulated candidate accounts authenticated',actors.length===count,{actual:actors.length,expected:count});
 if(actors.length!==count)throw new Error('Cannot run 50-candidate workload without all accounts');
 privateData.loadUsers=run.users.map(u=>({email:u.email,password:privateData.password}));savePrivate(privateData);
 await limited(actors,10,async actor=>{
  const start=time('start',await actor.c.post(`/api/Candidate/exams/${exam.id}/start`,{}));actor.session=must(start,'Start load attempt');actor.attemptId=actor.session.attemptId;
  const session=await actor.c.get(`/api/Proctor/session/attempt/${actor.attemptId}`);
  actor.proctorSession=must(session,'Start soft proctor session');
  actor.proctorSession.id??=actor.proctorSession.proctorSessionId;
  run.attempts.push({n:actor.n,attemptId:actor.attemptId,proctorSessionId:actor.proctorSession.id});save();
 });
 const active=actors.filter(x=>x.attemptId&&x.proctorSession?.id);
 const previousFiles=['load-ramp-before-manifest.json','load-d62-after-d64-before-manifest.json'].map(x=>path.join(here,x)).filter(x=>fs.existsSync(x));
 if(previousFiles.length){
  const priorIds=new Set(previousFiles.flatMap(file=>JSON.parse(fs.readFileSync(file,'utf8')).attempts.map(x=>x.attemptId)));
  e.check('Concurrency regression starts fresh attempts rather than resuming prior ramp',active.every(x=>!priorIds.has(x.attemptId)),{fresh:active.filter(x=>!priorIds.has(x.attemptId)).length,total:active.length});
 }
 e.check('50 persisted simultaneous active candidate attempts and proctor sessions',active.length===count,{actual:active.length,expected:count});
 if(active.length!==count)throw new Error('Ramp failed before full workload');
 await heartbeatAll();
 const proctor=new Client({evidence:e});const proctorUser=fixtures.users.find(x=>x.key==='eng'&&x.role==='Proctor');must(await proctor.login(proctorUser.email,privateData.password),'Proctor login');
 const watcher=await connectSignalR(proctor,e,'load-proctor');sockets.push(watcher.connection);
 await limited(active,10,async actor=>{
  actor.hub=await connectSignalR(actor.c,e,`candidate-${actor.n}`);sockets.push(actor.hub.connection);
  await actor.hub.connection.invoke('JoinAttemptRoom',actor.attemptId,'candidate');
  await watcher.connection.invoke('JoinAttemptRoom',actor.attemptId,'proctor');
 });
 e.check('50 candidate SignalR sockets joined plus live proctor',active.filter(x=>x.hub).length===count);
 run.barrierAt=new Date().toISOString();save();
 for(let round=0;round<rounds;round++){
  const settled=await Promise.allSettled(active.map(async actor=>{
   const selected=round===rounds-1?answers:answers.map((x,i)=>({...x,selectedOptionIds:(round+i)%2?x.selectedOptionIds.slice(0,1):x.selectedOptionIds}));
   const write=time('saveAnswers',await actor.c.put(`/api/Candidate/attempts/${actor.attemptId}/answers`,{answers:selected}));must(write,'Concurrent autosave');
   const beat=time('heartbeat',await actor.c.post('/api/Proctor/heartbeat',{proctorSessionId:actor.proctorSession.id,clientTimestamp:new Date().toISOString(),metadataJson:JSON.stringify({simulation:true,round,tabVisible:true})}));must(beat,'Concurrent heartbeat');
   const timer=time('timer',await actor.c.get(`/api/Attempt/${actor.attemptId}/timer`));must(timer,'Concurrent timer');
  }));
  e.check(`Round ${round+1} autosave/heartbeat/timer workload completes`,settled.every(x=>x.status==='fulfilled'),settled.filter(x=>x.status==='rejected').map(x=>x.reason.message));
  const monitoring=time('liveMonitoring',await proctor.get(`/api/Proctor/live/exam/${exam.id}`));must(monitoring,'Proctor live monitoring under load');
  if(round===1){
   const target=active[0];must(await proctor.post(`/api/Proctor/session/${target.proctorSession.id}/warning`,{message:'QA26 simulated load warning'}),'Persist warning');
   await watcher.connection.invoke('SendWarningToCandidate',target.attemptId,'QA26 simulated load warning');
   const status=must(await target.c.get(`/api/Proctor/candidate-status/${target.attemptId}`),'Candidate warning status');
   e.check('Warning during load persisted for candidate',status.hasWarning&&status.warningMessage==='QA26 simulated load warning',status);
   const oldTimer=must(await target.c.get(`/api/Attempt/${target.attemptId}/timer`),'Timer before extension');
   must(await proctor.post('/api/attempt-control/add-time',{attemptId:target.attemptId,extraMinutes:1,reason:'QA26 load extension'}),'Add time during load');
   const newTimer=must(await target.c.get(`/api/Attempt/${target.attemptId}/timer`),'Timer after extension');
   e.check('Time extension during load persisted for candidate',newTimer.remainingSeconds-oldTimer.remainingSeconds>=50,{before:oldTimer.remainingSeconds,after:newTimer.remainingSeconds});
  }
  if(round===2){
   const target=active[1];await target.hub.connection.stop();await target.hub.connection.start();await target.hub.connection.invoke('JoinAttemptRoom',target.attemptId,'candidate');
   e.record({observation:'Simulated candidate WebSocket disconnect/reconnect completed',attemptId:target.attemptId});
  }
  await delay(5000);
 }
 await limited(active,10,async actor=>{
  const session=must(time('reloadSession',await actor.c.get(`/api/Candidate/attempts/${actor.attemptId}/session`)),'Reload session persistence');
  const qs=session.questions?.length?session.questions:session.sections.flatMap(s=>[...(s.questions??[]),...(s.topics??[]).flatMap(t=>t.questions??[])]);
  const correct=answers.every(answer=>{const q=qs.find(q=>q.questionId===answer.questionId);return q&&JSON.stringify([...(q.currentAnswer?.selectedOptionIds??[])].sort())===JSON.stringify([...answer.selectedOptionIds].sort());});
  e.check(`Candidate ${actor.n} final autosaves persisted`,correct,{attemptId:actor.attemptId,answered:session.answeredQuestions});
 });
 e.check('Candidate received actual WebSocket warning under load',active[0].hub.events.some(x=>x.event==='ReceiveWarning'&&x.payload.message==='QA26 simulated load warning'));
 await limited(active,10,async actor=>{const result=time('submit',await actor.c.post(`/api/Candidate/attempts/${actor.attemptId}/submit`));must(result,'Concurrent final submit');actor.submitted=true;});
 e.check('All 50 simulated candidate attempts submitted',active.every(x=>x.submitted));
 await limited(active,5,async actor=>{
  let detail;
  for(let poll=0;poll<20;poll++){detail=must(await a.get(`/api/Attempt/${actor.attemptId}/details`),'Read final attempt');if(detail.totalScore!==null&&detail.totalScore!==undefined)break;await delay(1000);}
  e.check(`Candidate ${actor.n} independent objective score is 40/40`,detail.totalScore===40,{attemptId:actor.attemptId,totalScore:detail.totalScore,status:detail.status,answeredQuestions:detail.answeredQuestions});
 });
}catch(error){run.errors.push({fatal:error.message});e.record({fatal:error.message});process.exitCode=1;}
finally{
 clearInterval(heartbeatLoop);
 await Promise.allSettled(sockets.map(c=>c.stop()));
 for(const [key,values]of Object.entries(metrics)){const sorted=[...values].sort((a,b)=>a-b),pct=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];run.metrics[key]={count:values.length,p50Ms:pct(.5),p95Ms:pct(.95),p99Ms:pct(.99),maxMs:sorted.at(-1)};}
 run.completedAt=new Date().toISOString();save();e.save();
 if(e.checks.some(x=>!x.passed))process.exitCode=1;
 console.log(JSON.stringify({checks:e.checks.length,failures:e.checks.filter(x=>!x.passed).map(x=>x.name),metrics:run.metrics,errors:run.errors},null,2));
}
