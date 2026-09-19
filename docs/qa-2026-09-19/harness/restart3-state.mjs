import {adminClient,Evidence} from './client.mjs';
const stage=process.argv[2]??'before';
const ev=new Evidence(`restart3-${stage}`),admin=await adminClient(ev);
for(const route of ['/api/Attempt/193','/api/Attempt/193/details','/api/Proctor/session/145']){
 const r=await admin.get(route);
 ev.check(`${stage} checkpoint ${route}`,r.ok,{status:r.status});
}
