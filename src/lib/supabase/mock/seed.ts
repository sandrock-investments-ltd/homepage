// Seed data for mock Supabase
import type { MockStore, MockUser } from './store'

// Fixed IDs for test predictability
const LANDLORD_ID = '11111111-1111-1111-1111-111111111111'
const RENTER_ID = '22222222-2222-2222-2222-222222222222'
const PROPERTY_ID = 'aaaa1111-1111-1111-1111-111111111111'
const TENANCY_ID = 'bbbb1111-1111-1111-1111-111111111111'
const DOCUMENT_ID = 'cccc1111-1111-1111-1111-111111111111'
const INVITATION_PENDING_ID = 'dddd1111-1111-1111-1111-111111111111'
const INVITATION_ACCEPTED_ID = 'dddd2222-2222-2222-2222-222222222222'

const LANDLORD: MockUser = {
  id: LANDLORD_ID,
  email: 'riyad@sandrock.test',
  password: 'password123',
  user_metadata: { full_name: 'Riyad Attani', role: 'landlord' },
}

const RENTER: MockUser = {
  id: RENTER_ID,
  email: 'jane@renter.test',
  password: 'password123',
  user_metadata: { full_name: 'Jane Smith', role: 'renter' },
}

function registerUsers(store: MockStore) {
  store.users.set(LANDLORD.id, LANDLORD)
  store.users.set(RENTER.id, RENTER)
}

function seedDefault(store: MockStore) {
  registerUsers(store)

  store.getTable('profiles').push(
    {
      id: LANDLORD_ID,
      role: 'landlord',
      full_name: 'Riyad Attani',
      phone: null,
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: RENTER_ID,
      role: 'renter',
      full_name: 'Jane Smith',
      phone: null,
      status: 'pending',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    }
  )

  store.getTable('properties').push({
    id: PROPERTY_ID,
    landlord_id: LANDLORD_ID,
    address_line_1: '42 Brick Lane',
    address_line_2: null,
    city: 'London',
    postcode: 'E1 6RF',
    property_type: 'flat',
    bedrooms: 2,
    status: 'active',
    emergency_contacts: '[]',
    house_rules: null,
    move_in_guide: null,
    wifi_details: null,
    utility_info: null,
    bin_collection_day: null,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  })

  store.getTable('tenancies').push({
    id: TENANCY_ID,
    property_id: PROPERTY_ID,
    renter_id: RENTER_ID,
    lease_start: '2025-02-01',
    lease_end: null,
    rent_amount_pence: 150000,
    rent_frequency: 'monthly',
    deposit_amount_pence: null,
    deposit_scheme: null,
    deposit_reference: null,
    status: 'active',
    created_at: '2025-01-20T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
  })

  store.getTable('documents').push({
    id: DOCUMENT_ID,
    tenancy_id: TENANCY_ID,
    uploaded_by: RENTER_ID,
    category: 'passport',
    file_name: 'passport.pdf',
    file_size: 102400,
    mime_type: 'application/pdf',
    storage_path: `${TENANCY_ID}/${DOCUMENT_ID}_passport.pdf`,
    version: 1,
    parent_document_id: null,
    review_status: 'pending',
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    expires_at: null,
    created_at: '2025-02-01T00:00:00Z',
  })

  store.getTable('invitations').push(
    {
      id: INVITATION_ACCEPTED_ID,
      property_id: PROPERTY_ID,
      invited_by: LANDLORD_ID,
      email: 'jane@renter.test',
      token: 'token-accepted',
      renter_name: 'Jane Smith',
      lease_start: '2025-02-01',
      rent_amount_pence: 150000,
      status: 'accepted',
      expires_at: '2025-02-01T00:00:00Z',
      created_at: '2025-01-10T00:00:00Z',
    },
    {
      id: INVITATION_PENDING_ID,
      property_id: PROPERTY_ID,
      invited_by: LANDLORD_ID,
      email: 'new-renter@test.com',
      token: 'token-pending',
      renter_name: 'New Renter',
      lease_start: null,
      rent_amount_pence: null,
      status: 'pending',
      expires_at: '2099-12-31T00:00:00Z',
      created_at: '2025-03-01T00:00:00Z',
    }
  )
}

function seedEmptyLandlord(store: MockStore) {
  registerUsers(store)

  store.getTable('profiles').push({
    id: LANDLORD_ID,
    role: 'landlord',
    full_name: 'Riyad Attani',
    phone: null,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  })
}

function seedFreshRenter(store: MockStore) {
  registerUsers(store)

  store.getTable('profiles').push(
    {
      id: LANDLORD_ID,
      role: 'landlord',
      full_name: 'Riyad Attani',
      phone: null,
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: RENTER_ID,
      role: 'renter',
      full_name: 'Jane Smith',
      phone: null,
      status: 'pending',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    }
  )

  store.getTable('properties').push({
    id: PROPERTY_ID,
    landlord_id: LANDLORD_ID,
    address_line_1: '42 Brick Lane',
    address_line_2: null,
    city: 'London',
    postcode: 'E1 6RF',
    property_type: 'flat',
    bedrooms: 2,
    status: 'active',
    emergency_contacts: '[]',
    house_rules: null,
    move_in_guide: null,
    wifi_details: null,
    utility_info: null,
    bin_collection_day: null,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  })

  store.getTable('tenancies').push({
    id: TENANCY_ID,
    property_id: PROPERTY_ID,
    renter_id: RENTER_ID,
    lease_start: '2025-02-01',
    lease_end: null,
    rent_amount_pence: 150000,
    rent_frequency: 'monthly',
    deposit_amount_pence: null,
    deposit_scheme: null,
    deposit_reference: null,
    status: 'active',
    created_at: '2025-01-20T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
  })
}

// Register the seed function on globalThis so store.seed() can call it
;(globalThis as Record<string, unknown>).__sandrockSeedFn = (store: MockStore, scenario: string) => {
  switch (scenario) {
    case 'empty-landlord':
      seedEmptyLandlord(store)
      break
    case 'fresh-renter':
      seedFreshRenter(store)
      break
    case 'default':
    default:
      seedDefault(store)
      break
  }
}
