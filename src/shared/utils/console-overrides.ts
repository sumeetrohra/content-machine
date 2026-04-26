import { captureException } from '@/modules/sentry';

/**
 * Initialize console overrides for production.
 *
 * In production:
 * - console.log, console.warn, console.info are silenced (no-op)
 * - console.error routes through Sentry captureException
 *
 * In development:
 * - All console methods are left untouched
 */
export const initConsoleOverrides = (): void => {
  if (!import.meta.env.PROD) {
    return;
  }

  const originalConsoleError = console.error;

  // Silence informational logs in production
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};

  // Route errors through Sentry
  console.error = (...args: unknown[]) => {
    const message = args
      .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
      .join(' ');

    captureException(message);

    // Still call original console.error for devtools visibility
    originalConsoleError.apply(console, args);
  };
};
