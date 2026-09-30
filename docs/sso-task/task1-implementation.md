# Task 1 — external authentication

This implementation adds UAE PASS and configurable Digital Dubai / Government OpenID Connect login. Both authenticate an **existing** `AspNetUsers` account. No candidates, accounts, roles, departments, exam assignments or permissions are created or transferred. Task 2 design/branding work is outside this change.

## Sign-in and linking

1. Staff and candidate login pages show each enabled provider. Existing password/demo login remains available.
2. `/api/sso/start/{uaepass|government}` challenges the provider. Protected state and a browser correlation cookie bind the callback to that browser. Return destinations are restricted to local application paths.
3. UAE PASS: authorization code → confidential server-side Basic-authenticated token POST → Bearer-authenticated `userinfo`. The published web contract uses query parameters on the token POST; this request is never sent through a logging HTTP-client factory. No provider tokens reach the browser or database. Government: OIDC discovery, authorization code with PKCE S256, signed ID token validation (issuer, audience, lifetime, nonce). Provider roles are ignored.
4. A protected, HttpOnly, non-sliding five-minute external cookie holds only the minimal verified identity, display name/email and return path. The frontend gateway preserves cookies and redirects. Provider codes never enter the React page, local storage or application JWT. Responses are `no-store`; redirect responses use `no-referrer`.
5. `/external-login` displays the authenticated personal identity. If unlinked, the user must enter an **existing corporate email/username and its password**. ASP.NET Identity verifies ownership with its existing lockout policy; submitting an email alone never links an account. Missing accounts receive the specified support message. Blocked, inactive, deleted, locked-out or sign-in-ineligible accounts cannot authenticate. Accounts requiring local two-factor verification cannot be linked through password proof alone; support must resolve that policy before linking.
6. Linking updates only provider identity fields on the corporate user. Identity concurrency stamps and SQL unique indexes prevent overwrites or one identity linking multiple accounts. A database transaction covers linking and application-session issuance. There is no self-registration, email auto-linking, external role mapping, or public unlink/relink endpoint.
7. On returning sign-in, Continue issues the existing application's access/refresh tokens using the linked corporate ID/email and current database roles. First linking does the same. Both use the same `AuthService` issuance path as password login. The temporary cookie is cleared. All mutations require an ASP.NET antiforgery token bound to the external principal. Provider proof alone never grants application authorization.

The temporary cookie is a short-lived login proof, like ASP.NET Identity's external cookie. Clearing it ends the browser flow; a stolen copy remains a credential until its five-minute expiry. Production therefore requires HTTPS and protected shared Data Protection keys. This does not replace application logout or revoke a session at the provider; application logout retains existing behavior.

The customer PDF's credential-based existing-account linking flow is followed. Its self-registration, multi-account selector and unlink features are intentionally excluded by `task1-sso.txt`'s existing-account/one-to-one requirement.

## Configuration and customer handover

Providers are **disabled by default**, so normal startup and password login need no SSO credentials. Enable only after configuring a registered client. Invalid enabled configurations fail startup with messages that contain configuration names, never supplied secret values. Configuration is read at startup; restart after changes. Existing appsettings/environment variable configuration applies; use environment variables or the deployment secret store for secrets, never checked-in settings.

| Setting (prefix `ExternalAuthentication__`) | Customer value |
|---|---|
| `PublicOrigin` | Exact public frontend origin, e.g. `https://exam.customer.example`, without a path/query. Never derive it from untrusted request headers. |
| `UaePass__Enabled` | `true` after staging/production client registration. |
| `UaePass__ClientId`, `UaePass__ClientSecret` | Registered UAE PASS client credentials. |
| `UaePass__Issuer` | Stable identity namespace for the selected UAE PASS environment; staging default `https://stg-id.uaepass.ae/idshub`. This is configured for OAuth userinfo, not an unvalidated token claim. |
| `UaePass__AuthorizationEndpoint`, `TokenEndpoint`, `UserInformationEndpoint` | Defaults use official staging `https://stg-id.uaepass.ae/idshub/{authorize,token,userinfo}`. Production uses `https://id.uaepass.ae/idshub/{authorize,token,userinfo}` and the matching issuer namespace. |
| `UaePass__Scope` | Default `urn:uae:digitalid:profile:general`; use scopes approved for the customer. Visitor attributes need their additional approved scopes. |
| `UaePass__AcrValues` | Documented web default `urn:safelayer:tws:policies:authentication:level:low`; use the assurance/flow agreed at onboarding. |
| `UaePass__IdentityClaim` | Default `uuid`. Confirm the stable `uuid`, `spuuid` or `sub` returned for this client. Missing claims fail closed, with no fallback to personal email. Never change this choice on a live deployment without a reviewed data migration. |
| `UaePass__AllowedUserTypes__0`, `__1` | Default verified profiles `SOP2`, `SOP3`. Basic `SOP1` is rejected unless explicitly allowed by the customer's account-assurance policy. |
| `Government__Enabled` | `true` once the customer confirms the Government identity provider's OIDC contract. |
| `Government__Authority` | Customer's HTTPS OIDC authority with discovery and signing keys. |
| `Government__ClientId`, `Government__ClientSecret` | Registered confidential OIDC client credentials. |
| `Government__Scopes__0`, etc. | Approved scopes; `openid` is always required. Defaults also request `profile`, `email`; these are display claims, not linking keys. |

Register these **exact** GET/query callback URLs (no wildcard):

```
https://exam.customer.example/api/sso/callback/uaepass
https://exam.customer.example/api/sso/callback/government
```

The public reverse proxy must route `/api/sso/*` through Next.js (which proxies to the configured `BACKEND_URL`) or to the API on the **same public origin** while retaining Set-Cookie, Cookie, query strings, status codes and Location. Do not cache these routes or log their query strings, cookies, request bodies, response bodies or redirect headers. This also applies to load-balancer/APM access logs outside this repository and outbound token-request tracing. Configure HTTPS, existing trusted forwarded proxies, and the existing shared `DataProtection` key ring/certificate across API instances. No sticky sessions or process-local identity cache is required. Loopback HTTP is permitted only in Development.

Government SSO uses the standard OIDC integration structure because customer-specific Digital Dubai metadata/protocol details were not supplied. The customer must confirm OIDC support, authority, client authentication/PKCE support, scopes, returned `sub` and registered redirect. A SAML-only service would need its separately supplied contract; it is not silently treated as OIDC. Both providers use explicit corporate credential proof on first linking.

## Database and deployment

Migration: `20260930034449_AddExternalIdentityLinks`. Six nullable columns on `AspNetUsers`: issuer, subject and linked-at for each provider. Each issuer/subject pair has a filtered unique index with binary/case-sensitive collation; check constraints require a complete triple or all null. No new tables. Soft-deleted users retain their identity reservation. Existing rows need no backfill and keep password login.

Build the API, review the generated migration SQL, and apply the existing EF migration workflow to the target database before enabling either provider. Disabling providers preserves the links. Switching staging to production uses a separate issuer namespace and requires an administrator-reviewed identity transition; do not clear production links casually. Rolling this migration back removes the external links, so retain a database backup if rollback must preserve them.

## Existing logging

`SsoAudit` writes allowlisted events to the existing Serilog logger and bounded `SystemLogChannel`/`LogPersistenceService`/SystemLogs UI pipeline. It adds no sink or table. Events include provider, start, token/profile result and HTTP status, callback result and exception **type only**, link attempt/result, login result, cancellation, rejected CSRF and existing request trace ID. Failed stages use Warning. These events contain no raw provider errors, exception messages, URLs, claims, emails, passwords, secrets, authorization codes or tokens. Default OIDC internal diagnostics are suppressed because they can include raw remote messages; UAE PASS's handler uses the safe events instead. ASP.NET informational request-start logging and Next.js development access logging for SSO are suppressed to prevent raw callback queries leaking codes. Existing request logging still records route templates and status.

Troubleshoot by request trace and `SSO.uaepass.*` / `SSO.government.*` events. Token 400 usually means code/redirect mismatch or expiry; 401 usually means client configuration. Profile rejection can indicate missing stable identifier, unsupported assurance or upstream failure. Validate exact callback, endpoint environment and allowed identity claims with the provider; never paste codes/tokens into logs or support tickets.

## Reference and verification

Official pages retrieved on 2026-09-30 (technical authority):

- [Endpoints](https://docs.uaepass.ae/feature-guides/authentication/web-application/endpoints)
- [Authorization code](https://docs.uaepass.ae/feature-guides/authentication/web-application/1.-obtaining-the-oauth2-access-code)
- [Access token](https://docs.uaepass.ae/feature-guides/authentication/web-application/2.-obtaining-the-access-token)
- [User information](https://docs.uaepass.ae/feature-guides/authentication/web-application/3.-obtaining-authenticated-user-information-from-the-access-token)
- [Manual linking](https://docs.uaepass.ae/feature-guides/authentication/user-linking/manual-linking) and [corporate account](https://docs.uaepass.ae/feature-guides/authentication/user-linking/corporate-account)
- [Public sandbox POC](https://docs.uaepass.ae/quick-start-guide-uae-pass-staging-environment/conduct-a-poc-with-uae-pass-authentication)
- Customer business-flow reference: [`user-sso.pdf`](user-sso.pdf); requirements: [`task1-sso.txt`](task1-sso.txt).

The official public `sandbox_stage` client was used only to check the documented authorization request with its example `https://localhost:8000` callback: HTTP 302 received. No real personal login or customer credentials were available. Default deployed credentials remain placeholders. Full external consent, app approval/biometrics, real-code exchange, returned client-specific profile claims and Government tenant access require registered customer clients/callbacks and an authorized test identity/device.

Automated integration tests exercise actual ASP.NET OAuth/OIDC/cookie/antiforgery/Identity/JWT handlers over loopback HTTP with a local provider and disposable SQL databases. They verify linking, returning login, corporate identity/roles/exam preservation, password/refresh regression, CSRF/state/correlation, code replay, cancellation, lockout, blocked/deleted/inactive accounts, conflicting/concurrent links, provider failures, assurance, and OIDC signature/audience/issuer/expiry/nonce/PKCE. The frontend gateway tests use the built Next.js app and verify redirects, cookies, callback forwarding, CSRF and route restrictions. Existing full-suite and migration validation remain required before deployment.

Verification performed for this change:

- Backend build passed; 20 existing warnings, no new warnings/errors.
- Frontend production build and TypeScript check passed; lint has 0 errors and 70 existing warnings.
- Full backend suite with SQL Server and Redis: 340 passed, 0 failed, 0 skipped.
- Frontend Node suite: 18 passed, 0 failed.
- Fresh migrations, upgrade with existing users, rollback/reapply, uniqueness/check constraints and EF model/snapshot validation passed. Migration applied successfully to the isolated development database; idempotent SQL generated.
- Chromium exercised UAE PASS first linking (including the missing-account error), returning login, and Government OIDC linking through the real Next.js gateway and backend with the local test provider. The resulting session retained corporate email, Candidate role and user ID. Startup/password login with both providers disabled passed against the development application.
