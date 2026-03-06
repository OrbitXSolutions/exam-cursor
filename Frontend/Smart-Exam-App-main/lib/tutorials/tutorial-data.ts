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
              descriptionAr: "افتراضي: 1. الحد الأدنى 0.5، بخطوات 0.5 (مثل 0.5، 1، 1.5، 2، 5.5)",
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
              descriptionEn: "Optional image file (JPEG, PNG, GIF, WebP, SVG — max 10 MB)",
              descriptionAr: "ملف صورة اختياري (JPEG، PNG، GIF، WebP، SVG — حد أقصى 10 ميجابايت)",
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
            "Subject: Mathematics → Topic: Algebra\nType: MCQ Single Answer\nBody (EN): What is the value of x in 2x + 4 = 10?\nBody (AR): ما قيمة x في 2x + 4 = 10؟\nDifficulty: Medium\nPoints: 5\nOptions:\n  A) x = 2 ✗\n  B) x = 3 ✓ (Correct)\n  C) x = 4 ✗\n  D) x = 5 ✗",
          contentAr:
            "المادة: الرياضيات ← الموضوع: الجبر\nالنوع: اختيار من متعدد (إجابة واحدة)\nنص السؤال (EN): What is the value of x in 2x + 4 = 10?\nنص السؤال (AR): ما قيمة x في 2x + 4 = 10؟\nالصعوبة: متوسط\nالنقاط: 5\nالخيارات:\n  أ) x = 2 ✗\n  ب) x = 3 ✓ (صحيح)\n  ج) x = 4 ✗\n  د) x = 5 ✗",
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
            "Multiple Choice where more than one option can be correct. Mark all correct answers. Grading: All-or-Nothing approach — the candidate must select ALL correct answers and NO wrong answers to get full points. Any mistake = zero points. Auto-graded.",
          descriptionAr:
            "اختيار من متعدد حيث يمكن أن تكون أكثر من إجابة صحيحة. حدد جميع الإجابات الصحيحة. التصحيح: نهج الكل أو لا شيء — يجب على المرشح اختيار جميع الإجابات الصحيحة وعدم اختيار أي إجابة خاطئة للحصول على النقاط الكاملة. أي خطأ = صفر نقاط. تصحيح تلقائي.",
          imagePlaceholder: "/tutorials/type-mcq-multi.png",
          tipEn:
            "All-or-Nothing: If a question has 3 correct answers, the candidate must select exactly those 3. Selecting only 2 correct = ZERO. Selecting all 3 correct + 1 wrong = ZERO.",
          tipAr:
            "الكل أو لا شيء: إذا كان للسؤال 3 إجابات صحيحة، يجب على المرشح اختيار تلك الـ 3 بالضبط. اختيار 2 صحيحة فقط = صفر. اختيار 3 صحيحة + 1 خاطئة = صفر.",
          noteEn:
            "Example: Question worth 6 points with 3 correct answers (A, B, D). Candidate selects A, B → gets 0. Candidate selects A, B, D → gets 6. Candidate selects A, B, C, D → gets 0.",
          noteAr:
            "مثال: سؤال بقيمة 6 نقاط مع 3 إجابات صحيحة (A, B, D). المرشح يختار A, B ← يحصل على 0. المرشح يختار A, B, D ← يحصل على 6. المرشح يختار A, B, C, D ← يحصل على 0.",
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
            "| Type | Auto-Graded | Grading Method | Manual Review |\n|------|-------------|---------------|---------------|\n| MCQ Single | ✓ Yes | Full or Zero | Not needed |\n| MCQ Multi | ✓ Yes | All-or-Nothing | Not needed |\n| True/False | ✓ Yes | Full or Zero | Not needed |\n| Subjective | ✗ No | Partial (manual) | Required |",
          contentAr:
            "| النوع | تصحيح تلقائي | طريقة التصحيح | مراجعة يدوية |\n|------|-------------|---------------|---------------|\n| اختيار فردي | ✓ نعم | كامل أو صفر | غير مطلوبة |\n| اختيار متعدد | ✓ نعم | الكل أو لا شيء | غير مطلوبة |\n| صح/خطأ | ✓ نعم | كامل أو صفر | غير مطلوبة |\n| مقالي | ✗ لا | جزئي (يدوي) | مطلوبة |",
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
              descriptionEn: "MCQ Single, MCQ Multi, or True/False only (Subjective not supported)",
              descriptionAr: "اختيار فردي، اختيار متعدد، أو صح/خطأ فقط (المقالي غير مدعوم)",
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
              descriptionEn: "Optional: guide AI focus (e.g., 'Focus on OOP concepts in Java')",
              descriptionAr: "اختياري: توجيه تركيز AI (مثل: 'ركز على مفاهيم البرمجة الكائنية في Java')",
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
            { nameEn: "Title (English)", nameAr: "العنوان (إنجليزي)", required: true, descriptionEn: "Exam title in English (max 500 characters)", descriptionAr: "عنوان الاختبار بالإنجليزية (حد أقصى 500 حرف)" },
            { nameEn: "Title (Arabic)", nameAr: "العنوان (عربي)", required: false, descriptionEn: "Optional Arabic title", descriptionAr: "عنوان عربي اختياري" },
            { nameEn: "Description (English)", nameAr: "الوصف (إنجليزي)", required: false, descriptionEn: "Optional description (max 2000 characters)", descriptionAr: "وصف اختياري (حد أقصى 2000 حرف)" },
            { nameEn: "Description (Arabic)", nameAr: "الوصف (عربي)", required: false, descriptionEn: "Optional Arabic description", descriptionAr: "وصف عربي اختياري" },
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
            { nameEn: "Exam Type", nameAr: "نوع الاختبار", required: false, descriptionEn: "Flexible (default) or Fixed", descriptionAr: "مرن (افتراضي) أو ثابت" },
            { nameEn: "Start Date & Time", nameAr: "تاريخ ووقت البداية", required: true, descriptionEn: "When the exam becomes available", descriptionAr: "متى يصبح الاختبار متاحاً" },
            { nameEn: "End Date & Time", nameAr: "تاريخ ووقت النهاية", required: true, descriptionEn: "Must be after start date", descriptionAr: "يجب أن يكون بعد تاريخ البداية" },
          ],
          tipEn: "For Flexible type: candidates can start at any time between Start and End. For Fixed type: all must start exactly at the Start time.",
          tipAr: "للنوع المرن: يمكن للمرشحين البدء في أي وقت بين البداية والنهاية. للنوع الثابت: يجب على الجميع البدء في وقت البداية بالضبط.",
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
            { nameEn: "Duration (minutes)", nameAr: "المدة (دقائق)", required: true, descriptionEn: "Default: 60. Range: 1–600 minutes", descriptionAr: "افتراضي: 60. النطاق: 1–600 دقيقة" },
            { nameEn: "Pass Score (Points)", nameAr: "درجة النجاح (نقاط)", required: false, descriptionEn: "Default: 0. Minimum passing score. 0 means all candidates pass", descriptionAr: "افتراضي: 0. درجة النجاح الدنيا. 0 تعني أن جميع المرشحين ينجحون" },
            { nameEn: "Max Attempts", nameAr: "عدد المحاولات", required: false, descriptionEn: "Default: 1. Set to 0 for unlimited attempts", descriptionAr: "افتراضي: 1. اضبط على 0 لمحاولات غير محدودة" },
          ],
          noteEn: "If Pass Score is 0, all candidates will pass regardless of their score. A warning is shown during publish.",
          noteAr: "إذا كانت درجة النجاح 0، سينجح جميع المرشحين بغض النظر عن درجاتهم. يظهر تحذير أثناء النشر.",
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
            { nameEn: "Shuffle Questions", nameAr: "خلط الأسئلة", required: false, descriptionEn: "Default: ON. Randomize question order for each candidate", descriptionAr: "افتراضي: مفعّل. ترتيب عشوائي للأسئلة لكل مرشح" },
            { nameEn: "Shuffle Options", nameAr: "خلط الخيارات", required: false, descriptionEn: "Default: ON. Randomize answer option order", descriptionAr: "افتراضي: مفعّل. ترتيب عشوائي لخيارات الإجابة" },
            { nameEn: "Is Active", nameAr: "نشط", required: false, descriptionEn: "Default: ON. Whether exam is visible to candidates", descriptionAr: "افتراضي: مفعّل. هل الاختبار مرئي للمرشحين" },
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
          tipEn: "The Builder tab is locked until you save the configuration first.",
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
          noteEn: "Changing the build mode clears all existing sections. Choose carefully before adding sections.",
          noteAr: "تغيير وضع البناء يمسح جميع الأقسام الموجودة. اختر بعناية قبل إضافة الأقسام.",
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
          tipEn: "In Topic mode, click the subject accordion to expand it and see its topics.",
          tipAr: "في وضع الموضوع، انقر على مادة الأكورديون لتوسيعها ورؤية مواضيعها.",
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
            { nameEn: "Section Title", nameAr: "عنوان القسم", required: false, descriptionEn: "Auto-filled, editable", descriptionAr: "يملأ تلقائياً، قابل للتعديل" },
            { nameEn: "Duration (minutes)", nameAr: "المدة (دقائق)", required: false, descriptionEn: "Optional per-section time limit", descriptionAr: "حد زمني اختياري لكل قسم" },
            { nameEn: "Questions to Pick", nameAr: "عدد الأسئلة المختارة", required: true, descriptionEn: "Min 1, max = available questions in bank", descriptionAr: "حد أدنى 1، حد أقصى = الأسئلة المتاحة في البنك" },
          ],
          noteEn: "The system randomly picks questions from the bank when a candidate starts the exam. Different candidates may get different questions.",
          noteAr: "يختار النظام أسئلة عشوائياً من البنك عندما يبدأ المرشح الاختبار. قد يحصل مرشحون مختلفون على أسئلة مختلفة.",
        },
        {
          id: "builder-summary",
          titleEn: "Review Summary & Save",
          titleAr: "مراجعة الملخص والحفظ",
          descriptionEn:
            "The summary bar shows: Total Sections, Total Questions, Total Points, and Pass Score. You can adjust the Pass Score here. Click \"Save Builder\" to save and proceed to the Overview page.",
          descriptionAr:
            "يعرض شريط الملخص: إجمالي الأقسام، إجمالي الأسئلة، إجمالي النقاط، ودرجة النجاح. يمكنك تعديل درجة النجاح هنا. انقر \"حفظ المُنشئ\" للحفظ والانتقال لصفحة النظرة العامة.",
          imagePlaceholder: "/tutorials/builder-summary.png",
          tipEn: "Pass Score must not exceed Total Points. If it does, a warning will appear.",
          tipAr: "درجة النجاح يجب ألا تتجاوز إجمالي النقاط. إذا تجاوزت، سيظهر تحذير.",
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
            { nameEn: "Shuffle Questions", nameAr: "خلط الأسئلة", required: false, descriptionEn: "Randomize question order", descriptionAr: "ترتيب عشوائي للأسئلة" },
            { nameEn: "Shuffle Options", nameAr: "خلط الخيارات", required: false, descriptionEn: "Randomize answer option order", descriptionAr: "ترتيب عشوائي لخيارات الإجابة" },
            { nameEn: "Show Results", nameAr: "إظهار النتائج", required: false, descriptionEn: "Default: ON. Show score to candidate after submission", descriptionAr: "افتراضي: مفعّل. عرض الدرجة للمرشح بعد التقديم" },
            { nameEn: "Allow Review", nameAr: "السماح بالمراجعة", required: false, descriptionEn: "Allow candidates to review their answers after submission", descriptionAr: "السماح للمرشحين بمراجعة إجاباتهم بعد التقديم" },
            { nameEn: "Show Correct Answers", nameAr: "إظهار الإجابات الصحيحة", required: false, descriptionEn: "Show correct answers during review. Requires 'Allow Review' to be ON", descriptionAr: "عرض الإجابات الصحيحة أثناء المراجعة. يتطلب تفعيل 'السماح بالمراجعة'" },
          ],
          noteEn: "Show Correct Answers is disabled if Allow Review is OFF. Turning OFF Allow Review automatically turns OFF Show Correct Answers.",
          noteAr: "إظهار الإجابات الصحيحة معطل إذا كانت المراجعة مغلقة. إيقاف المراجعة يغلق تلقائياً إظهار الإجابات الصحيحة.",
        },
        {
          id: "config-tab2-security",
          titleEn: "Tab 2: Security Settings",
          titleAr: "تبويب 2: إعدادات الأمان",
          descriptionEn:
            "Configure exam security and proctoring measures. Use the \"Activate All\" master toggle to enable all settings at once.",
          descriptionAr:
            "أعدَّ إجراءات أمان الاختبار والمراقبة. استخدم مفتاح \"تفعيل الكل\" الرئيسي لتفعيل جميع الإعدادات دفعة واحدة.",
          imagePlaceholder: "/tutorials/config-security.png",
          fields: [
            { nameEn: "Activate All (Master Toggle)", nameAr: "تفعيل الكل (المفتاح الرئيسي)", required: false, descriptionEn: "Enables/disables all 7 security settings at once", descriptionAr: "يفعّل/يعطّل جميع إعدادات الأمان الـ 7 دفعة واحدة" },
            { nameEn: "Require Proctoring", nameAr: "طلب المراقبة", required: false, descriptionEn: "Enable proctoring for this exam", descriptionAr: "تفعيل المراقبة لهذا الاختبار" },
            { nameEn: "Require ID Verification", nameAr: "طلب التحقق من الهوية", required: false, descriptionEn: "Candidates must verify identity before exam", descriptionAr: "يجب على المرشحين التحقق من هويتهم قبل الاختبار" },
            { nameEn: "Prevent Copy/Paste", nameAr: "منع النسخ/اللصق", required: false, descriptionEn: "Block copy-paste during exam", descriptionAr: "حظر النسخ واللصق أثناء الاختبار" },
            { nameEn: "Prevent Screen Capture", nameAr: "منع لقطة الشاشة", required: false, descriptionEn: "Block screenshots during exam", descriptionAr: "حظر لقطات الشاشة أثناء الاختبار" },
            { nameEn: "Require Webcam", nameAr: "طلب كاميرا الويب", required: false, descriptionEn: "Candidate must enable webcam", descriptionAr: "يجب على المرشح تفعيل كاميرا الويب" },
            { nameEn: "Require Fullscreen", nameAr: "طلب ملء الشاشة", required: false, descriptionEn: "Exam runs in fullscreen mode", descriptionAr: "يعمل الاختبار في وضع ملء الشاشة" },
            { nameEn: "Browser Lockdown", nameAr: "قفل المتصفح", required: false, descriptionEn: "Lock the browser to prevent tab switching", descriptionAr: "قفل المتصفح لمنع التبديل بين التبويبات" },
          ],
          tipEn: "Require Proctoring is highlighted in amber. Browser Lockdown is highlighted in red — it's the most restrictive setting.",
          tipAr: "طلب المراقبة مميز بالأصفر. قفل المتصفح مميز بالأحمر — إنه الإعداد الأكثر تقييداً.",
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
            { nameEn: "Instruction (English)", nameAr: "التعليمات (إنجليزي)", required: true, descriptionEn: "Instruction text in English", descriptionAr: "نص التعليمات بالإنجليزية" },
            { nameEn: "Instruction (Arabic)", nameAr: "التعليمات (عربي)", required: false, descriptionEn: "Optional Arabic translation", descriptionAr: "ترجمة عربية اختيارية" },
          ],
          tipEn: "Instructions appear on the exam start page. Add clear rules like 'No external resources allowed' or 'Time limit is strictly enforced'.",
          tipAr: "تظهر التعليمات في صفحة بدء الاختبار. أضف قواعد واضحة مثل 'لا يُسمح بالموارد الخارجية' أو 'الحد الزمني مطبق بصرامة'.",
        },
        {
          id: "config-tab4-access",
          titleEn: "Tab 4: Access Policy",
          titleAr: "تبويب 4: سياسة الوصول",
          descriptionEn:
            "Control who can access and take the exam.",
          descriptionAr:
            "تحكم في من يمكنه الوصول للاختبار وتقديمه.",
          imagePlaceholder: "/tutorials/config-access.png",
          fields: [
            { nameEn: "Is Public", nameAr: "عام", required: false, descriptionEn: "Anyone can access the exam (no restrictions)", descriptionAr: "يمكن لأي شخص الوصول للاختبار (بدون قيود)" },
            { nameEn: "Access Code", nameAr: "رمز الوصول", required: false, descriptionEn: "Optional code required to start the exam", descriptionAr: "رمز اختياري مطلوب لبدء الاختبار" },
            { nameEn: "Restrict to Assigned", nameAr: "تقييد للمعينين", required: false, descriptionEn: "Only assigned candidates can take the exam", descriptionAr: "فقط المرشحون المعينون يمكنهم تقديم الاختبار" },
          ],
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
            'Go to the Exam Overview page or Exam List. Click the "Publish" button. The system validates the exam before publishing.',
          descriptionAr:
            'انتقل إلى صفحة نظرة عامة الاختبار أو قائمة الاختبارات. انقر زر "نشر". يتحقق النظام من الاختبار قبل النشر.',
          imagePlaceholder: "/tutorials/publish-button.png",
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
          noteEn: "If any rule fails, publish is blocked and the specific error is shown.",
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
          tipEn: "To modify duration, pass score, or remove questions — archive the exam first, make changes, then re-publish.",
          tipAr: "لتعديل المدة أو درجة النجاح أو إزالة الأسئلة — أرشف الاختبار أولاً، أجرِ التعديلات، ثم أعد النشر.",
        },
      ],
      examples: [
        {
          titleEn: "Publish Status Flow",
          titleAr: "مسار حالة النشر",
          contentEn: "Draft → Publish → Published\nPublished → Archive → Draft\nDraft → Publish → Published (re-publish)\n\nDeleting: Only possible if no candidate attempts exist.\nIf attempts exist, you can only Archive.",
          contentAr: "مسودة → نشر → منشور\nمنشور → أرشفة → مسودة\nمسودة → نشر → منشور (إعادة نشر)\n\nالحذف: ممكن فقط إذا لم تكن هناك محاولات مرشحين.\nإذا وُجدت محاولات، يمكنك الأرشفة فقط.",
        },
      ],
    },

    // ─── Section 5: Create from Template ────
    {
      id: "create-from-template",
      titleEn: "5. Create from Template",
      titleAr: "5. إنشاء من قالب",
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
            { nameEn: "Title (English)", nameAr: "العنوان (إنجليزي)", required: true, descriptionEn: "New exam title", descriptionAr: "عنوان الاختبار الجديد" },
            { nameEn: "Title (Arabic)", nameAr: "العنوان (عربي)", required: false, descriptionEn: "Optional", descriptionAr: "اختياري" },
            { nameEn: "Description (EN/AR)", nameAr: "الوصف (EN/AR)", required: false, descriptionEn: "Optional bilingual description", descriptionAr: "وصف ثنائي اللغة اختياري" },
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
            { nameEn: "Exam Type", nameAr: "نوع الاختبار", required: false, descriptionEn: "Pre-filled from source exam", descriptionAr: "مملوء مسبقاً من الاختبار المصدر" },
            { nameEn: "Duration", nameAr: "المدة", required: true, descriptionEn: "Pre-filled, range 1–600 minutes", descriptionAr: "مملوء مسبقاً، النطاق 1–600 دقيقة" },
            { nameEn: "Start/End Dates", nameAr: "تواريخ البداية/النهاية", required: false, descriptionEn: "New schedule for the cloned exam", descriptionAr: "جدول جديد للاختبار المنسوخ" },
          ],
          tipEn: "The cloned exam is always created as Draft — you must publish it separately.",
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
          noteEn: "The new exam starts as Draft with IsActive = true. No candidate assignments are copied.",
          noteAr: "يبدأ الاختبار الجديد كمسودة مع IsActive = صحيح. لا يتم نسخ تعيينات المرشحين.",
        },
      ],
    },

    // ─── Section 6: Exam List ────
    {
      id: "exam-list",
      titleEn: "6. Exam List",
      titleAr: "6. قائمة الاختبارات",
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
          tipEn: "Successful publish shows a celebration dialog. Failed delete (due to attempts) shows an error dialog with the backend message.",
          tipAr: "النشر الناجح يعرض حوار احتفال. فشل الحذف (بسبب المحاولات) يعرض حوار خطأ برسالة الخادم.",
        },
      ],
      examples: [
        {
          titleEn: "Exam Status Meanings",
          titleAr: "معاني حالات الاختبار",
          contentEn: "| Status | Meaning | Can Publish? | Can Archive? |\n|--------|---------|-------------|-------------|\n| Draft | Saved but not yet available to candidates | ✓ Yes | ✗ No |\n| Published | Live — candidates can take this exam | ✗ Already published | ✓ Yes |\n| Archived | Was published, now deactivated | ✓ Yes (re-publish) | ✗ Already archived |",
          contentAr: "| الحالة | المعنى | يمكن النشر؟ | يمكن الأرشفة؟ |\n|--------|---------|-------------|-------------|\n| مسودة | محفوظ لكن غير متاح للمرشحين | ✓ نعم | ✗ لا |\n| منشور | مباشر — يمكن للمرشحين تقديمه | ✗ منشور بالفعل | ✓ نعم |\n| مؤرشف | كان منشوراً، الآن معطل | ✓ نعم (إعادة نشر) | ✗ مؤرشف بالفعل |",
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
];

// Module navigation order for prev/next
export const tutorialModuleOrder = [
  "question-bank",
  "question-bank/ai-studio",
  "exams",
  // Future modules will be added here:
  // "grading",
  // "results",
  // "proctoring",
  // "settings",
];
