import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/admin';
import {
  ANTHROPIC_API_KEY,
  DRAFTING_MODEL,
  buildInitialDraftPrompt,
  runDraftChatTurn,
  type TChatMessageInput,
} from './lib/anthropic';
import { getAppConfig } from './lib/config';
import { FORMAT_OPTIONS } from './data/format-options';

const FUNCTION_OPTS = {
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB' as const,
  secrets: [ANTHROPIC_API_KEY],
};

type TGenerateDraftInput = {
  articleId: string;
  platform: string;
  format: string;
};

type TGenerateDraftOutput = {
  draftId: string;
  chatId: string;
  body: string;
};

export const generateDraft = onCall<TGenerateDraftInput>(
  FUNCTION_OPTS,
  async (request): Promise<TGenerateDraftOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const { articleId, platform, format } = request.data ?? {};
    if (!articleId || !platform || !format) {
      throw new HttpsError(
        'invalid-argument',
        'articleId, platform, format are required.',
      );
    }

    const formatOption = FORMAT_OPTIONS.find(
      f => f.platform === platform && f.format === format,
    );
    if (!formatOption) {
      throw new HttpsError(
        'invalid-argument',
        `Unknown platform/format: ${platform}/${format}`,
      );
    }

    const articleRef = db.collection('contentIdeas').doc(articleId);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) {
      throw new HttpsError('not-found', 'Article not found.');
    }
    const article = articleSnap.data() as {
      accountId: string;
      title: string | null;
      content: string;
      sourceUrl: string | null;
    };
    if (article.accountId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not your article.');
    }

    try {
      const config = await getAppConfig(article.accountId);
      const userPrompt = buildInitialDraftPrompt({
        articleTitle: article.title,
        articleContent: article.content,
        articleSource: article.sourceUrl,
      });
      const body = await runDraftChatTurn({
        persona: config.persona,
        platform,
        format,
        formatDescription: formatOption.description,
        history: [{ role: 'user', content: userPrompt }],
      });

      const chatRef = db.collection('chats').doc();
      const draftRef = db.collection('drafts').doc();
      const userMsgRef = chatRef.collection('messages').doc();
      const assistantMsgRef = chatRef.collection('messages').doc();

      const batch = db.batch();
      batch.set(chatRef, {
        accountId: article.accountId,
        articleId,
        draftId: draftRef.id,
        platform,
        format,
        model: DRAFTING_MODEL,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(draftRef, {
        accountId: article.accountId,
        articleId,
        platform,
        format,
        body,
        model: DRAFTING_MODEL,
        chatId: chatRef.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(userMsgRef, {
        accountId: article.accountId,
        role: 'user',
        content: userPrompt,
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.set(assistantMsgRef, {
        accountId: article.accountId,
        role: 'assistant',
        content: body,
        createdAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      return { draftId: draftRef.id, chatId: chatRef.id, body };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`generateDraft failed for ${articleId}`, err);
      throw new HttpsError('internal', message);
    }
  },
);

type TChatDraftInput = {
  chatId: string;
  userMessage: string;
};

type TChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type TChatDraftOutput = {
  body: string;
  userMessage: TChatMessage;
  assistantMessage: TChatMessage;
};

export const chatDraft = onCall<TChatDraftInput>(
  FUNCTION_OPTS,
  async (request): Promise<TChatDraftOutput> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }
    const { chatId, userMessage } = request.data ?? {};
    if (!chatId || typeof userMessage !== 'string' || !userMessage.trim()) {
      throw new HttpsError(
        'invalid-argument',
        'chatId and non-empty userMessage are required.',
      );
    }

    const chatRef = db.collection('chats').doc(chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      throw new HttpsError('not-found', 'Chat not found.');
    }
    const chat = chatSnap.data() as {
      accountId: string;
      draftId: string;
      platform: string;
      format: string;
    };
    if (chat.accountId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not your chat.');
    }

    const formatOption = FORMAT_OPTIONS.find(
      f => f.platform === chat.platform && f.format === chat.format,
    );
    if (!formatOption) {
      throw new HttpsError(
        'invalid-argument',
        `Unknown platform/format on chat: ${chat.platform}/${chat.format}`,
      );
    }

    const messagesSnap = await chatRef
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();
    const history: TChatMessageInput[] = messagesSnap.docs.map(d => {
      const data = d.data() as { role: string; content: string };
      return {
        role: data.role === 'assistant' ? 'assistant' : 'user',
        content: data.content,
      };
    });
    if (history.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'Chat has no initial messages. Regenerate the draft first.',
      );
    }

    const trimmed = userMessage.trim();
    history.push({ role: 'user', content: trimmed });

    try {
      const config = await getAppConfig(chat.accountId);
      const assistantText = await runDraftChatTurn({
        persona: config.persona,
        platform: chat.platform,
        format: chat.format,
        formatDescription: formatOption.description,
        history,
      });

      const userMsgRef = chatRef.collection('messages').doc();
      const assistantMsgRef = chatRef.collection('messages').doc();
      const draftRef = db.collection('drafts').doc(chat.draftId);

      const batch = db.batch();
      batch.set(userMsgRef, {
        accountId: chat.accountId,
        role: 'user',
        content: trimmed,
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.set(assistantMsgRef, {
        accountId: chat.accountId,
        role: 'assistant',
        content: assistantText,
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.update(chatRef, {
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.update(draftRef, {
        body: assistantText,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      const nowIso = Timestamp.now().toDate().toISOString();
      return {
        body: assistantText,
        userMessage: { role: 'user', content: trimmed, createdAt: nowIso },
        assistantMessage: {
          role: 'assistant',
          content: assistantText,
          createdAt: nowIso,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`chatDraft failed for chat ${chatId}`, err);
      throw new HttpsError('internal', message);
    }
  },
);
