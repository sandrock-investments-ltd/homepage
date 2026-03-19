# Development journal

A chronological log of how the Sandrock Renter Portal was built — decisions made, lessons learned, and the reasoning behind them. Written as reference material for the future.

---

## Phase 1: Static landing page

**Commit:** `Create index.html` → `updated index_1.html`

Started with a plain HTML landing page. No framework, no build step. Just a static page to get something live and test the deployment pipeline.

**Lesson:** Ship something visible immediately, even if it's just a placeholder. It validates the deploy path end-to-end.

---

## Phase 2: Next.js + Cloudflare Pages

**Commits:** `Initial commit from Create Next App` → `feat: landing page and fake renter document upload flow`

Replaced the static HTML with a Next.js app. Added a mock document upload flow to validate the UI direction before connecting a real backend.

**Key decision: Static export (`output: "export"`)**

We chose static export over server-side rendering because:
- Cloudflare Pages hosts static files — no Node.js runtime needed.
- All backend logic lives in Supabase (called from the browser).
- Simpler deployment, lower cost, better caching.

**Lesson:** If your backend is a managed service with a client SDK (like Supabase), you often don't need SSR. Static export keeps the architecture simple.

---

## Phase 3: Cloudflare Pages deployment

**Commits:** `chore: remove old static index.html` → `chore: enable static export for Cloudflare Pages` → `chore: trigger Cloudflare Pages rebuild`

Configured the project for Cloudflare Pages deployment:
- `next.config.ts` set to `output: "export"` — produces a static `out/` directory.
- Cloudflare Pages watches the GitHub repo and deploys on push.
- DNS configured in Cloudflare to point the domain to Pages.

**Architecture established:**
```
GitHub repo → Cloudflare Pages (build + host) → Cloudflare CDN/DNS → Users
                                                         ↕
                                                      Supabase
                                                  (auth, DB, storage)
```

**Lesson:** Separating hosting (Cloudflare) from backend (Supabase) keeps each concern independently scalable and replaceable.

---

## Phase 4: MVP Slice 1 — Full app

**Commit:** `feat: MVP slice 1 — auth, dashboards, documents, and Supabase schema`

Built the entire MVP in one iteration:

### What was built

1. **Supabase schema** — 5 tables (profiles, properties, tenancies, documents, invitations) with comprehensive RLS policies.
2. **Auth flow** — Login, register, invitation acceptance. Role-based routing (landlord → properties, renter → onboarding).
3. **Landlord dashboard** — Properties CRUD, tenant list, invitation management, document review.
4. **Renter dashboard** — Onboarding checklist, document upload with version history, property details.
5. **Type safety** — Auto-generated TypeScript types from Supabase schema, Zod validation on all forms.

### Key technical decisions

**Supabase for everything (auth + DB + storage):**
Why: A solo developer building an MVP doesn't need to manage separate auth, database, and file storage services. Supabase bundles all three with a consistent API and built-in RLS.

**Row Level Security (RLS) as primary access control:**
Why: Instead of checking permissions in application code (which can be bypassed), RLS enforces access rules at the database level. Even direct API calls respect the policies.

**Document immutability (3 layers):**
1. Database RLS — no UPDATE/DELETE policies for renters on documents.
2. Storage RLS — no DELETE policy for renters on the storage bucket.
3. Application UI — no delete/edit buttons; only "Upload New Version".

Why: For legal compliance (Renters' Rights Act), documents must be tamper-proof. Defense in depth means a bug in one layer doesn't compromise the guarantee.

**shadcn/ui components:**
Why: Copy-paste component library — no runtime dependency, full ownership of code, easy to customise. Faster than building from scratch, more controllable than a full component library.

**React Hook Form + Zod:**
Why: Zod schemas are shared between client validation and (future) server validation. React Hook Form avoids unnecessary re-renders. Good DX for form-heavy apps.

### Lessons learned

- **RLS policies are powerful but easy to get wrong.** Test them by making direct Supabase API calls as different users, not just through the UI.
- **Supabase's auto-generated types** (`database.ts`) catch schema mismatches at compile time — worth the setup effort.
- **Static export limits what you can do** — no server components, no API routes that run at request time. All data fetching happens client-side. This is fine for our use case but wouldn't work for apps needing SSR.

---

## Phase 5: Mock Supabase + E2E tests

**What was built:**
1. An in-memory mock Supabase client that implements the same chaining API.
2. 19 behaviour-driven Playwright E2E tests covering all major flows.

### Why a mock Supabase client?

**Problem:** Local development hit the production Supabase instance, risking data contamination. Running tests against real Supabase was slow and fragile.

**Solution:** A fake in-memory Supabase client, swapped in via `NEXT_PUBLIC_USE_MOCK=true`.

**Why this approach over alternatives:**

| Alternative | Why not |
|-------------|---------|
| Repository pattern | Would require refactoring all ~10 consumer files to go through an abstraction layer. The mock client approach only changes `client.ts`. |
| MSW (HTTP mocking) | Supabase uses PostgREST with complex query parameters. Mocking at the HTTP level would be fragile and hard to maintain. |
| Test database | Requires Supabase CLI, Docker, and managing migrations. Overkill for a client-side static app. |

### Mock architecture

The mock consists of 5 modules:

1. **`store.ts`** — A `globalThis` singleton holding `Map<tableName, rows[]>`, user registry, auth state, and storage. Survives Next.js hot reloads. Exposed on `window.__mockStore` for Playwright control.

2. **`query-builder.ts`** — Implements the Supabase chaining API: `.from(table).select(cols).eq(col, val).in(col, vals).order(col, opts).limit(n).single()`. Each builder is _thenable_ (implements `.then()`) so `await` works without calling `.execute()`.

3. **`auth.ts`** — Mock auth: `signInWithPassword` looks up users by email+password, `signUp` creates users, `signOut` clears state, `onAuthStateChange` fires listeners.

4. **`storage.ts`** — `upload` stores blobs in a Map, `createSignedUrl` returns either a real `blob:` URL or a placeholder.

5. **`seed.ts`** — Pre-built scenarios: `default` (full data), `empty-landlord` (no properties), `fresh-renter` (tenancy but no documents).

### Switching mechanism

```typescript
// client.ts
export const supabase = useMock ? require('./mock-client').mockSupabase : createRealClient()
```

When `NEXT_PUBLIC_USE_MOCK` is unset, the mock code is never imported and gets tree-shaken out of the production build.

### E2E test design: Behaviour-driven

Tests are written in Given/When/Then style:

```typescript
test.describe('Given a landlord with valid credentials', () => {
  test('When they sign in, then they should be redirected to properties page', ...)
  test('When they sign in, then the navigation should show their name', ...)
})
```

**Why BDD:** Tests read as product specifications. Non-developers can understand what the app does by reading test names. Tests break when _behaviour_ changes, not when implementation details change.

### Test fixtures

Custom Playwright fixtures handle repetitive setup:
- `resetMock` (auto) — Resets and seeds the mock store before every test.
- `seedScenario` — Configurable per `test.describe` block via `test.use({ seedScenario: 'fresh-renter' })`.
- `loginAsLandlord` / `loginAsRenter` — Logs in and navigates to the dashboard.

### Challenges and solutions

**Problem: `globalThis` doesn't persist across full page navigations in the browser.**
Each `page.goto()` creates a fresh JavaScript context. The mock store is re-created, and the auto-seed runs again with `default` data — even if a test wanted `fresh-renter`.

**Solution:** Use `page.addInitScript()` to set a seed override on `globalThis` before any page JavaScript executes. The mock client reads this override during auto-seed.

**Problem: Tests were flaky with 4 parallel workers.**
Multiple browser instances hitting the dev server simultaneously caused slow page loads and race conditions.

**Solution:** Added 1 retry in local config. Added `waitForFunction` guards to ensure the mock store is available before interacting with it. Tests now pass reliably at 57/57 across 3 repetitions.

### Lessons learned

- **Mock at the highest useful level.** Mocking the Supabase client (not HTTP, not individual functions) gives the best tradeoff: realistic enough to catch real bugs, simple enough to maintain.
- **`globalThis` singletons in Next.js** survive hot module reloads but NOT full page navigations in the browser. For test control, `addInitScript` is the reliable mechanism.
- **BDD-style test names are documentation.** When a test fails, the name tells you exactly what product behaviour broke.
- **Seed scenarios are test data factories.** Instead of building data in each test, define named scenarios and compose them.

---

## Phase 6: CI/CD, documentation, and developer experience

**What was built:**
1. `Makefile` — Standard developer commands (`make setup`, `make dev-mock`, `make test-e2e`, etc.).
2. GitHub Actions workflow — Lint → Build → Test → Deploy pipeline.
3. Documentation — Architecture diagrams, product flows, and this development journal.

### Why a Makefile?

Developers shouldn't have to remember `NEXT_PUBLIC_USE_MOCK=true npm run dev` or `npx playwright test --config e2e/playwright.config.ts`. A Makefile provides discoverable, short commands. `make help` lists everything.

### Why document now?

The project has reached a stable MVP. Documentation at this stage:
- Captures decisions while they're fresh.
- Makes onboarding new contributors possible.
- Forces us to articulate the architecture clearly (which sometimes reveals issues).

### CI/CD pipeline

```
Push to any branch
  → Install deps
  → Lint
  → Build (static export)
  → Install Playwright
  → Run E2E tests (against mock Supabase)
  → Deploy to Cloudflare Pages (main branch only, only if all checks pass)
```

**Why deploy only from CI?** Manual deploys from Cloudflare Pages' auto-build don't run tests. By deploying from GitHub Actions, we guarantee that broken code never reaches production.
