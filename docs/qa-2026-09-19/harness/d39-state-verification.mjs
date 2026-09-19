import {adminClient,Evidence,must} from './client.mjs';
const ev=new Evidence('d39-completion-state'),admin=await adminClient(ev);
const attempt=must(await admin.get('/api/Attempt/206'),'read force-submitted state');ev.check('D39 grading preserves authoritative force-submitted attempt status',attempt.status===7,{status:attempt.status});
const grade=must(await admin.get('/api/Grading/attempt/206'),'read completed grading');ev.check('D39 completed grading retains independently expected10/40',grade.status===4&&grade.totalScore===10&&grade.maxPossibleScore===40,{status:grade.status,score:grade.totalScore,max:grade.maxPossibleScore});
