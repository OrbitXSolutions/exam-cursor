// Normal read-only operations/audit review after the completed second load run.
import fs from 'node:fs';
import path from 'node:path';
import { Evidence, adminClient, here, must } from './client.mjs';
const e = new Evidence('phase11-final-readback');
const grants = JSON.parse(fs.readFileSync(path.join(here, 'd64-retake-grants-manifest.json'), 'utf8'));
const run = JSON.parse(fs.readFileSync(path.join(here, 'load-manifest.json'), 'utf8'));
if (grants.records.length !== 50 || run.users.length !== 50 || run.attempts.length !== 50 || run.examId !== 121) throw Error('Expected exact completed 50-candidate fixtures.');
const admin = await adminClient(e);
const data = must(await admin.get('/api/exam-operations/candidates?examId=121&search=qa26.load.&pageNumber=1&pageSize=100'), 'Read ordinary operations list');
const rows = Array.isArray(data) ? data : data.items;
e.check('Operations list contains the exact 50 grant candidates', rows.length === 50 && grants.records.every(x => rows.some(row => row.candidateId === x.candidateId)), { count: rows.length });
const observed = grants.records.map(grant => {
  const user = run.users.find(x => x.id === grant.candidateId);
  const current = run.attempts.find(x => x.n === user?.n);
  const row = rows.find(x => x.candidateId === grant.candidateId);
  // Existing business rule consumes an override only when ordinary allowance was exhausted.
  const expectedPending = grant.totalAttemptsBefore >= grants.maxAttemptsBefore ? 0 : 1;
  e.check(`Candidate ${grant.n}: one new submitted attempt, unchanged limit and expected override consumption`,
    !!row && !!current && row.examId === 121 && row.latestAttemptId === current.attemptId &&
    row.latestAttemptId !== grant.previousAttemptId && row.latestAttemptStatus === 'Submitted' &&
    row.totalAttempts === grant.totalAttemptsBefore + 1 && row.maxAttempts === grants.maxAttemptsBefore &&
    row.hasActiveAttempt === false && row.pendingOverrides === expectedPending,
    { row, previousAttemptId: grant.previousAttemptId, totalAttemptsBefore: grant.totalAttemptsBefore, expectedPending });
  return { n: grant.n, candidateId: grant.candidateId, overrideId: grant.grant.overrideId,
    previousAttemptId: grant.previousAttemptId, latestAttemptId: row?.latestAttemptId,
    attemptsBefore: grant.totalAttemptsBefore, attemptsAfter: row?.totalAttempts,
    pendingOverrides: row?.pendingOverrides, expectedPending };
});
const auditRoute = '/api/Audit/logs?action=AttemptControl.AddTime&entityName=Attempt&entityId=317&pageNumber=1&pageSize=100';
const audit = must(await admin.get(auditRoute), 'Read exact Attempt317 AddTime audit');
const auditRows = Array.isArray(audit) ? audit : audit.items;
e.check('Successful load AddTime317 has a persisted AttemptControl.AddTime audit record', auditRows.length > 0, { totalCount: audit.totalCount ?? auditRows.length, rows: auditRows });
const history = must(await admin.get('/api/Audit/entity-history?entityName=Attempt&entityId=317&pageNumber=1&pageSize=100'), 'Read Attempt317 audit history');
const summary = { at: new Date().toISOString(), observedCandidates: observed.length,
  consumedAtExhaustedLimit: observed.filter(x => x.expectedPending === 0 && x.pendingOverrides === 0).length,
  retainedBecauseOrdinaryAttemptAvailable: observed.filter(x => x.expectedPending === 1 && x.pendingOverrides === 1).length,
  audit317AddTimeRows: auditRows.length, history, observed,
  limitation: 'Normal API counts establish consumption/remaining allowance; no extra attempt was started and no override was deleted.' };
e.record({ summary });
fs.writeFileSync(path.join(here, 'phase11-final-readback-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ candidates: observed.length, consumed: summary.consumedAtExhaustedLimit,
  unusedOrdinaryAllowance: summary.retainedBecauseOrdinaryAttemptAvailable, addTimeAuditRows: auditRows.length,
  checks: e.checks.length, failed: e.checks.filter(x => !x.passed).map(x => x.name) }, null, 2));
