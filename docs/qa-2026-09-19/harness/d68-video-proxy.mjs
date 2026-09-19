// Ordinary authorized reads of the exact final synthetic video fixture.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client, Evidence, here, must, privateConfig } from './client.mjs';
const ev = new Evidence('d68-video-proxy');
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'phase12-video-manifest.json'), 'utf8'));
if (manifest.attemptId !== 368 || manifest.examId !== 143) throw Error('Expected exact final fixture 368/143.');
const p = privateConfig(), proctor = new Client({ evidence: ev });
const email = 'qa26.eng.proctor1@example.test';
must(await proctor.login(email, p.users.find(x => x.email === email)?.password ?? p.password), 'Engineering proctor login');
const frontend = process.env.QA_FRONTEND_URL ?? 'http://localhost:3000';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const list = must(await proctor.get('/api/Proctor/video-chunks/368'), 'Read exact final chunk list');
ev.check('Fixture chunk list matches recorded upload', list.totalChunks === 1 && list.totalSizeBytes === manifest.sizeBytes && list.chunks[0].filename === 'chunk_000000.webm', list);
for (const [name, base, route, queryAuth] of [
  ['backend chunk', proctor.base, '/api/Proctor/video-chunks/368/chunk_000000.webm', false],
  ['frontend list', frontend, '/api/video-chunks/368', true],
  ['frontend chunk', frontend, '/api/video-chunks/368/chunk_000000.webm', true],
]) {
  const started = performance.now();
  try {
    const url = `${base}${route}${queryAuth ? `?token=${encodeURIComponent(proctor.token)}` : ''}`;
    const response = await fetch(url, { headers: queryAuth ? {} : { Authorization: `Bearer ${proctor.token}` }, signal: AbortSignal.timeout(30000) });
    const data = Buffer.from(await response.arrayBuffer());
    const summary = { name, route, status: response.status, contentType: response.headers.get('content-type'),
      declaredBytes: response.headers.get('content-length'), actualBytes: data.length, sha256: hash(data),
      elapsedMs: Math.round(performance.now() - started), redirected: response.redirected };
    if (name.includes('list') || !response.ok) summary.body = data.toString().slice(0, 1500);
    ev.record(summary); console.log(JSON.stringify(summary));
    if (name.includes('chunk')) ev.check(`${name} delivers exact uploaded WebM bytes`, response.status === 200 && data.length === manifest.sizeBytes && hash(data) === manifest.sha256, summary);
    else ev.check('Frontend list returns expected exact fixture', response.status === 200 && JSON.parse(data).data?.attemptId === 368, summary);
  } catch (error) { ev.check(`${name} read succeeds`, false, { error: error.message }); console.error(name, error.message); }
}
if (ev.checks.some(x => !x.passed)) process.exitCode = 1;
ev.save();
