# Harness endpoint contracts

Backend: `http://localhost:5221`; frontend: `http://localhost:3000`; SignalR: `/hubs/proctor`. JSON uses camelCase properties and numeric enums. Most API responses wrap `{success, data, message, errors}`. Check business `success`, not HTTP status alone.

## Admin setup

- `POST /api/Auth/login`: `{email,password}` -> `data.accessToken`, `data.user`.
- `POST /api/Departments`: `{nameEn,nameAr,descriptionEn,descriptionAr,code,isActive}`. List has no descriptions; detail `GET /api/Departments/{id}` does.
- `POST /api/Users`: `{email,password,fullName,fullNameAr,role,departmentId}`.
- `PUT /api/Users/{id}`: `{displayName,fullName,phoneNumber,departmentId,clearDepartment}`.
- `POST /api/Users/{id}/{block|unblock|activate|deactivate}`; `DELETE /api/Users/{id}`.
- `POST /api/Departments/assign-user`: `{userId,departmentId}`; `POST /api/Departments/remove-user/{userId}`.
- Roles: `SuperAdmin`, `Admin`, `Instructor`, `Examiner`, `Proctor`, `Candidate`.
- SuperAdmin controls user/department management; authenticated users can read their own `/api/Departments/my-department`.

## Question bank

- Instructor/Admin subject creation inherits actor department: `POST /api/Lookups/question-subjects` `{nameEn,nameAr}`.
- Topics: `POST /api/Lookups/question-topics` `{nameEn,nameAr,subjectId}`.
- Questions: `POST /api/QuestionBank/questions` `{bodyEn,bodyAr,explanationEn,explanationAr,questionTypeId,questionCategoryId?,subjectId,topicId?,points,difficultyLevel,isActive,isCalculatorAllowed,options,answerKey?}`.
- Actual test DB type IDs: 1 single choice, 2 multiple choice, 3 true/false, 5 subjective. Source seed configuration says 4 for subjective, but the current database lookup is authoritative; fetch `/api/Lookups/question-types`. Difficulty 1 easy, 2 medium, 3 hard.
- Options: `{textEn,textAr,isCorrect,points?,order,attachmentPath?}`. Explicit multi-choice option points must sum to question total on create.
- Subjective answer key: `{rubricTextEn,rubricTextAr}`. Other answer-key fields exist in DTO but current supported types are the four above.
- `PUT /api/QuestionBank/questions/{id}` updates metadata/answer key; options are separate `PUT /api/QuestionBank/questions/{id}/options/bulk` with array of full option records, or `/api/QuestionBank/options/{optionId}`.
- Multipart image/PDF: `POST /api/Media/upload?folder=questions`, field `file`; result is `{success,file:{id,url,...}}` (not standard data envelope). Then `POST /api/QuestionBank/questions/{id}/attachments` `{questionId,fileName,filePath:file.url,fileType:"Image"|"PDF",fileSize,isPrimary}`.

## Exams and candidate workload

- Exams: `POST /api/Assessment/exams`; detail/list `/api/Assessment/exams/{id}` and `/api/Assessment/exams`.
- Authoring: sections `/api/Assessment/exams/{id}/sections`, questions `/api/Assessment/sections/{sectionId}/questions`, dynamic builder `/api/Assessment/exams/{id}/builder`.
- Access policy `/api/Assessment/exams/{id}/access-policy`; publish `/api/Assessment/exams/{id}/publish`.
- Candidate preview `/api/Candidate/exams/{examId}/preview`; start `POST /api/Candidate/exams/{examId}/start` `{accessCode?}`.
- Active session `GET /api/Candidate/attempts/{attemptId}/session`; answers `PUT /api/Candidate/attempts/{attemptId}/answers` `{answers:[{questionId,selectedOptionIds?,textAnswer?}]}`.
- Submit `POST /api/Candidate/attempts/{attemptId}/submit`; result `/api/Candidate/results/my-result/{attemptId}` and `/review`.
- Legacy `/api/Attempt` routes also exist and must receive security/regression coverage; production browser uses Candidate routes.
- Proctor assignment `POST /api/ExamProctor/assign` `{examId,proctorIds:[userId]}`.
- Proctor session creation `POST /api/Proctor/session`; heartbeat `/api/Proctor/heartbeat`; warnings `/api/Proctor/session/{id}/warning`; terminate `/api/Proctor/session/{id}/terminate`; candidate status `/api/Proctor/candidate-status/{attemptId}`.
- Attempt control `/api/attempt-control/add-time` `{attemptId,extraMinutes,reason}`, `/force-end` `{attemptId,reason}`, `/resume` `{attemptId}`.

This document is contract discovery and does not imply exercised coverage. Evidence JSON files and phase reports identify actual calls, assertions, and remaining gaps.
