import fs from 'node:fs';
import path from 'node:path';
import { Client, Evidence, adminClient, here, must, privateConfig } from './client.mjs';

const e = new Evidence('phase1-department-cycles-evidence');
const admin = await adminClient(e);
const m = JSON.parse(fs.readFileSync(path.join(here, 'data-manifest.json'), 'utf8'));
const privateData = privateConfig();
const dept = m.departments[1];
const candidate = m.users.find(x => x.role === 'Candidate' && x.key === 'eng');
const staff = m.users.find(x => x.role === 'Admin' && x.key === 'ops');
const client = new Client({ evidence: e }); must(await client.login(staff.email, privateData.password), 'Login ops admin');

const deletion = await admin.delete(`/api/Departments/${dept.id}`);
e.check('Department with assigned users cannot be deleted', !deletion.ok && deletion.status < 500, deletion.body);
try {
  must(await admin.post(`/api/Departments/${dept.id}/deactivate`), 'Deactivate department');
  e.check('Inactive department state persists', must(await admin.get(`/api/Departments/${dept.id}`), 'Read inactive department').isActive === false);
  const hidden = must(await admin.get('/api/Departments?search=QA26&includeInactive=false&pageSize=100'), 'List active departments');
  e.check('Inactive department omitted from active dropdown list', !hidden.items.some(x => x.id === dept.id));
  const assignment = await admin.post('/api/Departments/assign-user', { userId: candidate.id, departmentId: dept.id });
  e.check('Assignment to inactive department rejected', !assignment.ok && assignment.status < 500, assignment.body);
  const login = await new Client({ evidence: e }).login(staff.email, privateData.password);
  e.record({ observation: 'Existing member login while department inactive. Expected policy requires product decision; not asserted as failure.', allowed: login.ok });
  const inactiveCreation = await admin.post('/api/Users', { email: 'qa26.inactive.department@example.test', password: privateData.password, fullName: 'QA26 Inactive Department Fixture', role: 'Candidate', departmentId: dept.id });
  e.check('Creating user in inactive department follows assign-user validation', !inactiveCreation.ok && inactiveCreation.status < 500, inactiveCreation.body);
  if (inactiveCreation.ok) { m.deletedFixtures.push({ id: inactiveCreation.data.id, email: 'qa26.inactive.department@example.test' }); must(await admin.delete(`/api/Users/${inactiveCreation.data.id}`), 'Delete inconsistent create fixture'); }
  const update = await admin.put(`/api/Users/${candidate.id}`, { departmentId: dept.id });
  e.check('User update to inactive department follows assign-user validation', !update.ok && update.status < 500, update.body);
  if (update.ok) must(await admin.put(`/api/Users/${candidate.id}`, { departmentId: candidate.departmentId }), 'Restore candidate');
} finally {
  must(await admin.post(`/api/Departments/${dept.id}/activate`), 'Restore department');
}

const invalidUpdate = await admin.put(`/api/Users/${candidate.id}`, { departmentId: 2147483000 });
e.check('Update user nonexistent department rejected without server failure', !invalidUpdate.ok && invalidUpdate.status < 500, invalidUpdate.body);
e.check('Invalid update preserves original department', must(await admin.get(`/api/Users/${candidate.id}`), 'Read original department').departmentId === candidate.departmentId);

const temporary = must(await admin.post('/api/Departments', { nameEn: 'QA26 Delete Department Fixture', nameAr: 'اختبار حذف القسم QA26', code: 'QA26_DELETE', isActive: true }), 'Create disposable department');
must(await admin.delete(`/api/Departments/${temporary.id}`), 'Delete department');
e.check('Deleted department detail no longer available', !(await admin.get(`/api/Departments/${temporary.id}`)).ok);
m.deletedFixtures.push({ departmentId: temporary.id });
fs.writeFileSync(path.join(here, 'data-manifest.json'), JSON.stringify(m, null, 2));
console.log(JSON.stringify({ checks: e.checks.length, failures: e.checks.filter(x => !x.passed).map(x => x.name) }, null, 2));
