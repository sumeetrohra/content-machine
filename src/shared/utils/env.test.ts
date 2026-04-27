import { afterEach, describe, expect, it, vi } from 'vitest';

import { env } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

// vi.stubEnv with `undefined` removes the env var entirely, which is the only
// way to trigger the `??` fallback; passing '' would set it to a real (empty)
// string and bypass the fallback.
const unset = undefined as unknown as string;

describe('env defaults — undefined env vars trigger the ?? fallback', () => {
  it('API_BASE_URL falls back to http://localhost:3000', () => {
    vi.stubEnv('VITE_API_BASE_URL', unset);
    expect(env.API_BASE_URL).toBe('http://localhost:3000');
  });

  it('SENTRY_DSN falls back to empty string', () => {
    vi.stubEnv('VITE_SENTRY_DSN', unset);
    expect(env.SENTRY_DSN).toBe('');
  });

  it('FIREBASE_FUNCTIONS_REGION falls back to us-central1', () => {
    vi.stubEnv('VITE_FIREBASE_FUNCTIONS_REGION', unset);
    expect(env.FIREBASE_FUNCTIONS_REGION).toBe('us-central1');
  });

  it('FIREBASE_USE_EMULATOR is false when undefined', () => {
    vi.stubEnv('VITE_FIREBASE_USE_EMULATOR', unset);
    expect(env.FIREBASE_USE_EMULATOR).toBe(false);
  });

  it('all FIREBASE_* string vars fall back to empty strings', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', unset);
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', unset);
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', unset);
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', unset);
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', unset);
    vi.stubEnv('VITE_FIREBASE_APP_ID', unset);
    expect(env.FIREBASE_API_KEY).toBe('');
    expect(env.FIREBASE_AUTH_DOMAIN).toBe('');
    expect(env.FIREBASE_PROJECT_ID).toBe('');
    expect(env.FIREBASE_STORAGE_BUCKET).toBe('');
    expect(env.FIREBASE_MESSAGING_SENDER_ID).toBe('');
    expect(env.FIREBASE_APP_ID).toBe('');
  });

  it('an empty-string env var is preserved (?? does not coerce "" to fallback)', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    expect(env.API_BASE_URL).toBe('');
  });
});

describe('env reads custom values when set', () => {
  it('reads API_BASE_URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    expect(env.API_BASE_URL).toBe('https://api.example.com');
  });

  it('reads each FIREBASE_* var verbatim', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'AIzaTEST');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'app.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'my-project');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'my-project.appspot.com');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '1234567890');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:abc:web:def');
    vi.stubEnv('VITE_FIREBASE_FUNCTIONS_REGION', 'europe-west1');

    expect(env.FIREBASE_API_KEY).toBe('AIzaTEST');
    expect(env.FIREBASE_AUTH_DOMAIN).toBe('app.firebaseapp.com');
    expect(env.FIREBASE_PROJECT_ID).toBe('my-project');
    expect(env.FIREBASE_STORAGE_BUCKET).toBe('my-project.appspot.com');
    expect(env.FIREBASE_MESSAGING_SENDER_ID).toBe('1234567890');
    expect(env.FIREBASE_APP_ID).toBe('1:abc:web:def');
    expect(env.FIREBASE_FUNCTIONS_REGION).toBe('europe-west1');
  });
});

describe('FIREBASE_USE_EMULATOR boolean parsing', () => {
  it('is true only for the exact string "1"', () => {
    vi.stubEnv('VITE_FIREBASE_USE_EMULATOR', '1');
    expect(env.FIREBASE_USE_EMULATOR).toBe(true);
  });

  it('is false for "0"', () => {
    vi.stubEnv('VITE_FIREBASE_USE_EMULATOR', '0');
    expect(env.FIREBASE_USE_EMULATOR).toBe(false);
  });

  it('is false for "true" (only "1" counts)', () => {
    vi.stubEnv('VITE_FIREBASE_USE_EMULATOR', 'true');
    expect(env.FIREBASE_USE_EMULATOR).toBe(false);
  });

  it('is false for an empty string', () => {
    vi.stubEnv('VITE_FIREBASE_USE_EMULATOR', '');
    expect(env.FIREBASE_USE_EMULATOR).toBe(false);
  });
});
