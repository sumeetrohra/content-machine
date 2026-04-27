import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import { embed } from './lib/vertex';

type TRssItem = {
  title: string | null;
  link: string | null;
  description: string;
  pubDate: string | null;
  author: string | null;
};

type TFetchRssInput = { accountId?: string };
type TFetchRssOutput = { inserted: number };

const FUNCTION_OPTS = {
  region: 'us-central1',
  timeoutSeconds: 540,
  memory: '512MiB' as const,
};

export const fetchRss = onCall<TFetchRssInput>(
  FUNCTION_OPTS,
  async (request): Promise<TFetchRssOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const uid = request.auth.uid;
    const requestedAccountId = request.data?.accountId;
    const accountId =
      requestedAccountId && requestedAccountId === uid
        ? requestedAccountId
        : uid;

    const inserted = await runRssFetch({ accountId });
    return { inserted };
  },
);

export const scheduledFetchRss = onSchedule(
  { schedule: 'every day 08:00', region: 'us-central1', timeoutSeconds: 540 },
  async () => {
    const inserted = await runRssFetch({});
    logger.info(`scheduledFetchRss inserted ${inserted} ideas`);
  },
);

async function runRssFetch(opts: { accountId?: string }): Promise<number> {
  let feedsQuery = db
    .collection('rssFeeds')
    .where('isActive', '==', true) as FirebaseFirestore.Query;
  if (opts.accountId) {
    feedsQuery = feedsQuery.where('accountId', '==', opts.accountId);
  }

  const feedsSnap = await feedsQuery.get();
  let inserted = 0;

  for (const feedDoc of feedsSnap.docs) {
    const feed = feedDoc.data() as {
      accountId: string;
      name: string;
      url: string;
    };
    try {
      inserted += await processFeed(feedDoc.id, feed);
      await feedDoc.ref.update({
        lastFetchedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logger.error(`fetch-rss feed ${feed.url} failed`, err);
    }
  }

  return inserted;
}

async function processFeed(
  feedId: string,
  feed: { accountId: string; name: string; url: string },
): Promise<number> {
  const res = await fetch(feed.url, {
    headers: { 'User-Agent': 'content-machine-rss/1.0' },
  });
  if (!res.ok) {
    throw new Error(`feed fetch ${feed.url} returned ${res.status}`);
  }
  const xml = await res.text();
  const items = parseFeed(xml);

  let inserted = 0;
  for (const item of items) {
    if (!item.link) continue;

    const dupe = await db
      .collection('contentIdeas')
      .where('accountId', '==', feed.accountId)
      .where('sourceUrl', '==', item.link)
      .limit(1)
      .get();
    if (!dupe.empty) continue;

    const text = `${item.title ?? ''} ${item.description}`.slice(0, 512);
    let embedding: number[] | null = null;
    try {
      embedding = await embed(text);
    } catch (err) {
      logger.warn(`embed failed for ${item.link}`, err);
    }

    await db.collection('contentIdeas').add({
      accountId: feed.accountId,
      title: item.title,
      content: item.description,
      contentFormat: 'text',
      status: 'idea',
      source: 'rss',
      rssFeedId: feedId,
      sourceUrl: item.link,
      author: item.author,
      publishedAt: item.pubDate
        ? Timestamp.fromDate(new Date(item.pubDate))
        : null,
      embedding: embedding ? FieldValue.vector(embedding) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    inserted += 1;
  }

  return inserted;
}

function parseFeed(xml: string): TRssItem[] {
  const items: TRssItem[] = [];
  const itemRegex = /<(item|entry)\b[\s\S]*?<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[0];
    items.push({
      title: extractTag(block, 'title'),
      link: extractLink(block),
      description:
        extractTag(block, 'description') ??
        extractTag(block, 'summary') ??
        extractTag(block, 'content') ??
        '',
      pubDate: extractTag(block, 'pubDate') ?? extractTag(block, 'published'),
      author: extractTag(block, 'author') ?? extractTag(block, 'dc:creator'),
    });
  }
  return items.map(it => ({ ...it, description: stripHtml(it.description) }));
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  if (!m) return null;
  return decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()) || null;
}

function extractLink(block: string): string | null {
  const inline = block.match(/<link>([\s\S]*?)<\/link>/i);
  if (inline) return decode(inline[1].trim()) || null;
  const atom = block.match(/<link[^>]*href="([^"]+)"/i);
  return atom ? decode(atom[1]) : null;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
