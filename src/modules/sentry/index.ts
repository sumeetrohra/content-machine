import * as Sentry from '@sentry/react';
import type { TAppError } from '@/shared/utils/errors';

/**
 * Initialize Sentry with React integration, browser tracing, and replay.
 */
export const initSentry = (dsn: string): void => {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
};

/**
 * Capture a structured TAppError in Sentry.
 */
export const captureAppError = (error: TAppError): void => {
  Sentry.captureException(error.message, {
    tags: { errorCode: error.code },
    extra: error.context,
  });
};

/**
 * Capture a raw unknown error in Sentry.
 */
export const captureException = (error: unknown): void => {
  Sentry.captureException(error);
};

/**
 * Set the current user context in Sentry.
 */
export const setUser = (user: {
  id: string;
  email?: string;
  username?: string;
}): void => {
  Sentry.setUser(user);
};

/**
 * Clear the current user context from Sentry.
 */
export const clearUser = (): void => {
  Sentry.setUser(null);
};

/**
 * Re-export Sentry ErrorBoundary as SentryErrorBoundary.
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
