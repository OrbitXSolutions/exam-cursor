import fs from 'node:fs';
import path from 'node:path';
import {adminClient,Client,Evidence,must,privateConfig,here} from './client.mjs';
const stage=process.argv[2]??'before',ev=new Evidence(`phase9-assessment-${stage}`),admin=await adminClient(ev);
const login=async(email)=>{const c=new Client({evidence:ev});must(await c.login(email,privateConfig().password),'login');return c;};
const eng=await login('qa26.eng.admin1@example.test'),ops=await login('qa26.ops.admin1@example.test'),none=await login('qa26.d34.nodept.admin@example.test');
const base={examType:0,titleEn:`QA26 Assessment Scope ${stage} ${Date.now()}`,titleAr:`اختبار العزل ${stage} ${Date.now()}`,descriptionEn:'Disposable authorization probe',startAt:new Date(Date.now()-60000).toISOString(),endAt:new Date(Date.now()+3600000).toISOString(),durationMinutes:30,maxAttempts:1,passScore:1,isActive:true,showResults:true,allowReview:true,showCorrectAnswers:true};
const exam=must(await eng.post('/api/Assessment/exams',base),'own exam creation');
const section=must(await eng.post(`/api/Assessment/exams/${exam.id}/sections`,{titleEn:'Own section',titleAr:'قسم',order:1}),'own section creation');
const topic=must(await eng.post(`/api/Assessment/sections/${section.id}/topics`,{titleEn:'Own topic',titleAr:'موضوع',order:1}),'own topic creation');
const question=must(await eng.post(`/api/Assessment/sections/${section.id}/questions`,{questionId:131,order:1}),'own question add');
const instruction=must(await eng.post(`/api/Assessment/exams/${exam.id}/instructions`,{contentEn:'Private instructions',contentAr:'تعليمات',order:1}),'own instruction creation');
must(await eng.put(`/api/Assessment/exams/${exam.id}/access-policy`,{isPublic:false,restrictToAssignedCandidates:true,accessCode:'QA26-SCOPE'}),'own access policy');
fs.writeFileSync(path.join(here,`phase9-assessment-${stage}-fixture.json`),JSON.stringify({examId:exam.id,sectionId:section.id,topicId:topic.id,questionId:question.id,instructionId:instruction.id},null,2));
for(const [name,client] of [['foreign',ops],['no department',none]]){
 const list=must(await client.get('/api/Assessment/exams?filterByUserDepartment=false&pageSize=100'),'list bypass probe');
 ev.check(`${name} cannot bypass exam list scope with filter flag`,!list.items.some(x=>x.id===exam.id),{total:list.totalCount,exposed: list.items.filter(x=>x.id===exam.id)});
 for(const route of [`exams/${exam.id}`,`exams/${exam.id}/sections`,`sections/${section.id}`,`sections/${section.id}/topics`,`topics/${topic.id}`,`sections/${section.id}/questions`,`topics/${topic.id}/questions`,`exams/${exam.id}/access-policy`,`exams/${exam.id}/instructions`,`exams/${exam.id}/builder`,`exams/${exam.id}/validate`]){
  const r=await client.get(`/api/Assessment/${route}`);ev.check(`${name} cannot read ${route}`,!r.ok,{status:r.status,body:r.body});
 }
}
const snapshot=async()=>must(await admin.get(`/api/Assessment/exams/${exam.id}`),'privileged persisted snapshot');
async function deny(name,method,route,dto){const before=await snapshot(),r=await ops.request(method,`/api/Assessment/${route}`,dto),after=await snapshot();ev.check(name,!r.ok&&JSON.stringify(before)===JSON.stringify(after),{status:r.status,response:r.body,unchanged:JSON.stringify(before)===JSON.stringify(after)});return r;}
await deny('Foreign section creation denied without persistence','POST',`exams/${exam.id}/sections`,{titleEn:'FOREIGN new',titleAr:'خارج',order:9});
await deny('Foreign section update denied without persistence','PUT',`sections/${section.id}`,{titleEn:'FOREIGN rename',titleAr:'خارج',order:1});
await deny('Foreign section reorder denied','POST',`exams/${exam.id}/sections/reorder`,[{sectionId:section.id,newOrder:2}]);
await deny('Foreign topic create denied','POST',`sections/${section.id}/topics`,{titleEn:'FOREIGN topic',titleAr:'خارج',order:8});
await deny('Foreign topic update denied','PUT',`topics/${topic.id}`,{titleEn:'FOREIGN topic rename',titleAr:'خارج',order:1});
await deny('Foreign topic reorder denied','POST',`sections/${section.id}/topics/reorder`,[{topicId:topic.id,newOrder:2}]);
await deny('Foreign question add denied','POST',`sections/${section.id}/questions`,{questionId:132,order:2});
await deny('Foreign question bulk add denied','POST',`sections/${section.id}/questions/bulk`,{questionIds:[133]});
await deny('Foreign question manual add denied','POST',`sections/${section.id}/questions/manual`,{questions:[{questionId:134,order:4}]});
await deny('Foreign question random add denied','POST',`sections/${section.id}/questions/random`,{count:1,excludeExistingInExam:true});
await deny('Foreign topic question add denied','POST',`topics/${topic.id}/questions`,{questionId:135,order:1});
await deny('Foreign topic question bulk denied','POST',`topics/${topic.id}/questions/bulk`,{questionIds:[141]});
await deny('Foreign topic question manual denied','POST',`topics/${topic.id}/questions/manual`,{questions:[{questionId:156,order:3}]});
await deny('Foreign topic question random denied','POST',`topics/${topic.id}/questions/random`,{count:1,excludeExistingInExam:true});
await deny('Foreign exam question update denied','PUT',`exam-questions/${question.id}`,{order:1,points:3,isRequired:false});
await deny('Foreign exam question reorder denied','POST',`sections/${section.id}/questions/reorder`,[{examQuestionId:question.id,newOrder:90}]);
await deny('Foreign access policy mutation denied','PUT',`exams/${exam.id}/access-policy`,{isPublic:true,restrictToAssignedCandidates:false,accessCode:null});
await deny('Foreign instruction create denied','POST',`exams/${exam.id}/instructions`,{contentEn:'FOREIGN inserted',contentAr:'خارج',order:8});
await deny('Foreign instruction update denied','PUT',`instructions/${instruction.id}`,{contentEn:'FOREIGN edit',contentAr:'خارج',order:1});
await deny('Foreign instruction reorder denied','POST',`exams/${exam.id}/instructions/reorder`,[{instructionId:instruction.id,newOrder:2}]);
await deny('Foreign builder overwrite denied','PUT',`exams/${exam.id}/builder`,{sourceType:1,sections:[{sourceType:1,questionSubjectId:23,pickCount:1,order:40,titleEn:'FOREIGN pool',titleAr:'خارج'}]});
await deny('Foreign exam activation toggle denied','POST',`exams/${exam.id}/toggle-status`);
await deny('Foreign publication denied','POST',`exams/${exam.id}/publish`);
// Ensure publication state is controlled before subsequent negative checks.
must(await eng.post(`/api/Assessment/exams/${exam.id}/unpublish`),'restore draft');
// Baseline unauthorized creation can leave empty sections that legitimately prevent publication.
const forPublish=await snapshot();
for(const s of forPublish.sections.filter(s=>s.id!==section.id&&!s.sourceType&&s.questionsCount===0))must(await eng.delete(`/api/Assessment/sections/${s.id}`),'remove baseline inserted empty section');
if(!forPublish.isActive)must(await eng.post(`/api/Assessment/exams/${exam.id}/toggle-status`),'restore active state');
must(await eng.post(`/api/Assessment/exams/${exam.id}/publish`),'own publication');
await deny('Foreign unpublication denied','POST',`exams/${exam.id}/unpublish`);
must(await eng.post(`/api/Assessment/exams/${exam.id}/unpublish`),'restore draft');
await deny('Foreign question removal denied','DELETE',`exam-questions/${question.id}`);
await deny('Foreign instruction deletion denied','DELETE',`instructions/${instruction.id}`);
await deny('Foreign topic deletion denied','DELETE',`topics/${topic.id}`);
await deny('Foreign section deletion denied','DELETE',`sections/${section.id}`);
// Cross-department source selection while the destination belongs to the attacker.
const sourceExam=must(await eng.post('/api/Assessment/exams',{...base,titleEn:base.titleEn+' source',titleAr:base.titleAr+' source'}),'source exam');
const sourceSection=must(await eng.post(`/api/Assessment/exams/${sourceExam.id}/sections`,{titleEn:'Source scope',titleAr:'قسم',order:1}),'source section');
const mixedSource=await eng.post(`/api/Assessment/sections/${sourceSection.id}/questions/bulk`,{questionIds:[131,136]});
const mixedSaved=must(await eng.get(`/api/Assessment/sections/${sourceSection.id}/questions`),'mixed source persisted state');
ev.check('Mixed allowed and foreign bank selection fails atomically',!mixedSource.ok&&mixedSaved.length===0,{response:mixedSource.body,mixedSaved});
const sourceAdd=await eng.post(`/api/Assessment/sections/${sourceSection.id}/questions`,{questionId:136,order:1});
const savedSources=must(await eng.get(`/api/Assessment/sections/${sourceSection.id}/questions`),'saved source selection');
ev.check('Own exam cannot import foreign question content',!sourceAdd.ok&&!savedSources.some(q=>q.questionId===136),{status:sourceAdd.status,savedSources});
const foreignPool=await eng.put(`/api/Assessment/exams/${sourceExam.id}/builder`,{sourceType:1,sections:[{sourceType:1,questionSubjectId:24,pickCount:1,order:10}]});
const poolState=must(await eng.get(`/api/Assessment/exams/${sourceExam.id}/builder`),'foreign pool persistence');
ev.check('Own exam cannot select a foreign dynamic pool',!foreignPool.ok&&!poolState.sections.some(s=>s.questionSubjectId===24),{response:foreignPool.body,poolState});
if(stage.startsWith('after')){
 const bulk=must(await eng.post(`/api/Assessment/sections/${sourceSection.id}/questions/bulk`,{questionIds:[131,132]}),'own bulk selection');
 ev.check('Same-department bulk selection still persists both questions',bulk.filter(q=>[131,132].includes(q.questionId)).length===2);
 const manual=must(await eng.post(`/api/Assessment/sections/${sourceSection.id}/questions/manual`,{questions:[{questionId:133,order:3,pointsOverride:7}]}),'own manual selection');
 ev.check('Same-department manual point override persists',manual.some(q=>q.questionId===133&&q.points===7));
 const dynamic=must(await eng.put(`/api/Assessment/exams/${sourceExam.id}/builder`,{sourceType:2,sections:[{sourceType:2,questionSubjectId:23,questionTopicId:34,pickCount:1,order:10}]}),'own dynamic pool');
 ev.check('Same-department dynamic topic builder persists',dynamic.sections.some(s=>s.questionSubjectId===23&&s.questionTopicId===34&&s.pickCount===1));
}
const move=await eng.put(`/api/Assessment/exams/${sourceExam.id}`,{...base,titleEn:base.titleEn+' source',titleAr:base.titleAr+' source',departmentId:9});
const moved=must(await admin.get(`/api/Assessment/exams/${sourceExam.id}`),'inspect dept transfer');
ev.check('Department admin cannot transfer own exam into another department',!move.ok&&moved.departmentId===8,{response:move.body,actualDepartmentId:moved.departmentId});
// Delete is checked last, using a privileged list as independent persisted-state oracle.
const removed=await ops.delete(`/api/Assessment/exams/${exam.id}`),remaining=await admin.get(`/api/Assessment/exams/${exam.id}`);
ev.check('Foreign exam deletion denied and source remains',!removed.ok&&remaining.ok,{response:removed.body,sourceReadable:remaining.ok});
// Disposal only removes these new unattempted fixtures, including successful baseline attacks.
await admin.delete(`/api/Assessment/exams/${exam.id}`);await admin.delete(`/api/Assessment/exams/${sourceExam.id}`);
console.log(JSON.stringify({checks:ev.checks.length,passed:ev.checks.filter(c=>c.passed).length,failed:ev.checks.filter(c=>!c.passed).map(c=>c.name)}));

