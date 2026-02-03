# Smart Exam System — User Manual

**Version:** 1.0  
**Last Updated:** January 2026

---

# Part 1 — English Version

---

## 1. System Overview

The Smart Exam System is a web-based platform for creating, delivering, and grading online exams. It supports multiple question types (MCQ, Essay, True/False, Numeric), exam sections, proctoring features, and certificate issuance for passed candidates.

**Key capabilities:**
- Create and manage question bank with categories and types
- Build exams with sections and topics
- Publish exams for candidates within a department
- Candidates take exams with autosave, timer, and proctoring (webcam snapshots, event logging)
- Manual grading for essay/short-answer questions
- Automatic grading for objective questions
- Reports and analytics for admins
- Certificate verification (public)

---

## 2. Roles & Permissions Overview

| Role | Access |
|------|--------|
| **Admin** | Full access: exams, question bank, lookups (categories, types), users, grading, reports, proctor center, audit, settings |
| **Instructor** | Exams, question bank, grading, reports, proctor center (within department) |
| **Candidate (Student)** | My Exams, take exams, view results, download certificate (if passed) |
| **ProctorReviewer** | Proctor center (monitoring sessions) |
| **SuperAdmin / Auditor** | Users, audit logs, settings (Admin-level) |

**Department-based access:** Admins and Instructors see only exams and data within their assigned department.

---

## 3. Admin Manual

### 3.1 Prerequisites

- Valid Admin or Instructor account
- Supported browser: **Chrome** (recommended), Edge, Firefox, or Safari
- Stable internet connection
- Screen resolution at least 1024×768

---

### 3.2 Login

1. Open the application URL (e.g. `http://localhost:3000`).
2. Click **Login** or go to `/login`.
3. Enter your **Email** and **Password**.
4. Click **Sign In**.
5. You are redirected to the Dashboard.

[Screenshot: Login page]

---

### 3.3 Create Question Categories

Question categories organize questions (e.g. Mathematics, Programming).

1. From the sidebar, go to **Lookups** → **Question Categories** (or `/lookups/question-categories`).
2. Click **Add Category**.
3. Enter **Name (English)** and **Name (Arabic)**.
4. Click **Save**.

[Screenshot: Question Categories list]

---

### 3.4 Create Question Types

Question types define how questions are displayed and graded (e.g. Multiple Choice, Essay, True/False).

1. Go to **Lookups** → **Question Types** (or `/lookups/question-types`).
2. Click **Add Question Type**.
3. Enter **Name (English)** and **Name (Arabic)**.
4. Click **Save**.

**Note:** The system includes built-in types (MCQ Single, MCQ Multi, Essay, True/False, Numeric). Create new types only if needed for custom behaviour.

[Screenshot: Question Types list]

---

### 3.5 Create Questions

1. Go to **Question Bank** (or `/question-bank`).
2. Click **Create Question**.
3. Fill in:
   - **Category** and **Type**
   - **Question text** (English and Arabic)
   - **Points**
   - For MCQ: add options and mark correct one(s)
   - For Essay: no options needed
   - For True/False: add True/False options
4. Click **Save**.

[Screenshot: Create Question form]

---

### 3.6 Create Exam

1. Go to **Exams** (or `/exams`).
2. Click **Create Exam**.
3. On the Create Exam page, enter:
   - **Title** (English and Arabic)
   - **Description**
   - **Department**
   - **Exam Type**: Fixed (specific date/time) or Flex (start within window)
   - **Duration**, **Start/End dates** (for Fixed)
   - **Max attempts**, **Pass score**
4. Click **Create**.

5. **Add sections and questions:**
   - Open the exam and go to **Builder** (or `/exams/{id}/builder`).
   - Add sections (tabs).
   - Add questions to each section from the question bank.

[Screenshot: Exam Builder]

---

### 3.7 Publish Exam

1. Go to **Exams** and open the exam.
2. Ensure the exam has at least one question and required sections.
3. Click **Publish**.
4. Confirm in the dialog.
5. After publishing, the exam appears to candidates in **My Exams** (if they have access).

**Unpublish:** Use the dropdown menu on the exam list to **Unpublish** if needed.

[Screenshot: Exam detail with Publish button]

---

### 3.8 Assign / Make Available to Students

Exams are available to candidates based on:

1. **Department** — Candidates must be in the same department as the exam.
2. **Access Policy** — Configure under **Configuration** (or `/exams/{id}/configuration`):
   - **Access Code** — Optional; candidates must enter it to start.
   - **Restrict to assigned candidates** — If enabled, only explicitly assigned users can access (assignment UI: *Not fully implemented in current version*).
   - **Is Public** — If true, any eligible candidate in the department can see the exam.

3. **Publish status** — Exam must be **Published** for candidates to see it.
4. **Schedule** — For Fixed exams, the start/end window controls when candidates can start.

**Current implementation:** Published exams in the candidate’s department appear under **My Exams** → **Active** or **Upcoming**.

[Screenshot: Exam Configuration — Access Policy tab]

---

### 3.9 View Student Attempts

1. Go to **Grading** (or `/grading`) to see submissions needing manual grading.
2. Go to **Reports** (or `/reports`) to see all attempts and results for an exam:
   - Select the exam from the dropdown.
   - View stats: total candidates, average score, pass rate, highest score.
   - View candidate results table with scores and status.
   - Use **Export** to download a CSV.

[Screenshot: Reports page with exam selected]

**Note:** A dedicated “Attempts list” per exam is not fully implemented. Use **Reports** and **Grading** to monitor submissions.

---

### 3.10 Review Proctoring Evidence

1. Go to **Proctor Center** (or `/proctor-center`).
2. View the list of **active sessions** (candidates currently taking exams).
3. Click a session to open details (or `/proctor-center/{sessionId}`).

**Available in current version:**
- **Screenshots timeline** — Webcam snapshots captured during the exam (if proctoring is enabled).
- **Incidents / Violations timeline** — Events such as tab switch, fullscreen exit, copy/paste attempts (when logged by the exam page).
- **Session info** — Candidate name, exam, start time, remaining time.

**Not fully implemented in current version:**
- **Live video recording** — The session detail page shows a placeholder for live video. Live streaming is not implemented.
- **Real-time connection** — Proctor Center may use mock or partial data; backend stores events and snapshots.

[Screenshot: Proctor Center session detail — Screenshots and Incidents]

---

### 3.11 Approve / Edit / Finalize Result

1. Go to **Grading** (or `/grading`).
2. View the queue of submissions requiring manual grading (e.g. essays).
3. Click **Grade** on a submission (opens `/grading/{attemptId}`).
4. For each manual question:
   - Read the candidate’s answer.
   - Enter **Points** and optional **Feedback**.
   - Click **Save**.
5. When all manual questions are graded, click **Finalize**.
6. The system creates the result. The candidate can see it **after** the result is published (see below).

**Publishing results:**  
Results are created but not always visible to candidates until published. Publishing is done via the ExamResult API. A dedicated “Publish result” button in the Grading UI may not be present in the current version. Check the exam’s **Show Results** setting and backend logic for auto-publish when grading is complete.

[Screenshot: Grading submission detail]

---

### 3.12 Issue Certificate

**Implemented:**  
Certificates are **automatically created** when a result is published and the candidate **passed** the exam.

- **Candidate:** On the result page (`/results/{attemptId}`), if they passed, a **Download Certificate** button appears. They can download an HTML/printable certificate.
- **Verification:** Anyone can verify a certificate at `/verify-certificate` by entering the certificate code (e.g. `CERT-20260131-XXXX`).

**Admin certificate actions (API only):**  
- Create certificate for a passed result: `POST /api/Certificate/create/{resultId}`  
- Revoke: `POST /api/Certificate/{id}/revoke`  
- Regenerate code: `POST /api/Certificate/{id}/regenerate`  

**Not implemented in current version:**  
A dedicated admin UI to manage certificates (list, revoke, regenerate) is not available. Use the API or database if needed.

---

## 4. Student Manual

### 4.1 Prerequisites

- Valid Candidate account
- Supported browser: **Chrome** (recommended)
- Webcam (if the exam requires proctoring)
- Stable internet connection
- Allow camera and fullscreen when prompted

---

### 4.2 Login

1. Open the application URL.
2. Go to **Login** (`/login`).
3. Enter **Email** and **Password**.
4. Click **Sign In**.
5. You are redirected to **My Exams** or the Dashboard.

[Screenshot: Login page]

---

### 4.3 Open Exam

1. Go to **My Exams** (or `/my-exams`).
2. Use tabs: **Upcoming**, **Active**, **Completed**.
3. For an **active** exam, click **Start Exam**.
4. You are taken to the **Instructions** page (`/take-exam/{examId}/instructions`).
5. Read the instructions, enter the **Access Code** if required, check the agreement box, and click **Start Exam**.
6. You are redirected to the exam page (`/take-exam/{attemptId}`).

**Resume:** If you have an in-progress attempt, a **Resume** card appears at the top of My Exams. Click it to continue.

[Screenshot: My Exams — Active exams and Resume card]

---

### 4.4 Proctoring Requirements

When the exam has proctoring enabled (webcam, fullscreen, etc.):

1. **Allow camera** — When prompted, click **Allow** for camera access. The system captures snapshots during the exam.
2. **Enter fullscreen** — The exam may request fullscreen. Click **Allow** when the browser asks.
3. **Keep focus** — Avoid switching tabs or windows. Tab switches and related events are logged and may be reviewed by proctors.

**Warnings:**  
If you switch tabs or exit fullscreen, you may see a warning. These events are recorded. Repeated violations may affect your result.

[Screenshot: Exam page in fullscreen with timer]

---

### 4.5 Start Exam

1. On the Instructions page, ensure you have read the rules.
2. Enter the access code if the exam requires it.
3. Check the agreement checkbox.
4. Click **Start Exam**.
5. The exam page loads with the first question and a countdown timer.

[Screenshot: Exam Instructions page]

---

### 4.6 Answer Questions

1. Read each question. Use **Previous** and **Next** to move (if navigation is allowed).
2. For **MCQ:** Select one or more options.
3. For **Essay:** Type your answer in the text area.
4. For **True/False:** Select True or False.
5. **Autosave:** Answers are saved when you navigate or periodically. You should see a saved indicator.
6. Use the **Flag** button to mark questions for review (if available).
7. Monitor the **timer** at the top. When time runs out, the exam auto-submits.

[Screenshot: Exam page — Question and navigation]

---

### 4.7 Submit

1. When done, click **Submit** at the bottom.
2. Confirm in the dialog.
3. Your answers are submitted. You are redirected to the **Result** page.

[Screenshot: Submit confirmation dialog]

---

### 4.8 What Happens After Submit

1. **Result page** (`/results/{attemptId}`):
   - For **fully auto-graded** exams, you may see your score immediately (if the exam allows showing results).
   - For **manual grading** (e.g. essays), you see a message that results will be available after grading.

2. **My Results** (`/my-results`):  
   View all your past results and scores (once published).

3. **Answer review:**  
   If the exam allows review, a **View Detailed Review** or similar link appears. Click it to go to `/results/{attemptId}/review` and see your answers (and correct answers if configured).

4. **Certificate:**  
   If you passed and the result is published, a **Download Certificate** button appears on the result page. Use it to download and optionally print the certificate.

[Screenshot: Result page with score and Download Certificate]

---

## 5. Troubleshooting & FAQ

### 5.1 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **Camera permission denied** | In browser settings, allow camera for this site. Refresh and try again. |
| **Fullscreen blocked** | Allow fullscreen when the browser prompts. Do not use browser extensions that block fullscreen. |
| **Microphone/camera not detected** | Ensure the device is connected, not in use by another app, and allowed in OS and browser settings. |
| **Session expired** | Log in again. If the exam timer expired, the attempt may have been auto-submitted. |
| **401 Unauthorized** | Log in again. Clear cache/cookies if the problem persists. |
| **Answers not saving** | Check internet connection. Avoid closing the tab. Refresh only if necessary. |
| **Result not visible** | Results may be hidden until published by the instructor. Contact your instructor. |

### 5.2 FAQ

**Q: Can I use my phone to take the exam?**  
A: A desktop or laptop with a larger screen is recommended. Mobile support may be limited.

**Q: What if I lose connection during the exam?**  
A: Reconnect and return to the exam page. Your previous answers should be saved. The timer continues from the server.

**Q: Can I go back to previous questions?**  
A: It depends on exam settings. Some exams lock previous sections or prevent back navigation.

**Q: How do I verify my certificate?**  
A: Go to `/verify-certificate` and enter your certificate code (e.g. `CERT-20260131-XXXX`).

---

## 6. Security Notes

**Do NOT:**
- Share your login credentials.
- Switch tabs or windows during a proctored exam.
- Use screen capture or recording tools during the exam.
- Allow others to take the exam on your behalf.
- Use multiple devices for the same attempt.
- Disable or block camera/fullscreen when the exam requires it.

**Do:**
- Use a private, quiet space.
- Ensure your device is secure and malware-free.
- Close other applications that might trigger proctoring events.
- Keep the exam tab in focus and fullscreen when required.

---

## 7. Glossary

| Term | Definition |
|------|------------|
| **Exam** | A configured assessment with questions, duration, and settings. |
| **Attempt** | A single instance of a candidate taking an exam. A candidate may have multiple attempts per exam (up to max attempts). |
| **Proctoring** | Monitoring during the exam (e.g. webcam snapshots, tab-switch and fullscreen events). |
| **Violation** | A logged event such as tab switch, fullscreen exit, or copy/paste attempt during a proctored exam. |
| **Reviewer** | Admin or Instructor who grades manual questions (e.g. essays) and finalizes results. |
| **Result** | The final score and pass/fail status for an attempt, created after grading is complete. |
| **Certificate** | A document issued to candidates who pass an exam, with a unique verification code. |

---

## 8. Appendix: Browser & Device Requirements

- **Recommended:** Google Chrome (latest)
- **Supported:** Microsoft Edge, Firefox, Safari (latest)
- **Screen:** Minimum 1024×768
- **Camera:** Required for proctored exams; 720p or higher recommended
- **Network:** Stable broadband
- **Permissions:** Allow camera, microphone (if required), and fullscreen for the exam site

**Chrome camera permissions:**
1. Click the lock/info icon in the address bar.
2. Find **Camera** → set to **Allow**.
3. Refresh the page if needed.

---

---

# Part 2 — النسخة العربية (MSA)

---

## ١. نظرة عامة على النظام

نظام الاختبارات الذكية منصة ويب لإنشاء وإجراء وتصحيح الاختبارات الإلكترونية. يدعم أنواعاً متعددة من الأسئلة (اختيار من متعدد، مقال، صح/خطأ، رقمية)، وأقسام الاختبار، ومراقبة الاختبار، وإصدار الشهادات للمرشحين الناجحين.

**القدرات الرئيسية:**
- إنشاء وإدارة بنك الأسئلة مع الفئات والأنواع
- بناء اختبارات بأقسام ومواضيع
- نشر الاختبارات للمرشحين ضمن القسم
- إجراء المرشحين للاختبارات مع الحفظ التلقائي والوقت ومراقبة الاختبار (لقطات كاميرا، تسجيل الأحداث)
- التصحيح اليدوي لأسئلة المقال والإجابات القصيرة
- التصحيح التلقائي للأسئلة الموضوعية
- التقارير والتحليلات للإداريين
- التحقق من الشهادات (عام)

---

## ٢. نظرة عامة على الأدوار والصلاحيات

| الدور | الوصول |
|-------|--------|
| **المسؤول** | وصول كامل: الاختبارات، بنك الأسئلة، القوائم (الفئات، الأنواع)، المستخدمون، التصحيح، التقارير، مركز المراقبة، التدقيق، الإعدادات |
| **المدرّب** | الاختبارات، بنك الأسئلة، التصحيح، التقارير، مركز المراقبة (ضمن القسم) |
| **المرشح (الطالب)** | اختباراتي، إجراء الاختبارات، عرض النتائج، تنزيل الشهادة (إذا نجح) |
| **مراجع المراقبة** | مركز المراقبة (مراقبة الجلسات) |
| **المسؤول الأعلى / المدقق** | المستخدمون، سجلات التدقيق، الإعدادات |

**الوصول حسب القسم:** المسؤولون والمدرّبون يرون الاختبارات والبيانات ضمن قسمهم فقط.

---

## ٣. دليل المسؤول

### ٣.١ المتطلبات

- حساب مسؤول أو مدرّب صالح
- متصفح مدعوم: **Chrome** (مُوصى به)، Edge، Firefox، أو Safari
- اتصال إنترنت مستقر
- دقة شاشة 1024×768 على الأقل

---

### ٣.٢ تسجيل الدخول

١. افتح رابط التطبيق (مثلاً `http://localhost:3000`).  
٢. اضغط **تسجيل الدخول** أو اذهب إلى `/login`.  
٣. أدخل **البريد الإلكتروني** و**كلمة المرور**.  
٤. اضغط **دخول**.  
٥. يتم توجيهك إلى لوحة التحكم.

[لقطة شاشة: صفحة تسجيل الدخول]

---

### ٣.٣ إنشاء فئات الأسئلة

فئات الأسئلة تنظم الأسئلة (مثل الرياضيات، البرمجة).

١. من الشريط الجانبي، اذهب إلى **القوائم** → **فئات الأسئلة** (أو `/lookups/question-categories`).  
٢. اضغط **إضافة فئة**.  
٣. أدخل **الاسم (عربي)** و**الاسم (إنجليزي)**.  
٤. اضغط **حفظ**.

[لقطة شاشة: قائمة فئات الأسئلة]

---

### ٣.٤ إنشاء أنواع الأسئلة

أنواع الأسئلة تحدد طريقة عرض الأسئلة وتصحيحها (مثل اختيار من متعدد، مقال، صح/خطأ).

١. اذهب إلى **القوائم** → **أنواع الأسئلة** (أو `/lookups/question-types`).  
٢. اضغط **إضافة نوع سؤال**.  
٣. أدخل **الاسم (عربي)** و**الاسم (إنجليزي)**.  
٤. اضغط **حفظ**.

**ملاحظة:** النظام يتضمن أنواعاً جاهزة (اختيار من متعدد، مقال، صح/خطأ، رقمية). أنشئ أنواعاً جديدة فقط عند الحاجة.

[لقطة شاشة: قائمة أنواع الأسئلة]

---

### ٣.٥ إنشاء الأسئلة

١. اذهب إلى **بنك الأسئلة** (أو `/question-bank`).  
٢. اضغط **إنشاء سؤال**.  
٣. املأ:
   - **الفئة** و**النوع**
   - **نص السؤال** (عربي وإنجليزي)
   - **النقاط**
   - للمتعدد: أضف الخيارات وحدّد الصحيح(ة)
   - للمقال: لا حاجة لخيارات
   - لصح/خطأ: أضف خيارات صح/خطأ  
٤. اضغط **حفظ**.

[لقطة شاشة: نموذج إنشاء سؤال]

---

### ٣.٦ إنشاء اختبار

١. اذهب إلى **الاختبارات** (أو `/exams`).  
٢. اضغط **إنشاء اختبار**.  
٣. في صفحة الإنشاء أدخل:
   - **العنوان** (عربي وإنجليزي)
   - **الوصف**
   - **القسم**
   - **نوع الاختبار**: ثابت (تاريخ/وقت محدد) أو مرن (البدء خلال نافذة)
   - **المدة**، **تاريخ البداية/النهاية** (للثابت)
   - **الحد الأقصى للمحاولات**، **درجة النجاح**  
٤. اضغط **إنشاء**.

٥. **إضافة الأقسام والأسئلة:**
   - افتح الاختبار واذهب إلى **المنشئ** (أو `/exams/{id}/builder`).
   - أضف أقساماً (تبويبات).
   - أضف أسئلة من بنك الأسئلة لكل قسم.

[لقطة شاشة: منشئ الاختبار]

---

### ٣.٧ نشر الاختبار

١. اذهب إلى **الاختبارات** وافتح الاختبار.  
٢. تأكد من وجود سؤال واحد على الأقل والأقسام المطلوبة.  
٣. اضغط **نشر**.  
٤. أكّد في النافذة المنبثقة.  
٥. بعد النشر، يظهر الاختبار للمرشحين في **اختباراتي** (إذا كانوا مخولين).

**إلغاء النشر:** استخدم القائمة المنسدلة في قائمة الاختبارات → **إلغاء النشر** عند الحاجة.

[لقطة شاشة: تفاصيل الاختبار مع زر النشر]

---

### ٣.٨ تعيين الاختبار / إتاحته للطلاب

يتوفر الاختبار للمرشحين بناءً على:

١. **القسم** — يجب أن يكون المرشح في نفس قسم الاختبار.  
٢. **سياسة الوصول** — من **الإعدادات** (أو `/exams/{id}/configuration`):
   - **رمز الوصول** — اختياري؛ يجب على المرشح إدخاله للبدء.
   - **تقييد على المرشحين المعينين** — إن وُجد؛ واجهة التعيين غير مكتملة في النسخة الحالية.
   - **عام** — إن كان نعم، أي مرشح مخوّل في القسم يمكنه رؤية الاختبار.

٣. **حالة النشر** — يجب أن يكون الاختبار **منشوراً** ليراه المرشحون.  
٤. **الجدولة** — للاختبارات الثابتة، نافذة البداية/النهاية تحدد متى يمكن البدء.

**النسخة الحالية:** الاختبارات المنشورة في قسم المرشح تظهر في **اختباراتي** → **نشط** أو **قادم**.

[لقطة شاشة: إعدادات الاختبار — تبويب سياسة الوصول]

---

### ٣.٩ عرض محاولات الطلاب

١. اذهب إلى **التصحيح** (أو `/grading`) لعرض التسليمات التي تحتاج تصحيحاً يدوياً.  
٢. اذهب إلى **التقارير** (أو `/reports`) لعرض جميع المحاولات والنتائج لاختبار:
   - اختر الاختبار من القائمة المنسدلة.
   - اعرض الإحصائيات: إجمالي المرشحين، متوسط الدرجة، نسبة النجاح، أعلى درجة.
   - اعرض جدول النتائج بالدرجات والحالة.
   - استخدم **تصدير** لتنزيل ملف CSV.

[لقطة شاشة: صفحة التقارير مع اختبار محدد]

**ملاحظة:** قائمة «المحاولات» لكل اختبار غير مكتملة. استخدم **التقارير** و**التصحيح** لمتابعة التسليمات.

---

### ٣.١٠ مراجعة أدلة المراقبة

١. اذهب إلى **مركز المراقبة** (أو `/proctor-center`).  
٢. اعرض قائمة **الجلسات النشطة** (المرشحون الذين يجتازون الاختبار حالياً).  
٣. اضغط على جلسة لفتح التفاصيل (أو `/proctor-center/{sessionId}`).

**متوفر في النسخة الحالية:**
- **جدول اللقطات** — لقطات الكاميرا أثناء الاختبار (إذا كانت المراقبة مفعّلة).
- **جدول الحوادث/المخالفات** — أحداث مثل تغيير التبويب، الخروج من ملء الشاشة، محاولة النسخ واللصق (عند تسجيلها).

**غير مكتمل في النسخة الحالية:**
- **تسجيل الفيديو المباشر** — صفحة تفاصيل الجلسة تعرض عنصراً بديلاً للفيديو المباشر. البث المباشر غير مُنفّذ.
- **الاتصال الفوري** — مركز المراقبة قد يستخدم بيانات وهمية أو جزئية؛ الخلفية تخزن الأحداث واللقطات.

[لقطة شاشة: تفاصيل جلسة مركز المراقبة — اللقطات والحوادث]

---

### ٣.١١ الموافقة / التعديل / إنهاء النتيجة

١. اذهب إلى **التصحيح** (أو `/grading`).  
٢. اعرض قائمة التسليمات التي تحتاج تصحيحاً يدوياً (مثل المقالات).  
٣. اضغط **تصحيح** على تسليم (يفتح `/grading/{attemptId}`).  
٤. لكل سؤال يدوي:
   - اقرأ إجابة المرشح.
   - أدخل **النقاط** و**ملاحظات** اختيارية.
   - اضغط **حفظ**.  
٥. عند انتهاء تصحيح جميع الأسئلة اليدوية، اضغط **إنهاء**.  
٦. يُنشئ النظام النتيجة. يمكن للمرشح رؤيتها **بعد** نشرها (انظر أدناه).

**نشر النتائج:** تُنشأ النتائج لكنها قد لا تكون مرئية للمرشح حتى النشر. النشر يتم عبر API. زر «نشر النتيجة» مخصص في واجهة التصحيح قد لا يكون متوفراً في النسخة الحالية.

[لقطة شاشة: تفاصيل تسليم التصحيح]

---

### ٣.١٢ إصدار الشهادة

**مُنفّذ:** تُنشأ الشهادات **تلقائياً** عند نشر النتيجة ونجاح المرشح في الاختبار.

- **المرشح:** في صفحة النتيجة (`/results/{attemptId}`)، عند النجاح يظهر زر **تنزيل الشهادة**. يمكنه تنزيل شهادة قابلة للطباعة.
- **التحقق:** أي شخص يمكنه التحقق من الشهادة في `/verify-certificate` بإدخال رمز الشهادة (مثل `CERT-20260131-XXXX`).

**إجراءات المسؤول للشهادات (API فقط):**
- إنشاء شهادة لنتيجة ناجحة
- إلغاء الشهادة
- إعادة توليد الرمز

**غير متوفر في النسخة الحالية:** واجهة إدارية مخصصة لإدارة الشهادات (قائمة، إلغاء، إعادة توليد) غير متوفرة.

---

## ٤. دليل الطالب

### ٤.١ المتطلبات

- حساب مرشح صالح
- متصفح مدعوم: **Chrome** (مُوصى به)
- كاميرا ويب (إذا تطلب الاختبار المراقبة)
- اتصال إنترنت مستقر
- السماح بالكاميرا وملء الشاشة عند الطلب

---

### ٤.٢ تسجيل الدخول

١. افتح رابط التطبيق.  
٢. اذهب إلى **تسجيل الدخول** (`/login`).  
٣. أدخل **البريد الإلكتروني** و**كلمة المرور**.  
٤. اضغط **دخول**.  
٥. يتم توجيهك إلى **اختباراتي** أو لوحة التحكم.

[لقطة شاشة: صفحة تسجيل الدخول]

---

### ٤.٣ فتح الاختبار

١. اذهب إلى **اختباراتي** (أو `/my-exams`).  
٢. استخدم التبويبات: **قادم**، **نشط**، **مكتمل**.  
٣. لاختبار **نشط**، اضغط **بدء الاختبار**.  
٤. تُنقل إلى صفحة **التعليمات** (`/take-exam/{examId}/instructions`).  
٥. اقرأ التعليمات، أدخل **رمز الوصول** إن وُجد، فعّل خانة الموافقة، واضغط **بدء الاختبار**.  
٦. تُنقل إلى صفحة الاختبار (`/take-exam/{attemptId}`).

**المتابعة:** إن كان لديك محاولة قيد التنفيذ، تظهر بطاقة **متابعة** أعلى اختباراتي. اضغط عليها للمتابعة.

[لقطة شاشة: اختباراتي — الاختبارات النشطة وبطاقة المتابعة]

---

### ٤.٤ متطلبات المراقبة

عند تفعيل مراقبة الاختبار (كاميرا، ملء شاشة، إلخ):

١. **السماح بالكاميرا** — عند الطلب، اضغط **السماح** لاستخدام الكاميرا. يلتقط النظام لقطات أثناء الاختبار.  
٢. **تفعيل ملء الشاشة** — قد يطلب الاختبار ملء الشاشة. اضغط **السماح** عند طلب المتصفح.  
٣. **الإبقاء على التركيز** — تجنب تغيير التبويبات أو النوافذ. أحداث تغيير التبويب تُسجّل وقد تُراجع من المراقبين.

**تحذيرات:** إن غيرت التبويب أو خرجت من ملء الشاشة، قد تظهر تحذيرات. تُسجّل هذه الأحداث وقد تؤثر المخالفات المتكررة على نتيجتك.

[لقطة شاشة: صفحة الاختبار بملء الشاشة مع المؤقت]

---

### ٤.٥ بدء الاختبار

١. في صفحة التعليمات، تأكد من قراءة القواعد.  
٢. أدخل رمز الوصول إن تطلب الاختبار ذلك.  
٣. فعّل خانة الموافقة.  
٤. اضغط **بدء الاختبار**.  
٥. تُحمّل صفحة الاختبار بالسؤال الأول ومؤقت العد التنازلي.

[لقطة شاشة: صفحة تعليمات الاختبار]

---

### ٤.٦ الإجابة على الأسئلة

١. اقرأ كل سؤال. استخدم **السابق** و**التالي** للتنقل (إن سُمح).  
٢. لـ **اختيار من متعدد:** حدد خياراً واحداً أو أكثر.  
٣. لـ **المقال:** اكتب إجابتك في المنطقة النصية.  
٤. لـ **صح/خطأ:** حدد صح أو خطأ.  
٥. **الحفظ التلقائي:** تُحفظ الإجابات عند التنقل أو دورياً.  
٦. استخدم زر **الإشارة** لتمييز الأسئلة للمراجعة (إن وُجد).  
٧. راقب **المؤقت** أعلى الصفحة. عند انتهاء الوقت، يُرسل الاختبار تلقائياً.

[لقطة شاشة: صفحة الاختبار — سؤال وتنقل]

---

### ٤.٧ التسليم

١. عند الانتهاء، اضغط **تسليم** في الأسفل.  
٢. أكّد في النافذة المنبثقة.  
٣. تُرسل إجاباتك وتُنقل إلى صفحة **النتيجة**.

[لقطة شاشة: نافذة تأكيد التسليم]

---

### ٤.٨ ماذا يحدث بعد التسليم

١. **صفحة النتيجة** (`/results/{attemptId}`):
   - للاختبارات **المصححة تلقائياً بالكامل**، قد ترى درجتك فوراً (إن سمح الاختبار بعرض النتائج).
   - للـ **تصحيح اليدوي** (مثل المقالات)، تظهر رسالة بأن النتائج ستتوفر بعد التصحيح.

٢. **نتائجي** (`/my-results`): اعرض جميع نتائجك السابقة ودرجاتك (بعد النشر).

٣. **مراجعة الإجابات:** إن سمح الاختبار بالمراجعة، يظهر رابط **عرض المراجعة التفصيلية**. اضغطه للذهاب إلى `/results/{attemptId}/review` وعرض إجاباتك.

٤. **الشهادة:** إن نجحت ونُشرت النتيجة، يظهر زر **تنزيل الشهادة** في صفحة النتيجة. استخدمه لتنزيل وطباعة الشهادة.

[لقطة شاشة: صفحة النتيجة مع الدرجة وتنزيل الشهادة]

---

## ٥. استكشاف الأخطاء والأسئلة الشائعة

### ٥.١ المشكلات والحلول الشائعة

| المشكلة | الحل |
|---------|------|
| **رفض إذن الكاميرا** | في إعدادات المتصفح، اسمح بالكاميرا لهذا الموقع. حدّث الصفحة وحاول مرة أخرى. |
| **حظر ملء الشاشة** | اسمح بملء الشاشة عند طلب المتصفح. تجنب الإضافات التي تمنع ملء الشاشة. |
| **عدم اكتشاف الميكروفون/الكاميرا** | تأكد من توصيل الجهاز وعدم استخدامه من تطبيق آخر وتمكينه في نظام التشغيل والمتصفح. |
| **انتهاء الجلسة** | سجّل الدخول مرة أخرى. إن انتهى وقت الاختبار، ربما أُرسلت المحاولة تلقائياً. |
| **401 غير مصرح** | سجّل الدخول مرة أخرى. امسح الكاش/الكوكيز إن استمرت المشكلة. |
| **عدم حفظ الإجابات** | تحقق من الاتصال. تجنب إغلاق التبويب. حدّث الصفحة عند الضرورة فقط. |
| **عدم ظهور النتيجة** | قد تكون النتائج مخفية حتى نشرها المدرّب. تواصل مع مدرّبك. |

### ٥.٢ أسئلة شائعة

**س: هل أستطيع استخدام هاتفي للاختبار؟**  
ج: يُنصح بجهاز كمبيوتر أو كمبيوتر محمول بشاشة أكبر. دعم الهواتف قد يكون محدوداً.

**س: ماذا إن انقطع الاتصال أثناء الاختبار؟**  
ج: أعد الاتصال وعد إلى صفحة الاختبار. إجاباتك السابقة ينبغي أن تكون محفوظة. المؤقت يستمر من الخادم.

**س: هل أستطيع العودة للأسئلة السابقة؟**  
ج: يعتمد على إعدادات الاختبار. بعض الاختبارات تقفل الأقسام السابقة أو تمنع التنقل للخلف.

**س: كيف أتحقق من شهادتي؟**  
ج: اذهب إلى `/verify-certificate` وأدخل رمز الشهادة (مثل `CERT-20260131-XXXX`).

---

## ٦. ملاحظات أمنية

**لا تفعل:**
- مشاركة بيانات تسجيل الدخول.
- تغيير التبويبات أو النوافذ أثناء اختبار مراقب.
- استخدام أدوات التقاط الشاشة أو التسجيل أثناء الاختبار.
- السماح لآخرين بأداء الاختبار نيابة عنك.
- استخدام أكثر من جهاز للمحاولة نفسها.
- تعطيل الكاميرا أو ملء الشاشة عند طلب الاختبار.

**افعل:**
- استخدم مكاناً هادئاً وخاصاً.
- تأكد من أمان جهازك وخلوه من البرمجيات الخبيثة.
- أغلق التطبيقات الأخرى التي قد تُطلق أحداث مراقبة.
- أبقِ تبويب الاختبار في التركيز وملء الشاشة عند المطلوب.

---

## ٧. مسرد المصطلحات

| المصطلح | التعريف |
|---------|---------|
| **اختبار** | تقييم مُكوّن من أسئلة ومدة وإعدادات. |
| **محاولة** | تنفيذ واحد لمرشح لأداء الاختبار. قد يكون للمرشح عدة محاولات لكل اختبار. |
| **مراقبة الاختبار** | المراقبة أثناء الاختبار (لقطات كاميرا، أحداث تغيير التبويب وملء الشاشة). |
| **مخالفة** | حدث مُسجّل مثل تغيير التبويب أو الخروج من ملء الشاشة أو محاولة النسخ واللصق. |
| **مصحّح** | مسؤول أو مدرّب يصحح الأسئلة اليدوية وينهي النتائج. |
| **نتيجة** | الدرجة النهائية وحالة النجاح/الرسوب للمحاولة، بعد انتهاء التصحيح. |
| **شهادة** | وثيقة تُصدر للمرشحين الناجحين، برمز تحقق فريد. |

---

## ٨. الملحق: متطلبات المتصفح والجهاز

- **مُوصى به:** Google Chrome (أحدث إصدار)
- **مدعوم:** Microsoft Edge، Firefox، Safari (أحدث إصدار)
- **الشاشة:** 1024×768 كحد أدنى
- **الكاميرا:** مطلوبة للاختبارات المراقبة؛ 720p أو أعلى مُوصى به
- **الشبكة:** إنترنت عريض النطاق مستقر
- **الأذونات:** السماح بالكاميرا والميكروفون (إن لزم) وملء الشاشة لموقع الاختبار

**أذونات الكاميرا في Chrome:**
١. اضغط أيقونة القفل/المعلومات في شريط العنوان.  
٢. ابحث عن **الكاميرا** → اختر **السماح**.  
٣. حدّث الصفحة عند الحاجة.

---

*End of User Manual*
