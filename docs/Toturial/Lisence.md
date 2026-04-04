You are my partner and senior software engineer.
this application is product live in production with many users
Time is extremely limited.
We will work smart, professional, and production ready-focused.

Rules:

- You may ask questions at any time.
- Do not change any style or color till confirm with me.
- Working on the task only.
- After finish the task give me summary Output
- Use minimal request API as you can in frontend one page

Task: Implement Secure Offline License Verification Using Digital Signature
Objective

Implement a secure offline licensing mechanism for the on-premise exam system to enforce annual subscription validity without requiring direct access to the client’s server or database.

Scope

Build a license validation flow based on digital signature so the client can use the system only when a valid signed license file exists.

Before Expiry Date 40 Days Display in Home Page Notification
after Expire Data give Grace Period ( XX Days)

This solution is intended for on-premise deployment where the client hosts the full environment internally and the vendor delivers only the published application packages.

===============================================================

His Plan

# Plan: Secure Offline License Verification with Digital Signature

## TL;DR

Implement RSA-based offline license validation for the on-premise exam system. The vendor signs a license JSON file with a private key; the deployed app validates it with the embedded public key. Includes domain-based binding (not machine), configurable grace period per client, 40-day pre-expiry warning (all users), and read-only enforcement after grace period. Admin gets a dedicated License page under Settings to view status, upload new licenses, and retrieve bound domain.

## Decisions (from user alignment)

- **Fingerprint**: Domain-based only (not machine) — client may migrate servers
- **Grace period**: Configurable per client — set in license file by vendor at signing time
- During grace period: **Full access**, just show warning banner to all users
- After grace period: **Read-only mode** (block create/update/delete on critical ops, allow viewing)
- **Invalid/Missing license**: Do NOT block — treat same as Warning (show notification only, system keeps working)
- Pre-expiry warning: **40 days** before expiry, visible to **all users** on Home Page
- License signer: **.NET Console App** (separate project in solution)
- License file location: `Backend-API/License/` folder
- Admin UI: **New separate page** under Settings section
- MaxUsers: **Metadata only** — no enforcement now
- Features: **NULL** — field exists but no gating implemented
- Background service: **Every 10 days** — middleware already validates on every authenticated request

---

## Phase 1: Backend — License Core (blocking, must be done first)

### Step 1.1: License Data Model

- Create `Backend-API/Domain/Models/LicenseData.cs` — POCO (not a DB entity, file-based)
  - Properties: `CustomerName`, `LicenseType`, `IssuedAt` (UTC), `ExpiresAt` (UTC), `GracePeriodDays` (int, configurable per client), `MaxUsers` (metadata only, no enforcement), `LicensedDomain` (string, e.g. "exams.client.com"), `Features` (string[]?, null for now), `Signature` (base64)
- Create `Backend-API/Domain/Enums/LicenseState.cs` — enum: `Active`, `Warning`, `GracePeriod`, `Expired`, `Invalid`, `Missing`

### Step 1.2: Domain Binding Validator

- Create `Backend-API/Infrastructure/Services/License/DomainBindingValidator.cs`
  - Implements `IDomainBindingValidator` interface in `Backend-API/Application/Interfaces/IDomainBindingValidator.cs`
  - Reads the incoming HTTP request's `Host` header to determine current domain
  - Compares against `LicensedDomain` in license file (case-insensitive, strips port)
  - Simple string comparison — no machine fingerprint needed

### Step 1.3: Canonical Payload Builder

- Create `Backend-API/Infrastructure/Services/License/LicenseCanonicalBuilder.cs`
  - Static method: `BuildCanonicalPayload(LicenseData license) → string`
  - Fixed field order: CustomerName|LicenseType|IssuedAt|ExpiresAt|GracePeriodDays|MaxUsers|LicensedDomain|Features
  - Dates formatted as ISO 8601 UTC (`yyyy-MM-ddTHH:mm:ssZ`)
  - Deterministic, no JSON — pipe-delimited key=value pairs

### Step 1.4: License Validation Service

- Create `Backend-API/Infrastructure/Services/License/LicenseValidationService.cs`
  - Implements `ILicenseValidationService` in `Backend-API/Application/Interfaces/ILicenseValidationService.cs`
  - Interface methods:
    - `LicenseStatusResult ValidateLicense()` — full validation
    - `LicenseState GetCurrentState()` — cached quick check
    - `void ReloadLicense()` — force re-read from file (after upload)
  - Reads `Backend-API/License/license.json` on startup + caches result
  - Validation checks (in order):
    1. File exists → if not, return `Missing`
    2. JSON deserializes → if not, return `Invalid`
    3. RSA signature valid (using embedded public key) → if not, return `Invalid`
    4. Domain match check — deferred to middleware (needs HttpContext), stored as flag
    5. Clock rollback check (current time < IssuedAt) → if true, return `Invalid`
    6. Expiry check: if expired > GracePeriodDays → `Expired`; if expired ≤ GracePeriodDays → `GracePeriod`; if ≤ 40 days remaining → `Warning`; else → `Active`
  - Returns `LicenseStatusResult` DTO with: State, DaysRemaining, GracePeriodDays, GraceDaysRemaining, CustomerName, LicenseType, IssuedAt, ExpiresAt, MaxUsers, LicensedDomain, Message
  - RSA verification: Load PEM public key from `Backend-API/License/public.pem`, verify SHA256 signature against canonical payload
  - Register as **Singleton** (cached state, thread-safe)

### Step 1.5: License Check Background Service

- Create `Backend-API/Infrastructure/Services/License/LicenseCheckBackgroundService.cs`
  - Extends `BackgroundService` (follow `VideoRetentionService` pattern)
  - Runs every **10 days** (safety net — middleware already validates on every authenticated request)
  - Calls `ILicenseValidationService.ReloadLicense()` to refresh cached state from file
  - Logs state changes (e.g., transitioned from Active → Warning)

### Step 1.6: License Enforcement Middleware

- Create `Backend-API/Infrastructure/Middleware/LicenseEnforcementMiddleware.cs`
  - Runs AFTER authentication, BEFORE controllers
  - Checks `ILicenseValidationService.GetCurrentState()` + domain binding via `IDomainBindingValidator`
  - Also calls `ReloadLicense()` if cache is stale (> 24 hours since last check) — this is the primary validation trigger
  - **Enforcement rules:**
    - `Active` / `Warning` / `GracePeriod` → pass through (no blocking)
    - `Missing` / `Invalid` → pass through (NO blocking) — show notification only via header, system keeps working
    - `Expired` (past grace period) → block mutating requests (POST/PUT/PATCH/DELETE) EXCEPT:
      - `POST /api/Auth/login` (must allow login)
      - `POST /api/license/upload` (must allow license renewal)
      - `GET *` (allow all reads)
      - Returns 403 with `{ success: false, message: "License expired. Read-only mode active.", code: "LICENSE_EXPIRED" }`
  - Add `X-License-State` response header on ALL responses (for frontend awareness)
  - Register via `app.UseLicenseEnforcement()` extension method in Program.cs (after UseAuthentication)

### Step 1.7: License API Controller

- Create `Backend-API/Controllers/Settings/LicenseController.cs`
  - `[Route("api/license")]` `[ApiController]`
  - Endpoints:
    - `GET /api/license/status` — `[Authorize]` any role → returns `LicenseStatusResult` (includes LicensedDomain)
    - `POST /api/license/upload` — `[Authorize(Roles = Admin)]` → accepts license.json file, saves to `License/` folder, calls `ReloadLicense()`, returns new status

### Step 1.8: Service Registration in Program.cs

- Register `IDomainBindingValidator` → `DomainBindingValidator` (Singleton)
- Register `ILicenseValidationService` → `LicenseValidationService` (Singleton)
- Register `LicenseCheckBackgroundService` as hosted service
- Add `app.UseLicenseEnforcement()` in middleware pipeline after `app.UseAuthorization()`

---

## Phase 2: Vendor License Signer Tool (parallel with Phase 3)

### Step 2.1: Create Console App Project

- Create `LicenseSigner/` folder at solution root (sibling to Backend-API)
- New .NET Console App: `LicenseSigner.csproj`
- Add to `Smart_Core.sln`

### Step 2.2: Key Generation Command

- `generate-keys` command → generates RSA-2048 keypair
  - Saves `private.pem` (vendor keeps, NEVER deployed)
  - Saves `public.pem` (copy to `Backend-API/License/public.pem`)

### Step 2.3: License Signing Command

- `sign-license` command → interactive prompts for: CustomerName, LicenseType, ExpiresAt, GracePeriodDays, MaxUsers, LicensedDomain
  - Builds canonical payload using same `LicenseCanonicalBuilder` logic
  - Signs with RSA-SHA256 using `private.pem`
  - Outputs `license.json` with all fields + base64 signature (Features = null)

### Step 2.4: License Verification Command (testing utility)

- `verify-license` command → reads license.json + public.pem → validates signature, prints result

---

## Phase 3: Frontend (parallel with Phase 2)

### Step 3.1: License Status API Function

- Create `Frontend/Smart-Exam-App-main/lib/api/license.ts`
  - `getLicenseStatus()` → `GET /license/status`
  - `getServerFingerprint()` → `GET /license/fingerprint`
  - `uploadLicense(file: File)` → `POST /license/upload`

### Step 3.2: License Warning Banner on Dashboard Home

- Modify `Frontend/Smart-Exam-App-main/app/(dashboard)/dashboard/page.tsx`
  - Add a single API call to `getLicenseStatus()` alongside existing dashboard calls
  - Show warning banner at TOP of page when state is `Warning`, `GracePeriod`, `Expired`, or `Invalid`/`Missing`
  - Banner variants:
    - Warning (yellow): "License expires in X days" — state: Warning
    - Orange: "License expired. Grace period: X days remaining" — state: GracePeriod
    - Red: "License expired. System is in read-only mode" — state: Expired
    - Red: "No valid license. Contact administrator" — state: Invalid/Missing
  - Use existing `Alert` component from `components/ui/alert.tsx`
  - Bilingual (Arabic/English) using i18n

### Step 3.3: Admin License Management Page

- Create `Frontend/Smart-Exam-App-main/app/(dashboard)/settings/license/page.tsx`
  - Single page with ONE initial API call (`getLicenseStatus()`)
  - Sections:
    1. **License Status Card** — state badge, customer name, license type, issue date, expiry date, days remaining
    2. **Server Fingerprint Card** — display fingerprint (loaded on demand via `getServerFingerprint()`)
    3. **Upload License Card** — file upload for license.json, calls `uploadLicense()`, refreshes status
  - Admin only (role check)

### Step 3.4: Sidebar Navigation Update

- Modify `Frontend/Smart-Exam-App-main/components/layout/sidebar.tsx`
  - Add "License" nav item under Administration group (Admin role only)
  - Route: `/settings/license`

### Step 3.5: Global License State Handling (API Client)

- Modify `Frontend/Smart-Exam-App-main/lib/api-client.ts`
  - On 403 response with code `LICENSE_EXPIRED` or `LICENSE_INVALID` → show toast notification with appropriate message
  - Read `X-License-State` header if present

---

## Relevant Files

### Backend — New Files

- `Backend-API/Domain/Models/LicenseData.cs` — license file POCO model
- `Backend-API/Domain/Enums/LicenseState.cs` — state enum
- `Backend-API/Application/Interfaces/IServerFingerprintProvider.cs` — fingerprint interface
- `Backend-API/Application/Interfaces/ILicenseValidationService.cs` — validation interface
- `Backend-API/Infrastructure/Services/License/ServerFingerprintProvider.cs` — fingerprint impl
- `Backend-API/Infrastructure/Services/License/LicenseCanonicalBuilder.cs` — canonical payload builder
- `Backend-API/Infrastructure/Services/License/LicenseValidationService.cs` — core validation service
- `Backend-API/Infrastructure/Services/License/LicenseCheckBackgroundService.cs` — hourly check service
- `Backend-API/Infrastructure/Middleware/LicenseEnforcementMiddleware.cs` — request enforcement middleware
- `Backend-API/Controllers/Settings/LicenseController.cs` — API endpoints
- `Backend-API/License/public.pem` — RSA public key (shipped with app)
- `Backend-API/License/license.json` — license file (placed by client/admin)

### Backend — Modified Files

- `Backend-API/Program.cs` — register services, add middleware

### Vendor Tool — New Project

- `LicenseSigner/LicenseSigner.csproj` — console app project
- `LicenseSigner/Program.cs` — key generation + license signing CLI

### Frontend — New Files

- `Frontend/Smart-Exam-App-main/lib/api/license.ts` — API functions
- `Frontend/Smart-Exam-App-main/app/(dashboard)/settings/license/page.tsx` — admin license page

### Frontend — Modified Files

- `Frontend/Smart-Exam-App-main/app/(dashboard)/dashboard/page.tsx` — add license warning banner
- `Frontend/Smart-Exam-App-main/components/layout/sidebar.tsx` — add License nav item
- `Frontend/Smart-Exam-App-main/lib/api-client.ts` — handle license 403 responses

---

## Verification

1. **Generate keypair** using signer tool → verify `private.pem` and `public.pem` created
2. **Generate fingerprint** → call `GET /api/license/fingerprint` → confirm stable hash returned
3. **Sign a test license** using signer tool with fingerprint → verify `license.json` created
4. **Place license.json + public.pem** in `Backend-API/License/` → restart backend
5. **No license test** → remove license.json → verify system blocks mutating requests (returns 403 LICENSE_INVALID)
6. **Invalid signature test** → modify any field in license.json → verify system rejects as Invalid
7. **Expired license test** → sign a license with past expiry (> 30 days ago) → verify read-only enforcement
8. **Grace period test** → sign a license expired 5 days ago → verify full access + GracePeriod state
9. **Warning test** → sign license expiring in 20 days → verify Warning state + dashboard banner
10. **Upload flow** → login as admin → go to license page → upload new valid license → verify status updates
11. **Clock rollback** → sign license, then set IssuedAt to future → verify rejection
12. **Fingerprint binding** → use fingerprint from different machine → verify rejection
13. **Frontend banner** → verify warning banner shows on dashboard with correct state/colors for all roles
14. **i18n** → test both Arabic and English for all license messages

---

## Security Considerations

- Private key NEVER deployed. Only `public.pem` (verification only) ships with the app
- RSA-2048 with SHA-256 signing ensures tamper-proof license files
- Canonical payload prevents JSON serialization ambiguity attacks
- Server fingerprint prevents license copying between machines
- Clock rollback check (current time < IssuedAt) prevents trivial time manipulation
- License upload endpoint is admin-only with authentication
- File upload validates JSON structure before saving (prevents malicious file injection)
- No database dependency for license — purely file-based (works offline)

===============================================
=============== Result ==============
Vendor Signer Tool (new project)

File Purpose
LicenseSigner.csproj .NET 8 Console App
Program.cs generate-keys, sign-license, verify-license commands

How to Use
Generate keys (vendor, one-time): dotnet run -- generate-keys
Sign license (per client): dotnet run -- sign-license → enter customer name, domain, grace period days
Deploy: Place license.json + public.pem in License
Renew: Admin uploads new license.json from Settings → License page (no restart needed)

Part 1: Step-by-Step Usage Guide
Step 1: Generate RSA Keypair (One-Time, Vendor Only)
This is done once by you (OrbitX/vendor). You keep the private key forever, and deploy only the public key.

Output:

Result: Two files created in LicenseSigner:

private.pem — NEVER give this to any client. Store it safely.
public.pem — Copy to every client's public.pem
Step 2: Sign a License for a Client
Each client gets their own license file signed by you.

Interactive prompts:

Output:

Generated license.json:

Step 3: Verify the License (Optional, for Testing)
Output:

Step 4: Deploy to Client
Send the client two files:

File Destination Notes
public.pem public.pem Only needed once (unless you regenerate keys)
license.json license.json New file every renewal
Two ways to deploy the license:

Option A — File copy (initial deployment):
Place both files in the server's License folder before or after starting the app.

Option B — Admin upload (renewal, no restart needed):

Admin logs into the frontend
Navigate to Settings → License
Click "Upload License" and select the new license.json
The system validates and reloads immediately — no server restart needed
Step 5: What Users See
License State Who Sees What Happens
Active (>40 days left) Nobody Normal operation, no banner
Warning (≤40 days left) All users Yellow banner on dashboard: "License expires in X days"
GracePeriod (expired, within grace days) All users Orange banner: "License expired. Grace period: X days remaining" — full access still works
Expired (past grace period) All users Red banner: "License expired. System is in read-only mode" — POST/PUT/PATCH/DELETE blocked, GET allowed
Missing (no license.json) All users Yellow banner: "No valid license found" — system keeps working (no blocking)
Invalid (tampered/bad signature) All users Yellow banner: "Invalid license" — system keeps working (no blocking)
Step 6: Renewal Flow
When a client's license is about to expire:

Client contacts you for renewal
You run dotnet run -- sign-license with new dates for their domain
Send them the new license.json
Client's admin uploads it via Settings → License page
Done — no server restart needed, effect is immediate
Part 2: Deploying Without License
You have two options:

Option A: Just Don't Include a License File (Recommended for Internal Use)
Based on the current implementation in the LicenseEnforcementMiddleware.cs:78-85 and LicenseValidationService.cs:102-108:

If license.json is missing → state = Missing
Missing state → NO blocking at all — the system works 100% normally
The only effect: a yellow warning banner on the dashboard saying "No valid license found"
So yes, you can deploy without any license and the system fully works. The warning banner is just a visual reminder.

Option B: Sign a Very Long License (Recommended for Paying Clients You Don't Want to Hassle)
This gives a license valid until 2126. State will always be Active, no warnings ever shown.

Summary
Scenario What to Do Result
No license at all Don't place any files in License/ System works fully, just shows yellow warning banner
Long-term client Sign with 36500 days (100 years) Active forever, no warnings
Annual subscription Sign with 365 days, 30 grace Normal flow with warnings at 40 days
Trial Sign with 30 days, 7 grace Short trial period
The system was designed this way intentionally — Missing/Invalid = warning only, never blocking — so you can deploy freely without a license for internal or development use.

=============================
You already have a key — no need to generate a new one
The keypair was generated during the implementation and already exists:

File Location Status
private.pem private.pem Already exists — keep this safe, never share
public.pem public.pem Already exists
public.pem public.pem Already deployed
license.json license.json Already deployed (test license for "Build4 IT" / "localhost")
You only need generate-keys again if you lose the private key or want to rotate keys (which would invalidate all existing licenses).
===
Where to Run
All commands run from the LicenseSigner folder:
==

Commands Reference

1. Generate keys (one-time, already done):

You do NOT need to run this again. Your keys are already in place.

2. Sign a new license for a client (or renew):

Then follow the prompts:

3. Verify a license (optional, for testing):

4. Deploy the signed license to the backend:

Renewal is the exact same command as new
There's no difference between "new" and "renew" — just run dotnet run -- sign-license again with the same client's domain and new validity period. Then either:

Copy the file to License on the server, OR
Admin uploads it via the frontend at Settings → License (no restart needed)

Renewal is the exact same command as new
There's no difference between "new" and "renew" — just run dotnet run -- sign-license again with the same client's domain and new validity period. Then either:

Copy the file to License on the server, OR
Admin uploads it via the frontend at Settings → License (no restart needed)
Quick Summary
Action Command When
Generate keys dotnet run -- generate-keys Already done. Only if you lose private.pem
New / Renew license dotnet run -- sign-license Every time a client needs a new or renewed license
Verify dotnet run -- verify-license license.json Optional, to double-check before sending to client
Deploy Copy license.json to License or admin uploads via UI After signing
