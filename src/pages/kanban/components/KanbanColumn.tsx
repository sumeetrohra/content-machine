import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanCard } from './KanbanCard';
import type {
  TContentIdea,
  EContentStatus,
} from '@/shared/types/content-idea.types';

const COLUMN_STYLES: Record<EContentStatus, string> = {
  idea: 'border-t-blue-500',
  accepted: 'border-t-green-500',
  rejected: 'border-t-red-400',
};

type TKanbanColumnProps = {
  status: EContentStatus;
  ideas: TContentIdea[];
};

export const KanbanColumn = ({ status, ideas }: TKanbanColumnProps) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        className={`rounded-lg border border-t-4 bg-muted/30 ${COLUMN_STYLES[status]} ${isOver ? 'bg-muted/60' : ''} transition-colors`}
      >
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <h2 className="text-sm font-semibold">
            {t(`kanban.columns.${status}`)}
          </h2>
          <Badge variant="secondary" className="text-xs">
            {ideas.length}
          </Badge>
        </div>

        <ScrollArea className="h-[calc(100vh-220px)]">
          <SortableContext
            items={ideas.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div ref={setNodeRef} className="flex min-h-24 flex-col gap-2 p-2">
              {ideas.map(idea => (
                <KanbanCard key={idea.id} idea={idea} />
              ))}
              {ideas.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {t('kanban.columns.empty')}
                </p>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
};
