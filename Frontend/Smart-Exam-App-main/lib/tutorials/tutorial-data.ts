// Tutorial content data for all modules
// Each tutorial module has bilingual content (EN/AR)

export interface TutorialStep {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  tipEn?: string;
  tipAr?: string;
  noteEn?: string;
  noteAr?: string;
  imagePlaceholder?: string; // path to image in /tutorials/ folder
  fields?: TutorialField[];
}

export interface TutorialField {
  nameEn: string;
  nameAr: string;
  required: boolean;
  descriptionEn: string;
  descriptionAr: string;
}

export interface TutorialExample {
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
}

export interface TutorialSection {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  steps: TutorialStep[];
  examples?: TutorialExample[];
}

export interface TutorialModule {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconName: string;
  sections: TutorialSection[];
  videoPlaceholder?: string;
}

// ────────────────────────────────────────────────────────
// QUESTION BANK MODULE
// ────────────────────────────────────────────────────────
export const questionBankTutorial: TutorialModule = {
  id: "question-bank",
  slug: "question-bank",
  titleEn: "Question Bank",
  titleAr: "بنك الأسئلة",
  descriptionEn:
    "Learn how to manage subjects, topics, and questions. Create questions manually or use AI Studio to generate them automatically.",
  descriptionAr:
    "تعلّم كيفية إدارة المواد والمواضيع والأسئلة. أنشئ الأسئلة يدوياً أو استخدم استوديو AI لتوليدها تلقائياً.",
  iconName: "Library",
  videoPlaceholder: "/tutorials/question-bank-overview.mp4",
  sections: [
    // ─── Section 1: Manage Subjects ────
    {
      id: "subjects",
      titleEn: "1. Manage Subjects",
      titleAr: "1. إدارة المواد",
      descriptionEn:
        "Subjects are the top-level categories for organizing your question bank. Each subject can contain multiple topics.",
      descriptionAr:
        "المواد هي التصنيفات الرئيسية لتنظيم بنك الأسئلة. يمكن أن تحتوي كل مادة على عدة مواضيع.",
      steps: [
        {
          id: "subjects-navigate",
          titleEn: "Navigate to Subjects",
          titleAr: "الانتقال إلى المواد",
          descriptionEn:
            'From the sidebar, expand "Question Bank" and click "Subjects". You\'ll see the list of all existing subjects.',
          descriptionAr:
            'من القائمة الجانبية، وسّع "بنك الأسئلة" ثم انقر على "المواد". ستظهر لك قائمة بجميع المواد الموجودة.',
          imagePlaceholder: "/tutorials/subjects-nav.png",
          tipEn:
            "You can use the search bar at the top to quickly find a subject by name.",
          tipAr:
            "يمكنك استخدام شريط البحث في الأعلى للعثور سريعاً على مادة بالاسم.",
        },
        {
          id: "subjects-create",
          titleEn: "Create a New Subject",
          titleAr: "إنشاء مادة جديدة",
          descriptionEn:
            'Click the "+ Add Subject" button. Fill in the subject name in both English and Arabic, then click Save.',
          descriptionAr:
            'انقر على زر "+ إضافة مادة". أدخل اسم المادة باللغتين العربية والإنجليزية ثم انقر حفظ.',
          imagePlaceholder: "/tutorials/subjects-create.png",
          fields: [
            {
              nameEn: "Name (English)",
              nameAr: "الاسم (إنجليزي)",
              required: true,
              descriptionEn: "Subject name in English",
              descriptionAr: "اسم المادة بالإنجليزية",
            },
            {
              nameEn: "Name (Arabic)",
              nameAr: "الاسم (عربي)",
              required: true,
              descriptionEn: "Subject name in Arabic",
              descriptionAr: "اسم المادة بالعربية",
            },
            {
              nameEn: "Description",
              nameAr: "الوصف",
              required: false,
              descriptionEn: "Optional description for the subject",
              descriptionAr: "وصف اختياري للمادة",
            },
          ],
        },
        {
          id: "subjects-edit-delete",
          titleEn: "Edit or Delete a Subject",
          titleAr: "تعديل أو حذف مادة",
          descriptionEn:
            "Click the three-dot menu (⋮) on any subject row to Edit or Delete it. Subjects with topics linked cannot be deleted.",
          descriptionAr:
            "انقر على قائمة النقاط الثلاث (⋮) في أي صف مادة لتعديلها أو حذفها. لا يمكن حذف المواد المرتبطة بمواضيع.",
          imagePlaceholder: "/tutorials/subjects-actions.png",
          noteEn:
            "Deleting a subject is permanent. Make sure no topics or questions are linked to it first.",
          noteAr:
            "حذف المادة نهائي. تأكد من عدم وجود مواضيع أو أسئلة مرتبطة بها أولاً.",
        },
      ],
      examples: [
        {
          titleEn: "Example Subject",
          titleAr: "مثال على مادة",
          contentEn:
            "Subject: Mathematics (EN) / الرياضيات (AR)\nDescription: Covers algebra, geometry, and calculus topics.",
          contentAr:
            "المادة: Mathematics (EN) / الرياضيات (AR)\nالوصف: تغطي مواضيع الجبر والهندسة والتفاضل والتكامل.",
        },
      ],
    },

    // ─── Section 2: Manage Topics ────
    {
      id: "topics",
      titleEn: "2. Manage Topics",
      titleAr: "2. إدارة المواضيع",
      descriptionEn:
        "Topics belong to subjects and help further organize questions. Each question is assigned to exactly one topic.",
      descriptionAr:
        "المواضيع تتبع المواد وتساعد في تنظيم الأسئلة بشكل أدق. يتم تعيين كل سؤال لموضوع واحد فقط.",
      steps: [
        {
          id: "topics-navigate",
          titleEn: "Navigate to Topics",
          titleAr: "الانتقال إلى المواضيع",
          descriptionEn:
            'From the sidebar, expand "Question Bank" and click "Topics". You\'ll see all topics grouped by subject.',
          descriptionAr:
            'من القائمة الجانبية، وسّع "بنك الأسئلة" ثم انقر على "المواضيع". ستظهر لك جميع المواضيع مُجمَّعة حسب المادة.',
          imagePlaceholder: "/tutorials/topics-nav.png",
        },
        {
          id: "topics-create",
          titleEn: "Create a New Topic",
          titleAr: "إنشاء موضوع جديد",
          descriptionEn:
            'Click "+ Add Topic". Select a parent subject, then enter the topic name in English and Arabic.',
          descriptionAr:
            'انقر "+ إضافة موضوع". اختر المادة الأم ثم أدخل اسم الموضوع بالعربية والإنجليزية.',
          imagePlaceholder: "/tutorials/topics-create.png",
          fields: [
            {
              nameEn: "Subject",
              nameAr: "المادة",
              required: true,
              descriptionEn: "The parent subject this topic belongs to",
              descriptionAr: "المادة الأم التي ينتمي إليها الموضوع",
            },
            {
              nameEn: "Name (English)",
              nameAr: "الاسم (إنجليزي)",
              required: true,
              descriptionEn: "Topic name in English",
              descriptionAr: "اسم الموضوع بالإنجليزية",
            },
            {
              nameEn: "Name (Arabic)",
              nameAr: "الاسم (عربي)",
              required: true,
              descriptionEn: "Topic name in Arabic",
              descriptionAr: "اسم الموضوع بالعربية",
            },
          ],
          tipEn:
            "Choose your subjects first before creating topics. A well-organized subject-topic hierarchy makes question management much easier.",
          tipAr:
            "اختر المواد أولاً قبل إنشاء المواضيع. التنظيم الجيد للمواد والمواضيع يسهّل إدارة الأسئلة بشكل كبير.",
        },
      ],
      examples: [
        {
          titleEn: "Example Topic",
          titleAr: "مثال على موضوع",
          contentEn:
            "Subject: Mathematics\n→ Topic: Algebra (EN) / الجبر (AR)\n→ Topic: Geometry (EN) / الهندسة (AR)",
          contentAr:
            "المادة: الرياضيات\n← الموضوع: Algebra (EN) / الجبر (AR)\n← الموضوع: Geometry (EN) / الهندسة (AR)",
        },
      ],
    },

    // ─── Section 3: Create Questions ────
    {
      id: "create-questions",
      titleEn: "3. Create Questions",
      titleAr: "3. إنشاء الأسئلة",
      descriptionEn:
        "Create new questions step by step: select the type, fill in the body in both languages, set subject/topic, configure options, and save.",
      descriptionAr:
        "أنشئ أسئلة جديدة خطوة بخطوة: اختر النوع، أدخل نص السؤال باللغتين، حدد المادة/الموضوع، أعدَّ الخيارات ثم احفظ.",
      steps: [
        {
          id: "questions-navigate",
          titleEn: "Go to Questions List",
          titleAr: "الانتقال إلى قائمة الأسئلة",
          descriptionEn:
            'From the sidebar, expand "Question Bank" → click "Questions". You\'ll see all questions with filters for subject, topic, type, and difficulty.',
          descriptionAr:
            'من القائمة الجانبية، وسّع "بنك الأسئلة" → انقر "الأسئلة". ستظهر لك جميع الأسئلة مع فلاتر للمادة والموضوع والنوع والصعوبة.',
          imagePlaceholder: "/tutorials/questions-list.png",
          tipEn:
            "Use the filters and search to quickly find questions. You can filter by subject, topic, question type, and difficulty level simultaneously.",
          tipAr:
            "استخدم الفلاتر والبحث للعثور سريعاً على الأسئلة. يمكنك التصفية بالمادة والموضوع ونوع السؤال ومستوى الصعوبة في آن واحد.",
        },
        {
          id: "questions-click-create",
          titleEn: "Click Create Question",
          titleAr: "انقر إنشاء سؤال",
          descriptionEn:
            'Click the "+ Create Question" button at the top right. This opens the question creation form.',
          descriptionAr:
            'انقر على زر "+ إنشاء سؤال" في أعلى اليمين. سيفتح نموذج إنشاء السؤال.',
          imagePlaceholder: "/tutorials/questions-create-btn.png",
        },
        {
          id: "questions-select-type",
          titleEn: "Select Question Type",
          titleAr: "اختيار نوع السؤال",
          descriptionEn:
            "Choose the question type from the dropdown. Available types: MCQ Single Answer, MCQ Multiple Answers, True/False, and Subjective (Essay).",
          descriptionAr:
            "اختر نوع السؤال من القائمة المنسدلة. الأنواع المتاحة: اختيار من متعدد (إجابة واحدة)، اختيار من متعدد (إجابات متعددة)، صح/خطأ، وسؤال مقالي.",
          imagePlaceholder: "/tutorials/questions-type-select.png",
          tipEn:
            "Each question type has different grading rules. See the 'Question Types' section below for details.",
          tipAr:
            "لكل نوع سؤال قواعد تصحيح مختلفة. راجع قسم 'أنواع الأسئلة' أدناه للتفاصيل.",
        },
        {
          id: "questions-fill-body",
          titleEn: "Fill Question Body (EN/AR)",
          titleAr: "إدخال نص السؤال (EN/AR)",
          descriptionEn:
            "Enter the question text in the English field (required). The Arabic field is optional — if left empty, the English text will be used as fallback.",
          descriptionAr:
            "أدخل نص السؤال في حقل اللغة الإنجليزية (مطلوب). حقل العربية اختياري — إذا ترك فارغاً، سيتم استخدام النص الإنجليزي كبديل.",
          imagePlaceholder: "/tutorials/questions-body.png",
          fields: [
            {
              nameEn: "Question Body (English)",
              nameAr: "نص السؤال (إنجليزي)",
              required: true,
              descriptionEn: "The question text in English",
              descriptionAr: "نص السؤال بالإنجليزية",
            },
            {
              nameEn: "Question Body (Arabic)",
              nameAr: "نص السؤال (عربي)",
              required: false,
              descriptionEn: "Optional — falls back to English text if empty",
              descriptionAr: "اختياري — يعود للنص الإنجليزي إذا ترك فارغاً",
            },
          ],
        },
        {
          id: "questions-set-subject-topic",
          titleEn: "Set Subject & Topic",
          titleAr: "تحديد المادة والموضوع",
          descriptionEn:
            "Select the subject first, then the topic will be filtered automatically. Only topics belonging to the selected subject will appear.",
          descriptionAr:
            "اختر المادة أولاً، ثم سيتم تصفية المواضيع تلقائياً. ستظهر فقط المواضيع التابعة للمادة المختارة.",
          imagePlaceholder: "/tutorials/questions-subject-topic.png",
          fields: [
            {
              nameEn: "Subject",
              nameAr: "المادة",
              required: true,
              descriptionEn: "The subject this question belongs to",
              descriptionAr: "المادة التي ينتمي إليها السؤال",
            },
            {
              nameEn: "Topic",
              nameAr: "الموضوع",
              required: false,
              descriptionEn: "Optional — the topic under the selected subject",
              descriptionAr: "اختياري — الموضوع تحت المادة المختارة",
            },
          ],
        },
        {
          id: "questions-set-difficulty-points",
          titleEn: "Set Difficulty & Points",
          titleAr: "تحديد الصعوبة والنقاط",
          descriptionEn:
            "Choose the difficulty level (Easy, Medium, Hard) and assign points. Difficulty defaults to Easy. Points default to 1, minimum 0.5, in steps of 0.5.",
          descriptionAr:
            "اختر مستوى الصعوبة (سهل، متوسط، صعب) وحدد النقاط. الصعوبة الافتراضية سهل. النقاط الافتراضية 1، الحد الأدنى 0.5، بخطوات 0.5.",
          imagePlaceholder: "/tutorials/questions-difficulty.png",
          fields: [
            {
              nameEn: "Difficulty Level",
              nameAr: "مستوى الصعوبة",
              required: false,
              descriptionEn: "Easy (default), Medium, or Hard",
              descriptionAr: "سهل (افتراضي)، متوسط، أو صعب",
            },
            {
              nameEn: "Points",
              nameAr: "النقاط",
              required: false,
              descriptionEn:
                "Default: 1. Minimum 0.5, step 0.5 (e.g., 0.5, 1, 1.5, 2, 5.5)",
              descriptionAr:
                "افتراضي: 1. الحد الأدنى 0.5، بخطوات 0.5 (مثل 0.5، 1، 1.5، 2، 5.5)",
            },
          ],
          tipEn:
            "Points support decimal values in steps of 0.5. You can set 0.5, 1.5, 5.5 etc. for precise scoring.",
          tipAr:
            "النقاط تدعم القيم العشرية بخطوات 0.5. يمكنك تعيين 0.5، 1.5، 5.5 إلخ للتسجيل الدقيق.",
        },
        {
          id: "questions-add-options",
          titleEn: "Add Answer Options (for MCQ/True-False)",
          titleAr: "إضافة خيارات الإجابة (للاختيار من متعدد/صح-خطأ)",
          descriptionEn:
            "For MCQ and True/False questions, add answer options. Each option needs text in EN/AR. Mark the correct answer(s) using the checkbox.",
          descriptionAr:
            "لأسئلة الاختيار من متعدد والصح/الخطأ، أضف خيارات الإجابة. كل خيار يحتاج نصاً بالعربية والإنجليزية. حدد الإجابة(ات) الصحيحة باستخدام مربع التحديد.",
          imagePlaceholder: "/tutorials/questions-options.png",
          tipEn:
            "For MCQ Single: mark exactly one correct answer. For MCQ Multi: mark all correct answers. For True/False: only True and False options are available.",
          tipAr:
            "للاختيار الفردي: حدد إجابة صحيحة واحدة فقط. للاختيار المتعدد: حدد جميع الإجابات الصحيحة. للصح/الخطأ: متاح فقط خياري صح وخطأ.",
        },
        {
          id: "questions-attachment",
          titleEn: "Add Attachment (Images Only)",
          titleAr: "إضافة مرفق (صور فقط)",
          descriptionEn:
            "You can attach an image to the question. Accepted formats: JPEG, PNG, GIF, WebP, SVG. Maximum file size: 10 MB. Useful for diagram-based or visual questions.",
          descriptionAr:
            "يمكنك إرفاق صورة بالسؤال. الصيغ المقبولة: JPEG، PNG، GIF، WebP، SVG. الحجم الأقصى: 10 ميجابايت. مفيد للأسئلة المبنية على الرسوم البيانية أو الصور.",
          imagePlaceholder: "/tutorials/questions-attachment.png",
          fields: [
            {
              nameEn: "Attachment (Image)",
              nameAr: "المرفق (صورة)",
              required: false,
              descriptionEn:
                "Optional image file (JPEG, PNG, GIF, WebP, SVG — max 10 MB)",
              descriptionAr:
                "ملف صورة اختياري (JPEG، PNG، GIF، WebP، SVG — حد أقصى 10 ميجابايت)",
            },
          ],
          noteEn:
            "Attachment is optional. Only image formats are supported (max 10 MB) — no PDFs or documents. You can also attach images to individual answer options.",
          noteAr:
            "المرفق اختياري. يتم دعم صيغ الصور فقط (حد أقصى 10 ميجابايت) — لا ملفات PDF أو مستندات. يمكنك أيضاً إرفاق صور بخيارات الإجابة الفردية.",
        },
        {
          id: "questions-calculator",
          titleEn: "Enable Calculator",
          titleAr: "تفعيل الآلة الحاسبة",
          descriptionEn:
            "Toggle the calculator option to allow candidates to use an on-screen calculator during this question. Useful for math and numeric questions.",
          descriptionAr:
            "فعّل خيار الآلة الحاسبة للسماح للمرشحين باستخدام آلة حاسبة على الشاشة أثناء هذا السؤال. مفيد للأسئلة الرياضية والعددية.",
          imagePlaceholder: "/tutorials/questions-calculator.png",
          fields: [
            {
              nameEn: "Calculator Enabled",
              nameAr: "تفعيل الآلة الحاسبة",
              required: false,
              descriptionEn:
                "Optional: Enable on-screen calculator for this question",
              descriptionAr:
                "اختياري: تفعيل الآلة الحاسبة على الشاشة لهذا السؤال",
            },
          ],
        },
        {
          id: "questions-save",
          titleEn: "Save the Question",
          titleAr: "حفظ السؤال",
          descriptionEn:
            'Review all fields and click "Save". The question will appear in the Question Bank list and can be used in exams immediately.',
          descriptionAr:
            'راجع جميع الحقول وانقر "حفظ". سيظهر السؤال في قائمة بنك الأسئلة ويمكن استخدامه في الاختبارات فوراً.',
          imagePlaceholder: "/tutorials/questions-save.png",
        },
      ],
      examples: [
        {
          titleEn: "Example: Creating an MCQ Question",
          titleAr: "مثال: إنشاء سؤال اختيار من متعدد",
          contentEn:
            "**Subject:** Mathematics → **Topic:** Algebra\n**Type:** MCQ Single Answer\n**Body (EN):** What is the value of x in 2x + 4 = 10?\n**Body (AR):** ما قيمة x في 2x + 4 = 10؟\n**Difficulty:** Medium\n**Points:** 5\n\n**Options:**\n  A) x = 2 ✗\n  B) x = 3 ✓ (Correct)\n  C) x = 4 ✗\n  D) x = 5 ✗",
          contentAr:
            "**المادة:** الرياضيات ← **الموضوع:** الجبر\n**النوع:** اختيار من متعدد (إجابة واحدة)\n**نص السؤال (EN):** What is the value of x in 2x + 4 = 10?\n**نص السؤال (AR):** ما قيمة x في 2x + 4 = 10؟\n**الصعوبة:** متوسط\n**النقاط:** 5\n\n**الخيارات:**\n  أ) x = 2 ✗\n  ب) x = 3 ✓ (صحيح)\n  ج) x = 4 ✗\n  د) x = 5 ✗",
        },
      ],
    },

    // ─── Section 4: Question Types & Grading ────
    {
      id: "question-types",
      titleEn: "4. Question Types & Grading Rules",
      titleAr: "4. أنواع الأسئلة وقواعد التصحيح",
      descriptionEn:
        "SmartExam supports four question types, each with its own grading rules.",
      descriptionAr:
        "يدعم SmartExam أربعة أنواع من الأسئلة، لكل منها قواعد تصحيح خاصة.",
      steps: [
        {
          id: "type-mcq-single",
          titleEn: "MCQ — Single Answer",
          titleAr: "اختيار من متعدد — إجابة واحدة",
          descriptionEn:
            "Multiple Choice with a single correct answer. Add 2–6 options and mark exactly one as correct. Grading: Full points if correct, zero if wrong. Auto-graded.",
          descriptionAr:
            "اختيار من متعدد بإجابة صحيحة واحدة. أضف 2–6 خيارات وحدد واحداً فقط كإجابة صحيحة. التصحيح: نقاط كاملة إذا صحيح، صفر إذا خطأ. تصحيح تلقائي.",
          imagePlaceholder: "/tutorials/type-mcq-single.png",
          tipEn:
            "Auto-graded: No manual grading needed. Result appears immediately after exam submission.",
          tipAr:
            "تصحيح تلقائي: لا حاجة للتصحيح اليدوي. تظهر النتيجة فوراً بعد تقديم الاختبار.",
        },
        {
          id: "type-mcq-multi",
          titleEn: "MCQ — Multiple Answers",
          titleAr: "اختيار من متعدد — إجابات متعددة",
          descriptionEn:
            "Multiple Choice where more than one option can be correct. Mark all correct answers. Grading: Partial Scoring — each correct option has its own points. The candidate earns points for each correctly selected option. Wrong selections score zero (no penalty). Auto-graded.",
          descriptionAr:
            "اختيار من متعدد حيث يمكن أن تكون أكثر من إجابة صحيحة. حدد جميع الإجابات الصحيحة. التصحيح: درجات جزئية — كل خيار صحيح له نقاطه الخاصة. يحصل المرشح على نقاط لكل خيار صحيح يتم اختياره. الاختيارات الخاطئة تحصل على صفر (بدون خصم). تصحيح تلقائي.",
          imagePlaceholder: "/tutorials/type-mcq-multi.png",
          tipEn:
            "Partial Scoring: Each option has its own points value. Assign points per option when creating the question — the sum must equal the question total. Candidates earn points for each correct option they select. Wrong selections = 0 (no deduction).",
          tipAr:
            "درجات جزئية: كل خيار له قيمة نقاط خاصة به. حدد النقاط لكل خيار عند إنشاء السؤال — المجموع يجب أن يساوي إجمالي نقاط السؤال. يحصل المرشحون على نقاط لكل خيار صحيح يختارونه. الاختيارات الخاطئة = 0 (بدون خصم).",
          noteEn:
            "Example: Question worth 6 points with 3 correct options (A=2, B=2.5, D=1.5). Candidate selects A, B → gets 4.5. Candidate selects A, B, D → gets 6. Candidate selects A + wrong C → gets 2. If no option points are set, points are distributed equally among correct options.",
          noteAr:
            "مثال: سؤال بقيمة 6 نقاط مع 3 خيارات صحيحة (A=2, B=2.5, D=1.5). المرشح يختار A, B ← يحصل على 4.5. المرشح يختار A, B, D ← يحصل على 6. المرشح يختار A + الخاطئ C ← يحصل على 2. إذا لم يتم تحديد نقاط الخيارات، يتم توزيع النقاط بالتساوي على الخيارات الصحيحة.",
        },
        {
          id: "type-true-false",
          titleEn: "True / False",
          titleAr: "صح / خطأ",
          descriptionEn:
            "Simple True or False question. Only two options (True/False) are available. Grading: Full points if correct, zero if wrong. Auto-graded.",
          descriptionAr:
            "سؤال صح أو خطأ بسيط. متاح فقط خياران (صح/خطأ). التصحيح: نقاط كاملة إذا صحيح، صفر إذا خطأ. تصحيح تلقائي.",
          imagePlaceholder: "/tutorials/type-true-false.png",
        },
        {
          id: "type-subjective",
          titleEn: "Subjective (Essay)",
          titleAr: "سؤال مقالي",
          descriptionEn:
            "Open-ended essay question. Candidate types a free-text answer. Grading: Requires manual grading by an instructor/examiner. AI-assisted grading is available. Points can be partial.",
          descriptionAr:
            "سؤال مقالي مفتوح. يكتب المرشح إجابة نصية حرة. التصحيح: يتطلب تصحيحاً يدوياً من مدرب/ممتحن. التصحيح بمساعدة AI متاح. يمكن منح درجات جزئية.",
          imagePlaceholder: "/tutorials/type-subjective.png",
          tipEn:
            "Subjective questions support AI-assisted grading. After exam submission, go to Grading module to review and score answers manually or use AI suggestions.",
          tipAr:
            "تدعم الأسئلة المقالية التصحيح بمساعدة AI. بعد تقديم الاختبار، انتقل إلى وحدة التصحيح لمراجعة وتسجيل الإجابات يدوياً أو استخدام اقتراحات AI.",
          noteEn:
            "Subjective questions are NOT auto-graded. The exam result will show as 'Pending Grading' until all subjective answers are graded.",
          noteAr:
            "الأسئلة المقالية لا تُصحح تلقائياً. ستظهر نتيجة الاختبار كـ 'في انتظار التصحيح' حتى يتم تصحيح جميع الإجابات المقالية.",
        },
      ],
      examples: [
        {
          titleEn: "Grading Comparison Table",
          titleAr: "جدول مقارنة التصحيح",
          contentEn:
            "| Type | Auto-Graded | Grading Method | Manual Review |\n|------|-------------|---------------|---------------|\n| MCQ Single | ✓ Yes | Full or Zero | Not needed |\n| MCQ Multi | ✓ Yes | Partial Scoring (per option) | Not needed |\n| True/False | ✓ Yes | Full or Zero | Not needed |\n| Subjective | ✗ No | Partial (manual) | Required |",
          contentAr:
            "| النوع | تصحيح تلقائي | طريقة التصحيح | مراجعة يدوية |\n|------|-------------|---------------|---------------|\n| اختيار فردي | ✓ نعم | كامل أو صفر | غير مطلوبة |\n| اختيار متعدد | ✓ نعم | درجات جزئية (لكل خيار) | غير مطلوبة |\n| صح/خطأ | ✓ نعم | كامل أو صفر | غير مطلوبة |\n| مقالي | ✗ لا | جزئي (يدوي) | مطلوبة |",
        },
      ],
    },

    // ─── Section 5: Question Bank List ────
    {
      id: "question-bank-list",
      titleEn: "5. Question Bank List",
      titleAr: "5. قائمة بنك الأسئلة",
      descriptionEn:
        "View and manage all questions in the bank. Use filters and search to organize your question library.",
      descriptionAr:
        "عرض وإدارة جميع الأسئلة في البنك. استخدم الفلاتر والبحث لتنظيم مكتبة الأسئلة.",
      steps: [
        {
          id: "list-search",
          titleEn: "Search & Filter Questions",
          titleAr: "البحث والتصفية",
          descriptionEn:
            "Use the search bar to find questions by keyword. Apply filters for Subject, Topic, Question Type, and Difficulty Level. All filters work together.",
          descriptionAr:
            "استخدم شريط البحث للعثور على أسئلة بكلمات مفتاحية. طبّق فلاتر المادة والموضوع ونوع السؤال ومستوى الصعوبة. تعمل جميع الفلاتر معاً.",
          imagePlaceholder: "/tutorials/list-filters.png",
        },
        {
          id: "list-view-details",
          titleEn: "View Question Details",
          titleAr: "عرض تفاصيل السؤال",
          descriptionEn:
            "Click on any question row to view its full details including body, options, attachments, and metadata. Use the Edit or Delete buttons from the detail view.",
          descriptionAr:
            "انقر على أي صف سؤال لعرض تفاصيله الكاملة بما في ذلك النص والخيارات والمرفقات وبيانات التعريف. استخدم أزرار التعديل أو الحذف من عرض التفاصيل.",
          imagePlaceholder: "/tutorials/list-details.png",
        },
        {
          id: "list-status-toggle",
          titleEn: "Toggle Question Status",
          titleAr: "تبديل حالة السؤال",
          descriptionEn:
            "Each question can be Active or Inactive. Toggle the status switch to enable/disable a question. Inactive questions are not available for exam assignment.",
          descriptionAr:
            "يمكن أن يكون كل سؤال نشطاً أو غير نشط. بدّل مفتاح الحالة لتفعيل/تعطيل السؤال. الأسئلة غير النشطة ليست متاحة لتعيين الاختبار.",
          imagePlaceholder: "/tutorials/list-status.png",
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// AI QUESTION STUDIO MODULE
// ────────────────────────────────────────────────────────
export const aiStudioTutorial: TutorialModule = {
  id: "ai-studio",
  slug: "question-bank/ai-studio",
  titleEn: "AI Question Studio",
  titleAr: "استوديو AI للأسئلة",
  descriptionEn:
    "Generate exam questions automatically using AI. Configure subject, topic, type, and difficulty — then let AI create questions for you to review and save.",
  descriptionAr:
    "أنشئ أسئلة اختبار تلقائياً باستخدام AI. حدد المادة والموضوع والنوع والصعوبة — ثم دع AI يُنشئ الأسئلة لتراجعها وتحفظها.",
  iconName: "Sparkles",
  videoPlaceholder: "/tutorials/ai-studio-overview.mp4",
  sections: [
    {
      id: "ai-configure",
      titleEn: "1. Configure Generation",
      titleAr: "1. إعداد التوليد",
      descriptionEn: "Set the parameters for AI question generation.",
      descriptionAr: "حدد معلمات توليد الأسئلة بالذكاء الاصطناعي.",
      steps: [
        {
          id: "ai-navigate",
          titleEn: "Navigate to AI Studio",
          titleAr: "الانتقال إلى استوديو AI",
          descriptionEn:
            'From the Question Bank page, click the "AI Studio" button (with sparkles icon) in the top action bar. Or go to Question Bank → AI Studio from sidebar.',
          descriptionAr:
            'من صفحة بنك الأسئلة، انقر زر "استوديو AI" (بأيقونة اللمعات) في شريط الإجراءات العلوي. أو انتقل إلى بنك الأسئلة ← استوديو AI من القائمة الجانبية.',
          imagePlaceholder: "/tutorials/ai-navigate.png",
        },
        {
          id: "ai-select-params",
          titleEn: "Select Subject, Topic, Type & Difficulty",
          titleAr: "اختيار المادة والموضوع والنوع والصعوبة",
          descriptionEn:
            "Fill in the configuration form:\n• Subject: Choose the subject (required)\n• Topic: Choose the topic filtered by subject (required)\n• Question Type: MCQ Single, MCQ Multi, or True/False only\n• Difficulty: Easy, Medium (default), or Hard\n• Number of Questions: 1–10 questions per generation\n• Points: Default 1, min 0.5, max 100, step 0.5\n• Custom Instructions: Optional free text to guide AI",
          descriptionAr:
            "أملأ نموذج الإعداد:\n• المادة: اختر المادة (مطلوب)\n• الموضوع: اختر الموضوع مُصفّى حسب المادة (مطلوب)\n• نوع السؤال: اختيار فردي، اختيار متعدد، أو صح/خطأ فقط\n• الصعوبة: سهل، متوسط (افتراضي)، أو صعب\n• عدد الأسئلة: 1–10 أسئلة لكل توليد\n• النقاط: افتراضي 1، حد أدنى 0.5، حد أقصى 100، بخطوات 0.5\n• تعليمات مخصصة: نص حر اختياري لتوجيه AI",
          imagePlaceholder: "/tutorials/ai-config-form.png",
          fields: [
            {
              nameEn: "Subject",
              nameAr: "المادة",
              required: true,
              descriptionEn: "Select the subject for AI generation",
              descriptionAr: "اختر المادة للتوليد بالذكاء الاصطناعي",
            },
            {
              nameEn: "Topic",
              nameAr: "الموضوع",
              required: true,
              descriptionEn: "Select the topic",
              descriptionAr: "اختر الموضوع",
            },
            {
              nameEn: "Question Type",
              nameAr: "نوع السؤال",
              required: true,
              descriptionEn:
                "MCQ Single, MCQ Multi, or True/False only (Subjective not supported)",
              descriptionAr:
                "اختيار فردي، اختيار متعدد، أو صح/خطأ فقط (المقالي غير مدعوم)",
            },
            {
              nameEn: "Difficulty",
              nameAr: "الصعوبة",
              required: false,
              descriptionEn: "Default: Medium. Options: Easy, Medium, Hard",
              descriptionAr: "افتراضي: متوسط. الخيارات: سهل، متوسط، صعب",
            },
            {
              nameEn: "Number of Questions",
              nameAr: "عدد الأسئلة",
              required: false,
              descriptionEn: "Default: 5. Range: 1–10 questions per generation",
              descriptionAr: "افتراضي: 5. النطاق: 1–10 أسئلة لكل توليد",
            },
            {
              nameEn: "Points",
              nameAr: "النقاط",
              required: false,
              descriptionEn: "Default: 1. Min 0.5, Max 100, Step 0.5",
              descriptionAr: "افتراضي: 1. حد أدنى 0.5، حد أقصى 100، بخطوات 0.5",
            },
            {
              nameEn: "Custom Instructions",
              nameAr: "تعليمات مخصصة",
              required: false,
              descriptionEn:
                "Optional: guide AI focus (e.g., 'Focus on OOP concepts in Java')",
              descriptionAr:
                "اختياري: توجيه تركيز AI (مثل: 'ركز على مفاهيم البرمجة الكائنية في Java')",
            },
          ],
        },
        {
          id: "ai-generate",
          titleEn: "Click Generate",
          titleAr: "انقر توليد",
          descriptionEn:
            'Click the "Generate Questions" button. AI will process your request and generate questions based on your parameters. This may take 10–30 seconds.',
          descriptionAr:
            'انقر زر "توليد الأسئلة". سيعالج AI طلبك ويولد أسئلة بناءً على معلماتك. قد يستغرق ذلك 10–30 ثانية.',
          imagePlaceholder: "/tutorials/ai-generate-btn.png",
          tipEn:
            "A loading indicator will show while AI is generating. Do not navigate away during generation.",
          tipAr:
            "سيظهر مؤشر تحميل أثناء توليد AI. لا تغادر الصفحة أثناء التوليد.",
        },
      ],
    },
    {
      id: "ai-review",
      titleEn: "2. Review & Edit Generated Questions",
      titleAr: "2. مراجعة وتعديل الأسئلة المولَّدة",
      descriptionEn:
        "Review AI-generated questions before saving them to the question bank.",
      descriptionAr:
        "راجع الأسئلة المولَّدة بالذكاء الاصطناعي قبل حفظها في بنك الأسئلة.",
      steps: [
        {
          id: "ai-review-list",
          titleEn: "Review Generated Questions",
          titleAr: "مراجعة الأسئلة المولَّدة",
          descriptionEn:
            "AI will display all generated questions as cards. Each card shows the question body (EN/AR), options (if MCQ), difficulty, and points. Review each question carefully.",
          descriptionAr:
            "سيعرض AI جميع الأسئلة المولَّدة كبطاقات. تعرض كل بطاقة نص السؤال (EN/AR) والخيارات (إذا كان اختيار من متعدد) والصعوبة والنقاط. راجع كل سؤال بعناية.",
          imagePlaceholder: "/tutorials/ai-review-cards.png",
        },
        {
          id: "ai-edit-question",
          titleEn: "Edit a Question (Optional)",
          titleAr: "تعديل سؤال (اختياري)",
          descriptionEn:
            'Click the "Edit" button on any question card to modify the body, options, difficulty, or points before saving. You can also remove questions you don\'t want to keep.',
          descriptionAr:
            'انقر زر "تعديل" على أي بطاقة سؤال لتعديل النص أو الخيارات أو الصعوبة أو النقاط قبل الحفظ. يمكنك أيضاً إزالة الأسئلة التي لا ترغب في الاحتفاظ بها.',
          imagePlaceholder: "/tutorials/ai-edit.png",
          tipEn:
            "Always review AI-generated questions for accuracy. AI can occasionally produce questions that need adjustment.",
          tipAr:
            "راجع دائماً الأسئلة المولَّدة بالذكاء الاصطناعي للتأكد من دقتها. قد ينتج AI أحياناً أسئلة تحتاج تعديلاً.",
        },
        {
          id: "ai-save",
          titleEn: "Save to Question Bank",
          titleAr: "الحفظ في بنك الأسئلة",
          descriptionEn:
            'Click "Save All" to save all reviewed questions to the Question Bank. A progress bar shows the save progress. Once saved, questions are immediately available for use in exams.',
          descriptionAr:
            'انقر "حفظ الكل" لحفظ جميع الأسئلة المُراجعة في بنك الأسئلة. يعرض شريط التقدم حالة الحفظ. بمجرد الحفظ، تصبح الأسئلة متاحة فوراً للاستخدام في الاختبارات.',
          imagePlaceholder: "/tutorials/ai-save-all.png",
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// EXAM MANAGEMENT MODULE
// ────────────────────────────────────────────────────────
export const examManagementTutorial: TutorialModule = {
  id: "exams",
  slug: "exams",
  titleEn: "Exam Management",
  titleAr: "إدارة الاختبارات",
  descriptionEn:
    "Learn how to create, configure, build, publish, and manage exams. Covers the full exam lifecycle from setup to publishing.",
  descriptionAr:
    "تعلّم كيفية إنشاء وإعداد وبناء ونشر وإدارة الاختبارات. يغطي دورة حياة الاختبار الكاملة من الإعداد إلى النشر.",
  iconName: "ClipboardList",
  videoPlaceholder: "/tutorials/exam-management-overview.mp4",
  sections: [
    // ─── Section 1: Create Exam — Tab 1 (Configuration) ────
    {
      id: "create-exam-config",
      titleEn: "1. Create Exam — Configuration Tab",
      titleAr: "1. إنشاء اختبار — تبويب الإعداد",
      descriptionEn:
        "The first step to create an exam. Set the title, type, timing, scoring, and display options. After saving, you proceed to the Builder tab.",
      descriptionAr:
        "الخطوة الأولى لإنشاء اختبار. حدد العنوان والنوع والتوقيت والتسجيل وخيارات العرض. بعد الحفظ، تنتقل إلى تبويب المُنشئ.",
      steps: [
        {
          id: "exam-navigate",
          titleEn: "Navigate to Create Exam",
          titleAr: "الانتقال إلى إنشاء اختبار",
          descriptionEn:
            'From the sidebar, expand "Exam Management" → click "Create Exam". The Configuration tab opens first.',
          descriptionAr:
            'من القائمة الجانبية، وسّع "إدارة الاختبارات" → انقر "إنشاء اختبار". يفتح تبويب الإعداد أولاً.',
          imagePlaceholder: "/tutorials/exam-create-nav.png",
        },
        {
          id: "exam-basic-info",
          titleEn: "Basic Information",
          titleAr: "المعلومات الأساسية",
          descriptionEn:
            "Enter the exam title and description in English and optionally in Arabic.",
          descriptionAr:
            "أدخل عنوان الاختبار والوصف بالإنجليزية واختيارياً بالعربية.",
          imagePlaceholder: "/tutorials/exam-basic-info.png",
          fields: [
            {
              nameEn: "Title (English)",
              nameAr: "العنوان (إنجليزي)",
              required: true,
              descriptionEn: "Exam title in English (max 500 characters)",
              descriptionAr: "عنوان الاختبار بالإنجليزية (حد أقصى 500 حرف)",
            },
            {
              nameEn: "Title (Arabic)",
              nameAr: "العنوان (عربي)",
              required: false,
              descriptionEn: "Optional Arabic title",
              descriptionAr: "عنوان عربي اختياري",
            },
            {
              nameEn: "Description (English)",
              nameAr: "الوصف (إنجليزي)",
              required: false,
              descriptionEn: "Optional description (max 2000 characters)",
              descriptionAr: "وصف اختياري (حد أقصى 2000 حرف)",
            },
            {
              nameEn: "Description (Arabic)",
              nameAr: "الوصف (عربي)",
              required: false,
              descriptionEn: "Optional Arabic description",
              descriptionAr: "وصف عربي اختياري",
            },
          ],
        },
        {
          id: "exam-type",
          titleEn: "Exam Type",
          titleAr: "نوع الاختبار",
          descriptionEn:
            "Choose between Flexible and Fixed exam types:\n• Flexible: Candidates can start anytime within the availability window (start → end date).\n• Fixed: All candidates must start at the exact scheduled start time.",
          descriptionAr:
            "اختر بين نوعي الاختبار المرن والثابت:\n• مرن: يمكن للمرشحين البدء في أي وقت ضمن نافذة التوفر (تاريخ البداية → النهاية).\n• ثابت: يجب على جميع المرشحين البدء في وقت البداية المحدد بالضبط.",
          imagePlaceholder: "/tutorials/exam-type.png",
          fields: [
            {
              nameEn: "Exam Type",
              nameAr: "نوع الاختبار",
              required: false,
              descriptionEn: "Flexible (default) or Fixed",
              descriptionAr: "مرن (افتراضي) أو ثابت",
            },
            {
              nameEn: "Start Date & Time",
              nameAr: "تاريخ ووقت البداية",
              required: true,
              descriptionEn: "When the exam becomes available",
              descriptionAr: "متى يصبح الاختبار متاحاً",
            },
            {
              nameEn: "End Date & Time",
              nameAr: "تاريخ ووقت النهاية",
              required: true,
              descriptionEn: "Must be after start date",
              descriptionAr: "يجب أن يكون بعد تاريخ البداية",
            },
          ],
          tipEn:
            "For Flexible type: candidates can start at any time between Start and End. For Fixed type: all must start exactly at the Start time.",
          tipAr:
            "للنوع المرن: يمكن للمرشحين البدء في أي وقت بين البداية والنهاية. للنوع الثابت: يجب على الجميع البدء في وقت البداية بالضبط.",
        },
        {
          id: "exam-timing-scoring",
          titleEn: "Timing & Scoring",
          titleAr: "التوقيت والتسجيل",
          descriptionEn:
            "Set the exam duration, pass score, and maximum allowed attempts.",
          descriptionAr:
            "حدد مدة الاختبار ودرجة النجاح وعدد المحاولات المسموحة.",
          imagePlaceholder: "/tutorials/exam-timing.png",
          fields: [
            {
              nameEn: "Duration (minutes)",
              nameAr: "المدة (دقائق)",
              required: true,
              descriptionEn: "Default: 60. Range: 1–600 minutes",
              descriptionAr: "افتراضي: 60. النطاق: 1–600 دقيقة",
            },
            {
              nameEn: "Pass Score (Points)",
              nameAr: "درجة النجاح (نقاط)",
              required: false,
              descriptionEn:
                "Default: 0. Minimum passing score. 0 means all candidates pass",
              descriptionAr:
                "افتراضي: 0. درجة النجاح الدنيا. 0 تعني أن جميع المرشحين ينجحون",
            },
            {
              nameEn: "Max Attempts",
              nameAr: "عدد المحاولات",
              required: false,
              descriptionEn: "Default: 1. Set to 0 for unlimited attempts",
              descriptionAr: "افتراضي: 1. اضبط على 0 لمحاولات غير محدودة",
            },
          ],
          noteEn:
            "If Pass Score is 0, all candidates will pass regardless of their score. A warning is shown during publish.",
          noteAr:
            "إذا كانت درجة النجاح 0، سينجح جميع المرشحين بغض النظر عن درجاتهم. يظهر تحذير أثناء النشر.",
        },
        {
          id: "exam-display-options",
          titleEn: "Display Options",
          titleAr: "خيارات العرض",
          descriptionEn:
            "Configure how questions and options appear to candidates during the exam.",
          descriptionAr:
            "أعدَّ كيفية ظهور الأسئلة والخيارات للمرشحين أثناء الاختبار.",
          imagePlaceholder: "/tutorials/exam-display.png",
          fields: [
            {
              nameEn: "Shuffle Questions",
              nameAr: "خلط الأسئلة",
              required: false,
              descriptionEn:
                "Default: ON. Randomize question order for each candidate",
              descriptionAr: "افتراضي: مفعّل. ترتيب عشوائي للأسئلة لكل مرشح",
            },
            {
              nameEn: "Shuffle Options",
              nameAr: "خلط الخيارات",
              required: false,
              descriptionEn: "Default: ON. Randomize answer option order",
              descriptionAr: "افتراضي: مفعّل. ترتيب عشوائي لخيارات الإجابة",
            },
            {
              nameEn: "Is Active",
              nameAr: "نشط",
              required: false,
              descriptionEn:
                "Default: ON. Whether exam is visible to candidates",
              descriptionAr: "افتراضي: مفعّل. هل الاختبار مرئي للمرشحين",
            },
          ],
        },
        {
          id: "exam-save-continue",
          titleEn: "Save & Continue to Builder",
          titleAr: "حفظ والمتابعة إلى المُنشئ",
          descriptionEn:
            'Click "Save & Continue". The exam is saved as Draft and you are redirected to the Builder tab to add questions.',
          descriptionAr:
            'انقر "حفظ والمتابعة". يتم حفظ الاختبار كمسودة ويتم توجيهك إلى تبويب المُنشئ لإضافة الأسئلة.',
          imagePlaceholder: "/tutorials/exam-save-continue.png",
          tipEn:
            "The Builder tab is locked until you save the configuration first.",
          tipAr: "تبويب المُنشئ مقفل حتى تحفظ الإعداد أولاً.",
        },
      ],
    },

    // ─── Section 2: Create Exam — Tab 2 (Builder) ────
    {
      id: "create-exam-builder",
      titleEn: "2. Create Exam — Builder Tab",
      titleAr: "2. إنشاء اختبار — تبويب المُنشئ",
      descriptionEn:
        "The Builder tab lets you add sections and questions to the exam. Choose to build by Subject (one section per subject) or by Topic (one section per topic).",
      descriptionAr:
        "تبويب المُنشئ يتيح لك إضافة أقسام وأسئلة للاختبار. اختر البناء حسب المادة (قسم لكل مادة) أو حسب الموضوع (قسم لكل موضوع).",
      steps: [
        {
          id: "builder-source-type",
          titleEn: "Choose Build Mode",
          titleAr: "اختيار وضع البناء",
          descriptionEn:
            "Select how to organize exam sections:\n• By Subject: Creates one section per selected subject. System picks questions randomly from that subject.\n• By Topic: Creates one section per selected topic under a subject. More granular control.",
          descriptionAr:
            "اختر كيفية تنظيم أقسام الاختبار:\n• حسب المادة: ينشئ قسماً لكل مادة مختارة. يختار النظام الأسئلة عشوائياً من تلك المادة.\n• حسب الموضوع: ينشئ قسماً لكل موضوع مختار تحت مادة. تحكم أكثر دقة.",
          imagePlaceholder: "/tutorials/builder-source-type.png",
          noteEn:
            "Changing the build mode clears all existing sections. Choose carefully before adding sections.",
          noteAr:
            "تغيير وضع البناء يمسح جميع الأقسام الموجودة. اختر بعناية قبل إضافة الأقسام.",
        },
        {
          id: "builder-select-subjects",
          titleEn: "Select Subjects / Topics",
          titleAr: "اختيار المواد / المواضيع",
          descriptionEn:
            "Check the subjects (or topics) you want to include. Each checked item creates a section automatically. A badge shows how many questions are available in the bank for each.",
          descriptionAr:
            "حدد المواد (أو المواضيع) التي تريد تضمينها. كل عنصر محدد ينشئ قسماً تلقائياً. يعرض شارة عدد الأسئلة المتاحة في البنك لكل عنصر.",
          imagePlaceholder: "/tutorials/builder-select.png",
          tipEn:
            "In Topic mode, click the subject accordion to expand it and see its topics.",
          tipAr:
            "في وضع الموضوع، انقر على مادة الأكورديون لتوسيعها ورؤية مواضيعها.",
        },
        {
          id: "builder-configure-sections",
          titleEn: "Configure Each Section",
          titleAr: "إعداد كل قسم",
          descriptionEn:
            "For each section, configure:\n• Section Title: Auto-filled from subject/topic name (editable)\n• Duration (minutes): Optional time limit per section\n• Questions to Pick: How many questions to randomly select (default: min of 10 or available count)",
          descriptionAr:
            "لكل قسم، أعدَّ:\n• عنوان القسم: يملأ تلقائياً من اسم المادة/الموضوع (قابل للتعديل)\n• المدة (دقائق): حد زمني اختياري لكل قسم\n• عدد الأسئلة المختارة: كم سؤال يتم اختياره عشوائياً (افتراضي: الأقل بين 10 والمتاح)",
          imagePlaceholder: "/tutorials/builder-section-config.png",
          fields: [
            {
              nameEn: "Section Title",
              nameAr: "عنوان القسم",
              required: false,
              descriptionEn: "Auto-filled, editable",
              descriptionAr: "يملأ تلقائياً، قابل للتعديل",
            },
            {
              nameEn: "Duration (minutes)",
              nameAr: "المدة (دقائق)",
              required: false,
              descriptionEn: "Optional per-section time limit",
              descriptionAr: "حد زمني اختياري لكل قسم",
            },
            {
              nameEn: "Questions to Pick",
              nameAr: "عدد الأسئلة المختارة",
              required: true,
              descriptionEn: "Min 1, max = available questions in bank",
              descriptionAr: "حد أدنى 1، حد أقصى = الأسئلة المتاحة في البنك",
            },
          ],
          noteEn:
            "The system randomly picks questions from the bank when a candidate starts the exam. Different candidates may get different questions.",
          noteAr:
            "يختار النظام أسئلة عشوائياً من البنك عندما يبدأ المرشح الاختبار. قد يحصل مرشحون مختلفون على أسئلة مختلفة.",
        },
        {
          id: "builder-summary",
          titleEn: "Review Summary & Save",
          titleAr: "مراجعة الملخص والحفظ",
          descriptionEn:
            'The summary bar shows: Total Sections, Total Questions, Total Points, and Pass Score. You can adjust the Pass Score here. Click "Save Builder" to save and proceed to the Overview page.',
          descriptionAr:
            'يعرض شريط الملخص: إجمالي الأقسام، إجمالي الأسئلة، إجمالي النقاط، ودرجة النجاح. يمكنك تعديل درجة النجاح هنا. انقر "حفظ المُنشئ" للحفظ والانتقال لصفحة النظرة العامة.',
          imagePlaceholder: "/tutorials/builder-summary.png",
          tipEn:
            "Pass Score must not exceed Total Points. If it does, a warning will appear.",
          tipAr:
            "درجة النجاح يجب ألا تتجاوز إجمالي النقاط. إذا تجاوزت، سيظهر تحذير.",
        },
      ],
    },

    // ─── Section 3: Configuration (4 Tabs) ────
    {
      id: "exam-configuration",
      titleEn: "3. Exam Configuration (4 Tabs)",
      titleAr: "3. إعدادات الاختبار (4 تبويبات)",
      descriptionEn:
        "After saving, access the Configuration page from the Exam List or Overview. It has 4 tabs: Exam Settings, Security, Instructions, and Access Policy.",
      descriptionAr:
        "بعد الحفظ، ادخل صفحة الإعدادات من قائمة الاختبارات أو النظرة العامة. تحتوي على 4 تبويبات: إعدادات الاختبار، الأمان، التعليمات، وسياسة الوصول.",
      steps: [
        {
          id: "config-tab1-settings",
          titleEn: "Tab 1: Exam Settings",
          titleAr: "تبويب 1: إعدادات الاختبار",
          descriptionEn:
            "Control how results and answers are shown to candidates after exam completion.",
          descriptionAr:
            "تحكم في كيفية عرض النتائج والإجابات للمرشحين بعد إتمام الاختبار.",
          imagePlaceholder: "/tutorials/config-settings.png",
          fields: [
            {
              nameEn: "Shuffle Questions",
              nameAr: "خلط الأسئلة",
              required: false,
              descriptionEn: "Randomize question order",
              descriptionAr: "ترتيب عشوائي للأسئلة",
            },
            {
              nameEn: "Shuffle Options",
              nameAr: "خلط الخيارات",
              required: false,
              descriptionEn: "Randomize answer option order",
              descriptionAr: "ترتيب عشوائي لخيارات الإجابة",
            },
            {
              nameEn: "Show Results",
              nameAr: "إظهار النتائج",
              required: false,
              descriptionEn:
                "Default: ON. Show score to candidate after submission",
              descriptionAr: "افتراضي: مفعّل. عرض الدرجة للمرشح بعد التقديم",
            },
            {
              nameEn: "Allow Review",
              nameAr: "السماح بالمراجعة",
              required: false,
              descriptionEn:
                "Allow candidates to review their answers after submission",
              descriptionAr: "السماح للمرشحين بمراجعة إجاباتهم بعد التقديم",
            },
            {
              nameEn: "Show Correct Answers",
              nameAr: "إظهار الإجابات الصحيحة",
              required: false,
              descriptionEn:
                "Show correct answers during review. Requires 'Allow Review' to be ON",
              descriptionAr:
                "عرض الإجابات الصحيحة أثناء المراجعة. يتطلب تفعيل 'السماح بالمراجعة'",
            },
          ],
          noteEn:
            "Show Correct Answers is disabled if Allow Review is OFF. Turning OFF Allow Review automatically turns OFF Show Correct Answers.",
          noteAr:
            "إظهار الإجابات الصحيحة معطل إذا كانت المراجعة مغلقة. إيقاف المراجعة يغلق تلقائياً إظهار الإجابات الصحيحة.",
        },
        {
          id: "config-tab2-security",
          titleEn: "Tab 2: Security Settings",
          titleAr: "تبويب 2: إعدادات الأمان",
          descriptionEn:
            'Configure exam security and proctoring measures. Use the "Activate All" master toggle to enable all settings at once.',
          descriptionAr:
            'أعدَّ إجراءات أمان الاختبار والمراقبة. استخدم مفتاح "تفعيل الكل" الرئيسي لتفعيل جميع الإعدادات دفعة واحدة.',
          imagePlaceholder: "/tutorials/config-security.png",
          fields: [
            {
              nameEn: "Activate All (Master Toggle)",
              nameAr: "تفعيل الكل (المفتاح الرئيسي)",
              required: false,
              descriptionEn: "Enables/disables all 7 security settings at once",
              descriptionAr: "يفعّل/يعطّل جميع إعدادات الأمان الـ 7 دفعة واحدة",
            },
            {
              nameEn: "Require Proctoring",
              nameAr: "طلب المراقبة",
              required: false,
              descriptionEn: "Enable proctoring for this exam",
              descriptionAr: "تفعيل المراقبة لهذا الاختبار",
            },
            {
              nameEn: "Require ID Verification",
              nameAr: "طلب التحقق من الهوية",
              required: false,
              descriptionEn: "Candidates must verify identity before exam",
              descriptionAr: "يجب على المرشحين التحقق من هويتهم قبل الاختبار",
            },
            {
              nameEn: "Prevent Copy/Paste",
              nameAr: "منع النسخ/اللصق",
              required: false,
              descriptionEn: "Block copy-paste during exam",
              descriptionAr: "حظر النسخ واللصق أثناء الاختبار",
            },
            {
              nameEn: "Prevent Screen Capture",
              nameAr: "منع لقطة الشاشة",
              required: false,
              descriptionEn: "Block screenshots during exam",
              descriptionAr: "حظر لقطات الشاشة أثناء الاختبار",
            },
            {
              nameEn: "Require Webcam",
              nameAr: "طلب كاميرا الويب",
              required: false,
              descriptionEn: "Candidate must enable webcam",
              descriptionAr: "يجب على المرشح تفعيل كاميرا الويب",
            },
            {
              nameEn: "Require Fullscreen",
              nameAr: "طلب ملء الشاشة",
              required: false,
              descriptionEn: "Exam runs in fullscreen mode",
              descriptionAr: "يعمل الاختبار في وضع ملء الشاشة",
            },
            {
              nameEn: "Browser Lockdown",
              nameAr: "قفل المتصفح",
              required: false,
              descriptionEn: "Lock the browser to prevent tab switching",
              descriptionAr: "قفل المتصفح لمنع التبديل بين التبويبات",
            },
          ],
          tipEn:
            "Require Proctoring is highlighted in amber. Browser Lockdown is highlighted in red — it's the most restrictive setting.",
          tipAr:
            "طلب المراقبة مميز بالأصفر. قفل المتصفح مميز بالأحمر — إنه الإعداد الأكثر تقييداً.",
        },
        {
          id: "config-tab3-instructions",
          titleEn: "Tab 3: Instructions",
          titleAr: "تبويب 3: التعليمات",
          descriptionEn:
            "Add exam instructions shown to candidates before starting. Instructions are ordered and bilingual (EN/AR).",
          descriptionAr:
            "أضف تعليمات الاختبار المعروضة للمرشحين قبل البدء. التعليمات مرتبة وثنائية اللغة (EN/AR).",
          imagePlaceholder: "/tutorials/config-instructions.png",
          fields: [
            {
              nameEn: "Instruction (English)",
              nameAr: "التعليمات (إنجليزي)",
              required: true,
              descriptionEn: "Instruction text in English",
              descriptionAr: "نص التعليمات بالإنجليزية",
            },
            {
              nameEn: "Instruction (Arabic)",
              nameAr: "التعليمات (عربي)",
              required: false,
              descriptionEn: "Optional Arabic translation",
              descriptionAr: "ترجمة عربية اختيارية",
            },
          ],
          tipEn:
            "Instructions appear on the exam start page. Add clear rules like 'No external resources allowed' or 'Time limit is strictly enforced'.",
          tipAr:
            "تظهر التعليمات في صفحة بدء الاختبار. أضف قواعد واضحة مثل 'لا يُسمح بالموارد الخارجية' أو 'الحد الزمني مطبق بصرامة'.",
        },
        {
          id: "config-tab4-access",
          titleEn: "Tab 4: Access Policy",
          titleAr: "تبويب 4: سياسة الوصول",
          descriptionEn:
            'Control who can access and take the exam.\n\n**Default:** The exam is set to **"Public"** — meaning all candidates in the system can see and start the exam without any restrictions.\n\nIf you change the policy to **"Restrict to Assigned"**, only candidates you explicitly assign will be able to take the exam. You must then go to **Candidates → Assign to Exam** to assign candidates before they can access it.',
          descriptionAr:
            'تحكم في من يمكنه الوصول للاختبار وتقديمه.\n\n**الافتراضي:** الاختبار مُعيّن على **"عام"** — يعني أن جميع المرشحين في النظام يمكنهم رؤية الاختبار والبدء فيه بدون أي قيود.\n\nإذا غيّرت السياسة إلى **"تقييد للمعينين"**، فقط المرشحون الذين تعيّنهم صراحة سيتمكنون من تقديم الاختبار. يجب عليك الذهاب إلى **المرشحون ← تعيين للاختبار** لتعيين المرشحين قبل أن يتمكنوا من الوصول إليه.',
          imagePlaceholder: "/tutorials/config-access.png",
          fields: [
            {
              nameEn: "Is Public (Default: ON)",
              nameAr: "عام (الافتراضي: مُفعّل)",
              required: false,
              descriptionEn:
                "Default setting — anyone can access the exam with no restrictions. All candidates see it in their dashboard.",
              descriptionAr:
                "الإعداد الافتراضي — يمكن لأي شخص الوصول للاختبار بدون قيود. جميع المرشحين يرونه في لوحتهم.",
            },
            {
              nameEn: "Access Code",
              nameAr: "رمز الوصول",
              required: false,
              descriptionEn:
                "Optional code that candidates must enter before starting the exam",
              descriptionAr:
                "رمز اختياري يجب على المرشحين إدخاله قبل بدء الاختبار",
            },
            {
              nameEn: "Restrict to Assigned",
              nameAr: "تقييد للمعينين",
              required: false,
              descriptionEn:
                "Only assigned candidates can take the exam. You must assign candidates via Candidates → Assign to Exam.",
              descriptionAr:
                "فقط المرشحون المعينون يمكنهم تقديم الاختبار. يجب تعيين المرشحين عبر المرشحون ← تعيين للاختبار.",
            },
          ],
          tipEn:
            'If you set "Restrict to Assigned" but forget to assign candidates, no one will be able to access the exam — even after publishing.',
          tipAr:
            'إذا اخترت "تقييد للمعينين" ولكن نسيت تعيين المرشحين، لن يتمكن أحد من الوصول للاختبار — حتى بعد النشر.',
        },
      ],
    },

    // ─── Section 4: Publish ────
    {
      id: "publish",
      titleEn: "4. Publish Exam",
      titleAr: "4. نشر الاختبار",
      descriptionEn:
        "Publishing makes the exam available to candidates. Strict validation rules must pass before publishing.",
      descriptionAr:
        "النشر يجعل الاختبار متاحاً للمرشحين. يجب تمرير قواعد التحقق الصارمة قبل النشر.",
      steps: [
        {
          id: "publish-how",
          titleEn: "How to Publish",
          titleAr: "كيفية النشر",
          descriptionEn:
            'Go to the Exam Overview page or Exam List. Click the "Publish" button. The system validates the exam before publishing.\n\n**When the exam is published:**\n- If the Access Policy is **\"Public\"** (default), all candidates in the system can immediately see and start the exam\n- If the Access Policy is **\"Restrict to Assigned\"**, only assigned candidates can access the exam — make sure to assign candidates first\n- All eligible candidates receive an **email notification** informing them that a new exam is available (based on the **\"Exam Published\"** notification template)\n\nYou can customize the email content from **Notifications → Templates → Exam Published** template.',
          descriptionAr:
            'انتقل إلى صفحة نظرة عامة الاختبار أو قائمة الاختبارات. انقر زر "نشر". يتحقق النظام من الاختبار قبل النشر.\n\n**عند نشر الاختبار:**\n- إذا كانت سياسة الوصول **"عام"** (الافتراضي)، جميع المرشحين في النظام يمكنهم رؤية الاختبار والبدء فيه فوراً\n- إذا كانت سياسة الوصول **"تقييد للمعينين"**، فقط المرشحون المعيّنون يمكنهم الوصول — تأكد من تعيين المرشحين أولاً\n- جميع المرشحين المؤهلين يتلقون **إشعار بريد إلكتروني** يُعلمهم بتوفر اختبار جديد (بناءً على قالب **"اختبار منشور"** في الإشعارات)\n\nيمكنك تخصيص محتوى البريد من **الإشعارات ← القوالب ← قالب اختبار منشور**.',
          imagePlaceholder: "/tutorials/publish-button.png",
          noteEn:
            "The email notification uses dynamic placeholders like {{CandidateName}}, {{ExamTitle}}, {{ExamStartDate}}, {{ExamDuration}}, and {{LoginUrl}}. Configure these in Notifications → Templates.",
          noteAr:
            "يستخدم إشعار البريد متغيرات ديناميكية مثل {{CandidateName}} و{{ExamTitle}} و{{ExamStartDate}} و{{ExamDuration}} و{{LoginUrl}}. قم بتهيئتها في الإشعارات ← القوالب.",
        },
        {
          id: "publish-rules",
          titleEn: "Publish Validation Rules (Must Pass)",
          titleAr: "قواعد التحقق للنشر (يجب تمريرها)",
          descriptionEn:
            "The system checks these rules before allowing publish:\n• At least 1 section must exist\n• Each section must have questions (pickCount > 0 or manual questions)\n• Enough questions must be available in the bank for each section\n• All questions must be Active\n• MCQ questions must have ≥ 2 options\n• MCQ Single must have exactly 1 correct answer\n• MCQ Multi must have ≥ 1 correct answer\n• True/False must have exactly 2 options\n• All question points must be > 0\n• Pass Score must not exceed total exam points",
          descriptionAr:
            "يتحقق النظام من هذه القواعد قبل السماح بالنشر:\n• يجب وجود قسم واحد على الأقل\n• كل قسم يجب أن يحتوي أسئلة (عدد > 0 أو أسئلة يدوية)\n• يجب توفر أسئلة كافية في البنك لكل قسم\n• جميع الأسئلة يجب أن تكون نشطة\n• أسئلة MCQ يجب أن تحتوي ≥ 2 خيارات\n• MCQ فردي يجب أن يحتوي إجابة صحيحة واحدة بالضبط\n• MCQ متعدد يجب أن يحتوي ≥ 1 إجابة صحيحة\n• صح/خطأ يجب أن يحتوي خيارين بالضبط\n• جميع نقاط الأسئلة يجب أن تكون > 0\n• درجة النجاح يجب ألا تتجاوز إجمالي نقاط الاختبار",
          imagePlaceholder: "/tutorials/publish-rules.png",
          noteEn:
            "If any rule fails, publish is blocked and the specific error is shown.",
          noteAr: "إذا فشلت أي قاعدة، يتم حظر النشر ويُعرض الخطأ المحدد.",
        },
        {
          id: "publish-warnings",
          titleEn: "Publish Warnings (Allowed but Flagged)",
          titleAr: "تحذيرات النشر (مسموحة لكن مُعلَّمة)",
          descriptionEn:
            "These warnings don't block publish but are shown:\n• Pass Score is 0 — all candidates pass automatically\n• Exam is inactive — won't be available even after publishing\n• Start date is in the past\n• End date is in the past — candidates can't take the exam",
          descriptionAr:
            "هذه التحذيرات لا تمنع النشر لكنها تُعرض:\n• درجة النجاح 0 — جميع المرشحين ينجحون تلقائياً\n• الاختبار غير نشط — لن يكون متاحاً حتى بعد النشر\n• تاريخ البداية في الماضي\n• تاريخ النهاية في الماضي — المرشحون لا يمكنهم تقديم الاختبار",
          imagePlaceholder: "/tutorials/publish-warnings.png",
        },
        {
          id: "publish-restrictions",
          titleEn: "What Changes After Publishing",
          titleAr: "ما يتغير بعد النشر",
          descriptionEn:
            "After publishing an exam:\n✗ Cannot change Duration or Pass Score (must unpublish first)\n✗ Cannot delete Sections (must unpublish first)\n✗ Cannot remove Questions from sections (must unpublish first)\n✓ Can ADD new questions and sections\n✓ Can change title, description, dates, security settings\n✓ Can change review/results display settings\n✓ Can archive (unpublish) the exam at any time",
          descriptionAr:
            "بعد نشر الاختبار:\n✗ لا يمكن تغيير المدة أو درجة النجاح (يجب إلغاء النشر أولاً)\n✗ لا يمكن حذف الأقسام (يجب إلغاء النشر أولاً)\n✗ لا يمكن إزالة الأسئلة من الأقسام (يجب إلغاء النشر أولاً)\n✓ يمكن إضافة أسئلة وأقسام جديدة\n✓ يمكن تغيير العنوان والوصف والتواريخ وإعدادات الأمان\n✓ يمكن تغيير إعدادات عرض المراجعة/النتائج\n✓ يمكن أرشفة (إلغاء نشر) الاختبار في أي وقت",
          imagePlaceholder: "/tutorials/publish-restrictions.png",
          tipEn:
            "To modify duration, pass score, or remove questions — archive the exam first, make changes, then re-publish.",
          tipAr:
            "لتعديل المدة أو درجة النجاح أو إزالة الأسئلة — أرشف الاختبار أولاً، أجرِ التعديلات، ثم أعد النشر.",
        },
      ],
      examples: [
        {
          titleEn: "Publish Status Flow",
          titleAr: "مسار حالة النشر",
          contentEn:
            "Draft → Publish → Published\nPublished → Archive → Draft\nDraft → Publish → Published (re-publish)\n\nDeleting: Only possible if no candidate attempts exist.\nIf attempts exist, you can only Archive.",
          contentAr:
            "مسودة → نشر → منشور\nمنشور → أرشفة → مسودة\nمسودة → نشر → منشور (إعادة نشر)\n\nالحذف: ممكن فقط إذا لم تكن هناك محاولات مرشحين.\nإذا وُجدت محاولات، يمكنك الأرشفة فقط.",
        },
      ],
    },

    // ─── Section 5: Assign Candidates ────
    {
      id: "assign-candidates",
      titleEn: "5. Assign Candidates to Exam",
      titleAr: "5. تعيين المرشحين للاختبار",
      descriptionEn:
        'When an exam\'s Access Policy is set to "Restrict to Assigned", you must explicitly assign candidates before they can access the exam. Assigned candidates receive an email notification with exam details.',
      descriptionAr:
        'عندما تكون سياسة وصول الاختبار مُعيّنة على "تقييد للمعينين"، يجب عليك تعيين المرشحين صراحة قبل أن يتمكنوا من الوصول للاختبار. يتلقى المرشحون المعيّنون إشعاراً بالبريد الإلكتروني بتفاصيل الاختبار.',
      steps: [
        {
          id: "assign-navigate",
          titleEn: "Navigate to Assign Page",
          titleAr: "الانتقال إلى صفحة التعيين",
          descriptionEn:
            "From the sidebar: **Candidates → Assign to Exam**. This page lets you assign or unassign candidates for any published exam.",
          descriptionAr:
            "من القائمة الجانبية: **المرشحون ← تعيين للاختبار**. تتيح لك هذه الصفحة تعيين أو إلغاء تعيين المرشحين لأي اختبار منشور.",
          imagePlaceholder: "/tutorials/assign-navigate.png",
        },
        {
          id: "assign-setup",
          titleEn: "Select Exam & Schedule",
          titleAr: "اختيار الاختبار والجدول",
          descriptionEn:
            "Start by selecting the target exam from the dropdown. Then configure the assignment schedule:",
          descriptionAr:
            "ابدأ باختيار الاختبار المستهدف من القائمة المنسدلة. ثم قم بتهيئة جدول التعيين:",
          imagePlaceholder: "/tutorials/assign-setup.png",
          fields: [
            {
              nameEn: "Exam",
              nameAr: "الاختبار",
              required: true,
              descriptionEn:
                "Select the published exam you want to assign candidates to",
              descriptionAr:
                "اختر الاختبار المنشور الذي تريد تعيين المرشحين له",
            },
            {
              nameEn: "Batch",
              nameAr: "الدفعة",
              required: false,
              descriptionEn:
                'Filter candidates by batch (optional — select "All" to see all candidates)',
              descriptionAr:
                'تصفية المرشحين حسب الدفعة (اختياري — اختر "الكل" لعرض جميع المرشحين)',
            },
            {
              nameEn: "Schedule From",
              nameAr: "من تاريخ",
              required: true,
              descriptionEn: "Start date of the candidate's exam access window",
              descriptionAr: "تاريخ بداية نافذة وصول المرشح للاختبار",
            },
            {
              nameEn: "Schedule To",
              nameAr: "إلى تاريخ",
              required: true,
              descriptionEn: "End date of the candidate's exam access window",
              descriptionAr: "تاريخ نهاية نافذة وصول المرشح للاختبار",
            },
          ],
        },
        {
          id: "assign-select-candidates",
          titleEn: "Select & Assign Candidates",
          titleAr: "اختيار وتعيين المرشحين",
          descriptionEn:
            'After selecting the exam, a table of candidates appears. You can:\n- **Search** by name or email\n- **Filter** by assignment status (All, Assigned, Unassigned)\n- **Select** individual candidates using checkboxes or use **Select All**\n- Click **"Assign"** to assign selected candidates to the exam\n\nAssigned candidates will immediately receive an **email notification** with the exam details, schedule, and a login link.',
          descriptionAr:
            'بعد اختيار الاختبار، يظهر جدول بالمرشحين. يمكنك:\n- **البحث** بالاسم أو البريد الإلكتروني\n- **التصفية** حسب حالة التعيين (الكل، معيّن، غير معيّن)\n- **تحديد** المرشحين فردياً باستخدام مربعات الاختيار أو استخدام **تحديد الكل**\n- انقر **"تعيين"** لتعيين المرشحين المحددين للاختبار\n\nيتلقى المرشحون المعيّنون فوراً **إشعار بريد إلكتروني** بتفاصيل الاختبار والجدول ورابط تسجيل الدخول.',
          imagePlaceholder: "/tutorials/assign-candidates.png",
          tipEn:
            "You can filter by Batch to quickly assign all candidates in a specific batch to the exam at once.",
          tipAr:
            "يمكنك التصفية حسب الدفعة لتعيين جميع المرشحين في دفعة معينة للاختبار دفعة واحدة.",
        },
        {
          id: "assign-unassign",
          titleEn: "Unassign Candidates",
          titleAr: "إلغاء تعيين المرشحين",
          descriptionEn:
            'To remove a candidate\'s access to an exam:\n1. Filter the table to show **"Assigned"** candidates\n2. Select the candidates you want to unassign\n3. Click **"Unassign"**\n4. Confirm the action\n\nUnassigned candidates will no longer see the exam in their dashboard.',
          descriptionAr:
            'لإزالة وصول مرشح للاختبار:\n1. صفّي الجدول لعرض المرشحين **"المعيّنين"**\n2. حدد المرشحين الذين تريد إلغاء تعيينهم\n3. انقر **"إلغاء التعيين"**\n4. أكّد الإجراء\n\nلن يتمكن المرشحون المُلغى تعيينهم من رؤية الاختبار في لوحتهم.',
          imagePlaceholder: "/tutorials/assign-unassign.png",
        },
      ],
      examples: [
        {
          titleEn: "Typical Assignment Workflow",
          titleAr: "سير عمل التعيين النموذجي",
          contentEn:
            '1. Create exam → set Access Policy to **"Restrict to Assigned"**\n2. Build exam sections and add questions\n3. Publish the exam\n4. Go to **Candidates → Assign to Exam**\n5. Select the exam → set schedule dates\n6. Filter by batch (e.g., "Spring 2026") → Select All → Assign\n7. Candidates receive email: "You have been assigned to [Exam Title]"\n8. Candidates log in → see the exam in their dashboard → take the exam',
          contentAr:
            '1. إنشاء الاختبار ← تعيين سياسة الوصول على **"تقييد للمعينين"**\n2. بناء أقسام الاختبار وإضافة الأسئلة\n3. نشر الاختبار\n4. الذهاب إلى **المرشحون ← تعيين للاختبار**\n5. اختيار الاختبار ← تحديد تواريخ الجدول\n6. التصفية حسب الدفعة (مثال: "ربيع 2026") ← تحديد الكل ← تعيين\n7. المرشحون يتلقون بريداً: "تم تعيينك في [عنوان الاختبار]"\n8. المرشحون يسجلون الدخول ← يرون الاختبار في لوحتهم ← يقدمون الاختبار',
        },
      ],
    },

    // ─── Section 6: Create from Template ────
    {
      id: "create-from-template",
      titleEn: "6. Create from Template",
      titleAr: "6. إنشاء من قالب",
      descriptionEn:
        "Clone an existing exam to create a new one. All settings and questions are copied — you just provide a new title and schedule.",
      descriptionAr:
        "انسخ اختباراً موجوداً لإنشاء اختبار جديد. يتم نسخ جميع الإعدادات والأسئلة — ما عليك سوى تقديم عنوان جديد وجدول.",
      steps: [
        {
          id: "template-select",
          titleEn: "Select a Template Exam",
          titleAr: "اختيار اختبار قالب",
          descriptionEn:
            'From the sidebar: Exam Management → "Create from Template". Search and select any existing exam as the source template. A preview shows sections count, questions, duration, and proctoring status.',
          descriptionAr:
            'من القائمة الجانبية: إدارة الاختبارات → "إنشاء من قالب". ابحث واختر أي اختبار موجود كقالب مصدر. تعرض المعاينة عدد الأقسام والأسئلة والمدة وحالة المراقبة.',
          imagePlaceholder: "/tutorials/template-select.png",
        },
        {
          id: "template-info",
          titleEn: "Enter New Exam Information",
          titleAr: "إدخال معلومات الاختبار الجديد",
          descriptionEn:
            "Provide a new title (required) and optionally a description in both languages.",
          descriptionAr:
            "أدخل عنواناً جديداً (مطلوب) واختيارياً وصفاً باللغتين.",
          imagePlaceholder: "/tutorials/template-info.png",
          fields: [
            {
              nameEn: "Title (English)",
              nameAr: "العنوان (إنجليزي)",
              required: true,
              descriptionEn: "New exam title",
              descriptionAr: "عنوان الاختبار الجديد",
            },
            {
              nameEn: "Title (Arabic)",
              nameAr: "العنوان (عربي)",
              required: false,
              descriptionEn: "Optional",
              descriptionAr: "اختياري",
            },
            {
              nameEn: "Description (EN/AR)",
              nameAr: "الوصف (EN/AR)",
              required: false,
              descriptionEn: "Optional bilingual description",
              descriptionAr: "وصف ثنائي اللغة اختياري",
            },
          ],
        },
        {
          id: "template-timing",
          titleEn: "Set New Timing",
          titleAr: "تحديد التوقيت الجديد",
          descriptionEn:
            "Set the exam type (Flexible/Fixed, pre-filled from source), start/end dates, and duration (pre-filled from source, editable).",
          descriptionAr:
            "حدد نوع الاختبار (مرن/ثابت، مملوء مسبقاً من المصدر)، تواريخ البداية/النهاية، والمدة (مملوءة مسبقاً من المصدر، قابلة للتعديل).",
          imagePlaceholder: "/tutorials/template-timing.png",
          fields: [
            {
              nameEn: "Exam Type",
              nameAr: "نوع الاختبار",
              required: false,
              descriptionEn: "Pre-filled from source exam",
              descriptionAr: "مملوء مسبقاً من الاختبار المصدر",
            },
            {
              nameEn: "Duration",
              nameAr: "المدة",
              required: true,
              descriptionEn: "Pre-filled, range 1–600 minutes",
              descriptionAr: "مملوء مسبقاً، النطاق 1–600 دقيقة",
            },
            {
              nameEn: "Start/End Dates",
              nameAr: "تواريخ البداية/النهاية",
              required: false,
              descriptionEn: "New schedule for the cloned exam",
              descriptionAr: "جدول جديد للاختبار المنسوخ",
            },
          ],
          tipEn:
            "The cloned exam is always created as Draft — you must publish it separately.",
          tipAr: "الاختبار المنسوخ يُنشأ دائماً كمسودة — يجب نشره بشكل منفصل.",
        },
        {
          id: "template-what-copies",
          titleEn: "What Gets Copied",
          titleAr: "ما يتم نسخه",
          descriptionEn:
            "Everything is cloned from the source exam:\n✓ All Sections & Questions (same question references)\n✓ Security Settings (proctoring, lockdown, etc.)\n✓ Result & Review Settings\n✓ Instructions\n✓ Access Policy\n✓ Scoring settings (max attempts, pass score, shuffle)",
          descriptionAr:
            "يتم نسخ كل شيء من الاختبار المصدر:\n✓ جميع الأقسام والأسئلة (نفس مراجع الأسئلة)\n✓ إعدادات الأمان (المراقبة، القفل، إلخ)\n✓ إعدادات النتائج والمراجعة\n✓ التعليمات\n✓ سياسة الوصول\n✓ إعدادات التسجيل (المحاولات، درجة النجاح، الخلط)",
          imagePlaceholder: "/tutorials/template-copies.png",
          noteEn:
            "The new exam starts as Draft with IsActive = true. No candidate assignments are copied.",
          noteAr:
            "يبدأ الاختبار الجديد كمسودة مع IsActive = صحيح. لا يتم نسخ تعيينات المرشحين.",
        },
      ],
    },

    // ─── Section 7: Exam List ────
    {
      id: "exam-list",
      titleEn: "7. Exam List",
      titleAr: "7. قائمة الاختبارات",
      descriptionEn:
        "View all exams with their status, configuration, and available actions. Filter by status and search by title.",
      descriptionAr:
        "عرض جميع الاختبارات مع حالتها وإعداداتها والإجراءات المتاحة. فلترة حسب الحالة والبحث بالعنوان.",
      steps: [
        {
          id: "list-navigate",
          titleEn: "Navigate to Exam List",
          titleAr: "الانتقال إلى قائمة الاختبارات",
          descriptionEn:
            'From the sidebar: Exam Management → "Exams List". Shows all exams in a table.',
          descriptionAr:
            'من القائمة الجانبية: إدارة الاختبارات → "قائمة الاختبارات". يعرض جميع الاختبارات في جدول.',
          imagePlaceholder: "/tutorials/exam-list-nav.png",
        },
        {
          id: "list-columns",
          titleEn: "Table Columns",
          titleAr: "أعمدة الجدول",
          descriptionEn:
            "The exam list shows:\n• Title: Exam name (links to setup page)\n• Status: Draft, Published, or Archived\n• Configuration: Quick link to configuration page\n• Builder: Quick link to builder tab\n• Actions: Dropdown menu with context-aware options",
          descriptionAr:
            "تعرض قائمة الاختبارات:\n• العنوان: اسم الاختبار (يرتبط بصفحة الإعداد)\n• الحالة: مسودة، منشور، أو مؤرشف\n• الإعدادات: رابط سريع لصفحة الإعدادات\n• المُنشئ: رابط سريع لتبويب المُنشئ\n• الإجراءات: قائمة منسدلة بخيارات حسب السياق",
          imagePlaceholder: "/tutorials/exam-list-columns.png",
        },
        {
          id: "list-filters",
          titleEn: "Filters & Search",
          titleAr: "الفلاتر والبحث",
          descriptionEn:
            "Use the search bar to filter by exam title. Use the Status dropdown to filter by: All, Draft, Published, or Archived.",
          descriptionAr:
            "استخدم شريط البحث للتصفية حسب عنوان الاختبار. استخدم قائمة الحالة للتصفية حسب: الكل، مسودة، منشور، أو مؤرشف.",
          imagePlaceholder: "/tutorials/exam-list-filters.png",
        },
        {
          id: "list-actions",
          titleEn: "Actions per Exam Status",
          titleAr: "الإجراءات حسب حالة الاختبار",
          descriptionEn:
            "Available actions depend on exam status:\n\n• Draft: View, Edit, Publish, Delete\n• Published: View, Edit, Archive, Delete*\n• Archived: View, Edit, Delete\n\n* Delete is only possible if no candidate attempts exist. If there are attempts, you can only Archive.",
          descriptionAr:
            "الإجراءات المتاحة تعتمد على حالة الاختبار:\n\n• مسودة: عرض، تعديل، نشر، حذف\n• منشور: عرض، تعديل، أرشفة، حذف*\n• مؤرشف: عرض، تعديل، حذف\n\n* الحذف ممكن فقط إذا لم تكن هناك محاولات مرشحين. إذا وُجدت محاولات، يمكنك الأرشفة فقط.",
          imagePlaceholder: "/tutorials/exam-list-actions.png",
          tipEn:
            "Successful publish shows a celebration dialog. Failed delete (due to attempts) shows an error dialog with the backend message.",
          tipAr:
            "النشر الناجح يعرض حوار احتفال. فشل الحذف (بسبب المحاولات) يعرض حوار خطأ برسالة الخادم.",
        },
      ],
      examples: [
        {
          titleEn: "Exam Status Meanings",
          titleAr: "معاني حالات الاختبار",
          contentEn:
            "| Status | Meaning | Can Publish? | Can Archive? |\n|--------|---------|-------------|-------------|\n| Draft | Saved but not yet available to candidates | ✓ Yes | ✗ No |\n| Published | Live — candidates can take this exam | ✗ Already published | ✓ Yes |\n| Archived | Was published, now deactivated | ✓ Yes (re-publish) | ✗ Already archived |",
          contentAr:
            "| الحالة | المعنى | يمكن النشر؟ | يمكن الأرشفة؟ |\n|--------|---------|-------------|-------------|\n| مسودة | محفوظ لكن غير متاح للمرشحين | ✓ نعم | ✗ لا |\n| منشور | مباشر — يمكن للمرشحين تقديمه | ✗ منشور بالفعل | ✓ نعم |\n| مؤرشف | كان منشوراً، الآن معطل | ✓ نعم (إعادة نشر) | ✗ مؤرشف بالفعل |",
        },
      ],
    },
    // ─── Section 8: Violation Events & Auto-Termination ────
    {
      id: "violation-events",
      titleEn: "8. Violation Events & Auto-Termination",
      titleAr: "8. أحداث المخالفات والإنهاء التلقائي",
      descriptionEn:
        "All monitored events during exams, which ones count toward auto-termination, and how the warning system works.",
      descriptionAr:
        "جميع الأحداث المراقبة أثناء الاختبارات، وأيها يُحتسب ضمن الإنهاء التلقائي، وكيف يعمل نظام التحذيرات.",
      steps: [
        {
          id: "all-violation-events",
          titleEn: "All Violation Events",
          titleAr: "جميع أحداث المخالفات",
          descriptionEn:
            "The system monitors 13 events during exams. Each event is logged in real-time and visible to the proctor. Events are split into two categories:\n\nSecurity / Behavioral Events (Soft Proctoring):",
          descriptionAr:
            "يراقب النظام 13 حدثاً أثناء الاختبارات. يتم تسجيل كل حدث في الوقت الفعلي ويكون مرئياً للمراقب. تنقسم الأحداث إلى فئتين:\n\nأحداث الأمان / السلوك (المراقبة الخفيفة):",
          fields: [
            {
              nameEn: "1. TabSwitched",
              nameAr: "1. تبديل التبويب",
              required: true,
              descriptionEn:
                'visibilitychange listener — Candidate switched to another browser tab  ·  Severity: Medium  ·  Warning: "Tab switch detected — please stay on the exam tab"',
              descriptionAr:
                'مستمع visibilitychange — المرشح انتقل إلى تبويب متصفح آخر  ·  الشدة: متوسط  ·  تحذير: "تم اكتشاف تبديل تبويب — يرجى البقاء في تبويب الاختبار"',
            },
            {
              nameEn: "2. WindowBlur",
              nameAr: "2. فقدان تركيز النافذة",
              required: false,
              descriptionEn:
                "blur event — Window lost focus (fires with TabSwitched)  ·  Severity: Low  ·  Deduplicated with TabSwitched — does not count separately",
              descriptionAr:
                "حدث blur — النافذة فقدت التركيز (يُطلق مع تبديل التبويب)  ·  الشدة: منخفض  ·  مدمج مع تبديل التبويب — لا يُحتسب منفصلاً",
            },
            {
              nameEn: "3. FullscreenExited",
              nameAr: "3. الخروج من ملء الشاشة",
              required: false,
              descriptionEn:
                "fullscreenchange listener — Candidate left fullscreen mode  ·  Severity: Medium  ·  Warning: toast notification + re-prompt to fullscreen",
              descriptionAr:
                "مستمع fullscreenchange — المرشح خرج من وضع ملء الشاشة  ·  الشدة: متوسط  ·  تحذير: إشعار + إعادة طلب ملء الشاشة",
            },
            {
              nameEn: "4. CopyAttempt",
              nameAr: "4. محاولة نسخ",
              required: false,
              descriptionEn:
                'copy event — Blocked by prevention policy, no actual data copied  ·  Severity: Low  ·  Warning: toast "Copy is not allowed"',
              descriptionAr:
                'حدث copy — محظور بموجب سياسة المنع، لا يتم نسخ بيانات  ·  الشدة: منخفض  ·  تحذير: إشعار "النسخ غير مسموح"',
            },
            {
              nameEn: "5. PasteAttempt",
              nameAr: "5. محاولة لصق",
              required: false,
              descriptionEn:
                'paste event — Blocked by prevention policy, no data pasted  ·  Severity: Low  ·  Warning: toast "Paste is not allowed"',
              descriptionAr:
                'حدث paste — محظور بموجب سياسة المنع، لا يتم لصق بيانات  ·  الشدة: منخفض  ·  تحذير: إشعار "اللصق غير مسموح"',
            },
            {
              nameEn: "6. RightClickAttempt",
              nameAr: "6. محاولة نقر يمين",
              required: false,
              descriptionEn:
                "contextmenu event — Right-click blocked  ·  Severity: Low  ·  Warning: none (silently blocked)",
              descriptionAr:
                "حدث contextmenu — النقر الأيمن محظور  ·  الشدة: منخفض  ·  تحذير: لا يوجد (يُحظر بصمت)",
            },
          ],
          noteEn:
            "Camera/AI Events (Advanced Proctoring) are listed in the next step below.",
          noteAr:
            "أحداث الكاميرا/الذكاء الاصطناعي (المراقبة المتقدمة) مدرجة في الخطوة التالية أدناه.",
        },
        {
          id: "camera-ai-events",
          titleEn: "Camera / AI Events (Advanced Proctoring)",
          titleAr: "أحداث الكاميرا / الذكاء الاصطناعي (المراقبة المتقدمة)",
          descriptionEn:
            "These events are detected by the SmartMonitoring AI engine which analyzes the webcam feed in real-time:",
          descriptionAr:
            "يتم اكتشاف هذه الأحداث بواسطة محرك المراقبة الذكية الذي يحلل بث الكاميرا في الوقت الفعلي:",
          fields: [
            {
              nameEn: "7. FaceNotDetected",
              nameAr: "7. عدم اكتشاف وجه",
              required: true,
              descriptionEn:
                'SmartMonitoring (2s continuous) — No face found in webcam  ·  Severity: High  ·  Warning: "Face not detected — please face the camera"',
              descriptionAr:
                'المراقبة الذكية (2 ثانية مستمرة) — لم يُكتشف وجه في الكاميرا  ·  الشدة: عالي  ·  تحذير: "لم يُكتشف وجه — يرجى مواجهة الكاميرا"',
            },
            {
              nameEn: "8. MultipleFacesDetected",
              nameAr: "8. اكتشاف وجوه متعددة",
              required: true,
              descriptionEn:
                'SmartMonitoring (2s continuous) — More than one person detected  ·  Severity: High  ·  Warning: "Multiple faces detected — only one person allowed"',
              descriptionAr:
                'المراقبة الذكية (2 ثانية مستمرة) — تم اكتشاف أكثر من شخص  ·  الشدة: عالي  ·  تحذير: "تم اكتشاف وجوه متعددة — يُسمح بشخص واحد فقط"',
            },
            {
              nameEn: "9. FaceOutOfFrame",
              nameAr: "9. الوجه خارج الإطار",
              required: false,
              descriptionEn:
                'SmartMonitoring (30% margin) — Face near edge of frame  ·  Severity: Medium  ·  Warning: toast "Please center your face"',
              descriptionAr:
                'المراقبة الذكية (هامش 30%) — الوجه قريب من حافة الإطار  ·  الشدة: متوسط  ·  تحذير: إشعار "يرجى توسيط وجهك"',
            },
            {
              nameEn: "10. HeadTurnDetected",
              nameAr: "10. اكتشاف دوران الرأس",
              required: false,
              descriptionEn:
                'SmartMonitoring (yaw>30°, pitch>25°) — Head turned away  ·  Severity: Medium  ·  Warning: toast "Please face the screen"',
              descriptionAr:
                'المراقبة الذكية (انحراف>30°، ميل>25°) — دوران الرأس بعيداً  ·  الشدة: متوسط  ·  تحذير: إشعار "يرجى مواجهة الشاشة"',
            },
            {
              nameEn: "11. CameraBlocked",
              nameAr: "11. حجب الكاميرا",
              required: true,
              descriptionEn:
                'SmartMonitoring (dark+low variance) — Webcam obstructed or covered  ·  Severity: High  ·  Warning: "Camera blocked — please uncover your webcam"',
              descriptionAr:
                'المراقبة الذكية (ظلام+تباين منخفض) — الكاميرا محجوبة أو مغطاة  ·  الشدة: عالي  ·  تحذير: "الكاميرا محجوبة — يرجى كشف الكاميرا"',
            },
            {
              nameEn: "12. WebcamDenied",
              nameAr: "12. رفض الكاميرا",
              required: false,
              descriptionEn:
                "getUserMedia failure — Candidate denied camera permission  ·  Severity: Critical  ·  Warning: permission denied screen shown",
              descriptionAr:
                "فشل getUserMedia — المرشح رفض إذن الكاميرا  ·  الشدة: حرج  ·  تحذير: عرض شاشة رفض الإذن",
            },
            {
              nameEn: "13. SnapshotFailed",
              nameAr: "13. فشل اللقطة",
              required: false,
              descriptionEn:
                "Snapshot upload failure — Technical/network issue  ·  Severity: Low  ·  Warning: none (silent, logged only)",
              descriptionAr:
                "فشل رفع اللقطة — مشكلة تقنية/شبكة  ·  الشدة: منخفض  ·  تحذير: لا يوجد (صامت، يُسجّل فقط)",
            },
          ],
          tipEn:
            'The "Required" badge in the table above means the event COUNTS toward auto-termination. "Optional" means it is logged only.',
          tipAr:
            'علامة "مطلوب" في الجدول أعلاه تعني أن الحدث يُحتسب ضمن الإنهاء التلقائي. "اختياري" تعني أنه يُسجّل فقط.',
        },
        {
          id: "count-vs-no-count",
          titleEn: "What Counts vs. What Doesn't",
          titleAr: "ما يُحتسب مقابل ما لا يُحتسب",
          descriptionEn:
            "Summary of which events increment the violation counter and the reasoning behind each decision:",
          descriptionAr:
            "ملخص الأحداث التي تزيد عداد المخالفات والمبررات وراء كل قرار:",
          fields: [
            {
              nameEn: "TabSwitched",
              nameAr: "تبديل التبويب",
              required: true,
              descriptionEn: "Intentional — candidate left the exam tab",
              descriptionAr: "مقصود — المرشح غادر تبويب الاختبار",
            },
            {
              nameEn: "FaceNotDetected",
              nameAr: "عدم اكتشاف وجه",
              required: true,
              descriptionEn: "Candidate moved away from camera",
              descriptionAr: "المرشح ابتعد عن الكاميرا",
            },
            {
              nameEn: "MultipleFacesDetected",
              nameAr: "اكتشاف وجوه متعددة",
              required: true,
              descriptionEn: "Someone else is at the screen",
              descriptionAr: "شخص آخر موجود أمام الشاشة",
            },
            {
              nameEn: "CameraBlocked",
              nameAr: "حجب الكاميرا",
              required: true,
              descriptionEn: "Intentional covering of camera",
              descriptionAr: "تغطية مقصودة للكاميرا",
            },
            {
              nameEn: "WindowBlur",
              nameAr: "فقدان تركيز النافذة",
              required: false,
              descriptionEn:
                "Same as TabSwitched — deduplicated, they fire together",
              descriptionAr: "نفس تبديل التبويب — مدمج، يُطلقان معاً",
            },
            {
              nameEn: "FullscreenExited",
              nameAr: "الخروج من ملء الشاشة",
              required: false,
              descriptionEn:
                "Could be accidental (Esc key) or technical. Already re-prompts to fullscreen",
              descriptionAr:
                "قد يكون عرضياً (مفتاح Esc) أو تقني. يُعاد طلب ملء الشاشة تلقائياً",
            },
            {
              nameEn: "CopyAttempt / PasteAttempt",
              nameAr: "محاولة نسخ / لصق",
              required: false,
              descriptionEn:
                "Already blocked — action is prevented, no actual cheating occurred",
              descriptionAr: "محظور بالفعل — الإجراء ممنوع، لم يحدث غش فعلي",
            },
            {
              nameEn: "RightClickAttempt",
              nameAr: "محاولة نقر يمين",
              required: false,
              descriptionEn: "Already blocked — context menu prevented",
              descriptionAr: "محظور بالفعل — قائمة السياق ممنوعة",
            },
            {
              nameEn: "FaceOutOfFrame",
              nameAr: "الوجه خارج الإطار",
              required: false,
              descriptionEn: "Too sensitive — could be minor posture shift",
              descriptionAr: "حساس جداً — قد يكون تغيير بسيط في الوضعية",
            },
            {
              nameEn: "HeadTurnDetected",
              nameAr: "اكتشاف دوران الرأس",
              required: false,
              descriptionEn: "Too sensitive — looking at keyboard, stretching",
              descriptionAr: "حساس جداً — النظر إلى لوحة المفاتيح، التمدد",
            },
            {
              nameEn: "WebcamDenied",
              nameAr: "رفض الكاميرا",
              required: false,
              descriptionEn:
                "Technical issue — handle separately via permission flow",
              descriptionAr:
                "مشكلة تقنية — يُعالج بشكل منفصل عبر تدفق الأذونات",
            },
            {
              nameEn: "SnapshotFailed",
              nameAr: "فشل اللقطة",
              required: false,
              descriptionEn:
                "Technical/network issue — not the candidate's fault",
              descriptionAr: "مشكلة تقنية/شبكة — ليس خطأ المرشح",
            },
          ],
          noteEn:
            'The "Required" badge = COUNTS toward termination. "Optional" badge = logged only, does NOT count.',
          noteAr:
            'علامة "مطلوب" = يُحتسب ضمن الإنهاء. علامة "اختياري" = يُسجّل فقط، لا يُحتسب.',
        },
        {
          id: "auto-termination-flow",
          titleEn: "How Auto-Termination Works",
          titleAr: "كيف يعمل الإنهاء التلقائي",
          descriptionEn:
            "1. Set Max Violation Warnings in the exam's Security tab (default: 10, set to 0 to disable)\n2. Each countable violation increments the counter\n3. At count = Max − 1: A blocking LAST WARNING modal appears telling the candidate this is their final chance\n4. At count = Max: The exam is automatically terminated, recorded as a terminated attempt with full details\n5. The terminated attempt appears in the Terminated Attempts list with the reason and violation count",
          descriptionAr:
            "1. حدد الحد الأقصى لتحذيرات المخالفات في تبويب الأمان للاختبار (الافتراضي: 10، اضبطه على 0 للتعطيل)\n2. كل مخالفة قابلة للحساب تزيد العداد\n3. عند العدد = الحد − 1: يظهر تحذير أخير حاجب للمرشح يخبره أن هذه فرصته الأخيرة\n4. عند العدد = الحد: يتم إنهاء الاختبار تلقائياً ويُسجّل كمحاولة منتهية مع التفاصيل الكاملة\n5. تظهر المحاولة المنتهية في قائمة المحاولات المنتهية مع السبب وعدد المخالفات",
          tipEn:
            "Setting Max Violation Warnings to 0 disables auto-termination entirely. Violations are still logged.",
          tipAr:
            "تعيين الحد الأقصى لتحذيرات المخالفات إلى 0 يعطّل الإنهاء التلقائي بالكامل. لا تزال المخالفات مُسجّلة.",
        },
        {
          id: "warning-messages",
          titleEn: "Warning Messages Shown to Candidate",
          titleAr: "رسائل التحذير المعروضة للمرشح",
          descriptionEn:
            "When a countable violation is detected, the candidate sees a warning dialog. Here are the messages at each stage:",
          descriptionAr:
            "عند اكتشاف مخالفة قابلة للحساب، يرى المرشح نافذة تحذير. إليك الرسائل في كل مرحلة:",
          fields: [
            {
              nameEn: "Regular Warning (amber dialog)",
              nameAr: "تحذير عادي (نافذة كهرمانية)",
              required: false,
              descriptionEn:
                '"Warning from Proctor" — Please follow the proctor\'s instructions. Continued violations may result in session termination.',
              descriptionAr:
                '"تحذير من المراقب" — يرجى اتباع تعليمات المراقب. استمرار المخالفات قد يؤدي إلى إنهاء الجلسة.',
            },
            {
              nameEn: "Last Warning (red blocking dialog)",
              nameAr: "تحذير أخير (نافذة حمراء حاجبة)",
              required: true,
              descriptionEn:
                '"⚠ FINAL WARNING" — This is your final warning. You have reached X of Y allowed violations. The NEXT violation will automatically terminate your exam.',
              descriptionAr:
                '"⚠ تحذير أخير" — هذا تحذيرك الأخير. لقد وصلت إلى X من Y مخالفات مسموحة. المخالفة التالية ستنهي اختبارك تلقائياً.',
            },
            {
              nameEn: "Auto-Terminated (redirect)",
              nameAr: "إنهاء تلقائي (إعادة توجيه)",
              required: true,
              descriptionEn:
                '"Auto-terminated: exceeded maximum violations (X)" — Candidate is redirected to My Exams page. Attempt appears in Terminated Attempts list.',
              descriptionAr:
                '"تم الإنهاء التلقائي: تجاوز الحد الأقصى للمخالفات (X)" — يتم إعادة توجيه المرشح إلى صفحة اختباراتي. تظهر المحاولة في قائمة المحاولات المنتهية.',
            },
          ],
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// GRADING MODULE
// ────────────────────────────────────────────────────────
export const gradingTutorial: TutorialModule = {
  id: "grading",
  slug: "grading",
  titleEn: "Grading",
  titleAr: "التصحيح",
  descriptionEn:
    "Learn how to grade exams — auto-grading, manual grading, AI-assisted grading, and finalizing results. Covers the full grading workflow from submission to publishing.",
  descriptionAr:
    "تعلّم كيفية تصحيح الاختبارات — التصحيح الآلي، التصحيح اليدوي، التصحيح بمساعدة الذكاء الاصطناعي، واعتماد النتائج. يغطي سير عمل التصحيح الكامل من تسليم الاختبار إلى نشر النتائج.",
  iconName: "GraduationCap",
  videoPlaceholder: "/tutorials/grading-overview.mp4",
  sections: [
    // ── Section 1: Understanding Grading Types ──
    {
      id: "grading-types",
      titleEn: "1. Understanding Grading Types",
      titleAr: "1. فهم أنواع التصحيح",
      descriptionEn:
        "SmartExam supports three grading modes: Auto Grading (instant), Manual Grading (instructor review), and AI-Assisted Grading (AI suggestions with instructor approval).",
      descriptionAr:
        "يدعم SmartExam ثلاثة أنماط تصحيح: التصحيح الآلي (فوري)، التصحيح اليدوي (مراجعة المصحح)، والتصحيح بمساعدة AI (اقتراحات ذكية مع موافقة المصحح).",
      steps: [
        {
          id: "auto-grading",
          titleEn: "Auto Grading (Instant)",
          titleAr: "التصحيح الآلي (فوري)",
          descriptionEn:
            "Objective questions are graded **automatically** when the candidate submits. Supported types:\n- Multiple Choice (single & multi-answer)\n- True / False\n- Matching\n- Fill-in-the-blank (exact match)\nThe score appears **immediately** — no instructor action needed.",
          descriptionAr:
            "يتم تصحيح الأسئلة الموضوعية **تلقائياً** عند تسليم المرشح. الأنواع المدعومة:\n- اختيار من متعدد (إجابة واحدة ومتعددة)\n- صح / خطأ\n- مطابقة\n- ملء الفراغات (مطابقة حرفية)\nتظهر الدرجة **فوراً** — لا حاجة لتدخل المصحح.",
          tipEn:
            "If an exam contains ONLY auto-graded questions, the result is available immediately after submission — no manual grading step is needed.",
          tipAr:
            "إذا كان الاختبار يحتوي فقط على أسئلة ذات تصحيح آلي، تكون النتيجة متاحة فوراً بعد التسليم — لا حاجة لخطوة التصحيح اليدوي.",
        },
        {
          id: "manual-grading",
          titleEn: "Manual Grading (Instructor Review)",
          titleAr: "التصحيح اليدوي (مراجعة المصحح)",
          descriptionEn:
            'Subjective questions require **instructor review**. The workflow:\n1. Review the candidate\'s answer\n2. Compare against the **rubric / model answer**\n3. Assign a score (0 to max points)\n4. Provide written feedback\nThese appear in the "Grading Center" with status "Pending".',
          descriptionAr:
            'الأسئلة الذاتية تتطلب **مراجعة المصحح**. سير العمل:\n1. مراجعة إجابة المرشح\n2. المقارنة مع **النموذج / المعيار**\n3. تحديد الدرجة (من 0 إلى الحد الأقصى)\n4. تقديم ملاحظات مكتوبة\nتظهر في "مركز التصحيح" بحالة "معلّق".',
          noteEn:
            "Exams containing any subjective question will NOT show results until ALL manual questions are graded and finalized.",
          noteAr:
            "الاختبارات التي تحتوي على أي سؤال ذاتي لن تظهر نتائجها حتى يتم تصحيح جميع الأسئلة اليدوية واعتمادها.",
        },
        {
          id: "ai-assisted-grading",
          titleEn: "AI-Assisted Grading (AI Examiner Helper)",
          titleAr: "التصحيح بمساعدة AI (مساعد المصحح الذكي)",
          descriptionEn:
            'Click "AI Suggest Grade" on any subjective question. The AI provides:\n- **Suggested Score** — points to assign\n- **Detailed Feedback** — grading rationale\n- **Confidence %** — how certain the AI is (0–100%)\nThe instructor **always has final authority** — accept, modify, or ignore.',
          descriptionAr:
            'انقر "اقتراح AI للدرجة" على أي سؤال ذاتي. يقدم AI:\n- **الدرجة المقترحة** — النقاط المقترحة\n- **ملاحظات تفصيلية** — مبررات التصحيح\n- **نسبة الثقة %** — مدى ثقة AI (0–100%)\n**للمصحح دائماً القرار النهائي** — قبول أو تعديل أو تجاهل.',
          tipEn:
            "AI confidence is color-coded: Green (≥80% — high), Yellow (50–79% — medium), Red (<50% — low, review carefully).",
          tipAr:
            "ثقة AI مرمّزة بالألوان: أخضر (≥80% — عالية)، أصفر (50–79% — متوسطة)، أحمر (<50% — منخفضة، راجع بعناية).",
        },
      ],
      examples: [
        {
          titleEn: "Grading Flow Summary",
          titleAr: "ملخص سير عمل التصحيح",
          contentEn:
            "1. Candidate submits exam\n2. Auto-graded questions scored instantly\n3. If subjective questions exist → status = Pending Manual Grading\n4. Instructor opens Grading Center → reviews & grades each question\n5. (Optional) Uses AI Suggest for faster grading\n6. Clicks Finalize → result calculated\n7. Publishes result → candidate notified by email",
          contentAr:
            "1. المرشح يسلّم الاختبار\n2. الأسئلة الآلية تُصحح فوراً\n3. إذا وجدت أسئلة ذاتية ← الحالة = بانتظار التصحيح اليدوي\n4. المصحح يفتح مركز التصحيح ← يراجع ويصحح كل سؤال\n5. (اختياري) يستخدم اقتراح AI لتسريع التصحيح\n6. ينقر اعتماد ← تُحسب النتيجة\n7. ينشر النتيجة ← يُبلّغ المرشح بالبريد",
        },
      ],
    },
    // ── Section 2: Grading Center (List Page) ──
    {
      id: "grading-center",
      titleEn: "2. Grading Center",
      titleAr: "2. مركز التصحيح",
      descriptionEn:
        "The Grading Center shows all exam submissions that need grading. Filter, search, and navigate to grade individual submissions.",
      descriptionAr:
        "مركز التصحيح يعرض جميع تسليمات الاختبارات التي تحتاج تصحيح. يمكنك التصفية والبحث والتنقل لتصحيح كل تسليم.",
      steps: [
        {
          id: "navigate-grading",
          titleEn: "Navigate to Grading",
          titleAr: "الانتقال إلى التصحيح",
          descriptionEn:
            'From the sidebar, expand "Result" and click "Grading". The Grading Center page opens showing all grading sessions.',
          descriptionAr:
            'من القائمة الجانبية، وسّع "النتائج" وانقر على "التصحيح". تفتح صفحة مركز التصحيح التي تعرض جميع جلسات التصحيح.',
          imagePlaceholder: "/tutorials/grading-nav.png",
        },
        {
          id: "grading-stats",
          titleEn: "View Statistics",
          titleAr: "عرض الإحصائيات",
          descriptionEn:
            "Three **summary cards** at the top:\n- **Total Sessions** — filtered count of all grading sessions\n- **Questions to Grade** — sum of all manual questions still pending\n- **Exams with Pending** — how many exams have ungraded submissions",
          descriptionAr:
            "ثلاث **بطاقات ملخصة** في الأعلى:\n- **إجمالي الجلسات** — العدد المصفّى لجميع جلسات التصحيح\n- **أسئلة للتصحيح** — مجموع الأسئلة اليدوية المعلقة\n- **اختبارات بها معلّقات** — عدد الاختبارات بها تسليمات غير مصححة",
          imagePlaceholder: "/tutorials/grading-stats.png",
        },
        {
          id: "grading-filters",
          titleEn: "Filter & Search Submissions",
          titleAr: "تصفية والبحث في التسليمات",
          descriptionEn:
            'Available filters:\n- **Show Filter** — toggle between "Pending Only" and "All (including completed)"\n- **Search** — by candidate name, candidate ID, or exam title\n- **Exam Filter** — dropdown to filter by a specific exam',
          descriptionAr:
            'المرشحات المتاحة:\n- **فلتر العرض** — التبديل بين "المعلقة فقط" و"الكل (شاملة المكتملة)"\n- **البحث** — بالاسم أو رقم المرشح أو عنوان الاختبار\n- **فلتر الاختبار** — قائمة للتصفية حسب اختبار محدد',
          imagePlaceholder: "/tutorials/grading-filters.png",
        },
        {
          id: "grading-table",
          titleEn: "Understand the Grading Table",
          titleAr: "فهم جدول التصحيح",
          descriptionEn:
            'Table columns:\n- **Candidate** — name & ID\n- **Exam** — title & graded date\n- **Status** — "Finalized" (green), "Pending Finalize" (amber), or "Pending" (gray)\n- **Progress** — visual bar showing X/Y questions graded\n- **Auto Score** — percentage of auto-graded questions\n- **Actions** — "Grade" or "View" link',
          descriptionAr:
            'أعمدة الجدول:\n- **المرشح** — الاسم والرقم\n- **الاختبار** — العنوان وتاريخ التصحيح\n- **الحالة** — "معتمد" (أخضر)، "بانتظار الاعتماد" (أصفر)، أو "معلّق" (رمادي)\n- **التقدم** — شريط مرئي يعرض X/Y سؤال مصحح\n- **الدرجة الآلية** — نسبة الأسئلة المصححة آلياً\n- **الإجراءات** — رابط "تصحيح" أو "عرض"',
          imagePlaceholder: "/tutorials/grading-table.png",
          tipEn:
            "Status badges: Green = Finalized (done), Amber = Pending Finalize (all graded, needs finalization), Gray = Pending (still has ungraded questions).",
          tipAr:
            "شارات الحالة: أخضر = معتمد (مكتمل)، أصفر = بانتظار الاعتماد (كل الأسئلة مصححة، يحتاج اعتماد)، رمادي = معلّق (لا يزال هناك أسئلة غير مصححة).",
        },
      ],
    },
    // ── Section 3: Grading a Submission (Detail Page) ──
    {
      id: "grade-submission",
      titleEn: "3. Grade a Submission",
      titleAr: "3. تصحيح تسليم",
      descriptionEn:
        "Walk through the detailed grading interface — review candidate answers, use the rubric, get AI suggestions, assign scores, and finalize.",
      descriptionAr:
        "تعرّف على واجهة التصحيح التفصيلية — مراجعة إجابات المرشح، استخدام المعيار، الحصول على اقتراحات AI، تحديد الدرجات، والاعتماد.",
      steps: [
        {
          id: "open-submission",
          titleEn: "Open a Submission for Grading",
          titleAr: "فتح تسليم للتصحيح",
          descriptionEn:
            'From the Grading Center table, click the "Grade" link on any pending submission. This opens the detailed grading page for that candidate\'s exam attempt.',
          descriptionAr:
            'من جدول مركز التصحيح، انقر على رابط "تصحيح" في أي تسليم معلّق. يفتح هذا صفحة التصحيح التفصيلية لمحاولة المرشح.',
          imagePlaceholder: "/tutorials/grading-open.png",
        },
        {
          id: "grading-layout",
          titleEn: "Understand the Layout",
          titleAr: "فهم تخطيط الصفحة",
          descriptionEn:
            'The page has **two main columns**:\n\n- **Left — Question Details**\n  Shows the question text, candidate\'s answer, and the model answer/rubric\n\n- **Right — Grading Panel**\n  Where you enter the score, feedback, and use AI assist\n\nThe **top bar** shows: exam title, candidate name, auto-grade score badge, and progress indicator (e.g., "2/5 Questions Graded — 40%").',
          descriptionAr:
            'الصفحة بها **عمودان رئيسيان**:\n\n- **اليسار — تفاصيل السؤال**\n  يعرض نص السؤال وإجابة المرشح والنموذج/المعيار\n\n- **اليمين — لوحة التصحيح**\n  حيث تدخل الدرجة والملاحظات وتستخدم مساعد AI\n\n**الشريط العلوي** يعرض: عنوان الاختبار، اسم المرشح، شارة الدرجة الآلية، ومؤشر التقدم (مثلاً "2/5 أسئلة مصححة — 40%").',
          imagePlaceholder: "/tutorials/grading-layout.png",
        },
        {
          id: "review-answer",
          titleEn: "Review the Candidate's Answer",
          titleAr: "مراجعة إجابة المرشح",
          descriptionEn:
            'The left column shows:\n1. **Question number & type** — e.g., "Question 1 of 3 — Manual Grading"\n2. **Full question text** — the complete question body\n3. **Candidate\'s answer** — highlighted box (for essays: full text; for MCQ: selected options with correct/incorrect indicators)\n4. **Model Answer / Grading Rubric** — blue-bordered box with the expected answer and grading criteria',
          descriptionAr:
            'يعرض العمود الأيسر:\n1. **رقم السؤال ونوعه** — مثلاً "السؤال 1 من 3 — تصحيح يدوي"\n2. **نص السؤال كاملاً** — محتوى السؤال الكامل\n3. **إجابة المرشح** — في مربع مميز (للمقالي: النص الكامل؛ للاختيار: الخيارات مع مؤشرات صح/خطأ)\n4. **النموذج / معيار التصحيح** — مربع بإطار أزرق يعرض الإجابة المتوقعة والمعايير',
          imagePlaceholder: "/tutorials/grading-answer-review.png",
          tipEn:
            'If the candidate didn\'t answer a question, an amber "Unanswered" badge appears. You can still assign partial points if your rubric allows it.',
          tipAr:
            'إذا لم يجب المرشح على السؤال، تظهر شارة "لم يُجب" بلون أصفر. يمكنك لا تزال منح درجات جزئية إذا سمح المعيار بذلك.',
        },
        {
          id: "ai-suggest",
          titleEn: "Use AI Suggest Grade",
          titleAr: "استخدام اقتراح AI للدرجة",
          descriptionEn:
            'Click the **"AI Suggest Grade"** button (purple, with ✨ icon). The AI returns:\n1. **Suggested Score** — pre-fills the points field\n2. **Suggested Feedback** — detailed grading comment\n3. **Confidence %** — color-coded trust level\n\nThe values **pre-fill** the score and feedback fields. Edit them freely before saving.',
          descriptionAr:
            'انقر على زر **"اقتراح AI للدرجة"** (بنفسجي، مع أيقونة ✨). يعيد AI:\n1. **الدرجة المقترحة** — تملأ حقل النقاط مسبقاً\n2. **الملاحظات المقترحة** — تعليق تصحيح مفصّل\n3. **نسبة الثقة %** — مستوى ثقة مرمّز بالألوان\n\nالقيم **تملأ** حقول الدرجة والملاحظات مسبقاً. عدّلها بحرية قبل الحفظ.',
          imagePlaceholder: "/tutorials/grading-ai-suggest.png",
          noteEn:
            "AI suggestion is advisory only. The instructor ALWAYS has final authority. The button is disabled if the candidate didn't answer the question.",
          noteAr:
            "اقتراح AI استشاري فقط. المصحح لديه دائماً القرار النهائي. الزر يكون معطلاً إذا لم يجب المرشح على السؤال.",
        },
        {
          id: "enter-score",
          titleEn: "Enter Score & Feedback",
          titleAr: "إدخال الدرجة والملاحظات",
          descriptionEn:
            'In the right panel under **"Grade Question"**:\n1. Enter points in the **"Points"** field — 0 to max, supports 0.5 increments\n2. Write feedback in the **"Feedback"** textarea — visible to candidate after publishing\n3. Click **"Save Grade"** — the button shows "Saved" ✓ after success',
          descriptionAr:
            'في اللوحة اليمنى تحت **"تصحيح السؤال"**:\n1. أدخل النقاط في حقل **"النقاط"** — من 0 إلى الحد الأقصى، يدعم زيادات 0.5\n2. اكتب ملاحظات في حقل **"الملاحظات"** — مرئية للمرشح بعد النشر\n3. انقر **"حفظ الدرجة"** — يعرض الزر "تم الحفظ" ✓ بعد النجاح',
          imagePlaceholder: "/tutorials/grading-score-input.png",
          fields: [
            {
              nameEn: "Points",
              nameAr: "النقاط",
              required: true,
              descriptionEn:
                "Score to assign (0 to max). Supports decimal values in 0.5 steps.",
              descriptionAr:
                "الدرجة المراد تحديدها (0 إلى الحد الأقصى). يدعم القيم العشرية بخطوات 0.5.",
            },
            {
              nameEn: "Feedback",
              nameAr: "الملاحظات",
              required: false,
              descriptionEn:
                "Comments for the candidate explaining the grade. Visible after result is published.",
              descriptionAr:
                "تعليقات للمرشح توضح الدرجة. مرئية بعد نشر النتيجة.",
            },
          ],
        },
        {
          id: "navigate-questions",
          titleEn: "Navigate Between Questions",
          titleAr: "التنقل بين الأسئلة",
          descriptionEn:
            'Use the "Previous" and "Next" buttons at the bottom of the grading panel to move between manual questions. The progress bar at the top updates as you grade each question. You can grade questions in any order.',
          descriptionAr:
            'استخدم زري "السابق" و"التالي" في أسفل لوحة التصحيح للتنقل بين الأسئلة اليدوية. يتحدث شريط التقدم في الأعلى كلما صححت سؤالاً. يمكنك تصحيح الأسئلة بأي ترتيب.',
          imagePlaceholder: "/tutorials/grading-navigation.png",
        },
        {
          id: "finalize-grading",
          titleEn: "Finalize Grading",
          titleAr: "اعتماد التصحيح",
          descriptionEn:
            'Once ALL manual questions are graded:\n1. The **"Finalize"** button (top right) becomes active\n2. Click it → a **confirmation dialog** appears\n3. Click **"Finalize"** to confirm\n\nThis action:\n- Calculates the **final score**\n- Determines **pass/fail**\n- Prepares the result for **publishing**',
          descriptionAr:
            'بمجرد تصحيح جميع الأسئلة اليدوية:\n1. يصبح زر **"اعتماد"** (أعلى اليمين) نشطاً\n2. انقر عليه ← يظهر **مربع تأكيد**\n3. انقر **"اعتماد"** للتأكيد\n\nهذا الإجراء:\n- يحسب **الدرجة النهائية**\n- يحدد **النجاح/الرسوب**\n- يجهّز النتيجة **للنشر**',
          imagePlaceholder: "/tutorials/grading-finalize.png",
          noteEn:
            "Finalization cannot be undone. Make sure all grades and feedback are correct before finalizing.",
          noteAr:
            "الاعتماد لا يمكن التراجع عنه. تأكد أن جميع الدرجات والملاحظات صحيحة قبل الاعتماد.",
        },
      ],
    },
    // ── Section 4: AI Examiner Assistant ──
    {
      id: "ai-examiner-assistant",
      titleEn: "4. AI Examiner Assistant",
      titleAr: "4. مساعد الممتحن الذكي",
      descriptionEn:
        "The AI Examiner Assistant uses GPT-4o to analyze subjective answers and provide intelligent grading suggestions — including a score, detailed feedback, and a confidence percentage.",
      descriptionAr:
        "يستخدم مساعد الممتحن الذكي GPT-4o لتحليل الإجابات الذاتية وتقديم اقتراحات تصحيح ذكية — تشمل درجة وملاحظات تفصيلية ونسبة ثقة.",
      steps: [
        {
          id: "what-is-ai-examiner",
          titleEn: "What Is the AI Examiner Assistant?",
          titleAr: "ما هو مساعد الممتحن الذكي؟",
          descriptionEn:
            "The **AI Examiner Assistant** is an integrated AI-powered grading helper that analyzes subjective answers using **GPT-4o**. It provides:\n- **Suggested Score** — a recommended grade for the question\n- **Detailed Feedback** — a written rationale explaining the suggested grade\n- **Confidence Percentage** — how confident the AI is in its suggestion (0–100%)\n\nThe AI compares the candidate's answer against the **model answer / rubric** you defined when creating the question.\n\nThe examiner **always has final authority** — the AI suggestion is advisory only.",
          descriptionAr:
            "**مساعد الممتحن الذكي** هو أداة تصحيح مدعومة بالذكاء الاصطناعي مدمجة تحلل الإجابات الذاتية باستخدام **GPT-4o**. يقدم:\n- **الدرجة المقترحة** — درجة موصى بها للسؤال\n- **ملاحظات تفصيلية** — مبررات مكتوبة تشرح الدرجة المقترحة\n- **نسبة الثقة** — مدى ثقة AI في اقتراحه (0–100%)\n\nيقارن AI إجابة المرشح مع **النموذج / المعيار** الذي حددته عند إنشاء السؤال.\n\n**للممتحن دائماً القرار النهائي** — اقتراح AI استشاري فقط.",
          imagePlaceholder: "/tutorials/grading-ai-examiner-overview.png",
        },
        {
          id: "ai-examiner-access",
          titleEn: "Who Can Use It?",
          titleAr: "من يمكنه استخدامه؟",
          descriptionEn:
            "The AI Examiner Assistant is available to the following roles:\n- **Admin** — full access to all grading features including AI\n- **Instructor** — can use AI suggestions when grading\n- **Examiner** — can use AI suggestions on assigned exams\n\nThe feature is available on the **grading detail page** for any submission containing subjective (manually-graded) questions.",
          descriptionAr:
            "مساعد الممتحن الذكي متاح للأدوار التالية:\n- **مدير** — وصول كامل لجميع ميزات التصحيح بما فيها AI\n- **مدرّس** — يمكنه استخدام اقتراحات AI عند التصحيح\n- **ممتحن** — يمكنه استخدام اقتراحات AI على الاختبارات المعيّنة\n\nالميزة متاحة في **صفحة تفاصيل التصحيح** لأي تسليم يحتوي على أسئلة ذاتية (مصححة يدوياً).",
          imagePlaceholder: "/tutorials/grading-ai-examiner-access.png",
        },
        {
          id: "ai-examiner-how-to-use",
          titleEn: "How to Use AI Suggest Grade",
          titleAr: "كيفية استخدام اقتراح AI للدرجة",
          descriptionEn:
            'Step-by-step usage:\n1. Open any **pending submission** from the Grading Center\n2. Navigate to a **subjective question** (essay, short answer, etc.)\n3. Click the **"AI Suggest Grade"** button (purple button with ✨ icon)\n4. Wait for the AI to analyze — a **loading spinner** with "AI Analyzing..." appears\n5. The AI returns its suggestion:\n   - **Suggested score** auto-fills the Points field\n   - **Suggested feedback** auto-fills the Feedback textarea\n   - **Confidence badge** appears in an animated panel\n6. **Review** the suggestion — modify the score or feedback if needed\n7. Click **"Save Grade"** to save the final grade',
          descriptionAr:
            'خطوات الاستخدام:\n1. افتح أي **تسليم معلّق** من مركز التصحيح\n2. انتقل إلى **سؤال ذاتي** (مقالي، إجابة قصيرة، إلخ.)\n3. انقر على زر **"اقتراح AI للدرجة"** (زر بنفسجي مع أيقونة ✨)\n4. انتظر تحليل AI — يظهر **مؤشر تحميل** مع "AI يحلل..."\n5. يعيد AI اقتراحه:\n   - **الدرجة المقترحة** تملأ حقل النقاط تلقائياً\n   - **الملاحظات المقترحة** تملأ حقل الملاحظات تلقائياً\n   - **شارة الثقة** تظهر في لوحة متحركة\n6. **راجع** الاقتراح — عدّل الدرجة أو الملاحظات إذا لزم\n7. انقر **"حفظ الدرجة"** لحفظ الدرجة النهائية',
          imagePlaceholder: "/tutorials/grading-ai-examiner-suggest.png",
          tipEn:
            "The AI Suggest button is disabled when the candidate has not answered the question. You can still grade manually in this case.",
          tipAr:
            "زر اقتراح AI معطّل عندما لا يكون المرشح قد أجاب على السؤال. يمكنك لا تزال التصحيح يدوياً في هذه الحالة.",
        },
        {
          id: "ai-examiner-confidence",
          titleEn: "Understanding Confidence Scores",
          titleAr: "فهم نقاط الثقة",
          descriptionEn:
            "The AI provides a **confidence percentage** (0–100%) with every suggestion. This tells you how certain the AI is about its grading decision.\n\nConfidence levels are **color-coded**:\n- **Green (≥80%)** — High confidence. The AI is very certain about the grade. Usually safe to accept.\n- **Yellow (50–79%)** — Medium confidence. The AI found some ambiguity. Review carefully before accepting.\n- **Red (<50%)** — Low confidence. The AI is uncertain. You should manually review the answer and rubric thoroughly.\n\nThe confidence badge appears in an **animated gradient panel** below the AI Suggest button after the AI completes its analysis.",
          descriptionAr:
            "يقدم AI **نسبة ثقة** (0–100%) مع كل اقتراح. هذا يخبرك مدى ثقة AI في قرار التصحيح.\n\nمستويات الثقة **مرمّزة بالألوان**:\n- **أخضر (≥80%)** — ثقة عالية. AI واثق جداً من الدرجة. عادةً آمن للقبول.\n- **أصفر (50–79%)** — ثقة متوسطة. AI وجد بعض الغموض. راجع بعناية قبل القبول.\n- **أحمر (<50%)** — ثقة منخفضة. AI غير متأكد. يجب مراجعة الإجابة والمعيار يدوياً بعناية.\n\nتظهر شارة الثقة في **لوحة متدرجة متحركة** أسفل زر اقتراح AI بعد إتمام التحليل.",
          imagePlaceholder: "/tutorials/grading-ai-confidence.png",
          noteEn:
            "Low confidence does not mean the AI is wrong — it means the answer is ambiguous or the rubric is broad. Always use your professional judgment.",
          noteAr:
            "الثقة المنخفضة لا تعني أن AI مخطئ — تعني أن الإجابة غامضة أو المعيار واسع. استخدم دائماً حكمك المهني.",
        },
        {
          id: "ai-examiner-suggestion-panel",
          titleEn: "AI Suggestion Panel",
          titleAr: "لوحة اقتراح AI",
          descriptionEn:
            "After clicking **AI Suggest Grade**, an **animated panel** appears in the grading sidebar showing:\n- **Confidence badge** — color-coded percentage (Green/Yellow/Red)\n- **AI model used** — displays the model name (e.g., GPT-4o)\n- **Explanation text** — brief summary of the AI's reasoning\n\nThe panel has a **gradient purple/indigo** background and animates in with a **slide-down effect**. It disappears automatically when you navigate to the next question.\n\nThe suggested score and feedback are **pre-filled** into the grading fields. You can:\n- **Accept** them as-is and click Save Grade\n- **Modify** the score or feedback before saving\n- **Ignore** the suggestion entirely and enter your own values",
          descriptionAr:
            "بعد النقر على **اقتراح AI للدرجة**، تظهر **لوحة متحركة** في الشريط الجانبي للتصحيح تعرض:\n- **شارة الثقة** — نسبة مئوية مرمّزة بالألوان (أخضر/أصفر/أحمر)\n- **نموذج AI المستخدم** — يعرض اسم النموذج (مثلاً GPT-4o)\n- **نص توضيحي** — ملخص موجز عن منطق AI\n\nاللوحة لها خلفية **متدرجة بنفسجية/نيلية** وتنزلق بـ**تأثير حركي**. تختفي تلقائياً عند الانتقال للسؤال التالي.\n\nالدرجة والملاحظات المقترحة **تُملأ مسبقاً** في حقول التصحيح. يمكنك:\n- **قبولها** كما هي والنقر على حفظ الدرجة\n- **تعديل** الدرجة أو الملاحظات قبل الحفظ\n- **تجاهل** الاقتراح بالكامل وإدخال قيمك الخاصة",
          imagePlaceholder: "/tutorials/grading-ai-suggestion-panel.png",
        },
        {
          id: "ai-examiner-per-question",
          titleEn: "Per-Question AI Grading",
          titleAr: "تصحيح AI لكل سؤال",
          descriptionEn:
            'AI suggestions work on a **per-question basis**. For each subjective question:\n1. Navigate to the question using **Previous / Next** buttons\n2. Click **"AI Suggest Grade"** for that specific question\n3. Review and save the grade\n4. Move to the next question and repeat\n\nEach question gets its **own independent analysis** — the AI considers the specific question text, candidate answer, and rubric for each one separately.\n\nThe progress bar at the top shows how many questions you have graded out of the total.',
          descriptionAr:
            'اقتراحات AI تعمل **لكل سؤال على حدة**. لكل سؤال ذاتي:\n1. انتقل إلى السؤال باستخدام أزرار **السابق / التالي**\n2. انقر **"اقتراح AI للدرجة"** لذلك السؤال المحدد\n3. راجع واحفظ الدرجة\n4. انتقل للسؤال التالي وكرر\n\nكل سؤال يحصل على **تحليل مستقل خاص به** — يأخذ AI بالاعتبار نص السؤال المحدد وإجابة المرشح والمعيار لكل سؤال على حدة.\n\nيعرض شريط التقدم في الأعلى عدد الأسئلة التي صححتها من الإجمالي.',
          imagePlaceholder: "/tutorials/grading-ai-per-question.png",
          tipEn:
            "You don't have to use AI for every question. Use it selectively — for complex essays or when you want a second opinion on a subjective answer.",
          tipAr:
            "ليس عليك استخدام AI لكل سؤال. استخدمه بشكل انتقائي — للمقالات المعقدة أو عندما تريد رأياً ثانياً في إجابة ذاتية.",
        },
        {
          id: "ai-examiner-best-practices",
          titleEn: "Best Practices for AI-Assisted Grading",
          titleAr: "أفضل ممارسات التصحيح بمساعدة AI",
          descriptionEn:
            "Tips for getting the best results from the AI Examiner:\n- **Write clear rubrics** — the more specific your model answer/rubric, the more accurate the AI suggestion\n- **Review low-confidence grades** — always manually verify suggestions with Red (<50%) confidence\n- **Use as a starting point** — let AI pre-fill the score and feedback, then refine based on your judgment\n- **Check feedback quality** — ensure the AI's suggested feedback is appropriate before saving (candidates will see it)\n- **Compare across students** — if AI gives similar scores to all students, the rubric may be too vague\n- **Don't blindly accept** — the AI is a helper, not a replacement. Professional judgment is essential",
          descriptionAr:
            "نصائح للحصول على أفضل النتائج من مساعد الممتحن الذكي:\n- **اكتب معايير واضحة** — كلما كان نموذج الإجابة/المعيار أكثر تحديداً، كان اقتراح AI أدق\n- **راجع الدرجات منخفضة الثقة** — تحقق دائماً يدوياً من الاقتراحات ذات الثقة الحمراء (<50%)\n- **استخدمه كنقطة بداية** — دع AI يملأ الدرجة والملاحظات مسبقاً، ثم حسّن بناءً على حكمك\n- **تحقق من جودة الملاحظات** — تأكد أن ملاحظات AI المقترحة مناسبة قبل الحفظ (سيراها المرشحون)\n- **قارن بين الطلاب** — إذا أعطى AI درجات متشابهة لجميع الطلاب، قد يكون المعيار غامضاً\n- **لا تقبل بشكل أعمى** — AI مساعد وليس بديلاً. الحكم المهني ضروري",
          imagePlaceholder: "/tutorials/grading-ai-best-practices.png",
          noteEn:
            "The quality of AI suggestions depends heavily on the rubric/model answer you provide. Invest time in writing detailed rubrics for better AI accuracy.",
          noteAr:
            "جودة اقتراحات AI تعتمد بشكل كبير على المعيار/نموذج الإجابة الذي تقدمه. استثمر الوقت في كتابة معايير تفصيلية لدقة AI أفضل.",
        },
      ],
      examples: [
        {
          titleEn: "AI Examiner Workflow",
          titleAr: "سير عمل مساعد الممتحن",
          contentEn:
            '1. Examiner opens pending submission\n2. Navigates to first subjective question\n3. Clicks "AI Suggest Grade" → AI analyzes answer vs rubric\n4. AI returns: Score (7/10) + Feedback + Confidence (85% — Green)\n5. Examiner reviews suggestion → adjusts score to 8/10, edits feedback\n6. Clicks "Save Grade" → moves to next question\n7. Repeats for all subjective questions\n8. All questions graded → clicks "Finalize"\n\nResult: Faster grading with consistent quality and AI-assisted objectivity',
          contentAr:
            '1. الممتحن يفتح تسليماً معلقاً\n2. ينتقل إلى أول سؤال ذاتي\n3. ينقر "اقتراح AI للدرجة" ← AI يحلل الإجابة مقابل المعيار\n4. يعيد AI: درجة (7/10) + ملاحظات + ثقة (85% — أخضر)\n5. الممتحن يراجع الاقتراح ← يعدّل الدرجة إلى 8/10، يحرر الملاحظات\n6. ينقر "حفظ الدرجة" ← ينتقل للسؤال التالي\n7. يكرر لجميع الأسئلة الذاتية\n8. جميع الأسئلة مصححة ← ينقر "اعتماد"\n\nالنتيجة: تصحيح أسرع مع جودة متسقة وموضوعية بمساعدة AI',
        },
      ],
    },
    // ── Section 5: Scoring & Calculation ──
    {
      id: "scoring",
      titleEn: "5. Scoring & Calculation",
      titleAr: "5. احتساب الدرجات",
      descriptionEn:
        "Understand how SmartExam calculates scores, determines pass/fail, and handles mixed-type exams.",
      descriptionAr:
        "تعرّف على كيفية احتساب SmartExam للدرجات، وتحديد النجاح/الرسوب، والتعامل مع الاختبارات متعددة الأنواع.",
      steps: [
        {
          id: "score-calculation",
          titleEn: "How Scores Are Calculated",
          titleAr: "كيف تُحسب الدرجات",
          descriptionEn:
            "**Auto-graded questions:**\n- ✅ Correct → full points\n- ✗ Wrong → zero points\n- Partial credit for multi-select MCQ based on correct selections\n\n**Manually-graded questions:**\n- Score you assign (0 to max, supports 0.5 steps)\n\n**Final calculation:**\n- **Total Score** = sum of all question scores\n- **Percentage** = (Total Score / Max Possible Score) × 100",
          descriptionAr:
            "**الأسئلة المصححة آلياً:**\n- ✅ صحيحة ← نقاط كاملة\n- ✗ خاطئة ← صفر نقاط\n- درجة جزئية لأسئلة الاختيار المتعدد بناءً على الاختيارات الصحيحة\n\n**الأسئلة المصححة يدوياً:**\n- الدرجة التي تحددها (0 إلى الحد الأقصى، يدعم خطوات 0.5)\n\n**الحساب النهائي:**\n- **الدرجة الإجمالية** = مجموع درجات جميع الأسئلة\n- **النسبة المئوية** = (الدرجة الإجمالية / الدرجة القصوى) × 100",
        },
        {
          id: "pass-fail",
          titleEn: "Pass / Fail Determination",
          titleAr: "تحديد النجاح / الرسوب",
          descriptionEn:
            "The pass score is defined in the **exam configuration** (e.g., 60%).\n\nAfter grading, the system compares:\n- **Total Score ≥ Pass Score** → **Passed** (green badge)\n- **Total Score < Pass Score** → **Failed** (red badge)\n\nThis is computed **automatically** upon finalization.",
          descriptionAr:
            "درجة النجاح محددة في **إعدادات الاختبار** (مثلاً 60%).\n\nبعد التصحيح، يقارن النظام:\n- **الدرجة الإجمالية ≥ درجة النجاح** ← **ناجح** (شارة خضراء)\n- **الدرجة الإجمالية < درجة النجاح** ← **غير ناجح** (شارة حمراء)\n\nيُحسب **تلقائياً** عند الاعتماد.",
        },
        {
          id: "mixed-exam",
          titleEn: "Mixed-Type Exams",
          titleAr: "الاختبارات متعددة الأنواع",
          descriptionEn:
            'Exams can contain **both auto-graded and manual** questions:\n- **Auto-graded** questions are scored **immediately** upon submission\n- The exam enters **"Pending Manual Grading"** status\n- Instructor grades all subjective questions\n- **Final score** combines both auto and manual scores',
          descriptionAr:
            'الاختبارات يمكن أن تحتوي على أسئلة **آلية ويدوية** معاً:\n- الأسئلة **الآلية** تُصحح **فوراً** عند التسليم\n- الاختبار يدخل حالة **"بانتظار التصحيح اليدوي"**\n- المصحح يصحح جميع الأسئلة الذاتية\n- **الدرجة النهائية** تجمع بين الدرجات الآلية واليدوية',
          tipEn:
            'The "Auto Score" badge in the grading table shows the percentage from auto-graded questions only — it does NOT include manual grades.',
          tipAr:
            'شارة "الدرجة الآلية" في جدول التصحيح تعرض نسبة الأسئلة المصححة آلياً فقط — ولا تشمل الدرجات اليدوية.',
        },
      ],
    },
    // ── Section 6: Security & Media Storage ──
    {
      id: "grading-security",
      titleEn: "6. Security & Data Integrity",
      titleAr: "6. الأمان وسلامة البيانات",
      descriptionEn:
        "How SmartExam ensures grading security, audit trails, and proper data storage.",
      descriptionAr:
        "كيف يضمن SmartExam أمان التصحيح، سجلات التدقيق، وتخزين البيانات بشكل صحيح.",
      steps: [
        {
          id: "grading-audit",
          titleEn: "Grading Audit Trail",
          titleAr: "سجل تدقيق التصحيح",
          descriptionEn:
            "Every grading action is logged:\n- **Who** graded\n- **When** the grade was assigned\n- **What score** was given\n- Whether **AI suggestion** was used\n\nThe grader's identity is recorded with each grade for **full accountability and traceability**.",
          descriptionAr:
            "كل إجراء تصحيح مسجّل:\n- **من** صحح\n- **متى** تم تعيين الدرجة\n- **ما الدرجة** المحددة\n- هل **استُخدم اقتراح AI**\n\nهوية المصحح مسجلة مع كل درجة لضمان **مساءلة وتتبع كاملين**.",
        },
        {
          id: "grading-permissions",
          titleEn: "Role-Based Access",
          titleAr: "صلاحيات حسب الدور",
          descriptionEn:
            "Access roles:\n- **Admin** — full access to grading center\n- **Instructor** — can grade and finalize\n- **Examiner** — can grade assigned exams\n\n**Candidates** cannot see grading details — only their **published final result** and feedback.",
          descriptionAr:
            "أدوار الوصول:\n- **مدير** — وصول كامل لمركز التصحيح\n- **مدرّس** — يمكنه التصحيح والاعتماد\n- **مصحح** — يمكنه تصحيح الاختبارات المعيّنة\n\n**المرشحون** لا يمكنهم رؤية تفاصيل التصحيح — فقط **نتيجتهم النهائية المنشورة** والملاحظات.",
        },
        {
          id: "media-storage-grading",
          titleEn: "Media & Attachment Storage",
          titleAr: "تخزين الوسائط والمرفقات",
          descriptionEn:
            "Storage locations:\n- **Question attachments** (images, PDFs) → MediaStorage/ folder, served via /media URL\n- **Proctor snapshots** → MediaStorage/proctor-snapshots/\n- **Video recordings** → MediaStorage/video-recordings/\n- **Tutorial media** → wwwroot/tutorials/ (static)\n\nAll uploads are validated for **file type and size**.",
          descriptionAr:
            "مواقع التخزين:\n- **مرفقات الأسئلة** (صور، PDF) → مجلد MediaStorage/، تُقدم عبر /media\n- **لقطات المراقبة** → MediaStorage/proctor-snapshots/\n- **تسجيلات الفيديو** → MediaStorage/video-recordings/\n- **وسائط الدروس** → wwwroot/tutorials/ (ثابتة)\n\nجميع التحميلات تُفحص من حيث **نوع الملف والحجم**.",
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// RESULTS MODULE
// ────────────────────────────────────────────────────────
export const resultsTutorial: TutorialModule = {
  id: "results",
  slug: "results",
  titleEn: "Results & Publishing",
  titleAr: "النتائج والنشر",
  descriptionEn:
    "Learn how to view candidate results, publish scores, send email notifications, review exam answers, manage terminated attempts, generate AI proctor reports, and handle certificates.",
  descriptionAr:
    "تعلّم كيفية عرض نتائج المرشحين، نشر الدرجات، إرسال إشعارات البريد، مراجعة إجابات الاختبار، إدارة المحاولات المنتهية، إنشاء تقارير مراقب AI، والتعامل مع الشهادات.",
  iconName: "ClipboardList",
  videoPlaceholder: "/tutorials/results-overview.mp4",
  sections: [
    // ── Section 1: Candidate Result List ──
    {
      id: "candidate-results",
      titleEn: "1. Candidate Results",
      titleAr: "1. نتائج المرشحين",
      descriptionEn:
        "View all candidate results across exams. Filter by exam, status, or search by name. See scores, pass/fail, grading status, and publishing state.",
      descriptionAr:
        "عرض جميع نتائج المرشحين عبر الاختبارات. صفّي حسب الاختبار أو الحالة أو ابحث بالاسم. اطّلع على الدرجات والنجاح/الرسوب وحالة التصحيح وحالة النشر.",
      steps: [
        {
          id: "navigate-results",
          titleEn: "Navigate to Candidate Results",
          titleAr: "الانتقال إلى نتائج المرشحين",
          descriptionEn:
            'From the sidebar, expand "Result" and click "Candidate Result". This page shows all exam results with detailed information.',
          descriptionAr:
            'من القائمة الجانبية، وسّع "النتائج" وانقر على "نتائج المرشحين". تعرض هذه الصفحة جميع نتائج الاختبارات بمعلومات تفصيلية.',
          imagePlaceholder: "/tutorials/results-nav.png",
        },
        {
          id: "results-filters",
          titleEn: "Filter & Search Results",
          titleAr: "تصفية والبحث في النتائج",
          descriptionEn:
            "Filter controls available:\n- **Exam** — filter by specific exam or view all\n- **Result Status** — All, Passed, Failed, Under Review, Not Published\n- **Search** — by candidate name or email\n- **Refresh** — reload the latest data\n\nThe summary card shows the **total count** of filtered candidates.",
          descriptionAr:
            "أدوات التصفية المتاحة:\n- **الاختبار** — تصفية حسب اختبار محدد أو عرض الكل\n- **حالة النتيجة** — الكل، ناجح، غير ناجح، قيد المراجعة، غير منشور\n- **البحث** — باسم المرشح أو البريد\n- **تحديث** — إعادة تحميل أحدث البيانات\n\nتعرض بطاقة الملخص **العدد الإجمالي** للمرشحين المصفّين.",
          imagePlaceholder: "/tutorials/results-filters.png",
          tipEn:
            '"Under Review" shows results where grading is still pending or not yet finalized. "Not Published" shows finalized results not yet sent to candidates.',
          tipAr:
            '"قيد المراجعة" يعرض النتائج التي لا يزال التصحيح معلقاً أو لم يُعتمد بعد. "غير منشور" يعرض النتائج المعتمدة التي لم ترسل بعد للمرشحين.',
        },
        {
          id: "results-table",
          titleEn: "Understanding the Results Table",
          titleAr: "فهم جدول النتائج",
          descriptionEn:
            'Table columns:\n- **Sr. No.** — row number\n- **Exam Name** — bilingual exam title\n- **Candidate** — name + attempt number\n- **Score** — e.g., "75.5/100"\n- **Percentage** — e.g., "75.50%"\n- **Attempt Status** — Submitted, Expired, Force Ended, Terminated (color-coded badges)\n- **Pass/Fail** — green "Pass" or red "Fail" badge\n- **Grading Status** — Auto Graded, Manual Graded, In Review, Pending (color-coded)\n- **Published** — Yes / No\n- **Actions** — dropdown menu with all available operations',
          descriptionAr:
            'أعمدة الجدول:\n- **الرقم** — رقم الصف\n- **اسم الاختبار** — عنوان الاختبار ثنائي اللغة\n- **المرشح** — الاسم + رقم المحاولة\n- **الدرجة** — مثلاً "75.5/100"\n- **النسبة** — مثلاً "75.50%"\n- **حالة المحاولة** — مسلّم، منتهي، أُنهي قسراً، أُنهي (شارات ملونة)\n- **ناجح/غير ناجح** — شارة خضراء "ناجح" أو حمراء "غير ناجح"\n- **حالة التصحيح** — آلي، يدوي، قيد المراجعة، معلّق (ملونة)\n- **منشور** — نعم / لا\n- **الإجراءات** — قائمة بجميع العمليات المتاحة',
          imagePlaceholder: "/tutorials/results-table.png",
        },
        {
          id: "results-actions",
          titleEn: "Available Actions per Candidate",
          titleAr: "الإجراءات المتاحة لكل مرشح",
          descriptionEn:
            "Click the **Actions dropdown** (⋮) on any row:\n- **View Details** — open exam review page\n- **Score Card** — detailed score breakdown\n- **Publish Result** — make result visible to candidate + send email\n- **View Grading** — open grading session\n- **AI Report** — AI proctor analysis\n- **Attempt Media** — view proctoring recordings",
          descriptionAr:
            "انقر على **قائمة الإجراءات** (⋮) في أي صف:\n- **عرض التفاصيل** — فتح صفحة مراجعة الاختبار\n- **بطاقة الدرجات** — تفصيل الدرجات\n- **نشر النتيجة** — جعل النتيجة مرئية للمرشح + إرسال بريد\n- **عرض التصحيح** — فتح جلسة التصحيح\n- **تقرير AI** — تحليل المراقبة\n- **وسائط المحاولة** — عرض تسجيلات المراقبة",
          imagePlaceholder: "/tutorials/results-actions.png",
        },
      ],
    },
    // ── Section 2: Publishing Results ──
    {
      id: "publish-results",
      titleEn: "2. Publishing Results & Email Notification",
      titleAr: "2. نشر النتائج وإشعارات البريد",
      descriptionEn:
        "After grading is finalized, publish results to make them visible to candidates. An email notification is automatically sent with the score.",
      descriptionAr:
        "بعد اعتماد التصحيح، انشر النتائج لجعلها مرئية للمرشحين. يتم إرسال إشعار بريد إلكتروني تلقائياً مع الدرجة.",
      steps: [
        {
          id: "publish-prerequisites",
          titleEn: "Prerequisites for Publishing",
          titleAr: "المتطلبات المسبقة للنشر",
          descriptionEn:
            'Before you can publish a result:\n1. **Grading must be complete** — all questions (auto + manual) must be graded\n2. **Grading session must be finalized** — instructor clicked "Finalize"\n3. **Result must not already be published**\n\nThe "Publish Result" action is **only enabled** when all conditions are met.',
          descriptionAr:
            'قبل نشر النتيجة:\n1. **يجب إكمال التصحيح** — جميع الأسئلة (آلية + يدوية) يجب أن تكون مصححة\n2. **يجب اعتماد جلسة التصحيح** — المصحح نقر "اعتماد"\n3. **يجب ألا تكون النتيجة منشورة مسبقاً**\n\nإجراء "نشر النتيجة" يكون **متاحاً فقط** عند تحقق جميع الشروط.',
          noteEn:
            'If grading status shows "Pending" or "In Review", you must complete grading first before publishing.',
          noteAr:
            'إذا كانت حالة التصحيح "معلّق" أو "قيد المراجعة"، يجب إكمال التصحيح أولاً قبل النشر.',
        },
        {
          id: "publish-action",
          titleEn: "Publish a Result",
          titleAr: "نشر نتيجة",
          descriptionEn:
            'In the Candidate Results table, click the Actions dropdown (⋮) → click "Publish Result". The system will: finalize the result if not already done, mark it as published, and automatically send an email notification to the candidate with their score, pass/fail status, and a link to view their detailed result.',
          descriptionAr:
            'في جدول نتائج المرشحين، انقر على قائمة الإجراءات (⋮) ← انقر "نشر النتيجة". سيقوم النظام بـ: اعتماد النتيجة إن لم تكن معتمدة، تحديدها كمنشورة، وإرسال إشعار بريد إلكتروني تلقائي للمرشح بدرجته وحالة النجاح/الرسوب ورابط لعرض نتيجته التفصيلية.',
          imagePlaceholder: "/tutorials/results-publish.png",
          tipEn:
            "The email is sent automatically by the backend when you publish. Make sure your SMTP settings are configured correctly in Settings → Organization.",
          tipAr:
            "البريد يُرسل تلقائياً من الخادم عند النشر. تأكد أن إعدادات SMTP مهيأة بشكل صحيح في الإعدادات ← المنظمة.",
        },
        {
          id: "email-content",
          titleEn: "What the Candidate Receives",
          titleAr: "ما يستلمه المرشح",
          descriptionEn:
            'The email notification includes:\n- Candidate\'s **name**\n- **Exam title**\n- **Final score** and percentage\n- **Pass/Fail** status\n- **Grader feedback** comments (if any)\n- **Link** to view the full result on the platform\n\nThe candidate can also view their result in their dashboard under **"My Exams"**.',
          descriptionAr:
            'يتضمن إشعار البريد:\n- **اسم** المرشح\n- **عنوان الاختبار**\n- **الدرجة النهائية** والنسبة\n- حالة **النجاح/الرسوب**\n- **ملاحظات** المصحح (إن وجدت)\n- **رابط** لعرض النتيجة الكاملة على المنصة\n\nيمكن للمرشح أيضاً عرض نتيجته في لوحته تحت **"اختباراتي"**.',
        },
      ],
    },
    // ── Section 3: Exam Review (Score Card & Detailed Review) ──
    {
      id: "exam-review",
      titleEn: "3. Exam Review & Score Card",
      titleAr: "3. مراجعة الاختبار وبطاقة الدرجات",
      descriptionEn:
        "Review a candidate's exam answers question by question, view the score card breakdown, and see detailed scoring.",
      descriptionAr:
        "مراجعة إجابات اختبار المرشح سؤالاً بسؤال، عرض تفصيل بطاقة الدرجات، ورؤية التفاصيل.",
      steps: [
        {
          id: "view-details",
          titleEn: "View Exam Details (Exam Review)",
          titleAr: "عرض تفاصيل الاختبار (مراجعة الاختبار)",
          descriptionEn:
            'Click "View Details" from the Actions menu. This opens the Exam Review page showing: a header with exam name, pass/fail badge, and score. Summary statistics (correct/incorrect counts, percentage, timing). A question viewer where you can navigate through each question, see the candidate\'s answer, correct answer, and points awarded.',
          descriptionAr:
            'انقر "عرض التفاصيل" من قائمة الإجراءات. يفتح صفحة مراجعة الاختبار التي تعرض: رأس باسم الاختبار وشارة النجاح/الرسوب والدرجة. إحصائيات ملخصة (عدد الصحيح/الخطأ، النسبة، التوقيت). عارض أسئلة يمكنك التنقل فيه لرؤية إجابة المرشح والجواب الصحيح والنقاط الممنوحة.',
          imagePlaceholder: "/tutorials/results-exam-review.png",
        },
        {
          id: "score-card",
          titleEn: "Score Card",
          titleAr: "بطاقة الدرجات",
          descriptionEn:
            'Click "Score Card" from the Actions menu. This shows a detailed breakdown: candidate information, exam title, total score vs. max score, pass/fail status, and every question with its individual score. Useful for printing or sharing the score summary.',
          descriptionAr:
            'انقر "بطاقة الدرجات" من قائمة الإجراءات. يعرض تفصيلاً شاملاً: معلومات المرشح، عنوان الاختبار، الدرجة الإجمالية مقابل الدرجة القصوى، حالة النجاح/الرسوب، وكل سؤال بدرجته الفردية. مفيدة للطباعة أو مشاركة ملخص الدرجات.',
          imagePlaceholder: "/tutorials/results-scorecard.png",
        },
      ],
    },
    // ── Section 4: Terminated Attempts ──
    {
      id: "terminated-attempts",
      titleEn: "4. Terminated Attempts",
      titleAr: "4. المحاولات المنتهية",
      descriptionEn:
        "Review and manage attempts that were terminated, expired, or force-ended. View termination reasons, evidence, and grant new attempts if needed.",
      descriptionAr:
        "مراجعة وإدارة المحاولات التي أُنهيت أو انتهت صلاحيتها أو أُنهيت قسراً. عرض أسباب الإنهاء والأدلة ومنح محاولات جديدة إذا لزم الأمر.",
      steps: [
        {
          id: "navigate-terminated",
          titleEn: "Navigate to Terminated Attempts",
          titleAr: "الانتقال إلى المحاولات المنتهية",
          descriptionEn:
            'From the sidebar, expand "Result" and click "Terminated Attempts". This page shows all attempts that ended abnormally — not regular submissions.',
          descriptionAr:
            'من القائمة الجانبية، وسّع "النتائج" وانقر على "المحاولات المنتهية". تعرض هذه الصفحة جميع المحاولات التي انتهت بشكل غير طبيعي — وليس التسليمات العادية.',
          imagePlaceholder: "/tutorials/results-terminated-nav.png",
        },
        {
          id: "terminated-stats",
          titleEn: "Termination Statistics",
          titleAr: "إحصائيات الإنهاء",
          descriptionEn:
            "Four summary cards at the top:\n- **Terminated by Proctor** (red) — terminated due to violations\n- **Force Ended by Admin** (orange) — admin manually ended the attempt\n- **Expired** (rose) — timer ran out or exam window closed\n- **Total Terminated** (gray) — total count of all terminated attempts",
          descriptionAr:
            "أربع بطاقات ملخصة في الأعلى:\n- **أُنهي بواسطة المراقب** (أحمر) — أنهاه المراقب بسبب مخالفات\n- **أُنهي قسراً بواسطة المدير** (برتقالي) — المدير أنهى المحاولة يدوياً\n- **منتهي الصلاحية** (وردي) — انتهى الوقت أو أغلقت نافذة الاختبار\n- **الإجمالي المنتهي** (رمادي) — العدد الكلي لجميع المحاولات المنتهية",
          imagePlaceholder: "/tutorials/results-terminated-stats.png",
        },
        {
          id: "terminated-statuses",
          titleEn: "Termination Status Types",
          titleAr: "أنواع حالات الإنهاء",
          descriptionEn:
            "Three status types:\n- **Terminated** (red badge) — proctor ended the attempt due to policy violations, suspicious behavior, or exceeding max violations\n- **Expired** (rose badge) — timer expired while active, while disconnected, or exam window closed\n- **Force Ended** (orange badge) — admin force-submitted the attempt",
          descriptionAr:
            "ثلاثة أنواع حالات:\n- **أُنهي** (شارة حمراء) — المراقب أنهى المحاولة بسبب مخالفات أو سلوك مشبوه أو تجاوز الحد الأقصى للمخالفات\n- **منتهي** (شارة وردية) — انتهى الوقت أثناء النشاط أو أثناء الانقطاع أو إغلاق النافذة\n- **أُنهي قسراً** (شارة برتقالية) — المدير سلّم المحاولة قسراً",
        },
        {
          id: "termination-reason",
          titleEn: "View Termination Reason",
          titleAr: "عرض سبب الإنهاء",
          descriptionEn:
            'Click **"Termination Reason"** or **"Why Expired?"** from the Actions dropdown.\n\nA dialog shows the candidate name and reason:\n- **Expired attempts:** timer ran out while active, while disconnected, or exam window closed\n- **Terminated attempts:** reason from the proctor (e.g., "Exceeded maximum violations", "Suspicious behavior detected")',
          descriptionAr:
            'انقر **"سبب الإنهاء"** أو **"لماذا انتهت؟"** من قائمة الإجراءات.\n\nيظهر مربع حوار باسم المرشح والسبب:\n- **المحاولات المنتهية الصلاحية:** انتهى الوقت أثناء النشاط، أثناء الانقطاع، أو إغلاق النافذة\n- **المحاولات المنتهية بالمراقب:** السبب المقدم من المراقب',
          imagePlaceholder: "/tutorials/results-termination-reason.png",
        },
        {
          id: "allow-new-attempt",
          titleEn: "Allow New Attempt",
          titleAr: "السماح بمحاولة جديدة",
          descriptionEn:
            'If a termination was unjustified (e.g., technical issues):\n1. Click **"Allow New Attempt"** from the Actions menu\n2. Dialog shows candidate details and previous status\n3. Enter a **mandatory reason**\n4. Click **"Confirm"**\n\nThe candidate can now **retake the exam**. This action is **logged for audit**.',
          descriptionAr:
            'إذا كان الإنهاء غير مبرر (مثلاً مشاكل تقنية):\n1. انقر **"السماح بمحاولة جديدة"** من قائمة الإجراءات\n2. يعرض مربع حوار تفاصيل المرشح والحالة السابقة\n3. أدخل **سبباً إلزامياً**\n4. انقر **"تأكيد"**\n\nيمكن للمرشح الآن **إعادة الاختبار**. هذا الإجراء **مسجّل للتدقيق**.',
          imagePlaceholder: "/tutorials/results-allow-attempt.png",
          noteEn:
            "This is an admin-only action. A mandatory reason is required for audit purposes. The candidate is notified that a new attempt is available.",
          noteAr:
            "هذا إجراء للمدير فقط. سبب إلزامي مطلوب لأغراض التدقيق. يتم إبلاغ المرشح بتوفر محاولة جديدة.",
        },
        {
          id: "proctoring-evidence",
          titleEn: "View Proctoring Evidence",
          titleAr: "عرض أدلة المراقبة",
          descriptionEn:
            'Click **"Proctoring Evidence"** from the Actions menu to view:\n- **Recordings** — camera and screen captures\n- **Snapshots** — flagged screenshots\n- **Event logs** — timestamped proctoring events\n\nThis helps verify whether the termination was **justified**.',
          descriptionAr:
            'انقر **"أدلة المراقبة"** من قائمة الإجراءات لعرض:\n- **التسجيلات** — لقطات الكاميرا والشاشة\n- **اللقطات** — لقطات شاشة مُعلَّمة\n- **سجلات الأحداث** — أحداث مراقبة مع طوابع زمنية\n\nيساعد ذلك في التحقق مما إذا كان الإنهاء **مبرراً**.',
          imagePlaceholder: "/tutorials/results-evidence.png",
        },
      ],
    },
    // ── Section 5: AI Proctor Report ──
    {
      id: "ai-proctor-report",
      titleEn: "5. AI Proctor Report",
      titleAr: "5. تقرير مراقب AI",
      descriptionEn:
        "Comprehensive AI-powered proctoring analysis — understand how risk scores are calculated, how the report is generated using GPT-4o, and what each section of the report contains.",
      descriptionAr:
        "تحليل مراقبة شامل مدعوم بالذكاء الاصطناعي — فهم كيفية حساب نقاط المخاطر، وكيف يُنشأ التقرير باستخدام GPT-4o، وماذا يحتوي كل قسم من التقرير.",
      steps: [
        {
          id: "navigate-proctor-report",
          titleEn: "Access the AI Proctor Report",
          titleAr: "الوصول إلى تقرير مراقب AI",
          descriptionEn:
            'Two ways to access:\n1. From the sidebar: **Result → Proctor Report** → select candidate and exam → click **"View Report"**\n2. From any results table: **Actions → "AI Report"**\n\nBoth open the detailed **AI analysis page**.\n\nPermitted roles: **Admin**, **Instructor**, **Examiner**, **Proctor**.',
          descriptionAr:
            'طريقتان للوصول:\n1. من القائمة الجانبية: **النتائج ← تقرير المراقب** ← اختر المرشح والاختبار ← انقر **"عرض التقرير"**\n2. من أي جدول نتائج: **الإجراءات ← "تقرير AI"**\n\nكلاهما يفتح صفحة **تحليل AI التفصيلية**.\n\nالأدوار المسموحة: **مدير**، **مدرّس**، **ممتحن**، **مراقب**.',
          imagePlaceholder: "/tutorials/results-proctor-report-nav.png",
        },
        {
          id: "report-page-layout",
          titleEn: "Report Page Layout",
          titleAr: "تخطيط صفحة التقرير",
          descriptionEn:
            'The AI Report page displays **8 cards** in order:\n1. **Overall Risk Score** — large score %, color badge, progress bar\n2. **4 Category Score Cards** (grid) — Face Detection, Eye Tracking, Behavior, Environment\n3. **AI Proctor Report** (GPT-4o) — generated analysis with "Generate" / "Regenerate" button\n4. **Session Details** — start/end times, duration, status, violations, termination info\n5. **Device & Environment** — IP, browser, OS, screen resolution, device fingerprint\n6. **Candidate Answer Behavior** — questions answered, answer changes, timing analysis\n7. **Evidence / Screenshots** — webcam snapshots and screen captures\n8. **Attempt Event Log** — full chronological event timeline',
          descriptionAr:
            'تعرض صفحة تقرير AI **8 بطاقات** بالترتيب:\n1. **نقاط المخاطر الإجمالية** — نسبة كبيرة، شارة ملونة، شريط تقدم\n2. **4 بطاقات فئات** (شبكة) — كشف الوجه، تتبع العين، السلوك، البيئة\n3. **تقرير مراقب AI** (GPT-4o) — تحليل مُنشأ مع زر "إنشاء" / "إعادة إنشاء"\n4. **تفاصيل الجلسة** — أوقات البدء/الانتهاء، المدة، الحالة، المخالفات، معلومات الإنهاء\n5. **الجهاز والبيئة** — IP، المتصفح، نظام التشغيل، دقة الشاشة، بصمة الجهاز\n6. **سلوك إجابة المرشح** — الأسئلة المُجابة، تغييرات الإجابة، تحليل التوقيت\n7. **الأدلة / اللقطات** — لقطات الكاميرا والشاشة\n8. **سجل أحداث المحاولة** — جدول زمني كامل للأحداث',
          imagePlaceholder: "/tutorials/results-ai-report-layout.png",
        },
        {
          id: "report-overall-risk-score",
          titleEn: "Overall Risk Score (0–100)",
          titleAr: "نقاط المخاطر الإجمالية (0–100)",
          descriptionEn:
            'The **Overall Risk Score** is computed by the backend **Rule Engine** during the exam session.\n\n**How it works:**\n1. The system loads **Risk Rules** from the database — each rule targets a specific event type\n2. For each rule: counts matching events within a **time window**\n3. Calculates **trigger count** = event count ÷ threshold, capped by max triggers\n4. **Score** = sum of (trigger count × risk points) across all rules, **capped at 100**\n\n**Risk Level thresholds:**\n- **0–20** → "Low" (green)\n- **21–50** → "Medium" (yellow)\n- **51–75** → "High" (orange)\n- **76–100** → "Critical" (red)\n\nThe score is stored as a **RiskSnapshot** at each calculation for historical tracking.',
          descriptionAr:
            'يُحسب **نقاط المخاطر الإجمالية** بواسطة **محرك القواعد** في الخادم أثناء جلسة الاختبار.\n\n**كيف يعمل:**\n1. يحمّل النظام **قواعد المخاطر** من قاعدة البيانات — كل قاعدة تستهدف نوع حدث محدد\n2. لكل قاعدة: يعدّ الأحداث المطابقة ضمن **نافذة زمنية**\n3. يحسب **عدد التفعيلات** = عدد الأحداث ÷ الحد، مع سقف أقصى\n4. **النقاط** = مجموع (عدد التفعيلات × نقاط المخاطر) لجميع القواعد، **بحد أقصى 100**\n\n**مستويات المخاطر:**\n- **0–20** → "منخفض" (أخضر)\n- **21–50** → "متوسط" (أصفر)\n- **51–75** → "مرتفع" (برتقالي)\n- **76–100** → "حرج" (أحمر)\n\nتُحفظ النقاط كـ**لقطة مخاطر** عند كل حساب للتتبع التاريخي.',
          imagePlaceholder: "/tutorials/results-risk-score.png",
          tipEn:
            "Risk Rules are configurable — admins can adjust which events trigger points, the threshold count, time windows, and maximum triggers per rule.",
          tipAr:
            "قواعد المخاطر قابلة للتعديل — يمكن للمدراء ضبط الأحداث التي تُفعّل النقاط، وعدد الحد الأدنى، والنوافذ الزمنية، وأقصى عدد تفعيلات لكل قاعدة.",
        },
        {
          id: "report-risk-rules",
          titleEn: "Risk Rules Configuration",
          titleAr: "إعدادات قواعد المخاطر",
          descriptionEn:
            "Each **Risk Rule** in the database defines:\n- **EventType** — which proctoring event to monitor (e.g., TabSwitched, FaceNotDetected, CameraBlocked)\n- **ThresholdCount** — how many events needed to trigger the rule (e.g., 3 tab switches)\n- **WindowSeconds** — time window in seconds (0 = count all events, 60 = last 60 seconds only)\n- **RiskPoints** — points added per trigger (0–100)\n- **MinSeverity** — minimum event severity to count (optional filter)\n- **MaxTriggers** — cap on total triggers per session (prevents runaway scores)\n- **Priority** — evaluation order\n\nRules are evaluated in **priority order** and the resulting points are **summed together**, capped at 100.",
          descriptionAr:
            "كل **قاعدة مخاطر** في قاعدة البيانات تحدد:\n- **نوع الحدث** — أي حدث مراقبة يُراقب (مثلاً تبديل علامة، عدم كشف وجه، حجب الكاميرا)\n- **عدد الحد** — كم حدث مطلوب لتفعيل القاعدة (مثلاً 3 تبديلات علامة)\n- **نافذة الثواني** — نافذة زمنية بالثواني (0 = عدّ جميع الأحداث، 60 = آخر 60 ثانية فقط)\n- **نقاط المخاطر** — نقاط تُضاف لكل تفعيل (0–100)\n- **الحد الأدنى للخطورة** — أقل خطورة للحدث ليُعدّ (فلتر اختياري)\n- **أقصى تفعيلات** — سقف التفعيلات لكل جلسة (يمنع النقاط المفرطة)\n- **الأولوية** — ترتيب التقييم\n\nتُقيّم القواعد حسب **ترتيب الأولوية** والنقاط الناتجة **تُجمع معاً** بحد أقصى 100.",
        },
        {
          id: "report-face-detection",
          titleEn: "Category 1: Face Detection Score",
          titleAr: "الفئة 1: نقاط كشف الوجه",
          descriptionEn:
            "Starts at **100** and loses points per violation:\n- **Face Not Detected** — **-8 points** each time the face disappears from the camera\n- **Multiple Faces** — **-12 points** each time more than one person is detected in frame\n- **Camera Blocked** — **-10 points** each time the webcam is covered or obstructed\n- **Webcam Denied** — **-25 points** if the candidate denied webcam permission\n\n**Example:** A candidate whose face disappears 3 times and multiple faces detected once:\n100 - (3 × 8) - (1 × 12) = **64/100**",
          descriptionAr:
            "يبدأ من **100** ويخسر نقاط لكل مخالفة:\n- **عدم كشف الوجه** — **-8 نقاط** كل مرة يختفي الوجه من الكاميرا\n- **وجوه متعددة** — **-12 نقطة** كل مرة يُكتشف أكثر من شخص في الإطار\n- **حجب الكاميرا** — **-10 نقاط** كل مرة تُغطى الكاميرا أو تُعاق\n- **رفض الكاميرا** — **-25 نقطة** إذا رفض المرشح إذن الكاميرا\n\n**مثال:** مرشح اختفى وجهه 3 مرات وكُشف وجوه متعددة مرة:\n100 - (3 × 8) - (1 × 12) = **64/100**",
          imagePlaceholder: "/tutorials/results-face-detection-score.png",
        },
        {
          id: "report-eye-tracking",
          titleEn: "Category 2: Eye Tracking Score",
          titleAr: "الفئة 2: نقاط تتبع العين",
          descriptionEn:
            "Starts at **100** and loses points per violation:\n- **Head Turned** — **-7 points** each time the candidate looks away or turns head significantly\n- **Face Out of Frame** — **-6 points** each time the face goes partially or fully outside the camera frame\n\n**Example:** A candidate turns head 5 times and face goes out of frame 2 times:\n100 - (5 × 7) - (2 × 6) = **53/100**",
          descriptionAr:
            "يبدأ من **100** ويخسر نقاط لكل مخالفة:\n- **التفات الرأس** — **-7 نقاط** كل مرة ينظر المرشح بعيداً أو يلتفت برأسه بشكل ملحوظ\n- **الوجه خارج الإطار** — **-6 نقاط** كل مرة يخرج الوجه جزئياً أو كلياً من إطار الكاميرا\n\n**مثال:** مرشح التفت 5 مرات وخرج وجهه من الإطار مرتين:\n100 - (5 × 7) - (2 × 6) = **53/100**",
          imagePlaceholder: "/tutorials/results-eye-tracking-score.png",
        },
        {
          id: "report-behavior",
          titleEn: "Category 3: Behavior Score",
          titleAr: "الفئة 3: نقاط السلوك",
          descriptionEn:
            "Starts at **100** and loses points per violation:\n- **Tab Switched** — **-8 points** each tab switch or Alt+Tab\n- **Window Blur** — **-4 points** each time the exam window loses focus\n- **Copy Attempt** — **-10 points** each time copy (Ctrl+C) is attempted\n- **Paste Attempt** — **-10 points** each time paste (Ctrl+V) is attempted\n- **Right Click** — **-5 points** each right-click attempt\n\n**Example:** 2 tab switches + 1 copy attempt + 3 window blurs:\n100 - (2 × 8) - (1 × 10) - (3 × 4) = **66/100**",
          descriptionAr:
            "يبدأ من **100** ويخسر نقاط لكل مخالفة:\n- **تبديل علامة** — **-8 نقاط** كل تبديل تبويب أو Alt+Tab\n- **فقدان التركيز** — **-4 نقاط** كل مرة تفقد نافذة الاختبار التركيز\n- **محاولة نسخ** — **-10 نقاط** كل محاولة نسخ (Ctrl+C)\n- **محاولة لصق** — **-10 نقاط** كل محاولة لصق (Ctrl+V)\n- **نقر يمين** — **-5 نقاط** كل محاولة نقر يمين\n\n**مثال:** 2 تبديل علامة + 1 محاولة نسخ + 3 فقدان تركيز:\n100 - (2 × 8) - (1 × 10) - (3 × 4) = **66/100**",
          imagePlaceholder: "/tutorials/results-behavior-score.png",
        },
        {
          id: "report-environment",
          titleEn: "Category 4: Environment Score",
          titleAr: "الفئة 4: نقاط البيئة",
          descriptionEn:
            "Starts at **100** and loses points per violation:\n- **Fullscreen Exited** — **-10 points** each time the candidate exits fullscreen mode\n- **Camera Blocked** — **-12 points** each time the camera is blocked or obstructed\n- **Snapshot Failed** — **-8 points** each time a scheduled webcam snapshot fails to capture\n\n**Example:** 1 fullscreen exit + 2 snapshot failures:\n100 - (1 × 10) - (2 × 8) = **74/100**",
          descriptionAr:
            "يبدأ من **100** ويخسر نقاط لكل مخالفة:\n- **خروج من الشاشة الكاملة** — **-10 نقاط** كل مرة يخرج المرشح من وضع الشاشة الكاملة\n- **حجب الكاميرا** — **-12 نقطة** كل مرة تُحجب الكاميرا أو تُعاق\n- **فشل اللقطة** — **-8 نقاط** كل مرة تفشل لقطة الكاميرا المجدولة\n\n**مثال:** 1 خروج من الشاشة الكاملة + 2 فشل لقطات:\n100 - (1 × 10) - (2 × 8) = **74/100**",
          imagePlaceholder: "/tutorials/results-environment-score.png",
        },
        {
          id: "report-overall-calculation",
          titleEn: "How the Overall Score Combines Categories",
          titleAr: "كيف تُجمع النقاط الإجمالية من الفئات",
          descriptionEn:
            'The **Overall Risk Score** comes from the backend rule engine (stored in the session). If the backend has not yet calculated, a **fallback formula** is used:\n\n**Weighted formula:**\n- **Face Detection** weight = **35%**\n- **Behavior** weight = **30%**\n- **Eye Tracking** weight = **20%**\n- **Environment** weight = **15%**\n\n**Calculation:**\nOverall = (100 - Face) × 0.35 + (100 - Behavior) × 0.30 + (100 - Eye) × 0.20 + (100 - Environment) × 0.15\n\n**Example:** Face=64, Behavior=66, Eye=53, Environment=74\n(100-64)×0.35 + (100-66)×0.30 + (100-53)×0.20 + (100-74)×0.15\n= 12.6 + 10.2 + 9.4 + 3.9 = **36.1** → "Medium" risk (yellow)',
          descriptionAr:
            'تأتي **نقاط المخاطر الإجمالية** من محرك القواعد في الخادم (مخزنة في الجلسة). إذا لم يحسبها الخادم بعد، تُستخدم **معادلة احتياطية**:\n\n**معادلة مرجّحة:**\n- **كشف الوجه** وزن = **35%**\n- **السلوك** وزن = **30%**\n- **تتبع العين** وزن = **20%**\n- **البيئة** وزن = **15%**\n\n**الحساب:**\nالإجمالي = (100 - الوجه) × 0.35 + (100 - السلوك) × 0.30 + (100 - العين) × 0.20 + (100 - البيئة) × 0.15\n\n**مثال:** الوجه=64، السلوك=66، العين=53، البيئة=74\n(100-64)×0.35 + (100-66)×0.30 + (100-53)×0.20 + (100-74)×0.15\n= 12.6 + 10.2 + 9.4 + 3.9 = **36.1** ← مخاطر "متوسطة" (أصفر)',
          noteEn:
            "The backend rule engine score takes priority over the client-side formula. The fallback is only used when the backend hasn't calculated the score yet.",
          noteAr:
            "نقاط محرك القواعد في الخادم لها الأولوية على المعادلة المحلية. يُستخدم الاحتياطي فقط عندما لم يحسب الخادم النقاط بعد.",
        },
        {
          id: "report-ai-generation",
          titleEn: "How the AI Report is Generated",
          titleAr: "كيف يُنشأ تقرير AI",
          descriptionEn:
            'The AI analysis is generated by **GPT-4o** when you click **"Generate AI Analysis"**.\n\n**The system sends 9 data sections to GPT-4o:**\n1. **Candidate Identity** — name, email, roll number, department\n2. **Exam Configuration & Security** — duration, pass score, proctoring mode, lockdown flags (webcam, fullscreen, copy/paste prevention, browser lockdown)\n3. **Session & Attempt Timing** — start/end times, duration, time usage %, termination flags\n4. **Device & Environment** — IP, browser, OS, resolution, device fingerprint, IP mismatch detection\n5. **Risk Metrics & Violations** — current risk score, total events/violations, severity distribution (Critical/High/Medium/Low/Minor), event breakdown by type\n6. **Answer Behavior** — questions answered/total, answer changes count, avg/fastest/slowest answer times, rapid answers (<3 seconds), score, pass/fail\n7. **Warnings & Disconnects** — warnings sent by proctor, disconnect count, total disconnect duration\n8. **Event Timeline** — first 20 non-heartbeat events in chronological order\n9. **Detected Patterns** — burst violations (many in short time), repeated event types, excessive answer changes, rapid answering patterns\n\nGPT-4o **cross-correlates** these data points — for example, disconnects followed by rapid correct answers may indicate outside help.',
          descriptionAr:
            'يُنشأ تحليل AI بواسطة **GPT-4o** عند النقر على **"إنشاء تحليل AI"**.\n\n**يرسل النظام 9 أقسام بيانات إلى GPT-4o:**\n1. **هوية المرشح** — الاسم، البريد، الرقم، القسم\n2. **إعدادات الاختبار والأمان** — المدة، درجة النجاح، وضع المراقبة، أقفال الأمان (كاميرا، شاشة كاملة، منع النسخ/اللصق، قفل المتصفح)\n3. **توقيت الجلسة والمحاولة** — أوقات البدء/الانتهاء، المدة، نسبة استخدام الوقت، علامات الإنهاء\n4. **الجهاز والبيئة** — IP، المتصفح، نظام التشغيل، الدقة، بصمة الجهاز، كشف تغيير IP\n5. **مقاييس المخاطر والمخالفات** — نقاط المخاطر الحالية، إجمالي الأحداث/المخالفات، توزيع الخطورة (حرج/عالي/متوسط/منخفض/طفيف)، تفصيل الأحداث بالنوع\n6. **سلوك الإجابة** — أسئلة مُجابة/إجمالي، عدد تغييرات الإجابة، متوسط/أسرع/أبطأ وقت إجابة، إجابات سريعة (<3 ثواني)، الدرجة، نجاح/رسوب\n7. **التحذيرات والانقطاعات** — تحذيرات المراقب، عدد الانقطاعات، إجمالي مدة الانقطاع\n8. **الجدول الزمني** — أول 20 حدث غير heartbeat بالتسلسل الزمني\n9. **الأنماط المكتشفة** — مخالفات متتالية (كثيرة في وقت قصير)، أنواع أحداث متكررة، تغييرات إجابة مفرطة، أنماط إجابة سريعة\n\nيقوم GPT-4o **بربط** هذه البيانات — مثلاً، انقطاعات متبوعة بإجابات صحيحة سريعة قد تشير إلى مساعدة خارجية.',
          imagePlaceholder: "/tutorials/results-ai-generation.png",
        },
        {
          id: "report-ai-output",
          titleEn: "What the AI Report Contains",
          titleAr: "ماذا يحتوي تقرير AI",
          descriptionEn:
            "GPT-4o returns a structured JSON report with these sections:\n\n**Summary:**\n- **Risk Level** — Low, Medium, High, or Critical\n- **Risk Score** — 0 to 100\n- **Confidence** — AI confidence percentage (0–100%)\n- **Executive Summary** — 3–4 sentence overview\n- **Risk Explanation** — 2–3 sentence summary of findings\n- **Integrity Verdict** — professional verdict on exam integrity\n\n**Detailed Findings:**\n- **Suspicious Behaviors** — list of flagged behaviors\n- **Aggravating Factors** — factors that increase risk\n- **Mitigating Factors** — factors that lower risk\n- **Risk Timeline** — how risk developed over time\n\n**Behavior Analysis:**\n- **Answer Pattern Summary** — how the candidate answered questions\n- **Navigation Behavior** — question navigation patterns\n- **Focus Behavior** — attention and focus patterns\n- **Timing Analysis** — suspicious timing patterns\n- **Suspicious Patterns** — cross-correlated anomalies\n\n**Violation Analysis:**\n- **Total Violations** — overall count\n- **Violation Trend** — increasing, stable, or decreasing\n- **Violation Breakdown** — each violation type with count, severity, and impact\n\n**Recommendations:**\n- **Primary Recommendation** — main action to take\n- **Additional Recommendations** — list of suggested actions",
          descriptionAr:
            "يُرجع GPT-4o تقريراً بصيغة JSON مهيكلة بالأقسام التالية:\n\n**الملخص:**\n- **مستوى المخاطر** — منخفض، متوسط، مرتفع، أو حرج\n- **نقاط المخاطر** — 0 إلى 100\n- **الثقة** — نسبة ثقة AI (0–100%)\n- **الملخص التنفيذي** — نظرة عامة من 3–4 جمل\n- **شرح المخاطر** — ملخص النتائج من 2–3 جمل\n- **حكم النزاهة** — حكم مهني على نزاهة الاختبار\n\n**النتائج التفصيلية:**\n- **السلوكيات المشبوهة** — قائمة السلوكيات المُعلّمة\n- **العوامل المشددة** — العوامل التي تزيد المخاطر\n- **العوامل المخففة** — العوامل التي تقلل المخاطر\n- **الجدول الزمني للمخاطر** — كيف تطورت المخاطر عبر الوقت\n\n**تحليل السلوك:**\n- **ملخص نمط الإجابة** — كيف أجاب المرشح على الأسئلة\n- **سلوك التنقل** — أنماط التنقل بين الأسئلة\n- **سلوك التركيز** — أنماط الانتباه والتركيز\n- **تحليل التوقيت** — أنماط توقيت مشبوهة\n- **الأنماط المشبوهة** — شذوذات مترابطة\n\n**تحليل المخالفات:**\n- **إجمالي المخالفات** — العدد الكلي\n- **اتجاه المخالفات** — متزايد، مستقر، أو متناقص\n- **تفصيل المخالفات** — كل نوع مخالفة مع العدد والخطورة والتأثير\n\n**التوصيات:**\n- **التوصية الرئيسية** — الإجراء الأساسي المطلوب\n- **توصيات إضافية** — قائمة إجراءات مقترحة",
        },
        {
          id: "report-ai-example-low",
          titleEn: "Example: Low Risk Report",
          titleAr: "مثال: تقرير مخاطر منخفضة",
          descriptionEn:
            '**Scenario:** A candidate completes the exam normally, minor 2 window blurs from notification popups.\n\n- **Risk Level:** "Low"\n- **Risk Score:** 8/100\n- **Confidence:** 92%\n- **Executive Summary:** "The candidate demonstrated normal exam behavior throughout the session. Two minor window blur events were recorded, consistent with operating system notifications. No suspicious patterns detected."\n- **Suspicious Behaviors:** []\n- **Mitigating Factors:** ["Consistent answer timing", "No tab switches", "Face always visible", "Full session in fullscreen"]\n- **Recommendation:** "Accept result — no integrity concerns."',
          descriptionAr:
            '**السيناريو:** مرشح أكمل الاختبار بشكل طبيعي، مع فقدان تركيز طفيف مرتين بسبب إشعارات النظام.\n\n- **مستوى المخاطر:** "منخفض"\n- **نقاط المخاطر:** 8/100\n- **الثقة:** 92%\n- **الملخص التنفيذي:** "أظهر المرشح سلوك اختبار طبيعي طوال الجلسة. سُجل حدثان طفيفان لفقدان التركيز، متسقان مع إشعارات نظام التشغيل. لم تُكتشف أنماط مشبوهة."\n- **السلوكيات المشبوهة:** []\n- **العوامل المخففة:** ["توقيت إجابة متسق"، "لا تبديل علامات"، "الوجه مرئي دائماً"، "الجلسة كاملة في الشاشة الكاملة"]\n- **التوصية:** "قبول النتيجة — لا مخاوف نزاهة."',
        },
        {
          id: "report-ai-example-high",
          titleEn: "Example: High Risk Report",
          titleAr: "مثال: تقرير مخاطر مرتفعة",
          descriptionEn:
            '**Scenario:** A candidate disconnects twice for 3 minutes each, switches tabs 6 times, and answers 4 questions correctly in <3 seconds after reconnecting.\n\n- **Risk Level:** "High"\n- **Risk Score:** 72/100\n- **Confidence:** 87%\n- **Executive Summary:** "Significant integrity concerns detected. The candidate disconnected twice for extended periods, followed by rapid correct answers immediately after reconnection. This pattern is consistent with potential use of external resources."\n- **Suspicious Behaviors:** ["Extended disconnections (2× at 3min each)", "6 tab switches during active session", "4 rapid correct answers (<3s) immediately after reconnection"]\n- **Aggravating Factors:** ["Disconnect-then-rapid-answer pattern", "High tab switch frequency", "Answer changes after disconnection"]\n- **Mitigating Factors:** ["Consistent answer quality throughout", "Device fingerprint unchanged"]\n- **Recommendation:** "Manual review strongly recommended. Cross-check answer timing with disconnection periods."',
          descriptionAr:
            '**السيناريو:** مرشح انقطع مرتين لمدة 3 دقائق لكل مرة، بدّل علامات 6 مرات، وأجاب 4 أسئلة صحيحة في <3 ثواني بعد إعادة الاتصال.\n\n- **مستوى المخاطر:** "مرتفع"\n- **نقاط المخاطر:** 72/100\n- **الثقة:** 87%\n- **الملخص التنفيذي:** "اكتُشفت مخاوف نزاهة كبيرة. المرشح انقطع مرتين لفترات ممتدة، تلتها إجابات صحيحة سريعة مباشرة بعد إعادة الاتصال. هذا النمط متسق مع احتمال استخدام موارد خارجية."\n- **السلوكيات المشبوهة:** ["انقطاعات ممتدة (2× بمعدل 3 دقائق)"، "6 تبديلات علامة أثناء الجلسة"، "4 إجابات صحيحة سريعة (<3ث) مباشرة بعد إعادة الاتصال"]\n- **العوامل المشددة:** ["نمط انقطاع-ثم-إجابة-سريعة"، "تكرار عالي لتبديل العلامات"، "تغييرات إجابة بعد الانقطاع"]\n- **العوامل المخففة:** ["جودة إجابة متسقة طوال الاختبار"، "بصمة الجهاز لم تتغير"]\n- **التوصية:** "المراجعة اليدوية موصى بها بشدة. تطابق توقيت الإجابات مع فترات الانقطاع."',
        },
        {
          id: "report-evidence-section",
          titleEn: "Evidence & Event Log",
          titleAr: "الأدلة وسجل الأحداث",
          descriptionEn:
            "Below the AI analysis card, the report includes:\n\n**Session Details card:**\n- Session start/end times and **total duration**\n- Session **status** (Active, Completed, Terminated)\n- Total **violations** count and **termination info** (if applicable)\n\n**Device & Environment card:**\n- **IP address** — with IP mismatch detection if IP changed during session\n- **Browser** and **OS** — user agent details\n- **Screen resolution** — monitor dimensions\n- **Device fingerprint** — unique device identifier\n\n**Candidate Answer Behavior card:**\n- **Questions answered** out of total\n- **Answer changes** — how many times the candidate changed answers\n- **Timing analysis** — average, fastest, and slowest answer time\n- **Rapid answers** — count of answers submitted in less than 3 seconds\n\n**Evidence Gallery:**\n- **Webcam snapshots** — periodic captures from the camera\n- **Screen captures** — periodic screenshots of the candidate screen",
          descriptionAr:
            "أسفل بطاقة تحليل AI، يتضمن التقرير:\n\n**بطاقة تفاصيل الجلسة:**\n- أوقات بدء/انتهاء الجلسة و**المدة الإجمالية**\n- **حالة** الجلسة (نشطة، مكتملة، منتهية)\n- إجمالي عدد **المخالفات** و**معلومات الإنهاء** (إن وُجدت)\n\n**بطاقة الجهاز والبيئة:**\n- **عنوان IP** — مع كشف تغيير IP إذا تغيّر أثناء الجلسة\n- **المتصفح** و**نظام التشغيل** — تفاصيل وكيل المستخدم\n- **دقة الشاشة** — أبعاد الشاشة\n- **بصمة الجهاز** — معرّف فريد للجهاز\n\n**بطاقة سلوك إجابة المرشح:**\n- **الأسئلة المُجابة** من الإجمالي\n- **تغييرات الإجابة** — كم مرة غيّر المرشح إجاباته\n- **تحليل التوقيت** — متوسط وأسرع وأبطأ وقت إجابة\n- **إجابات سريعة** — عدد الإجابات المقدمة في أقل من 3 ثوان\n\n**معرض الأدلة:**\n- **لقطات الكاميرا** — تسجيلات دورية من الكاميرا\n- **لقطات الشاشة** — لقطات شاشة دورية لشاشة المرشح",
          imagePlaceholder: "/tutorials/results-event-log.png",
        },
        {
          id: "report-event-timeline",
          titleEn: "Attempt Event Log Timeline",
          titleAr: "سجل أحداث المحاولة الزمني",
          descriptionEn:
            "The **Attempt Event Log** at the bottom shows every proctoring event in **chronological order**:\n\n- **Timestamp** — exact date and time of each event\n- **Event Type** — what happened (e.g., TabSwitched, FaceNotDetected, FullscreenExited)\n- **Severity** — color-coded badge (Critical, High, Medium, Low, Minor)\n- **Details** — additional context for each event\n\nThis timeline allows administrators to **reconstruct exactly** what happened during the exam — correlating events with answer behavior and score changes.",
          descriptionAr:
            "يعرض **سجل أحداث المحاولة** في الأسفل كل حدث مراقبة بـ**الترتيب الزمني**:\n\n- **الطابع الزمني** — التاريخ والوقت الدقيق لكل حدث\n- **نوع الحدث** — ما حدث (مثلاً تبديل علامة، عدم كشف الوجه، خروج من الشاشة الكاملة)\n- **الخطورة** — شارة ملونة (حرج، عالي، متوسط، منخفض، طفيف)\n- **التفاصيل** — سياق إضافي لكل حدث\n\nيتيح هذا الجدول الزمني للمسؤولين **إعادة بناء** ما حدث بالضبط أثناء الاختبار — ربط الأحداث بسلوك الإجابة وتغييرات الدرجة.",
          imagePlaceholder: "/tutorials/results-event-timeline.png",
        },
        {
          id: "report-regenerate",
          titleEn: "Regenerate & AI Settings",
          titleAr: "إعادة الإنشاء وإعدادات AI",
          descriptionEn:
            'You can click **"Regenerate"** to re-run the AI analysis with the latest data.\n\n**AI Configuration:**\n- **Model:** GPT-4o\n- **Temperature:** 0.3 (low — for consistent, factual analysis)\n- **Max Tokens:** 1024\n- **Response Format:** Structured JSON\n\nThe low temperature ensures the AI produces **consistent, deterministic** results — running the same data twice will give very similar findings.',
          descriptionAr:
            'يمكنك النقر على **"إعادة إنشاء"** لإعادة تشغيل تحليل AI بأحدث البيانات.\n\n**إعدادات AI:**\n- **النموذج:** GPT-4o\n- **الحرارة:** 0.3 (منخفضة — لتحليل متسق وواقعي)\n- **أقصى رموز:** 1024\n- **صيغة الاستجابة:** JSON مهيكل\n\nالحرارة المنخفضة تضمن أن AI ينتج نتائج **متسقة وحتمية** — تشغيل نفس البيانات مرتين يعطي نتائج متشابهة جداً.',
          tipEn:
            "Each regeneration calls GPT-4o — use it when new events have been logged or if you want a fresh perspective on the same data.",
          tipAr:
            "كل إعادة إنشاء تستدعي GPT-4o — استخدمها عندما تُسجَّل أحداث جديدة أو تريد رؤية جديدة لنفس البيانات.",
        },
      ],
      examples: [
        {
          titleEn: "Score Calculation Summary Table",
          titleAr: "جدول ملخص حساب النقاط",
          contentEn:
            "**Face Detection** — Weight: 35%\n- FaceNotDetected (−8)\n- MultipleFaces (−12)\n- CameraBlocked (−10)\n- WebcamDenied (−25)\n\n**Eye Tracking** — Weight: 20%\n- HeadTurned (−7)\n- FaceOutOfFrame (−6)\n\n**Behavior** — Weight: 30%\n- TabSwitched (−8)\n- WindowBlur (−4)\n- CopyAttempt (−10)\n- PasteAttempt (−10)\n- RightClick (−5)\n\n**Environment** — Weight: 15%\n- FullscreenExited (−10)\n- CameraBlocked (−12)\n- SnapshotFailed (−8)\n\nAll scores start at 100 and decrease with each violation.\n**Overall Risk** = weighted sum of (100 − CategoryScore) for each category.",
          contentAr:
            "**كشف الوجه** — الوزن: 35%\n- عدم كشف الوجه (−8)\n- وجوه متعددة (−12)\n- حجب الكاميرا (−10)\n- رفض الكاميرا (−25)\n\n**تتبع العين** — الوزن: 20%\n- التفات الرأس (−7)\n- الوجه خارج الإطار (−6)\n\n**السلوك** — الوزن: 30%\n- تبديل علامة (−8)\n- فقدان التركيز (−4)\n- محاولة نسخ (−10)\n- محاولة لصق (−10)\n- نقر يمين (−5)\n\n**البيئة** — الوزن: 15%\n- خروج من الشاشة الكاملة (−10)\n- حجب الكاميرا (−12)\n- فشل اللقطة (−8)\n\nجميع النقاط تبدأ من 100 وتنخفض مع كل مخالفة.\n**المخاطر الإجمالية** = المجموع المرجّح لـ(100 − نقاط الفئة) لكل فئة.",
        },
      ],
    },
    // ── Section 6: Full Workflow Summary ──
    {
      id: "workflow-summary",
      titleEn: "6. Complete Results Workflow",
      titleAr: "6. سير عمل النتائج الكامل",
      descriptionEn:
        "End-to-end workflow from exam submission to result publication and AI analysis.",
      descriptionAr:
        "سير عمل شامل من تسليم الاختبار إلى نشر النتيجة وتحليل AI.",
      steps: [
        {
          id: "workflow-steps",
          titleEn: "Step-by-Step Workflow",
          titleAr: "خطوات سير العمل",
          descriptionEn:
            "The complete flow:\n1. Candidate submits exam → **auto-grading** runs immediately\n2. If manual grading needed → appears in **Grading Center**\n3. Instructor grades all questions → clicks **Finalize**\n4. Admin/Instructor clicks **Publish Result**\n5. Candidate receives **email notification**\n6. Candidate views result in their **dashboard**\n7. If terminated → appears in **Terminated Attempts** for review\n8. **AI Proctor Report** available for any proctored attempt\n9. **Risk Score** tracked historically via snapshots",
          descriptionAr:
            "السير الكامل:\n1. المرشح يسلّم الاختبار ← **التصحيح الآلي** يعمل فوراً\n2. إذا احتاج تصحيح يدوي ← يظهر في **مركز التصحيح**\n3. المصحح يصحح جميع الأسئلة ← ينقر **اعتماد**\n4. المدير/المدرّس ينقر **نشر النتيجة**\n5. المرشح يستلم **إشعار بريد**\n6. المرشح يعرض النتيجة في **لوحته**\n7. إذا أُنهي ← يظهر في **المحاولات المنتهية** للمراجعة\n8. **تقرير مراقب AI** متاح لأي محاولة مراقَبة\n9. **نقاط المخاطر** مُتتبعة تاريخياً عبر اللقطات",
        },
      ],
      examples: [
        {
          titleEn: "Workflow Map",
          titleAr: "خريطة سير العمل",
          contentEn:
            "Exam Submitted → Auto Grade → Manual Grade (if needed) → Finalize → Publish → Email Sent → Candidate Views Result\n\nTerminated → Review Evidence → Allow New Attempt (optional)\n\nAny Proctored Result → AI Proctor Report → Risk Assessment → Manual Review (if needed)",
          contentAr:
            "تسليم الاختبار ← تصحيح آلي ← تصحيح يدوي (إذا لزم) ← اعتماد ← نشر ← إرسال بريد ← المرشح يعرض النتيجة\n\nمُنهي ← مراجعة الأدلة ← السماح بمحاولة جديدة (اختياري)\n\nأي نتيجة مراقَبة ← تقرير مراقب AI ← تقييم المخاطر ← مراجعة يدوية (إذا لزم)",
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// PROCTOR CENTER MODULE
// ────────────────────────────────────────────────────────
export const proctorTutorial: TutorialModule = {
  id: "proctoring",
  slug: "proctoring",
  titleEn: "Proctor Center",
  titleAr: "مركز المراقبة",
  descriptionEn:
    "Learn how to use the Proctor Center — live monitoring dashboard, session management, incident handling, identity verification, AI-powered risk analysis, and real-time candidate actions.",
  descriptionAr:
    "تعلّم كيفية استخدام مركز المراقبة — لوحة المراقبة الحية، إدارة الجلسات، معالجة الحوادث، التحقق من الهوية، تحليل المخاطر بالذكاء الاصطناعي، والإجراءات الفورية على المرشحين.",
  iconName: "Monitor",
  videoPlaceholder: "/tutorials/proctor-overview.mp4",
  sections: [
    // ── Section 1: Overview & Access ──
    {
      id: "proctor-overview",
      titleEn: "1. Overview & Access",
      titleAr: "1. نظرة عامة والوصول",
      descriptionEn:
        "Understand the Proctor Center purpose, who can access it, and how to navigate to it from the sidebar.",
      descriptionAr:
        "فهم الغرض من مركز المراقبة، من يمكنه الوصول إليه، وكيفية التنقل إليه من القائمة الجانبية.",
      steps: [
        {
          id: "what-is-proctor-center",
          titleEn: "What Is the Proctor Center?",
          titleAr: "ما هو مركز المراقبة؟",
          descriptionEn:
            "The **Proctor Center** is the central hub for **live exam monitoring**. It provides:\n- **Real-time dashboard** of all active exam sessions\n- **AI-powered risk scoring** for each candidate\n- **Incident management** — flag, warn, or terminate suspicious sessions\n- **Identity verification** — approve or reject candidate identity checks\n- **Evidence collection** — screenshots, video recordings, and device fingerprints\n- **WebRTC live video** streaming from candidate webcams",
          descriptionAr:
            "**مركز المراقبة** هو المحور المركزي لـ**مراقبة الاختبارات الحية**. يوفر:\n- **لوحة معلومات فورية** لجميع جلسات الاختبار النشطة\n- **تقييم مخاطر بالذكاء الاصطناعي** لكل مرشح\n- **إدارة الحوادث** — تعليم أو تحذير أو إنهاء الجلسات المشبوهة\n- **التحقق من الهوية** — قبول أو رفض فحوصات هوية المرشحين\n- **جمع الأدلة** — لقطات شاشة وتسجيلات فيديو وبصمات أجهزة\n- **بث فيديو مباشر WebRTC** من كاميرات المرشحين",
          imagePlaceholder: "/tutorials/proctor-center-overview.png",
        },
        {
          id: "access-proctor-center",
          titleEn: "How to Access",
          titleAr: "كيفية الوصول",
          descriptionEn:
            "Navigate from the **sidebar** → **Proctor Center** group:\n- **Proctor Dashboard** — main monitoring page\n- **User Identification** — identity verification queue\n\nAccess roles:\n- **Admin** — full access to all proctor features and logs\n- **Instructor** — full monitoring and actions\n- **Proctor** — monitoring, warn, and terminate\n- **Examiner** — view-only access to monitoring",
          descriptionAr:
            "انتقل من **القائمة الجانبية** → مجموعة **مركز المراقبة**:\n- **لوحة المراقبة** — صفحة المراقبة الرئيسية\n- **التحقق من الهوية** — قائمة انتظار التحقق من الهوية\n\nأدوار الوصول:\n- **مدير** — وصول كامل لجميع ميزات المراقبة والسجلات\n- **مدرّس** — مراقبة كاملة وإجراءات\n- **مراقب** — مراقبة وتحذير وإنهاء\n- **ممتحن** — وصول للعرض فقط",
          imagePlaceholder: "/tutorials/proctor-sidebar-nav.png",
          tipEn:
            "Proctor Logs are also available under System Logs in the sidebar for reviewing all historical proctor activity.",
          tipAr:
            "سجلات المراقبة متاحة أيضاً تحت سجلات النظام في القائمة الجانبية لمراجعة جميع أنشطة المراقبة السابقة.",
        },
      ],
    },
    // ── Section 2: Live Monitoring Dashboard ──
    {
      id: "live-monitoring",
      titleEn: "2. Live Monitoring Dashboard",
      titleAr: "2. لوحة المراقبة الحية",
      descriptionEn:
        "The main dashboard shows all active exam sessions in a grid layout with real-time updates, risk scores, and quick actions.",
      descriptionAr:
        "تعرض اللوحة الرئيسية جميع جلسات الاختبار النشطة في تخطيط شبكي مع تحديثات فورية ونقاط المخاطر وإجراءات سريعة.",
      steps: [
        {
          id: "dashboard-layout",
          titleEn: "Dashboard Grid View",
          titleAr: "عرض شبكة اللوحة",
          descriptionEn:
            "The dashboard displays **session cards** in a grid. Each card shows:\n- **Candidate name** and exam title\n- **Latest snapshot** from the webcam\n- **Risk score** with color-coded badge (Low/Medium/High/Critical)\n- **Time remaining** in the exam\n- **Incident count** — number of violations detected\n- **Flag status** — whether the session is flagged for priority review\n- **Quick action buttons** — Flag, Warn, View Details",
          descriptionAr:
            "تعرض اللوحة **بطاقات الجلسات** في شبكة. كل بطاقة تعرض:\n- **اسم المرشح** وعنوان الاختبار\n- **آخر لقطة** من الكاميرا\n- **نقاط المخاطر** مع شارة ملونة (منخفض/متوسط/عالي/حرج)\n- **الوقت المتبقي** في الاختبار\n- **عدد الحوادث** — عدد المخالفات المكتشفة\n- **حالة التعليم** — هل الجلسة معلّمة للمراجعة ذات الأولوية\n- **أزرار الإجراءات السريعة** — تعليم، تحذير، عرض التفاصيل",
          imagePlaceholder: "/tutorials/proctor-dashboard-grid.png",
        },
        {
          id: "risk-score-system",
          titleEn: "Risk Score System",
          titleAr: "نظام نقاط المخاطر",
          descriptionEn:
            "Each session has an **AI-calculated risk score** (0–100%). Color codes:\n- **Green (Low)** — 0–25% — normal behavior\n- **Yellow (Medium)** — 26–50% — minor concerns\n- **Orange (High)** — 51–75% — requires attention\n- **Red (Critical)** — 76–100% — immediate action recommended\n\nThe score factors in: face detection events, tab switches, multiple persons detected, audio anomalies, and screen capture attempts.",
          descriptionAr:
            "لكل جلسة **نقاط مخاطر محسوبة بالذكاء الاصطناعي** (0–100%). رموز الألوان:\n- **أخضر (منخفض)** — 0–25% — سلوك طبيعي\n- **أصفر (متوسط)** — 26–50% — مخاوف بسيطة\n- **برتقالي (عالي)** — 51–75% — يتطلب انتباه\n- **أحمر (حرج)** — 76–100% — يُوصى بإجراء فوري\n\nتأخذ النقاط بالاعتبار: أحداث كشف الوجه، تبديل التبويبات، اكتشاف أشخاص متعددين، شذوذ الصوت، ومحاولات التقاط الشاشة.",
          imagePlaceholder: "/tutorials/proctor-risk-scores.png",
          tipEn:
            "Sessions with Critical risk are highlighted and pinned to the top of the dashboard for immediate attention.",
          tipAr:
            "الجلسات ذات المخاطر الحرجة تُبرز وتُثبت في أعلى اللوحة للانتباه الفوري.",
        },
        {
          id: "ai-triage",
          titleEn: "AI Triage Recommendations",
          titleAr: "توصيات فرز AI",
          descriptionEn:
            "The **AI Triage** feature analyzes all active sessions and recommends which ones need immediate review. It ranks sessions by:\n- **Violation severity** — critical violations first\n- **Risk trend** — rapidly increasing risk scores\n- **Time sensitivity** — sessions nearing completion\n\nUse the triage panel to prioritize your monitoring efforts efficiently.",
          descriptionAr:
            "ميزة **فرز AI** تحلل جميع الجلسات النشطة وتوصي بالجلسات التي تحتاج مراجعة فورية. تصنف الجلسات حسب:\n- **شدة المخالفة** — المخالفات الحرجة أولاً\n- **اتجاه المخاطر** — نقاط المخاطر المتصاعدة بسرعة\n- **حساسية الوقت** — الجلسات القريبة من الانتهاء\n\nاستخدم لوحة الفرز لترتيب أولويات جهود المراقبة بكفاءة.",
          imagePlaceholder: "/tutorials/proctor-ai-triage.png",
        },
        {
          id: "filtering-sorting",
          titleEn: "Filtering & Sorting Sessions",
          titleAr: "تصفية وترتيب الجلسات",
          descriptionEn:
            "Use the toolbar to filter and sort sessions:\n- **Search** — by candidate name or exam title\n- **Filter by risk level** — Low, Medium, High, Critical\n- **Filter by status** — Active, Flagged, Completed\n- **Sort by** — Risk Score, Time Remaining, Incident Count\n\nFilters help you focus on the sessions that need the most attention.",
          descriptionAr:
            "استخدم شريط الأدوات لتصفية وترتيب الجلسات:\n- **بحث** — بالاسم أو عنوان الاختبار\n- **تصفية بمستوى المخاطر** — منخفض، متوسط، عالي، حرج\n- **تصفية بالحالة** — نشط، معلّم، مكتمل\n- **ترتيب حسب** — نقاط المخاطر، الوقت المتبقي، عدد الحوادث\n\nالمرشحات تساعدك على التركيز على الجلسات التي تحتاج أكبر قدر من الانتباه.",
          imagePlaceholder: "/tutorials/proctor-dashboard-filters.png",
        },
        {
          id: "real-time-updates",
          titleEn: "Real-Time Updates",
          titleAr: "التحديثات الفورية",
          descriptionEn:
            "The dashboard updates automatically using two mechanisms:\n- **SignalR (WebSocket)** — instant notifications for warnings, terminations, and new incidents\n- **Polling** — refreshes session data every **5 seconds** as a fallback\n\nYou do not need to refresh the page — all changes appear automatically.",
          descriptionAr:
            "تتحدث اللوحة تلقائياً باستخدام آليتين:\n- **SignalR (WebSocket)** — إشعارات فورية للتحذيرات والإنهاءات والحوادث الجديدة\n- **Polling** — يُحدّث بيانات الجلسات كل **5 ثوانٍ** كآلية احتياطية\n\nلا تحتاج لتحديث الصفحة — جميع التغييرات تظهر تلقائياً.",
          imagePlaceholder: "/tutorials/proctor-realtime.png",
          noteEn:
            "If the SignalR connection is lost, the system automatically attempts to reconnect up to 10 times with exponential backoff.",
          noteAr:
            "إذا انقطع اتصال SignalR، يحاول النظام تلقائياً إعادة الاتصال حتى 10 مرات مع تأخير متصاعد.",
        },
      ],
    },
    // ── Section 3: Session Detail Page ──
    {
      id: "session-detail",
      titleEn: "3. Session Detail",
      titleAr: "3. تفاصيل الجلسة",
      descriptionEn:
        "Click any session card to open its detailed view — live video, event timeline, evidence, device info, and proctor actions.",
      descriptionAr:
        "انقر على أي بطاقة جلسة لفتح عرضها التفصيلي — فيديو مباشر، خط زمني للأحداث، أدلة، معلومات الجهاز، وإجراءات المراقب.",
      steps: [
        {
          id: "live-video-feed",
          titleEn: "Live Video Feed (WebRTC)",
          titleAr: "بث الفيديو المباشر (WebRTC)",
          descriptionEn:
            "The session detail page shows the **candidate's live webcam feed** via WebRTC. Features:\n- **One-way video** — proctor can see the candidate, candidate cannot see the proctor\n- **Connection status** indicator — green (connected), yellow (reconnecting), red (disconnected)\n- **Full-screen** toggle for closer inspection\n\nThe video stream uses STUN servers for NAT traversal to ensure connectivity.",
          descriptionAr:
            "تعرض صفحة تفاصيل الجلسة **بث كاميرا المرشح المباشر** عبر WebRTC. الميزات:\n- **فيديو أحادي الاتجاه** — المراقب يرى المرشح، المرشح لا يرى المراقب\n- **مؤشر حالة الاتصال** — أخضر (متصل)، أصفر (إعادة اتصال)، أحمر (منقطع)\n- **تبديل ملء الشاشة** للفحص عن قرب\n\nيستخدم بث الفيديو خوادم STUN لعبور NAT لضمان الاتصال.",
          imagePlaceholder: "/tutorials/proctor-live-video.png",
        },
        {
          id: "event-timeline",
          titleEn: "Event Timeline",
          titleAr: "خط الأحداث الزمني",
          descriptionEn:
            "A chronological log of all events during the session:\n- **Tab switches** — candidate switched browser tabs\n- **Face not detected** — webcam lost sight of the candidate\n- **Multiple persons** — more than one face detected\n- **Audio detected** — unexpected audio activity\n- **Screen capture attempts** — candidate tried to capture the screen\n- **Proctor actions** — warnings sent, flags set, time extensions\n\nEach event shows the **timestamp**, **type**, and **severity** (Low/Medium/High/Critical).",
          descriptionAr:
            "سجل زمني لجميع الأحداث أثناء الجلسة:\n- **تبديل التبويبات** — المرشح بدّل تبويبات المتصفح\n- **عدم اكتشاف الوجه** — الكاميرا فقدت رؤية المرشح\n- **أشخاص متعددون** — اكتشاف أكثر من وجه\n- **اكتشاف صوت** — نشاط صوتي غير متوقع\n- **محاولات التقاط الشاشة** — المرشح حاول التقاط الشاشة\n- **إجراءات المراقب** — تحذيرات مُرسلة، تعليمات، تمديدات وقت\n\nكل حدث يعرض **الوقت**، **النوع**، و**الشدة** (منخفض/متوسط/عالي/حرج).",
          imagePlaceholder: "/tutorials/proctor-event-timeline.png",
        },
        {
          id: "incident-log",
          titleEn: "Incident Log",
          titleAr: "سجل الحوادث",
          descriptionEn:
            "The incident log on the session detail page shows all **violations** detected for this specific session. Each incident includes:\n- **Type** — TabSwitch, FaceNotDetected, MultiplePersons, AudioDetected, ScreenCapture, Other\n- **Severity** — Low, Medium, High, Critical\n- **Description** — details of the violation\n- **Timestamp** — exact time of occurrence\n- **Reviewed status** — whether a proctor has reviewed it",
          descriptionAr:
            "يعرض سجل الحوادث في صفحة تفاصيل الجلسة جميع **المخالفات** المكتشفة لهذه الجلسة. كل حادث يتضمن:\n- **النوع** — تبديل التبويب، عدم اكتشاف الوجه، أشخاص متعددون، اكتشاف صوت، التقاط شاشة، أخرى\n- **الشدة** — منخفض، متوسط، عالي، حرج\n- **الوصف** — تفاصيل المخالفة\n- **الوقت** — وقت الحدوث الدقيق\n- **حالة المراجعة** — هل راجعها مراقب",
          imagePlaceholder: "/tutorials/proctor-incident-log.png",
        },
        {
          id: "screenshots-evidence",
          titleEn: "Screenshots & Evidence",
          titleAr: "اللقطات والأدلة",
          descriptionEn:
            "The evidence panel shows all captured **screenshots** and **screen recordings**:\n- **Webcam snapshots** — periodic captures of the candidate's face\n- **Screen captures** — if screen sharing is enabled\n- **Thumbnails gallery** — click to view full-size\n- **Timestamps** — each snapshot is timestamped for audit purposes\n\nEvidence is retained according to the system's data retention policy.",
          descriptionAr:
            "تعرض لوحة الأدلة جميع **اللقطات** و**تسجيلات الشاشة** الملتقطة:\n- **لقطات الكاميرا** — التقاطات دورية لوجه المرشح\n- **لقطات الشاشة** — إذا كانت مشاركة الشاشة مُفعّلة\n- **معرض مصغّرات** — انقر لعرض الحجم الكامل\n- **أوقات** — كل لقطة مؤرخة لأغراض التدقيق\n\nتُحفظ الأدلة وفقاً لسياسة الاحتفاظ بالبيانات في النظام.",
          imagePlaceholder: "/tutorials/proctor-screenshots.png",
        },
        {
          id: "device-info",
          titleEn: "Device & Environment Info",
          titleAr: "معلومات الجهاز والبيئة",
          descriptionEn:
            "The device panel displays detailed information about the candidate's environment:\n- **Browser** — name and version\n- **Operating System** — type and version\n- **Screen Resolution** — display dimensions\n- **IP Address** — network information\n- **Device Fingerprint** — unique hardware identifier\n\nThis data helps verify that the candidate is using a legitimate device and not a virtual machine.",
          descriptionAr:
            "تعرض لوحة الجهاز معلومات تفصيلية عن بيئة المرشح:\n- **المتصفح** — الاسم والإصدار\n- **نظام التشغيل** — النوع والإصدار\n- **دقة الشاشة** — أبعاد العرض\n- **عنوان IP** — معلومات الشبكة\n- **بصمة الجهاز** — معرّف فريد للجهاز\n\nتساعد هذه البيانات في التحقق من أن المرشح يستخدم جهازاً شرعياً وليس آلة افتراضية.",
          imagePlaceholder: "/tutorials/proctor-device-info.png",
        },
        {
          id: "ai-analysis-panel",
          titleEn: "AI Analysis Panel",
          titleAr: "لوحة تحليل AI",
          descriptionEn:
            'The AI Analysis panel on the session detail page provides a **GPT-4o powered** comprehensive analysis:\n- **Executive Summary** — brief overview of the session\n- **Risk Level** and **Risk Score** — overall assessment\n- **Suspicious Behaviors** — list of detected anomalies\n- **Behavior Analysis** — detailed behavioral patterns\n- **Violation Analysis** — breakdown of each violation type\n- **Environment Assessment** — device and setting review\n- **Integrity Verdict** — final integrity recommendation\n- **Risk Timeline** — how risk changed over time\n\nClick **"Generate"** or **"Regenerate"** to request a fresh AI analysis.',
          descriptionAr:
            'توفر لوحة تحليل AI في صفحة تفاصيل الجلسة تحليلاً شاملاً **مدعوماً بـ GPT-4o**:\n- **ملخص تنفيذي** — نظرة عامة موجزة عن الجلسة\n- **مستوى المخاطر** و**نقاط المخاطر** — تقييم شامل\n- **سلوكيات مشبوهة** — قائمة الانحرافات المكتشفة\n- **تحليل السلوك** — أنماط سلوكية تفصيلية\n- **تحليل المخالفات** — تحليل كل نوع مخالفة\n- **تقييم البيئة** — مراجعة الجهاز والإعدادات\n- **حكم النزاهة** — توصية نزاهة نهائية\n- **خط زمني للمخاطر** — كيف تغيرت المخاطر مع الوقت\n\nانقر **"إنشاء"** أو **"إعادة إنشاء"** لطلب تحليل AI جديد.',
          imagePlaceholder: "/tutorials/proctor-ai-analysis.png",
          noteEn:
            "AI analysis uses GPT-4o and may take a few seconds to generate. The analysis is cached after generation.",
          noteAr:
            "تحليل AI يستخدم GPT-4o وقد يستغرق بضع ثوانٍ للإنشاء. يُخزّن التحليل مؤقتاً بعد الإنشاء.",
        },
      ],
    },
    // ── Section 4: Proctor Actions ──
    {
      id: "proctor-actions",
      titleEn: "4. Proctor Actions",
      titleAr: "4. إجراءات المراقب",
      descriptionEn:
        "Actions available to proctors for managing live sessions — flagging, warning candidates, terminating sessions, and extending time.",
      descriptionAr:
        "الإجراءات المتاحة للمراقبين لإدارة الجلسات الحية — التعليم، تحذير المرشحين، إنهاء الجلسات، وتمديد الوقت.",
      steps: [
        {
          id: "flag-session",
          titleEn: "Flag / Unflag a Session",
          titleAr: "تعليم / إلغاء تعليم جلسة",
          descriptionEn:
            '**Flagging** marks a session for priority review without alerting the candidate.\n\nHow to flag:\n1. From the **dashboard**, click the **flag icon** on a session card\n2. Or from the **session detail page**, click **"Flag Session"**\n\nFlagged sessions appear highlighted on the dashboard and can be filtered using the **"Flagged"** filter.\n\nTo unflag, click the same button again.',
          descriptionAr:
            '**التعليم** يُعلّم الجلسة للمراجعة ذات الأولوية دون تنبيه المرشح.\n\nكيفية التعليم:\n1. من **اللوحة**، انقر على **أيقونة التعليم** في بطاقة الجلسة\n2. أو من **صفحة تفاصيل الجلسة**، انقر **"تعليم الجلسة"**\n\nالجلسات المعلّمة تظهر مُبرزة في اللوحة ويمكن تصفيتها باستخدام مرشح **"معلّم"**.\n\nلإزالة التعليم، انقر نفس الزر مرة أخرى.',
          imagePlaceholder: "/tutorials/proctor-flag-session.png",
          tipEn:
            "Flagging is a silent action — the candidate will NOT be notified. Use it to mark sessions for later review or to alert other proctors.",
          tipAr:
            "التعليم إجراء صامت — لن يتم إخطار المرشح. استخدمه لتعليم الجلسات للمراجعة لاحقاً أو لتنبيه المراقبين الآخرين.",
        },
        {
          id: "send-warning",
          titleEn: "Send Warning to Candidate",
          titleAr: "إرسال تحذير للمرشح",
          descriptionEn:
            'Send a **real-time warning message** to the candidate during their exam.\n\nHow to warn:\n1. Open the **session detail page**\n2. Click **"Send Warning"**\n3. Type your warning message (e.g., "Please look at the screen" or "Keep your face visible")\n4. Click **Send**\n\nThe warning appears immediately on the **candidate\'s screen** via SignalR.\n\nWarnings are logged in the **event timeline** for audit purposes.',
          descriptionAr:
            'أرسل **رسالة تحذير فورية** للمرشح أثناء اختباره.\n\nكيفية التحذير:\n1. افتح **صفحة تفاصيل الجلسة**\n2. انقر **"إرسال تحذير"**\n3. اكتب رسالة التحذير (مثال: "يرجى النظر للشاشة" أو "أبقِ وجهك مرئياً")\n4. انقر **إرسال**\n\nيظهر التحذير فوراً على **شاشة المرشح** عبر SignalR.\n\nالتحذيرات تُسجل في **خط الأحداث الزمني** لأغراض التدقيق.',
          imagePlaceholder: "/tutorials/proctor-send-warning.png",
          noteEn:
            "The candidate receives a popup notification with your warning message. They must acknowledge it before continuing.",
          noteAr:
            "يتلقى المرشح إشعاراً منبثقاً برسالة التحذير. يجب عليه الإقرار بها قبل المتابعة.",
        },
        {
          id: "terminate-session",
          titleEn: "Terminate a Session",
          titleAr: "إنهاء جلسة",
          descriptionEn:
            '**Termination** force-ends the candidate\'s exam and **invalidates the attempt**.\n\nHow to terminate:\n1. Open the **session detail page**\n2. Click **"Terminate Session"**\n3. Select a **reason** for termination\n4. Add optional **notes**\n5. **Confirm** the action\n\nThe candidate\'s exam is ended immediately, and the attempt is marked as **"Terminated"**.\n\nThis action is **irreversible** — use with caution.',
          descriptionAr:
            '**الإنهاء** يُنهي اختبار المرشح قسرياً و**يُبطل المحاولة**.\n\nكيفية الإنهاء:\n1. افتح **صفحة تفاصيل الجلسة**\n2. انقر **"إنهاء الجلسة"**\n3. اختر **سبب** الإنهاء\n4. أضف **ملاحظات** اختيارية\n5. **أكّد** الإجراء\n\nيتم إنهاء اختبار المرشح فوراً، وتُعلّم المحاولة كـ**"مُنتهية"**.\n\nهذا الإجراء **غير قابل للعكس** — استخدمه بحذر.',
          imagePlaceholder: "/tutorials/proctor-terminate.png",
          tipEn:
            "After termination, you can review the terminated attempt in Results → Terminated tab. An admin can optionally allow a new attempt.",
          tipAr:
            "بعد الإنهاء، يمكنك مراجعة المحاولة المنتهية في النتائج ← تبويب المنتهية. يمكن للمدير السماح بمحاولة جديدة اختيارياً.",
        },
        {
          id: "add-extra-time",
          titleEn: "Add Extra Time",
          titleAr: "إضافة وقت إضافي",
          descriptionEn:
            'Extend the candidate\'s exam duration if needed (e.g., technical issues, interruptions).\n\nHow to add time:\n1. Open the **session detail page**\n2. Click **"Add Time"**\n3. Enter the number of **additional minutes**\n4. Provide a **reason** for the extension\n5. **Confirm**\n\nThe candidate is notified via SignalR that their time has been extended. The new time appears on their timer immediately.',
          descriptionAr:
            'مدّد مدة اختبار المرشح إذا لزم الأمر (مثال: مشاكل تقنية، انقطاعات).\n\nكيفية إضافة الوقت:\n1. افتح **صفحة تفاصيل الجلسة**\n2. انقر **"إضافة وقت"**\n3. أدخل عدد **الدقائق الإضافية**\n4. قدّم **سبباً** للتمديد\n5. **أكّد**\n\nيُخطر المرشح عبر SignalR بتمديد وقته. يظهر الوقت الجديد على مؤقته فوراً.',
          imagePlaceholder: "/tutorials/proctor-add-time.png",
        },
      ],
      examples: [
        {
          titleEn: "Action Decision Guide",
          titleAr: "دليل قرارات الإجراءات",
          contentEn:
            "When to use each action:\n- **Flag** → Suspicious but not urgent, mark for later review\n- **Warn** → Minor violation, give candidate a chance to correct\n- **Terminate** → Severe cheating detected, immediate action required\n- **Add Time** → Technical issue affected the candidate unfairly",
          contentAr:
            "متى تستخدم كل إجراء:\n- **تعليم** ← مشبوه لكن غير عاجل، علّم للمراجعة لاحقاً\n- **تحذير** ← مخالفة بسيطة، أعطِ المرشح فرصة للتصحيح\n- **إنهاء** ← اكتشاف غش خطير، إجراء فوري مطلوب\n- **إضافة وقت** ← مشكلة تقنية أثرت على المرشح بشكل غير عادل",
        },
      ],
    },
    // ── Section 5: Incident Management ──
    {
      id: "incident-management",
      titleEn: "5. Incident Management",
      titleAr: "5. إدارة الحوادث",
      descriptionEn:
        "Review, decide on, and manage all detected violations and incidents across all proctored sessions.",
      descriptionAr:
        "مراجعة جميع المخالفات والحوادث المكتشفة عبر جميع الجلسات المراقبة والبت فيها وإدارتها.",
      steps: [
        {
          id: "incidents-list",
          titleEn: "Incidents List Page",
          titleAr: "صفحة قائمة الحوادث",
          descriptionEn:
            "Navigate to **Proctor Center → Incidents** to see all incident cases. The list shows:\n- **Candidate name** and exam\n- **Incident type** — TabSwitch, FaceNotDetected, MultiplePersons, AudioDetected, ScreenCapture, Other\n- **Severity** — Low, Medium, High, Critical\n- **Status** — Pending, Reviewed, Dismissed, Flagged\n- **Timestamp** — when the incident occurred\n\nUse **pagination** to browse through large lists and **filters** to narrow results.",
          descriptionAr:
            "انتقل إلى **مركز المراقبة ← الحوادث** لعرض جميع حالات الحوادث. تعرض القائمة:\n- **اسم المرشح** والاختبار\n- **نوع الحادث** — تبديل التبويب، عدم اكتشاف الوجه، أشخاص متعددون، اكتشاف صوت، التقاط شاشة، أخرى\n- **الشدة** — منخفض، متوسط، عالي، حرج\n- **الحالة** — معلّق، مُراجع، مرفوض، معلّم\n- **الوقت** — وقت حدوث الحادث\n\nاستخدم **الترقيم** للتصفح عبر القوائم الكبيرة و**المرشحات** لتضييق النتائج.",
          imagePlaceholder: "/tutorials/proctor-incidents-list.png",
        },
        {
          id: "review-incident",
          titleEn: "Review & Decide on an Incident",
          titleAr: "مراجعة الحادث واتخاذ قرار",
          descriptionEn:
            "Click an incident to open its detail view. Review the evidence and choose a decision:\n\n1. **Dismiss** — the incident is not a real violation (false positive). The case is closed.\n2. **Flag** — the incident is suspicious but not conclusive. The case stays open for further review.\n3. **Terminate** — the incident confirms cheating. The candidate's attempt is **invalidated** immediately.\n\nEach decision requires a **reason/notes** to maintain an audit trail.",
          descriptionAr:
            "انقر على حادث لفتح عرضه التفصيلي. راجع الأدلة واختر قراراً:\n\n1. **رفض** — الحادث ليس مخالفة حقيقية (إيجابي كاذب). تُغلق الحالة.\n2. **تعليم** — الحادث مشبوه لكن غير قاطع. تبقى الحالة مفتوحة لمراجعة إضافية.\n3. **إنهاء** — الحادث يؤكد الغش. تُبطل محاولة المرشح **فوراً**.\n\nكل قرار يتطلب **سبباً/ملاحظات** للحفاظ على مسار تدقيق.",
          imagePlaceholder: "/tutorials/proctor-incident-review.png",
          tipEn:
            "Always review the screenshots and event timeline before making a termination decision. Look at the full context, not just a single event.",
          tipAr:
            "راجع دائماً اللقطات وخط الأحداث الزمني قبل اتخاذ قرار الإنهاء. انظر للسياق الكامل، وليس حدثاً واحداً فقط.",
        },
        {
          id: "create-manual-incident",
          titleEn: "Create a Manual Incident",
          titleAr: "إنشاء حادث يدوي",
          descriptionEn:
            'Proctors can manually create incidents for situations not automatically detected:\n1. Click **"Create Incident"**\n2. Select the **candidate/session**\n3. Choose the **incident type** (or select "Other")\n4. Set the **severity** level\n5. Add a **description** explaining the situation\n6. **Submit**\n\nManual incidents appear in the incident log alongside auto-detected ones.',
          descriptionAr:
            'يمكن للمراقبين إنشاء حوادث يدوية لمواقف لم تُكتشف تلقائياً:\n1. انقر **"إنشاء حادث"**\n2. اختر **المرشح/الجلسة**\n3. اختر **نوع الحادث** (أو اختر "أخرى")\n4. حدد مستوى **الشدة**\n5. أضف **وصفاً** يشرح الموقف\n6. **أرسل**\n\nتظهر الحوادث اليدوية في سجل الحوادث جنباً إلى جنب مع المكتشفة تلقائياً.',
          imagePlaceholder: "/tutorials/proctor-create-incident.png",
        },
      ],
    },
    // ── Section 6: Identity Verification ──
    {
      id: "identity-verification",
      titleEn: "6. Identity Verification",
      titleAr: "6. التحقق من الهوية",
      descriptionEn:
        "Review and approve candidate identity verification requests — facial liveness checks and ID document matching.",
      descriptionAr:
        "مراجعة وقبول طلبات التحقق من هوية المرشحين — فحوصات حيوية الوجه ومطابقة وثائق الهوية.",
      steps: [
        {
          id: "verification-queue",
          titleEn: "Verification Queue",
          titleAr: "قائمة انتظار التحقق",
          descriptionEn:
            "Navigate to **Proctor Center → User Identification** to see all pending verification requests. The page shows:\n- **Candidate name** and photo\n- **Exam** the candidate is attempting\n- **Verification status** — Pending, Approved, Rejected, Flagged\n- **Risk level** — Low, Medium, High\n- **Submission date**\n\nFilter by **status**, **exam**, **risk level**, or **date range** to find specific verifications.",
          descriptionAr:
            "انتقل إلى **مركز المراقبة ← التحقق من الهوية** لعرض جميع طلبات التحقق المعلقة. تعرض الصفحة:\n- **اسم المرشح** والصورة\n- **الاختبار** الذي يحاول المرشح تقديمه\n- **حالة التحقق** — معلّق، مقبول، مرفوض، معلّم\n- **مستوى المخاطر** — منخفض، متوسط، عالي\n- **تاريخ التقديم**\n\nصفّي حسب **الحالة**، **الاختبار**، **مستوى المخاطر**، أو **نطاق التاريخ** للعثور على تحققات محددة.",
          imagePlaceholder: "/tutorials/proctor-verification-queue.png",
        },
        {
          id: "review-verification",
          titleEn: "Review a Verification",
          titleAr: "مراجعة تحقق",
          descriptionEn:
            "Click a verification to open its detail. You will see:\n- **Selfie photo** submitted by the candidate\n- **ID document photo** (if required)\n- **Liveness check result** — whether the facial liveness detection passed\n- **Match confidence** — how well the selfie matches the ID photo\n\nActions available:\n1. **Approve** — verification passed, candidate can proceed\n2. **Reject** — verification failed, candidate is blocked\n3. **Flag** — mark for manual review by another proctor",
          descriptionAr:
            "انقر على تحقق لفتح تفاصيله. سترى:\n- **صورة ذاتية** قدمها المرشح\n- **صورة وثيقة الهوية** (إذا كانت مطلوبة)\n- **نتيجة فحص الحيوية** — هل نجح اكتشاف حيوية الوجه\n- **ثقة المطابقة** — مدى تطابق الصورة الذاتية مع صورة الهوية\n\nالإجراءات المتاحة:\n1. **قبول** — نجح التحقق، يمكن للمرشح المتابعة\n2. **رفض** — فشل التحقق، يُحظر المرشح\n3. **تعليم** — علّم للمراجعة اليدوية من مراقب آخر",
          imagePlaceholder: "/tutorials/proctor-verification-review.png",
          tipEn:
            "Pay close attention to the liveness check result — it ensures the candidate is a real person and not using a photo or video of someone else.",
          tipAr:
            "انتبه جيداً لنتيجة فحص الحيوية — يضمن أن المرشح شخص حقيقي وليس يستخدم صورة أو فيديو لشخص آخر.",
        },
        {
          id: "bulk-verification",
          titleEn: "Bulk Verification Actions",
          titleAr: "إجراءات التحقق الجماعية",
          descriptionEn:
            "For efficiency, you can perform **batch actions** on multiple verifications:\n1. **Select** multiple verifications using checkboxes\n2. Click the **bulk action** dropdown\n3. Choose **Approve All**, **Reject All**, or **Flag All**\n4. **Confirm** the action\n\nBulk actions save time when processing large numbers of verifications for the same exam.",
          descriptionAr:
            "لتحقيق الكفاءة، يمكنك تنفيذ **إجراءات جماعية** على تحققات متعددة:\n1. **حدد** تحققات متعددة باستخدام خانات الاختيار\n2. انقر على قائمة **الإجراءات الجماعية** المنسدلة\n3. اختر **قبول الكل**، **رفض الكل**، أو **تعليم الكل**\n4. **أكّد** الإجراء\n\nالإجراءات الجماعية توفر الوقت عند معالجة أعداد كبيرة من التحققات لنفس الاختبار.",
          imagePlaceholder: "/tutorials/proctor-bulk-verification.png",
        },
      ],
    },
    // ── Section 7: Video & Recording Playback ──
    {
      id: "video-recording",
      titleEn: "7. Video & Recording Playback",
      titleAr: "7. تشغيل الفيديو والتسجيلات",
      descriptionEn:
        "Review recorded video from completed sessions — webcam footage, screen streams, and associated event markers.",
      descriptionAr:
        "مراجعة الفيديو المسجل من الجلسات المكتملة — لقطات الكاميرا، بث الشاشة، وعلامات الأحداث المرتبطة.",
      steps: [
        {
          id: "webcam-playback",
          titleEn: "Candidate Video Playback",
          titleAr: "تشغيل فيديو المرشح",
          descriptionEn:
            "Navigate to a candidate's **video page** to review their webcam recording:\n- **Video player** with standard controls (play, pause, seek, speed)\n- **Chunk-based playback** — recordings are split into segments for efficient loading\n- **Event markers** on the timeline — shows exactly when violations occurred\n- **Screenshots** captured during the session\n\nUse event markers to jump directly to violation moments.",
          descriptionAr:
            "انتقل إلى **صفحة فيديو** المرشح لمراجعة تسجيل كاميرته:\n- **مشغّل فيديو** بأزرار قياسية (تشغيل، إيقاف، تمرير، سرعة)\n- **تشغيل مقسّم** — التسجيلات مقسمة لأجزاء للتحميل الفعال\n- **علامات أحداث** على الخط الزمني — تعرض بالضبط متى وقعت المخالفات\n- **لقطات** ملتقطة أثناء الجلسة\n\nاستخدم علامات الأحداث للقفز مباشرة للحظات المخالفة.",
          imagePlaceholder: "/tutorials/proctor-video-playback.png",
        },
        {
          id: "screen-stream",
          titleEn: "Screen Stream Gallery",
          titleAr: "معرض بث الشاشة",
          descriptionEn:
            "Navigate to a candidate's **screen stream page** to review captured screen/application windows:\n- **Screenshot gallery** — all captured screen images in chronological order\n- **Timestamps** — each capture is timestamped\n- **Click to enlarge** — view full-size screenshots\n\nScreen captures help identify if the candidate was using unauthorized applications or browsing prohibited content.",
          descriptionAr:
            "انتقل إلى **صفحة بث شاشة** المرشح لمراجعة نوافذ الشاشة/التطبيقات الملتقطة:\n- **معرض لقطات** — جميع صور الشاشة الملتقطة بترتيب زمني\n- **أوقات** — كل التقاط مؤرخ\n- **انقر للتكبير** — عرض لقطات بالحجم الكامل\n\nتساعد لقطات الشاشة في تحديد ما إذا كان المرشح يستخدم تطبيقات غير مصرح بها أو يتصفح محتوى محظوراً.",
          imagePlaceholder: "/tutorials/proctor-screen-stream.png",
        },
        {
          id: "recording-detail",
          titleEn: "Recording Detail Page",
          titleAr: "صفحة تفاصيل التسجيل",
          descriptionEn:
            "The **recording detail page** provides a comprehensive view of a completed attempt recording:\n- **Full video** with playback controls\n- **Metadata** — recording duration, file size, format\n- **Associated events** — all violations linked to this recording\n- **Screenshots** — snapshots captured during matching time periods\n- **Retention info** — how long the recording will be kept\n\nThis page is ideal for post-exam review and evidence gathering.",
          descriptionAr:
            "توفر **صفحة تفاصيل التسجيل** عرضاً شاملاً لتسجيل محاولة مكتملة:\n- **فيديو كامل** مع أزرار التشغيل\n- **بيانات وصفية** — مدة التسجيل، حجم الملف، التنسيق\n- **أحداث مرتبطة** — جميع المخالفات المرتبطة بهذا التسجيل\n- **لقطات** — صور ملتقطة خلال فترات زمنية مطابقة\n- **معلومات الاحتفاظ** — مدة حفظ التسجيل\n\nهذه الصفحة مثالية للمراجعة بعد الاختبار وجمع الأدلة.",
          imagePlaceholder: "/tutorials/proctor-recording-detail.png",
        },
      ],
    },
    // ── Section 8: Violation Events & Auto-Termination ──
    {
      id: "violation-events",
      titleEn: "8. Violation Events & Auto-Termination",
      titleAr: "8. أحداث المخالفات والإنهاء التلقائي",
      descriptionEn:
        "Understand how violation events are detected, counted, and how auto-termination protects exam integrity when a candidate exceeds the allowed violation limit.",
      descriptionAr:
        "فهم كيفية اكتشاف أحداث المخالفات وعدّها، وكيف يحمي الإنهاء التلقائي نزاهة الاختبار عند تجاوز المرشح حد المخالفات المسموح.",
      steps: [
        {
          id: "violation-types",
          titleEn: "All Violation Event Types",
          titleAr: "جميع أنواع أحداث المخالفات",
          descriptionEn:
            "The system detects **13 violation types** split into two categories:\n\n**Soft Proctoring (Security/Behavioral) — 6 events:**\n- **Tab Switched** — candidate switched to another browser tab\n- **Window Blur** — browser window lost focus\n- **Fullscreen Exited** — candidate exited fullscreen mode\n- **Copy Attempt** — candidate tried to copy content (blocked)\n- **Paste Attempt** — candidate tried to paste content (blocked)\n- **Right-Click Attempt** — candidate tried to right-click (blocked)\n\n**Advanced Proctoring (Camera/AI) — 7 events:**\n- **Face Not Detected** — webcam lost sight of the candidate for 2+ seconds\n- **Multiple Faces Detected** — more than one face in the camera frame\n- **Face Out of Frame** — candidate face moved too far from center\n- **Head Turn Detected** — head turned beyond 30° yaw or 25° pitch\n- **Camera Blocked** — webcam view is dark or obstructed\n- **Webcam Denied** — candidate denied camera permission\n- **Snapshot Failed** — periodic snapshot upload failed",
          descriptionAr:
            "يكتشف النظام **13 نوع مخالفة** مقسمة إلى فئتين:\n\n**المراقبة الأساسية (أمان/سلوك) — 6 أحداث:**\n- **تبديل التبويب** — المرشح انتقل لتبويب متصفح آخر\n- **فقدان تركيز النافذة** — نافذة المتصفح فقدت التركيز\n- **خروج من ملء الشاشة** — المرشح خرج من وضع ملء الشاشة\n- **محاولة نسخ** — المرشح حاول نسخ محتوى (تم حظره)\n- **محاولة لصق** — المرشح حاول لصق محتوى (تم حظره)\n- **محاولة نقر يمين** — المرشح حاول النقر بالزر الأيمن (تم حظره)\n\n**المراقبة المتقدمة (كاميرا/ذكاء اصطناعي) — 7 أحداث:**\n- **عدم اكتشاف الوجه** — الكاميرا فقدت رؤية المرشح لأكثر من ثانيتين\n- **اكتشاف وجوه متعددة** — أكثر من وجه في إطار الكاميرا\n- **الوجه خارج الإطار** — وجه المرشح ابتعد كثيراً عن المركز\n- **اكتشاف التفات الرأس** — الرأس التفت أكثر من 30° أفقي أو 25° عمودي\n- **حجب الكاميرا** — عرض الكاميرا مظلم أو مسدود\n- **رفض الكاميرا** — المرشح رفض صلاحية الكاميرا\n- **فشل اللقطة** — فشل رفع اللقطة الدورية",
          imagePlaceholder: "/tutorials/proctor-violation-types.png",
        },
        {
          id: "countable-violations",
          titleEn: "Countable vs Non-Countable Violations",
          titleAr: "المخالفات المحسوبة مقابل غير المحسوبة",
          descriptionEn:
            "Not all violations count toward auto-termination. Only **4 critical types** are **countable**:\n\n1. **Tab Switched** — intentional act of leaving the exam\n2. **Face Not Detected** — candidate moved away from camera\n3. **Multiple Faces Detected** — someone else is present\n4. **Camera Blocked** — intentional obstruction of camera\n\nThe remaining 9 event types are **logged for review** but do **not** increment the violation counter. This prevents false positives from minor or accidental events.\n\nProctors can see both the **countable violation count** and **total events** on each session card.",
          descriptionAr:
            "ليست كل المخالفات تُحسب تجاه الإنهاء التلقائي. فقط **4 أنواع حرجة** هي **محسوبة**:\n\n1. **تبديل التبويب** — فعل مُتعمد لمغادرة الاختبار\n2. **عدم اكتشاف الوجه** — المرشح ابتعد عن الكاميرا\n3. **اكتشاف وجوه متعددة** — شخص آخر موجود\n4. **حجب الكاميرا** — سد الكاميرا عمداً\n\nأنواع الأحداث التسعة المتبقية تُسجّل **للمراجعة** لكن **لا** تزيد عداد المخالفات. هذا يمنع الإيجابيات الكاذبة من أحداث بسيطة أو عرضية.\n\nيمكن للمراقبين رؤية كل من **عدد المخالفات المحسوبة** و**إجمالي الأحداث** في كل بطاقة جلسة.",
          imagePlaceholder: "/tutorials/proctor-countable-violations.png",
          tipEn:
            "Countable violations are the ones most likely to indicate cheating. Non-countable events like window blur or right-click may be accidental.",
          tipAr:
            "المخالفات المحسوبة هي الأكثر احتمالاً للإشارة إلى الغش. الأحداث غير المحسوبة مثل فقدان تركيز النافذة أو النقر الأيمن قد تكون عرضية.",
        },
        {
          id: "auto-termination-config",
          titleEn: "Configuring Auto-Termination",
          titleAr: "إعداد الإنهاء التلقائي",
          descriptionEn:
            'Auto-termination is configured **per exam** in the **Exam Configuration → Security** tab:\n\n1. Navigate to **Exam Management** → select your exam → **Configuration**\n2. Go to the **Security** tab\n3. Find the **"Max Violation Warnings"** field (orange warning icon)\n4. Set the maximum number of countable violations allowed:\n   - **Range:** 0 – 100\n   - **Default:** 10\n   - **Set to 0** = disables auto-termination (violations are still logged)\n   - **Example:** Set to 5 = exam terminates after 5 countable violations\n\nThe setting applies to **all candidates** taking that exam.',
          descriptionAr:
            'يُعدّ الإنهاء التلقائي **لكل اختبار** في تبويب **إعدادات الاختبار ← الأمان**:\n\n1. انتقل إلى **إدارة الاختبارات** ← اختر اختبارك ← **الإعدادات**\n2. اذهب إلى تبويب **الأمان**\n3. ابحث عن حقل **"حد التحذيرات للمخالفات"** (أيقونة تحذير برتقالية)\n4. حدد العدد الأقصى للمخالفات المحسوبة المسموحة:\n   - **النطاق:** 0 – 100\n   - **الافتراضي:** 10\n   - **القيمة 0** = تعطيل الإنهاء التلقائي (المخالفات تُسجّل فقط)\n   - **مثال:** القيمة 5 = ينتهي الاختبار بعد 5 مخالفات محسوبة\n\nيُطبق الإعداد على **جميع المرشحين** الذين يقدمون ذلك الاختبار.',
          imagePlaceholder: "/tutorials/proctor-auto-termination-config.png",
          noteEn:
            "Setting this value too low may cause false terminations from accidental events. A value of 5–10 is recommended for most exams.",
          noteAr:
            "تعيين هذه القيمة منخفضة جداً قد يسبب إنهاءات خاطئة من أحداث عرضية. يُوصى بقيمة 5–10 لمعظم الاختبارات.",
        },
        {
          id: "auto-termination-flow",
          titleEn: "How Auto-Termination Works",
          titleAr: "كيف يعمل الإنهاء التلقائي",
          descriptionEn:
            'When auto-termination is enabled, the system follows this sequence:\n\n**During the exam:**\n- Each countable violation increments the counter\n- The proctor dashboard shows the live count (e.g., 3/5)\n\n**At violation count = limit – 1 (last warning):**\n- A **red blocking dialog** appears on the candidate\'s screen\n- Message: **"FINAL WARNING — You have reached X of Y allowed violations. The NEXT violation will automatically terminate your exam."**\n- The candidate must **acknowledge** before continuing\n\n**At violation count = limit (termination):**\n- The exam is **terminated immediately**\n- The attempt is marked as **"Terminated"**\n- Reason logged: **"Auto-terminated: exceeded X violations"**\n- The candidate is **redirected** to the My Exams page\n- The proctor receives a **real-time SignalR notification**',
          descriptionAr:
            'عند تفعيل الإنهاء التلقائي، يتبع النظام هذا التسلسل:\n\n**أثناء الاختبار:**\n- كل مخالفة محسوبة تزيد العداد\n- لوحة المراقبة تعرض العدّ الحي (مثلاً 3/5)\n\n**عند عدد المخالفات = الحد – 1 (تحذير أخير):**\n- يظهر **مربع حوار أحمر محظور** على شاشة المرشح\n- رسالة: **"تحذير أخير — لقد وصلت إلى X من Y مخالفات مسموحة. المخالفة التالية ستُنهي اختبارك تلقائياً."**\n- يجب على المرشح **الإقرار** قبل المتابعة\n\n**عند عدد المخالفات = الحد (إنهاء):**\n- يُنهى الاختبار **فوراً**\n- تُعلّم المحاولة كـ**"منتهية"**\n- السبب المسجل: **"إنهاء تلقائي: تجاوز X مخالفة"**\n- يُعاد توجيه المرشح إلى صفحة اختباراتي\n- يتلقى المراقب **إشعار SignalR فوري**',
          imagePlaceholder: "/tutorials/proctor-auto-termination-flow.png",
        },
        {
          id: "smart-monitoring-ai",
          titleEn: "Smart Monitoring AI Detection",
          titleAr: "اكتشاف المراقبة الذكية بالذكاء الاصطناعي",
          descriptionEn:
            "Advanced violation events (camera-based) are detected by the **Smart Monitoring AI** running client-side using **MediaPipe FaceLandmarker**:\n\n- **Detection interval:** analyzes the camera feed every **2 seconds**\n- **Continuous threshold:** an anomaly must persist for **2 consecutive seconds** before triggering a violation\n- **Cooldown period:** **30 seconds** between repeated violations of the same type (prevents spam)\n- **Head turn thresholds:** yaw > **30°** or pitch > **25°** triggers HeadTurnDetected\n- **Camera blocked:** dark frame (brightness < 25) with low variance (< 15)\n- **Out of frame:** face bounding box center is **30%** or more from the image center\n\nAll detection runs **locally in the browser** — no video is sent to external AI servers for violation detection.",
          descriptionAr:
            "تُكتشف أحداث المخالفات المتقدمة (المعتمدة على الكاميرا) بواسطة **المراقبة الذكية AI** التي تعمل من جانب العميل باستخدام **MediaPipe FaceLandmarker**:\n\n- **فترة الاكتشاف:** تحلل بث الكاميرا كل **ثانيتين**\n- **حد الاستمرارية:** يجب أن يستمر الشذوذ **ثانيتين متتاليتين** قبل إطلاق مخالفة\n- **فترة التهدئة:** **30 ثانية** بين المخالفات المتكررة من نفس النوع (يمنع الإزعاج)\n- **حدود التفات الرأس:** الالتفاف > **30°** أو الميل > **25°** يُطلق اكتشاف التفات الرأس\n- **حجب الكاميرا:** إطار مظلم (سطوع < 25) بتباين منخفض (< 15)\n- **خارج الإطار:** مركز مربع الوجه يبعد **30%** أو أكثر عن مركز الصورة\n\nجميع الاكتشاف يعمل **محلياً في المتصفح** — لا يُرسل فيديو لخوادم AI خارجية لاكتشاف المخالفات.",
          imagePlaceholder: "/tutorials/proctor-smart-monitoring.png",
          tipEn:
            "Since detection runs client-side, it works even with poor internet connections. Only the violation event (not the video) is sent to the server.",
          tipAr:
            "بما أن الاكتشاف يعمل من جانب العميل، فإنه يعمل حتى مع اتصالات الإنترنت الضعيفة. فقط حدث المخالفة (وليس الفيديو) يُرسل للخادم.",
        },
        {
          id: "violation-monitoring-proctor",
          titleEn: "Monitoring Violations as a Proctor",
          titleAr: "مراقبة المخالفات كمراقب",
          descriptionEn:
            'Proctors can monitor violations in real-time from multiple places:\n\n- **Dashboard session cards** — each card shows the **countable violation count** (e.g., "3/5") and **total events**\n- **Session detail page** — the **event timeline** lists every violation with timestamp, type, and severity\n- **Incidents page** — review and decide on flagged violations\n- **Real-time updates** — new violations appear instantly via **SignalR** without refreshing\n\nWhen a session reaches the **last warning** stage, the session card is highlighted. When **auto-termination** triggers, the proctor receives an immediate notification.',
          descriptionAr:
            'يمكن للمراقبين مراقبة المخالفات في الوقت الفعلي من أماكن متعددة:\n\n- **بطاقات جلسات اللوحة** — كل بطاقة تعرض **عدد المخالفات المحسوبة** (مثلاً "3/5") و**إجمالي الأحداث**\n- **صفحة تفاصيل الجلسة** — **الخط الزمني** يسرد كل مخالفة بالوقت والنوع والشدة\n- **صفحة الحوادث** — مراجعة المخالفات المعلّمة واتخاذ قرارات\n- **تحديثات فورية** — المخالفات الجديدة تظهر فوراً عبر **SignalR** بدون تحديث\n\nعندما تصل الجلسة لمرحلة **التحذير الأخير**، تُبرز بطاقة الجلسة. عند تشغيل **الإنهاء التلقائي**، يتلقى المراقب إشعاراً فورياً.',
          imagePlaceholder: "/tutorials/proctor-violation-monitoring.png",
        },
      ],
      examples: [
        {
          titleEn: "Auto-Termination Flow",
          titleAr: "سير عمل الإنهاء التلقائي",
          contentEn:
            "Configuration: Max Violations = 5\n\nViolation 1: Tab Switched → Counter: 1/5 → Toast shown to candidate\nViolation 2: Face Not Detected → Counter: 2/5 → Toast shown\nViolation 3: Multiple Faces → Counter: 3/5 → Toast shown\nViolation 4: Tab Switched → Counter: 4/5 → RED FINAL WARNING dialog (must acknowledge)\nViolation 5: Camera Blocked → Counter: 5/5 → EXAM TERMINATED instantly\n\nResult: Attempt marked as Terminated → Proctor notified via SignalR → Candidate redirected",
          contentAr:
            "الإعداد: حد المخالفات = 5\n\nمخالفة 1: تبديل التبويب ← العداد: 1/5 ← إشعار للمرشح\nمخالفة 2: عدم اكتشاف الوجه ← العداد: 2/5 ← إشعار\nمخالفة 3: وجوه متعددة ← العداد: 3/5 ← إشعار\nمخالفة 4: تبديل التبويب ← العداد: 4/5 ← مربع حوار تحذير نهائي أحمر (يجب الإقرار)\nمخالفة 5: حجب الكاميرا ← العداد: 5/5 ← إنهاء الاختبار فوراً\n\nالنتيجة: المحاولة تُعلّم كمنتهية ← إشعار المراقب عبر SignalR ← توجيه المرشح",
        },
      ],
    },
    // ── Section 9: Proctor Logs ──
    {
      id: "proctor-logs",
      titleEn: "9. Proctor Logs",
      titleAr: "9. سجلات المراقبة",
      descriptionEn:
        "View detailed system logs for all proctor-related activities — session actions, verifications, incidents, and reviews.",
      descriptionAr:
        "عرض سجلات النظام التفصيلية لجميع أنشطة المراقبة — إجراءات الجلسات، التحققات، الحوادث، والمراجعات.",
      steps: [
        {
          id: "access-proctor-logs",
          titleEn: "Accessing Proctor Logs",
          titleAr: "الوصول إلى سجلات المراقبة",
          descriptionEn:
            "Navigate to **System Logs → Proctor Logs** in the sidebar. The logs page shows:\n- **Activity type** — Session Started, Warning Sent, Session Terminated, Verification Approved, Incident Created, etc.\n- **Performed by** — which proctor took the action\n- **Target** — which candidate/session was affected\n- **Timestamp** — exact date and time\n- **Details** — additional context and notes\n\nLogs are paginated and can be filtered by **date range**, **activity type**, and **proctor name**.",
          descriptionAr:
            "انتقل إلى **سجلات النظام ← سجلات المراقبة** في القائمة الجانبية. تعرض صفحة السجلات:\n- **نوع النشاط** — بدء جلسة، إرسال تحذير، إنهاء جلسة، قبول التحقق، إنشاء حادث، إلخ.\n- **نفّذ بواسطة** — أي مراقب اتخذ الإجراء\n- **الهدف** — أي مرشح/جلسة تأثرت\n- **الوقت** — التاريخ والوقت الدقيق\n- **التفاصيل** — سياق وملاحظات إضافية\n\nالسجلات مرقّمة ويمكن تصفيتها حسب **نطاق التاريخ**، **نوع النشاط**، و**اسم المراقب**.",
          imagePlaceholder: "/tutorials/proctor-logs.png",
          tipEn:
            "Proctor logs provide a complete audit trail. Use them to review past proctor decisions or investigate disputed incidents.",
          tipAr:
            "توفر سجلات المراقبة مسار تدقيق كامل. استخدمها لمراجعة قرارات المراقب السابقة أو التحقيق في الحوادث المتنازع عليها.",
        },
      ],
    },
    // ── Section 10: Best Practices ──
    {
      id: "best-practices",
      titleEn: "10. Best Practices & Tips",
      titleAr: "10. أفضل الممارسات والنصائح",
      descriptionEn: "Recommended workflows and tips for effective proctoring.",
      descriptionAr: "سير عمل موصى به ونصائح للمراقبة الفعالة.",
      steps: [
        {
          id: "monitoring-workflow",
          titleEn: "Recommended Monitoring Workflow",
          titleAr: "سير عمل المراقبة الموصى به",
          descriptionEn:
            "Follow this workflow for efficient proctoring:\n1. **Start** — open the Proctor Dashboard and check the AI Triage recommendations\n2. **Prioritize** — focus on sessions marked as **Critical** or **High** risk first\n3. **Review** — open each flagged session, check the live video and event timeline\n4. **Act** — send warnings for minor issues, terminate for confirmed cheating\n5. **Document** — always add notes when making decisions for audit purposes\n6. **Verify** — check the Identity Verification queue and process pending requests\n7. **Log review** — periodically check Proctor Logs for any missed actions",
          descriptionAr:
            "اتبع سير العمل هذا للمراقبة الفعالة:\n1. **ابدأ** — افتح لوحة المراقبة وتحقق من توصيات فرز AI\n2. **رتّب الأولويات** — ركّز على الجلسات ذات المخاطر **الحرجة** أو **العالية** أولاً\n3. **راجع** — افتح كل جلسة معلّمة، تحقق من الفيديو المباشر وخط الأحداث الزمني\n4. **تصرّف** — أرسل تحذيرات للمشاكل البسيطة، أنهِ للغش المؤكد\n5. **وثّق** — أضف دائماً ملاحظات عند اتخاذ القرارات لأغراض التدقيق\n6. **تحقق** — افحص قائمة التحقق من الهوية وعالج الطلبات المعلقة\n7. **راجع السجلات** — تحقق دورياً من سجلات المراقبة لأي إجراءات فائتة",
          imagePlaceholder: "/tutorials/proctor-workflow.png",
        },
        {
          id: "tips-and-warnings",
          titleEn: "Important Tips",
          titleAr: "نصائح مهمة",
          descriptionEn:
            "Key tips for proctors:\n- **Never terminate without reviewing evidence** — always check screenshots, video, and timeline before ending a session\n- **Use warnings first** — give candidates a chance to correct behavior before escalating\n- **Check the full context** — a single event can be a false positive (e.g., face not detected due to lighting)\n- **Process identity verifications promptly** — candidates are blocked until verified\n- **Use AI Triage** — let the system prioritize sessions for you instead of checking manually\n- **Document everything** — notes and reasons create a defensible audit trail",
          descriptionAr:
            "نصائح رئيسية للمراقبين:\n- **لا تُنهِ أبداً دون مراجعة الأدلة** — تحقق دائماً من اللقطات والفيديو والخط الزمني قبل إنهاء جلسة\n- **استخدم التحذيرات أولاً** — أعطِ المرشحين فرصة لتصحيح سلوكهم قبل التصعيد\n- **تحقق من السياق الكامل** — حدث واحد قد يكون إيجابياً كاذباً (مثل عدم اكتشاف الوجه بسبب الإضاءة)\n- **عالج تحققات الهوية فوراً** — المرشحون محظورون حتى يتم التحقق\n- **استخدم فرز AI** — دع النظام يرتب أولويات الجلسات بدلاً من الفحص اليدوي\n- **وثّق كل شيء** — الملاحظات والأسباب تنشئ مسار تدقيق قابل للدفاع عنه",
          imagePlaceholder: "/tutorials/proctor-tips.png",
          noteEn:
            "Remember: proctoring decisions can be reviewed and audited later. Always act professionally and document your reasoning.",
          noteAr:
            "تذكر: قرارات المراقبة يمكن مراجعتها وتدقيقها لاحقاً. تصرف دائماً باحترافية ووثّق أسبابك.",
        },
      ],
      examples: [
        {
          titleEn: "Proctoring Workflow Summary",
          titleAr: "ملخص سير عمل المراقبة",
          contentEn:
            "Exam Starts → Candidates Connect → Dashboard Populates → AI Calculates Risk Scores → Proctor Reviews Triage → Opens High-Risk Sessions → Reviews Evidence → Takes Action (Warn/Flag/Terminate) → Logs Action\n\nIdentity Flow: Candidate Submits Selfie + ID → Liveness Check → Proctor Reviews → Approve/Reject/Flag → Candidate Proceeds or Blocked\n\nPost-Exam: Review Recordings → Check Incident Reports → Generate AI Report → Document Findings",
          contentAr:
            "بدء الاختبار ← اتصال المرشحين ← تعبئة اللوحة ← AI يحسب نقاط المخاطر ← المراقب يراجع الفرز ← يفتح الجلسات عالية المخاطر ← يراجع الأدلة ← يتخذ إجراء (تحذير/تعليم/إنهاء) ← يسجل الإجراء\n\nسير الهوية: المرشح يقدم صورة ذاتية + هوية ← فحص الحيوية ← المراقب يراجع ← قبول/رفض/تعليم ← المرشح يتابع أو يُحظر\n\nبعد الاختبار: مراجعة التسجيلات ← فحص تقارير الحوادث ← إنشاء تقرير AI ← توثيق النتائج",
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// CANDIDATE MODULE TUTORIAL
// ────────────────────────────────────────────────────────

export const candidateTutorial: TutorialModule = {
  id: "candidates",
  slug: "candidates",
  titleEn: "Candidate Management",
  titleAr: "إدارة المرشحين",
  descriptionEn:
    "Learn how to manage candidates — batch organization, candidate data (shared across all departments), exam assignment, exam operations, and detailed exam attempt review.",
  descriptionAr:
    "تعلّم كيفية إدارة المرشحين — تنظيم الدفعات، بيانات المرشحين (مشتركة بين جميع الأقسام)، تعيين الاختبارات، عمليات الاختبار، ومراجعة تفاصيل محاولات الاختبار.",
  iconName: "Users",
  videoPlaceholder: "/tutorials/candidates-overview.mp4",
  sections: [
    // ── Section 1: Overview & Shared Data ──
    {
      id: "candidates-overview",
      titleEn: "1. Overview & Key Concepts",
      titleAr: "1. نظرة عامة والمفاهيم الأساسية",
      descriptionEn:
        "Understand the Candidate Management module, its 5 sub-pages, and the important concept of shared candidate data across departments.",
      descriptionAr:
        "فهم وحدة إدارة المرشحين وصفحاتها الفرعية الخمس والمفهوم المهم لبيانات المرشحين المشتركة بين الأقسام.",
      steps: [
        {
          id: "what-is-candidate-module",
          titleEn: "What Is Candidate Management?",
          titleAr: "ما هي إدارة المرشحين؟",
          descriptionEn:
            "The **Candidate Management** module is the central hub for managing all exam candidates. It provides **5 dedicated sub-pages** accessible from the sidebar:\n\n1. **Batch** — organize candidates into logical groups\n2. **Candidates Data** — register, import, and manage individual candidates\n3. **Assign to Exam** — bulk-assign candidates to published exams with scheduling\n4. **Exam Operations** — admin interventions (new attempts, add time, terminate)\n5. **Candidate Exam Details** — forensic review of any exam attempt",
          descriptionAr:
            "وحدة **إدارة المرشحين** هي المحور المركزي لإدارة جميع المرشحين للاختبار. توفر **5 صفحات فرعية مخصصة** يمكن الوصول إليها من القائمة الجانبية:\n\n1. **الدفعات** — تنظيم المرشحين في مجموعات منطقية\n2. **بيانات المرشحين** — تسجيل واستيراد وإدارة المرشحين الأفراد\n3. **تعيين اختبار** — تعيين المرشحين بشكل جماعي للاختبارات المنشورة مع الجدولة\n4. **عمليات الاختبار** — تدخلات إدارية (محاولات جديدة، إضافة وقت، إنهاء)\n5. **تفاصيل اختبار المرشح** — مراجعة شاملة لأي محاولة اختبار",
          imagePlaceholder: "/tutorials/candidates-overview.png",
          tipEn:
            "Access roles: **Admin** and **Instructor** can access all Candidate Management pages. Other roles do not have access.",
          tipAr:
            "أدوار الوصول: **المدير** و**المدرّس** يمكنهما الوصول إلى جميع صفحات إدارة المرشحين. الأدوار الأخرى لا تملك الوصول.",
        },
        {
          id: "shared-candidate-data",
          titleEn: "Shared Candidate Data Across Departments",
          titleAr: "بيانات المرشحين المشتركة بين الأقسام",
          descriptionEn:
            "**Important Concept:** Candidate data in SmartExam is **shared across all departments**. This means:\n\n- A candidate registered once can **take exams from any department**\n- There is **no need to re-register** a candidate for each department\n- **Batches** can be used to organize candidates into department-specific groups if needed\n- Candidate **email and credentials** remain the same across the entire system\n- Any admin or instructor from any department can **view and manage** the same candidate pool\n\nThis shared model ensures:\n✓ No duplicate candidate records\n✓ Unified candidate experience across departments\n✓ Simplified administration — register once, assign anywhere\n✓ Consistent performance tracking across all exams",
          descriptionAr:
            "**مفهوم مهم:** بيانات المرشحين في SmartExam **مشتركة بين جميع الأقسام**. هذا يعني:\n\n- المرشح المسجل مرة واحدة يمكنه **أداء اختبارات من أي قسم**\n- **لا حاجة لإعادة تسجيل** المرشح لكل قسم\n- يمكن استخدام **الدفعات** لتنظيم المرشحين في مجموعات خاصة بالأقسام عند الحاجة\n- **بريد المرشح وبيانات الدخول** تبقى نفسها في كامل النظام\n- أي مدير أو مدرّس من أي قسم يمكنه **عرض وإدارة** نفس مجموعة المرشحين\n\nهذا النموذج المشترك يضمن:\n✓ عدم تكرار سجلات المرشحين\n✓ تجربة موحدة للمرشح عبر الأقسام\n✓ إدارة مبسطة — سجّل مرة واحدة، عيّن في أي مكان\n✓ تتبع أداء متسق عبر جميع الاختبارات",
          imagePlaceholder: "/tutorials/candidates-shared-data.png",
          noteEn:
            "One candidate → one account → exams from any department. This is by design to avoid duplicate records and ensure a unified experience.",
          noteAr:
            "مرشح واحد ← حساب واحد ← اختبارات من أي قسم. هذا بالتصميم لتجنب السجلات المكررة وضمان تجربة موحدة.",
        },
      ],
      examples: [
        {
          titleEn: "Typical Candidate Workflow",
          titleAr: "سير عمل المرشح النموذجي",
          contentEn:
            'Register Candidate → Add to Batch (optional) → Assign to Exam → Candidate Takes Exam → Review in Exam Details\n\n**Cross-Department Example:**\n1. Admin in **HR Department** registers "Ahmed" with email ahmed@company.com\n2. Instructor in **IT Department** assigns Ahmed to "Network Security Exam"\n3. Instructor in **Finance Department** assigns Ahmed to "Accounting Basics Exam"\n4. Ahmed uses the **same login** to access both exams\n5. All results are tracked under **one unified profile**',
          contentAr:
            'تسجيل المرشح ← إضافة إلى دفعة (اختياري) ← تعيين اختبار ← المرشح يؤدي الاختبار ← مراجعة في تفاصيل الاختبار\n\n**مثال عبر الأقسام:**\n1. المدير في **قسم الموارد البشرية** يسجل "أحمد" بالبريد ahmed@company.com\n2. المدرّس في **قسم تقنية المعلومات** يعين أحمد لـ"اختبار أمن الشبكات"\n3. المدرّس في **قسم المالية** يعين أحمد لـ"اختبار أساسيات المحاسبة"\n4. أحمد يستخدم **نفس بيانات الدخول** للوصول لكلا الاختبارين\n5. جميع النتائج تُتبع تحت **ملف شخصي موحد**',
        },
      ],
    },
    // ── Section 2: Batch Management ──
    {
      id: "batch-management",
      titleEn: "2. Batch Management",
      titleAr: "2. إدارة الدفعات",
      descriptionEn:
        "Create and manage candidate batches — organize candidates into logical groups for easier management and bulk operations.",
      descriptionAr:
        "إنشاء وإدارة دفعات المرشحين — تنظيم المرشحين في مجموعات منطقية لتسهيل الإدارة والعمليات الجماعية.",
      steps: [
        {
          id: "batch-list-view",
          titleEn: "Batch List View",
          titleAr: "عرض قائمة الدفعات",
          descriptionEn:
            "Navigate to **Candidates** → **Batch** from the sidebar. The batch list page shows all existing batches in a **paginated table** (20 per page) with the following columns:\n\n- **#** — row index\n- **Name** — batch name\n- **Description** — batch description\n- **Candidates** — number of candidates in the batch (shown as a badge)\n- **Status** — Active or Inactive (color-coded badge)\n- **Created** — creation date\n- **Actions** — dropdown with available operations",
          descriptionAr:
            "انتقل إلى **المرشحون** ← **الدفعات** من القائمة الجانبية. تعرض صفحة قائمة الدفعات جميع الدفعات الموجودة في **جدول مُقسّم** (20 لكل صفحة) بالأعمدة التالية:\n\n- **#** — رقم الصف\n- **الاسم** — اسم الدفعة\n- **الوصف** — وصف الدفعة\n- **المرشحون** — عدد المرشحين في الدفعة (كشارة)\n- **الحالة** — نشط أو غير نشط (شارة ملونة)\n- **الإنشاء** — تاريخ الإنشاء\n- **الإجراءات** — قائمة منسدلة بالعمليات المتاحة",
          imagePlaceholder: "/tutorials/candidates-batch-list.png",
        },
        {
          id: "batch-search-filter",
          titleEn: "Search & Filter Batches",
          titleAr: "البحث والتصفية في الدفعات",
          descriptionEn:
            "At the top of the batch list, you have:\n\n- **Search box** — search by batch **name** or **description** (real-time filtering)\n- **Status filter** dropdown — filter by **All**, **Active**, or **Inactive**\n\nUse these controls to quickly find specific batches when managing large numbers of groups.",
          descriptionAr:
            "في أعلى قائمة الدفعات، لديك:\n\n- **مربع البحث** — البحث باسم الدفعة أو الوصف (تصفية فورية)\n- **فلتر الحالة** — التصفية حسب **الكل**، **نشط**، أو **غير نشط**\n\nاستخدم هذه الأدوات للعثور السريع على دفعات محددة عند إدارة أعداد كبيرة من المجموعات.",
          imagePlaceholder: "/tutorials/candidates-batch-filter.png",
        },
        {
          id: "create-batch",
          titleEn: "Create a New Batch",
          titleAr: "إنشاء دفعة جديدة",
          descriptionEn:
            "Click the **+ Create Batch** button at the top of the page to open the creation dialog.\n\nFill in the batch details and click **Save** to create the batch.",
          descriptionAr:
            "انقر على زر **+ إنشاء دفعة** في أعلى الصفحة لفتح نافذة الإنشاء.\n\nاملأ تفاصيل الدفعة وانقر **حفظ** لإنشاء الدفعة.",
          imagePlaceholder: "/tutorials/candidates-batch-create.png",
          fields: [
            {
              nameEn: "Name",
              nameAr: "الاسم",
              required: true,
              descriptionEn:
                'A descriptive name for the batch (e.g., "IT Department - Q1 2026", "New Hires March")',
              descriptionAr:
                'اسم وصفي للدفعة (مثل: "قسم تقنية المعلومات - الربع الأول 2026"، "موظفون جدد مارس")',
            },
            {
              nameEn: "Description",
              nameAr: "الوصف",
              required: false,
              descriptionEn:
                "Optional description explaining the purpose of this batch",
              descriptionAr: "وصف اختياري يوضح الغرض من هذه الدفعة",
            },
            {
              nameEn: "Is Active",
              nameAr: "نشط",
              required: false,
              descriptionEn:
                "Toggle to set the batch as active or inactive (default: **Active**)",
              descriptionAr:
                "مفتاح لتعيين الدفعة كنشطة أو غير نشطة (الافتراضي: **نشط**)",
            },
          ],
          tipEn:
            "Use meaningful batch names that indicate the group purpose — e.g., department name, intake date, or certification track. This makes it easier to filter candidates when assigning exams.",
          tipAr:
            "استخدم أسماء دفعات ذات معنى تشير إلى غرض المجموعة — مثل اسم القسم أو تاريخ الدفعة أو مسار الشهادة. هذا يسهّل تصفية المرشحين عند تعيين الاختبارات.",
        },
        {
          id: "batch-row-actions",
          titleEn: "Batch Actions",
          titleAr: "إجراءات الدفعة",
          descriptionEn:
            "Each batch row has an **Actions** dropdown menu with the following options:\n\n- **View Details** — navigate to the batch detail page to manage its members\n- **Edit** — open the edit form to update name, description, or status\n- **Activate / Deactivate** — toggle the batch status between Active and Inactive\n- **Export** — download batch candidates as an **Excel (.xlsx)** file\n- **Delete** — permanently remove the batch (requires confirmation)",
          descriptionAr:
            "كل صف دفعة يحتوي على قائمة **إجراءات** منسدلة بالخيارات التالية:\n\n- **عرض التفاصيل** — الانتقال لصفحة تفاصيل الدفعة لإدارة أعضائها\n- **تعديل** — فتح نموذج التعديل لتحديث الاسم أو الوصف أو الحالة\n- **تفعيل / إلغاء التفعيل** — تبديل حالة الدفعة بين نشط وغير نشط\n- **تصدير** — تحميل مرشحي الدفعة كملف **Excel (.xlsx)**\n- **حذف** — إزالة الدفعة نهائياً (يتطلب تأكيد)",
          imagePlaceholder: "/tutorials/candidates-batch-actions.png",
          noteEn:
            "Deleting a batch does **not** delete the candidates inside it — it only removes the batch grouping. Candidates remain registered in the system.",
          noteAr:
            "حذف الدفعة **لا** يحذف المرشحين داخلها — إنما يزيل تجميع الدفعة فقط. يظل المرشحون مسجلين في النظام.",
        },
        {
          id: "batch-detail-page",
          titleEn: "Batch Detail Page — Manage Members",
          titleAr: "صفحة تفاصيل الدفعة — إدارة الأعضاء",
          descriptionEn:
            "Click **View Details** on any batch to open its detail page. This page shows:\n\n**Header Section:**\n- Batch name and description\n- Back button to return to the batch list\n\n**Info Cards:**\n- **Total Candidates** — number of members in this batch\n- **Status** — Active/Inactive badge\n- **Created** — creation date\n\n**Members Table:**\n- Searchable and selectable list of all batch candidates\n- Columns: **Checkbox**, **#**, **Name (EN)**, **Name (AR)**, **Email**, **Roll No**, **Status**, **Added Date**, **Action**",
          descriptionAr:
            "انقر **عرض التفاصيل** على أي دفعة لفتح صفحة تفاصيلها. تعرض هذه الصفحة:\n\n**قسم الرأس:**\n- اسم الدفعة والوصف\n- زر رجوع للعودة لقائمة الدفعات\n\n**بطاقات المعلومات:**\n- **إجمالي المرشحين** — عدد الأعضاء في هذه الدفعة\n- **الحالة** — شارة نشط/غير نشط\n- **الإنشاء** — تاريخ الإنشاء\n\n**جدول الأعضاء:**\n- قائمة قابلة للبحث والاختيار لجميع مرشحي الدفعة\n- الأعمدة: **مربع اختيار**، **#**، **الاسم (EN)**، **الاسم (AR)**، **البريد**، **الرقم**، **الحالة**، **تاريخ الإضافة**، **الإجراء**",
          imagePlaceholder: "/tutorials/candidates-batch-detail.png",
        },
        {
          id: "batch-add-candidates",
          titleEn: "Add Candidates to a Batch",
          titleAr: "إضافة مرشحين إلى دفعة",
          descriptionEn:
            'On the batch detail page, click **+ Add Candidates** to open the add dialog:\n\n1. A modal appears with a **searchable candidate list**\n2. Only candidates **not already in this batch** are shown\n3. Use the **search box** to find candidates by name, email, or roll number\n4. **Check the boxes** next to the candidates you want to add\n5. A counter shows "**X selected**" at the bottom\n6. Click **Add** to add the selected candidates to the batch',
          descriptionAr:
            'في صفحة تفاصيل الدفعة، انقر **+ إضافة مرشحين** لفتح نافذة الإضافة:\n\n1. تظهر نافذة بـ**قائمة مرشحين قابلة للبحث**\n2. تُعرض فقط المرشحين **غير الموجودين بالفعل في هذه الدفعة**\n3. استخدم **مربع البحث** للعثور على مرشحين بالاسم أو البريد أو الرقم\n4. **حدد المربعات** بجانب المرشحين الذين تريد إضافتهم\n5. يظهر عداد "**X محدد**" في الأسفل\n6. انقر **إضافة** لإضافة المرشحين المحددين إلى الدفعة',
          imagePlaceholder: "/tutorials/candidates-batch-add.png",
        },
        {
          id: "batch-remove-candidates",
          titleEn: "Remove Candidates from a Batch",
          titleAr: "إزالة مرشحين من دفعة",
          descriptionEn:
            "You can remove candidates from a batch in two ways:\n\n**Single Remove:**\n- Click the **remove button** (trash icon) on any member row\n- Confirm the removal in the dialog\n\n**Bulk Remove:**\n1. Select multiple candidates using the **checkboxes**\n2. Click the **Bulk Remove** button that appears at the top\n3. Confirm the bulk removal in the dialog",
          descriptionAr:
            "يمكنك إزالة مرشحين من دفعة بطريقتين:\n\n**إزالة فردية:**\n- انقر زر **الإزالة** (أيقونة الحذف) في صف أي عضو\n- أكّد الإزالة في النافذة\n\n**إزالة جماعية:**\n1. حدد عدة مرشحين باستخدام **مربعات الاختيار**\n2. انقر زر **إزالة جماعية** الذي يظهر في الأعلى\n3. أكّد الإزالة الجماعية في النافذة",
          imagePlaceholder: "/tutorials/candidates-batch-remove.png",
          noteEn:
            "Removing a candidate from a batch does **not** delete the candidate from the system — it only removes them from this specific batch group.",
          noteAr:
            "إزالة مرشح من دفعة **لا** تحذف المرشح من النظام — إنما تزيله من هذه المجموعة المحددة فقط.",
        },
        {
          id: "batch-export",
          titleEn: "Export Batch Candidates",
          titleAr: "تصدير مرشحي الدفعة",
          descriptionEn:
            "Export the batch members list as an Excel file:\n\n- From the **batch list**: click the **Actions** dropdown → **Export** on any batch\n- From the **batch detail page**: click the **Export** button at the top\n\nThe exported file contains all candidate data for the selected batch in **.xlsx** format.",
          descriptionAr:
            "تصدير قائمة أعضاء الدفعة كملف Excel:\n\n- من **قائمة الدفعات**: انقر القائمة المنسدلة **الإجراءات** ← **تصدير** لأي دفعة\n- من **صفحة تفاصيل الدفعة**: انقر زر **تصدير** في الأعلى\n\nيحتوي الملف المُصدّر على جميع بيانات المرشحين للدفعة المحددة بصيغة **.xlsx**.",
          imagePlaceholder: "/tutorials/candidates-batch-export.png",
        },
      ],
      examples: [
        {
          titleEn: "Batch Organization Tips",
          titleAr: "نصائح تنظيم الدفعات",
          contentEn:
            '**Common batch naming strategies:**\n- By department: "IT Department", "Finance Team", "HR Recruits"\n- By intake date: "March 2026 Intake", "Q1 New Hires"\n- By certification: "AWS Certified Track", "PMP Candidates"\n- By exam: "Network Security Exam - Group A"\n\n**Best Practice:** Create batches before importing candidates, then assign candidates to batches during import or manually afterward.',
          contentAr:
            '**استراتيجيات شائعة لتسمية الدفعات:**\n- حسب القسم: "قسم تقنية المعلومات"، "فريق المالية"، "مرشحو الموارد البشرية"\n- حسب تاريخ الدفعة: "دفعة مارس 2026"، "موظفون جدد الربع الأول"\n- حسب الشهادة: "مسار شهادة AWS"، "مرشحو PMP"\n- حسب الاختبار: "اختبار أمن الشبكات - المجموعة أ"\n\n**أفضل ممارسة:** أنشئ الدفعات قبل استيراد المرشحين، ثم عيّن المرشحين للدفعات أثناء الاستيراد أو يدوياً بعد ذلك.',
        },
      ],
    },
    // ── Section 3: Candidates Data ──
    {
      id: "candidates-data",
      titleEn: "3. Candidates Data",
      titleAr: "3. بيانات المرشحين",
      descriptionEn:
        "The central registry for all candidates — register individually, bulk import via Excel, export data, and manage candidate accounts. Remember: candidate data is shared across all departments.",
      descriptionAr:
        "السجل المركزي لجميع المرشحين — التسجيل الفردي والاستيراد الجماعي عبر Excel وتصدير البيانات وإدارة حسابات المرشحين. تذكّر: بيانات المرشحين مشتركة بين جميع الأقسام.",
      steps: [
        {
          id: "candidates-data-overview",
          titleEn: "Candidates Data Page",
          titleAr: "صفحة بيانات المرشحين",
          descriptionEn:
            "Navigate to **Candidates** → **Candidates Data** from the sidebar. The page has three main areas:\n\n**Statistics Cards (Top):**\n- **Total Candidates** — total number of registered candidates across all departments\n- **Active** — candidates with active status (green badge)\n- **Blocked** — candidates who have been blocked (red badge)\n\n**Search & Filter Bar:**\n- **Search** — find candidates by name, email, or roll number (with 300ms debounce)\n- **Status** dropdown — filter by All, Active, or Blocked\n\n**Candidates Table (20 per page):**\n- **Full Name** — bilingual display (English and Arabic)\n- **Email** — candidate email address\n- **Roll No** — unique candidate identifier\n- **Mobile** — phone number\n- **Status** — Active or Blocked badge\n- **Created** — registration date\n- **Created By** — who registered this candidate\n- **Actions** — dropdown menu with operations",
          descriptionAr:
            "انتقل إلى **المرشحون** ← **بيانات المرشحين** من القائمة الجانبية. تحتوي الصفحة على ثلاث مناطق رئيسية:\n\n**بطاقات الإحصائيات (الأعلى):**\n- **إجمالي المرشحين** — العدد الإجمالي للمرشحين المسجلين عبر جميع الأقسام\n- **نشط** — المرشحون ذوو الحالة النشطة (شارة خضراء)\n- **محظور** — المرشحون الذين تم حظرهم (شارة حمراء)\n\n**شريط البحث والتصفية:**\n- **البحث** — العثور على مرشحين بالاسم أو البريد أو الرقم (مع تأخير 300 مللي ثانية)\n- **الحالة** — التصفية حسب الكل أو نشط أو محظور\n\n**جدول المرشحين (20 لكل صفحة):**\n- **الاسم الكامل** — عرض ثنائي اللغة (إنجليزي وعربي)\n- **البريد** — عنوان البريد الإلكتروني\n- **الرقم** — معرّف المرشح الفريد\n- **الجوال** — رقم الهاتف\n- **الحالة** — شارة نشط أو محظور\n- **الإنشاء** — تاريخ التسجيل\n- **أنشأه** — من سجّل هذا المرشح\n- **الإجراءات** — قائمة منسدلة بالعمليات",
          imagePlaceholder: "/tutorials/candidates-data-page.png",
          tipEn:
            "The statistics cards update in real-time as you add, block, or delete candidates. Use them to get a quick overview of your candidate pool.",
          tipAr:
            "تُحدّث بطاقات الإحصائيات فورياً عند إضافة أو حظر أو حذف المرشحين. استخدمها للحصول على نظرة سريعة على مجموعة المرشحين.",
        },
        {
          id: "add-candidate",
          titleEn: "Add a New Candidate",
          titleAr: "إضافة مرشح جديد",
          descriptionEn:
            "Click the **+ Add Candidate** button to open the registration form.\n\nFill in the candidate details and click **Save**. The candidate will be registered in the system and can immediately be assigned to exams from **any department**.",
          descriptionAr:
            "انقر زر **+ إضافة مرشح** لفتح نموذج التسجيل.\n\nاملأ تفاصيل المرشح وانقر **حفظ**. سيتم تسجيل المرشح في النظام ويمكن تعيينه فوراً لاختبارات من **أي قسم**.",
          imagePlaceholder: "/tutorials/candidates-add-form.png",
          fields: [
            {
              nameEn: "Full Name (English)",
              nameAr: "الاسم الكامل (إنجليزي)",
              required: true,
              descriptionEn: "Candidate's full name in English",
              descriptionAr: "الاسم الكامل للمرشح بالإنجليزية",
            },
            {
              nameEn: "Full Name (Arabic)",
              nameAr: "الاسم الكامل (عربي)",
              required: false,
              descriptionEn: "Candidate's full name in Arabic (optional)",
              descriptionAr: "الاسم الكامل للمرشح بالعربية (اختياري)",
            },
            {
              nameEn: "Email",
              nameAr: "البريد الإلكتروني",
              required: true,
              descriptionEn:
                "Unique email address — used as the candidate's **login credential**. Must be valid email format.",
              descriptionAr:
                "عنوان بريد إلكتروني فريد — يُستخدم كـ**بيانات دخول المرشح**. يجب أن يكون بصيغة بريد صالحة.",
            },
            {
              nameEn: "Password",
              nameAr: "كلمة المرور",
              required: true,
              descriptionEn:
                "Initial password for the candidate account (minimum **6 characters**). Required when creating; optional when editing.",
              descriptionAr:
                "كلمة المرور الأولية لحساب المرشح (الحد الأدنى **6 أحرف**). مطلوبة عند الإنشاء؛ اختيارية عند التعديل.",
            },
            {
              nameEn: "Roll No",
              nameAr: "الرقم التسلسلي",
              required: true,
              descriptionEn:
                "Unique identifier for the candidate (e.g., employee ID, student number)",
              descriptionAr:
                "معرّف فريد للمرشح (مثل: رقم الموظف أو رقم الطالب)",
            },
            {
              nameEn: "Mobile",
              nameAr: "الجوال",
              required: false,
              descriptionEn: "Candidate's mobile phone number (optional)",
              descriptionAr: "رقم هاتف المرشح (اختياري)",
            },
          ],
        },
        {
          id: "edit-candidate",
          titleEn: "Edit Candidate Information",
          titleAr: "تعديل معلومات المرشح",
          descriptionEn:
            "From the candidate row **Actions** dropdown → click **Edit** to update candidate details.\n\nThe edit form shows the same fields as the create form, with the following differences:\n- All current values are **pre-filled**\n- **Password** is optional during edit — leave blank to keep the existing password\n- **Email** remains the unique identifier and login credential",
          descriptionAr:
            "من القائمة المنسدلة **الإجراءات** لصف المرشح ← انقر **تعديل** لتحديث بيانات المرشح.\n\nيعرض نموذج التعديل نفس الحقول كنموذج الإنشاء، مع الاختلافات التالية:\n- جميع القيم الحالية **مملوءة مسبقاً**\n- **كلمة المرور** اختيارية أثناء التعديل — اتركها فارغة للاحتفاظ بكلمة المرور الحالية\n- **البريد** يظل المعرّف الفريد وبيانات الدخول",
          imagePlaceholder: "/tutorials/candidates-edit.png",
        },
        {
          id: "block-unblock-candidate",
          titleEn: "Block / Unblock a Candidate",
          titleAr: "حظر / إلغاء حظر مرشح",
          descriptionEn:
            'From the **Actions** dropdown on any candidate row:\n\n**Block:**\n- Click **Block** to disable the candidate\'s access\n- Blocked candidates **cannot log in** or take any exams\n- A confirmation dialog shows the candidate\'s name before blocking\n- Status changes to a **red "Blocked" badge**\n\n**Unblock:**\n- Click **Unblock** on a blocked candidate to restore access\n- The candidate can immediately log in and take assigned exams\n- Status changes back to a **green "Active" badge**',
          descriptionAr:
            'من القائمة المنسدلة **الإجراءات** لأي صف مرشح:\n\n**حظر:**\n- انقر **حظر** لتعطيل وصول المرشح\n- المرشحون المحظورون **لا يمكنهم تسجيل الدخول** أو أداء أي اختبارات\n- تظهر نافذة تأكيد باسم المرشح قبل الحظر\n- تتغير الحالة إلى **شارة "محظور" حمراء**\n\n**إلغاء الحظر:**\n- انقر **إلغاء الحظر** على مرشح محظور لاستعادة الوصول\n- يمكن للمرشح تسجيل الدخول فوراً وأداء الاختبارات المعيّنة\n- تعود الحالة إلى **شارة "نشط" خضراء**',
          imagePlaceholder: "/tutorials/candidates-block.png",
          tipEn:
            "Blocking a candidate takes effect immediately. If the candidate is currently taking an exam, they will not be disconnected — but they cannot start any new exams until unblocked.",
          tipAr:
            "حظر المرشح يسري فوراً. إذا كان المرشح يؤدي اختباراً حالياً، لن يتم فصله — لكنه لا يمكنه بدء أي اختبارات جديدة حتى يتم إلغاء الحظر.",
        },
        {
          id: "delete-candidate",
          titleEn: "Delete a Candidate",
          titleAr: "حذف مرشح",
          descriptionEn:
            "From the **Actions** dropdown → click **Delete** to permanently remove a candidate.\n\n- A confirmation dialog appears showing the candidate's name\n- Click **Confirm** to proceed with deletion\n- The candidate and their account will be permanently removed",
          descriptionAr:
            "من القائمة المنسدلة **الإجراءات** ← انقر **حذف** لإزالة مرشح نهائياً.\n\n- تظهر نافذة تأكيد تعرض اسم المرشح\n- انقر **تأكيد** للمتابعة بالحذف\n- سيتم إزالة المرشح وحسابه نهائياً",
          imagePlaceholder: "/tutorials/candidates-delete.png",
          noteEn:
            "Deletion is permanent. Make sure the candidate has no active or upcoming exam assignments before deleting. Consider **blocking** instead of deleting if you may need the record later.",
          noteAr:
            "الحذف دائم. تأكد من أن المرشح ليس لديه تعيينات اختبار نشطة أو قادمة قبل الحذف. فكّر في **الحظر** بدلاً من الحذف إذا كنت قد تحتاج للسجل لاحقاً.",
        },
        {
          id: "import-candidates",
          titleEn: "Import Candidates from Excel",
          titleAr: "استيراد المرشحين من Excel",
          descriptionEn:
            "Bulk-register candidates by importing an Excel spreadsheet:\n\n1. Click **Download Template** to get the import template (.xlsx)\n2. Fill in the template with candidate data (name, email, roll no, etc.)\n3. Click **Import** and select the filled template file\n4. The system processes the file and shows an **import result summary**:\n\n**Result Summary includes:**\n- **Total Rows** — number of rows processed\n- **Inserted** — successfully created candidates\n- **Skipped** — rows that were skipped (duplicates or errors)\n- **Errors** — detailed list of issues (row number, email, reason)\n- **Created Accounts** — list of created candidates with their **temporary passwords**",
          descriptionAr:
            "تسجيل المرشحين جماعياً عبر استيراد جدول Excel:\n\n1. انقر **تحميل القالب** للحصول على قالب الاستيراد (.xlsx)\n2. املأ القالب ببيانات المرشحين (الاسم، البريد، الرقم، إلخ)\n3. انقر **استيراد** واختر ملف القالب المملوء\n4. يعالج النظام الملف ويعرض **ملخص نتيجة الاستيراد**:\n\n**ملخص النتيجة يتضمن:**\n- **إجمالي الصفوف** — عدد الصفوف المُعالجة\n- **المُدرجة** — المرشحون الذين تم إنشاؤهم بنجاح\n- **المُتخطاة** — الصفوف التي تم تخطيها (مكررة أو بها أخطاء)\n- **الأخطاء** — قائمة مفصلة بالمشاكل (رقم الصف، البريد، السبب)\n- **الحسابات المُنشأة** — قائمة المرشحين المُنشأين مع **كلمات المرور المؤقتة**",
          imagePlaceholder: "/tutorials/candidates-import.png",
          tipEn:
            "Always download the latest template before importing to ensure you have the correct column format. Duplicate emails will be skipped automatically — the system prevents creating duplicate candidate accounts.",
          tipAr:
            "قم دائماً بتحميل أحدث قالب قبل الاستيراد لضمان الحصول على تنسيق الأعمدة الصحيح. ستتم تخطّي البريد المكرر تلقائياً — النظام يمنع إنشاء حسابات مرشحين مكررة.",
        },
        {
          id: "export-candidates",
          titleEn: "Export Candidates to Excel",
          titleAr: "تصدير المرشحين إلى Excel",
          descriptionEn:
            "Click the **Export** button to download the current candidate list as an Excel file.\n\n- The export respects your current **search and filter** settings\n- File is named: **candidates_YYYY-MM-DD.xlsx**\n- Contains all visible candidate data columns",
          descriptionAr:
            "انقر زر **تصدير** لتحميل قائمة المرشحين الحالية كملف Excel.\n\n- يحترم التصدير إعدادات **البحث والتصفية** الحالية\n- الملف مسمى: **candidates_YYYY-MM-DD.xlsx**\n- يحتوي على جميع أعمدة بيانات المرشحين المرئية",
          imagePlaceholder: "/tutorials/candidates-export.png",
        },
      ],
      examples: [
        {
          titleEn: "Import Template Format",
          titleAr: "تنسيق قالب الاستيراد",
          contentEn:
            '**Expected columns in the import template:**\n- Full Name (English) — required\n- Full Name (Arabic) — optional\n- Email — required, must be unique\n- Roll No — required\n- Mobile — optional\n\n**Example row:**\n- Full Name: "Ahmed Ali"\n- Email: "ahmed.ali@company.com"\n- Roll No: "EMP-001"\n- Mobile: "+966555000111"',
          contentAr:
            '**الأعمدة المتوقعة في قالب الاستيراد:**\n- الاسم الكامل (إنجليزي) — مطلوب\n- الاسم الكامل (عربي) — اختياري\n- البريد — مطلوب، يجب أن يكون فريداً\n- الرقم — مطلوب\n- الجوال — اختياري\n\n**مثال صف:**\n- الاسم: "أحمد علي"\n- البريد: "ahmed.ali@company.com"\n- الرقم: "EMP-001"\n- الجوال: "+966555000111"',
        },
      ],
    },
    // ── Section 4: Assign to Exam ──
    {
      id: "assign-to-exam",
      titleEn: "4. Assign to Exam",
      titleAr: "4. تعيين اختبار",
      descriptionEn:
        "Bulk-assign candidates to published exams with scheduling windows. Filter by batch, select individually or in bulk, and manage assignments with full control.",
      descriptionAr:
        "تعيين المرشحين جماعياً للاختبارات المنشورة مع نوافذ جدولة. التصفية حسب الدفعة والاختيار الفردي أو الجماعي وإدارة التعيينات بتحكم كامل.",
      steps: [
        {
          id: "assign-exam-page",
          titleEn: "Assignment Page Overview",
          titleAr: "نظرة عامة على صفحة التعيين",
          descriptionEn:
            "Navigate to **Candidates** → **Assign to Exam** from the sidebar. The page is divided into **two steps**:\n\n**Step 1 — Set Exam & Schedule (Required):**\n- Select the exam and define the assignment window\n- Must be completed before selecting candidates\n\n**Step 2 — Select & Assign Candidates:**\n- Search, filter, and select candidates to assign\n- Only available after Step 1 is completed",
          descriptionAr:
            "انتقل إلى **المرشحون** ← **تعيين اختبار** من القائمة الجانبية. تنقسم الصفحة إلى **خطوتين**:\n\n**الخطوة 1 — تحديد الاختبار والجدول (مطلوب):**\n- اختر الاختبار وحدد نافذة التعيين\n- يجب إكمالها قبل اختيار المرشحين\n\n**الخطوة 2 — اختيار وتعيين المرشحين:**\n- البحث والتصفية واختيار المرشحين للتعيين\n- متاحة فقط بعد إكمال الخطوة 1",
          imagePlaceholder: "/tutorials/candidates-assign-overview.png",
        },
        {
          id: "assign-step1-config",
          titleEn: "Step 1 — Set Exam & Schedule",
          titleAr: "الخطوة 1 — تحديد الاختبار والجدول",
          descriptionEn:
            "Configure the assignment settings before selecting candidates:",
          descriptionAr: "اضبط إعدادات التعيين قبل اختيار المرشحين:",
          imagePlaceholder: "/tutorials/candidates-assign-step1.png",
          fields: [
            {
              nameEn: "Exam",
              nameAr: "الاختبار",
              required: true,
              descriptionEn:
                "Select from the dropdown of **published exams** only. Draft or unpublished exams will not appear here.",
              descriptionAr:
                "اختر من القائمة المنسدلة لـ**الاختبارات المنشورة** فقط. لن تظهر الاختبارات المسودة أو غير المنشورة.",
            },
            {
              nameEn: "Schedule From",
              nameAr: "الجدول من",
              required: true,
              descriptionEn:
                "The **start date/time** of the assignment window — candidates can begin the exam from this time.",
              descriptionAr:
                "**تاريخ/وقت البدء** لنافذة التعيين — يمكن للمرشحين بدء الاختبار من هذا الوقت.",
            },
            {
              nameEn: "Schedule To",
              nameAr: "الجدول إلى",
              required: true,
              descriptionEn:
                'The **end date/time** of the assignment window — candidates must **start** the exam before this time. Must be after "Schedule From".',
              descriptionAr:
                '**تاريخ/وقت النهاية** لنافذة التعيين — يجب أن **يبدأ** المرشحون الاختبار قبل هذا الوقت. يجب أن يكون بعد "الجدول من".',
            },
            {
              nameEn: "Batch Filter",
              nameAr: "فلتر الدفعة",
              required: false,
              descriptionEn:
                'Optional — filter the candidate list to show only members of a **specific batch**, or select "All Candidates" to see everyone.',
              descriptionAr:
                'اختياري — تصفية قائمة المرشحين لعرض أعضاء **دفعة محددة** فقط، أو اختر "جميع المرشحين" لعرض الجميع.',
            },
          ],
          tipEn:
            'The "Schedule To" date defines when candidates can **start** the exam — not when they must finish. If a candidate starts at 11:59 PM before the deadline, they get the full exam duration to complete it.',
          tipAr:
            'تاريخ "الجدول إلى" يحدد متى يمكن للمرشحين **بدء** الاختبار — وليس متى يجب أن ينتهوا. إذا بدأ مرشح في 11:59 مساءً قبل الموعد النهائي، يحصل على كامل مدة الاختبار لإكماله.',
        },
        {
          id: "assign-step2-select",
          titleEn: "Step 2 — Select & Assign Candidates",
          titleAr: "الخطوة 2 — اختيار وتعيين المرشحين",
          descriptionEn:
            'After completing Step 1, the candidate list appears with the following controls:\n\n**Search & Filter:**\n- **Search box** — find by name, email, or roll number\n- **Status filter** — All, Active, or Blocked\n- Results are **paginated** (20 per page)\n\n**Candidate Table Columns:**\n- **Checkbox** — select for bulk operations (row-level and header for page)\n- **#** — index number\n- **Roll No** — candidate identifier\n- **Name** — candidate name\n- **Email** — email address\n- **Mobile** — phone number\n- **Assigned?** — "Yes" (green) or "No" badge indicating current assignment status\n- **Started?** — "Yes" or "No" badge indicating if the candidate has started the exam\n- **Status** — Active or Blocked badge',
          descriptionAr:
            'بعد إكمال الخطوة 1، تظهر قائمة المرشحين بالأدوات التالية:\n\n**البحث والتصفية:**\n- **مربع البحث** — العثور بالاسم أو البريد أو الرقم\n- **فلتر الحالة** — الكل أو نشط أو محظور\n- النتائج **مُقسّمة** (20 لكل صفحة)\n\n**أعمدة جدول المرشحين:**\n- **مربع اختيار** — للاختيار للعمليات الجماعية (على مستوى الصف والعنوان للصفحة)\n- **#** — رقم الفهرس\n- **الرقم** — معرّف المرشح\n- **الاسم** — اسم المرشح\n- **البريد** — عنوان البريد\n- **الجوال** — رقم الهاتف\n- **معيّن؟** — "نعم" (أخضر) أو شارة "لا" تشير لحالة التعيين الحالية\n- **بدأ؟** — شارة "نعم" أو "لا" تشير إذا بدأ المرشح الاختبار\n- **الحالة** — شارة نشط أو محظور',
          imagePlaceholder: "/tutorials/candidates-assign-step2.png",
        },
        {
          id: "assign-actions",
          titleEn: "Assignment Actions",
          titleAr: "إجراءات التعيين",
          descriptionEn:
            'After selecting candidates with checkboxes, the following action buttons become available:\n\n- **Assign (X)** — assign the selected X candidates to the exam with the configured schedule\n- **Unassign (X)** — remove the assignment for the selected X candidates\n- **Assign All Matching** — assign **all candidates** matching the current search/filter criteria (not just the visible page)\n\n**After clicking an action:**\n1. A **confirmation dialog** shows the count being assigned/unassigned\n2. Notes about skipping blocked or already-assigned candidates\n3. Unassign uses a **destructive** (red) button styling for clarity\n\n**Result Summary:**\nAfter the operation completes, a **result dialog** shows:\n- **Total Targeted** — how many were targeted\n- **Success** — how many were successfully assigned/unassigned\n- **Skipped** — how many were skipped, with **individual reasons** (e.g., "already assigned", "candidate is blocked")',
          descriptionAr:
            'بعد اختيار المرشحين بمربعات الاختيار، تصبح أزرار الإجراءات التالية متاحة:\n\n- **تعيين (X)** — تعيين X مرشحين محددين للاختبار مع الجدول المُعَد\n- **إلغاء التعيين (X)** — إزالة التعيين لـ X مرشحين محددين\n- **تعيين الكل المطابق** — تعيين **جميع المرشحين** المطابقين لمعايير البحث/التصفية الحالية (ليس فقط الصفحة المرئية)\n\n**بعد النقر على إجراء:**\n1. تظهر **نافذة تأكيد** تعرض العدد الذي سيتم تعيينه/إلغاء تعيينه\n2. ملاحظات حول تخطي المحظورين أو المعيّنين بالفعل\n3. إلغاء التعيين يستخدم تنسيق زر **تدميري** (أحمر) للوضوح\n\n**ملخص النتيجة:**\nبعد اكتمال العملية، تظهر **نافذة نتيجة** تعرض:\n- **إجمالي المستهدفين** — كم تم استهدافهم\n- **النجاح** — كم تم تعيينهم/إلغاء تعيينهم بنجاح\n- **المُتخطّون** — كم تم تخطيهم، مع **أسباب فردية** (مثل: "معيّن بالفعل"، "المرشح محظور")',
          imagePlaceholder: "/tutorials/candidates-assign-actions.png",
          noteEn:
            "When a candidate is **assigned to an exam**, they receive an **email notification** informing them of the exam assignment and the schedule window. The same applies when they are **unassigned** — they are notified by email.",
          noteAr:
            "عندما يتم **تعيين مرشح لاختبار**، يتلقى **إشعار بريد إلكتروني** يُعلمه بتعيين الاختبار ونافذة الجدول. نفس الشيء ينطبق عند **إلغاء التعيين** — يتم إخطاره بالبريد.",
        },
      ],
      examples: [
        {
          titleEn: "Assignment Workflow Example",
          titleAr: "مثال على سير عمل التعيين",
          contentEn:
            '**Scenario:** Assign the "IT Department" batch to the "Network Security Exam" with a 1-week window.\n\n1. Select exam: **Network Security Exam**\n2. Set schedule: **From** March 17, 2026 08:00 → **To** March 24, 2026 23:59\n3. Filter by batch: **IT Department**\n4. Click **Assign All Matching** to assign all IT batch members\n5. Review result: 45 targeted → 42 success → 3 skipped (already assigned)\n6. Candidates receive **email notifications** with exam details and schedule',
          contentAr:
            '**السيناريو:** تعيين دفعة "قسم تقنية المعلومات" لـ"اختبار أمن الشبكات" مع نافذة أسبوع واحد.\n\n1. اختر الاختبار: **اختبار أمن الشبكات**\n2. حدد الجدول: **من** 17 مارس 2026 08:00 ← **إلى** 24 مارس 2026 23:59\n3. فلتر حسب الدفعة: **قسم تقنية المعلومات**\n4. انقر **تعيين الكل المطابق** لتعيين جميع أعضاء دفعة IT\n5. مراجعة النتيجة: 45 مستهدف → 42 نجاح → 3 متخطّى (معيّنون بالفعل)\n6. يتلقى المرشحون **إشعارات بريد إلكتروني** بتفاصيل الاختبار والجدول',
        },
      ],
    },
    // ── Section 5: Exam Operations ──
    {
      id: "exam-operations",
      titleEn: "5. Exam Operations",
      titleAr: "5. عمليات الاختبار",
      descriptionEn:
        "Administrative intervention tools for exam attempts — grant new attempts, add extra time, or terminate active attempts. These are powerful overrides that should be used carefully.",
      descriptionAr:
        "أدوات تدخل إداري لمحاولات الاختبار — منح محاولات جديدة وإضافة وقت إضافي أو إنهاء محاولات نشطة. هذه تجاوزات قوية يجب استخدامها بعناية.",
      steps: [
        {
          id: "exam-ops-overview",
          titleEn: "Exam Operations Page",
          titleAr: "صفحة عمليات الاختبار",
          descriptionEn:
            "Navigate to **Candidates** → **Exam Operations** from the sidebar.\n\n**Exam Selection (Required):**\n- Select an exam from the dropdown to load its candidates\n- Only exams with candidate data are shown\n\n**Search:**\n- Search by candidate **name** or **email** (debounced input)\n\n**Candidates Table (20 per page):**\n- **Candidate** — name and email (bilingual display)\n- **Roll No** — candidate identifier\n- **Attempts** — current attempt count / max attempts allowed\n- **Latest Status** — color-coded badge showing the latest attempt status\n- **Pending Overrides** — number of pending admin overrides\n- **Actions** — dropdown with available operations (conditional)",
          descriptionAr:
            "انتقل إلى **المرشحون** ← **عمليات الاختبار** من القائمة الجانبية.\n\n**اختيار الاختبار (مطلوب):**\n- اختر اختباراً من القائمة المنسدلة لتحميل مرشحيه\n- تُعرض فقط الاختبارات التي تحتوي على بيانات مرشحين\n\n**البحث:**\n- البحث باسم المرشح أو البريد (إدخال مؤجل)\n\n**جدول المرشحين (20 لكل صفحة):**\n- **المرشح** — الاسم والبريد (عرض ثنائي اللغة)\n- **الرقم** — معرّف المرشح\n- **المحاولات** — عدد المحاولات الحالي / أقصى محاولات مسموحة\n- **آخر حالة** — شارة ملونة تعرض حالة آخر محاولة\n- **التجاوزات المعلّقة** — عدد تجاوزات المدير المعلّقة\n- **الإجراءات** — قائمة منسدلة بالعمليات المتاحة (مشروطة)",
          imagePlaceholder: "/tutorials/candidates-examops-page.png",
        },
        {
          id: "exam-ops-status-badges",
          titleEn: "Understanding Attempt Status Badges",
          titleAr: "فهم شارات حالة المحاولة",
          descriptionEn:
            "The **Latest Status** column uses color-coded badges to indicate the current state of a candidate's exam attempt:\n\n✓ **Started / InProgress** — sky blue — candidate is actively taking the exam\n✓ **Submitted / Paused** — amber — exam is submitted or temporarily paused\n✗ **ForceSubmitted** — red — exam was force-submitted by a proctor or admin\n✗ **Terminated** — red — attempt was terminated by admin action\n✗ **Expired** — red — exam time ran out before submission\n✗ **Cancelled** — gray — attempt was cancelled",
          descriptionAr:
            "يستخدم عمود **آخر حالة** شارات ملونة لتوضيح الحالة الحالية لمحاولة اختبار المرشح:\n\n✓ **بدأ / جارٍ** — أزرق سماوي — المرشح يؤدي الاختبار بنشاط\n✓ **مقدّم / متوقف** — عنبري — تم تقديم الاختبار أو إيقافه مؤقتاً\n✗ **تقديم إجباري** — أحمر — تم تقديم الاختبار إجبارياً بواسطة مراقب أو مدير\n✗ **مُنهى** — أحمر — تم إنهاء المحاولة بإجراء إداري\n✗ **منتهي الصلاحية** — أحمر — انتهى وقت الاختبار قبل التقديم\n✗ **ملغى** — رمادي — تم إلغاء المحاولة",
          imagePlaceholder: "/tutorials/candidates-examops-statuses.png",
        },
        {
          id: "allow-new-attempt",
          titleEn: "Allow New Attempt",
          titleAr: "السماح بمحاولة جديدة",
          descriptionEn:
            "When a candidate has used all their allowed attempts, you can grant them an additional one:\n\n1. Find the candidate in the table\n2. Click the **Actions** dropdown → **Allow New Attempt** (only visible when eligible)\n3. A dialog opens showing:\n   - Candidate info card with **name** and **current attempts / max**\n   - **Reason** textarea (required) — explain why the override is needed\n4. Click **Confirm** to create the override\n5. The candidate can now take one additional attempt beyond the original limit",
          descriptionAr:
            "عندما يستنفد المرشح جميع محاولاته المسموحة، يمكنك منحه محاولة إضافية:\n\n1. ابحث عن المرشح في الجدول\n2. انقر القائمة المنسدلة **الإجراءات** ← **السماح بمحاولة جديدة** (مرئي فقط عند الأهلية)\n3. تفتح نافذة تعرض:\n   - بطاقة معلومات المرشح مع **الاسم** و**المحاولات الحالية / الأقصى**\n   - **السبب** مربع نص (مطلوب) — اشرح لماذا التجاوز مطلوب\n4. انقر **تأكيد** لإنشاء التجاوز\n5. يمكن للمرشح الآن أداء محاولة إضافية واحدة تتجاوز الحد الأصلي",
          imagePlaceholder: "/tutorials/candidates-examops-new-attempt.png",
          tipEn:
            "The reason you provide is **logged permanently** in the system audit trail. Always provide a clear, documented reason for the override.",
          tipAr:
            "السبب الذي تقدمه يتم **تسجيله بشكل دائم** في سجل تدقيق النظام. قدّم دائماً سبباً واضحاً وموثقاً للتجاوز.",
        },
        {
          id: "add-time-to-attempt",
          titleEn: "Add Extra Time",
          titleAr: "إضافة وقت إضافي",
          descriptionEn:
            "Add extra minutes to a candidate's **active** exam attempt:\n\n1. Find the candidate with an active attempt (status: **Started** or **InProgress**)\n2. Click **Actions** → **Add Time** (only visible when eligible)\n3. A dialog opens showing:\n   - Candidate info card with **name** and **attempt ID**\n   - **Extra Minutes** input — range: **1 to 480 minutes** (default: 10)\n   - **Reason** textarea (required)\n4. Click **Confirm** to add the extra time\n5. The candidate's exam timer is extended immediately",
          descriptionAr:
            "إضافة دقائق إضافية لمحاولة اختبار **نشطة** للمرشح:\n\n1. ابحث عن المرشح بمحاولة نشطة (الحالة: **بدأ** أو **جارٍ**)\n2. انقر **الإجراءات** ← **إضافة وقت** (مرئي فقط عند الأهلية)\n3. تفتح نافذة تعرض:\n   - بطاقة معلومات المرشح مع **الاسم** و**رقم المحاولة**\n   - **الدقائق الإضافية** — المدى: **1 إلى 480 دقيقة** (الافتراضي: 10)\n   - **السبب** مربع نص (مطلوب)\n4. انقر **تأكيد** لإضافة الوقت الإضافي\n5. يتم تمديد مؤقت اختبار المرشح فوراً",
          imagePlaceholder: "/tutorials/candidates-examops-add-time.png",
          noteEn:
            "Common reasons for adding time: technical issues (internet disconnection, system error), accessibility accommodations, or emergency interruptions during the exam.",
          noteAr:
            "أسباب شائعة لإضافة الوقت: مشاكل تقنية (انقطاع الإنترنت، خطأ نظامي)، تسهيلات الوصول، أو انقطاعات طارئة أثناء الاختبار.",
        },
        {
          id: "terminate-attempt",
          titleEn: "Terminate an Attempt",
          titleAr: "إنهاء محاولة",
          descriptionEn:
            "Force-end a candidate's active exam attempt:\n\n1. Find the candidate with an active attempt\n2. Click **Actions** → **Terminate** (only visible when eligible)\n3. A dialog opens showing:\n   - Candidate info card\n   - **Reason** textarea (required) — must explain the termination reason\n4. Click **Confirm** to terminate the attempt\n5. The candidate's exam is immediately ended and their current answers are saved\n6. The attempt status changes to **Terminated** (red badge)",
          descriptionAr:
            "إنهاء محاولة اختبار نشطة للمرشح إجبارياً:\n\n1. ابحث عن المرشح بمحاولة نشطة\n2. انقر **الإجراءات** ← **إنهاء** (مرئي فقط عند الأهلية)\n3. تفتح نافذة تعرض:\n   - بطاقة معلومات المرشح\n   - **السبب** مربع نص (مطلوب) — يجب شرح سبب الإنهاء\n4. انقر **تأكيد** لإنهاء المحاولة\n5. يتم إنهاء اختبار المرشح فوراً وحفظ إجاباته الحالية\n6. تتغير حالة المحاولة إلى **مُنهى** (شارة حمراء)",
          imagePlaceholder: "/tutorials/candidates-examops-terminate.png",
          tipEn:
            "Termination is a serious action. The candidate's answers up to the point of termination are saved and can be graded. Use this when there's confirmed cheating or a severe policy violation.",
          tipAr:
            "الإنهاء إجراء خطير. يتم حفظ إجابات المرشح حتى نقطة الإنهاء ويمكن تقييمها. استخدم هذا عند التأكد من الغش أو مخالفة جسيمة للسياسة.",
        },
      ],
      examples: [
        {
          titleEn: "Operations Decision Guide",
          titleAr: "دليل قرارات العمليات",
          contentEn:
            "**When to use each operation:**\n\n✓ **Allow New Attempt** — candidate had technical issues that prevented fair completion, or institutional policy allows retake\n✓ **Add Time** — internet outage during exam, system error caused delay, or accessibility accommodation\n✗ **Terminate** — confirmed cheating detected by proctor, severe policy violation, or candidate requested exam cancellation\n\n**All operations are:**\n- Logged with the admin's identity and timestamp\n- Require a mandatory reason text\n- Tracked in the system audit trail\n- Visible in the Candidate Exam Details page",
          contentAr:
            "**متى تستخدم كل عملية:**\n\n✓ **السماح بمحاولة جديدة** — واجه المرشح مشاكل تقنية منعت الإكمال العادل، أو سياسة المؤسسة تسمح بالإعادة\n✓ **إضافة وقت** — انقطاع إنترنت أثناء الاختبار، خطأ نظامي سبب تأخير، أو تسهيلات وصول\n✗ **إنهاء** — تأكد من الغش بواسطة المراقب، مخالفة جسيمة للسياسة، أو طلب المرشح إلغاء الاختبار\n\n**جميع العمليات:**\n- مسجلة بهوية المدير والطابع الزمني\n- تتطلب نص سبب إلزامي\n- متتبعة في سجل تدقيق النظام\n- مرئية في صفحة تفاصيل اختبار المرشح",
        },
      ],
    },
    // ── Section 6: Candidate Exam Details ──
    {
      id: "candidate-exam-details",
      titleEn: "6. Candidate Exam Details",
      titleAr: "6. تفاصيل اختبار المرشح",
      descriptionEn:
        "Comprehensive forensic view of any candidate's exam attempt — timing, performance, activity, assignment info, proctor evidence, and complete event timeline.",
      descriptionAr:
        "عرض شامل وتفصيلي لأي محاولة اختبار للمرشح — التوقيت والأداء والنشاط ومعلومات التعيين وأدلة المراقبة والجدول الزمني الكامل للأحداث.",
      steps: [
        {
          id: "exam-details-search",
          titleEn: "Search for a Candidate's Exam",
          titleAr: "البحث عن اختبار مرشح",
          descriptionEn:
            'Navigate to **Candidates** → **Candidate Exam Details** from the sidebar.\n\nThe page starts with a **collapsible search section** with three progressive fields:\n\n1. **Select Candidate** — searchable dropdown (type to search by name, email, or roll number)\n2. **Select Exam** — appears after selecting a candidate; shows all exams this candidate has taken with attempt count\n3. **Select Attempt** — optional; defaults to "**Latest**" attempt. You can switch to any historical attempt (#1, #2, etc.) with its status name',
          descriptionAr:
            'انتقل إلى **المرشحون** ← **تفاصيل اختبار المرشح** من القائمة الجانبية.\n\nتبدأ الصفحة بـ**قسم بحث قابل للطي** بثلاثة حقول متدرجة:\n\n1. **اختر المرشح** — قائمة منسدلة قابلة للبحث (اكتب للبحث بالاسم أو البريد أو الرقم)\n2. **اختر الاختبار** — يظهر بعد اختيار المرشح؛ يعرض جميع الاختبارات التي أداها هذا المرشح مع عدد المحاولات\n3. **اختر المحاولة** — اختياري؛ يتم تعيينه افتراضياً إلى "**الأحدث**". يمكنك التبديل لأي محاولة سابقة (#1، #2، إلخ) مع اسم حالتها',
          imagePlaceholder: "/tutorials/candidates-examdetails-search.png",
          tipEn:
            "You can switch between attempts without leaving the page — all data updates in-place. Use this to compare a candidate's performance across multiple attempts.",
          tipAr:
            "يمكنك التبديل بين المحاولات دون مغادرة الصفحة — تتحدث جميع البيانات في مكانها. استخدم هذا لمقارنة أداء المرشح عبر محاولات متعددة.",
        },
        {
          id: "exam-details-header",
          titleEn: "Header Card — Candidate & Exam Overview",
          titleAr: "بطاقة الرأس — نظرة عامة على المرشح والاختبار",
          descriptionEn:
            'The top section shows a comprehensive **header card** with three data groups:\n\n**Candidate Info:**\n- Full name (bilingual)\n- Email address\n- Roll No (if present)\n- Mobile (if present)\n- Status badge (Active/Blocked)\n\n**Exam Info:**\n- Title (bilingual)\n- Duration in minutes\n- Pass score percentage\n- Max attempts allowed\n- Published/Draft status\n- Proctored badge (if the exam requires proctoring)\n\n**Current Attempt:**\n- Status badge with icon (color-coded)\n- Attempt number (e.g., "Attempt #2 of 3")\n- Quick links: **View Result** and **View Grading** (if available)',
          descriptionAr:
            'القسم العلوي يعرض **بطاقة رأس** شاملة بثلاث مجموعات بيانات:\n\n**معلومات المرشح:**\n- الاسم الكامل (ثنائي اللغة)\n- عنوان البريد\n- الرقم (إن وُجد)\n- الجوال (إن وُجد)\n- شارة الحالة (نشط/محظور)\n\n**معلومات الاختبار:**\n- العنوان (ثنائي اللغة)\n- المدة بالدقائق\n- نسبة درجة النجاح\n- أقصى محاولات مسموحة\n- حالة النشر/المسودة\n- شارة المراقبة (إذا كان الاختبار يتطلب مراقبة)\n\n**المحاولة الحالية:**\n- شارة الحالة مع أيقونة (ملونة)\n- رقم المحاولة (مثل: "المحاولة #2 من 3")\n- روابط سريعة: **عرض النتيجة** و**عرض التقييم** (إن توفرت)',
          imagePlaceholder: "/tutorials/candidates-examdetails-header.png",
        },
        {
          id: "exam-details-metrics",
          titleEn: "Metrics Cards",
          titleAr: "بطاقات المقاييس",
          descriptionEn:
            'Below the header, three **metric cards** display detailed attempt data:\n\n**Timing Card:**\n- **Started at** — exact date/time the candidate started\n- **Submitted at** — when the exam was submitted (or blank if still active)\n- **Expires at** — the calculated expiry time\n- **Total Duration** — time spent in HH:MM:SS format\n- **Remaining** — time left if still active\n\n**Performance Card:**\n- **Total Questions** — number of questions in the exam\n- **Answered** — how many the candidate answered\n- **Score** — achieved score / maximum score\n- **Pass Status** — "Passed" (green) or "Failed" (red) badge\n- **Resume Count** — how many times the candidate resumed the exam\n\n**Activity Card:**\n- **Last Activity** — timestamp of the last recorded action\n- **IP Address** — the candidate\'s IP (if captured)\n- **Device Info** — browser/OS details (if captured)\n- **Force Submitted By** — admin who forced submission (if applicable) with timestamp',
          descriptionAr:
            'أسفل الرأس، ثلاث **بطاقات مقاييس** تعرض بيانات المحاولة التفصيلية:\n\n**بطاقة التوقيت:**\n- **بدأ في** — التاريخ/الوقت الدقيق لبدء المرشح\n- **قُدّم في** — متى تم تقديم الاختبار (أو فارغ إذا لا يزال نشطاً)\n- **ينتهي في** — وقت الانتهاء المحسوب\n- **المدة الإجمالية** — الوقت المستغرق بتنسيق HH:MM:SS\n- **المتبقي** — الوقت المتبقي إذا لا يزال نشطاً\n\n**بطاقة الأداء:**\n- **إجمالي الأسئلة** — عدد الأسئلة في الاختبار\n- **المُجاب** — كم أجاب المرشح\n- **الدرجة** — الدرجة المحققة / الدرجة القصوى\n- **حالة النجاح** — شارة "ناجح" (أخضر) أو "غير ناجح" (أحمر)\n- **عدد الاستئنافات** — كم مرة استأنف المرشح الاختبار\n\n**بطاقة النشاط:**\n- **آخر نشاط** — طابع زمني لآخر إجراء مسجل\n- **عنوان IP** — عنوان IP للمرشح (إذا تم التقاطه)\n- **معلومات الجهاز** — تفاصيل المتصفح/نظام التشغيل (إذا تم التقاطها)\n- **قدّم إجبارياً بواسطة** — المدير الذي فرض التقديم (إن وُجد) مع الطابع الزمني',
          imagePlaceholder: "/tutorials/candidates-examdetails-metrics.png",
        },
        {
          id: "exam-details-assignment",
          titleEn: "Assignment Information",
          titleAr: "معلومات التعيين",
          descriptionEn:
            "If the candidate was **assigned** to the exam (not self-enrolled), this section shows:\n\n- **Schedule From** — assignment window start date/time\n- **Schedule To** — assignment window end date/time\n- **Assigned By** — the admin/instructor who created the assignment\n- **Assigned At** — when the assignment was created\n- **Is Active** — whether the assignment is currently active (Yes/No)",
          descriptionAr:
            "إذا كان المرشح **معيّناً** للاختبار (ليس تسجيلاً ذاتياً)، يعرض هذا القسم:\n\n- **الجدول من** — تاريخ/وقت بدء نافذة التعيين\n- **الجدول إلى** — تاريخ/وقت نهاية نافذة التعيين\n- **عيّنه** — المدير/المدرّس الذي أنشأ التعيين\n- **عُيّن في** — متى تم إنشاء التعيين\n- **نشط** — هل التعيين نشط حالياً (نعم/لا)",
          imagePlaceholder: "/tutorials/candidates-examdetails-assignment.png",
        },
        {
          id: "exam-details-proctor",
          titleEn: "Proctor Session & Evidence",
          titleAr: "جلسة المراقبة والأدلة",
          descriptionEn:
            'If the exam has **proctoring enabled**, this section shows comprehensive proctor data:\n\n**Proctor Summary:**\n- **Session ID** — unique identifier for the proctor session\n- **Mode** — e.g., "AI Proctoring", "Live"\n- **Status** — Active or Completed\n- **Total Events** — number of events recorded\n- **Total Violations** — detected violations count\n- **Risk Score & Level** — numerical risk score with color-coded badge (Low/Medium/High/Critical)\n\n**Video Evidence:**\n- Video file name, size (formatted: B/KB/MB/GB), upload status\n- Preview link to watch the recording\n- Duration in seconds\n\n**Screenshot Evidence:**\n- Multiple captured screenshots shown in a grid/carousel\n- Each screenshot shows: filename, capture date/time, file size, upload status\n- Preview/zoom option for each screenshot',
          descriptionAr:
            'إذا كان الاختبار بـ**تمكين المراقبة**، يعرض هذا القسم بيانات مراقبة شاملة:\n\n**ملخص المراقبة:**\n- **رقم الجلسة** — معرّف فريد لجلسة المراقبة\n- **الوضع** — مثل "مراقبة AI"، "مباشر"\n- **الحالة** — نشط أو مكتمل\n- **إجمالي الأحداث** — عدد الأحداث المسجلة\n- **إجمالي المخالفات** — عدد المخالفات المكتشفة\n- **نقاط ومستوى المخاطر** — درجة مخاطر رقمية مع شارة ملونة (منخفض/متوسط/عالي/حرج)\n\n**أدلة الفيديو:**\n- اسم ملف الفيديو، الحجم (بالتنسيق: B/KB/MB/GB)، حالة الرفع\n- رابط معاينة لمشاهدة التسجيل\n- المدة بالثواني\n\n**أدلة لقطات الشاشة:**\n- عدة لقطات شاشة ملتقطة معروضة في شبكة/عرض دائري\n- كل لقطة تعرض: اسم الملف، تاريخ/وقت الالتقاط، حجم الملف، حالة الرفع\n- خيار معاينة/تكبير لكل لقطة',
          imagePlaceholder: "/tutorials/candidates-examdetails-proctor.png",
        },
        {
          id: "exam-details-ai-analysis",
          titleEn: "AI Analysis",
          titleAr: "تحليل الذكاء الاصطناعي",
          descriptionEn:
            "For proctored exams, an **AI Analysis** section provides automated insights:\n\n- Click the **Generate AI Analysis** button to analyze the proctor session data\n- The AI reviews all captured events, violations, video, and screenshots\n- Results include risk assessment and behavioral analysis\n- Loading and error states are handled gracefully",
          descriptionAr:
            "للاختبارات المراقبة، يوفر قسم **تحليل الذكاء الاصطناعي** رؤى آلية:\n\n- انقر زر **إنشاء تحليل AI** لتحليل بيانات جلسة المراقبة\n- يراجع الذكاء الاصطناعي جميع الأحداث والمخالفات والفيديو ولقطات الشاشة الملتقطة\n- تتضمن النتائج تقييم المخاطر والتحليل السلوكي\n- يتم التعامل مع حالات التحميل والأخطاء بسلاسة",
          imagePlaceholder: "/tutorials/candidates-examdetails-ai.png",
        },
        {
          id: "exam-details-event-timeline",
          titleEn: "Event Timeline",
          titleAr: "الجدول الزمني للأحداث",
          descriptionEn:
            'The **Event Timeline** provides a chronological log of every action during the exam attempt:\n\n- **Event Date/Time** — when the event occurred\n- **Event Type** — categorized event name (e.g., "Question Answered", "Tab Switch", "Face Not Detected")\n- **Question Context** — which question was active (if applicable)\n- **Answer Summary** — what was answered (if applicable)\n- **Metadata** — additional contextual data\n\nThe timeline is **sortable** and **filterable**, allowing you to review the entire exam session chronologically or focus on specific event types.',
          descriptionAr:
            'يوفر **الجدول الزمني للأحداث** سجلاً زمنياً لكل إجراء أثناء محاولة الاختبار:\n\n- **تاريخ/وقت الحدث** — متى وقع الحدث\n- **نوع الحدث** — اسم الحدث المصنّف (مثل: "إجابة سؤال"، "تبديل تبويب"، "وجه غير مكتشف")\n- **سياق السؤال** — أي سؤال كان نشطاً (إن وُجد)\n- **ملخص الإجابة** — ماذا تمت الإجابة (إن وُجد)\n- **البيانات الوصفية** — بيانات سياقية إضافية\n\nالجدول الزمني **قابل للترتيب** و**قابل للتصفية**، مما يتيح لك مراجعة جلسة الاختبار بالكامل زمنياً أو التركيز على أنواع أحداث محددة.',
          imagePlaceholder: "/tutorials/candidates-examdetails-timeline.png",
          tipEn:
            "The event timeline is the most valuable tool for investigating suspected cheating. Look for patterns like: frequent tab switches, face not detected events, or rapid answer changes.",
          tipAr:
            "الجدول الزمني للأحداث هو الأداة الأكثر قيمة للتحقيق في الغش المشتبه. ابحث عن أنماط مثل: تبديل التبويبات المتكرر، أحداث عدم اكتشاف الوجه، أو تغييرات الإجابات السريعة.",
        },
      ],
      examples: [
        {
          titleEn: "Investigation Workflow",
          titleAr: "سير عمل التحقيق",
          contentEn:
            "**Scenario:** Investigate a flagged candidate's exam attempt.\n\n1. Search for the candidate by name or email\n2. Select the flagged exam\n3. Review the **header card** for attempt status and score\n4. Check **metrics cards** — look for unusual timing patterns (very fast completion, multiple resumes)\n5. Review **proctor session** — check risk score, violation count, and video evidence\n6. Browse **event timeline** — filter for tab switches, face detection failures, and copy/paste events\n7. Click **Generate AI Analysis** for automated risk assessment\n8. Use **quick links** to navigate to the grading page or result page for further action",
          contentAr:
            "**السيناريو:** التحقيق في محاولة اختبار مرشح مُعلّم.\n\n1. ابحث عن المرشح بالاسم أو البريد\n2. اختر الاختبار المُعلّم\n3. راجع **بطاقة الرأس** لحالة المحاولة والدرجة\n4. تحقق من **بطاقات المقاييس** — ابحث عن أنماط توقيت غير عادية (إكمال سريع جداً، استئنافات متعددة)\n5. راجع **جلسة المراقبة** — تحقق من درجة المخاطر وعدد المخالفات وأدلة الفيديو\n6. تصفح **الجدول الزمني** — فلتر لتبديل التبويبات وفشل اكتشاف الوجه وأحداث النسخ/اللصق\n7. انقر **إنشاء تحليل AI** للتقييم الآلي للمخاطر\n8. استخدم **الروابط السريعة** للانتقال لصفحة التقييم أو النتيجة لاتخاذ إجراء إضافي",
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// ADMINISTRATION MODULE TUTORIAL
// ────────────────────────────────────────────────────────

export const administrationTutorial: TutorialModule = {
  id: "administration",
  slug: "administration",
  titleEn: "Settings & Administration",
  titleAr: "الإعدادات والإدارة",
  descriptionEn:
    "Learn how to manage users, roles, permissions, departments, organization branding, system settings, notification configuration, and system logs. Covers department isolation, the shared candidate model, and role-based access.",
  descriptionAr:
    "تعلّم كيفية إدارة المستخدمين والأدوار والصلاحيات والأقسام وعلامة المنظمة وإعدادات النظام وتكوين الإشعارات وسجلات النظام. يغطي عزل الأقسام ونموذج المرشح المشترك والوصول القائم على الأدوار.",
  iconName: "Settings",
  videoPlaceholder: "/tutorials/administration-overview.mp4",
  sections: [
    // ── Section 1: Overview & Access ──
    {
      id: "admin-overview",
      titleEn: "1. Overview & Access Control",
      titleAr: "1. نظرة عامة والتحكم بالوصول",
      descriptionEn:
        "Understand the Administration module, who can access it, the role system, and the critical concepts of department isolation vs. shared candidate data.",
      descriptionAr:
        "فهم وحدة الإدارة، من يمكنه الوصول إليها، نظام الأدوار، والمفاهيم الحرجة لعزل الأقسام مقابل بيانات المرشحين المشتركة.",
      steps: [
        {
          id: "admin-what-is",
          titleEn: "What Is the Administration Module?",
          titleAr: "ما هي وحدة الإدارة؟",
          descriptionEn:
            "The **Administration** module is where **SuperAdmin** users manage the entire SmartExam platform. It covers three main sidebar groups:\n\n**Administration:**\n- **Users** — manage admin, instructor, examiner, and proctor accounts\n- **Permissions** — assign roles and departments to users\n- **Departments** — create and manage organizational departments\n- **Organization** — branding, logo, colors, and contact details\n- **Settings** — system-wide configuration (security, proctoring, general)\n\n**Notifications:**\n- **Notification Settings** — SMTP email and SMS provider configuration\n- **Notification Templates** — customize email/SMS content per event\n- **Notification Logs** — track all sent notifications with retry capability\n\n**System Logs:**\n- **Audit Logs** — immutable compliance trail of all system actions\n- **User Logs** — admin and instructor activity tracking\n- **Candidate Logs** — candidate login and exam activity\n- **Proctor Logs** — proctoring session and incident logs\n- **Developer Logs** — system errors and exceptions with stack traces",
          descriptionAr:
            "وحدة **الإدارة** هي المكان الذي يُدير فيه مستخدمو **المسؤول الأعلى** منصة SmartExam بأكملها. تغطي ثلاث مجموعات رئيسية في القائمة الجانبية:\n\n**الإدارة:**\n- **المستخدمون** — إدارة حسابات المديرين والمدرّسين والممتحنين والمراقبين\n- **الصلاحيات** — تعيين الأدوار والأقسام للمستخدمين\n- **الأقسام** — إنشاء وإدارة أقسام المنظمة\n- **المنظمة** — العلامة التجارية والشعار والألوان وتفاصيل الاتصال\n- **الإعدادات** — تكوين على مستوى النظام (الأمان، المراقبة، عام)\n\n**الإشعارات:**\n- **إعدادات الإشعارات** — تكوين بريد SMTP ومزود SMS\n- **قوالب الإشعارات** — تخصيص محتوى البريد/SMS لكل حدث\n- **سجلات الإشعارات** — تتبع جميع الإشعارات المُرسلة مع إمكانية إعادة المحاولة\n\n**سجلات النظام:**\n- **سجلات التدقيق** — سجل امتثال غير قابل للتغيير لجميع إجراءات النظام\n- **سجلات المستخدمين** — تتبع نشاط المديرين والمدرّسين\n- **سجلات المرشحين** — تسجيل دخول المرشحين ونشاط الاختبار\n- **سجلات المراقبة** — جلسات المراقبة وسجلات الحوادث\n- **سجلات المطورين** — أخطاء النظام والاستثناءات مع تتبع المكدس",
          imagePlaceholder: "/tutorials/admin-overview.png",
        },
        {
          id: "admin-access-roles",
          titleEn: "Who Can Access Administration?",
          titleAr: "من يمكنه الوصول للإدارة؟",
          descriptionEn:
            "Only the **SuperAdmin** role has full access to all Administration, Notifications, and System Logs pages.\n\n**System Roles Reference:**\n- **SuperAdmin** — full platform control: users, departments, settings, logs, and all features\n- **Admin** — department-level administration and user management\n- **Instructor** — create exams, grade, manage candidates\n- **Examiner** — review grading and results\n- **Proctor** — monitor exam sessions, handle incidents\n- **ProctorReviewer** — review proctor decisions and session recordings\n- **Auditor** — view audit logs and compliance reports\n- **Candidate** — take exams (managed separately in Candidate Management)",
          descriptionAr:
            "فقط دور **المسؤول الأعلى** لديه وصول كامل لجميع صفحات الإدارة والإشعارات وسجلات النظام.\n\n**مرجع أدوار النظام:**\n- **المسؤول الأعلى** — تحكم كامل بالمنصة: المستخدمين والأقسام والإعدادات والسجلات وجميع الميزات\n- **مدير** — إدارة على مستوى القسم وإدارة المستخدمين\n- **مدرّس** — إنشاء الاختبارات والتقييم وإدارة المرشحين\n- **ممتحن** — مراجعة التقييم والنتائج\n- **مراقب** — مراقبة جلسات الاختبار ومعالجة الحوادث\n- **مراجع المراقبة** — مراجعة قرارات المراقب وتسجيلات الجلسات\n- **مدقق** — عرض سجلات التدقيق وتقارير الامتثال\n- **مرشح** — أداء الاختبارات (يُدار بشكل منفصل في إدارة المرشحين)",
          imagePlaceholder: "/tutorials/admin-roles.png",
          noteEn:
            "The **Candidate** role is managed separately through the Candidate Management module and does not appear in the Users page. Candidates have their own registration, import, and management flow.",
          noteAr:
            "دور **المرشح** يُدار بشكل منفصل من خلال وحدة إدارة المرشحين ولا يظهر في صفحة المستخدمين. للمرشحين سير تسجيل واستيراد وإدارة خاص بهم.",
        },
        {
          id: "department-isolation-concept",
          titleEn: "Department Isolation vs. Shared Candidates",
          titleAr: "عزل الأقسام مقابل المرشحين المشتركين",
          descriptionEn:
            "SmartExam uses a **hybrid isolation model** that balances organizational structure with operational flexibility:\n\n**Department Isolation (Staff & Data):**\n- Each **user** (admin, instructor, proctor, etc.) can be assigned to **one department**\n- **Exams, questions, and content** are scoped to the department of their creator\n- Each department operates **independently** with its own question bank, exams, and grading\n- Department assignments control **data visibility** and access scope\n\n**Shared Candidates (Cross-Department):**\n- **Candidate data is shared across ALL departments** — this is by design\n- A candidate registered once can **take exams from any department**\n- There is **no need to re-register** candidates per department\n- Candidate **credentials remain the same** across the entire platform\n- Any authorized user from any department can **assign candidates** to their exams\n\nThis means:\n✓ HR Department can create compliance exams for all employees\n✓ IT Department can assign the same candidates to technical certifications\n✓ Finance Department can test the same people on accounting standards\n✓ All results are tracked under **one unified candidate profile**",
          descriptionAr:
            "يستخدم SmartExam **نموذج عزل هجين** يوازن بين الهيكل التنظيمي والمرونة التشغيلية:\n\n**عزل الأقسام (الموظفون والبيانات):**\n- كل **مستخدم** (مدير، مدرّس، مراقب، إلخ) يمكن تعيينه إلى **قسم واحد**\n- **الاختبارات والأسئلة والمحتوى** مُحددة بقسم مُنشئها\n- كل قسم يعمل **بشكل مستقل** مع بنك أسئلته واختباراته وتقييمه الخاص\n- تعيينات الأقسام تتحكم في **رؤية البيانات** ونطاق الوصول\n\n**المرشحون المشتركون (عبر الأقسام):**\n- **بيانات المرشحين مشتركة عبر جميع الأقسام** — هذا بالتصميم\n- المرشح المسجل مرة واحدة يمكنه **أداء اختبارات من أي قسم**\n- **لا حاجة لإعادة تسجيل** المرشحين لكل قسم\n- **بيانات دخول المرشح تبقى نفسها** عبر كامل المنصة\n- أي مستخدم مُخوّل من أي قسم يمكنه **تعيين المرشحين** لاختباراته\n\nهذا يعني:\n✓ قسم الموارد البشرية يمكنه إنشاء اختبارات امتثال لجميع الموظفين\n✓ قسم تقنية المعلومات يمكنه تعيين نفس المرشحين لشهادات تقنية\n✓ قسم المالية يمكنه اختبار نفس الأشخاص على معايير المحاسبة\n✓ جميع النتائج تُتبع تحت **ملف مرشح موحد واحد**",
          imagePlaceholder: "/tutorials/admin-department-isolation.png",
          tipEn:
            "Think of departments as **staff containers** — they organize your team and their work. But candidates are **global** — they belong to the platform, not to any single department.",
          tipAr:
            "فكّر في الأقسام كـ**حاويات للموظفين** — تنظم فريقك وعملهم. لكن المرشحين **عالميون** — ينتمون للمنصة وليس لأي قسم بعينه.",
        },
      ],
      examples: [
        {
          titleEn: "Department Isolation Example",
          titleAr: "مثال على عزل الأقسام",
          contentEn:
            '**Scenario:** A company with 3 departments — IT, HR, and Finance.\n\n**Staff Isolation:**\n- IT Instructor creates "Network Security Exam" → visible only to IT staff\n- HR Admin creates "Compliance Quiz" → visible only to HR staff\n- Finance Instructor creates "Accounting Test" → visible only to Finance staff\n\n**Shared Candidates:**\n- Employee "Ahmed" is registered ONCE in the system\n- IT assigns Ahmed to "Network Security Exam"\n- HR assigns Ahmed to "Compliance Quiz"\n- Finance assigns Ahmed to "Accounting Test"\n- Ahmed sees ALL 3 exams in his dashboard with ONE login\n- All results appear under Ahmed\'s unified profile',
          contentAr:
            '**السيناريو:** شركة بها 3 أقسام — تقنية المعلومات والموارد البشرية والمالية.\n\n**عزل الموظفين:**\n- مدرّس IT ينشئ "اختبار أمن الشبكات" → مرئي فقط لموظفي IT\n- مدير HR ينشئ "اختبار الامتثال" → مرئي فقط لموظفي HR\n- مدرّس المالية ينشئ "اختبار المحاسبة" → مرئي فقط لموظفي المالية\n\n**المرشحون المشتركون:**\n- الموظف "أحمد" مسجل مرة واحدة في النظام\n- IT يعيّن أحمد لـ"اختبار أمن الشبكات"\n- HR يعيّن أحمد لـ"اختبار الامتثال"\n- المالية تعيّن أحمد لـ"اختبار المحاسبة"\n- أحمد يرى جميع الاختبارات الـ3 في لوحته بتسجيل دخول واحد\n- جميع النتائج تظهر تحت ملف أحمد الموحد',
        },
      ],
    },
    // ── Section 2: Users Management ──
    {
      id: "users-management",
      titleEn: "2. Users Management",
      titleAr: "2. إدارة المستخدمين",
      descriptionEn:
        "Create, edit, and manage staff accounts — admins, instructors, examiners, proctors, and other platform roles. Candidate accounts are managed separately.",
      descriptionAr:
        "إنشاء وتعديل وإدارة حسابات الموظفين — المديرين والمدرّسين والممتحنين والمراقبين والأدوار الأخرى. حسابات المرشحين تُدار بشكل منفصل.",
      steps: [
        {
          id: "users-list-page",
          titleEn: "Users List Page",
          titleAr: "صفحة قائمة المستخدمين",
          descriptionEn:
            "Navigate to **Administration** → **Users** from the sidebar.\n\n**Statistics Cards (Top):**\n- **Total Users** — total registered staff accounts\n- **Active** — users with active status\n- **Inactive** — disabled user accounts\n- **Admin Count** — number of admin-role users\n\n**Search & Filters:**\n- **Search** — find users by name or email (300ms debounce)\n- **Role** dropdown — filter by: Admin, Instructor, Examiner, Proctor, ProctorReviewer, Auditor\n- **Status** dropdown — All, Active, Inactive\n- **Department** dropdown — filter by assigned department\n\n**Users Table:**\n- **Full Name** — bilingual display (English and Arabic)\n- **Email** — user email address\n- **Role** — assigned role (badge)\n- **Status** — Active/Inactive badge\n- **Department** — assigned department name\n- **Created** — registration date\n- **Actions** — dropdown menu with operations",
          descriptionAr:
            "انتقل إلى **الإدارة** ← **المستخدمون** من القائمة الجانبية.\n\n**بطاقات الإحصائيات (الأعلى):**\n- **إجمالي المستخدمين** — إجمالي حسابات الموظفين المسجلين\n- **نشط** — المستخدمون ذوو الحالة النشطة\n- **غير نشط** — حسابات المستخدمين المعطلة\n- **عدد المديرين** — عدد المستخدمين بدور مدير\n\n**البحث والتصفية:**\n- **البحث** — العثور على مستخدمين بالاسم أو البريد (تأخير 300 مللي ثانية)\n- **الدور** — التصفية حسب: مدير، مدرّس، ممتحن، مراقب، مراجع المراقبة، مدقق\n- **الحالة** — الكل، نشط، غير نشط\n- **القسم** — التصفية حسب القسم المعيّن\n\n**جدول المستخدمين:**\n- **الاسم الكامل** — عرض ثنائي اللغة (إنجليزي وعربي)\n- **البريد** — عنوان البريد الإلكتروني\n- **الدور** — الدور المعيّن (شارة)\n- **الحالة** — شارة نشط/غير نشط\n- **القسم** — اسم القسم المعيّن\n- **الإنشاء** — تاريخ التسجيل\n- **الإجراءات** — قائمة منسدلة بالعمليات",
          imagePlaceholder: "/tutorials/admin-users-list.png",
          noteEn:
            "The Users page shows **staff accounts only** — Candidate accounts are separated and managed through the Candidate Management module under Candidates in the sidebar.",
          noteAr:
            "صفحة المستخدمين تعرض **حسابات الموظفين فقط** — حسابات المرشحين منفصلة وتُدار من خلال وحدة إدارة المرشحين تحت المرشحين في القائمة الجانبية.",
        },
        {
          id: "create-user",
          titleEn: "Create a New User",
          titleAr: "إنشاء مستخدم جديد",
          descriptionEn:
            "Click the **+ Create User** button to navigate to the user creation page.\n\nFill in the user details and click **Save** to create the account.",
          descriptionAr:
            "انقر زر **+ إنشاء مستخدم** للانتقال لصفحة إنشاء المستخدم.\n\nاملأ تفاصيل المستخدم وانقر **حفظ** لإنشاء الحساب.",
          imagePlaceholder: "/tutorials/admin-users-create.png",
          fields: [
            {
              nameEn: "Full Name (English)",
              nameAr: "الاسم الكامل (إنجليزي)",
              required: true,
              descriptionEn: "User's full name in English",
              descriptionAr: "الاسم الكامل للمستخدم بالإنجليزية",
            },
            {
              nameEn: "Full Name (Arabic)",
              nameAr: "الاسم الكامل (عربي)",
              required: true,
              descriptionEn: "User's full name in Arabic",
              descriptionAr: "الاسم الكامل للمستخدم بالعربية",
            },
            {
              nameEn: "Email",
              nameAr: "البريد الإلكتروني",
              required: true,
              descriptionEn:
                "Unique email address — used as the user's **login credential**",
              descriptionAr:
                "عنوان بريد إلكتروني فريد — يُستخدم كـ**بيانات دخول المستخدم**",
            },
            {
              nameEn: "Role",
              nameAr: "الدور",
              required: true,
              descriptionEn:
                "Select a role: **Admin**, **Instructor**, **Examiner**, **Proctor**, **ProctorReviewer**, **Auditor**, or **SuperAdmin**",
              descriptionAr:
                "اختر دوراً: **مدير**، **مدرّس**، **ممتحن**، **مراقب**، **مراجع المراقبة**، **مدقق**، أو **مسؤول أعلى**",
            },
            {
              nameEn: "Department",
              nameAr: "القسم",
              required: false,
              descriptionEn:
                "Optionally assign the user to a department. This controls their data scope and visibility.",
              descriptionAr:
                "اختيارياً عيّن المستخدم لقسم. هذا يتحكم في نطاق بياناتهم وإمكانية رؤيتها.",
            },
            {
              nameEn: "Password",
              nameAr: "كلمة المرور",
              required: true,
              descriptionEn:
                "Initial password (minimum **8 characters**). Must match the confirm password field.",
              descriptionAr:
                "كلمة المرور الأولية (الحد الأدنى **8 أحرف**). يجب أن تطابق حقل تأكيد كلمة المرور.",
            },
            {
              nameEn: "Confirm Password",
              nameAr: "تأكيد كلمة المرور",
              required: true,
              descriptionEn: "Re-enter the password to confirm it matches",
              descriptionAr: "أعد إدخال كلمة المرور للتأكيد",
            },
          ],
        },
        {
          id: "user-detail-page",
          titleEn: "User Detail Page",
          titleAr: "صفحة تفاصيل المستخدم",
          descriptionEn:
            "Click **View** from the Actions dropdown on any user row to see the full detail page.\n\nThe detail page displays:\n- **User avatar** — first letter of the name\n- **Full name** (bilingual)\n- **Email** — login credential\n- **Role** — assigned role\n- **Status** — Active/Inactive\n- **Department** — assigned department (if any)\n- **Created date** — when the account was created\n\n**Action buttons:**\n- **Edit** — navigate to the edit page\n- **Reset Password** — generate a new temporary password (shown in a toast notification)",
          descriptionAr:
            "انقر **عرض** من القائمة المنسدلة للإجراءات لأي صف مستخدم لرؤية صفحة التفاصيل الكاملة.\n\nتعرض صفحة التفاصيل:\n- **صورة المستخدم** — الحرف الأول من الاسم\n- **الاسم الكامل** (ثنائي اللغة)\n- **البريد** — بيانات الدخول\n- **الدور** — الدور المعيّن\n- **الحالة** — نشط/غير نشط\n- **القسم** — القسم المعيّن (إن وُجد)\n- **تاريخ الإنشاء** — متى تم إنشاء الحساب\n\n**أزرار الإجراءات:**\n- **تعديل** — الانتقال لصفحة التعديل\n- **إعادة تعيين كلمة المرور** — إنشاء كلمة مرور مؤقتة جديدة (تُعرض في إشعار)",
          imagePlaceholder: "/tutorials/admin-users-detail.png",
        },
        {
          id: "edit-user",
          titleEn: "Edit User & Account Status",
          titleAr: "تعديل المستخدم وحالة الحساب",
          descriptionEn:
            "Click **Edit** from the Actions dropdown or the user detail page to open the edit form.\n\n**Editable Fields:**\n- **Full Name** (English & Arabic)\n- **Role** — change the user's assigned role\n- **Account Status** — toggle to **Enable** or **Disable** the account\n\n**Note:** Disabling an account prevents the user from logging in but preserves their data and history.",
          descriptionAr:
            "انقر **تعديل** من القائمة المنسدلة للإجراءات أو من صفحة تفاصيل المستخدم لفتح نموذج التعديل.\n\n**الحقول القابلة للتعديل:**\n- **الاسم الكامل** (إنجليزي وعربي)\n- **الدور** — تغيير دور المستخدم المعيّن\n- **حالة الحساب** — تبديل لـ**تفعيل** أو **تعطيل** الحساب\n\n**ملاحظة:** تعطيل الحساب يمنع المستخدم من تسجيل الدخول لكن يحافظ على بياناته وسجله.",
          imagePlaceholder: "/tutorials/admin-users-edit.png",
        },
        {
          id: "user-actions",
          titleEn: "User Actions (Reset Password & Delete)",
          titleAr: "إجراءات المستخدم (إعادة تعيين كلمة المرور والحذف)",
          descriptionEn:
            "The **Actions** dropdown on each user row provides:\n\n- **View** — open the user detail page\n- **Edit** — navigate to the edit page\n- **Reset Password** — generates a new temporary password and displays it in a **toast notification**. Share this password with the user securely.\n- **Delete** — permanently remove the user account (requires confirmation dialog)",
          descriptionAr:
            "القائمة المنسدلة **الإجراءات** في كل صف مستخدم توفر:\n\n- **عرض** — فتح صفحة تفاصيل المستخدم\n- **تعديل** — الانتقال لصفحة التعديل\n- **إعادة تعيين كلمة المرور** — إنشاء كلمة مرور مؤقتة جديدة وعرضها في **إشعار**. شارك كلمة المرور هذه مع المستخدم بشكل آمن.\n- **حذف** — إزالة حساب المستخدم نهائياً (يتطلب نافذة تأكيد)",
          imagePlaceholder: "/tutorials/admin-users-actions.png",
          tipEn:
            "When you reset a password, the temporary password is shown **only once** in the toast. Make sure to copy it before it disappears. Consider using a secure channel to share it with the user.",
          tipAr:
            "عند إعادة تعيين كلمة المرور، تُعرض كلمة المرور المؤقتة **مرة واحدة فقط** في الإشعار. تأكد من نسخها قبل أن تختفي. فكّر في استخدام قناة آمنة لمشاركتها مع المستخدم.",
        },
      ],
    },
    // ── Section 3: Permissions Management ──
    {
      id: "permissions-management",
      titleEn: "3. Permissions & Role Assignment",
      titleAr: "3. الصلاحيات وتعيين الأدوار",
      descriptionEn:
        "Advanced role and department assignment — change user roles, assign departments, and batch-manage permissions with tracked pending changes.",
      descriptionAr:
        "تعيين متقدم للأدوار والأقسام — تغيير أدوار المستخدمين وتعيين الأقسام وإدارة الصلاحيات الجماعية مع تتبع التغييرات المعلقة.",
      steps: [
        {
          id: "permissions-page",
          titleEn: "Permissions Page Overview",
          titleAr: "نظرة عامة على صفحة الصلاحيات",
          descriptionEn:
            "Navigate to **Administration** → **Permissions** from the sidebar.\n\nThis page provides **inline editing** of user roles and department assignments directly in the table — no separate form needed.\n\n**Search & Filters:**\n- **Search** — find users by name or email (400ms debounce)\n- **Role filter** — filter by current role\n- **Department filter** — filter by assigned department\n\n**Table Columns:**\n- **User** — name and email\n- **Current Role** — editable dropdown to change role\n- **Department** — editable dropdown to assign/change department\n- **Actions** — Save / Cancel buttons (appear when changes detected)",
          descriptionAr:
            "انتقل إلى **الإدارة** ← **الصلاحيات** من القائمة الجانبية.\n\nتوفر هذه الصفحة **تعديل مباشر** لأدوار المستخدمين وتعيينات الأقسام مباشرة في الجدول — بدون نموذج منفصل.\n\n**البحث والتصفية:**\n- **البحث** — العثور على مستخدمين بالاسم أو البريد (تأخير 400 مللي ثانية)\n- **فلتر الدور** — التصفية حسب الدور الحالي\n- **فلتر القسم** — التصفية حسب القسم المعيّن\n\n**أعمدة الجدول:**\n- **المستخدم** — الاسم والبريد\n- **الدور الحالي** — قائمة منسدلة قابلة للتعديل لتغيير الدور\n- **القسم** — قائمة منسدلة قابلة للتعديل لتعيين/تغيير القسم\n- **الإجراءات** — أزرار حفظ / إلغاء (تظهر عند اكتشاف تغييرات)",
          imagePlaceholder: "/tutorials/admin-permissions-page.png",
        },
        {
          id: "change-user-role",
          titleEn: "Change a User's Role",
          titleAr: "تغيير دور المستخدم",
          descriptionEn:
            "To change a user's role:\n\n1. Find the user in the table (use search/filters)\n2. Click the **Role dropdown** in their row\n3. Select the new role from the list:\n   - **Admin** — مسؤول\n   - **Instructor** — مدرّس\n   - **Examiner** — ممتحن\n   - **Proctor** — مراقب\n   - **ProctorReviewer** — مراجع المراقبة\n   - **Auditor** — مدقق\n   - **SuperAdmin** — مسؤول أعلى\n4. The row highlights showing unsaved changes\n5. Click **Save** to apply the change\n6. Click **Cancel** to revert\n\nThe system removes the old role and assigns the new one atomically.",
          descriptionAr:
            "لتغيير دور المستخدم:\n\n1. ابحث عن المستخدم في الجدول (استخدم البحث/الفلاتر)\n2. انقر على **قائمة الدور** المنسدلة في صفه\n3. اختر الدور الجديد من القائمة:\n   - **مدير** — Admin\n   - **مدرّس** — Instructor\n   - **ممتحن** — Examiner\n   - **مراقب** — Proctor\n   - **مراجع المراقبة** — ProctorReviewer\n   - **مدقق** — Auditor\n   - **مسؤول أعلى** — SuperAdmin\n4. يتم تمييز الصف لإظهار التغييرات غير المحفوظة\n5. انقر **حفظ** لتطبيق التغيير\n6. انقر **إلغاء** للتراجع\n\nيقوم النظام بإزالة الدور القديم وتعيين الجديد بشكل ذري.",
          imagePlaceholder: "/tutorials/admin-permissions-role.png",
        },
        {
          id: "assign-department",
          titleEn: "Assign or Change Department",
          titleAr: "تعيين أو تغيير القسم",
          descriptionEn:
            'To assign or change a user\'s department:\n\n1. Find the user in the table\n2. Click the **Department dropdown** in their row\n3. Select a department or choose "**No Department**" to remove the assignment\n4. Click **Save** to apply\n\nDepartment assignment controls:\n- Which **exams and questions** the user can see\n- Which **data scope** applies to their work\n- Which **reports and logs** they can access',
          descriptionAr:
            'لتعيين أو تغيير قسم المستخدم:\n\n1. ابحث عن المستخدم في الجدول\n2. انقر على **قائمة القسم** المنسدلة في صفه\n3. اختر قسماً أو اختر "**بدون قسم**" لإزالة التعيين\n4. انقر **حفظ** للتطبيق\n\nتعيين القسم يتحكم في:\n- أي **اختبارات وأسئلة** يمكن للمستخدم رؤيتها\n- أي **نطاق بيانات** ينطبق على عمله\n- أي **تقارير وسجلات** يمكنه الوصول إليها',
          imagePlaceholder: "/tutorials/admin-permissions-dept.png",
          tipEn:
            "Changes are saved **per user** — you can edit multiple users and save them individually. A badge at the top shows the count of **pending changes** not yet saved.",
          tipAr:
            "التغييرات تُحفظ **لكل مستخدم** — يمكنك تعديل عدة مستخدمين وحفظهم فردياً. تظهر شارة في الأعلى بعدد **التغييرات المعلقة** غير المحفوظة بعد.",
        },
      ],
      examples: [
        {
          titleEn: "Role Assignment Reference",
          titleAr: "مرجع تعيين الأدوار",
          contentEn:
            "**What each role can do:**\n\n- **SuperAdmin** — full platform control including users, departments, settings, and all logs\n- **Admin** — department administration, user management, and content access\n- **Instructor** — create questions, build exams, grade results, manage candidates\n- **Examiner** — review grading sessions and published results\n- **Proctor** — monitor live exam sessions, warn/flag/terminate candidates\n- **ProctorReviewer** — review proctor decisions and recorded sessions\n- **Auditor** — read-only access to audit logs and compliance data",
          contentAr:
            "**ما يمكن لكل دور فعله:**\n\n- **المسؤول الأعلى** — تحكم كامل بالمنصة بما في ذلك المستخدمين والأقسام والإعدادات وجميع السجلات\n- **المدير** — إدارة القسم وإدارة المستخدمين والوصول للمحتوى\n- **المدرّس** — إنشاء الأسئلة وبناء الاختبارات وتقييم النتائج وإدارة المرشحين\n- **الممتحن** — مراجعة جلسات التقييم والنتائج المنشورة\n- **المراقب** — مراقبة جلسات الاختبار الحية وتحذير/تعليم/إنهاء المرشحين\n- **مراجع المراقبة** — مراجعة قرارات المراقب والجلسات المسجلة\n- **المدقق** — وصول للقراءة فقط لسجلات التدقيق وبيانات الامتثال",
        },
      ],
    },
    // ── Section 4: Departments ──
    {
      id: "departments-management",
      titleEn: "4. Departments",
      titleAr: "4. الأقسام",
      descriptionEn:
        "Create and manage organizational departments. Departments organize staff and scope data visibility — but remember, candidate data remains shared across all departments.",
      descriptionAr:
        "إنشاء وإدارة الأقسام التنظيمية. الأقسام تنظم الموظفين وتحدد نطاق رؤية البيانات — لكن تذكّر أن بيانات المرشحين تبقى مشتركة بين جميع الأقسام.",
      steps: [
        {
          id: "departments-list",
          titleEn: "Departments List",
          titleAr: "قائمة الأقسام",
          descriptionEn:
            "Navigate to **Administration** → **Departments** from the sidebar.\n\n**Top Controls:**\n- **Search** — find departments by name or code\n- **Show Inactive** toggle — show/hide deactivated departments\n- **+ Create Department** button\n\n**Department Cards/Table:**\n- **Name** — bilingual (English and Arabic)\n- **Code** — optional department identifier\n- **Description** — purpose of the department\n- **User Count** — number of staff assigned (badge)\n- **Status** — Active/Inactive\n- **Actions** — Edit, Activate/Deactivate, Delete",
          descriptionAr:
            "انتقل إلى **الإدارة** ← **الأقسام** من القائمة الجانبية.\n\n**أدوات الأعلى:**\n- **البحث** — العثور على أقسام بالاسم أو الرمز\n- **إظهار غير النشط** — إظهار/إخفاء الأقسام المُعطّلة\n- **+ إنشاء قسم** زر\n\n**بطاقات/جدول الأقسام:**\n- **الاسم** — ثنائي اللغة (إنجليزي وعربي)\n- **الرمز** — معرّف القسم الاختياري\n- **الوصف** — غرض القسم\n- **عدد المستخدمين** — عدد الموظفين المعيّنين (شارة)\n- **الحالة** — نشط/غير نشط\n- **الإجراءات** — تعديل، تفعيل/إلغاء تفعيل، حذف",
          imagePlaceholder: "/tutorials/admin-departments-list.png",
        },
        {
          id: "create-department",
          titleEn: "Create a New Department",
          titleAr: "إنشاء قسم جديد",
          descriptionEn:
            "Click **+ Create Department** to open the creation dialog.\n\nFill in the department details and click **Save**.",
          descriptionAr:
            "انقر **+ إنشاء قسم** لفتح نافذة الإنشاء.\n\nاملأ تفاصيل القسم وانقر **حفظ**.",
          imagePlaceholder: "/tutorials/admin-departments-create.png",
          fields: [
            {
              nameEn: "Name (English)",
              nameAr: "الاسم (إنجليزي)",
              required: true,
              descriptionEn:
                'Department name in English (e.g., "Information Technology")',
              descriptionAr:
                'اسم القسم بالإنجليزية (مثل: "Information Technology")',
            },
            {
              nameEn: "Name (Arabic)",
              nameAr: "الاسم (عربي)",
              required: true,
              descriptionEn:
                'Department name in Arabic (e.g., "تقنية المعلومات")',
              descriptionAr: 'اسم القسم بالعربية (مثل: "تقنية المعلومات")',
            },
            {
              nameEn: "Code",
              nameAr: "الرمز",
              required: false,
              descriptionEn:
                'Optional short identifier (e.g., "IT", "HR", "FIN")',
              descriptionAr: 'معرّف قصير اختياري (مثل: "IT"، "HR"، "FIN")',
            },
            {
              nameEn: "Description (English)",
              nameAr: "الوصف (إنجليزي)",
              required: false,
              descriptionEn: "Optional description of the department's purpose",
              descriptionAr: "وصف اختياري لغرض القسم",
            },
            {
              nameEn: "Description (Arabic)",
              nameAr: "الوصف (عربي)",
              required: false,
              descriptionEn: "Optional description in Arabic",
              descriptionAr: "وصف اختياري بالعربية",
            },
            {
              nameEn: "Is Active",
              nameAr: "نشط",
              required: false,
              descriptionEn:
                "Toggle to set the department as active or inactive (default: **Active**)",
              descriptionAr:
                "مفتاح لتعيين القسم نشطاً أو غير نشط (الافتراضي: **نشط**)",
            },
          ],
        },
        {
          id: "department-actions",
          titleEn: "Department Actions",
          titleAr: "إجراءات القسم",
          descriptionEn:
            "Each department has an **Actions** menu:\n\n- **Edit** — open the edit dialog to update name, code, description, or status\n- **Activate / Deactivate** — toggle the department status. Deactivated departments are hidden from dropdowns but data is preserved.\n- **Delete** — permanently remove the department (requires confirmation). Users assigned to this department will become unassigned.",
          descriptionAr:
            "كل قسم لديه قائمة **إجراءات**:\n\n- **تعديل** — فتح نافذة التعديل لتحديث الاسم أو الرمز أو الوصف أو الحالة\n- **تفعيل / إلغاء تفعيل** — تبديل حالة القسم. الأقسام المُعطّلة تختفي من القوائم المنسدلة لكن البيانات تُحفظ.\n- **حذف** — إزالة القسم نهائياً (يتطلب تأكيد). المستخدمون المعيّنون لهذا القسم سيصبحون بدون تعيين.",
          imagePlaceholder: "/tutorials/admin-departments-actions.png",
          tipEn:
            "Prefer **deactivating** departments over deleting them. Deactivation preserves historical data while removing the department from active use.",
          tipAr:
            "فضّل **إلغاء تفعيل** الأقسام بدلاً من حذفها. إلغاء التفعيل يحافظ على البيانات التاريخية مع إزالة القسم من الاستخدام النشط.",
        },
      ],
    },
    // ── Section 5: Organization Settings ──
    {
      id: "organization-settings",
      titleEn: "5. Organization & Branding",
      titleAr: "5. المنظمة والعلامة التجارية",
      descriptionEn:
        "Configure your organization's branding — logo, favicon, primary color, contact information, and support details that appear throughout the platform.",
      descriptionAr:
        "تكوين العلامة التجارية لمنظمتك — الشعار والأيقونة واللون الأساسي ومعلومات الاتصال وتفاصيل الدعم التي تظهر عبر المنصة.",
      steps: [
        {
          id: "organization-page",
          titleEn: "Organization Settings Page",
          titleAr: "صفحة إعدادات المنظمة",
          descriptionEn:
            "Navigate to **Administration** → **Organization** from the sidebar.\n\nThe page has two main sections:\n\n**Branding Section:**\n- **Logo** — upload your organization's logo (file input with preview)\n- **Favicon** — upload a small icon for browser tabs (file input with preview)\n\n**Organization Info Section:**\nConfigure the details that appear in emails, notifications, and across the platform.",
          descriptionAr:
            "انتقل إلى **الإدارة** ← **المنظمة** من القائمة الجانبية.\n\nتحتوي الصفحة على قسمين رئيسيين:\n\n**قسم العلامة التجارية:**\n- **الشعار** — رفع شعار منظمتك (إدخال ملف مع معاينة)\n- **الأيقونة** — رفع أيقونة صغيرة لتبويبات المتصفح (إدخال ملف مع معاينة)\n\n**قسم معلومات المنظمة:**\nتكوين التفاصيل التي تظهر في الرسائل والإشعارات وعبر المنصة.",
          imagePlaceholder: "/tutorials/admin-organization-page.png",
          fields: [
            {
              nameEn: "Organization Name",
              nameAr: "اسم المنظمة",
              required: false,
              descriptionEn:
                "Your organization's display name (appears in notifications and branding)",
              descriptionAr:
                "اسم العرض لمنظمتك (يظهر في الإشعارات والعلامة التجارية)",
            },
            {
              nameEn: "Primary Color",
              nameAr: "اللون الأساسي",
              required: false,
              descriptionEn:
                "Brand color used throughout the platform (color picker, default: **#0d9488** — teal)",
              descriptionAr:
                "لون العلامة التجارية المستخدم عبر المنصة (منتقي ألوان، الافتراضي: **#0d9488** — أزرق مخضر)",
            },
            {
              nameEn: "Support Email",
              nameAr: "بريد الدعم",
              required: false,
              descriptionEn:
                "Contact email for support — included in notification templates via {{SupportEmail}}",
              descriptionAr:
                "بريد الاتصال للدعم — مضمّن في قوالب الإشعارات عبر {{SupportEmail}}",
            },
            {
              nameEn: "Mobile Number",
              nameAr: "رقم الجوال",
              required: false,
              descriptionEn: "Organization mobile contact number",
              descriptionAr: "رقم جوال المنظمة للتواصل",
            },
            {
              nameEn: "Office Number",
              nameAr: "رقم المكتب",
              required: false,
              descriptionEn: "Organization office phone number",
              descriptionAr: "رقم هاتف مكتب المنظمة",
            },
            {
              nameEn: "Support URL",
              nameAr: "رابط الدعم",
              required: false,
              descriptionEn: "Help desk or documentation URL",
              descriptionAr: "رابط مكتب المساعدة أو التوثيق",
            },
            {
              nameEn: "Footer Text",
              nameAr: "نص التذييل",
              required: false,
              descriptionEn:
                "Text shown in the platform footer and email templates",
              descriptionAr: "النص المعروض في تذييل المنصة وقوالب البريد",
            },
            {
              nameEn: "Is Active",
              nameAr: "نشط",
              required: false,
              descriptionEn:
                "Toggle to activate/deactivate organization settings",
              descriptionAr: "مفتاح لتفعيل/إلغاء تفعيل إعدادات المنظمة",
            },
          ],
          tipEn:
            "The **Primary Color** affects buttons, links, and accent elements across the entire platform. Preview changes before saving to ensure they look professional.",
          tipAr:
            "**اللون الأساسي** يؤثر على الأزرار والروابط وعناصر التمييز عبر المنصة بأكملها. استعرض التغييرات قبل الحفظ لضمان مظهر احترافي.",
        },
      ],
    },
    // ── Section 6: System Settings ──
    {
      id: "system-settings",
      titleEn: "6. System Settings",
      titleAr: "6. إعدادات النظام",
      descriptionEn:
        "Configure system-wide settings — general behavior, security policies, proctoring defaults, and brand information across four organized tabs.",
      descriptionAr:
        "تكوين إعدادات على مستوى النظام — السلوك العام وسياسات الأمان وإعدادات المراقبة الافتراضية ومعلومات العلامة التجارية عبر أربع تبويبات منظمة.",
      steps: [
        {
          id: "settings-general-tab",
          titleEn: "General Settings Tab",
          titleAr: "تبويب الإعدادات العامة",
          descriptionEn:
            "Navigate to **Administration** → **Settings** from the sidebar.\n\nThe **General** tab controls platform-wide behavior:",
          descriptionAr:
            "انتقل إلى **الإدارة** ← **الإعدادات** من القائمة الجانبية.\n\nتبويب **العام** يتحكم في السلوك على مستوى المنصة:",
          imagePlaceholder: "/tutorials/admin-settings-general.png",
          fields: [
            {
              nameEn: "Maintenance Mode",
              nameAr: "وضع الصيانة",
              required: false,
              descriptionEn:
                "Toggle to put the system in maintenance mode. When enabled, only SuperAdmin users can access the platform.",
              descriptionAr:
                "مفتاح لوضع النظام في وضع الصيانة. عند التفعيل، فقط مستخدمو المسؤول الأعلى يمكنهم الوصول للمنصة.",
            },
            {
              nameEn: "Allow Registration",
              nameAr: "السماح بالتسجيل",
              required: false,
              descriptionEn: "Toggle to allow or block new user registrations",
              descriptionAr: "مفتاح للسماح أو منع تسجيلات المستخدمين الجدد",
            },
            {
              nameEn: "Max File Upload (MB)",
              nameAr: "أقصى حجم رفع (ميجابايت)",
              required: false,
              descriptionEn:
                "Maximum file size allowed for uploads in megabytes",
              descriptionAr: "أقصى حجم ملف مسموح للرفع بالميجابايت",
            },
            {
              nameEn: "Session Timeout (minutes)",
              nameAr: "مهلة الجلسة (دقائق)",
              required: false,
              descriptionEn:
                "How long an inactive session stays alive before automatic logout",
              descriptionAr:
                "كم تبقى الجلسة غير النشطة حية قبل تسجيل الخروج التلقائي",
            },
          ],
        },
        {
          id: "settings-security-tab",
          titleEn: "Security Settings Tab",
          titleAr: "تبويب إعدادات الأمان",
          descriptionEn:
            "The **Security** tab configures password policies enforced when creating or changing passwords:",
          descriptionAr:
            "تبويب **الأمان** يُعدّ سياسات كلمات المرور المفروضة عند إنشاء أو تغيير كلمات المرور:",
          imagePlaceholder: "/tutorials/admin-settings-security.png",
          fields: [
            {
              nameEn: "Minimum Length",
              nameAr: "الحد الأدنى للطول",
              required: false,
              descriptionEn:
                "Minimum number of characters required for passwords",
              descriptionAr: "الحد الأدنى لعدد الأحرف المطلوبة لكلمات المرور",
            },
            {
              nameEn: "Require Uppercase",
              nameAr: "تتطلب أحرف كبيرة",
              required: false,
              descriptionEn: "Toggle to require at least one uppercase letter",
              descriptionAr: "مفتاح لطلب حرف كبير واحد على الأقل",
            },
            {
              nameEn: "Require Numbers",
              nameAr: "تتطلب أرقام",
              required: false,
              descriptionEn: "Toggle to require at least one numeric digit",
              descriptionAr: "مفتاح لطلب رقم واحد على الأقل",
            },
            {
              nameEn: "Require Special Characters",
              nameAr: "تتطلب أحرف خاصة",
              required: false,
              descriptionEn:
                "Toggle to require at least one special character (e.g., @, #, $)",
              descriptionAr: "مفتاح لطلب حرف خاص واحد على الأقل (مثل: @، #، $)",
            },
          ],
          tipEn:
            "Stronger password policies improve security but may increase support requests for password resets. Balance security with usability based on your organization's needs.",
          tipAr:
            "سياسات كلمات المرور الأقوى تحسّن الأمان لكن قد تزيد طلبات دعم إعادة تعيين كلمات المرور. وازن بين الأمان وسهولة الاستخدام بناءً على احتياجات منظمتك.",
        },
        {
          id: "settings-proctoring-tab",
          titleEn: "Proctoring Settings Tab",
          titleAr: "تبويب إعدادات المراقبة",
          descriptionEn:
            "The **Proctoring** tab configures the default proctoring behavior for new exams:",
          descriptionAr:
            "تبويب **المراقبة** يُعدّ سلوك المراقبة الافتراضي للاختبارات الجديدة:",
          imagePlaceholder: "/tutorials/admin-settings-proctoring.png",
          fields: [
            {
              nameEn: "Enable Live Video",
              nameAr: "تفعيل الفيديو المباشر",
              required: false,
              descriptionEn:
                "Toggle to enable WebRTC live video streaming from candidate webcams during proctored exams",
              descriptionAr:
                "مفتاح لتفعيل بث الفيديو المباشر WebRTC من كاميرات المرشحين أثناء الاختبارات المراقبة",
            },
            {
              nameEn: "Enable Video Recording",
              nameAr: "تفعيل تسجيل الفيديو",
              required: false,
              descriptionEn:
                "Toggle to record exam sessions for post-exam review and evidence",
              descriptionAr:
                "مفتاح لتسجيل جلسات الاختبار للمراجعة بعد الاختبار والأدلة",
            },
            {
              nameEn: "Enable Smart Monitoring",
              nameAr: "تفعيل المراقبة الذكية",
              required: false,
              descriptionEn:
                "Toggle to enable AI-powered behavioral analysis during proctored exams",
              descriptionAr:
                "مفتاح لتفعيل التحليل السلوكي المدعوم بالذكاء الاصطناعي أثناء الاختبارات المراقبة",
            },
            {
              nameEn: "Default Proctor Mode",
              nameAr: "وضع المراقبة الافتراضي",
              required: false,
              descriptionEn:
                "Select the default proctoring mode for new exams (e.g., AI Proctoring, Live, or Hybrid)",
              descriptionAr:
                "اختر وضع المراقبة الافتراضي للاختبارات الجديدة (مثل: مراقبة AI، مباشر، أو هجين)",
            },
          ],
        },
        {
          id: "settings-brand-tab",
          titleEn: "Brand Info Tab",
          titleAr: "تبويب معلومات العلامة التجارية",
          descriptionEn:
            "The **Brand Info** tab configures branding details used in system communications:",
          descriptionAr:
            "تبويب **معلومات العلامة التجارية** يُعدّ تفاصيل العلامة التجارية المستخدمة في اتصالات النظام:",
          imagePlaceholder: "/tutorials/admin-settings-brand.png",
          fields: [
            {
              nameEn: "Brand Name",
              nameAr: "اسم العلامة التجارية",
              required: false,
              descriptionEn:
                "Your brand name — used in emails via {{BrandName}} placeholder",
              descriptionAr:
                "اسم علامتك التجارية — يُستخدم في الرسائل عبر عنصر {{BrandName}}",
            },
            {
              nameEn: "Logo URL",
              nameAr: "رابط الشعار",
              required: false,
              descriptionEn: "Direct URL to the organization logo image",
              descriptionAr: "الرابط المباشر لصورة شعار المنظمة",
            },
            {
              nameEn: "Footer Text",
              nameAr: "نص التذييل",
              required: false,
              descriptionEn: "Footer text for emails and platform pages",
              descriptionAr: "نص التذييل للرسائل وصفحات المنصة",
            },
            {
              nameEn: "Support Email / URL",
              nameAr: "بريد / رابط الدعم",
              required: false,
              descriptionEn:
                "Support contact details for notifications and templates",
              descriptionAr: "تفاصيل اتصال الدعم للإشعارات والقوالب",
            },
            {
              nameEn: "Primary Color",
              nameAr: "اللون الأساسي",
              required: false,
              descriptionEn: "Brand color in hex format (e.g., **#0d9488**)",
              descriptionAr:
                "لون العلامة التجارية بتنسيق hex (مثل: **#0d9488**)",
            },
          ],
          noteEn:
            "All settings across the four tabs are saved as a **single configuration object**. Click **Save Settings** at the top-right to persist all changes at once.",
          noteAr:
            "جميع الإعدادات عبر التبويبات الأربعة تُحفظ ككائن **تكوين واحد**. انقر **حفظ الإعدادات** في الأعلى الأيمن لحفظ جميع التغييرات دفعة واحدة.",
        },
      ],
    },
    // ── Section 7: Notifications ──
    {
      id: "notifications",
      titleEn: "7. Notifications",
      titleAr: "7. الإشعارات",
      descriptionEn:
        "Configure email (SMTP) and SMS providers, customize notification templates per event type, and track all sent notifications with retry capability for failed deliveries.",
      descriptionAr:
        "تكوين مزودي البريد (SMTP) والرسائل القصيرة وتخصيص قوالب الإشعارات لكل نوع حدث وتتبع جميع الإشعارات المُرسلة مع إمكانية إعادة المحاولة للتسليمات الفاشلة.",
      steps: [
        {
          id: "notification-settings-email",
          titleEn: "Email (SMTP) Configuration",
          titleAr: "تكوين البريد (SMTP)",
          descriptionEn:
            "Navigate to **Notifications** → **Settings** from the sidebar. The **Email** tab configures SMTP for sending email notifications:\n\nAfter configuring, use the **Send Test** button at the bottom to verify the setup. Enter a test email address and click send — if successful, a test email will arrive in your inbox.",
          descriptionAr:
            "انتقل إلى **الإشعارات** ← **الإعدادات** من القائمة الجانبية. تبويب **البريد** يُعدّ SMTP لإرسال إشعارات البريد:\n\nبعد التكوين، استخدم زر **إرسال اختبار** في الأسفل للتحقق من الإعداد. أدخل بريد اختبار وانقر إرسال — إذا نجح، ستصل رسالة اختبار لصندوقك.",
          imagePlaceholder: "/tutorials/admin-notifications-email.png",
          fields: [
            {
              nameEn: "SMTP Host",
              nameAr: "مضيف SMTP",
              required: false,
              descriptionEn:
                "Mail server hostname (e.g., **smtp.gmail.com**, **smtp.office365.com**)",
              descriptionAr:
                "اسم مضيف خادم البريد (مثل: **smtp.gmail.com**، **smtp.office365.com**)",
            },
            {
              nameEn: "SMTP Port",
              nameAr: "منفذ SMTP",
              required: false,
              descriptionEn:
                "Mail server port (common: **587** for TLS, **465** for SSL, **25** for unencrypted)",
              descriptionAr:
                "منفذ خادم البريد (شائع: **587** لـ TLS، **465** لـ SSL، **25** بدون تشفير)",
            },
            {
              nameEn: "Username",
              nameAr: "اسم المستخدم",
              required: false,
              descriptionEn:
                "SMTP authentication username (usually the email address)",
              descriptionAr: "اسم مستخدم مصادقة SMTP (عادة عنوان البريد)",
            },
            {
              nameEn: "Password",
              nameAr: "كلمة المرور",
              required: false,
              descriptionEn:
                "SMTP authentication password (masked input with show/hide toggle)",
              descriptionAr:
                "كلمة مرور مصادقة SMTP (إدخال مخفي مع مفتاح إظهار/إخفاء)",
            },
            {
              nameEn: "From Email",
              nameAr: "البريد المرسل",
              required: false,
              descriptionEn: 'The "From" email address shown to recipients',
              descriptionAr: 'عنوان البريد "المرسل" المعروض للمستلمين',
            },
            {
              nameEn: "From Name",
              nameAr: "اسم المرسل",
              required: false,
              descriptionEn:
                'Display name for the sender (e.g., "SmartExam System")',
              descriptionAr: 'اسم العرض للمرسل (مثل: "نظام SmartExam")',
            },
            {
              nameEn: "Enable SSL",
              nameAr: "تفعيل SSL",
              required: false,
              descriptionEn: "Toggle SSL/TLS encryption for SMTP connection",
              descriptionAr: "مفتاح تشفير SSL/TLS لاتصال SMTP",
            },
            {
              nameEn: "Enable Email",
              nameAr: "تفعيل البريد",
              required: false,
              descriptionEn:
                "Master toggle to **enable/disable all email notifications** system-wide",
              descriptionAr:
                "مفتاح رئيسي لـ**تفعيل/تعطيل جميع إشعارات البريد** على مستوى النظام",
            },
          ],
          tipEn:
            'For Gmail, use **smtp.gmail.com** on port **587** with SSL enabled. You may need to create an "App Password" in your Google account security settings.',
          tipAr:
            'لـ Gmail، استخدم **smtp.gmail.com** على المنفذ **587** مع تفعيل SSL. قد تحتاج لإنشاء "كلمة مرور تطبيق" في إعدادات أمان حسابك في Google.',
        },
        {
          id: "notification-settings-sms",
          titleEn: "SMS Configuration",
          titleAr: "تكوين الرسائل القصيرة",
          descriptionEn:
            "Switch to the **SMS** tab to configure SMS providers.\n\n**Provider Options:**\n- **Twilio** — requires Account SID, Auth Token, and From Number\n- **Vonage** — requires Account SID, Auth Token, and From Number\n- **Custom API** — requires custom API URL and API Key\n\nThe fields change dynamically based on the selected provider. Use the **Send Test** button to verify SMS delivery with a test phone number.",
          descriptionAr:
            "انتقل لتبويب **الرسائل القصيرة** لتكوين مزودي SMS.\n\n**خيارات المزود:**\n- **Twilio** — يتطلب Account SID و Auth Token و الرقم المرسل\n- **Vonage** — يتطلب Account SID و Auth Token و الرقم المرسل\n- **Custom API** — يتطلب رابط API مخصص ومفتاح API\n\nتتغير الحقول ديناميكياً بناءً على المزود المحدد. استخدم زر **إرسال اختبار** للتحقق من تسليم SMS برقم هاتف اختبار.",
          imagePlaceholder: "/tutorials/admin-notifications-sms.png",
        },
        {
          id: "notification-settings-general",
          titleEn: "General & Batch Settings",
          titleAr: "الإعدادات العامة والدفعات",
          descriptionEn:
            "Switch to the **General** tab for batch notification settings:",
          descriptionAr: "انتقل لتبويب **العام** لإعدادات إشعارات الدفعات:",
          imagePlaceholder: "/tutorials/admin-notifications-general.png",
          fields: [
            {
              nameEn: "Login URL",
              nameAr: "رابط الدخول",
              required: false,
              descriptionEn:
                "The login page URL included in notification emails via {{LoginUrl}} placeholder",
              descriptionAr:
                "رابط صفحة الدخول المضمّن في رسائل الإشعارات عبر عنصر {{LoginUrl}}",
            },
            {
              nameEn: "Email Batch Size",
              nameAr: "حجم دفعة البريد",
              required: false,
              descriptionEn:
                "Number of emails sent per batch (default: **50**). Controls throttling for mass notifications.",
              descriptionAr:
                "عدد الرسائل المُرسلة لكل دفعة (الافتراضي: **50**). يتحكم في تقييد الإشعارات الجماعية.",
            },
            {
              nameEn: "SMS Batch Size",
              nameAr: "حجم دفعة الرسائل",
              required: false,
              descriptionEn:
                "Number of SMS messages sent per batch (default: **50**)",
              descriptionAr:
                "عدد الرسائل القصيرة المُرسلة لكل دفعة (الافتراضي: **50**)",
            },
            {
              nameEn: "Batch Delay (ms)",
              nameAr: "تأخير الدفعة (مللي ثانية)",
              required: false,
              descriptionEn:
                "Delay between batches in milliseconds (default: **1000ms**). Prevents overwhelming the SMTP/SMS provider.",
              descriptionAr:
                "التأخير بين الدفعات بالمللي ثانية (الافتراضي: **1000 مللي ثانية**). يمنع إرهاق مزود SMTP/SMS.",
            },
          ],
        },
        {
          id: "notification-templates",
          titleEn: "Notification Templates",
          titleAr: "قوالب الإشعارات",
          descriptionEn:
            "Navigate to **Notifications** → **Templates** from the sidebar.\n\nCustomize the email/SMS content for **3 event types**:\n\n1. **Exam Published** — sent when an exam is published or candidates are assigned\n2. **Result Published** — sent when exam results are published to candidates\n3. **Exam Expired** — sent when an exam's schedule window expires\n\n**Each template has:**\n- **Is Active** toggle — enable or disable notifications for this event\n- **Subject (English)** — email subject line\n- **Subject (Arabic)** — email subject in Arabic\n- **Body (English)** — email body content (full textarea)\n- **Body (Arabic)** — email body in Arabic (RTL textarea)\n- Individual **Save** button per template\n\n**Available Placeholders** (shown as badges at the top):\n- **{{CandidateName}}** — candidate's full name\n- **{{Username}}** — login email/username\n- **{{Password}}** — login password\n- **{{ExamTitle}}** — exam title\n- **{{ExamStartDate}}** — exam start date\n- **{{ExamEndDate}}** — exam end date\n- **{{ExamDuration}}** — duration in minutes\n- **{{LoginUrl}}** — configured login URL\n- **{{BrandName}}** — organization name\n- **{{SupportEmail}}** — support email address",
          descriptionAr:
            "انتقل إلى **الإشعارات** ← **القوالب** من القائمة الجانبية.\n\nخصّص محتوى البريد/SMS لـ**3 أنواع أحداث**:\n\n1. **نشر الاختبار** — يُرسل عند نشر اختبار أو تعيين مرشحين\n2. **نشر النتائج** — يُرسل عند نشر نتائج الاختبار للمرشحين\n3. **انتهاء الاختبار** — يُرسل عند انتهاء نافذة جدول الاختبار\n\n**كل قالب يحتوي:**\n- **نشط** مفتاح — تفعيل أو تعطيل الإشعارات لهذا الحدث\n- **الموضوع (إنجليزي)** — سطر موضوع البريد\n- **الموضوع (عربي)** — موضوع البريد بالعربية\n- **المحتوى (إنجليزي)** — محتوى نص البريد (مربع نص كامل)\n- **المحتوى (عربي)** — نص البريد بالعربية (مربع نص RTL)\n- زر **حفظ** فردي لكل قالب\n\n**العناصر النائبة المتاحة** (تُعرض كشارات في الأعلى):\n- **{{CandidateName}}** — الاسم الكامل للمرشح\n- **{{Username}}** — بريد/اسم الدخول\n- **{{Password}}** — كلمة المرور\n- **{{ExamTitle}}** — عنوان الاختبار\n- **{{ExamStartDate}}** — تاريخ بدء الاختبار\n- **{{ExamEndDate}}** — تاريخ نهاية الاختبار\n- **{{ExamDuration}}** — المدة بالدقائق\n- **{{LoginUrl}}** — رابط الدخول المُعَد\n- **{{BrandName}}** — اسم المنظمة\n- **{{SupportEmail}}** — بريد الدعم",
          imagePlaceholder: "/tutorials/admin-notifications-templates.png",
          tipEn:
            "Use placeholders to personalize notifications. For example: \"Dear {{CandidateName}}, your exam '{{ExamTitle}}' is now available. Log in at {{LoginUrl}} to begin.\"",
          tipAr:
            "استخدم العناصر النائبة لتخصيص الإشعارات. مثال: \"عزيزي {{CandidateName}}، اختبارك '{{ExamTitle}}' متاح الآن. سجّل الدخول في {{LoginUrl}} للبدء.\"",
        },
        {
          id: "notification-logs",
          titleEn: "Notification Logs",
          titleAr: "سجلات الإشعارات",
          descriptionEn:
            "Navigate to **Notifications** → **Logs** from the sidebar.\n\n**Statistics Cards (Top):**\n- **Pending** (amber) — notifications queued for delivery\n- **Sent** (green) — successfully delivered notifications\n- **Failed** (red) — failed deliveries that may need retry\n\n**Filters:**\n- **Search** — find by recipient email/phone (300ms debounce)\n- **Status** — Pending, Sent, or Failed\n- **Channel** — Email or SMS\n- **Event Type** — Exam Published, Result Published, Exam Expired\n- **Date From** — date picker\n\n**Log Table (20 per page):**\n- **Candidate** — recipient name\n- **Exam** — related exam title\n- **Event** — event type badge\n- **Channel** — Email/SMS with icon\n- **Recipient** — email or phone number\n- **Status** — color-coded badge (Pending/Sent/Failed) with retry count\n- **Date** — sent timestamp\n- **Actions** — **Retry** button (only visible for **Failed** status)\n\n**Retry Feature:**\nClick **Retry** on any failed notification to attempt redelivery. The system shows a loading state and refreshes the table on success.",
          descriptionAr:
            "انتقل إلى **الإشعارات** ← **السجلات** من القائمة الجانبية.\n\n**بطاقات الإحصائيات (الأعلى):**\n- **معلّق** (عنبري) — الإشعارات في قائمة الانتظار للتسليم\n- **مُرسل** (أخضر) — الإشعارات المُسلّمة بنجاح\n- **فاشل** (أحمر) — التسليمات الفاشلة التي قد تحتاج لإعادة محاولة\n\n**الفلاتر:**\n- **البحث** — العثور بالبريد/الهاتف المستلم (تأخير 300 مللي ثانية)\n- **الحالة** — معلّق، مُرسل، أو فاشل\n- **القناة** — بريد أو رسالة قصيرة\n- **نوع الحدث** — نشر الاختبار، نشر النتائج، انتهاء الاختبار\n- **التاريخ من** — منتقي تاريخ\n\n**جدول السجلات (20 لكل صفحة):**\n- **المرشح** — اسم المستلم\n- **الاختبار** — عنوان الاختبار المرتبط\n- **الحدث** — شارة نوع الحدث\n- **القناة** — بريد/رسالة قصيرة مع أيقونة\n- **المستلم** — البريد أو رقم الهاتف\n- **الحالة** — شارة ملونة (معلّق/مُرسل/فاشل) مع عدد المحاولات\n- **التاريخ** — طابع زمني الإرسال\n- **الإجراءات** — زر **إعادة المحاولة** (مرئي فقط لحالة **فاشل**)\n\n**ميزة إعادة المحاولة:**\nانقر **إعادة المحاولة** على أي إشعار فاشل لمحاولة إعادة التسليم. يعرض النظام حالة تحميل ويُحدّث الجدول عند النجاح.",
          imagePlaceholder: "/tutorials/admin-notifications-logs.png",
        },
      ],
      examples: [
        {
          titleEn: "SMTP Setup Example",
          titleAr: "مثال إعداد SMTP",
          contentEn:
            "**Gmail SMTP Configuration:**\n- Host: **smtp.gmail.com**\n- Port: **587**\n- Username: your-email@gmail.com\n- Password: your-app-password\n- From Email: noreply@yourcompany.com\n- From Name: SmartExam System\n- Enable SSL: **On**\n- Enable Email: **On**\n\n**Office 365 SMTP Configuration:**\n- Host: **smtp.office365.com**\n- Port: **587**\n- Username: your-email@company.com\n- Password: your-password\n- Enable SSL: **On**",
          contentAr:
            "**تكوين Gmail SMTP:**\n- المضيف: **smtp.gmail.com**\n- المنفذ: **587**\n- اسم المستخدم: your-email@gmail.com\n- كلمة المرور: your-app-password\n- البريد المرسل: noreply@yourcompany.com\n- اسم المرسل: SmartExam System\n- تفعيل SSL: **تشغيل**\n- تفعيل البريد: **تشغيل**\n\n**تكوين Office 365 SMTP:**\n- المضيف: **smtp.office365.com**\n- المنفذ: **587**\n- اسم المستخدم: your-email@company.com\n- كلمة المرور: your-password\n- تفعيل SSL: **تشغيل**",
        },
      ],
    },
    // ── Section 8: System Logs ──
    {
      id: "system-logs",
      titleEn: "8. System Logs",
      titleAr: "8. سجلات النظام",
      descriptionEn:
        "Monitor all system activity through the comprehensive logging system — audit trail for compliance, specialized logs by user type, and developer error tracking.",
      descriptionAr:
        "مراقبة جميع أنشطة النظام من خلال نظام التسجيل الشامل — سجل تدقيق للامتثال وسجلات متخصصة حسب نوع المستخدم وتتبع أخطاء المطورين.",
      steps: [
        {
          id: "audit-logs",
          titleEn: "Audit Logs — Compliance Trail",
          titleAr: "سجلات التدقيق — سجل الامتثال",
          descriptionEn:
            "Navigate to **System Logs** → **Audit** from the sidebar.\n\nAudit logs provide an **immutable compliance record** of every significant action in the system.\n\n**Header Controls:**\n- **Auto-refresh** toggle — refreshes every 30 seconds when enabled\n- **Manual refresh** button\n\n**Filters:**\n- **Search** — search by action, entity, or actor name\n- **Action** dropdown — 20+ action types including:\n  - Auth: Login, LoginFailed, Logout, PasswordChanged, RoleChanged\n  - User: Created, Updated, Deleted\n  - Exam: Created, Published, Deleted\n  - Attempt: Started, Submitted, ForceSubmitted, TimeAdded\n  - Grading: Completed, ManualGrade\n  - Result: Finalized, Published\n  - Incident: Created, DecisionMade\n  - Proctor: SessionStarted, DecisionMade\n- **Entity** dropdown — Auth, User, Exam, Attempt, Grading, Result, IncidentCase, Proctor\n- **Outcome** — Success or Failure\n- **Date Range** — From/To date pickers\n\n**Table Columns:**\n- **Timestamp** — exact date/time of the event\n- **User** — avatar + display name of the actor\n- **Action** — color-coded badge (green for created, red for failed/force actions)\n- **Entity** — entity type with ID\n- **Outcome** — green CheckCircle (success) or red XCircle (failure)\n- **Source** — connection channel\n- **Actions** — eye icon to open **detail modal**",
          descriptionAr:
            "انتقل إلى **سجلات النظام** ← **التدقيق** من القائمة الجانبية.\n\nسجلات التدقيق توفر **سجل امتثال غير قابل للتغيير** لكل إجراء مهم في النظام.\n\n**أدوات الرأس:**\n- **تحديث تلقائي** مفتاح — يُحدّث كل 30 ثانية عند التفعيل\n- زر **تحديث يدوي**\n\n**الفلاتر:**\n- **البحث** — البحث بالإجراء أو الكيان أو اسم الفاعل\n- **الإجراء** — أكثر من 20 نوع إجراء تشمل:\n  - المصادقة: تسجيل الدخول والفشل والخروج وتغيير كلمة المرور والدور\n  - المستخدم: الإنشاء والتحديث والحذف\n  - الاختبار: الإنشاء والنشر والحذف\n  - المحاولة: البدء والتقديم والتقديم الإجباري وإضافة الوقت\n  - التقييم: الاكتمال والتقييم اليدوي\n  - النتيجة: النهائية والنشر\n  - الحادثة: الإنشاء والقرار\n  - المراقب: بدء الجلسة والقرار\n- **الكيان** — المصادقة، المستخدم، الاختبار، المحاولة، التقييم، النتيجة، الحادثة، المراقب\n- **النتيجة** — نجاح أو فشل\n- **نطاق التاريخ** — منتقي تاريخ من/إلى\n\n**أعمدة الجدول:**\n- **الطابع الزمني** — التاريخ/الوقت الدقيق للحدث\n- **المستخدم** — صورة + اسم العرض للفاعل\n- **الإجراء** — شارة ملونة (أخضر للإنشاء، أحمر للفشل/الإجبار)\n- **الكيان** — نوع الكيان مع المعرّف\n- **النتيجة** — دائرة خضراء (نجاح) أو X أحمر (فشل)\n- **المصدر** — قناة الاتصال\n- **الإجراءات** — أيقونة عين لفتح **نافذة التفاصيل**",
          imagePlaceholder: "/tutorials/admin-audit-logs.png",
        },
        {
          id: "audit-detail-modal",
          titleEn: "Audit Log Detail Modal",
          titleAr: "نافذة تفاصيل سجل التدقيق",
          descriptionEn:
            "Click the **eye icon** on any audit log row to open the full detail modal:\n\n**Always Shown:**\n- **User** — display name and actor type (User/System/Service)\n- **Timestamp** — exact date/time\n- **Action** — action badge\n- **Entity** — name + ID\n- **Outcome** — Success/Failure with icon\n- **Duration** — processing time in milliseconds\n- **IP Address** — source IP\n- **Source / Channel** — connection info\n- **Correlation ID** — for tracing related events\n- **User Agent** — browser/client info\n\n**Conditional Sections:**\n- **Error Message** — shown on failure (red background)\n- **Before/After JSON** — side-by-side comparison of data before and after the action (for updates)\n- **Metadata JSON** — additional contextual data",
          descriptionAr:
            "انقر على **أيقونة العين** في أي صف سجل تدقيق لفتح نافذة التفاصيل الكاملة:\n\n**يُعرض دائماً:**\n- **المستخدم** — اسم العرض ونوع الفاعل (مستخدم/نظام/خدمة)\n- **الطابع الزمني** — التاريخ/الوقت الدقيق\n- **الإجراء** — شارة الإجراء\n- **الكيان** — الاسم + المعرّف\n- **النتيجة** — نجاح/فشل مع أيقونة\n- **المدة** — وقت المعالجة بالمللي ثانية\n- **عنوان IP** — IP المصدر\n- **المصدر / القناة** — معلومات الاتصال\n- **معرّف الارتباط** — لتتبع الأحداث المرتبطة\n- **وكيل المستخدم** — معلومات المتصفح/العميل\n\n**أقسام مشروطة:**\n- **رسالة الخطأ** — تُعرض عند الفشل (خلفية حمراء)\n- **JSON قبل/بعد** — مقارنة جنباً إلى جنب للبيانات قبل وبعد الإجراء (للتحديثات)\n- **بيانات وصفية JSON** — بيانات سياقية إضافية",
          imagePlaceholder: "/tutorials/admin-audit-detail.png",
          tipEn:
            "The Before/After JSON comparison is particularly useful for investigating unauthorized data changes. It shows exactly what was modified, by whom, and when.",
          tipAr:
            "مقارنة JSON قبل/بعد مفيدة بشكل خاص للتحقيق في تغييرات البيانات غير المصرح بها. تعرض بالضبط ما تم تعديله ومن قِبل من ومتى.",
        },
        {
          id: "specialized-logs",
          titleEn: "Specialized Log Pages",
          titleAr: "صفحات السجلات المتخصصة",
          descriptionEn:
            "Four specialized log pages provide **filtered views** of system activity by user category:\n\n**User Logs** (System Logs → User Logs):\n- Tracks **admin and instructor** activities\n- Shows: API calls, endpoints, response times, user actions\n\n**Candidate Logs** (System Logs → Candidate Logs):\n- Tracks **candidate** login, exam access, and submission activity\n- Useful for investigating exam-related issues\n\n**Proctor Logs** (System Logs → Proctor Logs):\n- Tracks **proctoring sessions**, verification events, and incident actions\n- Useful for reviewing proctor decisions\n\n**Developer Logs** (System Logs → Developer Logs):\n- Tracks **system errors and exceptions** with full stack traces\n- Shows error messages, exception types, request/response bodies\n- Error/Critical rows highlighted in **red background**\n\n**All log pages share:**\n- **Search** input\n- **Level filter** — Info (blue), Warning (amber), Error (red), Critical (red)\n- **Date range** — From/To date pickers\n- **Auto-refresh** toggle (30-second interval)\n- **Detail modal** — click any row for full request/response data\n- **Pagination** — 20 items per page",
          descriptionAr:
            "أربع صفحات سجلات متخصصة توفر **عروض مُفلترة** لنشاط النظام حسب فئة المستخدم:\n\n**سجلات المستخدمين** (سجلات النظام → سجلات المستخدمين):\n- تتبع أنشطة **المديرين والمدرّسين**\n- تعرض: استدعاءات API والنقاط والأوقات وإجراءات المستخدم\n\n**سجلات المرشحين** (سجلات النظام → سجلات المرشحين):\n- تتبع **تسجيل دخول المرشحين** والوصول للاختبارات والتقديم\n- مفيدة للتحقيق في المشاكل المتعلقة بالاختبارات\n\n**سجلات المراقبة** (سجلات النظام → سجلات المراقبة):\n- تتبع **جلسات المراقبة** وأحداث التحقق وإجراءات الحوادث\n- مفيدة لمراجعة قرارات المراقب\n\n**سجلات المطورين** (سجلات النظام → سجلات المطورين):\n- تتبع **أخطاء النظام والاستثناءات** مع تتبع المكدس الكامل\n- تعرض رسائل الأخطاء وأنواع الاستثناءات ونصوص الطلب/الاستجابة\n- صفوف الخطأ/الحرج مُميزة بـ**خلفية حمراء**\n\n**جميع صفحات السجلات تتشارك:**\n- **إدخال بحث**\n- **فلتر المستوى** — معلومات (أزرق)، تحذير (عنبري)، خطأ (أحمر)، حرج (أحمر)\n- **نطاق التاريخ** — منتقي تاريخ من/إلى\n- **تحديث تلقائي** مفتاح (كل 30 ثانية)\n- **نافذة تفاصيل** — انقر أي صف لبيانات الطلب/الاستجابة الكاملة\n- **ترقيم الصفحات** — 20 عنصر لكل صفحة",
          imagePlaceholder: "/tutorials/admin-system-logs.png",
          noteEn:
            "Developer Logs are the only page that shows **error columns** and **stack traces**. Use this page when investigating system errors or debugging technical issues.",
          noteAr:
            "سجلات المطورين هي الصفحة الوحيدة التي تعرض **أعمدة الأخطاء** و**تتبع المكدس**. استخدم هذه الصفحة عند التحقيق في أخطاء النظام أو تشخيص المشاكل التقنية.",
        },
      ],
      examples: [
        {
          titleEn: "Log Level Reference",
          titleAr: "مرجع مستويات السجل",
          contentEn:
            "**Log Levels and When They Appear:**\n\n✓ **Info** (blue badge) — normal operations: successful logins, API calls, page loads\n✓ **Warning** (amber badge) — non-critical issues: slow queries, rate limiting, deprecated API usage\n✗ **Error** (red badge) — recoverable failures: failed API calls, validation errors, timeout issues\n✗ **Critical** (red badge + XCircle) — severe failures: database connection lost, authentication system failure, data corruption\n\n**Audit Action Categories:**\n- **Auth** — Login, LoginFailed, Logout, PasswordChanged, RoleChanged\n- **User** — Created, Updated, Deleted\n- **Exam** — Created, Published, Deleted\n- **Attempt** — Started, Submitted, ForceSubmitted, TimeAdded\n- **Grading** — Completed, ManualGrade\n- **Result** — Finalized, Published\n- **Incident** — Created, DecisionMade\n- **Proctor** — SessionStarted, DecisionMade",
          contentAr:
            "**مستويات السجل ومتى تظهر:**\n\n✓ **معلومات** (شارة زرقاء) — عمليات طبيعية: تسجيلات دخول ناجحة، استدعاءات API، تحميل الصفحات\n✓ **تحذير** (شارة عنبرية) — مشاكل غير حرجة: استعلامات بطيئة، تقييد المعدل، استخدام API قديم\n✗ **خطأ** (شارة حمراء) — فشل قابل للاسترداد: استدعاءات API فاشلة، أخطاء التحقق، مشاكل المهلة\n✗ **حرج** (شارة حمراء + X) — فشل حاد: فقدان اتصال قاعدة البيانات، فشل نظام المصادقة، تلف البيانات\n\n**فئات إجراءات التدقيق:**\n- **المصادقة** — تسجيل الدخول، فشل الدخول، الخروج، تغيير كلمة المرور، تغيير الدور\n- **المستخدم** — الإنشاء، التحديث، الحذف\n- **الاختبار** — الإنشاء، النشر، الحذف\n- **المحاولة** — البدء، التقديم، التقديم الإجباري، إضافة الوقت\n- **التقييم** — الاكتمال، التقييم اليدوي\n- **النتيجة** — النهائية، النشر\n- **الحادثة** — الإنشاء، القرار\n- **المراقب** — بدء الجلسة، القرار",
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// CANDIDATE PORTAL MODULE (Candidate Role Pages)
// ────────────────────────────────────────────────────────
export const candidatePortalTutorial: TutorialModule = {
  id: "candidate-portal",
  slug: "candidate-portal",
  titleEn: "Candidate Portal",
  titleAr: "بوابة المرشح",
  descriptionEn:
    "Complete guide to the Candidate Portal — the experience candidates see after logging in. Covers Identity Verification, My Exams page, Exam Instructions, the full exam-taking interface, and post-submission results.",
  descriptionAr:
    "دليل شامل لبوابة المرشح — التجربة التي يراها المرشحون بعد تسجيل الدخول. يغطي التحقق من الهوية، صفحة اختباراتي، تعليمات الاختبار، واجهة أداء الاختبار الكاملة، ونتائج ما بعد التقديم.",
  iconName: "GraduationCap",
  sections: [
    // ── Section 1: Overview & Navigation ──────────────────
    {
      id: "portal-overview",
      titleEn: "Overview & Navigation",
      titleAr: "نظرة عامة والتنقل",
      descriptionEn:
        "Understand the **Candidate Portal** layout, sidebar navigation, and what candidates can access after logging in.",
      descriptionAr:
        "فهم تخطيط **بوابة المرشح**، التنقل في الشريط الجانبي، وما يمكن للمرشحين الوصول إليه بعد تسجيل الدخول.",
      steps: [
        {
          id: "portal-sidebar",
          titleEn: "Portal Layout & Sidebar",
          titleAr: "تخطيط البوابة والشريط الجانبي",
          descriptionEn:
            'When a candidate logs in, they see a dedicated **Candidate Portal** with a simplified sidebar:\n\n**Sidebar Menu Items:**\n1. **Dashboard** — landing page with welcome message and current date\n2. **My Exams** — all assigned exams with status filters and actions\n3. **Identity** — identity verification status and submission form\n\n**Header Bar (Top Right):**\n- 🔔 **Notifications bell** — alerts for exam assignments, results, and system messages\n- ☀️ **Theme toggle** — switch between Light and Dark mode\n- 🌐 **Language toggle** — switch between English and Arabic (full RTL support)\n- 👤 **User avatar & name** — shows candidate name with profile menu\n\n**Identity Status Badge:**\nThe sidebar shows the current verification status next to "Identity":\n- "None" (gray) — not yet submitted\n- "Pending" (yellow) — submitted, awaiting review\n- "Verified" (green) — approved\n- "Rejected" (red) — rejected, can resubmit',
          descriptionAr:
            'عندما يسجل المرشح الدخول، يرى **بوابة مرشح** مخصصة بشريط جانبي مبسط:\n\n**عناصر قائمة الشريط الجانبي:**\n1. **لوحة التحكم** — صفحة الهبوط مع رسالة ترحيب والتاريخ الحالي\n2. **اختباراتي** — جميع الاختبارات المعينة مع فلاتر الحالة والإجراءات\n3. **الهوية** — حالة التحقق من الهوية ونموذج التقديم\n\n**شريط الرأس (أعلى اليمين):**\n- 🔔 **جرس الإشعارات** — تنبيهات لتعيينات الاختبارات والنتائج ورسائل النظام\n- ☀️ **تبديل السمة** — التبديل بين الوضع الفاتح والداكن\n- 🌐 **تبديل اللغة** — التبديل بين الإنجليزية والعربية (دعم كامل لـ RTL)\n- 👤 **صورة وأسم المستخدم** — يعرض اسم المرشح مع قائمة الملف الشخصي\n\n**شارة حالة الهوية:**\nيعرض الشريط الجانبي حالة التحقق الحالية بجانب "الهوية":\n- "بدون" (رمادي) — لم يتم التقديم بعد\n- "قيد المراجعة" (أصفر) — تم التقديم، في انتظار المراجعة\n- "موثق" (أخضر) — تمت الموافقة\n- "مرفوض" (أحمر) — مرفوض، يمكن إعادة التقديم',
          tipEn:
            "If the candidate's identity is **not verified**, they are directed to the Identity Verification page first before they can access exams.",
          tipAr:
            "إذا كانت هوية المرشح **غير موثقة**، يتم توجيهه إلى صفحة التحقق من الهوية أولاً قبل أن يتمكن من الوصول إلى الاختبارات.",
          imagePlaceholder: "/tutorials/candidate-portal-sidebar.png",
        },
        {
          id: "portal-flow",
          titleEn: "Candidate Journey Flow",
          titleAr: "مسار رحلة المرشح",
          descriptionEn:
            'The candidate follows a specific flow from login to exam completion:\n\n**Complete Candidate Journey:**\n1. **Login** → Candidate logs in with credentials\n2. **Identity Verification** → If not verified, must complete verification first\n3. **My Exams** → Browse all assigned exams with status filters\n4. **Start Exam** → Click "Start Exam" on an available exam card\n5. **Instructions Page** → Review exam rules, system checks, and agree to terms\n6. **Exam Taking** → Answer questions within sections with timers running\n7. **Submit Exam** → Confirm submission when ready or auto-submit on time expiry\n8. **Results** → View score, pass/fail status, and download certificate if passed\n\n**Key Rules:**\n- ✓ Candidates can only see exams **assigned to them** via the admin panel\n- ✓ A candidate profile is **shared across all departments** — one candidate can take exams from any department\n- ✓ Each exam has a **maximum number of attempts** — once exhausted, the candidate cannot retake\n- ✗ Candidates **cannot** access admin features, question banks, or grading modules\n- ✗ Candidates **cannot** go back to submit their own grades or modify answers after submission',
          descriptionAr:
            'يتبع المرشح مسارًا محددًا من تسجيل الدخول إلى إكمال الاختبار:\n\n**رحلة المرشح الكاملة:**\n1. **تسجيل الدخول** → يسجل المرشح الدخول ببيانات الاعتماد\n2. **التحقق من الهوية** → إذا لم يكن موثقًا، يجب إكمال التحقق أولاً\n3. **اختباراتي** → تصفح جميع الاختبارات المعينة مع فلاتر الحالة\n4. **بدء الاختبار** → النقر على "بدء الاختبار" في بطاقة اختبار متاح\n5. **صفحة التعليمات** → مراجعة قواعد الاختبار، فحوصات النظام، والموافقة على الشروط\n6. **أداء الاختبار** → الإجابة على الأسئلة ضمن الأقسام مع تشغيل المؤقتات\n7. **تقديم الاختبار** → تأكيد التقديم عند الجاهزية أو التقديم التلقائي عند انتهاء الوقت\n8. **النتائج** → عرض الدرجة، حالة النجاح/الرسوب، وتنزيل الشهادة إذا نجح\n\n**القواعد الرئيسية:**\n- ✓ يمكن للمرشحين رؤية الاختبارات **المعينة لهم فقط** عبر لوحة الإدارة\n- ✓ ملف المرشح **مشترك بين جميع الأقسام** — مرشح واحد يمكنه أداء اختبار من أي قسم\n- ✓ كل اختبار له **عدد أقصى من المحاولات** — بمجرد استنفادها، لا يمكن للمرشح إعادة الاختبار\n- ✗ المرشحون **لا يمكنهم** الوصول إلى ميزات المسؤول أو بنوك الأسئلة أو وحدات التقييم\n- ✗ المرشحون **لا يمكنهم** العودة لتقديم درجاتهم أو تعديل الإجابات بعد التقديم',
          imagePlaceholder: "/tutorials/candidate-portal-flow.png",
        },
      ],
    },

    // ── Section 2: Identity Verification ─────────────────
    {
      id: "identity-verification",
      titleEn: "Identity Verification",
      titleAr: "التحقق من الهوية",
      descriptionEn:
        "Candidates must **verify their identity** by taking a selfie and uploading an ID document before they can take any exam. This is a **3-step process** that requires review and approval.",
      descriptionAr:
        "يجب على المرشحين **التحقق من هويتهم** عن طريق التقاط صورة سيلفي وتحميل وثيقة هوية قبل أن يتمكنوا من أداء أي اختبار. هذه **عملية من 3 خطوات** تتطلب المراجعة والموافقة.",
      steps: [
        {
          id: "verification-status",
          titleEn: "Verification Status States",
          titleAr: "حالات التحقق من الهوية",
          descriptionEn:
            'The Identity page shows the current verification status at the top. Each status determines what the candidate sees:\n\n**Status States:**\n- ✓ **None** (gray shield icon) — Initial state. The candidate has not submitted any verification yet. The full capture form is displayed.\n- ✓ **Pending** (yellow clock icon) — Verification submitted and awaiting admin review. A status card shows "Your verification is under review" with submission timestamp.\n- ✓ **Approved / Verified** (green checkmark icon) — Identity verified successfully. Shows success card with "Your identity has been verified" and a "Go to My Exams" button.\n- ✗ **Rejected** (red X icon) — Verification rejected by admin. Shows rejection reason (review notes) and a "Re-submit" button to start over.\n- ✗ **Flagged** (orange warning icon) — Marked as suspicious. Shows flag reason and allows resubmission.\n\nThe page has a **3-step progress indicator** at the top:\n1. Selfie → 2. Emirates ID → 3. ID Info\n\nAll three steps are displayed on one page (not separate wizard pages).',
          descriptionAr:
            'تعرض صفحة الهوية حالة التحقق الحالية في الأعلى. كل حالة تحدد ما يراه المرشح:\n\n**حالات التوثيق:**\n- ✓ **بدون** (أيقونة درع رمادية) — الحالة الأولية. لم يقدم المرشح أي تحقق بعد. يتم عرض نموذج الالتقاط الكامل.\n- ✓ **قيد المراجعة** (أيقونة ساعة صفراء) — تم تقديم التحقق في انتظار مراجعة المسؤول. تعرض بطاقة الحالة "التحقق قيد المراجعة" مع طابع وقت التقديم.\n- ✓ **معتمد / موثق** (أيقونة علامة صح خضراء) — تم التحقق من الهوية بنجاح. يعرض بطاقة نجاح مع "تم التحقق من هويتك" وزر "الذهاب إلى اختباراتي".\n- ✗ **مرفوض** (أيقونة X حمراء) — تم رفض التحقق من قبل المسؤول. يعرض سبب الرفض (ملاحظات المراجعة) وزر "إعادة التقديم" للبدء من جديد.\n- ✗ **مُبلّغ عنه** (أيقونة تحذير برتقالية) — تم وضع علامة مشبوهة. يعرض سبب الإبلاغ ويسمح بإعادة التقديم.\n\nتحتوي الصفحة على **مؤشر تقدم من 3 خطوات** في الأعلى:\n1. سيلفي → 2. بطاقة الهوية الإماراتية → 3. معلومات الهوية\n\nتُعرض جميع الخطوات الثلاث في صفحة واحدة (وليس صفحات معالج منفصلة).',
          imagePlaceholder:
            "/tutorials/candidate-portal-verification-status.png",
        },
        {
          id: "step1-selfie",
          titleEn: "Step 1: Take a Selfie",
          titleAr: "الخطوة 1: التقاط صورة سيلفي",
          descriptionEn:
            'The first card is **Take a Selfie**. The candidate must capture a live photo using their device camera.\n\n**How It Works:**\n1. Click the **"Open Camera"** button — this requests webcam permission from the browser\n2. A **live video preview** appears showing the camera feed (640×480 resolution)\n3. Position your face clearly in the camera frame\n4. Click **"Capture Photo"** — a snapshot is taken from the video feed\n5. The captured photo shows as a preview with a green **"Captured"** badge\n6. If unhappy with the photo, click **"Retake"** to capture again\n\n**Technical Details:**\n- Uses the browser\'s **getUserMedia** API to access the webcam\n- Converts the live video frame to a **JPEG image** (quality 0.9)\n- The camera stream is properly cleaned up when done\n\n**Common Issues:**\n- ✗ **Camera permission denied** — the browser blocked camera access. Check browser settings and allow camera permission\n- ✗ **No camera found** — the device does not have a webcam. Use a device with a camera\n- ✓ **Camera working** — green "Ready" indicator shows the camera is accessible',
          descriptionAr:
            'البطاقة الأولى هي **التقاط صورة سيلفي**. يجب على المرشح التقاط صورة حية باستخدام كاميرا جهازه.\n\n**كيف يعمل:**\n1. انقر على زر **"فتح الكاميرا"** — يطلب إذن الكاميرا من المتصفح\n2. تظهر **معاينة فيديو حية** تعرض تغذية الكاميرا (دقة 640×480)\n3. ضع وجهك بوضوح في إطار الكاميرا\n4. انقر على **"التقاط صورة"** — يتم أخذ لقطة من تغذية الفيديو\n5. تُعرض الصورة الملتقطة كمعاينة مع شارة خضراء **"تم الالتقاط"**\n6. إذا لم تكن راضيًا عن الصورة، انقر على **"إعادة الالتقاط"** للالتقاط مرة أخرى\n\n**التفاصيل التقنية:**\n- يستخدم واجهة **getUserMedia** للمتصفح للوصول إلى الكاميرا\n- يحول إطار الفيديو الحي إلى **صورة JPEG** (جودة 0.9)\n- يتم تنظيف تدفق الكاميرا بشكل صحيح عند الانتهاء\n\n**مشاكل شائعة:**\n- ✗ **تم رفض إذن الكاميرا** — حظر المتصفح الوصول إلى الكاميرا. تحقق من إعدادات المتصفح واسمح بإذن الكاميرا\n- ✗ **لم يتم العثور على كاميرا** — الجهاز لا يحتوي على كاميرا ويب. استخدم جهازًا بكاميرا\n- ✓ **الكاميرا تعمل** — مؤشر أخضر "جاهز" يظهر أن الكاميرا متاحة',
          imagePlaceholder: "/tutorials/candidate-portal-selfie.png",
        },
        {
          id: "step2-emirates-id",
          titleEn: "Step 2: Upload Emirates ID Photo",
          titleAr: "الخطوة 2: تحميل صورة بطاقة الهوية الإماراتية",
          descriptionEn:
            'The second card is **Emirates ID Photo**. The candidate uploads a clear photo of the front side of their Emirates ID.\n\n**How It Works:**\n1. Click the **"Upload ID Photo"** button\n2. A file picker opens — select a photo of your ID\n3. The uploaded photo shows as a preview with a green **"Uploaded"** badge\n4. To change the photo, click the **"Change"** button\n\n**File Requirements:**\n- **Accepted formats:** JPEG, PNG, or WebP\n- **Maximum file size:** 10MB\n- If the file type is wrong or too large, a **toast notification** shows the error\n\n**Preview:**\nThe uploaded image displays in a 16:10 aspect ratio preview card for the candidate to verify before submitting.',
          descriptionAr:
            'البطاقة الثانية هي **صورة بطاقة الهوية الإماراتية**. يقوم المرشح بتحميل صورة واضحة للجانب الأمامي من بطاقة الهوية الإماراتية.\n\n**كيف يعمل:**\n1. انقر على زر **"تحميل صورة الهوية"**\n2. يفتح منتقي الملفات — اختر صورة لبطاقة هويتك\n3. تُعرض الصورة المحملة كمعاينة مع شارة خضراء **"تم التحميل"**\n4. لتغيير الصورة، انقر على زر **"تغيير"**\n\n**متطلبات الملف:**\n- **الصيغ المقبولة:** JPEG أو PNG أو WebP\n- **الحجم الأقصى:** 10 ميجابايت\n- إذا كان نوع الملف خاطئًا أو كبيرًا جدًا، يظهر **إشعار منبثق** بالخطأ\n\n**المعاينة:**\nتُعرض الصورة المحملة في بطاقة معاينة بنسبة عرض إلى ارتفاع 16:10 ليتحقق المرشح منها قبل التقديم.',
          imagePlaceholder: "/tutorials/candidate-portal-emirates-id.png",
        },
        {
          id: "step3-id-info",
          titleEn: "Step 3: ID Information",
          titleAr: "الخطوة 3: معلومات الهوية",
          descriptionEn:
            "The third card is **ID Information**. The candidate fills in their document type and ID number.\n\n**Form Fields:**",
          descriptionAr:
            "البطاقة الثالثة هي **معلومات الهوية**. يملأ المرشح نوع الوثيقة ورقم الهوية.\n\n**حقول النموذج:**",
          fields: [
            {
              nameEn: "Document Type",
              nameAr: "نوع الوثيقة",
              required: true,
              descriptionEn:
                "Dropdown select with 4 options: **Emirates ID** (default), **National ID**, **Passport**, **Driving License**",
              descriptionAr:
                "قائمة منسدلة بـ 4 خيارات: **بطاقة الهوية الإماراتية** (افتراضي)، **الهوية الوطنية**، **جواز السفر**، **رخصة القيادة**",
            },
            {
              nameEn: "ID Number",
              nameAr: "رقم الهوية",
              required: true,
              descriptionEn:
                "Text input field. Enter the ID number shown on your document. Must not be empty.",
              descriptionAr:
                "حقل إدخال نصي. أدخل رقم الهوية الموضح على وثيقتك. يجب ألا يكون فارغًا.",
            },
          ],
          imagePlaceholder: "/tutorials/candidate-portal-id-info.png",
        },
        {
          id: "verification-submit",
          titleEn: "Submit & After Submission",
          titleAr: "التقديم وما بعده",
          descriptionEn:
            'Once all three steps are completed (selfie captured, ID photo uploaded, ID information filled), click the **"Submit Verification"** button.\n\n**Submission Requirements:**\n- ✓ Selfie photo must be captured (not skipped)\n- ✓ ID photo must be uploaded (valid format and under 10MB)\n- ✓ Document type must be selected\n- ✓ ID number must be entered (not empty)\n\n**After Submitting:**\nThe page transitions to a **status view** showing:\n- **Pending status card** with a clock icon and yellow styling\n- Message: "Your verification is under review"\n- Submission timestamp\n- The candidate must wait for an admin to **Approve** or **Reject**\n\n**If Rejected:**\nA red status card appears showing:\n- Rejection reason (admin\'s review notes)\n- A **"Re-submit"** button that resets the form for a new attempt\n- All three steps must be completed again\n\n**If Approved:**\nA green status card appears showing:\n- ✓ "Your identity has been verified" message\n- **"Go to My Exams"** button to navigate to exam list\n- The sidebar Identity badge changes to green "Verified"',
          descriptionAr:
            'بمجرد إكمال جميع الخطوات الثلاث (التقاط السيلفي، تحميل صورة الهوية، ملء معلومات الهوية)، انقر على زر **"تقديم التحقق"**.\n\n**متطلبات التقديم:**\n- ✓ يجب التقاط صورة السيلفي (لا يمكن تخطيها)\n- ✓ يجب تحميل صورة الهوية (صيغة صالحة وأقل من 10 ميجابايت)\n- ✓ يجب اختيار نوع الوثيقة\n- ✓ يجب إدخال رقم الهوية (غير فارغ)\n\n**بعد التقديم:**\nتنتقل الصفحة إلى **عرض الحالة** يظهر:\n- **بطاقة حالة قيد المراجعة** بأيقونة ساعة وتنسيق أصفر\n- رسالة: "التحقق الخاص بك قيد المراجعة"\n- طابع وقت التقديم\n- يجب على المرشح انتظار المسؤول لـ **الموافقة** أو **الرفض**\n\n**في حالة الرفض:**\nتظهر بطاقة حالة حمراء تعرض:\n- سبب الرفض (ملاحظات مراجعة المسؤول)\n- زر **"إعادة التقديم"** الذي يعيد تعيين النموذج لمحاولة جديدة\n- يجب إكمال جميع الخطوات الثلاث مرة أخرى\n\n**في حالة الموافقة:**\nتظهر بطاقة حالة خضراء تعرض:\n- ✓ رسالة "تم التحقق من هويتك"\n- زر **"الذهاب إلى اختباراتي"** للانتقال إلى قائمة الاختبارات\n- تتغير شارة الهوية في الشريط الجانبي إلى "موثق" باللون الأخضر',
          imagePlaceholder:
            "/tutorials/candidate-portal-verification-submit.png",
        },
      ],
      examples: [
        {
          titleEn: "Verification Status Flow",
          titleAr: "مسار حالة التحقق",
          contentEn:
            "**Candidate submits verification:**\nNone → Pending → Approved ✓\nNone → Pending → Rejected ✗ → Re-submit → Pending → Approved ✓\nNone → Pending → Flagged ⚠ → Re-submit → Pending → Approved ✓\n\n**Who reviews?**\nAdmin or SuperAdmin reviews the verification from the **Candidate Exam Details** page in the admin panel. They see the selfie, ID photo, document type, and ID number side by side.",
          contentAr:
            "**المرشح يقدم التحقق:**\nبدون → قيد المراجعة → معتمد ✓\nبدون → قيد المراجعة → مرفوض ✗ → إعادة التقديم → قيد المراجعة → معتمد ✓\nبدون → قيد المراجعة → مُبلّغ عنه ⚠ → إعادة التقديم → قيد المراجعة → معتمد ✓\n\n**من يراجع؟**\nالمسؤول أو المسؤول الأعلى يراجع التحقق من صفحة **تفاصيل اختبار المرشح** في لوحة الإدارة. يرون السيلفي وصورة الهوية ونوع الوثيقة ورقم الهوية جنبًا إلى جنب.",
        },
      ],
    },

    // ── Section 3: My Exams Page ─────────────────────────
    {
      id: "my-exams",
      titleEn: "My Exams Page",
      titleAr: "صفحة اختباراتي",
      descriptionEn:
        "The **My Exams** page is the main hub for candidates to view all assigned exams, filter by status, search, and take action on each exam.",
      descriptionAr:
        "صفحة **اختباراتي** هي المحور الرئيسي للمرشحين لعرض جميع الاختبارات المعينة، التصفية حسب الحالة، البحث، واتخاذ الإجراءات على كل اختبار.",
      steps: [
        {
          id: "exam-status-tabs",
          titleEn: "Status Filter Tabs",
          titleAr: "علامات تبويب فلتر الحالة",
          descriptionEn:
            'At the top of the page, **filter tabs** show exam counts by status. Click any tab to filter the exam list:\n\n| Tab | Description | Badge Color |\n| All | Shows total count of all exams | Default |\n| Available | Exams the candidate can start now (within schedule, attempts remaining) | Emerald green |\n| In Progress | An active attempt is currently running | Sky blue |\n| Resume | Exams with admin override allowing the candidate to resume a terminated/expired attempt | Blue |\n| Submitted | Attempt submitted but grading/results not yet published | Amber |\n| Completed | Grading and results have been published | Emerald green |\n| Expired | The exam end date has passed | Rose red |\n| Terminated | The attempt was manually terminated by a proctor or auto-terminated due to violations | Gray |\n\nEach tab shows a **count badge** with the number of exams in that status. The "All" tab is selected by default.\n\nA **search bar** on the right lets you search exams by title or description (both English and Arabic).',
          descriptionAr:
            'في أعلى الصفحة، تعرض **علامات تبويب الفلتر** أعداد الاختبارات حسب الحالة. انقر على أي علامة تبويب لتصفية قائمة الاختبارات:\n\n| التبويب | الوصف | لون الشارة |\n| الكل | يعرض العدد الإجمالي لجميع الاختبارات | افتراضي |\n| متاح | اختبارات يمكن للمرشح بدؤها الآن (ضمن الجدول، محاولات متبقية) | أخضر زمردي |\n| قيد التقدم | محاولة نشطة قيد التشغيل حاليًا | أزرق سماوي |\n| استئناف | اختبارات بتجاوز إداري يسمح للمرشح باستئناف محاولة منتهية/منتهية الصلاحية | أزرق |\n| مُقدم | تم تقديم المحاولة لكن التقييم/النتائج لم تُنشر بعد | عنبري |\n| مكتمل | تم نشر التقييم والنتائج | أخضر زمردي |\n| منتهي الصلاحية | تجاوز تاريخ انتهاء الاختبار | وردي أحمر |\n| موقوف | تم إيقاف المحاولة يدويًا بواسطة مراقب أو تلقائيًا بسبب المخالفات | رمادي |\n\nكل علامة تبويب تعرض **شارة عدد** بعدد الاختبارات في تلك الحالة. يتم تحديد علامة تبويب "الكل" بشكل افتراضي.\n\nيتيح **شريط البحث** على اليمين البحث عن الاختبارات بالعنوان أو الوصف (بالإنجليزية والعربية).',
          imagePlaceholder: "/tutorials/candidate-portal-exam-tabs.png",
        },
        {
          id: "exam-card-details",
          titleEn: "Exam Card Information",
          titleAr: "معلومات بطاقة الاختبار",
          descriptionEn:
            'Each exam appears as a **card** with detailed information:\n\n**Card Header:**\n- **Exam Title** — localized name (English or Arabic based on language setting)\n- **Description** — truncated to 2 lines with "..." for longer text\n- **Status Badge** — color-coded label (Available, Completed, Expired, etc.)\n\n**Stats Grid (2×2 layout with colored icons):**\n- 📄 **Questions** (blue icon) — total number of questions in the exam\n- 🏆 **Points** (amber icon) — total points available\n- 🎯 **Pass Score** (emerald icon) — minimum score to pass\n- ⏱️ **Duration** (purple icon) — exam time limit in minutes\n\n**Attempts Section:**\n- Shows **Used / Maximum** attempts (e.g., "0 / 1", "1 / 1")\n- **Progress bar** visualization:\n  - Green — attempts remaining\n  - Amber — only 1 attempt left\n  - Red — no attempts left ("No attempts left" text)\n- Text shows remaining attempts count (e.g., "1 attempts remaining")\n\n**Schedule Section:**\n- **Start** date and time\n- **Expired** / End date and time\n- If the exam is **Flexible** (no schedule), a "Flex Exam" badge appears instead\n\n**Result Strip (for completed exams):**\n- ✓ **Passed** — green strip at the bottom\n- ✗ **Failed** — red strip at the bottom with **"Failed"** text',
          descriptionAr:
            'يظهر كل اختبار كـ **بطاقة** بمعلومات تفصيلية:\n\n**رأس البطاقة:**\n- **عنوان الاختبار** — الاسم المترجم (إنجليزي أو عربي حسب إعداد اللغة)\n- **الوصف** — مختصر إلى سطرين مع "..." للنص الأطول\n- **شارة الحالة** — تسمية ملونة (متاح، مكتمل، منتهي الصلاحية، إلخ)\n\n**شبكة الإحصائيات (تخطيط 2×2 بأيقونات ملونة):**\n- 📄 **الأسئلة** (أيقونة زرقاء) — العدد الإجمالي للأسئلة في الاختبار\n- 🏆 **النقاط** (أيقونة عنبرية) — إجمالي النقاط المتاحة\n- 🎯 **درجة النجاح** (أيقونة زمردية) — الحد الأدنى للدرجة للنجاح\n- ⏱️ **المدة** (أيقونة بنفسجية) — الحد الزمني للاختبار بالدقائق\n\n**قسم المحاولات:**\n- يعرض المحاولات **المستخدمة / الحد الأقصى** (مثلاً "0 / 1"، "1 / 1")\n- **شريط تقدم** مرئي:\n  - أخضر — محاولات متبقية\n  - عنبري — محاولة واحدة فقط متبقية\n  - أحمر — لا محاولات متبقية (نص "لا محاولات متبقية")\n- النص يعرض عدد المحاولات المتبقية (مثلاً "1 محاولة متبقية")\n\n**قسم الجدول الزمني:**\n- تاريخ ووقت **البدء**\n- تاريخ ووقت **الانتهاء** / انتهاء الصلاحية\n- إذا كان الاختبار **مرنًا** (بدون جدول)، تظهر شارة "اختبار مرن" بدلاً من ذلك\n\n**شريط النتيجة (للاختبارات المكتملة):**\n- ✓ **ناجح** — شريط أخضر في الأسفل\n- ✗ **غير ناجح** — شريط أحمر في الأسفل مع نص **"غير ناجح"**',
          imagePlaceholder: "/tutorials/candidate-portal-exam-card.png",
        },
        {
          id: "exam-card-actions",
          titleEn: "Exam Card Actions",
          titleAr: "إجراءات بطاقة الاختبار",
          descriptionEn:
            'The **action button** at the bottom of each card changes based on exam status:\n\n**Available Exam:**\n- ▶️ **"Start Exam"** (blue button) — navigates to the Instructions page. Enabled only when the exam is within its schedule window AND attempts are remaining.\n- ⏳ **"Not Yet Available"** (disabled) — the exam start date is in the future\n- 🚫 **"No Attempts Left"** (disabled) — all allowed attempts have been used\n\n**In Progress:**\n- ▶️ **"Continue"** (blue button) — resumes the active attempt directly (goes to the exam-taking page, not instructions)\n\n**Submitted (Grading in Progress):**\n- ⏳ **"Under Review"** (disabled button) — grading is not yet complete\n\n**Completed:**\n- 👁️ **"View Results"** (primary button) — navigates to the results page showing score and certificate\n- 🔄 **"Retake"** (secondary button) — appears if attempts remain, exam is in window, and candidate has not passed. Navigates to Instructions page.\n\n**Expired / Terminated:**\n- 🔄 **"Retake"** (if admin has granted an override with additional attempts)\n- 🚫 **"Expired"** or **"Terminated"** (disabled) — no further action possible\n\n**Admin Override Badge:**\nIf an admin has granted a special override (extra attempts, resume permission), a special badge appears on the card indicating the override.',
          descriptionAr:
            'يتغير **زر الإجراء** في أسفل كل بطاقة بناءً على حالة الاختبار:\n\n**اختبار متاح:**\n- ▶️ **"بدء الاختبار"** (زر أزرق) — ينتقل إلى صفحة التعليمات. يكون مفعلاً فقط عندما يكون الاختبار ضمن نافذة الجدول الزمني وتبقى محاولات.\n- ⏳ **"غير متاح بعد"** (معطل) — تاريخ بدء الاختبار في المستقبل\n- 🚫 **"لا محاولات متبقية"** (معطل) — تم استخدام جميع المحاولات المسموح بها\n\n**قيد التقدم:**\n- ▶️ **"متابعة"** (زر أزرق) — يستأنف المحاولة النشطة مباشرة (ينتقل إلى صفحة أداء الاختبار، وليس التعليمات)\n\n**مُقدم (التقييم قيد التقدم):**\n- ⏳ **"قيد المراجعة"** (زر معطل) — لم يكتمل التقييم بعد\n\n**مكتمل:**\n- 👁️ **"عرض النتائج"** (زر رئيسي) — ينتقل إلى صفحة النتائج التي تعرض الدرجة والشهادة\n- 🔄 **"إعادة الاختبار"** (زر ثانوي) — يظهر إذا بقيت محاولات، والاختبار في النافذة الزمنية، ولم ينجح المرشح. ينتقل إلى صفحة التعليمات.\n\n**منتهي الصلاحية / موقوف:**\n- 🔄 **"إعادة الاختبار"** (إذا منح المسؤول تجاوزًا بمحاولات إضافية)\n- 🚫 **"منتهي الصلاحية"** أو **"موقوف"** (معطل) — لا إجراء إضافي ممكن\n\n**شارة التجاوز الإداري:**\nإذا منح المسؤول تجاوزًا خاصًا (محاولات إضافية، إذن استئناف)، تظهر شارة خاصة على البطاقة تشير إلى التجاوز.',
          imagePlaceholder: "/tutorials/candidate-portal-exam-actions.png",
        },
        {
          id: "exam-types",
          titleEn: "Fixed vs. Flexible Exams",
          titleAr: "اختبارات ثابتة مقابل مرنة",
          descriptionEn:
            'Exams come in two scheduling types:\n\n**Fixed Exams (Scheduled):**\n- Have a specific **Start** and **End** date/time\n- The candidate can only start the exam within this window\n- A **10-minute grace period** is allowed after the start time for fixed exams\n- After the end date, the exam status changes to **Expired**\n- The schedule section on the card shows exact dates\n\n**Flexible Exams (No Schedule):**\n- No start or end date constraints\n- The candidate can start the exam at any time\n- A **"Flex Exam"** badge appears on the card instead of schedule dates\n- Only limited by attempt count\n\n**Important Rules:**\n- ✓ The exam window is checked in real-time when the candidate clicks "Start Exam"\n- ✓ If the window has passed, the button becomes disabled\n- ✗ Starting an exam 1 second before expiry still gives the full exam duration — the timer runs independently of the schedule window',
          descriptionAr:
            'تأتي الاختبارات في نوعين من الجدولة:\n\n**اختبارات ثابتة (مجدولة):**\n- لها تاريخ/وقت **بدء** و**انتهاء** محدد\n- يمكن للمرشح بدء الاختبار فقط ضمن هذه النافذة\n- يُسمح بـ **فترة سماح 10 دقائق** بعد وقت البدء للاختبارات الثابتة\n- بعد تاريخ الانتهاء، تتغير حالة الاختبار إلى **منتهي الصلاحية**\n- يعرض قسم الجدول في البطاقة التواريخ الدقيقة\n\n**اختبارات مرنة (بدون جدول):**\n- لا قيود على تاريخ البدء أو الانتهاء\n- يمكن للمرشح بدء الاختبار في أي وقت\n- تظهر شارة **"اختبار مرن"** على البطاقة بدلاً من تواريخ الجدول\n- محدودة فقط بعدد المحاولات\n\n**قواعد مهمة:**\n- ✓ يتم التحقق من نافذة الاختبار في الوقت الفعلي عند نقر المرشح على "بدء الاختبار"\n- ✓ إذا انتهت النافذة، يصبح الزر معطلاً\n- ✗ بدء اختبار قبل ثانية من انتهاء الصلاحية لا يزال يمنح مدة الاختبار الكاملة — المؤقت يعمل بشكل مستقل عن نافذة الجدول',
          tipEn:
            "For fixed exams, make sure candidates know the exact start time. There is only a 10-minute grace period — after that, the exam cannot be started even if attempts remain.",
          tipAr:
            "للاختبارات الثابتة، تأكد من أن المرشحين يعرفون وقت البدء الدقيق. هناك فترة سماح 10 دقائق فقط — بعد ذلك، لا يمكن بدء الاختبار حتى لو بقيت محاولات.",
        },
      ],
    },

    // ── Section 4: Exam Instructions Page ────────────────
    {
      id: "exam-instructions",
      titleEn: "Exam Instructions Page",
      titleAr: "صفحة تعليمات الاختبار",
      descriptionEn:
        "Before starting an exam, candidates see a detailed **Instructions Page** with exam info, system checks, rules, security notices, and must agree before proceeding.",
      descriptionAr:
        "قبل بدء الاختبار، يرى المرشحون صفحة **تعليمات مفصلة** بمعلومات الاختبار، فحوصات النظام، القواعد، إشعارات الأمان، ويجب الموافقة قبل المتابعة.",
      steps: [
        {
          id: "instructions-exam-header",
          titleEn: "Exam Title & Language Selection",
          titleAr: "عنوان الاختبار واختيار اللغة",
          descriptionEn:
            "The instructions page opens in a **fullscreen-friendly layout** showing:\n\n**Exam Header:**\n- **Exam title** in large text (centered)\n- **Exam description** below in muted text\n- Horizontal separator line\n\n**Exam Language Selection:**\nA card with two buttons to choose the exam language:\n- **English** — displays all questions and options in English\n- **Arabic** — displays all questions and options in Arabic\n- The selected language is highlighted in blue\n- Language preference is saved to **localStorage** and applied throughout the exam\n- This setting only affects question/option text — the interface direction follows the global language setting",
          descriptionAr:
            "تفتح صفحة التعليمات في **تخطيط ملائم لملء الشاشة** يعرض:\n\n**رأس الاختبار:**\n- **عنوان الاختبار** بنص كبير (مركز)\n- **وصف الاختبار** أسفله بنص باهت\n- خط فاصل أفقي\n\n**اختيار لغة الاختبار:**\nبطاقة بزرين لاختيار لغة الاختبار:\n- **الإنجليزية** — تعرض جميع الأسئلة والخيارات بالإنجليزية\n- **العربية** — تعرض جميع الأسئلة والخيارات بالعربية\n- اللغة المختارة مميزة باللون الأزرق\n- يتم حفظ تفضيل اللغة في **localStorage** وتطبيقه في جميع أنحاء الاختبار\n- هذا الإعداد يؤثر فقط على نص الأسئلة/الخيارات — اتجاه الواجهة يتبع إعداد اللغة العام",
          imagePlaceholder:
            "/tutorials/candidate-portal-instructions-header.png",
        },
        {
          id: "instructions-system-check",
          titleEn: "System Ready Check",
          titleAr: "فحص جاهزية النظام",
          descriptionEn:
            'A **System Ready Check** card verifies the candidate\'s browser supports required features:\n\n**Fullscreen Support:**\n- Automatically checks if the browser supports fullscreen mode\n- Status: ✓ **"Ready"** (green badge) or ✗ **"Unsupported"** (red badge)\n- This is a browser capability check — cannot be retried\n- Required for exam security to prevent tab switching\n\n**Webcam Permission (if proctoring is enabled):**\n- Requests camera access from the browser\n- Status: ✓ **"Ready"** (green badge), ✗ **"Denied"** (red badge), or ✗ **"Error"** (red badge)\n- Includes a **"Retry"** button to re-request webcam permission\n- Auto-checks on page load if proctoring is required for the exam\n\n**Overall Status Message:**\n- ✓ **Green banner:** "All checks passed! You are ready to start." — all requirements met\n- ✗ **Red banner:** "Some checks failed" — the Start button may be disabled\n\nThe card has a **color-coded border and background:**\n- Green border → all passed\n- Red border → failures detected\n- Blue border → still checking',
          descriptionAr:
            'تتحقق بطاقة **فحص جاهزية النظام** من أن متصفح المرشح يدعم الميزات المطلوبة:\n\n**دعم ملء الشاشة:**\n- يتحقق تلقائيًا مما إذا كان المتصفح يدعم وضع ملء الشاشة\n- الحالة: ✓ **"جاهز"** (شارة خضراء) أو ✗ **"غير مدعوم"** (شارة حمراء)\n- هذا فحص قدرة المتصفح — لا يمكن إعادة المحاولة\n- مطلوب لأمان الاختبار لمنع تبديل علامات التبويب\n\n**إذن الكاميرا (إذا كانت المراقبة مفعلة):**\n- يطلب الوصول إلى الكاميرا من المتصفح\n- الحالة: ✓ **"جاهز"** (شارة خضراء)، ✗ **"مرفوض"** (شارة حمراء)، أو ✗ **"خطأ"** (شارة حمراء)\n- يتضمن زر **"إعادة المحاولة"** لإعادة طلب إذن الكاميرا\n- يتحقق تلقائيًا عند تحميل الصفحة إذا كانت المراقبة مطلوبة للاختبار\n\n**رسالة الحالة الإجمالية:**\n- ✓ **شعار أخضر:** "جميع الفحوصات نجحت! أنت جاهز للبدء." — تم استيفاء جميع المتطلبات\n- ✗ **شعار أحمر:** "فشلت بعض الفحوصات" — قد يكون زر البدء معطلاً\n\nالبطاقة لها **حدود وخلفية ملونة:**\n- حد أخضر → نجح الجميع\n- حد أحمر → تم اكتشاف فشل\n- حد أزرق → لا يزال يتحقق',
          imagePlaceholder: "/tutorials/candidate-portal-system-check.png",
        },
        {
          id: "instructions-exam-info",
          titleEn: "Exam Information Card",
          titleAr: "بطاقة معلومات الاختبار",
          descriptionEn:
            'Displays key exam details in a structured card:\n\n| Field | Icon | Description |\n| Duration | ⏱️ Clock | Exam time limit (e.g., "60 minutes") |\n| Total Questions | 📄 File | Number of questions in the exam |\n| Pass Score | 🎯 Target | Minimum score to pass (e.g., "10 / 40") |\n| Attempts | 🔄 Repeat | Used vs. maximum (e.g., "0 / 1") with remaining count |\n| Proctoring | 📷 Camera | Shows "Proctoring Enabled" badge if the exam requires live monitoring |\n\nThis gives candidates a quick overview of what the exam involves before they start.',
          descriptionAr:
            'تعرض تفاصيل الاختبار الرئيسية في بطاقة منظمة:\n\n| الحقل | الأيقونة | الوصف |\n| المدة | ⏱️ ساعة | الحد الزمني للاختبار (مثلاً "60 دقيقة") |\n| إجمالي الأسئلة | 📄 ملف | عدد الأسئلة في الاختبار |\n| درجة النجاح | 🎯 هدف | الحد الأدنى للدرجة للنجاح (مثلاً "10 / 40") |\n| المحاولات | 🔄 تكرار | المستخدمة مقابل الحد الأقصى (مثلاً "0 / 1") مع العدد المتبقي |\n| المراقبة | 📷 كاميرا | تعرض شارة "المراقبة مفعلة" إذا كان الاختبار يتطلب مراقبة حية |\n\nيمنح هذا المرشحين نظرة سريعة على ما يتضمنه الاختبار قبل أن يبدأوا.',
          imagePlaceholder: "/tutorials/candidate-portal-exam-info.png",
        },
        {
          id: "instructions-rules",
          titleEn: "Instructions, Rules & Security Notice",
          titleAr: "التعليمات والقواعد وإشعار الأمان",
          descriptionEn:
            'Multiple cards display the exam rules and security requirements:\n\n**Default Instructions (always shown):**\n1. **Time Limit** — the exam will auto-submit when time expires\n2. **Fullscreen Mode** — you must remain in fullscreen (tab switching is detected)\n3. **Connection** — a stable internet connection is required\n4. **Answers** — your answers are regularly auto-saved during the exam\n\n**Custom Instructions (if the exam creator added them):**\n- Additional exam-specific rules appear as a numbered list\n- These are localized (English/Arabic) based on the selected exam language\n\n**Important Warnings (amber/orange border card):**\n- Do not refresh or close the browser during the exam\n- Do not switch tabs or windows during the exam\n- Ensure your device is fully charged or plugged in\n- Once submitted, you cannot retake the exam unless allowed\n\n**Security Notice (blue border card — if proctoring enabled):**\nShows required security features as badges:\n- 📷 **Webcam Required** — your camera will be active during the exam\n- 🖥️ **Fullscreen Required** — you must stay in fullscreen mode\n- 📋 **Prevent Copy/Paste** — copy and paste actions are blocked\n- Text: "This exam is proctored. Your webcam and screen may be monitored."\n- Text: "Any suspicious activity will be flagged for review."\n\n**Auto-Termination Warning (orange border card — if violations are tracked):**\n- ⚠️ "This exam has automatic termination enabled. After **{N}** countable violations (such as tab switching, camera blocked, etc.), your exam will be automatically terminated."\n- The number {N} comes from the exam\'s **maxViolationWarnings** setting',
          descriptionAr:
            'تعرض بطاقات متعددة قواعد الاختبار ومتطلبات الأمان:\n\n**التعليمات الافتراضية (تظهر دائمًا):**\n1. **الحد الزمني** — سيتم تقديم الاختبار تلقائيًا عند انتهاء الوقت\n2. **وضع ملء الشاشة** — يجب البقاء في ملء الشاشة (يتم اكتشاف تبديل علامات التبويب)\n3. **الاتصال** — يلزم اتصال إنترنت مستقر\n4. **الإجابات** — يتم حفظ إجاباتك تلقائيًا بشكل منتظم أثناء الاختبار\n\n**التعليمات المخصصة (إذا أضافها منشئ الاختبار):**\n- تظهر قواعد إضافية خاصة بالاختبار كقائمة مرقمة\n- هذه مترجمة (إنجليزي/عربي) بناءً على لغة الاختبار المختارة\n\n**تحذيرات مهمة (بطاقة بحد عنبري/برتقالي):**\n- لا تقم بتحديث أو إغلاق المتصفح أثناء الاختبار\n- لا تقم بتبديل علامات التبويب أو النوافذ أثناء الاختبار\n- تأكد من أن جهازك مشحون بالكامل أو متصل بالطاقة\n- بمجرد التقديم، لا يمكنك إعادة الاختبار ما لم يُسمح بذلك\n\n**إشعار الأمان (بطاقة بحد أزرق — إذا كانت المراقبة مفعلة):**\nتعرض ميزات الأمان المطلوبة كشارات:\n- 📷 **الكاميرا مطلوبة** — ستكون كاميرتك نشطة أثناء الاختبار\n- 🖥️ **ملء الشاشة مطلوب** — يجب البقاء في وضع ملء الشاشة\n- 📋 **منع النسخ/اللصق** — يتم حظر إجراءات النسخ واللصق\n- نص: "هذا الاختبار مراقب. قد تتم مراقبة كاميرتك وشاشتك."\n- نص: "سيتم وضع علامة على أي نشاط مشبوه للمراجعة."\n\n**تحذير الإيقاف التلقائي (بطاقة بحد برتقالي — إذا كانت المخالفات متتبعة):**\n- ⚠️ "هذا الاختبار يحتوي على إيقاف تلقائي مفعل. بعد **{عدد}** مخالفات قابلة للعد (مثل تبديل علامات التبويب، حجب الكاميرا، إلخ)، سيتم إيقاف اختبارك تلقائيًا."\n- الرقم {عدد} يأتي من إعداد **maxViolationWarnings** للاختبار',
          imagePlaceholder:
            "/tutorials/candidate-portal-instructions-rules.png",
        },
        {
          id: "instructions-access-code",
          titleEn: "Access Code & Agreement",
          titleAr: "رمز الوصول والموافقة",
          descriptionEn:
            'The bottom of the instructions page contains the final requirements before starting:\n\n**Access Code Input (if required):**\n- A text input field appears if the exam requires an **access code**\n- The candidate must enter the code provided by their instructor or exam administrator\n- If the code is wrong, a red error message appears: "Enter the access code provided by your instructor"\n- This adds an extra layer of security to prevent unauthorized exam starts\n\n**Agreement Checkbox:**\n- ☐ "I have read and understood all instructions and agree to follow the exam rules."\n- This checkbox **must be checked** before the Start button becomes enabled\n- If not checked, the Start button remains grayed out\n\n**Start Exam Button:**\nThe large blue **"Start Exam"** button is enabled when ALL conditions are met:\n- ✓ Agreement checkbox is checked\n- ✓ All system ready checks passed (fullscreen, webcam if needed)\n- ✓ Access code entered correctly (if required)\n- ✓ Exam is eligible to start (within schedule, attempts remaining)\n\n**What happens when you click Start Exam:**\n1. The system verifies your eligibility one final time\n2. Saves your exam language preference\n3. Creates a new exam attempt (or resumes an existing one)\n4. Records your device information (browser, OS, screen resolution)\n5. Requests fullscreen mode (browser goes fullscreen)\n6. Navigates you to the **Exam Taking** page',
          descriptionAr:
            'يحتوي أسفل صفحة التعليمات على المتطلبات النهائية قبل البدء:\n\n**إدخال رمز الوصول (إذا كان مطلوبًا):**\n- يظهر حقل إدخال نصي إذا كان الاختبار يتطلب **رمز وصول**\n- يجب على المرشح إدخال الرمز المقدم من المعلم أو مسؤول الاختبار\n- إذا كان الرمز خاطئًا، تظهر رسالة خطأ حمراء: "أدخل رمز الوصول المقدم من معلمك"\n- يضيف هذا طبقة إضافية من الأمان لمنع بدء الاختبار غير المصرح به\n\n**مربع اختيار الموافقة:**\n- ☐ "لقد قرأت وفهمت جميع التعليمات وأوافق على اتباع قواعد الاختبار."\n- يجب **تحديد** مربع الاختيار هذا قبل أن يصبح زر البدء مفعلاً\n- إذا لم يتم تحديده، يظل زر البدء رماديًا\n\n**زر بدء الاختبار:**\nزر **"بدء الاختبار"** الأزرق الكبير يكون مفعلاً عند استيفاء جميع الشروط:\n- ✓ تم تحديد مربع اختيار الموافقة\n- ✓ نجحت جميع فحوصات جاهزية النظام (ملء الشاشة، الكاميرا إذا لزم الأمر)\n- ✓ تم إدخال رمز الوصول بشكل صحيح (إذا كان مطلوبًا)\n- ✓ الاختبار مؤهل للبدء (ضمن الجدول، محاولات متبقية)\n\n**ما يحدث عند النقر على بدء الاختبار:**\n1. يتحقق النظام من أهليتك مرة أخيرة\n2. يحفظ تفضيل لغة الاختبار\n3. ينشئ محاولة اختبار جديدة (أو يستأنف محاولة موجودة)\n4. يسجل معلومات جهازك (المتصفح، نظام التشغيل، دقة الشاشة)\n5. يطلب وضع ملء الشاشة (يدخل المتصفح في ملء الشاشة)\n6. ينقلك إلى صفحة **أداء الاختبار**',
          imagePlaceholder: "/tutorials/candidate-portal-start-exam.png",
        },
      ],
    },

    // ── Section 5: Inside the Exam ───────────────────────
    {
      id: "exam-taking",
      titleEn: "Inside the Exam — Taking the Exam",
      titleAr: "داخل الاختبار — أداء الاختبار",
      descriptionEn:
        "The full exam-taking interface where candidates answer questions, navigate sections, use tools, and manage their time. This is the core exam experience displayed in **fullscreen mode**.",
      descriptionAr:
        "واجهة أداء الاختبار الكاملة حيث يجيب المرشحون على الأسئلة، يتنقلون بين الأقسام، يستخدمون الأدوات، ويديرون وقتهم. هذه هي تجربة الاختبار الأساسية المعروضة في **وضع ملء الشاشة**.",
      steps: [
        {
          id: "exam-layout",
          titleEn: "Exam Interface Layout",
          titleAr: "تخطيط واجهة الاختبار",
          descriptionEn:
            "The exam page has a specific layout designed for focused exam-taking:\n\n**Top Bar:**\n- ⏱️ **Exam Timer** — shows total remaining time (MM:SS format)\n- 📊 **Progress indicator** — how many questions answered vs total\n- 🧮 **Calculator button** — opens/closes the calculator tool (if allowed)\n- 📊 **Spreadsheet button** — opens/closes the spreadsheet tool (if allowed)\n- 📋 **Summary button** — opens/closes the question summary panel\n\n**Left Sidebar (Section Navigation):**\n- Lists all exam sections as navigation items\n- Current section is highlighted\n- Each section shows its own timer (if section-level timing is enabled)\n- Sections that are locked (completed, timed out) show a lock icon\n\n**Main Content Area:**\n- Displays the current question with its content and answer options\n- Full-width layout for maximum readability\n\n**Bottom Navigation Bar:**\n- ◀️ **Previous** button — go to previous question (if allowed)\n- ▶️ **Next** button — go to next question\n- 🚩 **Flag** button — flag/unflag the current question for review\n- 📤 **Submit Exam** button — finalize and submit the attempt",
          descriptionAr:
            "صفحة الاختبار لها تخطيط محدد مصمم لأداء الاختبار المركز:\n\n**الشريط العلوي:**\n- ⏱️ **مؤقت الاختبار** — يعرض الوقت المتبقي الإجمالي (صيغة دقائق:ثواني)\n- 📊 **مؤشر التقدم** — كم سؤال تمت الإجابة عليه من الإجمالي\n- 🧮 **زر الآلة الحاسبة** — يفتح/يغلق أداة الآلة الحاسبة (إذا مسموح)\n- 📊 **زر جدول البيانات** — يفتح/يغلق أداة جدول البيانات (إذا مسموح)\n- 📋 **زر الملخص** — يفتح/يغلق لوحة ملخص الأسئلة\n\n**الشريط الجانبي الأيسر (تنقل الأقسام):**\n- يسرد جميع أقسام الاختبار كعناصر تنقل\n- القسم الحالي مميز\n- كل قسم يعرض مؤقته الخاص (إذا كان التوقيت على مستوى القسم مفعلاً)\n- الأقسام المقفلة (مكتملة، انتهى وقتها) تعرض أيقونة قفل\n\n**منطقة المحتوى الرئيسية:**\n- تعرض السؤال الحالي مع محتواه وخيارات الإجابة\n- تخطيط بالعرض الكامل لأقصى قدرة على القراءة\n\n**شريط التنقل السفلي:**\n- ◀️ زر **السابق** — الذهاب إلى السؤال السابق (إذا مسموح)\n- ▶️ زر **التالي** — الذهاب إلى السؤال التالي\n- 🚩 زر **تعليم** — تعليم/إلغاء تعليم السؤال الحالي للمراجعة\n- 📤 زر **تقديم الاختبار** — إنهاء وتقديم المحاولة",
          imagePlaceholder: "/tutorials/candidate-portal-exam-layout.png",
        },
        {
          id: "exam-question-types",
          titleEn: "Question Types & Answering",
          titleAr: "أنواع الأسئلة والإجابة",
          descriptionEn:
            'The exam supports multiple question types. Each type has its own answer interface:\n\n**1. MCQ — Single Choice:**\n- Radio button options displayed as cards\n- Click on an option card to select it\n- The selected option is highlighted with a blue border and background\n- Hover effects on non-selected options\n- If an option has an image, it appears with a zoom-on-click feature\n\n**2. MCQ — Multiple Choice:**\n- Checkbox options displayed as cards\n- Click to select/deselect multiple options\n- Each selected option shows a checkbox mark\n- Visual feedback for all selected items\n- Options with images support zoom\n\n**3. True / False:**\n- Two radio button options: True and False\n- Clear visual separation between the two choices\n\n**4. Subjective / Short Answer:**\n- Textarea input field for text answers\n- Character limit display (if the exam enforces one)\n- Supports both rich text and plain text depending on exam settings\n- For numeric questions, a number input variant may appear\n\n**Question Card Features:**\n- **Question text** — localized (EN/AR based on selected language)\n- **Question image** — if present, shown with click-to-zoom modal\n- **Question number** — displayed if "Show Question Numbers" is enabled in exam settings\n- **Flag icon** — click to flag/unflag the question for later review',
          descriptionAr:
            'يدعم الاختبار أنواع أسئلة متعددة. كل نوع له واجهة إجابة خاصة:\n\n**1. اختيار من متعدد — اختيار واحد:**\n- خيارات أزرار الراديو معروضة كبطاقات\n- انقر على بطاقة خيار لتحديدها\n- الخيار المحدد مميز بحد أزرق وخلفية\n- تأثيرات التمرير على الخيارات غير المحددة\n- إذا كان للخيار صورة، تظهر مع ميزة التكبير عند النقر\n\n**2. اختيار من متعدد — اختيارات متعددة:**\n- خيارات مربعات الاختيار معروضة كبطاقات\n- انقر لتحديد/إلغاء تحديد خيارات متعددة\n- كل خيار محدد يعرض علامة اختيار\n- ملاحظات بصرية لجميع العناصر المحددة\n- الخيارات بصور تدعم التكبير\n\n**3. صح / خطأ:**\n- خيارا أزرار راديو: صح وخطأ\n- فصل بصري واضح بين الخيارين\n\n**4. إجابة ذاتية / قصيرة:**\n- حقل إدخال نصي للإجابات النصية\n- عرض حد الأحرف (إذا كان الاختبار يفرض واحدًا)\n- يدعم النص الغني والنص العادي حسب إعدادات الاختبار\n- للأسئلة الرقمية، قد يظهر متغير إدخال أرقام\n\n**ميزات بطاقة السؤال:**\n- **نص السؤال** — مترجم (EN/AR بناءً على اللغة المختارة)\n- **صورة السؤال** — إذا وجدت، تُعرض مع نافذة تكبير عند النقر\n- **رقم السؤال** — يُعرض إذا كان "إظهار أرقام الأسئلة" مفعلاً في إعدادات الاختبار\n- **أيقونة العلم** — انقر لتعليم/إلغاء تعليم السؤال للمراجعة لاحقًا',
          imagePlaceholder: "/tutorials/candidate-portal-question-types.png",
        },
        {
          id: "exam-sections-timers",
          titleEn: "Sections & Timers",
          titleAr: "الأقسام والمؤقتات",
          descriptionEn:
            'Exams may be organized into **sections**. Each section has its own rules and optional timer:\n\n**Two Timer Types:**\n\n**1. Exam-Wide Timer (always present):**\n- Counts down from the total exam duration (e.g., 60 minutes)\n- Updates every 1 second in the top bar\n- Color changes as time decreases:\n  - **Green** → plenty of time remaining\n  - **Yellow** → warning zone (less than ~5 minutes)\n  - **Red** → critical (very little time left)\n- When it reaches zero → **auto-submits** the entire exam\n\n**2. Section Timer (if sections have individual time limits):**\n- Each section has its own countdown timer\n- The section timer **only starts when you enter** (activate) that section\n- When a section timer reaches zero:\n  - ✓ Automatically **moves you to the next section**\n  - ✗ You **cannot go back** to the previous section\n  - A warning toast appears before the auto-advance\n\n**Section Navigation Rules:**\n\n**Lock Previous Sections (if enabled):**\n- Once you leave a section, you **cannot go back**\n- Only forward navigation is allowed between sections\n- The completed/timed-out section shows a **lock icon** in the sidebar\n\n**Moving to Next Section:**\n- When you click "Next" on the last question of a section, a **confirmation dialog** appears\n- "Are you sure you want to move to the next section? You will not be able to return to this section."\n- You must **confirm** before advancing\n- This prevents accidental section changes\n\n**Prevent Back Navigation (if enabled):**\n- No backward navigation even within a section\n- The "Previous" button is hidden or disabled\n- Questions can only be answered in sequence',
          descriptionAr:
            'قد تكون الاختبارات منظمة في **أقسام**. كل قسم له قواعده الخاصة ومؤقت اختياري:\n\n**نوعان من المؤقتات:**\n\n**1. مؤقت الاختبار الكامل (موجود دائمًا):**\n- يعد تنازليًا من مدة الاختبار الإجمالية (مثلاً 60 دقيقة)\n- يتحدث كل ثانية في الشريط العلوي\n- يتغير اللون مع نقصان الوقت:\n  - **أخضر** → وقت كافٍ متبقي\n  - **أصفر** → منطقة تحذير (أقل من ~5 دقائق)\n  - **أحمر** → حرج (وقت قليل جدًا متبقي)\n- عند الوصول إلى الصفر → **تقديم تلقائي** للاختبار بالكامل\n\n**2. مؤقت القسم (إذا كانت للأقسام حدود زمنية فردية):**\n- كل قسم له مؤقته التنازلي الخاص\n- مؤقت القسم **يبدأ فقط عند دخولك** (تفعيل) ذلك القسم\n- عندما يصل مؤقت القسم إلى الصفر:\n  - ✓ **ينقلك تلقائيًا إلى القسم التالي**\n  - ✗ **لا يمكنك العودة** إلى القسم السابق\n  - يظهر إشعار تحذيري قبل الانتقال التلقائي\n\n**قواعد تنقل الأقسام:**\n\n**قفل الأقسام السابقة (إذا مفعل):**\n- بمجرد مغادرة القسم، **لا يمكنك العودة**\n- التنقل للأمام فقط مسموح بين الأقسام\n- القسم المكتمل/المنتهي وقته يعرض **أيقونة قفل** في الشريط الجانبي\n\n**الانتقال إلى القسم التالي:**\n- عند النقر على "التالي" في آخر سؤال من القسم، يظهر **مربع حوار تأكيد**\n- "هل أنت متأكد أنك تريد الانتقال إلى القسم التالي؟ لن تتمكن من العودة إلى هذا القسم."\n- يجب **التأكيد** قبل التقدم\n- هذا يمنع تغييرات الأقسام العرضية\n\n**منع التنقل للخلف (إذا مفعل):**\n- لا تنقل للخلف حتى داخل القسم\n- زر "السابق" مخفي أو معطل\n- يمكن الإجابة على الأسئلة بالتسلسل فقط',
          tipEn:
            "Pay attention to section timers! When a section timer runs out, you are automatically moved forward and cannot return. Answer all questions in the current section before time expires.",
          tipAr:
            "انتبه لمؤقتات الأقسام! عند نفاد مؤقت القسم، يتم نقلك للأمام تلقائيًا ولا يمكنك العودة. أجب على جميع الأسئلة في القسم الحالي قبل انتهاء الوقت.",
          imagePlaceholder: "/tutorials/candidate-portal-sections-timers.png",
        },
        {
          id: "exam-summary-panel",
          titleEn: "Summary Panel",
          titleAr: "لوحة الملخص",
          descriptionEn:
            'Click the **"Summary"** button in the top bar to open the summary panel. This gives you an overview of all questions in the exam:\n\n**What the Summary Shows:**\n- All questions listed by number (grouped by section if applicable)\n- Each question shows its status:\n  - ✅ **Answered** — the question has a saved answer (green indicator)\n  - ⭕ **Unanswered** — no answer provided yet (gray/empty indicator)\n  - 🚩 **Flagged** — question was flagged for review (orange flag icon)\n\n**Quick Navigation:**\n- Click on any question number in the summary to **jump directly** to that question\n- This is useful for reviewing flagged questions before submitting\n- Shows the total count: "Answered: X / Y" and "Flagged: Z"\n\n**Use the Summary Before Submitting:**\nBefore clicking Submit, open the summary to check:\n- Are there any unanswered questions you missed?\n- Did you flag questions you wanted to review?\n- Are all sections completed?',
          descriptionAr:
            'انقر على زر **"الملخص"** في الشريط العلوي لفتح لوحة الملخص. يمنحك هذا نظرة عامة على جميع الأسئلة في الاختبار:\n\n**ما يعرضه الملخص:**\n- جميع الأسئلة مدرجة بالرقم (مجمعة بالقسم إذا كان ذلك ممكنًا)\n- كل سؤال يعرض حالته:\n  - ✅ **تمت الإجابة** — السؤال له إجابة محفوظة (مؤشر أخضر)\n  - ⭕ **بدون إجابة** — لم يتم تقديم إجابة بعد (مؤشر رمادي/فارغ)\n  - 🚩 **معلّم** — تم تعليم السؤال للمراجعة (أيقونة علم برتقالية)\n\n**التنقل السريع:**\n- انقر على أي رقم سؤال في الملخص **للقفز مباشرة** إلى ذلك السؤال\n- هذا مفيد لمراجعة الأسئلة المعلّمة قبل التقديم\n- يعرض العدد الإجمالي: "تمت الإجابة: X / Y" و "معلّم: Z"\n\n**استخدم الملخص قبل التقديم:**\nقبل النقر على تقديم، افتح الملخص للتحقق:\n- هل هناك أسئلة بدون إجابة فاتتك؟\n- هل علّمت أسئلة أردت مراجعتها؟\n- هل اكتملت جميع الأقسام؟',
          imagePlaceholder: "/tutorials/candidate-portal-summary.png",
        },
        {
          id: "exam-tools",
          titleEn: "Tools: Calculator & Spreadsheet",
          titleAr: "الأدوات: الآلة الحاسبة وجدول البيانات",
          descriptionEn:
            "The exam may provide built-in tools depending on the exam settings:\n\n**🧮 Calculator:**\n- Click the **Calculator button** in the top bar to toggle it on/off\n- Opens a **scientific calculator** overlay with standard operations (+, −, ×, ÷, etc.)\n- Only available in sections/questions where the exam creator has **enabled** the calculator\n- If you navigate to a section that does not allow calculator, it automatically hides\n- Use it for computations during math, science, or technical exams\n\n**📊 Spreadsheet:**\n- Click the **Spreadsheet button** in the top bar to toggle it on/off\n- Opens an **Excel-like grid interface** as an overlay\n- Supports basic spreadsheet operations for data calculations\n- Only available in sections/questions where the exam creator has **enabled** the spreadsheet\n- Dynamically loaded to optimize page performance\n- Useful for data analysis, financial calculations, or statistical problems\n\n**Tool Visibility Rules:**\n- ✓ Tools appear in the top bar **only if the exam has at least one section** that allows them\n- ✓ Tools auto-hide when navigating to sections that don't allow them\n- ✗ If the exam has no calculator/spreadsheet permissions anywhere, the buttons don't appear at all",
          descriptionAr:
            "قد يوفر الاختبار أدوات مدمجة حسب إعدادات الاختبار:\n\n**🧮 الآلة الحاسبة:**\n- انقر على **زر الآلة الحاسبة** في الشريط العلوي لتشغيلها/إيقافها\n- تفتح **آلة حاسبة علمية** كتراكب مع عمليات قياسية (+، −، ×، ÷، إلخ)\n- متاحة فقط في الأقسام/الأسئلة التي **فعّل** فيها منشئ الاختبار الآلة الحاسبة\n- إذا انتقلت إلى قسم لا يسمح بالآلة الحاسبة، تختفي تلقائيًا\n- استخدمها للحسابات أثناء اختبارات الرياضيات أو العلوم أو التقنية\n\n**📊 جدول البيانات:**\n- انقر على **زر جدول البيانات** في الشريط العلوي لتشغيله/إيقافه\n- يفتح **واجهة شبكة شبيهة بـ Excel** كتراكب\n- يدعم عمليات جدول البيانات الأساسية لحسابات البيانات\n- متاح فقط في الأقسام/الأسئلة التي **فعّل** فيها منشئ الاختبار جدول البيانات\n- يتم تحميله ديناميكيًا لتحسين أداء الصفحة\n- مفيد لتحليل البيانات والحسابات المالية أو المشاكل الإحصائية\n\n**قواعد ظهور الأدوات:**\n- ✓ تظهر الأدوات في الشريط العلوي **فقط إذا كان للاختبار قسم واحد على الأقل** يسمح بها\n- ✓ تختفي الأدوات تلقائيًا عند التنقل إلى أقسام لا تسمح بها\n- ✗ إذا لم يكن للاختبار أذونات آلة حاسبة/جدول بيانات في أي مكان، لا تظهر الأزرار على الإطلاق",
          imagePlaceholder: "/tutorials/candidate-portal-tools.png",
        },
        {
          id: "exam-auto-save",
          titleEn: "Answer Auto-Saving",
          titleAr: "الحفظ التلقائي للإجابات",
          descriptionEn:
            'Your answers are **automatically saved** as you take the exam:\n\n**How Auto-Save Works:**\n- Every time you select an answer or type in a text field, the answer is **debounced and saved** to the server after a short delay\n- A status indicator shows the save state:\n  - 💾 **"Saving..."** — answer is being sent to the server\n  - ✅ **"Saved"** — answer successfully saved\n  - ❌ **"Error"** — save failed (will retry)\n- On section change, a **manual save** is triggered for all pending answers\n\n**What This Means:**\n- ✓ If your internet drops briefly, answers already saved are safe on the server\n- ✓ If your browser crashes, you can resume and your previously saved answers will be there\n- ✓ You don\'t need to click a "Save" button — it happens automatically\n- ✗ If you lose connection for a long time, unsaved answers are kept in the browser cache temporarily',
          descriptionAr:
            'يتم **حفظ إجاباتك تلقائيًا** أثناء أدائك للاختبار:\n\n**كيف يعمل الحفظ التلقائي:**\n- في كل مرة تختار إجابة أو تكتب في حقل نصي، يتم **حفظ الإجابة بتأخير** إلى الخادم\n- يعرض مؤشر الحالة حالة الحفظ:\n  - 💾 **"جاري الحفظ..."** — الإجابة يتم إرسالها إلى الخادم\n  - ✅ **"تم الحفظ"** — تم حفظ الإجابة بنجاح\n  - ❌ **"خطأ"** — فشل الحفظ (ستتم إعادة المحاولة)\n- عند تغيير القسم، يتم تشغيل **حفظ يدوي** لجميع الإجابات المعلقة\n\n**ما يعنيه هذا:**\n- ✓ إذا انقطع إنترنتك لفترة وجيزة، الإجابات المحفوظة مسبقًا آمنة على الخادم\n- ✓ إذا تعطل متصفحك، يمكنك الاستئناف وستكون إجاباتك المحفوظة سابقًا موجودة\n- ✓ لا تحتاج للنقر على زر "حفظ" — يحدث تلقائيًا\n- ✗ إذا فقدت الاتصال لفترة طويلة، يتم الاحتفاظ بالإجابات غير المحفوظة في ذاكرة التخزين المؤقت للمتصفح مؤقتًا',
          imagePlaceholder: "/tutorials/candidate-portal-auto-save.png",
        },
      ],
    },

    // ── Section 6: Security, Warnings & Proctoring ──────
    {
      id: "exam-security",
      titleEn: "Security, Warnings & Proctoring",
      titleAr: "الأمان والتحذيرات والمراقبة",
      descriptionEn:
        "During the exam, multiple security features monitor candidate behavior. Violations are tracked, warnings are issued, and repeated violations can lead to automatic termination.",
      descriptionAr:
        "أثناء الاختبار، تراقب ميزات أمان متعددة سلوك المرشح. يتم تتبع المخالفات، إصدار التحذيرات، والمخالفات المتكررة يمكن أن تؤدي إلى الإيقاف التلقائي.",
      steps: [
        {
          id: "security-violations",
          titleEn: "Detected Violations",
          titleAr: "المخالفات المكتشفة",
          descriptionEn:
            "The system detects and logs the following violations during the exam:\n\n| Violation | How It's Detected | What Happens |\n| Tab Switching | Candidate exits fullscreen or switches to another tab/window | Warning toast + violation count incremented |\n| Fullscreen Exit | Candidate presses Escape or exits fullscreen mode | Warning toast + logged as security event |\n| Webcam Blocked | Camera feed is lost or denied during proctored exam | Warning toast + event logged |\n| Copy Attempt | Candidate tries to copy text (Ctrl+C or right-click copy) | Action blocked + warning beep + toast notification |\n| Paste Attempt | Candidate tries to paste text (Ctrl+V or right-click paste) | Action blocked + warning beep + toast notification |\n| Snapshot Failed | Proctor camera snapshot upload failed | Event logged (no user-facing notification) |\n\n**Violation Counter:**\n- Each countable violation increments a counter\n- The system tracks how many violations have occurred\n- This counter is compared against the exam's **maxViolationWarnings** threshold",
          descriptionAr:
            "يكتشف النظام ويسجل المخالفات التالية أثناء الاختبار:\n\n| المخالفة | كيف يتم اكتشافها | ماذا يحدث |\n| تبديل التبويب | المرشح يخرج من ملء الشاشة أو يتحول لتبويب/نافذة أخرى | إشعار تحذيري + زيادة عداد المخالفات |\n| الخروج من ملء الشاشة | المرشح يضغط Escape أو يخرج من وضع ملء الشاشة | إشعار تحذيري + تسجيل كحدث أمني |\n| حجب الكاميرا | فقدان تغذية الكاميرا أو رفضها أثناء الاختبار المراقب | إشعار تحذيري + تسجيل الحدث |\n| محاولة نسخ | المرشح يحاول نسخ النص (Ctrl+C أو نقر يمين نسخ) | حظر الإجراء + صوت تحذيري + إشعار منبثق |\n| محاولة لصق | المرشح يحاول لصق النص (Ctrl+V أو نقر يمين لصق) | حظر الإجراء + صوت تحذيري + إشعار منبثق |\n| فشل اللقطة | فشل تحميل لقطة كاميرا المراقب | تسجيل الحدث (بدون إشعار مواجه للمستخدم) |\n\n**عداد المخالفات:**\n- كل مخالفة قابلة للعد تزيد العداد\n- يتتبع النظام كم مخالفة حدثت\n- يُقارن هذا العداد بحد **أقصى تحذيرات المخالفات** للاختبار",
          imagePlaceholder: "/tutorials/candidate-portal-violations.png",
        },
        {
          id: "security-warnings",
          titleEn: "Warning System",
          titleAr: "نظام التحذيرات",
          descriptionEn:
            'When violations are detected, the candidate receives warnings through multiple channels:\n\n**Toast Notifications:**\n- Appear at the top of the screen\n- Show the violation type and a warning message\n- Auto-dismiss after a few seconds\n- Color-coded by severity\n\n**Warning Beep Sound:**\n- An audio alert plays using the browser\'s **AudioContext API**\n- Triggers on copy/paste attempts and security violations\n- Ensures candidates notice the warning even if not looking at the screen\n\n**Proctor Warning Dialog (Live Proctoring):**\n- If a live proctor is monitoring the exam, they can send **real-time warnings** via SignalR/WebRTC\n- A modal dialog appears on the candidate\'s screen with the proctor\'s warning message\n- Example: "You have violated exam rules: Looking away from screen"\n- The dialog must be dismissed before continuing\n- **"Last Warning"** variant uses more urgent styling (red border, larger text) to indicate this is the final warning before termination\n\n**Auto-Termination:**\n- If the exam has **maxViolationWarnings** set (e.g., 10 violations)\n- After reaching the maximum violation count, the exam is **automatically submitted**\n- The candidate sees an auto-termination message\n- The exam status changes to **"Terminated"**\n- The candidate cannot resume — it\'s treated as a final submission',
          descriptionAr:
            'عند اكتشاف المخالفات، يتلقى المرشح تحذيرات عبر قنوات متعددة:\n\n**إشعارات منبثقة:**\n- تظهر في أعلى الشاشة\n- تعرض نوع المخالفة ورسالة تحذيرية\n- تختفي تلقائيًا بعد بضع ثوان\n- ملونة حسب الشدة\n\n**صوت تحذيري:**\n- يتم تشغيل تنبيه صوتي باستخدام واجهة **AudioContext** للمتصفح\n- يُشغل عند محاولات النسخ/اللصق والمخالفات الأمنية\n- يضمن أن المرشحين يلاحظون التحذير حتى لو لم ينظروا إلى الشاشة\n\n**مربع حوار تحذير المراقب (المراقبة الحية):**\n- إذا كان مراقب حي يراقب الاختبار، يمكنه إرسال **تحذيرات فورية** عبر SignalR/WebRTC\n- يظهر مربع حوار على شاشة المرشح مع رسالة تحذير المراقب\n- مثال: "لقد انتهكت قواعد الاختبار: النظر بعيدًا عن الشاشة"\n- يجب إغلاق مربع الحوار قبل المتابعة\n- متغير **"التحذير الأخير"** يستخدم تنسيقًا أكثر إلحاحًا (حد أحمر، نص أكبر) للإشارة إلى أن هذا آخر تحذير قبل الإيقاف\n\n**الإيقاف التلقائي:**\n- إذا كان للاختبار **حد أقصى لتحذيرات المخالفات** محدد (مثلاً 10 مخالفات)\n- بعد الوصول إلى الحد الأقصى لعدد المخالفات، يتم **تقديم الاختبار تلقائيًا**\n- يرى المرشح رسالة إيقاف تلقائي\n- تتغير حالة الاختبار إلى **"موقوف"**\n- لا يمكن للمرشح الاستئناف — يُعامل كتقديم نهائي',
          imagePlaceholder: "/tutorials/candidate-portal-warnings.png",
        },
        {
          id: "security-proctoring",
          titleEn: "Webcam Proctoring & Smart Monitoring",
          titleAr: "مراقبة الكاميرا والمراقبة الذكية",
          descriptionEn:
            "If the exam requires proctoring, the candidate's webcam is active throughout:\n\n**Webcam Snapshots:**\n- The system takes automatic **screenshots every 60 seconds** from the webcam\n- Each snapshot is uploaded to the backend with a timestamp\n- Snapshots are stored for proctor review after the exam\n- The webcam icon in the interface shows the stream status:\n  - 🟢 **Active** — camera is streaming normally\n  - 🔴 **Denied** — camera access was denied\n  - 🟡 **Error** — camera encountered an issue\n\n**Live Video Streaming (if enabled):**\n- Real-time video is streamed to the backend using **WebRTC** technology\n- Live proctors can watch the candidate in real-time\n- Connection failures are handled gracefully with automatic reconnection\n- Proctors can send instant warnings via **SignalR** channel\n\n**Smart Monitoring (AI Face Detection):**\n- An AI model runs locally on the candidate's device\n- Detects **face presence** — verifies the candidate is looking at the screen\n- Detects **multiple faces** — flags potential cheating (someone else in frame)\n- Can trigger automatic warnings if conditions are violated\n- Edge-based inference (runs in the browser, not sent to server for privacy)\n\n**Important for Candidates:**\n- ✓ Keep your face visible and centered in the camera at all times\n- ✓ Ensure good lighting for clear camera capture\n- ✗ Do not cover, block, or disable the webcam during the exam\n- ✗ Do not have other people visible in the camera frame",
          descriptionAr:
            "إذا كان الاختبار يتطلب مراقبة، تكون كاميرا المرشح نشطة طوال الوقت:\n\n**لقطات الكاميرا:**\n- يأخذ النظام **لقطات شاشة تلقائية كل 60 ثانية** من الكاميرا\n- يتم تحميل كل لقطة إلى الخادم مع طابع زمني\n- يتم تخزين اللقطات لمراجعة المراقب بعد الاختبار\n- تعرض أيقونة الكاميرا في الواجهة حالة البث:\n  - 🟢 **نشط** — الكاميرا تبث بشكل طبيعي\n  - 🔴 **مرفوض** — تم رفض الوصول إلى الكاميرا\n  - 🟡 **خطأ** — الكاميرا واجهت مشكلة\n\n**بث الفيديو الحي (إذا مفعل):**\n- يتم بث فيديو فوري إلى الخادم باستخدام تقنية **WebRTC**\n- يمكن للمراقبين الح يين مشاهدة المرشح في الوقت الفعلي\n- يتم التعامل مع فشل الاتصال بأناقة مع إعادة الاتصال التلقائي\n- يمكن للمراقبين إرسال تحذيرات فورية عبر قناة **SignalR**\n\n**المراقبة الذكية (كشف الوجه بالذكاء الاصطناعي):**\n- يعمل نموذج ذكاء اصطناعي محليًا على جهاز المرشح\n- يكتشف **وجود الوجه** — يتحقق من أن المرشح ينظر إلى الشاشة\n- يكتشف **وجوه متعددة** — يضع علامة على الغش المحتمل (شخص آخر في الإطار)\n- يمكن أن يطلق تحذيرات تلقائية إذا تم انتهاك الشروط\n- استدلال على الحافة (يعمل في المتصفح، لا يُرسل إلى الخادم للخصوصية)\n\n**مهم للمرشحين:**\n- ✓ حافظ على وجهك مرئيًا ومركزًا في الكاميرا في جميع الأوقات\n- ✓ تأكد من إضاءة جيدة لالتقاط كاميرا واضح\n- ✗ لا تغطِ أو تحجب أو تعطل الكاميرا أثناء الاختبار\n- ✗ لا يجب أن يكون أشخاص آخرون مرئيين في إطار الكاميرا",
          imagePlaceholder: "/tutorials/candidate-portal-proctoring.png",
        },
        {
          id: "security-fullscreen",
          titleEn: "Fullscreen Enforcement & Copy/Paste Prevention",
          titleAr: "فرض ملء الشاشة ومنع النسخ/اللصق",
          descriptionEn:
            "**Fullscreen Mode:**\n- The exam runs in **mandatory fullscreen mode**\n- Fullscreen is requested automatically when the exam starts\n- If you exit fullscreen (press Escape or Alt+Tab):\n  - A **violation is logged** (Tab Switched / Fullscreen Exited)\n  - The violation counter increments\n  - A warning toast notification appears\n  - The system requests fullscreen again\n- Cross-browser support: works on Chrome, Firefox, Safari, and Edge\n\n**Copy/Paste Prevention:**\n- **Copy (Ctrl+C):** blocked with `preventDefault()` — nothing is copied to clipboard\n- **Paste (Ctrl+V):** blocked with `preventDefault()` — nothing is pasted\n- **Right-click context menu:** may be disabled on exam content\n- Each attempt triggers:\n  - A **warning beep sound** via AudioContext\n  - A **toast notification** explaining the action was blocked\n  - An event logged to the server\n\n**Device Tracking:**\nWhen the exam starts, the system records:\n- **Browser name and version** (Chrome, Edge, Firefox, Safari)\n- **Operating System** (Windows, macOS, Linux, iOS, Android)\n- **Screen Resolution** (e.g., 1920×1080)\n- This information is stored with the exam attempt for audit purposes",
          descriptionAr:
            "**وضع ملء الشاشة:**\n- يعمل الاختبار في **وضع ملء الشاشة الإلزامي**\n- يتم طلب ملء الشاشة تلقائيًا عند بدء الاختبار\n- إذا خرجت من ملء الشاشة (ضغطت Escape أو Alt+Tab):\n  - يتم **تسجيل مخالفة** (تبديل تبويب / الخروج من ملء الشاشة)\n  - يزداد عداد المخالفات\n  - يظهر إشعار تحذيري منبثق\n  - يطلب النظام ملء الشاشة مرة أخرى\n- دعم عبر المتصفحات: يعمل على Chrome و Firefox و Safari و Edge\n\n**منع النسخ/اللصق:**\n- **النسخ (Ctrl+C):** محظور بـ `preventDefault()` — لا يتم نسخ شيء إلى الحافظة\n- **اللصق (Ctrl+V):** محظور بـ `preventDefault()` — لا يتم لصق شيء\n- **قائمة السياق (النقر اليمين):** قد تكون معطلة على محتوى الاختبار\n- كل محاولة تطلق:\n  - **صوت تحذيري** عبر AudioContext\n  - **إشعار منبثق** يوضح أن الإجراء تم حظره\n  - تسجيل حدث إلى الخادم\n\n**تتبع الجهاز:**\nعند بدء الاختبار، يسجل النظام:\n- **اسم وإصدار المتصفح** (Chrome، Edge، Firefox، Safari)\n- **نظام التشغيل** (Windows، macOS، Linux، iOS، Android)\n- **دقة الشاشة** (مثلاً 1920×1080)\n- يتم تخزين هذه المعلومات مع محاولة الاختبار لأغراض التدقيق",
          imagePlaceholder: "/tutorials/candidate-portal-fullscreen.png",
        },
      ],
    },

    // ── Section 7: Submit & Results ──────────────────────
    {
      id: "submit-results",
      titleEn: "Submitting the Exam & Viewing Results",
      titleAr: "تقديم الاختبار وعرض النتائج",
      descriptionEn:
        "How to submit an exam, what happens after submission, auto-submit scenarios, and how to view results and download certificates.",
      descriptionAr:
        "كيفية تقديم الاختبار، ماذا يحدث بعد التقديم، سيناريوهات التقديم التلقائي، وكيفية عرض النتائج وتنزيل الشهادات.",
      steps: [
        {
          id: "submit-manual",
          titleEn: "Manual Submission",
          titleAr: "التقديم اليدوي",
          descriptionEn:
            'When you\'re ready to submit your exam:\n\n**Step 1: Click "Submit Exam"**\n- The Submit Exam button is at the bottom navigation bar\n- Clicking it opens a **confirmation dialog**\n\n**Step 2: Confirmation Dialog**\n- Title: "Are you sure you want to submit?"\n- Warning text explains that submission is **final** — you cannot go back or change answers\n- Two buttons:\n  - **"Cancel"** — returns to the exam\n  - **"Submit"** — confirms and submits\n\n**Step 3: Submission Process**\n- A loading spinner appears while the attempt is being submitted\n- All remaining unsaved answers are sent to the server\n- The attempt status changes to "Submitted"\n- Final events are logged (submission timestamp, total violations)\n\n**Step 4: Redirect to Results**\n- After successful submission, you are redirected to the **Results page**\n- URL: `/results/{attemptId}?submitted=true`\n- Webcam stops recording\n- Timers stop\n- Fullscreen mode is no longer enforced\n\n**Before Submitting — Use the Summary!**\nRecommended workflow:\n1. Open the **Summary panel** to check for unanswered questions\n2. Review any **flagged questions** you wanted to revisit\n3. Verify all sections are complete\n4. Then click Submit Exam',
          descriptionAr:
            'عندما تكون مستعدًا لتقديم اختبارك:\n\n**الخطوة 1: انقر على "تقديم الاختبار"**\n- زر تقديم الاختبار في شريط التنقل السفلي\n- النقر عليه يفتح **مربع حوار تأكيد**\n\n**الخطوة 2: مربع حوار التأكيد**\n- العنوان: "هل أنت متأكد أنك تريد التقديم؟"\n- نص التحذير يوضح أن التقديم **نهائي** — لا يمكنك العودة أو تغيير الإجابات\n- زران:\n  - **"إلغاء"** — يعود إلى الاختبار\n  - **"تقديم"** — يؤكد ويقدم\n\n**الخطوة 3: عملية التقديم**\n- يظهر مؤشر تحميل أثناء تقديم المحاولة\n- يتم إرسال جميع الإجابات غير المحفوظة المتبقية إلى الخادم\n- تتغير حالة المحاولة إلى "مُقدم"\n- يتم تسجيل الأحداث النهائية (طابع وقت التقديم، إجمالي المخالفات)\n\n**الخطوة 4: التوجيه إلى النتائج**\n- بعد التقديم الناجح، يتم توجيهك إلى **صفحة النتائج**\n- الرابط: `/results/{attemptId}?submitted=true`\n- تتوقف الكاميرا عن التسجيل\n- تتوقف المؤقتات\n- لم يعد وضع ملء الشاشة مفروضًا\n\n**قبل التقديم — استخدم الملخص!**\nسير العمل الموصى به:\n1. افتح **لوحة الملخص** للتحقق من الأسئلة بدون إجابة\n2. راجع أي **أسئلة معلّمة** أردت إعادة زيارتها\n3. تحقق من اكتمال جميع الأقسام\n4. ثم انقر على تقديم الاختبار',
          imagePlaceholder: "/tutorials/candidate-portal-submit.png",
        },
        {
          id: "submit-auto",
          titleEn: "Automatic Submission Scenarios",
          titleAr: "سيناريوهات التقديم التلقائي",
          descriptionEn:
            'The exam may be submitted automatically in several scenarios:\n\n**1. Time Expired (Exam Timer Reaches Zero):**\n- When the exam-wide timer counts down to zero\n- All current answers are saved\n- The exam is automatically submitted\n- An "Exam time has expired" message appears\n- Candidate is redirected to results page\n\n**2. Auto-Termination (Violation Limit Reached):**\n- If the exam has **maxViolationWarnings** configured\n- After the candidate exceeds the maximum number of allowed violations\n- The exam is force-submitted with status **"Terminated"**\n- A termination message appears explaining why\n- This is treated as a final submission — no resume possible\n\n**3. Proctor Force-Submit:**\n- A live proctor can **force-submit** the exam from the Proctor Center\n- This immediately submits the attempt regardless of remaining time\n- The candidate sees a notification that their exam was force-submitted\n- Status changes to "ForceSubmitted"\n\n**In All Auto-Submit Scenarios:**\n- ✓ All saved answers are preserved\n- ✓ The attempt is properly closed on the server\n- ✓ Webcam and timers stop\n- ✓ Candidate is redirected to the results page',
          descriptionAr:
            'قد يتم تقديم الاختبار تلقائيًا في عدة سيناريوهات:\n\n**1. انتهاء الوقت (مؤقت الاختبار يصل إلى الصفر):**\n- عندما يعد مؤقت الاختبار الكامل تنازليًا إلى الصفر\n- يتم حفظ جميع الإجابات الحالية\n- يتم تقديم الاختبار تلقائيًا\n- تظهر رسالة "انتهى وقت الاختبار"\n- يتم توجيه المرشح إلى صفحة النتائج\n\n**2. الإيقاف التلقائي (تم الوصول إلى حد المخالفات):**\n- إذا كان للاختبار **حد أقصى لتحذيرات المخالفات** مُعد\n- بعد تجاوز المرشح الحد الأقصى لعدد المخالفات المسموح بها\n- يتم تقديم الاختبار إجباريًا بحالة **"موقوف"**\n- تظهر رسالة إيقاف توضح السبب\n- يُعامل كتقديم نهائي — لا يمكن الاستئناف\n\n**3. التقديم الإجباري من المراقب:**\n- يمكن للمراقب الحي **تقديم الاختبار إجباريًا** من مركز المراقب\n- يقدم المحاولة فورًا بغض النظر عن الوقت المتبقي\n- يرى المرشح إشعارًا بأن اختباره تم تقديمه إجباريًا\n- تتغير الحالة إلى "مُقدم إجباريًا"\n\n**في جميع سيناريوهات التقديم التلقائي:**\n- ✓ جميع الإجابات المحفوظة يتم الاحتفاظ بها\n- ✓ يتم إغلاق المحاولة بشكل صحيح على الخادم\n- ✓ تتوقف الكاميرا والمؤقتات\n- ✓ يتم توجيه المرشح إلى صفحة النتائج',
          imagePlaceholder: "/tutorials/candidate-portal-auto-submit.png",
        },
        {
          id: "results-page",
          titleEn: "Results Page & Certificate",
          titleAr: "صفحة النتائج والشهادة",
          descriptionEn:
            'After submission, you are redirected to the **Results page**:\n\n**"Just Submitted" State:**\n- If you were just redirected from the exam (URL has `?submitted=true`)\n- A **banner** shows "Your exam has been submitted successfully"\n- The system **polls for grading** to complete:\n  - Checks every 5 seconds, up to 6 times (30 seconds total)\n  - If grading is finished during polling, results display immediately\n  - If grading takes longer, a "Grading in progress" message shows\n\n**Results Display (after grading is complete):**\n- **Exam title** and attempt number\n- **Submission timestamp** — when the exam was submitted\n- **Score breakdown:**\n  - Total Score achieved\n  - Pass Score threshold\n  - ✅ **Passed** (green badge) or ✗ **Failed** (red badge)\n- **Time taken** — how long the candidate spent\n- **Questions attempted** vs total questions\n\n**Certificate Download (if passed):**\n- If the candidate **passed** the exam, a **"Download Certificate"** button appears\n- Click to generate and download a PDF certificate\n- The certificate is generated on-demand from the server\n\n**Available Actions:**\n- 🏠 **"Back to My Exams"** — returns to the exam list\n- 📋 **"Share Results"** — share results (if available)\n- 📜 **"Download Certificate"** — download PDF certificate (only if passed)\n\n**Returning Later:**\nFrom the My Exams page, click **"View Results"** on any Completed exam card to revisit the results page at any time.',
          descriptionAr:
            'بعد التقديم، يتم توجيهك إلى **صفحة النتائج**:\n\n**حالة "تم التقديم للتو":**\n- إذا تم توجيهك للتو من الاختبار (الرابط يحتوي `?submitted=true`)\n- يعرض **شعار** "تم تقديم اختبارك بنجاح"\n- النظام **يستطلع لاكتمال التقييم**:\n  - يتحقق كل 5 ثوانٍ، حتى 6 مرات (30 ثانية إجمالاً)\n  - إذا اكتمل التقييم أثناء الاستطلاع، تُعرض النتائج فورًا\n  - إذا استغرق التقييم وقتًا أطول، تظهر رسالة "التقييم قيد التقدم"\n\n**عرض النتائج (بعد اكتمال التقييم):**\n- **عنوان الاختبار** ورقم المحاولة\n- **طابع وقت التقديم** — متى تم تقديم الاختبار\n- **تفصيل الدرجة:**\n  - الدرجة الإجمالية المحققة\n  - حد درجة النجاح\n  - ✅ **ناجح** (شارة خضراء) أو ✗ **غير ناجح** (شارة حمراء)\n- **الوقت المستغرق** — كم قضى المرشح\n- **الأسئلة المحاولة** مقابل إجمالي الأسئلة\n\n**تنزيل الشهادة (إذا نجح):**\n- إذا **نجح** المرشح في الاختبار، يظهر زر **"تنزيل الشهادة"**\n- انقر لإنشاء وتنزيل شهادة PDF\n- يتم إنشاء الشهادة عند الطلب من الخادم\n\n**الإجراءات المتاحة:**\n- 🏠 **"العودة إلى اختباراتي"** — يعود إلى قائمة الاختبارات\n- 📋 **"مشاركة النتائج"** — مشاركة النتائج (إذا متاحة)\n- 📜 **"تنزيل الشهادة"** — تنزيل شهادة PDF (فقط إذا نجح)\n\n**العودة لاحقًا:**\nمن صفحة اختباراتي، انقر على **"عرض النتائج"** في أي بطاقة اختبار مكتمل لإعادة زيارة صفحة النتائج في أي وقت.',
          imagePlaceholder: "/tutorials/candidate-portal-results.png",
        },
      ],
      examples: [
        {
          titleEn: "Complete Exam Flow Timeline",
          titleAr: "الجدول الزمني الكامل لمسار الاختبار",
          contentEn:
            '**Example: Candidate takes a 60-minute proctored exam with 3 sections**\n\n1. **10:00 AM** — Candidate clicks "Start Exam" on My Exams page\n2. **10:00 AM** — Instructions page: selects English, system check passes, agrees to rules, clicks Start\n3. **10:00 AM** — Browser enters fullscreen, webcam activates, exam timer starts (60:00)\n4. **10:00 AM** — Section 1 begins (20-minute timer). Candidate answers questions 1–10\n5. **10:15 AM** — Candidate finishes Section 1 early → clicks Next Section → confirms → moves to Section 2\n6. **10:15 AM** — Section 2 timer starts (15 minutes). Section 1 is now locked.\n7. **10:20 AM** — Candidate switches tabs accidentally → warning toast + violation #1\n8. **10:30 AM** — Section 2 timer expires → automatically advanced to Section 3\n9. **10:30 AM** — Section 3 begins (remaining exam time). Calculator available.\n10. **10:50 AM** — Candidate opens Summary → sees 2 unanswered questions → jumps to them\n11. **10:52 AM** — Candidate clicks Submit Exam → confirms → submission processing\n12. **10:52 AM** — Redirected to Results page → polling for grading...\n13. **10:52 AM** — Grading complete → Score: 35/40 → Passed ✅ → Download Certificate available',
          contentAr:
            '**مثال: مرشح يؤدي اختبار مراقب مدته 60 دقيقة مع 3 أقسام**\n\n1. **10:00 صباحًا** — المرشح ينقر على "بدء الاختبار" في صفحة اختباراتي\n2. **10:00 صباحًا** — صفحة التعليمات: يختار الإنجليزية، فحص النظام ينجح، يوافق على القواعد، ينقر على بدء\n3. **10:00 صباحًا** — المتصفح يدخل ملء الشاشة، الكاميرا تنشط، مؤقت الاختبار يبدأ (60:00)\n4. **10:00 صباحًا** — القسم 1 يبدأ (مؤقت 20 دقيقة). المرشح يجيب على الأسئلة 1–10\n5. **10:15 صباحًا** — المرشح ينهي القسم 1 مبكرًا → ينقر القسم التالي → يؤكد → ينتقل إلى القسم 2\n6. **10:15 صباحًا** — مؤقت القسم 2 يبدأ (15 دقيقة). القسم 1 الآن مقفل.\n7. **10:20 صباحًا** — المرشح يبدل التبويب عن طريق الخطأ → إشعار تحذيري + مخالفة #1\n8. **10:30 صباحًا** — مؤقت القسم 2 ينتهي → تقدم تلقائي إلى القسم 3\n9. **10:30 صباحًا** — القسم 3 يبدأ (الوقت المتبقي من الاختبار). الآلة الحاسبة متاحة.\n10. **10:50 صباحًا** — المرشح يفتح الملخص → يرى سؤالين بدون إجابة → يقفز إليهما\n11. **10:52 صباحًا** — المرشح ينقر تقديم الاختبار → يؤكد → معالجة التقديم\n12. **10:52 صباحًا** — يتم التوجيه إلى صفحة النتائج → استطلاع للتقييم...\n13. **10:52 صباحًا** — التقييم مكتمل → الدرجة: 35/40 → ناجح ✅ → تنزيل الشهادة متاح',
        },
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────
// ALL TUTORIAL MODULES
// ────────────────────────────────────────────────────────
export const allTutorialModules: TutorialModule[] = [
  questionBankTutorial,
  aiStudioTutorial,
  examManagementTutorial,
  gradingTutorial,
  resultsTutorial,
  proctorTutorial,
  candidateTutorial,
  administrationTutorial,
  candidatePortalTutorial,
];

// Module navigation order for prev/next
export const tutorialModuleOrder = [
  "question-bank",
  "question-bank/ai-studio",
  "exams",
  "grading",
  "results",
  "proctoring",
  "candidates",
  "administration",
  "candidate-portal",
];
