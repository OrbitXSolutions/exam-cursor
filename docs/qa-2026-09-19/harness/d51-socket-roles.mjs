import fs from 'node:fs';import path from 'node:path';
import {Client,Evidence,adminClient,here,must,privateConfig} from './client.mjs';
import {connectSignalR} from './signalr.mjs';
const e=new Evidence('d51-socket-'+(process.env.QA_LABEL??'before')),a=await adminClient(e),p=privateConfig(),actor=JSON.parse(fs.readFileSync(path.join(here,'phase9-actor.json'))),connections=[];
const owner=new Client({evidence:e}),staff=new Client({evidence:e});
await owner.login('qa26.import.a@example.test',p.password);
try {
 must(await a.post('/api/Roles/add-user',{userId:actor.id,roleName:'Proctor'}));
 must(await staff.login(actor.email,p.password));
 const candidate=await connectSignalR(owner,e,'D51 candidate observer'),proctor=await connectSignalR(staff,e,'D51 revocable proctor');connections.push(candidate.connection,proctor.connection);
 await candidate.connection.invoke('JoinAttemptRoom',203,'candidate');
 await proctor.connection.invoke('JoinAttemptRoom',203,'proctor');
 e.check('Unchanged authorized proctor can join same-department socket room',true);
 must(await a.post('/api/Roles/remove-user',{userId:actor.id,roleName:'Proctor'}));
 let rejected=false;try{await proctor.connection.invoke('SendWarningToCandidate',203,'QA26 D51 revoked-role probe');}catch(error){rejected=true;e.record({socketRejection:error.message});}
 await new Promise(resolve=>setTimeout(resolve,500));
 const received=candidate.events.some(x=>x.event==='ReceiveWarning'&&x.payload.message==='QA26 D51 revoked-role probe');
 e.check('Revoked Proctor cannot act over already-established WebSocket',rejected&&!received,{rejected,deliveredToCandidate:received,currentRoles:must(await a.get('/api/Users/'+actor.id)).roles});
 const stale=await staff.get('/api/Grading?examId=128');
 e.check('Revoked-role HTTP credential is rejected before role authorization',stale.status===401,{status:stale.status});
} finally {
 const current=must(await a.get('/api/Users/'+actor.id));if(current.roles.includes('Proctor'))must(await a.post('/api/Roles/remove-user',{userId:actor.id,roleName:'Proctor'}));
 await Promise.allSettled(connections.map(x=>x.stop()));
}
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)}));
