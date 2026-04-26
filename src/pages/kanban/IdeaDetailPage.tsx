import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Trash2,
  ExternalLink,
  Loader2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  useContentIdea,
  useUpdateIdeaStatus,
  useUpdateContentIdea,
  useDeleteContentIdea,
} from '@/hooks/use-content-ideas';
import { formatDate, formatRelative } from '@/shared/utils/datetime-utils';
import type { EContentStatus } from '@/shared/types/content-idea.types';

function stripScriptTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}

const STATUS_VARIANT: Record<
  EContentStatus,
  'default' | 'secondary' | 'destructive'
> = {
  idea: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};

export const IdeaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: idea, isLoading, isError } = useContentIdea(id ?? '');
  const updateStatus = useUpdateIdeaStatus();
  const updateIdea = useUpdateContentIdea();
  const deleteIdea = useDeleteContentIdea();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !idea) {
    return (
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1.5 size-4" />
          {t('kanban.detail.back')}
        </Button>
        <p className="mt-8 text-center text-muted-foreground">
          {t('kanban.detail.notFound')}
        </p>
      </div>
    );
  }

  const handleStatusChange = (status: EContentStatus) => {
    updateStatus.mutate({ id: idea.id, status });
  };

  const handleDelete = async () => {
    await deleteIdea.mutateAsync(idea.id);
    navigate('/');
  };

  const startEditTitle = () => {
    setTitleDraft(idea.title ?? '');
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    updateIdea.mutate({
      id: idea.id,
      updates: { title: titleDraft || undefined },
    });
    setIsEditingTitle(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1.5 size-4" />
          {t('kanban.detail.back')}
        </Button>
        <div className="flex gap-2">
          {idea.status !== 'idea' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('idea')}
              disabled={updateStatus.isPending}
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              {t('kanban.detail.moveToIdeas')}
            </Button>
          )}
          {idea.status !== 'accepted' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('accepted')}
              disabled={updateStatus.isPending}
            >
              <Check className="mr-1.5 size-3.5" />
              {t('kanban.detail.accept')}
            </Button>
          )}
          {idea.status !== 'rejected' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleStatusChange('rejected')}
              disabled={updateStatus.isPending}
            >
              <X className="mr-1.5 size-3.5" />
              {t('kanban.detail.reject')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={deleteIdea.isPending}
            className="text-destructive hover:text-destructive"
          >
            {deleteIdea.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Title + status */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          {isEditingTitle ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="text-2xl font-bold"
              />
              <Button size="sm" onClick={saveTitle}>
                <Check className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingTitle(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              className="group flex flex-1 items-start gap-2 text-left"
              onClick={startEditTitle}
            >
              <h1 className="text-2xl font-bold leading-tight">
                {idea.title ?? idea.content.slice(0, 100)}
              </h1>
              <Pencil className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <Badge
            variant={STATUS_VARIANT[idea.status]}
            className="mt-1 shrink-0"
          >
            {t(`kanban.columns.${idea.status}`)}
          </Badge>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          {t('kanban.detail.addedAt')}: {formatDate(idea.created_at)} (
          {formatRelative(idea.created_at)})
        </span>
        {idea.author && (
          <span>
            {t('kanban.detail.author')}: {idea.author}
          </span>
        )}
        {idea.published_at && (
          <span>
            {t('kanban.detail.publishedAt')}: {formatDate(idea.published_at)}
          </span>
        )}
        {idea.source_url && (
          <a
            href={idea.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground"
          >
            {t('kanban.detail.source')}
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      <Separator />

      {/* Content */}
      <div>
        {idea.content_format === 'markdown' ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{idea.content}</ReactMarkdown>
          </div>
        ) : idea.content_format === 'html' ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: stripScriptTags(idea.content) }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {idea.content}
          </pre>
        )}
      </div>
    </div>
  );
};
