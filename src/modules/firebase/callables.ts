import {
  generateEmbeddingInputSchema,
  generateEmbeddingOutputSchema,
  searchIdeasInputSchema,
  searchIdeasOutputSchema,
} from '@/shared/schemas/content-idea.schema';
import {
  fetchRssInputSchema,
  fetchRssOutputSchema,
} from '@/shared/schemas/rss-feed.schema';
import { defineCallable } from './callable';

export const callables = {
  searchContentIdeas: defineCallable(
    'searchContentIdeas',
    searchIdeasInputSchema,
    searchIdeasOutputSchema,
  ),
  generateEmbedding: defineCallable(
    'generateEmbedding',
    generateEmbeddingInputSchema,
    generateEmbeddingOutputSchema,
  ),
  fetchRss: defineCallable(
    'fetchRss',
    fetchRssInputSchema,
    fetchRssOutputSchema,
  ),
} as const;

export type TCallables = typeof callables;
