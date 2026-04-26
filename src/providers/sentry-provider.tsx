import { initSentry } from '@/modules/sentry';
import { env } from '@/shared/utils/env';

/**
 * Initialize Sentry monitoring.
 * Call this once at application startup.
 */
export const initSentryProvider = (): void => {
  if (env.SENTRY_DSN) {
    initSentry(env.SENTRY_DSN);
  }
};
