import fs from 'node:fs';
import path from 'node:path';
import { adminClient, Client, Evidence, here, must, privateConfig } from './client.mjs';
const stage = process.argv[2] ?? 'before';
const ev = new Evidence(`d08-${stage}`);
const admin = await adminClient(ev);
const liveTypes = must(await admin.get('/api/Lookups/question-types?pageSize=100'),'read question types').items;
const subjectiveType = liveTypes.find(t => t.nameEn === 'Subjective')?.id;
const subjectFile = path.join(here, 'd08-subject-fixture.json');
let subject;
if (fs.existsSync(subjectFile)) subject=JSON.parse(fs.readFileSync(subjectFile,'utf8'));
else {
 const user=JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'),'utf8')).users.find(u=>u.key==='eng'&&u.role==='Instructor');
 const creator=new Client({evidence:ev});must(await creator.login(user.email,privateConfig().password),'subject creator login');
 subject=must(await creator.post('/api/Lookups/question-subjects', {nameEn:'QA26 D08 Isolated Options',nameAr:'اختبار خيارات منعزل'}), 'create isolated D08 subject');
}
fs.writeFileSync(subjectFile, JSON.stringify(subject,null,2));
const option = (text, correct, points=null) => ({textEn:text,textAr:`خيار ${text}`,isCorrect:correct,points,order:0});
const base = {bodyEn:`QA26 D08 ${stage}`,bodyAr:'اختبار خيارات',questionTypeId:1,subjectId:subject.id,points:10,difficultyLevel:2,isActive:true};
const ids = [];
async function create(label,type=2,options=[option('A',true,6),option('B',true,4),option('C',false,0)]) {
 const q=must(await admin.post('/api/QuestionBank/questions',{...base,bodyEn:`${base.bodyEn} ${label}`,questionTypeId:type,options}),label);
 ids.push(q.id); fs.writeFileSync(path.join(here,`d08-${stage}-fixtures.json`),JSON.stringify({ids},null,2)); return q;
}
const read=async id=>must(await admin.get(`/api/QuestionBank/questions/${id}`),'read question');
const optionsOf=q=>q.options.map(o=>({id:o.id,textEn:o.textEn,textAr:o.textAr,isCorrect:o.isCorrect,points:o.points,order:o.order,attachmentPath:o.attachmentPath}));
const signature=q=>JSON.stringify({body:q.bodyEn,type:q.questionTypeId,points:q.points,options:optionsOf(q).sort((a,b)=>a.id-b.id)});
const update=q=>({...base,bodyEn:q.bodyEn,questionTypeId:q.questionTypeId,points:q.points,options:optionsOf(q)});
for(const [label,type,opts] of [
 ['no-options',1,[]],['no-correct',1,[option('A',false),option('B',false)]],
 ['two-correct',1,[option('A',true),option('B',true)]],
 ['truefalse-extra',3,[option('T',true),option('F',false),option('Other',false)]],
 ['multi-no-correct',2,[option('A',false),option('B',false)]],
]) {
 const result=await admin.post('/api/QuestionBank/questions',{...base,bodyEn:`${base.bodyEn} invalid ${label}`,questionTypeId:type,options:opts});
 ev.check(`create rejects ${label}`,result.status===400&&!result.ok,{status:result.status,message:result.body?.message});
 if(result.ok)ids.push(result.data.id);
}
for(const [label,mutate] of [
 ['individual weight mismatch',q=>admin.put(`/api/QuestionBank/options/${q.options[0].id}`,{...optionsOf(q)[0],points:7})],
 ['bulk weight mismatch',q=>admin.put(`/api/QuestionBank/questions/${q.id}/options/bulk`,optionsOf(q).map((o,i)=>({...o,points:i===0?7:o.points})))],
 ['adding unbalanced weight',q=>admin.post(`/api/QuestionBank/questions/${q.id}/options`,option('D',true,1))],
 ['deleting scored option',q=>admin.delete(`/api/QuestionBank/options/${q.options[0].id}`)],
 ['foreign bulk option id',q=>admin.put(`/api/QuestionBank/questions/${q.id}/options/bulk`,[{...optionsOf(q)[0],id:2147483647}])],
 ['duplicate bulk option id',q=>admin.put(`/api/QuestionBank/questions/${q.id}/options/bulk`,[optionsOf(q)[0],optionsOf(q)[0]])],
]) {
 const q=await create(label);const before=signature(q);const result=await mutate(q);
 ev.check(`reject ${label}`,!result.ok&&result.status>=400&&result.status<500,{status:result.status,message:result.body?.message});
 ev.check(`${label} rejection preserves persisted complete question`,signature(await read(q.id))===before);
}
const single=await create('single-key-change',1,[option('A',true),option('B',false)]);
const keyBefore=signature(single);
const keyResult=await admin.put(`/api/QuestionBank/options/${single.options[0].id}`,{...optionsOf(single)[0],isCorrect:false});
ev.check('individual edit cannot remove sole correct answer',!keyResult.ok&&keyResult.status>=400&&keyResult.status<500);
ev.check('invalid single answer edit preserves state',signature(await read(single.id))===keyBefore);

const atomic=await create('atomic-total-and-options');
const original=optionsOf(atomic);const removedId=original[2].id;
const atomicPayload={...update(atomic),bodyEn:`${base.bodyEn} changed`,points:20,
 options:[{...original[0],points:12},{...original[1],points:8},{id:0,...option('new wrong choice',false,0),order:2}]};
const saved=await admin.put(`/api/QuestionBank/questions/${atomic.id}`,atomicPayload);
const after=await read(atomic.id);
ev.check('atomic update accepts new total and matching option weights',saved.ok&&after.points===20&&after.options.reduce((s,o)=>s+(o.points??0),0)===20);
ev.check('atomic update preserves retained option IDs',original.slice(0,2).every(o=>after.options.some(x=>x.id===o.id)));
ev.check('atomic update removes omitted option and adds new option',after.options.length===3&&!after.options.some(o=>o.id===removedId)&&after.options.some(o=>o.textEn==='new wrong choice'));
ev.check('atomic update response excludes removed options',saved.ok&&!saved.data.options.some(o=>o.id===removedId));

const stable=signature(after);
const rejected=await admin.put(`/api/QuestionBank/questions/${atomic.id}`,{...update(after),points:99,bodyEn:'SHOULD NOT SAVE'});
ev.check('invalid atomic sum rejected',rejected.status===400&&!rejected.ok);
ev.check('invalid atomic sum preserves total body and all options',signature(await read(atomic.id))===stable);
const latest=await read(atomic.id);
const metadata=update(latest);delete metadata.options;
const unchanged=await admin.put(`/api/QuestionBank/questions/${atomic.id}`,metadata);
ev.check('metadata-only request remains supported when stored options valid',unchanged.ok);

const legacy=await create('legacy-null-weight',2,[option('A',true),option('B',true),option('C',false)]);
ev.check('legacy null-weight multi remains supported',legacy.options.every(o=>o.points===null));
const subjective=await create('subjective-empty',subjectiveType,[]);
ev.check('subjective needs no choice options',subjective.options.length===0);
fs.writeFileSync(path.join(here,`d08-${stage}-fixtures.json`),JSON.stringify({ids},null,2));
console.log(JSON.stringify({stage,checks:ev.checks.length,passed:ev.checks.filter(x=>x.passed).length,failed:ev.checks.filter(x=>!x.passed).length,ids}));
