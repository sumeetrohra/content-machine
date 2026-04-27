import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const init = vi.fn();
  const captureException = vi.fn();
  const setUser = vi.fn();
  const browserTracingIntegration = vi.fn(() => ({ name: 'browser-tracing' }));
  const replayIntegration = vi.fn(() => ({ name: 'replay' }));
  const errorBoundarySentinel = { __isErrorBoundary: true };
  return {
    init,
    captureException,
    setUser,
    browserTracingIntegration,
    replayIntegration,
    errorBoundarySentinel,
  };
});

vi.mock('@sentry/react', () => ({
  init: mocks.init,
  captureException: mocks.captureException,
  setUser: mocks.setUser,
  browserTracingIntegration: mocks.browserTracingIntegration,
  replayIntegration: mocks.replayIntegration,
  ErrorBoundary: mocks.errorBoundarySentinel,
}));

import {
  captureAppError,
  captureException,
  clearUser,
  initSentry,
  SentryErrorBoundary,
  setUser,
} from './index';

beforeEach(() => {
  mocks.init.mockClear();
  mocks.captureException.mockClear();
  mocks.setUser.mockClear();
  mocks.browserTracingIntegration.mockClear();
  mocks.replayIntegration.mockClear();
});

describe('initSentry', () => {
  it('is a no-op when DSN is empty', () => {
    initSentry('');
    expect(mocks.init).not.toHaveBeenCalled();
  });

  it('initializes Sentry with the DSN and integrations when DSN is provided', () => {
    initSentry('https://example@sentry.io/1');

    expect(mocks.init).toHaveBeenCalledTimes(1);
    const config = mocks.init.mock.calls[0]![0] as {
      dsn: string;
      integrations: unknown[];
      tracesSampleRate: number;
      replaysSessionSampleRate: number;
      replaysOnErrorSampleRate: number;
    };
    expect(config.dsn).toBe('https://example@sentry.io/1');
    expect(config.integrations).toHaveLength(2);
    expect(config.tracesSampleRate).toBe(1.0);
    expect(config.replaysSessionSampleRate).toBe(0.1);
    expect(config.replaysOnErrorSampleRate).toBe(1.0);
    expect(mocks.browserTracingIntegration).toHaveBeenCalledTimes(1);
    expect(mocks.replayIntegration).toHaveBeenCalledTimes(1);
  });
});

describe('captureAppError', () => {
  it('forwards the message and tags errorCode + extra context', () => {
    captureAppError({
      code: 'NETWORK_ERROR',
      message: 'offline',
      context: { attempt: 2 },
    });

    expect(mocks.captureException).toHaveBeenCalledTimes(1);
    expect(mocks.captureException).toHaveBeenCalledWith('offline', {
      tags: { errorCode: 'NETWORK_ERROR' },
      extra: { attempt: 2 },
    });
  });

  it('forwards undefined extras when context is missing', () => {
    captureAppError({ code: 'X', message: 'm' });
    expect(mocks.captureException).toHaveBeenCalledWith('m', {
      tags: { errorCode: 'X' },
      extra: undefined,
    });
  });
});

describe('captureException', () => {
  it('forwards arbitrary values directly', () => {
    const e = new Error('raw');
    captureException(e);
    expect(mocks.captureException).toHaveBeenCalledWith(e);
  });

  it('forwards a string', () => {
    captureException('something');
    expect(mocks.captureException).toHaveBeenCalledWith('something');
  });
});

describe('setUser / clearUser', () => {
  it('setUser forwards id/email/username', () => {
    setUser({ id: 'u1', email: 'a@b.c', username: 'alice' });
    expect(mocks.setUser).toHaveBeenCalledWith({
      id: 'u1',
      email: 'a@b.c',
      username: 'alice',
    });
  });

  it('setUser tolerates partial fields', () => {
    setUser({ id: 'u1' });
    expect(mocks.setUser).toHaveBeenCalledWith({ id: 'u1' });
  });

  it('clearUser passes null to Sentry.setUser', () => {
    clearUser();
    expect(mocks.setUser).toHaveBeenCalledWith(null);
  });
});

describe('SentryErrorBoundary', () => {
  it('re-exports Sentry.ErrorBoundary by reference', () => {
    expect(SentryErrorBoundary).toBe(mocks.errorBoundarySentinel);
  });
});
