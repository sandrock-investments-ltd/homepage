// In-memory data store for mock Supabase client
// Uses globalThis to survive hot reloads in Next.js dev mode

export type MockUser = {
  id: string
  email: string
  password: string
  user_metadata: Record<string, unknown>
}

export type MockAuthState = {
  currentUser: MockUser | null
  currentSession: { access_token: string; user: MockUser } | null
  listeners: Array<(event: string, session: { access_token: string; user: MockUser } | null) => void>
}

export type MockStore = {
  tables: Map<string, Record<string, unknown>[]>
  users: Map<string, MockUser>
  auth: MockAuthState
  storage: Map<string, Blob | File>
  reset: () => void
  seed: (scenario: string) => void
  getTable: (name: string) => Record<string, unknown>[]
  setAuth: (user: MockUser) => void
  clearAuth: () => void
}

function createStore(): MockStore {
  const store: MockStore = {
    tables: new Map(),
    users: new Map(),
    auth: {
      currentUser: null,
      currentSession: null,
      listeners: [],
    },
    storage: new Map(),

    reset() {
      store.tables.clear()
      store.users.clear()
      store.auth.currentUser = null
      store.auth.currentSession = null
      store.auth.listeners = []
      store.storage.clear()
    },

    seed(scenario: string) {
      // Dynamically import seed to avoid circular deps — but since this is sync,
      // we inline the seed logic via a callback registered externally
      const seedFn = (globalThis as Record<string, unknown>).__sandrockSeedFn as
        | ((store: MockStore, scenario: string) => void)
        | undefined
      if (seedFn) {
        seedFn(store, scenario)
      }
    },

    getTable(name: string) {
      if (!store.tables.has(name)) {
        store.tables.set(name, [])
      }
      return store.tables.get(name)!
    },

    setAuth(user: MockUser) {
      store.auth.currentUser = user
      const session = { access_token: `mock-token-${user.id}`, user }
      store.auth.currentSession = session
      store.auth.listeners.forEach((fn) => fn('SIGNED_IN', session))
    },

    clearAuth() {
      store.auth.currentUser = null
      store.auth.currentSession = null
      store.auth.listeners.forEach((fn) => fn('SIGNED_OUT', null))
    },
  }

  return store
}

// Singleton — survives hot reloads
const g = globalThis as Record<string, unknown>
if (!g.__sandrockMockStore) {
  g.__sandrockMockStore = createStore()
}

export const mockStore = g.__sandrockMockStore as MockStore

// Expose on window for Playwright test control
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__mockStore = mockStore
}
