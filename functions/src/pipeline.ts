import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import { ANTHROPIC_API_KEY } from './lib/anthropic';
import { getAppConfig } from './lib/config';
import { runRssFetch } from './rss';
import { runDedup } from './dedup';
import { runScore } from './score';

const SCHEDULED_OPTS = {
  schedule: 'every day 08:00',
  timeZone: 'Asia/Kolkata',
  region: 'us-central1',
  timeoutSeconds: 540,
  memory: '1GiB' as const,
  secrets: [ANTHROPIC_API_KEY],
};

const CALLABLE_OPTS = {
  region: 'us-central1',
  timeoutSeconds: 540,
  memory: '1GiB' as const,
  secrets: [ANTHROPIC_API_KEY],
};

type TRunPipelineOutput = {
  inserted: number;
  deduped: number;
  scored: number;
  accepted: number;
  rejected: number;
};

export const runDailyPipeline = onSchedule(SCHEDULED_OPTS, async () => {
  const result = await runPipelineForAllAccounts();
  logger.info('runDailyPipeline complete', result);
});

export const runPipelineNow = onCall<{ accountId?: string }>(
  CALLABLE_OPTS,
  async (request): Promise<TRunPipelineOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const accountId = request.auth.uid;
    return runPipelineForAccount(accountId);
  },
);

async function runPipelineForAllAccounts(): Promise<TRunPipelineOutput> {
  const inserted = await runRssFetch({});

  const accountsSnap = await db
    .collection('rssFeeds')
    .where('isActive', '==', true)
    .get();
  const accountIds = new Set<string>();
  for (const doc of accountsSnap.docs) {
    const data = doc.data() as { accountId: string };
    if (data.accountId) accountIds.add(data.accountId);
  }

  let deduped = 0;
  let scored = 0;
  let accepted = 0;
  let rejected = 0;

  for (const accountId of accountIds) {
    const result = await processAccountPipeline(accountId);
    deduped += result.deduped;
    scored += result.scored;
    accepted += result.accepted;
    rejected += result.rejected;
  }

  return { inserted, deduped, scored, accepted, rejected };
}

async function runPipelineForAccount(
  accountId: string,
): Promise<TRunPipelineOutput> {
  const inserted = await runRssFetch({ accountId });
  const result = await processAccountPipeline(accountId);
  return { inserted, ...result };
}

async function processAccountPipeline(accountId: string): Promise<{
  deduped: number;
  scored: number;
  accepted: number;
  rejected: number;
}> {
  const config = await getAppConfig(accountId);

  const cutoff = Timestamp.fromMillis(
    Date.now() - 26 * 60 * 60 * 1000, // 26h window for safety on retries
  );

  const newIdeasSnap = await db
    .collection('contentIdeas')
    .where('accountId', '==', accountId)
    .where('source', '==', 'rss')
    .where('createdAt', '>=', cutoff)
    .get();

  let deduped = 0;
  let scored = 0;
  let accepted = 0;
  let rejected = 0;

  type TScoredIdea = {
    id: string;
    score: number;
  };
  const scoredIdeas: TScoredIdea[] = [];

  for (const doc of newIdeasSnap.docs) {
    const data = doc.data() as {
      pipelineStatus?: string;
      status?: string;
      viralityScore?: number | null;
    };

    if (data.status === 'rejected') continue;
    if (data.pipelineStatus === 'failed') continue;

    if (data.pipelineStatus === 'embedded') {
      try {
        const result = await runDedup(doc.id);
        if (result.isDuplicate) {
          deduped += 1;
          rejected += 1;
          continue;
        }
      } catch (err) {
        logger.error(`Pipeline dedup failed for ${doc.id}`, err);
        continue;
      }
    } else if (
      data.pipelineStatus === 'deduped' &&
      data.status === 'rejected'
    ) {
      continue;
    }

    if (
      data.pipelineStatus === 'deduped' ||
      data.pipelineStatus === 'embedded'
    ) {
      try {
        const result = await runScore(doc.id);
        scored += 1;
        scoredIdeas.push({ id: doc.id, score: result.score });
      } catch (err) {
        logger.error(`Pipeline scoring failed for ${doc.id}`, err);
        continue;
      }
    } else if (typeof data.viralityScore === 'number') {
      scoredIdeas.push({ id: doc.id, score: data.viralityScore });
    }
  }

  // Apply daily cap: top N by viralityScore where score >= 7 → accepted
  scoredIdeas.sort((a, b) => b.score - a.score);
  const passingIdeas = scoredIdeas.filter(i => i.score >= 7);
  const acceptedIds = new Set(
    passingIdeas.slice(0, config.dailyAcceptedCap).map(i => i.id),
  );

  for (const idea of scoredIdeas) {
    const isAccepted = acceptedIds.has(idea.id);
    const targetStatus = isAccepted ? 'accepted' : 'rejected';
    await db.collection('contentIdeas').doc(idea.id).update({
      status: targetStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (isAccepted) accepted += 1;
    else rejected += 1;
  }

  return { deduped, scored, accepted, rejected };
}
