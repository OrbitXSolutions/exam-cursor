import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {adminClient,must} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const results={classification:'SIMULATED TEST: real API responses and persisted state; no physical/browser verification',checks:[]};
const check=(name,pass,detail)=>{results.checks.push({name,passed:!!pass,detail});fs.writeFileSync(path.join(here,'validation-after.json'),JSON.stringify(results,null,2));console.log((pass?'PASS ':'FAIL ')+name);};
const c=await adminClient();
const system=must(await c.get('/api/Settings'));
const notification=must(await c.get('/api/Notification/settings'));
const template=must(await c.get('/api/Notification/templates/1'));
const cases=[
 ['Negative system limits','/api/Settings',{...system,maxFileUploadMb:-1,sessionTimeoutMinutes:-1,passwordPolicy:{...system.passwordPolicy,minLength:-1}},system],
 ['Unknown proctor mode','/api/Settings',{...system,defaultProctorMode:'INVALID_MODE'},system],
 ['Negative notification port/batch/delay','/api/Notification/settings',{...notification,smtpPort:-1,emailBatchSize:-1,smsBatchSize:0,batchDelayMs:-1},notification],
 ['SMTP host exceeds SQL column','/api/Notification/settings',{...notification,smtpHost:'x'.repeat(501)},notification],
 ['Template English subject exceeds SQL column','/api/Notification/templates/1',{...template,subjectEn:'x'.repeat(501)},template],
 ['Template Arabic subject exceeds SQL column','/api/Notification/templates/1',{...template,subjectAr:'ش'.repeat(501)},template],
];
for(const [name,route,body,before] of cases){
 const response=await c.put(route,body);check(name+' returns400',response.status===400,{status:response.status,message:response.body?.message});
 const after=must(await c.get(route));check(name+' leaves saved configuration unchanged',JSON.stringify(before)===JSON.stringify(after));
}
const logs=await c.get('/api/Notification/logs?pageNumber=0&pageSize=-1');check('Invalid log pagination returns400',logs.status===400,{status:logs.status});
check('Valid log pagination still succeeds',(await c.get('/api/Notification/logs?pageNumber=1&pageSize=1')).ok);
try{
 const boundary={...notification,enableEmail:false,enableSms:false,smtpHost:'x'.repeat(500),smtpPort:65535,emailBatchSize:500,smsBatchSize:1,batchDelayMs:60000};
 const response=await c.put('/api/Notification/settings',boundary);const saved=must(await c.get('/api/Notification/settings'));
 check('Supported notification boundary values persist',response.ok&&['smtpHost','smtpPort','emailBatchSize','smsBatchSize','batchDelayMs'].every(k=>saved[k]===boundary[k]));
 const content={...template,subjectEn:'x'.repeat(500),subjectAr:'ش'.repeat(500),isActive:!template.isActive};
 const tr=await c.put('/api/Notification/templates/1',content);const actual=must(await c.get('/api/Notification/templates/1'));
 check('Both500-character bilingual template subjects persist',tr.ok&&actual.subjectEn===content.subjectEn&&actual.subjectAr===content.subjectAr&&actual.isActive===content.isActive);
}finally{
 must(await c.put('/api/Notification/settings',notification),'Restore notification');
 must(await c.put('/api/Notification/templates/1',template),'Restore template');
 check('Notification original restored',JSON.stringify(must(await c.get('/api/Notification/settings')))===JSON.stringify(notification));
 check('Template original restored',JSON.stringify(must(await c.get('/api/Notification/templates/1')))===JSON.stringify(template));
}
check('System config retained original including retention0',JSON.stringify(must(await c.get('/api/Settings')))===JSON.stringify(system));
console.log(JSON.stringify({checks:results.checks.length,failures:results.checks.filter(x=>!x.passed).map(x=>x.name)}));
