import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import { ANTHROPIC_API_KEY, suggestPostFormats } from './lib/anthropic';
import { getAppConfig } from './lib/config';
import { FORMAT_OPTIONS, formatCatalogString } from './data/format-options';

const FUNCTION_OPTS = {
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB' as const,
  secrets: [ANTHROPIC_API_KEY],
};

type TSuggestFormatsInput = { articleId: string };
type TSuggestedFormat = { platform: string; format: string; why: string };
type TSuggestFormatsOutput = { formats: TSuggestedFormat[] };

const VALID_KEYS = new Set(
  FORMAT_OPTIONS.map(f => `${f.platform}/${f.format}`),
);

export const suggestFormats = onCall<TSuggestFormatsInput>(
  FUNCTION_OPTS,
  async (request): Promise<TSuggestFormatsOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    if (!request.data?.articleId) {
      throw new HttpsError('invalid-argument', 'articleId is required.');
    }

    const ref = db.collection('contentIdeas').doc(request.data.articleId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Article not found.');
    }
    const data = snap.data() as {
      accountId: string;
      title: string | null;
      content: string;
      sourceUrl: string | null;
    };

    try {
      const config = await getAppConfig(data.accountId);
      const raw = await suggestPostFormats({
        persona: config.persona,
        formatCatalog: formatCatalogString(),
        articleTitle: data.title,
        articleContent: data.content,
        articleSource: data.sourceUrl,
      });

      const formats = raw.filter(f =>
        VALID_KEYS.has(`${f.platform}/${f.format}`),
      );

      await ref.update({
        suggestedFormats: formats,
        pipelineError: null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { formats };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`suggestFormats failed for ${request.data.articleId}`, err);
      await ref.update({
        pipelineError: `formats: ${message.slice(0, 200)}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
      throw new HttpsError('internal', message);
    }
  },
);
