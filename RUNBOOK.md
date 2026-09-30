# Smart Exam System - Runbook

## Prerequisites
- .NET 9 SDK
- Node.js 20.9+ with Corepack and the repository-pinned `pnpm` version
- SQL Server (local or remote)
- EF Core 9 CLI (`dotnet-ef`) for database migrations

---

## 1. Run Backend

Create an ignored `Backend-API/appsettings.Development.json` or supply environment variables for the local SQL Server connection, JWT signing key, and encryption key. Both keys must contain at least 32 characters; never put local credentials in tracked configuration. Use a disposable development database.

```sh
cd Backend-API
dotnet restore
dotnet build --no-restore
```

After applying the database migrations below, start in the Development environment:

```sh
ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --no-build --urls http://localhost:5221
```

Backend and Swagger UI start at **http://localhost:5221**. Swagger is also available when `Swagger:Enabled` is explicitly configured.

### Database
- Migrations are **manual**, including in Development.
- The runtime uses `ConnectionStrings:DefaultConnection` from normal ASP.NET configuration, including ignored development settings and environment overrides.
- The design-time factory reads only tracked `appsettings.json`. Always pass the intended development connection explicitly to the EF CLI; do not rely on the runtime override to select the migration target.

From `Backend-API`, with the EF Core 9 CLI on `PATH`:

```sh
dotnet ef database update --no-build --connection "<local SQL Server connection string>"
```

Keep the connection value private and preserve TLS certificate verification. For a local CA, configure the client trust store before connecting.

### Seed Demo Data
Call the seed endpoint (requires SeedKey in headers or config):
```
POST /api/Seed
Header: X-Seed-Key: <configured AppSettings:SeedKey>
```
This creates the initial roles and administrator. `/api/Seed/demo-data` adds the documented demo users and lookups to the development database. Neither migrations nor seeding run automatically at API startup.

---

## 2. Run Frontend

```powershell
cd Frontend/Smart-Exam-App-main
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Frontend starts at **http://localhost:3000**

### Environment
Create an ignored `.env.local`:
```
BACKEND_URL=http://localhost:5221/api
```

Do not set `NODE_ENV=prod`.
- Leave `NODE_ENV` unset for local `pnpm dev` / `pnpm build`, or use the standard value `production` when a hosting platform requires it.

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

## 7. Validate a Fresh Checkout

Run `dotnet test Backend-API.Tests/Backend-API.Tests.csproj` from the repository root. SQL Server and Redis integration tests use the optional local test settings documented in their fixtures; keep test databases separate from the application database.

From `Frontend/Smart-Exam-App-main`, run `corepack pnpm typecheck`, `corepack pnpm lint`, and `corepack pnpm build`. After switching branches, regenerate Next.js output with a build before interpreting errors in ignored `.next/types` files as source errors.

In a cloud environment with an injected system CA, set `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` for Next.js build/dev so font downloads retain certificate verification. Verify the API's Swagger document, `/api/Organization/branding`, and a login through the frontend proxy before considering full-stack startup ready.

---

## 8. Key Configuration

### Backend (ignored development configuration or environment variables)
- `ConnectionStrings:DefaultConnection` - SQL Server
- `JwtSettings` - token secret, expiry
- `EncryptionSettings:Key` - local development encryption key
- `AppSettings:SeedKey` - protects the initial seed endpoint

### Frontend
- `BACKEND_URL` in `.env.local` - backend API base URL
