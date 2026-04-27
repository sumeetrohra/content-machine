import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  orderBy,
  getDocs,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/modules/firebase';
import { useAuthUser } from '@/shared/stores/auth.store';
import { now } from '@/shared/utils/datetime-utils';
import type { TChatMessage } from '@/shared/types/content-idea.types';

const CHAT_MESSAGES_KEY = 'chat-messages';
const DRAFTS_KEY = 'drafts';

function tsToIso(value: unknown): string {
  return value instanceof Timestamp ? value.toDate().toISOString() : '';
}

function messageFromDoc(data: DocumentData): TChatMessage {
  return {
    role: data.role === 'assistant' ? 'assistant' : 'user',
    content: typeof data.content === 'string' ? data.content : '',
    createdAt: tsToIso(data.createdAt),
  };
}

export const useChatMessages = (chatId: string) => {
  const user = useAuthUser();
  return useQuery({
    queryKey: [CHAT_MESSAGES_KEY, chatId],
    queryFn: async (): Promise<TChatMessage[]> => {
      if (!user || !chatId) return [];
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'asc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => messageFromDoc(d.data()));
    },
    enabled: !!user && !!chatId,
  });
};

export const useChatDraft = (chatId: string, articleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      userMessage: string,
    ): Promise<{
      body: string;
      userMessage: TChatMessage;
      assistantMessage: TChatMessage;
    }> => {
      const fn = httpsCallable<
        { chatId: string; userMessage: string },
        {
          body: string;
          userMessage: TChatMessage;
          assistantMessage: TChatMessage;
        }
      >(functions, 'chatDraft');
      const res = await fn({ chatId, userMessage });
      return res.data;
    },
    onMutate: async (userMessage: string) => {
      await queryClient.cancelQueries({
        queryKey: [CHAT_MESSAGES_KEY, chatId],
      });
      const previous =
        queryClient.getQueryData<TChatMessage[]>([CHAT_MESSAGES_KEY, chatId]) ??
        [];
      const optimistic: TChatMessage = {
        role: 'user',
        content: userMessage,
        createdAt: now(),
      };
      queryClient.setQueryData<TChatMessage[]>(
        [CHAT_MESSAGES_KEY, chatId],
        [...previous, optimistic],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([CHAT_MESSAGES_KEY, chatId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [CHAT_MESSAGES_KEY, chatId],
      });
      queryClient.invalidateQueries({
        queryKey: [DRAFTS_KEY, articleId],
      });
    },
  });
};
