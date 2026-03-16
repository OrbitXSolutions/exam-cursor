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
          descriptionEn: "Control who can access and take the exam.",
          descriptionAr: "تحكم في من يمكنه الوصول للاختبار وتقديمه.",
          imagePlaceholder: "/tutorials/config-access.png",
          fields: [
            {
              nameEn: "Is Public",
              nameAr: "عام",
              required: false,
              descriptionEn: "Anyone can access the exam (no restrictions)",
              descriptionAr: "يمكن لأي شخص الوصول للاختبار (بدون قيود)",
            },
            {
              nameEn: "Access Code",
              nameAr: "رمز الوصول",
              required: false,
              descriptionEn: "Optional code required to start the exam",
              descriptionAr: "رمز اختياري مطلوب لبدء الاختبار",
            },
            {
              nameEn: "Restrict to Assigned",
              nameAr: "تقييد للمعينين",
              required: false,
              descriptionEn: "Only assigned candidates can take the exam",
              descriptionAr: "فقط المرشحون المعينون يمكنهم تقديم الاختبار",
            },
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
    // ─── Section 7: Violation Events & Auto-Termination ────
    {
      id: "violation-events",
      titleEn: "7. Violation Events & Auto-Termination",
      titleAr: "7. أحداث المخالفات والإنهاء التلقائي",
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
    // ── Section 4: Scoring & Calculation ──
    {
      id: "scoring",
      titleEn: "4. Scoring & Calculation",
      titleAr: "4. احتساب الدرجات",
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
            "**Auto-graded questions:**\n- ✅ Correct → full points\n- ❌ Wrong → zero points\n- Partial credit for multi-select MCQ based on correct selections\n\n**Manually-graded questions:**\n- Score you assign (0 to max, supports 0.5 steps)\n\n**Final calculation:**\n- **Total Score** = sum of all question scores\n- **Percentage** = (Total Score / Max Possible Score) × 100",
          descriptionAr:
            "**الأسئلة المصححة آلياً:**\n- ✅ صحيحة ← نقاط كاملة\n- ❌ خاطئة ← صفر نقاط\n- درجة جزئية لأسئلة الاختيار المتعدد بناءً على الاختيارات الصحيحة\n\n**الأسئلة المصححة يدوياً:**\n- الدرجة التي تحددها (0 إلى الحد الأقصى، يدعم خطوات 0.5)\n\n**الحساب النهائي:**\n- **الدرجة الإجمالية** = مجموع درجات جميع الأسئلة\n- **النسبة المئوية** = (الدرجة الإجمالية / الدرجة القصوى) × 100",
        },
        {
          id: "pass-fail",
          titleEn: "Pass / Fail Determination",
          titleAr: "تحديد النجاح / الرسوب",
          descriptionEn:
            "The pass score is defined in the **exam configuration** (e.g., 60%).\n\nAfter grading, the system compares:\n- **Total Score ≥ Pass Score** → **Passed** (green badge)\n- **Total Score < Pass Score** → **Failed** (red badge)\n\nThis is computed **automatically** upon finalization.",
          descriptionAr:
            "درجة النجاح محددة في **إعدادات الاختبار** (مثلاً 60%).\n\nبعد التصحيح، يقارن النظام:\n- **الدرجة الإجمالية ≥ درجة النجاح** ← **ناجح** (شارة خضراء)\n- **الدرجة الإجمالية < درجة النجاح** ← **راسب** (شارة حمراء)\n\nيُحسب **تلقائياً** عند الاعتماد.",
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
    // ── Section 5: Security & Media Storage ──
    {
      id: "grading-security",
      titleEn: "5. Security & Data Integrity",
      titleAr: "5. الأمان وسلامة البيانات",
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
            "أدوات التصفية المتاحة:\n- **الاختبار** — تصفية حسب اختبار محدد أو عرض الكل\n- **حالة النتيجة** — الكل، ناجح، راسب، قيد المراجعة، غير منشور\n- **البحث** — باسم المرشح أو البريد\n- **تحديث** — إعادة تحميل أحدث البيانات\n\nتعرض بطاقة الملخص **العدد الإجمالي** للمرشحين المصفّين.",
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
            'أعمدة الجدول:\n- **الرقم** — رقم الصف\n- **اسم الاختبار** — عنوان الاختبار ثنائي اللغة\n- **المرشح** — الاسم + رقم المحاولة\n- **الدرجة** — مثلاً "75.5/100"\n- **النسبة** — مثلاً "75.50%"\n- **حالة المحاولة** — مسلّم، منتهي، أُنهي قسراً، أُنهي (شارات ملونة)\n- **ناجح/راسب** — شارة خضراء "ناجح" أو حمراء "راسب"\n- **حالة التصحيح** — آلي، يدوي، قيد المراجعة، معلّق (ملونة)\n- **منشور** — نعم / لا\n- **الإجراءات** — قائمة بجميع العمليات المتاحة',
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
            'Two ways to access:\n1. From the sidebar: **Result → Proctor Report** → select candidate and exam → click **"View Report"**\n2. From any results table: **Actions → "AI Report"**\n\nBoth open the detailed **AI analysis page**.\n\nPermitted roles: **SuperDev**, **Admin**, **Instructor**, **ProctorReviewer**, **Proctor**.',
          descriptionAr:
            'طريقتان للوصول:\n1. من القائمة الجانبية: **النتائج ← تقرير المراقب** ← اختر المرشح والاختبار ← انقر **"عرض التقرير"**\n2. من أي جدول نتائج: **الإجراءات ← "تقرير AI"**\n\nكلاهما يفتح صفحة **تحليل AI التفصيلية**.\n\nالأدوار المسموحة: **SuperDev**، **مدير**، **مدرّس**، **مراجع المراقبة**، **مراقب**.',
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
            "Category: Face Detection | Events: FaceNotDetected(-8), MultipleFaces(-12), CameraBlocked(-10), WebcamDenied(-25) | Weight: 35%\n\nCategory: Eye Tracking | Events: HeadTurned(-7), FaceOutOfFrame(-6) | Weight: 20%\n\nCategory: Behavior | Events: TabSwitched(-8), WindowBlur(-4), CopyAttempt(-10), PasteAttempt(-10), RightClick(-5) | Weight: 30%\n\nCategory: Environment | Events: FullscreenExited(-10), CameraBlocked(-12), SnapshotFailed(-8) | Weight: 15%\n\nAll scores start at 100 and decrease with each violation. Overall Risk = weighted sum of (100 - CategoryScore) for each category.",
          contentAr:
            "الفئة: كشف الوجه | الأحداث: عدم كشف الوجه(-8)، وجوه متعددة(-12)، حجب الكاميرا(-10)، رفض الكاميرا(-25) | الوزن: 35%\n\nالفئة: تتبع العين | الأحداث: التفات الرأس(-7)، الوجه خارج الإطار(-6) | الوزن: 20%\n\nالفئة: السلوك | الأحداث: تبديل علامة(-8)، فقدان التركيز(-4)، محاولة نسخ(-10)، محاولة لصق(-10)، نقر يمين(-5) | الوزن: 30%\n\nالفئة: البيئة | الأحداث: خروج من الشاشة الكاملة(-10)، حجب الكاميرا(-12)، فشل اللقطة(-8) | الوزن: 15%\n\nجميع النقاط تبدأ من 100 وتنخفض مع كل مخالفة. المخاطر الإجمالية = المجموع المرجّح لـ(100 - نقاط الفئة) لكل فئة.",
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
// ALL TUTORIAL MODULES
// ────────────────────────────────────────────────────────
export const allTutorialModules: TutorialModule[] = [
  questionBankTutorial,
  aiStudioTutorial,
  examManagementTutorial,
  gradingTutorial,
  resultsTutorial,
];

// Module navigation order for prev/next
export const tutorialModuleOrder = [
  "question-bank",
  "question-bank/ai-studio",
  "exams",
  "grading",
  "results",
  // Future modules will be added here:
  // "proctoring",
  // "settings",
];
