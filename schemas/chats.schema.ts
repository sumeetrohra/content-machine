import { z } from 'zod';
import { defineCollection } from '../scripts/codegen/firestore/dsl';

export default defineCollection({
  name: 'chats',
  typeName: 'Chat',
  ownerField: 'accountId',
  defaultOrderBy: { field: 'createdAt', dir: 'desc' },
  managed: ['createdAt', 'updatedAt'],
  schema: z.object({
    accountId: z.string(),
    articleId: z.string(),
    draftId: z.string(),
    platform: z.enum(['youtube', 'linkedin', 'twitter']),
    format: z.string(),
    model: z.string(),
  }),
});
