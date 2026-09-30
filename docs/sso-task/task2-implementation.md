# Task 2 — Digital Dubai branding

Task 2 extends the existing theme, organization/system settings, layouts and login components. Task 1 authentication handlers, callbacks, linking rules, authorization and exam behavior are unchanged.

## Identity and layout

- Every route uses the same masthead: Government of Dubai physically left, Digital Dubai and the Dubai Data and Statistics Establishment title physically right. The order is preserved in Arabic.
- Candidate and staff login use the E-Source split layout and its original background. Exam-specific text replaces the E-Source reporting text. Government SSO appears before UAE PASS; the existing account form and all existing demo accounts remain below them in an expandable panel.
- Provider availability still comes from Task 1's `/api/sso/providers`. Unavailable providers are displayed disabled; password sign-in remains available. No provider is enabled by a branding change.
- Candidate, exam, result, administration and public pages share the blue theme, identity header, footer and D favicon. Fullscreen exams keep their existing document fullscreen target, timers, scrolling, controls and autosave.
- Light/dark mode and language switching remain available. Brand colors now come from organization/system settings; the old personal accent picker was removed because it could override the official identity on theme changes. Semantic success, warning and failure colors remain distinct.
- Default header cyan: `#67ccee` (from the E-Source login stylesheet). Default action blue: `#0076a8`; footer navy: `#102a43`; secondary surfaces use pale blue. Dark mode uses a lighter cyan action color. Configured primary buttons choose contrasting black/white labels using WCAG relative luminance.

## Assets and references

The following assets were downloaded on 2026-09-30 and bundled without altering their contents. Runtime rendering does not depend on E-Source being reachable.

| Local asset | Official source |
| --- | --- |
| `public/branding/digital-dubai.png` | https://esource.dsc.gov.ae/assets/img/logo.png |
| `public/branding/government-of-dubai-white.svg` | https://esource.dsc.gov.ae/assets/img/government-of-dubai-white.svg |
| `public/branding/favicon.png` | https://esource.dsc.gov.ae/assets/img/favicon.png |
| `public/favicon.ico` | https://esource.dsc.gov.ae/favicon.ico |
| `public/branding/background-topic.jpg` | https://esource.dsc.gov.ae/assets/img/background-topic.jpg |
| `public/branding/uaepass-signin-button.svg` | https://esource.dsc.gov.ae/assets/img/uaepass-signin-button.svg |
| `public/branding/uaepass-logo.svg` | https://esource.dsc.gov.ae/assets/img/uaepass-logo.svg |

Next.js `app/icon.png` and `app/apple-icon.png` use the same supplied D asset. The previous generated S/SE icons no longer override metadata. SVGs were checked for executable content/external references, and bundled files were compared byte-for-byte with the supplied sources.

The supplied screenshot, live https://esource.dsc.gov.ae/login stylesheet/assets, `task2-design.txt` and `user-sso.pdf` were inspected. **Reference limitation:** https://data.dubai/ar/ and its public root returned the site's “Request Rejected” page; the `www` hostname returned HTTP 403. Its current stylesheet could not be inspected. The implementation therefore uses the verified Digital Dubai identity from the supplied official E-Source reference, with darker related blues for readable controls.

## Existing database/configuration mechanism

`OrganizationSettings` (when active) overrides `SystemSettings`, then shared Digital Dubai defaults. Empty values fall back field-by-field. Inactive organization settings no longer leak into the effective public branding. Existing logo uploads, favicon uploads, names, footer/contact information and primary color remain configurable through the existing administration pages.

The fixed government masthead retains the supplied official logos. Configurable portal logos appear in the sidebar, and configured name/footer/contact/color/favicon settings apply across roles. Bundled `/branding/...` paths load from the frontend; existing backend uploads use the existing file proxy. Saving settings refreshes mounted consumers without a reload. Replaced upload files receive a cache-busting URL. An unavailable branding API, invalid color or broken favicon falls back to bundled defaults. Local metadata also supplies the default favicon before settings load.

Migration: **`20260930164038_ApplyDigitalDubaiBranding`**. It uses the existing tables, with no new columns or parallel configuration store:

- Replaces known legacy SmartExam names, empty system brand values and default green colors.
- Seeds one system settings row if none exists.
- Preserves custom branding, uploads, contact details, non-brand settings, users and relationships.
- `Down` intentionally retains branding data. The change is compatible with the previous schema, and reversing it cannot distinguish migration defaults from later administrator edits. Rollback must not erase those edits or delete the settings row.

Apply the normal EF deployment migration before running the updated application:

```sh
dotnet ef database update --project Backend-API --startup-project Backend-API
```

No new credentials or environment variables are required for Task 2. Existing frontend/API URLs and Task 1 SSO/UAE PASS configuration continue to apply. Notification branding uses the same defaults; bundled email logo URLs resolve against the configured public login/frontend origin.

## Verification

Final results on 2026-09-30: backend build passed; frontend production build and TypeScript passed; ESLint had no errors (69 existing warnings); **343 backend tests passed, zero skipped; 22 frontend tests passed**. All four branding browser groups and the local SSO/linking browser checks passed, as did public landing/FAQ checks in both themes. Fresh backend compilation retains 20 pre-existing warnings.

One repeated backend run received a delayed `ScreenPeerJoined` event in the existing `DirectedSignalsCannotCrossAttemptMediaRoleOrDepartedConnection` test. The isolated test and subsequent complete 343-test suite passed. No signaling production code or test assertions were changed for Task 2.

- Backend build; full backend suite including SQL Server/Redis, authentication and account-linking regressions.
- Frontend production build, TypeScript, ESLint, existing API proxy/answer queue tests, and new branding unit tests.
- SQL Server fresh install, legacy upgrade, preservation of custom settings, down/up round trip, repeated application, no pending model changes, and idempotent SQL generation. The migration also applied to the existing local development database.
- Browser checks at 1440, 768, 375 and 320 pixels; Arabic physical logo order; light/dark mode; unavailable branding/providers; settings refresh; demo credential autofill; exam viewport, controls and answer autosave.
- Real local candidate password login and candidate identity/My Exams screens; local mock-provider browser checks for UAE PASS linking, returning linked users and Government SSO.
- No real external-provider production sign-in was performed for this UI-only task; those checks use the existing Task 1 local provider fixture. Customer credentials were not introduced or changed.

Reproduce frontend unit tests from `Frontend/Smart-Exam-App-main`:

```sh
corepack pnpm build
corepack pnpm typecheck
corepack pnpm lint
node --test --test-reporter=tap tests/api-proxy.test.cjs tests/answer-save-queue.test.mjs tests/branding.test.mjs
```

The repeatable browser suite requires Python Playwright, Chromium and a running frontend. It uses deterministic local API fixtures and writes screenshots outside the repository:

```sh
BRANDING_BASE_URL=http://127.0.0.1:3000 \
CHROMIUM_PATH=/usr/bin/chromium \
BRANDING_SCREENSHOTS=/tmp/branding-browser \
python3 tests/branding.browser.py
```

Backend tests use the existing `TEST_SQLSERVER_CONNECTION`, `TEST_SQLSERVER_PASSWORD` and `TEST_REDIS_CONNECTION` test settings. Supply them externally and run `dotnet test Backend-API.Tests/Backend-API.Tests.csproj`; no test credentials belong in source control.
