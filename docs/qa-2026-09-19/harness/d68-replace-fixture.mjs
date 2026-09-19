// Authorized replacement of ONLY recognized synthetic QA attempt368/chunk0.
// Preserves original local files and archives all phase12 video JSON evidence.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client, Evidence, here, must, privateConfig } from './client.mjs';
const ev = new Evidence('d68-replace-fixture');
const original = JSON.parse(fs.readFileSync(path.join(here, 'phase12-video-manifest.json'), 'utf8'));
const sourceFile = path.join(here, 'phase12-video-assets/synthetic-vp8-opus-attempt-368-video-dts-minus7ms.webm');
const bytes = fs.readFileSync(sourceFile), sha = b => crypto.createHash('sha256').update(b).digest('hex');
const out = path.join(here, 'd68-replacement-manifest.json');
if (fs.existsSync(out)) throw Error('Replacement already attempted: inspect retained state before any repeat.');
if (original.attemptId !== 368 || original.examId !== 143 || original.sizeBytes !== 230170 || original.recording.evidenceId !== 702) throw Error('Exact original QA fixture required.');
const remux = JSON.parse(fs.readFileSync(path.join(here, 'd68-remux.json'), 'utf8'));
if (remux.original.backwardsCount !== 39 || remux.variants.find(v => v.name === 'video-dts-minus7ms')?.backwardsCount !== 0) throw Error('Ordered remux evidence required.');
const archive = path.join(here, 'phase12-video-assets/before-d68-remux'); fs.mkdirSync(archive, { recursive: true });
for (const name of fs.readdirSync(here).filter(name => /^phase12-video.*\.json$/.test(name))) {
  fs.copyFileSync(path.join(here, name), path.join(archive, name), fs.constants.COPYFILE_EXCL);
}
const state = { classification: 'SYNTHETIC QA fixture correction: original ffmpeg mux incompatible with MSE block ordering; original artifacts retained. No physical capture claim.',
  attemptId: 368, examId: 143, originalEvidenceId: 702, originalSha256: original.sha256,
  originalSizeBytes: original.sizeBytes, sourceFile: path.relative(here, sourceFile), sha256: sha(bytes), sizeBytes: bytes.length,
  archive: path.relative(here, archive), startedAt: new Date().toISOString(), browserPlayback: 'pending', originalBackwardBlocks: 39, correctedBackwardBlocks: 0 };
const save = () => fs.writeFileSync(out, JSON.stringify(state, null, 2)); save();
const check = (name, passed, detail) => { ev.check(name, passed, detail); if (!passed) throw Error(name); };
const p = privateConfig();
const login = async email => { const c = new Client({ evidence: ev }); must(await c.login(email, p.users.find(x => x.email === email)?.password ?? p.password), 'Login'); return c; };
async function getBytes(client, route) {
  const response = await fetch(client.base + route, { headers: { Authorization: `Bearer ${client.token}` }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`Read stored chunk: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
try {
  const proctor = await login('qa26.eng.proctor1@example.test'), owner = await login('qa26.final.lifecycle@example.test');
  check('Uploader owns the final attempt fixture', owner.user.id === original.candidateId, { id: owner.user.id });
  const route = '/api/Proctor/video-chunks/368/chunk_000000.webm';
  const oldStored = await getBytes(proctor, route);
  check('Stored bytes are exactly the recognized original before replacement', sha(oldStored) === original.sha256 && oldStored.length === original.sizeBytes,
    { hash: sha(oldStored), bytes: oldStored.length });
  fs.writeFileSync(path.join(archive, 'original-stored-chunk_000000.webm'), oldStored, { flag: 'wx' });
  const form = new FormData(); form.append('chunk', new Blob([bytes], { type: 'video/webm' }), 'synthetic-ordered-vp8-opus.webm');
  form.append('chunkIndex', '0'); form.append('timestamp', String(Date.now())); form.append('mimeType', original.mimeType);
  state.uploadRequestedAt = new Date().toISOString(); save();
  const response = await fetch(owner.base + '/api/Proctor/video-chunk/368', { method: 'POST', headers: { Authorization: `Bearer ${owner.token}` }, body: form, signal: AbortSignal.timeout(30000) });
  const body = await response.json(); ev.record({ route: '/api/Proctor/video-chunk/368', status: response.status, body });
  check('Recognized own chunk0 replacement stored fully', response.status === 200 && body.data?.stored === true && body.data?.size === bytes.length, body);
  const readBack = await getBytes(proctor, route);
  check('Corrected stored bytes exactly match ordered remux', sha(readBack) === state.sha256 && readBack.length === bytes.length, { sha256: sha(readBack), bytes: readBack.length });
  fs.writeFileSync(path.join(here, 'phase12-video-assets/stored-vp8-opus-attempt-368-ordered.webm'), readBack, { flag: 'wx' });
  // This is exactly one intentional new recording version; never automatically repeat finalize.
  state.finalizeRequestedAt = new Date().toISOString(); save();
  const finalized = await owner.post('/api/Proctor/video-finalize/368');
  check('Corrected recording version accepted exactly once', finalized.status === 202 && finalized.data?.status === 'processing', finalized.data);
  let recording;
  for (let i = 0; i < 15; i++) {
    recording = must(await proctor.get('/api/Proctor/video-recording/368'), 'Read corrected recording metadata');
    if (recording.evidenceId !== 702 && recording.fileSize === bytes.length) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  check('One successor recording version references corrected byte size', recording.evidenceId !== 702 && recording.fileSize === bytes.length && recording.attemptId === 368, recording);
  const list = must(await proctor.get('/api/Proctor/video-chunks/368'), 'Read corrected chunk metadata');
  check('Still exactly one VP8/Opus chunk with corrected size', list.totalChunks === 1 && list.totalSizeBytes === bytes.length && list.mimeType === original.mimeType, list);
  state.recording = recording; state.completedAt = new Date().toISOString(); save();
  console.log(JSON.stringify({ attemptId: 368, evidenceId: recording.evidenceId, bytes: bytes.length, sha256: state.sha256, sourceFile: state.sourceFile, browserPlayback: 'pending' }, null, 2));
} catch (error) { state.error = error.message; save(); ev.record({ error: error.message }); console.error(error.message); process.exitCode = 1; }
finally { ev.save(); }
