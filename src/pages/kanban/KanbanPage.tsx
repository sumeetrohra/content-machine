import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Rss } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

  const timeFilter = useKanbanTimeFilter();
  const searchQuery = useKanbanSearchQuery();
  const isEmbeddingSearch = useKanbanIsEmbeddingSearch();

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
        <div className="flex gap-2">
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
