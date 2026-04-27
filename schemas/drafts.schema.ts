import { z } from 'zod';
import { defineCollection } from '../scripts/codegen/firestore/dsl';

export default defineCollection({
  name: 'drafts',
  typeName: 'Draft',
  ownerField: 'accountId',
  defaultOrderBy: { field: 'createdAt', dir: 'desc' },
  managed: ['createdAt', 'updatedAt'],
  schema: z.object({
    accountId: z.string(),
    articleId: z.string(),
    platform: z.enum(['youtube', 'linkedin', 'twitter']),
    format: z.string(),
    body: z.string(),
    model: z.string(),
    chatId: z.string(),
  }),
});
