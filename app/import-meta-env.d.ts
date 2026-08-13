// app/import-meta-env.d.ts
interface ImportMetaEnv {
  readonly DEV?: boolean
  readonly PROD?: boolean
  readonly MODE?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_AI_HELPER_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly [key: string]: string | boolean | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
