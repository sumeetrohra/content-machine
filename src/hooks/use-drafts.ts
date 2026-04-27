import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/modules/firebase';
import { useAuthUser } from '@/shared/stores/auth.store';
import type { TDraft } from '@/shared/types/content-idea.types';

const DRAFTS_KEY = 'drafts';

function tsToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function draftFromDoc(id: string, data: DocumentData): TDraft {
  return {
    id,
    accountId: data.accountId as string,
    articleId: data.articleId as string,
    platform: data.platform as TDraft['platform'],
    format: data.format as string,
    body: data.body as string,
    model: data.model as string,
    chatId: (data.chatId as string | undefined) ?? '',
    createdAt: tsToIso(data.createdAt) ?? '',
    updatedAt: tsToIso(data.updatedAt) ?? '',
  };
}

export const useDrafts = (articleId: string) => {
  const user = useAuthUser();
  return useQuery({
    queryKey: [DRAFTS_KEY, articleId],
    queryFn: async (): Promise<TDraft[]> => {
      if (!user) return [];
      const q = query(
        collection(db, 'drafts'),
        where('accountId', '==', user.uid),
        where('articleId', '==', articleId),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => draftFromDoc(d.id, d.data()));
    },
    enabled: !!user && !!articleId,
  });
};

export const useGenerateDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      articleId: string;
      platform: string;
      format: string;
    }): Promise<{ draftId: string; chatId: string; body: string }> => {
      const fn = httpsCallable<
        typeof input,
        { draftId: string; chatId: string; body: string }
      >(functions, 'generateDraft');
      const res = await fn(input);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: [DRAFTS_KEY, vars.articleId],
      });
    },
  });
};

export const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draftId: string): Promise<void> => {
      await deleteDoc(doc(db, 'drafts', draftId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFTS_KEY] });
    },
  });
};
