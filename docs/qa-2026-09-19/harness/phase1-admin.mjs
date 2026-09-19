import fs from 'node:fs';
import path from 'node:path';
import { Client, Evidence, adminClient, here, must, privateConfig, savePrivate } from './client.mjs';

const evidence = new Evidence('phase1-admin-evidence');
const privateData = privateConfig();
const manifest = { departments: [], users: [], deletedFixtures: [] };
const save = () => fs.writeFileSync(path.join(here, 'data-manifest.json'), JSON.stringify(manifest, null, 2));
const admin = await adminClient(evidence);
evidence.check('Protected system administrator can authenticate', admin.user.roles.includes('SuperAdmin'), { roles: admin.user.roles });

for (const [key, title, arabic] of [['eng','Engineering','الهندسة'],['ops','Operations','العمليات']]) {
  const body = { nameEn: `QA26 ${title}`, nameAr: `اختبار QA26 ${arabic}`, code: `QA26_${key.toUpperCase()}`, descriptionEn: 'Dedicated lifecycle acceptance QA 2026-09-19', descriptionAr: 'بيانات اختبار القبول', isActive: true };
  const search = must(await admin.get(`/api/Departments?search=${encodeURIComponent(body.nameEn)}&includeInactive=true&pageSize=100`), 'Find QA department');
  const existing = (search.items ?? []).find(x => x.code === body.code);
  const dept = existing ?? must(await admin.post('/api/Departments', body), 'Create QA department');
  manifest.departments.push({ ...dept, key }); save();
  const persisted = must(await admin.get(`/api/Departments/${dept.id}`), 'Read department');
  evidence.check(`${title} bilingual department persists`, persisted.nameEn === body.nameEn && persisted.nameAr === body.nameAr, persisted);
  const duplicate = await admin.post('/api/Departments', body);
  evidence.check(`${title} duplicate department rejected`, !duplicate.ok && duplicate.status < 500, duplicate.body);
  for (const [role, n] of [['Admin',1],['Instructor',1],['Examiner',1],['Proctor',1],['Candidate',1],['Candidate',2],['Candidate',3]]) {
    const email = `qa26.${key}.${role.toLowerCase()}${n}@example.test`;
    const found = await admin.get(`/api/Users/by-email/${encodeURIComponent(email)}`);
    const user = found.ok ? found.data : must(await admin.post('/api/Users', { email, password: privateData.password, fullName: `QA26 ${title} ${role} ${n}`, fullNameAr: `اختبار ${arabic} ${n}`, role, departmentId: dept.id }), 'Create QA user');
    manifest.users.push({ id: user.id, email, role, departmentId: dept.id, key, n }); save();
    if (!privateData.users.some(x => x.email === email)) { privateData.users.push({ email, password: privateData.password }); savePrivate(privateData); }
    const reload = must(await admin.get(`/api/Users/${user.id}`), 'Reload user');
    const client = new Client({ evidence }); const login = await client.login(email, privateData.password);
    evidence.check(`${title} ${role} ${n} role/department persist and login succeeds`, reload.departmentId === dept.id && reload.roles.includes(role) && login.ok && login.data.user.roles.includes(role), { persisted: reload, login: login.body });
  }
}

for (const [name, body] of [
  ['Empty English department name', { nameEn: '', nameAr: 'اختبار', code: 'QA26_INVALID' }],
  ['Invalid department code', { nameEn: 'QA26 invalid', nameAr: 'اختبار', code: 'bad code!' }],
  ['Oversized department name', { nameEn: 'x'.repeat(301), nameAr: 'اختبار', code: 'QA26_LONG' }]
]) {
  const response = await admin.post('/api/Departments', body); evidence.check(`${name} rejected`, !response.ok && response.status < 500, response.body);
}

const candidate = manifest.users.find(x => x.role === 'Candidate');
for (const [name, body] of [
  ['Duplicate user email', { email: candidate.email, password: privateData.password, role: 'Candidate', departmentId: candidate.departmentId }],
  ['Invalid user role', { email: 'qa26.invalid.role@example.test', password: privateData.password, role: 'Owner', departmentId: candidate.departmentId }],
  ['Invalid user email', { email: 'not-an-email', password: privateData.password, role: 'Candidate', departmentId: candidate.departmentId }],
  ['Weak user password', { email: 'qa26.weak@example.test', password: 'a', role: 'Candidate', departmentId: candidate.departmentId }],
  ['Nonexistent user department', { email: 'qa26.invalid.department@example.test', password: privateData.password, role: 'Candidate', departmentId: 2147483000 }]
]) {
  const response = await admin.post('/api/Users', body); evidence.check(`${name} rejected without server failure`, !response.ok && response.status < 500, response.body);
}

const candidateClient = new Client({ evidence }); must(await candidateClient.login(candidate.email, privateData.password), 'Candidate login');
must(await admin.post(`/api/Users/${candidate.id}/block`), 'Block user');
evidence.check('Blocked user login denied', !(await new Client({ evidence }).login(candidate.email, privateData.password)).ok);
const blockedToken = await candidateClient.get('/api/Departments/my-department');
evidence.check('Existing token of blocked user denied', [401,403].includes(blockedToken.status), blockedToken.body);
must(await admin.post(`/api/Users/${candidate.id}/unblock`), 'Unblock user');
evidence.check('Unblocked user can login again', (await candidateClient.login(candidate.email, privateData.password)).ok);
must(await admin.post(`/api/Users/${candidate.id}/deactivate`), 'Deactivate user');
evidence.check('Inactive user login denied', !(await new Client({ evidence }).login(candidate.email, privateData.password)).ok);
const inactiveToken = await candidateClient.get('/api/Departments/my-department');
evidence.check('Existing token of inactive user denied', [401,403].includes(inactiveToken.status), inactiveToken.body);
must(await admin.post(`/api/Users/${candidate.id}/activate`), 'Activate user');
evidence.check('Reactivated user can login again', (await candidateClient.login(candidate.email, privateData.password)).ok);

must(await admin.put(`/api/Users/${candidate.id}`, { fullName: 'QA26 Updated Candidate', phoneNumber: '+971501234567' }), 'Update candidate');
const updated = must(await admin.get(`/api/Users/${candidate.id}`), 'Reload updated candidate');
evidence.check('User profile update persists', updated.fullName === 'QA26 Updated Candidate' && updated.phoneNumber === '+971501234567', updated);
const badPhone = await admin.put(`/api/Users/${candidate.id}`, { phoneNumber: 'abc' });
evidence.check('Invalid profile phone rejected', !badPhone.ok && badPhone.status < 500, badPhone.body);

const targetDept = manifest.departments[1];
must(await admin.post('/api/Departments/assign-user', { userId: candidate.id, departmentId: targetDept.id }), 'Move candidate');
evidence.check('Department reassignment persists', must(await admin.get(`/api/Users/${candidate.id}`), 'Read moved candidate').departmentId === targetDept.id);
must(await admin.post('/api/Departments/assign-user', { userId: candidate.id, departmentId: candidate.departmentId }), 'Restore candidate department');

const deletionEmail = 'qa26.deleted.fixture@example.test';
const deletionUser = must(await admin.post('/api/Users', { email: deletionEmail, password: privateData.password, role: 'Candidate', fullName: 'QA26 Deleted Fixture', departmentId: candidate.departmentId }), 'Create delete fixture');
must(await admin.delete(`/api/Users/${deletionUser.id}`), 'Delete fixture');
manifest.deletedFixtures.push({ id: deletionUser.id, email: deletionEmail }); save();
evidence.check('Deleted user cannot authenticate', !(await new Client({ evidence }).login(deletionEmail, privateData.password)).ok);
evidence.check('Deleted user hidden from detail lookup', !(await admin.get(`/api/Users/${deletionUser.id}`)).ok);

const staff = must(await admin.get('/api/Users/staff?search=qa26&pageSize=100'), 'Staff filter');
evidence.check('Staff listing excludes candidates', staff.items.every(x => !x.roles.includes('Candidate')), { count: staff.items.length });
const invalidPage = await admin.get('/api/Users?pageNumber=0&pageSize=501');
evidence.check('Invalid pagination rejected', !invalidPage.ok && invalidPage.status < 500, invalidPage.body);
for (const role of ['Admin','Instructor','Examiner','Proctor','Candidate']) {
  const fixture = manifest.users.find(x => x.role === role);
  const client = new Client({ evidence }); must(await client.login(fixture.email, privateData.password), `Login ${role}`);
  const result = await client.get('/api/Users?pageSize=100');
  evidence.check(`${role} cannot enumerate SuperAdmin user management`, result.status === 403, result.body);
}

console.log(JSON.stringify({ checks: evidence.checks.length, failures: evidence.checks.filter(x => !x.passed).map(x => x.name), manifest: 'data-manifest.json' }, null, 2));
