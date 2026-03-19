# Architecture

## System context diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USERS                                     │
│                                                                     │
│   ┌──────────┐                              ┌──────────┐           │
│   │ Landlord │                              │  Renter  │           │
│   └────┬─────┘                              └────┬─────┘           │
│        │                                         │                  │
└────────┼─────────────────────────────────────────┼──────────────────┘
         │  HTTPS                                  │  HTTPS
         ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                                     │
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │     DNS      │───▶│     CDN      │───▶│    Pages     │         │
│   │              │    │  (caching)   │    │  (hosting)   │         │
│   │ sandrock.co  │    │              │    │  static HTML │         │
│   │ .uk domain   │    │              │    │  JS, CSS     │         │
│   └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         │  Browser loads static app, then makes API calls directly:
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                      │
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │     Auth     │    │  PostgreSQL   │    │   Storage    │         │
│   │              │    │              │    │              │         │
│   │ email/pass   │    │  profiles    │    │  sandrock-   │         │
│   │ sessions     │    │  properties  │    │  documents/  │         │
│   │ JWT tokens   │    │  tenancies   │    │              │         │
│   │              │    │  documents   │    │  PDFs, JPGs  │         │
│   │              │    │  invitations │    │  signed URLs │         │
│   │              │    │              │    │              │         │
│   │              │    │  RLS policies│    │  RLS policies│         │
│   └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         │  Transactional emails (invitations)
         ▼
┌─────────────────────┐    ┌──────────────────────┐
│       Resend        │    │       GitHub          │
│                     │    │                       │
│  invitation emails  │    │  source code (repo)   │
│  (future: notifs)   │    │  GitHub Actions CI/CD │
│                     │    │  ──▶ Cloudflare Pages │
└─────────────────────┘    └──────────────────────┘
```

## How the pieces fit together

1. **User visits the site** — DNS resolves via Cloudflare, CDN serves the static Next.js app from Cloudflare Pages.
2. **App loads in the browser** — React hydrates. The Supabase JS client is initialised with the project URL and anon key.
3. **Authentication** — The app calls `supabase.auth.signInWithPassword()` directly from the browser. Supabase returns a JWT. All subsequent API calls include this JWT.
4. **Data access** — The app calls `supabase.from('table').select()` etc. Supabase's PostgREST API enforces Row Level Security (RLS) policies — users can only see/modify data they're authorised for.
5. **File storage** — Uploads go directly to Supabase Storage. Viewing uses short-lived signed URLs (60s expiry).
6. **Deployment** — `git push` triggers GitHub Actions. If lint, build, and tests pass, the static `out/` directory is deployed to Cloudflare Pages.

## Code structure

```
sandrock-portal/
├── .github/workflows/
│   └── ci.yml                    # CI/CD: lint → build → test → deploy
│
├── docs/
│   ├── plan.md                   # MVP scope, data model, build order
│   ├── architecture.md           # This file — system diagrams
│   ├── product-flows.md          # All user flows with step-by-step detail
│   └── development-journal.md    # How the project was built
│
├── e2e/
│   ├── playwright.config.ts      # Playwright config (webServer, chromium)
│   ├── fixtures/
│   │   ├── test-fixtures.ts      # Custom fixtures: resetMock, loginAs*
│   │   └── test-file.pdf         # Small PDF for upload tests
│   └── tests/
│       ├── auth.spec.ts                  # Login flows (BDD)
│       ├── landlord-properties.spec.ts   # Property management
│       ├── landlord-invitations.spec.ts  # Renter invitations
│       ├── landlord-documents.spec.ts    # Document review
│       ├── renter-documents.spec.ts      # Document upload
│       └── renter-onboarding.spec.ts     # Onboarding checklist
│
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (auth-aware redirect)
│   │   ├── layout.tsx            # Root layout (AuthProvider wraps app)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx    # Email/password sign-in
│   │   │   ├── register/page.tsx # Self-registration (landlord or renter)
│   │   │   └── invite/page.tsx   # Accept invitation via token
│   │   └── (dashboard)/
│   │       ├── landlord/
│   │       │   ├── properties/page.tsx    # CRUD properties
│   │       │   ├── tenants/page.tsx       # View/manage tenants
│   │       │   ├── invitations/page.tsx   # Send/view invitations
│   │       │   └── documents/page.tsx     # Review uploaded documents
│   │       └── renter/
│   │           ├── onboarding/page.tsx    # Document checklist + progress
│   │           ├── my-documents/page.tsx  # Upload and view own documents
│   │           └── my-property/page.tsx   # View property details
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (button, card, etc.)
│   │   ├── auth-guard.tsx        # Role-based route protection
│   │   └── dashboard-shell.tsx   # Nav bar + layout for dashboard pages
│   │
│   ├── contexts/
│   │   └── auth-context.tsx      # React context: user, profile, session
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client (real or mock switch)
│   │   │   ├── mock-client.ts    # Assembles mock Supabase object
│   │   │   └── mock/
│   │   │       ├── store.ts      # In-memory data store (globalThis singleton)
│   │   │       ├── query-builder.ts  # Chainable thenable query builder
│   │   │       ├── auth.ts       # Mock auth (sign in/up/out, sessions)
│   │   │       ├── storage.ts    # Mock storage (upload, signed URLs)
│   │   │       └── seed.ts       # Seed data for test scenarios
│   │   ├── constants.ts          # Document categories, property types
│   │   ├── utils.ts              # Utility functions (cn)
│   │   └── validations/
│   │       └── schemas.ts        # Zod schemas for all forms
│   │
│   └── types/
│       └── database.ts           # Auto-generated Supabase DB types
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema + RLS policies
│
├── Makefile                      # Developer commands
├── package.json
├── next.config.ts                # Static export + React Compiler
└── tsconfig.json
```

## Database schema (ER diagram)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │       │  properties  │       │  invitations │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK, FK   │──┐    │ id (PK)      │──┐    │ id (PK)      │
│   auth.users)│  │    │ landlord_id  │◄─┼────│ property_id  │
│ role         │  │    │ address_*    │  │    │ invited_by   │
│ full_name    │  │    │ city         │  │    │ email        │
│ phone        │  │    │ postcode     │  │    │ token (UQ)   │
│ status       │  │    │ property_type│  │    │ renter_name  │
│ created_at   │  │    │ bedrooms     │  │    │ status       │
│ updated_at   │  │    │ status       │  │    │ expires_at   │
└──────────────┘  │    │ house_rules  │  │    └──────────────┘
                  │    │ emergency_*  │  │
                  │    │ created_at   │  │
                  │    └──────────────┘  │
                  │                      │
                  │    ┌──────────────┐  │
                  │    │  tenancies   │  │
                  │    ├──────────────┤  │
                  │    │ id (PK)      │──┼──┐
                  ├───▶│ renter_id    │  │  │
                  │    │ property_id  │◄─┘  │
                  │    │ lease_start  │     │
                  │    │ rent_amount  │     │
                  │    │ status       │     │
                  │    └──────────────┘     │
                  │                         │
                  │    ┌──────────────┐     │
                  │    │  documents   │     │
                  │    ├──────────────┤     │
                  │    │ id (PK)      │     │
                  └───▶│ uploaded_by  │     │
                       │ tenancy_id  │◄────┘
                       │ category    │
                       │ file_name   │
                       │ storage_path│
                       │ version     │
                       │ parent_doc  │──▶ self (version chain)
                       │ review_*    │
                       │ created_at  │  (immutable — no updated_at)
                       └──────────────┘
```

## Mock Supabase architecture

For local development and E2E testing, the real Supabase client is swapped for an in-memory mock when `NEXT_PUBLIC_USE_MOCK=true`:

```
client.ts
  │
  ├── NEXT_PUBLIC_USE_MOCK=true  ──▶  mock-client.ts
  │                                      │
  │                                      ├── mock/store.ts      (globalThis singleton)
  │                                      ├── mock/query-builder.ts  (chainable .from().select().eq()...)
  │                                      ├── mock/auth.ts       (signIn, signUp, signOut, sessions)
  │                                      ├── mock/storage.ts    (upload, signed URLs)
  │                                      └── mock/seed.ts       (default, empty-landlord, fresh-renter)
  │
  └── NEXT_PUBLIC_USE_MOCK unset ──▶  @supabase/supabase-js (real client)
```

The mock store is exposed on `window.__mockStore` so Playwright tests can `reset()` and `seed()` between tests.

## Security model

- **Row Level Security (RLS)** on all tables — enforced by Supabase at the database level
- **Landlords** can only access their own properties, tenancies, and associated documents
- **Renters** can only access their own tenancy and documents
- **Documents are immutable** — no UPDATE or DELETE policies for renters
- **Storage RLS** — renters can upload to their tenancy path, landlords can read all
- **Signed URLs** — file viewing uses 60-second expiry URLs, no direct public access
- **Invitations** — anonymous users can read by token only (for the accept flow)
