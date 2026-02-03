# API Documentation: Assessment Module - Complete Example

## Creating a Complete Exam Assessment

This guide walks through the complete process of creating an exam with all its components.

---

## Prerequisites

1. **Authentication**: Obtain a Bearer Token via `POST /api/Auth/login`
2. **Department**: User must belong to a department (Admin/Instructor role)
3. **Questions**: Questions must exist in the Question Bank before adding to exams

---

## Exam Structure

```
Exam
??? Sections (required - at least 1)
???? Topics (optional - for organizing questions)
?   ?   ??? Questions
?   ??? Questions (directly under section)
??? Instructions
??? Access Policy
```

---

## Question Selection: Two Options

```
???????????????????????????????????????????????????????????????????
?         QUESTION SELECTION OPTIONS?
???????????????????????????????????????????????????????????????????
?       ?
?  OPTION 1: MANUAL SELECTION            ?
?  ???????????????????????????         ?
?  • User browses Question Bank              ?
?  • User picks specific questions              ?
?  • User defines order and points for each  ?
?  • POST /sections/{id}/questions/manual         ?
?                   ?
?  OPTION 2: RANDOM SELECTION            ?
?  ???????????????????????????   ?
?  • User specifies criteria (count, category, difficulty)  ?
?  • System randomly selects matching questions         ?
?  • Auto-assigns order (appends to existing) ?
?  • POST /sections/{id}/questions/random        ?
??
???????????????????????????????????????????????????????????????????
```

---

## Bilingual Support

All text fields in the Question Bank and Assessment modules support bilingual content (English/Arabic):

### Question Entity
| Field | Description |
|-------|-------------|
| `bodyEn` | Question text in English |
| `bodyAr` | Question text in Arabic |
| `explanationEn` | Optional explanation in English |
| `explanationAr` | Optional explanation in Arabic |

### Question Option Entity
| Field | Description |
|-------|-------------|
| `textEn` | Option text in English |
| `textAr` | Option text in Arabic |

### Question Answer Key (ShortAnswer)
| Field | Description |
|-------|-------------|
| `acceptedAnswersJsonEn` | JSON array of accepted answers in English |
| `acceptedAnswersJsonAr` | JSON array of accepted answers in Arabic |
| `rubricTextEn` | Essay rubric/model answer in English |
| `rubricTextAr` | Essay rubric/model answer in Arabic |

---

## Exam Creation Workflow

```
1. Create Exam ????????????????????? POST /api/Assessment/exams
2. Add Sections ???????????????????? POST /api/Assessment/exams/{id}/sections
3. (Optional) Add Topics ??????????? POST /api/Assessment/sections/{id}/topics
4. Add Questions ??????????????????? Choose one:
   • Manual Selection ?????????????? POST /sections/{id}/questions/manual
   • Random Selection ?????????????? POST /sections/{id}/questions/random
5. Add Instructions ???????????????? POST /api/Assessment/exams/{id}/instructions
6. Configure Access Policy ????????? PUT /api/Assessment/exams/{id}/access-policy
7. Validate Exam ??????????????????? GET /api/Assessment/exams/{id}/validate
8. Publish Exam ???????????????????? POST /api/Assessment/exams/{id}/publish
```

---

## Step 1: Create the Exam

```http
POST /api/Assessment/exams
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "departmentId": 1,
  "examType": 1,
  "titleEn": "IT Fundamentals Certification Exam",
  "titleAr": "?????? ????? ??????? ????? ?????????",
  "descriptionEn": "This exam covers fundamental IT concepts.",
  "descriptionAr": "???? ??? ???????? ???????? ???????? ?????? ?????????.",
  "startAt": "2024-02-01T09:00:00Z",
  "endAt": "2024-02-01T12:00:00Z",
  "durationMinutes": 120,
  "maxAttempts": 2,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "passScore": 70.0,
  "isActive": true
}
```

---

## Step 2: Add Exam Sections

```http
POST /api/Assessment/exams/1/sections
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "titleEn": "Section 1: Networking Fundamentals",
  "titleAr": "????? ?????: ??????? ???????",
  "descriptionEn": "This section tests your knowledge of basic networking concepts.",
  "descriptionAr": "????? ??? ????? ?????? ??????? ??????? ????????.",
  "order": 1,
  "durationMinutes": 40,
  "totalPointsOverride": null
}
```

---

## Step 3: Add Topics (Optional)

```http
POST /api/Assessment/sections/1/topics
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "titleEn": "OSI Model",
  "titleAr": "????? OSI",
  "descriptionEn": "Questions about the 7 layers of the OSI model.",
  "descriptionAr": "????? ??? ??????? ????? ?????? OSI.",
  "order": 1
}
```

---

## Step 4: Add Questions (Bilingual)

### Create a Question First (Question Bank)

```http
POST /api/QuestionBank/questions
Authorization: Bearer {token}
```

```json
{
  "bodyEn": "What layer of the OSI model is responsible for routing?",
  "bodyAr": "?? ?? ???? ????? OSI ???????? ?? ????????",
  "explanationEn": "The Network layer (Layer 3) handles routing between networks.",
  "explanationAr": "?????? ???? ?????? (?????? 3) ?? ??????? ??? ???????.",
  "questionTypeId": 1,
  "questionCategoryId": 1,
  "points": 2.0,
  "difficultyLevel": 2,
  "isActive": true,
  "options": [
    { "textEn": "Physical", "textAr": "??????????", "isCorrect": false, "order": 1 },
    { "textEn": "Data Link", "textAr": "??? ????????", "isCorrect": false, "order": 2 },
 { "textEn": "Network", "textAr": "??????", "isCorrect": true, "order": 3 },
    { "textEn": "Transport", "textAr": "?????", "isCorrect": false, "order": 4 }
  ]
}
```

### Option A: Manual Selection

```http
POST /api/Assessment/sections/1/questions/manual
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "questions": [
    { "questionId": 1, "order": 1, "pointsOverride": null },
    { "questionId": 5, "order": 2, "pointsOverride": 5.0 },
    { "questionId": 12, "order": 3, "pointsOverride": 10.0, "isRequired": false }
  ],
  "markAsRequired": true
}
```

### Option B: Random Selection

```http
POST /api/Assessment/sections/1/questions/random
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "count": 10,
  "categoryId": 1,
  "questionTypeId": 1,
  "difficultyLevel": 2,
  "useOriginalPoints": true,
  "markAsRequired": true,
  "excludeExistingInExam": true
}
```

### Response (Bilingual)

```json
{
  "success": true,
"data": [
    {
      "id": 1,
      "examId": 1,
  "examSectionId": 1,
      "questionId": 1,
      "order": 1,
      "points": 2.0,
      "isRequired": true,
      "questionBodyEn": "What layer of the OSI model is responsible for routing?",
      "questionBodyAr": "?? ?? ???? ????? OSI ???????? ?? ????????",
      "questionTypeNameEn": "MCQ_Single",
      "questionTypeNameAr": "?????? ?? ????? - ????? ?????",
      "difficultyLevelName": "Medium",
      "originalPoints": 2.0
 }
  ]
}
```

---

## Step 5: Add Instructions

```http
POST /api/Assessment/exams/1/instructions
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "contentEn": "Read all questions carefully before answering.",
  "contentAr": "???? ???? ??????? ?????? ??? ???????.",
  "order": 1
}
```

---

## Step 6: Configure Access Policy

```http
PUT /api/Assessment/exams/1/access-policy
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "isPublic": false,
  "accessCode": "IT2024CERT",
  "restrictToAssignedCandidates": false
}
```

---

## Step 7: Validate Exam

```http
GET /api/Assessment/exams/1/validate
Authorization: Bearer {token}
```

---

## Step 8: Publish Exam

```http
POST /api/Assessment/exams/1/publish
Authorization: Bearer {token}
```

---

## API Endpoints Summary

### Question Bank Endpoints (Bilingual)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/QuestionBank/questions` | Get all questions (bilingual) |
| GET | `/api/QuestionBank/questions/{id}` | Get question by ID |
| POST | `/api/QuestionBank/questions` | Create question (EN/AR body & options) |
| PUT | `/api/QuestionBank/questions/{id}` | Update question |
| DELETE | `/api/QuestionBank/questions/{id}` | Delete question |

### Question Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sections/{id}/questions` | Get questions in section |
| GET | `/topics/{id}/questions` | Get questions in topic |
| POST | `/sections/{id}/questions` | Add single question to section |
| POST | `/topics/{id}/questions` | Add single question to topic |
| POST | `/sections/{id}/questions/bulk` | Bulk add (simple, auto-order) |
| POST | `/topics/{id}/questions/bulk` | Bulk add to topic |
| **POST** | **`/sections/{id}/questions/manual`** | **Manual selection (custom order/points)** |
| **POST** | **`/topics/{id}/questions/manual`** | **Manual selection to topic** |
| **POST** | **`/sections/{id}/questions/random`** | **Random selection (by criteria)** |
| **POST** | **`/topics/{id}/questions/random`** | **Random selection to topic** |
| PUT | `/exam-questions/{id}` | Update exam question |
| DELETE | `/exam-questions/{id}` | Remove question from exam |
| POST | `/sections/{id}/questions/reorder` | Reorder questions |

---

## Lookup IDs Reference

**Question Types:**
| ID | NameEn | NameAr |
|----|--------|--------|
| 1 | MCQ_Single | ?????? ?? ????? - ????? ????? |
| 2 | MCQ_Multi | ?????? ?? ????? - ?????? ?????? |
| 3 | TrueFalse | ??/??? |
| 4 | ShortAnswer | ????? ????? |
| 5 | Essay | ????? |
| 6 | Numeric | ???? |

**Difficulty Levels:**
| Value | NameEn | NameAr |
|-------|--------|--------|
| 1 | Easy | ??? |
| 2 | Medium | ????? |
| 3 | Hard | ??? |

---

## Sample TypeScript Code (Frontend)

```typescript
interface Question {
  id: number;
  bodyEn: string;
  bodyAr: string;
  explanationEn?: string;
  explanationAr?: string;
  options: QuestionOption[];
}

interface QuestionOption {
  id: number;
  textEn: string;
  textAr: string;
  isCorrect: boolean;
  order: number;
}

// Get localized text based on current locale
function getLocalizedText(item: { en: string; ar: string }, locale: 'en' | 'ar'): string {
  return locale === 'ar' ? item.ar : item.en;
}

// Display question in current language
function displayQuestion(question: Question, locale: 'en' | 'ar') {
  const body = locale === 'ar' ? question.bodyAr : question.bodyEn;
  const options = question.options.map(opt => ({
    id: opt.id,
    text: locale === 'ar' ? opt.textAr : opt.textEn
  }));
  
  return { body, options };
}
