import { Timestamp } from 'firebase/firestore';

export const tsToIso = (value: unknown): string | null =>
  value instanceof Timestamp ? value.toDate().toISOString() : null;

export const isoToTs = (value: string | null): Timestamp | null => {
  if (value === null) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  return Timestamp.fromMillis(ms);
};
