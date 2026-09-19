import {adminClient,Evidence,must} from './client.mjs';
const stage=process.argv[2]??'before',ev=new Evidence(`d46-${stage}`),admin=await adminClient(ev);
const listed=must(await admin.get('/api/Grading?examId=128&pageSize=100'),'enumerate persisted exam grading sessions');
if(listed.totalCount>listed.items.length)throw new Error('Fixture exceeds this bounded regression page; expand enumeration before testing');
const sessions=[];for(const entry of listed.items.filter(s=>s.status===2||s.status===4))sessions.push(must(await admin.get(`/api/Grading/attempt/${entry.attemptId}`),'read actual grading state'));
const report=must(await admin.post('/api/ExamResult/report/question-performance/generate',{examId:128}),'generate actual report');
for(const questionId of [131,132,133,134]){
 const answers=sessions.flatMap(s=>s.answers.filter(a=>a.questionId===questionId)),row=report.find(r=>r.questionId===questionId);
 const expected={totalAnswers:answers.length,correctAnswers:answers.filter(a=>a.isCorrect).length,unansweredCount:answers.filter(a=>!a.textAnswer?.trim()&&!a.selectedOptionIds?.length).length,averageScore:answers.reduce((n,a)=>n+a.score,0)/answers.length};
 ev.check(`Question${questionId} report counts automatic and manual finalized sessions`,row?.totalAnswers===expected.totalAnswers&&row.correctAnswers===expected.correctAnswers,{row,expected});
 ev.check(`Question${questionId} unanswered count reflects persisted answer content`,row?.unansweredCount===expected.unansweredCount,{actual:row?.unansweredCount,expected:expected.unansweredCount});
 ev.check(`Question${questionId} average/correct rate independently recomputed`,row?.averageScore===expected.averageScore&&row.correctRate===expected.correctAnswers/expected.totalAnswers,{actualAverage:row?.averageScore,expected});
}
const snapshot=must(await admin.get('/api/Grading/attempt/193'),'read completed dynamic question set');
const dynamic=must(await admin.post('/api/ExamResult/report/question-performance/generate',{examId:123}),'generate dynamic report');
ev.check('Dynamic exam report includes questions actually taken',snapshot.answers.every(a=>dynamic.some(r=>r.questionId===a.questionId)),{actualIds:dynamic.map(r=>r.questionId),expectedIds:snapshot.answers.map(a=>a.questionId)});
const again=must(await admin.get('/api/ExamResult/report/question-performance/exam/128'),'read stored report');
ev.check('Generated report persists exactly',JSON.stringify(again)===JSON.stringify(report));
console.log(JSON.stringify({checks:ev.checks.length,passed:ev.checks.filter(c=>c.passed).length,failed:ev.checks.filter(c=>!c.passed).map(c=>c.name)}));
