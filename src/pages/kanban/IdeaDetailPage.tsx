import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
  X,
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
import { useScoreArticle, useSuggestFormats } from '@/hooks/use-pipeline';
import {
  useDeleteDraft,
  useDrafts,
  useGenerateDraft,
} from '@/hooks/use-drafts';
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
  const scoreArticle = useScoreArticle();
  const suggestFormats = useSuggestFormats();
  const generateDraft = useGenerateDraft();
  const deleteDraft = useDeleteDraft();
  const { data: drafts = [] } = useDrafts(id ?? '');

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

  const handleRescore = async () => {
    try {
      const res = await scoreArticle.mutateAsync(idea.id);
      toast.success(t('kanban.detail.scoreSuccess', { score: res.score }));
    } catch {
      toast.error(t('kanban.detail.scoreError'));
    }
  };

  const handleSuggestFormats = async () => {
    try {
      const res = await suggestFormats.mutateAsync(idea.id);
      toast.success(
        t('kanban.detail.formatsSuccess', { count: res.formats.length }),
      );
    } catch {
      toast.error(t('kanban.detail.formatsError'));
    }
  };

  const handleGenerateDraft = async (platform: string, format: string) => {
    try {
      await generateDraft.mutateAsync({
        articleId: idea.id,
        platform,
        format,
      });
      toast.success(t('kanban.detail.draftSuccess'));
    } catch {
      toast.error(t('kanban.detail.draftError'));
    }
  };

  const handleCopyDraft = async (body: string) => {
    await navigator.clipboard.writeText(body);
    toast.success(t('kanban.detail.copied'));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          {t('kanban.detail.addedAt')}: {formatDate(idea.createdAt)} (
          {formatRelative(idea.createdAt)})
        </span>
        {idea.author && (
          <span>
            {t('kanban.detail.author')}: {idea.author}
          </span>
        )}
        {idea.publishedAt && (
          <span>
            {t('kanban.detail.publishedAt')}: {formatDate(idea.publishedAt)}
          </span>
        )}
        {idea.sourceUrl && (
          <a
            href={idea.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground"
          >
            {t('kanban.detail.source')}
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
        {idea.viralityScore !== null && (
          <Badge variant="secondary" className="gap-1">
            {t('kanban.detail.viralityScore')}: {idea.viralityScore}/10
          </Badge>
        )}
        {idea.pipelineStatus && (
          <Badge variant="outline" className="text-xs">
            {idea.pipelineStatus}
          </Badge>
        )}
        {idea.dedupSimilarity !== null && idea.dedupAgainstId && (
          <Badge variant="outline" className="text-xs">
            {t('kanban.detail.dupOf', {
              sim: (idea.dedupSimilarity * 100).toFixed(0),
            })}
          </Badge>
        )}
        {idea.pipelineError && (
          <Badge variant="destructive" className="text-xs">
            {idea.pipelineError}
          </Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={handleRescore}
            disabled={scoreArticle.isPending}
          >
            {scoreArticle.isPending ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 size-3" />
            )}
            {t('kanban.detail.rescore')}
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={handleSuggestFormats}
            disabled={suggestFormats.isPending}
          >
            {suggestFormats.isPending ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1 size-3" />
            )}
            {t('kanban.detail.suggestFormats')}
          </Button>
        </div>
      </div>

      {idea.viralityReason && (
        <p className="rounded-lg bg-muted/30 p-3 text-sm italic text-muted-foreground">
          {idea.viralityReason}
        </p>
      )}

      <Separator />

      {idea.suggestedFormats && idea.suggestedFormats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t('kanban.detail.suggestedFormats')}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {idea.suggestedFormats.map((sf, idx) => (
              <div
                key={`${sf.platform}-${sf.format}-${idx}`}
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{sf.platform}</Badge>
                  <Badge variant="outline">{sf.format}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sf.why}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateDraft(sf.platform, sf.format)}
                  disabled={generateDraft.isPending}
                >
                  {generateDraft.isPending ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="mr-1.5 size-3.5" />
                  )}
                  {t('kanban.detail.generateDraft')}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('kanban.detail.drafts')}</h2>
          <div className="space-y-3">
            {drafts.map(draft => (
              <div key={draft.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{draft.platform}</Badge>
                    <Badge variant="outline">{draft.format}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(draft.createdAt)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleCopyDraft(draft.body)}
                      title={t('kanban.detail.copy')}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => deleteDraft.mutate(draft.id)}
                      className="text-destructive hover:text-destructive"
                      title={t('kanban.detail.deleteDraft')}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {draft.body}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          {t('kanban.detail.articleContent')}
        </h2>
        {idea.contentFormat === 'markdown' ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{idea.content}</ReactMarkdown>
          </div>
        ) : idea.contentFormat === 'html' ? (
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
