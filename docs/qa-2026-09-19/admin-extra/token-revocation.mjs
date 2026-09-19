import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Evidence, adminClient, must, privateConfig } from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const name=process.env.QA_EVIDENCE_NAME??'token-before';
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,name+'.json'),JSON.stringify({classification:'SIMULATED TEST: actual API lifecycle requests and persisted account state',checks:this.checks,events:this.events},null,2));}}
const ev=new Output(name);const admin=await adminClient(ev);const pwd=privateConfig().password;
const manifest=JSON.parse(fs.readFileSync(path.join(here,'../harness/data-manifest.json'),'utf8'));
const idManifest=[];
for(const role of ['Candidate','Admin']){
 const email=`qa26.token.${role.toLowerCase()}.${Date.now()}@example.test`;
 const user=must(await admin.post('/api/Users',{email,password:pwd,fullName:'QA26 Token Revocation '+role,role,departmentId:manifest.departments[0].id}),'Create revocation fixture');
 idManifest.push({id:user.id,email,role});
 fs.writeFileSync(path.join(here,name+'-fixtures.json'),JSON.stringify(idManifest,null,2));
 const c=new Client({evidence:ev});must(await c.login(email,pwd),'Login before block');
 const routes=role==='Candidate'?['/api/Departments/my-department','/api/Candidate/dashboard','/api/user-notifications']:['/api/Notification/templates','/api/Departments/my-department'];
 for(const route of routes){const r=await c.get(route);ev.check(role+' active baseline '+route,r.ok,{status:r.status});}
 for(const state of ['block','deactivate']){
  must(await admin.post(`/api/Users/${user.id}/${state}`),'Mutate account '+state);
  const fresh=new Client({evidence:ev});ev.check(role+' '+state+' fresh login denied',!(await fresh.login(email,pwd)).ok);
  for(const route of routes){const r=await c.get(route);ev.check(role+' '+state+' old JWT denied '+route,r.status===401,{status:r.status});}
  const hub=await c.post('/hubs/proctor/negotiate?negotiateVersion=1');ev.check(role+' '+state+' old JWT hub negotiation denied',hub.status===401,{status:hub.status});
  must(await admin.post(`/api/Users/${user.id}/${state==='block'?'unblock':'activate'}`),'Restore account');
  must(await c.login(email,pwd),'Login after restore');
  for(const route of routes){const r=await c.get(route);ev.check(role+' restored access '+route,r.ok,{status:r.status});}
 }
 must(await admin.delete(`/api/Users/${user.id}`),'Soft delete fixture');
 for(const route of routes){const r=await c.get(route);ev.check(role+' deleted old JWT denied '+route,r.status===401,{status:r.status});}
}
console.log(JSON.stringify({checks:ev.checks.length,failed:ev.checks.filter(c=>!c.passed).map(c=>c.name)},null,2));
