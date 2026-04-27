import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import { ANTHROPIC_API_KEY, scoreVirality } from './lib/anthropic';
import { getAppConfig } from './lib/config';

const FUNCTION_OPTS = {
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB' as const,
  secrets: [ANTHROPIC_API_KEY],
};

type TScoreInput = { articleId: string };
type TScoreOutput = { score: number; reason: string; status: string };

export const scoreArticle = onCall<TScoreInput>(
  FUNCTION_OPTS,
  async (request): Promise<TScoreOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    if (!request.data?.articleId) {
      throw new HttpsError('invalid-argument', 'articleId is required.');
    }
    return runScore(request.data.articleId);
  },
);

export async function runScore(articleId: string): Promise<TScoreOutput> {
  const ref = db.collection('contentIdeas').doc(articleId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Article ${articleId} not found.`);
  }

  const data = snap.data() as {
    accountId: string;
    title: string | null;
    content: string;
    sourceUrl: string | null;
  };

  try {
    const config = await getAppConfig(data.accountId);
    const result = await scoreVirality({
      persona: config.persona,
      rubric: config.viralityRubric,
      articleTitle: data.title,
      articleContent: data.content,
      articleSource: data.sourceUrl,
    });

    const status = result.score >= 7 ? 'accepted' : 'rejected';
    await ref.update({
      viralityScore: result.score,
      viralityReason: result.reason,
      pipelineStatus: 'scored',
      pipelineError: null,
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { score: result.score, reason: result.reason, status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`scoreArticle failed for ${articleId}`, err);
    await ref.update({
      pipelineStatus: 'failed',
      pipelineError: `score: ${message.slice(0, 200)}`,
      updatedAt: FieldValue.serverTimestamp(),
    });
    throw new HttpsError('internal', message);
  }
}
