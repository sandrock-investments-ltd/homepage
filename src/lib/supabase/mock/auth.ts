// Mock Supabase Auth that works with the in-memory store
import { mockStore, type MockUser } from './store'

export function createMockAuth() {
  return {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const user = Array.from(mockStore.users.values()).find(
        (u) => u.email === email && u.password === password
      )

      if (!user) {
        return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } }
      }

      mockStore.setAuth(user)
      const session = mockStore.auth.currentSession!

      return {
        data: {
          user: toSupabaseUser(user),
          session: { access_token: session.access_token, user: toSupabaseUser(user) },
        },
        error: null,
      }
    },

    async signUp({
      email,
      password,
      options,
    }: {
      email: string
      password: string
      options?: { data?: Record<string, unknown> }
    }) {
      if (Array.from(mockStore.users.values()).some((u) => u.email === email)) {
        return { data: { user: null, session: null }, error: { message: 'User already registered' } }
      }

      const user: MockUser = {
        id: crypto.randomUUID(),
        email,
        password,
        user_metadata: options?.data ?? {},
      }

      mockStore.users.set(user.id, user)
      mockStore.setAuth(user)

      return {
        data: {
          user: toSupabaseUser(user),
          session: mockStore.auth.currentSession,
        },
        error: null,
      }
    },

    async signOut() {
      mockStore.clearAuth()
      return { error: null }
    },

    async getSession() {
      const session = mockStore.auth.currentSession
      if (!session) {
        return { data: { session: null }, error: null }
      }
      return {
        data: {
          session: {
            access_token: session.access_token,
            user: toSupabaseUser(session.user),
          },
        },
        error: null,
      }
    },

    async getUser() {
      const user = mockStore.auth.currentUser
      return {
        data: { user: user ? toSupabaseUser(user) : null },
        error: null,
      }
    },

    onAuthStateChange(callback: (event: string, session: unknown) => void) {
      mockStore.auth.listeners.push(callback)

      // Fire immediately with current state
      if (mockStore.auth.currentSession) {
        const session = mockStore.auth.currentSession
        setTimeout(() => {
          callback('INITIAL_SESSION', {
            access_token: session.access_token,
            user: toSupabaseUser(session.user),
          })
        }, 0)
      }

      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = mockStore.auth.listeners.indexOf(callback)
              if (idx >= 0) mockStore.auth.listeners.splice(idx, 1)
            },
          },
        },
      }
    },
  }
}

function toSupabaseUser(user: MockUser) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }
}
