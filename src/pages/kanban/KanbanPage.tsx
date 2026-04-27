import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Plus, Play, Rss, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRunPipelineNow } from '@/hooks/use-pipeline';
import { KanbanBoard } from './components/KanbanBoard';
import { KanbanFilters } from './components/KanbanFilters';
import { AddIdeaDialog } from './components/AddIdeaDialog';
import { useContentIdeas } from '@/hooks/use-content-ideas';
import {
  useKanbanTimeFilter,
  useKanbanSearchQuery,
  useKanbanIsEmbeddingSearch,
} from '@/shared/stores/kanban.store';

export const KanbanPage = () => {
  const { t } = useTranslation();
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const runPipeline = useRunPipelineNow();

  const timeFilter = useKanbanTimeFilter();
  const searchQuery = useKanbanSearchQuery();
  const isEmbeddingSearch = useKanbanIsEmbeddingSearch();

  const handleRunPipeline = async () => {
    try {
      const res = await runPipeline.mutateAsync();
      toast.success(
        t('kanban.pipelineSuccess', {
          inserted: res.inserted,
          accepted: res.accepted,
          rejected: res.rejected,
        }),
      );
    } catch {
      toast.error(t('kanban.pipelineError'));
    }
  };

  const {
    data: ideas = [],
    isLoading,
    isError,
  } = useContentIdeas({
    timeFilter,
    searchQuery,
    isEmbeddingSearch,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('kanban.title')}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunPipeline}
            disabled={runPipeline.isPending}
          >
            {runPipeline.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Play className="mr-1.5 size-4" />
            )}
            {t('kanban.runPipeline')}
          </Button>
          <Link
            to="/admin/persona"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Sparkles className="mr-1.5 size-4" />
            {t('admin.persona.manage')}
          </Link>
          <Link
            to="/admin/rss-feeds"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Rss className="mr-1.5 size-4" />
            {t('admin.rssFeeds.manage')}
          </Link>
          <Button size="sm" onClick={() => setAddIdeaOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            {t('kanban.addIdea.button')}
          </Button>
        </div>
      </div>

      <KanbanFilters />

      {isLoading ? (
        <div className="flex gap-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="flex-1 space-y-2 rounded-lg border border-t-4 border-t-muted p-2"
            >
              <Skeleton className="h-6 w-24" />
              {[0, 1, 2].map(j => (
                <Skeleton key={j} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {t('kanban.loadError')}
        </div>
      ) : (
        <KanbanBoard ideas={ideas} />
      )}

      <AddIdeaDialog open={addIdeaOpen} onOpenChange={setAddIdeaOpen} />
    </div>
  );
};
