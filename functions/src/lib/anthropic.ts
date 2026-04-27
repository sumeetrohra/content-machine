import Anthropic from '@anthropic-ai/sdk';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';

export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

export const SCORING_MODEL = 'claude-haiku-4-5';
export const DRAFTING_MODEL = 'claude-sonnet-4-6';

let cachedClient: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = ANTHROPIC_API_KEY.value();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY secret is not set.');
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

type TViralityScore = { score: number; reason: string };

export async function scoreVirality(args: {
  persona: string;
  rubric: string;
  articleTitle: string | null;
  articleContent: string;
  articleSource: string | null;
}): Promise<TViralityScore> {
  const client = getAnthropic();
  const systemBlocks = [
    {
      type: 'text' as const,
      text: `${args.persona}\n\n---\n\n${args.rubric}`,
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  const userText = formatArticleForPrompt({
    title: args.articleTitle,
    content: args.articleContent,
    source: args.articleSource,
  });

  const response = await client.messages.create({
    model: SCORING_MODEL,
    max_tokens: 256,
    system: systemBlocks,
    messages: [{ role: 'user', content: userText }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 1, maximum: 10 },
            reason: { type: 'string' },
          },
          required: ['score', 'reason'],
          additionalProperties: false,
        },
      },
    },
  });

  logger.info('scoreVirality usage', {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens,
    cacheCreate: response.usage.cache_creation_input_tokens,
  });

  const text = extractText(response);
  const parsed = JSON.parse(text) as TViralityScore;
  if (
    typeof parsed.score !== 'number' ||
    parsed.score < 1 ||
    parsed.score > 10 ||
    typeof parsed.reason !== 'string'
  ) {
    throw new Error(`Invalid scoring response: ${text}`);
  }
  return { score: Math.round(parsed.score), reason: parsed.reason };
}

type TSuggestedFormat = { platform: string; format: string; why: string };

export async function suggestPostFormats(args: {
  persona: string;
  formatCatalog: string;
  articleTitle: string | null;
  articleContent: string;
  articleSource: string | null;
}): Promise<TSuggestedFormat[]> {
  const client = getAnthropic();
  const systemText = `${args.persona}

---

You suggest the best 1-3 post formats for an article so the author can pick which one to draft. Pick formats that genuinely fit this article's substance — do not list everything. Available formats:

${args.formatCatalog}

Return JSON only. The "platform" must be one of: youtube, linkedin, twitter. The "format" must be one of the format keys above. The "why" is a single sentence explaining why this format suits this article.`;

  const systemBlocks = [
    {
      type: 'text' as const,
      text: systemText,
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  const userText = formatArticleForPrompt({
    title: args.articleTitle,
    content: args.articleContent,
    source: args.articleSource,
  });

  const response = await client.messages.create({
    model: SCORING_MODEL,
    max_tokens: 512,
    system: systemBlocks,
    messages: [{ role: 'user', content: userText }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            formats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  format: { type: 'string' },
                  why: { type: 'string' },
                },
                required: ['platform', 'format', 'why'],
                additionalProperties: false,
              },
            },
          },
          required: ['formats'],
          additionalProperties: false,
        },
      },
    },
  });

  logger.info('suggestPostFormats usage', {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens,
  });

  const text = extractText(response);
  const parsed = JSON.parse(text) as { formats: TSuggestedFormat[] };
  if (!Array.isArray(parsed.formats)) {
    throw new Error(`Invalid formats response: ${text}`);
  }
  return parsed.formats;
}

export async function generatePostDraft(args: {
  persona: string;
  platform: string;
  format: string;
  formatDescription: string;
  articleTitle: string | null;
  articleContent: string;
  articleSource: string | null;
}): Promise<string> {
  const client = getAnthropic();
  const systemText = `${args.persona}

---

You draft a single post for the author. Match the author's practitioner voice: opinionated, sharp, technical-but-accessible, no marketing fluff, no excessive emoji. Strong hook in the first line.

Platform: ${args.platform}
Format: ${args.format}
Format guidelines: ${args.formatDescription}

Return only the post body — no preamble, no explanations, no markdown fences. The article below is the seed for the post; the post should reflect the author's view, not summarize the article.`;

  const systemBlocks = [
    {
      type: 'text' as const,
      text: systemText,
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  const userText = formatArticleForPrompt({
    title: args.articleTitle,
    content: args.articleContent,
    source: args.articleSource,
  });

  const response = await client.messages.create({
    model: DRAFTING_MODEL,
    max_tokens: 2048,
    system: systemBlocks,
    messages: [{ role: 'user', content: userText }],
  });

  logger.info('generatePostDraft usage', {
    platform: args.platform,
    format: args.format,
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens,
  });

  return extractText(response).trim();
}

function extractText(response: Anthropic.Message): string {
  for (const block of response.content) {
    if (block.type === 'text') return block.text;
  }
  throw new Error('No text block in Anthropic response');
}

function formatArticleForPrompt(args: {
  title: string | null;
  content: string;
  source: string | null;
}): string {
  const parts: string[] = [];
  if (args.title) parts.push(`Title: ${args.title}`);
  if (args.source) parts.push(`Source URL: ${args.source}`);
  parts.push('');
  parts.push(args.content.slice(0, 4000));
  return parts.join('\n');
}
