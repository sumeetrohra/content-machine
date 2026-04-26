import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { AuthGate } from '@/components/auth-gate';
import { router } from '@/routes';

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <QueryProvider>
            <RouterProvider
              router={router}
              fallbackElement={
                <div className="container mx-auto py-6 text-sm text-muted-foreground">
                  Loading...
                </div>
              }
            />
          </QueryProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
};
