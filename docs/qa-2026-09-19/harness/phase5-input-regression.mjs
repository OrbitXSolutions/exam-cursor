import fs from'node:fs';import path from'node:path';
import{Client,Evidence,adminClient,here,must,privateConfig}from'./client.mjs';
const e=new Evidence('phase5-input-regression'),admin=await adminClient(e),p=privateConfig();
const manifest=JSON.parse(fs.readFileSync(path.join(here,'attempt-manifest.json'))),em=JSON.parse(fs.readFileSync(path.join(here,'exam-manifest.json')));
async function login(email){const c=new Client({evidence:e});must(await c.login(email,p.users.find(u=>u.email===email)?.password??p.password));return c;}
const c=await login('qa26.eng.candidate3@example.test'),proctor=await login('qa26.eng.proctor1@example.test'),ops=await login('qa26.ops.proctor1@example.test');
const questions=s=>s.questions?.length?s.questions:s.sections.flatMap(x=>[...(x.questions??[]),...(x.topics??[]).flatMap(y=>y.questions??[])]);
const auto=must(await c.post('/api/Candidate/exams/116/start',{}),'Start no-ID exam after fix');
const answers=[{questionId:131,selectedOptionIds:[377]},{questionId:132,selectedOptionIds:[380]},{questionId:133,selectedOptionIds:[382]},{questionId:134,selectedOptionIds:[385]}];
must(await c.put(`/api/Candidate/attempts/${auto.attemptId}/answers`,{answers}));
const autoSession=must(await c.get(`/api/Proctor/session/attempt/${auto.attemptId}`));
must(await c.post('/api/Proctor/heartbeat',{proctorSessionId:autoSession.proctorSessionId??autoSession.id,clientTimestamp:new Date().toISOString()}));
let heartbeat=setInterval(()=>c.post('/api/Proctor/heartbeat',{proctorSessionId:autoSession.proctorSessionId??autoSession.id,clientTimestamp:new Date().toISOString()}),10000);
try{
 for(const [label,probe] of [['unknown',[{questionId:131,selectedOptionIds:[999999999]}]],['foreign-question',[{questionId:136,selectedOptionIds:[387]}]],['duplicate-option',[{questionId:132,selectedOptionIds:[379,379]}]],['ambiguous-single',[{questionId:131,selectedOptionIds:[376,377]}]],['mixed-batch',[{questionId:131,selectedOptionIds:[376]},{questionId:132,selectedOptionIds:[999999999]}]]]){
  const r=await c.put(`/api/Candidate/attempts/${auto.attemptId}/answers`,{answers:probe}),reload=must(await c.get(`/api/Candidate/attempts/${auto.attemptId}/session`));
  e.check(`D15 ${label} rejected with all previous answers unchanged`,!r.ok&&!r.body.message?.includes('Expired')&&answers.every(a=>JSON.stringify(questions(reload).find(q=>q.questionId===a.questionId).currentAnswer?.selectedOptionIds)===JSON.stringify(a.selectedOptionIds)),{status:r.status,message:r.body.message});
 }
 must(await c.put(`/api/Candidate/attempts/${auto.attemptId}/answers`,{answers:[{questionId:133,selectedOptionIds:[]}]}));
 const cleared=must(await c.get(`/api/Candidate/attempts/${auto.attemptId}/session`)),monitor=must(await proctor.get(`/api/Proctor/session/${autoSession.proctorSessionId??autoSession.id}`));
 e.check('D21 clearing selected answers persists unanswered state and candidate/proctor count3',cleared.answeredQuestions===3&&!questions(cleared).find(q=>q.questionId===133).currentAnswer&&monitor.attemptTotalAnswered===3,{candidate:cleared.answeredQuestions,proctor:monitor.attemptTotalAnswered});
 must(await c.put(`/api/Candidate/attempts/${auto.attemptId}/answers`,{answers}));
 manifest.attempts.push({key:'auto',role:'post-fix-scoring',examId:116,attemptId:auto.attemptId,email:c.identity,candidateId:c.user.id,expectedScore:18,expectedMax:40,answers});

 const before=must(await admin.get(`/api/Attempt?examId=120&candidateId=${c.user.id}`));
 for(const route of ['/api/Candidate/exams/120/start','/api/Attempt/start']){const r=await c.post(route,route.endsWith('/Attempt/start')?{examId:120}:{});e.check('D16 unverified required-ID start denied '+route,!r.ok&&r.body.message?.includes('identity verification'),r.body);}
 const after=must(await admin.get(`/api/Attempt?examId=120&candidateId=${c.user.id}`));e.check('D16 denied starts create no attempt',before.totalCount===after.totalCount);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=','base64'),form=new FormData();
 form.append('selfiePhoto',new Blob([png],{type:'image/png'}),'QA26-SIMULATED-selfie.png');form.append('idPhoto',new Blob([png],{type:'image/png'}),'QA26-SIMULATED-ID.png');form.append('idDocumentType','QA26 SYNTHETIC TEST IMAGE — NOT ID');form.append('idNumber','QA26-NOT-A-REAL-ID');
 const up=await fetch(c.base+'/api/proctor/authentication/submit',{method:'POST',headers:{Authorization:`Bearer ${c.token}`},body:form});const upload=await up.json();e.record({identity:c.identity,classification:'SIMULATED identity: 1x1 PNG is not a person or document',response:upload});e.check('Synthetic identity upload creates Pending review',up.ok&&upload.success,upload);
 const identity=must(await c.get('/api/proctor/authentication/status')),verificationId=identity.verificationId??identity.id??upload.data?.verificationId??upload.data?.id;
 e.record({verificationId,status:identity});
 const pending=await c.post('/api/Candidate/exams/120/start',{});e.check('D16 Pending identity still cannot start strict exam',!pending.ok&&pending.body.message?.includes('identity verification'),pending.body);
 const foreign=await ops.post(`/api/proctor/authentication/verifications/${verificationId}/action`,{action:'Approve',reason:'QA26 foreign denied'});e.check('Foreign department proctor cannot approve identity',!foreign.ok,foreign.body);
 must(await proctor.post(`/api/proctor/authentication/verifications/${verificationId}/action`,{action:'Approve',reason:'QA26 SYNTHETIC TEST ONLY; no real identity verified'}));
 const approved=must(await c.get('/api/proctor/authentication/status'));e.check('Same department review persists Approved identity',approved.status==='Approved',approved);
 const strict=must(await c.post('/api/Candidate/exams/120/start',{}),'Approved identity starts strict exam');e.check('D16 Approved identity allows configured exam start',!!strict.attemptId);
 const legacy=must(await c.post('/api/Attempt/start',{examId:120}));e.check('D16 legacy start resumes approved active attempt',legacy.attemptId===strict.attemptId);
 const strictSession=must(await c.get(`/api/Proctor/session/attempt/${strict.attemptId}`));
 must(await proctor.post(`/api/Proctor/session/${strictSession.proctorSessionId??strictSession.id}/terminate`,{reason:'QA26 D23 terminated-state regression'}));
 const submit=await c.post(`/api/Candidate/attempts/${strict.attemptId}/submit`,{}),state=must(await admin.get(`/api/Attempt/${strict.attemptId}`));e.check('D23 terminated candidate cannot submit and persisted state remains8',!submit.ok&&state.status===8,{response:submit.body,persistedStatus:state.status});
 manifest.attempts.push({key:'strict',role:'approved-ID-then-terminated-regression',examId:120,attemptId:strict.attemptId,email:c.identity,candidateId:c.user.id,identityVerificationId:verificationId,status:state.status});

 const walk=em.exams.find(x=>x.key==='walkin'),fields=walk.walkInFields,required=fields.find(f=>f.isRequired),numeric=fields.find(f=>f.fieldType===2),anonymous=new Client({evidence:e});
 for(const [label,dynamicFields] of [['missing',undefined],['whitespace',[{fieldId:required.id,value:'  '}]],['invalid-number',[{fieldId:required.id,value:'QA26 Lab'},{fieldId:numeric.id,value:'abc'}]],['foreign-field',[{fieldId:required.id,value:'QA26 Lab'},{fieldId:999999,value:'x'}]],['duplicate-field',[{fieldId:required.id,value:'QA26 Lab'},{fieldId:required.id,value:'other'}]]]){
  const email=`qa26.walkin.fixed.${label}@example.test`,r=await anonymous.post(`/api/public/exam/${walk.share.shareToken}/register`,{fullName:'QA26 Validation Probe',email,phoneNumber:'+971509999991',dynamicFields});const lookup=await admin.get('/api/Users/by-email/'+encodeURIComponent(email));e.check(`D17 ${label} rejected before creating account`,!r.ok&&!lookup.ok,{status:r.status,message:r.body.message,userLookup:lookup.status});
 }
 const validEmail='qa26.walkin.fixed.valid@example.test',r=await anonymous.post(`/api/public/exam/${walk.share.shareToken}/register`,{fullName:'QA26 Valid Dynamic',email:validEmail,phoneNumber:'+971509999992',dynamicFields:[{fieldId:required.id,value:'QA26 Valid Lab'},{fieldId:numeric.id,value:'2.5'}]});e.check('D17 valid text and decimal number accepted',r.ok);
 const reporting=must(await admin.get('/api/Assessment/exams/119/walkin-answers'));e.check('D17 accepted dynamic field values persist in admin report',JSON.stringify(reporting).includes('QA26 Valid Lab')&&JSON.stringify(reporting).includes('2.5'));
 manifest.walkinRegression={email:validEmail,candidateId:r.data?.candidateId};
}finally{clearInterval(heartbeat);fs.writeFileSync(path.join(here,'attempt-manifest.json'),JSON.stringify(manifest,null,2));}
console.log(JSON.stringify({checks:e.checks.length,failed:e.checks.filter(x=>!x.passed).map(x=>x.name)}));
