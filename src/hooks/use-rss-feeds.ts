import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/modules/supabase';
import { useAuthUser } from '@/shared/stores/auth.store';
import type {
  TRssFeed,
  TCreateFeedInput,
} from '@/shared/types/content-idea.types';

const FEEDS_KEY = 'rss-feeds';
const IDEAS_KEY = 'content-ideas';

export const useRssFeeds = () => {
  const user = useAuthUser();

  return useQuery({
    queryKey: [FEEDS_KEY, user?.id],
    queryFn: async (): Promise<TRssFeed[]> => {
      const { data, error } = await supabase
        .from('rss_feeds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as TRssFeed[]) ?? [];
    },
    enabled: !!user,
  });
};

export const useCreateRssFeed = () => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TCreateFeedInput): Promise<TRssFeed> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rss_feeds')
        .insert({ account_id: user.id, name: input.name, url: input.url })
        .select()
        .single();

      if (error) throw error;
      return data as TRssFeed;
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
      const { error } = await supabase.from('rss_feeds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDS_KEY] });
    },
  });
};

export const useTriggerRssFetch = () => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedAccountId?: string): Promise<void> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-rss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ account_id: feedAccountId ?? user?.id }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'RSS fetch failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IDEAS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FEEDS_KEY] });
    },
  });
};
