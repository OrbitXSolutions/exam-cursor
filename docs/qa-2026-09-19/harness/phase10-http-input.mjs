import {adminClient,Client,Evidence,must,privateConfig} from './client.mjs';
const e=new Evidence('phase10-http-input'),eng=new Client({evidence:e});must(await eng.login('qa26.eng.admin1@example.test',privateConfig().password),'eng login');
for(const route of ['/api/Assessment/exams?pageSize=101','/api/Assessment/exams?pageNumber=-1','/api/Assessment/exams?examType=99','/api/Media?pageSize=-1','/api/Media?pageNumber=0']){
 const r=await eng.get(route);e.check(`Invalid query rejected without server failure: ${route}`,r.status>=400&&r.status<500,{status:r.status,body:r.body});
}
for(const search of ["' OR 1=1--",'<img src=x onerror=alert(1)>','QA26 عربية 🧪']){
 const r=await eng.get('/api/Assessment/exams?search='+encodeURIComponent(search));e.check(`Search treats payload as data: ${search}`,r.ok&&(r.data?.items??[]).every(x=>[x.titleEn,x.titleAr].some(v=>v.toLowerCase().includes(search.toLowerCase()))),{status:r.status,total:r.data?.totalCount});
}
for(const [body,type] of [['{"titleEn":','application/json'],['not-json','application/xml']]){
 const r=await fetch(eng.base+'/api/Assessment/exams',{method:'POST',headers:{Authorization:`Bearer ${eng.token}`,'Content-Type':type},body});
 e.check(`Malformed request ${type} rejected before mutation`,r.status>=400&&r.status<500,{status:r.status,body:(await r.text()).slice(0,2000)});
}
console.log(JSON.stringify({checks:e.checks.length,passed:e.checks.filter(c=>c.passed).length}));
