import {Client,Evidence,must,privateConfig} from './client.mjs';
const ev=new Evidence('d39-completion'),examiner=new Client({evidence:ev});must(await examiner.login('qa26.eng.examiner1@example.test',privateConfig().password),'examiner login');
const grading=must(await examiner.get('/api/Grading/attempt/206'),'existing forced grading');
const result=await examiner.post('/api/Grading/complete',{gradingSessionId:grading.id});
ev.check('D39 examiner can complete force-submitted grading',result.ok,{body:result.body});
const attempt=must(await examiner.get('/api/Attempt/206'),'read forced attempt');
ev.check('D39 grading preserves authoritative force-submitted attempt status',attempt.status===7,{status:attempt.status});
const done=must(await examiner.get('/api/Grading/attempt/206'),'reload grading');ev.check('D39 completed grading retains independently expected10/40',done.status===4&&done.totalScore===10&&done.maxPossibleScore===40,{status:done.status,score:done.totalScore,max:done.maxPossibleScore});
