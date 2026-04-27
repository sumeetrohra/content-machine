import { z } from 'zod';

export const rssFeedSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string(),
  url: z.string(),
  lastFetchedAt: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createFeedInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const fetchRssInputSchema = z.object({
  accountId: z.string().optional(),
});

export const fetchRssOutputSchema = z.object({
  inserted: z.number().int().nonnegative(),
});
