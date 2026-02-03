# Smart Exam System - Runbook

## Prerequisites
- .NET 9 SDK
- Node.js 18+ (npm or pnpm)
- SQL Server (local or remote)

---

## 1. Run Backend

```powershell
cd Backend-API
dotnet run
```

Backend starts at **http://localhost:5221**
- Swagger UI: http://localhost:5221

### Database
- Migrations run automatically in Development
- Connection string: `appsettings.json` → `ConnectionStrings:DefaultConnection`

### Seed Demo Data
Call the seed endpoint (requires SeedKey in headers or config):
```
POST /api/Seed/run
Header: X-Seed-Key: demo26
```
Or run seed via app startup if configured.

---

## 2. Run Frontend

```powershell
cd Frontend/Smart-Exam-App-main
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

### Environment
Create `.env.local` (already done if following setup):
```
BACKEND_URL=http://localhost:5221/api
```

---

## 3. Demo Users (from DatabaseSeeder)

Check `Infrastructure/Data/DatabaseSeeder.cs` for seeded users. Typical structure:
- **Admin**: admin@smartcore.com (or similar)
- **Instructor**: instructor@smartcore.com
- **Candidate**: candidate@smartcore.com

Passwords are set in the seeder (e.g. `Exam@123` or similar). Verify in `DatabaseSeeder.cs`.

---

## 4. Full Candidate Journey - Step-by-Step Test

### Step 1: Login as Candidate
1. Go to http://localhost:3000/login
2. Login with a candidate user (e.g. candidate@smartcore.com)
3. You should land on the dashboard or my-exams

### Step 2: View Available Exams
1. Navigate to **My Exams** (`/my-exams`)
2. You should see published exams (tabs: Upcoming, Active, Completed)
3. If you have an active attempt, a "Resume" card appears at the top

### Step 3: Start an Exam
1. For an **Active** exam, click **Start Exam**
2. You are taken to Instructions (`/take-exam/{examId}/instructions`)
3. If access code is required, enter it
4. Check the agreement checkbox
5. Click **Start Exam**
6. You are redirected to the exam page (`/take-exam/{attemptId}`)

### Step 4: Take the Exam
1. Answer questions (MCQ: select options; Essay: type text)
2. Use Previous/Next to navigate (if not locked by exam settings)
3. Answers autosave (bulk save on navigation)
4. Timer counts down; when it hits 0, exam auto-submits
5. Click **Submit** when done; confirm in the dialog

### Step 5: View Result
1. After submit, you see the result summary (if exam allows)
2. For fully auto-graded exams, scores appear immediately
3. For exams with manual grading, you see "Results will be available after grading"
4. Go to **My Results** or **Results** to view when published

### Step 6: Reviewer Flow (Admin/Instructor)
1. Login as Admin or Instructor
2. Go to **Grading** (`/grading`)
3. See list of submissions needing manual grading
4. Click **Grade** on a submission
5. For each manual question: enter points, feedback, click **Save**
6. When all are graded, click **Finalize**
7. Result is created and candidate can see it after admin publishes (ExamResult → Publish)

---

## 5. API Proxy

All API calls go through Next.js proxy: `/api/proxy` → `BACKEND_URL`
- Ensures same-origin for cookies/auth
- No CORS issues

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 on API calls | Login again; check token in localStorage |
| Proxy 500 / "Failed to connect" | Ensure backend is running on port 5221; check BACKEND_URL |
| Grading page empty | Ensure there are submitted attempts with manual questions (e.g. Essay) |
| Result not visible to candidate | Publish the result from ExamResult API or admin UI |
| Build fails (file locked) | Stop the running backend (`dotnet run`) before building |

---

## 7. Certificates Migration

After pulling the latest code: stop the backend, then run `dotnet ef database update` in Backend-API. Migration `AddCertificates` creates the Certificates table. Migrations also run automatically on `dotnet run` in Development.

---

## 8. Key Configuration

### Backend (`appsettings.json`)
- `ConnectionStrings:DefaultConnection` - SQL Server
- `JwtSettings` - token secret, expiry
- `AppSettings:SeedKey` - for demo seed (e.g. `demo26`)

### Frontend
- `BACKEND_URL` in `.env.local` - backend API base URL
