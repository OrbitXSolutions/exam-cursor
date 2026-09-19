// PREPARED ONLY by the author. Run only after measured load has finished and the
// final browser attemptId is saved by phase12-final.mjs checkpoint.
// PowerShell: $env:QA_PHASE12_VIDEO_EXECUTE='after-load'
// node docs/qa-2026-09-19/harness/phase12-video.mjs run
// Use "verify" to repeat only authenticated reads and local decode checks.
// Generated test-pattern video + tone are SYNTHETIC. No camera/mic/screen capture.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Client, Evidence, adminClient, here, must, privateConfig, redact } from './client.mjs';

const mode = process.argv[2];
if (!['run', 'verify'].includes(mode) || process.env.QA_PHASE12_VIDEO_EXECUTE !== 'after-load') {
  console.log('Prepared only. After load and final browser checkpoint, set QA_PHASE12_VIDEO_EXECUTE=after-load and use run or verify.');
  process.exit(0);
}
const read = name => JSON.parse(fs.readFileSync(path.join(here, name), 'utf8'));
const load = read('load-manifest.json');
if (!load.completedAt || Date.parse(load.completedAt) < Date.parse(load.startedAt)) {
  throw new Error('Measured load must finish before this media test.');
}
const fixture = read('phase12-final-manifest.json');
if (fixture.candidate?.email !== 'qa26.final.lifecycle@example.test' ||
    !fixture.candidate.id || !Number.isSafeInteger(fixture.attemptId) || fixture.attemptId < 1 ||
    !Number.isSafeInteger(fixture.examId)) {
  throw new Error('Final fixture identity and browser attemptId must be recorded by phase12 checkpoint.');
}
const { attemptId, examId, candidate } = fixture;
const classification = 'SYNTHETIC CAPTURE TEST: locally generated 8-second animated test pattern and tone; actual authenticated upload, storage and finalization; no physical camera, microphone or screen capture. Browser playback requires separate evidence.';
const statePath = path.join(here, 'phase12-video-manifest.json');
const mediaDir = path.join(here, 'phase12-video-assets');
const clipPath = path.join(mediaDir, `synthetic-vp8-opus-attempt-${attemptId}.webm`);
const servedPath = path.join(mediaDir, `stored-vp8-opus-attempt-${attemptId}.webm`);
const mimeType = 'video/webm; codecs="vp8, opus"';
const ffmpeg = process.env.QA_FFMPEG_PATH ?? 'C:/Users/abdal/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const ffprobe = process.env.QA_FFPROBE_PATH ?? 'C:/Users/abdal/AppData/Local/Microsoft/WinGet/Links/ffprobe.exe';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
class VideoEvidence extends Evidence {
  save() { fs.writeFileSync(path.join(here, `${this.name}.json`), JSON.stringify({
    classification, mode, startedAt: this.startedAt, checks: this.checks, events: this.events,
  }, null, 2)); }
}
const evidence = new VideoEvidence(`phase12-video-${mode}-${stamp}`);
let state = fs.existsSync(statePath) ? read('phase12-video-manifest.json') : {
  classification, attemptId, examId, candidateId: candidate.id, createdAt: new Date().toISOString(),
};
if (state.attemptId !== attemptId || state.examId !== examId || state.candidateId !== candidate.id) {
  throw new Error('Existing video state belongs to a different final fixture; it will not be overwritten.');
}
const saveState = () => fs.writeFileSync(statePath, JSON.stringify(redact(state), null, 2));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function check(name, passed, detail) {
  evidence.check(name, passed, detail);
  if (!passed) throw new Error(name);
}
function localTool(executable, args) {
  const result = spawnSync(executable, args, { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`Media tool failed: ${result.error?.message ?? result.stderr?.slice(-3000) ?? result.status}`);
  return result.stdout;
}
function probeAndDecode(file, label) {
  const probe = JSON.parse(localTool(ffprobe, ['-v', 'error', '-show_entries',
    'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', file]));
  const video = probe.streams.find(s => s.codec_type === 'video');
  const audio = probe.streams.find(s => s.codec_type === 'audio');
  const duration = Number(probe.format.duration);
  check(`${label}: valid 8-second 320x240 VP8/Opus WebM`, video?.codec_name === 'vp8' &&
    video.width === 320 && video.height === 240 && audio?.codec_name === 'opus' &&
    duration >= 7.9 && duration <= 8.2, probe);
  localTool(ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
  check(`${label}: complete local audio/video decode succeeds`, true, { file: path.basename(file), duration });
  return probe;
}
async function optionalRecording(admin) {
  const result = await admin.get(`/api/Proctor/video-recording/${attemptId}`);
  if (result.status === 404) return null; // Ordinary absence while finalization is pending.
  return must(result, 'Read own final recording');
}
async function download(admin, filename) {
  const route = `/api/Proctor/video-chunks/${attemptId}/${filename}`;
  const response = await fetch(admin.base + route, {
    headers: { Authorization: `Bearer ${admin.token}` }, signal: AbortSignal.timeout(30000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  evidence.record({ method: 'GET', route, status: response.status,
    contentType: response.headers.get('content-type'), bytes: bytes.length, sha256: hash(bytes) });
  check('Stored chunk retrieval succeeds with video/webm', response.ok &&
    response.headers.get('content-type')?.startsWith('video/webm'), { status: response.status });
  return bytes;
}

try {
  check('FFmpeg and FFprobe are available locally', fs.existsSync(ffmpeg) && fs.existsSync(ffprobe));
  const admin = await adminClient(evidence);
  const detail = must(await admin.get(`/api/Attempt/${attemptId}/details`), 'Read selected final attempt');
  check('Selected browser attempt belongs to final candidate and exam', detail.id === attemptId &&
    detail.examId === examId && detail.candidateId === candidate.id,
    { attemptId: detail.id, examId: detail.examId, candidateId: detail.candidateId, status: detail.status });
  const session = must(await admin.get(`/api/Proctor/session/attempt/${attemptId}`), 'Read final proctor session');
  const sessionId = session.proctorSessionId ?? session.id;
  check('Final attempt has a persisted proctor session', Number.isSafeInteger(sessionId) && sessionId > 0,
    { sessionId, attemptId: session.attemptId });
  let listResult = await admin.get(`/api/Proctor/video-chunks/${attemptId}`);
  if (!listResult.ok && listResult.status !== 404) must(listResult, 'Read existing chunks');
  if (listResult.ok && !state.sha256) throw new Error('Final attempt already has unrecognized media; refusing to overwrite it.');
  if (mode === 'verify' && (!state.sha256 || !fs.existsSync(clipPath))) throw new Error('Run mode must prepare and upload the synthetic fixture first.');

  if (mode === 'run' && !fs.existsSync(clipPath)) {
    if (state.sha256) throw new Error('Previously generated source clip is missing; refusing to replace the evidence.');
    fs.mkdirSync(mediaDir, { recursive: true });
    localTool(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n',
      '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=15',
      '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
      '-map', '0:v:0', '-map', '1:a:0', '-t', '8',
      '-c:v', 'libvpx', '-b:v', '180k', '-deadline', 'realtime', '-cpu-used', '5', '-g', '15', '-pix_fmt', 'yuv420p',
      '-c:a', 'libopus', '-b:a', '32k', '-af', 'volume=0.08',
      '-metadata', 'title=QA26 SYNTHETIC TEST PATTERN - NO PHYSICAL CAPTURE',
      '-cluster_time_limit', '1000', '-f', 'webm', clipPath]);
  }
  const source = fs.readFileSync(clipPath);
  check('Synthetic clip is nonempty and below 10 MB upload limit', source.length > 0 && source.length < 10 * 1024 * 1024,
    { bytes: source.length, sha256: hash(source) });
  if (state.sha256) check('Source clip still matches saved evidence hash', state.sha256 === hash(source));
  state.sha256 = hash(source); state.sizeBytes = source.length; state.mimeType = mimeType;
  state.sourceFile = path.relative(here, clipPath); state.sourceProbe = probeAndDecode(clipPath, 'Source'); saveState();

  if (mode === 'run' && !listResult.ok) {
    const privateData = privateConfig();
    const owner = new Client({ evidence });
    must(await owner.login(candidate.email, privateData.users.find(u => u.email === candidate.email)?.password ?? privateData.password), 'Final candidate login');
    check('Uploader is the final candidate', owner.user?.id === candidate.id, { id: owner.user?.id, email: candidate.email });
    const config = must(await owner.get('/api/Proctor/video-config'), 'Read recording feature flag');
    check('Video recording is enabled', config.enableVideoRecording === true);
    const form = new FormData();
    form.append('chunk', new Blob([source], { type: 'video/webm' }), 'synthetic-vp8-opus.webm');
    form.append('chunkIndex', '0'); form.append('timestamp', String(Date.now())); form.append('mimeType', mimeType);
    const route = `/api/Proctor/video-chunk/${attemptId}`;
    const response = await fetch(owner.base + route, { method: 'POST', headers: { Authorization: `Bearer ${owner.token}` },
      body: form, signal: AbortSignal.timeout(30000) });
    const body = await response.json();
    evidence.record({ identity: candidate.email, method: 'POST multipart', route,
      request: { chunkIndex: 0, mimeType, sizeBytes: source.length, sha256: state.sha256 }, status: response.status, body });
    check('Candidate upload stores the complete synthetic chunk', response.status === 200 && body.success === true &&
      body.data?.stored === true && body.data?.chunkIndex === 0 && body.data?.size === source.length, body);
    state.uploadedAt = new Date().toISOString(); saveState();
    listResult = await admin.get(`/api/Proctor/video-chunks/${attemptId}`);
  }
  const chunks = must(listResult, 'Read persisted chunk list');
  check('Chunk list retains exact file name, byte size and codec metadata', chunks.attemptId === attemptId &&
    chunks.totalChunks === 1 && chunks.chunks?.length === 1 && chunks.totalSizeBytes === source.length &&
    chunks.chunks[0].filename === 'chunk_000000.webm' && chunks.chunks[0].sizeBytes === source.length && chunks.mimeType === mimeType, chunks);
  const stored = await download(admin, chunks.chunks[0].filename);
  check('Stored chunk bytes match source SHA-256 exactly', hash(stored) === state.sha256 && stored.length === source.length,
    { sourceSha256: state.sha256, storedSha256: hash(stored), bytes: stored.length });
  fs.writeFileSync(servedPath, stored);
  state.storedProbe = probeAndDecode(servedPath, 'Stored download'); saveState();

  let recording = await optionalRecording(admin);
  if (!recording && mode === 'run' && !state.finalizeRequestedAt) {
    const privateData = privateConfig();
    const owner = new Client({ evidence });
    must(await owner.login(candidate.email, privateData.users.find(u => u.email === candidate.email)?.password ?? privateData.password), 'Final candidate finalize login');
    // Write intent before sending so an interrupted run never blindly queues duplicate evidence records.
    state.finalizeRequestedAt = new Date().toISOString(); saveState();
    const result = await owner.post(`/api/Proctor/video-finalize/${attemptId}`);
    const accepted = must(result, 'Finalize synthetic video');
    check('Finalization accepts one chunk for asynchronous processing', result.status === 202 &&
      accepted.attemptId === attemptId && accepted.chunkCount === 1 && accepted.status === 'processing', accepted);
    state.finalizeAcceptedAt = new Date().toISOString(); saveState();
  }
  const deadline = Date.now() + 30000;
  while (!recording && Date.now() < deadline) {
    await delay(1000);
    recording = await optionalRecording(admin);
  }
  check('Background finalization creates retrievable recording metadata', !!recording, { timeoutSeconds: 30 });
  check('Recording metadata matches final attempt, stored bytes and chunk playback contract',
    recording.attemptId === attemptId && recording.fileSize === source.length && recording.contentType === 'video/webm' &&
    recording.chunksUrl === `/api/Proctor/video-chunks/${attemptId}` && recording.videoUrl === null &&
    Number.isSafeInteger(recording.evidenceId) && recording.evidenceId > 0, recording);
  const sessionEvidence = must(await admin.get(`/api/Proctor/session/${sessionId}/evidence`), 'Read persisted proctor evidence');
  const row = sessionEvidence.find(item => item.id === recording.evidenceId);
  check('Recording is attached to the final proctor session with persisted byte metadata', row?.attemptId === attemptId &&
    row.proctorSessionId === sessionId && row.isUploaded === true && row.fileSize === source.length &&
    row.fileName === `chunks_${attemptId}` && row.contentType === 'video/webm', row);
  state.recording = recording; state.proctorSessionId = sessionId; state.verifiedAt = new Date().toISOString();
  state.browserPlayback = { status: 'pending separate real-browser observation',
    path: `/proctor-center/video/${encodeURIComponent(candidate.id)}?attemptId=${attemptId}`,
    expected: 'Animated color test pattern; about 8 seconds; play advances time; pause/seek/replay work. Audio is a quiet synthetic 440 Hz tone.',
    classification: 'Playback of synthetic fixture only; no physical device capture claim.' };
  state.durationInterpretation = { decodedSeconds: Number(state.storedProbe.format.duration),
    recordingMetadataSeconds: recording.duration, chunkEstimateSeconds: chunks.totalChunks * chunks.chunkDurationMs / 1000,
    note: 'Backend recording duration is attempt elapsed time; chunk metadata assumes 3 seconds each. Player should replace the estimate with actual decoded duration after MSE endOfStream.' };
  saveState(); evidence.record({ summary: state });
  console.log(JSON.stringify({ classification, attemptId, evidenceId: recording.evidenceId,
    sourceBytes: source.length, sha256: state.sha256, decodedSeconds: Number(state.storedProbe.format.duration),
    browserPlayback: state.browserPlayback, evidence: `${evidence.name}.json` }, null, 2));
} catch (error) {
  evidence.record({ error: error.message }); console.error(error.message); process.exitCode = 1;
} finally {
  evidence.save();
  fs.copyFileSync(path.join(here, `${evidence.name}.json`), path.join(here, 'phase12-video-evidence.json'));
}
