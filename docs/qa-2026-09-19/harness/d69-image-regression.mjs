// One ordinary synthetic Image(3) upload in an isolated assigned QA attempt.
// Does not modify the completed final lifecycle fixture or exercise type4 upload.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client, Evidence, here, must, privateConfig, redact } from './client.mjs';
const ev = new Evidence('d69-image-regression'), p = privateConfig();
const statePath = path.join(here, 'd69-image-regression-manifest.json');
if (fs.existsSync(statePath)) throw Error('Existing image regression state: inspect it rather than duplicating uploads or attempts.');
const state = { classification: 'SYNTHETIC IMAGE: locally drawn test pattern and text; no physical capture.', createdAt: new Date().toISOString(), type4: 'Source inspected only; no implemented normal upload/download integration for type4 used.' };
const save = () => fs.writeFileSync(statePath, JSON.stringify(redact(state), null, 2));
const check = (name, passed, detail) => { ev.check(name, passed, detail); if (!passed) throw Error(name); };
const login = async email => { const client = new Client({ evidence: ev }); must(await client.login(email, p.users.find(x => x.email === email)?.password ?? p.password), 'QA login'); return client; };
let candidate;
try {
  const admin = await login('qa26.eng.admin1@example.test');
  candidate = await login('qa26.eng.candidate3@example.test');
  const proctor = await login('qa26.eng.proctor1@example.test');
  const source = fs.readFileSync(path.join(here, 'd69-synthetic-image.png'));
  const hash = b => crypto.createHash('sha256').update(b).digest('hex');
  check('Synthetic source is a 320x240 PNG', source.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' && source.readUInt32BE(16) === 320 && source.readUInt32BE(20) === 240, { bytes: source.length, sha256: hash(source) });
  const template = JSON.parse(fs.readFileSync(path.join(here, 'exam-manifest.json'), 'utf8')).exams.find(x => x.key === 'auto');
  const request = { ...template.request, departmentId: 8, titleEn: 'QA26 D69 Synthetic Image Regression', titleAr: 'اختبار صورة اصطناعية QA26', startAt: new Date(Date.now()-60000).toISOString(), endAt: new Date(Date.now()+3600000).toISOString(), durationMinutes: 10, maxAttempts: 1, passScore: 5, requireProctoring: true, requireIdVerification: false, requireWebcam: false, enableScreenMonitoring: false, screenMonitoringMode: 0 };
  const exam = must(await admin.post('/api/Assessment/exams', request), 'Create isolated QA image exam');
  Object.assign(state, { examId: exam.id, candidateId: candidate.user.id, candidateEmail: candidate.identity, imageSha256: hash(source), imageBytes: source.length }); save();
  const section = must(await admin.post(`/api/Assessment/exams/${exam.id}/sections`, { titleEn: 'Image regression', titleAr: 'اختبار الصورة', order: 1 }), 'Create section');
  must(await admin.post(`/api/Assessment/sections/${section.id}/questions/bulk`, { questionIds: [131], useOriginalPoints: true, markAsRequired: true }), 'Add ordinary QA question');
  must(await admin.put(`/api/Assessment/exams/${exam.id}/access-policy`, { isPublic: false, restrictToAssignedCandidates: true, isWalkIn: false, accessCode: null }), 'Assigned-only access');
  must(await admin.post(`/api/Assessment/exams/${exam.id}/publish`), 'Publish isolated QA exam');
  const roster = must(await admin.get(`/api/ExamProctor/${exam.id}`), 'Read proctor roster');
  if (!roster.assignedProctors?.some(x => x.id === proctor.user.id)) must(await admin.post('/api/ExamProctor/assign', { examId: exam.id, proctorIds: [proctor.user.id] }), 'Assign QA proctor');
  must(await admin.post('/api/Assignments/assign', { examId: exam.id, candidateIds: [candidate.user.id], scheduleFrom: request.startAt, scheduleTo: request.endAt }), 'Assign isolated QA candidate');
  const started = must(await candidate.post(`/api/Candidate/exams/${exam.id}/start`, {}), 'Start normal QA image attempt');
  state.attemptId = started.attemptId; save();
  const session = must(await candidate.get(`/api/Proctor/session/attempt/${state.attemptId}`), 'Read own session');
  state.sessionId = session.id; save();
  must(await candidate.post('/api/Proctor/heartbeat', { proctorSessionId: state.sessionId, clientTimestamp: new Date().toISOString() }), 'Own active heartbeat');
  state.uploadRequestedAt = new Date().toISOString(); save();
  const image = must(await candidate.upload(`/api/Proctor/snapshot/${state.attemptId}`, source, 'QA26-SYNTHETIC-NO-PHYSICAL-CAPTURE.png', 'image/png'), 'Upload one ordinary synthetic snapshot');
  Object.assign(state, { evidenceId: image.id, sessionId: image.proctorSessionId }); save();
  check('Image3 snapshot persisted for the isolated own attempt', image.type === 3 && image.typeName === 'Image' && image.attemptId === state.attemptId && image.fileSize === source.length && image.contentType === 'image/png' && image.isUploaded, image);
  const persisted = must(await proctor.get(`/api/Proctor/session/${state.sessionId}/evidence`), 'Read persisted image evidence');
  check('Assigned proctor sees exactly one uploaded Image3', persisted.length === 1 && persisted[0].id === image.id && persisted[0].type === 3 && persisted[0].previewUrl === `/api/Proctor/evidence/${image.id}/download`, persisted);
  const response = await fetch(proctor.base + image.previewUrl, { headers: { Authorization: `Bearer ${proctor.token}` }, signal: AbortSignal.timeout(30000) });
  const stored = Buffer.from(await response.arrayBuffer());
  check('Authorized image download retains exact PNG bytes', response.status === 200 && response.headers.get('content-type')?.startsWith('image/png') && stored.length === source.length && hash(stored) === state.imageSha256, { status: response.status, bytes: stored.length, sha256: hash(stored) });
  fs.writeFileSync(path.join(here, 'd69-stored-image.png'), stored, { flag: 'wx' });
  must(await candidate.put(`/api/Candidate/attempts/${state.attemptId}/answers`, { answers: [{ questionId: 131, selectedOptionIds: [376] }] }), 'Save ordinary answer');
  const submitted = must(await candidate.post(`/api/Candidate/attempts/${state.attemptId}/submit`), 'Normally complete isolated image fixture');
  state.submitted = submitted; state.completedAt = new Date().toISOString(); save();
  const history = must(await proctor.get(`/api/Proctor/session/${state.sessionId}`), 'Read completed image session');
  check('Image fixture completes normally', history.status === 2 && history.attemptId === state.attemptId, { status: history.status, attemptId: history.attemptId });
  state.browserUrl = `/proctor-center/video/${state.candidateId}?attemptId=${state.attemptId}`; save();
  console.log(JSON.stringify({ ...state, submitted: undefined }, null, 2));
} catch (error) { ev.record({ error: error.message }); console.error(error.message); process.exitCode = 1; }
finally { ev.save(); }
