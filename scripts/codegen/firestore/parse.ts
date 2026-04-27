import type { z } from 'zod';
import { TS_MARKER, VEC_MARKER_PREFIX, type TCollectionDef } from './dsl';

export type TFieldKind =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'enum'; values: readonly string[] }
  | { kind: 'timestamp' }
  | { kind: 'vector'; dim: number };

export type TField = {
  name: string;
  kind: TFieldKind;
  nullable: boolean;
  optional: boolean;
};

export type TParsedCollection = {
  name: string;
  typeName: string;
  ownerField: string;
  defaultOrderBy?: { field: string; dir: 'asc' | 'desc' };
  managed: readonly string[];
  fields: TField[];
};

export function parseCollection(def: TCollectionDef): TParsedCollection {
  const shape = def.schema.shape;
  const declared: TField[] = Object.entries(shape).map(([name, raw]) =>
    parseField(name, raw as z.ZodTypeAny),
  );

  const managed = def.managed ?? [];
  const fields = [...declared];
  for (const m of managed) {
    if (!fields.some(f => f.name === m)) {
      fields.push({
        name: m,
        kind: { kind: 'timestamp' },
        nullable: false,
        optional: false,
      });
    }
  }

  return {
    name: def.name,
    typeName: def.typeName,
    ownerField: def.ownerField,
    defaultOrderBy: def.defaultOrderBy,
    managed,
    fields,
  };
}

type TZodNode = {
  description?: string;
  options?: readonly string[];
  _zod: {
    def: {
      type: string;
      innerType?: TZodNode;
      entries?: Record<string, string>;
    };
  };
};

function parseField(name: string, schema: z.ZodTypeAny): TField {
  let nullable = false;
  let optional = false;
  let cur = schema as unknown as TZodNode;

  while (true) {
    const t = cur._zod?.def?.type;
    if (t === 'nullable' && cur._zod.def.innerType) {
      nullable = true;
      cur = cur._zod.def.innerType;
    } else if (t === 'optional' && cur._zod.def.innerType) {
      optional = true;
      cur = cur._zod.def.innerType;
    } else if (t === 'default' && cur._zod.def.innerType) {
      cur = cur._zod.def.innerType;
    } else {
      break;
    }
  }

  const description = cur.description;
  if (description === TS_MARKER) {
    return { name, kind: { kind: 'timestamp' }, nullable, optional };
  }
  if (description?.startsWith(VEC_MARKER_PREFIX)) {
    const dim = Number(description.slice(VEC_MARKER_PREFIX.length));
    if (!Number.isFinite(dim) || dim <= 0) {
      throw new Error(
        `Invalid vector dimension on field "${name}": ${description}`,
      );
    }
    return { name, kind: { kind: 'vector', dim }, nullable, optional };
  }

  const t = cur._zod.def.type;
  switch (t) {
    case 'string':
      return { name, kind: { kind: 'string' }, nullable, optional };
    case 'number':
      return { name, kind: { kind: 'number' }, nullable, optional };
    case 'boolean':
      return { name, kind: { kind: 'boolean' }, nullable, optional };
    case 'enum': {
      const values =
        cur.options ??
        (cur._zod.def.entries ? Object.values(cur._zod.def.entries) : null);
      if (!values) {
        throw new Error(`Could not extract enum values for "${name}"`);
      }
      return { name, kind: { kind: 'enum', values }, nullable, optional };
    }
    default:
      throw new Error(`Unsupported field type for "${name}": ${t}`);
  }
}
