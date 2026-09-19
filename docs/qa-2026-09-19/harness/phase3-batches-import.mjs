import fs from 'node:fs';
import path from 'node:path';
import {Client,Evidence,adminClient,here,must,privateConfig,savePrivate}from'./client.mjs';
const e=new Evidence('phase3-batches-import-evidence'),admin=await adminClient(e);
const m=JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'),'utf8'));
const p=privateConfig(),c=new Client({evidence:e});await c.login(m.users.find(x=>x.key==='eng'&&x.role==='Admin').email,p.password);
const manifest={candidates:[],batch:null,exports:[]};const save=()=>fs.writeFileSync(path.join(here,'batch-manifest.json'),JSON.stringify(manifest,null,2));
const imported=await c.upload('/api/Candidates/import',fs.readFileSync(path.join(here,'.env.qa-import.xlsx')),'qa26-import.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
e.check('XLSX import inserts2 valid rows and rejects invalid email',imported.ok&&imported.data.insertedCount===2&&imported.data.skippedCount===1,imported.body);
if(!imported.ok)throw new Error('Import failed');
for(const account of imported.data.createdAccounts){p.users.push({email:account.email,password:account.temporaryPassword});savePrivate(p);}
for(const email of ['qa26.import.a@example.test','qa26.import.b@example.test']){
 const u=must(await admin.get(`/api/Users/by-email/${email}`),'Find imported user');manifest.candidates.push({id:u.id,email,departmentId:u.departmentId});save();
 const credential=p.users.find(x=>x.email===email);const login=await new Client({evidence:e}).login(email,credential.password);
 e.check(`${email} imported role/department/password work`,u.departmentId===8&&u.roles.includes('Candidate')&&login.ok,{user:u,loginStatus:login.status});
}
const repeated=await c.upload('/api/Candidates/import',fs.readFileSync(path.join(here,'.env.qa-import.xlsx')),'qa26-import.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
e.check('Duplicate import inserts zero with row errors',repeated.ok&&repeated.data.insertedCount===0&&repeated.data.skippedCount===3,repeated.body);
const csv=await c.upload('/api/Candidates/import',Buffer.from('FullName,Email,RollNo\nQA26 CSV,qa26.csv@example.test,QA26-CSV'),'qa26-import.csv','text/csv');
e.check('Unsupported CSV format rejected explicitly',!csv.ok&&csv.status<500,csv.body);
const batch=must(await c.post('/api/Batches',{name:'QA26 Imported Cohort',description:'Two realistic imported candidates',isActive:true}),'Create batch');manifest.batch=batch;save();
const ids=manifest.candidates.map(x=>x.id),added=must(await c.post(`/api/Batches/${batch.id}/candidates`,{candidateIds:ids}),'Add candidates');
e.check('Batch contains2 imported candidates after add',must(await c.get(`/api/Batches/${batch.id}`),'Read batch').candidateCount===2,added);
const duplicate=must(await c.post(`/api/Batches/${batch.id}/candidates`,{candidateIds:ids}),'Duplicate membership');
e.check('Duplicate batch membership does not duplicate records',duplicate.affectedCount===0&&must(await c.get(`/api/Batches/${batch.id}`),'Reload batch').candidateCount===2,duplicate);
must(await c.request('DELETE',`/api/Batches/${batch.id}/candidates`,{candidateIds:[ids[1]]}),'Remove member');
e.check('Batch membership removal persists',must(await c.get(`/api/Batches/${batch.id}`),'Read removed member').candidateCount===1);
must(await c.post(`/api/Batches/${batch.id}/candidates`,{candidateIds:[ids[1]]}),'Restore member');
must(await c.put(`/api/Batches/${batch.id}`,{name:'QA26 Imported Cohort Updated',description:'Bilingual import and batch QA'}),'Update batch');
e.check('Batch rename persists',must(await c.get(`/api/Batches/${batch.id}`),'Read rename').name==='QA26 Imported Cohort Updated');
const exam=117;
const assign=await c.post('/api/Assignments/assign',{examId:exam,batchId:batch.id,scheduleFrom:new Date(Date.now()-60000).toISOString(),scheduleTo:new Date(Date.now()+24*3600000).toISOString()});
e.check('Batch assignment schedules both imported candidates',assign.ok&&assign.data.successCount===2,assign.body);
for(const [route,name]of [[`/api/Batches/${batch.id}/export`,'batch-export.xlsx'],['/api/Candidates/export?search=qa26.import','candidate-export.xlsx'],['/api/Candidates/import-template','candidate-template.xlsx']]){
 const response=await fetch(`${c.base}${route}`,{headers:{Authorization:`Bearer ${c.token}`}});const bytes=Buffer.from(await response.arrayBuffer());fs.writeFileSync(path.join(here,name),bytes);manifest.exports.push(name);save();e.check(`${name} produces XLSX binary`,response.ok&&bytes[0]===80&&bytes[1]===75,{status:response.status,bytes:bytes.length});
}
const foreign=new Client({evidence:e});await foreign.login(m.users.find(x=>x.key==='ops'&&x.role==='Admin').email,p.password);
e.check('Operations admin cannot read Engineering cohort',!(await foreign.get(`/api/Batches/${batch.id}`)).ok);
const toggle=await c.post(`/api/Batches/${batch.id}/toggle-status`);must(toggle,'Deactivate batch');
e.check('Inactive batch status persists',must(await c.get(`/api/Batches/${batch.id}`),'Read inactive batch').isActive===false);
must(await c.post(`/api/Batches/${batch.id}/toggle-status`),'Restore batch active');save();
console.log(JSON.stringify({checks:e.checks.length,failures:e.checks.filter(x=>!x.passed).map(x=>x.name),batchId:batch.id,candidates:manifest.candidates},null,2));
