import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/modules/firebase';
import { useAuthActions } from '@/shared/stores/auth.store';

type TAuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: TAuthProviderProps) => {
  const { setUser, setInitialized } = useAuthActions();

  // eslint-disable-next-line no-restricted-syntax -- subscribing to Firebase imperative auth API; requires cleanup on unmount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setInitialized();
    });

    return unsubscribe;
  }, [setUser, setInitialized]);

  return <>{children}</>;
};
