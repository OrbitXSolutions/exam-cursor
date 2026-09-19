import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {Client,Evidence,adminClient,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));const name=process.env.QA_EVIDENCE_NAME??'lookup-before';
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,name+'.json'),JSON.stringify({classification:'SIMULATED TEST: actual API and persisted state',checks:this.checks,events:this.events},null,2));}}
const ev=new Output(name);const a=await adminClient(ev);const cfg=privateConfig();const manifest=JSON.parse(fs.readFileSync(path.join(here,'../harness/data-manifest.json'),'utf8'));
const actors={};for(const key of ['eng','ops']){const u=manifest.users.find(x=>x.key===key&&x.role==='Instructor');const c=new Client({evidence:ev});must(await c.login(u.email,cfg.password));actors[key]=c;}
const marker='QA26 Scope '+Date.now();const user=must(await a.post('/api/Users',{email:`qa26.lookup.${Date.now()}@example.test`,password:cfg.password,fullName:marker,role:'Instructor'}));
const none=new Client({evidence:ev});must(await none.login(user.email,cfg.password));actors.none=none;
const ids={user:{id:user.id,email:user.email},subjects:[],topics:[]};const record=()=>fs.writeFileSync(path.join(here,name+'-fixtures.json'),JSON.stringify(ids,null,2));record();
const subjects='/api/Lookups/question-subjects',topics='/api/Lookups/question-topics';
const subject=must(await actors.eng.post(subjects,{nameEn:marker,nameAr:marker+' عربي'}));ids.subjects.push(subject.id);record();
const topic=must(await actors.eng.post(topics,{nameEn:marker+' topic',nameAr:marker+' موضوع',subjectId:subject.id}));ids.topics.push(topic.id);record();
try{
 for(const [who,c]of [['none',none],['ops',actors.ops]]){
  for(const [route,id]of [[subjects,subject.id],[topics,topic.id]]){
   const list=must(await c.get(route+'?search='+encodeURIComponent(marker)));ev.check(who+' cannot list foreign '+route,list.items.length===0,{count:list.items.length});
   const detail=await c.get(`${route}/${id}`);ev.check(who+' cannot read foreign '+route,!detail.ok,{status:detail.status});
  }
  const subChange={nameEn:marker+' changed '+who,nameAr:marker+' تغيير'};
  const put=await c.put(`${subjects}/${subject.id}`,subChange);const persisted=must(await a.get(`${subjects}/${subject.id}`));
  ev.check(who+' subject update denied before persistence',!put.ok&&persisted.nameEn===subject.nameEn,{status:put.status,persisted:persisted.nameEn});
  must(await a.put(`${subjects}/${subject.id}`,subject));
  const topicChange={nameEn:marker+' changed topic '+who,nameAr:marker+' تغيير موضوع',subjectId:subject.id};
  const tp=await c.put(`${topics}/${topic.id}`,topicChange);const tpSaved=must(await a.get(`${topics}/${topic.id}`));
  ev.check(who+' topic update denied before persistence',!tp.ok&&tpSaved.nameEn===topic.nameEn,{status:tp.status,persisted:tpSaved.nameEn});
  must(await a.put(`${topics}/${topic.id}`,topic));
  const createName=marker+' unauthorized '+who;
  const create=await c.post(topics,{nameEn:createName,nameAr:createName+' عربي',subjectId:subject.id});
  const found=must(await a.get(topics+'?search='+encodeURIComponent(createName)));
  ev.check(who+' topic create denied without hidden record',!create.ok&&found.items.length===0,{status:create.status,found:found.items.map(x=>x.id)});
  for(const x of found.items){ids.topics.push(x.id);record();must(await a.delete(`${topics}/${x.id}`));}
  const deleteTopic=must(await actors.eng.post(topics,{nameEn:marker+' delete '+who,nameAr:marker+' حذف '+who,subjectId:subject.id}));ids.topics.push(deleteTopic.id);record();
  const deleted=await c.delete(`${topics}/${deleteTopic.id}`);const exists=await a.get(`${topics}/${deleteTopic.id}`);
  ev.check(who+' foreign topic delete denied and row remains',!deleted.ok&&exists.ok,{status:deleted.status,exists:exists.ok});
  if(exists.ok)must(await a.delete(`${topics}/${deleteTopic.id}`));
  const deleteSubject=must(await actors.eng.post(subjects,{nameEn:marker+' delete subject '+who,nameAr:marker+' حذف قسم '+who}));ids.subjects.push(deleteSubject.id);record();
  const ds=await c.delete(`${subjects}/${deleteSubject.id}`);const se=await a.get(`${subjects}/${deleteSubject.id}`);
  ev.check(who+' foreign subject delete denied and row remains',!ds.ok&&se.ok,{status:ds.status,exists:se.ok});
  if(se.ok)must(await a.delete(`${subjects}/${deleteSubject.id}`));
 }
 const ownSub=await actors.eng.get(`${subjects}/${subject.id}`);const ownTopic=await actors.eng.get(`${topics}/${topic.id}`);
 ev.check('Owning department still reads subject/topic',ownSub.ok&&ownTopic.ok);
 const ownPut=await actors.eng.put(`${topics}/${topic.id}`,{...topic,nameEn:marker+' own update'});const ownReload=must(await actors.eng.get(`${topics}/${topic.id}`));
 ev.check('Owning department still updates topic persistently',ownPut.ok&&ownReload.nameEn===marker+' own update');
 const ownCreate=await none.post(subjects,{nameEn:marker+' no dept',nameAr:marker+' بدون قسم'});const ownFound=must(await a.get(subjects+'?search='+encodeURIComponent(marker+' no dept')));
 ev.check('No department subject create denied without record',!ownCreate.ok&&ownFound.items.length===0);
}finally{
 for(const id of [...new Set(ids.topics)])if((await a.get(`${topics}/${id}`)).ok)must(await a.delete(`${topics}/${id}`));
 for(const id of [...new Set(ids.subjects)])if((await a.get(`${subjects}/${id}`)).ok)must(await a.delete(`${subjects}/${id}`));
 must(await a.delete('/api/Users/'+user.id));
}
console.log(JSON.stringify({checks:ev.checks.length,failures:ev.checks.filter(c=>!c.passed).map(c=>c.name)}));
