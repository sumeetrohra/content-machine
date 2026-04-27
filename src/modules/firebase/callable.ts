import { httpsCallable } from 'firebase/functions';
import type { z } from 'zod';
import { functions } from '@/modules/firebase';

export const defineCallable = <
  TInSchema extends z.ZodType,
  TOutSchema extends z.ZodType,
>(
  name: string,
  inputSchema: TInSchema,
  outputSchema: TOutSchema,
) => {
  const fn = httpsCallable(functions, name);
  return async (input: z.input<TInSchema>): Promise<z.output<TOutSchema>> => {
    const parsedInput: z.output<TInSchema> = inputSchema.parse(input);
    const res = await fn(parsedInput);
    return outputSchema.parse(res.data);
  };
};
