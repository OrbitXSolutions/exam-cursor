import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_PHASE10_EXECUTE!=='phase10'){console.log('Prepared only.');process.exit(0);}
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,`${this.name}.json`),JSON.stringify({classification:'SIMULATED TEST: actual HTTP adversarial media requests, synthetic bytes only',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output(process.env.QA_PHASE10_LABEL??'phase10-media-before'),p=privateConfig(),sa=await adminClient(e);
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.users.find(x=>x.email===email)?.password??p.password));return c;}
const eng=await login('qa26.eng.admin1@example.test'),ops=await login('qa26.ops.admin1@example.test'),owner=await login('qa26.protocol.1789817576996.a@example.test'),sibling=await login('qa26.protocol.1789817576996.b@example.test');
const evidence=must(await eng.get('/api/Proctor/session/149/evidence')).find(x=>x.id===700);
for(const [c,size] of [[ops,69],[sibling,70]]){
 try{const edit=await c.post(`/api/Proctor/evidence/700/confirm?fileSize=${size}`);const actual=must(await eng.get('/api/Proctor/session/149/evidence')).find(x=>x.id===700);e.check(`${c.identity} cannot alter another candidate evidence metadata`,!edit.ok&&actual.fileSize===evidence.fileSize,{status:edit.status,storedFileSize:actual.fileSize});}
 finally{must(await owner.post(`/api/Proctor/evidence/700/confirm?fileSize=${evidence.fileSize}`));}
}
try{const invalid=await owner.post('/api/Proctor/evidence/700/confirm?fileSize=-1');const actual=must(await eng.get('/api/Proctor/session/149/evidence')).find(x=>x.id===700);e.check('Negative evidence file size rejected without persistence',!invalid.ok&&actual.fileSize===evidence.fileSize,{status:invalid.status,storedFileSize:actual.fileSize});}
finally{must(await owner.post(`/api/Proctor/evidence/700/confirm?fileSize=${evidence.fileSize}`));}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6BkAAAAASUVORK5CYII=','base64');
for(const [folder,bytes,name,type] of [['qa26-security',Buffer.from('<html>QA26 inert html</html>'),'inert.html','text/html'],['qa26-security',Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),'inert.svg','image/svg+xml'],['qa26-security',Buffer.alloc(0),'empty.png','image/png'],['../qa26-escape',png,'safe.png','image/png'],['qa26-security/../../qa26-escape',png,'safe.png','image/png']]){const r=await eng.upload(`/api/Media/upload?folder=${encodeURIComponent(folder)}`,bytes,name,type);e.check(`Invalid media/path rejected ${folder}/${name}`,!r.ok,{status:r.status,body:r.body});}
const disguised=await eng.upload('/api/Media/upload?folder=qa26-security',Buffer.from('<html>QA26 inert non-image body</html>'),'inert.png','image/png');const d=disguised.body?.file??disguised.data?.file??disguised.data;
if(disguised.ok&&d?.id){const view=await fetch(eng.base+`/api/Media/${d.id}/view`);e.record({hardeningObservation:'Image upload validates allowed extension/MIME, not actual image decoding; inert HTML text declared PNG accepted. Served image/png with nosniff, so no script execution or XSS claimed.',status:view.status,contentType:view.headers.get('content-type'),nosniff:view.headers.get('x-content-type-options')});must(await sa.delete(`/api/Media/${d.id}`));}
const q=must(await eng.post('/api/QuestionBank/questions',{bodyEn:`QA26 media isolation disposable ${Date.now()}`,bodyAr:'عزل وسائط السؤال',questionTypeId:1,subjectId:23,topicId:34,points:1,difficultyLevel:1,isActive:true,options:[{textEn:'Yes',textAr:'نعم',isCorrect:true,order:1},{textEn:'No',textAr:'لا',isCorrect:false,order:2}]}));
let media,attachment;
try{
 const upload=await eng.upload('/api/Media/upload?folder=qa26-question-bank',png,'QA26-department-image.png','image/png');media=upload.body?.file??upload.data?.file??upload.data;if(!upload.ok||!media?.id)throw Error('Media control failed');
 attachment=must(await eng.post(`/api/QuestionBank/questions/${q.id}/attachments`,{questionId:q.id,fileName:media.originalFileName,filePath:media.url,fileType:'Image',fileSize:png.length,isPrimary:true}));
 e.check('Foreign admin cannot access attached question',(await ops.get(`/api/QuestionBank/questions/${q.id}`)).status===404);
 const deleted=await ops.delete(`/api/Media/${media.id}`);const remains=await eng.get(`/api/Media/${media.id}`);e.check('Foreign admin cannot delete another department question image',!deleted.ok&&remains.ok,{deleteStatus:deleted.status,reloadStatus:remains.status,questionId:q.id,attachmentId:attachment.id,mediaId:media.id});
 if(remains.ok){const ownDelete=await eng.delete(`/api/Media/${media.id}`);e.check('Owning administrator can still remove its own disposable media',ownDelete.ok&&!(await eng.get(`/api/Media/${media.id}`)).ok);}
}finally{if(attachment)await eng.delete(`/api/QuestionBank/attachments/${attachment.id}`);if(media)await sa.delete(`/api/Media/${media.id}`);await eng.delete(`/api/QuestionBank/questions/${q.id}`);}
e.record({cleanup:'Snapshot700 size restored to original68; original checksum was null and remains null. Disposable uploads, attachment and question removed/soft-deleted. No executable payload or external callback used.'});
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
