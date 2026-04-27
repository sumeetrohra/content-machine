import { z } from 'zod';
import { defineCollection, ts } from '../scripts/codegen/firestore/dsl';

export default defineCollection({
  name: 'rssFeeds',
  typeName: 'RssFeed',
  ownerField: 'accountId',
  defaultOrderBy: { field: 'createdAt', dir: 'desc' },
  managed: ['createdAt', 'updatedAt'],
  schema: z.object({
    accountId: z.string(),
    name: z.string(),
    url: z.string(),
    isActive: z.boolean(),
    lastFetchedAt: ts().nullable(),
  }),
});
