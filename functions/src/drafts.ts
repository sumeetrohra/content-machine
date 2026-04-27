import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import {
  ANTHROPIC_API_KEY,
  DRAFTING_MODEL,
  generatePostDraft,
} from './lib/anthropic';
import { getAppConfig } from './lib/config';
import { FORMAT_OPTIONS } from './data/format-options';

const FUNCTION_OPTS = {
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB' as const,
  secrets: [ANTHROPIC_API_KEY],
};

type TGenerateDraftInput = {
  articleId: string;
  platform: string;
  format: string;
};

type TGenerateDraftOutput = {
  draftId: string;
  body: string;
};

export const generateDraft = onCall<TGenerateDraftInput>(
  FUNCTION_OPTS,
  async (request): Promise<TGenerateDraftOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const { articleId, platform, format } = request.data ?? {};
    if (!articleId || !platform || !format) {
      throw new HttpsError(
        'invalid-argument',
        'articleId, platform, format are required.',
      );
    }

    const formatOption = FORMAT_OPTIONS.find(
      f => f.platform === platform && f.format === format,
    );
    if (!formatOption) {
      throw new HttpsError(
        'invalid-argument',
        `Unknown platform/format: ${platform}/${format}`,
      );
    }

    const ref = db.collection('contentIdeas').doc(articleId);
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
    if (data.accountId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not your article.');
    }

    try {
      const config = await getAppConfig(data.accountId);
      const body = await generatePostDraft({
        persona: config.persona,
        platform,
        format,
        formatDescription: formatOption.description,
        articleTitle: data.title,
        articleContent: data.content,
        articleSource: data.sourceUrl,
      });

      const draftRef = await db.collection('drafts').add({
        accountId: data.accountId,
        articleId,
        platform,
        format,
        body,
        model: DRAFTING_MODEL,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { draftId: draftRef.id, body };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`generateDraft failed for ${articleId}`, err);
      throw new HttpsError('internal', message);
    }
  },
);
