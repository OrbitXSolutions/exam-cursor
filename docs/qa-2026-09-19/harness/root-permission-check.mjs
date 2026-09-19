import { adminClient, Evidence, must } from './client.mjs';
const ev=new Evidence('root-permission-check');
const admin=await adminClient(ev);
const user=must(await admin.get('/api/Users/4c4eb16d-93d3-41d9-8881-d4d741212885'),'read browser proctor');
console.log(JSON.stringify({id:user.id,roles:user.roles,departmentId:user.departmentId,isActive:user.isActive}));
