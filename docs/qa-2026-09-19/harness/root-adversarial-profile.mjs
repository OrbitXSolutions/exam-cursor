import fs from 'node:fs';
import path from 'node:path';
import {adminClient,Client,Evidence,must,privateConfig,here} from './client.mjs';
const mode=process.argv[2],e=new Evidence(`root-adversarial-${mode}`),admin=await adminClient(e);
const filename=path.join(here,'root-adversarial-manifest.json');
let fixture=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename)):null;
const save=()=>fs.writeFileSync(filename,JSON.stringify(fixture,null,2));
if(mode==='seed'){
  if(!fixture){
    const user=must(await admin.post('/api/Users',{email:'qa26.csv.security@example.test',password:privateConfig().password,fullName:'=1+1',fullNameAr:'اختبار أمن التقارير',role:'Candidate',departmentId:8}));
    fixture={userId:user.id,email:user.email,examId:116};save();
  }
  const c=new Client({evidence:e});must(await c.login(fixture.email,privateConfig().password));
  if(!fixture.attemptId){const start=must(await c.post('/api/Candidate/exams/116/start',{}));fixture.attemptId=start.attemptId;save();}
  const submitted=await c.post(`/api/Candidate/attempts/${fixture.attemptId}/submit`,{});
  e.check('Synthetic formula-name candidate submitted actual blank attempt',submitted.ok,submitted.body);
  console.log(JSON.stringify(fixture));
}else if(mode==='xss'){
  const name='<img src="/qa26-missing-image.png" onerror="alert(\'QA26 XSS\')">';
  const r=await admin.put(`/api/Users/${fixture.userId}`,{fullName:name});
  e.check('Stored harmless local XSS probe profile accepted',r.ok,{userId:fixture.userId,name});
}else if(mode==='restore'){
  const r=await admin.put(`/api/Users/${fixture.userId}`,{fullName:'QA26 CSV Security'});
  e.check('Adversarial profile renamed to readable QA fixture',r.ok,r.data);
}else throw Error('Unknown mode');
