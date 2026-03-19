// Mock Supabase Storage
import { mockStore } from './store'

export function createMockStorage() {
  return {
    from(bucket: string) {
      return {
        async upload(path: string, file: File | Blob) {
          const key = `${bucket}/${path}`
          mockStore.storage.set(key, file)
          return { data: { path }, error: null }
        },

        async createSignedUrl(path: string, _expiresInSeconds: number) {
          const key = `${bucket}/${path}`
          const file = mockStore.storage.get(key)
          if (file) {
            const url = URL.createObjectURL(file)
            return { data: { signedUrl: url }, error: null }
          }
          // Return a placeholder URL even if file doesn't exist (for seeded data)
          return { data: { signedUrl: `blob:mock/${bucket}/${path}` }, error: null }
        },

        async remove(paths: string[]) {
          for (const path of paths) {
            mockStore.storage.delete(`${bucket}/${path}`)
          }
          return { data: paths.map((p) => ({ name: p })), error: null }
        },

        async list(prefix?: string) {
          const matchPrefix = `${bucket}/${prefix ?? ''}`
          const items: { name: string }[] = []
          for (const key of mockStore.storage.keys()) {
            if (key.startsWith(matchPrefix)) {
              items.push({ name: key.slice(bucket.length + 1) })
            }
          }
          return { data: items, error: null }
        },
      }
    },
  }
}
