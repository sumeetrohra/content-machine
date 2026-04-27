import type { z } from 'zod';
import type {
  contentIdeaSchema,
  contentSourceSchema,
  contentStatusSchema,
  contentFormatSchema,
  timeFilterSchema,
  createIdeaInputSchema,
} from '@/shared/schemas/content-idea.schema';
import type {
  rssFeedSchema,
  createFeedInputSchema,
} from '@/shared/schemas/rss-feed.schema';

export type EContentSource = z.infer<typeof contentSourceSchema>;
export type EContentStatus = z.infer<typeof contentStatusSchema>;
export type EContentFormat = z.infer<typeof contentFormatSchema>;
export type ETimeFilter = z.infer<typeof timeFilterSchema>;

export type TContentIdea = z.infer<typeof contentIdeaSchema>;
export type TRssFeed = z.infer<typeof rssFeedSchema>;

export type TCreateIdeaInput = z.infer<typeof createIdeaInputSchema>;
export type TCreateFeedInput = z.infer<typeof createFeedInputSchema>;
