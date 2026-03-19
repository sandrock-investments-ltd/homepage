# Sandrock Investments Limited — Renter Portal

A tenant portal for a small UK property investment business. Landlords invite renters, renters upload identity and financial documents, and landlords review them — all in one place. Built for compliance with the **UK Renters' Rights Act** (effective 1 May 2026).

## Quick start

```bash
make setup        # install deps + Playwright browsers
make dev-mock     # run locally with mock Supabase (no backend needed)
make test-e2e     # run E2E tests
```

## Prerequisites

- Node.js 20+
- npm

## Available commands

| Command | Description |
|---------|-------------|
| `make setup` | Install dependencies and Playwright browsers |
| `make dev` | Start dev server against real Supabase |
| `make dev-mock` | Start dev server with in-memory mock Supabase |
| `make build` | Production build (static export to `out/`) |
| `make lint` | Run ESLint |
| `make test-e2e` | Run Playwright E2E tests |
| `make test-e2e-ui` | Run Playwright E2E tests with interactive UI |
| `make clean` | Remove build artefacts and test reports |

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

When using `make dev-mock`, no environment variables are needed — the app uses an in-memory mock Supabase client.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict) |
| Database, Auth, Storage | Supabase (PostgreSQL + Auth + Storage) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Forms & validation | React Hook Form + Zod |
| E2E testing | Playwright |
| Hosting | Cloudflare Pages (static) |
| DNS & CDN | Cloudflare |

## Project documentation

| Document | What it covers |
|----------|----------------|
| [docs/plan.md](docs/plan.md) | MVP scope, user roles, data model, build order |
| [docs/architecture.md](docs/architecture.md) | System context diagram, code structure, 3rd-party integrations |
| [docs/product-flows.md](docs/product-flows.md) | Every user flow the app supports, with step-by-step detail |
| [docs/development-journal.md](docs/development-journal.md) | Chronological log of how the project was built — for reference and learning |

## Testing

Tests are behaviour-driven Playwright E2E tests that run against the mock Supabase client. No real backend is needed.

```bash
make test-e2e       # headless
make test-e2e-ui    # interactive UI mode
```

Tests cover: authentication, property management, renter invitations, document upload, document review, and renter onboarding.

## CI/CD

GitHub Actions runs on every push and PR:
1. Lint
2. Build (static export)
3. E2E tests against mock Supabase
4. Deploy to Cloudflare Pages (only on `main`, only if all checks pass)

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Deployment

The app is statically exported (`next build` produces `out/`) and deployed to **Cloudflare Pages**. Cloudflare also provides DNS and CDN.

Supabase handles all backend concerns (auth, database, file storage) via client-side API calls.
