import fs from 'node:fs';
import path from 'node:path';
import {Client,Evidence,here,must,privateConfig} from './client.mjs';

const e=new Evidence('d43-privacy-after'), p=privateConfig();
const matrix=JSON.parse(fs.readFileSync(path.join(here,'completion-manifest.json'))).exams.find(x=>x.id===128);
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.users.find(u=>u.email===email)?.password??p.password));return c;}
const [admin,owner,sibling,foreign]=await Promise.all(['qa26.eng.admin1@example.test','qa26.import.a@example.test','qa26.import.b@example.test','qa26.ops.admin1@example.test'].map(login));
const routes=id=>[`/api/Candidate/results/my-result/${id}`,`/api/ExamResult/my-result/${id}`,`/api/Grading/my-result/${id}`];
const histories=['/api/Attempt/exam/128/my-attempts','/api/Attempt/my-attempts?examId=128&pageSize=100'];
const rows=r=>Array.isArray(r.data)?r.data:r.data?.items??[];
const manual=must(await admin.get('/api/ExamResult/attempt/208'));
try {
  // Warm every route first, then revoke visibility while the cached payload is still fresh.
  for(const route of routes(208))must(await owner.get(route));
  if(manual.isPublishedToCandidate)must(await admin.post(`/api/ExamResult/${manual.id}/unpublish`));
  for(const route of routes(208)){const r=await owner.get(route);e.check(`Unpublished result denied after cache warm: ${route}`,!r.ok,{status:r.status,totalScore:r.data?.totalScore});}
  const unpublishedList=must(await owner.get('/api/ExamResult/my-results'));
  e.check('Unpublished result absent from all-results list',!unpublishedList.some(r=>r.resultId===manual.id));
} finally {
  const current=must(await admin.get('/api/ExamResult/attempt/208'));
  if(current.isPublishedToCandidate!==manual.isPublishedToCandidate)must(await admin.post(`/api/ExamResult/${manual.id}/${manual.isPublishedToCandidate?'publish':'unpublish'}`));
}
try {
  for(const route of [...routes(203),...histories,'/api/ExamResult/my-results','/api/ExamResult/my-summary/exam/128'])must(await owner.get(route));
  must(await admin.put('/api/Assessment/exams/128',{...matrix.request,showResults:false,allowReview:true,showCorrectAnswers:true}));
  const primary=must(await owner.get('/api/Candidate/results/my-result/203'));
  e.check('ShowResults=false hides primary score, percentage and outcome',primary.totalScore==null&&primary.percentage==null&&primary.isPassed==null,primary);
  const review=must(await owner.get('/api/Candidate/results/my-result/203/review'));
  e.check('ShowResults=false hides every question score',review.questions.every(q=>q.scoreEarned==null));
  for(const route of routes(203).slice(1)){const r=await owner.get(route);e.check(`ShowResults=false blocks alternate numeric result: ${route}`,!r.ok||r.data?.totalScore==null,{status:r.status,totalScore:r.data?.totalScore});}
  const list=must(await owner.get('/api/ExamResult/my-results'));
  e.check('Hidden exam omitted from all-results list despite warmed cache',!list.some(x=>x.examId===128));
  const summary=must(await owner.get('/api/ExamResult/my-summary/exam/128'));
  e.check('Hidden exam summary removes best/latest scores and outcomes',summary.bestScore==null&&summary.bestPercentage==null&&summary.bestIsPassed==null&&summary.latestScore==null&&summary.latestIsPassed==null,summary);
  for(const route of histories){const history=await owner.get(route);e.check(`Hidden exam history removes score and outcome: ${route}`,history.ok&&rows(history).filter(a=>a.examId===128).every(a=>a.totalScore==null&&a.isPassed==null),history.body);}
  const staff=must(await admin.get('/api/ExamResult/attempt/203'));
  e.check('Authorized staff retain score access when candidate results hidden',staff.totalScore===40&&staff.percentage===100,staff);
  must(await admin.put('/api/Assessment/exams/128',{...matrix.request,showResults:true,allowReview:true,showCorrectAnswers:false}));
  const hidden=must(await owner.get('/api/Candidate/results/my-result/203/review'));
  e.check('ShowCorrectAnswers=false redacts primary answer key and correctness',hidden.questions.every(q=>q.isCorrect==null&&q.options.every(o=>o.isCorrect==null)));
  const legacy=must(await owner.get('/api/Grading/my-result/203'));
  e.check('ShowCorrectAnswers=false redacts legacy correctness and feedback',legacy.questionResults?.length===4&&legacy.questionResults.every(q=>q.isCorrect==null&&q.feedback==null),legacy.questionResults);
  must(await admin.put('/api/Assessment/exams/128',{...matrix.request,showResults:true,allowReview:false,showCorrectAnswers:false}));
  const noReview=await owner.get('/api/Candidate/results/my-result/203/review');
  e.check('AllowReview=false rejects primary review',!noReview.ok);
  const noLegacyReview=must(await owner.get('/api/Grading/my-result/203'));
  e.check('AllowReview=false removes legacy questions while preserving total',!noLegacyReview.questionResults?.length&&noLegacyReview.totalScore===40,noLegacyReview);
} finally {must(await admin.put('/api/Assessment/exams/128',matrix.request),'Restore original matrix flags');}
for(const route of routes(203)){const r=must(await owner.get(route));e.check(`Restored visibility returns correct published total: ${route}`,r.totalScore===40&&r.percentage===100);}
const finalReview=must(await owner.get('/api/Candidate/results/my-result/203/review'));
e.check('Restored review returns all four scores and answer keys',finalReview.questions.length===4&&finalReview.questions.every(q=>q.scoreEarned===10&&q.isCorrect===true&&q.options.some(o=>o.isCorrect===true)));
for(const route of histories){const r=must(await owner.get(route));const items=Array.isArray(r)?r:r.items;e.check(`Restored histories return published snapshot score: ${route}`,items.some(x=>x.id===203&&x.totalScore===40&&x.isPassed===true));}
for(const route of routes(203)){const r=await sibling.get(route);e.check(`Sibling cannot access another candidate's published result: ${route}`,!r.ok);}
const denied=await foreign.get('/api/ExamResult/attempt/203');e.check('Foreign-department admin remains denied',!denied.ok);
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)}));
