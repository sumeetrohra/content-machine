import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { router } from '@/routes';

export const App = () => {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
};
