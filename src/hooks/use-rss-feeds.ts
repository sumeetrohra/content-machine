import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/modules/firebase';
import { useAuthUser } from '@/shared/stores/auth.store';
import type {
  TRssFeed,
  TCreateFeedInput,
  TUpdateFeedInput,
} from '@/shared/types/content-idea.types';

const FEEDS_KEY = 'rss-feeds';
const IDEAS_KEY = 'content-ideas';

function tsToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function feedFromDoc(id: string, data: DocumentData): TRssFeed {
  return {
    id,
    accountId: data.accountId as string,
    name: data.name as string,
    url: data.url as string,
    isActive: (data.isActive as boolean | undefined) ?? true,
    lastFetchedAt: tsToIso(data.lastFetchedAt),
    createdAt: tsToIso(data.createdAt) ?? '',
    updatedAt: tsToIso(data.updatedAt) ?? '',
  };
}

export const useRssFeeds = () => {
  const user = useAuthUser();

  return useQuery({
    queryKey: [FEEDS_KEY, user?.uid],
    queryFn: async (): Promise<TRssFeed[]> => {
      if (!user) return [];
      const q = query(
        collection(db, 'rssFeeds'),
        where('accountId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => feedFromDoc(d.id, d.data()));
    },
    enabled: !!user,
  });
};

export const useCreateRssFeed = () => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TCreateFeedInput): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      await addDoc(collection(db, 'rssFeeds'), {
        accountId: user.uid,
        name: input.name,
        url: input.url,
        isActive: true,
        lastFetchedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDS_KEY] });
    },
  });
};

export const useUpdateRssFeed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: TUpdateFeedInput;
    }): Promise<void> => {
      await updateDoc(doc(db, 'rssFeeds', id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDS_KEY] });
    },
  });
};

export const useDeleteRssFeed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deleteDoc(doc(db, 'rssFeeds', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDS_KEY] });
    },
  });
};

export const useSeedDefaultFeeds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ inserted: number; skipped: number }> => {
      const seed = httpsCallable<
        undefined,
        { inserted: number; skipped: number }
      >(functions, 'seedDefaultFeeds');
      const res = await seed();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDS_KEY] });
    },
  });
};

export const useTriggerRssFetch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedAccountId?: string): Promise<void> => {
      const fetchRss = httpsCallable<
        { accountId?: string },
        { inserted: number }
      >(functions, 'fetchRss');
      await fetchRss({ accountId: feedAccountId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FEEDS_KEY] });
    },
  });
};
