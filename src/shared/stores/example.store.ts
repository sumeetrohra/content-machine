import { create } from 'zustand';

type TExampleState = {
  count: number;
  name: string;
};

type TExampleActions = {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setName: (name: string) => void;
};

type TExampleStore = TExampleState & TExampleActions;

const useExampleStoreBase = create<TExampleStore>(set => ({
  // State
  count: 0,
  name: '',

  // Actions
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  setName: (name: string) => set({ name }),
}));

/**
 * Selector-based hooks for accessing specific slices of state.
 * This pattern prevents unnecessary re-renders by only subscribing
 * to the specific state slice a component needs.
 */
export const useExampleCount = () => useExampleStoreBase(state => state.count);

export const useExampleName = () => useExampleStoreBase(state => state.name);

export const useExampleActions = () =>
  useExampleStoreBase(state => ({
    increment: state.increment,
    decrement: state.decrement,
    reset: state.reset,
    setName: state.setName,
  }));
