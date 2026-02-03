# Candidate Dashboard - API Implementation Summary

## Endpoint Created

```
GET /api/Candidate/dashboard
```

**Authentication:** Required (Candidate role)  
**Authorization:** Bearer Token

---

## Response Structure

### 1. Welcome Section
```json
{
  "candidateName": "Ali Mahmoud",
  "candidateEmail": "ali@example.com",
  "currentDateUtc": "2026-01-18T10:30:00Z"
}
```

---

### 2. Statistics Cards

```json
{
  "stats": {
  "totalExamsAvailable": 12,
"totalExamsAvailableChangePercent": 12,  // +12%
    "totalAttempts": 156,
    "totalAttemptsChangePercent": 8,      // +8%
    "passRate": 72.5,     // 72.5%
    "pendingGrading": 8
  }
}
```

**Maps to UI Cards:**
- 📋 **Total Exams:** 12 (+12%)
- 📝 **Total Attempts:** 156 (+8%)
- ✅ **Pass Rate:** 72.5%
- ⏳ **Pending Grading:** 8

---

### 3. Exams by Status

```json
{
  "examsByStatus": {
    "upcomingCount": 5,  // 📅 Upcoming
    "activeCount": 2,    // ⏱️ Active (in progress)
    "completedCount": 10   // ✅ Completed
  }
}
```

**Maps to UI:**
- Shows exam distribution in "My Exams" section
- Allows filtering by status tabs

---

### 4. Quick Actions (Active Attempts)

```json
{
  "quickActions": [
    {
      "attemptId": 42,
      "examId": 5,
      "examTitleEn": "Physics Midterm",
      "examTitleAr": "امتحان منتصف الفصل - الفيزياء",
      "actionType": "Resume",
      "expiresAt": "2026-01-18T12:00:00Z",
      "remainingMinutes": 85
    }
  ]
}
```

**Maps to UI:**
- **Quick Actions** widget with "Resume" buttons
- Shows countdown timer for each active attempt
- Red/urgent styling if `remainingMinutes < 30`

---

### 5. Upcoming Exams

```json
{
  "upcomingExams": [
    {
      "examId": 8,
      "titleEn": "Chemistry Final",
      "titleAr": "الامتحان النهائي - الكيمياء",
      "examType": 0,
      "startAt": "2026-01-20T09:00:00Z",
      "endAt": "2026-01-20T13:00:00Z",
   "durationMinutes": 120,
      "totalQuestions": 40,
  "totalPoints": 80.00,
      "attemptsUsed": 0,
      "maxAttempts": 3
    }
  ]
}
```

**Maps to UI:**
- **Upcoming Exams** list (next 5)
- Shows start date/time
- Shows attempts remaining
- "Start Exam" button

---

### 6. Recent Activity

```json
{
  "recentActivity": [
    {
      "activityType": "Result Published",
      "examId": 3,
    "examTitleEn": "Mathematics Quiz",
  "examTitleAr": "اختبار الرياضيات",
      "attemptId": 35,
    "activityDate": "2026-01-17T14:30:00Z",
      "description": "Passed",
      "score": 85.00,
      "isPassed": true
    },
    {
      "activityType": "Attempt Submitted",
      "examId": 4,
      "examTitleEn": "English Exam",
      "examTitleAr": "امتحان اللغة الإنجليزية",
      "attemptId": 40,
      "activityDate": "2026-01-16T11:20:00Z",
      "description": "Attempt #2 submitted",
      "score": null,
      "isPassed": null
    },
    {
      "activityType": "Attempt Started",
      "examId": 5,
  "examTitleEn": "Physics Midterm",
      "examTitleAr": "امتحان منتصف الفصل - الفيزياء",
    "attemptId": 42,
      "activityDate": "2026-01-18T10:15:00Z",
      "description": "Attempt #1 in progress",
      "score": null,
      "isPassed": null
 }
  ]
}
```

**Activity Types:**
- 🎯 **Result Published** - Shows score and pass/fail
- 📤 **Attempt Submitted** - Waiting for grading
- ▶️ **Attempt Started** - Currently in progress

**Maps to UI:**
- **Recent Activity** timeline (last 10 items)
- Chronological order (most recent first)
- Icons and colors per activity type
- Clickable to navigate to relevant page

---

## UI Layout Suggestion

```
┌─────────────────────────────────────────────────────────────┐
│ Welcome back, Ali!               │
│ Sunday, January 18, 2026          │
├─────────────────────────────────────────────────────────────┤
│        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ Total    │ │ Total    │ │ Pass     │ │ Pending  │      │
│ │ Exams    │ │ Attempts │ │ Rate     │ │ Grading  │      │
│ │ 12 +12%  │ │ 156 +8%  │ │ 72.5%    │ │ 8        ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│      │
├─────────────────────────────────────────────────────────────┤
│ Quick Actions  │ Upcoming Exams   │
│ ┌───────────────────────────┐ │ ┌────────────────────────┐ │
│ │ ⏱️ Physics Midterm         │ │ │ 📅 Chemistry Final      │ │
│ │ Resume - 85 min left      │ │ │ Jan 20, 09:00 - 120min │ │
│ │ [Resume Exam]             │ │ │ 0/3 attempts           │ │
│ └───────────────────────────┘ │ │ [Start Exam]           │ │
│      │ └────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Recent Activity          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Result Published - Mathematics Quiz - Passed (85)    │ │
│ │ 📤 Attempt Submitted - English Exam           │ │
│ │ ▶️ Attempt Started - Physics Midterm       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

My Exams
┌─────────────────────────────────────────────────────────────┐
│ [📅 Upcoming (5)] [⏱️ Active (2)] [✅ Completed (10)]        │
│            │
│ (Empty state or list based on selected tab)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### Statistics Calculation

1. **Total Exams Available**
   - All published + active exams
   - Filtered by department (if not Candidate role)

2. **Total Attempts**
 - All attempts by candidate (any status)

3. **Pass Rate**
   - (Passed Results / Total Results) × 100
   - Only counts graded results

4. **Pending Grading**
   - Submitted attempts without results yet

### Exams by Status Logic

- **Upcoming:** Not started, no active attempt
- **Active:** Has active attempt (Started or InProgress)
- **Completed:** Has at least one result

### Quick Actions Logic

- Only shows attempts with status: `Started` or `InProgress`
- Calculates remaining time from `expiresAt`
- Ordered by expiry time (urgent first)

### Recent Activity Logic

- Combines attempts and results
- Last 10 activities total
- Ordered by date descending
- Activity types:
  - Attempt Started (from attempts)
  - Attempt Submitted (from attempts)
  - Result Published (from results where published = true)

---

## TypeScript Interface

```typescript
interface CandidateDashboard {
candidateName: string;
  candidateEmail: string;
  currentDateUtc: string;
  
stats: DashboardStats;
  examsByStatus: ExamsByStatus;
  quickActions: QuickAction[];
  upcomingExams: UpcomingExam[];
  recentActivity: RecentActivity[];
}

interface DashboardStats {
  totalExamsAvailable: number;
  totalExamsAvailableChangePercent: number;
  totalAttempts: number;
  totalAttemptsChangePercent: number;
  passRate: number;
  pendingGrading: number;
}

interface ExamsByStatus {
  upcomingCount: number;
  activeCount: number;
  completedCount: number;
}

interface QuickAction {
  attemptId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  actionType: "Resume";
  expiresAt: string;
  remainingMinutes: number;
}

interface UpcomingExam {
  examId: number;
  titleEn: string;
  titleAr: string;
  examType: 0 | 1; // Flex | Fixed
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  attemptsUsed: number;
  maxAttempts: number;
}

interface RecentActivity {
  activityType: "Attempt Started" | "Attempt Submitted" | "Result Published";
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  attemptId: number | null;
  activityDate: string;
  description: string;
  score: number | null;
  isPassed: boolean | null;
}
```

---



## Summary

✅ **Single Endpoint** - One call gets all dashboard data  
✅ **Performance** - Optimized queries with proper includes  
✅ **Complete Data** - All sections populated in one response  
✅ **Bilingual** - English and Arabic support  
✅ **Real-time** - Calculates remaining minutes dynamically  
✅ **Type-safe** - Full TypeScript interfaces provided  
✅ **Tested** - Build successful, ready for integration  

The dashboard endpoint provides everything the frontend needs to render a complete, informative candidate dashboard with minimal API calls!
