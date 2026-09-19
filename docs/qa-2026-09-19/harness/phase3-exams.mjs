import fs from 'node:fs';
import path from 'node:path';
import { Client, Evidence, adminClient, here, must, privateConfig } from './client.mjs';
const e=new Evidence('phase3-exams-evidence');
const admin=await adminClient(e);
const m=JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'),'utf8'));
const bank=JSON.parse(fs.readFileSync(path.join(here,'bank-manifest.json'),'utf8'));
const clients={};
for(const key of ['eng','ops']){const c=new Client({evidence:e});await c.login(m.users.find(x=>x.key===key&&x.role==='Admin').email,privateConfig().password);clients[key]=c;}
const manifest={exams:[],deleted:[]};
const save=()=>fs.writeFileSync(path.join(here,'exam-manifest.json'),JSON.stringify(manifest,null,2));
const now=Date.now(), past=new Date(now-5*60000).toISOString(), end=new Date(now+24*3600000).toISOString();
const base={examType:0,titleEn:'QA26 fixture',titleAr:'اختبار QA26',descriptionEn:'Dedicated lifecycle acceptance fixture',descriptionAr:'اختبار دورة حياة الاختبار',startAt:past,endAt:end,durationMinutes:120,maxAttempts:2,shuffleQuestions:false,shuffleOptions:false,passScore:30,isActive:true,showResults:true,allowReview:true,showCorrectAnswers:true,requireProctoring:false,requireIdVerification:false,requireWebcam:false,enableScreenMonitoring:false,screenMonitoringMode:0,screenShareGracePeriod:20,preventCopyPaste:false,preventScreenCapture:false,requireFullscreen:false,browserLockdown:false,maxViolationWarnings:0};
const engQuestions=bank.questions.filter(x=>x.department==='eng');
const cases=[
 {key:'lifecycle',title:'QA26 Complete Lifecycle',proctor:true,questions:engQuestions.map(x=>x.id),settings:{requireProctoring:true,enableScreenMonitoring:true,screenMonitoringMode:1}},
 {key:'auto',title:'QA26 Objective Immediate Review',questions:engQuestions.filter(x=>x.key!=='subjective').map(x=>x.id),settings:{passScore:25,durationMinutes:60}},
 {key:'fixed-code',title:'QA26 Fixed Assigned Code',questions:[131,132,134],assigned:true,accessCode:'QA26-FIXED',proctor:true,settings:{examType:1,durationMinutes:600,passScore:20,requireProctoring:true,showResults:false,allowReview:false,showCorrectAnswers:false}},
 {key:'pooled',title:'QA26 Random Topic Pool',pooled:true,settings:{shuffleQuestions:true,shuffleOptions:true,passScore:15}},
 {key:'walkin',title:'QA26 Walk In Registration',questions:[131,134],walkin:true,settings:{passScore:10,maxAttempts:1}},
 {key:'strict',title:'QA26 Strict Proctored Identity',questions:[131,134],assigned:true,proctor:true,settings:{passScore:10,requireProctoring:true,requireIdVerification:true,requireWebcam:true,enableScreenMonitoring:true,screenMonitoringMode:3,screenShareGracePeriod:10,requireFullscreen:true,preventCopyPaste:true,preventScreenCapture:true,browserLockdown:true,maxViolationWarnings:3}},
 {key:'load',title:'QA26 Fifty Candidate Load',questions:[131,132,133,134],proctor:true,settings:{passScore:25,durationMinutes:600,requireProctoring:true,enableScreenMonitoring:true,screenMonitoringMode:1,maxAttempts:2}},
 {key:'ops',title:'QA26 Operations Isolated Exam',dept:'ops',questions:[136],assigned:true,settings:{passScore:5}},
 {key:'future',title:'QA26 Future Window',questions:[131],settings:{passScore:5,startAt:new Date(now+48*3600000).toISOString(),endAt:new Date(now+49*3600000).toISOString()}},
 {key:'expired',title:'QA26 Expired Window',questions:[131],settings:{passScore:5,startAt:new Date(now-3*3600000).toISOString(),endAt:new Date(now-2*3600000).toISOString()}}
];
for(const cfg of cases){
 const dept=cfg.dept??'eng',c=clients[dept];
 const dto={...base,...cfg.settings,titleEn:cfg.title,titleAr:`اختبار QA26 ${cfg.key}`};
 const exam=must(await c.post('/api/Assessment/exams',dto),`Create ${cfg.key}`);
 const entry={id:exam.id,key:cfg.key,department:dept,request:dto,questionIds:cfg.questions??[],expectedMax:cfg.pooled?30:10*cfg.questions.length};
 manifest.exams.push(entry);save();
 const emptyPublish=await c.post(`/api/Assessment/exams/${exam.id}/publish`);
 e.check(`${cfg.key} empty draft cannot publish`,!emptyPublish.ok&&!(await c.get(`/api/Assessment/exams/${exam.id}`)).data.isPublished,emptyPublish.body);
 if(cfg.pooled){
  const builder=await c.put(`/api/Assessment/exams/${exam.id}/builder`,{sourceType:2,passScore:15,sections:[{sourceType:2,questionSubjectId:bank.subjects[0].id,questionTopicId:bank.topics[0].id,pickCount:3,order:1,titleEn:'Random topic knowledge',titleAr:'معرفة عشوائية',durationMinutes:30}]});
  must(builder,'Save pool builder');
  entry.builder=must(await c.get(`/api/Assessment/exams/${exam.id}/builder`),'Read pool builder');save();
  e.check('Pool builder pick count and source persist',entry.builder.sections[0].pickCount===3&&entry.builder.sections[0].questionTopicId===bank.topics[0].id,entry.builder);
 }else{
  const section=must(await c.post(`/api/Assessment/exams/${exam.id}/sections`,{titleEn:'QA26 Knowledge',titleAr:'المعرفة QA26',order:1}),'Create section');
  entry.sectionId=section.id;save();
  must(await c.post(`/api/Assessment/sections/${section.id}/questions/bulk`,{questionIds:cfg.questions,useOriginalPoints:true,markAsRequired:true}),'Add questions');
 }
 must(await c.put(`/api/Assessment/exams/${exam.id}/access-policy`,{isPublic:!cfg.assigned,restrictToAssignedCandidates:!!cfg.assigned,isWalkIn:!!cfg.walkin,accessCode:cfg.accessCode??null}),'Access policy');
 must(await c.post(`/api/Assessment/exams/${exam.id}/instructions`,{contentEn:'Answer independently. Your saved answers persist after reload. Submit when finished.',contentAr:'أجب بشكل مستقل واحفظ إجاباتك ثم أرسل الاختبار.',order:1}),'Add bilingual instruction');
 const validation=await c.get(`/api/Assessment/exams/${exam.id}/validate`);e.record({observation:`${cfg.key} publish validation`,result:validation.body});
 const publication=await c.post(`/api/Assessment/exams/${exam.id}/publish`);
 e.check(`${cfg.key} configured exam publishes`,publication.ok,publication.body);
 const detail=must(await c.get(`/api/Assessment/exams/${exam.id}`),'Read final exam');entry.detail=detail;save();
 if(publication.ok)e.check(`${cfg.key} publication and configured totals persist`,detail.isPublished&&(cfg.pooled||detail.totalPoints===entry.expectedMax),{published:detail.isPublished,totalPoints:detail.totalPoints,questions:detail.questionsCount});
 if(cfg.assigned){
  const candidateIds=m.users.filter(x=>x.role==='Candidate'&&x.key===dept).map(x=>x.id);
  const assigned=await c.post('/api/Assignments/assign',{examId:exam.id,scheduleFrom:past,scheduleTo:end,candidateIds});
  e.check(`${cfg.key} candidates assigned`,assigned.ok&&assigned.data.successCount===candidateIds.length,assigned.body);entry.assignedCandidateIds=candidateIds;save();
 }
 if(cfg.proctor){
  const proctor=m.users.find(x=>x.key===dept&&x.role==='Proctor');
  const assignment=await c.post('/api/ExamProctor/assign',{examId:exam.id,proctorIds:[proctor.id]});
  e.check(`${cfg.key} proctor assigned`,assignment.ok&&assignment.data.successCount===1,assignment.body);entry.proctorId=proctor.id;save();
 }
 if(cfg.walkin){entry.share=must(await c.post(`/api/Assessment/exams/${exam.id}/share-link`,{}),'Generate walk-in share');save();}
}

const auto=manifest.exams.find(x=>x.key==='auto'),c=clients.eng;
const duplicate=await c.post(`/api/Assessment/sections/${auto.sectionId}/questions`,{questionId:131,order:99});
const afterDuplicate=must(await c.get(`/api/Assessment/sections/${auto.sectionId}/questions`),'Read duplicate result');
e.check('Duplicate exam question rejected without duplicate persistence',!duplicate.ok&&afterDuplicate.filter(x=>x.questionId===131).length===1,duplicate.body);
const foreign=await c.get(`/api/Assessment/exams/${manifest.exams.find(x=>x.key==='ops').id}`);
e.check('Engineering cannot read Operations exam',!foreign.ok,foreign.body);
const clone=await c.post(`/api/Assessment/exams/${auto.id}/clone`,{titleEn:'QA26 Objective Clone Draft',titleAr:'نسخة الاختبار QA26',examType:0,startAt:past,endAt:end,durationMinutes:60});
if(clone.ok){const detail=must(await c.get(`/api/Assessment/exams/${clone.data.id}`),'Read cloned exam');manifest.exams.push({id:detail.id,key:'clone-draft',department:'eng',detail});save();e.check('Clone preserves questions and starts unpublished',!detail.isPublished&&detail.questionsCount===4&&detail.totalPoints===40,detail);}
else e.check('Clone succeeds',false,clone.body);
const invalid=await c.post('/api/Assessment/exams',{...base,titleEn:'QA26 Invalid Duration',durationMinutes:0});
e.check('Invalid exam duration rejected',!invalid.ok&&invalid.status<500,invalid.body);
const invalidDate=await c.post('/api/Assessment/exams',{...base,titleEn:'QA26 Invalid Date',startAt:end,endAt:past});
e.check('Reversed date window rejected',!invalidDate.ok&&invalidDate.status<500,invalidDate.body);
save();
console.log(JSON.stringify({checks:e.checks.length,failures:e.checks.filter(x=>!x.passed).map(x=>x.name),exams:manifest.exams.map(x=>({id:x.id,key:x.key}))},null,2));
