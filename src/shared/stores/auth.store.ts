import { create } from 'zustand';
import type { User } from 'firebase/auth';

type TAuthState = {
  user: User | null;
  isInitializing: boolean;
};

type TAuthActions = {
  setUser: (user: User | null) => void;
  setInitialized: () => void;
};

type TAuthStore = TAuthState & TAuthActions;

export const useAuthStoreBase = create<TAuthStore>(set => ({
  user: null,
  isInitializing: true,

  setUser: (user: User | null) => set({ user }),

  setInitialized: () => set({ isInitializing: false }),
}));

export const useAuthUser = () => useAuthStoreBase(state => state.user);
export const useAuthIsInitializing = () =>
  useAuthStoreBase(state => state.isInitializing);
export const useAuthActions = () =>
  useAuthStoreBase(state => ({
    setUser: state.setUser,
    setInitialized: state.setInitialized,
  }));
