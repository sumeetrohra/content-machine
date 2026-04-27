import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import { getAppConfig } from './lib/config';

const FUNCTION_OPTS = {
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB' as const,
};

type TDedupInput = { articleId: string };
type TDedupOutput = {
  isDuplicate: boolean;
  similarity: number | null;
  dedupAgainstId: string | null;
};

export const dedupArticle = onCall<TDedupInput>(
  FUNCTION_OPTS,
  async (request): Promise<TDedupOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    if (!request.data?.articleId) {
      throw new HttpsError('invalid-argument', 'articleId is required.');
    }

    const result = await runDedup(request.data.articleId);
    return result;
  },
);

export async function runDedup(articleId: string): Promise<TDedupOutput> {
  const ref = db.collection('contentIdeas').doc(articleId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Article ${articleId} not found.`);
  }

  const data = snap.data() as {
    accountId: string;
    embedding?: FirebaseFirestore.VectorValue | null;
    createdAt?: Timestamp;
  };

  if (!data.embedding) {
    await ref.update({
      pipelineStatus: 'failed',
      pipelineError: 'no-embedding-for-dedup',
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { isDuplicate: false, similarity: null, dedupAgainstId: null };
  }

  const config = await getAppConfig(data.accountId);
  const lookbackMs = config.lookbackDays * 24 * 60 * 60 * 1000;
  const cutoff = Timestamp.fromMillis(Date.now() - lookbackMs);

  const candidates = await db
    .collection('contentIdeas')
    .where('accountId', '==', data.accountId)
    .where('createdAt', '>=', cutoff)
    .findNearest({
      vectorField: 'embedding',
      queryVector: data.embedding,
      limit: 5,
      distanceMeasure: 'COSINE',
      distanceResultField: '_distance',
    })
    .get();

  let bestSimilarity: number | null = null;
  let bestId: string | null = null;
  for (const doc of candidates.docs) {
    if (doc.id === articleId) continue;
    const distance = (doc.data() as { _distance?: number })._distance;
    if (typeof distance !== 'number') continue;
    const similarity = 1 - distance;
    if (bestSimilarity === null || similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestId = doc.id;
    }
  }

  const isDuplicate =
    bestSimilarity !== null && bestSimilarity >= config.dedupThreshold;

  if (isDuplicate) {
    await ref.update({
      status: 'rejected',
      pipelineStatus: 'deduped',
      dedupSimilarity: bestSimilarity,
      dedupAgainstId: bestId,
      pipelineError: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.info(`Article ${articleId} deduped against ${bestId}`, {
      similarity: bestSimilarity,
    });
  } else {
    await ref.update({
      pipelineStatus: 'deduped',
      dedupSimilarity: bestSimilarity,
      dedupAgainstId: null,
      pipelineError: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return {
    isDuplicate,
    similarity: bestSimilarity,
    dedupAgainstId: isDuplicate ? bestId : null,
  };
}
