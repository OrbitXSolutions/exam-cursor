import fs from 'node:fs';
import path from 'node:path';
import {adminClient, Evidence, here, must} from './client.mjs';
const before = JSON.parse(fs.readFileSync(path.join(here,'d08-before.json'),'utf8'));
const ids = [...new Set(before.events.filter(e=>e.method==='POST'&&e.route==='/api/QuestionBank/questions'&&e.response?.ok&&e.request?.bodyEn?.startsWith('QA26 D08 before')).map(e=>e.response.data.id))];
const ev=new Evidence('d08-before-cleanup');const admin=await adminClient(ev);
for(const id of ids) {
 if([131,132,133,134,135,141].includes(id))throw new Error('Protected lifecycle fixture must not be changed');
 must(await admin.delete(`/api/QuestionBank/questions/${id}`),'softdelete isolated test reproduction');
 ev.check(`D08 disposable question ${id} deleted from active pool`,(await admin.get(`/api/QuestionBank/questions/${id}`)).status===404);
}
console.log(JSON.stringify({softDeleted:ids}));
