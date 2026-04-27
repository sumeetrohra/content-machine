/**
 * Typed access to Vite environment variables.
 * Isolated so that tools like Orval (which use esbuild internally)
 * never need to parse import.meta themselves.
 */
export const env = {
  get API_BASE_URL(): string {
    return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  },
  get SENTRY_DSN(): string {
    return import.meta.env.VITE_SENTRY_DSN ?? '';
  },
  get FIREBASE_API_KEY(): string {
    return import.meta.env.VITE_FIREBASE_API_KEY ?? '';
  },
  get FIREBASE_AUTH_DOMAIN(): string {
    return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '';
  },
  get FIREBASE_PROJECT_ID(): string {
    return import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '';
  },
  get FIREBASE_STORAGE_BUCKET(): string {
    return import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '';
  },
  get FIREBASE_MESSAGING_SENDER_ID(): string {
    return import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '';
  },
  get FIREBASE_APP_ID(): string {
    return import.meta.env.VITE_FIREBASE_APP_ID ?? '';
  },
  get FIREBASE_FUNCTIONS_REGION(): string {
    return import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? 'us-central1';
  },
  get FIREBASE_USE_EMULATOR(): boolean {
    return import.meta.env.VITE_FIREBASE_USE_EMULATOR === '1';
  },
};
