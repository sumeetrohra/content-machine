import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAppConfig,
  useSeedAppConfig,
  useUpdateAppConfig,
} from '@/hooks/use-app-config';
import type { TAppConfig } from '@/shared/types/content-idea.types';

export const PersonaPage = () => {
  const { t } = useTranslation();
  const { data: config, isLoading } = useAppConfig();
  const seedConfig = useSeedAppConfig();
  const updateConfig = useUpdateAppConfig();

  const [edits, setEdits] = useState<Partial<TAppConfig>>({});
  const draft: TAppConfig | null = config ? { ...config, ...edits } : null;
  const setDraft = (next: TAppConfig) => {
    setEdits({
      persona: next.persona,
      viralityRubric: next.viralityRubric,
      dedupThreshold: next.dedupThreshold,
      lookbackDays: next.lookbackDays,
      dailyAcceptedCap: next.dailyAcceptedCap,
    });
  };

  const handleSeed = async () => {
    try {
      await seedConfig.mutateAsync();
      setEdits({});
      toast.success(t('admin.persona.seedSuccess'));
    } catch {
      toast.error(t('admin.persona.seedError'));
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await updateConfig.mutateAsync({
        persona: draft.persona,
        viralityRubric: draft.viralityRubric,
        dedupThreshold: draft.dedupThreshold,
        lookbackDays: draft.lookbackDays,
        dailyAcceptedCap: draft.dailyAcceptedCap,
      });
      toast.success(t('admin.persona.saveSuccess'));
    } catch {
      toast.error(t('admin.persona.saveError'));
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t('kanban.detail.back')}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.persona.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('admin.persona.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !config && !draft ? (
        <div className="rounded-lg border bg-muted/20 p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            {t('admin.persona.notSeeded')}
          </p>
          <Button onClick={handleSeed} disabled={seedConfig.isPending}>
            {seedConfig.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 size-4" />
            )}
            {t('admin.persona.seedDefaults')}
          </Button>
        </div>
      ) : draft ? (
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="persona">{t('admin.persona.personaLabel')}</Label>
            <Textarea
              id="persona"
              rows={10}
              value={draft.persona}
              onChange={e => setDraft({ ...draft, persona: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rubric">{t('admin.persona.rubricLabel')}</Label>
            <Textarea
              id="rubric"
              rows={14}
              value={draft.viralityRubric}
              onChange={e =>
                setDraft({ ...draft, viralityRubric: e.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="dedupThreshold">
                {t('admin.persona.dedupThreshold')}
              </Label>
              <Input
                id="dedupThreshold"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={draft.dedupThreshold}
                onChange={e =>
                  setDraft({
                    ...draft,
                    dedupThreshold: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lookbackDays">
                {t('admin.persona.lookbackDays')}
              </Label>
              <Input
                id="lookbackDays"
                type="number"
                min="1"
                max="365"
                value={draft.lookbackDays}
                onChange={e =>
                  setDraft({ ...draft, lookbackDays: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dailyCap">{t('admin.persona.dailyCap')}</Label>
              <Input
                id="dailyCap"
                type="number"
                min="1"
                max="50"
                value={draft.dailyAcceptedCap}
                onChange={e =>
                  setDraft({
                    ...draft,
                    dailyAcceptedCap: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 size-4" />
              )}
              {t('admin.persona.save')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
