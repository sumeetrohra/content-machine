import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { embed } from './lib/vertex';

type TGenerateEmbeddingInput = { text: string };
type TGenerateEmbeddingOutput = { embedding: number[] };

export const generateEmbedding = onCall<TGenerateEmbeddingInput>(
  { region: 'us-central1', timeoutSeconds: 30, memory: '256MiB' },
  async (request): Promise<TGenerateEmbeddingOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const { text } = request.data ?? { text: '' };
    if (typeof text !== 'string' || !text.trim()) {
      throw new HttpsError('invalid-argument', 'text is required');
    }

    const truncated = text.slice(0, 2048);
    const embedding = await embed(truncated);
    return { embedding };
  },
);
