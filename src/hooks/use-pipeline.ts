import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/modules/firebase';

const IDEAS_KEY = 'content-ideas';

export const useDedupArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      articleId: string,
    ): Promise<{
      isDuplicate: boolean;
      similarity: number | null;
      dedupAgainstId: string | null;
    }> => {
      const fn = httpsCallable<
        { articleId: string },
        {
          isDuplicate: boolean;
          similarity: number | null;
          dedupAgainstId: string | null;
        }
      >(functions, 'dedupArticle');
      const res = await fn({ articleId });
      return res.data;
    },
    onSuccess: (_data, articleId) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY, articleId] });
    },
  });
};

export const useScoreArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      articleId: string,
    ): Promise<{ score: number; reason: string; status: string }> => {
      const fn = httpsCallable<
        { articleId: string },
        { score: number; reason: string; status: string }
      >(functions, 'scoreArticle');
      const res = await fn({ articleId });
      return res.data;
    },
    onSuccess: (_data, articleId) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY, articleId] });
    },
  });
};

export const useSuggestFormats = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      articleId: string,
    ): Promise<{
      formats: Array<{ platform: string; format: string; why: string }>;
    }> => {
      const fn = httpsCallable<
        { articleId: string },
        {
          formats: Array<{ platform: string; format: string; why: string }>;
        }
      >(functions, 'suggestFormats');
      const res = await fn({ articleId });
      return res.data;
    },
    onSuccess: (_data, articleId) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY, articleId] });
    },
  });
};

export const useRunPipelineNow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{
      inserted: number;
      deduped: number;
      scored: number;
      accepted: number;
      rejected: number;
    }> => {
      const fn = httpsCallable<
        Record<string, never>,
        {
          inserted: number;
          deduped: number;
          scored: number;
          accepted: number;
          rejected: number;
        }
      >(functions, 'runPipelineNow');
      const res = await fn({});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
    },
  });
};
