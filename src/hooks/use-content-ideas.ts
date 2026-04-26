import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOf, endOf } from '@/shared/utils/datetime-utils';
import { supabase } from '@/modules/supabase';
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

async function fetchEmbedding(text: string): Promise<number[] | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { embedding: number[] };
  return data.embedding ?? null;
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
      { timeFilter, searchQuery, isEmbeddingSearch, userId: user?.id },
    ],
    queryFn: async (): Promise<TContentIdea[]> => {
      if (!user) return [];

      const { from, to } = getDateRange(timeFilter);
      let embedding: number[] | null = null;

      if (isEmbeddingSearch && searchQuery.trim()) {
        embedding = await fetchEmbedding(searchQuery.trim());
      }

      const { data, error } = await supabase.rpc('search_content_ideas', {
        p_account_id: user.id,
        p_query: isEmbeddingSearch ? '' : searchQuery.trim(),
        p_embedding: embedding,
        p_status: null,
        p_from: from,
        p_to: to,
        p_limit: 200,
      });

      if (error) throw error;
      return (data as TContentIdea[]) ?? [];
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
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as TContentIdea | null;
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

      const { data, error } = await supabase
        .from('content_ideas')
        .insert({
          account_id: user.id,
          content: input.content,
          content_format: input.content_format,
          title: input.title ?? null,
          status: 'idea',
          source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      const idea = data as TContentIdea;

      // Generate and patch embedding asynchronously (non-blocking for UX)
      fetchEmbedding(
        [input.title, input.content].filter(Boolean).join(' '),
      ).then(async embedding => {
        if (!embedding) return;
        await supabase
          .from('content_ideas')
          .update({ embedding })
          .eq('id', idea.id);
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
      const { error } = await supabase
        .from('content_ideas')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
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
        Pick<TContentIdea, 'title' | 'content' | 'content_format' | 'status'>
      >;
    }): Promise<void> => {
      const { error } = await supabase
        .from('content_ideas')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase
        .from('content_ideas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
    },
  });
};
