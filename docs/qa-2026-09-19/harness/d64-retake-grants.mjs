// Ordinary, authorized QA fixture preparation only; never starts attempts.
// Run only after environment releases its sampler/cleanup window:
// $env:QA_D64_GRANTS_EXECUTE='recovery-complete'
// node docs/qa-2026-09-19/harness/d64-retake-grants.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Evidence, here, seedCredential, redact } from './client.mjs';

if (process.env.QA_D64_GRANTS_EXECUTE !== 'recovery-complete') {
  throw new Error('Wait for explicit environment recovery/cleanup completion, then set QA_D64_GRANTS_EXECUTE=recovery-complete.');
}
const sourceName = 'load-d62-after-d64-before-manifest.json';
const sourceBytes = fs.readFileSync(path.join(here, sourceName));
const source = JSON.parse(sourceBytes);
const sourceSha256 = crypto.createHash('sha256').update(sourceBytes).digest('hex');
const examId = 121;
const reason = 'QA26 D64 concurrency regression retake';
if (source.examId !== examId || source.count !== 50 || source.users?.length !== 50 || source.attempts?.length !== 50) {
  throw new Error('Source manifest must contain exactly 50 users/attempts for exam 121.');
}
const targets = source.users.map(user => {
  const matches = source.attempts.filter(x => x.n === user.n);
  if (matches.length !== 1) throw new Error(`Candidate ${user.n} does not map to exactly one source attempt.`);
  return { n: user.n, candidateId: user.id, email: user.email, previousAttemptId: matches[0].attemptId };
}).sort((a, b) => a.n - b.n);
if (new Set(targets.map(x => x.candidateId)).size !== 50 || new Set(targets.map(x => x.previousAttemptId)).size !== 50) {
  throw new Error('Source identities/attempts are not 50 distinct records.');
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidence = new Evidence(`d64-retake-grants-${stamp}`);
const outputPath = path.join(here, 'd64-retake-grants-manifest.json');
let state = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : {
  classification: 'SIMULATED functional fixture workflow: actual HTTP plus persisted-state readback; no candidate start or physical test',
  sourceName, sourceSha256, examId, reason, startedAt: new Date().toISOString(), records: [], rateLimitObservations: [],
};
if (state.sourceSha256 !== sourceSha256 || state.examId !== examId || state.reason !== reason) throw new Error('Saved grant state does not match this authorized source.');
if (state.completedAt) throw new Error('These 50 grants were already completed; no new grants were sent.');
if (state.pendingWrite) throw new Error('An earlier write has uncertain outcome; reconcile its retained response/log evidence before resuming.');
const persist = () => fs.writeFileSync(outputPath, JSON.stringify(redact(state), null, 2));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const base = (process.env.QA_API_URL ?? 'http://localhost:5221').replace(/\/$/, '');
let token;
let nextRequestAt = 0;
async function pacedRequest(method, route, body) {
  for (let retry = 0; retry < 4; retry++) {
    await sleep(Math.max(0, nextRequestAt - Date.now()));
    nextRequestAt = Date.now() + 1300;
    const started = performance.now();
    const response = await fetch(`${base}${route}`, {
      method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000),
    });
    const raw = await response.text();
    let payload;
    try { payload = JSON.parse(raw); } catch { payload = raw; }
    const result = { status: response.status, ok: response.ok && payload?.success !== false,
      data: payload?.data, body: payload, ms: Math.round((performance.now() - started) * 100) / 100,
      retryAfter: response.headers.get('retry-after') };
    evidence.record({ identity: token ? 'SuperAdmin' : 'login', method, route, request: body, response: result });
    if (response.status !== 429) return result;
    const retryHeader = result.retryAfter;
    const seconds = Number(retryHeader);
    const delay = retryHeader && Number.isFinite(seconds) ? seconds * 1000 + 1000
      : retryHeader && Number.isFinite(Date.parse(retryHeader)) ? Math.max(1000, Date.parse(retryHeader) - Date.now() + 1000) : 61000;
    state.rateLimitObservations.push({ at: new Date().toISOString(), method, route, retryAfter: retryHeader, waitMs: delay }); persist();
    console.log(`SETUP RATE LIMIT: ${method} ${route}; honoring Retry-After with ${delay}ms wait.`);
    for (let remaining = delay; remaining > 0; remaining -= 30000) await sleep(Math.min(remaining, 30000));
  }
  throw new Error(`Rate limit persisted after four paced attempts: ${route}`);
}
function requireResponse(result, context) {
  if (!result.ok) throw new Error(`${context}: HTTP ${result.status}; ${result.body?.message ?? String(result.body)}`);
  return result.data;
}
function assert(name, passed, detail) {
  evidence.check(name, passed, detail);
  if (!passed) throw new Error(name);
}
const operationRows = async () => {
  const data = requireResponse(await pacedRequest('GET', `/api/exam-operations/candidates?examId=121&search=qa26.load.&pageNumber=1&pageSize=100`), 'Read load candidates');
  const rows = Array.isArray(data) ? data : data.items;
  assert('Operations query includes exactly the 50 source candidates', Array.isArray(rows) && rows.length === 50 &&
    targets.every(x => rows.some(row => row.candidateId === x.candidateId && row.examId === examId)),
    { count: rows?.length, candidateIds: rows?.map(x => x.candidateId) });
  return rows;
};

try {
  persist();
  const auth = requireResponse(await pacedRequest('POST', '/api/Auth/login', seedCredential()), 'SuperAdmin login');
  if (!auth.accessToken) throw new Error('SuperAdmin login returned no access token.');
  token = auth.accessToken;
  const exam = requireResponse(await pacedRequest('GET', '/api/Assessment/exams/121'), 'Read unchanged exam limit');
  if (state.maxAttemptsBefore !== undefined) assert('Exam maxAttempts matches original preparation read', exam.maxAttempts === state.maxAttemptsBefore, { actual: exam.maxAttempts, expected: state.maxAttemptsBefore });
  else state.maxAttemptsBefore = exam.maxAttempts;
  const before = await operationRows();
  state.operationsBefore ??= before;
  persist();

  // Verify every named previous attempt before performing any grant in this run.
  for (const target of targets) {
    const previous = requireResponse(await pacedRequest('GET', `/api/Attempt/${target.previousAttemptId}`), 'Read source previous attempt');
    assert(`Preflight ${target.n}: source attempt belongs to candidate/exam121 and is Submitted or Expired`,
      previous.id === target.previousAttemptId && previous.examId === examId && previous.candidateId === target.candidateId &&
      [3, 4].includes(previous.status), { target, previous });
    const row = before.find(x => x.candidateId === target.candidateId);
    const saved = state.records.find(x => x.candidateId === target.candidateId);
    assert(`Preflight ${target.n}: no active attempt and expected pending-override count`, row.hasActiveAttempt === false &&
      row.pendingOverrides === (saved?.grant ? 1 : 0) && row.latestAttemptId === target.previousAttemptId,
      { candidateId: target.candidateId, hasActiveAttempt: row.hasActiveAttempt, pendingOverrides: row.pendingOverrides,
        latestAttemptId: row.latestAttemptId });
    if (saved) saved.previousAttempt = previous;
    else state.records.push({ ...target, previousAttempt: previous, totalAttemptsBefore: row.totalAttempts });
    persist();
  }
  state.preflightCompletedAt = new Date().toISOString(); persist();
  console.log('All 50 source attempts are verified terminal and owned. Beginning paced one-per-candidate grants.');

  for (const target of targets) {
    const record = state.records.find(x => x.candidateId === target.candidateId);
    if (!record.grant) {
      const body = { candidateId: target.candidateId, examId, reason };
      state.pendingWrite = { ...target, requestedAt: new Date().toISOString() }; persist();
      const result = await pacedRequest('POST', '/api/exam-operations/allow-new-attempt', body);
      // Only middleware 429 is retried above. Other failed/uncertain writes stop for reconciliation.
      const grant = requireResponse(result, `Grant candidate ${target.n}`);
      record.grant = grant; record.grantedAt = new Date().toISOString(); delete state.pendingWrite; persist();
      assert(`Grant ${target.n}: exact candidate/exam override returned`, grant.candidateId === target.candidateId &&
        grant.examId === examId && Number.isInteger(grant.overrideId) && grant.overrideId > 0, grant);
    }
    const logs = requireResponse(await pacedRequest('GET', `/api/exam-operations/logs?candidateId=${encodeURIComponent(target.candidateId)}&examId=121`), 'Read grant audit');
    const matching = logs.filter(x => x.actionType === 'AllowNewAttemptOverride' && x.candidateId === target.candidateId &&
      x.examId === examId && x.reason === reason);
    assert(`Grant ${target.n}: one matching persisted audit record`, matching.length === 1, matching);
    record.audit = matching[0]; persist();
    console.log(`GRANTED AND AUDITED ${state.records.filter(x => x.grant && x.audit).length}/50`);
  }
  const finalRows = await operationRows();
  state.finalRecords = targets.map(target => {
    const row = finalRows.find(x => x.candidateId === target.candidateId);
    const record = state.records.find(x => x.candidateId === target.candidateId);
    assert(`Final ${target.n}: exactly one unused override, no new attempt, history and limit preserved`,
      row.pendingOverrides === 1 && row.hasActiveAttempt === false && row.totalAttempts === record.totalAttemptsBefore &&
      row.latestAttemptId === target.previousAttemptId && row.maxAttempts === state.maxAttemptsBefore, row);
    return { ...target, overrideId: record.grant.overrideId, auditId: record.audit.id, ...row };
  });
  const examAfter = requireResponse(await pacedRequest('GET', '/api/Assessment/exams/121'), 'Read final unchanged exam limit');
  assert('Exam maxAttempts remains unchanged after all grants', examAfter.maxAttempts === state.maxAttemptsBefore,
    { before: state.maxAttemptsBefore, after: examAfter.maxAttempts });
  assert('Exactly 50 distinct grant IDs and 50 final records retained', state.finalRecords.length === 50 &&
    new Set(state.records.map(x => x.grant.overrideId)).size === 50, { count: state.finalRecords.length });
  state.completedAt = new Date().toISOString(); state.noAttemptsStarted = true; persist();
  evidence.record({ summary: { completedAt: state.completedAt, grants: 50, finalRecords: 50,
    examId, maxAttemptsUnchanged: state.maxAttemptsBefore, rateLimitResponses: state.rateLimitObservations.length,
    noAttemptsStarted: true, sourceName, sourceSha256 } });
  console.log(JSON.stringify({ result: '50 grants completed and persisted', manifest: path.basename(outputPath),
    evidence: `${evidence.name}.json`, noAttemptsStarted: true, rateLimitResponses: state.rateLimitObservations.length }, null, 2));
} catch (error) {
  state.lastError = { at: new Date().toISOString(), message: error.message }; persist();
  evidence.record({ error: error.message, pendingWrite: state.pendingWrite ?? null });
  console.error(error.message); process.exitCode = 1;
} finally {
  evidence.save();
  fs.copyFileSync(path.join(here, `${evidence.name}.json`), path.join(here, 'd64-retake-grants-evidence.json'));
}
