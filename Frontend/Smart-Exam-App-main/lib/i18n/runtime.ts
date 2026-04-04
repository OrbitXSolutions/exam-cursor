import type { Language } from "./translations";

export const DEFAULT_LANGUAGE: Language = "en";

const exactMessageMap: Record<string, string> = {
  "Operation failed": "فشلت العملية.",
  "Validation failed.": "فشل التحقق من صحة البيانات.",
  "Validation failed": "فشل التحقق من صحة البيانات.",
  "Unauthorized access.": "غير مصرح لك بتنفيذ هذا الإجراء.",
  "Unauthorized access": "غير مصرح لك بتنفيذ هذا الإجراء.",
  Unauthorized: "غير مصرح لك بتنفيذ هذا الإجراء.",
  "Session expired. Please login again.":
    "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
  "An internal server error occurred. Please try again later.":
    "حدث خطأ داخلي في الخادم. يرجى المحاولة مرة أخرى لاحقاً.",
  "Multiple violations detected. Your exam may be flagged for review.":
    "تم رصد عدة مخالفات. قد يتم تحويل اختبارك للمراجعة.",
  "Please stay focused on your exam.": "يرجى الاستمرار بالتركيز على اختبارك.",
  "Your exam has been terminated by the proctor.":
    "تم إنهاء اختبارك من قبل المراقب.",
  "Your exam has been terminated by the proctor":
    "تم إنهاء اختبارك من قبل المراقب.",
  "The exam schedule window has closed. Your attempt has been ended.":
    "تم إغلاق نافذة موعد الاختبار، وتم إنهاء محاولتك.",
  "Time has expired! Your exam will be submitted automatically.":
    "انتهى الوقت. سيتم إرسال اختبارك تلقائياً.",
  "Warning message is required": "رسالة التحذير مطلوبة.",
  "Only failed notifications can be retried.":
    "يمكن إعادة محاولة الإشعارات الفاشلة فقط.",
  "Notification queued for retry.":
    "تمت إعادة جدولة الإشعار للمحاولة مرة أخرى.",
  "Notification settings updated.": "تم تحديث إعدادات الإشعارات.",
  "Template updated.": "تم تحديث القالب.",
  "Template not found.": "القالب غير موجود.",
  "Notification log not found.": "سجل الإشعار غير موجود.",
  "Test email sent successfully.": "تم إرسال البريد الإلكتروني التجريبي بنجاح.",
  "Failed to send test email. Check your SMTP settings.":
    "فشل إرسال البريد الإلكتروني التجريبي. يرجى التحقق من إعدادات SMTP.",
  "Test SMS sent successfully.": "تم إرسال الرسالة النصية التجريبية بنجاح.",
  "Failed to send test SMS. Check your SMS settings.":
    "فشل إرسال الرسالة النصية التجريبية. يرجى التحقق من إعدادات خدمة الرسائل.",
  "File too large (max 5MB)": "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.",
  "Only image files allowed": "يُسمح بملفات الصور فقط.",
  "Upload failed": "فشل رفع الملف.",
  "Camera connected": "تم تشغيل الكاميرا بنجاح.",
  "Camera access failed": "تعذر الوصول إلى الكاميرا.",
  "Snapshot upload failed - retrying next cycle":
    "فشل رفع لقطة المراقبة. ستتم إعادة المحاولة في الدورة التالية.",
  "Proctor snapshots are not uploading": "لا يتم رفع لقطات المراقبة حالياً.",
  "Question type created successfully": "تم إنشاء نوع السؤال بنجاح.",
  "Question type updated successfully": "تم تحديث نوع السؤال بنجاح.",
  "Question type deleted successfully": "تم حذف نوع السؤال بنجاح.",
  "Category created successfully": "تم إنشاء الفئة بنجاح.",
  "Category updated successfully": "تم تحديث الفئة بنجاح.",
  "Category deleted successfully": "تم حذف الفئة بنجاح.",
  "Question created successfully": "تم إنشاء السؤال بنجاح.",
  "Question updated successfully": "تم تحديث السؤال بنجاح.",
  "Question deleted successfully": "تم حذف السؤال بنجاح.",
  "Question created but image upload failed. You can add the image later.":
    "تم إنشاء السؤال لكن فشل رفع الصورة. يمكنك إضافتها لاحقاً.",
  "Question updated but image upload failed.":
    "تم تحديث السؤال لكن فشل رفع الصورة.",
  "Attachment removed": "تمت إزالة المرفق.",
  "Failed to remove attachment": "فشل إزالة المرفق.",
  "Builder configuration saved successfully": "تم حفظ إعدادات البناء بنجاح.",
  "Login successful": "تم تسجيل الدخول بنجاح.",
  "Login failed": "فشل تسجيل الدخول.",
  "Logged out successfully": "تم تسجيل الخروج بنجاح.",
  "Profile updated successfully (mock)": "تم تحديث الملف الشخصي بنجاح.",
  "Password changed successfully (mock)": "تم تغيير كلمة المرور بنجاح.",
  "New attempt override granted successfully": "تم منح محاولة إضافية بنجاح.",
  "Attempt terminated successfully": "تم إنهاء المحاولة بنجاح.",
  "Result updated. Opening Candidate Result page.":
    "تم تحديث النتيجة. جارٍ فتح صفحة نتيجة المرشح.",
  "AI analysis generated successfully":
    "تم إنشاء تحليل الذكاء الاصطناعي بنجاح.",
  "Bulk action failed": "فشل الإجراء الجماعي.",
  "Verification submitted successfully!": "تم إرسال طلب التحقق بنجاح.",
  "Submission failed. Please try again.":
    "فشل الإرسال. يرجى المحاولة مرة أخرى.",
  "Verification not found": "طلب التحقق غير موجود.",
  "Verification not found.": "طلب التحقق غير موجود.",
  "Session not found": "الجلسة غير موجودة.",
  "Session not found.": "الجلسة غير موجودة.",
  "Session is not active": "الجلسة غير نشطة.",
  "Attempt not found": "المحاولة غير موجودة.",
  "Attempt is not in progress": "المحاولة ليست قيد التنفيذ.",
  "Exam not found": "الاختبار غير موجود.",
  "Question not found": "السؤال غير موجود.",
  "Rule not found": "القاعدة غير موجودة.",
  "Evidence not found": "الدليل غير موجود.",
  "Evidence not yet uploaded": "لم يتم رفع الدليل بعد.",
  "No decision found": "لا يوجد قرار مسجل.",
  // Smart monitoring violation messages
  "Your face is not visible. Please look at the screen.":
    "وجهك غير مرئي. يرجى النظر إلى الشاشة.",
  "Multiple faces detected. Only the candidate should be visible.":
    "تم اكتشاف وجوه متعددة. يجب أن يكون المرشح فقط مرئياً.",
  "Your face is out of frame. Please center yourself in the camera.":
    "وجهك خارج الإطار. يرجى توسيط نفسك أمام الكاميرا.",
  "Please face the screen directly. Looking away is not allowed.":
    "يرجى مواجهة الشاشة مباشرة. النظر بعيداً غير مسموح.",
  "Your camera appears to be blocked or covered. Please uncover it.":
    "يبدو أن الكاميرا محجوبة أو مغطاة. يرجى كشفها.",
  // Smart monitoring detail messages
  "No face detected in camera view — candidate may be away or hidden":
    "لم يتم اكتشاف وجه في الكاميرا — قد يكون المرشح بعيداً أو مخفياً",
  "More than one face detected in camera view — possible unauthorized assistance":
    "تم اكتشاف أكثر من وجه في الكاميرا — احتمال مساعدة غير مصرح بها",
  "Camera view is dark or obstructed — possible intentional blocking":
    "عرض الكاميرا مظلم أو محجوب — احتمال حجب متعمد",
  "Candidate is not facing the screen — head turned beyond threshold":
    "المرشح لا يواجه الشاشة — تم تحويل الرأس بزاوية تتجاوز الحد المسموح",
  // Proctor warnings
  "Warning sent successfully": "تم إرسال التحذير بنجاح.",
  "Session flagged": "تم تعليم الجلسة.",
  "Session unflagged": "تم إلغاء تعليم الجلسة.",
  "Session terminated": "تم إنهاء الجلسة.",
  "Session terminated successfully": "تم إنهاء الجلسة بنجاح.",
  "Incident created": "تم إنشاء حادثة.",
  "Incident created successfully": "تم إنشاء الحادثة بنجاح.",
  "Failed to create incident": "فشل إنشاء الحادثة.",
  "Failed to send warning": "فشل إرسال التحذير.",
  "Failed to terminate session": "فشل إنهاء الجلسة.",
  "Event logged — attempt auto-terminated":
    "تم تسجيل الحدث — تم إنهاء المحاولة تلقائياً.",
};

const entityMap: Record<string, string> = {
  exam: "الاختبار",
  exams: "الاختبارات",
  question: "السؤال",
  questions: "الأسئلة",
  category: "الفئة",
  categories: "الفئات",
  type: "النوع",
  "question type": "نوع السؤال",
  "question types": "أنواع الأسئلة",
  subject: "المادة",
  subjects: "المواد",
  topic: "الموضوع",
  topics: "المواضيع",
  department: "القسم",
  departments: "الأقسام",
  session: "الجلسة",
  result: "النتيجة",
  results: "النتائج",
  candidate: "المرشح",
  candidates: "المرشحون",
  user: "المستخدم",
  users: "المستخدمون",
  schedule: "الجدول",
  schedules: "الجداول",
  template: "القالب",
  templates: "القوالب",
  notification: "الإشعار",
  notifications: "الإشعارات",
  settings: "الإعدادات",
  incident: "الحادثة",
  incidents: "الحوادث",
  submission: "التسليم",
  submissions: "عمليات التسليم",
  file: "الملف",
  image: "الصورة",
  video: "الفيديو",
  recording: "التسجيل",
  report: "التقرير",
  review: "المراجعة",
  reason: "السبب",
  certificate: "الشهادة",
  journey: "الرحلة",
  journeys: "الرحلات",
  journeyes: "الرحلات",
  data: "البيانات",
  details: "التفاصيل",
  logs: "السجلات",
  log: "السجل",
  batch: "الدفعة",
  batches: "الدفعات",
  profile: "الملف الشخصي",
  password: "كلمة المرور",
  email: "البريد الإلكتروني",
  phone: "رقم الهاتف",
  "access code": "رمز الدخول",
  "form data": "بيانات النموذج",
  chunks: "الأجزاء",
  "video chunks": "أجزاء الفيديو",
  chunk: "جزء الفيديو",
};

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\u2022|â€¢/g, "-")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function translateEntity(value: string): string {
  const normalized = value.trim().replace(/\.+$/, "").toLowerCase();
  return entityMap[normalized] ?? value.trim();
}

function withArabicRef(message: string): string {
  return message.replace(/\(Ref:\s*([^)]+)\)$/i, "(المرجع: $1)");
}

function translatePattern(message: string): string | null {
  let match = message.match(/^(.+?) not found\.?$/i);
  if (match) return `${translateEntity(match[1])} غير موجود.`;

  match = message.match(/^Failed to load (.+?)\.?$/i);
  if (match) return `فشل تحميل ${translateEntity(match[1])}.`;

  match = message.match(/^Failed to create (.+?)\.?$/i);
  if (match) return `فشل إنشاء ${translateEntity(match[1])}.`;

  match = message.match(/^Failed to update (.+?)\.?$/i);
  if (match) return `فشل تحديث ${translateEntity(match[1])}.`;

  match = message.match(/^Failed to save (.+?)\.?$/i);
  if (match) return `فشل حفظ ${translateEntity(match[1])}.`;

  match = message.match(/^Failed to delete (.+?)\.?$/i);
  if (match) return `فشل حذف ${translateEntity(match[1])}.`;

  match = message.match(/^Failed to send (.+?)\.?$/i);
  if (match) return `فشل إرسال ${translateEntity(match[1])}.`;

  match = message.match(/^Failed to load chunks \((\d+)\)$/i);
  if (match) return `فشل تحميل أجزاء الفيديو (${match[1]}).`;

  match = message.match(/^(.+?) created successfully!?$/i);
  if (match) return `تم إنشاء ${translateEntity(match[1])} بنجاح.`;

  match = message.match(/^(.+?) updated successfully!?$/i);
  if (match) return `تم تحديث ${translateEntity(match[1])} بنجاح.`;

  match = message.match(/^(.+?) deleted successfully!?$/i);
  if (match) return `تم حذف ${translateEntity(match[1])} بنجاح.`;

  match = message.match(/^(.+?) uploaded successfully!?$/i);
  if (match) return `تم رفع ${translateEntity(match[1])} بنجاح.`;

  match = message.match(/^(.+?) sent successfully!?$/i);
  if (match) return `تم إرسال ${translateEntity(match[1])} بنجاح.`;

  match = message.match(/^(.+?) activated\.?$/i);
  if (match) return `تم تفعيل ${translateEntity(match[1])}.`;

  match = message.match(/^(.+?) deactivated\.?$/i);
  if (match) return `تم تعطيل ${translateEntity(match[1])}.`;

  match = message.match(/^Please enter (.+?)\.?$/i);
  if (match) return `يرجى إدخال ${translateEntity(match[1])}.`;

  match = message.match(/^Please select (.+?)\.?$/i);
  if (match) return `يرجى اختيار ${translateEntity(match[1])}.`;

  match = message.match(/^File size must be less than (.+?)\.?$/i);
  if (match) return `يجب أن يكون حجم الملف أقل من ${match[1]}.`;

  match = message.match(/^HTTP Error:\s*(\d+)$/i);
  if (match) return `خطأ في الاتصال بالخادم (${match[1]}).`;

  match = message.match(/^(\d+)\s+minutes added successfully$/i);
  if (match) return `تمت إضافة ${match[1]} دقيقة بنجاح.`;

  match = message.match(/^Generated (\d+) questions successfully!?$/i);
  if (match) return `تم إنشاء ${match[1]} سؤالاً بنجاح.`;

  // ── Proctoring: LAST WARNING from server ──
  match = message.match(
    /^⚠?\s*LAST WARNING:.*?reached (\d+) of (\d+) allowed violations/i,
  );
  if (match)
    return `⚠ تحذير أخير: هذا تحذيرك الأخير. لقد وصلت إلى ${match[1]} من ${match[2]} مخالفة مسموحة. المخالفة التالية ستنهي اختبارك تلقائياً.`;

  // ── Proctoring: Auto-terminated reason ──
  match = message.match(
    /^Auto-terminated:\s*exceeded maximum violations\s*\((\d+)\)$/i,
  );
  if (match)
    return `تم إنهاء الاختبار تلقائياً: تم تجاوز الحد الأقصى للمخالفات (${match[1]}).`;

  match = message.match(/^Exceeded maximum violations\s*\((\d+)\)$/i);
  if (match) return `تم تجاوز الحد الأقصى للمخالفات (${match[1]}).`;

  // ── Smart monitoring violation messages ──
  match = message.match(/^Your face is not visible/i);
  if (match) return "وجهك غير مرئي. يرجى النظر إلى الشاشة.";

  match = message.match(/^Multiple faces detected/i);
  if (match) return "تم اكتشاف وجوه متعددة. يجب أن يكون المرشح فقط مرئياً.";

  match = message.match(/^Your face is out of frame/i);
  if (match) return "وجهك خارج الإطار. يرجى توسيط نفسك أمام الكاميرا.";

  match = message.match(/^Please face the screen directly/i);
  if (match) return "يرجى مواجهة الشاشة مباشرة. النظر بعيداً غير مسموح.";

  match = message.match(/^Your camera appears to be blocked/i);
  if (match) return "يبدو أن الكاميرا محجوبة أو مغطاة. يرجى كشفها.";

  // ── Smart monitoring detail messages ──
  match = message.match(/^No face detected in camera view/i);
  if (match)
    return "لم يتم اكتشاف وجه في الكاميرا — قد يكون المرشح بعيداً أو مخفياً.";

  match = message.match(/^More than one face detected/i);
  if (match) return "تم اكتشاف أكثر من وجه — قد يكون شخص آخر موجوداً.";

  match = message.match(/^Face moved too far (.+?) from the camera center$/i);
  if (match)
    return `ابتعد الوجه كثيراً ${match[1] === "left" ? "لليسار" : match[1] === "right" ? "لليمين" : match[1] === "up" ? "للأعلى" : "للأسفل"} عن مركز الكاميرا.`;

  match = message.match(/^Head turned beyond/i);
  if (match) return "تم تحويل الرأس بزاوية تتجاوز الحد المسموح.";

  match = message.match(/^Camera view is dark or obstructed/i);
  if (match) return "عرض الكاميرا مظلم أو محجوب.";

  return null;
}

function translateMessageLine(message: string): string {
  const cleaned = normalizeWhitespace(message);
  if (!cleaned) return cleaned;

  const bulletMatch = cleaned.match(/^(-\s+)/);
  const bulletPrefix = bulletMatch?.[1] ?? "";
  const body = bulletPrefix ? cleaned.slice(bulletPrefix.length) : cleaned;
  const translated =
    exactMessageMap[body] ??
    exactMessageMap[body.replace(/[.!]$/, "")] ??
    translatePattern(body) ??
    body;

  return `${bulletPrefix}${withArabicRef(translated)}`;
}

export function getResolvedLanguage(language?: string | null): Language {
  if (language === "en" || language === "ar") {
    return language;
  }

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("language");
    if (stored === "en" || stored === "ar") {
      return stored;
    }
  }

  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === "en" || htmlLang === "ar") {
      return htmlLang;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function localizeText(
  englishText: string,
  arabicText: string,
  language?: string | null,
): string {
  return getResolvedLanguage(language) === "ar" ? arabicText : englishText;
}

export function translateServerMessage(
  message: string,
  language?: string | null,
): string {
  const resolvedLanguage = getResolvedLanguage(language);
  const cleaned = normalizeWhitespace(message);

  if (!cleaned || resolvedLanguage !== "ar") {
    return cleaned;
  }

  return cleaned
    .split("\n")
    .map((line) => translateMessageLine(line))
    .join("\n");
}
