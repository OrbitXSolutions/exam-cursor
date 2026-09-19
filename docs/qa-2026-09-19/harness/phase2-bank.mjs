import fs from 'node:fs';
import path from 'node:path';
import { Client, Evidence, adminClient, here, must, privateConfig } from './client.mjs';

const resume = process.env.QA_RESUME === '1';
const e = new Evidence(resume ? 'phase2-bank-resume-evidence' : 'phase2-bank-evidence');
const admin = await adminClient(e);
const m = JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'),'utf8'));
const password = privateConfig().password;
const clients = {};
const bank = resume ? JSON.parse(fs.readFileSync(path.join(here,'bank-manifest.json'),'utf8')) : { subjects: [], topics: [], questions: [], deleted: [], media: [] };
const save = () => fs.writeFileSync(path.join(here,'bank-manifest.json'), JSON.stringify(bank,null,2));
const option = (text, correct, order, points) => ({ textEn:text, textAr:`خيار ${text}`, isCorrect:correct, order, ...(points===undefined?{}:{points}) });
for (const key of ['eng','ops']) {
  const user = m.users.find(x=>x.key===key&&x.role==='Instructor');
  const c = new Client({ evidence:e }); must(await c.login(user.email,password),'instructor login'); clients[key]=c;
  const subject = bank.subjects.find(x=>x.key===key) ?? must(await c.post('/api/Lookups/question-subjects',{nameEn:`QA26 ${key} Foundations`,nameAr:`أساسيات اختبار QA26 ${key}`}), 'Create subject');
  if(!bank.subjects.some(x=>x.id===subject.id))bank.subjects.push({...subject,key}); save();
  const topic = bank.topics.find(x=>x.key===key) ?? must(await c.post('/api/Lookups/question-topics',{nameEn:`QA26 ${key} Applied Knowledge`,nameAr:`تطبيق المعرفة QA26 ${key}`,subjectId:subject.id}), 'Create topic');
  if(!bank.topics.some(x=>x.id===topic.id))bank.topics.push({...topic,key}); save();
  e.check(`${key} subject belongs to instructor department`, subject.departmentId===user.departmentId,subject);
  e.check(`${key} topic persists under subject`,must(await c.get(`/api/Lookups/question-topics/${topic.id}`),'Read topic').subjectId===subject.id);
}
const a=clients.eng,b=clients.ops;
const subject=bank.subjects[0],topic=bank.topics[0];
const liveTypes=must(await admin.get('/api/Lookups/question-types?pageSize=100'),'Read actual question types').items;
const subjectiveType=liveTypes.find(x=>x.nameEn==='Subjective').id;
const base={bodyEn:'QA26 fixture',bodyAr:'اختبار QA26',subjectId:subject.id,topicId:topic.id,points:10,difficultyLevel:2,isActive:true,isCalculatorAllowed:false,explanationEn:'Acceptance QA expected answer',explanationAr:'الإجابة المتوقعة للاختبار'};
const specs=[
  {key:'single',questionTypeId:1,bodyEn:'QA26 Single: Which number is prime?',options:[option('2',true,1),option('4',false,2),option('6',false,3)],expected:'2 gives 10; other selection gives 0'},
  {key:'multi-weighted',questionTypeId:2,bodyEn:'QA26 Weighted Multi: Select prime numbers',options:[option('2',true,1,7),option('3',true,2,3),option('4',false,3,0)],expected:'2 only = 7; 3 only = 3; both = 10; wrong option behavior verified later'},
  {key:'multi-equal',questionTypeId:2,bodyEn:'QA26 Equal Multi: Select even numbers',options:[option('2',true,1),option('4',true,2),option('3',false,3)],expected:'No explicit option points; equal/legacy formula must be verified during grading'},
  {key:'truefalse',questionTypeId:3,bodyEn:'QA26 TrueFalse: 2 + 2 = 4',options:[option('True',true,1),option('False',false,2)],expected:'True gives 10, False gives 0'},
  {key:'subjective',questionTypeId:subjectiveType,bodyEn:'QA26 Subjective: Explain two ways to protect exam integrity',options:[],answerKey:{rubricTextEn:'Award 5 points for verified identity, 5 for monitoring with a documented review process.',rubricTextAr:'خمس درجات للتحقق من الهوية وخمس للمراقبة والمراجعة.'},expected:'Manual rubric total 10; identity-only answer should receive 5 by examiner'}
];
for(const spec of specs){
  const {key,expected,...shape}=spec;
  const q=bank.questions.find(x=>x.key===key)??must(await a.post('/api/QuestionBank/questions',{...base,...shape}),`Create ${key}`);
  const reload=must(await a.get(`/api/QuestionBank/questions/${q.id}`),`Read ${key}`);
  e.check(`${key} question and options/answer key persist`,reload.questionTypeId===spec.questionTypeId&&reload.options.length===spec.options.length&&reload.points===10&&(!spec.answerKey||reload.answerKey.rubricTextEn===spec.answerKey.rubricTextEn),reload);
  if(!bank.questions.some(x=>x.id===q.id))bank.questions.push({...reload,key,expected,department:'eng'});save();
}
const opsQ=must(await b.post('/api/QuestionBank/questions',{...base,subjectId:bank.subjects[1].id,topicId:bank.topics[1].id,bodyEn:'QA26 Operations isolated question',questionTypeId:1,options:specs[0].options}),'Create Ops question');
bank.questions.push({...opsQ,key:'ops-single',department:'ops'});save();
const list=must(await a.get('/api/QuestionBank/questions?search=QA26&pageSize=100'),'List own bank');
e.check('Question list isolates another department',!list.items.some(x=>x.id===opsQ.id));
e.check('Question detail denies another department',!(await a.get(`/api/QuestionBank/questions/${opsQ.id}`)).ok);
const cross=await a.post('/api/QuestionBank/questions',{...base,subjectId:bank.subjects[1].id,topicId:bank.topics[1].id,bodyEn:'QA26 cross department injection fixture',questionTypeId:1,options:specs[0].options});
e.check('Question creation denies foreign subject',!cross.ok&&cross.status<500,cross.body);
if(cross.ok){bank.deleted.push({id:cross.data.id,reason:'cross-department injection accepted'});await admin.delete(`/api/QuestionBank/questions/${cross.data.id}`);save();}
const crossTopic=await a.post('/api/Lookups/question-topics',{nameEn:'QA26 foreign topic injection',nameAr:'اختبار موضوع خارج القسم',subjectId:bank.subjects[1].id});
e.check('Topic creation denies foreign subject',!crossTopic.ok&&crossTopic.status<500,crossTopic.body);
if(crossTopic.ok){bank.deleted.push({topicId:crossTopic.data.id,reason:'foreign topic accepted'});await admin.delete(`/api/Lookups/question-topics/${crossTopic.data.id}`);save();}

for(const [label,change] of [
  ['Empty body',{bodyEn:''}],['Negative points',{points:-1}],['Unknown type',{questionTypeId:2147483000}],['Unknown subject',{subjectId:2147483000}],['Mismatched topic subject',{topicId:bank.topics[1].id}],
  ['Weighted sum below question points',{questionTypeId:2,options:[option('2',true,1,5),option('3',true,2,3),option('4',false,3,0)]}],
  ['Negative weighted option',{questionTypeId:2,options:[option('2',true,1,12),option('3',true,2,-2)]}],
  ['Single with no options',{options:[]}],['Single with two correct options',{options:[option('2',true,1),option('3',true,2)]}],['Single with no correct option',{options:[option('2',false,1),option('3',false,2)]}]
]){
  const result=await a.post('/api/QuestionBank/questions',{...base,questionTypeId:1,options:specs[0].options,...change});
  e.check(`${label} rejected`,!result.ok&&result.status<500,result.body);
  if(result.ok){bank.deleted.push({id:result.data.id,reason:`Accepted invalid fixture: ${label}`});await admin.delete(`/api/QuestionBank/questions/${result.data.id}`);save();}
}
const weighted=bank.questions.find(x=>x.key==='multi-weighted');
const badOptions=weighted.options.map(x=>({...x,points:x.isCorrect?1:0}));
const badBulk=await a.put(`/api/QuestionBank/questions/${weighted.id}/options/bulk`,badOptions);
e.check('Bulk option update validates weighted sum',!badBulk.ok&&badBulk.status<500,badBulk.body);
if(badBulk.ok)must(await a.put(`/api/QuestionBank/questions/${weighted.id}/options/bulk`,weighted.options),'Restore weights');
const wrongOption=await a.put(`/api/QuestionBank/options/${weighted.options[0].id}`,{...weighted.options[0],points:20});
e.check('Individual option update validates total weighted sum',!wrongOption.ok&&wrongOption.status<500,wrongOption.body);
if(wrongOption.ok)must(await a.put(`/api/QuestionBank/questions/${weighted.id}/options/bulk`,weighted.options),'Restore weights');
const q=bank.questions[0];
must(await a.request('PATCH',`/api/QuestionBank/questions/${q.id}/toggle-status`),'Deactivate question');
e.check('Question inactive flag persists',must(await a.get(`/api/QuestionBank/questions/${q.id}`),'Read inactive question').isActive===false);
must(await a.request('PATCH',`/api/QuestionBank/questions/${q.id}/toggle-status`),'Restore question active');
const noDeptUser=m.users.find(x=>x.role==='Instructor'&&x.key==='ops');
try{
  must(await admin.post(`/api/Departments/remove-user/${noDeptUser.id}`),'Temporarily clear department');
  const noDept=new Client({evidence:e});must(await noDept.login(noDeptUser.email,password),'No dept staff login');
  const seen=await noDept.get('/api/QuestionBank/questions?search=QA26&pageSize=100');
  e.check('Staff without department fails closed on bank list',!seen.ok||(seen.data?.items?.length??0)===0,{status:seen.status,ids:seen.data?.items?.map(x=>x.id)});
  e.check('Staff without department denied bank detail',!(await noDept.get(`/api/QuestionBank/questions/${q.id}`)).ok);
}finally{must(await admin.post('/api/Departments/assign-user',{userId:noDeptUser.id,departmentId:noDeptUser.departmentId}),'Restore staff department');}

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQeYAAAAASUVORK5CYII=','base64');
const upload=await a.upload('/api/Media/upload?folder=questions',png,'qa26-reference.png','image/png');
e.check('Question image upload accepted',upload.ok,upload.body);
if(upload.ok){
  const media=upload.body.file;bank.media.push(media);save();
  const filePath=media.filePath??media.url??media.viewUrl;
  const attachment=await a.post(`/api/QuestionBank/questions/${q.id}/attachments`,{questionId:q.id,fileName:'qa26-reference.png',filePath,fileType:'Image',fileSize:png.length,isPrimary:true});
  e.check('Question attachment persists',attachment.ok,attachment.body);
  if(attachment.ok){bank.questions[0].attachments=must(await a.get(`/api/QuestionBank/questions/${q.id}/attachments`),'Read attachment');save();}
}
const disallowed=await a.upload('/api/Media/upload?folder=questions',Buffer.from('QA26 harmless invalid executable fixture'),'qa26-invalid.exe','application/octet-stream');
e.check('Executable media upload rejected',!disallowed.ok&&disallowed.status<500,disallowed.body);
save();
console.log(JSON.stringify({checks:e.checks.length,failures:e.checks.filter(x=>!x.passed).map(x=>x.name),questions:bank.questions.map(x=>({id:x.id,key:x.key}))},null,2));
