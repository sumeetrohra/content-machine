import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  diff,
  endOf,
  formatDate,
  formatDateTime,
  formatRelative,
  isAfter,
  isBefore,
  now,
  parseDate,
  startOf,
} from './datetime-utils';

const FIXED_NOW = '2024-06-15T12:00:00.000Z';

describe('formatDate', () => {
  it('formats an ISO string into "MMM D, YYYY"', () => {
    expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024');
  });

  it('formats a numeric timestamp', () => {
    expect(formatDate(Date.UTC(2024, 11, 31, 23, 59, 59))).toBe('Dec 31, 2024');
  });

  it('formats a leap-day date', () => {
    expect(formatDate('2024-02-29T00:00:00Z')).toBe('Feb 29, 2024');
  });

  it('returns "Invalid Date" for malformed input without throwing', () => {
    expect(() => formatDate('not-a-date')).not.toThrow();
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });
});

describe('formatDateTime', () => {
  it('formats an ISO string with time', () => {
    expect(formatDateTime('2024-01-15T10:30:00Z')).toMatch(
      /^Jan 15, 2024 \d{1,2}:\d{2} (AM|PM)$/,
    );
  });

  it('uses 12-hour time with AM/PM', () => {
    const noonUtc = Date.UTC(2024, 0, 15, 12, 0, 0);
    expect(formatDateTime(noonUtc)).toMatch(/(AM|PM)$/);
  });
});

describe('formatRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('describes a past time as "ago"', () => {
    const fiveMinutesAgo = '2024-06-15T11:55:00.000Z';
    expect(formatRelative(fiveMinutesAgo)).toMatch(/ago$/);
  });

  it('describes a future time with "in"', () => {
    const inAnHour = '2024-06-15T13:00:00.000Z';
    expect(formatRelative(inAnHour)).toMatch(/^in /);
  });
});

describe('parseDate', () => {
  it('returns the canonical UTC ISO string', () => {
    expect(parseDate('2024-01-15T10:30:00Z')).toBe('2024-01-15T10:30:00.000Z');
  });

  it('normalizes timezone offsets to UTC', () => {
    expect(parseDate('2024-01-15T15:30:00+05:00')).toBe(
      '2024-01-15T10:30:00.000Z',
    );
  });
});

describe('now', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the system time as an ISO string', () => {
    expect(now()).toBe(FIXED_NOW);
  });
});

describe('isAfter / isBefore', () => {
  const earlier = '2024-01-01T00:00:00Z';
  const later = '2024-06-01T00:00:00Z';

  it('isAfter is true when A > B', () => {
    expect(isAfter(later, earlier)).toBe(true);
  });

  it('isAfter is false when A < B', () => {
    expect(isAfter(earlier, later)).toBe(false);
  });

  it('isAfter is false for equal instants', () => {
    expect(isAfter(earlier, earlier)).toBe(false);
  });

  it('isBefore is true when A < B', () => {
    expect(isBefore(earlier, later)).toBe(true);
  });

  it('isBefore is false when A > B', () => {
    expect(isBefore(later, earlier)).toBe(false);
  });

  it('isBefore is false for equal instants', () => {
    expect(isBefore(earlier, earlier)).toBe(false);
  });

  it('accepts numeric timestamps', () => {
    expect(isAfter(Date.UTC(2024, 5, 1), Date.UTC(2024, 0, 1))).toBe(true);
  });
});

describe('diff', () => {
  it('defaults to milliseconds', () => {
    expect(diff('2024-01-01T00:00:01.000Z', '2024-01-01T00:00:00.000Z')).toBe(
      1000,
    );
  });

  it('returns whole days for "day" unit', () => {
    expect(diff('2024-01-15T00:00:00Z', '2024-01-10T00:00:00Z', 'day')).toBe(5);
  });

  it('returns whole hours for "hour" unit', () => {
    expect(diff('2024-01-01T05:00:00Z', '2024-01-01T00:00:00Z', 'hour')).toBe(
      5,
    );
  });

  it('truncates fractional days (floor toward zero)', () => {
    expect(diff('2024-01-02T11:00:00Z', '2024-01-01T00:00:00Z', 'day')).toBe(1);
  });

  it('returns negative values when A is before B', () => {
    expect(diff('2024-01-01T00:00:00Z', '2024-01-10T00:00:00Z', 'day')).toBe(
      -9,
    );
  });

  it('returns 0 for identical instants', () => {
    const t = '2024-01-01T00:00:00Z';
    expect(diff(t, t, 'second')).toBe(0);
  });
});

describe('startOf / endOf', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:34:56.789Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('startOf("year") returns Jan 1 of the current year at 00:00:00 local', () => {
    const iso = startOf('year');
    const parsed = new Date(iso);
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(1);
  });

  it('endOf("year") returns Dec 31 23:59:59.999 local', () => {
    const iso = endOf('year');
    const parsed = new Date(iso);
    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(11);
    expect(parsed.getDate()).toBe(31);
    expect(parsed.getMilliseconds()).toBe(999);
  });

  it('startOf("month") returns first day of the current month', () => {
    const iso = startOf('month');
    const parsed = new Date(iso);
    expect(parsed.getDate()).toBe(1);
    expect(parsed.getMonth()).toBe(5);
  });

  it('endOf("month") returns last day of the current month at 23:59:59.999', () => {
    const iso = endOf('month');
    const parsed = new Date(iso);
    expect(parsed.getMonth()).toBe(5);
    expect(parsed.getDate()).toBe(30);
    expect(parsed.getHours()).toBe(23);
    expect(parsed.getMinutes()).toBe(59);
  });

  it('startOf("week") and endOf("week") span exactly 7 days minus 1ms', () => {
    const start = new Date(startOf('week')).getTime();
    const end = new Date(endOf('week')).getTime();
    const sevenDaysMinusOneMs = 7 * 24 * 60 * 60 * 1000 - 1;
    expect(end - start).toBe(sevenDaysMinusOneMs);
  });
});
