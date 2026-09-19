import fs from'node:fs';import path from'node:path';
import{Client,Evidence,adminClient,here,must,privateConfig}from'./client.mjs';
const e=new Evidence('phase2-d09-scope-regression'),admin=await adminClient(e);
const m=JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'))),bank=JSON.parse(fs.readFileSync(path.join(here,'bank-manifest.json')));
const c=new Client({evidence:e});await c.login(m.users.find(x=>x.key==='eng'&&x.role==='Instructor').email,privateConfig().password);
const foreign=bank.questions.find(x=>x.key==='ops-single');const original=must(await admin.get(`/api/QuestionBank/questions/${foreign.id}`),'Snapshot foreign question');
for(const suffix of ['', '/options','/attachments']){const r=await c.get(`/api/QuestionBank/questions/${foreign.id}${suffix}`);e.check(`Foreign question${suffix||' detail'} denied after D09`,!r.ok,r.body);}
const put=await c.put(`/api/QuestionBank/options/${original.options[0].id}`,{...original.options[0],textEn:'QA26 UNAUTHORIZED MUTATION'});
e.check('Foreign option update denied',!put.ok,put.body);
const toggle=await c.request('PATCH',`/api/QuestionBank/questions/${foreign.id}/toggle-status`);e.check('Foreign toggle denied',!toggle.ok,toggle.body);
const after=must(await admin.get(`/api/QuestionBank/questions/${foreign.id}`),'Read persisted unchanged');
e.check('Rejected foreign mutations preserve option text and active state',after.options[0].textEn===original.options[0].textEn&&after.isActive===original.isActive);
const marker=`QA26 Scope Regression ${Date.now()}`;
const body={bodyEn:marker,bodyAr:marker,subjectId:foreign.subjectId,topicId:foreign.topicId,questionTypeId:1,points:10,difficultyLevel:2,isActive:true,options:original.options};
const create=await c.post('/api/QuestionBank/questions',body);
const lookup=must(await admin.get(`/api/QuestionBank/questions?search=${encodeURIComponent(marker)}&pageSize=100`),'Verify no hidden creation');
e.check('Foreign creation rejected before persistence',!create.ok&&lookup.totalCount===0,{response:create.body,persistedCount:lookup.totalCount});
const own=bank.questions.find(x=>x.key==='single');
const move=await c.put(`/api/QuestionBank/questions/${own.id}`,{...own,subjectId:foreign.subjectId,topicId:foreign.topicId});
e.check('Own question cannot be moved to foreign subject',!move.ok&&must(await admin.get(`/api/QuestionBank/questions/${own.id}`),'Read own after rejected move').subjectId===own.subjectId,move.body);
const actor=m.users.find(x=>x.key==='ops'&&x.role==='Instructor');
try{
 must(await admin.post(`/api/Departments/remove-user/${actor.id}`),'Clear department');const noDept=new Client({evidence:e});await noDept.login(actor.email,privateConfig().password);
 for(const route of ['/api/QuestionBank/questions?search=QA26&pageSize=100',`/api/QuestionBank/questions/${own.id}`,`/api/QuestionBank/questions/${own.id}/options`,`/api/QuestionBank/questions/${own.id}/attachments`,'/api/QuestionBank/questions/count',`/api/Lookups/question-subjects/${bank.subjects[0].id}`,`/api/Lookups/question-topics/${bank.topics[0].id}`]){const r=await noDept.get(route);e.check(`No-department access fails closed: ${route}`,!r.ok||(r.data?.totalCount===0)||(r.data?.count===0),r.body);}
}finally{must(await admin.post('/api/Departments/assign-user',{userId:actor.id,departmentId:actor.departmentId}),'Restore department');}
console.log(JSON.stringify({checks:e.checks.length,failures:e.checks.filter(x=>!x.passed).map(x=>x.name)},null,2));
