import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthGuard } from '@/components/auth-guard';
import { router } from '@/routes';

export const App = () => {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthGuard>
          <RouterProvider
            router={router}
            fallbackElement={
              <div className="container mx-auto py-6 text-sm text-muted-foreground">
                Loading...
              </div>
            }
          />
        </AuthGuard>
      </QueryProvider>
    </ThemeProvider>
  );
};
