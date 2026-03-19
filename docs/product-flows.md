# Product flows

Everything the Sandrock Renter Portal can do, step by step.

---

## 1. Landing page

**Who:** Any visitor

1. User navigates to the site.
2. If not signed in — sees "Sign In" and "Create an account" links.
3. If signed in as landlord — sees "Go to Dashboard" link pointing to `/landlord/properties`.
4. If signed in as renter — sees "Go to Dashboard" link pointing to `/renter/onboarding`.

---

## 2. Registration

**Who:** New landlord or renter

1. User clicks "Create an account" from the landing page or login page.
2. Fills in: full name, email, password, phone (optional), role (landlord or renter).
3. System creates the Supabase auth user and a `profiles` row.
   - Landlords are created with `status: active`.
   - Renters are created with `status: pending` (awaiting landlord approval).
4. User is signed in and redirected to their dashboard.

---

## 3. Login

**Who:** Existing user

1. User enters email and password on `/login`.
2. System authenticates via `supabase.auth.signInWithPassword()`.
3. System looks up the user's profile to determine their role.
4. Redirects to:
   - Landlord → `/landlord/properties`
   - Renter → `/renter/onboarding`
5. If credentials are wrong — error message: "Invalid login credentials".

---

## 4. Landlord: Manage properties

**Who:** Landlord

1. Landlord sees a list of their properties (address, city, postcode, type, bedrooms).
2. Clicks "Add Property" — a dialog opens.
3. Fills in: address line 1, address line 2 (optional), city, postcode, property type (house/flat/studio/room), bedrooms, house rules (optional).
4. Submits — property appears in the list.
5. Empty state shows "No properties yet" message.

---

## 5. Landlord: Invite renter

**Who:** Landlord (must have at least one property)

1. Landlord navigates to Invitations page.
2. Sees a list of all sent invitations with status badges (pending, accepted, expired).
3. Clicks "Invite Renter" — dialog opens.
4. Selects a property from dropdown, enters renter email, renter name (optional), lease start date (optional), monthly rent (optional).
5. Submits — system creates an invitation with a unique token and 7-day expiry.
6. The invitation appears in the list with a "pending" badge.

---

## 6. Renter: Accept invitation

**Who:** New renter with an invitation link

1. Renter receives an email with a link containing an invitation token.
2. Clicks the link → arrives at `/invite?token=...`.
3. System validates the token (exists, not expired, still pending).
4. If token is valid — shows the property address and a registration form.
5. Renter fills in: full name, email, password, phone (optional).
6. Submits — system creates the user, profile, tenancy, and marks the invitation as accepted.
7. Renter is redirected to `/renter/onboarding`.

---

## 7. Landlord: View tenants

**Who:** Landlord

1. Landlord navigates to the Tenants page.
2. Sees a list of all renters across their properties, grouped by property.
3. Each tenant shows: name, email, tenancy status, and profile status.

---

## 8. Renter: View property details

**Who:** Renter with an active tenancy

1. Renter navigates to "My Property".
2. Sees property details: address, type, bedrooms, house rules, emergency contacts.
3. Sees tenancy details: lease start, rent amount, frequency, deposit info.
4. If no tenancy exists — message: "You don't have an active tenancy yet."

---

## 9. Renter: Upload a document

**Who:** Renter with an active tenancy

1. Renter navigates to "My Documents".
2. Sees the upload section: category dropdown + file picker + Upload button.
3. Selects a category (passport, driving licence, proof of address, payslip, etc.).
4. Selects a file (PDF, JPG, or PNG, max 10MB).
5. Clicks Upload:
   - File is uploaded to Supabase Storage at path `{tenancy_id}/{doc_id}_{filename}`.
   - A `documents` row is created with `review_status: pending`.
   - If a document already exists in this category, the new one is linked as a new version (version chain via `parent_document_id`).
6. Document appears in the list with a "Pending Review" badge.

---

## 10. Renter: View documents

**Who:** Renter with an active tenancy

1. On the "My Documents" page, renter sees their documents grouped by category.
2. Each document shows: file name, category, version number, upload date, review status badge.
3. "View" button generates a 60-second signed URL and opens the file in a new tab.
4. If a landlord left a review note — it appears as an amber callout below the document.
5. Version history is collapsible — shows all past versions with view links.

---

## 11. Landlord: Review documents

**Who:** Landlord

1. Landlord navigates to "Documents".
2. Sees all documents uploaded by tenants across their properties.
3. Each document shows: file name, category, version, uploader name, upload date, review status badge.
4. For pending documents, a "Review" button appears.
5. Clicking "Review" expands an inline review panel with:
   - A note field (optional).
   - "Accept" button — sets `review_status: accepted`.
   - "Request More Info" button — sets `review_status: more_info_needed`.
   - "Cancel" button — closes the panel.
6. After review, the badge updates immediately.

---

## 12. Renter: Onboarding checklist

**Who:** Renter

1. Renter sees the onboarding page with a "Document Checklist" card.
2. Three required documents are listed: Passport, Proof of Address, Payslip.
3. Each item shows:
   - Status icon: checkmark (accepted), amber dot (pending review), red exclamation (more info needed), empty circle (missing).
   - Status badge: Accepted, Pending Review, More Info Needed, or Missing.
   - Action link: "Upload" (if missing) or "Update" (if pending/rejected).
4. A progress bar shows: `{n} of 3 documents accepted` with a percentage.
5. If the renter's profile status is `pending`, an amber banner says: "Your account is pending approval from your landlord."

---

## 13. Sign out

**Who:** Any signed-in user

1. User clicks "Sign Out" in the navigation bar.
2. System calls `supabase.auth.signOut()`, clears session.
3. User is redirected to the login page.

---

## Flow summary

```
                    ┌──────────────┐
                    │  Landing     │
                    │  Page (/)    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Login   │ │ Register │ │  Invite  │
        │ /login   │ │/register │ │ /invite  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │            │
      ┌──────┴──────┐     │            │
      ▼             ▼     ▼            ▼
┌───────────┐ ┌───────────────────────────┐
│ LANDLORD  │ │         RENTER            │
│ DASHBOARD │ │        DASHBOARD          │
├───────────┤ ├───────────────────────────┤
│Properties │ │ Onboarding (checklist)    │
│Tenants    │ │ My Documents (upload/view)│
│Invitations│ │ My Property (details)     │
│Documents  │ │                           │
│(review)   │ │                           │
└───────────┘ └───────────────────────────┘
```
