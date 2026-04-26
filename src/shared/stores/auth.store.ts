import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type TAuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

type TAuthActions = {
  signOut: () => Promise<void>;
};

type TAuthStore = TAuthState & TAuthActions;

const useAuthStoreBase = create<TAuthStore>(set => {
  // onAuthStateChange fires INITIAL_SESSION on load, then any subsequent changes.
  // This is the single source of truth for auth state.
  supabase.auth.onAuthStateChange((_event, session) => {
    set({ user: session?.user ?? null, session, isLoading: false });
  });

  return {
    user: null,
    session: null,
    isLoading: true,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
});

export const useAuthUser = () => useAuthStoreBase(state => state.user);

export const useAuthIsLoading = () =>
  useAuthStoreBase(state => state.isLoading);

export const useAuthActions = () =>
  useAuthStoreBase(state => ({
    signOut: state.signOut,
  }));
