import type { z } from 'zod';
import { z as zod } from 'zod';

export const TS_MARKER = '@@firestore-timestamp';
export const VEC_MARKER_PREFIX = '@@firestore-vector:';

export function ts() {
  return zod.string().describe(TS_MARKER);
}

export function vec(dim: number) {
  return zod.array(zod.number()).describe(`${VEC_MARKER_PREFIX}${dim}`);
}

export type TCollectionDef = {
  name: string;
  typeName: string;
  ownerField: string;
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  defaultOrderBy?: { field: string; dir: 'asc' | 'desc' };
  managed?: readonly string[];
};

export function defineCollection<T extends TCollectionDef>(def: T): T {
  return def;
}
