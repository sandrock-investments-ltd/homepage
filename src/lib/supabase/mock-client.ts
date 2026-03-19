// Assembles the mock Supabase client from individual mock modules
import './mock/seed' // Register seed function on globalThis
import { mockStore } from './mock/store'
import { createQueryBuilder } from './mock/query-builder'
import { createMockAuth } from './mock/auth'
import { createMockStorage } from './mock/storage'

const queryBuilder = createQueryBuilder()

export const mockSupabase = {
  from: queryBuilder.from.bind(queryBuilder),
  auth: createMockAuth(),
  storage: createMockStorage(),
}

// Auto-seed on first load. Tests can set __sandrockMockSeedOverride via addInitScript
// to use a different scenario.
if (mockStore.tables.size === 0 && mockStore.users.size === 0) {
  const g = globalThis as Record<string, unknown>
  const scenario = (g.__sandrockMockSeedOverride as string) ?? 'default'
  mockStore.seed(scenario)
}
