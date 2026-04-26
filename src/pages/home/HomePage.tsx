import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('home.title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('home.subtitle')}
        </p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t('app.title')}</CardTitle>
          <CardDescription>{t('app.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('home.description')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
