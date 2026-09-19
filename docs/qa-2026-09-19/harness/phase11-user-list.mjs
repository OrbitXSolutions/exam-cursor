import {adminClient,Client,Evidence,must,privateConfig} from './client.mjs';
const stage=process.argv[2]??'before',ev=new Evidence(`phase11-user-list-${stage}`),admin=await adminClient(ev);
for(const size of [20,100,200])for(const pass of ['cold','warm']){
 const r=await admin.get(`/api/Users?pageNumber=1&pageSize=${size}`,{timeoutMs:90000});
 ev.check(`${size} ${pass} user list returns complete roles`,r.ok&&r.data.items.every(u=>Array.isArray(u.roles)&&u.roles.length>0),{ms:r.ms,count:r.data?.items.length,total:r.data?.totalCount,roleSummary:r.data?.items.map(u=>({id:u.id,roles:u.roles}))});
 console.log(JSON.stringify({size,pass,ms:r.ms,count:r.data?.items.length,status:r.status}));
}
if(stage.startsWith('after')){
 const all=must(await admin.get('/api/Users?pageNumber=1&pageSize=200'),'postfix list');
 for(const user of all.items.filter(u=>u.roles.some(r=>r==='SuperAdmin')||u.email==='qa26.eng.admin1@example.test'||u.email==='qa26.eng.candidate1@example.test'||u.email==='qa26.eng.proctor1@example.test')){
  const detail=must(await admin.get(`/api/Users/${user.id}`),'independent single-user detail');
  ev.check(`List roles match independent detail for ${user.email}`,JSON.stringify([...user.roles].sort())===JSON.stringify([...detail.roles].sort()),{list:user.roles,detail:detail.roles});
 }
 const eng=new Client({evidence:ev});must(await eng.login('qa26.eng.admin1@example.test',privateConfig().password),'scoped admin');
 const staffDenied=await eng.get('/api/Users/staff?pageSize=100');
 ev.check('SuperAdmin-only staff endpoint remains forbidden to department Admin',staffDenied.status===403);
 const staff=must(await admin.get('/api/Users/staff?departmentId=8&pageSize=100'),'department-filtered staff list');
 ev.check('Staff list retains department filter and Candidate exclusion',staff.items.every(u=>u.departmentId===8&&!u.roles.includes('Candidate')),{count:staff.items.length,users:staff.items.map(u=>({id:u.id,departmentId:u.departmentId,roles:u.roles}))});
 const filtered=must(await admin.get('/api/Users?role=Examiner&departmentId=8&pageSize=100'),'role-filtered list');
 ev.check('Role-filtered list retains accurate membership and department',filtered.items.length>0&&filtered.items.every(u=>u.roles.includes('Examiner')&&u.departmentId===8),{count:filtered.items.length});
}
