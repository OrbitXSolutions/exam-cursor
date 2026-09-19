import fs from 'node:fs';import path from 'node:path';
import {Client,Evidence,here,must,privateConfig} from './client.mjs';
const e=new Evidence('phase5-fresh-pair'),p=privateConfig(),live=JSON.parse(fs.readFileSync(path.join(here,'live-fixtures.json'))),manifest=JSON.parse(fs.readFileSync(path.join(here,'attempt-manifest.json'))),clients=[];
for(const old of live.candidates){
 const c=new Client({evidence:e});must(await c.login(old.email,p.users.find(u=>u.email===old.email)?.password??p.password));
 const s=must(await c.post('/api/Candidate/exams/115/start',{}));
 must(await c.put(`/api/Candidate/attempts/${s.attemptId}/answers`,{answers:[{questionId:131,selectedOptionIds:[376]}]}));
 const ps=must(await c.get(`/api/Proctor/session/attempt/${s.attemptId}`));
 old.attemptId=s.attemptId;old.proctorSessionId=ps.proctorSessionId??ps.id;
 clients.push({c,...old});manifest.attempts.push({examId:115,key:'lifecycle',role:'live-protocol-replacement',...old,candidateId:c.user.id,status:s.status});
}
fs.writeFileSync(path.join(here,'live-fixtures.json'),JSON.stringify(live,null,2));fs.writeFileSync(path.join(here,'attempt-manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify(live));
for(let i=0;i<30;i++){await Promise.all(clients.map(({c,proctorSessionId})=>c.post('/api/Proctor/heartbeat',{proctorSessionId,clientTimestamp:new Date().toISOString(),metadataJson:'{"source":"QA26 temporary handshake keeper"}'})));await new Promise(r=>setTimeout(r,10000));}
