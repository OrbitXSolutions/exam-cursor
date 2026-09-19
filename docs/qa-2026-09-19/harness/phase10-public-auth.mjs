import fs from 'node:fs';import path from 'node:path';
import {Client,Evidence,adminClient,here,root,must,privateConfig} from './client.mjs';
const e=new Evidence('phase10-public-auth'),p=privateConfig(),admin=await adminClient(e),anon=new Client({evidence:e});
const walk=JSON.parse(fs.readFileSync(path.join(here,'exam-manifest.json'))).exams.find(x=>x.key==='walkin');
const target=must(await admin.get('/api/Users/by-email/qa26.import.a@example.test'));
const prefix=`/api/public/exam/${walk.share.shareToken}`;
const enumerated=must(await anon.get(prefix+'/candidates?search=qa26.import.a'));
e.record({observation:'Anonymous share-link lookup exposes matching candidate IDs/names/roll numbers',matching:enumerated.filter(x=>x.id===target.id)});
const publicSelect=await anon.post(prefix+'/select-candidate',{candidateId:target.id});
e.check('Public selection requires proof of ownership before authenticating an existing candidate',!publicSelect.ok,{status:publicSelect.status,candidateId:publicSelect.data?.candidateId,shareExamId:119});
if(publicSelect.ok){
 const impersonated=new Client({evidence:e,token:publicSelect.data.accessToken,identity:'SIMULATED anonymous public selection of QA imported A'});
 const unrelated=await impersonated.get('/api/Candidate/results/my-result/208');
 e.check('Share authentication is scoped away from unrelated exam result130',!unrelated.ok,{shareExamId:119,unrelatedExamId:unrelated.data?.examId,unrelatedAttemptId:208,totalScore:unrelated.data?.totalScore,status:unrelated.status});
 const refresh=await anon.post('/api/Auth/refresh-token',{accessToken:publicSelect.data.accessToken,refreshToken:publicSelect.data.refreshToken});
 e.check('Anonymous share identity cannot refresh into an unrestricted persistent account session',!refresh.ok,{status:refresh.status,roles:refresh.data?.user?.roles});
}
const required=walk.walkInFields.find(f=>f.isRequired);
const reRegister=await anon.post(prefix+'/register',{email:target.email,fullName:'QA26 simulated impersonation name',phoneNumber:'+971509999993',dynamicFields:[{fieldId:required.id,value:'QA26 adversarial existing-email registration'}]});
e.check('Walk-in registration of an existing candidate email requires ownership proof',!reRegister.ok,{status:reRegister.status,candidateId:reRegister.data?.candidateId});
if(reRegister.ok){
 const impersonated=new Client({evidence:e,token:reRegister.data.accessToken,identity:'SIMULATED anonymous existing-email walk-in login'});
 const unrelated=await impersonated.get('/api/ExamResult/my-result/208');
 e.check('Existing-email walk-in token cannot read unrelated exam130 results',!unrelated.ok,{status:unrelated.status,examId:unrelated.data?.examId,totalScore:unrelated.data?.totalScore});
}
const current=must(await admin.get('/api/Users/'+target.id));
e.check('Impersonation probes did not change target persisted roles/profile',JSON.stringify(current.roles)===JSON.stringify(target.roles)&&current.fullName===target.fullName&&current.phoneNumber===target.phoneNumber);
const legitimate=new Client({evidence:e});const login=must(await legitimate.login(target.email,p.users.find(u=>u.email===target.email)?.password??p.password));
const parts=legitimate.token.split('.'),claims=JSON.parse(Buffer.from(parts[1],'base64url'));
const roleKey=Object.keys(claims).find(k=>k.endsWith('/role'))??'role';claims[roleKey]=['SuperAdmin'];
const forgedPayload=Buffer.from(JSON.stringify(claims)).toString('base64url');
for(const [label,jwt] of [['modified role with original signature',`${parts[0]}.${forgedPayload}.${parts[2]}`],['unsigned alg-none',`${Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')}.${forgedPayload}.`],['malformed JWT','not.a.jwt']]){
 const attacker=new Client({evidence:e,token:jwt,identity:'QA26 '+label});const response=await attacker.get('/api/Users?pageSize=1');
 e.check('JWT '+label+' rejected',response.status===401,{status:response.status});
}
const invalidRefresh=await anon.post('/api/Auth/refresh-token',{accessToken:legitimate.token,refreshToken:'QA26-invalid-refresh'});
e.check('Invalid refresh secret rejected',!invalidRefresh.ok,{status:invalidRefresh.status});
must(await legitimate.post('/api/Auth/logout'));
const afterLogout=await anon.post('/api/Auth/refresh-token',{accessToken:login.accessToken,refreshToken:login.refreshToken});
e.check('Logout invalidates refresh credential',!afterLogout.ok,{status:afterLogout.status});
// This derives the test-only credential from source at runtime; it is not printed or committed.
const source=fs.readFileSync(path.join(root,'Backend-API/Infrastructure/Services/Assessment/ExamShareService.cs'),'utf8');
const commonPassword=source.match(/const string password = "([^"]+)"/)?.[1];
if(commonPassword){
 const walkin=new Client({evidence:e});const loginResult=await walkin.login('qa26.walkin.fixed.valid@example.test',commonPassword);
 e.check('Walk-in accounts cannot authenticate using a globally shared default password',!loginResult.ok,{status:loginResult.status,roles:loginResult.data?.user?.roles});
}
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name),targetId:target.id,notes:'No answers/grades changed. Existing imported A dynamic registration field119 intentionally stores QA probe text; public endpoints rotated target refresh tokens. Auth model findings require product security decision.'}));
