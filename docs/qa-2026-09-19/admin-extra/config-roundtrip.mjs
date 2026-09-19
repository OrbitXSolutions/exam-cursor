import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Evidence, adminClient, must, privateConfig } from '../harness/client.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.env.QA_EVIDENCE_NAME ?? 'config-evidence-before';
const scrub = v => Array.isArray(v) ? v.map(scrub) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k,x]) => [k,/password|token|apikey|secret|authorization/i.test(k) ? '[REDACTED]' : scrub(x)])) : v;
class ConfigEvidence extends Evidence {
  check(name,passed,detail) { return super.check(name,passed,scrub(detail)); }
  record(event) { this.events.push(scrub({at:new Date().toISOString(),...event})); this.save(); }
  save() { fs.writeFileSync(path.join(here,`${out}.json`),JSON.stringify({classification:'SIMULATED TEST: actual HTTP API and persisted state. UI counterpart inspected only.',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2)); }
}
const ev = new ConfigEvidence(out);
const admin = await adminClient(ev);
const originals = {};
for(const route of ['/api/Settings','/api/Organization','/api/Notification/settings','/api/Notification/templates']) originals[route]=must(await admin.get(route),route);
fs.writeFileSync(path.join(here,'.env.preexisting.json'),JSON.stringify(originals,null,2));
const org = originals['/api/Organization'];
const system = originals['/api/Settings'];
const notify = originals['/api/Notification/settings'];
const templates = originals['/api/Notification/templates'];
const eq = (a,b,keys) => keys.every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]));
async function roundtrip(name,route,body,keys=Object.keys(body)) {
  const save=await admin.put(route,body);const reload=await admin.get(route);
  ev.check(name,save.ok&&reload.ok&&eq(reload.data,body,keys),{save:save.body,reload:reload.body});
  return reload;
}
async function invalid(name,route,body,original) {
  const r=await admin.put(route,body);
  ev.check(name+' rejected with client validation response',!r.ok&&r.status>=400&&r.status<500,{status:r.status,body:r.body});
  const restored=await admin.put(route,original);
  if(!restored.ok)throw new Error('Could not restore '+route);
}
try {
  const orgBody={name:'QA26 Organization شركة اختبار',supportEmail:'qa26.support@example.test',mobileNumber:'+971500000001',officeNumber:'+97140000001',supportUrl:'https://example.test/help',footerText:'QA26 footer © الشركة',primaryColor:'#125678',isActive:true};
  await roundtrip('Bilingual organization and contact settings persist', '/api/Organization',orgBody);
  const publicBrand=await new Client({evidence:ev}).get('/api/Organization/branding');
  ev.check('Anonymous branding reflects organization override without privileged fields',publicBrand.ok&&eq(publicBrand.data,orgBody,['name','supportEmail','footerText','primaryColor'])&&!('updatedBy'in publicBrand.data),publicBrand.body);
  await roundtrip('Organization null optional fields and inactive status persist','/api/Organization',{...orgBody,supportEmail:null,supportUrl:null,footerText:null,primaryColor:null,isActive:false});
  const fallback=await new Client({evidence:ev}).get('/api/Organization/branding');
  ev.check('Empty organization optional branding uses system fallback',fallback.ok&&fallback.data.supportEmail===(system.brand?.supportEmail??'')&&fallback.data.isActive===false,fallback.body);
  await invalid('Overlength organization name','/api/Organization',{...orgBody,name:'Q'.repeat(501)},org);
  await invalid('Invalid organization support email','/api/Organization',{...orgBody,supportEmail:'not-an-email'},org);
  await invalid('Unsafe organization support URL scheme','/api/Organization',{...orgBody,supportUrl:'javascript:alert(1)'},org);
  const systemBody={...system,maxFileUploadMb:13,sessionTimeoutMinutes:121,defaultProctorMode:system.defaultProctorMode==='Soft'?'Advanced':'Soft',passwordPolicy:{...system.passwordPolicy,minLength:9},brand:{...system.brand,footerText:'QA26 system footer'},videoRetentionDays:31};
  await roundtrip('System settings including proctor/password/video configuration persist','/api/Settings',systemBody);
  must(await admin.put('/api/Settings',system),'Restore system');
  await invalid('Negative system limits','/api/Settings',{...system,maxFileUploadMb:-1,sessionTimeoutMinutes:-1,passwordPolicy:{...system.passwordPolicy,minLength:-1}},system);
  await invalid('Unknown default proctor mode','/api/Settings',{...system,defaultProctorMode:'INVALID_MODE'},system);
  // Preserve secrets; no SMTP/SMS credentials changed and never enable outbound delivery.
  const notifyBody={...notify,enableEmail:false,enableSms:false,emailBatchSize:17,smsBatchSize:19,batchDelayMs:1200,loginUrl:'https://example.test/candidate-login',smtpFromName:'QA26 Notification name'};
  await roundtrip('Notification batch and login URL settings persist with outbound disabled','/api/Notification/settings',notifyBody,['enableEmail','enableSms','emailBatchSize','smsBatchSize','batchDelayMs','loginUrl','smtpFromName']);
  must(await admin.put('/api/Notification/settings',notify),'Restore notification');
  await invalid('Invalid notification numeric limits','/api/Notification/settings',{...notify,enableEmail:false,enableSms:false,smtpPort:-1,emailBatchSize:-1,smsBatchSize:0,batchDelayMs:-1},notify);
  await invalid('Overlength notification SMTP host','/api/Notification/settings',{...notify,enableEmail:false,enableSms:false,smtpHost:'q'.repeat(501)},notify);
  for(const t of templates){
    const b={subjectEn:`QA26 ${t.eventName} {{CandidateName}}`,subjectAr:'اختبار {{CandidateName}}',bodyEn:'Hello {{CandidateName}}. {{ExamTitle}} / {{LoginUrl}}',bodyAr:'مرحباً {{CandidateName}} الاختبار {{ExamTitle}}',isActive:!t.isActive};
    await roundtrip(`Notification template ${t.eventType} bilingual content/placeholders/toggle persists`,`/api/Notification/templates/${t.eventType}`,b);
    must(await admin.put(`/api/Notification/templates/${t.eventType}`,t),'Restore template');
  }
  if(templates.length)await invalid('Overlength template subject',`/api/Notification/templates/${templates[0].eventType}`,{...templates[0],subjectEn:'q'.repeat(501)},templates[0]);
  const absent=await admin.put('/api/Notification/templates/999',{subjectEn:'QA26',subjectAr:'اختبار',bodyEn:'QA',bodyAr:'اختبار',isActive:false});
  ev.check('Unknown notification event rejected without mutation',!absent.ok&&absent.status<500,absent.body);
  const badpage=await admin.get('/api/Notification/logs?pageNumber=0&pageSize=-1');
  ev.check('Invalid notification log pagination rejected as client error',badpage.status>=400&&badpage.status<500,badpage.body);
  const manifest=JSON.parse(fs.readFileSync(path.join(here,'../harness/data-manifest.json'),'utf8'));
  const privateData=privateConfig();
  for(const role of ['Admin','Instructor','Examiner','Proctor','Candidate']){
    const fixture=manifest.users.find(u=>u.role===role);if(!fixture)continue;
    const c=new Client({evidence:ev});must(await c.login(fixture.email,privateData.password),'Role login');
    for(const route of ['/api/Settings','/api/Organization']){
      const read=await c.get(route);const write=await c.put(route,originals[route]);
      ev.check(`${role} denied system/organization read and write ${route}`,read.status===403&&write.status===403,{read:read.status,write:write.status});
    }
    for(const route of ['/api/Notification/settings','/api/Notification/templates','/api/Notification/logs']){
      const r=await c.get(route);ev.check(`${role} notification authorization matches controller policy ${route}`,role==='Admin'?r.ok:r.status===403,{status:r.status});
    }
  }
} finally {
  for(const route of ['/api/Settings','/api/Organization','/api/Notification/settings'])must(await admin.put(route,originals[route]),'Final restore '+route);
  for(const t of templates)must(await admin.put(`/api/Notification/templates/${t.eventType}`,t),'Final restore template');
  for(const route of ['/api/Settings','/api/Organization','/api/Notification/settings']){
    const actual=must(await admin.get(route),'Verify restoration');
    ev.check('Original restored '+route,eq(actual,originals[route],Object.keys(originals[route]).filter(k=>!['updatedDate'].includes(k))));
  }
}
console.log(JSON.stringify({checks:ev.checks.length,failures:ev.checks.filter(c=>!c.passed).map(c=>c.name)},null,2));
