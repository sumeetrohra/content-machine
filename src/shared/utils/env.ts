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
  get SUPABASE_URL(): string {
    return import.meta.env.VITE_SUPABASE_URL ?? '';
  },
  get SUPABASE_ANON_KEY(): string {
    return import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  },
};
