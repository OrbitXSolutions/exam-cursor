import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_LIVE_EXECUTE!=='phase5'){console.log('Prepared only; no network calls.');process.exit(0);}
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,'regression-bootstrap-evidence.json'),JSON.stringify({startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output('bootstrap'),admin=await adminClient(e),password=privateConfig().password;
const cfg={examId:115,candidates:[],proctorEmail:'qa26.eng.proctor1@example.test',foreignProctorEmail:'qa26.ops.proctor1@example.test'};
const stamp=Date.now(),open=[];
const keeper=setInterval(()=>{void Promise.allSettled(open.map(c=>c.client.post('/api/Proctor/heartbeat',{proctorSessionId:c.proctorSessionId})));},10000);
try{
 for(const letter of ['a','b']){
  const email=`qa26.protocol.${stamp}.${letter}@example.test`;
  const user=must(await admin.post('/api/Users',{email,password,fullName:`QA26 Protocol Regression ${letter}`,role:'Candidate',departmentId:8}),'Create isolated protocol regression candidate');
  const c=new Client({evidence:e});must(await c.login(email,password));
  const s=must(await c.post('/api/Candidate/exams/115/start',{}),'Start isolated regression attempt');
  const session=must(await c.get(`/api/Proctor/session/attempt/${s.attemptId}`),'Read own proctor session');
  open.push({client:c,proctorSessionId:session.id});
  const q=s.questions.find(q=>q.questionId===131)??s.questions[0];
  must(await c.put(`/api/Candidate/attempts/${s.attemptId}/answers`,{answers:[{questionId:q.questionId,selectedOptionIds:[q.options[0].id??q.options[0].optionId]}]}),'Activate regression attempt');
  cfg.candidates.push({email,userId:user.id,attemptId:s.attemptId,proctorSessionId:session.id});
  fs.writeFileSync(path.join(here,'regression-fixtures.json'),JSON.stringify(cfg,null,2));
 }
 process.env.QA_LIVE_FIXTURES=path.join(here,'regression-fixtures.json');
 // Main harness establishes its own ten-second heartbeats after authenticated setup.
 const cutoff=setTimeout(()=>clearInterval(keeper),60000);
 try{await import('./protocol.mjs');}finally{clearTimeout(cutoff);}
}finally{clearInterval(keeper);}
