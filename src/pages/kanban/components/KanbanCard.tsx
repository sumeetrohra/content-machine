import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Rss, FileText, FileCode, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/shared/utils/datetime-utils';
import type { TContentIdea } from '@/shared/types/content-idea.types';

const FORMAT_ICONS = {
  text: FileText,
  markdown: Hash,
  html: FileCode,
} as const;

type TKanbanCardProps = {
  idea: TContentIdea;
};

export const KanbanCard = ({ idea }: TKanbanCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const FormatIcon = FORMAT_ICONS[idea.content_format] ?? FileText;
  const displayTitle =
    idea.title ?? idea.content.slice(0, 80).replace(/\s+/g, ' ');

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the drag handle
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) return;
    navigate(`/idea/${idea.id}`);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              data-drag-handle
              className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
              onClick={e => e.stopPropagation()}
            >
              <GripVertical className="size-4" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug">
                {displayTitle}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {idea.source === 'rss' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Rss className="size-2.5" />
                    {t('kanban.card.rss')}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 text-xs">
                  <FormatIcon className="size-2.5" />
                  {t(`kanban.card.format.${idea.content_format}`)}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatRelative(idea.created_at)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
