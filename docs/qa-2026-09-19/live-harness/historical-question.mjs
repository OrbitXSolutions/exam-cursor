import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,must,privateConfig} from '../harness/client.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
if(process.env.QA_HISTORY_EXECUTE!=='phase7'){
 console.log('Prepared only. Requires phase7 authorization and a dedicated candidate configuration; no network requests made.');
 process.exit(0);
}
const cfg=JSON.parse(fs.readFileSync(process.env.QA_HISTORY_FIXTURES??path.join(here,'history-fixtures.json'),'utf8'));
if(!cfg.candidateEmail||!cfg.adminEmail||!cfg.subjectId)throw new Error('Dedicated candidate, owning admin and subject are required.');
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,'historical-question-evidence.json'),JSON.stringify({classification:'SIMULATED TEST: actual HTTP workflows and persisted application state. No browser or physical verification.',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output('historical-question'),secret=privateConfig();
async function login(email){const c=new Client({evidence:e});must(await c.login(email,secret.users.find(u=>u.email===email)?.password??secret.password),'Login');return c;}
const admin=await login(cfg.adminEmail),candidate=await login(cfg.candidateEmail),stamp=Date.now();
const manifest={candidateEmail:cfg.candidateEmail,createdAt:new Date().toISOString()};
const save=()=>fs.writeFileSync(path.join(here,'historical-question-fixtures.json'),JSON.stringify(manifest,null,2));
const q=must(await admin.post('/api/QuestionBank/questions',{
 bodyEn:`QA26 historical integrity ${stamp}: select the blue option`,bodyAr:'اختبار ثبات السؤال: اختر الأزرق',
 explanationEn:'The original correct option is blue.',questionTypeId:1,subjectId:cfg.subjectId,topicId:cfg.topicId??null,
 points:10,difficultyLevel:2,isActive:true,isCalculatorAllowed:false,
 options:[{textEn:'Blue',textAr:'أزرق',isCorrect:true,order:1},{textEn:'Red',textAr:'أحمر',isCorrect:false,order:2}]
}),'Create dedicated history question');manifest.questionId=q.id;save();
const now=Date.now();
const exam=must(await admin.post('/api/Assessment/exams',{
 titleEn:`QA26 Historical Question Integrity ${stamp}`,titleAr:'اختبار ثبات السؤال التاريخي',examType:0,
 startAt:new Date(now-60000).toISOString(),endAt:new Date(now+86400000).toISOString(),durationMinutes:60,maxAttempts:1,
 passScore:5,isActive:true,showResults:true,allowReview:true,showCorrectAnswers:true,
 shuffleQuestions:false,shuffleOptions:false,requireProctoring:false,requireIdVerification:false,requireWebcam:false,
 enableScreenMonitoring:false,screenMonitoringMode:0,preventCopyPaste:false,preventScreenCapture:false,requireFullscreen:false,browserLockdown:false,maxViolationWarnings:0
}),'Create dedicated history exam');manifest.examId=exam.id;save();
const section=must(await admin.post(`/api/Assessment/exams/${exam.id}/sections`,{titleEn:'Historical integrity',titleAr:'ثبات تاريخي',order:1}));
must(await admin.post(`/api/Assessment/sections/${section.id}/questions/bulk`,{questionIds:[q.id],useOriginalPoints:true,markAsRequired:true}));
must(await admin.put(`/api/Assessment/exams/${exam.id}/access-policy`,{isPublic:false,restrictToAssignedCandidates:true,isWalkIn:false}));
must(await admin.post(`/api/Assessment/exams/${exam.id}/publish`));
must(await admin.post('/api/Assignments/assign',{examId:exam.id,candidateIds:[candidate.user.id],scheduleFrom:new Date(now-60000).toISOString(),scheduleTo:new Date(now+86400000).toISOString()}));
const original=must(await candidate.post(`/api/Candidate/exams/${exam.id}/start`,{}));manifest.attemptId=original.attemptId;save();
const originalQuestion=original.questions.find(x=>x.questionId===q.id||x.id===q.id);
if(!originalQuestion)throw new Error('Dedicated question missing from initial candidate session');
const selectedId=q.options.find(o=>o.isCorrect).id;
must(await candidate.put(`/api/Candidate/attempts/${original.attemptId}/answers`,{answers:[{questionId:q.id,selectedOptionIds:[selectedId]}]}));
const saved=must(await candidate.get(`/api/Candidate/attempts/${original.attemptId}/session`));
e.check('Original correct answer persists before question mutation',saved.questions.find(x=>x.questionId===q.id||x.id===q.id)?.currentAnswer?.selectedOptionIds?.includes(selectedId));
const update={bodyEn:q.bodyEn,bodyAr:q.bodyAr,explanationEn:q.explanationEn,explanationAr:q.explanationAr,questionTypeId:q.questionTypeId,questionCategoryId:q.questionCategoryId,subjectId:q.subjectId,topicId:q.topicId,points:q.points,difficultyLevel:q.difficultyLevel,isActive:q.isActive,isCalculatorAllowed:q.isCalculatorAllowed,options:q.options.map(o=>({id:o.id,textEn:o.textEn,textAr:o.textAr,isCorrect:o.isCorrect,order:o.order,points:o.points}))};
const mutation=await admin.put(`/api/QuestionBank/questions/${q.id}`,{...update,bodyEn:`QA26 historical mutation ${stamp}: select the red option`,points:20,options:update.options.map(o=>({...o,isCorrect:!o.isCorrect}))});
manifest.mutationAccepted=mutation.ok;save();
const reload=must(await candidate.get(`/api/Candidate/attempts/${original.attemptId}/session`));
const reloaded=reload.questions.find(x=>x.questionId===q.id||x.id===q.id);
e.check('Active attempt retains the originally presented question body',originalQuestion.bodyEn===reloaded.bodyEn,{initial:originalQuestion.bodyEn,reloaded:reloaded.bodyEn,mutationAccepted:mutation.ok});
e.check('Active attempt preserves original ten-point maximum',reloaded.points===10,{points:reloaded.points});
must(await candidate.post(`/api/Candidate/attempts/${original.attemptId}/submit`,{}),'Submit saved original answer');
let grading;for(let i=0;i<60;i++){const result=await admin.get(`/api/Grading/attempt/${original.attemptId}`);if(result.ok&&result.data?.totalScore!==null){grading=result.data;break;}await new Promise(r=>setTimeout(r,500));}
if(!grading){must(await admin.post('/api/Grading/initiate',{attemptId:original.attemptId}),'Initiate grading if worker has not done so');grading=must(await admin.get(`/api/Grading/attempt/${original.attemptId}`));}
manifest.gradingSessionId=grading.id;save();
e.check('Originally correct saved answer earns original ten points',grading.totalScore===10,{score:grading.totalScore,maxPossibleScore:grading.maxPossibleScore,mutationAccepted:mutation.ok});
e.check('Historical grading maximum remains original ten points',grading.maxPossibleScore===10,{maxPossibleScore:grading.maxPossibleScore});
if(mutation.ok)must(await admin.put(`/api/QuestionBank/questions/${q.id}`,update),'Restore original question after grading');
let result=await admin.get(`/api/ExamResult/attempt/${original.attemptId}`);
if(!result.ok){must(await admin.post(`/api/ExamResult/finalize/${grading.id}`),'Finalize isolated test result');result=await admin.get(`/api/ExamResult/attempt/${original.attemptId}`);}
const outcome=must(result);manifest.resultId=outcome.id;save();
if(!outcome.isPublishedToCandidate)must(await admin.post(`/api/ExamResult/${outcome.id}/publish`),'Publish isolated test result');
const review=must(await candidate.get(`/api/Candidate/results/my-result/${original.attemptId}/review`),'Review isolated result');
e.record({observation:'Historical result and review after original key restored',review,grading});
const reviewed=review.questions?.find(x=>x.questionId===q.id);
if(reviewed){const currentOption=reviewed.options?.find(o=>o.id===selectedId||o.optionId===selectedId);e.check('Review option correctness agrees with recorded answer correctness',!currentOption||currentOption.isCorrect===null||reviewed.isCorrect===currentOption.isCorrect,{reviewedQuestion:reviewed});}
e.record({remainingData:manifest,decisionRequiredIfFailed:'Persisted attempts currently reference mutable question-bank entities. Correct remedy may require question snapshots/versioning (schema prohibited) or an explicit product decision on editing questions used by active/historical attempts. Do not infer a policy or modify schema.'});
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(c=>!c.passed).map(c=>c.name),fixtures:manifest},null,2));
