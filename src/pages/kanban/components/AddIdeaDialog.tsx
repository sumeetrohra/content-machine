import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateContentIdea } from '@/hooks/use-content-ideas';
import type { EContentFormat } from '@/shared/types/content-idea.types';

function detectFormat(content: string): EContentFormat {
  if (/<\/?[a-z][\s\S]*>/i.test(content)) return 'html';
  if (/^#{1,6}\s|^\*\*|^__|\[.+\]\(/.test(content)) return 'markdown';
  return 'text';
}

const addIdeaSchema = z.object({
  content: z.string().min(1),
  title: z.string().optional(),
  contentFormat: z.enum(['text', 'markdown', 'html', 'auto']),
});

type TAddIdeaForm = z.infer<typeof addIdeaSchema>;

type TAddIdeaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddIdeaDialog = ({ open, onOpenChange }: TAddIdeaDialogProps) => {
  const { t } = useTranslation();
  const createIdea = useCreateContentIdea();
  const [serverError, setServerError] = useState<string | null>(null);

  const [contentPreview, setContentPreview] = useState('');
  const [formatValue, setFormatValue] =
    useState<TAddIdeaForm['contentFormat']>('auto');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TAddIdeaForm>({
    resolver: zodResolver(addIdeaSchema),
    defaultValues: { contentFormat: 'auto' },
  });

  const onSubmit = async (data: TAddIdeaForm) => {
    setServerError(null);
    try {
      const resolvedFormat: EContentFormat =
        data.contentFormat === 'auto'
          ? detectFormat(data.content)
          : data.contentFormat;

      await createIdea.mutateAsync({
        content: data.content,
        contentFormat: resolvedFormat,
        title: data.title || undefined,
      });

      reset();
      onOpenChange(false);
    } catch {
      setServerError(t('kanban.addIdea.error'));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      setServerError(null);
      setContentPreview('');
      setFormatValue('auto');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('kanban.addIdea.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="idea-title">{t('kanban.addIdea.titleLabel')}</Label>
            <Input
              id="idea-title"
              placeholder={t('kanban.addIdea.titlePlaceholder')}
              {...register('title')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="idea-content">
              {t('kanban.addIdea.contentLabel')}
            </Label>
            <Textarea
              id="idea-content"
              placeholder={t('kanban.addIdea.contentPlaceholder')}
              rows={8}
              aria-invalid={!!errors.content}
              {...register('content', {
                onChange: e =>
                  setContentPreview((e.target as HTMLTextAreaElement).value),
              })}
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {t('kanban.addIdea.contentRequired')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>{t('kanban.addIdea.formatLabel')}</Label>
              <Select
                value={formatValue}
                onValueChange={val => {
                  const f = val as TAddIdeaForm['contentFormat'];
                  setFormatValue(f);
                  setValue('contentFormat', f);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    {t('kanban.addIdea.formatAuto')}
                    {contentPreview
                      ? ` (→ ${detectFormat(contentPreview)})`
                      : ''}
                  </SelectItem>
                  <SelectItem value="text">
                    {t('kanban.addIdea.formatText')}
                  </SelectItem>
                  <SelectItem value="markdown">
                    {t('kanban.addIdea.formatMarkdown')}
                  </SelectItem>
                  <SelectItem value="html">
                    {t('kanban.addIdea.formatHtml')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('kanban.addIdea.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="mr-1.5 size-4" />
              {isSubmitting
                ? t('kanban.addIdea.submitting')
                : t('kanban.addIdea.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
