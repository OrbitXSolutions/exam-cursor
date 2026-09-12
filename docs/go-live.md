لاااااااااااا اقصد بالتفصيل يعني مش نقول سيرفر نقول نوع السيفر ايه والرامات والخ الخ

خد شوية تفاصيل من agnet ai اهي

Here is the Infrastructure Prerequisites section based entirely on the actual codebase and deployment configuration:

Infrastructure Prerequisites — On-Premise Deployment

1. Server Requirements

Component Minimum Requirement

Operating System Windows Server 2019 or later

Web Server IIS with ASP.NET Core Module v2 (AspNetCoreModuleV2)

Runtime .NET 9 Hosting Bundle (ASP.NET Core Runtime + IIS Hosting Bundle)

Database Engine Microsoft SQL Server 2019 or later

Node.js v20+ (required to serve the Next.js frontend)

WebSocket Support Must be enabled on IIS (required for real-time proctoring via SignalR)

SSL/TLS Certificate Valid certificate for HTTPS — required for WebRTC proctoring (camera/mic access only works over HTTPS)

Note: If the system runs on two or more servers (load-balanced), Redis must be configured instead of in-memory cache. Redis is optional for single-server deployment.

2. Storage Requirements

Item Detail

File Storage Local disk storage for exam media (question images, PDFs, proctoring video recordings)

Storage path Configurable — defaults to MediaStorage/ folder on the server

Max upload size 10 MB per file (configurable)

Supported formats JPG, JPEG, PNG, GIF, WEBP, BMP, PDF

Alternative AWS S3 or any S3-compatible storage (switchable via configuration — no code change)

Log storage Local disk — rolling daily log files, auto-deleted after 30 days

Log database Logs also written to SQL Server (auto-created table Logs)

3. Outbound Internet Connectivity (Required Services)

The server must have outbound internet access to the following external services:

A. Email — SMTP (Required)

Item Detail

Protocol SMTP with SSL/TLS

Default configured Microsoft Office 365 (smtp.office365.com, port 587)

Alternative Any SMTP provider (Gmail, SendGrid, local Exchange) — fully configurable

Purpose Candidate welcome emails with login credentials, exam notifications, password resets

B. SMS — Twilio (Optional)

Item Detail

Provider Twilio

Purpose SMS notifications to candidates

Required if Client wants SMS notifications enabled

Alternative Can be disabled if not needed

C. AI — OpenAI API (Optional)

Item Detail

Provider OpenAI

Model used GPT-4o

Purpose AI question generation, AI-assisted grading suggestions, AI proctoring analysis

Required if Client wants AI features enabled

Alternative All three AI features can be disabled independently — core exam system works fully without AI

D. WebRTC STUN Servers (Required for live proctoring)

Item Detail

Provider Google public STUN servers

Addresses stun.l.google.com:19302, stun1.l.google.com:19302, stun2.l.google.com:19302

Purpose Peer-to-peer video connection for live proctoring

Alternative Can be replaced with a private STUN/TURN server if internet access is fully restricted

4. Network & Firewall Requirements

Port Protocol Purpose

80 HTTP Redirect to HTTPS

443 HTTPS Main application

587 TCP outbound SMTP (email sending)

1433 TCP (internal) SQL Server (if DB is on a separate server)

19302 UDP outbound Google STUN (WebRTC proctoring)

5. License

The system uses a hardware-bound license (domain/IP locked). Before deployment:

Build4IT generates a license.json file bound to the client's domain or IP

The license is validated on startup and checked periodically by a background service

A public.pem key file is also required on the server for license verification

No license = system will not start

6. Optional — Redis Cache

Scenario Cache Mode

Single server In-memory cache (built-in, no extra setup)

Multi-server / load-balanced Redis required — connection string must be configured

Summary Table

Requirement Mandatory Optional

Windows Server + IIS ✅

.NET 9 Hosting Bundle ✅

SQL Server 2019+ ✅

Node.js 20+ ✅

SSL Certificate (HTTPS) ✅

WebSocket enabled on IIS ✅

SMTP (email) ✅

License file + public.pem ✅

OpenAI API Key (GPT-4o) ✅ AI features

Twilio Account ✅ SMS notifications

AWS S3 ✅ Cloud file storage

Redis ✅ Multi-server only

Private STUN/TURN server ✅ Fully isolated network

Based on the actual codebase, here is the accurate sizing. First, a critical architectural fact that directly affects your answer:

Important: Where Processing Actually Happens

Component Where It Runs

Face detection (MediaPipe) Client browser (JavaScript) — zero server CPU

WebRTC live video Peer-to-peer between candidate ↔ proctor browser — server is signaling only (tiny SignalR messages)

AI (GPT-4o) OpenAI external API — server just forwards HTTP request

Video recording Browser captures → uploads file to server disk

Exam answering REST API + SQL Server — main server load

GPU: Not required. No server-side ML inference. No video transcoding. All heavy media processing is client-side or offloaded to external APIs.

CPU & RAM Sizing — 100 Concurrent Candidates

What the server actually handles per candidate:

1 persistent WebSocket (SignalR) connection for proctoring hub

Periodic REST API calls (answer auto-save every ~30s + events)

SQL Server writes: attempt answers, proctor events, risk snapshots

Video file upload to disk (at end of session)

5 background services running (low overhead, periodic)

Recommended Specification

Component Minimum (100 candidates) Recommended (comfortable headroom)

CPU 8 cores @ 2.4 GHz+ 16 cores @ 2.4 GHz+

RAM 16 GB 32 GB

OS Disk SSD 100 GB SSD 200 GB

Data/Media Disk SSD 500 GB SSD 1 TB

Network 100 Mbps 1 Gbps

GPU Not required Not required

RAM Breakdown (at 100 concurrent users)

Service Estimated RAM

SQL Server (DB Engine) 6–8 GB

ASP.NET Core API process 1–2 GB

SignalR (200 WebSocket connections) ~200 MB

In-Memory Cache ~512 MB

Windows Server OS 2 GB

Total ~12–14 GB → 16 GB minimum

Storage Note

Video recordings are the biggest disk consumer. At EnableVideoRecording: true:

Each exam session recording can be 50–500 MB depending on duration and quality

100 candidates × 500 MB = 50 GB per exam session

Plan storage based on retention policy (system auto-deletes based on VideoRetentionService)

Scaling Note (from the codebase)

If the client runs 2+ servers (load-balanced), Redis must replace the in-memory cache — this is explicitly noted in the deployment guide. Without Redis on multi-server, cache becomes inconsistent across nodes.
