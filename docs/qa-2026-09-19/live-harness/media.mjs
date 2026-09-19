import crypto from 'node:crypto';
import {Client,must} from '../harness/client.mjs';

// Real product upload/retrieval with fixed synthetic bytes. No device capture or video playback.
export async function exerciseMedia({candidate,sibling,proctor,foreign,attemptId,sessionId,e}){
 const anonymous=new Client({base:candidate.base,evidence:e});
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6BkAAAAASUVORK5CYII=','base64');
 const filename=`QA26-synthetic-snapshot-${Date.now()}.png`;
 const uploaded=await candidate.upload(`/api/Proctor/snapshot/${attemptId}`,png,filename,'image/png');
 e.check('Synthetic snapshot persists via candidate product upload',uploaded.ok,uploaded.body);
 const raw=async(c,route)=>{const url=new URL(route,c.base);const r=await fetch(url,{headers:c.token?{Authorization:`Bearer ${c.token}`}:{}});const bytes=Buffer.from(await r.arrayBuffer());const x={status:r.status,ok:r.ok,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),contentType:r.headers.get('content-type')};e.record({identity:c.identity,method:'GET binary',route:url.pathname,response:x});return x;};
 if(uploaded.ok){
  const evidence=uploaded.data;
  const saved=must(await proctor.get(`/api/Proctor/session/${sessionId}/evidence`));
  e.check('Proctor reload lists uploaded synthetic snapshot',saved.some(x=>x.id===evidence.id));
  const route=evidence.previewUrl??evidence.downloadUrl;
  if(route){
   const expected=crypto.createHash('sha256').update(png).digest('hex');
   const allowed=await raw(proctor,route);e.check('Authorized proctor fetches exact synthetic snapshot bytes',allowed.ok&&allowed.sha256===expected,allowed);
   for(const c of [anonymous,sibling,foreign]){const r=await raw(c,route);e.check(`${c.identity} cannot fetch another candidate snapshot URL`,!r.ok,{route,...r});}
  }else e.record({notTested:'Snapshot upload returns no preview/download URL',evidence});
  const metadata=await candidate.get('/api/Media?folder=proctor-snapshots&pageSize=100');
  const media=metadata.data?.items?.find(x=>x.originalFileName===filename);
  if(media){
   for(const c of [anonymous,sibling,foreign])for(const suffix of ['view','download']){const r=await raw(c,`/api/Media/${media.id}/${suffix}`);e.check(`${c.identity} cannot fetch another candidate snapshot via generic ${suffix}`,!r.ok,r);}
   const foreignList=await sibling.get('/api/Media?folder=proctor-snapshots&pageSize=100');e.check('Sibling media listing excludes private snapshot metadata',!foreignList.ok||!foreignList.data?.items?.some(x=>x.id===media.id),{mediaId:media.id,status:foreignList.status});
  }
  const foreignUpload=await sibling.upload(`/api/Proctor/snapshot/${attemptId}`,png,'QA26-forbidden.png','image/png');e.check('Sibling cannot inject snapshot into another attempt',!foreignUpload.ok);
 }
 const video=must(await candidate.get('/api/Proctor/video-config'));
 if(!video.enableVideoRecording){e.record({notTested:'Video chunk path disabled by existing system configuration; configuration not changed'});return;}
 const chunkBytes=[Buffer.from('1a45dfa3','hex'),Buffer.from('QA26 synthetic storage-only WebM payload')];
 async function upload(c,index,bytes){const form=new FormData();form.append('chunk',new Blob([bytes],{type:'video/webm'}),'chunk.webm');form.append('chunkIndex',String(index));form.append('timestamp',String(Date.now()));form.append('mimeType','video/webm;codecs=vp8');const r=await fetch(c.base+`/api/Proctor/video-chunk/${attemptId}`,{method:'POST',headers:{Authorization:`Bearer ${c.token}`},body:form});const body=await r.json();e.record({identity:c.identity,method:'POST synthetic video chunk',attemptId,index,size:bytes.length,status:r.status,body});return{ok:r.ok&&body.success!==false,status:r.status,body};}
 const first=await upload(candidate,0,chunkBytes[0]);const second=await upload(candidate,1,chunkBytes[1]);e.check('Two synthetic recording chunks stored',first.ok&&second.ok);
 const listed=must(await proctor.get(`/api/Proctor/video-chunks/${attemptId}`));e.check('Proctor lists exact chunk count and total stored bytes',listed.totalChunks===2&&listed.totalSizeBytes===chunkBytes[0].length+chunkBytes[1].length,listed);
 const path=`/api/Proctor/video-chunks/${attemptId}/chunk_000000.webm`;
 const original=await raw(proctor,path);e.check('Proctor retrieves exact synthetic chunk bytes',original.sha256===crypto.createHash('sha256').update(chunkBytes[0]).digest('hex'));
 const overwrite=await upload(sibling,0,Buffer.from('forbidden-overwrite'));const after=await raw(proctor,path);e.check('Sibling cannot overwrite another candidate chunk',!overwrite.ok&&after.sha256===original.sha256);
 for(const c of [anonymous,sibling,foreign]){const r=await raw(c,path);e.check(`${c.identity} cannot retrieve private video chunk`,!r.ok,r);const stat=await c.get(`/api/Proctor/video-chunks/${attemptId}`);e.check(`${c.identity} cannot list private video chunks`,!stat.ok,{status:stat.status});}
 for(const publicPath of [`/media/video-chunks/${attemptId}/chunk_000000.webm`,`/media//video-chunks/${attemptId}/chunk_000000.webm`]){const r=await raw(anonymous,publicPath);e.check('Public static recording path denied '+publicPath,!r.ok,r);}
 const malformed=await proctor.get(`/api/Proctor/video-chunks/${attemptId}/metadata.json`);e.check('Non-chunk filename cannot be downloaded',!malformed.ok&&malformed.status<500,{status:malformed.status});
 const negative=await upload(candidate,-1,Buffer.from('QA26 invalid negative index'));e.check('Negative recording chunk index rejected',!negative.ok&&negative.status<500,{status:negative.status});
 const finalized=await candidate.post(`/api/Proctor/video-finalize/${attemptId}`,{});e.check('Synthetic recording finalization accepted asynchronously',finalized.ok&&finalized.status===202,finalized.body);
 let recording;for(let i=0;i<20;i++){recording=await proctor.get(`/api/Proctor/video-recording/${attemptId}`);if(recording.ok)break;await new Promise(r=>setTimeout(r,250));}
 e.check('Recording metadata persists after background finalization',recording?.ok&&!!recording.data.chunksUrl,recording?.body);
 for(const c of [sibling,foreign]){const r=await c.get(`/api/Proctor/video-recording/${attemptId}`);e.check(`${c.identity} cannot read private recording metadata`,!r.ok,{status:r.status});}
 e.record({mediaClassification:'Synthetic PNG and arbitrary tiny WebM test bytes only. Upload, filesystem/database persistence, byte-integrity, scope and asynchronous finalization exercised. These bytes are not a physical camera recording and decode/playback is not claimed.'});
}
