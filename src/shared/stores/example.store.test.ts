import { beforeEach, describe, expect, it } from 'vitest';

import { useExampleStoreBase } from './example.store';

beforeEach(() => {
  useExampleStoreBase.setState({ count: 0, name: '' });
});

describe('example.store — initial state', () => {
  it('starts with count=0 and name=""', () => {
    const s = useExampleStoreBase.getState();
    expect(s.count).toBe(0);
    expect(s.name).toBe('');
  });
});

describe('example.store — counter actions', () => {
  it('increment adds 1 to count', () => {
    useExampleStoreBase.getState().increment();
    expect(useExampleStoreBase.getState().count).toBe(1);
  });

  it('decrement subtracts 1 from count', () => {
    useExampleStoreBase.getState().decrement();
    expect(useExampleStoreBase.getState().count).toBe(-1);
  });

  it('multiple increments accumulate', () => {
    const actions = useExampleStoreBase.getState();
    actions.increment();
    actions.increment();
    actions.increment();
    expect(useExampleStoreBase.getState().count).toBe(3);
  });

  it('reset zeroes a non-zero count', () => {
    useExampleStoreBase.setState({ count: 42 });
    useExampleStoreBase.getState().reset();
    expect(useExampleStoreBase.getState().count).toBe(0);
  });

  it('reset does not clear the name field', () => {
    useExampleStoreBase.setState({ count: 5, name: 'Alice' });
    useExampleStoreBase.getState().reset();
    expect(useExampleStoreBase.getState().name).toBe('Alice');
  });
});

describe('example.store — setName', () => {
  it('stores a name verbatim', () => {
    useExampleStoreBase.getState().setName('Alice');
    expect(useExampleStoreBase.getState().name).toBe('Alice');
  });

  it('replaces a previously set name', () => {
    useExampleStoreBase.getState().setName('Alice');
    useExampleStoreBase.getState().setName('Bob');
    expect(useExampleStoreBase.getState().name).toBe('Bob');
  });

  it('does not change count', () => {
    useExampleStoreBase.setState({ count: 7 });
    useExampleStoreBase.getState().setName('Alice');
    expect(useExampleStoreBase.getState().count).toBe(7);
  });
});
