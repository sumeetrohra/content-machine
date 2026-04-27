import { create } from 'zustand';
import type { ETimeFilter } from '@/shared/types/content-idea.types';

type TKanbanState = {
  timeFilter: ETimeFilter;
  searchQuery: string;
  isEmbeddingSearch: boolean;
};

type TKanbanActions = {
  setTimeFilter: (filter: ETimeFilter) => void;
  setSearchQuery: (query: string) => void;
  toggleEmbeddingSearch: () => void;
};

type TKanbanStore = TKanbanState & TKanbanActions;

export const useKanbanStoreBase = create<TKanbanStore>(set => ({
  timeFilter: 'all',
  searchQuery: '',
  isEmbeddingSearch: false,

  setTimeFilter: timeFilter => set({ timeFilter }),
  setSearchQuery: searchQuery => set({ searchQuery }),
  toggleEmbeddingSearch: () =>
    set(state => ({ isEmbeddingSearch: !state.isEmbeddingSearch })),
}));

export const useKanbanTimeFilter = () =>
  useKanbanStoreBase(state => state.timeFilter);
export const useKanbanSearchQuery = () =>
  useKanbanStoreBase(state => state.searchQuery);
export const useKanbanIsEmbeddingSearch = () =>
  useKanbanStoreBase(state => state.isEmbeddingSearch);
export const useKanbanActions = () =>
  useKanbanStoreBase(state => ({
    setTimeFilter: state.setTimeFilter,
    setSearchQuery: state.setSearchQuery,
    toggleEmbeddingSearch: state.toggleEmbeddingSearch,
  }));
