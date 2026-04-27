import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ensureAppConfig } from './lib/config';

export const seedAppConfig = onCall(
  { region: 'us-central1', timeoutSeconds: 60 },
  async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const config = await ensureAppConfig(request.auth.uid);
    return {
      created: true,
      persona: config.persona,
      viralityRubric: config.viralityRubric,
      dedupThreshold: config.dedupThreshold,
      lookbackDays: config.lookbackDays,
      dailyAcceptedCap: config.dailyAcceptedCap,
    };
  },
);
