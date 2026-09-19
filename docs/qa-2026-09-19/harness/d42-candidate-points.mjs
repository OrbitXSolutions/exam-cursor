import {adminClient,Client,Evidence,must,privateConfig} from './client.mjs';
const stage=process.argv[2]??'before',ev=new Evidence(`d42-${stage}`),c=new Client({evidence:ev});must(await c.login('qa26.eng.candidate1@example.test',privateConfig().password),'candidate login');
const exams=must(await c.get('/api/Candidate/exams'),'available exams');
const admin=await adminClient(ev),card=exams.find(e=>e.id===123),session=must(await admin.get('/api/Grading/attempt/193'),'persisted attempt question points');
ev.check('Completed dynamic card points match saved attempt points',card.totalPoints===session.maxPossibleScore,{cardPoints:card.totalPoints,attemptPoints:session.maxPossibleScore,latestAttemptId:card.latestAttemptId,status:card.latestAttemptStatus});
ev.check('Completed dynamic card question count matches saved attempt',card.totalQuestions===session.totalQuestions,{cardCount:card.totalQuestions,attemptCount:session.totalQuestions});
