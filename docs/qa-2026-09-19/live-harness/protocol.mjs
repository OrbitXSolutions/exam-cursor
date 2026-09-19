import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
import {connectSignalR} from '../harness/signalr.mjs';
import {exerciseMedia} from './media.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_LIVE_EXECUTE!=='phase5'){
 console.log('Prepared only. After phase5 authorization, set QA_LIVE_EXECUTE=phase5 and provide live-harness/fixtures.json. This script never starts attempts.');
 process.exit(0);
}
const cfg=JSON.parse(fs.readFileSync(process.env.QA_LIVE_FIXTURES??path.join(here,'fixtures.json'),'utf8'));
if(cfg.candidates?.length!==2||cfg.candidates.some(x=>!x.attemptId))throw new Error('Exactly two reserved, already-started simulation attempts are required.');
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,`protocol-${process.env.QA_LIVE_LABEL??'evidence'}.json`),JSON.stringify({classification:'SIMULATED TEST: actual HTTP and SignalR WebSocket connections. SDP and ICE are synthetic payloads; no camera/screen media capture or playback is established.',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const ev=new Output('protocol');const secret=privateConfig();const admin=await adminClient(ev);
const login=async email=>{const c=new Client({evidence:ev});const password=secret.users.find(u=>u.email===email)?.password??secret.password;must(await c.login(email,password),'Login '+email);return c;};
const candidates=await Promise.all(cfg.candidates.map(async f=>({...f,client:await login(f.email)})));
const proctor=await login(cfg.proctorEmail),foreign=await login(cfg.foreignProctorEmail);
const open=[];
let heartbeatsBusy=false;
async function keepAlive(){if(heartbeatsBusy)return;heartbeatsBusy=true;try{await Promise.all(candidates.filter(c=>c.proctorSessionId&&!c.finished).map(c=>c.client.post('/api/Proctor/heartbeat',{proctorSessionId:c.proctorSessionId,clientTimestamp:new Date().toISOString(),metadataJson:'{"source":"QA26 periodic simulated client"}'})));}catch(error){ev.record({heartbeatError:error.message});}finally{heartbeatsBusy=false;}}
await keepAlive();
const heartbeatTimer=setInterval(keepAlive,10000);
async function socket(client,label){
 const s=await connectSignalR(client,ev,label);open.push(s);
 for(const event of ['ReceiveIceCandidate','ReceiveScreenOffer','ReceiveScreenAnswer','ReceiveScreenIceCandidate','ScreenPeerLeft','RenegotiationRequested','ViolationEventReceived','ExamTerminated'])
  s.connection.on(event,payload=>{s.events.push({event,payload,at:Date.now()});ev.record({signalR:label,event,payload});});
 return s;
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function received(s,event,since,predicate=()=>true){const deadline=Date.now()+5000;while(Date.now()<deadline){const e=s.events.slice(since).find(x=>x.event===event&&predicate(x.payload));if(e)return e;await delay(50);}return null;}
async function delivery(name,s,event,action,predicate){const since=s.events.length;const t=Date.now();const result=await action();const hit=await received(s,event,since,predicate);ev.check(name,!!hit,{latencyMs:hit?hit.at-t:null,payload:hit?.payload});return {result,event:hit};}
async function rejected(name,s,method,...args){let error;try{await s.connection.invoke(method,...args);}catch(e){error=e.message;}ev.check(name,!!error,{method,error});}
const aid=candidates[0].attemptId,bid=candidates[1].attemptId;
try{
 // These reads verify ownership/state before this script changes an exam.
 for(const c of candidates){
  const session=must(await c.client.get(`/api/Candidate/attempts/${c.attemptId}/session`),'Own candidate session');
  ev.record({fixture:{email:c.email,attemptId:c.attemptId,sessionState:session.status}});
  if(!c.proctorSessionId){const made=must(await c.client.post('/api/Proctor/session',{attemptId:c.attemptId,mode:1,deviceFingerprint:'QA26 simulated protocol',userAgent:'QA26 Node SignalR'}));c.proctorSessionId=made.proctorSessionId;}
  ev.check('Proctor can read reserved session '+c.attemptId,(await proctor.get(`/api/Proctor/session/${c.proctorSessionId}`)).ok);
 }
 fs.writeFileSync(path.join(here,'runtime-fixtures.json'),JSON.stringify({examId:cfg.examId,candidates:candidates.map(({email,attemptId,proctorSessionId})=>({email,attemptId,proctorSessionId})),proctorEmail:cfg.proctorEmail,foreignProctorEmail:cfg.foreignProctorEmail},null,2));
 const monitor=await socket(proctor,'authorized-proctor');const outsider=await socket(foreign,'foreign-proctor');
 for(const c of candidates){await monitor.connection.invoke('JoinAttemptRoom',c.attemptId,'proctor');await monitor.connection.invoke('JoinScreenRoom',c.attemptId,'proctor');c.socket=await socket(c.client,c.email);const since=monitor.events.length;await c.socket.connection.invoke('JoinAttemptRoom',c.attemptId,'candidate');await c.socket.connection.invoke('JoinScreenRoom',c.attemptId,'candidate');const peer=await received(monitor,'PeerJoined',since,p=>p.attemptId===c.attemptId&&p.role==='candidate');ev.check('Proctor sees candidate room membership '+c.attemptId,!!peer);c.connectionId=peer?.payload.connectionId;}
 const [one,two]=candidates;
 const ownerList=must(await proctor.get(`/api/attempt-control?examId=${cfg.examId}&pageSize=100`));ev.check('Authorized proctor lists reserved active attempt',ownerList.items.some(a=>a.attemptId===aid));
 const foreignList=await foreign.get(`/api/attempt-control?examId=${cfg.examId}&pageSize=100`);ev.check('Foreign proctor cannot list live attempt metadata',!foreignList.ok||!foreignList.data.items.some(a=>a.attemptId===aid),{status:foreignList.status});
 const candidateList=await one.client.get(`/api/attempt-control?examId=${cfg.examId}&pageSize=100`);ev.check('Candidate cannot list staff attempt controls',candidateList.status===403,{status:candidateList.status});
 await rejected('Candidate cannot join sibling camera room',one.socket,'JoinAttemptRoom',bid,'candidate');
 await rejected('Candidate cannot join sibling screen room',one.socket,'JoinScreenRoom',bid,'candidate');
 await rejected('Candidate cannot claim proctor role',one.socket,'JoinAttemptRoom',aid,'proctor');
 await rejected('Foreign proctor camera room denied',outsider,'JoinAttemptRoom',aid,'proctor');
 await rejected('Foreign proctor screen room denied',outsider,'JoinScreenRoom',aid,'proctor');
 await rejected('Unjoined foreign signal denied',outsider,'SendWarningToCandidate',aid,'QA26 forbidden');
 await rejected('Candidate privileged warning denied',one.socket,'SendWarningToCandidate',aid,'QA26 forbidden');
 await rejected('Candidate privileged termination denied',one.socket,'SendTerminationToCandidate',aid,'QA26 forbidden');
 await rejected('Candidate time-extension signal denied',one.socket,'NotifyTimeExtended',aid,1,1000);
 // D04 covered new authentication. Check the already-established socket separately.
 try{
  must(await admin.post(`/api/Users/${one.client.user.id}/block`),'Block reserved simulated candidate');
  await rejected('Already connected blocked candidate cannot signal',one.socket,'SendOffer',aid,'QA26 blocked account signal');
 }finally{must(await admin.post(`/api/Users/${one.client.user.id}/unblock`),'Restore reserved simulated candidate');}
 // A secure hub may evict revoked membership; rejoin after account restoration.
 await one.socket.connection.invoke('JoinAttemptRoom',aid,'candidate');
 await one.socket.connection.invoke('JoinScreenRoom',aid,'candidate');
 await delivery('Camera SDP offer routed candidate to proctor',monitor,'ReceiveOffer',()=>one.socket.connection.invoke('SendOffer',aid,'QA26 simulated camera SDP'),p=>p.attemptId===aid&&p.sdp==='QA26 simulated camera SDP');
 await delivery('Camera SDP answer routed to correct candidate',one.socket,'ReceiveAnswer',()=>monitor.connection.invoke('SendAnswer',aid,'QA26 simulated answer',one.connectionId),p=>p.sdp==='QA26 simulated answer');
 await delivery('Camera ICE routed to proctor',monitor,'ReceiveIceCandidate',()=>one.socket.connection.invoke('SendIceCandidate',aid,'QA26 simulated ICE',null));
 await delivery('Screen SDP offer routed to proctor',monitor,'ReceiveScreenOffer',()=>one.socket.connection.invoke('SendScreenOffer',aid,'QA26 simulated screen SDP'),p=>p.attemptId===aid);
 await delivery('Screen SDP answer routed to candidate',one.socket,'ReceiveScreenAnswer',()=>monitor.connection.invoke('SendScreenAnswer',aid,'QA26 simulated screen answer',one.connectionId));
 await delivery('Screen ICE routed to proctor',monitor,'ReceiveScreenIceCandidate',()=>one.socket.connection.invoke('SendScreenIceCandidate',aid,'QA26 screen ICE',null));
 const siblingSince=two.socket.events.length;await monitor.connection.invoke('SendAnswer',aid,'QA26 foreign-target',two.connectionId);await delay(300);
 ev.check('Targeting sibling connection does not deliver other attempt signaling',!two.socket.events.slice(siblingSince).some(e=>e.event==='ReceiveAnswer'&&e.payload.sdp==='QA26 foreign-target'));
 await delivery('Proctor renegotiation reaches candidate',one.socket,'RenegotiationRequested',()=>monitor.connection.invoke('RequestRenegotiation',aid));
 await delivery('Candidate connection status reaches proctor',monitor,'ConnectionStatusChanged',()=>one.socket.connection.invoke('NotifyConnectionStatus',aid,'connected'),p=>p.status==='connected');
 await delivery('Candidate screen status reaches proctor',monitor,'ScreenShareStatusChanged',()=>one.socket.connection.invoke('NotifyScreenShareStatus',aid,'started'),p=>p.status==='started');
 const warning='QA26 protocol warning '+Date.now();
 const warn=await delivery('HTTP proctor warning delivered over WebSocket',one.socket,'ReceiveWarning',()=>proctor.post(`/api/Proctor/session/${one.proctorSessionId}/warning`,{message:warning}),p=>p.message===warning);ev.check('Warning mutation succeeds',warn.result.ok);
 const status=must(await one.client.get(`/api/Proctor/candidate-status/${aid}`));ev.check('Warning fallback persists until candidate poll',status.hasWarning&&status.warningMessage===warning);
 ev.check('Consumed warning clears from fallback',!must(await one.client.get(`/api/Proctor/candidate-status/${aid}`)).hasWarning);
 const persistedEvents=must(await proctor.get(`/api/Proctor/session/${one.proctorSessionId}/events`));ev.check('Warning event remains in audit history',JSON.stringify(persistedEvents).includes(warning));
 const timerBefore=must(await one.client.get(`/api/Attempt/${aid}/timer`));
 const extra=await delivery('HTTP add-time delivered over WebSocket',one.socket,'TimeExtended',()=>proctor.post('/api/attempt-control/add-time',{attemptId:aid,extraMinutes:1,reason:'QA26 protocol time extension'}),p=>p.attemptId===aid&&p.extraMinutes===1);ev.check('Add-time accepted',extra.result.ok);
 const timerAfter=must(await one.client.get(`/api/Attempt/${aid}/timer`));ev.check('Time extension persists exact60seconds in expiry',new Date(timerAfter.expiresAt)-new Date(timerBefore.expiresAt)===60000,{before:timerBefore.expiresAt,after:timerAfter.expiresAt});
 const foreignBefore=must(await one.client.get(`/api/Attempt/${aid}/timer`));const attack=await foreign.post('/api/attempt-control/add-time',{attemptId:aid,extraMinutes:1,reason:'QA26 cross-department denied probe'});const foreignAfter=must(await one.client.get(`/api/Attempt/${aid}/timer`));ev.check('Foreign proctor add-time denied without mutation',!attack.ok&&foreignBefore.expiresAt===foreignAfter.expiresAt,{status:attack.status,before:foreignBefore.expiresAt,after:foreignAfter.expiresAt});
 for(const c of candidates){const hb=await c.client.post('/api/Proctor/heartbeat',{proctorSessionId:c.proctorSessionId,clientTimestamp:new Date().toISOString(),metadataJson:'{"source":"QA26 simulated"}'});ev.check('Candidate heartbeat persisted '+c.attemptId,hb.ok&&!!must(await proctor.get(`/api/Proctor/session/${c.proctorSessionId}`)).lastHeartbeatAt);}
 const eventMarker='QA26 tab '+Date.now();const violation=await delivery('Candidate violation reaches live proctor',monitor,'ViolationEventReceived',()=>one.client.post('/api/Proctor/event',{proctorSessionId:one.proctorSessionId,eventType:2,severity:2,metadataJson:JSON.stringify({source:eventMarker})}),p=>p.attemptId===aid);ev.check('Violation stored and appears after reload',violation.result.ok&&JSON.stringify(must(await proctor.get(`/api/Proctor/session/${one.proctorSessionId}/events`))).includes(eventMarker));
 await one.socket.connection.stop();const disconnectedWarning='QA26 offline warning '+Date.now();must(await proctor.post(`/api/Proctor/session/${one.proctorSessionId}/warning`,{message:disconnectedWarning}));one.socket=await socket(one.client,'candidate-reconnected');await one.socket.connection.invoke('JoinAttemptRoom',aid,'candidate');await one.socket.connection.invoke('JoinScreenRoom',aid,'candidate');const fallback=must(await one.client.get(`/api/Proctor/candidate-status/${aid}`));ev.check('Disconnected warning recovered after reconnect via persisted fallback',fallback.hasWarning&&fallback.warningMessage===disconnectedWarning);
 await delivery('Reconnected candidate receives new warning',one.socket,'ReceiveWarning',()=>proctor.post(`/api/Proctor/session/${one.proctorSessionId}/warning`,{message:'QA26 post-reconnect'}),p=>p.message==='QA26 post-reconnect');
 for(const route of [`/api/Proctor/session/${one.proctorSessionId}`,`/api/Proctor/video-recording/${aid}`,`/api/Proctor/video-chunks/${aid}`]){
  const authorized=await proctor.get(route);
  if(!authorized.ok){ev.record({notTested:'Existing accessible media fixture absent for ownership comparison',route,authorizedStatus:authorized.status});continue;}
  const r=await foreign.get(route);ev.check('Foreign proctor media/session read denied '+route,!r.ok,{authorizedStatus:authorized.status,status:r.status});
 }
 const peerSession=await two.client.get(`/api/Proctor/session/attempt/${aid}`);ev.check('Sibling candidate session/media metadata denied',!peerSession.ok,{status:peerSession.status});
 if(process.env.QA_LIVE_MEDIA==='1')await exerciseMedia({candidate:one.client,sibling:two.client,proctor,foreign,attemptId:aid,sessionId:one.proctorSessionId,e:ev});
 if(cfg.identityVerificationId){
  const route=`/api/proctor/authentication/verifications/${cfg.identityVerificationId}/images/document`;
  const allowed=await fetch(proctor.base+route,{headers:{Authorization:`Bearer ${proctor.token}`}});
  const imageBytes=(await allowed.arrayBuffer()).byteLength;
  ev.check('Authorized proctor identity image baseline exists',allowed.ok&&imageBytes>0,{status:allowed.status,bytes:imageBytes});
  if(allowed.ok)for(const c of [foreign,two.client]){const r=await fetch(c.base+route,{headers:{Authorization:`Bearer ${c.token}`}});await r.arrayBuffer();ev.check(c.identity+' foreign identity image denied',!r.ok,{status:r.status});}
 }
 else ev.record({notTested:'Identity image ownership in this script: no verification fixture supplied. Covered separately if root supplies fixture.'});
 const terminationReason='QA26 simulated proctor termination';const terminated=await delivery('HTTP termination delivered to candidate',two.socket,'SessionTerminated',()=>proctor.post(`/api/Proctor/session/${two.proctorSessionId}/terminate`,{reason:terminationReason}),p=>p.attemptId===bid);ev.check('Termination mutation accepted',terminated.result.ok);two.finished=true;
 const ended=must(await admin.get(`/api/Attempt/${bid}`));const endedStatus=must(await two.client.get(`/api/Proctor/candidate-status/${bid}`));ev.check('Termination persists at attempt and candidate status',Number(ended.status)===8&&endedStatus.isTerminated&&endedStatus.terminationReason===terminationReason,{attempt:ended.status,candidate:endedStatus});
 const late=await two.client.post(`/api/Candidate/attempts/${bid}/submit`,{});const afterLate=must(await admin.get(`/api/Attempt/${bid}`));ev.check('Terminated candidate cannot convert attempt to submitted',!late.ok&&Number(afterLate.status)===8,{status:late.status,persistedStatus:afterLate.status});
 ev.record({leftBehind:'Candidate one remains active with QA warning/events and time extension; candidate two terminated. These are reserved simulation fixtures, not root browser attempts.'});
}finally{clearInterval(heartbeatTimer);await Promise.allSettled(open.map(s=>s.connection.stop()));}
console.log(JSON.stringify({checks:ev.checks.length,failed:ev.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
