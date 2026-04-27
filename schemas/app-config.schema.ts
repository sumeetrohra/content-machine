import { z } from 'zod';
import { defineCollection } from '../scripts/codegen/firestore/dsl';

export default defineCollection({
  name: 'appConfig',
  typeName: 'AppConfig',
  ownerField: 'accountId',
  managed: ['createdAt', 'updatedAt'],
  schema: z.object({
    accountId: z.string(),
    persona: z.string(),
    viralityRubric: z.string(),
    dedupThreshold: z.number(),
    lookbackDays: z.number(),
    dailyAcceptedCap: z.number(),
  }),
});
