import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useTranslation } from 'react-i18next';
import { Rss, Trash2, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  useRssFeeds,
  useCreateRssFeed,
  useDeleteRssFeed,
  useTriggerRssFetch,
} from '@/hooks/use-rss-feeds';
import { formatRelative } from '@/shared/utils/datetime-utils';

const addFeedSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
});

type TAddFeedForm = z.infer<typeof addFeedSchema>;

type TRssFeedsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const RssFeedsSheet = ({ open, onOpenChange }: TRssFeedsSheetProps) => {
  const { t } = useTranslation();
  const { data: feeds = [], isLoading } = useRssFeeds();
  const createFeed = useCreateRssFeed();
  const deleteFeed = useDeleteRssFeed();
  const triggerFetch = useTriggerRssFetch();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TAddFeedForm>({
    resolver: zodResolver(addFeedSchema),
  });

  const onSubmit = async (data: TAddFeedForm) => {
    setServerError(null);
    try {
      await createFeed.mutateAsync({ name: data.name, url: data.url });
      reset();
    } catch {
      setServerError(t('kanban.rssFeeds.addError'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Rss className="size-4" />
            {t('kanban.rssFeeds.title')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : feeds.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('kanban.rssFeeds.empty')}
            </p>
          ) : (
            <ul className="space-y-1 pb-4">
              {feeds.map(feed => (
                <li
                  key={feed.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{feed.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {feed.url}
                    </p>
                    {feed.last_fetched_at && (
                      <p className="text-xs text-muted-foreground">
                        {t('kanban.rssFeeds.lastFetched')}:{' '}
                        {formatRelative(feed.last_fetched_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={triggerFetch.isPending}
                      onClick={() => triggerFetch.mutate(feed.account_id)}
                      title={t('kanban.rssFeeds.fetchNow')}
                    >
                      {triggerFetch.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={deleteFeed.isPending}
                      onClick={() => deleteFeed.mutate(feed.id)}
                      title={t('kanban.rssFeeds.remove')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Separator />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-4">
            <p className="text-sm font-medium">
              {t('kanban.rssFeeds.addFeed')}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="feed-name">
                {t('kanban.rssFeeds.nameLabel')}
              </Label>
              <Input
                id="feed-name"
                placeholder="Hacker News"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feed-url">{t('kanban.rssFeeds.urlLabel')}</Label>
              <Input
                id="feed-url"
                type="url"
                placeholder="https://news.ycombinator.com/rss"
                aria-invalid={!!errors.url}
                {...register('url')}
              />
              {errors.url && (
                <p className="text-xs text-destructive">
                  {t('kanban.rssFeeds.invalidUrl')}
                </p>
              )}
            </div>
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Plus className="mr-1.5 size-4" />
              {isSubmitting
                ? t('kanban.rssFeeds.adding')
                : t('kanban.rssFeeds.addFeed')}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
