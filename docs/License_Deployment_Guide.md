# License Deployment Guide — Multiple Domains

> How to generate and deploy licenses when deploying the Smart Exam system to two (or more) different domains.

---

## Overview

Each deployment (domain) requires its **own unique license file** (`license.json`).  
All licenses are signed with the **same RSA private key** (vendor-side).  
All deployments share the **same public key** (`public.pem`).

```
┌─────────────────────────────────────────────────┐
│  VENDOR MACHINE  (LicenseSigner tool)           │
│                                                 │
│  private.pem  ← NEVER leaves this machine       │
│  public.pem   ← copy to EVERY deployment        │
│                                                 │
│  sign-license → license for exams.clientA.com   │
│  sign-license → license for exams.clientB.com   │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐   ┌──────────────────┐
│ Server A         │   │ Server B         │
│ exams.clientA.com│   │ exams.clientB.com│
│                  │   │                  │
│ License/         │   │ License/         │
│  ├─ public.pem   │   │  ├─ public.pem   │
│  └─ license.json │   │  └─ license.json │
│     (domain: A)  │   │     (domain: B)  │
└──────────────────┘   └──────────────────┘
```

---

## Prerequisites

| Item | Location | Notes |
|------|----------|-------|
| LicenseSigner tool | `LicenseSigner/` folder | .NET 8 console app |
| RSA keypair | Generated once by vendor | `private.pem` + `public.pem` |
| Domain names | The exact domains where the system will run | e.g., `exams.clientA.com`, `exams.clientB.com` |

---

## Step-by-Step Instructions

### Step 1 — Generate RSA Keys (One-Time Only)

> Skip this step if you already have `private.pem` and `public.pem` from a previous run.

```powershell
cd LicenseSigner
dotnet run -- generate-keys
```

**Output:**
```
✅ RSA-2048 keypair generated successfully.
   private.pem — KEEP SECRET (vendor only, NEVER deploy)
   public.pem  — Copy this to Backend-API/License/public.pem
```

**Files created:**
- `LicenseSigner/private.pem` — **KEEP SECRET**, never share, never deploy to any server
- `LicenseSigner/public.pem` — Will be copied to every deployment

> ⚠️ **IMPORTANT**: You generate keys **ONCE**. The same keypair is used to sign licenses for ALL clients/domains.

---

### Step 2 — Sign License for Domain A

```powershell
cd LicenseSigner
dotnet run -- sign-license
```

The tool will prompt you interactively. Enter the details for **Domain A**:

```
═══ License Signing ═══

Customer Name: Client A Company
License Type (e.g., Standard, Enterprise, Trial): Standard
Licensed Domain (e.g., exams.client.com): exams.clientA.com
Max Users (0 = unlimited): 100
Grace Period Days (default 30): 30
Validity in days from now (default 365): 365
```

**Output:**
```
✅ License signed successfully!
   Output: license_Client_A_Company_20260404.json (and license.json)
   Customer: Client A Company
   Domain: exams.clientA.com
   Type: Standard
   Valid: 2026-04-04 → 2027-04-04
   Grace Period: 30 days
   Max Users: 100
```

**Files created:**
- `LicenseSigner/license_Client_A_Company_20260404.json` — named copy (for your archive)
- `LicenseSigner/license.json` — working copy (will be overwritten by next sign)

**Rename/save the license file for clarity:**
```powershell
copy license_Client_A_Company_20260404.json license_domainA.json
```

---

### Step 3 — Sign License for Domain B

Run the signer again for the second domain:

```powershell
dotnet run -- sign-license
```

Enter the details for **Domain B**:

```
═══ License Signing ═══

Customer Name: Client B Company
License Type (e.g., Standard, Enterprise, Trial): Enterprise
Licensed Domain (e.g., exams.client.com): exams.clientB.com
Max Users (0 = unlimited): 500
Grace Period Days (default 30): 45
Validity in days from now (default 365): 365
```

**Output:**
```
✅ License signed successfully!
   Output: license_Client_B_Company_20260404.json (and license.json)
   Customer: Client B Company
   Domain: exams.clientB.com
   Type: Enterprise
   Valid: 2026-04-04 → 2027-04-04
   Grace Period: 45 days
   Max Users: 500
```

---

### Step 4 — Verify Both Licenses (Optional but Recommended)

```powershell
dotnet run -- verify-license license_Client_A_Company_20260404.json
```
```
  Customer:      Client A Company
  Domain:        exams.clienta.com
  ✅ Signature: VALID
  ✅ Status: ACTIVE (365 days remaining)
```

```powershell
dotnet run -- verify-license license_Client_B_Company_20260404.json
```
```
  Customer:      Client B Company
  Domain:        exams.clientb.com
  ✅ Signature: VALID
  ✅ Status: ACTIVE (365 days remaining)
```

---

### Step 5 — Deploy to Server A (`exams.clientA.com`)

On the deployment server for Domain A, ensure this folder structure exists:

```
Backend-API/
  └── License/
        ├── public.pem        ← same public key for all deployments
        └── license.json      ← the license signed for exams.clientA.com
```

**Commands on Server A:**
```bash
# Create the License directory if it doesn't exist
mkdir -p /path/to/Backend-API/License

# Copy the public key (same for all servers)
cp public.pem /path/to/Backend-API/License/public.pem

# Copy Domain A's license (rename to license.json)
cp license_Client_A_Company_20260404.json /path/to/Backend-API/License/license.json
```

---

### Step 6 — Deploy to Server B (`exams.clientB.com`)

On the deployment server for Domain B:

```
Backend-API/
  └── License/
        ├── public.pem        ← same public key (identical to Server A)
        └── license.json      ← the license signed for exams.clientB.com
```

**Commands on Server B:**
```bash
mkdir -p /path/to/Backend-API/License

# Copy the SAME public key
cp public.pem /path/to/Backend-API/License/public.pem

# Copy Domain B's license (rename to license.json)
cp license_Client_B_Company_20260404.json /path/to/Backend-API/License/license.json
```

---

### Step 7 — Start the Application & Verify

After deploying, start the backend on each server and verify the license is active:

**Via API:**
```bash
# On Server A
curl https://exams.clientA.com/api/license/status -H "Authorization: Bearer <token>"

# On Server B
curl https://exams.clientB.com/api/license/status -H "Authorization: Bearer <token>"
```

**Expected response (Active license):**
```json
{
  "success": true,
  "data": {
    "state": 0,
    "stateText": "Active",
    "daysRemaining": 365,
    "gracePeriodDays": 30,
    "customerName": "Client A Company",
    "licenseType": "Standard",
    "licensedDomain": "exams.clienta.com",
    "maxUsers": 100,
    "message": "License is active. 365 days remaining."
  }
}
```

**Via Frontend:**  
Login as Admin → Settings → License → Verify the status card shows **Active** (green).

---

## What Happens If...

| Scenario | Behavior |
|----------|----------|
| **No license file deployed** | System runs normally with a warning. No blocking. |
| **Wrong domain** (license says `clientA.com` but app runs on `clientB.com`) | Creates, updates, deletes are **blocked** (middleware returns 403). Reads still work. |
| **License expired, within grace period** | System shows orange warning banner. All operations continue. |
| **License expired, grace period also ended** | POST/PUT/PATCH/DELETE are **blocked**. GET requests still work. License upload still works. |
| **Tampered license file** | Treated as Invalid. System runs with warning, no blocking. |
| **Same license on both servers** | Only the server matching the `licensedDomain` will work fully. The other will have domain mismatch. |

---

## Quick Reference — Command Summary

```powershell
# All commands run from the LicenseSigner/ folder

# 1. Generate keys (one-time)
dotnet run -- generate-keys

# 2. Sign license for a domain (interactive)
dotnet run -- sign-license

# 3. Verify a license file
dotnet run -- verify-license license_ClientName_20260404.json
```

---

## Deployment Checklist

- [ ] RSA keypair generated (`private.pem` stored securely by vendor)
- [ ] License signed for Domain A with correct domain name
- [ ] License signed for Domain B with correct domain name
- [ ] Both licenses verified with `verify-license`
- [ ] **Server A**: `public.pem` + `license.json` (Domain A) placed in `Backend-API/License/`
- [ ] **Server B**: `public.pem` + `license.json` (Domain B) placed in `Backend-API/License/`
- [ ] Both servers restarted after placing license files
- [ ] `/api/license/status` returns `Active` on both servers
- [ ] Admin dashboard shows green license status on both deployments

---

## Security Reminders

| Rule | Details |
|------|---------|
| **NEVER deploy `private.pem`** | The private key stays on the vendor's machine only |
| **`public.pem` is safe to deploy** | It can only verify signatures, not create them |
| **Each domain gets its own `license.json`** | You cannot reuse one domain's license on another domain |
| **License files are tamper-proof** | Any modification invalidates the RSA signature |
| **Keep an archive of signed licenses** | Store named copies (e.g., `license_ClientA_20260404.json`) for reference |

---

## Renewing a License

When a license is approaching expiry (40-day warning banner will appear):

1. Run `dotnet run -- sign-license` on the vendor machine with a new validity period
2. Use the **same domain name** as before
3. Transfer the new `license.json` to the server
4. Either:
   - Replace `Backend-API/License/license.json` and restart the application, **OR**
   - Upload via Admin UI: **Settings → License → Upload License** (no restart required)

The system will pick up the new license automatically.
