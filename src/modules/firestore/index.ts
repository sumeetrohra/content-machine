import type { TContentIdea, TRssFeed } from '@/shared/types/content-idea.types';
import { defineCollection } from './collection-def';
import {
  contentIdeaConverter,
  type TContentIdeaDb,
} from './converters/content-idea.converter';
import {
  rssFeedConverter,
  type TRssFeedDb,
} from './converters/rss-feed.converter';

export const collections = {
  contentIdeas: defineCollection<TContentIdea, TContentIdeaDb>(
    'contentIdeas',
    contentIdeaConverter,
  ),
  rssFeeds: defineCollection<TRssFeed, TRssFeedDb>(
    'rssFeeds',
    rssFeedConverter,
  ),
} as const;

export type TCollections = typeof collections;

export { firestoreClient } from './client';
export { defineCollection } from './collection-def';
export { defineSubcollection } from './subcollection';
export { tsToIso, isoToTs } from './timestamp';
export type { TCollectionDef, TCreate, TUpdate } from './types';
export type { TContentIdeaDb } from './converters/content-idea.converter';
export type { TRssFeedDb } from './converters/rss-feed.converter';
