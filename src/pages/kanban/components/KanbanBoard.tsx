import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useUpdateIdeaStatus } from '@/hooks/use-content-ideas';
import type {
  TContentIdea,
  EContentStatus,
} from '@/shared/types/content-idea.types';

const STATUSES: EContentStatus[] = ['idea', 'accepted', 'rejected'];

type TKanbanBoardProps = {
  ideas: TContentIdea[];
};

export const KanbanBoard = ({ ideas }: TKanbanBoardProps) => {
  const updateStatus = useUpdateIdeaStatus();
  const [activeIdea, setActiveIdea] = useState<TContentIdea | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    const idea = ideas.find(i => i.id === active.id);
    setActiveIdea(idea ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveIdea(null);

    if (!over) return;

    const newStatus = over.id as EContentStatus;
    const draggedIdea = ideas.find(i => i.id === active.id);

    if (!draggedIdea || draggedIdea.status === newStatus) return;

    updateStatus.mutate({ id: draggedIdea.id, status: newStatus });
  };

  const byStatus = (status: EContentStatus) =>
    ideas.filter(i => i.status === status);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => (
          <KanbanColumn key={status} status={status} ideas={byStatus(status)} />
        ))}
      </div>

      <DragOverlay>
        {activeIdea ? <KanbanCard idea={activeIdea} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
