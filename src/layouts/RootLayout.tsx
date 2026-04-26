import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/theme-toggle';
import { ErrorBoundary } from '@/components/error-boundary';

export const RootLayout = () => {
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 items-center justify-between">
            <Link to="/" className="font-semibold hover:opacity-80">
              {t('app.title')}
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto py-6">
          <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  );
};
