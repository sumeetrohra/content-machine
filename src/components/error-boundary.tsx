import type { ReactElement, ReactNode } from 'react';
import { SentryErrorBoundary } from '@/modules/sentry';

type TErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactElement;
};

const DefaultFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      <button
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  </div>
);

export const ErrorBoundary = ({ children, fallback }: TErrorBoundaryProps) => {
  return (
    <SentryErrorBoundary fallback={fallback ?? <DefaultFallback />}>
      {children}
    </SentryErrorBoundary>
  );
};
