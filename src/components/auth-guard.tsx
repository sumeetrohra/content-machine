import type { ReactNode } from 'react';

import { useAuthIsLoading, useAuthUser } from '@/shared/stores/auth.store';
import { LoginPage } from '@/pages/auth/LoginPage';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const user = useAuthUser();
  const isLoading = useAuthIsLoading();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
