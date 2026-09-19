import fs from'node:fs';import path from'node:path';
import{Client,Evidence,adminClient,here,must}from'./client.mjs';
const e=new Evidence('d27-share-'+(process.env.QA_LABEL??'before')),admin=await adminClient(e),m=JSON.parse(fs.readFileSync(path.join(here,'data-manifest.json'))),exams=JSON.parse(fs.readFileSync(path.join(here,'exam-manifest.json'))),target=m.users.find(u=>u.email==='qa26.ops.admin1@example.test'),walk=exams.exams.find(x=>x.key==='walkin'),anon=new Client({evidence:e});
const before=must(await admin.get('/api/Users/'+target.id));
const selected=await anon.post(`/api/public/exam/${walk.share.shareToken}/select-candidate`,{candidateId:target.id});
let privilegedStatus=null,claims=null;
if(selected.ok){
 const payload=JSON.parse(Buffer.from(selected.data.accessToken.split('.')[1],'base64url'));claims=Object.fromEntries(Object.entries(payload).filter(([key])=>/role/i.test(key)));
 const forged=new Client({evidence:e,token:selected.data.accessToken,identity:'QA26 public impersonation of QA Operations Admin only'});privilegedStatus=(await forged.get('/api/Assessment/exams/122')).status;
}
e.check('D27 public selection rejects privileged non-Candidate user and mints no token',!selected.ok,{status:selected.status,claims,privilegedReadStatus:privilegedStatus});
const after=must(await admin.get('/api/Users/'+target.id));e.check('QA target persisted role and department remain unchanged',JSON.stringify(before.roles)===JSON.stringify(after.roles)&&before.departmentId===after.departmentId,{beforeRoles:before.roles,afterRoles:after.roles});
console.log(JSON.stringify({checks:e.checks,claimRoles:claims,privilegedStatus}));
