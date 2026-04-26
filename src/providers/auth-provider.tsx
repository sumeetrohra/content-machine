import { useEffect } from 'react';
import { supabase } from '@/modules/supabase';
import { useAuthActions } from '@/shared/stores/auth.store';

type TAuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: TAuthProviderProps) => {
  const { setSession, setInitialized } = useAuthActions();

  // eslint-disable-next-line no-restricted-syntax -- subscribing to Supabase imperative auth API; requires cleanup on unmount
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setInitialized();
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setSession, setInitialized]);

  return <>{children}</>;
};
