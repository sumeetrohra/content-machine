import { z } from 'zod';
import { defineCollection, ts, vec } from '../scripts/codegen/firestore/dsl';

export default defineCollection({
  name: 'contentIdeas',
  typeName: 'ContentIdea',
  ownerField: 'accountId',
  defaultOrderBy: { field: 'createdAt', dir: 'desc' },
  managed: ['createdAt', 'updatedAt'],
  schema: z.object({
    accountId: z.string(),
    title: z.string().nullable(),
    content: z.string(),
    contentFormat: z.enum(['text', 'markdown', 'html']),
    status: z.enum(['idea', 'accepted', 'rejected']),
    source: z.enum(['manual', 'rss']),
    rssFeedId: z.string().nullable(),
    sourceUrl: z.string().nullable(),
    author: z.string().nullable(),
    publishedAt: ts().nullable(),
    embedding: vec(768).nullable(),
  }),
});
