import fs from 'node:fs';
import path from 'node:path';
import {Evidence,adminClient,here,must}from'./client.mjs';
const e=new Evidence('phase3-proctor-assignment-cleanup');const a=await adminClient(e);
const manifest=JSON.parse(fs.readFileSync(path.join(here,'exam-manifest.json'),'utf8'));
const users=new Map(),cleanup=[];
for(const item of manifest.exams.filter(x=>x.id>=115&&x.id<=126)){
 const exam=must(await a.get(`/api/Assessment/exams/${item.id}`),'Read exam department');
 const assigned=must(await a.get(`/api/ExamProctor/${item.id}`),'Read proctor assignments');
 const remove=[];
 for(const p of assigned.assignedProctors){
  if(!users.has(p.id))users.set(p.id,await a.get(`/api/Users/${p.id}`));
  const user=users.get(p.id);
  if(!user.ok||user.data.departmentId!==exam.departmentId||user.data.isBlocked||user.data.status!=='Active')remove.push(p.id);
 }
 if(remove.length){const result=must(await a.post('/api/ExamProctor/unassign',{examId:exam.id,proctorIds:remove}),'Unassign erroneously autoassigned foreign/inactive proctors');cleanup.push({examId:exam.id,departmentId:exam.departmentId,removedProctorIds:remove,successCount:result.successCount});}
 const after=must(await a.get(`/api/ExamProctor/${item.id}`),'Reload assignments');
 e.check(`Exam ${item.id} retains only active same-department proctors`,after.assignedProctors.every(p=>{const u=users.get(p.id);return u?.ok&&u.data.departmentId===exam.departmentId&&!u.data.isBlocked&&u.data.status==='Active';}),{retained:after.assignedProctors.map(x=>x.id)});
}
e.record({cleanup});
console.log(JSON.stringify({removedAssignments:cleanup.reduce((n,x)=>n+x.successCount,0),exams:cleanup.map(x=>x.examId)},null,2));
