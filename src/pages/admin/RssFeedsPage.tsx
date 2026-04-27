import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Rss,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useRssFeeds,
  useCreateRssFeed,
  useUpdateRssFeed,
  useDeleteRssFeed,
  useTriggerRssFetch,
  useSeedDefaultFeeds,
} from '@/hooks/use-rss-feeds';
import { formatRelative } from '@/shared/utils/datetime-utils';
import type { TRssFeed } from '@/shared/types/content-idea.types';

const feedSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
});

type TFeedForm = z.infer<typeof feedSchema>;

export const RssFeedsPage = () => {
  const { t } = useTranslation();
  const { data: feeds = [], isLoading } = useRssFeeds();
  const createFeed = useCreateRssFeed();
  const updateFeed = useUpdateRssFeed();
  const deleteFeed = useDeleteRssFeed();
  const triggerFetch = useTriggerRssFetch();
  const seedDefaults = useSeedDefaultFeeds();

  const [editingFeed, setEditingFeed] = useState<TRssFeed | null>(null);
  const [feedToDelete, setFeedToDelete] = useState<TRssFeed | null>(null);

  const handleSeed = async () => {
    try {
      const res = await seedDefaults.mutateAsync();
      toast.success(
        t('admin.rssFeeds.seedSuccess', {
          inserted: res.inserted,
          skipped: res.skipped,
        }),
      );
    } catch {
      toast.error(t('admin.rssFeeds.seedError'));
    }
  };

  const handleFetchNow = async () => {
    try {
      await triggerFetch.mutateAsync(undefined);
      toast.success(t('admin.rssFeeds.fetchSuccess'));
    } catch {
      toast.error(t('admin.rssFeeds.fetchError'));
    }
  };

  const handleToggleActive = (feed: TRssFeed, isActive: boolean) => {
    updateFeed.mutate(
      { id: feed.id, patch: { isActive } },
      {
        onError: () => toast.error(t('admin.rssFeeds.updateError')),
      },
    );
  };

  const handleConfirmDelete = async () => {
    if (!feedToDelete) return;
    try {
      await deleteFeed.mutateAsync(feedToDelete.id);
      setFeedToDelete(null);
    } catch {
      toast.error(t('admin.rssFeeds.deleteError'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t('kanban.detail.back')}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Rss className="size-5" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t('admin.rssFeeds.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('admin.rssFeeds.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchNow}
              disabled={triggerFetch.isPending}
            >
              {triggerFetch.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 size-4" />
              )}
              {t('admin.rssFeeds.fetchNow')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seedDefaults.isPending}
            >
              {seedDefaults.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 size-4" />
              )}
              {t('admin.rssFeeds.seedDefaults')}
            </Button>
          </div>
        </div>
      </div>

      <AddFeedForm onCreate={createFeed.mutateAsync} />

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : feeds.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t('admin.rssFeeds.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.rssFeeds.name')}</TableHead>
                <TableHead>{t('admin.rssFeeds.url')}</TableHead>
                <TableHead className="w-24">
                  {t('admin.rssFeeds.active')}
                </TableHead>
                <TableHead className="w-40">
                  {t('admin.rssFeeds.lastFetched')}
                </TableHead>
                <TableHead className="w-24 text-right">
                  {t('admin.rssFeeds.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeds.map(feed => (
                <TableRow key={feed.id}>
                  <TableCell className="font-medium">{feed.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    <a
                      href={feed.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {feed.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={feed.isActive}
                      onCheckedChange={checked =>
                        handleToggleActive(feed, checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {feed.lastFetchedAt
                      ? formatRelative(feed.lastFetchedAt)
                      : t('admin.rssFeeds.never')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingFeed(feed)}
                        title={t('admin.rssFeeds.edit')}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setFeedToDelete(feed)}
                        title={t('admin.rssFeeds.delete')}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <EditFeedDialog
        feed={editingFeed}
        onClose={() => setEditingFeed(null)}
        onSave={async patch => {
          if (!editingFeed) return;
          try {
            await updateFeed.mutateAsync({ id: editingFeed.id, patch });
            setEditingFeed(null);
          } catch {
            toast.error(t('admin.rssFeeds.updateError'));
          }
        }}
      />

      <AlertDialog
        open={!!feedToDelete}
        onOpenChange={open => !open && setFeedToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.rssFeeds.confirmDeleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.rssFeeds.confirmDeleteBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.rssFeeds.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteFeed.isPending}
            >
              {t('admin.rssFeeds.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

type TAddFeedFormProps = {
  onCreate: (input: TFeedForm) => Promise<void>;
};

const AddFeedForm = ({ onCreate }: TAddFeedFormProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TFeedForm>({ resolver: zodResolver(feedSchema) });

  const onSubmit = async (data: TFeedForm) => {
    try {
      await onCreate(data);
      reset();
    } catch {
      toast.error(t('admin.rssFeeds.addError'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[1fr_2fr_auto]"
    >
      <div className="space-y-1.5">
        <Label htmlFor="new-feed-name">{t('admin.rssFeeds.name')}</Label>
        <Input
          id="new-feed-name"
          placeholder={t('admin.rssFeeds.namePlaceholder')}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-feed-url">{t('admin.rssFeeds.url')}</Label>
        <Input
          id="new-feed-url"
          type="url"
          placeholder={t('admin.rssFeeds.urlPlaceholder')}
          aria-invalid={!!errors.url}
          {...register('url')}
        />
        {errors.url && (
          <p className="text-xs text-destructive">
            {t('admin.rssFeeds.invalidUrl')}
          </p>
        )}
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          <Plus className="mr-1.5 size-4" />
          {isSubmitting
            ? t('admin.rssFeeds.adding')
            : t('admin.rssFeeds.addFeed')}
        </Button>
      </div>
    </form>
  );
};

type TEditFeedDialogProps = {
  feed: TRssFeed | null;
  onClose: () => void;
  onSave: (patch: TFeedForm) => Promise<void>;
};

const EditFeedDialog = ({ feed, onClose, onSave }: TEditFeedDialogProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TFeedForm>({
    resolver: zodResolver(feedSchema),
    values: feed ? { name: feed.name, url: feed.url } : undefined,
  });

  const onSubmit = async (data: TFeedForm) => {
    await onSave(data);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={!!feed} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.rssFeeds.editFeed')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-feed-name">{t('admin.rssFeeds.name')}</Label>
            <Input
              id="edit-feed-name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-feed-url">{t('admin.rssFeeds.url')}</Label>
            <Input
              id="edit-feed-url"
              type="url"
              aria-invalid={!!errors.url}
              {...register('url')}
            />
            {errors.url && (
              <p className="text-xs text-destructive">
                {t('admin.rssFeeds.invalidUrl')}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('admin.rssFeeds.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('admin.rssFeeds.saving')
                : t('admin.rssFeeds.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
