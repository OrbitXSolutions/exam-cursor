// Prepared for root to run explicitly. This file has NOT been executed by its author.
// node phase12-final.mjs setup
// node phase12-final.mjs checkpoint [attemptId]
// Setup creates/configures only the final fixture. Checkpoint reads as SuperAdmin.
// Neither mode starts attempts, saves answers, grades, finalizes or publishes results.
import fs from 'node:fs';
import path from 'node:path';
import { Client, Evidence, adminClient, here, must, privateConfig, savePrivate, redact } from './client.mjs';

const mode = process.argv[2];
if (!['setup', 'checkpoint'].includes(mode)) {
  throw new Error('Usage: node phase12-final.mjs setup | checkpoint [attemptId]');
}
if (mode === 'setup' && process.argv[3]) throw new Error('Setup takes no additional arguments.');
const explicitAttemptId = process.argv[3] === undefined ? null : Number(process.argv[3]);
if (explicitAttemptId !== null && (!Number.isSafeInteger(explicitAttemptId) || explicitAttemptId < 1)) {
  throw new Error('Checkpoint attemptId must be a positive integer.');
}

const email = 'qa26.final.lifecycle@example.test';
const title = 'QA26 Final Browser Lifecycle';
const questionIds = [131, 132, 133, 134, 135];
// Fixed expected answers from the independent QA bank fixture, not computed from grades.
const correctOptions = { 131: [376], 132: [379, 380], 133: [382, 383], 134: [385] };
const expected = { objective: 40, manual: 7, total: 47, maximum: 50, percentage: 94, passScore: 30 };
const manifestPath = path.join(here, 'phase12-final-manifest.json');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidence = new Evidence(`phase12-final-${mode}-${stamp}`);
const read = name => JSON.parse(fs.readFileSync(path.join(here, name), 'utf8'));
const fixtures = read('data-manifest.json');
const department = fixtures.departments.find(x => x.key === 'eng');
const proctor = fixtures.users.find(x => x.key === 'eng' && x.role === 'Proctor');
const examiner = fixtures.users.find(x => x.key === 'eng' && x.role === 'Examiner');
if (!department || !proctor || !examiner) throw new Error('Engineering fixture actors are missing.');
let manifest = fs.existsSync(manifestPath) ? read('phase12-final-manifest.json') : {
  fixture: 'QA26 final browser lifecycle', createdAt: new Date().toISOString(),
  departmentId: department.id, candidate: { email }, proctor, examiner,
  questionIds, correctOptions, expected,
  credentialSource: 'Existing ignored .env.qa-private.json shared QA credential; never included in evidence.',
  browserAnswerGuide: { 131: '2', 132: '2 and 3', 133: '2 and 4', 134: 'True',
    135: 'Type a nonempty exam-integrity answer; Examiner records 7/10 in the browser.' },
};
if (manifest.candidate.email !== email || manifest.departmentId !== department.id) {
  throw new Error('Existing final manifest belongs to a different fixture.');
}
if (manifest.calculatorQuestionId) questionIds[4] = manifest.calculatorQuestionId;
const save = () => fs.writeFileSync(manifestPath, JSON.stringify(redact(manifest), null, 2));
const array = data => Array.isArray(data) ? data : data?.items ?? [];
const sameIds = (a, b) => JSON.stringify([...a].sort((x, y) => x - y)) === JSON.stringify([...b].sort((x, y) => x - y));
const requireCheck = (name, passed, detail) => {
  evidence.check(name, passed, detail);
  if (!passed) throw new Error(name);
};
const pending = [];
let admin;
async function attempts() {
  const query = new URLSearchParams({ examId: String(manifest.examId), candidateId: manifest.candidate.id, pageSize: '100' });
  return array(must(await admin.get(`/api/Attempt?${query}`), 'Read final fixture attempts'));
}
async function candidateAssignment() {
  const query = new URLSearchParams({ examId: String(manifest.examId), search: email, pageSize: '20',
    scheduleFrom: manifest.request.startAt, scheduleTo: manifest.request.endAt });
  return array(must(await admin.get(`/api/Assignments/candidates?${query}`), 'Read final candidate assignment'))
    .find(x => x.id === manifest.candidate.id);
}
async function setupSnapshot() {
  const exam = must(await admin.get(`/api/Assessment/exams/${manifest.examId}`), 'Reload final exam');
  const policy = must(await admin.get(`/api/Assessment/exams/${manifest.examId}/access-policy`), 'Reload final access policy');
  const questions = array(must(await admin.get(`/api/Assessment/sections/${manifest.sectionId}/questions`), 'Reload final exam questions'));
  const assignment = await candidateAssignment();
  const roster = must(await admin.get(`/api/ExamProctor/${manifest.examId}`), 'Reload final proctor assignment');
  requireCheck('Final exam published in Engineering with five questions, 50 points and pass score 30',
    exam.departmentId === department.id && exam.isPublished === true && exam.isActive === true &&
    exam.questionsCount === 5 && exam.totalPoints === 50 && exam.passScore === 30, exam);
  requireCheck('Final exam uses requested flex, timer, review and optional-device settings',
    exam.examType === 0 && exam.durationMinutes === 30 && exam.maxAttempts === 2 &&
    exam.requireProctoring === true && exam.requireIdVerification === false && exam.requireWebcam === false &&
    exam.enableScreenMonitoring === false && exam.screenMonitoringMode === 0 &&
    exam.showResults === true && exam.allowReview === true && exam.showCorrectAnswers === true, exam);
  requireCheck('Final static question set and individual maxima are unchanged',
    sameIds(questions.map(x => x.questionId), questionIds) && questions.every(x => x.points === 10), questions);
  requireCheck('Final assignment and access code persist', assignment?.examAssigned === true &&
    policy.isPublic === false && policy.restrictToAssignedCandidates === true &&
    policy.isWalkIn === false && policy.accessCode === 'QA26FINAL', { assignment, policy });
  requireCheck('Engineering proctor is assigned to final exam',
    roster.assignedProctors?.some(x => x.id === proctor.id), roster);
  manifest.setupState = { capturedAt: new Date().toISOString(), exam, policy, questions, assignment, roster };
  save();
  return exam;
}

async function setup() {
  // Re-running after successful setup is observational and does not change the window.
  if (manifest.setupCompletedAt) {
    await setupSnapshot();
    return { state: 'already prepared; no fixture mutation', examId: manifest.examId, candidateEmail: email };
  }
  save();
  const privateData = privateConfig();
  const existing = await admin.get(`/api/Users/by-email/${encodeURIComponent(email)}`);
  let candidate;
  if (existing.ok) candidate = existing.data;
  else {
    if (existing.status !== 404) must(existing, 'Find final candidate');
    candidate = must(await admin.post('/api/Users', { email, password: privateData.password,
      fullName: 'QA26 Final Lifecycle Candidate', fullNameAr: 'مرشح دورة الحياة النهائية QA26',
      role: 'Candidate', departmentId: department.id }), 'Create final candidate');
  }
  const user = must(await admin.get(`/api/Users/${candidate.id}`), 'Reload final candidate');
  requireCheck('Final candidate has Candidate role and Engineering department',
    user.email?.toLowerCase() === email && user.departmentId === department.id &&
    user.roles?.length === 1 && user.roles[0] === 'Candidate',
    { id: user.id, email: user.email, departmentId: user.departmentId, roles: user.roles });
  manifest.candidate = { id: user.id, email, departmentId: department.id, role: 'Candidate' }; save();
  privateData.users ??= [];
  if (!privateData.users.some(x => x.email === email)) {
    privateData.users.push({ ...manifest.candidate, key: 'final-lifecycle' }); savePrivate(privateData);
  }
  if (manifest.examId) requireCheck('No browser attempt exists before unfinished setup resumes',
    (await attempts()).length === 0, { examId: manifest.examId });

  // A fresh subjective question enables the product's calculator/spreadsheet tools
  // without editing a bank question already used in historical attempts.
  if (!manifest.calculatorQuestionId) {
    const source = must(await admin.get('/api/QuestionBank/questions/135'), 'Read subjective source');
    const author = new Client({ evidence });
    const authorUser = fixtures.users.find(x => x.key === 'eng' && x.role === 'Admin');
    must(await author.login(authorUser.email, privateData.password), 'Sign in final question author');
    const created = must(await author.post('/api/QuestionBank/questions', {
      bodyEn: 'QA26 Final: Explain two controls that protect exam integrity. Calculator and spreadsheet tools are available for this section.',
      bodyAr: 'QA26 النهائي: اشرح إجراءين لحماية نزاهة الاختبار. تتوفر أدوات الحاسبة وجدول البيانات.',
      explanationEn: source.explanationEn, explanationAr: source.explanationAr,
      questionTypeId: source.questionTypeId, questionCategoryId: source.questionCategoryId,
      subjectId: source.subjectId, topicId: source.topicId, points: 10,
      difficultyLevel: source.difficultyLevel, isActive: true, isCalculatorAllowed: true,
      options: [], answerKey: source.answerKey,
    }), 'Author final calculator-enabled subjective question');
    manifest.calculatorQuestionId = created.id;
    questionIds[4] = created.id;
    manifest.questionIds = [...questionIds];
    delete manifest.browserAnswerGuide[135];
    manifest.browserAnswerGuide[created.id] = 'Use calculator/spreadsheet, then type two exam-integrity controls. Examiner records 7/10.';
    save();
  }

  const bank = [];
  for (const questionId of questionIds) {
    const question = must(await admin.get(`/api/QuestionBank/questions/${questionId}`), 'Read source question');
    requireCheck(`Question ${questionId} retains expected active 10-point fixture`,
      question.isActive === true && question.points === 10 &&
      (!correctOptions[questionId] || sameIds(question.options.filter(x => x.isCorrect).map(x => x.id), correctOptions[questionId])),
      { id: question.id, points: question.points, isActive: question.isActive,
        correctOptionIds: question.options.filter(x => x.isCorrect).map(x => x.id) });
    bank.push(question);
  }
  manifest.sourceQuestionsAtSetup = bank; save();
  if (!manifest.examId) {
    const now = Date.now();
    manifest.request = { departmentId: department.id, examType: 0,
      titleEn: title, titleAr: 'اختبار دورة الحياة النهائية QA26',
      descriptionEn: 'Fresh final browser lifecycle acceptance fixture; no physical media claim.',
      descriptionAr: 'اختبار قبول دورة الحياة النهائية عبر المتصفح',
      startAt: new Date(now).toISOString(), endAt: new Date(now + 120 * 60000).toISOString(),
      durationMinutes: 30, maxAttempts: 2, shuffleQuestions: false, shuffleOptions: false,
      passScore: 30, isActive: true, showResults: true, allowReview: true, showCorrectAnswers: true,
      requireProctoring: true, requireIdVerification: false, requireWebcam: false,
      enableScreenMonitoring: false, screenMonitoringMode: 0, screenShareGracePeriod: 20,
      preventCopyPaste: false, preventScreenCapture: false, requireFullscreen: false,
      browserLockdown: false, maxViolationWarnings: 0 };
    save();
    const exam = must(await admin.post('/api/Assessment/exams', manifest.request), 'Create final exam');
    manifest.examId = exam.id; save();
  }
  if (!manifest.sectionId) {
    const section = must(await admin.post(`/api/Assessment/exams/${manifest.examId}/sections`,
      { titleEn: 'Final knowledge check', titleAr: 'فحص المعرفة النهائي', order: 1 }), 'Create final section');
    manifest.sectionId = section.id; save();
  }
  let rows = array(must(await admin.get(`/api/Assessment/sections/${manifest.sectionId}/questions`), 'Read existing final question rows'));
  if (!rows.length) {
    must(await admin.post(`/api/Assessment/sections/${manifest.sectionId}/questions/bulk`,
      { questionIds, useOriginalPoints: true, markAsRequired: true }), 'Add five final questions');
    rows = array(must(await admin.get(`/api/Assessment/sections/${manifest.sectionId}/questions`), 'Read persisted final questions'));
  }
  requireCheck('Final section contains only the requested five questions', sameIds(rows.map(x => x.questionId), questionIds), rows);
  must(await admin.put(`/api/Assessment/exams/${manifest.examId}/access-policy`,
    { isPublic: false, restrictToAssignedCandidates: true, isWalkIn: false, accessCode: 'QA26FINAL' }), 'Set final access policy');
  if (!manifest.instructionId) {
    const instruction = must(await admin.post(`/api/Assessment/exams/${manifest.examId}/instructions`, {
      contentEn: 'Complete all five questions. Save, reload and confirm your answers before submission. Results are released after examiner review.',
      contentAr: 'أكمل الأسئلة الخمسة واحفظ الإجابات ثم أرسل الاختبار. تظهر النتائج بعد مراجعة المصحح.', order: 1 }), 'Add final instruction');
    manifest.instructionId = instruction.id; save();
  }
  const examBeforePublish = must(await admin.get(`/api/Assessment/exams/${manifest.examId}`), 'Read final draft');
  if (!examBeforePublish.isPublished) must(await admin.post(`/api/Assessment/exams/${manifest.examId}/publish`), 'Publish final exam');
  if (!(await candidateAssignment())?.examAssigned) {
    must(await admin.post('/api/Assignments/assign', { examId: manifest.examId,
      scheduleFrom: manifest.request.startAt, scheduleTo: manifest.request.endAt,
      candidateIds: [manifest.candidate.id] }), 'Assign final candidate');
  }
  const roster = must(await admin.get(`/api/ExamProctor/${manifest.examId}`), 'Read automatic final proctor assignment');
  if (!roster.assignedProctors?.some(x => x.id === proctor.id)) {
    must(await admin.post('/api/ExamProctor/assign', { examId: manifest.examId, proctorIds: [proctor.id] }), 'Assign Engineering proctor');
  }
  await setupSnapshot();
  requireCheck('Setup created no candidate attempt', (await attempts()).length === 0, { examId: manifest.examId });
  requireCheck('Final browser admission window is active',
    Date.parse(manifest.request.startAt) <= Date.now() && Date.parse(manifest.request.endAt) > Date.now(),
    { startAt: manifest.request.startAt, endAt: manifest.request.endAt });
  manifest.setupCompletedAt = new Date().toISOString(); save();
  return { state: 'prepared for browser lifecycle', examId: manifest.examId,
    candidateEmail: email, proctorEmail: proctor.email, examinerEmail: examiner.email,
    accessCode: 'QA26FINAL', endAt: manifest.request.endAt, expected, answerGuide: manifest.browserAnswerGuide };
}

async function readOptional(route, stage) {
  const response = await admin.get(route);
  if (response.ok) return response.data;
  if (response.status === 404 && /not found/i.test(response.body?.message ?? '')) {
    pending.push(stage); return null;
  }
  return must(response, `Read ${stage}`);
}
async function checkpoint() {
  if (!manifest.examId || !manifest.candidate.id) throw new Error('Run setup before checkpoint.');
  const owned = await attempts();
  requireCheck('Attempt listing contains only final fixture candidate and exam',
    owned.every(x => x.examId === manifest.examId && x.candidateId === manifest.candidate.id), owned);
  let attemptId = explicitAttemptId ?? manifest.attemptId;
  if (!attemptId && owned.length === 1) attemptId = owned[0].id;
  if (!attemptId && owned.length > 1) throw new Error('Multiple final attempts exist; specify the browser attemptId.');
  if (!attemptId) {
    pending.push('Browser candidate has not started the final attempt');
    return { state: 'pending', examId: manifest.examId, pending };
  }
  requireCheck('Selected attempt belongs to final candidate and exam', owned.some(x => x.id === attemptId), { attemptId });
  const attempt = must(await admin.get(`/api/Attempt/${attemptId}/details`), 'Read final attempt details');
  requireCheck('Detailed attempt identity matches final fixture',
    attempt.examId === manifest.examId && attempt.candidateId === manifest.candidate.id && attempt.id === attemptId,
    { attemptId: attempt.id, examId: attempt.examId, candidateId: attempt.candidateId });
  manifest.attemptId = attemptId; save();
  const proctorSession = await readOptional(`/api/Proctor/session/attempt/${attemptId}`, 'proctor session');
  const grading = await readOptional(`/api/Grading/attempt/${attemptId}`, 'grading session');
  const result = await readOptional(`/api/ExamResult/attempt/${attemptId}`, 'finalized result');
  const terminal = [3, 4, 5, 7, 8].includes(attempt.status);
  if (terminal) {
    evidence.check('Final browser completed by ordinary submission', attempt.status === 3, { status: attempt.status });
    for (const [questionId, optionIds] of Object.entries(correctOptions)) {
      const answer = attempt.answerDetails.find(x => x.questionId === Number(questionId));
      evidence.check(`Submitted question ${questionId} retains independently expected correct selections`,
        !!answer && sameIds(answer.selectedOptionIds ?? [], optionIds), answer);
    }
    const essay = attempt.answerDetails.find(x => x.questionId === questionIds[4]);
    evidence.check('Submitted subjective answer is nonempty', typeof essay?.textAnswer === 'string' && essay.textAnswer.trim().length > 0, essay);
  } else pending.push('Browser candidate submission');
  if (grading) {
    requireCheck('Grading belongs to final fixture', grading.attemptId === attemptId &&
      grading.examId === manifest.examId && grading.candidateId === manifest.candidate.id, { id: grading.id, attemptId: grading.attemptId });
    const objective = grading.answers.filter(x => Object.hasOwn(correctOptions, x.questionId));
    evidence.check('Four objective grades independently equal 10 each and total 40', objective.length === 4 &&
      sameIds(objective.map(x => x.questionId), [131, 132, 133, 134]) &&
      objective.every(x => x.score === 10 && x.maxPoints === 10) &&
      objective.reduce((sum, x) => sum + x.score, 0) === expected.objective,
      objective.map(x => ({ questionId: x.questionId, score: x.score, maxPoints: x.maxPoints })));
    const manual = grading.answers.find(x => x.questionId === questionIds[4]);
    if (manual?.isGraded === true) evidence.check('Browser examiner saved manual 7/10', manual.score === expected.manual && manual.maxPoints === 10, manual);
    else pending.push('Browser examiner manual grade');
    if (grading.status === 4) {
      evidence.check('Completed grading independently totals 40 + 7 = 47/50',
        grading.totalScore === expected.total && grading.maxPossibleScore === expected.maximum &&
        grading.passScore === expected.passScore && grading.isPassed === true &&
        attempt.totalScore === expected.total, { grading, attemptTotal: attempt.totalScore });
    } else pending.push('Browser examiner finalization');
  }
  if (result) {
    requireCheck('Result belongs to final fixture', result.attemptId === attemptId &&
      result.examId === manifest.examId && result.candidateId === manifest.candidate.id, { resultId: result.id, attemptId: result.attemptId });
    evidence.check('Final result independently equals 47/50, 94%, passed at 30 points',
      result.totalScore === expected.total && result.maxPossibleScore === expected.maximum &&
      result.percentage === expected.percentage && result.passScore === expected.passScore && result.isPassed === true, result);
    if (!result.isPublishedToCandidate) pending.push('Browser administrator publication');
    else evidence.check('Browser publication persisted', result.isPublishedToCandidate === true, { id: result.id, publishedAt: result.publishedAt });
  }
  manifest.latestCheckpoint = { at: new Date().toISOString(), evidenceFile: `${evidence.name}.json`,
    attemptId, status: attempt.status, proctorSessionId: proctorSession?.proctorSessionId ?? proctorSession?.id ?? null,
    gradingSessionId: grading?.id ?? null, gradingStatus: grading?.status ?? null,
    resultId: result?.id ?? null, totalScore: result?.totalScore ?? grading?.totalScore ?? null,
    published: result?.isPublishedToCandidate ?? false, pending };
  save();
  return { ...manifest.latestCheckpoint, state: pending.length ? 'pending' : 'observed final stages',
    expected, limitation: 'Candidate browser review/export and actual proctor UI effects require separate browser evidence.' };
}

try {
  admin = await adminClient(evidence);
  const summary = await (mode === 'setup' ? setup() : checkpoint());
  evidence.record({ summary });
  console.log(JSON.stringify({ ...summary, failedChecks: evidence.checks.filter(x => !x.passed).map(x => x.name),
    manifest: path.basename(manifestPath), evidence: `${evidence.name}.json` }, null, 2));
  if (evidence.checks.some(x => !x.passed)) process.exitCode = 1;
} catch (error) {
  evidence.record({ error: error.message });
  console.error(error.message);
  process.exitCode = 1;
} finally {
  evidence.save();
  fs.copyFileSync(path.join(here, `${evidence.name}.json`), path.join(here, `phase12-final-${mode}.json`));
}
