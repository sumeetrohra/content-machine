import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Copy, Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useChatDraft, useChatMessages } from '@/hooks/use-chat';
import { formatRelative } from '@/shared/utils/datetime-utils';
import { cn } from '@/lib/utils';
import type { TDraft } from '@/shared/types/content-idea.types';

type TDraftChatSheetProps = {
  draft: TDraft | null;
  onOpenChange: (open: boolean) => void;
};

export const DraftChatSheet = ({
  draft,
  onOpenChange,
}: TDraftChatSheetProps) => {
  const { t } = useTranslation();
  const chatId = draft?.chatId ?? '';
  const articleId = draft?.articleId ?? '';
  const { data: messages = [], isLoading } = useChatMessages(chatId);
  const chatDraft = useChatDraft(chatId, articleId);
  const [input, setInput] = useState('');

  // Skip the very first user message — it's the raw article-prompt seed.
  // The first assistant message is the initial draft and stays visible.
  const visibleMessages = messages.filter(
    (m, i) => !(i === 0 && m.role === 'user'),
  );

  const handleCopy = async (body: string) => {
    await navigator.clipboard.writeText(body);
    toast.success(t('kanban.detail.copied'));
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || chatDraft.isPending) return;
    setInput('');
    try {
      await chatDraft.mutateAsync(trimmed);
    } catch {
      toast.error(t('kanban.detail.chatError'));
      setInput(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const scrollToBottom = (el: HTMLDivElement | null) => {
    if (el) el.scrollIntoView({ block: 'end', behavior: 'auto' });
  };

  return (
    <Sheet open={!!draft} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex flex-wrap items-center gap-2">
            <span>{t('kanban.detail.openChat')}</span>
            {draft && (
              <>
                <Badge variant="secondary">{draft.platform}</Badge>
                <Badge variant="outline">{draft.format}</Badge>
                <span className="text-xs font-normal text-muted-foreground">
                  {draft.model}
                </span>
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="ml-auto h-12 w-1/2" />
              <Skeleton className="h-20 w-2/3" />
            </div>
          ) : visibleMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('kanban.detail.chatHistoryEmpty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visibleMessages.map((msg, idx) => (
                <li
                  key={`${msg.role}-${msg.createdAt}-${idx}`}
                  className={cn(
                    'flex flex-col gap-1',
                    msg.role === 'user' ? 'items-end' : 'items-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary/10 text-foreground'
                        : 'bg-muted/50 text-foreground',
                    )}
                  >
                    <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                      {msg.content}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {msg.createdAt && (
                      <span>{formatRelative(msg.createdAt)}</span>
                    )}
                    {msg.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopy(msg.content)}
                        title={t('kanban.detail.copy')}
                      >
                        <Copy className="size-3" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
              {chatDraft.isPending && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t('kanban.detail.sending')}
                </li>
              )}
              <div ref={scrollToBottom} />
            </ul>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              rows={3}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('kanban.detail.chatPlaceholder')}
              disabled={chatDraft.isPending}
              className="resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={chatDraft.isPending || !input.trim()}
              size="icon"
            >
              {chatDraft.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
