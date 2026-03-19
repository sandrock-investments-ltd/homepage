import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

function createRealClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

function loadMockClient() {
  // Dynamic import to keep mock code out of production builds
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./mock-client').mockSupabase
}

export const supabase: ReturnType<typeof createRealClient> = useMock
  ? loadMockClient()
  : createRealClient()
