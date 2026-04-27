import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  vector,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { startOf, endOf } from '@/shared/utils/datetime-utils';
import { db, functions } from '@/modules/firebase';
import { useAuthUser } from '@/shared/stores/auth.store';
import type {
  TContentIdea,
  TCreateIdeaInput,
  ETimeFilter,
  EContentStatus,
} from '@/shared/types/content-idea.types';

const IDEAS_KEY = 'content-ideas';

function getDateRange(filter: ETimeFilter): {
  from: string | null;
  to: string | null;
} {
  if (filter === 'all') return { from: null, to: null };
  const unit = filter as 'week' | 'month' | 'year';
  return { from: startOf(unit), to: endOf(unit) };
}

function tsToIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function ideaFromDoc(id: string, data: DocumentData): TContentIdea {
  return {
    id,
    accountId: data.accountId as string,
    title: (data.title as string | null | undefined) ?? null,
    content: data.content as string,
    contentFormat: data.contentFormat as TContentIdea['contentFormat'],
    status: data.status as TContentIdea['status'],
    source: data.source as TContentIdea['source'],
    rssFeedId: (data.rssFeedId as string | null | undefined) ?? null,
    sourceUrl: (data.sourceUrl as string | null | undefined) ?? null,
    author: (data.author as string | null | undefined) ?? null,
    publishedAt: tsToIso(data.publishedAt),
    createdAt: tsToIso(data.createdAt) ?? '',
    updatedAt: tsToIso(data.updatedAt) ?? '',
  };
}

function ideaFromCallable(raw: Record<string, unknown>): TContentIdea {
  return {
    id: raw.id as string,
    accountId: raw.accountId as string,
    title: (raw.title as string | null | undefined) ?? null,
    content: raw.content as string,
    contentFormat: raw.contentFormat as TContentIdea['contentFormat'],
    status: raw.status as TContentIdea['status'],
    source: raw.source as TContentIdea['source'],
    rssFeedId: (raw.rssFeedId as string | null | undefined) ?? null,
    sourceUrl: (raw.sourceUrl as string | null | undefined) ?? null,
    author: (raw.author as string | null | undefined) ?? null,
    publishedAt: (raw.publishedAt as string | null | undefined) ?? null,
    createdAt: (raw.createdAt as string | undefined) ?? '',
    updatedAt: (raw.updatedAt as string | undefined) ?? '',
  };
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const fn = httpsCallable<{ text: string }, { embedding: number[] }>(
      functions,
      'generateEmbedding',
    );
    const res = await fn({ text });
    return res.data.embedding ?? null;
  } catch {
    return null;
  }
}

type TUseContentIdeasOptions = {
  timeFilter: ETimeFilter;
  searchQuery: string;
  isEmbeddingSearch: boolean;
};

export const useContentIdeas = (options: TUseContentIdeasOptions) => {
  const user = useAuthUser();
  const { timeFilter, searchQuery, isEmbeddingSearch } = options;

  return useQuery({
    queryKey: [
      IDEAS_KEY,
      { timeFilter, searchQuery, isEmbeddingSearch, userId: user?.uid },
    ],
    queryFn: async (): Promise<TContentIdea[]> => {
      if (!user) return [];

      const { from, to } = getDateRange(timeFilter);
      const trimmed = searchQuery.trim();
      const queryString = isEmbeddingSearch ? trimmed : '';

      const search = httpsCallable<
        {
          query: string;
          status: EContentStatus | null;
          from: string | null;
          to: string | null;
          limit: number;
        },
        { results: Array<Record<string, unknown> & { id: string }> }
      >(functions, 'searchContentIdeas');

      const res = await search({
        query: queryString,
        status: null,
        from,
        to,
        limit: 200,
      });

      const ideas = res.data.results.map(ideaFromCallable);

      // Keyword-only fallback: when embedding search is off, do a substring
      // filter on title/content client-side. v1 simplification — replaces
      // the dropped Postgres FTS path.
      if (!isEmbeddingSearch && trimmed) {
        const needle = trimmed.toLowerCase();
        return ideas.filter(
          idea =>
            (idea.title?.toLowerCase().includes(needle) ?? false) ||
            idea.content.toLowerCase().includes(needle),
        );
      }

      return ideas;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};

export const useContentIdea = (id: string) => {
  const user = useAuthUser();

  return useQuery({
    queryKey: [IDEAS_KEY, id],
    queryFn: async (): Promise<TContentIdea | null> => {
      const ref = doc(db, 'contentIdeas', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return ideaFromDoc(snap.id, snap.data());
    },
    enabled: !!user && !!id,
  });
};

export const useCreateContentIdea = () => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TCreateIdeaInput): Promise<TContentIdea> => {
      if (!user) throw new Error('Not authenticated');

      const ref = await addDoc(collection(db, 'contentIdeas'), {
        accountId: user.uid,
        content: input.content,
        contentFormat: input.contentFormat,
        title: input.title ?? null,
        status: 'idea',
        source: 'manual',
        rssFeedId: null,
        sourceUrl: null,
        author: null,
        publishedAt: null,
        embedding: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const snap = await getDoc(ref);
      const idea = ideaFromDoc(ref.id, snap.data() ?? {});

      // Generate and patch embedding asynchronously (non-blocking for UX).
      generateEmbedding(
        [input.title, input.content].filter(Boolean).join(' '),
      ).then(async embedding => {
        if (!embedding) return;
        await updateDoc(doc(db, 'contentIdeas', ref.id), {
          embedding: vector(embedding),
          updatedAt: serverTimestamp(),
        });
      });

      return idea;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
    },
  });
};

export const useUpdateIdeaStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: EContentStatus;
    }): Promise<void> => {
      await updateDoc(doc(db, 'contentIdeas', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: [IDEAS_KEY] });

      const previous = queryClient.getQueriesData<TContentIdea[]>({
        queryKey: [IDEAS_KEY],
      });

      queryClient.setQueriesData<TContentIdea[]>(
        { queryKey: [IDEAS_KEY] },
        old => old?.map(idea => (idea.id === id ? { ...idea, status } : idea)),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
    },
  });
};

export const useUpdateContentIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Pick<TContentIdea, 'title' | 'content' | 'contentFormat' | 'status'>
      >;
    }): Promise<void> => {
      await updateDoc(doc(db, 'contentIdeas', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY, id] });
    },
  });
};

export const useDeleteContentIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deleteDoc(doc(db, 'contentIdeas', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
    },
  });
};
