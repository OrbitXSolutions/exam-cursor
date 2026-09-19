// Ordinary assigned-exam timer regression; no security probes or service restarts.
// before creates one 10-minute QA exam/attempt. after verifies and submits it.
// heartbeat keeps this fixture connected until after completes (maximum 12 minutes).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Client, Evidence, here, root, must, privateConfig, redact } from './client.mjs';
const mode = process.argv[2];
if (!['before', 'fresh', 'after', 'heartbeat'].includes(mode)) throw Error('Usage: node d65-proctor-clock.mjs before|fresh|after|heartbeat');
const ev = new Evidence(`d65-proctor-clock-${mode}`), p = privateConfig();
const manifestPath = path.join(here, 'd65-proctor-clock-manifest.json');
let state = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const save = () => fs.writeFileSync(manifestPath, JSON.stringify(redact(state), null, 2));
const check = (name, passed, detail) => { ev.check(name, passed, detail); if (!passed) throw Error(name); };
const login = async email => { const c = new Client({ evidence: ev }); must(await c.login(email, p.users.find(u => u.email === email)?.password ?? p.password), 'Login'); return c; };
async function keepalive(candidate) {
  check('Heartbeat owner matches saved fixture', candidate.user.id === state.candidateId);
  const deadline = Date.now() + 12 * 60000;
  while (Date.now() < deadline && !JSON.parse(fs.readFileSync(manifestPath, 'utf8')).completedAt) {
    try {
      const result = await candidate.post('/api/Proctor/heartbeat', { proctorSessionId: state.sessionId, clientTimestamp: new Date().toISOString() });
      console.log(`Fixture heartbeat HTTP ${result.status}`);
      if (result.data?.isExpired) break;
    } catch (error) { console.log(`Heartbeat interrupted during coordinated restart: ${error.message}`); }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  ev.save();
}
if (mode === 'heartbeat') {
  if (!state.attemptId || !state.sessionId || !/^qa26\.eng\.candidate[13]@example\.test$/.test(state.candidateEmail)) throw Error('D65 fixture required.');
  await keepalive(await login(state.candidateEmail)); process.exit(0);
}
// Exercise the actual frontend getLiveSessions mapper with the just-fetched real DTO.
// Only its transport is substituted; backend HTTP calls above remain real.
async function mapRealList(data) {
  const frontend = path.join(root, 'Frontend/Smart-Exam-App-main');
  const require = createRequire(path.join(frontend, 'package.json'));
  const ts = require('typescript');
  const source = fs.readFileSync(path.join(frontend, 'lib/api/proctoring.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)(name => {
    if (name === '@/lib/api-client') return { apiClient: { get: async () => data } };
    throw Error(`Unexpected mapper dependency ${name}`);
  }, module, module.exports);
  return module.exports.getLiveSessions(false);
}
try {
  const admin = await login('qa26.eng.admin1@example.test');
  const candidate = await login(mode === 'fresh' ? 'qa26.eng.candidate1@example.test' : state.candidateEmail ?? 'qa26.eng.candidate3@example.test');
  if (mode === 'before') {
    if (state.examId) throw Error('Existing D65 fixture; inspect it instead of duplicating the before phase.');
    const template = JSON.parse(fs.readFileSync(path.join(here, 'exam-manifest.json'), 'utf8')).exams.find(x => x.key === 'auto');
    const request = { ...template.request, departmentId: 8, titleEn: 'QA26 D65 Proctor Remaining Clock', titleAr: 'اختبار وقت المراقب QA26',
      startAt: new Date(Date.now() - 60000).toISOString(), endAt: new Date(Date.now() + 3600000).toISOString(), durationMinutes: 10,
      maxAttempts: 1, passScore: 5, requireProctoring: true, requireIdVerification: false, requireWebcam: false, enableScreenMonitoring: false, screenMonitoringMode: 0 };
    const exam = must(await admin.post('/api/Assessment/exams', request), 'Create clock exam');
    state = { examId: exam.id, candidateId: candidate.user.id, candidateEmail: candidate.identity, request, createdAt: new Date().toISOString() }; save();
    const section = must(await admin.post(`/api/Assessment/exams/${exam.id}/sections`, { titleEn: 'Clock regression', titleAr: 'اختبار الساعة', order: 1 }), 'Create section');
    must(await admin.post(`/api/Assessment/sections/${section.id}/questions/bulk`, { questionIds: [131], useOriginalPoints: true, markAsRequired: true }), 'Add question');
    must(await admin.put(`/api/Assessment/exams/${exam.id}/access-policy`, { isPublic: false, restrictToAssignedCandidates: true, isWalkIn: false, accessCode: null }), 'Set assigned access');
    must(await admin.post(`/api/Assessment/exams/${exam.id}/publish`), 'Publish clock exam');
    must(await admin.post('/api/Assignments/assign', { examId: exam.id, candidateIds: [candidate.user.id], scheduleFrom: request.startAt, scheduleTo: request.endAt }), 'Assign clock candidate');
    const started = must(await candidate.post(`/api/Candidate/exams/${exam.id}/start`, {}), 'Start ordinary clock attempt');
    state.attemptId = started.attemptId; state.expiresAt = started.expiresAtUtc; save();
    const session = must(await candidate.get(`/api/Proctor/session/attempt/${state.attemptId}`), 'Get own session');
    state.sessionId = session.id; save();
  }
  if (mode === 'fresh') {
    if (!state.before || state.beforeFixture || !state.examId) throw Error('Fresh phase requires the original before fixture exactly once.');
    const oldAttempt = must(await admin.get(`/api/Attempt/${state.attemptId}`), 'Read original clock fixture');
    check('Original before fixture is terminal before replacement', oldAttempt.status === 4 && oldAttempt.examId === state.examId && oldAttempt.candidateId === state.candidateId, oldAttempt);
    const original = state;
    state = { examId: original.examId, request: original.request, candidateId: candidate.user.id, candidateEmail: candidate.identity, beforeFixture: original }; save();
    must(await admin.post('/api/Assignments/assign', { examId: state.examId, candidateIds: [candidate.user.id], scheduleFrom: state.request.startAt, scheduleTo: state.request.endAt }), 'Assign fresh clock candidate');
    const started = must(await candidate.post(`/api/Candidate/exams/${state.examId}/start`, {}), 'Start fresh ordinary clock attempt');
    state.attemptId = started.attemptId; state.expiresAt = started.expiresAtUtc; save();
    const session = must(await candidate.get(`/api/Proctor/session/attempt/${state.attemptId}`), 'Read fresh own session');
    state.sessionId = session.id; save();
  }
  check('Fixture identifies this candidate and a persisted exam/attempt/session', state.candidateId === candidate.user.id && state.examId > 0 && state.attemptId > 0 && state.sessionId > 0, state);
  must(await candidate.post('/api/Proctor/heartbeat', { proctorSessionId: state.sessionId, clientTimestamp: new Date().toISOString() }), 'Healthy fixture heartbeat');
  const timer = must(await candidate.get(`/api/Attempt/${state.attemptId}/timer`), 'Read authoritative candidate timer');
  const listReadStartedAt = Date.now();
  const listing = must(await admin.get(`/api/Proctor/sessions?ExamId=${state.examId}&Status=1&IncludeSamples=false`), 'Read live session cards');
  const row = listing.items.find(x => x.attemptId === state.attemptId);
  const mapped = (await mapRealList(listing)).find(x => x.id === String(state.sessionId));
  check('Fresh ordinary attempt has positive authoritative time', timer.remainingSeconds > 0 && !!row && !!mapped, { timer, row, mapped });
  if (mode === 'before') {
    check('D65 reproduced: positive candidate timer maps to zero-minute proctor card', mapped.timeRemaining === 0 && row.remainingSeconds === undefined,
      { authoritativeSeconds: timer.remainingSeconds, backendListSeconds: row.remainingSeconds ?? null, mappedMinutes: mapped.timeRemaining });
    state.before = { capturedAt: new Date().toISOString(), timer, row, mapped }; save();
  } else {
    check('Live list remaining seconds agrees with authoritative candidate timer', row.remainingSeconds > 0 &&
      Math.abs(row.remainingSeconds - timer.remainingSeconds) <= 5,
      { listSeconds: row.remainingSeconds, candidateSeconds: timer.remainingSeconds });
    check('Actual frontend mapper converts live seconds to positive whole minutes', mapped.timeRemaining === Math.ceil(row.remainingSeconds / 60) && mapped.timeRemaining > 0,
      { seconds: row.remainingSeconds, mappedMinutes: mapped.timeRemaining });
    const detail = must(await admin.get(`/api/Proctor/session/${state.sessionId}`), 'Read session detail clock');
    check('Started attempt detail and list both show remaining time', detail.attemptStatus === 'Started' && detail.remainingSeconds > 0 &&
      Math.abs(detail.remainingSeconds - row.remainingSeconds) <= 5, { status: detail.attemptStatus, detailSeconds: detail.remainingSeconds, listSeconds: row.remainingSeconds });
    await new Promise(resolve => setTimeout(resolve, 2100));
    const later = must(await admin.get(`/api/Proctor/sessions?ExamId=${state.examId}&Status=1&IncludeSamples=false`), 'Refresh running clock').items.find(x => x.id === state.sessionId);
    const observedElapsedSeconds = Math.ceil((Date.now() - listReadStartedAt) / 1000);
    check('Refreshed live clock decreases within observed request elapsed time', later.remainingSeconds < row.remainingSeconds &&
      row.remainingSeconds - later.remainingSeconds <= observedElapsedSeconds + 1,
      { first: row.remainingSeconds, later: later.remainingSeconds, observedElapsedSeconds });
    state.afterInitial = { capturedAt: new Date().toISOString(), timer, row, mapped, detailSeconds: detail.remainingSeconds, laterSeconds: later.remainingSeconds }; save();
    if (mode === 'after') {
    must(await candidate.put(`/api/Candidate/attempts/${state.attemptId}/answers`, { answers: [{ questionId: 131, selectedOptionIds: [376] }] }), 'Save ordinary answer');
    const inProgress = must(await admin.get(`/api/Proctor/sessions?ExamId=${state.examId}&Status=1&IncludeSamples=false`), 'Read in-progress clock').items.find(x => x.id === state.sessionId);
    check('Clock stays positive after first answer changes attempt to InProgress', inProgress.remainingSeconds > 0, inProgress);
    must(await candidate.post(`/api/Candidate/attempts/${state.attemptId}/submit`), 'Submit clock fixture');
    const history = must(await admin.get(`/api/Proctor/sessions?ExamId=${state.examId}&IncludeSamples=false`), 'Read terminal history').items.find(x => x.id === state.sessionId);
    check('Completed session reports zero time even with future expiry', history.status === 2 && history.remainingSeconds === 0,
      { sessionStatus: history.status, remainingSeconds: history.remainingSeconds, originalExpiresAt: timer.expiresAt });
    state.after = { capturedAt: new Date().toISOString(), timer, row, mapped, detailSeconds: detail.remainingSeconds, laterSeconds: later.remainingSeconds, history };
    state.completedAt = new Date().toISOString(); save();
    }
  }
  console.log(JSON.stringify({ mode, checks: ev.checks.length, failed: ev.checks.filter(x => !x.passed).length,
    examId: state.examId, attemptId: state.attemptId, sessionId: state.sessionId, displayedMinutes: mapped.timeRemaining }, null, 2));
  if (mode === 'fresh') await keepalive(candidate);
} catch (error) { ev.record({ error: error.message }); console.error(error.message); process.exitCode = 1; }
finally { ev.save(); }
