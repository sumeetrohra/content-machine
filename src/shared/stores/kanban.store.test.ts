import { beforeEach, describe, expect, it } from 'vitest';

import { useKanbanStoreBase } from './kanban.store';

beforeEach(() => {
  useKanbanStoreBase.setState({
    timeFilter: 'all',
    searchQuery: '',
    isEmbeddingSearch: false,
  });
});

describe('kanban.store — initial state', () => {
  it('defaults timeFilter=all, empty search, embedding off', () => {
    const s = useKanbanStoreBase.getState();
    expect(s.timeFilter).toBe('all');
    expect(s.searchQuery).toBe('');
    expect(s.isEmbeddingSearch).toBe(false);
  });
});

describe('kanban.store — setTimeFilter', () => {
  it('cycles through every supported filter', () => {
    const filters = ['week', 'month', 'year', 'all'] as const;
    for (const f of filters) {
      useKanbanStoreBase.getState().setTimeFilter(f);
      expect(useKanbanStoreBase.getState().timeFilter).toBe(f);
    }
  });

  it('does not affect searchQuery or isEmbeddingSearch', () => {
    useKanbanStoreBase.setState({
      searchQuery: 'foo',
      isEmbeddingSearch: true,
    });
    useKanbanStoreBase.getState().setTimeFilter('week');
    const s = useKanbanStoreBase.getState();
    expect(s.searchQuery).toBe('foo');
    expect(s.isEmbeddingSearch).toBe(true);
  });
});

describe('kanban.store — setSearchQuery', () => {
  it('stores the query verbatim', () => {
    useKanbanStoreBase.getState().setSearchQuery('hello world');
    expect(useKanbanStoreBase.getState().searchQuery).toBe('hello world');
  });

  it('preserves leading/trailing whitespace', () => {
    useKanbanStoreBase.getState().setSearchQuery('  spaced  ');
    expect(useKanbanStoreBase.getState().searchQuery).toBe('  spaced  ');
  });

  it('handles regex- and quote-special characters without escaping', () => {
    const tricky = '"hello" .*+? \\n';
    useKanbanStoreBase.getState().setSearchQuery(tricky);
    expect(useKanbanStoreBase.getState().searchQuery).toBe(tricky);
  });

  it('clears the query when set to empty string', () => {
    useKanbanStoreBase.getState().setSearchQuery('something');
    useKanbanStoreBase.getState().setSearchQuery('');
    expect(useKanbanStoreBase.getState().searchQuery).toBe('');
  });
});

describe('kanban.store — toggleEmbeddingSearch', () => {
  it('flips false → true', () => {
    useKanbanStoreBase.getState().toggleEmbeddingSearch();
    expect(useKanbanStoreBase.getState().isEmbeddingSearch).toBe(true);
  });

  it('flips true → false', () => {
    useKanbanStoreBase.setState({ isEmbeddingSearch: true });
    useKanbanStoreBase.getState().toggleEmbeddingSearch();
    expect(useKanbanStoreBase.getState().isEmbeddingSearch).toBe(false);
  });

  it('returns to original after two toggles', () => {
    useKanbanStoreBase.getState().toggleEmbeddingSearch();
    useKanbanStoreBase.getState().toggleEmbeddingSearch();
    expect(useKanbanStoreBase.getState().isEmbeddingSearch).toBe(false);
  });

  it('does not affect timeFilter or searchQuery', () => {
    useKanbanStoreBase.setState({ timeFilter: 'month', searchQuery: 'q' });
    useKanbanStoreBase.getState().toggleEmbeddingSearch();
    const s = useKanbanStoreBase.getState();
    expect(s.timeFilter).toBe('month');
    expect(s.searchQuery).toBe('q');
  });
});
