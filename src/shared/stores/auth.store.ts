import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

type TAuthState = {
  user: User | null;
  session: Session | null;
  isInitializing: boolean;
};

type TAuthActions = {
  setSession: (session: Session | null) => void;
  setInitialized: () => void;
};

type TAuthStore = TAuthState & TAuthActions;

const useAuthStoreBase = create<TAuthStore>(set => ({
  user: null,
  session: null,
  isInitializing: true,

  setSession: (session: Session | null) =>
    set({ session, user: session?.user ?? null }),

  setInitialized: () => set({ isInitializing: false }),
}));

export const useAuthUser = () => useAuthStoreBase(state => state.user);
export const useAuthSession = () => useAuthStoreBase(state => state.session);
export const useAuthIsInitializing = () =>
  useAuthStoreBase(state => state.isInitializing);
export const useAuthActions = () =>
  useAuthStoreBase(state => ({
    setSession: state.setSession,
    setInitialized: state.setInitialized,
  }));
