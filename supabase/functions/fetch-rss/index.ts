import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RssFeed {
  id: string;
  account_id: string;
  name: string;
  url: string;
}

interface RssItem {
  title: string | null;
  link: string | null;
  description: string | null;
  pubDate: string | null;
  author: string | null;
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemPattern.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      author:
        extractTag(itemXml, 'author') ?? extractTag(itemXml, 'dc:creator'),
    });
  }

  // Also try Atom <entry> format
  const entryPattern = /<entry>([\s\S]*?)<\/entry>/g;
  while ((match = entryPattern.exec(xml)) !== null) {
    const entryXml = match[1];
    const linkMatch = /<link[^>]+href="([^"]+)"/.exec(entryXml);
    items.push({
      title: extractTag(entryXml, 'title'),
      link: linkMatch ? linkMatch[1] : extractTag(entryXml, 'link'),
      description:
        extractTag(entryXml, 'summary') ?? extractTag(entryXml, 'content'),
      pubDate:
        extractTag(entryXml, 'published') ?? extractTag(entryXml, 'updated'),
      author: extractTagPath(entryXml, 'author', 'name'),
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const pattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    'i',
  );
  const match = pattern.exec(xml);
  if (!match) return null;
  const value = (match[1] ?? match[2] ?? '').trim();
  return value || null;
}

function extractTagPath(
  xml: string,
  parent: string,
  child: string,
): string | null {
  const parentMatch = new RegExp(
    `<${parent}[^>]*>([\\s\\S]*?)<\\/${parent}>`,
    'i',
  ).exec(xml);
  if (!parentMatch) return null;
  return extractTag(parentMatch[1], child);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const session = new Supabase.ai.Session('gte-small');
    const embedding = await session.run(text.slice(0, 512), {
      mean_pool: true,
      normalize: true,
    });
    return Array.from(embedding as Float32Array);
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Use service role to bypass RLS — account_id is set explicitly per-insert
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Optionally filter to a specific account_id if passed in body
    const body =
      req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const targetAccountId: string | null = body.account_id ?? null;

    const feedsQuery = supabase
      .from('rss_feeds')
      .select('id, account_id, name, url')
      .eq('is_active', true);

    if (targetAccountId) {
      feedsQuery.eq('account_id', targetAccountId);
    }

    const { data: feeds, error: feedsError } = await feedsQuery;
    if (feedsError) throw feedsError;

    let totalInserted = 0;

    for (const feed of feeds as RssFeed[]) {
      try {
        const response = await fetch(feed.url, {
          headers: { 'User-Agent': 'content-machine-rss-fetcher/1.0' },
        });

        if (!response.ok) continue;

        const xml = await response.text();
        const items = parseRssItems(xml);

        for (const item of items) {
          const sourceUrl = item.link;
          if (!sourceUrl) continue;

          // Deduplicate by (account_id, source_url)
          const { data: existing } = await supabase
            .from('content_ideas')
            .select('id')
            .eq('account_id', feed.account_id)
            .eq('source_url', sourceUrl)
            .maybeSingle();

          if (existing) continue;

          const rawContent = item.description ?? item.title ?? '';
          const content = stripHtml(rawContent) || item.title || '';
          if (!content) continue;

          const embeddingInput = [item.title, content]
            .filter(Boolean)
            .join(' ')
            .slice(0, 512);
          const embedding = await generateEmbedding(embeddingInput);

          await supabase.from('content_ideas').insert({
            account_id: feed.account_id,
            title: item.title,
            content,
            content_format: 'text',
            status: 'idea',
            source: 'rss',
            rss_feed_id: feed.id,
            source_url: sourceUrl,
            author: item.author,
            published_at: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : null,
            embedding,
          });

          totalInserted++;
        }

        // Update last_fetched_at for this feed
        await supabase
          .from('rss_feeds')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed.id);
      } catch {
        // Continue to next feed on error; individual feed failures shouldn't stop the job
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted: totalInserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
