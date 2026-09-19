import { adminClient, Client, privateConfig, Evidence, must } from './client.mjs';
const mode = process.argv[2];
const ev = new Evidence(`root-browser-state-${mode}`);
const admin = await adminClient(ev);
if (mode === 'seed-explanation') {
  const q = must(await admin.get('/api/QuestionBank/questions/156'), 'read isolated question');
  const result = await admin.put('/api/QuestionBank/questions/156', {
    ...q, explanationEn: 'QA26 preserved English explanation', explanationAr: 'شرح الاختبار المحفوظ',
  });
  ev.check('isolated explanation fixture updated', result.ok, result.body);
} else if (mode === 'verify-explanation') {
  const q = must(await admin.get('/api/QuestionBank/questions/156'), 'read isolated question');
  ev.check('browser metadata save preserves both explanations', q.explanationEn === 'QA26 preserved English explanation' && q.explanationAr === 'شرح الاختبار المحفوظ', { explanationEn: q.explanationEn, explanationAr: q.explanationAr });
} else if (mode === 'option-order') {
  const candidate = new Client({ evidence: ev });
  must(await candidate.login('qa26.eng.candidate1@example.test', privateConfig().password), 'candidate login');
  const sequences = [];
  for (let i = 0; i < 3; i++) {
    const session = must(await candidate.get('/api/Candidate/attempts/193/session'), 'candidate session');
    sequences.push(session.questions.map(q => ({ id:q.questionId, options:q.options.map(o=>o.id) })));
  }
  ev.check('option order remains stable across repeated reads', sequences.every(s=>JSON.stringify(s)===JSON.stringify(sequences[0])), sequences);
} else if (mode === 'candidate-checkpoint') {
  const candidate = new Client({ evidence: ev });
  must(await candidate.login('qa26.eng.candidate1@example.test', privateConfig().password), 'candidate login');
  const session = must(await candidate.get('/api/Candidate/attempts/193/session'), 'candidate session');
  console.log(JSON.stringify({ status: session.status, remainingSeconds: session.remainingSeconds, questions: session.questions?.map(q => ({questionId:q.questionId, order:q.order, currentAnswer:q.currentAnswer})) }, null, 2));
} else if (mode === 'live-checkpoint') {
  const r = await admin.get('/api/Proctor/session/145');
  ev.check('browser proctor session can be independently reloaded', r.ok, r.body);
} else throw new Error('Unknown mode');
