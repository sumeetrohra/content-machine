import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { captureExceptionMock } = vi.hoisted(() => ({
  captureExceptionMock: vi.fn(),
}));

vi.mock('@/modules/sentry', () => ({
  captureException: (msg: unknown) => captureExceptionMock(msg),
}));

type TConsoleSnapshot = {
  log: typeof console.log;
  warn: typeof console.warn;
  info: typeof console.info;
  error: typeof console.error;
};

const snapshot = (): TConsoleSnapshot => ({
  log: console.log,
  warn: console.warn,
  info: console.info,
  error: console.error,
});

const restore = (snap: TConsoleSnapshot): void => {
  console.log = snap.log;
  console.warn = snap.warn;
  console.info = snap.info;
  console.error = snap.error;
};

describe('initConsoleOverrides — development', () => {
  let original: TConsoleSnapshot;

  beforeEach(() => {
    original = snapshot();
    vi.stubEnv('PROD', false);
    vi.stubEnv('MODE', 'development');
    vi.resetModules();
    captureExceptionMock.mockClear();
  });

  afterEach(() => {
    restore(original);
    vi.unstubAllEnvs();
  });

  it('does not replace any console method', async () => {
    const { initConsoleOverrides } = await import('./console-overrides');
    initConsoleOverrides();

    expect(console.log).toBe(original.log);
    expect(console.warn).toBe(original.warn);
    expect(console.info).toBe(original.info);
    expect(console.error).toBe(original.error);
  });
});

describe('initConsoleOverrides — production', () => {
  let original: TConsoleSnapshot;

  beforeEach(() => {
    original = snapshot();
    vi.stubEnv('PROD', true);
    vi.stubEnv('MODE', 'production');
    vi.resetModules();
    captureExceptionMock.mockClear();
  });

  afterEach(() => {
    restore(original);
    vi.unstubAllEnvs();
  });

  it('silences console.log/warn/info (replaced with no-ops)', async () => {
    const { initConsoleOverrides } = await import('./console-overrides');
    initConsoleOverrides();

    expect(console.log).not.toBe(original.log);
    expect(console.warn).not.toBe(original.warn);
    expect(console.info).not.toBe(original.info);

    expect(() => console.log('hidden')).not.toThrow();
    expect(() => console.warn('hidden')).not.toThrow();
    expect(() => console.info('hidden')).not.toThrow();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('routes console.error through Sentry as a string', async () => {
    const errorSpy = vi.fn();
    console.error = errorSpy;
    original.error = errorSpy;

    const { initConsoleOverrides } = await import('./console-overrides');
    initConsoleOverrides();

    console.error('boom', 'bang');

    expect(captureExceptionMock).toHaveBeenCalledWith('boom bang');
    expect(errorSpy).toHaveBeenCalledWith('boom', 'bang');
  });

  it('JSON-serializes non-string args before sending to Sentry', async () => {
    console.error = vi.fn();
    original.error = console.error;

    const { initConsoleOverrides } = await import('./console-overrides');
    initConsoleOverrides();

    console.error('failure', { code: 42, detail: 'oops' });

    expect(captureExceptionMock).toHaveBeenCalledWith(
      'failure {"code":42,"detail":"oops"}',
    );
  });
});
