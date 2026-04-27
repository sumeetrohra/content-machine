import { describe, it, expect } from 'vitest';

import { fromRawError, toUserFacingError, type TAppError } from './errors';

describe('fromRawError', () => {
  it('returns an existing TAppError unchanged', () => {
    const appError: TAppError = {
      code: 'NETWORK_ERROR',
      message: 'offline',
      context: { attempt: 2 },
    };

    expect(fromRawError(appError)).toBe(appError);
  });

  it('wraps an Error instance with name and stack in context', () => {
    const raw = new Error('boom');
    const result = fromRawError(raw);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('boom');
    expect(result.context?.name).toBe('Error');
    expect(typeof result.context?.stack).toBe('string');
  });

  it('wraps a string error', () => {
    expect(fromRawError('something failed')).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'something failed',
    });
  });

  it('wraps a non-string non-Error value with a generic message', () => {
    const result = fromRawError(42);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unexpected error occurred');
    expect(result.context).toEqual({ rawError: '42' });
  });
});

describe('toUserFacingError', () => {
  it('returns the canned message for a known code', () => {
    const error: TAppError = {
      code: 'NETWORK_ERROR',
      message: 'internal: socket hang up',
    };

    expect(toUserFacingError(error)).toBe(
      'Unable to connect. Please check your internet connection.',
    );
  });

  it('falls back to error.message for an unknown code', () => {
    const error: TAppError = {
      code: 'SOMETHING_WEIRD',
      message: 'raw message for the user',
    };

    expect(toUserFacingError(error)).toBe('raw message for the user');
  });
});
