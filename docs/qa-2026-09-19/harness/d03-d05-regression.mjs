import fs from 'node:fs';
import path from 'node:path';
import { adminClient, Evidence, here, must, privateConfig } from './client.mjs';

const stage = process.argv[2] ?? 'before';
const evidence = new Evidence(`d03-d05-${stage}`);
const admin = await adminClient(evidence);
const fixtureFile = path.join(here, 'd03-d05-fixtures.json');
let fixture;
if (fs.existsSync(fixtureFile)) fixture = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
else {
  fixture = {};
  for (const [name, active] of [['active', true], ['inactive', false], ['deleted', true]]) {
    fixture[name] = must(await admin.post('/api/Departments', {
      nameEn: `QA26 User Regression ${name}`, nameAr: `اختبار المستخدم ${name}`,
      code: `QA26USR${name.toUpperCase()}`, isActive: active,
    }), `create ${name} department`).id;
  }
  must(await admin.delete(`/api/Departments/${fixture.deleted}`), 'soft-delete unused department');
  fixture.user = must(await admin.post('/api/Users', {
    email: 'qa26.user-regression@example.test', password: privateConfig().password,
    fullName: 'QA26 User Regression', fullNameAr: 'مستخدم اختبار الانحدار',
    role: 'Proctor', departmentId: fixture.active,
  }), 'create baseline active user').id;
  fs.writeFileSync(fixtureFile, JSON.stringify(fixture, null, 2));
}

const beforeUser = must(await admin.get(`/api/Users/${fixture.user}`), 'read initial user');
evidence.check('D05 Arabic full name is returned independently from English',
  beforeUser.fullNameAr === 'مستخدم اختبار الانحدار', { fullName: beforeUser.fullName, fullNameAr: beforeUser.fullNameAr });

for (const [name, departmentId] of [['missing', 2147483647], ['inactive', fixture.inactive], ['deleted', fixture.deleted]]) {
  const email = `qa26.user-${stage}-${name}@example.test`;
  const created = await admin.post('/api/Users', {
    email, password: privateConfig().password, fullName: `QA26 ${stage} ${name}`,
    fullNameAr: 'اختبار منع قسم غير صالح', role: 'Proctor', departmentId,
  });
  evidence.check(`D03 create rejects ${name} department`, created.status === 400 && !created.ok, {status: created.status, message: created.body?.message});
  const lookup = await admin.get(`/api/Users/by-email/${encodeURIComponent(email)}`);
  evidence.check(`D03 rejected ${name} create left no persisted user`, lookup.status === 404);

  const previous = must(await admin.get(`/api/Users/${fixture.user}`), 'read before rejected update');
  const updated = await admin.put(`/api/Users/${fixture.user}`, { departmentId, fullName: `SHOULD NOT SAVE ${name}` });
  evidence.check(`D03 update rejects ${name} department`, updated.status === 400 && !updated.ok, {status: updated.status, message: updated.body?.message});
  const after = must(await admin.get(`/api/Users/${fixture.user}`), 'read after rejected update');
  evidence.check(`D03 rejected ${name} update preserves department and name`, after.departmentId === previous.departmentId && after.fullName === previous.fullName,
    { previousDepartment: previous.departmentId, afterDepartment: after.departmentId, fullName: after.fullName });
  if (after.departmentId !== fixture.active || after.fullName !== 'QA26 User Regression') {
    must(await admin.put(`/api/Users/${fixture.user}`, {departmentId: fixture.active, fullName: 'QA26 User Regression'}), 'restore active fixture');
  }
}

must(await admin.put(`/api/Users/${fixture.user}`, {fullName: 'QA26 User Regression', fullNameAr: 'اسم عربي معدل'}), 'update Arabic name');
const changed = must(await admin.get(`/api/Users/${fixture.user}`), 'reload Arabic change');
evidence.check('D05 Arabic update persists after new GET and leaves English independent', changed.fullNameAr === 'اسم عربي معدل' && changed.fullName === 'QA26 User Regression',
  { fullName: changed.fullName, fullNameAr: changed.fullNameAr });
const tooLong = await admin.put(`/api/Users/${fixture.user}`, {fullNameAr: 'ع'.repeat(201)});
evidence.check('D05 overlong Arabic name rejected before database write', tooLong.status === 400 && !tooLong.ok, {status: tooLong.status});
must(await admin.put(`/api/Users/${fixture.user}`, {fullNameAr: 'مستخدم اختبار الانحدار'}), 'restore Arabic fixture');

const clear = await admin.put(`/api/Users/${fixture.user}`, {clearDepartment: true});
evidence.check('D03 explicit clear-department still works', clear.ok);
evidence.check('D03 clear-department persists', must(await admin.get(`/api/Users/${fixture.user}`), 'read cleared department').departmentId === null);
must(await admin.put(`/api/Users/${fixture.user}`, {departmentId: fixture.active}), 'restore active department');
evidence.check('D03 valid active department update persists', must(await admin.get(`/api/Users/${fixture.user}`), 'read restored department').departmentId === fixture.active);
console.log(JSON.stringify({stage, checks:evidence.checks.length, passed:evidence.checks.filter(x=>x.passed).length, failed:evidence.checks.filter(x=>!x.passed).length, fixture}));
