# Sandrock Investments Limited — Renter Portal

## Context

Sandrock Investments Limited is a small property investment business (1-5 properties). The owner needs a tenant portal where renters can upload identity and financial documents (immutably), and both landlord and renter can view them. The portal will eventually include rent tracking, maintenance requests, and property info — but we're building MVP-first and iterating.

The UK **Renters' Rights Act** takes effect **1 May 2026**, requiring landlords to provide tenants with government info sheets and written tenancy terms by 31 May 2026. This portal helps with compliance.

---

## MVP Slice 1 — Scope

### In scope

1. **Auth** — landlord login, renter login, landlord invites renters, renters self-register (landlord approves)
2. **Document management** — upload, view, immutable version history, landlord review (accept / request more info)
3. **Property overview** — basic property details visible to renters (address, contacts, tenancy dates)
4. **Onboarding checklist** — shows renters which documents are still needed

### Out of scope (future slices)

- Rent payment tracking
- Maintenance requests
- Messaging/notifications beyond email
- Mobile app (responsive web only)

---

## User Roles

| Role | Can do |
|------|--------|
| **Landlord** | Invite renters, approve registrations, view all docs, upload landlord docs (tenancy agreements, certificates), manage properties, review documents |
| **Renter** | Self-register, upload ID & financial docs, view own docs + landlord-shared docs, see property details, complete onboarding checklist |

---

## Document Categories

### Renter uploads

- **ID:** passport, driving licence, national ID
- **Proof of address:** utility bill, bank statement (last 3 months)
- **Financial:** payslips (3 months), employment contract, credit check, guarantor details
- **Conditional:** visa/BRP (non-UK nationals)

### Landlord uploads (shared to renter)

- Tenancy agreement, government info sheet, EPC, gas safety cert, EICR, deposit protection cert, house rules

---

## Document Immutability

Enforced at 3 layers (defense in depth):

1. **Database RLS** — no UPDATE or DELETE policy for renters on `documents` table
2. **Storage RLS** — no DELETE policy for renters on the storage bucket
3. **Application UI** — no delete/edit buttons; only "Upload New Version"

Versioning: each new upload links to the previous via `parent_document_id`, creating a version chain.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15** (App Router) | Full-stack, server components, great DX |
| Language | **TypeScript** | Type safety everywhere |
| Database + Auth + Storage | **Supabase** (PostgreSQL) | Auth, DB, file storage, RLS in one service — ideal for solo dev MVP |
| ORM | **Drizzle ORM** | Lightweight, type-safe |
| UI | **shadcn/ui + Tailwind CSS** | Fast to build, no runtime deps |
| Forms | **React Hook Form + Zod** | Shared client/server validation |
| Email | **Resend** | Simple transactional emails, free tier |
| Deployment | **Vercel** | Zero-config Next.js hosting |

**Estimated cost:** ~£25-45/month (Supabase Pro + Vercel free/hobby + domain)

---

## Data Model

### profiles

Extends Supabase `auth.users` with: role (`landlord` | `renter`), full_name, phone, status (`pending` | `active` | `inactive`)

### properties

address, city, postcode, property_type, bedrooms, status, emergency_contacts (JSONB), house_rules, move_in_guide, wifi_details, utility_info, bin_collection_day

### tenancies

Links renter to property: lease_start, lease_end, rent_amount_pence, rent_frequency, deposit_amount_pence, deposit_scheme, deposit_reference, status

### documents

Immutable rows: tenancy_id, uploaded_by, category, file_name, file_size, mime_type, storage_path, version, parent_document_id, review_status (`pending` | `accepted` | `more_info_needed`), review_note, expires_at. No `updated_at`, no soft delete.

### invitations

property_id, invited_by, email, token, lease_start, rent_amount_pence, status, expires_at (7 days)

---

## File Storage

- Private Supabase Storage bucket: `sandrock-documents/`
- Path structure: `{tenancy_id}/{document_id}_{filename}`
- **Upload:** client gets presigned URL from server action, uploads directly to Supabase Storage
- **Viewing:** server generates short-lived signed URL (60s expiry)

---

## Key User Flows

### 1. Landlord invites renter

Landlord → "Invite Tenant" → enters email + tenancy details → system emails magic link → renter clicks, registers → onboarding checklist activates

### 2. Renter self-registers

Renter → "Request Access" → enters name, email, phone, property → account created as `pending` → landlord approves + links to property → renter proceeds

### 3. Document upload (immutable)

Renter → selects category → uploads file (PDF/JPG/PNG, max 10MB) → stored as version 1 → landlord reviews → accepts or requests more info

### 4. New version

Renter → "Upload New Version" → new file stored as version 2, linked to version 1 → full history preserved, old version remains accessible

---

## Project Structure

```
sandrock-portal/
├── docs/
│   └── plan.md              ← you are here
├── src/
│   ├── app/
│   │   ├── (auth)/          -- login, register, invite/[token]
│   │   ├── (dashboard)/
│   │   │   ├── landlord/    -- properties, tenants, documents, invitations
│   │   │   └── renter/      -- my-property, my-documents, onboarding
│   │   └── api/webhooks/
│   ├── components/
│   │   ├── ui/              -- shadcn
│   │   ├── documents/       -- upload, list, viewer, version-history
│   │   └── properties/
│   ├── lib/
│   │   ├── supabase/        -- client, server, middleware
│   │   ├── db/              -- Drizzle schema + queries
│   │   └── validations/     -- Zod schemas
│   └── types/
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── package.json
```

---

## Build Order (Slice 1)

### Step 1: Foundation

- Init Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Set up Supabase project (DB, auth, storage)
- Drizzle schema + initial migration
- Auth pages (login, register) + middleware

### Step 2: Core Data

- Landlord: add/view properties
- Invitation flow (create invite, email, accept)
- Renter self-registration + approval
- Property detail page for renters

### Step 3: Documents

- Private storage bucket + RLS policies
- Upload component (presigned URL flow, category picker)
- Document list with category grouping
- Version history chain
- Inline viewer (PDF/images via signed URLs)

### Step 4: Review & Polish

- Landlord document review (accept / more info needed)
- Onboarding checklist
- Document expiry warnings
- Email notifications
- Responsive design + deploy to Vercel

---

## Verification

- **Auth:** Register as landlord, invite a renter, renter accepts invite, renter self-registers and gets approved
- **Documents:** Renter uploads a document, landlord views it, renter uploads new version, verify old version still accessible, verify renter cannot delete
- **RLS:** Attempt direct Supabase API calls as renter to delete/update documents — should be denied
- **Storage:** Verify signed URLs expire, verify no public access to bucket
