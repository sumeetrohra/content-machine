import { z } from 'zod';

export const contentSourceSchema = z.enum(['manual', 'rss']);
export const contentStatusSchema = z.enum(['idea', 'accepted', 'rejected']);
export const contentFormatSchema = z.enum(['text', 'markdown', 'html']);
export const timeFilterSchema = z.enum(['week', 'month', 'year', 'all']);

export const contentIdeaSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  contentFormat: contentFormatSchema,
  status: contentStatusSchema,
  source: contentSourceSchema,
  rssFeedId: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  author: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createIdeaInputSchema = z.object({
  content: z.string().min(1),
  contentFormat: contentFormatSchema,
  title: z.string().optional(),
});

export const searchIdeasInputSchema = z.object({
  query: z.string(),
  status: contentStatusSchema.nullable(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  limit: z.number().int().positive(),
});

export const searchIdeasOutputSchema = z.object({
  results: z.array(contentIdeaSchema),
});

export const generateEmbeddingInputSchema = z.object({
  text: z.string(),
});

export const generateEmbeddingOutputSchema = z.object({
  embedding: z.array(z.number()),
});
