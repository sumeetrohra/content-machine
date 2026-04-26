import { useTranslation } from 'react-i18next';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  useKanbanTimeFilter,
  useKanbanSearchQuery,
  useKanbanIsEmbeddingSearch,
  useKanbanActions,
} from '@/shared/stores/kanban.store';
import type { ETimeFilter } from '@/shared/types/content-idea.types';

const TIME_FILTERS: ETimeFilter[] = ['week', 'month', 'year', 'all'];

export const KanbanFilters = () => {
  const { t } = useTranslation();
  const timeFilter = useKanbanTimeFilter();
  const searchQuery = useKanbanSearchQuery();
  const isEmbeddingSearch = useKanbanIsEmbeddingSearch();
  const { setTimeFilter, setSearchQuery, toggleEmbeddingSearch } =
    useKanbanActions();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex gap-1 rounded-lg border p-1">
        {TIME_FILTERS.map(filter => (
          <Button
            key={filter}
            variant={timeFilter === filter ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeFilter(filter)}
          >
            {t(`kanban.filters.${filter}`)}
          </Button>
        ))}
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('kanban.filters.searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="embedding-search"
          checked={isEmbeddingSearch}
          onCheckedChange={toggleEmbeddingSearch}
        />
        <Label
          htmlFor="embedding-search"
          className="flex cursor-pointer items-center gap-1.5 text-sm"
        >
          <Sparkles className="size-3.5" />
          {t('kanban.filters.embeddingSearch')}
        </Label>
      </div>
    </div>
  );
};
