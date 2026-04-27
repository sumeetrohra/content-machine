import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { AuthGate } from '@/components/auth-gate';
import { Toaster } from '@/components/ui/sonner';
import { router } from '@/routes';

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <QueryProvider>
            <RouterProvider router={router} />
            <Toaster />
          </QueryProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
};
