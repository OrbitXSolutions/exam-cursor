import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_MEDIA_EXECUTE!=='phase5'){console.log('Prepared only; no network calls.');process.exit(0);}
const before=JSON.parse(fs.readFileSync(path.join(here,'protocol-after.json'),'utf8'));
const fixtures=JSON.parse(fs.readFileSync(path.join(here,'regression-fixtures.json'),'utf8'));
const snapshotEvent=before.events.find(x=>x.method==='POST multipart'&&x.route?.startsWith('/api/Proctor/snapshot/')&&x.response?.ok);
const evidence=snapshotEvent.response.data;
const metadata=before.events.find(x=>x.route?.startsWith('/api/Media?')&&x.response?.data?.items?.some(m=>m.originalFileName===snapshotEvent.request.filename));
const media=metadata.response.data.items.find(m=>m.originalFileName===snapshotEvent.request.filename);
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,'media-privacy-after.json'),JSON.stringify({classification:'SIMULATED TEST: real authenticated/anonymous HTTP requests and persisted synthetic test image/chunk bytes. No physical capture or decoded video.',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output('media-privacy-after'),secret=privateConfig(),admin=await adminClient(e);
async function login(email){const c=new Client({evidence:e});must(await c.login(email,secret.users.find(u=>u.email===email)?.password??secret.password));return c;}
const owner=await login(fixtures.candidates[0].email),sibling=await login(fixtures.candidates[1].email),proctor=await login(fixtures.proctorEmail),foreign=await login(fixtures.foreignProctorEmail),foreignAdmin=await login('qa26.ops.admin1@example.test'),anonymous=new Client({evidence:e});
const originalHash=before.events.find(x=>x.method==='GET binary'&&x.identity===fixtures.proctorEmail&&x.route===evidence.previewUrl)?.response?.sha256;
async function bytes(c,route){const r=await fetch(new URL(route,c.base),{headers:c.token?{Authorization:`Bearer ${c.token}`}:{}});const body=Buffer.from(await r.arrayBuffer());const result={status:r.status,ok:r.ok,bytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex'),cacheControl:r.headers.get('cache-control')};e.record({identity:c.identity,route,response:result});return result;}
const privateRoute=`/api/Proctor/evidence/${evidence.id}/download`;
for(const c of [owner,proctor,admin]){
 for(const route of [privateRoute,`/api/Media/${media.id}/view`,`/api/Media/${media.id}/download`]){const r=await bytes(c,route);e.check(`${c.identity} can read exact authorized snapshot bytes via ${route}`,r.ok&&r.sha256===originalHash&&r.cacheControl?.includes('no-store'),r);}
 const listed=must(await c.get('/api/Media?folder=proctor-snapshots&pageSize=100'));e.check(`${c.identity} retains permitted snapshot metadata`,listed.items.some(x=>x.id===media.id));
}
for(const c of [anonymous,sibling,foreign,foreignAdmin]){
 for(const route of [privateRoute,`/api/Media/${media.id}/view`,`/api/Media/${media.id}/download`]){const r=await bytes(c,route);e.check(`${c.identity} cannot read private snapshot via ${route}`,!r.ok,r);}
 const detail=await c.get(`/api/Media/${media.id}`);e.check(`${c.identity} cannot read private snapshot metadata`,!detail.ok,{status:detail.status});
 const listed=await c.get('/api/Media?folder=proctor-snapshots&pageSize=100');e.check(`${c.identity} cannot list private snapshot metadata`,!listed.ok||!listed.data.items.some(x=>x.id===media.id),{status:listed.status});
}
for(const rawPath of [evidence.previewUrl,evidence.previewUrl.replace('/media/','/media//'),evidence.previewUrl.replace('proctor-snapshots','PROCTOR-SNAPSHOTS'),evidence.previewUrl.replace('proctor-snapshots','PROCTO~1'),evidence.previewUrl.replace('proctor-snapshots','PROCTO%7E1')]){const r=await bytes(anonymous,rawPath);e.check('Original public snapshot alias denied '+rawPath,!r.ok,r);}
const deniedDelete=await foreignAdmin.delete(`/api/Media/${media.id}`);e.check('Foreign administrator cannot delete private snapshot',!deniedDelete.ok&&(await owner.get(`/api/Media/${media.id}`)).ok,{status:deniedDelete.status});
const url=must(await proctor.get(`/api/Proctor/evidence/${evidence.id}/download-url`));e.check('Evidence download link is real authenticated endpoint',url===privateRoute&&(await bytes(proctor,url)).ok,{url});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6BkAAAAASUVORK5CYII=','base64');
const publicUpload=await owner.upload('/api/Media/upload?folder=qa26-public-control',png,'QA26-public-control.png','image/png');
const publicFile=publicUpload.body?.file??publicUpload.data?.file??publicUpload.data;
if(publicUpload.ok&&publicFile?.id){const r=await bytes(anonymous,`/api/Media/${publicFile.id}/view`);e.check('Ordinary public media remains anonymously viewable',r.ok&&r.sha256===crypto.createHash('sha256').update(png).digest('hex'));must(await admin.delete(`/api/Media/${publicFile.id}`),'Remove disposable public control');}else e.check('Public media control uploads',false,publicUpload.body);
if(process.env.QA_MEDIA_CHUNK_CHECK==='1'){
const chunksBefore=must(await proctor.get(`/api/Proctor/video-chunks/${evidence.attemptId}`));
for(const index of [-2,1000000]){const form=new FormData();form.append('chunk',new Blob([Buffer.from('QA26 invalid chunk')],{type:'video/webm'}),'chunk.webm');form.append('chunkIndex',String(index));const r=await fetch(owner.base+`/api/Proctor/video-chunk/${evidence.attemptId}`,{method:'POST',headers:{Authorization:`Bearer ${owner.token}`},body:form});const body=await r.json();e.check('Unsupported chunk index rejected '+index,r.status===400,{status:r.status,body});}
const chunksAfter=must(await proctor.get(`/api/Proctor/video-chunks/${evidence.attemptId}`));e.check('Rejected chunk indices do not create stored chunks',chunksAfter.totalChunks===chunksBefore.totalChunks&&chunksAfter.totalSizeBytes===chunksBefore.totalSizeBytes);
}else e.record({notTested:'D30 source not yet in running binary; negative-index verification intentionally deferred until next build.'});
const ownEvents=await proctor.get('/api/Attempt/193/events'),otherEvents=await foreign.get('/api/Attempt/193/events'),candidateEvents=await owner.get('/api/Attempt/193/events');
e.check('D25 authorized proctor reads saved paste/tab attempt events',ownEvents.ok&&ownEvents.data.some(x=>x.eventTypeName==='PasteAttempt')&&ownEvents.data.some(x=>x.eventTypeName==='TabSwitched'));
e.check('D25 foreign proctor event history remains denied',!otherEvents.ok,{status:otherEvents.status});e.check('D25 candidate cannot read staff event history',candidateEvents.status===403,{status:candidateEvents.status});
e.record({fixtures:{attemptId:evidence.attemptId,sessionId:evidence.proctorSessionId,evidenceId:evidence.id,mediaId:media.id,originalPublicPath:evidence.previewUrl,privateRoute},remainingData:'Original synthetic snapshot and recording kept for browser inspection; disposable public control deleted.'});
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(c=>!c.passed).map(c=>c.name)},null,2));
