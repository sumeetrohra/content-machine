import { useAuthIsInitializing, useAuthUser } from '@/shared/stores/auth.store';
import { LoginPage } from '@/pages/auth/LoginPage';

type TAuthGateProps = {
  children: React.ReactNode;
};

export const AuthGate = ({ children }: TAuthGateProps) => {
  const isInitializing = useAuthIsInitializing();
  const user = useAuthUser();

  if (isInitializing) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
