import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp, type Query } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import { embed } from './lib/vertex';

type TStatus = 'idea' | 'accepted' | 'rejected';

type TSearchInput = {
  query?: string;
  status?: TStatus | null;
  from?: string | null; // ISO
  to?: string | null; // ISO
  limit?: number;
};

type TSearchOutput = {
  results: Array<Record<string, unknown> & { id: string }>;
};

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

export const searchContentIdeas = onCall<TSearchInput>(
  { region: 'us-central1', timeoutSeconds: 30, memory: '512MiB' },
  async (request): Promise<TSearchOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const uid = request.auth.uid;
    const {
      query = '',
      status = null,
      from = null,
      to = null,
      limit = DEFAULT_LIMIT,
    } = request.data ?? {};

    const cappedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);

    let q: Query = db.collection('contentIdeas').where('accountId', '==', uid);

    if (status) q = q.where('status', '==', status);
    if (from)
      q = q.where('createdAt', '>=', Timestamp.fromDate(new Date(from)));
    if (to) q = q.where('createdAt', '<=', Timestamp.fromDate(new Date(to)));

    const trimmed = query.trim();
    let snap;

    if (trimmed) {
      const queryEmbedding = await embed(trimmed);
      snap = await q
        .findNearest({
          vectorField: 'embedding',
          queryVector: FieldValue.vector(queryEmbedding),
          limit: cappedLimit,
          distanceMeasure: 'COSINE',
        })
        .get();
    } else {
      snap = await q.orderBy('createdAt', 'desc').limit(cappedLimit).get();
    }

    const results = snap.docs.map(d => serialize({ id: d.id, ...d.data() }));
    return { results };
  },
);

function serialize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Timestamp) {
      out[k] = v.toDate().toISOString();
    } else if (k === 'embedding') {
      // Don't ship embeddings to the client.
      continue;
    } else {
      out[k] = v;
    }
  }
  return out;
}
