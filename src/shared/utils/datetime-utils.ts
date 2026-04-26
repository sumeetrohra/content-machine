import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(utc);

/**
 * Format a date string or timestamp to a human-readable date.
 * @example formatDate('2024-01-15T10:30:00Z') => 'Jan 15, 2024'
 */
export const formatDate = (date: string | number): string => {
  return dayjs(date).format('MMM D, YYYY');
};

/**
 * Format a date string or timestamp to a human-readable date with time.
 * @example formatDateTime('2024-01-15T10:30:00Z') => 'Jan 15, 2024 10:30 AM'
 */
export const formatDateTime = (date: string | number): string => {
  return dayjs(date).format('MMM D, YYYY h:mm A');
};

/**
 * Format a date as a relative time string.
 * @example formatRelative('2024-01-15T10:30:00Z') => '2 hours ago'
 */
export const formatRelative = (date: string | number): string => {
  return dayjs(date).fromNow();
};

/**
 * Parse a date string into a dayjs instance (UTC).
 * Returns the ISO string representation.
 */
export const parseDate = (date: string): string => {
  return dayjs.utc(date).toISOString();
};

/**
 * Get the current timestamp as an ISO string.
 */
export const now = (): string => {
  return dayjs().toISOString();
};

/**
 * Check if dateA is after dateB.
 */
export const isAfter = (
  dateA: string | number,
  dateB: string | number,
): boolean => {
  return dayjs(dateA).isAfter(dayjs(dateB));
};

/**
 * Check if dateA is before dateB.
 */
export const isBefore = (
  dateA: string | number,
  dateB: string | number,
): boolean => {
  return dayjs(dateA).isBefore(dayjs(dateB));
};

/**
 * Get the difference between two dates in the specified unit.
 * @example diff('2024-01-15', '2024-01-10', 'day') => 5
 */
export const diff = (
  dateA: string | number,
  dateB: string | number,
  unit: dayjs.QUnitType | dayjs.OpUnitType = 'millisecond',
): number => {
  return dayjs(dateA).diff(dayjs(dateB), unit);
};
